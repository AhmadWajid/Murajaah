/**
 * Storage Service - Unified interface for localStorage and Neon database
 * Uses API routes for database operations when authenticated.
 * Falls back to localStorage when not authenticated.
 */

import { MemorizationItem } from './spacedRepetition';

// Import localStorage functions (fallback)
import * as localStorageService from './storage';

export interface MistakeData {
  timestamp: string;
  surah: number;
  ayah: number;
}

export interface DailyReviewData {
  date: string;
  reviews: number;
  newItems: number;
  completedItems: number;
}

// =============================================
// AUTHENTICATION STATE
// =============================================

let cachedUser: { userId: string; email: string } | null | undefined;

export async function isAuthenticated(): Promise<boolean> {
  if (cachedUser === undefined) {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      cachedUser = data.user || null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser !== null;
}

export function getCurrentUser() {
  return cachedUser;
}

export function clearAuthCache() {
  cachedUser = undefined;
}

// =============================================
// CACHE MANAGEMENT (no-op stubs for backward compat)
// =============================================

export function invalidateCache(_pattern?: string): void {
  // No-op — the old Supabase layer had an in-memory cache.
  // The new API-based approach fetches fresh data each time.
}

export function clearCache(): void {
  // No-op
}

async function withFallback<T>(
  apiFn: () => Promise<T>,
  localStorageFn: () => T,
  defaultValue?: T
): Promise<T> {
  try {
    if (await isAuthenticated()) {
      return await apiFn();
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
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'addItem', item }),
    });
    // Keep localStorage in sync so compareLocalAndDb doesn't show a mismatch
    localStorageService.addMemorizationItem(item);
  } else {
    localStorageService.addMemorizationItem(item);
  }
}

export async function updateMemorizationItem(item: MemorizationItem): Promise<void> {
  if (await isAuthenticated()) {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'updateItem', item }),
    });
    // Keep localStorage in sync
    localStorageService.updateMemorizationItem(item);
  } else {
    localStorageService.updateMemorizationItem(item);
  }
}

export async function updateMemorizationItemWithIndividualRating(
  itemId: string,
  ayahNumber: number,
  rating: 'easy' | 'medium' | 'hard'
): Promise<void> {
  if (await isAuthenticated()) {
    // Fetch the item, update it, and save back
    const res = await fetch(`/api/data?type=items&id=${encodeURIComponent(itemId)}`);
    const data = await res.json();
    if (!data.item) throw new Error('Item not found');

    const { updateIndividualAyahRating } = await import('./spacedRepetition');
    const result = updateIndividualAyahRating(data.item, ayahNumber, rating);

    if (result.shouldSplit && result.newItems) {
      // Remove original and add splits
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'removeItem', id: itemId }),
      });
      localStorageService.removeMemorizationItem(itemId);
      for (const newItem of result.newItems) {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'addItem', item: newItem }),
        });
        localStorageService.addMemorizationItem(newItem);
      }
    } else {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'updateItem', item: result.updatedItem }),
      });
      localStorageService.updateMemorizationItem(result.updatedItem);
    }
  } else {
    localStorageService.updateMemorizationItemWithIndividualRating(itemId, ayahNumber, rating);
  }
}

export async function removeMemorizationItem(id: string): Promise<void> {
  if (await isAuthenticated()) {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'removeItem', id }),
    });
    localStorageService.removeMemorizationItem(id);
  } else {
    localStorageService.removeMemorizationItem(id);
  }
}

export async function getAllMemorizationItems(): Promise<MemorizationItem[]> {
  return withFallback(
    async () => {
      const res = await fetch('/api/data?type=items');
      const data = await res.json();
      return data.items || [];
    },
    () => localStorageService.getAllMemorizationItems(),
    []
  );
}

export async function getMemorizationItem(id: string): Promise<MemorizationItem | null> {
  return withFallback(
    async () => {
      const res = await fetch(`/api/data?type=items&id=${encodeURIComponent(id)}`);
      const data = await res.json();
      return data.item || null;
    },
    () => localStorageService.getMemorizationItem(id),
    null
  );
}

