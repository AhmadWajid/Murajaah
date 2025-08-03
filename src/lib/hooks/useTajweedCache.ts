import { useState, useCallback, useRef } from 'react';

interface TajweedWord {
  id: string;
  location: string;
  surah: number;
  ayah: number;
  word: number;
  text: string;
  tajweedRules: any[];
}

interface TajweedCache {
  [key: string]: {
    data: TajweedWord[];
    timestamp: number;
    ttl: number;
  };
}

const TAJWEED_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function useTajweedCache() {
  const [cache, setCache] = useState<TajweedCache>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const abortControllers = useRef<Record<string, AbortController>>({});

  const getCacheKey = (surah: number, ayah: number): string => {
    return `tajweed_${surah}_${ayah}`;
  };

  const isCacheValid = useCallback((cacheKey: string): boolean => {
    const cached = cache[cacheKey];
    if (!cached) return false;
    
    return Date.now() - cached.timestamp < cached.ttl;
  }, [cache]);

  const getTajweedWords = useCallback(async (surah: number, ayah: number): Promise<TajweedWord[]> => {
    const cacheKey = getCacheKey(surah, ayah);
    
    // Check cache first
    if (isCacheValid(cacheKey)) {
      return cache[cacheKey].data;
    }

    // Cancel any existing request for this ayah
    if (abortControllers.current[cacheKey]) {
      abortControllers.current[cacheKey].abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllers.current[cacheKey] = controller;

    // Set loading state
    setLoadingStates(prev => ({ ...prev, [cacheKey]: true }));

    try {
      const response = await fetch(`/api/tajweed?action=words&surah=${surah}&ayah=${ayah}`, {
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tajweed words: ${response.statusText}`);
      }
      
      const data = await response.json();
      const words = data.words || [];

      // Cache the result
      setCache(prev => ({
        ...prev,
        [cacheKey]: {
          data: words,
          timestamp: Date.now(),
          ttl: TAJWEED_CACHE_TTL
        }
      }));

      return words;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, return empty array
        return [];
      }
      console.error('Error fetching tajweed words:', error);
      return [];
    } finally {
      // Clear loading state
      setLoadingStates(prev => ({ ...prev, [cacheKey]: false }));
      
      // Clean up abort controller
      delete abortControllers.current[cacheKey];
    }
  }, [cache, isCacheValid]);

  const isTajweedLoading = useCallback((surah: number, ayah: number): boolean => {
    const cacheKey = getCacheKey(surah, ayah);
    return loadingStates[cacheKey] || false;
  }, [loadingStates]);

  const clearCache = useCallback(() => {
    setCache({});
    setLoadingStates({});
    
    // Abort all pending requests
    Object.values(abortControllers.current).forEach(controller => {
      controller.abort();
    });
    abortControllers.current = {};
  }, []);

  const clearAyahCache = useCallback((surah: number, ayah: number) => {
    const cacheKey = getCacheKey(surah, ayah);
    
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });
    
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[cacheKey];
      return newStates;
    });
    
    // Abort pending request if any
    if (abortControllers.current[cacheKey]) {
      abortControllers.current[cacheKey].abort();
      delete abortControllers.current[cacheKey];
    }
  }, []);

  return {
    getTajweedWords,
    isTajweedLoading,
    clearCache,
    clearAyahCache
  };
} 