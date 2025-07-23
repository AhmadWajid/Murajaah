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
import { useRouter, useSearchParams } from 'next/navigation';
import QuranSelector from '@/components/QuranSelector';

interface EnhancedMemorizationModalProps {
  isOpen: boolean;
  currentPage: number;
  currentSurah: number;
  pageData: any;
  selectedAyahs?: Set<{surah: number, ayah: number}>;
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
  if (!isOpen) return null;
  const searchParams = useSearchParams();
  // All useState and useEffect hooks must be at the top
  const [selectionType, setSelectionType] = useState<'surah' | 'page' | 'ayahs' | 'custom'>('page');
  const [selectedAyahs, setSelectedAyahs] = useState<Set<{surah: number, ayah: number}>>(new Set());
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

  // Set selectionType to 'custom' if addReview param is present and modal is open
  useEffect(() => {
    if (isOpen && searchParams.get('addReview')) {
      setSelectionType('custom');
    }
  }, [isOpen, searchParams]);

  // Initialize modal state when it opens
  useEffect(() => {
    if (!isOpen) return;
    if (searchParams.get('addReview')) {
      setSelectionType('custom');
      return; // Skip other initialization
    }
    if (pageData?.ayahs && pageData.ayahs.length > 0) {
      const uniqueSurahs = Array.from(new Set(pageData.ayahs.map((ayah: any) => ayah.surah?.number))).filter((n): n is number => typeof n === 'number');
      const defaultSurah = uniqueSurahs[0] ?? null;
      if (externalSelectedAyahs && externalSelectedAyahs.size > 0) {
        setSelectionType('ayahs');
        setSelectedAyahs(new Set(externalSelectedAyahs));
        const firstSelectedAyah = Array.from(externalSelectedAyahs)[0];
        const ayahObj = pageData.ayahs.find((a: any) => a.surah?.number === firstSelectedAyah.surah && a.numberInSurah === firstSelectedAyah.ayah);
        const targetSurah = ayahObj?.surah?.number ?? defaultSurah;
        setSelectedSurah(targetSurah);
        const sorted = Array.from(externalSelectedAyahs).sort((a, b) => a.ayah - b.ayah);
        const minAyah = sorted[0].ayah;
        const maxAyah = sorted[sorted.length - 1].ayah;
        setCustomRange({ start: minAyah, end: maxAyah });
      } else {
        setSelectionType('page');
        setSelectedSurah(defaultSurah);
        setSelectedAyahs(new Set());
        setCustomRange({ start: 1, end: 1 });
      }
    }
  }, [isOpen, pageData, externalSelectedAyahs, searchParams]);