export async function clearAllData(): Promise<void> {
  if (await isAuthenticated()) {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'clearAllItems' }),
    });
    localStorageService.clearAllData();
  } else {
    localStorageService.clearAllData();
  }
}

export async function exportData(): Promise<string> {
  const items = await getAllMemorizationItems();
  return JSON.stringify({ items, lastSync: new Date().toISOString(), version: '1' }, null, 2);
}

export async function importData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);
  if (data.items && Array.isArray(data.items)) {
    for (const item of data.items) {
      await addMemorizationItem(item);
    }
  }
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
  return withFallback(
    async () => {
      const res = await fetch('/api/data?type=mistakes');
      const data = await res.json();
      return data.mistakes || {};
    },
    () => localStorageService.getMistakes(),
    {}
  );
}

export async function saveMistakes(mistakes: Record<string, MistakeData | boolean>): Promise<void> {
  if (await isAuthenticated()) {
    const dbMistakes: Record<string, MistakeData> = {};
    Object.entries(mistakes).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'timestamp' in value) {
        dbMistakes[key] = value as MistakeData;
      } else if (typeof value === 'boolean' && value === true) {
        const [surah, ayah] = key.split(':').map(Number);
        dbMistakes[key] = { timestamp: new Date().toISOString(), surah, ayah };
      }
    });
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'saveMistakes', mistakes: dbMistakes }),
    });
    // Keep localStorage in sync
    localStorageService.saveMistakes(mistakes);
  } else {
    localStorageService.saveMistakes(mistakes);
  }
}

export async function toggleMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData | boolean>> {
  if (await isAuthenticated()) {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'toggleMistake', surah: surahNumber, ayah: ayahNumber }),
    });
    const data = await res.json();
    const mistakes = data.mistakes || {};
    // Keep localStorage in sync
    localStorageService.saveMistakes(mistakes);
    return mistakes;
  }
  return localStorageService.toggleMistake(surahNumber, ayahNumber);
}

export async function showMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData | boolean>> {
  if (await isAuthenticated()) {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'toggleMistake', surah: surahNumber, ayah: ayahNumber }),
    });
    const data = await res.json();
    const mistakes = data.mistakes || {};
    localStorageService.saveMistakes(mistakes);
    return mistakes;
  }
  return localStorageService.showMistake(surahNumber, ayahNumber);
}

export async function removeMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData | boolean>> {
  if (await isAuthenticated()) {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'removeMistake', surah: surahNumber, ayah: ayahNumber }),
    });
    const data = await res.json();
    const mistakes = data.mistakes || {};
    localStorageService.saveMistakes(mistakes);
    return mistakes;
  }
  return localStorageService.removeMistake(surahNumber, ayahNumber);
}

export async function clearAllMistakes(): Promise<void> {
  if (await isAuthenticated()) {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'clearAllMistakes' }),
    });
    localStorageService.clearAllMistakes();
  } else {
    localStorageService.clearAllMistakes();
  }
}

export async function getMistakesList(): Promise<MistakeData[]> {
  return withFallback(
    async () => {
      const res = await fetch('/api/data?type=mistakesList');
      const data = await res.json();
      return data.mistakes || [];
    },
    () => localStorageService.getMistakesList(),
    []
  );
}

export async function getMistakesInVerseOrder(): Promise<MistakeData[]> {
  return withFallback(
    async () => {
      const res = await fetch('/api/data?type=mistakesVerseOrder');
      const data = await res.json();
      return data.mistakes || [];
    },
    () => localStorageService.getMistakesInVerseOrder(),
    []
  );
}

export async function getNextMistakeInVerseOrder(
  currentSurah: number,
  currentAyah: number,
  pageAyahs?: Array<{ surah?: { number: number }; numberInSurah: number }>
): Promise<MistakeData | null> {
  const mistakesInOrder = await getMistakesInVerseOrder();
  if (mistakesInOrder.length === 0) return null;
  const next = mistakesInOrder.find(m =>
    m.surah > currentSurah || (m.surah === currentSurah && m.ayah > currentAyah)
  );
  return next || mistakesInOrder[0];
}

