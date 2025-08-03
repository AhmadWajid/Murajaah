/**
 * Storage Service - Unified interface for localStorage and Supabase
 * This service provides a seamless transition from localStorage to Supabase
 * It automatically handles authentication state and falls back to localStorage when needed
 */

import { MemorizationItem } from './spacedRepetition';
import { MistakeData, DailyReviewData } from './supabase/database';
import { supabase } from './supabase/client';

// Import localStorage functions (keep as fallback)
import * as localStorageService from './storage';

// Import database functions
import * as databaseService from './supabase/database';

// =============================================
// CACHE MANAGEMENT
// =============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    return this.cache.has(key) && !this.isExpired(key);
  }

  private isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > entry.ttl;
  }
}

const cache = new Cache();

// =============================================
// AUTHENTICATION STATE HELPERS
// =============================================

async function isAuthenticated(): Promise<boolean> {
  try {
    if (!supabase) return false;
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

async function withFallback<T>(
  databaseFn: () => Promise<T>,
  localStorageFn: () => T,
  defaultValue?: T
): Promise<T> {
  try {
    if (await isAuthenticated()) {
      return await databaseFn();
    } else {
      return localStorageFn();
    }
  } catch (error) {
    console.warn('Database operation failed, falling back to localStorage:', error);
    try {
      return localStorageFn();
    } catch (localError) {
      console.error('Both database and localStorage failed:', localError);
      if (defaultValue !== undefined) return defaultValue;
      throw localError;
    }
  }
}

// =============================================
// MEMORIZATION ITEMS
// =============================================

export async function addMemorizationItem(item: MemorizationItem): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.addMemorizationItem(item);
  } else {
    localStorageService.addMemorizationItem(item);
  }
  // Invalidate cache
  cache.invalidate('memorization');
}

export async function updateMemorizationItem(item: MemorizationItem): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.updateMemorizationItem(item);
  } else {
    localStorageService.updateMemorizationItem(item);
  }
  // Invalidate cache
  cache.invalidate('memorization');
}

export async function updateMemorizationItemWithIndividualRating(
  itemId: string,
  ayahNumber: number,
  rating: 'easy' | 'medium' | 'hard'
): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.updateMemorizationItemWithIndividualRating(itemId, ayahNumber, rating);
  } else {
    localStorageService.updateMemorizationItemWithIndividualRating(itemId, ayahNumber, rating);
  }
  // Invalidate cache
  cache.invalidate('memorization');
}

export async function removeMemorizationItem(id: string): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.removeMemorizationItem(id);
  } else {
    localStorageService.removeMemorizationItem(id);
  }
  // Invalidate cache
  cache.invalidate('memorization');
}

export async function getAllMemorizationItems(): Promise<MemorizationItem[]> {
  const cacheKey = 'memorization_items';
  const cached = cache.get<MemorizationItem[]>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await withFallback(
    () => databaseService.getAllMemorizationItems(),
    () => localStorageService.getAllMemorizationItems(),
    []
  );

  // Cache for 2 minutes
  cache.set(cacheKey, result, 2 * 60 * 1000);
  return result;
}

export async function getMemorizationItem(id: string): Promise<MemorizationItem | null> {
  const cacheKey = `memorization_item_${id}`;
  const cached = cache.get<MemorizationItem>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await withFallback(
    () => databaseService.getMemorizationItem(id),
    () => localStorageService.getMemorizationItem(id),
    null
  );

  if (result) {
    cache.set(cacheKey, result, 2 * 60 * 1000);
  }
  return result;
}

export async function clearAllData(): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.clearAllMemorizationData();
  } else {
    localStorageService.clearAllData();
  }
  cache.invalidate();
}

export async function exportData(): Promise<string> {
  return withFallback(
    () => databaseService.exportData(),
    () => localStorageService.exportData(),
    '{}'
  );
}

export async function importData(jsonData: string): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.importData(jsonData);
  } else {
    localStorageService.importData(jsonData);
  }
  cache.invalidate();
}

