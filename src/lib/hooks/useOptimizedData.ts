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
  setMistakes: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  
  // Loading states
  isLoadingSettings: boolean;
  isLoadingData: boolean;
  
  // Actions
  refreshSettings: () => Promise<void>;
  refreshData: () => Promise<void>;
  refreshMistakesOnly: () => Promise<void>;
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

  const refreshMistakesOnly = useCallback(async () => {
    try {
      setIsLoadingData(true);
      // Force fresh data by invalidating cache first
      invalidateCache();
      const mistakesData = await getMistakes();
      setMistakes(mistakesData);
    } catch (error) {
      console.error('Error refreshing mistakes:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const invalidateSettingsCache = useCallback(() => {
    settingsCache.clear();
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Load data on mount
  useEffect(() => {
    // Clear any stale cache on mount to ensure fresh data
    invalidateCache();
    loadData();
  }, [loadData]);

  // Refresh data when page becomes visible (in case user navigated away and came back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized.current) {
        // Refresh data when page becomes visible to ensure consistency
        loadData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadData]);

  return {
    hideMistakes,
    selectedReciter,
    fontSettings,
    memorizationItems,
    mistakes,
    setMistakes,
    isLoadingSettings,
    isLoadingData,
    refreshSettings,
    refreshData,
    refreshMistakesOnly,
    invalidateSettingsCache
  };
} 