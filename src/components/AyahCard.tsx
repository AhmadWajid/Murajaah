'use client';

import { useState, useEffect } from 'react';
import { MistakeData } from '@/lib/supabase/database';
import { TajweedAyahText } from './TajweedAyahText';
import { TafsirContent } from './TafsirContent';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatAyahRange, formatAyahRangeArabic } from '@/lib/quran';

/** Strip tajweed <rule class="...">text</rule> tags from a string, keeping only the inner text. Handles nested tags. */
function stripRuleTags(text: string): string {
  if (!text) return text;
  const innermostRegex = /<rule[^>]*>([^<]*)<\/rule>/g;
  let result = text;
  let safetyCounter = 0;
  while (innermostRegex.test(result) && safetyCounter < 50) {
    safetyCounter++;
    result = result.replace(innermostRegex, '$1');
  }
  return result;
}

const VerseStarMedallion = ({ num, className }: { num: number; className?: string }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Rab el Hizb 8-pointed star */}
    <rect
      x="6"
      y="6"
      width="20"
      height="20"
      rx="1.5"
      transform="rotate(0 16 16)"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="currentColor"
      fillOpacity={0.03}
    />
    <rect
      x="6"
      y="6"
      width="20"
      height="20"
      rx="1.5"
      transform="rotate(45 16 16)"
      stroke="currentColor"
      strokeWidth="1.2"
      fill="currentColor"
      fillOpacity={0.03}
    />
    {/* Inner dashed ring for detail */}
    <circle
      cx="16"
      cy="16"
      r="7"
      stroke="currentColor"
      strokeWidth="0.75"
      strokeDasharray="1.5 1.5"
    />
    {/* Verse Number text */}
    <text
      x="16"
      y="19.5"
      textAnchor="middle"
      fontSize="9"
      fontWeight="bold"
      fill="currentColor"
      className="font-sans"
    >
      {num}
    </text>
  </svg>
);

interface AyahCardProps {
  ayah: any;
  index: number;
  pageData: any;
  isMemorization: boolean;
  status: string | null;
  isSelected: boolean;
  isInHighlightedRange: boolean;
  showTranslation: boolean;
  memorizationItems: any[];
  onAyahClick: (ayahNumber: number) => void;
  onPlayAudio: (surahNumber: number, ayahNumber: number) => void;
  onQuickReview: (surahNumber: number, ayahNumber: number, rating: 'easy' | 'medium' | 'hard') => void;
  onToggleReviewDropdown: (key: string | null) => void;
  openReviewDropdown: string | null;
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
  borderless?: boolean;
  layoutMode?: 'spread' | 'single';
}