export async function getPreviousMistakeInVerseOrder(
  currentSurah: number,
  currentAyah: number,
  pageAyahs?: Array<{ surah?: { number: number }; numberInSurah: number }>
): Promise<MistakeData | null> {
  const mistakesInOrder = await getMistakesInVerseOrder();
  if (mistakesInOrder.length === 0) return null;
  const prev = [...mistakesInOrder].reverse().find(m =>
    m.surah < currentSurah || (m.surah === currentSurah && m.ayah < currentAyah)
  );
  return prev || mistakesInOrder[mistakesInOrder.length - 1];
}

// =============================================
// SETTINGS
// =============================================

async function fetchSettings(): Promise<any | null> {
  const res = await fetch('/api/data?type=settings');
  const data = await res.json();
  return data.settings || null;
}

async function saveSettingsToDb(settings: any): Promise<void> {
  await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op: 'saveSettings', settings }),
  });
}

export async function saveSelectedReciter(reciter: string): Promise<void> {
  if (await isAuthenticated()) {
    const current = await fetchSettings();
    await saveSettingsToDb({ ...current, selectedReciter: reciter });
  }
  // Always keep localStorage in sync
  localStorageService.saveSelectedReciter(reciter);
}

export async function loadSelectedReciter(): Promise<string> {
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return s?.selectedReciter || 'Ayman_Sowaid_64kbps';
    } catch { return 'Ayman_Sowaid_64kbps'; }
  }
  return localStorageService.loadSelectedReciter();
}

export async function saveHideMistakesSetting(hideMistakes: boolean): Promise<void> {
  if (await isAuthenticated()) {
    const current = await fetchSettings();
    await saveSettingsToDb({ ...current, hideMistakes });
  }
  localStorageService.saveHideMistakesSetting(hideMistakes);
}

export async function getHideMistakesSetting(): Promise<boolean> {
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return s?.hideMistakes ?? false;
    } catch { return false; }
  }
  return localStorageService.getHideMistakesSetting();
}

export async function saveLastPage(page: number): Promise<void> {
  if (await isAuthenticated()) {
    const current = await fetchSettings();
    await saveSettingsToDb({ ...current, lastPage: page });
  }
  localStorageService.saveLastPage(page);
}

export async function loadLastPage(): Promise<number> {
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return s?.lastPage ?? 1;
    } catch { return 1; }
  }
  return localStorageService.loadLastPage();
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
    const current = await fetchSettings();
    await saveSettingsToDb({
      ...current,
      arabicFontSize: settings.arabicFontSize,
      translationFontSize: settings.translationFontSize,
      fontTargetArabic: settings.fontTargetArabic,
      fontSize: settings.fontSize,
      padding: settings.padding,
      layoutMode: settings.layoutMode,
      selectedLanguage: settings.selectedLanguage,
      selectedTranslation: settings.selectedTranslation,
      enableTajweed: settings.enableTajweed,
    });
  }
  localStorageService.saveFontSettings(settings);
}

export async function loadFontSettings() {
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return {
        arabicFontSize: s?.arabicFontSize ?? 24,
        translationFontSize: s?.translationFontSize ?? 20,
        fontTargetArabic: s?.fontTargetArabic ?? true,
        fontSize: s?.fontSize ?? 24,
        padding: s?.padding ?? 16,
        layoutMode: (s?.layoutMode as 'spread' | 'single') ?? 'single',
        selectedLanguage: s?.selectedLanguage ?? 'en',
        selectedTranslation: s?.selectedTranslation ?? 'en.hilali',
        enableTajweed: s?.enableTajweed ?? true,
      };
    } catch {
      return {
        arabicFontSize: 24, translationFontSize: 20, fontTargetArabic: true,
        fontSize: 24, padding: 16, layoutMode: 'single' as const,
        selectedLanguage: 'en', selectedTranslation: 'en.hilali', enableTajweed: true,
      };
    }
  }
  return localStorageService.loadFontSettings();
}

// =============================================
// AUDIO & UI SETTINGS
// =============================================

