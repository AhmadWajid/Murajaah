import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllMemorizationItems, getMistakesList, getDailyReviewData } from '@/lib/storageService';
import { MemorizationItem, resetDailyCompletions, getDueItems, getUpcomingReviews } from '@/lib/spacedRepetition';
import { MistakeData, DailyReviewData } from '@/lib/supabase/database';

interface UseOptimizedDataReturn {
  // Data
  items: MemorizationItem[];
  dueItems: MemorizationItem[];
  upcomingItems: MemorizationItem[];
  mistakes: MistakeData[];
  chartData: DailyReviewData[];
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  refreshSilently: () => Promise<void>;
}

interface UseOptimizedDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  enableChartData?: boolean;
  chartDays?: number;
}

export function useOptimizedData(options: UseOptimizedDataOptions = {}): UseOptimizedDataReturn {
  const {
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes
    enableChartData = false,
    chartDays = 30
  } = options;

  // State
  const [items, setItems] = useState<MemorizationItem[]>([]);
  const [dueItems, setDueItems] = useState<MemorizationItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<MemorizationItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeData[]>([]);
  const [chartData, setChartData] = useState<DailyReviewData[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load data function
  const loadData = useCallback(async (showLoading = true, signal?: AbortSignal) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);

      // Create promises for parallel loading
      const promises = [
        getAllMemorizationItems(),
        getMistakesList()
      ];

      // Add chart data if enabled
      if (enableChartData) {
        promises.push(getDailyReviewData(chartDays));
      }

      // Load data in parallel
      const results = await Promise.all(promises);
      const [allItems, mistakesList] = results;
      const dailyData = enableChartData ? results[2] as DailyReviewData[] : [];

      // Check if request was cancelled
      if (signal?.aborted) return;

      // Reset daily completions for items completed on previous days
      const resetItems = resetDailyCompletions(allItems);
      
      const due = getDueItems(resetItems);
      const upcoming = getUpcomingReviews(resetItems, 7); // Next 7 days

      // Update state
      setItems(resetItems);
      setDueItems(due);
      setUpcomingItems(upcoming);
      setMistakes(mistakesList);
      if (enableChartData) {
        setChartData(dailyData);
      }
    } catch (err) {
      if (signal?.aborted) return;
      
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [enableChartData, chartDays]);

  // Refresh function
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadData(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadData]);

  // Silent refresh function
  const refreshSilently = useCallback(async () => {
    try {
      await loadData(false);
    } catch (err) {
      console.error('Silent refresh failed:', err);
    }
  }, [loadData]);

  // Initial load
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    loadData(true, controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadData]);

  // Auto refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      refreshSilently();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, refreshSilently]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    items,
    dueItems,
    upcomingItems,
    mistakes,
    chartData,
    isLoading,
    isRefreshing,
    error,
    refresh,
    refreshSilently
  };
} 