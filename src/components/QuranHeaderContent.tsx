'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip } from '@/components/ui/tooltip';
import { ControlGroup } from '@/components/ui/control-group';
import { RECITER_GROUPS, getReciterById } from '@/lib/recitations';
import { loadFavoriteReciters, toggleFavoriteReciter } from '@/lib/storage';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Volume2,
  BookOpen,
  Search,
  Maximize2,
  Minimize2,
  Languages,
  Target,
  X,
  Info,
  Keyboard,
  Star,
} from 'lucide-react';
import { getLanguagesWithTranslations } from '@/lib/quranService';
import { getNextMistakeInVerseOrder, getPreviousMistakeInVerseOrder } from '@/lib/storageService';
import { MistakeData } from '@/lib/supabase/database';
import TajweedLegend from '@/components/TajweedLegend';

interface QuranHeaderContentProps {
  currentPage: number;
  currentSurah: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSurahSelect: (surahNumber: number) => void;
  onNavigateToAyah: (surahNumber: number, ayahNumber: number) => void;
  surahList: any[];
  showTranslation: boolean;
  onToggleTranslation: () => void;
  layoutMode: 'spread' | 'single';
  onToggleLayout: () => void;
  selectedReciter: string;
  onReciterChange: (reciter: string) => void;
  onAddRevision: () => void;
  onEnhancedMemorization?: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  padding: number;
  onPaddingChange: (padding: number) => void;
  fontTargetArabic: boolean;
  onToggleFontTarget: () => void;
  hideMistakes?: boolean;
  onToggleHideMistakes?: () => void;
  showWordByWordTooltip?: boolean;
  onToggleWordByWordTooltip?: () => void;
  currentAyah?: number;
  onNavigateToNextMistake?: (surahNumber: number, ayahNumber: number) => void;
  pageData?: any;
  selectedLanguage: string;
  selectedTranslation: string;
  onLanguageChange: (lang: string) => void;
  onTranslationChange: (translation: string) => void;
  hideWords: boolean;
  onToggleHideWords: () => void;
  hideWordsDelay: number;
  onHideWordsDelayChange: (delay: number) => void;
  readingLayout: 'verse';
  onReadingLayoutChange: (layout: 'verse') => void;
}

