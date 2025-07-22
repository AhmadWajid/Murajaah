import { MemorizationItem } from './spacedRepetition';
import { STORAGE } from './constants';

const MEMORIZATION_STORAGE_KEY = 'quran-memorization-items';

export interface StorageData {
  items: MemorizationItem[];
  lastSync: string;
  version: string;
}

export function saveMemorizationData(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE.KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save memorization data:', error);
    throw new Error('Failed to save data to localStorage');
  }
}

export function loadMemorizationData(): StorageData {
  try {
    const stored = localStorage.getItem(STORAGE.KEY);
    if (!stored) {
      return {
        items: [],
        lastSync: new Date().toISOString(),
        version: STORAGE.VERSION,
      };
    }

    const data = JSON.parse(stored) as StorageData;
    
    // Validate data structure
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid data structure');
    }



    return data;
  } catch (error) {
    console.error('Failed to load memorization data:', error);
    // Return default data if loading fails
    return {
      items: [],
      lastSync: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

export function addMemorizationItem(item: MemorizationItem): void {
  const data = loadMemorizationData();
  
  // Check if item already exists
  const existingIndex = data.items.findIndex(existing => existing.id === item.id);
  
  if (existingIndex >= 0) {
    // Update existing item
    data.items[existingIndex] = item;
  } else {
    // Add new item
    data.items.push(item);
  }
  
  data.lastSync = new Date().toISOString();
  saveMemorizationData(data);
}

export function updateMemorizationItem(item: MemorizationItem): void {
  const data = loadMemorizationData();
  const index = data.items.findIndex(existing => existing.id === item.id);
  
  if (index >= 0) {
    data.items[index] = item;
    data.lastSync = new Date().toISOString();
    saveMemorizationData(data);
  }
}

export function updateMemorizationItemWithIndividualRating(
  itemId: string,
  ayahNumber: number,
  rating: 'easy' | 'medium' | 'hard'
): void {
  
  const data = loadMemorizationData();
  const itemIndex = data.items.findIndex(item => item.id === itemId);
  
  if (itemIndex >= 0) {
    const item = data.items[itemIndex];
    
    const { updateIndividualAyahRating } = require('./spacedRepetition');
    const result = updateIndividualAyahRating(item, ayahNumber, rating);
    
    if (result.shouldSplit && result.newItems) {
      // Remove the original item and add the new split items
      data.items.splice(itemIndex, 1);
      data.items.push(...result.newItems);
      
      // No longer needed - all items use unified storage
    } else {
      // Update the existing item
      data.items[itemIndex] = result.updatedItem;
      
      // No longer needed - all items use unified storage
    }
    
    data.lastSync = new Date().toISOString();
    saveMemorizationData(data);
  }
}

// Helper function no longer needed - all items use unified storage

export function removeMemorizationItem(id: string): void {
  const data = loadMemorizationData();
  
  // Find all items with this ID
  data.items = data.items.filter(item => item.id !== id);
  
  data.lastSync = new Date().toISOString();
  saveMemorizationData(data);
}

export function getAllMemorizationItems(): MemorizationItem[] {
  const data = loadMemorizationData();
  return data.items;
}

export function getMemorizationItem(id: string): MemorizationItem | null {
  const data = loadMemorizationData();
  return data.items.find(item => item.id === id) || null;
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE.KEY);
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}

export function exportData(): string {
  const data = loadMemorizationData();
  return JSON.stringify(data, null, 2);
}

export function importData(jsonData: string): void {
  try {
    const data = JSON.parse(jsonData) as StorageData;
    
    // Validate imported data
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Invalid data format');
    }
    
    saveMemorizationData(data);
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new Error('Invalid import data format');
  }
} 

// Complex Memorization Items Storage
// Complex storage functions are no longer needed - all items use unified storage

// Function to clean up duplicate items
export function cleanupDuplicateItems(): void {
  try {
    const data = loadMemorizationData();
    const originalCount = data.items.length;
    
    // Create a map to track unique items by ID
    const uniqueItems = new Map<string, MemorizationItem>();
    
    data.items.forEach(item => {
      if (uniqueItems.has(item.id)) {
        // Keep the item with the higher review count, or the more recent one
        const existing = uniqueItems.get(item.id)!;
        if (item.reviewCount > existing.reviewCount || 
            (item.reviewCount === existing.reviewCount && 
             new Date(item.lastReviewed || '').getTime() > new Date(existing.lastReviewed || '').getTime())) {
          uniqueItems.set(item.id, item);
        }
      } else {
        uniqueItems.set(item.id, item);
      }
    });
    
    // Convert map back to array
    data.items = Array.from(uniqueItems.values());
    
    if (originalCount !== data.items.length) {
      data.lastSync = new Date().toISOString();
      saveMemorizationData(data);
    }
  } catch (error) {
    console.error('Error cleaning up duplicate items:', error);
  }
}