  // All variable and function declarations
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setNameEdited(true);
  };
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
    setDescriptionEdited(true);
  };

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
  }, [selectedSurah, selectionType, isOpen, externalSelectedAyahs, pageData]);



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
      const sorted = Array.from(selectedAyahs).sort((a, b) => a.ayah - b.ayah);
      setCustomRange({ start: sorted[0].ayah, end: sorted[sorted.length - 1].ayah });
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

  // In the ayah selection UI, count and highlight only selected ayahs for the selectedSurah
  const selectedAyahsForSurah = Array.from(selectedAyahs).filter(ayah => {
    if (!fullSurahData?.ayahs) return false;
    return fullSurahData.ayahs.some((a: any) => a.numberInSurah === ayah.ayah);
  });

  // Get total count of all selected ayahs (from all surahs)
  const totalSelectedAyahs = selectedAyahs.size;
  // Get count of selected ayahs for the current surah only
  const selectedAyahsForCurrentSurah = selectedAyahsForSurah.length;

  // Selection type handler
  const handleSelectionTypeChange = (value: 'surah' | 'page' | 'ayahs' | 'custom') => {
    setSelectionType(value);
  };

  // Function to clear the selection
  const clearSelection = () => {
    setSelectedAyahs(new Set());
    setCustomRange({ start: 1, end: 1 });
    setNameEdited(false);
    setDescriptionEdited(false);
  };

  // Function to select all ayahs for the current surah
  const selectAllAyahs = () => {
    if (!fullSurahData?.ayahs) return;
    const ayahsForSurah = (fullSurahData.ayahs || []).filter((ayah: any) => ayah.surah?.number === selectedSurah);
    if (ayahsForSurah.length > 0) {
      setCustomRange({ start: ayahsForSurah[0].numberInSurah, end: ayahsForSurah[ayahsForSurah.length - 1].numberInSurah });
      setSelectedAyahs(new Set(ayahsForSurah.map((ayah: any) => ({ surah: selectedSurah, ayah: ayah.numberInSurah }))));
    }
  };

  // Function to handle ayah toggle
  const handleAyahToggle = (ayah: { surah: number; ayah: number }) => {
    setSelectedAyahs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ayah)) {
        newSet.delete(ayah);
      } else {
        newSet.add(ayah);
      }
      return newSet;
    });
    setNameEdited(true);
    setDescriptionEdited(true);
  };

  // Function to handle range change
  const handleRangeChange = (type: 'start' | 'end', value: number) => {
    setCustomRange(prev => ({ ...prev, [type]: value }));
    setNameEdited(true);
    setDescriptionEdited(true);
  };

  // Function to load full surah data
  const loadFullSurah = async (surahNumber: number) => {
    setLoadingSurah(true);
    try {
      const surah = await getSurah(surahNumber);
      setFullSurahData(surah);
      setSelectedSurah(surahNumber);
      setNameEdited(false);
      setDescriptionEdited(false);
    } catch (error) {
      console.error('Error loading surah:', error);
      // Optionally show an error message to the user
    } finally {
      setLoadingSurah(false);
    }
  };

  // Function to scroll to the first selected ayah
  const scrollToFirstSelectedAyah = () => {
    if (!surahContainerRef) return;
    const firstSelectedAyah = Array.from(selectedAyahs)[0];
    if (firstSelectedAyah) {
      const ayahElement = surahContainerRef.querySelector(`[data-ayah="${firstSelectedAyah.ayah}"]`);
      if (ayahElement) {
        ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Function to scroll to the current page's ayahs
  const scrollToCurrentPageAyahs = () => {
    if (!surahContainerRef) return;
    const currentPageAyahs = (pageData?.ayahs || []).filter((ayah: any) => ayah.surah?.number === selectedSurah);
    if (currentPageAyahs.length > 0) {
      const firstAyahElement = surahContainerRef.querySelector(`[data-ayah="${currentPageAyahs[0].numberInSurah}"]`);
      if (firstAyahElement) {
        firstAyahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Function to handle confirm
  const handleConfirm = () => {
    if (selections.length === 0 || !name.trim()) {
      alert('Please select ayahs and provide a name.');
      return;
    }
    onConfirm(selections, name, description, memorizationLevel);
    onClose();
  };

  // Function to get the current selections for the modal
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
    } else if (selectionType === 'custom') {
      // For custom, use selectedAyahs and customRange
      if (selectedAyahs.size === 0) return [];
      const sorted = Array.from(selectedAyahs).sort((a, b) => a.ayah - b.ayah);
      const minAyah = sorted[0].ayah;
      const maxAyah = sorted[sorted.length - 1].ayah;
      return [{
        surah: selectedSurah,
        ayahStart: minAyah,
        ayahEnd: maxAyah,
        surahName: fullSurahData?.name || ''
      }];
    } else {
      // Ayah selection mode - handle multi-surah selections
      if (selectedAyahs.size === 0) return [];
      // Group selected ayahs by surah
      const groupedBySurah: { [key: number]: { surah: number, ayah: number }[] } = {};
      Array.from(selectedAyahs).forEach(sel => {
        if (!groupedBySurah[sel.surah]) groupedBySurah[sel.surah] = [];
        groupedBySurah[sel.surah].push(sel);
      });
      // Process each surah group
      const selections: Array<{surah: number, ayahStart: number, ayahEnd: number, surahName: string}> = [];
      for (const [surahNumber, ayahs] of Object.entries(groupedBySurah)) {
        const sortedAyahs = ayahs.sort((a, b) => a.ayah - b.ayah);
        // Group consecutive ayahs within each surah
        const groups = [];
        let start = sortedAyahs[0];
        let end = sortedAyahs[0];
        for (let i = 1; i < sortedAyahs.length; i++) {
          if (sortedAyahs[i].ayah === end.ayah + 1) {
            end = sortedAyahs[i];
          } else {
            groups.push({ start, end });
            start = sortedAyahs[i];
            end = sortedAyahs[i];
          }
        }
        groups.push({ start, end });
        // Add each group as a selection
        groups.forEach(group => {
          selections.push({
            surah: Number(surahNumber),
            ayahStart: group.start.ayah,
            ayahEnd: group.end.ayah,
            surahName: `Surah ${surahNumber}`
          });
        });
      }
      return selections;
    }
  };

  const selections = getSelectedAyahsInfo();

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
                      {selections.map((selection, index) => {
                        const start = Math.min(selection.ayahStart, selection.ayahEnd);
                        const end = Math.max(selection.ayahStart, selection.ayahEnd);
                        return (
                          <span key={index}>
                            {selection.surahName} {start}{start !== end ? `-${end}` : ''}
                            {index < selections.length - 1 ? ', ' : ''}
                          </span>
                        );
                      })}
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
                <Select value={selectionType} onValueChange={handleSelectionTypeChange}>
                  <SelectTrigger>
                    <SelectValue>
                      {selectionType === 'surah' && 'Entire Surah'}
                      {selectionType === 'page' && `Entire Page (${currentPage})`}
                      {selectionType === 'ayahs' && 'Select Ayahs'}
                      {selectionType === 'custom' && 'Custom...'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surah">Entire Surah</SelectItem>
                    <SelectItem value="page">Entire Page ({currentPage})</SelectItem>
                    <SelectItem value="ayahs">Select Ayahs</SelectItem>
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Render QuranSelector for Custom mode */}
              {selectionType === 'custom' ? (
                <QuranSelector onAdd={onClose} hideSelectionType={true} />
              ) : (
                <>
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
                        <Label>Ayahs ({totalSelectedAyahs} selected)</Label>
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
                                const pageAyahNumbers = new Set<{surah: number, ayah: number}>((pageData?.ayahs || []).filter((ayah: any) => ayah.surah?.number === selectedSurah).map((ayah: any) => ({ surah: selectedSurah, ayah: ayah.numberInSurah })));
                                return allAyahs.map((ayah: any) => {
                                  const isOnPage = Array.from(pageAyahNumbers).some(pageAyah => pageAyah.surah === selectedSurah && pageAyah.ayah === ayah.numberInSurah);
                                  const isSelected = Array.from(selectedAyahs).some(sel => sel.surah === selectedSurah && sel.ayah === ayah.numberInSurah);
                                  return (
                                    <Button
                                      key={ayah.number}
                                      data-ayah={ayah.numberInSurah}
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => selectedSurah && handleAyahToggle({ surah: selectedSurah, ayah: ayah.numberInSurah })}
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


                </>
              )}
            </div>

            {/* Action Buttons (hide in custom mode, handled by QuranSelector) */}
            {selectionType !== 'custom' && (
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
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 