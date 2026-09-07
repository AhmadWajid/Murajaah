'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getSurah } from '@/lib/quranService';
import { getSurahName, getAyahCount, SURAH_NAMES } from '@/lib/quran';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BookPlus, X, FileText, BookOpen, Hash, SlidersHorizontal, CheckCircle2, GraduationCap } from 'lucide-react';

interface EnhancedMemorizationModalProps {
  isOpen: boolean;
  currentPage: number;
  currentSurah: number;
  pageData: any;
  selectedAyahs?: Set<{ surah: number; ayah: number }>;
  onConfirm: (selections: any[], name: string, description?: string, memorizationLevel?: string, memorizationAge?: number, isBeginner?: boolean) => void;
  onClose: () => void;
}

type FamiliarityLevel = 'new' | 'familiar' | 'confident';

const FAMILIARITY_OPTIONS: { value: FamiliarityLevel; label: string; desc: string; icon: typeof GraduationCap }[] = [
  {
    value: 'new',
    label: 'Newly memorized',
    desc: 'Just learned it, still getting comfortable',
    icon: GraduationCap,
  },
  {
    value: 'familiar',
    label: 'Somewhat familiar',
    desc: 'Know it but make some mistakes',
    icon: BookOpen,
  },
  {
    value: 'confident',
    label: 'Well memorized',
    desc: 'Confident, memorized a while ago',
    icon: CheckCircle2,
  },
];

const SELECTION_TYPES = [
  { value: 'page' as const, label: 'Page', icon: FileText },
  { value: 'surah' as const, label: 'Surah', icon: BookOpen },
  { value: 'ayahs' as const, label: 'Ayahs', icon: Hash },
  { value: 'custom' as const, label: 'Custom', icon: SlidersHorizontal },
];

