'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllMemorizationItems, updateMemorizationItem, removeMemorizationItem, cleanupDuplicateItems, getMistakesList, removeMistake, addMemorizationItem, batchUpdateMemorizationItems } from '@/lib/storageService';
import { MistakeData } from '@/lib/supabase/database';
import { generateMemorizationId, getTodayISODate } from '@/lib/utils';
import { MemorizationItem, updateInterval, resetDailyCompletions, getDueItems, getUpcomingReviews } from '@/lib/spacedRepetition';
import { formatAyahRange, formatAyahRangeArabic } from '@/lib/quran';
import { getSurahList, SurahListItem } from '@/lib/quranService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Trash2, CheckCircle, Edit, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import AppHeader from '@/components/AppHeader';
import ReviewCard from '@/components/ReviewCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import React from 'react';

interface GroupedItems {
  [date: string]: MemorizationItem[];
}

interface EditItemFormProps {
  item: MemorizationItem;
  onSave: (item: MemorizationItem) => void;
  onCancel: () => void;
}

function EditItemForm({ item, onSave, onCancel }: EditItemFormProps) {
  const [formData, setFormData] = useState({
    surah: item.surah,
    ayahStart: item.ayahStart,
    ayahEnd: item.ayahEnd,
    interval: item.interval,
    nextReview: item.nextReview,
    easeFactor: item.easeFactor,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate ayah range
    if (formData.ayahEnd < formData.ayahStart) {
      alert('End ayah must be greater than or equal to start ayah');
      return;
    }
    
    if (formData.surah < 1 || formData.surah > 114) {
      alert('Surah number must be between 1 and 114');
      return;
    }
    
    if (formData.ayahStart < 1 || formData.ayahEnd < 1) {
      alert('Ayah numbers must be greater than 0');
      return;
    }
    
    // Generate new ID if the range has changed
    const newId = generateMemorizationId(formData.surah, formData.ayahStart, formData.ayahEnd);
    
    onSave({
      ...item,
      ...formData,
      id: newId, // Update the ID to reflect the new range
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ayah Range Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium mb-2">Ayah Range</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Surah</label>
              <input
                type="number"
                value={formData.surah}
                onChange={(e) => setFormData({ ...formData, surah: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md text-sm"
                min="1"
                max="114"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Start Ayah</label>
              <input
                type="number"
                value={formData.ayahStart}
                onChange={(e) => setFormData({ ...formData, ayahStart: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">End Ayah</label>
              <input
                type="number"
                value={formData.ayahEnd}
                onChange={(e) => setFormData({ ...formData, ayahEnd: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md text-sm"
                min={formData.ayahStart}
              />
            </div>
          </div>
        </div>

        <div>
        <label className="block text-sm font-medium mb-2">Interval (days)</label>
          <input
            type="number"
          value={formData.interval}
          onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
          className="w-full p-2 border rounded-md"
            min="1"
          />
        </div>
        <div>
        <label className="block text-sm font-medium mb-2">Next Review Date</label>
          <input
          type="date"
          value={formData.nextReview}
          onChange={(e) => setFormData({ ...formData, nextReview: e.target.value })}
          className="w-full p-2 border rounded-md"
          />
        </div>
        <div>
        <label className="block text-sm font-medium mb-2">Ease Factor</label>
          <input
            type="number"
          value={formData.easeFactor}
          onChange={(e) => setFormData({ ...formData, easeFactor: parseFloat(e.target.value) })}
          className="w-full p-2 border rounded-md"
          step="0.1"
          min="1.3"
          max="2.5"
          />
        </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data states
  const [items, setItems] = useState<MemorizationItem[]>([]);
  const [dueItems, setDueItems] = useState<MemorizationItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<MemorizationItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeData[]>([]);
  const [surahList, setSurahList] = useState<SurahListItem[]>([]);
  
  // UI states
  const [expandedSurahs, setExpandedSurahs] = useState<Set<number>>(new Set());
  const [editingItem, setEditingItem] = useState<MemorizationItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showMistakeDeleteConfirm, setShowMistakeDeleteConfirm] = useState<{ surah: number; ayah?: number; deleteAll?: boolean } | null>(null);
  const [reviewingItem, setReviewingItem] = useState<MemorizationItem | null>(null);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [collapseAll, setCollapseAll] = useState(false);

  // Optimized data loading with caching
  const loadAllData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      // Load data in parallel
      const [allItems, mistakesList] = await Promise.all([
        getAllMemorizationItems(),
        getMistakesList()
      ]);
      
      // Reset daily completions for items completed on previous days
      const resetItems = resetDailyCompletions(allItems);
      
      // Batch save items that were reset (if they changed) - only save if there are changes
      const itemsToUpdate = resetItems.filter(item => {
        const originalItem = allItems.find(original => original.id === item.id);
        return originalItem && originalItem.completedToday !== item.completedToday;
      });
      
      // Update items in parallel instead of sequentially
      if (itemsToUpdate.length > 0) {
        await batchUpdateMemorizationItems(itemsToUpdate);
      }
      
      // Update allItems with the reset items
      const finalItems = resetItems;
      
      const due = getDueItems(finalItems);
      const upcoming = getUpcomingReviews(finalItems, 7); // Next 7 days

      setItems(finalItems);
      setDueItems(due);
      setUpcomingItems(upcoming);
      setMistakes(mistakesList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadAllData();
    loadSurahList();
  }, [loadAllData]);

  // Refresh data every 5 minutes instead of every minute to reduce load
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        loadAllData(false);
      });
    }, 300000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  const loadSurahList = async () => {
    try {
      const surahs = await getSurahList();
      setSurahList(surahs);
    } catch {
      // Error loading surah list - silently handled
    }
  };

  const getPriorityText = useCallback((item: MemorizationItem) => {
    const today = getTodayISODate();
    
    if (item.nextReview < today) return 'Overdue';
    if (item.nextReview === today) return 'Due Today';
    
    // Calculate days until review for future dates
    const daysUntilReview = Math.ceil((new Date(item.nextReview).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilReview <= 3) return 'Due Soon';
    return 'Upcoming';
  }, []);

  // Memoized computed values
  const getCompletedTodayItems = useMemo(() => {
    const today = getTodayISODate();
    return items.filter(item => item.completedToday === today);
  }, [items]);

  const getUpcomingItemsExcludingCompleted = useMemo(() => {
    const today = getTodayISODate();
    return upcomingItems.filter(item => item.completedToday !== today);
  }, [upcomingItems]);

  const groupItemsByDate = useCallback((items: MemorizationItem[]): GroupedItems => {
    const grouped: GroupedItems = {};
    
    items.forEach(item => {
      const date = parseLocalDate(item.nextReview).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    
    // Sort dates
    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    );
  }, []);

  // Helper function to parse ISO date string as local date
  const parseLocalDate = useCallback((isoDateString: string) => {
    const [year, month, day] = isoDateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 because months are 0-indexed
  }, []);

  const getDateLabel = useCallback((date: string) => {
    const today = new Date().toLocaleDateString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString();
    
    if (date === today) return 'Today';
    if (date === tomorrow) return 'Tomorrow';
    return date;
  }, []);

  const handleQuickReview = useCallback(async (item: MemorizationItem, rating: 'easy' | 'medium' | 'hard') => {
    try {
      // Optimistic update - update UI immediately
      const updatedItem = updateInterval(item, rating);
      
      // Update local state immediately for better UX
      setItems(prevItems => 
        prevItems.map(prevItem => 
          prevItem.id === item.id ? updatedItem : prevItem
        )
      );
      
      // Update due and upcoming items
      setDueItems(prevDue => 
        prevDue.map(prevItem => 
          prevItem.id === item.id ? updatedItem : prevItem
        )
      );
      
      setUpcomingItems(prevUpcoming => 
        prevUpcoming.map(prevItem => 
          prevItem.id === item.id ? updatedItem : prevItem
        )
      );
      
      // Save to storage in background
      await updateMemorizationItem(updatedItem);
      
      // Show success message
      const ratingText = rating === 'easy' ? 'Easy' : rating === 'medium' ? 'Medium' : 'Hard';
      alert(`✅ Rated ${formatAyahRange(item.surah, item.ayahStart, item.ayahEnd)} as ${ratingText}`);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
      // Reload data on error to ensure consistency
      await loadAllData(false);
    }
  }, [loadAllData]);

  const handleDelete = useCallback(async (itemId: string) => {
    try {
      // Optimistic update - remove from UI immediately
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      setDueItems(prevDue => prevDue.filter(item => item.id !== itemId));
      setUpcomingItems(prevUpcoming => prevUpcoming.filter(item => item.id !== itemId));
      
      setShowDeleteConfirm(null);
      
      // Delete from storage in background
      await removeMemorizationItem(itemId);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
      // Reload data on error to ensure consistency
      await loadAllData(false);
    }
  }, [loadAllData]);

  const handleDeleteMistake = useCallback(async (surahNumber: number, ayahNumber: number) => {
    try {
      // Optimistic update - remove from UI immediately
      setMistakes(prevMistakes => 
        prevMistakes.filter(mistake => 
          !(mistake.surah === surahNumber && mistake.ayah === ayahNumber)
        )
      );
      
      setShowMistakeDeleteConfirm(null);
      
      // Delete from storage in background
      await removeMistake(surahNumber, ayahNumber);
    } catch (error) {
      console.error('Error deleting mistake:', error);
      alert('Failed to delete mistake. Please try again.');
      // Reload data on error to ensure consistency
      await loadAllData(false);
    }
  }, [loadAllData]);

  const handleDeleteAllMistakesInSurah = useCallback(async (surahNumber: number) => {
    try {
      // Optimistic update - remove all mistakes for this surah from UI immediately
      setMistakes(prevMistakes => 
        prevMistakes.filter(mistake => mistake.surah !== surahNumber)
      );
      
      setShowMistakeDeleteConfirm(null);
      
      // Delete from storage in background
      const surahMistakes = groupedMistakes[surahNumber] || [];
      for (const mistake of surahMistakes) {
        await removeMistake(surahNumber, mistake.ayah);
      }
    } catch (error) {
      console.error('Error deleting mistakes:', error);
      alert('Failed to delete mistakes. Please try again.');
      // Reload data on error to ensure consistency
      await loadAllData(false);
    }
  }, [loadAllData]);

  const handleEdit = useCallback((item: MemorizationItem) => {
    setEditingItem(item);
  }, []);

  const handleSaveEdit = useCallback(async (updatedItem: MemorizationItem) => {
    try {
      // Optimistic update - update UI immediately
      setItems(prevItems => 
        prevItems.map(prevItem => 
          prevItem.id === editingItem?.id ? updatedItem : prevItem
        )
      );
      
      setDueItems(prevDue => 
        prevDue.map(prevItem => 
          prevItem.id === editingItem?.id ? updatedItem : prevItem
        )
      );
      
      setUpcomingItems(prevUpcoming => 
        prevUpcoming.map(prevItem => 
          prevItem.id === editingItem?.id ? updatedItem : prevItem
        )
      );
      
      setEditingItem(null);
      
      // Save to storage in background
      if (editingItem && updatedItem.id !== editingItem.id) {
        // If the ID has changed (range was modified), we need to handle it carefully
        await addMemorizationItem(updatedItem);
        await removeMemorizationItem(editingItem.id);
      } else {
        // Just update the existing item
        await updateMemorizationItem(updatedItem);
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes. Please try again.');
      // Reload data on error to ensure consistency
      await loadAllData(false);
    }
  }, [editingItem, loadAllData]);

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
  }, []);

  // Group mistakes by surah - memoized
  const groupedMistakes = useMemo(() => {
    const grouped: { [surah: number]: MistakeData[] } = {};
    mistakes.forEach(mistake => {
      if (!grouped[mistake.surah]) {
        grouped[mistake.surah] = [];
      }
      grouped[mistake.surah].push(mistake);
    });
    
    // Sort ayahs within each surah
    Object.keys(grouped).forEach(surah => {
      grouped[parseInt(surah)].sort((a, b) => a.ayah - b.ayah);
    });
    
    return grouped;
  }, [mistakes]);

  const toggleSurahExpansion = useCallback((surahNumber: number) => {
    setExpandedSurahs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(surahNumber)) {
        newSet.delete(surahNumber);
      } else {
        newSet.add(surahNumber);
      }
      return newSet;
    });
  }, []);

  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    startTransition(() => {
      loadAllData(false).finally(() => {
        setIsRefreshing(false);
      });
    });
  }, [loadAllData]);

  // Helper to sort items by nextReview ascending, then by surah number ascending for same-day items
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.nextReview).getTime();
      const dateB = new Date(b.nextReview).getTime();
      if (dateA !== dateB) return dateA - dateB;
      // If same date, sort by surah number ascending
      if (a.surah !== b.surah) return a.surah - b.surah;
      // If same surah, sort by ayahStart ascending
      return a.ayahStart - b.ayahStart;
    });
  }, [items]);

  // Helper to assign a color class for each date group
  const dateColorMap = useMemo(() => {
    const colorMap: Record<string, string> = {};
    const colorClasses = [
      'bg-blue-50 dark:bg-blue-950/20',
      'bg-yellow-50 dark:bg-yellow-950/20',
      'bg-purple-50 dark:bg-purple-950/20',
      'bg-pink-50 dark:bg-pink-950/20',
      'bg-orange-50 dark:bg-orange-950/20',
      'bg-cyan-50 dark:bg-cyan-950/20',
      'bg-lime-50 dark:bg-lime-950/20',
    ];
    let colorIndex = 0;
    sortedItems.forEach(item => {
      const date = item.nextReview;
      if (!colorMap[date]) {
        colorMap[date] = colorClasses[colorIndex % colorClasses.length];
        colorIndex++;
      }
    });
    return colorMap;
  }, [sortedItems]);

  // Effect to collapse/expand all groups when collapseAll changes
  useEffect(() => {
    const newState: Record<string, boolean> = {};
    Object.keys(groupedByDate).forEach(date => {
      newState[date] = !collapseAll; // ON = expanded, OFF = collapsed
    });
    setExpandedDates(newState);
  }, [collapseAll, items, groupItemsByDate]);

  // Group sortedItems by nextReview date
  const groupedByDate = useMemo(() => {
    const grouped: Record<string, typeof sortedItems> = {};
    sortedItems.forEach(item => {
      if (!grouped[item.nextReview]) grouped[item.nextReview] = [];
      grouped[item.nextReview].push(item);
    });
    return grouped;
  }, [sortedItems]);

  // Helper to toggle expand/collapse
  const toggleDateExpand = useCallback((date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader pageType="home" />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your memorization data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader 
        pageType="home" 
        onRefresh={refreshData}
      />

      <main className="container mx-auto px-4 py-6">
        {/* Loading indicator for refresh */}
        {isRefreshing && (
          <div className="fixed top-20 right-4 z-50 bg-background border rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Refreshing...</span>
          </div>
        )}

        {/* Mistakes Section */}
        {mistakes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
              </div>
              <h2 className="text-lg font-semibold">Mistakes to Review ({mistakes.length})</h2>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {Object.entries(groupedMistakes).map(([surah, surahMistakes]) => {
                    const surahNumber = parseInt(surah);
                    const surahName = surahList.find(s => s.number === surahNumber)?.name || `Surah ${surahNumber}`;
                    const isExpanded = expandedSurahs.has(surahNumber);
                    
                    // Group consecutive ayahs
                    let ayahRanges: { start: number; end: number; mistakes: MistakeData[] }[] = [];
                    let currentRange: { start: number; end: number; mistakes: MistakeData[] } | null = null;
                    
                    // Sort mistakes by ayah number to ensure correct range grouping
                    const sortedMistakes = [...surahMistakes].sort((a, b) => a.ayah - b.ayah);
                    sortedMistakes.forEach(mistake => {
                      if (!currentRange) {
                        currentRange = { start: mistake.ayah, end: mistake.ayah, mistakes: [mistake] };
                      } else if (mistake.ayah === currentRange.end + 1) {
                        currentRange.end = mistake.ayah;
                        currentRange.mistakes.push(mistake);
                      } else {
                        ayahRanges.push(currentRange);
                        currentRange = { start: mistake.ayah, end: mistake.ayah, mistakes: [mistake] };
                      }
                    });
                    if (currentRange) {
                      ayahRanges.push(currentRange);
                    }
                    // Sort ayahRanges by start ayah to ensure smallest is first
                    ayahRanges = ayahRanges.sort((a, b) => a.start - b.start);
                    const totalMistakes = surahMistakes.length;
                    const latestMistake = surahMistakes.sort((a, b) => 
                      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )[0];
                    
                    return (
                      <div key={surah} className="border-b last:border-b-0">
                        {/* Surah Header - Always Visible */}
                        <div 
                          className="flex items-center justify-between p-4 hover:bg-red-50/30 dark:hover:bg-red-950/10 cursor-pointer"
                          onClick={() => toggleSurahExpansion(surahNumber)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                              )}
                              <div>
                                <div className="font-medium text-sm">
                                  {surahName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {totalMistakes} mistake{totalMistakes > 1 ? 's' : ''} • {ayahRanges.length} range{ayahRanges.length > 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-muted-foreground">
                              {new Date(latestMistake.timestamp).toLocaleDateString()}
                            </div>
                            <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs">
                              <Link href={`/quran?surah=${surahNumber}&ayah=${ayahRanges[0].start}`}>
                                Review All
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMistakeDeleteConfirm({ surah: surahNumber, deleteAll: true });
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="bg-red-50/20 dark:bg-red-950/10 border-t">
                            <div className="p-4 space-y-3">
                              <div className="text-xs font-medium text-red-700 dark:text-red-300 uppercase tracking-wide">
                                Ayah Ranges
                              </div>
                              {ayahRanges.map((range, rangeIndex) => {
                                const ayahText = range.start === range.end 
                                  ? `${range.start}` 
                                  : `${range.start}-${range.end}`;
                                const rangeLatestMistake = range.mistakes.sort((a, b) => 
                                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                                )[0];
                                
                                return (
                                  <div key={rangeIndex} className="flex items-center justify-between py-2 border-b last:border-b-0 border-red-100 dark:border-red-800">
                                    <div className="flex items-center space-x-3">
                                      <div>
                                        <div className="font-medium text-sm">
                                          Ayah {ayahText}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {range.mistakes.length} mistake{range.mistakes.length > 1 ? 's' : ''} • {new Date(rangeLatestMistake.timestamp).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                                        <Link href={`/quran?surah=${surahNumber}&ayah=${range.start}`}>
                                          Review
                                        </Link>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowMistakeDeleteConfirm({ surah: surahNumber, ayah: range.start, deleteAll: false })}
                                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Completed Today - Compact */}
        {getCompletedTodayItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">
                Completed Today ({getCompletedTodayItems.length})
              </h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                        <th className="text-left p-2 font-medium text-green-700 dark:text-green-300 w-1/3">Surah & Ayahs</th>
                        <th className="text-left p-2 font-medium text-green-700 dark:text-green-300 w-20">Reviews</th>
                        <th className="text-left p-2 font-medium text-green-700 dark:text-green-300 w-24">Next Review</th>
                        <th className="text-left p-2 font-medium text-green-700 dark:text-green-300 w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCompletedTodayItems.map((item) => {
                        const reviewDate = parseLocalDate(item.nextReview).toLocaleDateString();
                        return (
                          <tr 
                            key={item.id} 
                            className="border-b hover:bg-green-50/30 dark:hover:bg-green-950/10 cursor-pointer"
                            onClick={() => router.push(`/quran?review=${encodeURIComponent(item.id)}`)}
                          >
                            <td className="p-2">
                              <div>
                                <div className="font-medium text-sm">
                                  {formatAyahRange(item.surah, item.ayahStart, item.ayahEnd)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatAyahRangeArabic(item.surah, item.ayahStart, item.ayahEnd)}
                                </div>
                              </div>
                            </td>
                            <td className="p-2 font-medium text-sm">{item.reviewCount}</td>
                            <td className="p-2 font-medium text-sm">{reviewDate}</td>
                            <td className="p-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-1">
                                Done
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upcoming Reviews - Compact */}
        {/* Removed the Upcoming Reviews section as requested. */}

        {/* All Items - Compact Table */}
        {items.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
               <span className="font-semibold text-lg">All Items ({items.length})</span>
               <div className="flex items-center gap-2">
                 <label htmlFor="collapse-all" className="text-sm select-none cursor-pointer">Expand All</label>
                 <Switch id="collapse-all" checked={!collapseAll} onCheckedChange={v => setCollapseAll(!v)} />
               </div>
            </div>
            <div className="overflow-x-auto">
              {/* Responsive: Table on md+, Compact Card List on mobile */}
              <div className="block md:hidden space-y-2">
                {Object.entries(groupedByDate).map(([date, dateItems]) => {
                  const label = getDateLabel(date);
                  const isToday = label === 'Today';
                  const expanded = expandedDates[date] ?? isToday;
                  const rowColor = dateColorMap[date] || '';
                  return (
                    <div key={date} className={`rounded-lg border ${rowColor} mb-1`}> 
                      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer bg-muted/30" onClick={() => toggleDateExpand(date)}>
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-semibold text-sm">{label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{dateItems.length} due</span>
                        <span className="text-xs text-muted-foreground ml-2">{date}</span>
                      </div>
                      {expanded && (
                        <div>
                          {dateItems.map((item) => {
                            const reviewDate = parseLocalDate(item.nextReview).toLocaleDateString();
                            const today = getTodayISODate();
                            const isCompletedToday = item.completedToday === today;
                            return (
                              <Link
                                key={item.id}
                                href={`/quran?review=${encodeURIComponent(item.id)}`}
                                className={`flex items-center justify-between px-3 py-2 border-b last:border-b-0 bg-white dark:bg-black/30 ${isCompletedToday ? 'bg-green-50/50 dark:bg-green-950/20 border-l-4 border-l-green-500' : ''} transition hover:bg-muted/40 cursor-pointer`}
                                style={{ textDecoration: 'none' }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-base truncate">{formatAyahRange(item.surah, item.ayahStart, item.ayahEnd)}</div>
                                  <div className="text-xs text-muted-foreground truncate">{formatAyahRangeArabic(item.surah, item.ayahStart, item.ayahEnd)}</div>
                                  <div className="text-xs text-muted-foreground mt-1">Next: {reviewDate}</div>
                                </div>
                                <div className="flex items-center ml-2 gap-1">
                                  <Badge variant={
                                    isCompletedToday ? 'secondary' :
                                    getPriorityText(item) === 'Overdue' ? 'destructive' :
                                    getPriorityText(item) === 'Due Today' ? 'destructive' :
                                    getPriorityText(item) === 'Due Soon' ? 'secondary' :
                                    'outline'
                                  } className={`text-xs px-2 py-1 ${isCompletedToday ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : ''}`}>{isCompletedToday ? 'Completed' : getPriorityText(item)}</Badge>
                                  {!isCompletedToday && (
                                    <button
                                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none"
                                      onClick={e => {
                                        e.preventDefault();
                                        setReviewingItem(item);
                                      }}
                                      aria-label="Review (Easy/Medium/Hard)"
                                      title="Review (Easy/Medium/Hard)"
                                      type="button"
                                    >
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    </button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-8 h-8 p-0"
                                    onClick={e => {
                                      e.preventDefault();
                                      handleEdit(item);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <button
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/50 focus:outline-none"
                                    onClick={e => {
                                      e.preventDefault();
                                      setShowDeleteConfirm(item.id);
                                    }}
                                    aria-label="Delete"
                                    type="button"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </button>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground ml-1 flex-shrink-0" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Table for md+ screens */}
              <table className="w-full min-w-full hidden md:table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium w-1/4">Surah & Ayahs</th>
                    <th className="text-left p-3 font-medium w-16">Ruku</th>
                    <th className="text-left p-3 font-medium w-20">Reviews</th>
                    <th className="text-left p-3 font-medium w-20">Interval</th>
                    <th className="text-left p-3 font-medium w-24">Next Review</th>
                    <th className="text-left p-3 font-medium w-32">Status</th>
                    <th className="text-left p-3 font-medium w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedByDate).map(([date, dateItems]) => {
                    const label = getDateLabel(date);
                    const isToday = label === 'Today';
                    const expanded = expandedDates[date] ?? isToday;
                    const rowColor = dateColorMap[date] || '';

                    // Map rowColor to a specific hover:bg-* class
                    const colorToHoverClass: Record<string, string> = {
                      'bg-blue-50': 'hover:bg-blue-50',
                      'bg-yellow-50': 'hover:bg-yellow-50',
                      'bg-purple-50': 'hover:bg-purple-50',
                      'bg-pink-50': 'hover:bg-pink-50',
                      'bg-orange-50': 'hover:bg-orange-50',
                      'bg-cyan-50': 'hover:bg-cyan-50',
                      'bg-lime-50': 'hover:bg-lime-50',
                      'dark:bg-blue-950/20': 'dark:hover:bg-blue-950/20',
                      'dark:bg-yellow-950/20': 'dark:hover:bg-yellow-950/20',
                      'dark:bg-purple-950/20': 'dark:hover:bg-purple-950/20',
                      'dark:bg-pink-950/20': 'dark:hover:bg-pink-950/20',
                      'dark:bg-orange-950/20': 'dark:hover:bg-orange-950/20',
                      'dark:bg-cyan-950/20': 'dark:hover:bg-cyan-950/20',
                      'dark:bg-lime-950/20': 'dark:hover:bg-lime-950/20',
                    };
                    // Extract the base color (e.g., bg-blue-50) from rowColor
                    const baseColor = (rowColor.match(/bg-[a-z]+-\d+/) || [])[0] || '';
                    const darkColor = (rowColor.match(/dark:bg-[a-z]+-\d+\/\d+/) || [])[0] || '';
                    const hoverClass = colorToHoverClass[baseColor] || '';
                    const darkHoverClass = colorToHoverClass[darkColor] || '';

                    return (
                      <React.Fragment key={date}>
                        <tr className={`border-b cursor-pointer ${rowColor}`}
                          onClick={() => toggleDateExpand(date)}>
                          <td colSpan={7} className="p-2 font-semibold">
                            <div className="flex items-center gap-2">
                              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <span>{label}</span>
                              <span className="ml-2 text-xs text-muted-foreground">Due: {dateItems.length}</span>
                              <span className="text-xs text-muted-foreground ml-2">{date}</span>
                            </div>
                          </td>
                        </tr>
                        {expanded && dateItems.map((item) => {
                          const reviewDate = parseLocalDate(item.nextReview).toLocaleDateString();
                          const today = getTodayISODate();
                          const isCompletedToday = item.completedToday === today;
                          return (
                            <tr
                              key={item.id}
                              className={`border-b cursor-pointer ${
                                isCompletedToday ? 'bg-green-50/50 dark:bg-green-950/20 border-l-4 border-l-green-500' : ''
                              } ${hoverClass} ${darkHoverClass}`}
                              onClick={() => {
                                window.location.href = `/quran?review=${encodeURIComponent(item.id)}`;
                              }}
                            >
                              <td className="p-3">
                                <div>
                                  <div className="font-medium text-sm">
                                    {formatAyahRange(item.surah, item.ayahStart, item.ayahEnd)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatAyahRangeArabic(item.surah, item.ayahStart, item.ayahEnd)}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                {item.rukuStart && item.rukuEnd ? (
                                  <Badge variant="outline" className="text-xs px-2 py-1">
                                    {item.rukuStart}{item.rukuStart !== item.rukuEnd ? `-${item.rukuEnd}` : ''}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              <td className="p-3 font-medium text-sm">{item.reviewCount}</td>
                              <td className="p-3 font-medium text-sm">{item.interval}d</td>
                              <td className="p-3 font-medium text-sm">{reviewDate}</td>
                              <td className="p-3">
                                <Badge variant={
                                  isCompletedToday ? 'secondary' :
                                  getPriorityText(item) === 'Overdue' ? 'destructive' :
                                  getPriorityText(item) === 'Due Today' ? 'destructive' :
                                  getPriorityText(item) === 'Due Soon' ? 'secondary' :
                                  'outline'
                                } className={`text-xs px-2 py-1 ${
                                  isCompletedToday ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : ''
                                }`}>
                                  {isCompletedToday ? 'Completed' : getPriorityText(item)}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  {!isCompletedToday && (
                                    <button
                                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none"
                                      onClick={e => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setReviewingItem(item);
                                      }}
                                      aria-label="Review (Easy/Medium/Hard)"
                                      title="Review (Easy/Medium/Hard)"
                                      type="button"
                                    >
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    </button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-8 h-8 p-0"
                                    onClick={e => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleEdit(item);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <button
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/50 focus:outline-none"
                                    onClick={e => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setShowDeleteConfirm(item.id);
                                    }}
                                    aria-label="Delete"
                                    type="button"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              {/* Removed BookOpen icon */}
            </div>
            <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Begin your Quran memorization journey by adding your first item. Every step counts towards your spiritual growth.
            </p>
            <div className="space-y-3">
              <Button asChild>
                <Link href="/quran?addReview=1">
                  {/* Removed Plus icon */}
                Add Review
              </Link>
              </Button>
              <div className="text-sm text-muted-foreground">
                <p>Or explore the Quran first</p>
                <Button variant="link" asChild>
                  <Link href="/quran">Open Quran</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingItem && (
          <Dialog open onOpenChange={() => setEditingItem(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Memorization Item</DialogTitle>
                <DialogDescription>
                  Update the details for {formatAyahRange(editingItem.surah, editingItem.ayahStart, editingItem.ayahEnd)}
                </DialogDescription>
              </DialogHeader>
                <EditItemForm 
                  item={editingItem} 
                  onSave={handleSaveEdit} 
                  onCancel={handleCancelEdit} 
                />
            </DialogContent>
          </Dialog>
        )}

        {/* Review Modal */}
        {reviewingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-card text-card-foreground gap-6 rounded-xl py-6 w-full max-w-lg max-h-[90vh] shadow-2xl border flex flex-col" data-modal="review-rating">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Complete Review</h3>
                  <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 border-transparent bg-secondary text-secondary-foreground text-xs">
                    {reviewingItem.surah === 1 ? 'Al-Fatihah' : 
                     reviewingItem.surah === 2 ? 'Al-Baqarah' : 
                     `Surah ${reviewingItem.surah}`} {reviewingItem.ayahStart}{reviewingItem.ayahStart !== reviewingItem.ayahEnd ? `-${reviewingItem.ayahEnd}` : ''}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {reviewingItem.surah === 1 ? 'الفاتحة' : 
                     reviewingItem.surah === 2 ? 'البقرة' : 
                     `سورة ${reviewingItem.surah}`} {reviewingItem.ayahStart}{reviewingItem.ayahStart !== reviewingItem.ayahEnd ? `-${reviewingItem.ayahEnd}` : ''}
                  </span>
                </div>
                <button 
                  onClick={() => setReviewingItem(null)}
                  className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md gap-1.5 h-8 w-8 p-0"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                    <span>Reviews: {reviewingItem.reviewCount}</span>
                    <span>Interval: {(() => {
                      const today = new Date();
                      const nextReview = new Date(reviewingItem.nextReview);
                      const diffTime = nextReview.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays > 0 ? `${diffDays}d` : 'Today';
                    })()}</span>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {reviewingItem.name}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">How well did you recall this passage?</h4>
                    <p className="text-sm text-muted-foreground mb-4">Select your recall quality to schedule the next review interval.</p>
                  </div>

                  {/* Rating buttons */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        const updatedItem = { ...reviewingItem, rating: 5, completed: true };
                        updateMemorizationItem(updatedItem);
                        loadAllData();
                        setReviewingItem(null);
                      }}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 w-full justify-between h-auto p-4 text-left"
                    >
                      <div>
                        <div className="font-medium">Easy</div>
                        <div className="text-sm text-muted-foreground">Perfect recall, no mistakes</div>
                      </div>
                      <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 text-foreground text-xs">
                        4 days
                      </span>
                    </button>

                    <button 
                      onClick={() => {
                        const updatedItem = { ...reviewingItem, rating: 3, completed: true };
                        updateMemorizationItem(updatedItem);
                        loadAllData();
                        setReviewingItem(null);
                      }}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 w-full justify-between h-auto p-4 text-left"
                    >
                      <div>
                        <div className="font-medium">Medium</div>
                        <div className="text-sm text-muted-foreground">Good recall with minor hesitation</div>
                      </div>
                      <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 text-foreground text-xs">
                        2 days
                      </span>
                    </button>

                    <button 
                      onClick={() => {
                        const updatedItem = { ...reviewingItem, rating: 1, completed: true };
                        updateMemorizationItem(updatedItem);
                        loadAllData();
                        setReviewingItem(null);
                      }}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 w-full justify-between h-auto p-4 text-left"
                    >
                      <div>
                        <div className="font-medium">Hard</div>
                        <div className="text-sm text-muted-foreground">Difficult recall, needed help</div>
                      </div>
                      <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium w-fit whitespace-nowrap shrink-0 text-foreground text-xs">
                        1 day
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the memorization item.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mistake Delete Confirmation */}
        <AlertDialog open={!!showMistakeDeleteConfirm} onOpenChange={() => setShowMistakeDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {showMistakeDeleteConfirm?.deleteAll ? 'Remove All Mistakes?' : 'Remove Mistake Mark?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {showMistakeDeleteConfirm?.deleteAll ? (
                  <>
                    This will remove all mistake marks for {showMistakeDeleteConfirm && surahList.find(s => s.number === showMistakeDeleteConfirm.surah)?.name} ({groupedMistakes[showMistakeDeleteConfirm.surah]?.length || 0} mistakes). You can always mark them again later if needed.
                  </>
                ) : (
                  <>
                    This will remove the mistake mark for {showMistakeDeleteConfirm && surahList.find(s => s.number === showMistakeDeleteConfirm.surah)?.name} Ayah {showMistakeDeleteConfirm?.ayah}. You can always mark it again later if needed.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (showMistakeDeleteConfirm) {
                    if (showMistakeDeleteConfirm.deleteAll) {
                      handleDeleteAllMistakesInSurah(showMistakeDeleteConfirm.surah);
                    } else if (showMistakeDeleteConfirm.ayah) {
                      handleDeleteMistake(showMistakeDeleteConfirm.surah, showMistakeDeleteConfirm.ayah);
                    }
                  }
                }}
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {showMistakeDeleteConfirm?.deleteAll ? 'Remove All Mistakes' : 'Remove Mistake'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


      </main>
    </div>
  );
}
