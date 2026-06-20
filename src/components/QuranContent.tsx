'use client';

import { useState, useEffect } from 'react';
import AyahCard from './AyahCard';
import { MistakeData } from '@/lib/supabase/database';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SelectedAyahsModal from './SelectedAyahsModal';
import { TajweedAyahText } from './TajweedAyahText';

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
  readingLayout?: 'mushaf' | 'verse';
  activeAyah?: { surah: number; ayah: number } | null;
  onActiveAyahChange?: (ayah: { surah: number; ayah: number } | null) => void;
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
}: QuranContentProps) {
  const [showSelectedAyahsModal, setShowSelectedAyahsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth <= 640);
      
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 640);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

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
        <div className="flex-1 flex items-center justify-center p-12 border-2 border-dashed border-amber-500/20 dark:border-border/10 rounded-2xl min-h-[60vh]">
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
      <Card className={`flex-1 min-h-[75vh] shadow-[0_10px_35px_-5px_rgba(0,0,0,0.05)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.35)] border-4 border-double border-amber-500/40 dark:border-accent/30 bg-[#FAF8F5]/90 dark:bg-[#12161A]/95 backdrop-blur-md overflow-hidden relative p-6 sm:p-8 md:p-10 font-sans transition-all duration-300 ${roundedClass}`}>
        
        {/* Double Gold nested borders framing the page */}
        <div className="absolute inset-4 pointer-events-none border border-amber-500/25 dark:border-accent/20 rounded-2xl z-20" />
        <div className="absolute inset-5 pointer-events-none border border-amber-500/10 dark:border-accent/10 rounded-2xl z-20" />
        
        {/* Beautiful Custom SVG corner ornaments */}
        <CornerOrnament className="absolute top-4 left-4 w-10 h-10 text-amber-500/40 dark:text-accent/30 select-none pointer-events-none z-20" />
        <CornerOrnament className="absolute top-4 right-4 w-10 h-10 text-amber-500/40 dark:text-accent/30 select-none pointer-events-none z-20 rotate-90" />
        <CornerOrnament className="absolute bottom-4 right-4 w-10 h-10 text-amber-500/40 dark:text-accent/30 select-none pointer-events-none z-20 rotate-180" />
        <CornerOrnament className="absolute bottom-4 left-4 w-10 h-10 text-amber-500/40 dark:text-accent/30 select-none pointer-events-none z-20 -rotate-90" />

        {/* Page fold shading (inner page curl shadow near spine) */}
        {pageSide === 'left' && (
          <div className="hidden lg:block absolute top-0 bottom-0 right-0 w-16 pointer-events-none z-25 bg-gradient-to-l from-black/8 via-black/2 to-transparent dark:from-black/25 dark:via-black/8" />
        )}
        {pageSide === 'right' && (
          <div className="hidden lg:block absolute top-0 bottom-0 left-0 w-16 pointer-events-none z-25 bg-gradient-to-r from-black/8 via-black/2 to-transparent dark:from-black/25 dark:via-black/8" />
        )}
        
        {/* Page Top Header */}
        <div className="flex justify-between items-center pb-3 mb-6 border-b border-amber-500/20 dark:border-accent/10 text-xs font-bold text-amber-700/70 dark:text-accent/60 tracking-wider">
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
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FAF3E3]/40 via-[#FAF3E3]/95 to-[#FAF3E3]/40 dark:from-[#1A1F26]/40 dark:via-[#1A1F26]/95 dark:to-[#1A1F26]/40 rounded-2xl border border-amber-500/25 dark:border-accent/20" />
                      
                      {/* Left Wing - hidden on micro screens, block on sm+ */}
                      <div className="hidden sm:block flex-1 max-w-[120px] md:max-w-[160px] text-amber-500/35 dark:text-accent/30 pr-4">
                        <SurahHeaderWing />
                      </div>
                      
                      {/* Center Medallion */}
                      <div className="relative z-10 px-8 py-3.5 border-2 border-amber-500/35 dark:border-accent/25 rounded-2xl bg-[#FAF8F4]/90 dark:bg-[#151A20]/90 shadow-[0_0_15px_rgba(212,175,55,0.08)] flex flex-col items-center justify-center min-w-[220px]">
                        <div className="absolute inset-0.5 border border-dashed border-amber-500/15 dark:border-accent/15 rounded-2xl" />
                        <span className="text-[9px] font-bold text-amber-700/80 dark:text-accent/80 tracking-widest uppercase block mb-0.5 font-sans">Surah</span>
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
                      <div className="hidden sm:block flex-1 max-w-[120px] md:max-w-[160px] text-amber-500/35 dark:text-accent/30 pl-4">
                        <SurahHeaderWing reverse />
                      </div>
                    </div>
                  )}

                  {/* Independent Bismillah Line below Surah Heading */}
                  {hasBismillah && (
                    <div className="text-center py-4 mb-4 select-none">
                      <div className="inline-block px-8 py-2 border-b border-amber-500/10 dark:border-accent/10 text-2xl sm:text-3xl text-amber-950 dark:text-amber-100 font-arabic text-center" style={{ fontFamily: 'Amiri, serif', direction: 'rtl' }}>
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
                      textAlignLast: surahAyahsList.length < 3 ? 'right' : 'center',
                      textJustify: 'inter-word',
                    }}
                  >
                    {surahAyahsList.map((ayah: any, index: number) => {
                      const ayahNo = ayah.numberInSurah;
                      const ayahKey = `${surahNo}:${ayahNo}`;
                      const isActive = activeAyah && activeAyah.surah === surahNo && activeAyah.ayah === ayahNo;
                      
                      let arText = ayah.text || '';
                      if (ayahNo === 1 && surahNo !== 1 && surahNo !== 9) {
                        const unicodeBismillahPattern = /^.*?بِسْمِ\s*[ٱا]للَّهِ\s*[ٱا]لرَّحْمَٰنِ\s*[ٱا]لرَّحِيمِ\s*/;
                        arText = arText.replace(unicodeBismillahPattern, '').trim();
                        if (arText.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')) {
                          arText = arText.substring('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'.length).trim();
                        }
                      }
                      
                      const status = getMemorizationStatus(surahNo, ayahNo);
                      const isMemorized = isAyahInMemorization(surahNo, ayahNo);
                      const reviewGlowClass = status === 'overdue' ? 'shadow-[0_0_8px_rgba(239,68,68,0.25)] border-b-2 border-red-500' :
                                              status === 'due-today' ? 'shadow-[0_0_8px_rgba(249,115,22,0.25)] border-b-2 border-orange-500' :
                                              status === 'due-soon' ? 'shadow-[0_0_8px_rgba(245,158,11,0.25)] border-b-2 border-amber-500' :
                                              status === 'upcoming' ? 'shadow-[0_0_8px_rgba(16,185,129,0.25)] border-b-2 border-emerald-500' : '';

                      const isSelected = Array.from(selectedAyahs).some(sel => sel.surah === surahNo && sel.ayah === ayahNo);
                      
                      return (
                        <span
                          key={ayah.number}
                          onClick={(e) => {
                            e.stopPropagation();
                            onActiveAyahChange?.({ surah: surahNo, ayah: ayahNo });
                          }}
                          className={`inline transition-all duration-200 cursor-pointer rounded px-1.5 py-1 select-text ${
                            isActive 
                              ? 'bg-amber-500/10 dark:bg-accent/20 ring-1 ring-amber-500/30 dark:ring-accent/40 shadow-[0_0_12px_rgba(212,175,55,0.2)]' 
                              : isSelected
                                ? 'bg-amber-500/5 dark:bg-accent/10 border-b border-amber-500'
                                : 'hover:bg-amber-500/5 dark:hover:bg-accent/10'
                          } ${isMemorized ? reviewGlowClass : ''}`}
                        >
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
                            disableTajweedColors={isMobile}
                            isMobile={isMobile}
                            displayMode="inline"
                          />
                          
                          <span 
                            className="inline-flex items-center justify-center mx-2 w-7 h-7 rounded-full border-2 border-amber-500/40 dark:border-accent/40 bg-amber-50/5 dark:bg-accent/5 text-[10px] font-bold text-amber-800 dark:text-accent select-none align-middle font-sans" 
                            dir="ltr"
                          >
                            {ayahNo}
                          </span>
                        </span>
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
        
        <div className="absolute bottom-4 left-6 right-6 border-t border-amber-500/10 dark:border-accent/10 pt-2 flex justify-center text-[10px] font-bold text-amber-700/60 dark:text-accent/50 tracking-widest uppercase">
          Juz' {ayahs[0]?.juz} • Page {pageNum}
        </div>
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
        
        {readingLayout === 'mushaf' ? (
          /* Continuous Mushaf Layout */
          <div className="space-y-8 p-2 sm:p-4 animate-fade-in">
            {layoutMode === 'spread' ? (
              /* Two-Page Spread Layout with 3D Book features */
              <div className="relative flex flex-col lg:flex-row gap-0 rounded-3xl overflow-hidden border border-amber-500/20 dark:border-accent/15 shadow-2xl bg-[#FAF8F5]/30 dark:bg-[#12161A]/30 p-1">
                {/* Left Page (Current Page) */}
                <div className="flex-1 relative flex">
                  {renderMushafPage(pageData, 'left')}
                </div>
                
                {/* Central Crease / Spine (only visible when side-by-side on lg screens) */}
                <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-16 z-30 pointer-events-none bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-black/30" />
                <div className="hidden lg:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 z-30 pointer-events-none bg-amber-500/20 dark:bg-accent/20" />
                
                {/* Right Page (Previous Page) */}
                <div className="flex-1 relative flex">
                  {renderMushafPage(previousPageData, 'right')}
                </div>
              </div>
            ) : (
              /* Single Page Layout */
              <div className="max-w-3xl mx-auto">
                {renderMushafPage(pageData, 'single')}
              </div>
            )}

            {/* Active Verse Commentary Panel with Parchment and Left Gold Divider */}
            {activeAyah && activeAyahData && (
              <div 
                key={`active-ayah-${activeAyah.surah}-${activeAyah.ayah}`}
                className="mt-8 max-w-3xl mx-auto px-4 md:px-0 animate-fade-in-up"
              >
                <div className="text-xs font-bold text-amber-700/80 dark:text-accent/80 uppercase tracking-widest mb-3 pl-1 font-sans flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-accent animate-pulse" />
                  Selected Verse Details & Translation
                </div>
                <div className="relative overflow-hidden rounded-2xl border-l-4 border-l-amber-500/80 border border-amber-500/20 dark:border-accent/15 bg-gradient-to-br from-[#FCFAF2] to-[#F5EEDC] dark:from-[#1D222B] dark:to-[#171B22] p-5 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.3)] transition-all duration-350 hover:scale-[1.005]">
                  {/* Subtle parchment paper texture overlay */}
                  <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--accent) 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
                  
                  <AyahCard
                    ayah={activeAyahData}
                    index={pageData.ayahs.indexOf(activeAyahData) >= 0 ? pageData.ayahs.indexOf(activeAyahData) : 0}
                    pageData={pageData.ayahs.includes(activeAyahData) ? pageData : previousPageData}
                    isMemorization={isAyahInMemorization(activeAyahData.surah?.number || pageData?.surah || activeAyah.surah, activeAyah.ayah)}
                    status={getMemorizationStatus(activeAyahData.surah?.number || pageData?.surah || activeAyah.surah, activeAyah.ayah)}
                    isSelected={false}
                    isInHighlightedRange={false}
                    showTranslation={true}
                    memorizationItems={memorizationItems}
                    onAyahClick={() => {}}
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
                    padding={0}
                    borderless={true}
                    layoutMode={layoutMode}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Borderless Editorial List Layout */
          layoutMode === 'spread' ? (
            /* Two-Page Spread Layout - RTL Order */
            <div className="flex gap-2 sm:gap-6 p-2 sm:p-6">
              {/* Left Page (Current Page) */}
              <Card className="flex-1 min-h-screen border-0 shadow-none bg-transparent">
                <div className="p-1 sm:p-4">
                  {/* Page Header */}
                  <div className="text-center mb-10 pb-6 border-b border-amber-200/20 dark:border-border/30">
                    <div className="text-xs uppercase tracking-widest text-amber-700/80 dark:text-accent/80 mb-2 font-sans font-semibold">
                      {pageData?.ayahs && pageData.ayahs.length > 0 ? 
                        (() => {
                          const uniqueSurahs = Array.from(
                            new Set(pageData.ayahs.map((ayah: any) => ayah?.surah?.number).filter(Boolean))
                          ).map(surahNumber => {
                            const ayah = pageData.ayahs.find((a: any) => a?.surah?.number === surahNumber);
                            return ayah?.surah;
                          }).filter(Boolean);
                          
                          if (uniqueSurahs.length === 1) {
                            return `${uniqueSurahs[0].englishName} (${uniqueSurahs[0].englishNameTranslation})`;
                          } else if (uniqueSurahs.length > 1) {
                            return uniqueSurahs.map(surah => 
                              `${surah.englishName} (${surah.englishNameTranslation})`
                            ).join(' • ');
                          } else {
                            return 'Current Page';
                          }
                        })() : 
                        'Current Page'
                      }
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif-header">
                      Page {currentPage}
                    </h2>
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

              {/* Right Page (Previous Page) */}
              {previousPageData && (
                <Card className="flex-1 min-h-screen border-0 shadow-none bg-transparent">
                  <div className="p-1 sm:p-4">
                    {/* Page Header */}
                    <div className="text-center mb-10 pb-6 border-b border-amber-200/20 dark:border-border/30">
                      <div className="text-xs uppercase tracking-widest text-amber-700/80 dark:text-accent/80 mb-2 font-sans font-semibold">
                        {previousPageData ? 
                          (() => {
                            const uniqueSurahs = Array.from(
                              new Set(previousPageData.ayahs.map((ayah: any) => ayah.surah?.number || previousPageData?.surah || 1))
                            ).map(surahNumber => {
                              const ayah = previousPageData.ayahs.find((a: any) => (a.surah?.number || previousPageData?.surah || 1) === surahNumber);
                              return ayah?.surah;
                            }).filter(Boolean);
                            
                            if (uniqueSurahs.length === 1) {
                              return `${uniqueSurahs[0].englishName} (${uniqueSurahs[0].englishNameTranslation})`;
                            } else {
                              return uniqueSurahs.map(surah => 
                                `${surah.englishName} (${surah.englishNameTranslation})`
                              ).join(' • ');
                            }
                          })() : 
                          'Previous Page'
                        }
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif-header">
                        Page {previousPageData?.number || (currentPage === 1 ? currentPage + 1 : currentPage - 1)}
                      </h2>
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
                            />
                          );
                        })
                      ) : currentPage === 1 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <div className="text-lg font-medium mb-2">Beginning of Quran</div>
                          <div className="text-sm">This is the first page</div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <div className="animate-pulse">Loading previous page...</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            /* Single Page Layout */
            <div className="max-w-3xl mx-auto py-2 sm:py-6 relative pr-4 lg:pr-8">
              {/* Vertical timeline line on the right side, acting as a book margin guideline */}
              <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/25 via-amber-500/5 to-transparent pointer-events-none" />
              <div className="p-1 sm:p-4">
                {/* Page Header */}
                <div className="text-center mb-10 pb-6 border-b border-amber-200/20 dark:border-border/30">
                  <div className="text-xs uppercase tracking-widest text-amber-700/80 dark:text-accent/80 mb-2 font-sans font-semibold">
                    {pageData?.ayahs && pageData.ayahs.length > 0 ? 
                      (() => {
                        const uniqueSurahs = Array.from(
                          new Set(pageData.ayahs.map((ayah: any) => ayah?.surah?.number).filter(Boolean))
                        ).map(surahNumber => {
                          const ayah = pageData.ayahs.find((a: any) => a?.surah?.number === surahNumber);
                          return ayah?.surah;
                        }).filter(Boolean);
                        
                        if (uniqueSurahs.length === 1) {
                          return `${uniqueSurahs[0].englishName} (${uniqueSurahs[0].englishNameTranslation})`;
                        } else if (uniqueSurahs.length > 1) {
                          return uniqueSurahs.map(surah => 
                            `${surah.englishName} (${surah.englishNameTranslation})`
                          ).join(' • ');
                        } else {
                          return 'Loading...';
                        }
                      })() : 
                      'Loading...'
                    }
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif-header">
                    {pageData?.number ? `Page ${pageData.number}` : 'Surah View'}
                  </h2>
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
          <div className="fixed bottom-6 right-4 md:right-6 z-40 flex items-center gap-1.5 bg-white dark:bg-[#1a1f28] border border-amber-200/50 dark:border-amber-800/30 rounded-full shadow-lg dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] px-1 py-1 animate-fade-in-up">
            {/* Count badge — click to see details */}
            <button
              onClick={() => setShowSelectedAyahsModal(true)}
              className="flex items-center gap-1.5 pl-3 pr-2 h-8 rounded-full hover:bg-amber-500/8 dark:hover:bg-amber-400/8 transition-colors group"
              title="View selected verses"
            >
              <span className="w-5 h-5 rounded-full bg-amber-500 dark:bg-amber-400 text-white dark:text-gray-950 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                {selectedAyahs.size}
              </span>
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 font-sans whitespace-nowrap group-hover:text-amber-600 dark:group-hover:text-accent transition-colors">
                {selectedAyahs.size === 1 ? 'verse' : 'verses'}
              </span>
            </button>

            <div className="w-px h-5 bg-amber-200/50 dark:bg-amber-800/40" />

            {/* Add for Review */}
            <button
              onClick={onAddRevision}
              className="h-8 px-3 rounded-full text-[11px] font-bold font-sans bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 text-white dark:text-gray-950 hover:opacity-90 transition-opacity whitespace-nowrap"
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
      </div>
    </main>
  );
} 