export function cleanupDuplicateItems(): void {
  localStorageService.cleanupDuplicateItems();
}

export function migrateDateFormats(): void {
  localStorageService.migrateDateFormats();
}

// =============================================
// MISTAKES
// =============================================

export async function getMistakes(): Promise<Record<string, MistakeData | boolean>> {
  const cacheKey = 'mistakes';
  const cached = cache.get<Record<string, MistakeData | boolean>>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await withFallback(
    () => databaseService.getMistakes(),
    () => localStorageService.getMistakes(),
    {}
  );

  cache.set(cacheKey, result, 2 * 60 * 1000);
  return result;
}

export async function saveMistakes(mistakes: Record<string, MistakeData | boolean>): Promise<void> {
  if (await isAuthenticated()) {
    // Convert format for database
    const dbMistakes: Record<string, MistakeData> = {};
    Object.entries(mistakes).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'timestamp' in value) {
        dbMistakes[key] = value as MistakeData;
      } else if (typeof value === 'boolean' && value === true) {
        const [surah, ayah] = key.split(':').map(Number);
        dbMistakes[key] = {
          timestamp: new Date().toISOString(),
          surah,
          ayah
        };
      }
    });
    await databaseService.saveMistakes(dbMistakes);
  } else {
    localStorageService.saveMistakes(mistakes);
  }
  cache.invalidate('mistakes');
}

export async function toggleMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData | boolean>> {
  const result = await withFallback(
    () => databaseService.toggleMistake(surahNumber, ayahNumber),
    () => localStorageService.toggleMistake(surahNumber, ayahNumber),
    {}
  );
  // Invalidate all mistake-related caches to ensure consistency
  cache.invalidate('mistakes');
  cache.invalidate('mistakesList');
  cache.invalidate('mistakesInVerseOrder');
  return result;
}

export async function showMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData | boolean>> {
  const result = await withFallback(
    () => databaseService.showMistake(surahNumber, ayahNumber),
    () => localStorageService.showMistake(surahNumber, ayahNumber),
    {}
  );
  // Invalidate all mistake-related caches to ensure consistency
  cache.invalidate('mistakes');
  cache.invalidate('mistakesList');
  cache.invalidate('mistakesInVerseOrder');
  return result;
}

export async function removeMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData | boolean>> {
  const result = await withFallback(
    () => databaseService.removeMistake(surahNumber, ayahNumber),
    () => localStorageService.removeMistake(surahNumber, ayahNumber),
    {}
  );
  // Invalidate all mistake-related caches to ensure consistency
  cache.invalidate('mistakes');
  cache.invalidate('mistakesList');
  cache.invalidate('mistakesInVerseOrder');
  return result;
}

export async function clearAllMistakes(): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.clearAllMistakes();
  } else {
    localStorageService.clearAllMistakes();
  }
  cache.invalidate('mistakes');
}

export async function getMistakesList(): Promise<MistakeData[]> {
  const cacheKey = 'mistakes_list';
  const cached = cache.get<MistakeData[]>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await withFallback(
    () => databaseService.getMistakesList(),
    () => localStorageService.getMistakesList(),
    []
  );

  cache.set(cacheKey, result, 2 * 60 * 1000);
  return result;
}

export async function getMistakesInVerseOrder(): Promise<MistakeData[]> {
  const cacheKey = 'mistakes_verse_order';
  const cached = cache.get<MistakeData[]>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await withFallback(
    () => databaseService.getMistakesInVerseOrder(),
    () => localStorageService.getMistakesInVerseOrder(),
    []
  );

  cache.set(cacheKey, result, 2 * 60 * 1000);
  return result;
}

export async function getNextMistakeInVerseOrder(
  currentSurah: number, 
  currentAyah: number, 
  pageAyahs?: Array<{ surah?: { number: number }; numberInSurah: number }>
): Promise<MistakeData | null> {
  return withFallback(
    () => databaseService.getNextMistakeInVerseOrder(currentSurah, currentAyah, pageAyahs),
    () => localStorageService.getNextMistakeInVerseOrder(currentSurah, currentAyah, pageAyahs),
    null
  );
}

