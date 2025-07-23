'use client';

import { useState } from 'react';
import AyahCard from './AyahCard';
import { MistakeData } from '@/lib/storage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import SelectedAyahsModal from './SelectedAyahsModal';

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
  padding?: number;
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
  padding = 16,
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
}: QuranContentProps) {
  const [showSelectedAyahsModal, setShowSelectedAyahsModal] = useState(false);
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 translation-loading">
      <div className="max-w-7xl mx-auto px-2 sm:px-0">
        {layoutMode === 'spread' ? (
          /* Two-Page Spread Layout - RTL Order */
          <div className="flex gap-2 sm:gap-6 p-2 sm:p-6">
            {/* Left Page (Current Page) */}
            <Card className="flex-1 min-h-screen shadow-lg border-0">
              <div className="p-3 sm:p-6 lg:p-8">
                {/* Page Header */}
                <div className="text-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Page {currentPage}
                  </h2>
                </div>

                {/* Current Page Content */}
                <div className="space-y-6">
                  {pageData?.ayahs ? (
                    pageData.ayahs.map((ayah: any, index: number) => {
                      const surahNumber = ayah.surah?.number || 1;
                      const ayahNumber = ayah.numberInSurah;
                      
                      // Check if this is the first ayah of a surah (except Al-Tawbah)
                      const isFirstAyah = ayahNumber === 1 && surahNumber !== 9;
                      
                      // Check if the ayah text contains Bismillah (more flexible pattern)
                      const bismillahPattern = /بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ/;
                      const hasBismillah = isFirstAyah && bismillahPattern.test(ayah.text);
                      
                      // Alternative check - look for common Bismillah variations
                      const hasBismillahAlt = isFirstAyah && ayah.text && (
                        ayah.text.includes('بِسْمِ') || 
                        ayah.text.includes('بسم الله') ||
                        ayah.text.includes('الرحمن الرحيم')
                      );
                      
                      const finalHasBismillah = hasBismillah || hasBismillahAlt;
                      
                      return (
                        <div key={ayah.number}>
                          
                          <AyahCard
                            ayah={ayah}
                            index={index}
                            pageData={pageData}
                            arabicTexts={arabicTexts}
                            isMemorization={isAyahInMemorization(surahNumber, ayahNumber)}
                            status={getMemorizationStatus(surahNumber, ayahNumber)}
                            isSelected={Array.from(selectedAyahs).some(sel => sel.surah === surahNumber && sel.ayah === ayahNumber)}
                            isInHighlightedRange={(() => {
                              // Check if this ayah is in the highlighted range OR if it's part of a review on this page
                              const isInHighlightedRange = !!(highlightedRange && 
                                highlightedRange.surah === surahNumber && 
                                ayahNumber >= highlightedRange.start && 
                                ayahNumber <= highlightedRange.end);
                              
                              // Also check if this ayah is part of any review on the current page
                              const isInReviewOnPage = reviewsOnPage?.some(review => 
                                review.surah === surahNumber && 
                                ayahNumber >= review.ayahStart && 
                                ayahNumber <= review.ayahEnd
                              ) || false;
                              
                              // Combine both conditions for highlighting
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
                            padding={padding}
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
              <Card className="flex-1 min-h-screen shadow-lg border-0">
                <div className="p-3 sm:p-6 lg:p-8">
                  {/* Page Header */}
                  <div className="text-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                      {previousPageData ? 
                        (() => {
                          const uniqueSurahs = Array.from(
                            new Set(previousPageData.ayahs.map((ayah: any) => ayah.surah.number))
                          ).map(surahNumber => {
                            const ayah = previousPageData.ayahs.find((a: any) => a.surah.number === surahNumber);
                            return ayah.surah;
                          });
                          
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Page {previousPageData?.number || (currentPage === 1 ? currentPage + 1 : currentPage - 1)}
                    </h2>
                  </div>

                  {/* Previous Page Content */}
                  <div className="space-y-6">
                    {previousPageData?.ayahs ? (
                      previousPageData.ayahs.map((ayah: any, index: number) => {
                        const surahNumber = ayah.surah?.number || 1;
                        const ayahNumber = ayah.numberInSurah;
                        const isMemorization = isAyahInMemorization(surahNumber, ayahNumber);
                        const status = getMemorizationStatus(surahNumber, ayahNumber);
                        const isSelected = Array.from(selectedAyahs).some(sel => sel.surah === surahNumber && sel.ayah === ayahNumber);
                        
                        // Check if this ayah is in the highlighted range OR if it's part of a review on this page
                        const isInHighlightedRange = !!(highlightedRange && 
                          highlightedRange.surah === surahNumber && 
                          ayahNumber >= highlightedRange.start && 
                          ayahNumber <= highlightedRange.end);
                        
                        // Also check if this ayah is part of any review on the current page
                        const isInReviewOnPage = reviewsOnPage?.some(review => 
                          review.surah === surahNumber && 
                          ayahNumber >= review.ayahStart && 
                          ayahNumber <= review.ayahEnd
                        ) || false;
                        
                        // Combine both conditions for highlighting
                        const shouldHighlight = isInHighlightedRange || isInReviewOnPage;

                        // Find ALL memorization items that overlap with this ayah
                        const overlappingMemorizationItems = memorizationItems.filter(item => 
                          item.surah === surahNumber && 
                          ayahNumber >= item.ayahStart && 
                          ayahNumber <= item.ayahEnd
                        );

                        return (
                          <AyahCard
                            key={ayah.number}
                            ayah={ayah}
                            index={index}
                            pageData={previousPageData}
                            arabicTexts={previousArabicTexts}
                            isMemorization={isMemorization}
                            status={status}
                            isSelected={isSelected}
                            isInHighlightedRange={shouldHighlight}
                            showTranslation={showTranslation} // Show translation based on user preference
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
                            padding={padding}
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
          <Card className="min-h-screen mx-0 my-0 border-0 shadow-none rounded-none bg-transparent p-0
            sm:mx-6 sm:my-6 sm:shadow-lg sm:rounded-xl sm:bg-card sm:text-card-foreground sm:border-0 sm:p-0">
            <div className="p-3 sm:p-6 lg:p-8">
              {/* Page Header */}
              <div className="text-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {pageData?.number ? `Page ${pageData.number}` : 'Surah View'}
                </h2>
              </div>

              {/* Single Page Content */}
              <div className="space-y-6">
                {pageData?.ayahs ? (
                  pageData.ayahs.map((ayah: any, index: number) => {
                    const surahNumber = ayah.surah?.number || 1;
                    const ayahNumber = ayah.numberInSurah;
                    
                    // Check if this is the first ayah of a surah (except Al-Tawbah)
                    const isFirstAyah = ayahNumber === 1 && surahNumber !== 9;
                    
                                            // Check if the ayah text contains Bismillah (more flexible pattern)
                        const bismillahPattern = /بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ/;
                        const hasBismillah = isFirstAyah && bismillahPattern.test(ayah.text);
                        
                        // Alternative check - look for common Bismillah variations
                        const hasBismillahAlt = isFirstAyah && ayah.text && (
                          ayah.text.includes('بِسْمِ') || 
                          ayah.text.includes('بسم الله') ||
                          ayah.text.includes('الرحمن الرحيم')
                        );
                        
                        const finalHasBismillah = hasBismillah || hasBismillahAlt;
                    
                    return (
                      <div key={ayah.number}>
                        
                        <AyahCard
                          ayah={ayah}
                          index={index}
                          pageData={pageData}
                          arabicTexts={arabicTexts}
                          isMemorization={isAyahInMemorization(surahNumber, ayahNumber)}
                          status={getMemorizationStatus(surahNumber, ayahNumber)}
                          isSelected={Array.from(selectedAyahs).some(sel => sel.surah === surahNumber && sel.ayah === ayahNumber)}
                          isInHighlightedRange={(() => {
                            // Check if this ayah is in the highlighted range OR if it's part of a review on this page
                            const isInHighlightedRange = !!(highlightedRange && 
                              highlightedRange.surah === surahNumber && 
                              ayahNumber >= highlightedRange.start && 
                              ayahNumber <= highlightedRange.end);
                            
                            // Also check if this ayah is part of any review on the current page
                            const isInReviewOnPage = reviewsOnPage?.some(review => 
                              review.surah === surahNumber && 
                              ayahNumber >= review.ayahStart && 
                              ayahNumber <= review.ayahEnd
                            ) || false;
                            
                            // Combine both conditions for highlighting
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
                          padding={padding}
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
        )}

        {/* Selected Ayahs Info - Fixed Position */}
        {selectedAyahs.size > 0 && (
          <Card className="fixed top-24 right-6 p-6 shadow-lg border-0 z-40">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary">{selectedAyahs.size} ayah(s) selected</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClearSelectedAyahs?.()}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => setShowSelectedAyahsModal(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                View Selected ({selectedAyahs.size})
              </Button>
              <Button
                onClick={onAddRevision}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add for Review
              </Button>
            </div>
          </Card>
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