export async function saveAudioSettings(settings: {
  loopMode?: string;
  customLoop?: any;
  playbackSpeed?: number;
}): Promise<void> {
  if (await isAuthenticated()) {
    const current = await fetchSettings();
    await saveSettingsToDb({
      ...current,
      audioLoopMode: settings.loopMode,
      audioCustomLoop: settings.customLoop,
      audioPlaybackSpeed: settings.playbackSpeed,
    });
  }
  // Always keep localStorage in sync
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

export async function loadAudioSettings() {
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return {
        loopMode: s?.audioLoopMode ?? 'none',
        customLoop: s?.audioCustomLoop ?? {},
        playbackSpeed: s?.audioPlaybackSpeed ?? 1.0,
      };
    } catch {
      return { loopMode: 'none', customLoop: {}, playbackSpeed: 1.0 };
    }
  }
  if (typeof window === 'undefined') return { loopMode: 'none', customLoop: {}, playbackSpeed: 1.0 };
  const loopMode = localStorage.getItem('mquran_audio_loop_mode') || 'none';
  const customLoopStr = localStorage.getItem('mquran_audio_custom_loop');
  const customLoop = customLoopStr ? JSON.parse(customLoopStr) : {};
  const playbackSpeed = parseFloat(localStorage.getItem('mquran_audio_playback_speed') || '1');
  return { loopMode, customLoop, playbackSpeed };
}

export async function saveUISettings(settings: {
  showWordByWordTooltip?: boolean;
  mobileHeaderHidden?: boolean;
  userTimeZone?: string;
}): Promise<void> {
  if (await isAuthenticated()) {
    const current = await fetchSettings();
    await saveSettingsToDb({
      ...current,
      showWordByWordTooltip: settings.showWordByWordTooltip,
      mobileHeaderHidden: settings.mobileHeaderHidden,
      userTimezone: settings.userTimeZone,
    });
  } else {
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
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return {
        showWordByWordTooltip: s?.showWordByWordTooltip ?? false,
        mobileHeaderHidden: s?.mobileHeaderHidden ?? false,
        userTimeZone: s?.userTimezone ?? null,
      };
    } catch {
      return { showWordByWordTooltip: false, mobileHeaderHidden: false, userTimeZone: null };
    }
  }
  if (typeof window === 'undefined') return { showWordByWordTooltip: false, mobileHeaderHidden: false, userTimeZone: null };
  return {
    showWordByWordTooltip: localStorage.getItem('showWordByWordTooltip') === 'true',
    mobileHeaderHidden: localStorage.getItem('mobileHeaderHidden') === 'true',
    userTimeZone: localStorage.getItem('userTimeZone'),
  };
}

// =============================================
// FAVORITE RECITERS (syncable)
// =============================================

export async function loadFavoriteReciters(): Promise<string[]> {
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return s?.favoriteReciters ?? [];
    } catch {
      return localStorageService.loadFavoriteReciters();
    }
  }
  return localStorageService.loadFavoriteReciters();
}

export async function saveFavoriteReciters(ids: string[]): Promise<void> {
  if (await isAuthenticated()) {
    const current = await fetchSettings();
    await saveSettingsToDb({ ...current, favoriteReciters: ids });
  } else {
    localStorageService.saveFavoriteReciters(ids);
  }
}

export async function toggleFavoriteReciter(reciterId: string): Promise<string[]> {
  const current = await loadFavoriteReciters();
  const next = current.includes(reciterId)
    ? current.filter(id => id !== reciterId)
    : [...current, reciterId];
  await saveFavoriteReciters(next);
  return next;
}

// =============================================
// REVIEW SETTINGS (syncable)
// =============================================

export async function loadReviewSettings<T>(): Promise<T | null> {
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return (s?.reviewSettings as T) ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveReviewSettings(settings: any): Promise<void> {
  if (await isAuthenticated()) {
    const current = await fetchSettings();
    await saveSettingsToDb({ ...current, reviewSettings: settings });
  }
  // Always save to localStorage too (the reviewAlgorithms module reads from there)
  if (typeof window !== 'undefined') {
    localStorage.setItem('mquran_review_settings', JSON.stringify(settings));
  }
}

// =============================================
// READING LAYOUT & HIDE WORDS (syncable)
// =============================================

export async function loadReadingLayout(): Promise<string | null> {
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return s?.readingLayout ?? 'verse';
    } catch {
      return null;
    }
  }
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('quran-reading-layout');
}

