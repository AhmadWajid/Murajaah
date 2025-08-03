import { supabase } from './client';
import { MemorizationItem, updateIndividualAyahRating } from '../spacedRepetition';
import { getTodayISODate } from '../utils';
import { Database } from './types';

// Type aliases for better readability
type DbMemorizationItem = Database['public']['Tables']['memorization_items']['Row'];
type DbMistake = Database['public']['Tables']['mistakes']['Row'];
type DbUserSettings = Database['public']['Tables']['user_settings']['Row'];

// =============================================
// UTILITY FUNCTIONS
// =============================================

function convertDbItemToMemorizationItem(dbItem: DbMemorizationItem): MemorizationItem {
  return {
    id: dbItem.id,
    surah: dbItem.surah,
    ayahStart: dbItem.ayah_start,
    ayahEnd: dbItem.ayah_end,
    interval: dbItem.interval_days,
    nextReview: dbItem.next_review,
    easeFactor: dbItem.ease_factor,
    reviewCount: dbItem.review_count,
    lastReviewed: dbItem.last_reviewed || undefined,
    completedToday: dbItem.completed_today || undefined,
    createdAt: dbItem.created_at,
    memorizationAge: dbItem.memorization_age || undefined,
    individualRatings: dbItem.individual_ratings as Record<number, 'easy' | 'medium' | 'hard'> || undefined,
    individualRecallQuality: dbItem.individual_recall_quality as Record<number, any> || undefined,
    rukuStart: dbItem.ruku_start || undefined,
    rukuEnd: dbItem.ruku_end || undefined,
    rukuCount: dbItem.ruku_count || undefined,
    difficultyLevel: dbItem.difficulty_level || undefined,
    name: dbItem.name || undefined,
    description: dbItem.description || undefined,
    tags: dbItem.tags || undefined,
  };
}

function convertMemorizationItemToDbItem(item: MemorizationItem, userId: string): Database['public']['Tables']['memorization_items']['Insert'] {
  return {
    id: item.id,
    user_id: userId,
    surah: item.surah,
    ayah_start: item.ayahStart,
    ayah_end: item.ayahEnd,
    interval_days: item.interval,
    next_review: item.nextReview,
    ease_factor: item.easeFactor,
    review_count: item.reviewCount,
    last_reviewed: item.lastReviewed || null,
    completed_today: item.completedToday || null,
    created_at: item.createdAt,
    memorization_age: item.memorizationAge || null,
    individual_ratings: item.individualRatings || {},
    individual_recall_quality: item.individualRecallQuality || {},
    ruku_start: item.rukuStart || null,
    ruku_end: item.rukuEnd || null,
    ruku_count: item.rukuCount || null,
    difficulty_level: item.difficultyLevel || null,
    name: item.name || null,
    description: item.description || null,
    tags: item.tags || [],
  };
}

// =============================================
// AUTHENTICATION HELPERS
// =============================================

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Database not initialized');
  }
  return supabase;
}

async function getCurrentUser() {
  const client = getSupabaseClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('User not authenticated');
  return user;
}

// =============================================
// MEMORIZATION ITEMS
// =============================================

export async function addMemorizationItem(item: MemorizationItem): Promise<void> {
  const user = await getCurrentUser();
  
  const dbItem = convertMemorizationItemToDbItem(item, user.id);
  
  const { error } = await getSupabaseClient()
    .from('memorization_items')
    .upsert(dbItem, { onConflict: 'id' });
    
  if (error) throw error;
  
  // Update last sync
  await updateLastSync();
}

export async function updateMemorizationItem(item: MemorizationItem): Promise<void> {
  const user = await getCurrentUser();
  
  const dbItem = convertMemorizationItemToDbItem(item, user.id);
  
  const { error } = await getSupabaseClient()
    .from('memorization_items')
    .update(dbItem)
    .eq('id', item.id)
    .eq('user_id', user.id);
    
  if (error) throw error;
  
  await updateLastSync();
}