// =============================================
// SETTINGS
// =============================================

export async function saveSelectedReciter(reciter: string): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.saveSelectedReciter(reciter);
  } else {
    localStorageService.saveSelectedReciter(reciter);
  }
  cache.invalidate('settings');
}

export async function loadSelectedReciter(): Promise<string> {
  const cacheKey = 'selected_reciter';
  const cached = cache.get<string>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await withFallback(
    () => databaseService.loadSelectedReciter(),
    () => localStorageService.loadSelectedReciter(),
    'mishary_rashid_alafasy'
  );

  cache.set(cacheKey, result, 5 * 60 * 1000);
  return result;
}

export async function saveHideMistakesSetting(hideMistakes: boolean): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.saveHideMistakesSetting(hideMistakes);
  } else {
    localStorageService.saveHideMistakesSetting(hideMistakes);
  }
  cache.invalidate('settings');
}

export async function getHideMistakesSetting(): Promise<boolean> {
  const cacheKey = 'hide_mistakes_setting';
  const cached = cache.get<boolean>(cacheKey);
  
  if (cached !== null) {
    return cached;
  }

  const result = await withFallback(
    () => databaseService.getHideMistakesSetting(),
    () => localStorageService.getHideMistakesSetting(),
    false
  );

  cache.set(cacheKey, result, 5 * 60 * 1000);
  return result;
}

export async function saveLastPage(page: number): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.saveLastPage(page);
  } else {
    localStorageService.saveLastPage(page);
  }
  cache.invalidate('settings');
}

export async function loadLastPage(): Promise<number> {
  const cacheKey = 'last_page';
  const cached = cache.get<number>(cacheKey);
  
  if (cached !== null) {
    return cached;
  }

  const result = await withFallback(
    () => databaseService.loadLastPage(),
    () => localStorageService.loadLastPage(),
    1
  );

  cache.set(cacheKey, result, 5 * 60 * 1000);
  return result;
}

export async function saveFontSettings(settings: {
  arabicFontSize: number;
  translationFontSize: number;
  fontTargetArabic: boolean;
  fontSize: number;
  padding: number;
  layoutMode: 'spread' | 'single';
  selectedLanguage?: string;
  selectedTranslation?: string;
  enableTajweed?: boolean;
}): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.saveFontSettings(settings);
  } else {
    localStorageService.saveFontSettings(settings);
  }
  cache.invalidate('settings');
}

export async function loadFontSettings() {
  const cacheKey = 'font_settings';
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await withFallback(
    () => databaseService.loadFontSettings(),
    () => localStorageService.loadFontSettings(),
    {
      arabicFontSize: 24,
      translationFontSize: 16,
      fontTargetArabic: false,
      fontSize: 20,
      padding: 20,
      layoutMode: 'spread' as const,
      selectedLanguage: 'en',
      selectedTranslation: 'en.sahih',
      enableTajweed: false,
    }
  );

  cache.set(cacheKey, result, 5 * 60 * 1000);
  return result;
}

// =============================================
// DATA ANALYTICS
// =============================================

export async function getDailyReviewData(days: number = 30): Promise<DailyReviewData[]> {
  const cacheKey = `daily_review_data_${days}`;
  const cached = cache.get<DailyReviewData[]>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await withFallback(
    () => databaseService.getDailyReviewData(days),
    () => localStorageService.getDailyReviewData(days),
    []
  );

  cache.set(cacheKey, result, 5 * 60 * 1000);
  return result;
}

// =============================================
// BATCH OPERATIONS
// =============================================

export async function batchUpdateMemorizationItems(items: MemorizationItem[]): Promise<void> {
  if (await isAuthenticated()) {
    // For Supabase, we'll update items in parallel
    await Promise.all(items.map(item => databaseService.updateMemorizationItem(item)));
  } else {
    // For localStorage, update sequentially
    items.forEach(item => localStorageService.updateMemorizationItem(item));
  }
  cache.invalidate('memorization');
}