export async function saveReadingLayout(layout: string): Promise<void> {
  if (await isAuthenticated()) {
    const current = await fetchSettings();
    await saveSettingsToDb({ ...current, readingLayout: layout });
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('quran-reading-layout', layout);
  }
}

export async function loadHideWordsDelay(): Promise<number | null> {
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return s?.hideWordsDelay ?? 500;
    } catch {
      return null;
    }
  }
  return null;
}

export async function saveHideWordsDelay(delay: number): Promise<void> {
  if (await isAuthenticated()) {
    const current = await fetchSettings();
    await saveSettingsToDb({ ...current, hideWordsDelay: delay });
  }
}

// =============================================
// DATA ANALYTICS
// =============================================

export async function getDailyReviewData(days: number = 30): Promise<DailyReviewData[]> {
  return withFallback(
    async () => {
      const res = await fetch(`/api/data?type=dailyReviews&days=${days}`);
      const data = await res.json();
      return data.dailyReviews || [];
    },
    () => localStorageService.getDailyReviewData(days),
    []
  );
}

// =============================================
// BATCH OPERATIONS
// =============================================

export async function batchUpdateMemorizationItems(items: MemorizationItem[]): Promise<void> {
  if (await isAuthenticated()) {
    await Promise.all(items.map(item => updateMemorizationItem(item)));
  } else {
    items.forEach(item => localStorageService.updateMemorizationItem(item));
  }
}

export async function batchAddMemorizationItems(items: MemorizationItem[]): Promise<void> {
  if (await isAuthenticated()) {
    await Promise.all(items.map(item => addMemorizationItem(item)));
  } else {
    items.forEach(item => localStorageService.addMemorizationItem(item));
  }
}

// =============================================
// MIGRATION (legacy — merge local into DB)
// =============================================

export async function migrateToDatabase(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const items = localStorageService.getAllMemorizationItems();
    const mistakes = localStorageService.getMistakes();
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'migrate', items, mistakes }),
    });
    console.log('Successfully migrated data to database');
  } catch (error) {
    console.error('Failed to migrate data to database:', error);
    throw error;
  }
}

// =============================================
// SYNC — compare local vs DB, upload, download, merge
// =============================================

export interface SyncComparison {
  localItems: number;
  dbItems: number;
  localMistakes: number;
  dbMistakes: number;
  hasMismatch: boolean;
  // Items only in local (not in DB)
  localOnlyItems: number;
  // Items only in DB (not in local)
  dbOnlyItems: number;
  // Items in both but with different data
  differentItems: number;
}

export async function compareLocalAndDb(): Promise<SyncComparison> {
  const localItems = localStorageService.getAllMemorizationItems();
  const localMistakes = localStorageService.getMistakes();

  const res = await fetch('/api/data?type=items');
  const dbData = await res.json();
  const dbItems: MemorizationItem[] = dbData.items || [];

  const dbMistakesRes = await fetch('/api/data?type=mistakes');
  const dbMistakesData = await dbMistakesRes.json();
  const dbMistakesRecord = dbMistakesData.mistakes || {};

  const localIds = new Set(localItems.map(i => i.id));
  const dbIds = new Set(dbItems.map(i => i.id));

  const localOnlyItems = localItems.filter(i => !dbIds.has(i.id)).length;
  const dbOnlyItems = dbItems.filter(i => !localIds.has(i.id)).length;

  // Count items that exist in both but differ
  let differentItems = 0;
  for (const localItem of localItems) {
    const dbItem = dbItems.find(i => i.id === localItem.id);
    if (dbItem) {
      if (dbItem.reviewCount !== localItem.reviewCount ||
          dbItem.nextReview !== localItem.nextReview ||
          dbItem.interval !== localItem.interval ||
          dbItem.completedToday !== localItem.completedToday) {
        differentItems++;
      }
    }
  }

  const localMistakeKeys = Object.keys(localMistakes);
  const dbMistakeKeys = Object.keys(dbMistakesRecord);

  const hasMismatch =
    localOnlyItems > 0 || dbOnlyItems > 0 || differentItems > 0 ||
    localMistakeKeys.length !== dbMistakeKeys.length ||
    localMistakeKeys.some(k => !dbMistakesRecord[k]);

  return {
    localItems: localItems.length,
    dbItems: dbItems.length,
    localMistakes: localMistakeKeys.length,
    dbMistakes: dbMistakeKeys.length,
    hasMismatch,
    localOnlyItems,
    dbOnlyItems,
    differentItems,
  };
}

