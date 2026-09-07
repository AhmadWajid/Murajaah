'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { addMemorizationItem, updateMemorizationItem, getMemorizationItem, toggleMistake, saveHideMistakesSetting, saveLastPage, loadLastPage, saveSelectedReciter, saveFontSettings, saveUISettings, saveReadingLayout } from '@/lib/storageService';
import { useOptimizedData } from '@/lib/hooks/useOptimizedData';
import { MistakeData } from '@/lib/storageService';
import { MemorizationItem, updateInterval, updateIntervalWithSettings, updateIndividualAyahRating, createMemorizationItem } from '@/lib/spacedRepetition';
import { getReviewSettings } from '@/lib/reviewAlgorithms';
import { getSurah, getQuranMeta, getPage, getAyah, fetchPageWithTranslation, SurahListItem } from '@/lib/quranService';
import { DEFAULT_RECITER_ID, resolveReciterId, getAyahAudioPlan, getReciterById, AudioPlan } from '@/lib/recitations';
import { generateMemorizationId } from '@/lib/utils';
import AppHeader from '@/components/AppHeader';
import QuranHeaderContent from '@/components/QuranHeaderContent';
import QuranContent from '@/components/QuranContent';
import AudioPlayer from '@/components/AudioPlayer';
import RevisionModal from '@/components/RevisionModal';
import EnhancedMemorizationModal from '@/components/EnhancedMemorizationModal';

// Define interfaces for the data structures
interface PageData {
  number: number;
  ayahs: Array<{
    number: number;
    text: string;
    surah: {
      number: number;
      name: string;
      englishName: string;
    };
    numberInSurah: number;
  }>;
}

interface ReviewItem extends MemorizationItem {
  currentAyah: { surah: number; ayah: number };
}

// Total number of pages in the Quran
const TOTAL_QURAN_PAGES = 604;

export default function QuranPage() {
  return (
    <Suspense fallback={
      <div className="reading-surface min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full loading-shimmer" />
          <p className="text-sm font-medium text-muted-foreground font-sans">Loading Quran…</p>
        </div>
      </div>
    }>
      <QuranPageContent />
    </Suspense>
  );
}

function QuranPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Use optimized data hook for settings and data
  const {
    hideMistakes,
    selectedReciter: optimizedSelectedReciter,
    fontSettings,
    memorizationItems,
    mistakes,
    setMistakes,
    isLoadingSettings,
    isLoadingData,
    refreshSettings,
    refreshData,
    refreshMistakesOnly,
    invalidateSettingsCache
  } = useOptimizedData();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentAyah, setCurrentAyah] = useState(1);
  const [readingLayout, setReadingLayout] = useState<'verse'>('verse');
  const [activeAyah, setActiveAyah] = useState<{ surah: number; ayah: number } | null>(null);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [previousPageData, setPreviousPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [surahList, setSurahList] = useState<SurahListItem[]>([]);
  const [highlightedRange, setHighlightedRange] = useState<{surah: number, start: number, end: number} | null>(null);
  const [selectedAyahs, setSelectedAyahs] = useState<Set<{surah: number, ayah: number}>>(new Set());
  const [openReviewDropdown, setOpenReviewDropdown] = useState<string | null>(null);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);

  
  const [reviewsOnCurrentPage, setReviewsOnCurrentPage] = useState<ReviewItem[]>([]);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState<{surah: number, ayah: number} | null>(null);
  const [selectedReciter, setSelectedReciter] = useState(DEFAULT_RECITER_ID);
  // Segment window for surah-mode reciters (absolute seconds within the audio file).
  // For verse-mode reciters these stay 0 and the whole file is the segment.
  const [audioSegmentStart, setAudioSegmentStart] = useState(0);
  const [audioSegmentEnd, setAudioSegmentEnd] = useState(0);
  const [showTranslation, setShowTranslation] = useState(true);
  
  // Font settings state (will be loaded asynchronously)
  const [layoutMode, setLayoutMode] = useState<'spread' | 'single'>('single');
  const [isMobile, setIsMobile] = useState(false);
  const [fontSize] = useState(24); // Remove unused setFontSize
  const [arabicFontSize, setArabicFontSize] = useState(24);
  const [translationFontSize, setTranslationFontSize] = useState(20);
  const [padding, setPadding] = useState(16);
  const [fontTargetArabic, setFontTargetArabic] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedTranslation, setSelectedTranslation] = useState('en.hilali');
  
  // Load font settings from optimized hook
  useEffect(() => {
    if (fontSettings) {
      // Don't apply spread layout on mobile screens
      const savedLayout = fontSettings.layoutMode || 'single';
      setLayoutMode(isMobile ? 'single' : savedLayout);
      setArabicFontSize(fontSettings.arabicFontSize || 24);
      setTranslationFontSize(fontSettings.translationFontSize || 20);
      setPadding(fontSettings.padding || 16);
      setFontTargetArabic(fontSettings.fontTargetArabic !== false);
      setSelectedLanguage(fontSettings.selectedLanguage || 'en');
      setSelectedTranslation(fontSettings.selectedTranslation || 'en.hilali');
    }
  }, [fontSettings, isMobile]);

  // Detect mobile viewport and force single-page layout on small screens
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      const mobile = window.innerWidth <= 640;
      setIsMobile(mobile);
      if (mobile) setLayoutMode('single');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load reading layout from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quran-reading-layout');
      if (saved === 'verse') {
        setReadingLayout(saved as any);
      }
    }
  }, []);

  // Save reading layout to localStorage and sync to DB whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('quran-reading-layout', readingLayout);
      saveReadingLayout(readingLayout);
    }
  }, [readingLayout, isInitialized]);

  // Set initial active verse when pageData or previousPageData loads
  useEffect(() => {
    if (pageData?.ayahs && pageData.ayahs.length > 0) {
      const isCurrentOnCurrentPage = activeAyah && pageData.ayahs.some(
        (a: any) => a.surah?.number === activeAyah.surah && a.numberInSurah === activeAyah.ayah
      );
      const isCurrentOnPreviousPage = activeAyah && previousPageData?.ayahs?.some(
        (a: any) => a.surah?.number === activeAyah.surah && a.numberInSurah === activeAyah.ayah
      );
      
      if (!isCurrentOnCurrentPage && !isCurrentOnPreviousPage) {
        const firstAyah = pageData.ayahs[0];
        setActiveAyah({
          surah: firstAyah.surah?.number || currentSurah,
          ayah: firstAyah.numberInSurah
        });
      }
    }
  }, [pageData, previousPageData]);
  
  // Update selected reciter from optimized hook
  useEffect(() => {
    if (optimizedSelectedReciter) {
      setSelectedReciter(resolveReciterId(optimizedSelectedReciter));
    }
  }, [optimizedSelectedReciter]);
  

  const [revealedMistakes, setRevealedMistakes] = useState<Set<string>>(new Set());
  const [hideWords, setHideWords] = useState(false);
  const [hideWordsDelay, setHideWordsDelay] = useState(500);
  // Remove showWordTranslation and onToggleWordTranslation state and props
  // Remove all references to showWordTranslation and onToggleWordTranslation in QuranHeader and QuranContent

  // Modal states
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionInput, setRevisionInput] = useState('');

  // Add this line to fix ReferenceError
  // Disable word-by-word data by default - only fetch if explicitly enabled
  const [wordByWordData, setWordByWordData] = useState<any[]>([]);
  const [showWordByWordTooltip, setShowWordByWordTooltip] = useState(false); // Disabled by default to fix UI issue

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showWordByWordTooltip');
      if (saved !== null) {
        setShowWordByWordTooltip(saved === 'true');
      } else {
        // Default to disabled
        setShowWordByWordTooltip(false);
      }
    }
  }, []);

  // Save to localStorage and sync to DB when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showWordByWordTooltip', showWordByWordTooltip ? 'true' : 'false');
      // Sync to database if logged in
      saveUISettings({ showWordByWordTooltip });
    }
  }, [showWordByWordTooltip]);

  // Initialize the component - handle URL parameters vs last page
  useEffect(() => {
    if (isInitialized) return;
    
    const ayahParam = searchParams.get('ayah');
    const reviewParam = searchParams.get('review');
    const surahParam = searchParams.get('surah');
    
    // If there are specific navigation parameters, use them
    if (ayahParam || reviewParam || surahParam) {
      // Let the existing URL parameter handling logic work
      setIsInitialized(true);
      return;
    }
    
    // Otherwise, load the last page the user was on
    const loadInitialPage = async () => {
      try {
        const lastPage = await loadLastPage();
        setCurrentPage(lastPage);
      } catch (error) {
        console.error('Error loading last page:', error);
        setCurrentPage(1); // fallback to page 1
      }
      setIsInitialized(true);
    };
    loadInitialPage();
  }, [searchParams, isInitialized]);

  // Load surah list once on mount — it never changes
  useEffect(() => {
    loadSurahList();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    loadPageData(currentPage);
  }, [currentPage, isInitialized]);

  // When layout mode changes, only fetch/clear the adjacent page instead
  // of reloading the entire current page (which is already loaded).
  useEffect(() => {
    if (!isInitialized || !pageData) return;

    if (layoutMode === 'spread') {
      // Fetch only the adjacent page
      const isOddPage = currentPage % 2 === 1;
      const adjacentPage = isOddPage ? currentPage + 1 : currentPage - 1;
      if (adjacentPage >= 1 && adjacentPage <= TOTAL_QURAN_PAGES) {
        Promise.all([
          getPage(adjacentPage, 'quran-uthmani'),
          fetchPageWithTranslation(adjacentPage, selectedTranslation),
        ]).then(([adjArabic, adjTranslation]) => {
          const adjacentCombinedAyahs = adjArabic.ayahs.map((arabicAyah: any, index: number) => ({
            ...arabicAyah,
            translation: adjTranslation?.data?.ayahs?.[index]?.text || '',
          }));
          setPreviousPageData({ ...adjArabic, ayahs: adjacentCombinedAyahs });
        }).catch(() => setPreviousPageData(null));
      } else {
        setPreviousPageData(null);
      }
    } else {
      setPreviousPageData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutMode, isInitialized]);

  // Handle translation changes separately to avoid full page reload
  useEffect(() => {
    if (!isInitialized || !pageData) return;
    
    // Only reload translation data, not the entire page
    loadTranslationData(currentPage);
  }, [selectedTranslation, isInitialized]);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized && currentPage >= 1 && currentPage <= TOTAL_QURAN_PAGES) {
      saveLastPage(currentPage);
    }
  }, [currentPage, isInitialized]);

  // Save font settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      saveFontSettingsToStorage();
    }
  }, [arabicFontSize, translationFontSize, fontTargetArabic, fontSize, padding, layoutMode, selectedLanguage, selectedTranslation, isInitialized]);

  // Scroll to top when page changes
  useEffect(() => {
    if (isInitialized) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, isInitialized]);

  // Detect reviews whenever page data or memorization items change
  useEffect(() => {
    const loadReviews = async () => {
      if (pageData && memorizationItems.length > 0) {
        try {
          const reviews = await getReviewsOnCurrentPage(pageData);
          setReviewsOnCurrentPage(reviews);
        } catch (error) {
          console.error('Error loading reviews on current page:', error);
        }
      }
    };
    loadReviews();
  }, [pageData, memorizationItems]);

  // Scroll to highlighted ayah when page loads
  useEffect(() => {
    if (highlightedRange && pageData && !loading) {
      // Small delay to ensure the page is fully rendered
      setTimeout(() => {
        const targetAyah = highlightedRange.start;
        const ayahElement = document.querySelector(`[data-ayah="${targetAyah}"]`);
        if (ayahElement) {
          ayahElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          // Add a temporary highlight effect
          ayahElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            ayahElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }, 3000);
        }
      }, 500);
    }
  }, [highlightedRange, pageData, loading]);

  // Keyboard navigation for RTL reading
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle arrow keys when not typing in an input field
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // If audio player is active, let the audio player handle spacebar and arrow keys for controls
    if (currentAudio && (event.key === ' ' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        // Left arrow = Next page (forward in RTL reading)
        event.preventDefault();
        if (layoutMode === 'spread') {
          if (currentPage < TOTAL_QURAN_PAGES - 1) {
            setCurrentPage(currentPage + 2);
          }
        } else {
          if (currentPage < TOTAL_QURAN_PAGES) {
            setCurrentPage(currentPage + 1);
          }
        }
        break;
      case 'ArrowRight':
        // Right arrow = Previous page (backward in RTL reading)
        event.preventDefault();
        if (layoutMode === 'spread') {
          if (currentPage > 2) {
            setCurrentPage(currentPage - 2);
          }
        } else {
          if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        }
        break;

      case 'ArrowUp':
        // Up arrow = Next page (forward in RTL reading) - only when no audio is playing
        event.preventDefault();
        if (layoutMode === 'spread') {
          if (currentPage < TOTAL_QURAN_PAGES - 1) {
            setCurrentPage(currentPage + 2);
          }
        } else {
          if (currentPage < TOTAL_QURAN_PAGES) {
            setCurrentPage(currentPage + 1);
          }
        }
        break;
      case 'ArrowDown':
        // Down arrow = Previous page (backward in RTL reading) - only when no audio is playing
        event.preventDefault();
        if (layoutMode === 'spread') {
          if (currentPage > 2) {
            setCurrentPage(currentPage - 2);
          }
        } else {
          if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        }
        break;
      case 'n':
      case 'N':
        // Toggle hideWords with 'n' key
        event.preventDefault();
        setHideWords((prev) => !prev);
        break;
    }
  }, [currentPage, currentAudio, isPlaying, layoutMode, TOTAL_QURAN_PAGES]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle URL parameters for navigation from review page
  useEffect(() => {
    if (!isInitialized) return;
    
    const surah = searchParams.get('surah');
    const ayahStart = searchParams.get('ayahStart');
    const ayahEnd = searchParams.get('ayahEnd');
    const reviewId = searchParams.get('review');
    const ayahParam = searchParams.get('ayah');
    
    // Handle direct ayah navigation (e.g., ?ayah=35:38 or ?ayah=35:38-45)
    if (ayahParam) {
      console.log('Ayah parameter found in URL:', ayahParam);
      try {
        // Parse ayah parameter (e.g., "35:38" or "35:38-45")
        const ayahMatch = ayahParam.match(/^(\d+):(\d+)(?:-(\d+))?$/);
        if (ayahMatch) {
          const [, surahStr, ayahStr, endAyahStr] = ayahMatch;
          const surahNumber = parseInt(surahStr);
          const ayahNumber = parseInt(ayahStr);
          const endAyahNumber = endAyahStr ? parseInt(endAyahStr) : ayahNumber;
          
          if (!isNaN(surahNumber) && !isNaN(ayahNumber) && !isNaN(endAyahNumber)) {
            console.log(`Navigating to ayah range: ${surahNumber}:${ayahNumber}-${endAyahNumber}`);
            getPageForAyah(surahNumber, ayahNumber).then(pageNumber => {
              console.log(`Got page number for ayah: ${pageNumber}`);
              goToPage(pageNumber, true); // Skip saving for URL navigation
              // Use activeAyah for navigation highlight, not highlightedRange
              // (highlightedRange is for actual review items only)
              setActiveAyah({ surah: surahNumber, ayah: ayahNumber });
              // Update current position
              setCurrentSurah(surahNumber);
              setCurrentAyah(ayahNumber);
              // Scroll to target after render
              setTimeout(() => {
                const ayahElement = document.getElementById(`ayah-${surahNumber}-${ayahNumber}`)
                  || document.querySelector(`[data-ayah="${ayahNumber}"]`);
                if (ayahElement) {
                  ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 600);
            });
            return;
          }
        }
      } catch (err) {
        console.error('Failed to parse ayah parameter:', err);
      }
    }
    
    // Handle navigation with separate surah and ayah (e.g., ?surah=35&ayah=38)
    if (surah && !ayahStart && !ayahEnd && !reviewId && ayahParam && !ayahParam.includes(':')) {
      // ayahParam is just a number, not a range
      const surahNumber = parseInt(surah);
      const ayahNumber = parseInt(ayahParam);
      if (!isNaN(surahNumber) && !isNaN(ayahNumber)) {
        getPageForAyah(surahNumber, ayahNumber).then(pageNumber => {
          goToPage(pageNumber, true);
          setActiveAyah({ surah: surahNumber, ayah: ayahNumber });
          // Update current position
          setCurrentSurah(surahNumber);
          setCurrentAyah(ayahNumber);
          setTimeout(() => {
            const ayahElement = document.getElementById(`ayah-${surahNumber}-${ayahNumber}`)
              || document.querySelector(`[data-ayah="${ayahNumber}"]`);
            if (ayahElement) {
              ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 600);
        });
        return;
      }
    }
    
    // Handle review navigation (existing functionality)
    if (reviewId) {
      const handleReviewNavigation = async () => {
        try {
          const decodedId = decodeURIComponent(reviewId);
          
          // First try to find in regular memorization items
          const memorizationItem = await getMemorizationItem(decodedId);
          
          // All items are now in unified storage, so no need to check complex items separately
          
          if (memorizationItem) {
            // Navigate to the page containing the first ayah
            getPageForAyah(memorizationItem.surah, memorizationItem.ayahStart).then(pageNumber => {
              goToPage(pageNumber, true); // Skip saving for URL navigation
              setHighlightedRange({ 
                surah: memorizationItem.surah, 
                start: memorizationItem.ayahStart, 
                end: memorizationItem.ayahEnd 
              });
              // Update current position
              setCurrentSurah(memorizationItem.surah);
              setCurrentAyah(memorizationItem.ayahStart);
            });
            return;
          } else {
            console.log('No memorization item found for ID:', decodedId);
          }
        } catch (err) {
          console.error('Failed to load review item:', err);
        }
      };
      handleReviewNavigation();
    }
    
    // Handle legacy surah/ayahStart/ayahEnd parameters
    if (surah && ayahStart && ayahEnd && surahList.length > 0) {
      const surahNumber = parseInt(surah);
      const startAyah = parseInt(ayahStart);
      const endAyah = parseInt(ayahEnd);
      
      if (!isNaN(surahNumber) && !isNaN(startAyah) && !isNaN(endAyah)) {
        // Find the page that contains the first ayah and navigate to it
        getPageForAyah(surahNumber, startAyah).then(pageNumber => {
          console.log(`Navigating to page ${pageNumber} for ayah ${surahNumber}:${startAyah}`);
          goToPage(pageNumber, true); // Skip saving for URL navigation
          // Set the highlighted range for visual indication
          setHighlightedRange({ surah: surahNumber, start: startAyah, end: endAyah });
          // Update current position
          setCurrentSurah(surahNumber);
          setCurrentAyah(startAyah);
        });
      }
    }
  }, [searchParams, surahList]);

  // Close review dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openReviewDropdown) {
        setOpenReviewDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openReviewDropdown]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [currentAudio]);

  const loadMemorizationItems = async () => {
    try {
      // Get regular memorization items only
      // Complex items are handled separately and should not be mixed with regular items
      // This function is no longer needed as data is loaded via useOptimizedData hook
    } catch (error) {
      console.error('Error loading memorization items:', error);
    }
  };

  // These functions are no longer needed as data is loaded via useOptimizedData hook

  const saveFontSettingsToStorage = async () => {
    try {
      await saveFontSettings({
        arabicFontSize,
        translationFontSize,
        fontTargetArabic,
        fontSize,
        padding,
        layoutMode,
        selectedLanguage,
        selectedTranslation,
      });
    } catch (error) {
      console.error('Error saving font settings:', error);
    }
  };

  const loadSurahList = async () => {
          try {
        const meta = await getQuranMeta();
        setSurahList(meta.surahs.references);
    } catch (error) {
      console.error('Error loading surah list:', error);
    }
  };

  const loadPageData = async (page: number) => {
    setLoading(true);
    try {
      // Determine if we need the adjacent page for spread layout
      const isOddPage = page % 2 === 1;
      const adjacentPage = layoutMode === 'spread'
        ? (isOddPage ? page + 1 : page - 1)
        : null;
      const needAdjacent = adjacentPage !== null && adjacentPage >= 1 && adjacentPage <= TOTAL_QURAN_PAGES;

      // Fetch current page Arabic + translation in parallel, and also
      // fetch the adjacent page in parallel if in spread mode.
      const [arabicPageData, translationPageData, adjacentResult] = await Promise.all([
        getPage(page, 'quran-uthmani'),
        fetchPageWithTranslation(page, selectedTranslation),
        needAdjacent && adjacentPage !== null
          ? Promise.all([
              getPage(adjacentPage, 'quran-uthmani'),
              fetchPageWithTranslation(adjacentPage, selectedTranslation),
            ]).then(([a, t]) => ({ arabic: a, translation: t }))
          : Promise.resolve(null),
      ]);

      // Combine Arabic and translation data for current page
      const combinedAyahs = arabicPageData.ayahs.map((arabicAyah: any, index: number) => ({
        ...arabicAyah,
        translation: translationPageData?.data?.ayahs?.[index]?.text || '',
      }));

      const pageData = {
        number: page,
        ayahs: combinedAyahs
      };

      setPageData(pageData);

      // Set adjacent page data (or clear it)
      if (adjacentResult) {
        const adjacentCombinedAyahs = adjacentResult.arabic.ayahs.map((arabicAyah: any, index: number) => ({
          ...arabicAyah,
          translation: adjacentResult.translation?.data?.ayahs?.[index]?.text || '',
        }));
        setPreviousPageData({
          ...adjacentResult.arabic,
          ayahs: adjacentCombinedAyahs,
        });
      } else {
        setPreviousPageData(null);
      }

      // Update current surah and ayah based on the first ayah of the page
      if (pageData.ayahs && pageData.ayahs.length > 0) {
        const firstAyah = pageData.ayahs[0];
        if (firstAyah.surah && firstAyah.surah.number) {
          setCurrentSurah(firstAyah.surah.number);
          setCurrentAyah(firstAyah.numberInSurah);
        }
      }

    } catch (error) {
      console.error('Error loading page data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load only translation data without reloading the entire page
  const loadTranslationData = async (page: number) => {
    try {
      // Show a brief loading state for translation change
      const loadingElement = document.querySelector('.translation-loading');
      if (loadingElement) {
        loadingElement.classList.add('opacity-50');
      }
      
      // Load translation data for current page
      const translationPageData = await fetchPageWithTranslation(page, selectedTranslation);
      
      if (translationPageData?.data?.ayahs) {
        // Update only the translation part of the existing page data
        setPageData((prevPageData: any) => {
          if (!prevPageData) return prevPageData;
          
          const updatedAyahs = prevPageData.ayahs.map((arabicAyah: any, index: number) => ({
            ...arabicAyah,
            translation: translationPageData.data.ayahs[index]?.text || '',
          }));
          
          return {
            ...prevPageData,
            ayahs: updatedAyahs
          };
        });
      }
      
      // Load translation data for adjacent page if in spread mode
      if (layoutMode === 'spread') {
        const isOddPage = page % 2 === 1;
        const adjacentPage = isOddPage ? page + 1 : page - 1;

        if (adjacentPage >= 1 && adjacentPage <= TOTAL_QURAN_PAGES) {
          const adjacentTranslationPageData = await fetchPageWithTranslation(adjacentPage, selectedTranslation);

          if (adjacentTranslationPageData?.data?.ayahs) {
            setPreviousPageData((prevAdjacentPageData: any) => {
              if (!prevAdjacentPageData) return prevAdjacentPageData;

              const updatedAyahs = prevAdjacentPageData.ayahs.map((arabicAyah: any, index: number) => ({
                ...arabicAyah,
                translation: adjacentTranslationPageData.data.ayahs[index]?.text || '',
              }));

              return {
                ...prevAdjacentPageData,
                ayahs: updatedAyahs
              };
            });
          }
        }
      }
      
      // Remove loading state
      if (loadingElement) {
        loadingElement.classList.remove('opacity-50');
      }
    } catch (error) {
      console.error('Error loading translation data:', error);
      
      // Remove loading state on error
      const loadingElement = document.querySelector('.translation-loading');
      if (loadingElement) {
        loadingElement.classList.remove('opacity-50');
      }
    }
  };

  const getPageForAyah = async (surahNumber: number, ayahNumber: number): Promise<number> => {
    try {
      const ayahData = await getAyah(surahNumber, ayahNumber);
      return ayahData.page;
    } catch (error) {
      console.error('Error getting page for ayah:', error);
      return 1;
    }
  };

  const handleNavigateToAyah = async (surahNumber: number, ayahNumber: number) => {
    try {
      const pageNumber = await getPageForAyah(surahNumber, ayahNumber);
      goToPage(pageNumber, true); // Skip saving for programmatic navigation
      // Don't set highlightedRange — that's for actual review items only.
      // Use activeAyah for the subtle navigation highlight instead.
      setActiveAyah({ surah: surahNumber, ayah: ayahNumber });

      // Update current position
      setCurrentSurah(surahNumber);
      setCurrentAyah(ayahNumber);

      // Scroll to the target ayah after the page renders
      setTimeout(() => {
        const ayahElement = document.getElementById(`ayah-${surahNumber}-${ayahNumber}`)
          || document.querySelector(`[data-ayah="${ayahNumber}"]`);
        if (ayahElement) {
          ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 600);

      // Update URL with ayah parameter and clear others
      const url = new URL(window.location.href);
      url.searchParams.set('ayah', `${surahNumber}:${ayahNumber}`);
      url.searchParams.delete('review');
      url.searchParams.delete('surah');
      url.searchParams.delete('ayahStart');
      url.searchParams.delete('ayahEnd');
      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.error('Error navigating to ayah:', error);
    }
  };

  // Scroll to first ayah of surah after navigation
  useEffect(() => {
    if (!loading && pageData && currentSurah && pageData.ayahs && pageData.ayahs.length > 0) {
      // Check if the first ayah of the currentSurah is present on this page
      const firstAyah = pageData.ayahs.find(
        (ayah: any) => ayah.surah?.number === currentSurah && ayah.numberInSurah === 1
      );
      if (firstAyah) {
        setTimeout(() => {
          const ayahElement = document.getElementById(`ayah-${currentSurah}-1`);
          if (ayahElement) {
            const rect = ayahElement.getBoundingClientRect();
            if (rect.top > 0 && rect.top > 20) {
              ayahElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }, 300);
      }
    }
  }, [currentSurah, currentPage, loading, pageData]);

  const handleNavigateToSurah = async (surahNumber: number) => {
    try {
      // Get the first ayah of the surah to find its page
      const surahData = await getSurah(surahNumber);
      if (surahData.ayahs && surahData.ayahs.length > 0) {
        const firstAyah = surahData.ayahs[0];
        const pageNumber = await getPageForAyah(surahNumber, firstAyah.numberInSurah);
        goToPage(pageNumber, true); // Skip saving for programmatic navigation
        setCurrentSurah(surahNumber);
        setCurrentAyah(firstAyah.numberInSurah);
        setHighlightedRange(null);
        // Clear selections when navigating to surah
        setSelectedAyahs(new Set());
        // Clear URL parameters when navigating to surah
        const url = new URL(window.location.href);
        url.searchParams.delete('ayah');
        url.searchParams.delete('review');
        url.searchParams.delete('surah');
        url.searchParams.delete('ayahStart');
        url.searchParams.delete('ayahEnd');
        window.history.pushState({}, '', url.toString());
      }
    } catch (error) {
      console.error('Error navigating to surah:', error);
    }
  };

  const goToPage = (page: number, skipSave: boolean = false) => {
    if (page >= 1 && page <= TOTAL_QURAN_PAGES) {
      setCurrentPage(page);
      // Only clear URL parameters and save page if not skipping
      if (!skipSave) {
        // Clear review highlight when manually navigating away
        setHighlightedRange(null);
        // Clear URL parameters when navigating normally
        const url = new URL(window.location.href);
        url.searchParams.delete('ayah');
        url.searchParams.delete('review');
        url.searchParams.delete('surah');
        url.searchParams.delete('ayahStart');
        url.searchParams.delete('ayahEnd');
        window.history.pushState({}, '', url.toString());
      }
    }
  };

  // Update handleAyahClick to accept surah and ayah
  const handleAyahClick = (surah: number, ayah: number) => {
    setSelectedAyahs(prev => {
      const newSet = new Set(prev);
      const key = JSON.stringify({ surah, ayah });
      let found = false;
      for (const item of newSet) {
        if (JSON.stringify(item) === key) {
          newSet.delete(item);
          found = true;
          break;
        }
      }
      if (!found) {
        newSet.add({ surah, ayah });
      }
      return newSet;
    });
  };

  // Update handleRemoveAyah to accept surah and ayah
  const handleRemoveAyah = (surah: number, ayah: number) => {
    setSelectedAyahs(prev => {
      const newSet = new Set(prev);
      for (const item of newSet) {
        if (item.surah === surah && item.ayah === ayah) {
          newSet.delete(item);
          break;
        }
      }
      return newSet;
    });
  };

  const handleClearSelectedAyahs = () => {
    setSelectedAyahs(new Set());
  };

  const handleAddRevision = () => {
    // Use the enhanced modal for both cases
    setShowEnhancedModal(true);
  };

  const handleEnhancedMemorization = async (selections: any[], name: string, description?: string, memorizationLevel?: string, memorizationAge?: number, isBeginner?: boolean) => {
    try {
      // If all selections are from the same surah and are adjacent, create a single item
      const allSameSurah = selections.every(s => s.surah === selections[0].surah);
      const allAdjacent = selections.length === 1 ||
        (allSameSurah && selections.every((s, i) =>
          i === 0 || s.ayahStart === selections[i-1].ayahEnd + 1
        ));

      if (allSameSurah && allAdjacent) {
        // Create a single memorization item for adjacent ayahs in the same surah
        const minAyah = Math.min(...selections.map(s => s.ayahStart));
        const maxAyah = Math.max(...selections.map(s => s.ayahEnd));
        const surah = selections[0].surah;

        const memorizationItem = await createMemorizationItem(
          surah,
          minAyah,
          maxAyah,
          memorizationLevel,
          undefined, // userTimeZone
          memorizationAge
        );

        memorizationItem.name = name;
        memorizationItem.description = description || '';
        memorizationItem.tags = [];
        memorizationItem.isBeginner = isBeginner || false;
        if (isBeginner) memorizationItem.beginnerStartedAtReview = 0;

        await addMemorizationItem(memorizationItem);
      } else {
        // Create separate memorization items for each selection
        const createdItems = [];
        for (let i = 0; i < selections.length; i++) {
          const selection = selections[i];
          const itemName = selections.length === 1 ? name : `${name} - Part ${i + 1}`;
          const itemDescription = selections.length === 1 ? description : `${description || ''} (Part ${i + 1})`;

          const memorizationItem = await createMemorizationItem(
            selection.surah,
            selection.ayahStart,
            selection.ayahEnd,
            memorizationLevel,
            undefined, // userTimeZone
            memorizationAge
          );

          memorizationItem.name = itemName;
          memorizationItem.description = itemDescription;
          memorizationItem.tags = [];
          memorizationItem.isBeginner = isBeginner || false;
          if (isBeginner) memorizationItem.beginnerStartedAtReview = 0;

          await addMemorizationItem(memorizationItem);
          createdItems.push(memorizationItem);
        }
      }

      // Clear selections and close modal
      setSelectedAyahs(new Set());
      setShowEnhancedModal(false);
      
      // Refresh memorization items to show the new additions in the UI
      loadMemorizationItems();
      
      // Also immediately update reviews on current page to show highlighting
      if (pageData) {
        const updatedReviews = await getReviewsOnCurrentPage(pageData);
        setReviewsOnCurrentPage(updatedReviews);
      }
      
    } catch (error) {
      console.error('Error creating enhanced memorization items:', error);
    }
  };



    const handleRevisionInputSubmit = async () => {
    if (revisionInput.trim()) {
      // Parse the revision input (e.g., "1:1-7" or "Al-Fatiha 1-7")
      const input = revisionInput.trim();
      
      // Try to parse as surah:ayah-ayah format
      const surahAyahMatch = input.match(/^(\d+):(\d+)-(\d+)$/);
      if (surahAyahMatch) {
        const [, surahStr, startStr, endStr] = surahAyahMatch;
        const surah = parseInt(surahStr);
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        
        if (!isNaN(surah) && !isNaN(start) && !isNaN(end)) {
          // Create memorization item
          const id = generateMemorizationId(surah, start, end);
          const item = await createMemorizationItem(surah, start, end, 'active', undefined, 0);
          await addMemorizationItem(item);
          
          // Navigate to the page containing the first ayah
          getPageForAyah(surah, start).then(pageNumber => {
            setCurrentPage(pageNumber);
            setHighlightedRange({ surah, start, end });
            // Update current position
            setCurrentSurah(surah);
            setCurrentAyah(start);
          });
          
          setRevisionInput('');
          setShowRevisionInput(false);
          loadMemorizationItems();
          return;
        }
      }
      
      // Try to parse as surah name format
      const surahNameMatch = input.match(/^([A-Za-z\s-]+)\s+(\d+)-(\d+)$/);
      if (surahNameMatch) {
        const [, surahName, startStr, endStr] = surahNameMatch;
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        
        // Find surah by name
        const surah = surahList.find(s => 
          s.englishName.toLowerCase().includes(surahName.toLowerCase()) ||
          s.name.toLowerCase().includes(surahName.toLowerCase())
        );
        
        if (surah && !isNaN(start) && !isNaN(end)) {
          const id = generateMemorizationId(surah.number, start, end);
          const item = await createMemorizationItem(surah.number, start, end, 'active', undefined, 0);
          await addMemorizationItem(item);
          
          getPageForAyah(surah.number, start).then(pageNumber => {
            setCurrentPage(pageNumber);
            setHighlightedRange({ surah: surah.number, start, end });
            // Update current position
            setCurrentSurah(surah.number);
            setCurrentAyah(start);
          });
          
          setRevisionInput('');
          setShowRevisionInput(false);
          loadMemorizationItems();
          return;
        }
      }
      
      // If parsing fails, show error or use default
      console.error('Could not parse revision input:', input);
    }
  };

  const handleQuickReview = async (surahNumber: number, ayahNumber: number, rating: 'easy' | 'medium' | 'hard') => {
    try {
      // Find the memorization item that contains this ayah
      const item = memorizationItems.find((item: MemorizationItem) =>
        item.surah === surahNumber &&
        ayahNumber >= item.ayahStart &&
        ayahNumber <= item.ayahEnd
      );

      if (item) {
        // Rate this individual verse, not the whole range
        const { updatedItem } = updateIndividualAyahRating(item, ayahNumber, rating);
        await updateMemorizationItem(updatedItem);
        await refreshData();
      }
    } catch (error) {
      console.error('Error in handleQuickReview:', error);
    }
  };

  const handleOverallRating = async (item: any) => {
    if (item && item.rating) {
      const rating = item.rating;
      const { rating: _rating, ...itemWithoutRating } = item;
      const settings = getReviewSettings();
      const updatedItem = updateIntervalWithSettings(itemWithoutRating, rating, settings);
      await updateMemorizationItem(updatedItem);
      await refreshData();
    }
  };

  const handleToggleMistake = async (surahNumber: number, ayahNumber: number) => {
    const mistakeKey = `${surahNumber}:${ayahNumber}`;
    // Clear any reveal state for this ayah — toggling the mistake should
    // reset the hidden/revealed view to a clean state.
    setRevealedMistakes(prev => {
      if (!prev.has(mistakeKey)) return prev;
      const next = new Set(prev);
      next.delete(mistakeKey);
      return next;
    });
    // Optimistically update mistakes state so the UI (header nav, overlays)
    // reflects the change immediately without waiting for the async refresh.
    const wasMarked = Boolean(mistakes[mistakeKey]);
    setMistakes(prev => {
      const next = { ...prev };
      if (wasMarked) {
        delete next[mistakeKey];
      } else {
        next[mistakeKey] = {
          timestamp: new Date().toISOString(),
          surah: surahNumber,
          ayah: ayahNumber,
        };
      }
      return next;
    });
    try {
      await toggleMistake(surahNumber, ayahNumber);
      refreshMistakesOnly();
    } catch (error) {
      console.error('Error toggling mistake:', error);
      // Revert optimistic update on error
      setMistakes(prev => {
        const next = { ...prev };
        if (wasMarked) {
          next[mistakeKey] = { timestamp: new Date().toISOString(), surah: surahNumber, ayah: ayahNumber };
        } else {
          delete next[mistakeKey];
        }
        return next;
      });
      refreshMistakesOnly();
    }
  };

  const handleRevealMistake = (surahNumber: number, ayahNumber: number) => {
    const mistakeKey = `${surahNumber}:${ayahNumber}`;
    setRevealedMistakes(prev => new Set([...prev, mistakeKey]));
  };

  // Clear revealed mistakes when the page changes — stale reveals from
  // other pages are meaningless and would cause hidden verses to show.
  useEffect(() => {
    setRevealedMistakes(new Set());
  }, [currentPage]);

  const getReviewsOnCurrentPage = async (currentPageData: PageData): Promise<ReviewItem[]> => {
    if (!currentPageData || !currentPageData.ayahs) return [];

    const reviews: ReviewItem[] = [];
    
    try {
      // Use memorization items from optimized hook
      const allItems = memorizationItems;
      
      currentPageData.ayahs.forEach((ayah: any) => {
        const surahNumber = ayah.surah?.number;
        const ayahNumber = ayah.numberInSurah;
        
        if (surahNumber && ayahNumber) {
          const item = allItems.find((item: MemorizationItem) => 
            item.surah === surahNumber && 
            ayahNumber >= item.ayahStart && 
            ayahNumber <= item.ayahEnd
          );
          
          // Show ALL memorization items on this page, regardless of completion status
          // This allows multiple reviews per day - no filtering by nextReview or completedToday
          if (item) {
            const reviewItem: ReviewItem = {
              ...item,
              currentAyah: { surah: surahNumber, ayah: ayahNumber }
            };
            reviews.push(reviewItem);
          }
        }
      });
      
      return reviews;
    } catch (error) {
      console.error('Error getting reviews on current page:', error);
      return [];
    }
  };

  const playAyahAudio = async (surahNumber: number, ayahNumber: number) => {
    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const plan = await getAyahAudioPlan(selectedReciter, surahNumber, ayahNumber);
      const reciter = getReciterById(selectedReciter);
      const isSurahMode = plan.mode === 'surah' && plan.segmentEnd > 0;

      const audio = new Audio(plan.url);
      audio.preload = 'metadata';

      // Segment window (absolute seconds). For verse mode the whole file is used.
      const segStart = isSurahMode ? plan.segmentStart : 0;
      const segEnd = isSurahMode ? plan.segmentEnd : 0;

      setAudioSegmentStart(segStart);
      setAudioSegmentEnd(segEnd);
      setCurrentAudio(audio);
      setCurrentPlayingAyah({ surah: surahNumber, ayah: ayahNumber });
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);

      // Setup event listeners
      setupAudioEventListeners(audio, surahNumber, ayahNumber, plan.url, reciter.mode, segStart, segEnd);

      // Start playing. For surah mode, seek to the segment start first.
      const startPlayback = async (attempt = 0): Promise<void> => {
        if (isSurahMode && segStart > 0) {
          try { audio.currentTime = segStart; } catch { /* seek after play if needed */ }
        }
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (err: any) {
          // On mobile, play() can reject with AbortError if the audio hasn't
          // buffered enough yet. Wait for canplay then retry (up to 3 times).
          if ((err?.name === 'AbortError' || err?.name === 'NotSupportedError') && attempt < 3) {
            await new Promise<void>((resolve) => {
              const onReady = () => {
                audio.removeEventListener('canplay', onReady);
                resolve();
              };
              if (audio.readyState >= 2) {
                resolve();
              } else {
                audio.addEventListener('canplay', onReady, { once: true });
                // Safety timeout — don't wait forever
                setTimeout(() => {
                  audio.removeEventListener('canplay', onReady);
                  resolve();
                }, 1500);
              }
            });
            return startPlayback(attempt + 1);
          }
          throw err;
        }
      };

      if (isSurahMode && segStart > 0) {
        // Some browsers can't seek until metadata is loaded; wait for it.
        const onReady = () => {
          startPlayback().catch((err) => console.error('Error starting segment playback:', err));
        };
        if (audio.readyState >= 1) {
          onReady();
        } else {
          audio.addEventListener('loadedmetadata', onReady, { once: true });
        }
      } else {
        await startPlayback();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const setupAudioEventListeners = (
    audio: HTMLAudioElement,
    surahNumber: number,
    ayahNumber: number,
    audioUrl: string,
    reciterMode: 'verse' | 'surah',
    segStart: number,
    segEnd: number
  ) => {
    const isSurahMode = reciterMode === 'surah' && segEnd > 0;

    audio.addEventListener('loadedmetadata', () => {
      if (isSurahMode) {
        // Display duration relative to the ayah segment.
        setDuration(Math.max(0, segEnd - segStart));
      } else {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (isSurahMode) {
        const rel = audio.currentTime - segStart;
        setCurrentTime(Math.max(0, Math.min(rel, segEnd - segStart)));
      } else {
        setCurrentTime(audio.currentTime);
      }
    });

    // Note: the 'ended' event for auto-advance is handled by AudioPlayer's
    // onPlayNext callback. We only clear state here as a fallback when
    // the audio truly stops (wasn't restarted by loop or auto-advance).
    audio.addEventListener('ended', () => {
      setTimeout(() => {
        if (audio.paused) {
          setIsPlaying(false);
          setCurrentTime(0);
          // Don't clear currentPlayingAyah — AudioPlayer's onPlayNext will
          // either advance or do nothing. If it does nothing, the player
          // simply shows paused state at the last verse.
        }
      }, 150);
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', {
        error: audio.error,
        errorEvent: e,
        url: audioUrl,
        surah: surahNumber,
        ayah: ayahNumber,
        reciter: selectedReciter
      });
      setIsPlaying(false);
      setCurrentPlayingAyah(null);
    });
  };

  const togglePlayPause = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
        setIsPlaying(false);
      } else {
        currentAudio.play();
        setIsPlaying(true);
      }
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentPlayingAyah(null);
      setCurrentAudio(null);
    }
  };

  // Surah ayah counts for calculating next verse
  const surahAyahCounts: Record<number, number> = {
    1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
    11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
    21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
    31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
    41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
    51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
    61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
    71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
    81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
    91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
    101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
    111: 5, 112: 4, 113: 5, 114: 6
  };

  // Auto-advance: play the next verse and navigate to it
  const playNextAyah = useCallback(async () => {
    if (!currentPlayingAyah) return;

    const { surah, ayah } = currentPlayingAyah;
    const totalAyahsInSurah = surahAyahCounts[surah] || 0;

    let nextSurah: number;
    let nextAyah: number;

    if (ayah < totalAyahsInSurah) {
      // Next ayah in the same surah
      nextSurah = surah;
      nextAyah = ayah + 1;
    } else if (surah < 114) {
      // Move to the first ayah of the next surah
      nextSurah = surah + 1;
      nextAyah = 1;
    } else {
      // We're at the very last ayah of the Quran (114:6) — stop
      setIsPlaying(false);
      setCurrentPlayingAyah(null);
      setCurrentAudio(null);
      return;
    }

    // Play the next verse FIRST — on mobile, calling audio.play() must happen
    // as close to the previous playback ending as possible. If we await page
    // navigation first, iOS can drop the audio session and block play().
    playAyahAudio(nextSurah, nextAyah);

    // Navigate the page to show the next verse (non-blocking)
    try {
      const pageNumber = await getPageForAyah(nextSurah, nextAyah);
      if (pageNumber !== currentPage) {
        goToPage(pageNumber, true);
      }

      // Scroll to the verse after a brief delay for page render
      setTimeout(() => {
        const ayahElement = document.getElementById(`ayah-${nextSurah}-${nextAyah}`);
        if (ayahElement) {
          ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, pageNumber !== currentPage ? 600 : 100);
    } catch (error) {
      console.error('Error navigating to next ayah:', error);
    }
  }, [currentPlayingAyah, currentPage]);

  // Fetch word-by-word translation for the current page
  // Only fetch if the feature is explicitly enabled
  useEffect(() => {
    async function fetchWordByWord() {
      try {
        if (!showWordByWordTooltip) {
          setWordByWordData([]);
          return;
        }

        const pagesToFetch = [currentPage];
        if (layoutMode === 'spread' && previousPageData?.number) {
          pagesToFetch.push(previousPageData.number);
        }

        // Fetch all pages in parallel
        const results = await Promise.all(
          pagesToFetch.map(p => fetch(`/api/wordbyword?page=${p}`).then(res => res.ok ? res.json() : null).catch(() => null))
        );
        const allWords: any[] = [];
        for (const data of results) {
          if (data?.words) allWords.push(...data.words);
        }
        setWordByWordData(allWords);
      } catch {
        setWordByWordData([]);
      }
    }
    fetchWordByWord();
  }, [currentPage, layoutMode, previousPageData?.number, showWordByWordTooltip]);

  // Open Add Review modal if addReview param is present
  useEffect(() => {
    if (searchParams.get('addReview')) {
      setShowEnhancedModal(true);
    }
  }, [searchParams]);

  // Remove addReview param from URL when modal is closed
  const handleCloseEnhancedModal = () => {
    setShowEnhancedModal(false);
    if (searchParams.get('addReview')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('addReview');
      router.replace(url.pathname + url.search);
    }
  };

  // Add this guard clause after all hooks
  if (!isInitialized) return null;

  return (
    <div
      className="reading-surface min-h-screen px-0 sm:px-4 transition-[padding] duration-300"
      style={{
        paddingBottom: currentAudio ? '20rem' : '8rem',
      }}
    >
      {/* Header */}
      <AppHeader 
        pageType="quran"
        quranHeaderComponent={
          <QuranHeaderContent
            currentPage={currentPage}
            currentSurah={currentSurah}
            totalPages={TOTAL_QURAN_PAGES}
            onPageChange={goToPage}
            onSurahSelect={handleNavigateToSurah}
            onNavigateToAyah={handleNavigateToAyah}
            surahList={surahList}
            showTranslation={showTranslation}
            onToggleTranslation={() => setShowTranslation(!showTranslation)}
            layoutMode={layoutMode}
            onToggleLayout={() => {
              // Prevent switching to spread on mobile screens
              if (isMobile && layoutMode === 'single') return;
              setLayoutMode(layoutMode === 'spread' ? 'single' : 'spread');
            }}
            selectedReciter={selectedReciter}
            onReciterChange={(reciter: string) => {
              setSelectedReciter(reciter);
              saveSelectedReciter(reciter);
            }}
            onAddRevision={handleAddRevision}
            onEnhancedMemorization={() => setShowEnhancedModal(true)}
            fontSize={fontTargetArabic ? arabicFontSize : translationFontSize}
            onFontSizeChange={(size: number) => {
              if (fontTargetArabic) {
                setArabicFontSize(size);
              } else {
                setTranslationFontSize(size);
              }
            }}
            padding={padding}
            onPaddingChange={setPadding}
            fontTargetArabic={fontTargetArabic}
            onToggleFontTarget={() => {
              setFontTargetArabic((prev: boolean) => prev === true ? false : true);
            }}
            hideMistakes={hideMistakes}
            onToggleHideMistakes={() => {
              const newHideMistakes = !hideMistakes;
              saveHideMistakesSetting(newHideMistakes);
              refreshSettings();
            }}
            selectedLanguage={selectedLanguage}
            selectedTranslation={selectedTranslation}
            onLanguageChange={setSelectedLanguage}
            onTranslationChange={setSelectedTranslation}
            hideWords={hideWords}
            onToggleHideWords={() => setHideWords((prev) => !prev)}
            hideWordsDelay={hideWordsDelay}
            onHideWordsDelayChange={setHideWordsDelay}
            showWordByWordTooltip={showWordByWordTooltip}
            onToggleWordByWordTooltip={() => setShowWordByWordTooltip((prev) => !prev)}
            currentAyah={currentAyah}
            onNavigateToNextMistake={handleNavigateToAyah}
            pageData={pageData}
            mistakes={mistakes}
            readingLayout={readingLayout}
            onReadingLayoutChange={setReadingLayout}
          />
        }
      />

      {/* Revision Input Modal */}
      <RevisionModal
        isOpen={showRevisionInput}
        revisionInput={revisionInput}
        onInputChange={setRevisionInput}
        onSubmit={handleRevisionInputSubmit}
        onClose={() => {
                  setShowRevisionInput(false);
                  setRevisionInput('');
                }}
      />



      {/* Enhanced Memorization Modal */}
      <EnhancedMemorizationModal
        isOpen={showEnhancedModal}
        currentPage={currentPage}
        currentSurah={currentSurah}
        pageData={pageData}
        selectedAyahs={selectedAyahs}
        onConfirm={handleEnhancedMemorization}
        onClose={() => {
          setSelectedAyahs(new Set());
          handleCloseEnhancedModal();
        }}
      />

      {/* Quran Content */}
      <QuranContent
        loading={loading}
        pageData={pageData}
        previousPageData={previousPageData}
        layoutMode={layoutMode}
        currentPage={currentPage}
        showTranslation={showTranslation}
        memorizationItems={memorizationItems}
        highlightedRange={highlightedRange}
        selectedAyahs={selectedAyahs}
        openReviewDropdown={openReviewDropdown}
        onAyahClick={handleAyahClick}
        onPlayAudio={playAyahAudio}
        onQuickReview={handleQuickReview}
        onToggleReviewDropdown={setOpenReviewDropdown}
        onAddRevision={handleAddRevision}
        onRemoveAyah={handleRemoveAyah}
        onClearSelectedAyahs={handleClearSelectedAyahs}
        onReviewComplete={handleOverallRating}
        reviewsOnPage={reviewsOnCurrentPage}
        fontSize={fontTargetArabic ? arabicFontSize : translationFontSize}
        arabicFontSize={arabicFontSize}
        translationFontSize={translationFontSize}
        fontTargetArabic={fontTargetArabic}
        mistakes={mistakes}
        onToggleMistake={handleToggleMistake}
        hideMistakes={hideMistakes}
        onRevealMistake={handleRevealMistake}
        revealedMistakes={revealedMistakes}
        hideWords={hideWords}
        hideWordsDelay={hideWordsDelay}
        wordByWordData={wordByWordData}
        showWordByWordTooltip={showWordByWordTooltip}
        padding={padding}
        readingLayout={readingLayout}
        activeAyah={activeAyah}
        onActiveAyahChange={setActiveAyah}
        playingAyah={isPlaying ? currentPlayingAyah : null}
      />

      {/* Audio Player */}
      <AudioPlayer
        currentAudio={currentAudio}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        currentPlayingAyah={currentPlayingAyah}
        onTogglePlayPause={togglePlayPause}
        onStop={stopAudio}
        onPlayNext={playNextAyah}
        seekOffset={audioSegmentStart}
        segmentEnd={audioSegmentEnd}
        reciterName={getReciterById(selectedReciter)?.englishName}
        reciterArabicName={getReciterById(selectedReciter)?.name}
        surahName={surahList.find(s => s.number === currentPlayingAyah?.surah)?.englishName}
        surahArabicName={surahList.find(s => s.number === currentPlayingAyah?.surah)?.name}
      />

      
    </div>
  );
} 