export async function updateMemorizationItemWithIndividualRating(
  itemId: string,
  ayahNumber: number,
  rating: 'easy' | 'medium' | 'hard'
): Promise<void> {
  const user = await getCurrentUser();
  
  // Get the current item
  const { data: dbItems, error: fetchError } = await getSupabaseClient()
    .from('memorization_items')
    .select('*')
    .eq('id', itemId)
    .eq('user_id', user.id);
    
  if (fetchError) throw fetchError;
  if (!dbItems || dbItems.length === 0) throw new Error('Item not found');
  
  const item = convertDbItemToMemorizationItem(dbItems[0]);
  
  const result = updateIndividualAyahRating(item, ayahNumber, rating);
  
  if (result.shouldSplit && result.newItems) {
    // Remove the original item and add the new split items
    const { error: deleteError } = await getSupabaseClient()
      .from('memorization_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);
      
    if (deleteError) throw deleteError;
    
    // Add the new split items
    const newDbItems = result.newItems.map(newItem => 
      convertMemorizationItemToDbItem(newItem, user.id)
    );
    
    const { error: insertError } = await getSupabaseClient()
      .from('memorization_items')
      .insert(newDbItems);
      
    if (insertError) throw insertError;
  } else {
    // Update the existing item
    const updatedDbItem = convertMemorizationItemToDbItem(result.updatedItem, user.id);
    
    const { error: updateError } = await getSupabaseClient()
      .from('memorization_items')
      .update(updatedDbItem)
      .eq('id', itemId)
      .eq('user_id', user.id);
      
    if (updateError) throw updateError;
  }
  
  await updateLastSync();
}

export async function removeMemorizationItem(id: string): Promise<void> {
  const user = await getCurrentUser();
  
  const { error } = await getSupabaseClient()
    .from('memorization_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
    
  if (error) throw error;
  
  await updateLastSync();
}

export async function getAllMemorizationItems(): Promise<MemorizationItem[]> {
  const user = await getCurrentUser();
  
  const { data, error } = await getSupabaseClient()
    .from('memorization_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  
  return data.map(convertDbItemToMemorizationItem);
}

export async function getMemorizationItem(id: string): Promise<MemorizationItem | null> {
  const user = await getCurrentUser();
  
  const { data, error } = await getSupabaseClient()
    .from('memorization_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return convertDbItemToMemorizationItem(data);
}

export async function clearAllMemorizationData(): Promise<void> {
  const user = await getCurrentUser();
  
  const { error } = await getSupabaseClient()
    .from('memorization_items')
    .delete()
    .eq('user_id', user.id);
    
  if (error) throw error;
  
  await updateLastSync();
}

// =============================================
// BATCH OPERATIONS
// =============================================

export async function batchUpdateMemorizationItems(items: MemorizationItem[]): Promise<void> {
  const user = await getCurrentUser();
  
  // Convert items to database format
  const dbItems = items.map(item => convertMemorizationItemToDbItem(item, user.id));
  
  // Use upsert for batch update
  const { error } = await getSupabaseClient()
    .from('memorization_items')
    .upsert(dbItems, { onConflict: 'id' });
    
  if (error) throw error;
}

export async function batchAddMemorizationItems(items: MemorizationItem[]): Promise<void> {
  const user = await getCurrentUser();
  
  // Convert items to database format
  const dbItems = items.map(item => convertMemorizationItemToDbItem(item, user.id));
  
  // Use upsert for batch insert
  const { error } = await getSupabaseClient()
    .from('memorization_items')
    .upsert(dbItems, { onConflict: 'id' });
    
  if (error) throw error;
}

// =============================================
// OPTIMIZED QUERIES
// =============================================

export async function getMemorizationItemsWithFilters(filters: {
  dueToday?: boolean;
  upcoming?: boolean;
  completedToday?: boolean;
  limit?: number;
}): Promise<MemorizationItem[]> {
  const user = await getCurrentUser();
  const today = getTodayISODate();
  
  let query = getSupabaseClient()
    .from('memorization_items')
    .select('*')
    .eq('user_id', user.id);
  
  if (filters.dueToday) {
    query = query.lte('next_review', today);
  }
  
  if (filters.upcoming) {
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekFromNowStr = weekFromNow.toISOString().split('T')[0];
    query = query.gte('next_review', today).lte('next_review', weekFromNowStr);
  }
  
  if (filters.completedToday) {
    query = query.eq('completed_today', today);
  }
  
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  return data.map(convertDbItemToMemorizationItem);
}

export async function getMemorizationStats(): Promise<{
  totalItems: number;
  dueToday: number;
  upcoming: number;
  completedToday: number;
  totalReviews: number;
}> {
  const user = await getCurrentUser();
  const today = getTodayISODate();
  
  // Get all items for this user
  const { data, error } = await getSupabaseClient()
    .from('memorization_items')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) throw error;
  
  const items = data.map(convertDbItemToMemorizationItem);
  
  const totalItems = items.length;
  const dueToday = items.filter(item => item.nextReview <= today).length;
  const completedToday = items.filter(item => item.completedToday === today).length;
  const totalReviews = items.reduce((sum, item) => sum + item.reviewCount, 0);
  
  // Calculate upcoming (next 7 days)
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekFromNowStr = weekFromNow.toISOString().split('T')[0];
  const upcoming = items.filter(item => 
    item.nextReview >= today && item.nextReview <= weekFromNowStr
  ).length;
  
  return {
    totalItems,
    dueToday,
    upcoming,
    completedToday,
    totalReviews
  };
}

// =============================================
// MISTAKES TRACKING
// =============================================

export interface MistakeData {
  timestamp: string;
  surah: number;
  ayah: number;
}

export async function getMistakes(): Promise<Record<string, MistakeData>> {
  const user = await getCurrentUser();
  
  const { data, error } = await getSupabaseClient()
    .from('mistakes')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) throw error;
  
  const mistakes: Record<string, MistakeData> = {};
  data.forEach(mistake => {
    const key = `${mistake.surah}:${mistake.ayah}`;
    mistakes[key] = {
      timestamp: mistake.timestamp,
      surah: mistake.surah,
      ayah: mistake.ayah,
    };
  });
  
  return mistakes;
}

export async function saveMistakes(mistakes: Record<string, MistakeData>): Promise<void> {
  const user = await getCurrentUser();
  
  // Clear existing mistakes and insert new ones
  const { error: deleteError } = await getSupabaseClient()
    .from('mistakes')
    .delete()
    .eq('user_id', user.id);
    
  if (deleteError) throw deleteError;
  
  const mistakesList = Object.values(mistakes).map(mistake => ({
    user_id: user.id,
    surah: mistake.surah,
    ayah: mistake.ayah,
    timestamp: mistake.timestamp,
  }));
  
  if (mistakesList.length > 0) {
    const { error: insertError } = await getSupabaseClient()
      .from('mistakes')
      .insert(mistakesList);
      
    if (insertError) throw insertError;
  }
}

export async function toggleMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData>> {
  const user = await getCurrentUser();
  
  const { data: existing, error: fetchError } = await getSupabaseClient()
    .from('mistakes')
    .select('*')
    .eq('user_id', user.id)
    .eq('surah', surahNumber)
    .eq('ayah', ayahNumber)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  
  if (existing) {
    // Remove mistake
    const { error: deleteError } = await getSupabaseClient()
      .from('mistakes')
      .delete()
      .eq('user_id', user.id)
      .eq('surah', surahNumber)
      .eq('ayah', ayahNumber);
      
    if (deleteError) throw deleteError;
  } else {
    // Add mistake
    const { error: insertError } = await getSupabaseClient()
      .from('mistakes')
      .insert({
        user_id: user.id,
        surah: surahNumber,
        ayah: ayahNumber,
        timestamp: new Date().toISOString(),
      });
      
    if (insertError) throw insertError;
  }
  
  return await getMistakes();
}

export async function showMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData>> {
  const user = await getCurrentUser();
  
  const { error } = await getSupabaseClient()
    .from('mistakes')
    .upsert({
      user_id: user.id,
      surah: surahNumber,
      ayah: ayahNumber,
      timestamp: new Date().toISOString(),
    }, { onConflict: 'user_id,surah,ayah' });
    
  if (error) throw error;
  
  return await getMistakes();
}

export async function removeMistake(surahNumber: number, ayahNumber: number): Promise<Record<string, MistakeData>> {
  const user = await getCurrentUser();
  
  const { error } = await getSupabaseClient()
    .from('mistakes')
    .delete()
    .eq('user_id', user.id)
    .eq('surah', surahNumber)
    .eq('ayah', ayahNumber);
    
  if (error) throw error;
  
  return await getMistakes();
}

export async function clearAllMistakes(): Promise<void> {
  const user = await getCurrentUser();
  
  const { error } = await getSupabaseClient()
    .from('mistakes')
    .delete()
    .eq('user_id', user.id);
    
  if (error) throw error;
}

export async function getMistakesList(): Promise<MistakeData[]> {
  const user = await getCurrentUser();
  
  const { data, error } = await getSupabaseClient()
    .from('mistakes')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false });
    
  if (error) throw error;
  
  return data.map(mistake => ({
    timestamp: mistake.timestamp,
    surah: mistake.surah,
    ayah: mistake.ayah,
  }));
}

