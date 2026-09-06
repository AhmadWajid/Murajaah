'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import AyahCard from './AyahCard';
import { MistakeData } from '@/lib/supabase/database';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SelectedAyahsModal from './SelectedAyahsModal';
import { TajweedAyahText } from './TajweedAyahText';
import { TajweedWord, TAJWEED_COLORS, TOPIC_COLORS, TOPIC_TAILWIND_COLORS, getTajweedTooltip } from '@/lib/tajweedService';
import { qpcFontLoader } from '@/lib/qpcFontLoader';
import { createPortal } from 'react-dom';
import { Tooltip } from 'react-tooltip';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import AyahDetailDrawer from './AyahDetailDrawer';

interface PageLine {
  page_number: number;
  line_number: number;
  line_type: string;
  is_centered: number;
  first_word_id: number;
  last_word_id: number;
  surah_number: number;
}

const CornerOrnament = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Frame corner lines */}
    <path
      d="M 2 46 L 2 2 L 46 2"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    <path
      d="M 6 42 L 6 6 L 42 6"
      stroke="currentColor"
      strokeWidth={0.75}
      strokeLinecap="round"
      strokeDasharray="2 2"
    />
    {/* Arabesque leaf structure in corner */}
    <path
      d="M 2 2 C 16 16 20 20 28 28"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
    />
    <path
      d="M 12 12 C 18 8 26 8 28 14 C 28 20 20 26 14 28 C 8 26 8 18 12 12 Z"
      stroke="currentColor"
      strokeWidth={0.75}
      fill="currentColor"
      fillOpacity={0.1}
    />
    {/* Tiny star details */}
    <path
      d="M 18 18 L 22 14 L 26 18 L 22 22 Z"
      fill="currentColor"
      fillOpacity={0.4}
    />
    <circle cx={28} cy={28} r={1.5} fill="currentColor" />
    <circle cx={34} cy={34} r={1.2} fill="currentColor" />
    <circle cx={40} cy={40} r={0.8} fill="currentColor" />
  </svg>
);

