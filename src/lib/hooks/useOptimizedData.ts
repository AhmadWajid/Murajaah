import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getHideMistakesSetting, 
  loadSelectedReciter, 
  loadFontSettings,
  getAllMemorizationItems,
  getMistakes,
  invalidateCache
} from '@/lib/storageService';

// Cache for user settings to prevent redundant API calls
const settingsCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UseOptimizedDataReturn {
  // User settings
  hideMistakes: boolean;
  selectedReciter: string;
  fontSettings: any;
  
  // Data
  memorizationItems: any[];
  mistakes: Record<string, any>;
  
  // Loading states
  isLoadingSettings: boolean;
  isLoadingData: boolean;
  
  // Actions
  refreshSettings: () => Promise<void>;
  refreshData: () => Promise<void>;
  invalidateSettingsCache: () => void;
}

export function useOptimizedData(): UseOptimizedDataReturn {
  const [hideMistakes, setHideMistakes] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState('Ayman Sowaid');
  const [fontSettings, setFontSettings] = useState<any>(null);
  const [memorizationItems, setMemorizationItems] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState<Record<string, any>>({});
  
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const isInitialized = useRef(false);

  // Load settings with caching
  const loadSettings = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && isInitialized.current) return;
    
    setIsLoadingSettings(true);
    
    try {
      // Load settings in parallel with caching
      const [hideMistakesResult, reciterResult, fontSettingsResult] = await Promise.all([
        getCachedSetting('hideMistakes', getHideMistakesSetting),
        getCachedSetting('selectedReciter', loadSelectedReciter),
        getCachedSetting('fontSettings', loadFontSettings)
      ]);
      
      setHideMistakes(hideMistakesResult);
      setSelectedReciter(reciterResult);
      setFontSettings(fontSettingsResult);
      
      isInitialized.current = true;
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  // Load data (memorization items and mistakes)
  const loadData = useCallback(async (forceRefresh = false) => {
    setIsLoadingData(true);
    
    try {
      const [items, mistakesData] = await Promise.all([
        getAllMemorizationItems(),
        getMistakes()
      ]);
      
      setMemorizationItems(items);
      setMistakes(mistakesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Cache helper function
  const getCachedSetting = async (key: string, fetchFn: () => Promise<any>): Promise<any> => {
    const cacheKey = `settings_${key}`;
    const cached = settingsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    const data = await fetchFn();
    settingsCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    });
    
    return data;
  };

  // Refresh functions
  const refreshSettings = useCallback(async () => {
    settingsCache.clear();
    await loadSettings(true);
  }, [loadSettings]);

  const refreshData = useCallback(async () => {
    invalidateCache();
    await loadData(true);
  }, [loadData]);

  const invalidateSettingsCache = useCallback(() => {
    settingsCache.clear();
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    hideMistakes,
    selectedReciter,
    fontSettings,
    memorizationItems,
    mistakes,
    isLoadingSettings,
    isLoadingData,
    refreshSettings,
    refreshData,
    invalidateSettingsCache
  };
} 