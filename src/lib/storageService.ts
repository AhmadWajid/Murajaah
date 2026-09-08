/**
 * Storage Service — Unified write-through data layer
 *
 * Architecture:
 *   - All writes go to localStorage first (optimistic, instant UI feedback)
 *   - If authenticated, the same write also syncs to Neon via API
 *   - All reads prefer DB when authenticated, fall back to localStorage
 *   - Adding a new entity only requires: a local function + an API function
 *
 * This eliminates the repeated "if auth { fetch + localStorage } else { localStorage }"
 * pattern that was duplicated for every operation.
 */

import { MemorizationItem } from './spacedRepetition';
import { REVIEW_SETTINGS_EVENT } from './reviewAlgorithms';
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

export function invalidateCache(_pattern?: string): void {}
export function clearCache(): void {}

// =============================================
// CORE HELPERS — the heart of the write-through layer
// =============================================

/** POST to /api/data with automatic error checking */
async function apiPost(body: Record<string, any>): Promise<Response> {
  const res = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res;
}

/** POST to /api/data and discard the response (for fire-and-forget writes) */
async function apiWrite(body: Record<string, any>): Promise<void> {
  await apiPost(body);
}

/** GET from /api/data with automatic error checking */
async function apiGet(query: string): Promise<any> {
  const res = await fetch(`/api/data?${query}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/**
 * Write-through: writes to localStorage immediately, then syncs to DB if authenticated.
 * - Local write always succeeds (optimistic — UI is instantly updated)
 * - DB failure is logged but does NOT roll back local (sync modal will catch it later)
 */
async function writeThrough(
  localFn: () => void,
  apiFn?: () => Promise<void>,
): Promise<void> {
  localFn();
  if (apiFn && await isAuthenticated()) {
    try {
      await apiFn();
    } catch (error) {
      console.warn('[storage] DB sync failed, local write succeeded:', error);
    }
  }
}

/**
 * Write-through with result: writes locally first, then if authenticated,
 * calls the API and syncs the authoritative result back to localStorage.
 * Falls back to local result if API fails.
 */
async function writeThroughResult<T>(
  localFn: () => T,
  apiFn: () => Promise<T>,
  syncLocal: (apiResult: T) => void,
): Promise<T> {
  const localResult = localFn();
  if (await isAuthenticated()) {
    try {
      const apiResult = await apiFn();
      syncLocal(apiResult);
      return apiResult;
    } catch (error) {
      console.warn('[storage] DB sync failed, using local result:', error);
    }
  }
  return localResult;
}

/**
 * Read-through: reads from DB if authenticated, falls back to localStorage.
 * If DB read fails, falls back to localStorage gracefully.
 */
async function readThrough<T>(
  apiFn: () => Promise<T>,
  localFn: () => T,
  defaultValue?: T,
): Promise<T> {
  try {
    if (await isAuthenticated()) {
      return await apiFn();
    }
    return localFn();
  } catch (error) {
    console.warn('[storage] DB read failed, falling back to localStorage:', error);
    try {
      return localFn();
    } catch (localError) {
      if (defaultValue !== undefined) return defaultValue;
      throw localError;
    }
  }
}

// =============================================
// SETTINGS — internal helpers
// =============================================

let cachedSettings: any | null | undefined;

async function fetchSettings(): Promise<any | null> {
  if (cachedSettings !== undefined) {
    return cachedSettings;
  }
  try {
    const data = await apiGet('type=settings');
    cachedSettings = data.settings || null;
  } catch {
    cachedSettings = null;
  }
  return cachedSettings;
}

function invalidateSettingsCache() {
  cachedSettings = undefined;
}

async function saveSettingsToDb(settings: any): Promise<void> {
  await apiPost({ op: 'saveSettings', settings });
  cachedSettings = settings; // update cache
}

/**
 * Sync ALL settings from DB → localStorage in one shot.
 * Called once when auth state changes (login/signup).
 * After this runs, every localStorage-based read picks up the DB values,
 * so no individual page needs to check auth or load settings from DB.
 *
 * Returns true if settings were synced, false if not authenticated or no settings found.
 */
export async function syncSettingsFromDb(): Promise<boolean> {
  if (!(await isAuthenticated())) return false;
  try {
    invalidateSettingsCache();
    const s = await fetchSettings();
    if (!s) return false;

    if (typeof window === 'undefined') return true;

    // Reciter
    if (s.selectedReciter) localStorage.setItem('mquran_selected_reciter', s.selectedReciter);
    // Favorite reciters
    if (s.favoriteReciters) localStorage.setItem('mquran_favorite_reciters', JSON.stringify(s.favoriteReciters));
    // Hide mistakes
    localStorage.setItem('quran-hide-mistakes', JSON.stringify(s.hideMistakes ?? false));
    // Last page
    localStorage.setItem('quran-last-page', JSON.stringify(s.lastPage ?? 1));
    // Font settings (all visual/reading prefs bundled)
    localStorage.setItem('quran-font-settings', JSON.stringify({
      arabicFontSize: s.arabicFontSize ?? 24,
      translationFontSize: s.translationFontSize ?? 20,
      fontTargetArabic: s.fontTargetArabic ?? true,
      fontSize: s.fontSize ?? 24,
      padding: s.padding ?? 16,
      layoutMode: s.layoutMode ?? 'single',
      selectedLanguage: s.selectedLanguage ?? 'en',
      selectedTranslation: s.selectedTranslation ?? 'en.hilali',
      enableTajweed: s.enableTajweed ?? true,
    }));
    // Audio settings
    if (s.audioLoopMode) localStorage.setItem('mquran_audio_loop_mode', s.audioLoopMode);
    if (s.audioCustomLoop) localStorage.setItem('mquran_audio_custom_loop', JSON.stringify(s.audioCustomLoop));
    if (s.audioPlaybackSpeed) localStorage.setItem('mquran_audio_playback_speed', String(s.audioPlaybackSpeed));
    // UI settings
    if (s.showWordByWordTooltip !== undefined) localStorage.setItem('showWordByWordTooltip', s.showWordByWordTooltip ? 'true' : 'false');
    if (s.mobileHeaderHidden !== undefined) localStorage.setItem('mobileHeaderHidden', s.mobileHeaderHidden.toString());
    if (s.userTimezone) localStorage.setItem('userTimeZone', s.userTimezone);
    if (s.hideWords !== undefined) localStorage.setItem('hideWords', s.hideWords ? 'true' : 'false');
    if (s.hideWordsDelay !== undefined) localStorage.setItem('hideWordsDelay', String(s.hideWordsDelay));
    // Review settings
    if (s.reviewSettings) {
      localStorage.setItem('mquran_review_settings', JSON.stringify(s.reviewSettings));
      window.dispatchEvent(new Event(REVIEW_SETTINGS_EVENT));
    }
    // Reading layout
    if (s.readingLayout) localStorage.setItem('quran-reading-layout', s.readingLayout);

    return true;
  } catch (error) {
    console.warn('[storage] Failed to sync settings from DB:', error);
    return false;
  }
}

/**
 * Save a single setting field: writes to localStorage, merges into settings
 * object, and syncs to DB if authenticated.
 */
async function saveSetting(
  settingsKey: string,
  value: any,
  localFn: () => void,
): Promise<void> {
  localFn();
  if (await isAuthenticated()) {
    try {
      const current = await fetchSettings();
      const updated = { ...current, [settingsKey]: value };
      await saveSettingsToDb(updated);
    } catch (error) {
      console.warn('[storage] Settings sync failed:', error);
    }
  }
}

/** Read a single setting field from DB if authenticated, else localStorage */
async function readSetting<T>(
  settingsKey: string,
  defaultValue: T,
  localFn: () => T,
): Promise<T> {
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return (s?.[settingsKey] as T) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }
  return localFn();
}

// =============================================
// MEMORIZATION ITEMS
// =============================================

export async function addMemorizationItem(item: MemorizationItem): Promise<void> {
  await writeThrough(
    () => localStorageService.addMemorizationItem(item),
    () => apiWrite({ op: 'addItem', item }),
  );
}

export async function updateMemorizationItem(item: MemorizationItem): Promise<void> {
  await writeThrough(
    () => localStorageService.updateMemorizationItem(item),
    () => apiWrite({ op: 'updateItem', item }),
  );
}

export async function updateMemorizationItemWithIndividualRating(
  itemId: string,
  ayahNumber: number,
  rating: 'easy' | 'medium' | 'hard'
): Promise<void> {
  if (await isAuthenticated()) {
    try {
      const data = await apiGet(`type=items&id=${encodeURIComponent(itemId)}`);
      if (!data.item) throw new Error('Item not found');

      const { updateIndividualAyahRating } = await import('./spacedRepetition');
      const result = updateIndividualAyahRating(data.item, ayahNumber, rating);

      if (result.shouldSplit && result.newItems) {
        await apiPost({ op: 'removeItem', id: itemId });
        localStorageService.removeMemorizationItem(itemId);
        for (const newItem of result.newItems) {
          await apiPost({ op: 'addItem', item: newItem });
          localStorageService.addMemorizationItem(newItem);
        }
      } else {
        await apiPost({ op: 'updateItem', item: result.updatedItem });
        localStorageService.updateMemorizationItem(result.updatedItem);
      }
    } catch (error) {
      console.warn('[storage] Individual rating sync failed, using local:', error);
      localStorageService.updateMemorizationItemWithIndividualRating(itemId, ayahNumber, rating);
    }
  } else {
    localStorageService.updateMemorizationItemWithIndividualRating(itemId, ayahNumber, rating);
  }
}

export async function removeMemorizationItem(id: string): Promise<void> {
  await writeThrough(
    () => localStorageService.removeMemorizationItem(id),
    () => apiWrite({ op: 'removeItem', id }),
  );
}

export async function getAllMemorizationItems(): Promise<MemorizationItem[]> {
  return readThrough(
    async () => {
      const data = await apiGet('type=items');
      return data.items || [];
    },
    () => localStorageService.getAllMemorizationItems(),
    [],
  );
}

export async function getMemorizationItem(id: string): Promise<MemorizationItem | null> {
  return readThrough(
    async () => {
      const data = await apiGet(`type=items&id=${encodeURIComponent(id)}`);
      return data.item || null;
    },
    () => localStorageService.getMemorizationItem(id),
    null,
  );
}

export async function clearAllData(): Promise<void> {
  await writeThrough(
    () => localStorageService.clearAllData(),
    () => apiWrite({ op: 'clearAllItems' }),
  );
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
  return readThrough(
    async () => {
      const data = await apiGet('type=mistakes');
      return data.mistakes || {};
    },
    () => localStorageService.getMistakes(),
    {},
  );
}

export async function saveMistakes(mistakes: Record<string, MistakeData | boolean>): Promise<void> {
  const dbMistakes: Record<string, MistakeData> = {};
  Object.entries(mistakes).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && 'timestamp' in value) {
      dbMistakes[key] = value as MistakeData;
    } else if (typeof value === 'boolean' && value === true) {
      const [surah, ayah] = key.split(':').map(Number);
      dbMistakes[key] = { timestamp: new Date().toISOString(), surah, ayah };
    }
  });
  await writeThrough(
    () => localStorageService.saveMistakes(mistakes),
    () => apiWrite({ op: 'saveMistakes', mistakes: dbMistakes }),
  );
}

export async function toggleMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData | boolean>> {
  return writeThroughResult(
    () => localStorageService.toggleMistake(surahNumber, ayahNumber),
    async () => {
      const data = await apiPost({ op: 'toggleMistake', surah: surahNumber, ayah: ayahNumber }).then(r => r.json());
      return data.mistakes || {};
    },
    (apiMistakes) => localStorageService.saveMistakes(apiMistakes),
  );
}

export async function showMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData | boolean>> {
  return writeThroughResult(
    () => localStorageService.showMistake(surahNumber, ayahNumber),
    async () => {
      const data = await apiPost({ op: 'toggleMistake', surah: surahNumber, ayah: ayahNumber }).then(r => r.json());
      return data.mistakes || {};
    },
    (apiMistakes) => localStorageService.saveMistakes(apiMistakes),
  );
}

export async function removeMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData | boolean>> {
  return writeThroughResult(
    () => localStorageService.removeMistake(surahNumber, ayahNumber),
    async () => {
      const data = await apiPost({ op: 'removeMistake', surah: surahNumber, ayah: ayahNumber }).then(r => r.json());
      return data.mistakes || {};
    },
    (apiMistakes) => localStorageService.saveMistakes(apiMistakes),
  );
}

export async function clearAllMistakes(): Promise<void> {
  await writeThrough(
    () => localStorageService.clearAllMistakes(),
    () => apiWrite({ op: 'clearAllMistakes' }),
  );
}

export async function getMistakesList(): Promise<MistakeData[]> {
  return readThrough(
    async () => {
      const data = await apiGet('type=mistakesList');
      return data.mistakes || [];
    },
    () => localStorageService.getMistakesList(),
    [],
  );
}

export async function getMistakesInVerseOrder(): Promise<MistakeData[]> {
  return readThrough(
    async () => {
      const data = await apiGet('type=mistakesVerseOrder');
      return data.mistakes || [];
    },
    () => localStorageService.getMistakesInVerseOrder(),
    [],
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
// SETTINGS — public API
// =============================================

const DEFAULT_RECITER = 'Ayman_Sowaid_64kbps';

export async function saveSelectedReciter(reciter: string): Promise<void> {
  await saveSetting('selectedReciter', reciter, () => localStorageService.saveSelectedReciter(reciter));
}

export async function loadSelectedReciter(): Promise<string> {
  return readSetting('selectedReciter', DEFAULT_RECITER, () => localStorageService.loadSelectedReciter());
}

export async function saveHideMistakesSetting(hideMistakes: boolean): Promise<void> {
  await saveSetting('hideMistakes', hideMistakes, () => localStorageService.saveHideMistakesSetting(hideMistakes));
}

export async function getHideMistakesSetting(): Promise<boolean> {
  return readSetting('hideMistakes', false, () => localStorageService.getHideMistakesSetting());
}

export async function saveLastPage(page: number): Promise<void> {
  await saveSetting('lastPage', page, () => localStorageService.saveLastPage(page));
}

export async function loadLastPage(): Promise<number> {
  return readSetting('lastPage', 1, () => localStorageService.loadLastPage());
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
  // Write all font settings to localStorage
  localStorageService.saveFontSettings(settings);
  // Sync the individual fields to DB
  if (await isAuthenticated()) {
    try {
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
    } catch (error) {
      console.warn('[storage] Font settings sync failed:', error);
    }
  }
}

export async function loadFontSettings() {
  const defaults = {
    arabicFontSize: 24, translationFontSize: 20, fontTargetArabic: true,
    fontSize: 24, padding: 16, layoutMode: 'single' as const,
    selectedLanguage: 'en', selectedTranslation: 'en.hilali', enableTajweed: true,
  };
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return {
        arabicFontSize: s?.arabicFontSize ?? defaults.arabicFontSize,
        translationFontSize: s?.translationFontSize ?? defaults.translationFontSize,
        fontTargetArabic: s?.fontTargetArabic ?? defaults.fontTargetArabic,
        fontSize: s?.fontSize ?? defaults.fontSize,
        padding: s?.padding ?? defaults.padding,
        layoutMode: (s?.layoutMode as 'spread' | 'single') ?? defaults.layoutMode,
        selectedLanguage: s?.selectedLanguage ?? defaults.selectedLanguage,
        selectedTranslation: s?.selectedTranslation ?? defaults.selectedTranslation,
        enableTajweed: s?.enableTajweed ?? defaults.enableTajweed,
      };
    } catch {
      return defaults;
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
  // Write to localStorage
  if (typeof window !== 'undefined') {
    if (settings.loopMode !== undefined) localStorage.setItem('mquran_audio_loop_mode', settings.loopMode);
    if (settings.customLoop !== undefined) localStorage.setItem('mquran_audio_custom_loop', JSON.stringify(settings.customLoop));
    if (settings.playbackSpeed !== undefined) localStorage.setItem('mquran_audio_playback_speed', String(settings.playbackSpeed));
  }
  // Sync to DB
  if (await isAuthenticated()) {
    try {
      const current = await fetchSettings();
      await saveSettingsToDb({
        ...current,
        audioLoopMode: settings.loopMode,
        audioCustomLoop: settings.customLoop,
        audioPlaybackSpeed: settings.playbackSpeed,
      });
    } catch (error) {
      console.warn('[storage] Audio settings sync failed:', error);
    }
  }
}

export async function loadAudioSettings() {
  const defaults = { loopMode: 'none', customLoop: {}, playbackSpeed: 1.0 };
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return {
        loopMode: s?.audioLoopMode ?? defaults.loopMode,
        customLoop: s?.audioCustomLoop ?? defaults.customLoop,
        playbackSpeed: s?.audioPlaybackSpeed ?? defaults.playbackSpeed,
      };
    } catch {
      return defaults;
    }
  }
  if (typeof window === 'undefined') return defaults;
  return {
    loopMode: localStorage.getItem('mquran_audio_loop_mode') || defaults.loopMode,
    customLoop: JSON.parse(localStorage.getItem('mquran_audio_custom_loop') || '{}'),
    playbackSpeed: parseFloat(localStorage.getItem('mquran_audio_playback_speed') || '1'),
  };
}

export async function saveUISettings(settings: {
  showWordByWordTooltip?: boolean;
  mobileHeaderHidden?: boolean;
  userTimeZone?: string;
  hideWords?: boolean;
  hideWordsDelay?: number;
}): Promise<void> {
  // Write to localStorage
  if (typeof window !== 'undefined') {
    if (settings.showWordByWordTooltip !== undefined) localStorage.setItem('showWordByWordTooltip', settings.showWordByWordTooltip ? 'true' : 'false');
    if (settings.mobileHeaderHidden !== undefined) localStorage.setItem('mobileHeaderHidden', settings.mobileHeaderHidden.toString());
    if (settings.userTimeZone !== undefined) localStorage.setItem('userTimeZone', settings.userTimeZone);
    if (settings.hideWords !== undefined) localStorage.setItem('hideWords', settings.hideWords ? 'true' : 'false');
    if (settings.hideWordsDelay !== undefined) localStorage.setItem('hideWordsDelay', String(settings.hideWordsDelay));
  }
  // Sync to DB
  if (await isAuthenticated()) {
    try {
      const current = await fetchSettings();
      await saveSettingsToDb({
        ...current,
        showWordByWordTooltip: settings.showWordByWordTooltip,
        mobileHeaderHidden: settings.mobileHeaderHidden,
        userTimezone: settings.userTimeZone,
        hideWords: settings.hideWords,
        hideWordsDelay: settings.hideWordsDelay,
      });
    } catch (error) {
      console.warn('[storage] UI settings sync failed:', error);
    }
  }
}

export async function loadUISettings() {
  const defaults = { showWordByWordTooltip: false, mobileHeaderHidden: false, userTimeZone: null as string | null, hideWords: false, hideWordsDelay: 500 };
  if (await isAuthenticated()) {
    try {
      const s = await fetchSettings();
      return {
        showWordByWordTooltip: s?.showWordByWordTooltip ?? defaults.showWordByWordTooltip,
        mobileHeaderHidden: s?.mobileHeaderHidden ?? defaults.mobileHeaderHidden,
        userTimeZone: s?.userTimezone ?? defaults.userTimeZone,
        hideWords: s?.hideWords ?? defaults.hideWords,
        hideWordsDelay: s?.hideWordsDelay ?? defaults.hideWordsDelay,
      };
    } catch {
      return defaults;
    }
  }
  if (typeof window === 'undefined') return defaults;
  return {
    showWordByWordTooltip: localStorage.getItem('showWordByWordTooltip') === 'true',
    mobileHeaderHidden: localStorage.getItem('mobileHeaderHidden') === 'true',
    userTimeZone: localStorage.getItem('userTimeZone'),
    hideWords: localStorage.getItem('hideWords') === 'true',
    hideWordsDelay: parseInt(localStorage.getItem('hideWordsDelay') || '500', 10),
  };
}

// =============================================
// FAVORITE RECITERS (syncable)
// =============================================

export async function loadFavoriteReciters(): Promise<string[]> {
  return readSetting<string[]>('favoriteReciters', [], () => localStorageService.loadFavoriteReciters());
}

export async function saveFavoriteReciters(ids: string[]): Promise<void> {
  await saveSetting('favoriteReciters', ids, () => localStorageService.saveFavoriteReciters(ids));
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
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('mquran_review_settings');
  return raw ? JSON.parse(raw) : null;
}

export async function saveReviewSettings(settings: any): Promise<void> {
  // Always save to localStorage (the reviewAlgorithms module reads from there)
  if (typeof window !== 'undefined') {
    localStorage.setItem('mquran_review_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event(REVIEW_SETTINGS_EVENT));
  }
  // Sync to DB
  if (await isAuthenticated()) {
    try {
      const current = await fetchSettings();
      await saveSettingsToDb({ ...current, reviewSettings: settings });
    } catch (error) {
      console.warn('[storage] Review settings sync failed:', error);
    }
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
  if (typeof window !== 'undefined') {
    localStorage.setItem('quran-reading-layout', layout);
  }
  if (await isAuthenticated()) {
    try {
      const current = await fetchSettings();
      await saveSettingsToDb({ ...current, readingLayout: layout });
    } catch (error) {
      console.warn('[storage] Reading layout sync failed:', error);
    }
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
  await saveSetting('hideWordsDelay', delay, () => {});
}

// =============================================
// DATA ANALYTICS
// =============================================

export async function getDailyReviewData(days: number = 30): Promise<DailyReviewData[]> {
  return readThrough(
    async () => {
      const data = await apiGet(`type=dailyReviews&days=${days}`);
      return data.dailyReviews || [];
    },
    () => localStorageService.getDailyReviewData(days),
    [],
  );
}

// =============================================
// BATCH OPERATIONS
// =============================================

export async function batchUpdateMemorizationItems(items: MemorizationItem[]): Promise<void> {
  await Promise.all(items.map(item => updateMemorizationItem(item)));
}

export async function batchAddMemorizationItems(items: MemorizationItem[]): Promise<void> {
  await Promise.all(items.map(item => addMemorizationItem(item)));
}

// =============================================
// MIGRATION (legacy — merge local into DB)
// =============================================

export async function migrateToDatabase(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const items = localStorageService.getAllMemorizationItems();
    const mistakes = localStorageService.getMistakes();
    await apiPost({ op: 'migrate', items, mistakes });
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
  localOnlyItems: number;
  dbOnlyItems: number;
  differentItems: number;
}

export async function compareLocalAndDb(): Promise<SyncComparison> {
  const localItems = localStorageService.getAllMemorizationItems();
  const localMistakes = localStorageService.getMistakes();
  const localBookmarks = loadLocalBookmarks();

  const dbData = await apiGet('type=items');
  const dbItems: MemorizationItem[] = dbData.items || [];

  const dbMistakesData = await apiGet('type=mistakes');
  const dbMistakesRecord = dbMistakesData.mistakes || {};

  const dbBookmarksData = await apiGet('type=bookmarks');
  const dbBookmarks: Bookmark[] = dbBookmarksData.bookmarks || [];

  const localIds = new Set(localItems.map(i => i.id));
  const dbIds = new Set(dbItems.map(i => i.id));

  const localOnlyItems = localItems.filter(i => !dbIds.has(i.id)).length;
  const dbOnlyItems = dbItems.filter(i => !localIds.has(i.id)).length;

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

  const localBmKeys = new Set(localBookmarks.map(b =>
    `${b.type}:${b.page ?? ''}:${b.surah ?? ''}:${b.ayah ?? ''}`
  ));
  const dbBmKeys = new Set(dbBookmarks.map(b =>
    `${b.type}:${b.page ?? ''}:${b.surah ?? ''}:${b.ayah ?? ''}`
  ));
  const bookmarksMismatch =
    localBookmarks.length !== dbBookmarks.length ||
    [...localBmKeys].some(k => !dbBmKeys.has(k)) ||
    [...dbBmKeys].some(k => !localBmKeys.has(k));

  const hasMismatch =
    localOnlyItems > 0 || dbOnlyItems > 0 || differentItems > 0 ||
    localMistakeKeys.length !== dbMistakeKeys.length ||
    localMistakeKeys.some(k => !dbMistakesRecord[k]) ||
    bookmarksMismatch;

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
  const localBookmarks = loadLocalBookmarks();
  await apiPost({ op: 'syncUploadLocal', items, mistakes, bookmarks: localBookmarks });
}

export async function syncDownloadDbToLocal(): Promise<void> {
  const data = await apiPost({ op: 'syncDownloadDb' }).then(r => r.json());

  if (data.items && Array.isArray(data.items)) {
    localStorageService.clearAllData();
    for (const item of data.items) {
      localStorageService.addMemorizationItem(item);
    }
  }
  if (data.mistakes) {
    localStorageService.saveMistakes(data.mistakes);
  }
  if (data.bookmarks) {
    saveLocalBookmarks(data.bookmarks);
  }
}

export async function syncMerge(): Promise<{ items: MemorizationItem[]; mistakes: Record<string, any> }> {
  const items = localStorageService.getAllMemorizationItems();
  const mistakes = localStorageService.getMistakes();
  const localBookmarks = loadLocalBookmarks();

  const data = await apiPost({ op: 'syncMerge', items, mistakes, bookmarks: localBookmarks }).then(r => r.json());

  if (data.items && Array.isArray(data.items)) {
    localStorageService.clearAllData();
    for (const item of data.items) {
      localStorageService.addMemorizationItem(item);
    }
  }
  if (data.mistakes) {
    localStorageService.saveMistakes(data.mistakes);
  }
  if (data.bookmarks) {
    saveLocalBookmarks(data.bookmarks);
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
  return readThrough(
    async () => {
      const data = await apiGet('type=bookmarks');
      const bookmarks = data.bookmarks || [];
      saveLocalBookmarks(bookmarks); // keep local in sync
      return bookmarks;
    },
    () => loadLocalBookmarks(),
    [],
  );
}

export async function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark | null> {
  if (await isAuthenticated()) {
    try {
      const data = await apiPost({ op: 'addBookmark', ...bookmark }).then(r => r.json());
      const newBookmark = data.bookmark;
      if (newBookmark) {
        const local = loadLocalBookmarks();
        saveLocalBookmarks([...local, newBookmark]);
      }
      return newBookmark;
    } catch (error) {
      console.warn('[storage] Bookmark add sync failed, using local:', error);
    }
  }
  // Local fallback
  const local = loadLocalBookmarks();
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
  await writeThrough(
    () => saveLocalBookmarks(loadLocalBookmarks().filter(b => b.id !== id)),
    () => apiWrite({ op: 'removeBookmark', id }),
  );
}

export async function removeBookmarkByTarget(
  type: 'page' | 'ayah',
  target: { page?: number; surah?: number; ayah?: number }
): Promise<void> {
  await writeThrough(
    () => saveLocalBookmarks(loadLocalBookmarks().filter(b =>
      !(b.type === type &&
        b.page === target.page &&
        b.surah === target.surah &&
        b.ayah === target.ayah)
    )),
    () => apiWrite({ op: 'removeBookmarkByTarget', type, ...target }),
  );
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
