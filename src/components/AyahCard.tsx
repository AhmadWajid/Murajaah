'use client';

import { useState, useEffect } from 'react';
import { MistakeData } from '@/lib/storage';
import { TajweedAyahText } from './TajweedAyahText';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatAyahRange, formatAyahRangeArabic } from '@/lib/quran';

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
}: AyahCardProps) {
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
      case 'overdue': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'due-today': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'due-soon': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'upcoming': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
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
  const hasMistake = mistakes[mistakeKey] || false;
  const isMistakeHidden = hasMistake && hideMistakes;
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

  // Mobile detection for tajweed color disabling
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth <= 640);
    }
  }, []);

  return (
    <div key={ayah.number}>
      {/* Ruku Transition Indicator (when both end and start) */}
      {isRukuTransition() && (
        <div className="mb-4 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-indigo-300 dark:border-indigo-600 shadow-md">
          <div className="text-center">
            <div className="text-sm font-bold text-indigo-800 dark:text-indigo-200">
              Ruku {ayah.ruku - 1} → Ruku {ayah.ruku}
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400">
              Section transition
            </div>
          </div>
        </div>
      )}

      {/* Ruku Start Indicator (only when not a transition) */}
      {isStartOfRuku() && !isRukuTransition() && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border-2 border-purple-300 dark:border-purple-600 shadow-md">
          <div className="text-center">
            <div className="text-sm font-bold text-purple-800 dark:text-purple-200">
              Ruku {ayah.ruku} Start
            </div>
          </div>
        </div>
      )}

      {/* Surah Header */}
      {isFirstAyahOfSurah && (
        <div className="mb-6 p-6 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl border-2 border-amber-300 dark:border-amber-600 shadow-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-1">
              {surahName}
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400 mb-4">
              {surahTranslation} • Surah {surahNumber} • {numberOfAyahs} ayahs
            </div>
            {/* Display Bismillah after surah title for first ayah */}
            {finalHasBismillah && (
              <div>
                <div 
                  className="leading-relaxed text-amber-800 dark:text-amber-200 font-arabic"
                  style={{ 
                    fontFamily: 'Amiri, serif', 
                    direction: 'rtl', 
                    fontSize: `${arabicFontSize * 1.2}px`,
                    lineHeight: '2'
                  }}
                >
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </div>
                <div className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  In the name of Allah, the Most Gracious, the Most Merciful
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Ayah Content */}
      <div
        id={`ayah-${surahNumber}-${ayahNumber}`}
        data-ayah={ayahNumber}
        className={`rounded-2xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md p-3 sm:p-4 lg:p-6 ${
          isMemorization ? `border-l-4 ${highlightClass}` : ''
        } ${isSelected ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-300 dark:border-blue-600 shadow-lg' : ''} ${
          isInHighlightedRange ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-600 shadow-xl' : ''
        } ${!isSelected && !isInHighlightedRange ? 'hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-900/10 dark:hover:to-orange-900/10' : ''} bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm`}
        style={{ padding }}
        onClick={() => onAyahClick(ayahNumber)}
      >
        {/* Ayah Number */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs sm:text-sm">
                  {ayahNumber}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300">
                {surahNumber}:{ayahNumber}
              </span>
            </div>
            {isInHighlightedRange && (
              <span className="px-2 sm:px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-sm">
                Review
              </span>
            )}
            {currentRating && (
              <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full shadow-sm ${
                currentRating === 'easy' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                currentRating === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                'bg-gradient-to-r from-red-500 to-pink-500 text-white'
              }`}>
                {currentRating.charAt(0).toUpperCase() + currentRating.slice(1)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
            <button 
              className="p-1.5 sm:p-2 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onPlayAudio(surahNumber, ayahNumber);
              }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>

            {/* Review Complete Icon */}
            {isLastAyahOfCompleteReview() && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReviewRatingDropdown(true);
                  }}
                  className="p-1.5 sm:p-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-all duration-200"
                  title="Complete Review"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            )}
            

            
            {/* Mistake Toggle Button */}
            {onToggleMistake && (
              <button 
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                  hasMistake 
                    ? 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30' 
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMistake(surahNumber, ayahNumber);
                }}
                title={hasMistake ? 'Remove mistake mark' : 'Mark as mistake'}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill={hasMistake ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </button>
            )}

            {/* Tafsir Button */}
            <button 
              className="p-1.5 sm:p-2 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation();
                handleTafsirClick();
              }}
              title="View Tafsir"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19.5A2.5 2.5 0 016.5 17H20"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4.5A2.5 2.5 0 016.5 7H20v13H6.5A2.5 2.5 0 014 17.5v-13z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Arabic Text */}
        <div className="text-right mb-4 sm:mb-6 px-1 sm:px-0">
          {shouldShowHidden ? (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">
                [Hidden - Test your memory]
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRevealMistake?.(surahNumber, ayahNumber);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
              >
                Click to reveal
              </button>
            </div>
          ) : (() => {
            // Arabic text is now directly in ayah.text
            const arabicText = ayah.text;
            if (!arabicText) {
              return (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
                    Loading Arabic text... (Debug: {surahNumber}:{ayahNumber})
                  </div>
                  <div className="text-2xl text-gray-900 dark:text-white font-arabic" style={{ fontFamily: 'Amiri, serif', direction: 'rtl' }}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ (Test Arabic)
                  </div>
                </div>
              );
            }
            
                        if (isFirstAyah && surahNumber !== 1 && surahNumber !== 9) {
              // For Surah Ya-Sin, extract just the verse content after Bismillah
              let restOfAyah = '';
              
              if (surahNumber === 36) {
                // For Ya-Sin, look for "يسٓ" and take everything from there
                const yaseenIndex = arabicText.indexOf('يسٓ');
                if (yaseenIndex !== -1) {
                  restOfAyah = arabicText.substring(yaseenIndex);
                }
              } else {
                // For other surahs, use the robust Bismillah removal function
                restOfAyah = removeBismillah(arabicText);
              }
              
              // Only display the rest of the ayah (without Bismillah)
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
                  />
                );
              } else {
                // If there's no rest of ayah, return empty
                return '';
              }
            }
            
            // For all other ayahs, show the full text with tajweed
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
              />
            );
          })()}
        </div>

        {/* English Translation (if enabled) */}
        {showTranslation && !shouldShowHidden && (
          <div className="text-amber-700 dark:text-amber-300 leading-relaxed border-t border-amber-200 dark:border-amber-700 pt-6">

            <div 
              className="translation-text"
              style={{ 
                '--custom-font-size': `${translationFontSize}px`,
                fontSize: `${translationFontSize}px !important`,
                lineHeight: '1.6',
                fontWeight: 'normal'
              } as React.CSSProperties}
            >
              {(() => {
                // For first ayah with Bismillah, show only the translation of the rest
                if (isFirstAyah && finalHasBismillah) {
                  const translationText = ayah.translation || ayah.text || '';
                  const restOfTranslation = translationText.replace(/In the name of Allah, the Most Gracious, the Most Merciful/gi, '').trim();
                  return restOfTranslation || '';
                }
                return ayah.translation || ayah.text;
              })()}
            </div>
          </div>
        )}

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
                  let daysSinceCreation: number;
                  const debugMemorizationAge: number | undefined = reviewItem.memorizationAge;
                  
                  if (reviewItem.memorizationAge !== undefined) {
                    // Calculate days passed since the item was added to the app
                    const createdAt = new Date(reviewItem.createdAt);
                    const today = new Date();
                    const daysPassedSinceCreation = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Current memorization age = original memorization age + days passed since creation
                    daysSinceCreation = reviewItem.memorizationAge + daysPassedSinceCreation;
                  } else {
                    // Fallback to calculating from createdAt (for existing items without memorizationAge)
                    const createdAt = new Date(reviewItem.createdAt);
                    const today = new Date();
                    daysSinceCreation = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                  }

                  // Debug output
                  return (
                    <div className="mb-2 text-xs text-gray-400">
                      memorizationAge: {String(debugMemorizationAge)} | daysSinceCreation: {String(daysSinceCreation)}
                    </div>
                  );
                })()}
                {(() => {
                  const reviewItem = getReviewItem();
                  if (!reviewItem) return null;
                  
                  // Calculate the current memorization age by adding days passed since creation
                  let daysSinceCreation: number;
                  
                  if (reviewItem.memorizationAge !== undefined) {
                    // Calculate days passed since the item was added to the app
                    const createdAt = new Date(reviewItem.createdAt);
                    const today = new Date();
                    const daysPassedSinceCreation = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Current memorization age = original memorization age + days passed since creation
                    daysSinceCreation = reviewItem.memorizationAge + daysPassedSinceCreation;
                  } else {
                    // Fallback to calculating from createdAt (for existing items without memorizationAge)
                    const createdAt = new Date(reviewItem.createdAt);
                    const today = new Date();
                    daysSinceCreation = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                  }
                  
                  // Define intervals based on memorization age
                  let easyInterval: number;
                  let mediumInterval: number;
                  let hardInterval: number;
                  
                  if (daysSinceCreation < 10) {
                    easyInterval = 1;
                    mediumInterval = 1;
                    hardInterval = 1;
                  } else if (daysSinceCreation < 180) {
                    easyInterval = 4;
                    mediumInterval = 2;
                    hardInterval = 1;
                  } else {
                    easyInterval = 7;
                    mediumInterval = 4;
                    hardInterval = 1;
                  }
                  
                  return (
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
                  );
                })()}
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* Tafsir Modal */}
      {showTafsir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 w-full max-w-md sm:max-w-lg shadow-lg relative flex flex-col">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" onClick={() => setShowTafsir(false)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-bold mb-3 text-center">Tafsir for {tafsirData?.surahName || surahNumber}:{tafsirData?.ayahNo || ayahNumber}</h2>
            {loadingTafsir ? (
              <div className="py-8 text-center">Loading...</div>
            ) : tafsirData && tafsirData.tafsirs && tafsirData.tafsirs.length > 0 ? (
              <>
                <select
                  className="mb-3 w-full border rounded p-2 dark:bg-gray-800 dark:text-white"
                  value={selectedAuthor || ''}
                  onChange={e => setSelectedAuthor(e.target.value)}
                >
                  {tafsirData.tafsirs.map((t: any) => (
                    <option key={t.author} value={t.author}>{t.author}</option>
                  ))}
                </select>
                <div className="prose max-w-none dark:prose-invert overflow-y-auto max-h-[60vh] p-3 border rounded bg-gray-50 dark:bg-gray-800 text-sm sm:text-base">
                  <ReactMarkdown>
                    {tafsirData.tafsirs.find((t: any) => t.author === selectedAuthor)?.content || ''}
                  </ReactMarkdown>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">No tafsir found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 