// Migration function to fix date issues
export function migrateDateFormats(): void {
  try {
    const data = loadMemorizationData();
    const { getTodayISODate } = require('./utils');
    const today = getTodayISODate();
    
    let hasChanges = false;
    
    // Only fix overdue items, don't mess with date formats
    data.items.forEach(item => {
      
      // Only update if the item is actually overdue (not just a format issue)
      if (item.nextReview && item.nextReview < today) {
        item.nextReview = today;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      saveMemorizationData(data);
    }
  } catch (error) {
    console.error('Error during date migration:', error);
  }
} 

// Mistake tracking functions
export interface MistakeData {
  timestamp: string;
  surah: number;
  ayah: number;
}

export const getMistakes = (): Record<string, MistakeData | boolean> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const mistakes = localStorage.getItem('quran-mistakes');
    return mistakes ? JSON.parse(mistakes) : {};
  } catch (error) {
    console.error('Error loading mistakes:', error);
    return {};
  }
};

export const saveMistakes = (mistakes: Record<string, MistakeData | boolean>) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('quran-mistakes', JSON.stringify(mistakes));
  } catch (error) {
    console.error('Error saving mistakes:', error);
  }
};

export const toggleMistake = (surahNumber: number, ayahNumber: number) => {
  const mistakes = getMistakes();
  const key = `${surahNumber}:${ayahNumber}`;
  
  if (mistakes[key]) {
    delete mistakes[key];
  } else {
    mistakes[key] = {
      timestamp: new Date().toISOString(),
      surah: surahNumber,
      ayah: ayahNumber
    };
  }
  
  saveMistakes(mistakes);
  return mistakes;
};

// New function to handle mistake visibility when hide mode is enabled
export const showMistake = (surahNumber: number, ayahNumber: number) => {
  const mistakes = getMistakes();
  const key = `${surahNumber}:${ayahNumber}`;
  
  // If mistake doesn't exist, create it
  if (!mistakes[key]) {
    mistakes[key] = {
      timestamp: new Date().toISOString(),
      surah: surahNumber,
      ayah: ayahNumber
    };
    saveMistakes(mistakes);
  }
  
  return mistakes;
};

// Reciter selection storage
const RECITER_STORAGE_KEY = 'mquran_selected_reciter';

export const saveSelectedReciter = (reciter: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(RECITER_STORAGE_KEY, reciter);
  }
};

export const loadSelectedReciter = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(RECITER_STORAGE_KEY) || 'ar.alafasy';
  }
  return 'ar.alafasy';
};

export const removeMistake = (surahNumber: number, ayahNumber: number) => {
  const mistakes = getMistakes();
  const key = `${surahNumber}:${ayahNumber}`;
  
  if (mistakes[key]) {
    delete mistakes[key];
    saveMistakes(mistakes);
  }
  
  return mistakes;
};

export const clearAllMistakes = () => {
  saveMistakes({});
};

// Get mistakes with proper typing and sorting
export const getMistakesList = (): MistakeData[] => {
  const mistakes = getMistakes();
  const mistakesList: MistakeData[] = [];
  
  Object.entries(mistakes).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && 'timestamp' in value) {
      // New format with timestamp
      mistakesList.push(value as MistakeData);
    } else if (typeof value === 'boolean' && value === true) {
      // Legacy format - convert to new format
      const [surah, ayah] = key.split(':').map(Number);
      mistakesList.push({
        timestamp: new Date().toISOString(), // Default timestamp for legacy data
        surah,
        ayah
      });
    }
  });
  
  // Sort by timestamp (newest first)
  return mistakesList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Get mistakes sorted by verse order (surah number then ayah number)
export const getMistakesInVerseOrder = (): MistakeData[] => {
  const mistakes = getMistakes();
  const mistakesList: MistakeData[] = [];
  
  Object.entries(mistakes).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && 'timestamp' in value) {
      // New format with timestamp
      mistakesList.push(value as MistakeData);
    } else if (typeof value === 'boolean' && value === true) {
      // Legacy format - convert to new format
      const [surah, ayah] = key.split(':').map(Number);
      mistakesList.push({
        timestamp: new Date().toISOString(), // Default timestamp for legacy data
        surah,
        ayah
      });
    }
  });
  
  // Sort by verse order (surah first, then ayah)
  return mistakesList.sort((a, b) => {
    if (a.surah !== b.surah) {
      return a.surah - b.surah;
    }
    return a.ayah - b.ayah;
  });
};