const SurahHeaderWing = ({ className, reverse = false }: { className?: string; reverse?: boolean }) => (
  <svg
    viewBox="0 0 150 30"
    fill="none"
    className={`${className} ${reverse ? 'scale-x-[-1]' : ''}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Horizontal axis line */}
    <path
      d="M 0 15 H 120"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
    {/* Wavy scrollwork pattern */}
    <path
      d="M 10 15 C 20 5 30 5 40 15 C 50 25 60 25 70 15 C 80 5 90 5 100 15"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
    />
    <path
      d="M 15 15 C 22 22 28 22 35 15 C 42 8 48 8 55 15 C 62 22 68 22 75 15"
      stroke="currentColor"
      strokeWidth={0.75}
      strokeLinecap="round"
    />
    {/* Floral buds / diamonds */}
    <path
      d="M 40 15 L 45 10 L 50 15 L 45 20 Z"
      fill="currentColor"
      fillOpacity={0.3}
    />
    <path
      d="M 80 15 L 85 10 L 90 15 L 85 20 Z"
      fill="currentColor"
      fillOpacity={0.3}
    />
    {/* Tail finial at the far outer edge (left side of left wing, i.e. 0) */}
    <path
      d="M 120 15 C 130 15 140 10 145 15 C 140 20 130 15 120 15"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1}
    />
    <circle cx={147} cy={15} r={1.5} fill="currentColor" />
    <circle cx={100} cy={15} r={1.5} fill="currentColor" />
    <circle cx={60} cy={15} r={1.5} fill="currentColor" />
    <circle cx={20} cy={15} r={1.5} fill="currentColor" />
  </svg>
);

interface QuranContentProps {
  loading: boolean;
  pageData: any;
  previousPageData: any;
  layoutMode: 'spread' | 'single';
  currentPage: number;
  arabicTexts: Record<string, string>;
  previousArabicTexts: Record<string, string>;
  showTranslation: boolean;
  memorizationItems: any[];
  highlightedRange: { surah: number; start: number; end: number } | null;
  selectedAyahs: Set<{surah: number, ayah: number}>;
  openReviewDropdown: string | null;
  onAyahClick: (surah: number, ayah: number) => void;
  onPlayAudio: (surahNumber: number, ayahNumber: number) => void;
  onQuickReview: (surahNumber: number, ayahNumber: number, rating: 'easy' | 'medium' | 'hard') => void;
  onToggleReviewDropdown: (key: string | null) => void;
  onAddRevision: () => void;
  onRemoveAyah?: (surah: number, ayah: number) => void;
  onClearSelectedAyahs?: () => void;
  onReviewComplete?: (item: any) => void;
  reviewsOnPage?: any[];
  fontSize?: number;
  arabicFontSize?: number;
  translationFontSize?: number;
  fontTargetArabic?: boolean;
  mistakes?: Record<string, boolean | MistakeData>;
  onToggleMistake?: (surahNumber: number, ayahNumber: number) => void;
  hideMistakes?: boolean;
  onRevealMistake?: (surahNumber: number, ayahNumber: number) => void;
  revealedMistakes?: Set<string>;
  hideWords?: boolean;
  hideWordsDelay?: number;
  wordByWordData: any[];
  showWordByWordTooltip: boolean;
  padding?: number;
  readingLayout?: 'verse';
  activeAyah?: { surah: number; ayah: number } | null;
  onActiveAyahChange?: (ayah: { surah: number; ayah: number } | null) => void;
  playingAyah?: { surah: number; ayah: number } | null;
}

export default function QuranContent({
  loading,
  pageData,
  previousPageData,
  layoutMode,
  currentPage,
  arabicTexts,
  previousArabicTexts,
  showTranslation,
  memorizationItems,
  highlightedRange,
  selectedAyahs,
  openReviewDropdown,
  onAyahClick,
  onPlayAudio,
  onQuickReview,
  onToggleReviewDropdown,
  onAddRevision,
  onRemoveAyah,
  onClearSelectedAyahs,
  onReviewComplete,
  reviewsOnPage,
  fontSize = 24,
  arabicFontSize = 24,
  translationFontSize = 20,
  fontTargetArabic = false,

  mistakes = {},
  onToggleMistake,
  hideMistakes = false,
  onRevealMistake,
  revealedMistakes = new Set(),
  hideWords = false,
  hideWordsDelay = 500,
  wordByWordData = [],
  showWordByWordTooltip = true,
  padding = 0,
  readingLayout = 'verse',
  activeAyah = null,
  onActiveAyahChange,
  playingAyah = null,
}: QuranContentProps) {
  const [showSelectedAyahsModal, setShowSelectedAyahsModal] = useState(false);
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [hoveredTajweedWordId15, setHoveredTajweedWordId15] = useState<string | null>(null);
  const hoverTimeoutRef15 = useRef<NodeJS.Timeout | null>(null);

  const [visibleWordIds15, setVisibleWordIds15] = useState<Set<string>>(new Set());
  const wordTimeoutsRef15 = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Single shared tooltip ID for word translations (react-tooltip v5 best practice
  // for dynamic content — avoids issues with dynamically registered <Tooltip> components)
  const WORD_TRANSLATION_TOOLTIP_ID_15 = 'word-translation-tooltip-15';

  const [layout15Data, setLayout15Data] = useState<{
    pageLayout: PageLine[];
    wordsByLine: Record<number, TajweedWord[]>;
  } | null>(null);
  const [loading15, setLoading15] = useState(false);
  const [fontLoaded15, setFontLoaded15] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      wordTimeoutsRef15.current.forEach(timeout => clearTimeout(timeout));
      wordTimeoutsRef15.current.clear();
    };
  }, []);

  const handleWordMouseEnter15 = (wordId: string, wordSurah: number, wordAyah: number, currentWordObj: any) => {
    if (wordTimeoutsRef15.current.has(wordId)) {
      clearTimeout(wordTimeoutsRef15.current.get(wordId)!);
      wordTimeoutsRef15.current.delete(wordId);
    }
    
    setVisibleWordIds15(prev => new Set(prev).add(wordId));
    
    const pageWords = layout15Data ? Object.values(layout15Data.wordsByLine).flat() : [];
    const ayahWords = pageWords
      .filter((w: any) => w.surah === wordSurah && w.ayah === wordAyah)
      .sort((a: any, b: any) => a.id - b.id);
    
    const currentWordIndexInAyah = ayahWords.findIndex((w: any) => String(w.id) === wordId);
    
    if (currentWordIndexInAyah !== -1) {
      ayahWords.forEach((word: any, index) => {
        if (index > currentWordIndexInAyah) {
          const laterWordId = String(word.id);
          if (wordTimeoutsRef15.current.has(laterWordId)) {
            clearTimeout(wordTimeoutsRef15.current.get(laterWordId)!);
            wordTimeoutsRef15.current.delete(laterWordId);
          }
          setVisibleWordIds15(prev => {
            const newSet = new Set(prev);
            newSet.delete(laterWordId);
            return newSet;
          });
        }
      });
    }
  };

  const handleWordMouseLeave15 = (wordId: string) => {
    if (hideWordsDelay > 0) {
      const timeoutId = setTimeout(() => {
        setVisibleWordIds15(prev => {
          const newSet = new Set(prev);
          newSet.delete(wordId);
          return newSet;
        });
        wordTimeoutsRef15.current.delete(wordId);
      }, hideWordsDelay);
      wordTimeoutsRef15.current.set(wordId, timeoutId);
    } else {
      setVisibleWordIds15(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordId);
        return newSet;
      });
    }
  };

  // Diagnostic log for tooltips

  // Diagnostic log for tooltips
  useEffect(() => {
    // 15-line mushaf mode removed; no diagnostics needed
  }, []);

  useEffect(() => {
    // 15-line mushaf mode removed; no data loading needed
  }, [pageData?.number]);

  const isAyahInMemorization = (surah: number, ayahNumber: number) => {
    return memorizationItems.some(item => 
      item.surah === surah && 
      ayahNumber >= item.ayahStart && 
      ayahNumber <= item.ayahEnd
    );
  };

  const getMemorizationStatus = (surah: number, ayahNumber: number) => {
    const item = memorizationItems.find(item => 
      item.surah === surah && 
      ayahNumber >= item.ayahStart && 
      ayahNumber <= item.ayahEnd
    );
    return item ? item.status : null;
  };

  const activeAyahData = pageData?.ayahs?.find(
    (a: any) => {
      const sNum = a.surah?.number || pageData?.surah || 1;
      return sNum === activeAyah?.surah && a.numberInSurah === activeAyah?.ayah;
    }
  ) || previousPageData?.ayahs?.find(
    (a: any) => {
      const sNum = a.surah?.number || previousPageData?.surah || 1;
      return sNum === activeAyah?.surah && a.numberInSurah === activeAyah?.ayah;
    }
  );

  const renderMushafPage = (pageObj: any, pageSide: 'left' | 'right' | 'single' = 'single') => {
    if (!pageObj || !pageObj.ayahs || pageObj.ayahs.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center p-12 border-2 border-dashed border-accent/20 dark:border-border/10 rounded-2xl min-h-[60vh]">
          <p className="text-gray-500 dark:text-gray-400 font-sans">No page data available</p>
        </div>
      );
    }
    
    const ayahs = pageObj.ayahs;
    const pageNum = pageObj.number;

    const roundedClass = pageSide === 'left' 
      ? 'rounded-3xl lg:rounded-r-none' 
      : pageSide === 'right' 
        ? 'rounded-3xl lg:rounded-l-none' 
        : 'rounded-3xl';
    
    return (
      <Card className={`flex-1 min-h-[75vh] shadow-[0_10px_35px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.35)] border-4 border-double border-accent/40 dark:border-accent/30 bg-[#FAF8F5]/90 dark:bg-[#12161A]/95 backdrop-blur-md overflow-hidden relative p-6 sm:p-8 md:p-10 font-sans transition-all duration-300 ${roundedClass}`}>
        
        {/* Double Gold nested borders framing the page */}
        <div className="absolute inset-4 pointer-events-none border border-accent/25 dark:border-accent/20 rounded-2xl z-20" />
        <div className="absolute inset-5 pointer-events-none border border-accent/10 dark:border-accent/10 rounded-2xl z-20" />
        
        {/* Beautiful Custom SVG corner ornaments */}
        <CornerOrnament className="absolute top-4 left-4 w-10 h-10 text-accent/40 dark:text-accent/30 select-none pointer-events-none z-20" />
        <CornerOrnament className="absolute top-4 right-4 w-10 h-10 text-accent/40 dark:text-accent/30 select-none pointer-events-none z-20 rotate-90" />
        <CornerOrnament className="absolute bottom-4 right-4 w-10 h-10 text-accent/40 dark:text-accent/30 select-none pointer-events-none z-20 rotate-180" />
        <CornerOrnament className="absolute bottom-4 left-4 w-10 h-10 text-accent/40 dark:text-accent/30 select-none pointer-events-none z-20 -rotate-90" />

        {/* Page fold shading (inner page curl shadow near spine) */}
        {pageSide === 'left' && (
          <div className="hidden lg:block absolute top-0 bottom-0 right-0 w-16 pointer-events-none z-25 bg-gradient-to-l from-black/8 via-black/2 to-transparent dark:from-black/25 dark:via-black/8" />
        )}
        {pageSide === 'right' && (
          <div className="hidden lg:block absolute top-0 bottom-0 left-0 w-16 pointer-events-none z-25 bg-gradient-to-r from-black/8 via-black/2 to-transparent dark:from-black/25 dark:via-black/8" />
        )}
        
        {/* Page Top Header */}
        <div className="flex justify-between items-center pb-3 mb-6 border-b border-accent/20 dark:border-accent/10 text-xs font-bold text-accent/70 dark:text-accent/60 tracking-wider">
          <span>Juz' {ayahs[0]?.juz}</span>
          <span className="font-serif-header text-sm">
            {Array.from(new Set(ayahs.map((a: any) => a?.surah?.englishName).filter(Boolean))).join(' • ')}
          </span>
          <span>Page {pageNum}</span>
        </div>

        {/* Continuous Paragraph Flow */}
        <div className="space-y-6">
          {(() => {
            const segments: React.ReactNode[] = [];
            let currentSurahNum = -1;
            let currentSurahAyahs: any[] = [];
            
            const renderSurahBlock = (surahNo: number, surahAyahsList: any[]) => {
              const firstAyah = surahAyahsList[0];
              const surahName = firstAyah.surah?.englishName || 'Unknown Surah';
              const surahTranslation = firstAyah.surah?.englishNameTranslation || '';
              const totalVerses = firstAyah.surah?.numberOfAyahs || 0;
              
              const isFirstOfSurah = firstAyah.numberInSurah === 1;
              const hasBismillah = isFirstOfSurah && surahNo !== 1 && surahNo !== 9;
              
              return (
                <div key={`surah-block-${surahNo}-${firstAyah.number}`} className="mb-6">
                  {/* Ornate Surah Header Banner */}
                  {isFirstOfSurah && (
                    <div className="relative mb-8 w-full flex items-center justify-center py-2 select-none">
                      {/* Background gold/parchment plate */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FAF3E3]/40 via-[#FAF3E3]/95 to-[#FAF3E3]/40 dark:from-[#1A1F26]/40 dark:via-[#1A1F26]/95 dark:to-[#1A1F26]/40 rounded-2xl border border-accent/25 dark:border-accent/20" />
                      
                      {/* Left Wing - hidden on micro screens, block on sm+ */}
                      <div className="hidden sm:block flex-1 max-w-[120px] md:max-w-[160px] text-accent/35 dark:text-accent/30 pr-4">
                        <SurahHeaderWing />
                      </div>
                      
                      {/* Center Medallion */}
                      <div className="relative z-10 px-8 py-3.5 border-2 border-accent/35 dark:border-accent/25 rounded-2xl bg-[#FAF8F4]/90 dark:bg-[#151A20]/90 shadow-[0_0_15px_rgba(212,175,55,0.08)] flex flex-col items-center justify-center min-w-[220px]">
                        <div className="absolute inset-0.5 border border-dashed border-accent/15 dark:border-accent/15 rounded-2xl" />
                        <span className="text-[9px] font-bold text-accent/80 dark:text-accent/80 tracking-widest uppercase block mb-0.5 font-sans">Surah</span>
                        <h3 className="text-xl sm:text-2xl font-bold font-serif-header text-gray-900 dark:text-white leading-tight">
                          {surahName}
                        </h3>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-center justify-center gap-1 font-sans">
                          <span>{surahTranslation}</span>
                          <span>•</span>
                          <span>Chapter {surahNo}</span>
                          <span>•</span>
                          <span>{totalVerses} Verses</span>
                        </div>
                      </div>
                      
                      {/* Right Wing - hidden on micro screens, block on sm+ */}
                      <div className="hidden sm:block flex-1 max-w-[120px] md:max-w-[160px] text-accent/35 dark:text-accent/30 pl-4">
                        <SurahHeaderWing reverse />
                      </div>
                    </div>
                  )}

                  {/* Independent Bismillah Line below Surah Heading */}
                  {hasBismillah && (
                    <div className="text-center py-4 mb-4 select-none">
                      <div className="inline-block px-8 py-2 border-b border-accent/10 dark:border-accent/10 text-2xl sm:text-3xl text-accent-foreground font-arabic text-center" style={{ fontFamily: "'UthmanicHafs_V22', 'Amiri', serif", direction: 'rtl' }}>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                      </div>
                    </div>
                  )}
                  
                  {/* Verses Text Block */}
                  <div 
                    className="leading-[2.5] sm:leading-[3.0] md:leading-[3.3] text-right overflow-visible"
                    dir="rtl"
                    style={{
                      textAlign: 'justify',
                    }}
                  >
                    {surahAyahsList.map((ayah: any, index: number) => {
                      const ayahNo = ayah.numberInSurah;
                      const ayahKey = `${surahNo}:${ayahNo}`;
                      const isActive = activeAyah && activeAyah.surah === surahNo && activeAyah.ayah === ayahNo;
                      const isPlaying = playingAyah && playingAyah.surah === surahNo && playingAyah.ayah === ayahNo;
                      
                      let arText = (ayah.text || '').replace(/\r?\n|\r/g, ' ').trim();
                      if (ayahNo === 1 && surahNo !== 1 && surahNo !== 9) {
                        const unicodeBismillahPattern = /^.*?بِسْمِ\s*[ٱا]للَّهِ\s*[ٱا]لرَّحْمَٰنِ\s*[ٱا]لرَّحِيمِ\s*/;
                        arText = arText.replace(unicodeBismillahPattern, '').trim();
                        if (arText.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')) {
                          arText = arText.substring('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'.length).trim();
                        }
                      }
                      
                      const status = getMemorizationStatus(surahNo, ayahNo);
                      const isMemorized = isAyahInMemorization(surahNo, ayahNo);
                      const reviewGlowClass = status === 'overdue' ? 'decoration-red-500 underline decoration-2 underline-offset-4' :
                                              status === 'due-today' ? 'decoration-orange-500 underline decoration-2 underline-offset-4' :
                                              status === 'due-soon' ? 'decoration-accent underline decoration-2 underline-offset-4' :
                                              status === 'upcoming' ? 'decoration-emerald-500 underline decoration-2 underline-offset-4' : '';

                      const isSelected = Array.from(selectedAyahs).some(sel => sel.surah === surahNo && sel.ayah === ayahNo);
                      
                      return (
                        <Fragment key={ayah.number}>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onActiveAyahChange?.({ surah: surahNo, ayah: ayahNo });
                            }}
                            className={`inline cursor-pointer select-text transition-colors duration-200 ${
                              isActive
                                ? 'bg-accent/15 dark:bg-accent/20 rounded-sm'
                                : isPlaying
                                  ? 'bg-accent/10 dark:bg-accent/12 rounded-sm ring-1 ring-accent/15 dark:ring-accent/15'
                                  : isSelected
                                    ? 'bg-accent/8 dark:bg-accent/10'
                                    : 'hover:bg-accent/5 dark:hover:bg-accent/10'
                            } ${isMemorized ? reviewGlowClass : ''}`}>
                            <TajweedAyahText
                              ayahText={arText}
                              surahNumber={surahNo}
                              ayahNumber={ayahNo}
                              fontSize={fontSize}
                              arabicFontSize={arabicFontSize}
                              translationFontSize={translationFontSize}
                              fontTargetArabic={fontTargetArabic}
                              pageNumber={pageNum}
                              hideWords={hideWords}
                              hideWordsDelay={hideWordsDelay}
                              wordByWordData={wordByWordData}
                              showWordByWordTooltip={showWordByWordTooltip}
                              disableTajweedColors={false}
                              displayMode="inline"
                            />
                          </span>
                          {index < surahAyahsList.length - 1 && ' '}
                        </Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            };
            
            for (const ayah of ayahs) {
              const surahNo = ayah.surah?.number || pageObj?.surah || 1;
              if (surahNo !== currentSurahNum) {
                if (currentSurahAyahs.length > 0) {
                  segments.push(renderSurahBlock(currentSurahNum, currentSurahAyahs));
                }
                currentSurahNum = surahNo;
                currentSurahAyahs = [ayah];
              } else {
                currentSurahAyahs.push(ayah);
              }
            }
            if (currentSurahAyahs.length > 0) {
              segments.push(renderSurahBlock(currentSurahNum, currentSurahAyahs));
            }
            
            return segments;
          })()}
        </div>
        
        <div className="absolute bottom-4 left-6 right-6 border-t border-accent/10 dark:border-accent/10 pt-2 flex justify-center text-[10px] font-bold text-accent/60 dark:text-accent/50 tracking-widest uppercase">
          Juz' {ayahs[0]?.juz} • Page {pageNum}
        </div>
      </Card>
    );
  };

  const render15LinesMushafPage = (pageObj: any, pageSide: 'left' | 'right' | 'single' = 'single') => {
    if (!pageObj) return null;
    const pageNum = pageObj.number;
    
    const layout = layout15Data?.pageLayout || [];
    const wordsByLine = layout15Data?.wordsByLine || {};
    
    const roundedClass = pageSide === 'left' 
      ? 'rounded-3xl lg:rounded-r-none' 
      : pageSide === 'right' 
        ? 'rounded-3xl lg:rounded-l-none' 
        : 'rounded-3xl';

    return (
      <Card className={`flex-1 min-h-[75vh] shadow-[0_10px_35px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.35)] border-4 border-double border-accent/40 dark:border-accent/30 bg-[#FAF8F5]/90 dark:bg-[#12161A]/95 backdrop-blur-md overflow-hidden relative p-6 sm:p-8 md:p-10 font-sans transition-all duration-300 ${roundedClass}`}>
        
        {/* Double Gold nested borders framing the page */}
        <div className="absolute inset-4 pointer-events-none border border-accent/25 dark:border-accent/20 rounded-2xl z-20" />
        <div className="absolute inset-5 pointer-events-none border border-accent/10 dark:border-accent/10 rounded-2xl z-20" />
        
        {/* Beautiful Custom SVG corner ornaments */}
        <CornerOrnament className="absolute top-4 left-4 w-10 h-10 text-accent/40 dark:text-accent/30 select-none pointer-events-none z-20" />
        <CornerOrnament className="absolute top-4 right-4 w-10 h-10 text-accent/40 dark:text-accent/30 select-none pointer-events-none z-20 rotate-90" />
        <CornerOrnament className="absolute bottom-4 right-4 w-10 h-10 text-accent/40 dark:text-accent/30 select-none pointer-events-none z-20 rotate-180" />
        <CornerOrnament className="absolute bottom-4 left-4 w-10 h-10 text-accent/40 dark:text-accent/30 select-none pointer-events-none z-20 -rotate-90" />

        {/* Page fold shading */}
        {pageSide === 'left' && (
          <div className="hidden lg:block absolute top-0 bottom-0 right-0 w-16 pointer-events-none z-25 bg-gradient-to-l from-black/8 via-black/2 to-transparent dark:from-black/25 dark:via-black/8" />
        )}
        {pageSide === 'right' && (
          <div className="hidden lg:block absolute top-0 bottom-0 left-0 w-16 pointer-events-none z-25 bg-gradient-to-r from-black/8 via-black/2 to-transparent dark:from-black/25 dark:via-black/8" />
        )}
        
        {/* Page Top Header */}
        <div className="flex justify-between items-center pb-3 mb-6 border-b border-accent/20 dark:border-accent/10 text-xs font-bold text-accent/70 dark:text-accent/60 tracking-wider">
          <span>Juz' {pageObj.ayahs?.[0]?.juz || ''}</span>
          <span className="font-serif-header text-sm">
            {Array.from(new Set(pageObj.ayahs?.map((a: any) => a?.surah?.englishName).filter(Boolean))).join(' • ')}
          </span>
          <span>Page {pageNum}</span>
        </div>

        {/* 15 Lines Layout Container */}
        {loading15 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 text-sm text-accent/70 dark:text-accent/70 font-semibold font-sans">Formatting 15-line Quran page...</p>
          </div>
        ) : (
          <div className="flex flex-col justify-between h-[calc(100%-4rem)] min-h-[60vh] space-y-4">
            {layout.map((line) => {
              if (line.line_type === 'surah_name') {
                const surahName = pageObj.ayahs?.find((a: any) => a.surah?.number === line.surah_number)?.surah?.englishName || `Surah ${line.surah_number}`;
                return (
                  <div key={`line-${line.line_number}`} className="relative my-2 w-full flex items-center justify-center py-1 select-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FAF3E3]/40 via-[#FAF3E3]/95 to-[#FAF3E3]/40 dark:from-[#1A1F26]/40 dark:via-[#1A1F26]/95 dark:to-[#1A1F26]/40 rounded-xl border border-accent/20 dark:border-accent/15" />
                    <div className="relative z-10 px-6 py-2 border border-accent/25 dark:border-accent/20 rounded-xl bg-[#FAF8F4]/90 dark:bg-[#151A20]/90 flex flex-col items-center justify-center min-w-[180px]">
                      <span className="text-[8px] font-bold text-accent/80 dark:text-accent/80 tracking-widest uppercase mb-0.5 font-sans">Surah</span>
                      <h3 className="text-sm sm:text-base font-bold font-serif-header text-gray-900 dark:text-white leading-tight">
                        {surahName}
                      </h3>
                    </div>
                  </div>
                );
              }
              
              if (line.line_type === 'basmallah') {
                return (
                  <div key={`line-${line.line_number}`} className="text-center py-2 select-none">
                    <div className="inline-block px-6 py-1 border-b border-accent/10 dark:border-accent/10 text-xl sm:text-2xl text-accent-foreground font-arabic text-center" style={{ fontFamily: "'UthmanicHafs_V22', 'Amiri', serif", direction: 'rtl' }}>
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </div>
                  </div>
                );
              }

              if (line.line_type === 'ayah') {
                const words = wordsByLine[line.line_number] || [];
                return (
                  <div 
                    key={`line-${line.line_number}`} 
                    className="flex flex-row items-center w-full leading-[2.5] sm:leading-[3.0] overflow-visible font-arabic arabic-text uthmanic-hafs text-accent-foreground"
                    dir="rtl"
                    style={{
                      justifyContent: line.is_centered === 1 ? 'center' : 'space-between',
                      flexWrap: 'nowrap',
                    }}
                  >
                    {words.map((word) => {
                      const wordId = word.id;
                      const wordSurah = word.surah;
                      const wordAyah = word.ayah;
                      
                      const isActive = activeAyah && activeAyah.surah === wordSurah && activeAyah.ayah === wordAyah;
                      const isSelected = Array.from(selectedAyahs).some(sel => sel.surah === wordSurah && sel.ayah === wordAyah);
                      
                      const status = getMemorizationStatus(wordSurah, wordAyah);
                      const isMemorized = isAyahInMemorization(wordSurah, wordAyah);
                      const reviewGlowClass = status === 'overdue' ? 'decoration-red-500 underline decoration-2 underline-offset-4' :
                                               status === 'due-today' ? 'decoration-orange-500 underline decoration-2 underline-offset-4' :
                                               status === 'due-soon' ? 'decoration-accent underline decoration-2 underline-offset-4' :
                                               status === 'upcoming' ? 'decoration-emerald-500 underline decoration-2 underline-offset-4' : '';

                      // Find the translation for this word if available and feature is enabled
                      let translation = '';
                      if (showWordByWordTooltip && wordByWordData && Array.isArray(wordByWordData) && wordByWordData.length > 0) {
                        let match = wordByWordData.find(
                          (w) => w.surah === wordSurah && w.ayah === wordAyah && w.position === word.word
                        );
                        // Fallback matching by relative index in ayah
                        if (!match) {
                          const ayahWords = wordByWordData.filter(w => w.surah === wordSurah && w.ayah === wordAyah);
                          const allPageWordsForAyah = Object.values(wordsByLine)
                            .flat()
                            .filter((w: any) => w.surah === wordSurah && w.ayah === wordAyah)
                            .sort((a: any, b: any) => a.id - b.id);
                          const wordIndexInAyah = allPageWordsForAyah.findIndex((w: any) => w.id === wordId);
                          if (wordIndexInAyah !== -1 && ayahWords.length > wordIndexInAyah) {
                            match = ayahWords[wordIndexInAyah];
                          }
                        }
                        if (match && match.translation) {
                          translation = match.translation;
                        }
                      }

                      const shouldShowTranslationTooltip = hoveredTajweedWordId15 !== String(wordId);

                      const isWordVisible = visibleWordIds15.has(String(wordId));

                      // Function to render the inner word content (with or without Tajweed rules)
                      const renderWordContent = () => {
                        if (word.tajweedRules && word.tajweedRules.length > 0) {
                          const text = word.text;
                          const rules = word.tajweedRules;
                          const segments: React.ReactNode[] = [];
                          let lastIndex = 0;
                          const sortedRules = [...rules].sort((a, b) => a.startIndex - b.startIndex);
                          // Combining marks / tatweel that must stay attached to the preceding base letter.
                          const isCombiningOrTatweel = (ch: string) =>
                            /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0640]/.test(ch);
                          // Split beforeText at the last base letter so we can pull it into the rule span
                          const splitBeforeBaseLetter = (beforeText: string): [string, string] => {
                            let splitAt = beforeText.length;
                            for (let i = beforeText.length - 1; i >= 0; i--) {
                              if (!isCombiningOrTatweel(beforeText[i])) {
                                splitAt = i;
                                break;
                              }
                            }
                            return [beforeText.slice(0, splitAt), beforeText.slice(splitAt)];
                          };

                          sortedRules.forEach((rule, ruleIndex) => {
                            const ruleColor = TOPIC_TAILWIND_COLORS[rule.class] || TAJWEED_COLORS[rule.class] || 'text-gray-600';
                            const ruleDescription = rule.hukumLabel && rule.ruleLabel
                              ? [rule.hukumLabel, rule.hukumLabelEn, `— ${rule.ruleLabel}`, rule.ruleLabelEn].filter(Boolean).join('\n')
                              : getTajweedTooltip(rule.class);
                            const tooltipId = 'tajweed-tooltip-15line';
                            const ruleStartsWithCombining = rule.text.length > 0 && isCombiningOrTatweel(rule.text[0]);

                            const handleTajweedMouseEnter = () => {
                              if (hoverTimeoutRef15.current) clearTimeout(hoverTimeoutRef15.current);
                              setHoveredTajweedWordId15(String(wordId));
                            };
                            const handleTajweedMouseLeave = () => {
                              hoverTimeoutRef15.current = setTimeout(() => setHoveredTajweedWordId15(null), 80);
                            };

                            if (rule.startIndex > lastIndex) {
                              const beforeText = text.slice(lastIndex, rule.startIndex);
                              if (ruleStartsWithCombining && beforeText.length > 0) {
                                // Pull the last base letter into the rule span so the combining mark
                                // stays in the same text node as its base letter.
                                const [textBeforeBase, baseWithMarks] = splitBeforeBaseLetter(beforeText);
                                if (textBeforeBase) {
                                  segments.push(
                                    <span
                                      key={`text-${wordId}-${ruleIndex}`}
                                      style={{ fontSize: `${arabicFontSize}px` }}
                                    >
                                      {textBeforeBase}
                                    </span>
                                  );
                                }
                                segments.push(
                                  <span
                                    key={`rule-${wordId}-${ruleIndex}`}
                                    className={`${ruleColor} cursor-help tajweed-rule`}
                                    data-tooltip-id={tooltipId}
                                    data-tooltip-content={ruleDescription}
                                    style={{ fontSize: `${arabicFontSize}px` }}
                                    onMouseEnter={handleTajweedMouseEnter}
                                    onMouseLeave={handleTajweedMouseLeave}
                                  >
                                    {baseWithMarks}{rule.text}
                                  </span>
                                );
                              } else {
                                segments.push(
                                  <span
                                    key={`text-${wordId}-${ruleIndex}`}
                                    style={{ fontSize: `${arabicFontSize}px` }}
                                  >
                                    {beforeText}
                                  </span>
                                );
                                segments.push(
                                  <span
                                    key={`rule-${wordId}-${ruleIndex}`}
                                    className={`${ruleColor} cursor-help tajweed-rule`}
                                    data-tooltip-id={tooltipId}
                                    data-tooltip-content={ruleDescription}
                                    style={{ fontSize: `${arabicFontSize}px` }}
                                    onMouseEnter={handleTajweedMouseEnter}
                                    onMouseLeave={handleTajweedMouseLeave}
                                  >
                                    {rule.text}
                                  </span>
                                );
                              }
                            } else {
                              segments.push(
                                <span
                                  key={`rule-${wordId}-${ruleIndex}`}
                                  className={`${ruleColor} cursor-help tajweed-rule`}
                                  data-tooltip-id={tooltipId}
                                  data-tooltip-content={ruleDescription}
                                  style={{ fontSize: `${arabicFontSize}px` }}
                                  onMouseEnter={handleTajweedMouseEnter}
                                  onMouseLeave={handleTajweedMouseLeave}
                                >
                                  {rule.text}
                                </span>
                              );
                            }
                            lastIndex = rule.endIndex;
                          });

                          if (lastIndex < text.length) {
                            segments.push(
                              <span
                                key={`text-${wordId}-end`}
                                style={{ fontSize: `${arabicFontSize}px` }}
                              >
                                {text.slice(lastIndex)}
                              </span>
                            );
                          }
                          return segments;
                        }
                        return word.text;
                      };

                      if (hideWords) {
                        return (
                          <span
                            key={`word-${wordId}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onActiveAyahChange?.({ surah: wordSurah, ayah: wordAyah });
                            }}
                            onMouseEnter={() => handleWordMouseEnter15(String(wordId), wordSurah, wordAyah, word)}
                            onMouseLeave={() => handleWordMouseLeave15(String(wordId))}
                            data-tooltip-id={showWordByWordTooltip && translation && shouldShowTranslationTooltip ? WORD_TRANSLATION_TOOLTIP_ID_15 : undefined}
                            data-tooltip-content={showWordByWordTooltip && translation && shouldShowTranslationTooltip ? translation : undefined}
                            className={`inline cursor-pointer select-none transition-all duration-200 px-0.5 rounded-sm relative font-arabic arabic-text uthmanic-hafs ${
                              isActive 
                                ? 'bg-accent/15 dark:bg-accent/20' 
                                : isSelected
                                  ? 'bg-accent/8 dark:bg-accent/10'
                                  : 'hover:bg-accent/5 dark:hover:bg-accent/10'
                            } ${isMemorized ? reviewGlowClass : ''}`}
                            style={{
                              fontFamily: fontLoaded15 ? qpcFontLoader.getFontFamily(pageNum) : "'UthmanicHafs_V22', 'qpc-v2-fallback', 'Amiri', serif",
                              fontSize: `${arabicFontSize}px`,
                              direction: 'rtl',
                              whiteSpace: 'nowrap',
                              fontFeatureSettings: fontLoaded15 ? "'liga' 1, 'kern' 1, 'calt' 1, 'rlig' 1, 'ccmp' 1, 'locl' 1, 'mark' 1, 'mkmk' 1" : "'liga' 0, 'kern' 0, 'calt' 0, 'rlig' 0, 'ccmp' 0, 'locl' 0, 'mark' 0, 'mkmk' 0",
                              textRendering: 'optimizeLegibility',
                              WebkitFontSmoothing: 'antialiased',
                              MozOsxFontSmoothing: 'grayscale',
                            }}
                          >
                            {/* Invisible text that takes up natural space */}
                            <span className="opacity-0" style={{ fontSize: `${arabicFontSize}px` }}>
                              {word.text}
                            </span>
                            
                            {/* Overlay for hiding/showing */}
                            <span
                              className={`transition-opacity duration-200 absolute inset-0 flex items-center justify-center ${
                                isWordVisible ? 'opacity-0' : 'opacity-100'
                              }`}
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px dashed rgba(156, 163, 175, 0.6)',
                                borderRadius: '3px',
                                zIndex: 10
                              }}
                            />

                            {/* Visible text when revealed — with tajweed coloring */}
                            <span
                              className={`transition-opacity duration-200 absolute inset-0 flex items-center justify-center ${
                                isWordVisible ? 'opacity-100' : 'opacity-0'
                              }`}
                              style={{
                                fontSize: `${arabicFontSize}px`,
                                backgroundColor: 'transparent',
                                borderRadius: '3px',
                                zIndex: 20
                              }}
                            >
                              {renderWordContent()}
                            </span>
                          </span>
                        );
                      }

                      return (
                        <span
                          key={`word-${wordId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onActiveAyahChange?.({ surah: wordSurah, ayah: wordAyah });
                          }}
                          data-tooltip-id={showWordByWordTooltip && translation && shouldShowTranslationTooltip ? WORD_TRANSLATION_TOOLTIP_ID_15 : undefined}
                          data-tooltip-content={showWordByWordTooltip && translation && shouldShowTranslationTooltip ? translation : undefined}
                          className={`inline cursor-pointer select-none transition-all duration-200 px-0.5 rounded-sm font-arabic arabic-text uthmanic-hafs ${
                            isActive 
                              ? 'bg-accent/15 dark:bg-accent/20' 
                              : isSelected
                                ? 'bg-accent/8 dark:bg-accent/10'
                                : 'hover:bg-accent/5 dark:hover:bg-accent/10'
                          } ${isMemorized ? reviewGlowClass : ''}`}
                          style={{
                            fontFamily: fontLoaded15 ? qpcFontLoader.getFontFamily(pageNum) : "'UthmanicHafs_V22', 'qpc-v2-fallback', 'Amiri', serif",
                            fontSize: `${arabicFontSize}px`,
                            direction: 'rtl',
                            whiteSpace: 'nowrap',
                            fontFeatureSettings: fontLoaded15 ? "'liga' 1, 'kern' 1, 'calt' 1, 'rlig' 1, 'ccmp' 1, 'locl' 1, 'mark' 1, 'mkmk' 1" : "'liga' 0, 'kern' 0, 'calt' 0, 'rlig' 0, 'ccmp' 0, 'locl' 0, 'mark' 0, 'mkmk' 0",
                            textRendering: 'optimizeLegibility',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                          }}
                        >
                          {renderWordContent()}
                        </span>
                      );
                    })}
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen translation-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">Loading Quran pages...</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Please wait while we prepare your reading</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">No page data available</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] dark:bg-[#0B0D0E] translation-loading">
      <div className="max-w-7xl mx-auto" style={{ paddingLeft: `${padding}px`, paddingRight: `${padding}px` }}>

        {(
          layoutMode === 'spread' ? (
            <div className={`flex gap-2 sm:gap-6 p-2 sm:p-6 ${currentPage % 2 === 1 ? 'flex-row-reverse' : ''}`}>
              {/* Current Page — right if odd, left if even (like a real mushaf) */}
              <Card className="flex-1 min-h-screen border-0 shadow-none bg-transparent">
                <div className="p-1 sm:p-4">
                  {/* Page Header — English name | divider | Arabic name ... page number */}
                  <div className="flex items-center justify-between mb-8 pb-3 border-b border-accent/15 dark:border-accent/10">
                    <div className="flex items-center gap-3 min-w-0">
                      {pageData?.ayahs && pageData.ayahs.length > 0 && (() => {
                        const uniqueSurahs = Array.from(new Set(pageData.ayahs.map((a: any) => a?.surah?.number).filter(Boolean)));
                        const arabicNames = uniqueSurahs.map(s => pageData.ayahs.find((a: any) => a?.surah?.number === s)?.surah?.name).filter(Boolean);
                        const englishNames = uniqueSurahs.map(s => pageData.ayahs.find((a: any) => a?.surah?.number === s)?.surah?.englishName).filter(Boolean);
                        return (
                          <>
                            {englishNames.length > 0 && (
                              <span className="text-sm font-semibold text-accent/70 font-serif-header tracking-wide truncate">
                                {englishNames.join(' • ')}
                              </span>
                            )}
                            {arabicNames.length > 0 && englishNames.length > 0 && (
                              <span className="text-accent/40 text-xs">|</span>
                            )}
                            {arabicNames.length > 0 && (
                              <span className="text-base text-accent-foreground font-arabic" dir="rtl">
                                {arabicNames.join(' • ')}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <span className="text-xs font-semibold text-accent/60 dark:text-accent/50 tracking-wide font-sans flex-shrink-0">
                      Page {currentPage}
                    </span>
                  </div>

                  {/* Current Page Content */}
                  <div className="space-y-8">
                    {pageData?.ayahs ? (
                      pageData.ayahs.map((ayah: any, index: number) => {
                        const surahNumber = ayah.surah?.number || pageData?.surah || 1;
                        const ayahNumber = ayah.numberInSurah;
                        
                        return (
                          <div key={ayah.number}>
                            <AyahCard
                              ayah={ayah}
                              index={index}
                              pageData={pageData}
                              isMemorization={isAyahInMemorization(surahNumber, ayahNumber)}
                              status={getMemorizationStatus(surahNumber, ayahNumber)}
                              isSelected={Array.from(selectedAyahs).some(sel => sel.surah === surahNumber && sel.ayah === ayahNumber)}
                              isInHighlightedRange={(() => {
                                const isInHighlightedRange = !!(highlightedRange &&
                                  highlightedRange.surah === surahNumber &&
                                  ayahNumber >= highlightedRange.start &&
                                  ayahNumber <= highlightedRange.end);
                                const isInReviewOnPage = reviewsOnPage?.some(review =>
                                  review.surah === surahNumber &&
                                  ayahNumber >= review.ayahStart &&
                                  ayahNumber <= review.ayahEnd
                                ) || false;
                                return isInHighlightedRange || isInReviewOnPage;
                              })()}
                              showTranslation={showTranslation}
                              memorizationItems={memorizationItems}
                              onAyahClick={() => onAyahClick(surahNumber, ayahNumber)}
                              onPlayAudio={onPlayAudio}
                              onQuickReview={onQuickReview}
                              onToggleReviewDropdown={onToggleReviewDropdown}
                              openReviewDropdown={openReviewDropdown}
                              onReviewComplete={onReviewComplete}
                              reviewsOnPage={reviewsOnPage}
                              fontSize={fontSize}
                              arabicFontSize={arabicFontSize}
                              translationFontSize={translationFontSize}
                              fontTargetArabic={fontTargetArabic}
                              mistakes={mistakes}
                              onToggleMistake={onToggleMistake}
                              hideMistakes={hideMistakes}
                              onRevealMistake={onRevealMistake}
                              revealedMistakes={revealedMistakes}
                              hideWords={hideWords}
                              hideWordsDelay={hideWordsDelay}
                              wordByWordData={wordByWordData}
                              showWordByWordTooltip={showWordByWordTooltip}
                              padding={padding}
                              borderless={true}
                              layoutMode={layoutMode}
                              isCurrentlyPlaying={!!playingAyah && playingAyah.surah === surahNumber && playingAyah.ayah === ayahNumber}
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <div className="animate-pulse">Loading ayahs...</div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Adjacent Page — left if current is odd, right if current is even */}
              {previousPageData && (
                <Card className="flex-1 min-h-screen border-0 shadow-none bg-transparent">
                  <div className="p-1 sm:p-4">
                    {/* Page Header — English name | divider | Arabic name ... page number */}
                    <div className="flex items-center justify-between mb-8 pb-3 border-b border-accent/15 dark:border-accent/10">
                      <div className="flex items-center gap-3 min-w-0">
                        {previousPageData?.ayahs && previousPageData.ayahs.length > 0 && (() => {
                          const uniqueSurahs = Array.from(new Set(previousPageData.ayahs.map((a: any) => a?.surah?.number).filter(Boolean)));
                          const arabicNames = uniqueSurahs.map(s => previousPageData.ayahs.find((a: any) => a?.surah?.number === s)?.surah?.name).filter(Boolean);
                          const englishNames = uniqueSurahs.map(s => previousPageData.ayahs.find((a: any) => a?.surah?.number === s)?.surah?.englishName).filter(Boolean);
                          return (
                            <>
                              {englishNames.length > 0 && (
                                <span className="text-sm font-semibold text-accent/70 font-serif-header tracking-wide truncate">
                                  {englishNames.join(' • ')}
                                </span>
                              )}
                              {arabicNames.length > 0 && englishNames.length > 0 && (
                                <span className="text-accent/40 text-xs">|</span>
                              )}
                              {arabicNames.length > 0 && (
                                <span className="text-base text-accent-foreground font-arabic" dir="rtl">
                                  {arabicNames.join(' • ')}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-xs font-semibold text-accent/60 dark:text-accent/50 tracking-wide font-sans flex-shrink-0">
                        Page {previousPageData?.number || (currentPage % 2 === 1 ? currentPage + 1 : currentPage - 1)}
                      </span>
                    </div>

                    {/* Previous Page Content */}
                    <div className="space-y-8">
                      {previousPageData?.ayahs ? (
                        previousPageData.ayahs.map((ayah: any, index: number) => {
                          const surahNumber = ayah.surah?.number || previousPageData?.surah || 1;
                          const ayahNumber = ayah.numberInSurah;
                          const isMemorization = isAyahInMemorization(surahNumber, ayahNumber);
                          const status = getMemorizationStatus(surahNumber, ayahNumber);
                          const isSelected = Array.from(selectedAyahs).some(sel => sel.surah === surahNumber && sel.ayah === ayahNumber);
                          
                          const isInHighlightedRange = !!(highlightedRange && 
                            highlightedRange.surah === surahNumber && 
                            ayahNumber >= highlightedRange.start && 
                            ayahNumber <= highlightedRange.end);
                          const isInReviewOnPage = reviewsOnPage?.some(review => 
                            review.surah === surahNumber && 
                            ayahNumber >= review.ayahStart && 
                            ayahNumber <= review.ayahEnd
                          ) || false;
                          const shouldHighlight = isInHighlightedRange || isInReviewOnPage;

                          return (
                            <AyahCard
                              key={ayah.number}
                              ayah={ayah}
                              index={index}
                              pageData={previousPageData}
                              isMemorization={isMemorization}
                              status={status}
                              isSelected={isSelected}
                              isInHighlightedRange={shouldHighlight}
                              showTranslation={showTranslation}
                              memorizationItems={memorizationItems}
                              onAyahClick={() => onAyahClick(surahNumber, ayahNumber)}
                              onPlayAudio={onPlayAudio}
                              onQuickReview={onQuickReview}
                              onToggleReviewDropdown={onToggleReviewDropdown}
                              openReviewDropdown={openReviewDropdown}
                              onReviewComplete={onReviewComplete}
                              reviewsOnPage={reviewsOnPage}
                              fontSize={fontSize}
                              arabicFontSize={arabicFontSize}
                              translationFontSize={translationFontSize}
                              fontTargetArabic={fontTargetArabic}
                              mistakes={mistakes}
                              onToggleMistake={onToggleMistake}
                              hideMistakes={hideMistakes}
                              onRevealMistake={onRevealMistake}
                              revealedMistakes={revealedMistakes}
                              hideWords={hideWords}
                              hideWordsDelay={hideWordsDelay}
                              wordByWordData={wordByWordData}
                              showWordByWordTooltip={showWordByWordTooltip}
                              padding={padding}
                              borderless={true}
                              layoutMode={layoutMode}
                              isCurrentlyPlaying={!!playingAyah && playingAyah.surah === surahNumber && playingAyah.ayah === ayahNumber}
                            />
                          );
                        })
                      ) : (currentPage % 2 === 1 && currentPage >= 604) || (currentPage % 2 === 0 && currentPage <= 1) ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <div className="text-lg font-medium mb-2">{currentPage >= 604 ? 'End of Quran' : 'Beginning of Quran'}</div>
                          <div className="text-sm">{currentPage >= 604 ? 'This is the last page' : 'This is the first page'}</div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <div className="animate-pulse">Loading adjacent page...</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-2 sm:py-6 relative pr-4 lg:pr-8">
              {/* Vertical timeline line on the right side, acting as a book margin guideline */}
              <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent/25 via-accent/5 to-transparent pointer-events-none" />
              <div className="p-1 sm:p-4">
                {/* Page Header — English name | divider | Arabic name ... page number */}
                <div className="flex items-center justify-between mb-8 pb-3 border-b border-accent/15 dark:border-accent/10">
                  <div className="flex items-center gap-3 min-w-0">
                    {pageData?.ayahs && pageData.ayahs.length > 0 && (() => {
                      const uniqueSurahs = Array.from(new Set(pageData.ayahs.map((a: any) => a?.surah?.number).filter(Boolean)));
                      const arabicNames = uniqueSurahs.map(s => pageData.ayahs.find((a: any) => a?.surah?.number === s)?.surah?.name).filter(Boolean);
                      const englishNames = uniqueSurahs.map(s => pageData.ayahs.find((a: any) => a?.surah?.number === s)?.surah?.englishName).filter(Boolean);
                      return (
                        <>
                          {englishNames.length > 0 && (
                            <span className="text-sm font-semibold text-accent/70 font-serif-header tracking-wide truncate">
                              {englishNames.join(' • ')}
                            </span>
                          )}
                          {arabicNames.length > 0 && englishNames.length > 0 && (
                            <span className="text-accent/40 text-xs">|</span>
                          )}
                          {arabicNames.length > 0 && (
                            <span className="text-base text-accent-foreground font-arabic" dir="rtl">
                              {arabicNames.join(' • ')}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <span className="text-xs font-semibold text-accent/60 dark:text-accent/50 tracking-wide font-sans flex-shrink-0">
                    {pageData?.number ? `Page ${pageData.number}` : ''}
                  </span>
                </div>

                {/* Single Page Content */}
                <div className="space-y-8">
                  {pageData?.ayahs ? (
                    pageData.ayahs.map((ayah: any, index: number) => {
                      const surahNumber = ayah.surah?.number || pageData?.surah || 1;
                      const ayahNumber = ayah.numberInSurah;
                      
                      return (
                        <div key={ayah.number}>
                          <AyahCard
                            ayah={ayah}
                            index={index}
                            pageData={pageData}
                            isMemorization={isAyahInMemorization(surahNumber, ayahNumber)}
                            status={getMemorizationStatus(surahNumber, ayahNumber)}
                            isSelected={Array.from(selectedAyahs).some(sel => sel.surah === surahNumber && sel.ayah === ayahNumber)}
                            isInHighlightedRange={(() => {
                              const isInHighlightedRange = !!(highlightedRange && 
                                highlightedRange.surah === surahNumber && 
                                ayahNumber >= highlightedRange.start && 
                                ayahNumber <= highlightedRange.end);
                              const isInReviewOnPage = reviewsOnPage?.some(review => 
                                review.surah === surahNumber && 
                                ayahNumber >= review.ayahStart && 
                                ayahNumber <= review.ayahEnd
                              ) || false;
                              return isInHighlightedRange || isInReviewOnPage;
                            })()}
                            showTranslation={showTranslation}
                            memorizationItems={memorizationItems}
                            onAyahClick={() => onAyahClick(surahNumber, ayahNumber)}
                            onPlayAudio={onPlayAudio}
                            onQuickReview={onQuickReview}
                            onToggleReviewDropdown={onToggleReviewDropdown}
                            openReviewDropdown={openReviewDropdown}
                            onReviewComplete={onReviewComplete}
                            reviewsOnPage={reviewsOnPage}
                            fontSize={fontSize}
                            arabicFontSize={arabicFontSize}
                            translationFontSize={translationFontSize}
                            fontTargetArabic={fontTargetArabic}
                            mistakes={mistakes}
                            onToggleMistake={onToggleMistake}
                            hideMistakes={hideMistakes}
                            onRevealMistake={onRevealMistake}
                            revealedMistakes={revealedMistakes}
                            hideWords={hideWords}
                            hideWordsDelay={hideWordsDelay}
                            wordByWordData={wordByWordData}
                            showWordByWordTooltip={showWordByWordTooltip}
                            padding={padding}
                            borderless={true}
                            layoutMode={layoutMode}
                            isCurrentlyPlaying={!!playingAyah && playingAyah.surah === surahNumber && playingAyah.ayah === ayahNumber}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <div className="animate-pulse">Loading ayahs...</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* Selected Ayahs — slim pill toolbar, non-intrusive */}
        {selectedAyahs.size > 0 && (
          <div className="fixed bottom-6 right-4 md:right-6 z-40 flex items-center gap-1.5 bg-card border border-border rounded-full shadow-lg px-1 py-1 animate-fade-in-up">
            {/* Count badge — click to see details */}
            <button
              onClick={() => setShowSelectedAyahsModal(true)}
              className="flex items-center gap-1.5 pl-3 pr-2 h-8 rounded-full hover:bg-accent/8 transition-colors group"
              title="View selected verses"
            >
              <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                {selectedAyahs.size}
              </span>
              <span className="text-[11px] font-semibold text-accent font-sans whitespace-nowrap transition-colors">
                {selectedAyahs.size === 1 ? 'verse' : 'verses'}
              </span>
            </button>

            <div className="w-px h-5 bg-border" />

            {/* Add for Review */}
            <button
              onClick={onAddRevision}
              className="h-8 px-3 rounded-full text-[11px] font-bold font-sans bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
              title="Add selected verses for review"
            >
              Add Review
            </button>

            {/* Clear */}
            <button
              onClick={() => onClearSelectedAyahs?.()}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="Clear selection"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Selected Ayahs Modal */}
        <SelectedAyahsModal
          isOpen={showSelectedAyahsModal}
          selectedAyahs={selectedAyahs}
          pageData={pageData}
          onClose={() => setShowSelectedAyahsModal(false)}
          onAddForReview={() => {
            onAddRevision();
            setShowSelectedAyahsModal(false);
          }}
          onRemoveAyah={onRemoveAyah || (() => {})}
          onClearAll={onClearSelectedAyahs || (() => {})}
        />

        {/* Sliding detail drawer for active verse in Mushaf modes */}
        <AyahDetailDrawer
          isOpen={false}
          onClose={() => onActiveAyahChange?.(null)}
          ayah={activeAyahData}
          pageData={pageData?.ayahs?.includes(activeAyahData) ? pageData : previousPageData}
          isMemorization={activeAyahData ? isAyahInMemorization(activeAyahData.surah?.number || pageData?.surah || activeAyah?.surah || 1, activeAyah?.ayah || 1) : false}
          status={activeAyahData ? getMemorizationStatus(activeAyahData.surah?.number || pageData?.surah || activeAyah?.surah || 1, activeAyah?.ayah || 1) : null}
          showTranslation={true}
          memorizationItems={memorizationItems}
          onPlayAudio={onPlayAudio}
          onQuickReview={onQuickReview}
          onToggleReviewDropdown={onToggleReviewDropdown}
          openReviewDropdown={openReviewDropdown}
          onReviewComplete={onReviewComplete}
          reviewsOnPage={reviewsOnPage}
          fontSize={fontSize}
          arabicFontSize={arabicFontSize}
          translationFontSize={translationFontSize}
          fontTargetArabic={fontTargetArabic}
          mistakes={mistakes}
          onToggleMistake={onToggleMistake}
          hideMistakes={hideMistakes}
          onRevealMistake={onRevealMistake}
          revealedMistakes={revealedMistakes}
          hideWords={hideWords}
          hideWordsDelay={hideWordsDelay}
          wordByWordData={wordByWordData}
          showWordByWordTooltip={showWordByWordTooltip}
          layoutMode={layoutMode}
        />

        {/* 15-line Mushaf Tooltips Portal */}
        {mounted && typeof document !== 'undefined' && createPortal(
          <>
            <Tooltip
              id="tajweed-tooltip-15line"
              style={{
                backgroundColor: '#1f2937', // bg-gray-800
                color: '#fff',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.5rem',
                fontSize: '0.875rem', // text-sm
                zIndex: 9999,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
            />
            {/* Single shared tooltip for word translations — content comes from
                data-tooltip-content on each word span */}
            <Tooltip
              id={WORD_TRANSLATION_TOOLTIP_ID_15}
              style={{
                backgroundColor: '#111827',
                color: '#fff',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                zIndex: 9999,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
            />
          </>,
          document.body
        )}
      </div>
    </main>
  );
}

// Helper functions for 15-line layout tooltips
function isColorLight(hex: string): boolean {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 180;
}

const ruleColorMap: Record<string, string> = {
  // New topic-based system (quranpedia engine — 7 topics)
  'tafkheem-tarqeeq': '#c2410c',
  'letter-relations': '#7e22ce',
  'noon-tanween': '#0369a1',
  'meem-sakinah': '#0f766e',
  mushaddadatan: '#a16207',
  madd: '#be123c',
  qalqalah: '#15803d',
  // Old rule-class system (backward compatibility)
  ham_wasl: '#ef4444',
  laam_shamsiyah: '#f59e42',
  madda_normal: '#22c55e',
  madda_permissible: '#22c55e',
  madda_necessary: '#16a34a',
  slnt: '#6b7280',
  ghunnah: '#6366f1',
  qalaqah: '#f97316',
  ikhafa: '#a78bfa',
  madda_obligatory_mottasel: '#16a34a',
  madda_obligatory_monfasel: '#16a34a',
  iqlab: '#14b8a6',
  izhar: '#3b82f6',
  idgham_ghunnah: '#2563eb',
  idgham_wo_ghunnah: '#3b82f6',
  ikhafa_shafawi: '#a78bfa',
  idgham_shafawi: '#2563eb',
  izhar_shafawi: '#3b82f6',
  madd_al_tamkeen: '#22c55e',
  tafkheem: '#ef4444',
  tarqeeq: '#60a5fa',
}; 