export async function syncUploadLocalToDb(): Promise<void> {
  const items = localStorageService.getAllMemorizationItems();
  const mistakes = localStorageService.getMistakes();
  await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op: 'syncUploadLocal', items, mistakes }),
  });
}

export async function syncDownloadDbToLocal(): Promise<void> {
  const res = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op: 'syncDownloadDb' }),
  });
  const data = await res.json();

  // Overwrite localStorage with DB data
  if (data.items && Array.isArray(data.items)) {
    localStorageService.clearAllData();
    for (const item of data.items) {
      localStorageService.addMemorizationItem(item);
    }
  }
  if (data.mistakes) {
    localStorageService.saveMistakes(data.mistakes);
  }
}

export async function syncMerge(): Promise<{ items: MemorizationItem[]; mistakes: Record<string, any> }> {
  const items = localStorageService.getAllMemorizationItems();
  const mistakes = localStorageService.getMistakes();

  const res = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op: 'syncMerge', items, mistakes }),
  });
  const data = await res.json();

  // Update localStorage with merged result
  if (data.items && Array.isArray(data.items)) {
    localStorageService.clearAllData();
    for (const item of data.items) {
      localStorageService.addMemorizationItem(item);
    }
  }
  if (data.mistakes) {
    localStorageService.saveMistakes(data.mistakes);
  }

  return { items: data.items || [], mistakes: data.mistakes || {} };
}

// =============================================
// BOOKMARKS
// =============================================

export interface Bookmark {
  id: string;
  type: 'page' | 'ayah';
  page?: number | null;
  surah?: number | null;
  ayah?: number | null;
  label?: string | null;
  surahName?: string | null;
  createdAt?: string;
}

const BOOKMARKS_KEY = 'mquran_bookmarks';

function loadLocalBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBookmarks(bookmarks: Bookmark[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export async function getBookmarks(): Promise<Bookmark[]> {
  if (await isAuthenticated()) {
    try {
      const res = await fetch('/api/data?type=bookmarks');
      const data = await res.json();
      return data.bookmarks || [];
    } catch {
      return loadLocalBookmarks();
    }
  }
  return loadLocalBookmarks();
}

export async function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark | null> {
  if (await isAuthenticated()) {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'addBookmark', ...bookmark }),
      });
      const data = await res.json();
      return data.bookmark;
    } catch {
      return null;
    }
  }
  // Local fallback
  const local = loadLocalBookmarks();
  // Check if already exists
  const exists = local.find(b =>
    b.type === bookmark.type &&
    b.page === bookmark.page &&
    b.surah === bookmark.surah &&
    b.ayah === bookmark.ayah
  );
  if (exists) return exists;
  const newBookmark: Bookmark = {
    ...bookmark,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  saveLocalBookmarks([...local, newBookmark]);
  return newBookmark;
}

export async function removeBookmark(id: string): Promise<void> {
  if (await isAuthenticated()) {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'removeBookmark', id }),
    });
    return;
  }
  const local = loadLocalBookmarks();
  saveLocalBookmarks(local.filter(b => b.id !== id));
}

export async function removeBookmarkByTarget(
  type: 'page' | 'ayah',
  target: { page?: number; surah?: number; ayah?: number }
): Promise<void> {
  if (await isAuthenticated()) {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ op: 'removeBookmarkByTarget', type, ...target }),
    });
    return;
  }
  const local = loadLocalBookmarks();
  saveLocalBookmarks(local.filter(b =>
    !(b.type === type &&
      b.page === target.page &&
      b.surah === target.surah &&
      b.ayah === target.ayah)
  ));
}

export async function isBookmarked(
  type: 'page' | 'ayah',
  target: { page?: number; surah?: number; ayah?: number }
): Promise<boolean> {
  const bookmarks = await getBookmarks();
  return bookmarks.some(b =>
    b.type === type &&
    b.page === target.page &&
    b.surah === target.surah &&
    b.ayah === target.ayah
  );
}