export default function EnhancedMemorizationModal({
  isOpen,
  currentPage,
  currentSurah,
  pageData,
  selectedAyahs: externalSelectedAyahs,
  onConfirm,
  onClose,
}: EnhancedMemorizationModalProps) {
  const searchParams = useSearchParams();
  const isAddReviewMode = !!searchParams.get('addReview');

  const [selectionType, setSelectionType] = useState<'surah' | 'page' | 'ayahs' | 'custom'>('page');
  const [selectedAyahs, setSelectedAyahs] = useState<Set<{ surah: number; ayah: number }>>(new Set());
  const [customRange, setCustomRange] = useState({ start: 1, end: 1 });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [familiarity, setFamiliarity] = useState<FamiliarityLevel>('new');
  const [fullSurahData, setFullSurahData] = useState<any>(null);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [surahContainerRef, setSurahContainerRef] = useState<HTMLDivElement | null>(null);
  const [nameEdited, setNameEdited] = useState(false);
  const [descriptionEdited, setDescriptionEdited] = useState(false);
  // String-based input state so users can freely type/clear/edit numbers
  const [customStartStr, setCustomStartStr] = useState('1');
  const [customEndStr, setCustomEndStr] = useState('1');
  const [rangeStartStr, setRangeStartStr] = useState('1');
  const [rangeEndStr, setRangeEndStr] = useState('1');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);

  // Custom mode state (replaces QuranSelector integration)
  const [customSurah, setCustomSurah] = useState(currentSurah || 1);
  const [customAyahStart, setCustomAyahStart] = useState(1);
  const [customAyahEnd, setCustomAyahEnd] = useState(1);

  // Whether we have Quran page context (from the Quran reader)
  const hasPageContext = !!(pageData?.ayahs?.length > 0);

  // ─── Initialization ───
  useEffect(() => {
    if (!isOpen) return;
    if (isAddReviewMode || !hasPageContext) {
      setSelectionType('custom');
      setCustomSurah(currentSurah || 1);
      setCustomAyahStart(1);
      setCustomAyahEnd(1);
      setCustomStartStr('1');
      setCustomEndStr('1');
      return;
    }
    if (pageData?.ayahs?.length > 0) {
      const uniqueSurahs = Array.from(new Set(pageData.ayahs.map((a: any) => a.surah?.number))).filter(
        (n): n is number => typeof n === 'number',
      );
      const defaultSurah = uniqueSurahs[0] ?? null;
      if (externalSelectedAyahs && externalSelectedAyahs.size > 0) {
        setSelectionType('ayahs');
        setSelectedAyahs(new Set(externalSelectedAyahs));
        const first = Array.from(externalSelectedAyahs)[0];
        const ayahObj = pageData.ayahs.find(
          (a: any) => a.surah?.number === first.surah && a.numberInSurah === first.ayah,
        );
        setSelectedSurah(ayahObj?.surah?.number ?? defaultSurah);
        const sorted = Array.from(externalSelectedAyahs).sort((a, b) => a.ayah - b.ayah);
        const s = sorted[0].ayah;
        const e = sorted[sorted.length - 1].ayah;
        setCustomRange({ start: s, end: e });
        setRangeStartStr(String(s));
        setRangeEndStr(String(e));
      } else {
        setSelectionType('page');
        setSelectedSurah(defaultSurah);
        setSelectedAyahs(new Set());
        setCustomRange({ start: 1, end: 1 });
      }
    }
  }, [isOpen, pageData, externalSelectedAyahs, isAddReviewMode, currentSurah]);

  // Load full surah data when needed
  useEffect(() => {
    if (!isOpen || !selectedSurah) return;
    if (selectionType === 'ayahs' || selectionType === 'surah') {
      loadFullSurah(selectedSurah);
    }
  }, [selectedSurah, selectionType, isOpen]);

  // Auto-generate name/description when selection changes (unless user edited)
  useEffect(() => {
    if (!isOpen) return;
    if (nameEdited && descriptionEdited) return;

    let autoName = '';
    let autoDesc = '';
    if (selectionType === 'page') {
      autoName = `Page ${currentPage} — ${pageData?.surah?.name || pageData?.ayahs?.[0]?.surah?.englishName || `Surah ${currentSurah}`}`;
      autoDesc = `Memorization set for page ${currentPage}`;
    } else if (selectionType === 'surah' && fullSurahData) {
      autoName = `Surah ${fullSurahData.englishName} — Entire Surah`;
      autoDesc = `Memorization set for all ${fullSurahData.ayahs?.length || ''} ayahs of ${fullSurahData.englishName}`;
    } else if (selectionType === 'ayahs' && selectedSurah) {
      const surahName = fullSurahData?.englishName || getSurahName(selectedSurah);
      autoName = `Surah ${surahName} — Selected Ayahs`;
      autoDesc = `Memorization set for selected ayahs from ${surahName}`;
    } else if (selectionType === 'custom') {
      const surahName = getSurahName(customSurah);
      const range = customAyahStart === customAyahEnd ? `Ayah ${customAyahStart}` : `Ayahs ${customAyahStart}-${customAyahEnd}`;
      autoName = `Surah ${surahName} — ${range}`;
      autoDesc = `Review set for Surah ${surahName}`;
    }
    if (!nameEdited) setName(autoName);
    if (!descriptionEdited) setDescription(autoDesc);
  }, [
    selectionType,
    isOpen,
    currentPage,
    currentSurah,
    pageData,
    fullSurahData,
    selectedSurah,
    customSurah,
    customAyahStart,
    customAyahEnd,
    nameEdited,
    descriptionEdited,
  ]);

  // Scroll to selected/page ayahs when surah data loads
  useEffect(() => {
    if (!fullSurahData || loadingSurah || !isOpen) return;
    const timer = setTimeout(() => {
      if (selectedAyahs.size > 0) scrollToFirstSelectedAyah();
      else scrollToCurrentPageAyahs();
    }, 100);
    return () => clearTimeout(timer);
  }, [fullSurahData, loadingSurah, isOpen, selectedAyahs]);

  // Keep quick range in sync with grid selection
  useEffect(() => {
    if (selectionType === 'ayahs' && selectedAyahs.size > 0) {
      const sorted = Array.from(selectedAyahs).sort((a, b) => a.ayah - b.ayah);
      const s = sorted[0].ayah;
      const e = sorted[sorted.length - 1].ayah;
      setCustomRange({ start: s, end: e });
      setRangeStartStr(String(s));
      setRangeEndStr(String(e));
    }
  }, [selectedAyahs, selectionType]);

  // ─── Handlers ───
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
    } finally {
      setLoadingSurah(false);
    }
  };

  const handleAyahToggle = (ayah: { surah: number; ayah: number }) => {
    setSelectedAyahs((prev) => {
      const next = new Set(prev);
      if (next.has(ayah)) next.delete(ayah);
      else next.add(ayah);
      return next;
    });
    setNameEdited(true);
    setDescriptionEdited(true);
  };

  const handleRangeChange = (type: 'start' | 'end', value: number) => {
    setCustomRange((prev) => ({ ...prev, [type]: value }));
    setNameEdited(true);
    setDescriptionEdited(true);
  };

  const handleCustomSurahChange = (surah: number) => {
    setCustomSurah(surah);
    setCustomAyahStart(1);
    setCustomAyahEnd(1);
    setCustomStartStr('1');
    setCustomEndStr('1');
    setNameEdited(false);
    setDescriptionEdited(false);
  };

  const clearSelection = () => {
    setSelectedAyahs(new Set());
    setCustomRange({ start: 1, end: 1 });
    setNameEdited(false);
    setDescriptionEdited(false);
  };

  const selectAllAyahs = () => {
    if (!fullSurahData?.ayahs) return;
    const ayahsForSurah = fullSurahData.ayahs.filter((a: any) => a.surah?.number === selectedSurah);
    if (ayahsForSurah.length > 0) {
      setCustomRange({
        start: ayahsForSurah[0].numberInSurah,
        end: ayahsForSurah[ayahsForSurah.length - 1].numberInSurah,
      });
      setSelectedAyahs(new Set(ayahsForSurah.map((a: any) => ({ surah: selectedSurah!, ayah: a.numberInSurah }))));
    }
  };

  const scrollToFirstSelectedAyah = () => {
    if (!surahContainerRef) return;
    const first = Array.from(selectedAyahs)[0];
    if (first) {
      const el = surahContainerRef.querySelector(`[data-ayah="${first.ayah}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToCurrentPageAyahs = () => {
    if (!surahContainerRef) return;
    const pageAyahs = (pageData?.ayahs || []).filter((a: any) => a.surah?.number === selectedSurah);
    if (pageAyahs.length > 0) {
      const el = surahContainerRef.querySelector(`[data-ayah="${pageAyahs[0].numberInSurah}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ─── Selection computation ───
  const selections = useMemo(() => {
    if (selectionType === 'surah') {
      // Always use full surah data, not just the ayahs on the current page
      if (fullSurahData?.ayahs?.length) {
        return [{
          surah: selectedSurah,
          ayahStart: 1,
          ayahEnd: fullSurahData.ayahs.length,
          surahName: fullSurahData.englishName || getSurahName(selectedSurah!),
        }];
      }
      // Fallback: if full surah data isn't loaded yet, use page ayahs
      const surahAyahs = (pageData?.ayahs || []).filter((a: any) => a.surah?.number === selectedSurah);
      if (!surahAyahs.length) return [];
      return [{
        surah: selectedSurah,
        ayahStart: surahAyahs[0].numberInSurah,
        ayahEnd: surahAyahs[surahAyahs.length - 1].numberInSurah,
        surahName: surahAyahs[0].surah?.englishName || getSurahName(selectedSurah!),
      }];
    }
    if (selectionType === 'page') {
      if (!pageData?.ayahs?.length) return [];
      const first = pageData.ayahs[0];
      const last = pageData.ayahs[pageData.ayahs.length - 1];
      return [{
        surah: first.surah?.number,
        ayahStart: first.numberInSurah,
        ayahEnd: last.numberInSurah,
        surahName: first.surah?.englishName || getSurahName(first.surah?.number),
      }];
    }
    if (selectionType === 'custom') {
      if (!customSurah) return [];
      return [{
        surah: customSurah,
        ayahStart: Math.min(customAyahStart, customAyahEnd),
        ayahEnd: Math.max(customAyahStart, customAyahEnd),
        surahName: getSurahName(customSurah),
      }];
    }
    // 'ayahs' mode — group by surah, merge consecutive
    if (selectedAyahs.size === 0) return [];
    const grouped: Record<number, { surah: number; ayah: number }[]> = {};
    for (const sel of selectedAyahs) {
      if (!grouped[sel.surah]) grouped[sel.surah] = [];
      grouped[sel.surah].push(sel);
    }
    const result: Array<{ surah: number; ayahStart: number; ayahEnd: number; surahName: string }> = [];
    for (const [surahNum, ayahs] of Object.entries(grouped)) {
      const sorted = ayahs.sort((a, b) => a.ayah - b.ayah);
      let start = sorted[0];
      let end = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].ayah === end.ayah + 1) {
          end = sorted[i];
        } else {
          result.push({
            surah: Number(surahNum),
            ayahStart: start.ayah,
            ayahEnd: end.ayah,
            surahName: getSurahName(Number(surahNum)),
          });
          start = sorted[i];
          end = sorted[i];
        }
      }
      result.push({
        surah: Number(surahNum),
        ayahStart: start.ayah,
        ayahEnd: end.ayah,
        surahName: getSurahName(Number(surahNum)),
      });
    }
    return result;
  }, [selectionType, pageData, selectedSurah, fullSurahData, customSurah, customAyahStart, customAyahEnd, selectedAyahs]);

  const totalSelectedAyahs = selectedAyahs.size;

  const summarizeSelections = (sels: any[]) => {
    const grouped: Record<string, Array<{ start: number; end: number }>> = {};
    sels.forEach((sel) => {
      const surah = sel.surahName || `Surah ${sel.surah}`;
      const start = Math.min(sel.ayahStart, sel.ayahEnd);
      const end = Math.max(sel.ayahStart, sel.ayahEnd);
      if (!grouped[surah]) grouped[surah] = [];
      grouped[surah].push({ start, end });
    });
    const merged: Record<string, Array<{ start: number; end: number }>> = {};
    Object.entries(grouped).forEach(([surah, ranges]) => {
      const sorted = ranges.sort((a, b) => a.start - b.start);
      const mergedRanges: Array<{ start: number; end: number }> = [];
      for (const range of sorted) {
        if (!mergedRanges.length) {
          mergedRanges.push(range);
        } else {
          const last = mergedRanges[mergedRanges.length - 1];
          if (range.start <= last.end + 1) last.end = Math.max(last.end, range.end);
          else mergedRanges.push(range);
        }
      }
      merged[surah] = mergedRanges;
    });
    return Object.entries(merged).map(([surah, ranges]) => (
      <span key={surah}>
        {surah}{' '}
        {ranges.map((r, i) => `${r.start}${r.start !== r.end ? `-${r.end}` : ''}${i < ranges.length - 1 ? ', ' : ''}`).join('')}
      </span>
    ));
  };

  const handleConfirm = () => {
    if (selections.length === 0 || !name.trim()) return;
    // Derive memorization age and beginner mode from familiarity level
    const ageMap: Record<FamiliarityLevel, number> = {
      new: 0,        // just memorized
      familiar: 14,  // ~2 weeks
      confident: 90, // ~3 months
    };
    const beginnerMap: Record<FamiliarityLevel, boolean> = {
      new: true,
      familiar: false,
      confident: false,
    };
    onConfirm(selections, name, description, undefined, ageMap[familiarity], beginnerMap[familiarity]);
    onClose();
  };

  const canConfirm = selections.length > 0 && name.trim().length > 0;

  // Unique surahs on the current page (for surah sub-selector)
  const pageSurahs = useMemo(() => {
    if (!pageData?.ayahs) return [];
    const seen = new Set<number>();
    const result: Array<{ number: number; name: string }> = [];
    for (const a of pageData.ayahs) {
      if (a.surah?.number && !seen.has(a.surah.number)) {
        seen.add(a.surah.number);
        result.push({ number: a.surah.number, name: a.surah.name || a.surah.englishName || `Surah ${a.surah.number}` });
      }
    }
    return result;
  }, [pageData]);

  const customMaxAyahs = getAyahCount(customSurah);

  // ─── Render ───
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 rounded-[var(--radius-2xl)] overflow-hidden max-h-[90vh] flex flex-col"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Add for Review</DialogTitle>
        <DialogDescription className="sr-only">
          Select ayahs, pages, or surahs to add for memorization review
        </DialogDescription>

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-accent/15 flex items-center justify-center flex-shrink-0">
              <BookPlus className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground leading-tight">Add for Review</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Choose what to memorize and track</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* ─── Body (scrollable) ─── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-background">
          {/* Selection Type — Segmented Control (only when on Quran page) */}
          {hasPageContext && (
          <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-[var(--radius)]">
            {SELECTION_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSelectionType(value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-[var(--radius-sm)] text-xs font-semibold transition-all duration-150',
                  selectionType === value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          )}

          {/* ─── Mode-specific content ─── */}

          {/* PAGE mode */}
          {selectionType === 'page' && pageData?.ayahs?.length > 0 && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-[var(--radius)] bg-accent/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">Page {currentPage}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pageSurahs.length} {pageSurahs.length === 1 ? 'surah' : 'surahs'} ·{' '}
                  {pageData.ayahs.length} ayahs
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {pageSurahs.map((s) => s.name).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* SURAH mode */}
          {selectionType === 'surah' && (
            <div className="space-y-3">
              {pageSurahs.length > 1 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Surah</Label>
                  <Select value={selectedSurah?.toString() || ''} onValueChange={(v) => setSelectedSurah(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {pageSurahs.map((s) => (
                        <SelectItem key={s.number} value={s.number.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {fullSurahData && (
                <div className="rounded-[var(--radius-lg)] border border-accent/20 bg-accent/5 p-4 text-center">
                  <div className="text-lg font-bold text-accent mb-1">{fullSurahData.name}</div>
                  <div className="text-sm text-foreground/80 mb-1">
                    {fullSurahData.englishName} — {fullSurahData.englishNameTranslation}
                  </div>
                  <div className="text-xs text-muted-foreground">{fullSurahData.ayahs?.length || 0} ayahs</div>
                </div>
              )}
            </div>
          )}

          {/* AYAHS mode */}
          {selectionType === 'ayahs' && (
            <div className="space-y-4">
              {/* Surah selector if multiple surahs on page */}
              {pageSurahs.length > 1 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Surah</Label>
                  <Select value={selectedSurah?.toString() || ''} onValueChange={(v) => setSelectedSurah(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {pageSurahs.map((s) => (
                        <SelectItem key={s.number} value={s.number.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Action bar */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  {totalSelectedAyahs > 0 ? `${totalSelectedAyahs} selected` : 'No ayahs selected'}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllAyahs}>Select all</Button>
                  <Button variant="outline" size="sm" onClick={clearSelection} disabled={totalSelectedAyahs === 0}>
                    Clear
                  </Button>
                </div>
              </div>

              {/* Multi-surah info */}
              {selections.length > 1 && (
                <div className="rounded-[var(--radius-sm)] bg-accent/10 border border-accent/20 px-3 py-2.5 text-xs text-accent-foreground">
                  <span className="font-semibold">Multi-surah selection:</span> Each surah will be created as a separate
                  review item.
                </div>
              )}

              {/* Quick range */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Quick range
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Start</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rangeStartStr}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setRangeStartStr(raw);
                        const v = parseInt(raw);
                        if (!isNaN(v) && v >= 1) handleRangeChange('start', v);
                      }}
                      onBlur={() => {
                        const v = parseInt(rangeStartStr);
                        const max = fullSurahData?.ayahs?.length || 1;
                        if (isNaN(v) || v < 1) { setRangeStartStr('1'); handleRangeChange('start', 1); }
                        else if (v > max) { setRangeStartStr(String(max)); handleRangeChange('start', max); }
                        else setRangeStartStr(String(v));
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">End</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={rangeEndStr}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setRangeEndStr(raw);
                        const v = parseInt(raw);
                        if (!isNaN(v) && v >= 1) handleRangeChange('end', v);
                      }}
                      onBlur={() => {
                        const v = parseInt(rangeEndStr);
                        const max = fullSurahData?.ayahs?.length || 1;
                        const minStart = customRange.start || 1;
                        if (isNaN(v) || v < minStart) { setRangeEndStr(String(minStart)); handleRangeChange('end', minStart); }
                        else if (v > max) { setRangeEndStr(String(max)); handleRangeChange('end', max); }
                        else setRangeEndStr(String(v));
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>
              </div>

              {/* Ayah grid */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    All ayahs in surah
                  </Label>
                  {loadingSurah && <span className="text-xs text-muted-foreground">Loading…</span>}
                </div>
                <div
                  ref={setSurahContainerRef}
                  className="max-h-52 overflow-y-auto rounded-[var(--radius)] border border-border bg-muted/30 p-2"
                >
                  {loadingSurah ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1">
                      {(fullSurahData?.ayahs || []).map((ayah: any) => {
                        const isOnPage = (pageData?.ayahs || []).some(
                          (pa: any) => pa.surah?.number === selectedSurah && pa.numberInSurah === ayah.numberInSurah,
                        );
                        const isSelected = Array.from(selectedAyahs).some(
                          (s) => s.surah === selectedSurah && s.ayah === ayah.numberInSurah,
                        );
                        return (
                          <button
                            key={ayah.number}
                            data-ayah={ayah.numberInSurah}
                            onClick={() => selectedSurah && handleAyahToggle({ surah: selectedSurah, ayah: ayah.numberInSurah })}
                            className={cn(
                              'h-8 rounded-[var(--radius-xs)] text-xs font-semibold transition-all duration-100',
                              isSelected
                                ? 'bg-accent text-accent-foreground shadow-sm'
                                : isOnPage
                                  ? 'bg-accent/10 text-foreground hover:bg-accent/20'
                                  : 'bg-transparent text-muted-foreground hover:bg-secondary',
                            )}
                          >
                            {ayah.numberInSurah}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground text-center">
                  Ayahs on the current page are highlighted
                </p>
              </div>
            </div>
          )}

          {/* CUSTOM mode — built directly into the modal */}
          {selectionType === 'custom' && (
            <div className="space-y-4">
              {/* Surah selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Surah</Label>
                <Select value={customSurah.toString()} onValueChange={(v) => handleCustomSurahChange(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {Object.values(SURAH_NAMES).map((s) => (
                      <SelectItem key={s.number} value={s.number.toString()}>
                        {s.number}. {s.name} ({s.ayahCount} ayahs)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ayah range */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ayah range</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Start</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={customStartStr}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setCustomStartStr(raw);
                        const v = parseInt(raw);
                        if (!isNaN(v) && v >= 1) {
                          setCustomAyahStart(v);
                          if (v > customAyahEnd) { setCustomAyahEnd(v); setCustomEndStr(String(v)); }
                          setNameEdited(false);
                          setDescriptionEdited(false);
                        }
                      }}
                      onBlur={() => {
                        const v = parseInt(customStartStr);
                        if (isNaN(v) || v < 1) { setCustomStartStr('1'); setCustomAyahStart(1); }
                        else if (v > customMaxAyahs) { setCustomStartStr(String(customMaxAyahs)); setCustomAyahStart(customMaxAyahs); }
                        else setCustomStartStr(String(v));
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">End</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={customEndStr}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setCustomEndStr(raw);
                        const v = parseInt(raw);
                        if (!isNaN(v) && v >= 1) {
                          setCustomAyahEnd(v);
                          setNameEdited(false);
                          setDescriptionEdited(false);
                        }
                      }}
                      onBlur={() => {
                        const v = parseInt(customEndStr);
                        const minStart = customAyahStart || 1;
                        if (isNaN(v) || v < minStart) { setCustomEndStr(String(minStart)); setCustomAyahEnd(minStart); }
                        else if (v > customMaxAyahs) { setCustomEndStr(String(customMaxAyahs)); setCustomAyahEnd(customMaxAyahs); }
                        else setCustomEndStr(String(v));
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {getSurahName(customSurah)} has {customMaxAyahs} ayahs
                </p>
              </div>

              {/* Preview chip */}
              <div className="rounded-[var(--radius)] border border-border bg-muted/30 px-3 py-2.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-sm text-foreground font-medium">
                  {getSurahName(customSurah)} {customAyahStart}
                  {customAyahStart !== customAyahEnd ? `-${customAyahEnd}` : ''}
                </span>
              </div>
            </div>
          )}

          {/* ─── Common fields: Name, Description, Memorization Age ─── */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <Label htmlFor="memorization-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="memorization-name"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameEdited(true); }}
                placeholder="Enter a name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="memorization-description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </Label>
              <Input
                id="memorization-description"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setDescriptionEdited(true); }}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                How well do you know this?
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {FAMILIARITY_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFamiliarity(value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2.5 rounded-[var(--radius-md)] border text-center transition-all duration-150',
                      familiarity === value
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-border bg-muted/20 hover:bg-muted/40',
                    )}
                  >
                    <Icon className={cn('w-4 h-4', familiarity === value ? 'text-accent' : 'text-muted-foreground')} />
                    <div className={cn(
                      'text-xs font-semibold leading-tight',
                      familiarity === value ? 'text-foreground' : 'text-foreground/80',
                    )}>
                      {label}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {familiarity === 'new'
                  ? 'Learning mode on — frequent reviews until it sticks.'
                  : familiarity === 'familiar'
                    ? 'Moderate intervals that adapt to your memory.'
                    : 'Longer intervals since you know it well.'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Footer (sticky) ─── */}
        <div className="flex-shrink-0 border-t border-border bg-card">
          {/* Selection summary */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold text-foreground flex-shrink-0">
                {selections.length} {selections.length === 1 ? 'selection' : 'selections'}
              </span>
              {selections.length > 0 && (
                <span className="text-xs text-muted-foreground truncate">
                      {summarizeSelections(selections)}
                    </span>
              )}
            </div>
            {selections.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 px-2 text-xs flex-shrink-0">
                Clear
              </Button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 p-4">
            <Button onClick={handleConfirm} disabled={!canConfirm} className="flex-1" size="lg">
              <BookPlus className="w-4 h-4" />
              Add for Review
            </Button>
            <Button variant="outline" onClick={onClose} size="lg">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
