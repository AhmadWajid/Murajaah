'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllMemorizationItems, updateMemorizationItem, removeMemorizationItem, updateMemorizationItemWithIndividualRating, cleanupDuplicateItems, getMistakesList, MistakeData, removeMistake, addMemorizationItem } from '@/lib/storage';
import { generateMemorizationId } from '@/lib/utils';
import { MemorizationItem, updateInterval, resetDailyCompletions, getDueItems, getUpcomingReviews } from '@/lib/spacedRepetition';
import { formatAyahRange, formatAyahRangeArabic } from '@/lib/quran';
import { getSurahList } from '@/lib/quranService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, CheckCircle, BookOpen, Plus, BarChart3, RefreshCw, Edit, Trash2, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
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
  const [items, setItems] = useState<MemorizationItem[]>([]);
  const [dueItems, setDueItems] = useState<MemorizationItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<MemorizationItem[]>([]);
  const [mistakes, setMistakes] = useState<MistakeData[]>([]);
  const [surahList, setSurahList] = useState<any[]>([]);
  const [expandedSurahs, setExpandedSurahs] = useState<Set<number>>(new Set());
  const [editingItem, setEditingItem] = useState<MemorizationItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showMistakeDeleteConfirm, setShowMistakeDeleteConfirm] = useState<{ surah: number; ayah?: number; deleteAll?: boolean } | null>(null);
  // No longer needed with unified storage

  // Helper function to load all data
  const loadAllData = () => {
      // Clean up duplicates first
      cleanupDuplicateItems();
      
      // Get all memorization items (unified storage)
      const allItems = getAllMemorizationItems();
      
      // Reset daily completions for items completed on previous days
      const resetItems = resetDailyCompletions(allItems);
      
      // Save any items that were reset (if they changed)
      resetItems.forEach(item => {
        const originalItem = allItems.find(original => original.id === item.id);
        if (originalItem && originalItem.completedToday !== item.completedToday) {
          updateMemorizationItem(item);
        }
      });
      
      // Update allItems with the reset items
      const finalItems = resetItems;
      
      const due = getDueItems(finalItems);
      const upcoming = getUpcomingReviews(finalItems, 7); // Next 7 days

      setItems(finalItems);
      setDueItems(due);
      setUpcomingItems(upcoming);
      
      // Load mistakes
      const mistakesList = getMistakesList();
      setMistakes(mistakesList);
    };

  useEffect(() => {
    loadAllData();
    loadSurahList();
    // Refresh data every minute
    const interval = setInterval(loadAllData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadSurahList = async () => {
    try {
      const surahs = await getSurahList();
      setSurahList(surahs);
    } catch (error) {
      // console.error('Error loading surah list:', error);
    }
  };

  const getPriorityColor = (item: MemorizationItem) => {
    const today = getTodayISODate();
    
    if (item.nextReview < today) return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300';
    if (item.nextReview === today) return 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300';
    
    // Calculate days until review for future dates
    const daysUntilReview = Math.ceil((new Date(item.nextReview).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilReview <= 3) return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300';
    return 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300';
  };

  const getPriorityText = (item: MemorizationItem) => {
    const today = getTodayISODate();
    
    if (item.nextReview < today) return 'Overdue';
    if (item.nextReview === today) return 'Due Today';
    
    // Calculate days until review for future dates
    const daysUntilReview = Math.ceil((new Date(item.nextReview).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilReview <= 3) return 'Due Soon';
    return 'Upcoming';
  };

  const getCompletedTodayItems = () => {
    const today = getTodayISODate();
    return items.filter(item => item.completedToday === today);
  };

  // Filter out items that were completed today from upcoming reviews
  const getUpcomingItemsExcludingCompleted = () => {
    const today = getTodayISODate();
    return upcomingItems.filter(item => item.completedToday !== today);
  };

  const groupItemsByDate = (items: MemorizationItem[]): GroupedItems => {
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
  };

  // Helper function to parse ISO date string as local date
  const parseLocalDate = (isoDateString: string) => {
    const [year, month, day] = isoDateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 because months are 0-indexed
  };

  const getDateLabel = (date: string) => {
    const today = new Date().toLocaleDateString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString();
    
    if (date === today) return 'Today';
    if (date === tomorrow) return 'Tomorrow';
    return date;
  };

  const handleQuickReview = (item: MemorizationItem, rating: 'easy' | 'medium' | 'hard') => {
    // Update the item with the new rating
    const updatedItem = updateInterval(item, rating);
    updateMemorizationItem(updatedItem);
    
    // Reload data
    loadAllData();
    
    // Show success message
    const ratingText = rating === 'easy' ? 'Easy' : rating === 'medium' ? 'Medium' : 'Hard';
    alert(`✅ Rated ${formatAyahRange(item.surah, item.ayahStart, item.ayahEnd)} as ${ratingText}`);
  };

  const handleDelete = (itemId: string) => {
    
    // Delete the item from unified storage
    removeMemorizationItem(itemId);
    
    setShowDeleteConfirm(null);
    
    // Reload data
    loadAllData();
  };

  const handleDeleteMistake = (surahNumber: number, ayahNumber: number) => {
    
    // Delete the mistake from storage
    removeMistake(surahNumber, ayahNumber);
    
    setShowMistakeDeleteConfirm(null);
    
    // Reload data
    loadAllData();
  };

  const handleDeleteAllMistakesInSurah = (surahNumber: number) => {
    
    // Get all mistakes for this surah and delete them
    const surahMistakes = groupedMistakes[surahNumber] || [];
    surahMistakes.forEach(mistake => {
      removeMistake(surahNumber, mistake.ayah);
    });
    
    setShowMistakeDeleteConfirm(null);
    
    // Reload data
    loadAllData();
  };

  const handleEdit = (item: MemorizationItem) => {
    setEditingItem(item);
  };

  const handleSaveEdit = (updatedItem: MemorizationItem) => {
    
    // If the ID has changed (range was modified), we need to handle it carefully
    if (editingItem && updatedItem.id !== editingItem.id) {
      
      // First, add the new item
      addMemorizationItem(updatedItem);
      
      // Then remove the old item (only if the new item was successfully added)
      const allItems = getAllMemorizationItems();
      const newItemExists = allItems.some(item => item.id === updatedItem.id);
      
      if (newItemExists) {
        removeMemorizationItem(editingItem.id);
      } else {
        // If adding failed, just update the old item with new properties but keep old ID
        updateMemorizationItem({
          ...updatedItem,
          id: editingItem.id // Keep the old ID
        });
      }
    } else {
      // Just update the existing item
      updateMemorizationItem(updatedItem);
    }
    
    setEditingItem(null);
    
    // Reload data
    loadAllData();
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const groupedDueItems = groupItemsByDate(dueItems);
  const groupedUpcomingItems = groupItemsByDate(getUpcomingItemsExcludingCompleted());

  // Group mistakes by surah
  const groupMistakesBySurah = (mistakes: MistakeData[]) => {
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
  };

  const groupedMistakes = groupMistakesBySurah(mistakes);

  const toggleSurahExpansion = (surahNumber: number) => {
    setExpandedSurahs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(surahNumber)) {
        newSet.delete(surahNumber);
      } else {
        newSet.add(surahNumber);
      }
      return newSet;
    });
  };

  const refreshData = () => {
    
    loadAllData();
  };

  // Function to fix broken items (no longer needed with unified storage)
  const fixBrokenItems = async () => {
    alert('All items are now stored in unified storage. No broken items to fix.');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader 
        pageType="home" 
        onRefresh={refreshData}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-center mb-8">
          <Button asChild size="lg" className="text-lg px-8 py-4 font-bold shadow-lg">
            <Link href="/quran">Open Quran</Link>
          </Button>
        </div>
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm font-medium">Total</p>
              </div>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm font-medium">Due</p>
              </div>
                <p className="text-2xl font-bold">{dueItems.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm font-medium">This Week</p>
              </div>
                <p className="text-2xl font-bold">{upcomingItems.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm font-medium">Completed</p>
              </div>
                <p className="text-2xl font-bold">
                  {items.filter(item => item.reviewCount > 0).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Due for Review - Compact */}
        {Object.keys(groupedDueItems).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold">Due for Review</h2>
            </div>
            
            {Object.entries(groupedDueItems).map(([date, dateItems]) => (
              <div key={date} className="mb-4">
                <h3 className="text-md font-medium mb-2">
                  <Badge variant="destructive">
                    {getDateLabel(date)} ({dateItems.length})
                  </Badge>
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-red-50/50 dark:bg-red-950/20">
                            <th className="text-left p-2 font-medium text-red-700 dark:text-red-300 w-1/4">Surah & Ayahs</th>
                            <th className="text-left p-2 font-medium text-red-700 dark:text-red-300 w-16">Ruku</th>
                            <th className="text-left p-2 font-medium text-red-700 dark:text-red-300 w-20">Reviews</th>
                            <th className="text-left p-2 font-medium text-red-700 dark:text-red-300 w-20">Interval</th>
                            <th className="text-left p-2 font-medium text-red-700 dark:text-red-300 w-24">Status</th>
                            <th className="text-left p-2 font-medium text-red-700 dark:text-red-300 w-32">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dateItems.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-red-50/30 dark:hover:bg-red-950/10">
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
                              <td className="p-2">
                                {item.rukuStart && item.rukuEnd ? (
                                  <Badge variant="outline" className="text-xs px-2 py-1">
                                    {item.rukuStart}{item.rukuStart !== item.rukuEnd ? `-${item.rukuEnd}` : ''}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              <td className="p-2 font-medium text-sm">{item.reviewCount}</td>
                              <td className="p-2 font-medium text-sm">{item.interval}d</td>
                              <td className="p-2">
                                <Badge variant="destructive" className="text-xs px-2 py-1">
                                  {getPriorityText(item)}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div className="flex items-center space-x-1">
                                  <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0">
                                    <Link href={`/quran?review=${encodeURIComponent(item.id)}`}>
                                      <Eye className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickReview(item, 'easy')}
                                    className="h-8 px-2 text-xs"
                                  >
                                    E
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickReview(item, 'medium')}
                                    className="h-8 px-2 text-xs"
                                  >
                                    M
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickReview(item, 'hard')}
                                    className="h-8 px-2 text-xs"
                                  >
                                    H
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Completed Today - Compact */}
        {getCompletedTodayItems().length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">
                Completed Today ({getCompletedTodayItems().length})
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
                      {getCompletedTodayItems().map((item) => {
                        const reviewDate = parseLocalDate(item.nextReview).toLocaleDateString();
                        return (
                          <tr key={item.id} className="border-b hover:bg-green-50/30 dark:hover:bg-green-950/10">
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
        {Object.keys(groupedUpcomingItems).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Upcoming Reviews</h2>
            </div>
            
            {Object.entries(groupedUpcomingItems).map(([date, dateItems]) => (
              <div key={date} className="mb-4">
                <h3 className="text-md font-medium mb-2">
                  <Badge variant="secondary">
                    {getDateLabel(date)} ({dateItems.length})
                  </Badge>
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-blue-50/50 dark:bg-blue-950/20">
                            <th className="text-left p-2 font-medium text-blue-700 dark:text-blue-300 w-1/4">Surah & Ayahs</th>
                            <th className="text-left p-2 font-medium text-blue-700 dark:text-blue-300 w-16">Ruku</th>
                            <th className="text-left p-2 font-medium text-blue-700 dark:text-blue-300 w-20">Reviews</th>
                            <th className="text-left p-2 font-medium text-blue-700 dark:text-blue-300 w-20">Interval</th>
                            <th className="text-left p-2 font-medium text-blue-700 dark:text-blue-300 w-24">Status</th>
                            <th className="text-left p-2 font-medium text-blue-700 dark:text-blue-300 w-32">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dateItems.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-blue-50/30 dark:hover:bg-blue-950/10">
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
                              <td className="p-2">
                                {item.rukuStart && item.rukuEnd ? (
                                  <Badge variant="outline" className="text-xs px-2 py-1">
                                    {item.rukuStart}{item.rukuStart !== item.rukuEnd ? `-${item.rukuEnd}` : ''}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              <td className="p-2 font-medium text-sm">{item.reviewCount}</td>
                              <td className="p-2 font-medium text-sm">{item.interval}d</td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-xs px-2 py-1">
                                  {getPriorityText(item)}
                                </Badge>
                              </td>
                              <td className="p-2">
                                <div className="flex items-center space-x-1">
                                  <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0">
                                    <Link href={`/quran?review=${encodeURIComponent(item.id)}`}>
                                      <Eye className="h-3 w-3" />
                                    </Link>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickReview(item, 'easy')}
                                    className="h-8 px-2 text-xs"
                                  >
                                    E
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickReview(item, 'medium')}
                                    className="h-8 px-2 text-xs"
                                  >
                                    M
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleQuickReview(item, 'hard')}
                                    className="h-8 px-2 text-xs"
                                  >
                                    H
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* All Items - Compact Table */}
        {items.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-xl font-semibold">All Items ({items.length})</h2>
              </div>
            <Card>
              <CardContent className="p-0">
              <div className="overflow-x-auto">
                  <table className="w-full min-w-full">
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
                      {items.map((item) => {
                        const reviewDate = parseLocalDate(item.nextReview).toLocaleDateString();
                        const today = getTodayISODate();
                        const isCompletedToday = item.completedToday === today;
                        
                        return (
                          <tr key={item.id} className={`border-b hover:bg-muted/50 ${
                            isCompletedToday ? 'bg-green-50/50 dark:bg-green-950/20 border-l-4 border-l-green-500' : ''
                          }`}>
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
                              <div className="flex items-center space-x-1">
                                <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0">
                                  <Link href={`/quran?review=${encodeURIComponent(item.id)}`}>
                                    <Eye className="h-3 w-3" />
                                  </Link>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(item)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowDeleteConfirm(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
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

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Begin your Quran memorization journey by adding your first item. Every step counts towards your spiritual growth.
            </p>
            <div className="space-y-3">
              <Button asChild>
                <Link href="/add">
                  <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
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
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {showMistakeDeleteConfirm?.deleteAll ? 'Remove All Mistakes' : 'Remove Mistake'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


      </main>
    </div>
  );
}

// Helper function to get today's date in ISO format
function getTodayISODate(): string {
  const now = new Date();
  const localDateString = now.toLocaleDateString('en-CA');
  return localDateString;
}
