'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AyahCard from './AyahCard';
import { X } from 'lucide-react';
import { MistakeData } from '@/lib/supabase/database';

interface AyahDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ayah: any;
  pageData: any;
  isMemorization: boolean;
  status: string | null;
  showTranslation: boolean;
  memorizationItems: any[];
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
  layoutMode?: 'spread' | 'single';
}

export default function AyahDetailDrawer({
  isOpen,
  onClose,
  ayah,
  pageData,
  isMemorization,
  status,
  showTranslation,
  memorizationItems,
  onPlayAudio,
  onQuickReview,
  onToggleReviewDropdown,
  openReviewDropdown,
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
  layoutMode = 'single',
}: AyahDetailDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isOpen]);

  if (!mounted || !ayah) return null;

  const ayahNumber = ayah.numberInSurah;
  const surahNumber = ayah.surah?.number || pageData?.surah || 1;
  const surahName = ayah.surah?.englishName || 'Surah';

  const drawerContent = (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/35 dark:bg-black/65 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto cursor-pointer ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-over container */}
      <div
        className={`fixed z-50 bg-[#FAF8F5]/98 dark:bg-[#12161A]/98 backdrop-blur shadow-[0_-8px_30px_rgba(0,0,0,0.1),_0_8px_30px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out flex flex-col border-accent/20 pointer-events-auto
          bottom-0 left-0 right-0 h-[75vh] max-h-[85vh] rounded-t-3xl border-t
          md:top-0 md:bottom-0 md:right-0 md:left-auto md:w-[460px] md:h-full md:max-h-none md:rounded-none md:border-t-0 md:border-l ${
            isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full'
          }`}
      >
        {/* Drag handle for mobile */}
        <div className="w-12 h-1 bg-accent/20 rounded-full mx-auto my-2.5 md:hidden" />

        {/* Ornate Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-accent/15 bg-[#FAF8F5]/95 dark:bg-[#12161A]/95 sticky top-0 z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-accent/80 tracking-widest uppercase font-sans">
              Selected Verse Details
            </span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white font-serif-header">
              {surahName} {surahNumber}:{ayahNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-5 select-text custom-scrollbar">
          <div className="relative overflow-hidden rounded-2xl border border-accent/10 bg-gradient-to-br from-[#FCFAF2]/50 to-[#F5EEDC]/30 dark:from-[#1D222B]/40 dark:to-[#171B22]/30 p-4 sm:p-5 shadow-sm">
            {/* Subtle parchment paper texture overlay */}
            <div
              className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(var(--accent) 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />
            
            <AyahCard
              ayah={ayah}
              index={pageData?.ayahs?.indexOf(ayah) >= 0 ? pageData.ayahs.indexOf(ayah) : 0}
              pageData={pageData}
              isMemorization={isMemorization}
              status={status}
              isSelected={false}
              isInHighlightedRange={false}
              showTranslation={showTranslation}
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
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