export async function getMistakesInVerseOrder(): Promise<MistakeData[]> {
  const user = await getCurrentUser();
  
  const { data, error } = await getSupabaseClient()
    .from('mistakes')
    .select('*')
    .eq('user_id', user.id)
    .order('surah', { ascending: true })
    .order('ayah', { ascending: true });
    
  if (error) throw error;
  
  return data.map(mistake => ({
    timestamp: mistake.timestamp,
    surah: mistake.surah,
    ayah: mistake.ayah,
  }));
}

export async function getNextMistakeInVerseOrder(
  currentSurah: number, 
  currentAyah: number, 
  pageAyahs?: Array<{ surah?: { number: number }; numberInSurah: number }>
): Promise<MistakeData | null> {
  const mistakesInOrder = await getMistakesInVerseOrder();
  
  if (mistakesInOrder.length === 0) {
    return null;
  }
  
  // Same logic as the original function
  if (pageAyahs && pageAyahs.length > 0) {
    const currentPageMistakes = mistakesInOrder.filter(mistake => {
      return pageAyahs.some(ayah => 
        ayah.surah?.number === mistake.surah && 
        ayah.numberInSurah === mistake.ayah
      );
    });
    
    const nextPageMistake = currentPageMistakes.find(mistake => 
      mistake.surah > currentSurah || 
      (mistake.surah === currentSurah && mistake.ayah > currentAyah)
    );
    
    if (nextPageMistake) {
      return nextPageMistake;
    }
  }
  
  const nextMistake = mistakesInOrder.find(mistake => 
    mistake.surah > currentSurah || 
    (mistake.surah === currentSurah && mistake.ayah > currentAyah)
  );
  
  return nextMistake || mistakesInOrder[0];
}