export default function AyahCard({
  ayah,
  index,
  pageData,
  isMemorization,
  status,
  isSelected,
  isInHighlightedRange,
  showTranslation,
  memorizationItems,
  onAyahClick,
  onPlayAudio,
  onQuickReview,
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
  borderless = false,
  layoutMode = 'single',
}: AyahCardProps) {
  // Local state for immediate visual feedback
  const [localMistakeState, setLocalMistakeState] = useState<Record<string, boolean>>({});
  const [isMistakeLoading, setIsMistakeLoading] = useState(false);


  const [showReviewRatingDropdown, setShowReviewRatingDropdown] = useState(false);
  // Tafsir modal state
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirData, setTafsirData] = useState<any>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [loadingTafsir, setLoadingTafsir] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isOutsideReviewDropdown = !target.closest('[data-modal="review-rating"]');
      
      if (showReviewRatingDropdown && isOutsideReviewDropdown) {
        setShowReviewRatingDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReviewRatingDropdown]);
  
  const handleMistakeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMistakeLoading) return; // Prevent multiple clicks
    
    const newMistakeState = !hasMistake;
    
    // Immediately update local state for instant visual feedback
    setLocalMistakeState(prev => ({
      ...prev,
      [mistakeKey]: newMistakeState
    }));
    
    setIsMistakeLoading(true);
    
    try {
      // Call the actual toggle function
      if (onToggleMistake) {
        await onToggleMistake(surahNumber, ayahNumber);
      }
    } catch (error) {
      console.error('Error toggling mistake:', error);
      // Revert local state on error
      setLocalMistakeState(prev => ({
        ...prev,
        [mistakeKey]: !newMistakeState
      }));
    } finally {
      setIsMistakeLoading(false);
    }
  };

  const handleTafsirClick = async () => {
    setShowTafsir(true);
    await fetchTafsir();
  };

  // Add null checks for ayah data
  if (!ayah) {
    return (
      <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Loading ayah data...
        </div>
      </div>
    );
  }

  // Handle different data structures (page data vs surah data)
  const ayahNumber = ayah.numberInSurah;
  const surahNumber = ayah.surah?.number || pageData?.surah || 1;
  const surahName = ayah.surah?.englishName || 'Unknown Surah';
  const surahTranslation = ayah.surah?.englishNameTranslation || '';
  const numberOfAyahs = ayah.surah?.numberOfAyahs || 0;
  
  const getHighlightColor = (status: string | null) => {
    switch (status) {
      case 'overdue': return 'border-red-500 dark:border-red-400 bg-gradient-to-r from-red-500/5 to-transparent dark:from-red-500/10 dark:to-transparent shadow-[0_0_15px_-3px_rgba(239,68,68,0.12)]';
      case 'due-today': return 'border-orange-500 dark:border-orange-400 bg-gradient-to-r from-orange-500/5 to-transparent dark:from-orange-500/10 dark:to-transparent shadow-[0_0_15px_-3px_rgba(249,115,22,0.12)]';
      case 'due-soon': return 'border-amber-500 dark:border-amber-400 bg-gradient-to-r from-amber-500/5 to-transparent dark:from-amber-500/10 dark:to-transparent shadow-[0_0_15px_-3px_rgba(245,158,11,0.12)]';
      case 'upcoming': return 'border-emerald-500 dark:border-emerald-400 bg-gradient-to-r from-emerald-500/5 to-transparent dark:from-emerald-500/10 dark:to-transparent shadow-[0_0_15px_-3px_rgba(16,185,129,0.12)]';
      default: return '';
    }
  };

  const getCurrentRating = () => {
    if (!isMemorization) return null;
    
    const item = memorizationItems.find(item => 
      item.surah === surahNumber && 
      ayahNumber >= item.ayahStart && 
      ayahNumber <= item.ayahEnd
    );
    
    if (item?.individualRatings) {
      return item.individualRatings[ayahNumber];
    }
    
    return null;
  };

  const currentRating = getCurrentRating();
  
  const highlightClass = getHighlightColor(status);
  
  // Check if this is the first ayah of a surah (ayah number 1)
  const isFirstAyahOfSurah = ayahNumber === 1;

  // Check if this is the last ayah of a complete review (not just on this page)
  const isLastAyahOfCompleteReview = () => {
    if (!reviewsOnPage || !onReviewComplete) {
      return false;
    }
    
    return reviewsOnPage.some(review => {
      return review.surah === surahNumber && review.ayahEnd === ayahNumber;
    });
  };

  // Check if this ayah marks the end of a ruku
  const isEndOfRuku = () => {
    if (!pageData?.ayahs || index >= pageData.ayahs.length - 1) {
      return false;
    }
    
    const currentAyah = pageData.ayahs[index];
    const nextAyah = pageData.ayahs[index + 1];
    
    // If the next ayah has a different ruku number, this ayah ends a ruku
    return currentAyah.ruku !== nextAyah.ruku;
  };

  // Check if this ayah marks the start of a new ruku
  const isStartOfRuku = () => {
    if (!pageData?.ayahs || index === 0) {
      return false;
    }
    
    const currentAyah = pageData.ayahs[index];
    const previousAyah = pageData.ayahs[index - 1];
    
    // If the previous ayah has a different ruku number, this ayah starts a new ruku
    return currentAyah.ruku !== previousAyah.ruku;
  };

  // Check if this ayah is both end of one ruku and start of another
  const isRukuTransition = () => {
    return isEndOfRuku() && isStartOfRuku();
  };

  const getReviewItem = () => {
    if (!reviewsOnPage) return null;
    
    return reviewsOnPage.find(review => {
      return review.surah === surahNumber && 
             review.ayahEnd === ayahNumber; // Use the complete review end
    });
  };

  // Check if this ayah has been marked as a mistake
  const mistakeKey = `${surahNumber}:${ayahNumber}`;
  // Use local state for immediate feedback, fallback to props for initial state
  const hasMistake = localMistakeState[mistakeKey] !== undefined 
    ? localMistakeState[mistakeKey] 
    : (mistakes[mistakeKey] || false);
  const isMistakeHidden = hasMistake && hideMistakes;

  // Sync local state with props when mistakes change
  useEffect(() => {
    if (mistakes[mistakeKey] !== undefined) {
      setLocalMistakeState(prev => ({
        ...prev,
        [mistakeKey]: Boolean(mistakes[mistakeKey])
      }));
    }
  }, [mistakes, mistakeKey]);
  const isRevealed = revealedMistakes.has(mistakeKey);
  const shouldShowHidden = isMistakeHidden && !isRevealed;

  // Check if this is the first ayah of a surah (except Al-Fatiha and Al-Tawbah)
  const isFirstAyah = ayahNumber === 1 && surahNumber !== 1 && surahNumber !== 9;
  
  // Check if the text contains Bismillah (more flexible pattern)
  const bismillahPattern = /بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ/;
  const hasBismillah = isFirstAyah && ayah.text && bismillahPattern.test(ayah.text);
  
  // Alternative check - look for common Bismillah variations
  const hasBismillahAlt = isFirstAyah && ayah.text && (
    ayah.text.includes('بِسْمِ') || 
    ayah.text.includes('بسم الله') ||
    ayah.text.includes('الرحمن الرحيم')
  );
  
  const finalHasBismillah = hasBismillah || hasBismillahAlt;
  
  // More flexible Bismillah removal pattern - match any Bismillah variation
  const flexibleBismillahPattern = /^.*?بِسْمِ.*?ٱللَّهِ.*?ٱلرَّحْمَٰنِ.*?ٱلرَّحِيمِ\s*/;
  
  // Alternative pattern that's more flexible with Unicode variations
  const alternativeBismillahPattern = /^.*?بِسْمِ\s*ٱللَّهِ\s*ٱلرَّحْمَٰنِ\s*ٱلرَّحِيمِ\s*/;
  
  // Most flexible pattern that handles all Unicode variations
  const unicodeBismillahPattern = /^.*?بِسْمِ\s*[ٱا]للَّهِ\s*[ٱا]لرَّحْمَٰنِ\s*[ٱا]لرَّحِيمِ\s*/;
  
  // Function to remove Bismillah with multiple approaches
  const removeBismillah = (text: string): string => {
    // Try regex patterns first
    let cleaned = text.replace(unicodeBismillahPattern, '').trim();
    if (cleaned !== text) return cleaned;
    
    cleaned = text.replace(alternativeBismillahPattern, '').trim();
    if (cleaned !== text) return cleaned;
    
    cleaned = text.replace(flexibleBismillahPattern, '').trim();
    if (cleaned !== text) return cleaned;
    
    // If regex doesn't work, try string manipulation
    const bismillahVariations = [
      'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      'بِسْمِ اَللَّهِ اَلرَّحْمَٰنِ اَلرَّحِيمِ',
      'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      'بِسِمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ'
    ];
    
    for (const variation of bismillahVariations) {
      if (text.startsWith(variation)) {
        return text.substring(variation.length).trim();
      }
    }
    
    // Last resort: try to find where the actual ayah content starts
    // Look for common patterns that indicate the start of the actual ayah
    const ayahStartPatterns = [
      /لِإِيلَٰفِ/, // For Al-Quraish
      /إِنَّآ/, // For Al-Kawthar
      /قُلْ/, // For Al-Kafirun
      /أَلْهَٰكُمُ/, // For At-Takathur
    ];
    
    for (const pattern of ayahStartPatterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        return text.substring(match.index).trim();
      }
    }
    
    return text;
  };
  
  // Remove all console.log and debug statements from this file.
  

  


  // Fetch tafsir for this ayah
  const fetchTafsir = async () => {
    setLoadingTafsir(true);
    setTafsirData(null);
    try {
      const res = await fetch(`https://quranapi.pages.dev/api/tafsir/${surahNumber}_${ayahNumber}.json`);
      const data = await res.json();
      setTafsirData(data);
      setSelectedAuthor(data.tafsirs?.[0]?.author || null);
    } catch (e) {
      setTafsirData(null);
    }
    setLoadingTafsir(false);
  };

  // Mobile detection for tajweed color disabling and verse selection behavior
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

  const actionButtons = (
    <>
      <button 
        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-amber-700/80 hover:text-amber-900 dark:text-amber-300/80 dark:hover:text-accent bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 border border-amber-200/40 dark:border-amber-800/20 hover:border-amber-300 dark:hover:border-accent/40 rounded-full transition-all duration-350 hover:scale-105"
        onClick={(e) => {
          e.stopPropagation();
          onPlayAudio(surahNumber, ayahNumber);
        }}
        title="Play Audio"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      </button>

      {isLastAyahOfCompleteReview() && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReviewRatingDropdown(true);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-purple-700/80 hover:text-purple-900 dark:text-purple-400/80 dark:hover:text-purple-300 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-100/80 dark:hover:bg-purple-900/40 border border-purple-200/40 dark:border-purple-800/20 hover:border-purple-300 dark:hover:border-purple-500/40 rounded-full transition-all duration-350 hover:scale-105"
            title="Complete Review"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      )}
      
      {onToggleMistake && (
        <button 
          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border rounded-full transition-all duration-350 hover:scale-105 ${
            hasMistake 
              ? 'text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50/40 dark:bg-red-950/20 hover:bg-red-100/80 dark:hover:bg-red-900/40 border-red-200/40 dark:border-red-800/20 hover:border-red-300 dark:hover:border-red-500/40' 
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-50/40 dark:bg-gray-900/20 hover:bg-gray-100/80 dark:hover:bg-gray-800/40 border-gray-200/40 dark:border-gray-800/20 hover:border-gray-300 dark:hover:bg-gray-600'
          } ${isMistakeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleMistakeToggle}
          disabled={isMistakeLoading}
          title={hasMistake ? 'Remove mistake mark' : 'Mark as mistake'}
        >
          {isMistakeLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill={hasMistake ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
        </button>
      )}

      <button 
        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-amber-700/80 hover:text-amber-900 dark:text-amber-300/80 dark:hover:text-accent bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-900/40 border border-amber-200/40 dark:border-amber-800/20 hover:border-amber-300 dark:hover:border-accent/40 rounded-full transition-all duration-300 hover:scale-105"
        onClick={(e) => {
          e.stopPropagation();
          handleTafsirClick();
        }}
        title="View Tafsir"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4.5A2.5 2.5 0 016.5 7H20v13H6.5A2.5 2.5 0 014 17.5v-13z"></path>
        </svg>
      </button>
    </>
  );

  const arabicTextContainer = (
    <div className="text-right mb-4 sm:mb-6 px-1 sm:px-0 overflow-visible">
      {shouldShowHidden ? (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 text-lg mb-2 font-sans">
            [Hidden - Test your memory]
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRevealMistake?.(surahNumber, ayahNumber);
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline font-sans"
          >
            Click to reveal
          </button>
        </div>
      ) : (() => {
        const arabicText = ayah.text;
        if (!arabicText) {
          return (
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 italic mb-2 font-sans">
                Loading Arabic text... (Debug: {surahNumber}:{ayahNumber})
              </div>
              <div className="text-2xl text-gray-900 dark:text-white font-arabic" style={{ fontFamily: 'Amiri, serif', direction: 'rtl' }}>
                بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ (Test Arabic)
              </div>
            </div>
          );
        }
        
        if (isFirstAyah && surahNumber !== 1 && surahNumber !== 9) {
          let restOfAyah = '';
          if (surahNumber === 36) {
            const yaseenIndex = arabicText.indexOf('يسٓ');
            if (yaseenIndex !== -1) {
              restOfAyah = arabicText.substring(yaseenIndex);
            }
          } else {
            restOfAyah = removeBismillah(arabicText);
          }
          
          if (restOfAyah) {
            return (
              <TajweedAyahText
                ayahText={restOfAyah}
                surahNumber={surahNumber}
                ayahNumber={ayahNumber}
                fontSize={fontSize}
                arabicFontSize={arabicFontSize}
                translationFontSize={translationFontSize}
                fontTargetArabic={fontTargetArabic}
                pageNumber={ayah.page}
                hideWords={hideWords}
                hideWordsDelay={hideWordsDelay}
                wordByWordData={wordByWordData}
                showWordByWordTooltip={showWordByWordTooltip}
                disableTajweedColors={isMobile}
                isMobile={isMobile}
              />
            );
          } else {
            return '';
          }
        }
        
        return (
          <TajweedAyahText
            ayahText={arabicText}
            surahNumber={surahNumber}
            ayahNumber={ayahNumber}
            fontSize={fontSize}
            arabicFontSize={arabicFontSize}
            translationFontSize={translationFontSize}
            fontTargetArabic={fontTargetArabic}
            pageNumber={ayah.page}
            hideWords={hideWords}
            hideWordsDelay={hideWordsDelay}
            wordByWordData={wordByWordData}
            showWordByWordTooltip={showWordByWordTooltip}
            disableTajweedColors={isMobile}
            isMobile={isMobile}
          />
        );
      })()}
    </div>
  );

  const hasSajdah = !!ayah.sajdah || (surahNumber === 32 && ayahNumber === 15);

  return (
    <div key={ayah.number} className="relative">
      {/* Ornate Ruku and Sajdah Margin Medallions (Floating in right margin on desktop) */}
      {borderless && isStartOfRuku() && (
        <div className="hidden lg:flex absolute -right-14 top-6 items-center justify-center w-10 h-10 select-none pointer-events-auto z-20 group/ruku transition-all duration-300 hover:scale-110">
          <svg viewBox="0 0 36 36" fill="none" className="w-10 h-10 text-amber-500/80 dark:text-accent/80 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1" />
            <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const x = 18 + 14 * Math.cos(angle);
              const y = 18 + 14 * Math.sin(angle);
              return <circle key={i} cx={x} cy={y} r="0.75" fill="currentColor" />;
            })}
            <text x="18" y="21.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" className="font-serif">ع</text>
            <text x="18" y="29.5" textAnchor="middle" fontSize="7" fontWeight="extrabold" fill="currentColor" className="font-sans">{(ayah.ruku)}</text>
          </svg>
          <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-[9px] font-bold tracking-wider text-amber-800 dark:text-accent bg-[#FAF8F5]/95 dark:bg-[#12161A]/95 border border-amber-200/20 dark:border-border/20 px-2 py-0.5 rounded-md opacity-0 group-hover/ruku:opacity-100 transition-opacity font-sans whitespace-nowrap shadow-sm">Ruku' {ayah.ruku}</span>
        </div>
      )}

      {borderless && hasSajdah && (
        <div className="hidden lg:flex absolute -right-14 top-20 items-center justify-center w-10 h-10 select-none pointer-events-auto z-20 group/sajdah transition-all duration-300 hover:scale-110">
          <svg viewBox="0 0 36 36" fill="none" className="w-10 h-10 text-amber-500/80 dark:text-accent/80 drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
            <rect x="7" y="7" width="22" height="22" rx="2" transform="rotate(45 18 18)" stroke="currentColor" strokeWidth="1" />
            <circle cx="18" cy="18" r="9" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
            <path d="M14 21.5 C14 18.5, 22 18.5, 22 21.5 Z" fill="currentColor" fillOpacity={0.15} stroke="currentColor" strokeWidth="0.75" />
            <path d="M18 13.5 L18 17 M16.5 15 L19.5 15" stroke="currentColor" strokeWidth="0.75" />
          </svg>
          <span className="absolute -left-14 top-1/2 -translate-y-1/2 text-[9px] font-bold tracking-wider text-amber-800 dark:text-accent bg-[#FAF8F5]/95 dark:bg-[#12161A]/95 border border-amber-200/20 dark:border-border/20 px-2 py-0.5 rounded-md opacity-0 group-hover/sajdah:opacity-100 transition-opacity font-sans whitespace-nowrap shadow-sm">۩ Sajdah</span>
        </div>
      )}

      {/* Elegant Ruku Divider (Boxed mode only) */}
      {isRukuTransition() && !borderless && (
        <div className="my-10 flex items-center justify-center select-none w-full">
          <div className="flex-1 border-t border-double border-amber-500/25 dark:border-accent/20" />
          <div className="mx-6 relative z-10 px-5 py-2 border-2 border-double border-amber-500/35 dark:border-accent/25 rounded-2xl bg-[#FAF8F5] dark:bg-[#12161A] text-xs font-bold text-amber-800 dark:text-accent font-sans flex items-center gap-2 shadow-sm">
            <span className="text-amber-500/60 text-sm">۩</span>
            <span className="tracking-widest uppercase">Section (Ruku' {ayah.ruku - 1} → {ayah.ruku})</span>
            <span className="text-amber-500/60 text-sm">۩</span>
          </div>
          <div className="flex-1 border-t border-double border-amber-500/25 dark:border-accent/20" />
        </div>
      )}

      {/* Elegant Ruku Start Divider (Boxed mode only) */}
      {isStartOfRuku() && !isRukuTransition() && !borderless && (
        <div className="my-10 flex items-center justify-center select-none w-full">
          <div className="flex-1 border-t border-dashed border-amber-500/20 dark:border-accent/15" />
          <div className="mx-6 relative z-10 px-5 py-1.5 border border-amber-500/25 dark:border-accent/20 rounded-2xl bg-[#FAF8F5] dark:bg-[#12161A] text-xs font-bold text-amber-800 dark:text-accent font-sans flex items-center gap-1.5">
            <span className="text-amber-500/50">✥</span>
            <span className="tracking-wider uppercase">Ruku' {ayah.ruku} Start</span>
            <span className="text-amber-500/50">✥</span>
          </div>
          <div className="flex-1 border-t border-dashed border-amber-500/20 dark:border-accent/15" />
        </div>
      )}

      {/* Surah Header Card (Boxed mode) */}
      {isFirstAyahOfSurah && !borderless && (
        <div className="mb-8 p-8 relative overflow-hidden bg-gradient-to-b from-[#FAF8F3] to-[#F3F0E6] dark:from-[#181D23] dark:to-[#12161A] rounded-3xl border border-amber-200/40 dark:border-amber-900/30 shadow-[0_4px_30px_-5px_rgba(0,0,0,0.02)] text-center animate-fade-in-up">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--accent) 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
          <div className="relative z-10">
            <span className="text-xs font-semibold text-amber-700/80 dark:text-accent/80 tracking-wider uppercase font-sans block mb-1">Surah</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-serif-header mb-1.5 drop-shadow-sm">
              {surahName}
            </h2>
            <div className="text-sm font-sans text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 flex-wrap">
              <span>{surahTranslation}</span>
              <span className="text-amber-400 dark:text-accent/60">•</span>
              <span>Chapter {surahNumber}</span>
              <span className="text-amber-400 dark:text-accent/60">•</span>
              <span>{numberOfAyahs} Verses</span>
            </div>
            
            {finalHasBismillah && (
              <div className="mt-8 border-t border-amber-200/20 dark:border-amber-900/10 pt-6">
                <div 
                  className="leading-relaxed text-amber-950 dark:text-white font-arabic text-center py-2"
                  style={{ 
                    fontFamily: 'Amiri, serif', 
                    direction: 'rtl', 
                    fontSize: `${arabicFontSize * 1.25}px`,
                    lineHeight: '2'
                  }}
                >
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-sans mt-2 italic">
                  In the name of Allah, the Most Gracious, the Most Merciful
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimalist Surah Header (Borderless mode) */}
      {isFirstAyahOfSurah && borderless && (
        <div className="mt-14 mb-10 text-center select-none animate-fade-in-up relative z-10">
          <span className="text-[10px] font-bold text-amber-700/80 dark:text-accent/80 tracking-widest uppercase font-sans block mb-1">Surah</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-serif-header text-gray-900 dark:text-white mb-2 drop-shadow-sm">
            {surahName}
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-sans flex items-center justify-center gap-2 flex-wrap">
            <span>{surahTranslation}</span>
            <span className="text-amber-400 dark:text-accent/50">•</span>
            <span>Chapter {surahNumber}</span>
            <span className="text-amber-400 dark:text-accent/50">•</span>
            <span>{numberOfAyahs} Verses</span>
          </div>
          {finalHasBismillah && (
            <div className="mt-8 mb-6 py-2 leading-relaxed text-amber-950 dark:text-white font-arabic text-3xl text-center" style={{ fontFamily: 'Amiri, serif', direction: 'rtl' }}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>
          )}
          <div className="w-20 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/25 dark:via-accent/20 to-transparent mx-auto mt-6" />
        </div>
      )}
      
      {/* Ayah Content Card/Container */}
      <div
        id={`ayah-${surahNumber}-${ayahNumber}`}
        data-ayah={ayahNumber}
        className={`relative group rounded-2xl transition-all duration-300 ${
          isMobile ? 'cursor-default' : 'cursor-pointer'
        } ${
          borderless 
            ? 'border-0 bg-transparent shadow-none p-4 sm:p-5 lg:px-6 lg:py-8 border-b border-dashed border-amber-200/20 dark:border-border/10 overflow-hidden' 
            : 'border border-border/60 bg-white/80 dark:bg-[#12161A]/85 backdrop-blur-md p-4 sm:p-5 lg:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.2)]'
        } ${
          isMemorization ? `border-l-4 ${highlightClass}` : ''
        } ${
          isSelected 
            ? (borderless 
                ? 'bg-amber-500/5 dark:bg-accent/5 shadow-inner' 
                : 'border-amber-500/80 dark:border-accent bg-gradient-to-r from-amber-500/5 to-amber-500/2 dark:from-accent/5 dark:to-transparent shadow-[0_0_20px_rgba(212,175,55,0.12)]')
            : ''
        } ${
          isInHighlightedRange 
            ? (borderless 
                ? 'bg-purple-500/5 dark:bg-purple-500/5 shadow-inner'
                : 'border-purple-500/80 dark:border-purple-500/80 bg-gradient-to-r from-purple-500/5 to-purple-500/2 dark:from-purple-500/10 dark:to-transparent shadow-[0_0_20px_rgba(167,139,250,0.12)]')
            : ''
        } ${
          !isSelected && !isInHighlightedRange && !isMobile 
            ? 'hover:bg-gradient-to-r hover:from-amber-500/3 hover:to-transparent dark:hover:from-accent/4 dark:hover:to-transparent' 
            : ''
        }`}
        style={borderless ? {} : { paddingLeft: `${padding}px`, paddingRight: `${padding}px`, paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
        onClick={!isMobile ? () => onAyahClick(ayahNumber) : undefined}
      >
        {borderless && (
          <>
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-amber-500/[0.03] via-amber-500/[0.005] to-transparent dark:from-accent/[0.05] dark:via-accent/[0.01] to-transparent z-0" />
          </>
        )}

        <div className="relative z-10 w-full">
          {/* Backdrop Watermark for Stacked mode - placed on the left to avoid Arabic script */}
          {borderless && (
            <div className="absolute left-4 top-2 pointer-events-none select-none text-[7rem] font-serif-header font-extrabold text-amber-500/[0.015] dark:text-accent/[0.01] transition-all duration-500 group-hover:text-amber-500/[0.04] dark:group-hover:text-accent/[0.03]">
              {String(ayahNumber).padStart(2, '0')}
            </div>
          )}

          {/* Header row: badge and actions */}
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center space-x-2">
                {borderless ? (
                  <VerseStarMedallion num={ayahNumber} className="w-8 h-8 text-amber-500/85 dark:text-accent/80 flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-400 dark:to-accent rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white dark:text-gray-950 font-bold text-xs sm:text-sm">
                      {ayahNumber}
                    </span>
                  </div>
                )}
                <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-accent font-sans">
                  {surahNumber}:{ayahNumber}
                </span>
              </div>
              {isInHighlightedRange && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-sm font-sans">
                  Review
                </span>
              )}
              {currentRating && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full shadow-sm font-sans ${
                  currentRating === 'easy' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
                  currentRating === 'medium' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                  'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                }`}>
                  {currentRating.charAt(0).toUpperCase() + currentRating.slice(1)}
                </span>
              )}
              {hasSajdah && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-accent border border-amber-500/20 rounded-md font-sans flex items-center gap-1">
                  ۩ Sajdah
                </span>
              )}
            </div>
            
            {/* Actions toolbar */}
            <div className={`flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 ${borderless ? 'lg:opacity-0 lg:translate-y-1 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-300' : ''}`}>
              {actionButtons}
            </div>
          </div>

          {/* Arabic Script */}
          {arabicTextContainer}

          {/* English Translation */}
          {showTranslation && !shouldShowHidden && (
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed border-t border-amber-200/20 dark:border-border/30 pt-4 mt-4 text-left">
              <div 
                className="translation-text text-gray-700 dark:text-gray-300"
                style={{ 
                  '--custom-font-size': `${translationFontSize}px`,
                  fontSize: `${translationFontSize}px !important`,
                  lineHeight: '1.75',
                  fontWeight: 'normal'
                } as React.CSSProperties}
              >
                {(() => {
                  if (isFirstAyah && finalHasBismillah) {
                    const translationText = stripRuleTags(ayah.translation || ayah.text || '');
                    const restOfTranslation = translationText.replace(/In the name of Allah, the Most Gracious, the Most Merciful/gi, '').trim();
                    return restOfTranslation || '';
                  }
                  return stripRuleTags(ayah.translation || ayah.text || '');
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Rating Modal - positioned outside card for proper overlay */}
      {showReviewRatingDropdown && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] shadow-2xl border flex flex-col" data-modal="review-rating">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Complete Review
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {formatAyahRange((() => {
                    const reviewItem = getReviewItem();
                    return reviewItem ? reviewItem.surah : surahNumber;
                  })(), (() => {
                    const reviewItem = getReviewItem();
                    return reviewItem ? reviewItem.ayahStart : ayahNumber;
                  })(), (() => {
                    const reviewItem = getReviewItem();
                    return reviewItem ? reviewItem.ayahEnd : ayahNumber;
                  })())}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatAyahRangeArabic((() => {
                    const reviewItem = getReviewItem();
                    return reviewItem ? reviewItem.surah : surahNumber;
                  })(), (() => {
                    const reviewItem = getReviewItem();
                    return reviewItem ? reviewItem.ayahStart : ayahNumber;
                  })(), (() => {
                    const reviewItem = getReviewItem();
                    return reviewItem ? reviewItem.ayahEnd : ayahNumber;
                  })())}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReviewRatingDropdown(false)}
                className="h-8 w-8 p-0"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Review Item Info */}
              {(() => {
                const reviewItem = getReviewItem();
                if (reviewItem) {
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                        <span>Reviews: {reviewItem.reviewCount}</span>
                        <span>Interval: {reviewItem.interval}d</span>
                      </div>
                      {reviewItem.name && (
                        <div className="text-center text-sm text-muted-foreground">
                          {reviewItem.name}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Rating Selection */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-2">How well did you recall this passage?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select your recall quality to schedule the next review interval.
                  </p>
                </div>
                {(() => {
                  const reviewItem = getReviewItem();
                  if (!reviewItem) return null;
                  
                  // Calculate the current memorization age by adding days passed since creation
                  let currentMemorizationAge: number;
                  let daysPassedSinceCreation: number;
                  const originalMemorizationAge: number | undefined = reviewItem.memorizationAge;
                  
                  if (reviewItem.memorizationAge !== undefined) {
                    // Calculate days passed since the item was added to the app
                    const createdAt = new Date(reviewItem.createdAt);
                    const today = new Date();
                    daysPassedSinceCreation = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Current memorization age = original memorization age + days passed since creation
                    currentMemorizationAge = reviewItem.memorizationAge + daysPassedSinceCreation;
                  } else {
                    // Fallback to calculating from createdAt (for existing items without memorizationAge)
                    const createdAt = new Date(reviewItem.createdAt);
                    const today = new Date();
                    daysPassedSinceCreation = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                    currentMemorizationAge = daysPassedSinceCreation;
                  }
                  
                  // Define intervals based on memorization age
                  let easyInterval: number;
                  let mediumInterval: number;
                  let hardInterval: number;
                  
                  if (currentMemorizationAge < 10) {
                    easyInterval = 1;
                    mediumInterval = 1;
                    hardInterval = 1;
                  } else if (currentMemorizationAge < 180) {
                    easyInterval = 4;
                    mediumInterval = 2;
                    hardInterval = 1;
                  } else {
                    easyInterval = 7;
                    mediumInterval = 4;
                    hardInterval = 1;
                  }
                  
                  return (
                    <div className="space-y-4">
                      <div className="space-y-2">
                      <Button
                        onClick={() => {
                          if (reviewItem) {
                            onReviewComplete?.({ ...reviewItem, rating: 'easy' });
                          }
                          setShowReviewRatingDropdown(false);
                        }}
                        variant="outline"
                        className="w-full justify-between h-auto p-4 text-left"
                      >
                        <div>
                          <div className="font-medium">Easy</div>
                          <div className="text-sm text-muted-foreground">Perfect recall, no mistakes</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {easyInterval} day{easyInterval !== 1 ? 's' : ''}
                        </Badge>
                      </Button>
                      <Button
                        onClick={() => {
                          if (reviewItem) {
                            onReviewComplete?.({ ...reviewItem, rating: 'medium' });
                          }
                          setShowReviewRatingDropdown(false);
                        }}
                        variant="outline"
                        className="w-full justify-between h-auto p-4 text-left"
                      >
                        <div>
                          <div className="font-medium">Medium</div>
                          <div className="text-sm text-muted-foreground">Good recall with minor hesitation</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {mediumInterval} day{mediumInterval !== 1 ? 's' : ''}
                        </Badge>
                      </Button>
                      <Button
                        onClick={() => {
                          if (reviewItem) {
                            onReviewComplete?.({ ...reviewItem, rating: 'hard' });
                          }
                          setShowReviewRatingDropdown(false);
                        }}
                        variant="outline"
                        className="w-full justify-between h-auto p-4 text-left"
                      >
                        <div>
                          <div className="font-medium">Hard</div>
                          <div className="text-sm text-muted-foreground">Difficult recall, needed help</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          1 day
                        </Badge>
                      </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* Tafsir Modal */}
      {showTafsir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-2 py-4">
          <div className="bg-[#FAF8F5] dark:bg-[#12161A] rounded-2xl shadow-2xl relative flex flex-col w-full max-w-4xl h-[85vh] border border-amber-200/30 dark:border-border/30 overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-amber-200/20 dark:border-border/20 flex-shrink-0 bg-white/50 dark:bg-[#181D23]/50 backdrop-blur-md">
              <div>
                <span className="text-xs font-semibold text-amber-700/80 dark:text-accent/80 tracking-wider uppercase font-sans">Quran Commentary</span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif-header mt-0.5">
                  Tafsir for Verse {tafsirData?.surahName || surahName} ({surahNumber}:{tafsirData?.ayahNo || ayahNumber})
                </h2>
              </div>
              <button 
                className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200" 
                onClick={() => setShowTafsir(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-6">
              {loadingTafsir ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-200 border-t-amber-600 dark:border-gray-800 dark:border-t-accent mx-auto mb-3"></div>
                    <p className="text-sm font-medium text-amber-800 dark:text-accent font-sans">Retrieving tafsir commentary...</p>
                  </div>
                </div>
              ) : tafsirData && tafsirData.tafsirs && tafsirData.tafsirs.length > 0 ? (
                <div className="h-full flex flex-col">
                  {/* Author Selector */}
                  <div className="mb-4 flex-shrink-0">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase font-sans tracking-wide block mb-1.5">Commentary Source</label>
                    <select
                      className="w-full border border-amber-200/60 dark:border-[#2C3440] rounded-xl p-3 bg-white dark:bg-[#181D23] dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm font-sans transition-all"
                      value={selectedAuthor || ''}
                      onChange={e => setSelectedAuthor(e.target.value)}
                    >
                      {tafsirData.tafsirs.map((t: any) => (
                        <option key={t.author} value={t.author}>{t.author}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tafsir Content */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="prose prose-amber dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-[15px] sm:text-[16px] pb-6">
                      <TafsirContent 
                        content={tafsirData.tafsirs.find((t: any) => t.author === selectedAuthor)?.content || ''} 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-600 dark:text-gray-400 font-sans">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-medium text-sm">No Commentary Found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">There is no translation or tafsir entry loaded for this specific verse.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 