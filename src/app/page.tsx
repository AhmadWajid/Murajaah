'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllMemorizationItems, updateMemorizationItem, removeMemorizationItem, cleanupDuplicateItems, getMistakesList, removeMistake, addMemorizationItem, batchUpdateMemorizationItems } from '@/lib/storageService';
import { MistakeData } from '@/lib/supabase/database';
import { generateMemorizationId, getTodayISODate } from '@/lib/utils';
import { MemorizationItem, updateInterval, resetDailyCompletions, getDueItems, getUpcomingReviews } from '@/lib/spacedRepetition';
import { formatAyahRange, formatAyahRangeArabic, getSurahName, getSurahNameArabic } from '@/lib/quran';
import { getSurahList, SurahListItem } from '@/lib/quranService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Trash2, CheckCircle, Edit, Loader2, X, AlertTriangle, Calendar, Clock, BookOpen, Target, MoreVertical, Zap } from 'lucide-react';
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

/* ─── ReviewRow — one passage with a primary "Review" button + overflow menu ─── */
function ReviewRow({
  item,
  isDone,
  isOverdue,
  compact = false,
  onReview,
  onQuickRate,
  onEdit,
  onDelete,
}: {
  item: MemorizationItem;
  isDone: boolean;
  isOverdue: boolean;
  compact?: boolean;
  onReview: () => void;
  onQuickRate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const englishName = getSurahName(item.surah);
  const arabicName = getSurahNameArabic(item.surah);
  const ayahLabel = item.ayahStart === item.ayahEnd ? `Ayah ${item.ayahStart}` : `Ayahs ${item.ayahStart}-${item.ayahEnd}`;

  return (
    <div
      className={`flex items-center gap-3 ${compact ? 'px-4 py-2.5' : 'p-4'} bg-card transition-colors ${
        isDone ? 'border-l-4 border-l-success' : isOverdue ? 'border-l-4 border-l-destructive' : ''
      } hover:bg-muted/30`}
    >
      {/* Surah number badge */}
      <div
        className={`w-9 h-9 rounded-[var(--radius)] flex items-center justify-center flex-shrink-0 font-bold text-sm ${
          isDone ? 'bg-success/15 text-success' : isOverdue ? 'bg-destructive/15 text-destructive' : 'bg-accent/15 text-accent'
        }`}
      >
        {item.surah}
      </div>

      {/* Passage info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground truncate">{englishName}</span>
          <span className="font-arabic text-accent text-base flex-shrink-0" dir="rtl">{arabicName}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {ayahLabel} · {item.interval}d · {item.reviewCount} {item.reviewCount === 1 ? 'review' : 'reviews'}
        </p>
      </div>

      {/* Status badge */}
      {isDone ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/15 px-2 py-1 rounded-[var(--radius-sm)] flex-shrink-0">
          <CheckCircle className="w-3 h-3" />
          Done
        </span>
      ) : (
        <span className={`text-xs font-semibold px-2 py-1 rounded-[var(--radius-sm)] flex-shrink-0 ${
          isOverdue ? 'text-destructive bg-destructive/15' : 'text-accent bg-accent/15'
        }`}>
          {isOverdue ? 'Overdue' : 'Due'}
        </span>
      )}

      {/* Primary action: Review */}
      {!isDone && (
        <Button size="sm" onClick={onReview} className="h-8 px-3 text-xs flex-shrink-0">
          Review
        </Button>
      )}

      {/* Overflow menu for secondary actions */}
      <div className="relative flex-shrink-0">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-muted transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="More actions"
          type="button"
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 w-44 panel-surface rounded-[var(--radius-md)] p-1 animate-popover shadow-lg">
              {!isDone && (
                <button
                  className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-secondary transition-colors"
                  onClick={() => { setMenuOpen(false); onQuickRate(); }}
                >
                  <Zap className="w-4 h-4 text-accent" />
                  Quick Rate
                </button>
              )}
              <button
                className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm hover:bg-secondary transition-colors"
                onClick={() => { setMenuOpen(false); onEdit(); }}
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
                Edit
              </button>
              <button
                className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => { setMenuOpen(false); onDelete(); }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── QuickReviewModal — rate recall without opening the Quran ─── */
function QuickReviewModal({
  item,
  onClose,
  onSubmit,
}: {
  item: MemorizationItem;
  onClose: () => void;
  onSubmit: (rating: 'easy' | 'medium' | 'hard') => void;
}) {
  const englishName = getSurahName(item.surah);
  const arabicName = getSurahNameArabic(item.surah);
  const ayahLabel = item.ayahStart === item.ayahEnd ? `Ayah ${item.ayahStart}` : `Ayahs ${item.ayahStart}-${item.ayahEnd}`;

  // Calculate intervals using the same logic as updateInterval()
  const daysSinceCreation = (() => {
    if (item.memorizationAge !== undefined) {
      const created = new Date(item.createdAt);
      const today = new Date();
      const daysPassed = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return item.memorizationAge + daysPassed;
    }
    const created = new Date(item.createdAt);
    const today = new Date();
    return Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const intervals = daysSinceCreation < 10
    ? { easy: 1, medium: 1, hard: 1 }
    : daysSinceCreation < 180
      ? { easy: 4, medium: 2, hard: 1 }
      : { easy: 7, medium: 4, hard: 1 };

  const ratingOptions: { rating: 'easy' | 'medium' | 'hard'; label: string; desc: string; color: string; bg: string; border: string }[] = [
    { rating: 'easy', label: 'Easy', desc: 'Perfect recall, no hesitation', color: 'text-success', bg: 'bg-success/15', border: 'hover:border-success/30 hover:bg-success/[0.04]' },
    { rating: 'medium', label: 'Medium', desc: 'Good recall, minor hesitation', color: 'text-accent', bg: 'bg-accent/15', border: 'hover:border-accent/30 hover:bg-accent/[0.04]' },
    { rating: 'hard', label: 'Hard', desc: 'Difficult, needed help', color: 'text-warning', bg: 'bg-warning/15', border: 'hover:border-warning/30 hover:bg-warning/[0.04]' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlay"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
    >
      <div className="bg-card text-card-foreground rounded-[var(--radius-2xl)] w-full max-w-md shadow-2xl border border-border flex flex-col animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[var(--radius)] bg-accent/15 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold font-serif-header text-foreground leading-tight">Quick Rate</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-foreground font-medium truncate">{englishName}</span>
                <span className="font-arabic text-accent text-sm" dir="rtl">{arabicName}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{ayahLabel} · {item.interval}d interval · {item.reviewCount} reviews</p>
            </div>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-muted transition-colors flex-shrink-0"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">How well did you recall this?</p>
            <p className="text-xs text-muted-foreground">This schedules your next review automatically.</p>
          </div>

          {ratingOptions.map((opt) => (
            <button
              key={opt.rating}
              onClick={() => onSubmit(opt.rating)}
              className={`w-full flex items-center justify-between p-3.5 rounded-[var(--radius-lg)] border border-border ${opt.border} transition-colors text-left`}
            >
              <div>
                <div className="font-semibold text-sm text-foreground">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
              </div>
              <span className={`text-xs font-semibold ${opt.color} ${opt.bg} px-2.5 py-1 rounded-[var(--radius-sm)] flex-shrink-0`}>
                +{intervals[opt.rating]} {intervals[opt.rating] === 1 ? 'day' : 'days'}
              </span>
            </button>
          ))}

          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Want to read first?{' '}
              <Link href={`/quran?review=${encodeURIComponent(item.id)}`} className="text-accent font-medium hover:underline">
                Open in Quran →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.ayahEnd < formData.ayahStart) {
      setFormError('The "To Ayah" can\'t be before the "From Ayah".');
      return;
    }
    if (formData.surah < 1 || formData.surah > 114) {
      setFormError('Surah number must be between 1 and 114.');
      return;
    }
    if (formData.ayahStart < 1 || formData.ayahEnd < 1) {
      setFormError('Ayah numbers must be at least 1.');
      return;
    }
    setFormError(null);
    
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
        {formError && (
          <div className="p-3 rounded-[var(--radius-md)] bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {formError}
          </div>
        )}
        {/* Ayah Range Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium mb-2">Passage</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Surah #</label>
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
              <label className="block text-xs text-muted-foreground mb-1">From Ayah</label>
              <input
                type="number"
                value={formData.ayahStart}
                onChange={(e) => setFormData({ ...formData, ayahStart: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">To Ayah</label>
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
        <label className="block text-sm font-medium mb-2">Days until next review</label>
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
    } catch (error) {
      console.error('Error updating item:', error);
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

  // Helper to determine if a date is today
  const todayISO = useMemo(() => getTodayISODate(), []);
  const isDateToday = useCallback((date: string) => date === todayISO, [todayISO]);

  // Helper to determine if a date is overdue
  const isDateOverdue = useCallback((date: string) => date < todayISO, [todayISO]);

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
      <AppHeader pageType="home" onRefresh={refreshData} />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {isRefreshing && (
          <div className="fixed top-20 right-4 z-50 bg-card border border-border rounded-[var(--radius)] shadow-lg px-3 py-2 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span className="text-sm">Refreshing…</span>
          </div>
        )}

        {/* ─── Greeting ─── */}
        <div className="mb-8">
          <p className="font-arabic text-xl text-accent mb-1" dir="rtl">السلام عليكم</p>
          <h1 className="text-2xl font-bold font-serif-header text-foreground tracking-tight">
            {dueItems.length > 0
              ? `${dueItems.length} ${dueItems.length === 1 ? 'review' : 'reviews'} due`
              : mistakes.length > 0
                ? 'Reviews done — review your mistakes'
                : 'All caught up'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dueItems.length > 0
              ? 'Tap Review to open the passage and test your memory.'
              : mistakes.length > 0
                ? 'You have marked mistakes to go over.'
                : 'Add a new passage to start tracking your memorization.'}
          </p>
        </div>

        {/* ─── Due Now (primary section) ─── */}
        {dueItems.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Due Now</h2>
            <div className="space-y-2.5">
              {dueItems.map((item) => {
                const isDone = item.completedToday === todayISO;
                const isOverdue = item.nextReview < todayISO;
                return (
                  <ReviewRow
                    key={item.id}
                    item={item}
                    isDone={isDone}
                    isOverdue={isOverdue}
                    onReview={() => router.push(`/quran?review=${encodeURIComponent(item.id)}`)}
                    onQuickRate={() => setReviewingItem(item)}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => setShowDeleteConfirm(item.id)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Mistakes ─── */}
        {mistakes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Mistakes ({mistakes.length})
            </h2>
            <div className="space-y-2">
              {Object.entries(groupedMistakes).map(([surah, surahMistakes]) => {
                const surahNumber = parseInt(surah);
                const englishName = surahList.find((s) => s.number === surahNumber)?.englishName || getSurahName(surahNumber);
                const arabicName = getSurahNameArabic(surahNumber);
                const isExpanded = expandedSurahs.has(surahNumber);

                let ayahRanges: { start: number; end: number; mistakes: MistakeData[] }[] = [];
                let currentRange: { start: number; end: number; mistakes: MistakeData[] } | null = null;
                const sortedMistakes = [...surahMistakes].sort((a, b) => a.ayah - b.ayah);
                sortedMistakes.forEach((mistake) => {
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
                if (currentRange) ayahRanges.push(currentRange);
                ayahRanges = ayahRanges.sort((a, b) => a.start - b.start);

                return (
                  <div
                    key={surah}
                    className={`rounded-[var(--radius-lg)] border overflow-hidden transition-colors ${
                      isExpanded ? 'border-warning/30' : 'border-warning/20'
                    } bg-warning/[0.03]`}
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <button
                        className="flex items-center gap-3 min-w-0 flex-1 text-left"
                        onClick={() => toggleSurahExpansion(surahNumber)}
                      >
                        <div className="w-8 h-8 rounded-full bg-warning/15 text-warning text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {surahNumber}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground truncate">{englishName}</span>
                            <span className="font-arabic text-accent text-base" dir="rtl">{arabicName}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {surahMistakes.length} {surahMistakes.length === 1 ? 'mistake' : 'mistakes'}
                            {ayahRanges.length > 1 ? ` in ${ayahRanges.length} ranges` : ''}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <Button asChild size="sm" className="h-8 px-3 text-xs bg-warning text-warning-foreground hover:bg-warning/90">
                          <Link href={`/quran?surah=${surahNumber}&ayah=${ayahRanges[0].start}`}>
                            Review
                          </Link>
                        </Button>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-destructive/10 transition-colors"
                          onClick={() => setShowMistakeDeleteConfirm({ surah: surahNumber, deleteAll: true })}
                          aria-label="Remove all mistakes in this surah"
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-warning/15 bg-warning/[0.02]">
                        {ayahRanges.map((range, rangeIndex) => {
                          const ayahText = range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`;
                          return (
                            <div
                              key={rangeIndex}
                              className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0 border-warning/10 hover:bg-warning/[0.04] transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm text-foreground">Ayah {ayahText}</div>
                                  <div className="text-xs text-muted-foreground">{range.mistakes.length} {range.mistakes.length === 1 ? 'mark' : 'marks'}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button asChild size="sm" variant="ghost" className="h-7 px-2.5 text-xs">
                                  <Link href={`/quran?surah=${surahNumber}&ayah=${range.start}`}>
                                    Review
                                  </Link>
                                </Button>
                                <button
                                  className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)] hover:bg-destructive/10 transition-colors"
                                  onClick={() => setShowMistakeDeleteConfirm({ surah: surahNumber, ayah: range.start, deleteAll: false })}
                                  aria-label="Remove this mistake"
                                  type="button"
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Completed Today (subtle) ─── */}
        {getCompletedTodayItems.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Completed Today ({getCompletedTodayItems.length})
            </h2>
            <div className="space-y-1.5">
              {getCompletedTodayItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/quran?review=${encodeURIComponent(item.id)}`}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)] border border-success/15 bg-success/[0.03] hover:bg-success/[0.06] transition-colors"
                  style={{ textDecoration: 'none' }}
                >
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="text-sm text-foreground font-medium truncate">{getSurahName(item.surah)}</span>
                  <span className="font-arabic text-accent text-sm" dir="rtl">{getSurahNameArabic(item.surah)}</span>
                  <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                    {item.ayahStart === item.ayahEnd ? `Ayah ${item.ayahStart}` : `${item.ayahStart}-${item.ayahEnd}`}
                    {' · '}next {parseLocalDate(item.nextReview).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── All Passages (collapsed by default) ─── */}
        {items.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                All Passages ({items.length})
              </h2>
              <div className="flex items-center gap-2">
                <label htmlFor="collapse-all" className="text-xs select-none cursor-pointer text-muted-foreground">Expand</label>
                <Switch id="collapse-all" checked={!collapseAll} onCheckedChange={(v) => setCollapseAll(!v)} />
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(groupedByDate).map(([date, dateItems]) => {
                const label = getDateLabel(date);
                const isToday = isDateToday(date);
                const isOverdue = isDateOverdue(date);
                const expanded = expandedDates[date] ?? isToday;

                return (
                  <div
                    key={date}
                    className={`rounded-[var(--radius-md)] border overflow-hidden ${
                      isToday ? 'border-accent/20' : isOverdue ? 'border-destructive/15' : 'border-border'
                    }`}
                  >
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => toggleDateExpand(date)}
                    >
                      {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <span className="font-medium text-sm text-foreground">{label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-[var(--radius-xs)] font-medium ${
                        isToday ? 'bg-accent/15 text-accent' : isOverdue ? 'bg-destructive/15 text-destructive' : 'text-muted-foreground bg-muted'
                      }`}>
                        {dateItems.length}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">{date}</span>
                    </button>
                    {expanded && (
                      <div className="divide-y divide-border">
                        {dateItems.map((item) => {
                          const isDone = item.completedToday === todayISO;
                          return (
                            <ReviewRow
                              key={item.id}
                              item={item}
                              isDone={isDone}
                              isOverdue={isDateOverdue(item.nextReview)}
                              compact
                              onReview={() => router.push(`/quran?review=${encodeURIComponent(item.id)}`)}
                              onQuickRate={() => setReviewingItem(item)}
                              onEdit={() => handleEdit(item)}
                              onDelete={() => setShowDeleteConfirm(item.id)}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Empty State ─── */}
        {items.length === 0 && mistakes.length === 0 && (
          <div className="text-center py-20">
            <div className="mx-auto w-20 h-20 rounded-[var(--radius-2xl)] bg-accent/10 flex items-center justify-center mb-5">
              <BookOpen className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-xl font-bold font-serif-header text-foreground mb-2">Begin Your Journey</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm leading-relaxed">
              Add Quran passages you've memorized and the app will schedule smart reviews using spaced repetition to help you retain them long-term.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/quran?addReview=1">
                  <Target className="w-4 h-4" />
                  Add Your First Review
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/quran">
                  <BookOpen className="w-4 h-4" />
                  Explore the Quran
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* ─── Edit Modal ─── */}
        {editingItem && (
          <Dialog open onOpenChange={() => setEditingItem(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Review Item</DialogTitle>
                <DialogDescription>
                  Update the details for {formatAyahRange(editingItem.surah, editingItem.ayahStart, editingItem.ayahEnd)}
                </DialogDescription>
              </DialogHeader>
              <EditItemForm item={editingItem} onSave={handleSaveEdit} onCancel={handleCancelEdit} />
            </DialogContent>
          </Dialog>
        )}

        {/* ─── Quick Review Modal ─── */}
        {reviewingItem && (
          <QuickReviewModal
            item={reviewingItem}
            onClose={() => setReviewingItem(null)}
            onSubmit={(rating) => {
              const updated = updateInterval(reviewingItem, rating);
              updateMemorizationItem(updated);
              loadAllData();
              setReviewingItem(null);
            }}
          />
        )}

        {/* ─── Delete Confirmation ─── */}
        <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this review item?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this passage from your review schedule. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ─── Mistake Delete Confirmation ─── */}
        <AlertDialog open={!!showMistakeDeleteConfirm} onOpenChange={() => setShowMistakeDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {showMistakeDeleteConfirm?.deleteAll ? 'Remove all mistakes for this surah?' : 'Remove this mistake mark?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {showMistakeDeleteConfirm?.deleteAll ? (
                  <>
                    This will remove all {groupedMistakes[showMistakeDeleteConfirm.surah]?.length || 0} mistake marks for{' '}
                    {showMistakeDeleteConfirm && getSurahName(showMistakeDeleteConfirm.surah)}. You can always mark them again while reading.
                  </>
                ) : (
                  <>
                    This will remove the mistake mark for {showMistakeDeleteConfirm && getSurahName(showMistakeDeleteConfirm.surah)}{' '}
                    Ayah {showMistakeDeleteConfirm?.ayah}. You can always mark it again while reading.
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
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {showMistakeDeleteConfirm?.deleteAll ? 'Remove All' : 'Remove'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