export default function QuranHeaderContent(props: QuranHeaderContentProps) {
  const {
    currentPage,
    currentSurah,
    totalPages,
    onPageChange,
    onSurahSelect,
    onNavigateToAyah,
    surahList,
    showTranslation,
    onToggleTranslation,
    layoutMode,
    onToggleLayout,
    selectedReciter,
    onReciterChange,
    onEnhancedMemorization,
    fontSize,
    onFontSizeChange,
    padding,
    onPaddingChange,
    fontTargetArabic,
    onToggleFontTarget,
    hideMistakes = false,
    onToggleHideMistakes,
    showWordByWordTooltip = true,
    onToggleWordByWordTooltip,
    currentAyah = 1,
    onNavigateToNextMistake,
    pageData,
    onLanguageChange,
    onTranslationChange,
  } = props;

  const [showViewSettings, setShowViewSettings] = useState(false);
  const [showReciterSelector, setShowReciterSelector] = useState(false);
  const [showSurahSelector, setShowSurahSelector] = useState(false);
  const [surahSearchTerm, setSurahSearchTerm] = useState('');
  const [selectedSurahForAyah, setSelectedSurahForAyah] = useState(currentSurah);
  const [modalViewState, setModalViewState] = useState<'chapters' | 'verses'>('chapters');
  const [verseJumpInput, setVerseJumpInput] = useState('');
  const surahListRef = useRef<HTMLDivElement>(null);
  const reciterListRef = useRef<HTMLDivElement>(null);
  const selectedReciterRef = useRef<HTMLDivElement>(null);
  const [keyboardIndex, setKeyboardIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [audioTab, setAudioTab] = useState<'reciters' | 'info'>('reciters');
  const [showMistakeMenu, setShowMistakeMenu] = useState(false);
  const [showOverflow, setShowOverflow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [favoriteReciters, setFavoriteReciters] = useState<string[]>([]);
  const mistakeBtnRef = useRef<HTMLDivElement>(null);
  const [mistakeMenuPos, setMistakeMenuPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setSelectedSurahForAyah(currentSurah);
  }, [currentSurah]);

  useEffect(() => {
    if (showSurahSelector && modalViewState === 'chapters') {
      const t = setTimeout(() => {
        const el = surahListRef.current?.querySelector('[data-current-surah="true"]') as HTMLElement | null;
        el?.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, 60);
      return () => clearTimeout(t);
    }
  }, [showSurahSelector, modalViewState, currentSurah]);

  useEffect(() => {
    if (showReciterSelector && audioTab === 'reciters') {
      setFavoriteReciters(loadFavoriteReciters());
      const t = setTimeout(() => {
        selectedReciterRef.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, 80);
      return () => clearTimeout(t);
    }
  }, [showReciterSelector, audioTab]);

  useEffect(() => {
    setKeyboardIndex(-1);
  }, [showSurahSelector, surahSearchTerm, modalViewState]);

  useEffect(() => {
    if (showSurahSelector && modalViewState === 'chapters') {
      const t = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [showSurahSelector, modalViewState]);

  const [nextMistake, setNextMistake] = useState<MistakeData | null>(null);
  const [prevMistake, setPrevMistake] = useState<MistakeData | null>(null);
  const hasNextMistake = nextMistake !== null;
  const hasPrevMistake = prevMistake !== null;

  useEffect(() => {
    const loadMistakes = async () => {
      try {
        const [next, prev] = await Promise.all([
          getNextMistakeInVerseOrder(currentSurah, currentAyah, pageData?.ayahs),
          getPreviousMistakeInVerseOrder(currentSurah, currentAyah, pageData?.ayahs),
        ]);
        setNextMistake(next);
        setPrevMistake(prev);
      } catch (error) {
        console.error('Error loading mistakes:', error);
        setNextMistake(null);
        setPrevMistake(null);
      }
    };
    loadMistakes();
  }, [currentSurah, currentAyah, pageData]);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        await getLanguagesWithTranslations();
      } catch (error) {
        console.error('Error loading translations:', error);
      }
    };
    loadTranslations();
  }, []);

  const reciterGroups = RECITER_GROUPS;
  const currentSurahData = surahList.find(s => s.number === currentSurah);
  const surahName = currentSurahData ? currentSurahData.name : 'Unknown Surah';

  const parseDirectSearch = () => {
    const query = surahSearchTerm.trim().toLowerCase();
    if (!query) return null;
    const numericMatch = query.match(/^(\d+)(?:[:\s\-\/]+)(\d+)$/);
    if (numericMatch) {
      const surahNum = parseInt(numericMatch[1]);
      const ayahNum = parseInt(numericMatch[2]);
      const surah = surahList.find(s => s.number === surahNum);
      if (surah && ayahNum >= 1 && ayahNum <= surah.numberOfAyahs) {
        return { surah, ayah: ayahNum };
      }
    }
    const textMatch = query.match(/^([a-z\s\-']+?)(?:[:\s\-\/]+)(\d+)$/);
    if (textMatch) {
      const namePart = textMatch[1].trim();
      const ayahNum = parseInt(textMatch[2]);
      let surah = surahList.find(s =>
        s.englishName?.toLowerCase() === namePart ||
        s.name?.toLowerCase() === namePart
      );
      if (!surah) {
        surah = surahList.find(s =>
          s.englishName?.toLowerCase().includes(namePart) ||
          s.name?.toLowerCase().includes(namePart)
        );
      }
      if (surah && ayahNum >= 1 && ayahNum <= surah.numberOfAyahs) {
        return { surah, ayah: ayahNum };
      }
    }
    return null;
  };

  const directSearchResult = parseDirectSearch();

  const closeSurahSelector = () => {
    setShowSurahSelector(false);
    setSurahSearchTerm('');
    setVerseJumpInput('');
  };

  return (
    <>
      {/* ─── Unified Toolbar ───
          Two logical groups: Navigation (primary context) and Tools (display/audio/review).
          Add Review is the single primary action. Everything else is secondary/tertiary. */}
      <div className="flex flex-wrap items-center justify-center gap-2 font-sans">
        {/* ── Group 1: Navigation ── */}
        <ControlGroup separated className="rounded-[var(--radius)]">
          {/* Surah / verse selector */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setModalViewState('chapters');
              setSurahSearchTerm('');
              setSelectedSurahForAyah(currentSurah);
              setShowSurahSelector(true);
            }}
            className="h-9 px-3 font-semibold gap-2 rounded-l-[var(--radius)] rounded-r-none"
            title="Select Surah and Verse"
          >
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="truncate max-w-[90px] sm:max-w-[140px] xl:max-w-[200px]">
              {currentSurah}. {surahName}
            </span>
            {currentAyah ? <span className="text-accent">:{currentAyah}</span> : null}
            <ChevronLeft className="h-3.5 w-3.5 opacity-40 rotate-90" />
          </Button>

          {/* Page navigator */}
          <div className="flex items-center gap-0.5 px-1">
            <button
              onClick={() => onPageChange(layoutMode === 'spread' ? currentPage + 2 : currentPage + 1)}
              disabled={layoutMode === 'spread' ? currentPage >= totalPages - 1 : currentPage >= totalPages}
              className="size-7 flex items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
              aria-label="Next page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 px-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">Pg</span>
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) onPageChange(value);
                }}
                onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                min="1"
                max={totalPages}
                className="w-11 h-7 text-center text-sm font-semibold rounded-[var(--radius-sm)] bg-secondary text-foreground border border-border outline-none focus:ring-2 focus:ring-ring/30 transition-all"
                aria-label={`Page ${currentPage} of ${totalPages}`}
              />
              <span className="text-[11px] font-medium text-muted-foreground select-none whitespace-nowrap">/ {totalPages}</span>
            </div>

            <button
              onClick={() => onPageChange(layoutMode === 'spread' ? currentPage - 2 : currentPage - 1)}
              disabled={layoutMode === 'spread' ? currentPage <= 2 : currentPage <= 1}
              className="size-7 flex items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
              aria-label="Previous page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </ControlGroup>

        {/* Mistake navigation — warning semantic, compact dropdown */}
        {(hasPrevMistake || hasNextMistake) && onNavigateToNextMistake && (
          <div ref={mistakeBtnRef} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!showMistakeMenu && mistakeBtnRef.current) {
                  const rect = mistakeBtnRef.current.getBoundingClientRect();
                  setMistakeMenuPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
                }
                setShowMistakeMenu(!showMistakeMenu);
              }}
              className="h-9 px-2.5 border-warning/30 bg-warning/10 text-warning hover:bg-warning/15 hover:text-warning font-semibold text-xs"
              title="Mistake navigation"
              aria-expanded={showMistakeMenu}
              aria-haspopup="menu"
            >
              <svg className="w-3.5 h-3.5 sm:mr-1.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="hidden lg:inline">Mistakes</span>
              <ChevronLeft className={`h-3 w-3 sm:ml-1 transition-transform duration-200 ${showMistakeMenu ? '-rotate-90' : 'rotate-90'}`} />
            </Button>

            {showMistakeMenu && mounted && mistakeMenuPos && createPortal(
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMistakeMenu(false)} />
                <div
                  className="fixed z-50 w-56 panel-surface rounded-[var(--radius-lg)] p-1 animate-popover overflow-hidden"
                  style={{
                    top: `${mistakeMenuPos.top}px`,
                    left: `${mistakeMenuPos.left}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {hasNextMistake && nextMistake && (
                    <button
                      onClick={() => {
                        onNavigateToNextMistake(nextMistake.surah, nextMistake.ayah);
                        setShowMistakeMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-[var(--radius-sm)] hover:bg-warning/10 transition-colors group"
                      title={`Go to next mistake: Surah ${nextMistake.surah} Ayah ${nextMistake.ayah}`}
                    >
                      <svg className="w-4 h-4 text-warning flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-warning">Next Mistake</div>
                        <div className="text-[11px] text-muted-foreground truncate">Surah {nextMistake.surah} : Ayah {nextMistake.ayah}</div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-warning flex-shrink-0" />
                    </button>
                  )}
                  {hasPrevMistake && prevMistake && (
                    <button
                      onClick={() => {
                        onNavigateToNextMistake(prevMistake.surah, prevMistake.ayah);
                        setShowMistakeMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-[var(--radius-sm)] hover:bg-warning/10 transition-colors border-t border-border group"
                      title={`Go to previous mistake: Surah ${prevMistake.surah} Ayah ${prevMistake.ayah}`}
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-warning">Previous Mistake</div>
                        <div className="text-[11px] text-muted-foreground truncate">Surah {prevMistake.surah} : Ayah {prevMistake.ayah}</div>
                      </div>
                    </button>
                  )}
                </div>
              </>,
              document.body
            )}
          </div>
        )}

        {/* ── Group 2: Tools (display / tajweed / audio) ── */}
        <ControlGroup separated className="rounded-[var(--radius)]">
          {/* Display settings */}
          <Tooltip label="Display settings" side="bottom">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowViewSettings(true)}
              className="rounded-l-[var(--radius)] rounded-r-none"
              aria-label="Display settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Tooltip>

          {/* Tajweed legend */}
          <TajweedLegend />

          {/* Audio reciter */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAudioTab('reciters');
              setShowReciterSelector(true);
            }}
            className="h-9 px-3 gap-2 rounded-r-[var(--radius)] rounded-l-none"
            title="Change Reciter"
          >
            <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-semibold truncate max-w-[70px] sm:max-w-[100px] xl:max-w-[150px]">
              {getReciterById(selectedReciter)?.englishName || 'Reciter'}
            </span>
            <ChevronLeft className="h-3 w-3 opacity-40 rotate-90 flex-shrink-0" />
          </Button>
        </ControlGroup>

        {/* ── Primary action: Add Review ── */}
        {onEnhancedMemorization && (
          <Button
            size="sm"
            onClick={onEnhancedMemorization}
            className="h-9 px-3 sm:px-4 font-semibold text-xs gap-2"
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Add Review</span>
          </Button>
        )}
      </div>

      {/* ─── Quran Index Modal ─── (portal to escape header's backdrop-filter containing block) */}
      {showSurahSelector && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 animate-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) closeSurahSelector(); }}
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        >
          <div
            className="relative w-full h-full md:max-w-2xl md:max-h-[85vh] flex flex-col bg-card md:rounded-[var(--radius-2xl)] overflow-hidden shadow-2xl font-sans animate-fade-in-up border border-border"
            onKeyDown={(e) => {
              if (modalViewState !== 'chapters') return;
              const filtered = surahSearchTerm
                ? surahList.filter(s =>
                    s.name.toLowerCase().includes(surahSearchTerm.toLowerCase()) ||
                    (s.englishName && s.englishName.toLowerCase().includes(surahSearchTerm.toLowerCase())) ||
                    s.number.toString().includes(surahSearchTerm)
                  )
                : surahList;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setKeyboardIndex(prev => {
                  const next = Math.min(prev + 1, filtered.length - 1);
                  const el = surahListRef.current?.querySelector(`[data-surah-idx="${next}"]`) as HTMLElement | null;
                  el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                  return next;
                });
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setKeyboardIndex(prev => {
                  const next = Math.max(prev - 1, 0);
                  const el = surahListRef.current?.querySelector(`[data-surah-idx="${next}"]`) as HTMLElement | null;
                  el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                  return next;
                });
              } else if (e.key === 'Enter' && keyboardIndex >= 0 && keyboardIndex < filtered.length) {
                e.preventDefault();
                const surah = filtered[keyboardIndex];
                setSelectedSurahForAyah(surah.number);
                setModalViewState('verses');
              } else if (e.key === 'Escape') {
                e.preventDefault();
                closeSurahSelector();
              }
            }}
          >
            {modalViewState === 'chapters' ? (
              <>
                {/* Header */}
                <div className="relative px-6 pt-6 pb-5 flex-shrink-0 border-b border-border">
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.2em] uppercase mb-1.5">Navigation</p>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground font-serif-header leading-tight">Quran Index</h2>
                        <p className="text-xs text-muted-foreground mt-1.5">{surahList.length} chapters · 6,236 verses</p>
                      </div>
                      <button
                        onClick={closeSurahSelector}
                        className="size-9 rounded-[var(--radius-sm)] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search surah or jump to verse (e.g. 2:255)…"
                        value={surahSearchTerm}
                        onChange={(e) => setSurahSearchTerm(e.target.value)}
                        className="w-full h-11 pl-11 pr-4 rounded-[var(--radius)] bg-input border border-border text-foreground placeholder-muted-foreground text-sm outline-none transition-all focus:border-ring/50 focus:ring-2 focus:ring-ring/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Direct verse jump result */}
                {directSearchResult && (
                  <div className="px-5 pt-3 pb-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        onNavigateToAyah(directSearchResult.surah.number, directSearchResult.ayah);
                        closeSurahSelector();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius)] bg-accent/8 border border-accent/20 hover:bg-accent/12 transition-colors text-left"
                    >
                      <div className="size-9 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0 bg-accent text-accent-foreground">
                        <Search className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-accent uppercase tracking-wider">Jump to verse</p>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {directSearchResult.surah.englishName} · Verse {directSearchResult.ayah}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-accent ml-auto flex-shrink-0" />
                    </button>
                    <div className="h-px bg-border mt-3" />
                  </div>
                )}

                {/* Surah list */}
                <div ref={surahListRef} className="flex-1 overflow-y-auto">
                  {(() => {
                    const surahsToShow = surahSearchTerm
                      ? surahList.filter(s =>
                          s.name.toLowerCase().includes(surahSearchTerm.toLowerCase()) ||
                          (s.englishName && s.englishName.toLowerCase().includes(surahSearchTerm.toLowerCase())) ||
                          s.number.toString().includes(surahSearchTerm)
                        )
                      : surahList;

                    if (surahsToShow.length === 0) {
                      return (
                        <div className="text-center py-20 text-muted-foreground text-sm">
                          <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                          No chapters found
                        </div>
                      );
                    }

                    return surahsToShow.map((surah, idx) => {
                      const isActive = surah.number === currentSurah && !surahSearchTerm;
                      const isKeyboardSelected = idx === keyboardIndex;
                      const revType = surah.revelationType || '';
                      const isMeccan = revType === 'Meccan' || revType === 'Makkah';
                      return (
                        <button
                          key={surah.number}
                          data-surah-idx={idx}
                          onClick={() => {
                            setSelectedSurahForAyah(surah.number);
                            setModalViewState('verses');
                          }}
                          className={`w-full flex items-center gap-4 px-6 py-3.5 group text-left border-b border-border last:border-0 transition-colors duration-100 ${
                            isActive
                              ? 'bg-accent/8'
                              : isKeyboardSelected
                                ? 'bg-accent/10'
                                : 'hover:bg-secondary'
                          }`}
                          data-current-surah={isActive ? 'true' : undefined}
                        >
                          <div
                            className={`size-10 rounded-[var(--radius-sm)] flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                              isActive
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {surah.number}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 mb-0.5">
                              <span className={`font-semibold text-sm truncate ${
                                isActive ? 'text-accent-foreground' : 'text-foreground'
                              }`}>
                                {surah.englishName}
                              </span>
                              <span
                                className={`text-lg flex-shrink-0 ${isActive ? 'text-accent' : 'text-muted-foreground'}`}
                                style={{ fontFamily: "'UthmanicHafs_V22', 'Amiri', serif" }}
                              >
                                {surah.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              {revType && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold">
                                  <span className={`size-1.5 rounded-full flex-shrink-0 ${isMeccan ? 'bg-success' : 'bg-info'}`} />
                                  <span className={isMeccan ? 'text-success' : 'text-info'}>
                                    {revType === 'Makkah' ? 'Meccan' : revType === 'Madinah' ? 'Medinan' : revType}
                                  </span>
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">{surah.numberOfAyahs} verses</span>
                            </div>
                          </div>

                          <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            isActive ? 'text-accent' : 'text-muted-foreground/50 group-hover:text-accent'
                          }`} />
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Footer hint */}
                <div className="hidden md:flex items-center justify-center gap-4 px-6 py-2.5 border-t border-border text-[10px] text-muted-foreground font-medium flex-shrink-0">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-secondary font-mono text-[9px]">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-secondary font-mono text-[9px]">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-secondary font-mono text-[9px]">Esc</kbd>
                    Close
                  </span>
                </div>
              </>
            ) : (
              <>
                {(() => {
                  const activeSurah = surahList.find(s => s.number === selectedSurahForAyah);
                  const revType = activeSurah?.revelationType || '';
                  const isMeccan = revType === 'Meccan' || revType === 'Makkah';
                  return (
                    <div className="relative px-6 pt-5 pb-5 flex-shrink-0 border-b border-border">
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => setModalViewState('chapters')}
                            className="size-9 rounded-[var(--radius-sm)] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
                            aria-label="Back to chapters"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.15em] uppercase mb-1">Surah {selectedSurahForAyah}</p>
                                <h2 className="text-xl md:text-2xl font-bold text-foreground font-serif-header truncate leading-tight">
                                  {activeSurah?.englishName}
                                </h2>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xl md:text-2xl text-accent" style={{ fontFamily: "'UthmanicHafs_V22', 'Amiri', serif" }}>{activeSurah?.name}</p>
                                {revType && (
                                  <span className="flex items-center gap-1 justify-end mt-1">
                                    <span className={`size-1.5 rounded-full ${isMeccan ? 'bg-success' : 'bg-info'}`} />
                                    <span className={`text-[10px] font-semibold ${isMeccan ? 'text-success' : 'text-info'}`}>
                                      {revType === 'Makkah' ? 'Meccan' : revType === 'Madinah' ? 'Medinan' : revType}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={closeSurahSelector}
                            className="size-9 rounded-[var(--radius-sm)] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
                            aria-label="Close"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <button
                          onClick={() => { onSurahSelect(selectedSurahForAyah); closeSurahSelector(); }}
                          className="w-full h-11 rounded-[var(--radius)] bg-secondary border border-border text-foreground hover:bg-accent/10 hover:border-accent/30 hover:text-accent transition-colors text-xs font-semibold flex items-center justify-center gap-2"
                        >
                          <BookOpen className="w-4 h-4 text-accent" />
                          Read from beginning · Verse 1
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Verse picker */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold select-none">#</span>
                      <input
                        type="number"
                        min="1"
                        max={surahList.find(s => s.number === selectedSurahForAyah)?.numberOfAyahs || 1}
                        placeholder={`Verse 1 – ${surahList.find(s => s.number === selectedSurahForAyah)?.numberOfAyahs || '…'}`}
                        value={verseJumpInput}
                        onChange={(e) => setVerseJumpInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const n = parseInt(verseJumpInput);
                            const max = surahList.find(s => s.number === selectedSurahForAyah)?.numberOfAyahs || 1;
                            if (!isNaN(n) && n >= 1 && n <= max) {
                              onNavigateToAyah(selectedSurahForAyah, n);
                              closeSurahSelector();
                            }
                          }
                        }}
                        className="w-full h-10 pl-8 pr-3 rounded-[var(--radius-sm)] bg-input border border-border focus:border-ring/50 focus:ring-2 focus:ring-ring/20 text-sm font-semibold text-foreground outline-none transition-all placeholder-muted-foreground"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const n = parseInt(verseJumpInput);
                        const max = surahList.find(s => s.number === selectedSurahForAyah)?.numberOfAyahs || 1;
                        if (!isNaN(n) && n >= 1 && n <= max) {
                          onNavigateToAyah(selectedSurahForAyah, n);
                          closeSurahSelector();
                        }
                      }}
                      className="h-10 px-5 rounded-[var(--radius-sm)] btn-primary text-xs font-bold transition-colors flex-shrink-0"
                    >
                      Go
                    </button>
                  </div>

                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-2.5">All verses</p>
                  <div className="grid grid-cols-8 md:grid-cols-10 gap-1.5">
                    {Array.from(
                      { length: surahList.find(s => s.number === selectedSurahForAyah)?.numberOfAyahs || 1 },
                      (_, i) => i + 1
                    ).map((verseNum) => {
                      const isCurrent = selectedSurahForAyah === currentSurah && verseNum === (currentAyah || 1);
                      return (
                        <button
                          key={verseNum}
                          onClick={() => { onNavigateToAyah(selectedSurahForAyah, verseNum); closeSurahSelector(); }}
                          className={`h-8 w-full rounded-[var(--radius-sm)] text-[11px] font-bold transition-colors ${
                            isCurrent
                              ? 'verse-grid-active'
                              : 'bg-secondary text-muted-foreground hover:bg-accent/10 hover:text-accent'
                          }`}
                        >
                          {verseNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      , document.body)}

      {/* ─── View Settings Modal ─── (portal) */}
      {showViewSettings && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlay"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowViewSettings(false); }}
        >
          <Card className="w-full max-w-md bg-card border border-border rounded-[var(--radius-2xl)] shadow-2xl p-6 animate-fade-in-up font-sans">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase block mb-0.5">Configuration</span>
                <h3 className="text-xl font-bold font-serif-header text-foreground">Display Settings</h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowViewSettings(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5">
              {/* Layout & Structure */}
              <div className="space-y-3">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-border pb-1">
                  Layout &amp; Structure
                </div>
                <div className="hidden lg:flex items-center justify-between py-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Spread Layout Mode</Label>
                  <Button variant="outline" size="sm" onClick={onToggleLayout} className="text-xs">
                    {layoutMode === 'spread' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    <span className="font-semibold">{layoutMode === 'spread' ? 'Single Page' : 'Two-Page Spread'}</span>
                  </Button>
                </div>
              </div>

              {/* Typography & Spacing */}
              <div className="space-y-3.5">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-border pb-1">
                  Typography &amp; Spacing
                </div>

                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Font Adjust Target</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleFontTarget}
                    className={`text-xs font-semibold ${
                      fontTargetArabic
                        ? 'bg-accent/10 text-accent border-accent/30'
                        : 'bg-info/10 text-info border-info/30'
                    }`}
                  >
                    {fontTargetArabic ? 'Arabic Text' : <><Languages className="h-3.5 w-3.5" />Translation</>}
                  </Button>
                </div>

                <div className="space-y-2 py-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Font Size</Label>
                    <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{fontSize}px</span>
                  </div>
                  <Slider
                    min={16}
                    max={48}
                    step={1}
                    value={[fontSize]}
                    onValueChange={([size]) => onFontSizeChange(size)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 py-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reading Side Margins</Label>
                    <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{padding}px</span>
                  </div>
                  <Slider
                    min={0}
                    max={64}
                    step={1}
                    value={[padding]}
                    onValueChange={([val]) => onPaddingChange(val)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Content Filters */}
              <div className="space-y-3">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest border-b border-border pb-1">
                  Content Filters
                </div>

                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Show Translations</Label>
                  <Switch checked={showTranslation} onCheckedChange={onToggleTranslation} />
                </div>

                {onToggleHideMistakes && (
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hide Mistakes (Self-Test)</Label>
                    <Switch checked={hideMistakes} onCheckedChange={onToggleHideMistakes} />
                  </div>
                )}

                {onToggleWordByWordTooltip && (
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Word Translation Tooltips</Label>
                    <Switch checked={showWordByWordTooltip} onCheckedChange={onToggleWordByWordTooltip} />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      , document.body)}

      {/* ─── Audio Settings Modal ─── (portal) */}
      {showReciterSelector && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlay"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowReciterSelector(false); }}
        >
          <Card className="w-full max-w-md bg-card border border-border rounded-[var(--radius-2xl)] shadow-2xl p-6 animate-fade-in-up font-sans">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase block mb-0.5">Audio Settings</span>
                <h3 className="text-xl font-bold font-serif-header text-foreground">Audio Selection</h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowReciterSelector(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Tab selector */}
            <div className="flex bg-secondary p-0.5 rounded-[var(--radius)] border border-border mb-4">
              <button
                type="button"
                onClick={() => setAudioTab('reciters')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors ${
                  audioTab === 'reciters'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Reciters
              </button>
              <button
                type="button"
                onClick={() => setAudioTab('info')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors ${
                  audioTab === 'info'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Shortcuts &amp; Info
              </button>
            </div>

            {audioTab === 'reciters' ? (
              <div ref={reciterListRef} className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {/* Favorites section — starred reciters pinned to the top */}
                {(() => {
                  const favReciters = favoriteReciters
                    .map((id) => getReciterById(id))
                    .filter((r): r is NonNullable<typeof r> => Boolean(r));
                  if (favReciters.length === 0) return null;
                  return (
                    <div className="space-y-1">
                      <div className="px-2 pt-1 pb-1 flex items-baseline gap-2 border-b border-border">
                        <Star className="w-3 h-3 text-accent fill-accent" />
                        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">Favorites</span>
                      </div>
                      {favReciters.map((reciter) => (
                        <div
                          key={`fav-${reciter.id}`}
                          ref={selectedReciter === reciter.id ? selectedReciterRef : null}
                          className={`flex items-center gap-1 rounded-[var(--radius-sm)] px-1 transition-colors ${
                            selectedReciter === reciter.id
                              ? 'bg-accent/10 border border-accent/20'
                              : 'hover:bg-secondary'
                          }`}
                        >
                          <Button
                            variant="ghost"
                            className="flex-1 justify-start h-auto py-2.5 rounded-[var(--radius-sm)] px-3 text-left transition-colors border-0"
                            onClick={() => {
                              onReciterChange(reciter.id);
                              setShowReciterSelector(false);
                            }}
                          >
                            <div className="flex flex-col items-start min-w-0 flex-1">
                              <span className="truncate text-sm font-semibold text-foreground" title={reciter.englishName}>
                                {reciter.englishName}
                              </span>
                              <span className="truncate text-xs text-muted-foreground mt-0.5" title={reciter.name} style={{ fontFamily: "'UthmanicHafs_V22', 'Amiri', serif" }}>
                                {reciter.name}
                              </span>
                            </div>
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              setFavoriteReciters(toggleFavoriteReciter(reciter.id));
                            }}
                            className="size-7 flex items-center justify-center rounded-[var(--radius-xs)] text-accent hover:bg-accent/10 transition-colors flex-shrink-0"
                            title="Remove from favorites"
                            aria-label={`Remove ${reciter.englishName} from favorites`}
                          >
                            <Star className="w-4 h-4 fill-accent" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {reciterGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <div className="px-2 pt-1 pb-1 flex items-baseline gap-2 border-b border-border">
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">{group.labelEn}</span>
                      <span className="text-[9px] text-muted-foreground/70 font-medium" style={{ fontFamily: "'UthmanicHafs_V22', 'Amiri', serif" }}>{group.label}</span>
                    </div>
                    {group.reciters.map((reciter) => {
                      const isFav = favoriteReciters.includes(reciter.id);
                      return (
                        <div
                          key={reciter.id}
                          ref={selectedReciter === reciter.id && !isFav ? selectedReciterRef : null}
                          className={`flex items-center gap-1 rounded-[var(--radius-sm)] px-1 transition-colors ${
                            selectedReciter === reciter.id
                              ? 'bg-accent/10 border border-accent/20'
                              : 'hover:bg-secondary'
                          }`}
                        >
                          <Button
                            variant="ghost"
                            className={`flex-1 justify-start h-auto py-2.5 rounded-[var(--radius-sm)] px-3 text-left transition-colors border-0 ${
                              selectedReciter === reciter.id ? 'text-accent font-semibold' : 'text-foreground'
                            }`}
                            onClick={() => {
                              onReciterChange(reciter.id);
                              setShowReciterSelector(false);
                            }}
                          >
                            <div className="flex flex-col items-start min-w-0 flex-1">
                              <span className="truncate text-sm font-semibold text-foreground" title={reciter.englishName}>
                                {reciter.englishName}
                              </span>
                              <span className="truncate text-xs text-muted-foreground mt-0.5" title={reciter.name} style={{ fontFamily: "'UthmanicHafs_V22', 'Amiri', serif" }}>
                                {reciter.name}
                              </span>
                            </div>
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              setFavoriteReciters(toggleFavoriteReciter(reciter.id));
                            }}
                            className={`size-7 flex items-center justify-center rounded-[var(--radius-xs)] transition-colors flex-shrink-0 ${
                              isFav
                                ? 'text-accent hover:bg-accent/10'
                                : 'text-muted-foreground/50 hover:text-accent hover:bg-accent/10'
                            }`}
                            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                            aria-label={`${isFav ? 'Remove' : 'Add'} ${reciter.englishName} ${isFav ? 'from' : 'to'} favorites`}
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-accent' : ''}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-2 bg-secondary p-3.5 rounded-[var(--radius)] border border-border">
                  <h4 className="font-semibold text-foreground flex items-center">
                    <Info className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" /> Playback Controls
                  </h4>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    When you play a verse, the bottom audio panel will appear. Use it to:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground mt-1">
                    <li>Toggle <span className="font-semibold">Infinite Loop</span> to repeat the verse.</li>
                    <li>Set a <span className="font-semibold">Custom Loop Range</span> to repeat a specific duration segment.</li>
                    <li>Adjust <span className="font-semibold">Playback Speed</span> (0.5x to 2x) for slower/faster recitation.</li>
                  </ul>
                </div>

                <div className="space-y-2 border border-border p-3.5 rounded-[var(--radius)]">
                  <h4 className="font-semibold text-foreground flex items-center">
                    <Keyboard className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" /> Keyboard Shortcuts
                  </h4>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-1 text-muted-foreground">
                    {[
                      ['Space', 'Play/Pause'], ['Esc', 'Stop Audio'],
                      ['←', 'Rewind 10s'], ['→', 'Forward 10s'],
                      ['↑', 'Vol Up'], ['↓', 'Vol Down'],
                      ['M', 'Mark Start/End'], ['[', 'Mark Start'],
                      [']', 'Mark End'], ['C', 'Clear Markers'],
                    ].map(([key, action]) => (
                      <div key={key} className="flex items-center">
                        <kbd className="px-1.5 py-0.5 bg-secondary border border-border rounded-[var(--radius-xs)] text-[10px] font-sans mr-2">{key}</kbd>
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      , document.body)}
    </>
  );
}
