'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { getAllMemorizationItems, addMemorizationItem, updateMemorizationItem, getMemorizationItem, getMistakes, toggleMistake, getHideMistakesSetting, saveHideMistakesSetting, saveLastPage, loadLastPage, saveSelectedReciter, loadSelectedReciter, saveFontSettings, loadFontSettings, MistakeData } from '@/lib/storage';
import { MemorizationItem, updateInterval, createMemorizationItem } from '@/lib/spacedRepetition';
import { getSurah, getQuranMeta, getPage, getAyah, fetchPageWithTranslation, SurahListItem } from '@/lib/quranService';
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
    <Suspense fallback={<div>Loading...</div>}>
      <QuranPageContent />
    </Suspense>
  );
}

function QuranPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentAyah, setCurrentAyah] = useState(1);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [previousPageData, setPreviousPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [memorizationItems, setMemorizationItems] = useState<MemorizationItem[]>([]);
  const [surahList, setSurahList] = useState<SurahListItem[]>([]);
  const [highlightedRange, setHighlightedRange] = useState<{surah: number, start: number, end: number} | null>(null);
  const [selectedAyahs, setSelectedAyahs] = useState<Set<{surah: number, ayah: number}>>(new Set());
  const [openReviewDropdown, setOpenReviewDropdown] = useState<string | null>(null);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [arabicTexts, setArabicTexts] = useState<Record<string, string>>({});
  const [previousArabicTexts, setPreviousArabicTexts] = useState<Record<string, string>>({});
  
  const [reviewsOnCurrentPage, setReviewsOnCurrentPage] = useState<ReviewItem[]>([]);
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPlayingAyah, setCurrentPlayingAyah] = useState<{surah: number, ayah: number} | null>(null);
  // Set default reciter to 'Ayman Sowaid' in useState for selectedReciter.
  const [selectedReciter, setSelectedReciter] = useState('Ayman Sowaid');
  const [showTranslation, setShowTranslation] = useState(true);
  
  // Load font settings from localStorage
  const savedFontSettings = loadFontSettings();
  const [layoutMode, setLayoutMode] = useState<'spread' | 'single'>(savedFontSettings.layoutMode);
  const [fontSize] = useState(savedFontSettings.fontSize); // Remove unused setFontSize
  const [arabicFontSize, setArabicFontSize] = useState(savedFontSettings.arabicFontSize);
  const [translationFontSize, setTranslationFontSize] = useState(savedFontSettings.translationFontSize);
  const [padding, setPadding] = useState(savedFontSettings.padding);
  const [fontTargetArabic, setFontTargetArabic] = useState(savedFontSettings.fontTargetArabic);
  const [selectedLanguage, setSelectedLanguage] = useState(savedFontSettings.selectedLanguage || 'en');
  const [selectedTranslation, setSelectedTranslation] = useState(savedFontSettings.selectedTranslation || 'en.asad');
  

  const [mistakes, setMistakes] = useState<Record<string, boolean | MistakeData>>({});
  const [hideMistakes, setHideMistakes] = useState(false);
  const [revealedMistakes, setRevealedMistakes] = useState<Set<string>>(new Set());
  const [hideWords, setHideWords] = useState(false);
  const [hideWordsDelay, setHideWordsDelay] = useState(500);
  // Remove showWordTranslation and onToggleWordTranslation state and props
  // Remove all references to showWordTranslation and onToggleWordTranslation in QuranHeader and QuranContent

  // Modal states
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [revisionInput, setRevisionInput] = useState('');

  // Add this line to fix ReferenceError
  const [wordByWordData, setWordByWordData] = useState<any[]>([]);
  const [showWordByWordTooltip, setShowWordByWordTooltip] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showWordByWordTooltip');
      if (saved !== null) {
        setShowWordByWordTooltip(saved === 'true');
      }
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showWordByWordTooltip', showWordByWordTooltip ? 'true' : 'false');
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
    const lastPage = loadLastPage();
    setCurrentPage(lastPage);
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    
    loadMemorizationItems();
    loadSurahList();
    loadPageData(currentPage);
    loadMistakes();
    loadHideMistakesSetting();
    loadSelectedReciterSetting();
  }, [currentPage, isInitialized]);

  // Reload page data when layout mode changes to handle previous page loading
  useEffect(() => {
    if (!isInitialized || !pageData) return;
    
    // Reload page data to handle previous page loading for spread mode
    loadPageData(currentPage);
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
    if (pageData && memorizationItems.length > 0) {
      const reviews = getReviewsOnCurrentPage(pageData);
      setReviewsOnCurrentPage(reviews);
    }
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

    // If audio is playing, let the audio player handle spacebar and left/right arrows for seeking
    if (currentAudio && isPlaying && (event.key === ' ' || event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
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
      case ' ':
        // Spacebar = Next page (forward in RTL reading) - only when no audio is playing
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
              setHighlightedRange({ 
                surah: surahNumber, 
                start: ayahNumber, 
                end: endAyahNumber 
              });
              // Update current position
              setCurrentSurah(surahNumber);
              setCurrentAyah(ayahNumber);
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
          setHighlightedRange({ surah: surahNumber, start: ayahNumber, end: ayahNumber });
          // Update current position
          setCurrentSurah(surahNumber);
          setCurrentAyah(ayahNumber);
        });
        return;
      }
    }
    
    // Handle review navigation (existing functionality)
    if (reviewId) {
      try {
        const decodedId = decodeURIComponent(reviewId);
        
        // First try to find in regular memorization items
        const memorizationItem = getMemorizationItem(decodedId);
        
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
            console.log('Set highlighted range:', { 
              surah: memorizationItem.surah, 
              start: memorizationItem.ayahStart, 
              end: memorizationItem.ayahEnd 
            });
          });
          return;
        } else {
          console.log('No memorization item found for ID:', decodedId);
        }
      } catch (err) {
        console.error('Failed to load review item:', err);
      }
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

  const loadMemorizationItems = () => {
    // Get regular memorization items only
    // Complex items are handled separately and should not be mixed with regular items
    const regularItems = getAllMemorizationItems();
    setMemorizationItems(regularItems);
  };

  const loadMistakes = () => {
    const mistakesData = getMistakes();
    setMistakes(mistakesData);
  };

  const loadHideMistakesSetting = () => {
    const hideMistakesSetting = getHideMistakesSetting();
    setHideMistakes(hideMistakesSetting);
  };

  const loadSelectedReciterSetting = () => {
    const reciter = loadSelectedReciter();
    setSelectedReciter(reciter);
  };

  const saveFontSettingsToStorage = () => {
    saveFontSettings({
      arabicFontSize,
      translationFontSize,
      fontTargetArabic,
      fontSize,
      padding,
      layoutMode,
      selectedLanguage,
      selectedTranslation,
    });
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
      // Load current page with Arabic text
      const arabicPageData = await getPage(page, 'quran-uthmani');
      const translationPageData = await fetchPageWithTranslation(page, selectedTranslation);
      
      // Combine Arabic and translation data
      const combinedAyahs = arabicPageData.ayahs.map((arabicAyah: any, index: number) => ({
        ...arabicAyah,
        translation: translationPageData?.data?.ayahs?.[index]?.text || '',
      }));
      
      const pageData = {
        number: page,
        ayahs: combinedAyahs
      };
      
      setPageData(pageData);
      

      
      // Load previous page for spread layout
      if (layoutMode === 'spread') {
        if (page > 1) {
          const previousArabicPageData = await getPage(page - 1, 'quran-uthmani');
          const previousTranslationPageData = await fetchPageWithTranslation(page - 1, selectedTranslation);
          
          const previousCombinedAyahs = previousArabicPageData.ayahs.map((arabicAyah: any, index: number) => ({
            ...arabicAyah,
            translation: previousTranslationPageData?.data?.ayahs?.[index]?.text || '',
          }));
          
          const previousPageData = {
            ...previousArabicPageData,
            ayahs: previousCombinedAyahs
          };
          
          setPreviousPageData(previousPageData);
        } else {
          setPreviousPageData(null);
        }
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
      
      // Load Arabic texts for the current page
      await loadArabicTexts(page);
      
      // Load Arabic texts for the previous page if in spread mode
      if (layoutMode === 'spread' && page > 1) {
        await loadPreviousArabicTexts(page - 1);
      }
      
    } catch (error) {
      console.error('Error loading page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArabicTexts = async (pageNumber: number) => {
    try {
      const arabicPageData = await getPage(pageNumber, 'quran-uthmani');
      const texts: Record<string, string> = {};
      
      arabicPageData.ayahs.forEach((ayah: any) => {
        const key = `${ayah.surah.number}:${ayah.numberInSurah}`;
        texts[key] = ayah.text;
      });
      
      setArabicTexts(texts);
    } catch (error) {
      console.error('Error loading Arabic texts:', error);
    }
  };

  const loadPreviousArabicTexts = async (pageNumber: number) => {
    try {
      const arabicPageData = await getPage(pageNumber, 'quran-uthmani');
      const texts: Record<string, string> = {};
      
      arabicPageData.ayahs.forEach((ayah: any) => {
        const key = `${ayah.surah.number}:${ayah.numberInSurah}`;
        texts[key] = ayah.text;
      });
      
      setPreviousArabicTexts(texts);
    } catch (error) {
      console.error('Error loading previous Arabic texts:', error);
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
      
      // Load translation data for previous page if in spread mode
      if (layoutMode === 'spread' && page > 1) {
        const previousTranslationPageData = await fetchPageWithTranslation(page - 1, selectedTranslation);
        
        if (previousTranslationPageData?.data?.ayahs) {
          setPreviousPageData((prevPreviousPageData: any) => {
            if (!prevPreviousPageData) return prevPreviousPageData;
            
            const updatedAyahs = prevPreviousPageData.ayahs.map((arabicAyah: any, index: number) => ({
              ...arabicAyah,
              translation: previousTranslationPageData.data.ayahs[index]?.text || '',
            }));
            
            return {
              ...prevPreviousPageData,
              ayahs: updatedAyahs
            };
          });
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
      setHighlightedRange({ surah: surahNumber, start: ayahNumber, end: ayahNumber });
      
      // Update current position
      setCurrentSurah(surahNumber);
      setCurrentAyah(ayahNumber);
      
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

  const handleEnhancedMemorization = async (selections: any[], name: string, description?: string, memorizationLevel?: string) => {
    try {
      console.log('Creating enhanced memorization with selections:', selections);
      
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
          memorizationLevel
        );
        
        memorizationItem.name = name;
        memorizationItem.description = description || '';
        memorizationItem.tags = [];

        addMemorizationItem(memorizationItem);
        console.log(`Created 1 memorization item for adjacent ayahs: ${surah}:${minAyah}-${maxAyah}`);
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
            memorizationLevel
          );
          
          memorizationItem.name = itemName;
          memorizationItem.description = itemDescription;
          memorizationItem.tags = [];

          addMemorizationItem(memorizationItem);
          createdItems.push(memorizationItem);
        }
        
        console.log(`Created ${createdItems.length} separate memorization items for non-adjacent selections`);
      }

      // Clear selections and close modal
      setSelectedAyahs(new Set());
      setShowEnhancedModal(false);
      
      // Refresh memorization items to show the new additions in the UI
      loadMemorizationItems();
      
      // Also immediately update reviews on current page to show highlighting
      if (pageData) {
        const updatedReviews = getReviewsOnCurrentPage(pageData);
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
          const item = await createMemorizationItem(surah, start, end, 'active');
          addMemorizationItem(item);
          
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
          const item = await createMemorizationItem(surah.number, start, end, 'active');
          addMemorizationItem(item);
          
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

  const handleQuickReview = (surahNumber: number, ayahNumber: number, rating: 'easy' | 'medium' | 'hard') => {
    // Find the memorization item that contains this ayah
    const allItems = getAllMemorizationItems();
    const item = allItems.find(item => 
      item.surah === surahNumber && 
      ayahNumber >= item.ayahStart && 
      ayahNumber <= item.ayahEnd
    );

    if (item) {
      // Rate the entire range as one unit
      console.log(`Rating entire range ${item.ayahStart}-${item.ayahEnd} with ${rating}`);
      
      // Use updateInterval for the entire range, not individual ayahs
      const updatedItem = updateInterval(item, rating);
      
      // Update the item
      updateMemorizationItem(updatedItem);
      
      // Reload memorization items to reflect changes
      loadMemorizationItems();
      
      console.log(`Range review completed for ${surahNumber}:${item.ayahStart}-${item.ayahEnd} with rating: ${rating}`);
      console.log('Item ID:', item.id);
    } else {
      console.log(`No memorization item found for ayah ${surahNumber}:${ayahNumber}`);
    }
  };

  const handleOverallRating = (item: any) => {
    // This function is called when a review is completed via the Complete Review button
    console.log('Complete review rating received:', item);
    
    if (item && item.rating) {
      const rating = item.rating;
      
      // Update the item with the rating
      const updatedItem = updateInterval(item, rating);
      updateMemorizationItem(updatedItem);
      
      // Reload memorization items to reflect changes
      loadMemorizationItems();
      
      console.log(`Complete review finished for ${item.surah}:${item.ayahStart}-${item.ayahEnd} with rating: ${rating}`);
    } else {
      console.log('No rating provided for complete review');
    }
  };

  const handleToggleMistake = (surahNumber: number, ayahNumber: number) => {
    // Always toggle the mistake, regardless of hideMistakes mode
    toggleMistake(surahNumber, ayahNumber);
    loadMistakes();
  };

  const handleRevealMistake = (surahNumber: number, ayahNumber: number) => {
    const mistakeKey = `${surahNumber}:${ayahNumber}`;
    setRevealedMistakes(prev => new Set([...prev, mistakeKey]));
  };

  const getReviewsOnCurrentPage = (currentPageData: PageData): ReviewItem[] => {
    if (!currentPageData || !currentPageData.ayahs) return [];

    const reviews: ReviewItem[] = [];
    
    // Get all memorization items (unified storage)
    const allItems = getAllMemorizationItems();
    
    currentPageData.ayahs.forEach((ayah: any) => {
      const surahNumber = ayah.surah?.number;
      const ayahNumber = ayah.numberInSurah;
      
      if (surahNumber && ayahNumber) {
        const item = allItems.find(item => 
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
  };

  const playAyahAudio = async (surahNumber: number, ayahNumber: number) => {
    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      
      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/${selectedReciter}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ayah data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.data || !data.data.audio) {
        throw new Error('No audio URL found for this ayah');
      }
      
      const audioUrl = data.data.audio;
      
      const audio = new Audio(audioUrl);
      audio.preload = 'metadata';
      
      setCurrentAudio(audio);
      setCurrentPlayingAyah({ surah: surahNumber, ayah: ayahNumber });
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      // Setup event listeners
      setupAudioEventListeners(audio, surahNumber, ayahNumber, audioUrl);
      
      // Start playing
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const setupAudioEventListeners = (audio: HTMLAudioElement, surahNumber: number, ayahNumber: number, audioUrl: string) => {
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentPlayingAyah(null);
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
    }
  };

  // Fetch word-by-word translation for the current page
  useEffect(() => {
    async function fetchWordByWord() {
      try {
        const res = await fetch(`/api/wordbyword?page=${currentPage}`);
        if (res.ok) {
          const data = await res.json();
          setWordByWordData(data.words || []);
        } else {
          setWordByWordData([]);
        }
      } catch {
        setWordByWordData([]);
      }
    }
    fetchWordByWord();
  }, [currentPage]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32 px-0 sm:px-4">
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
              setHideMistakes(newHideMistakes);
              saveHideMistakesSetting(newHideMistakes);
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
        arabicTexts={arabicTexts}
        previousArabicTexts={previousArabicTexts}
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
      />

      
    </div>
  );
} 