// Get the next mistake in verse order after the current position, prioritizing current page
export const getNextMistakeInVerseOrder = (currentSurah: number, currentAyah: number, pageAyahs?: any[]): MistakeData | null => {
  const mistakesInOrder = getMistakesInVerseOrder();
  
  if (mistakesInOrder.length === 0) {
    return null;
  }
  
  // If we have page data, first try to find mistakes on the current page
  if (pageAyahs && pageAyahs.length > 0) {
    // Get all ayahs on current page
    const currentPageMistakes = mistakesInOrder.filter(mistake => {
      return pageAyahs.some(ayah => 
        ayah.surah?.number === mistake.surah && 
        ayah.numberInSurah === mistake.ayah
      );
    });
    
    // Find next mistake on current page after current position
    const nextPageMistake = currentPageMistakes.find(mistake => 
      mistake.surah > currentSurah || 
      (mistake.surah === currentSurah && mistake.ayah > currentAyah)
    );
    
    // If found a mistake on current page, return it
    if (nextPageMistake) {
      return nextPageMistake;
    }
  }
  
  // No mistakes left on current page, find next mistake in entire Quran
  const nextMistake = mistakesInOrder.find(mistake => 
    mistake.surah > currentSurah || 
    (mistake.surah === currentSurah && mistake.ayah > currentAyah)
  );
  
  // If no next mistake found, wrap around to the first mistake
  return nextMistake || mistakesInOrder[0];
};

// Get review data per day for charting
export interface DailyReviewData {
  date: string;
  reviews: number;
  newItems: number;
  completedItems: number;
}

export const getDailyReviewData = (days: number = 30): DailyReviewData[] => {
  const data = loadMemorizationData();
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
  data.items.forEach(item => {
    // Count reviews based on lastReviewed date
    if (item.lastReviewed) {
      const reviewDate = item.lastReviewed.split('T')[0];
      if (dailyData[reviewDate]) {
        dailyData[reviewDate].reviews += 1;
      }
    }
    
    // Count items completed today (based on completedToday field)
    if (item.completedToday) {
      const completedDate = item.completedToday.split('T')[0];
      if (dailyData[completedDate]) {
        dailyData[completedDate].completedItems += 1;
      }
    }
    
    // Count new items created (based on createdAt date)
    if (item.createdAt) {
      const createdDate = item.createdAt.split('T')[0];
      if (dailyData[createdDate]) {
        dailyData[createdDate].newItems += 1;
      }
    }
  });
  
  // Convert to array and sort by date
  return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
};

// Hide mistakes setting functions
export const getHideMistakesSetting = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const setting = localStorage.getItem('quran-hide-mistakes');
    return setting ? JSON.parse(setting) : false;
  } catch (error) {
    console.error('Error loading hide mistakes setting:', error);
    return false;
  }
};

export const saveHideMistakesSetting = (hideMistakes: boolean) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('quran-hide-mistakes', JSON.stringify(hideMistakes));
  } catch (error) {
    console.error('Error saving hide mistakes setting:', error);
  }
};

// Last page tracking
export const saveLastPage = (page: number) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('quran-last-page', JSON.stringify(page));
  } catch (error) {
    console.error('Failed to save last page:', error);
  }
};

export const loadLastPage = (): number => {
  try {
    const stored = localStorage.getItem('quran-last-page');
    return stored ? parseInt(stored, 10) : 1;
  } catch (error) {
    console.error('Failed to load last page:', error);
    return 1;
  }
};

// Font Settings Storage
export const saveFontSettings = (settings: {
  arabicFontSize: number;
  translationFontSize: number;
  fontTargetArabic: boolean;
  fontSize: number;
  padding: number;
  layoutMode: 'spread' | 'single';
  selectedLanguage?: string;
  selectedTranslation?: string;
  enableTajweed?: boolean;
}) => {
  try {
    localStorage.setItem('quran-font-settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save font settings:', error);
  }
};

export const loadFontSettings = () => {
  try {
    if (typeof window === 'undefined') {
      return {
        arabicFontSize: 24,
        translationFontSize: 20,
        fontTargetArabic: true,
        fontSize: 24,
        padding: 16,
        layoutMode: 'single' as const,
        selectedLanguage: 'en',
        selectedTranslation: 'en.asad',
        enableTajweed: true
      };
    }
    const stored = localStorage.getItem('quran-font-settings');
    if (!stored) {
      return {
        arabicFontSize: 24,
        translationFontSize: 20,
        fontTargetArabic: true,
        fontSize: 24,
        padding: 16,
        layoutMode: 'single' as const,
        selectedLanguage: 'en',
        selectedTranslation: 'en.asad',
        enableTajweed: true
      };
    }
    const parsed = JSON.parse(stored);
    if (typeof parsed.enableTajweed === 'undefined') {
      parsed.enableTajweed = true;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load font settings:', error);
    return {
      arabicFontSize: 24,
      translationFontSize: 20,
      fontTargetArabic: true,
      fontSize: 24,
      padding: 16,
      layoutMode: 'single' as const,
      selectedLanguage: 'en',
      selectedTranslation: 'en.asad',
      enableTajweed: true
    };
  }
}; 