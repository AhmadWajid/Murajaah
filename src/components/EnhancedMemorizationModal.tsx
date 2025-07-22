'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getSurah } from '@/lib/quranService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface EnhancedMemorizationModalProps {
  isOpen: boolean;
  currentPage: number;
  currentSurah: number;
  pageData: any;
  selectedAyahs?: Set<number>;
  onConfirm: (selections: any[], name: string, description?: string, memorizationLevel?: string) => void;
  onClose: () => void;
}

// Memorization level options
const MEMORIZATION_LEVELS = [
  { value: 'new', label: 'New to Me', interval: 1, color: 'from-red-500 to-pink-500' },
  { value: 'beginner', label: 'Beginner', interval: 2, color: 'from-orange-500 to-red-500' },
  { value: 'intermediate', label: 'Intermediate', interval: 5, color: 'from-yellow-500 to-orange-500' },
  { value: 'advanced', label: 'Advanced', interval: 10, color: 'from-green-500 to-emerald-500' },
  { value: 'mastered', label: 'Mastered', interval: 20, color: 'from-blue-500 to-indigo-500' }
];

export default function EnhancedMemorizationModal({
  isOpen,
  currentPage,
  currentSurah,
  pageData,
  selectedAyahs: externalSelectedAyahs,
  onConfirm,
  onClose
}: EnhancedMemorizationModalProps) {
  // All useState and useEffect hooks must be at the top
  const [selectionType, setSelectionType] = useState<'surah' | 'page' | 'ayahs'>('page');
  const [selectedAyahs, setSelectedAyahs] = useState<Set<number>>(new Set());
  const [customRange, setCustomRange] = useState({ start: 1, end: 1 });
  const [memorizationLevel, setMemorizationLevel] = useState('new');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fullSurahData, setFullSurahData] = useState<any>(null);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [surahContainerRef, setSurahContainerRef] = useState<HTMLDivElement | null>(null);
  const [nameEdited, setNameEdited] = useState(false);
  const [descriptionEdited, setDescriptionEdited] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);

  // Initialize modal state when it opens
  useEffect(() => {
    if (!isOpen) return;
    
    if (pageData?.ayahs && pageData.ayahs.length > 0) {
      const uniqueSurahs = Array.from(new Set(pageData.ayahs.map((ayah: any) => ayah.surah?.number))).filter((n): n is number => typeof n === 'number');
      const defaultSurah = uniqueSurahs[0] ?? null;
      
      // If there are externally selected ayahs, use ayah selection mode
      if (externalSelectedAyahs && externalSelectedAyahs.size > 0) {
        setSelectionType('ayahs');
        setSelectedAyahs(new Set(externalSelectedAyahs));
        
        // Find the surah of the first selected ayah
        const firstSelectedAyah = Array.from(externalSelectedAyahs)[0];
        const ayahObj = pageData.ayahs.find((a: any) => a.numberInSurah === firstSelectedAyah);
        const targetSurah = ayahObj?.surah?.number ?? defaultSurah;
        
        setSelectedSurah(targetSurah);
        
        // Set customRange to min/max of ALL selected ayahs (not filtered by surah)
        const sorted = Array.from(externalSelectedAyahs).sort((a, b) => a - b);
        const minAyah = sorted[0];
        const maxAyah = sorted[sorted.length - 1];
        setCustomRange({ start: minAyah, end: maxAyah });
      } else {
        // No external selection, default to page mode
        setSelectionType('page');
        setSelectedSurah(defaultSurah);
        setSelectedAyahs(new Set());
        setCustomRange({ start: 1, end: 1 });
      }
    }
  }, [isOpen, pageData, externalSelectedAyahs]);

  // When selectedSurah changes, update ayah grid, range, and name/description if not edited
  // But skip this during initialization when we have external selected ayahs
  useEffect(() => {
    if (!isOpen || !selectedSurah) return;
    
    // Skip this effect if we have external selected ayahs (during initialization)
    if (externalSelectedAyahs && externalSelectedAyahs.size > 0) {
      return;
    }
    
    if (selectionType === 'surah' && !nameEdited) {
      setName(`Surah ${selectedSurah} - Entire Surah`);
    }
    if (selectionType === 'surah' && !descriptionEdited) {
      setDescription('Memorization set for entire surah');
    }
    if (selectionType === 'ayahs' && !nameEdited) {
      setName(`Surah ${selectedSurah} - Selected Ayahs`);
    }
    if (selectionType === 'ayahs' && !descriptionEdited) {
      setDescription('Memorization set for selected ayahs');
    }
    // Reset ayah selection and range for new surah (only when no external selection)
    if (selectionType === 'ayahs') {
      const ayahsForSurah = (pageData?.ayahs || []).filter((ayah: any) => ayah.surah?.number === selectedSurah);
      if (ayahsForSurah.length > 0) {
        setCustomRange({ start: ayahsForSurah[0].numberInSurah, end: ayahsForSurah[ayahsForSurah.length - 1].numberInSurah });
        setSelectedAyahs(new Set());
      }
    }
  }, [selectedSurah, selectionType, isOpen, externalSelectedAyahs]);



  // Update name/description when selectionType changes, unless user has edited
  useEffect(() => {
    if (!isOpen) return;
    if (selectionType === 'surah' && !nameEdited) {
      setName(`Surah ${currentSurah} - Entire Surah`);
    }
    if (selectionType === 'surah' && !descriptionEdited) {
      setDescription('Memorization set for entire surah');
    }
    if (selectionType === 'page' && !nameEdited) {
      setName(`Page ${currentPage} - ${pageData?.surah?.name || `Surah ${currentSurah}`}`);
    }
    if (selectionType === 'page' && !descriptionEdited) {
      setDescription(`Memorization set for page ${currentPage}`);
    }
    if (selectionType === 'ayahs' && !nameEdited) {
      setName(`Surah ${currentSurah} - Selected Ayahs`);
    }
    if (selectionType === 'ayahs' && !descriptionEdited) {
      setDescription('Memorization set for selected ayahs');
    }
  }, [selectionType, isOpen, currentPage, currentSurah, pageData, nameEdited, descriptionEdited]);

  // Scroll to current page ayahs when full surah data is loaded
  useEffect(() => {
    if (fullSurahData && !loadingSurah && isOpen) {
      // Small delay to ensure the DOM is rendered
      setTimeout(() => {
        // If there are selected ayahs, scroll to the first selected ayah
        if (selectedAyahs.size > 0) {
          scrollToFirstSelectedAyah();
        } else {
          scrollToCurrentPageAyahs();
        }
      }, 100);
    }
  }, [fullSurahData, loadingSurah, isOpen, pageData, selectedAyahs]);

  // Keep quick range in sync with grid selection
  useEffect(() => {
    if (selectionType === 'ayahs' && selectedAyahs.size > 0) {
      const sorted = Array.from(selectedAyahs).sort((a, b) => a - b);
      setCustomRange({ start: sorted[0], end: sorted[sorted.length - 1] });
    }
  }, [selectedAyahs, selectionType]);

  // When selectedSurah or selectionType changes, load the full surah data for that surah
  useEffect(() => {
    if (!isOpen || !selectedSurah) return;
    if (selectionType === 'ayahs' || selectionType === 'surah') {
      loadFullSurah(selectedSurah);
    }
  }, [selectedSurah, selectionType, isOpen]);

  // On modal open or surah change, set range to full surah if not in ayah selection mode
  // useEffect(() => {
  //   if (!isOpen || !selectedSurah || !fullSurahData?.ayahs) return;
  //   if (selectionType !== 'ayahs') {
  //     const surahAyahs = fullSurahData.ayahs.filter((a: any) => a.surah?.number === selectedSurah);
  //     if (surahAyahs.length > 0) {
  //       console.debug('effect: surah change or modal open (not ayahs mode)', { selectedSurah, range: [surahAyahs[0].numberInSurah, surahAyahs[surahAyahs.length - 1].numberInSurah] });
  //       setCustomRange({ start: surahAyahs[0].numberInSurah, end: surahAyahs[surahAyahs.length - 1].numberInSurah });
  //       setSelectedAyahs(new Set());
  //     }
  //   }
  // }, [isOpen, selectedSurah, fullSurahData, selectionType]);

  const handleAyahToggle = (ayahNumber: number) => {
    setSelectedAyahs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ayahNumber)) {
        newSet.delete(ayahNumber);
      } else {
        newSet.add(ayahNumber);
      }
      // When toggling in the grid, update customRange to min/max of selected
      if (newSet.size > 0) {
        const sorted = Array.from(newSet).sort((a, b) => a - b);
        setCustomRange({ start: sorted[0], end: sorted[sorted.length - 1] });
      } else {
        setCustomRange({ start: 1, end: 1 });
      }
      return newSet;
    });
  };

  const selectAllAyahs = () => {
    if (fullSurahData?.ayahs && selectedSurah) {
      // All ayahs in fullSurahData.ayahs belong to selectedSurah
      const surahAyahs = fullSurahData.ayahs;
      const allAyahNumbers = surahAyahs.map((ayah: any) => ayah.numberInSurah);
      setSelectedAyahs(new Set(allAyahNumbers));
      if (surahAyahs.length > 0) {
        setCustomRange({ start: surahAyahs[0].numberInSurah, end: surahAyahs[surahAyahs.length - 1].numberInSurah });
      }
    }
  };

  const clearSelection = () => {
    setSelectedAyahs(new Set());
    if (fullSurahData?.ayahs && selectedSurah) {
      const surahAyahs = fullSurahData.ayahs;
      if (surahAyahs.length > 0) {
        setCustomRange({ start: surahAyahs[0].numberInSurah, end: surahAyahs[surahAyahs.length - 1].numberInSurah });
      } else {
        setCustomRange({ start: 1, end: 1 });
      }
    } else {
      setCustomRange({ start: 1, end: 1 });
    }
  };

  // Update loadFullSurah to accept a surah number
  const loadFullSurah = async (surahNum: number) => {
    if (loadingSurah) return;
    setLoadingSurah(true);
    try {
      const surahData = await getSurah(surahNum);
      setFullSurahData(surahData);
    } catch (error) {
      console.error('Error loading full surah:', error);
    } finally {
      setLoadingSurah(false);
    }
  };

  const scrollToCurrentPageAyahs = () => {
    if (!surahContainerRef || !pageData?.ayahs || !fullSurahData?.ayahs) return;
    
    // Find the first ayah from the current page
    const firstCurrentPageAyah = pageData.ayahs[0]?.numberInSurah;
    if (!firstCurrentPageAyah) return;
    
    // Find the button element for this ayah
    const ayahButton = surahContainerRef.querySelector(`[data-ayah="${firstCurrentPageAyah}"]`) as HTMLElement;
    if (ayahButton) {
      // Scroll to the button with some offset for better visibility
      ayahButton.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const scrollToFirstSelectedAyah = () => {
    if (!surahContainerRef || selectedAyahs.size === 0) return;
    
    // Find the first selected ayah
    const firstSelectedAyah = Math.min(...Array.from(selectedAyahs));
    
    // Find the button element for this ayah
    const ayahButton = surahContainerRef.querySelector(`[data-ayah="${firstSelectedAyah}"]`) as HTMLElement;
    if (ayahButton) {
      // Scroll to the button with some offset for better visibility
      ayahButton.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const updateRangeFromSelectedAyahs = () => {
    if (selectedAyahs.size === 0) {
      setCustomRange({ start: 1, end: 1 });
      return;
    }
    
    const sortedAyahs = Array.from(selectedAyahs).sort((a, b) => a - b);
    const minAyah = sortedAyahs[0];
    const maxAyah = sortedAyahs[sortedAyahs.length - 1];
    
    // Always update range to show the min/max of selected ayahs
    setCustomRange({ start: minAyah, end: maxAyah });
  };

  const handleRangeChange = (field: 'start' | 'end', value: number) => {
    const newRange = { ...customRange, [field]: value };
    setCustomRange(newRange);
    if (
      newRange.start &&
      newRange.end &&
      newRange.end >= newRange.start &&
      fullSurahData?.ayahs &&
      selectedSurah
    ) {
      // Always update selectedAyahs to match the range
      const rangeAyahs = fullSurahData.ayahs
        .filter(
          (ayah: any) =>
            ayah.numberInSurah >= newRange.start &&
            ayah.numberInSurah <= newRange.end
        )
        .map((ayah: any) => ayah.numberInSurah);
      setSelectedAyahs(new Set(rangeAyahs));
    } else {
      // If range is invalid, clear selection
      setSelectedAyahs(new Set());
    }
  };

  const getSelectedAyahsInfo = () => {
    if (selectionType === 'surah') {
      const surahAyahs = (pageData?.ayahs || []).filter((ayah: any) => ayah.surah?.number === selectedSurah);
      if (!surahAyahs.length) return [];
      const firstAyah = surahAyahs[0];
      const lastAyah = surahAyahs[surahAyahs.length - 1];
      return [{
        surah: selectedSurah,
        ayahStart: firstAyah.numberInSurah,
        ayahEnd: lastAyah.numberInSurah,
        surahName: firstAyah.surah?.name
      }];
    } else if (selectionType === 'page') {
      if (!pageData?.ayahs || pageData.ayahs.length === 0) return [];
      const firstAyah = pageData.ayahs[0];
      const lastAyah = pageData.ayahs[pageData.ayahs.length - 1];
      return [{
        surah: firstAyah.surah?.number,
        ayahStart: firstAyah.numberInSurah,
        ayahEnd: lastAyah.numberInSurah,
        surahName: firstAyah.surah?.name
      }];
    } else {
      // Fix: use fullSurahData.ayahs for ayah selection mode
      if (!fullSurahData?.ayahs || selectedAyahs.size === 0) return [];
      const selectedAyahsFromSurah = fullSurahData.ayahs.filter((ayah: any) => selectedAyahs.has(ayah.numberInSurah));
      if (selectedAyahsFromSurah.length === 0) return [];
      // Group consecutive ayahs
      const sortedAyahs = selectedAyahsFromSurah.sort((a: any, b: any) => a.numberInSurah - b.numberInSurah);
      const groups = [];
      let start = sortedAyahs[0];
      let end = sortedAyahs[0];
      for (let i = 1; i < sortedAyahs.length; i++) {
        if (sortedAyahs[i].numberInSurah === end.numberInSurah + 1) {
          end = sortedAyahs[i];
        } else {
          groups.push({ start, end });
          start = sortedAyahs[i];
          end = sortedAyahs[i];
        }
      }
      groups.push({ start, end });
      return groups.map(group => ({
        surah: selectedSurah,
        ayahStart: group.start.numberInSurah,
        ayahEnd: group.end.numberInSurah,
        surahName: fullSurahData.name
      }));
    }
  };

  const handleConfirm = () => {
    const selections = getSelectedAyahsInfo();
    if (selections.length === 0) return;
    
    onConfirm(selections, name, description, memorizationLevel);
  };

  const selections = getSelectedAyahsInfo();



  // After all hooks, do the early return
  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setNameEdited(true);
  };
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
    setDescriptionEdited(true);
  };

  // In the ayah selection UI, count and highlight only selected ayahs for the selectedSurah
  const selectedAyahsForSurah = Array.from(selectedAyahs).filter(num => {
    if (!fullSurahData?.ayahs) return false;
    return fullSurahData.ayahs.some((a: any) => a.numberInSurah === num);
  });

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 bg-transparent border-none shadow-none">
        <DialogTitle className="sr-only">Add for Review</DialogTitle>
        <DialogDescription className="sr-only">Select ayahs, pages, or surahs to add for memorization review</DialogDescription>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] shadow-2xl border flex flex-col pb-32">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Add for Review
                </h3>
                {selections.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {selections.length} selection{selections.length > 1 ? 's' : ''}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selections.map((selection, index) => (
                        <span key={index}>
                          {selection.surahName} {selection.ayahStart}{selection.ayahStart !== selection.ayahEnd ? `-${selection.ayahEnd}` : ''}
                          {index < selections.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Selection Type */}
              <div className="space-y-2">
                <Label>Selection Type</Label>
                <Select value={selectionType} onValueChange={(value: 'surah' | 'page' | 'ayahs') => setSelectionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surah">Entire Surah</SelectItem>
                    <SelectItem value="page">Entire Page ({currentPage})</SelectItem>
                    <SelectItem value="ayahs">Select Ayahs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Surah selection dropdown if multiple surahs on page */}
              {selectionType !== 'page' && pageData?.ayahs && Array.from(new Set(pageData.ayahs.map((a: any) => a.surah?.number))).length > 1 && (
                <div className="mb-2">
                  <Label>Surah</Label>
                  <Select value={selectedSurah?.toString() || ''} onValueChange={v => setSelectedSurah(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(pageData.ayahs.map((a: any) => a.surah?.number))).filter((n): n is number => typeof n === 'number').map((surahNum: number) => {
                        const surah = pageData.ayahs.find((a: any) => a.surah?.number === surahNum)?.surah;
                        return (
                          <SelectItem key={surahNum} value={surahNum.toString()}>{surah?.name || `Surah ${surahNum}`}</SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Surah Selection Summary */}
              {selectionType === 'surah' && fullSurahData && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 text-center">
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-200 mb-1">{fullSurahData.name}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-300 mb-1">{fullSurahData.englishName} ({fullSurahData.englishNameTranslation})</div>
                  <div className="text-xs text-blue-500 dark:text-blue-400">{fullSurahData.ayahs.length} ayahs</div>
                </div>
              )}

              {/* Ayah Selection */}
              {selectionType === 'ayahs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ayahs ({selectedAyahsForSurah.length} selected)</Label>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={selectAllAyahs}>
                        All Current Surah
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear All
                      </Button>
                    </div>
                  </div>
                  
                  {/* Show info about multi-surah selections */}
                  {selections.length > 1 && (
                    <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                      <div className="font-medium mb-1">Multi-Surah Selection</div>
                      <div>You have selected ayahs from {selections.length} different surahs. Each surah will be created as a separate memorization item.</div>
                    </div>
                  )}

                  {/* Quick Range Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Quick Range Selection</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs" htmlFor="start-ayah-input">Start Ayah</Label>
                        <Input
                          id="start-ayah-input"
                          type="number"
                          min="1"
                          max={fullSurahData?.ayahs?.length || pageData?.ayahs?.length || 1}
                          value={customRange.start || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              handleRangeChange('start', value);
                            } else if (e.target.value === '') {
                              handleRangeChange('start', 1);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs" htmlFor="end-ayah-input">End Ayah</Label>
                        <Input
                          id="end-ayah-input"
                          type="number"
                          min={customRange.start || 1}
                          max={fullSurahData?.ayahs?.length || pageData?.ayahs?.length || 1}
                          value={customRange.end || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              handleRangeChange('end', value);
                            } else if (e.target.value === '') {
                              handleRangeChange('end', customRange.start || 1);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Range inputs update in real-time as you select ayahs
                    </div>
                  </div>
                  
                  {/* All Surah Ayahs */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                        All Surah Ayahs
                      </Label>
                      {loadingSurah && (
                        <span className="text-xs text-muted-foreground">Loading...</span>
                      )}
                    </div>
                    <div 
                      ref={setSurahContainerRef}
                      className="max-h-48 overflow-y-auto border border-green-200 dark:border-green-800 rounded-md p-2 bg-green-50/30 dark:bg-green-950/20"
                    >
                      {loadingSurah ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                          <span className="ml-2 text-sm text-green-600 dark:text-green-400">Loading ayahs...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                          {(() => {
                            const allAyahs = (fullSurahData?.ayahs || []).map((ayah: any) => ({ ...ayah, surah: { ...ayah.surah, number: selectedSurah } }));
                            const pageAyahNumbers = new Set((pageData?.ayahs || []).filter((ayah: any) => ayah.surah?.number === selectedSurah).map((ayah: any) => ayah.numberInSurah));
                            return allAyahs.map((ayah: any) => {
                              const isOnPage = pageAyahNumbers.has(ayah.numberInSurah);
                              const isSelected = selectedAyahsForSurah.includes(ayah.numberInSurah);
                              return (
                                <Button
                                  key={ayah.number}
                                  data-ayah={ayah.numberInSurah}
                                  variant={isSelected ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleAyahToggle(ayah.numberInSurah)}
                                  className={`h-8 text-xs ${
                                    isSelected
                                      ? 'bg-green-700 text-white border-green-700 hover:bg-green-800'
                                      : isOnPage
                                      ? 'border-green-400 dark:border-green-500 bg-green-100/50 dark:bg-green-900/30'
                                      : ''
                                  }`}
                                >
                                  {ayah.numberInSurah}
                                </Button>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      Ayahs on the current page are highlighted with a darker background
                    </div>
                  </div>


                </div>
              )}

              <Separator />

              {/* Name and Description */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="memorization-name">Name *</Label>
                  <Input
                    id="memorization-name"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Enter name"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="memorization-description">Description</Label>
                  <Input
                    id="memorization-description"
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <Separator />

              {/* Knowledge Level */}
              <div className="space-y-2">
                <Label>Knowledge Level</Label>
                <div className="grid grid-cols-1 gap-2">
                  {MEMORIZATION_LEVELS.map((level) => (
                    <Button
                      key={level.value}
                      variant={memorizationLevel === level.value ? "default" : "outline"}
                      onClick={() => setMemorizationLevel(level.value)}
                      className="justify-between h-10"
                    >
                      <span className="text-sm">{level.label}</span>
                      <Badge variant={memorizationLevel === level.value ? "secondary" : "outline"} className="text-xs">
                        {level.interval}d
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>


            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 p-6 border-t bg-background">
              <Button
                onClick={handleConfirm}
                disabled={selections.length === 0 || !name.trim()}
                className="flex-1"
              >
                Add for Review
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 