export async function batchAddMemorizationItems(items: MemorizationItem[]): Promise<void> {
  if (await isAuthenticated()) {
    // For Supabase, we'll add items in parallel
    await Promise.all(items.map(item => databaseService.addMemorizationItem(item)));
  } else {
    // For localStorage, add sequentially
    items.forEach(item => localStorageService.addMemorizationItem(item));
  }
  cache.invalidate('memorization');
}

// =============================================
// CACHE MANAGEMENT EXPORTS
// =============================================

export function invalidateCache(pattern?: string): void {
  cache.invalidate(pattern);
}

export function clearCache(): void {
  cache.invalidate();
}

// =============================================
// MIGRATION FUNCTIONALITY
// =============================================

export async function migrateToDatabase(): Promise<void> {
  try {
    await databaseService.migrateLocalStorageData();
    console.log('Successfully migrated data to database');
  } catch (error) {
    console.error('Failed to migrate data to database:', error);
    throw error;
  }
}

// =============================================
// AUDIO & UI SETTINGS (New functions for database compatibility)
// =============================================

export async function saveAudioSettings(settings: {
  loopMode?: string;
  customLoop?: any;
  playbackSpeed?: number;
}): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.saveAudioSettings(settings);
  } else {
    // For localStorage, save each setting individually
    if (settings.loopMode !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('mquran_audio_loop_mode', settings.loopMode);
    }
    if (settings.customLoop !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('mquran_audio_custom_loop', JSON.stringify(settings.customLoop));
    }
    if (settings.playbackSpeed !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('mquran_audio_playback_speed', String(settings.playbackSpeed));
    }
  }
}

export async function loadAudioSettings() {
  return withFallback(
    () => databaseService.loadAudioSettings(),
    () => {
      if (typeof window === 'undefined') return { loopMode: 'none', customLoop: {}, playbackSpeed: 1.0 };
      
      const loopMode = localStorage.getItem('mquran_audio_loop_mode') || 'none';
      const customLoopStr = localStorage.getItem('mquran_audio_custom_loop');
      const customLoop = customLoopStr ? JSON.parse(customLoopStr) : {};
      const playbackSpeed = parseFloat(localStorage.getItem('mquran_audio_playback_speed') || '1');
      
      return { loopMode, customLoop, playbackSpeed };
    },
    { loopMode: 'none', customLoop: {}, playbackSpeed: 1.0 }
  );
}

export async function saveUISettings(settings: {
  showWordByWordTooltip?: boolean;
  mobileHeaderHidden?: boolean;
  userTimeZone?: string;
}): Promise<void> {
  if (await isAuthenticated()) {
    await databaseService.saveUISettings(settings);
  } else {
    // For localStorage, save each setting individually
    if (settings.showWordByWordTooltip !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('showWordByWordTooltip', settings.showWordByWordTooltip ? 'true' : 'false');
    }
    if (settings.mobileHeaderHidden !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('mobileHeaderHidden', settings.mobileHeaderHidden.toString());
    }
    if (settings.userTimeZone !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('userTimeZone', settings.userTimeZone);
    }
  }
}

export async function loadUISettings() {
  return withFallback(
    () => databaseService.loadUISettings(),
    () => {
      if (typeof window === 'undefined') return { showWordByWordTooltip: false, mobileHeaderHidden: false, userTimeZone: null };
      
      const showWordByWordTooltip = localStorage.getItem('showWordByWordTooltip') === 'true';
      const mobileHeaderHidden = localStorage.getItem('mobileHeaderHidden') === 'true';
      const userTimeZone = localStorage.getItem('userTimeZone');
      
      return { showWordByWordTooltip, mobileHeaderHidden, userTimeZone };
    },
    { showWordByWordTooltip: false, mobileHeaderHidden: false, userTimeZone: null }
  );
}