// =============================================
// USER SETTINGS
// =============================================

export async function getUserSettings(): Promise<DbUserSettings> {
  const user = await getCurrentUser();
  
  const { data, error } = await getSupabaseClient()
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  if (error) throw error;
  
  return data;
}

export async function updateUserSettings(settings: Partial<Database['public']['Tables']['user_settings']['Update']>): Promise<void> {
  const user = await getCurrentUser();
  
  const { error } = await getSupabaseClient()
    .from('user_settings')
    .update(settings)
    .eq('user_id', user.id);
    
  if (error) throw error;
}

// Specific setting functions for compatibility
export async function saveSelectedReciter(reciter: string): Promise<void> {
  await updateUserSettings({ selected_reciter: reciter });
}

export async function loadSelectedReciter(): Promise<string> {
  try {
    const settings = await getUserSettings();
    return settings.selected_reciter;
  } catch {
    return 'ar.alafasy';
  }
}

export async function saveHideMistakesSetting(hideMistakes: boolean): Promise<void> {
  await updateUserSettings({ hide_mistakes: hideMistakes });
}

export async function getHideMistakesSetting(): Promise<boolean> {
  try {
    const settings = await getUserSettings();
    return settings.hide_mistakes;
  } catch {
    return false;
  }
}

export async function saveLastPage(page: number): Promise<void> {
  await updateUserSettings({ last_page: page });
}

export async function loadLastPage(): Promise<number> {
  try {
    const settings = await getUserSettings();
    return settings.last_page;
  } catch {
    return 1;
  }
}

export async function saveFontSettings(fontSettings: {
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
  await updateUserSettings({
    arabic_font_size: fontSettings.arabicFontSize,
    translation_font_size: fontSettings.translationFontSize,
    font_target_arabic: fontSettings.fontTargetArabic,
    font_size: fontSettings.fontSize,
    padding: fontSettings.padding,
    layout_mode: fontSettings.layoutMode,
    selected_language: fontSettings.selectedLanguage || 'en',
    selected_translation: fontSettings.selectedTranslation || 'en.asad',
    enable_tajweed: fontSettings.enableTajweed ?? true,
  });
}

export async function loadFontSettings() {
  try {
    const settings = await getUserSettings();
    return {
      arabicFontSize: settings.arabic_font_size,
      translationFontSize: settings.translation_font_size,
      fontTargetArabic: settings.font_target_arabic,
      fontSize: settings.font_size,
      padding: settings.padding,
      layoutMode: settings.layout_mode,
      selectedLanguage: settings.selected_language,
      selectedTranslation: settings.selected_translation,
      enableTajweed: settings.enable_tajweed,
    };
  } catch {
    return {
      arabicFontSize: 24,
      translationFontSize: 20,
      fontTargetArabic: true,
      fontSize: 24,
      padding: 16,
      layoutMode: 'single' as const,
      selectedLanguage: 'en',
      selectedTranslation: 'en.asad',
      enableTajweed: true,
    };
  }
}

// Audio settings
export async function saveAudioSettings(settings: {
  loopMode?: string;
  customLoop?: any;
  playbackSpeed?: number;
}): Promise<void> {
  const updates: any = {};
  if (settings.loopMode !== undefined) updates.audio_loop_mode = settings.loopMode;
  if (settings.customLoop !== undefined) updates.audio_custom_loop = settings.customLoop;
  if (settings.playbackSpeed !== undefined) updates.audio_playback_speed = settings.playbackSpeed;
  
  if (Object.keys(updates).length > 0) {
    await updateUserSettings(updates);
  }
}

export async function loadAudioSettings() {
  try {
    const settings = await getUserSettings();
    return {
      loopMode: settings.audio_loop_mode,
      customLoop: settings.audio_custom_loop,
      playbackSpeed: settings.audio_playback_speed,
    };
  } catch {
    return {
      loopMode: 'none',
      customLoop: {},
      playbackSpeed: 1.0,
    };
  }
}

// UI settings
export async function saveUISettings(settings: {
  showWordByWordTooltip?: boolean;
  mobileHeaderHidden?: boolean;
  userTimeZone?: string;
}): Promise<void> {
  const updates: any = {};
  if (settings.showWordByWordTooltip !== undefined) updates.show_word_by_word_tooltip = settings.showWordByWordTooltip;
  if (settings.mobileHeaderHidden !== undefined) updates.mobile_header_hidden = settings.mobileHeaderHidden;
  if (settings.userTimeZone !== undefined) updates.user_timezone = settings.userTimeZone;
  
  if (Object.keys(updates).length > 0) {
    await updateUserSettings(updates);
  }
}

export async function loadUISettings() {
  try {
    const settings = await getUserSettings();
    return {
      showWordByWordTooltip: settings.show_word_by_word_tooltip,
      mobileHeaderHidden: settings.mobile_header_hidden,
      userTimeZone: settings.user_timezone,
    };
  } catch {
    return {
      showWordByWordTooltip: false,
      mobileHeaderHidden: false,
      userTimeZone: null,
    };
  }
}

// =============================================
// STORAGE METADATA
// =============================================

async function updateLastSync(): Promise<void> {
  const user = await getCurrentUser();
  
  const { error } = await getSupabaseClient()
    .from('storage_metadata')
    .update({ last_sync: new Date().toISOString() })
    .eq('user_id', user.id);
    
  if (error) throw error;
}

export async function getStorageMetadata() {
  const user = await getCurrentUser();
  
  const { data, error } = await getSupabaseClient()
    .from('storage_metadata')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  if (error) throw error;
  
  return {
    lastSync: data.last_sync,
    version: data.version,
  };
}

// =============================================
// DATA MIGRATION
// =============================================

export async function migrateLocalStorageData(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const user = await getCurrentUser();
  
  try {
    // Import the original localStorage functions
    const { 
      loadMemorizationData: loadLocalData,
      getMistakes: getLocalMistakes,
      loadSelectedReciter: loadLocalReciter,
      getHideMistakesSetting: getLocalHideMistakes,
      loadLastPage: loadLocalLastPage,
      loadFontSettings: loadLocalFontSettings
    } = await import('../storage');
    
    // Migrate memorization data
    const localData = loadLocalData();
    if (localData.items.length > 0) {
      const dbItems = localData.items.map(item => convertMemorizationItemToDbItem(item, user.id));
      
      const { error } = await getSupabaseClient()
        .from('memorization_items')
        .upsert(dbItems, { onConflict: 'id' });
        
      if (error) throw error;
    }
    
    // Migrate mistakes
    const localMistakes = getLocalMistakes();
    if (Object.keys(localMistakes).length > 0) {
      // Convert format for database
      const dbMistakes: Record<string, MistakeData> = {};
      Object.entries(localMistakes).forEach(([key, value]) => {
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
      await saveMistakes(dbMistakes);
    }
    
    // Migrate settings
    const fontSettings = loadLocalFontSettings();
    const reciter = loadLocalReciter();
    const hideMistakes = getLocalHideMistakes();
    const lastPage = loadLocalLastPage();
    
    await updateUserSettings({
      selected_reciter: reciter,
      hide_mistakes: hideMistakes,
      last_page: lastPage,
      arabic_font_size: fontSettings.arabicFontSize,
      translation_font_size: fontSettings.translationFontSize,
      font_target_arabic: fontSettings.fontTargetArabic,
      font_size: fontSettings.fontSize,
      padding: fontSettings.padding,
      layout_mode: fontSettings.layoutMode,
      selected_language: fontSettings.selectedLanguage,
      selected_translation: fontSettings.selectedTranslation,
      enable_tajweed: fontSettings.enableTajweed,
    });
    
    // Update sync metadata
    await updateLastSync();
    
    console.log('Data migration completed successfully');
  } catch (error) {
    console.error('Error during data migration:', error);
    throw error;
  }
}

// =============================================
// EXPORT/IMPORT FUNCTIONS
// =============================================

export async function exportData(): Promise<string> {
  const items = await getAllMemorizationItems();
  const metadata = await getStorageMetadata();
  
  const exportData = {
    items,
    lastSync: metadata.lastSync,
    version: metadata.version,
  };
  
  return JSON.stringify(exportData, null, 2);
}

export async function importData(jsonData: string): Promise<void> {
  const user = await getCurrentUser();
  
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid data format');
    }
    
    // Clear existing data
    await clearAllMemorizationData();
    
    // Import new data
    const dbItems = data.items.map((item: MemorizationItem) => 
      convertMemorizationItemToDbItem(item, user.id)
    );
    
    const { error } = await getSupabaseClient()
      .from('memorization_items')
      .insert(dbItems);
      
    if (error) throw error;
    
    await updateLastSync();
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new Error('Invalid import data format');
  }
}

// =============================================
// DAILY REVIEW DATA
// =============================================

export interface DailyReviewData {
  date: string;
  reviews: number;
  newItems: number;
  completedItems: number;
}

export async function getDailyReviewData(days: number = 30): Promise<DailyReviewData[]> {
  const user = await getCurrentUser();
  
  const { data, error } = await getSupabaseClient()
    .from('memorization_items')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) throw error;
  
  const today = new Date();
  const dailyData: { [key: string]: DailyReviewData } = {};
  
  // Initialize the last N days with zero counts
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = {
      date: dateStr,
      reviews: 0,
      newItems: 0,
      completedItems: 0
    };
  }
  
  // Process each item to count reviews and completions
  data.forEach(item => {
    if (item.last_reviewed) {
      const reviewDate = item.last_reviewed.split('T')[0];
      if (dailyData[reviewDate]) {
        dailyData[reviewDate].reviews += 1;
      }
    }
    
    if (item.completed_today) {
      const completedDate = item.completed_today;
      if (dailyData[completedDate]) {
        dailyData[completedDate].completedItems += 1;
      }
    }
    
    if (item.created_at) {
      const createdDate = item.created_at.split('T')[0];
      if (dailyData[createdDate]) {
        dailyData[createdDate].newItems += 1;
      }
    }
  });
  
  return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
}