'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Menu,
  X,
  Book,
  Info,
  Keyboard
} from 'lucide-react';
import { getLanguagesWithTranslations } from '@/lib/quranService';
import { getNextMistakeInVerseOrder } from '@/lib/storageService';
import { MistakeData } from '@/lib/supabase/database';

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
  readingLayout: 'mushaf' | 'verse';
  onReadingLayoutChange: (layout: 'mushaf' | 'verse') => void;
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
    selectedLanguage,
    selectedTranslation,
    onLanguageChange,
    onTranslationChange,
    hideWords,
    onToggleHideWords,
    hideWordsDelay,
    onHideWordsDelayChange,
    readingLayout,
    onReadingLayoutChange,
  } = props;

  const [showViewSettings, setShowViewSettings] = useState(false);
  const [showReciterSelector, setShowReciterSelector] = useState(false);
  const [showSurahSelector, setShowSurahSelector] = useState(false);
  const [surahSearchTerm, setSurahSearchTerm] = useState('');
  const [selectedSurahForAyah, setSelectedSurahForAyah] = useState(currentSurah);
  const [selectedAyahNumber, setSelectedAyahNumber] = useState(1);
  
  // Navigation Modal View State: 'chapters' or 'verses'
  const [modalViewState, setModalViewState] = useState<'chapters' | 'verses'>('chapters');
  
  // Audio Settings Modal Tab: 'reciters' or 'info'
  const [audioTab, setAudioTab] = useState<'reciters' | 'info'>('reciters');

  const [mobileHeaderHidden, setMobileHeaderHidden] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mobileHeaderHidden');
      return saved === 'true';
    }
    return false;
  });

  // Sync selectedSurahForAyah with currentSurah
  useEffect(() => {
    setSelectedSurahForAyah(currentSurah);
  }, [currentSurah]);

  // Get the next mistake in verse order
  const [nextMistake, setNextMistake] = useState<MistakeData | null>(null);
  const hasNextMistake = nextMistake !== null;
  
  useEffect(() => {
    const loadNextMistake = async () => {
      try {
        const mistake = await getNextMistakeInVerseOrder(currentSurah, currentAyah, pageData?.ayahs);
        setNextMistake(mistake);
      } catch (error) {
        console.error('Error loading next mistake:', error);
        setNextMistake(null);
      }
    };
    loadNextMistake();
  }, [currentSurah, currentAyah, pageData]);

  // Save mobile header visibility to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobileHeaderHidden', mobileHeaderHidden.toString());
    }
  }, [mobileHeaderHidden]);

  // Load available translations on mount
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

  // Reciter options
  const reciters = [
    { id: 'ar.alafasy', name: 'Mishary Alafasy' },
    { id: 'ar.abdurrahmaansudais', name: 'Abdur-Rahman As-Sudais' },
    { id: 'ar.abdullahbasfar', name: 'Abdullah Basfar' },
    { id: 'ar.abdulsamad', name: 'Abdul Samad' },
    { id: 'ar.ahmedajamy', name: 'Ahmed ibn Ali al-Ajamy' },
    { id: 'ar.aymanswoaid', name: 'Ayman Sowaid' },
    { id: 'ar.hanirifai', name: 'Hani Rifai' },
    { id: 'ar.hudhaify', name: 'Ali bin Abdur-Rahman Al-Hudhaify' },
    { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary' },
    { id: 'ar.husarymujawwad', name: 'Husary (Mujawwad)' },
    { id: 'ar.ibrahimakhbar', name: 'Ibrahim Akhdar' },
    { id: 'ar.mahermuaiqly', name: 'Maher Al Muaiqly' },
    { id: 'ar.minshawi', name: 'Muhammad Siddiq Al-Minshawi' },
    { id: 'ar.muhammadayyoub', name: 'Muhammad Ayyub' },
    { id: 'ar.muhammadjibreel', name: 'Muhammad Jibreel' },
    { id: 'ar.parhizgar', name: 'Parhizgar' },
    { id: 'ar.saoodshuraym', name: 'Saood bin Ibraaheem Ash-Shuraym' },
    { id: 'ar.shaatree', name: 'Abu Bakr Ash-Shaatree' },
  ];

  const currentSurahData = surahList.find(s => s.number === currentSurah);
  const surahName = currentSurahData ? currentSurahData.name : 'Unknown Surah';
  const maxAyahs = surahList.find(s => s.number === selectedSurahForAyah)?.numberOfAyahs || 1;

  // Parse search term for direct Surah:Ayah match
  const parseDirectSearch = () => {
    const query = surahSearchTerm.trim().toLowerCase();
    if (!query) return null;

    // Pattern 1: Chapter:Verse (e.g. "2:255" or "2 255" or "2-255" or "2/255")
    const numericMatch = query.match(/^(\d+)(?:[:\s\-\/]+)(\d+)$/);
    if (numericMatch) {
      const surahNum = parseInt(numericMatch[1]);
      const ayahNum = parseInt(numericMatch[2]);
      const surah = surahList.find(s => s.number === surahNum);
      if (surah && ayahNum >= 1 && ayahNum <= surah.numberOfAyahs) {
        return { surah, ayah: ayahNum };
      }
    }

    // Pattern 2: ChapterName Verse (e.g. "Al-Fatiha 5" or "Fatiha 5" or "Al-Baqarah 255")
    const textMatch = query.match(/^([a-z\s\-']+?)(?:[:\s\-\/]+)(\d+)$/);
    if (textMatch) {
      const namePart = textMatch[1].trim();
      const ayahNum = parseInt(textMatch[2]);
      // First try exact match, then substring match
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

  return (
    <>
      {/* Main content container */}
      <div className="flex items-center justify-between flex-1 min-w-0 overflow-hidden relative font-sans">
        
        {/* Center Section - Unified breadcrumb-style navigation bar */}
        <div className="hidden md:flex items-center space-x-1.5 flex-shrink min-w-0 flex-1 justify-center mx-2">
          <div className="flex items-center bg-white/70 dark:bg-[#12161A]/80 backdrop-blur-md rounded-xl border border-amber-200/30 dark:border-border/30 p-1 shadow-sm transition-all">
            
            {/* Unified Navigation Dropdown Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setModalViewState('chapters');
                setSurahSearchTerm('');
                setSelectedSurahForAyah(currentSurah);
                setShowSurahSelector(true);
              }}
              className="h-8 px-3.5 rounded-lg hover:bg-amber-500/5 dark:hover:bg-[#181D23] text-amber-850 dark:text-accent font-semibold text-xs transition-colors flex items-center space-x-1.5"
              title="Select Surah and Verse"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-accent opacity-80" />
              <span className="truncate max-w-[130px] xl:max-w-[180px] font-sans font-bold">
                {currentSurah}. {surahName} {currentAyah ? `: ${currentAyah}` : ''}
              </span>
              <span className="text-[10px] opacity-60 ml-0.5">▼</span>
            </Button>

            <div className="h-4 w-px bg-amber-200/25 dark:bg-border/25 mx-1" />

            {/* Page Navigator */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(layoutMode === 'spread' ? currentPage + 2 : currentPage + 1)}
                disabled={layoutMode === 'spread' ? currentPage >= totalPages - 1 : currentPage >= totalPages}
                className="h-8 w-8 p-0 flex-shrink-0 rounded-lg hover:bg-amber-500/5 dark:hover:bg-[#181D23] transition-colors group"
                title="Next Page (Forward in Reading)"
              >
                <ChevronLeft className="h-4 w-4 group-hover:text-amber-500 transition-colors" />
              </Button>
              
              <div className="flex items-center space-x-1 px-2 flex-shrink-0">
                <span className="text-xs text-gray-400 dark:text-gray-500 select-none font-medium hidden lg:inline">Page</span>
                <Input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) {
                      onPageChange(value);
                    }
                  }}
                  onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                  min="1"
                  max={totalPages}
                  className="w-12 h-7 text-center text-xs font-bold rounded-lg border-amber-200/20 dark:border-border/25 bg-white dark:bg-[#12161A] focus:ring-1 focus:ring-accent p-0"
                />
                <span className="text-xs text-gray-400 dark:text-gray-500 select-none font-medium">/ {totalPages}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(layoutMode === 'spread' ? currentPage - 2 : currentPage - 1)}
                disabled={layoutMode === 'spread' ? currentPage <= 2 : currentPage <= 1}
                className="h-8 w-8 p-0 flex-shrink-0 rounded-lg hover:bg-amber-500/5 dark:hover:bg-[#181D23] transition-colors group"
                title="Previous Page (Backward in Reading)"
              >
                <ChevronRight className="h-4 w-4 group-hover:text-amber-500 transition-colors" />
              </Button>
            </div>
          </div>
          
          {/* Next Mistake Button */}
          {hasNextMistake && onNavigateToNextMistake && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (nextMistake) {
                  onNavigateToNextMistake(nextMistake.surah, nextMistake.ayah);
                }
              }}
              className="h-9 px-3.5 rounded-xl bg-red-500/10 dark:bg-red-500/15 border-red-200/30 dark:border-red-900/30 text-red-755 dark:text-red-300 hover:bg-red-500/20 dark:hover:bg-red-500/25 transition-all font-semibold text-xs shadow-sm flex items-center"
              title={`Go to next mistake: Surah ${nextMistake?.surah} Ayah ${nextMistake?.ayah}`}
            >
              <svg className="w-3.5 h-3.5 mr-1.5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="hidden lg:inline">Next Mistake</span>
            </Button>
          )}
        </div>

        {/* Right Section - Controls (Desktop Only) */}
        <div className="hidden md:flex items-center space-x-1.5 lg:space-x-2.5 flex-shrink-0">
          
          {/* Segmented Layout Switcher */}
          <div className="flex bg-amber-500/5 dark:bg-gray-800/80 p-0.5 rounded-xl border border-amber-200/35 dark:border-border/30 shadow-sm">
            <button
              type="button"
              onClick={() => onReadingLayoutChange('mushaf')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                readingLayout === 'mushaf'
                  ? 'bg-white dark:bg-[#12161A] text-amber-855 dark:text-accent shadow-sm border border-amber-200/20 dark:border-border/20'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-305 border border-transparent'
              }`}
              title="Continuous Mushaf Mode"
            >
              <Book className="h-3.5 w-3.5 text-amber-600 dark:text-accent opacity-80" />
              <span className="hidden xl:inline">Mushaf</span>
            </button>
            <button
              type="button"
              onClick={() => onReadingLayoutChange('verse')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                readingLayout === 'verse'
                  ? 'bg-white dark:bg-[#12161A] text-amber-855 dark:text-accent shadow-sm border border-amber-200/20 dark:border-border/20'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-305 border border-transparent'
              }`}
              title="Editorial List Mode"
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-accent opacity-80" />
              <span className="hidden xl:inline">List</span>
            </button>
          </div>

          {/* Display Settings / Appearance */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowViewSettings(true)}
            className="h-9 px-3 rounded-xl border-amber-200/40 dark:border-[#2C3440] hover:bg-amber-500/5 dark:hover:bg-[#181D23] text-gray-700 dark:text-gray-300 font-semibold text-xs flex items-center"
            title="Display Settings"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
            <span className="hidden xl:inline">Display</span>
          </Button>
            
          {/* Audio Settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAudioTab('reciters');
              setShowReciterSelector(true);
            }}
            className="h-9 px-3 rounded-xl border-amber-200/40 dark:border-[#2C3440] hover:bg-amber-500/5 dark:hover:bg-[#181D23] text-gray-700 dark:text-gray-300 font-semibold text-xs flex items-center"
            title="Audio Settings & Reciter Selection"
          >
            <Volume2 className="h-3.5 w-3.5 mr-1.5 text-gray-500 dark:text-gray-400" />
            <span className="hidden xl:inline">Audio</span>
          </Button>

          {/* Add Review Button */}
          {onEnhancedMemorization && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEnhancedMemorization}
              className="h-9 px-3.5 rounded-xl btn-primary font-bold text-xs shadow-sm flex items-center"
            >
              <Target className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden lg:inline">Add Review</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {!mobileHeaderHidden ? (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#FAF8F5]/95 dark:bg-[#12161A]/95 backdrop-blur-md z-40 shadow-lg border-t border-amber-200/20 dark:border-border/25 animate-fade-in">
          {/* Mobile Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center space-x-2 w-full justify-between">
              
              {/* Navigation button for quick jumps */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setModalViewState('chapters');
                  setSurahSearchTerm('');
                  setSelectedSurahForAyah(currentSurah);
                  setShowSurahSelector(true);
                }}
                className="h-8.5 px-3 rounded-lg border-amber-200/45 dark:border-[#2C3440] text-amber-850 dark:text-accent font-semibold text-xs flex items-center"
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                <span className="truncate max-w-[90px]">{surahName} {currentAyah ? `: ${currentAyah}` : ''}</span>
              </Button>

              {/* Page Selector */}
              <div className="flex items-center space-x-1 bg-white/50 dark:bg-black/20 rounded-lg p-0.5 border border-amber-200/20 dark:border-border/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange(layoutMode === 'spread' ? currentPage + 2 : currentPage + 1)}
                  disabled={layoutMode === 'spread' ? currentPage >= totalPages - 1 : currentPage >= totalPages}
                  className="h-7 w-7 p-0 rounded-md"
                  title="Next Page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                
                <div className="flex items-center space-x-1 min-w-0 px-1">
                  <Input
                    type="number"
                    value={currentPage}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value)) {
                        onPageChange(value);
                      }
                    }}
                    className="w-12 h-6 text-center text-xs flex-shrink-0 px-1 border-amber-200/20 dark:border-border/20 bg-white dark:bg-[#12161A] p-0 font-bold"
                  />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">/ {totalPages}</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange(layoutMode === 'spread' ? currentPage - 2 : currentPage - 1)}
                  disabled={layoutMode === 'spread' ? currentPage <= 2 : currentPage <= 1}
                  className="h-7 w-7 p-0 rounded-md"
                  title="Previous Page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Next Mistake Button - Mobile */}
              {hasNextMistake && onNavigateToNextMistake ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (nextMistake) {
                      onNavigateToNextMistake(nextMistake.surah, nextMistake.ayah);
                    }
                  }}
                  className="h-8.5 px-2.5 bg-red-500/10 dark:bg-red-500/15 border-red-200/30 dark:border-red-900/30 text-red-750 dark:text-red-300 font-bold"
                  title={`Next mistake: Surah ${nextMistake?.surah} Ayah ${nextMistake?.ayah}`}
                >
                  <svg className="w-3.5 h-3.5 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </Button>
              ) : (
                <div className="w-8.5 h-8.5" />
              )}

            </div>
          </div>

          {/* Mobile Controls */}
          <div className="px-3 py-2 border-t border-amber-200/10 dark:border-border/20 bg-amber-500/5 dark:bg-[#12161A]/50">
            <div className="flex items-center justify-between space-x-2">
              {/* Layout segmented toggle */}
              <div className="flex bg-white/80 dark:bg-gray-800/80 p-0.5 rounded-lg border border-amber-200/20 dark:border-border/20">
                <button
                  type="button"
                  onClick={() => onReadingLayoutChange('mushaf')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    readingLayout === 'mushaf'
                      ? 'bg-white dark:bg-gray-700 text-amber-850 dark:text-accent shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Mushaf
                </button>
                <button
                  type="button"
                  onClick={() => onReadingLayoutChange('verse')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    readingLayout === 'verse'
                      ? 'bg-white dark:bg-gray-700 text-amber-850 dark:text-accent shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  List
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewSettings(true)}
                  className="h-8 px-3 rounded-lg text-xs"
                >
                  <Settings className="h-3.5 w-3.5 mr-1" />
                  <span>Display</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAudioTab('reciters');
                    setShowReciterSelector(true);
                  }}
                  className="h-8 px-3 rounded-lg text-xs"
                >
                  <Volume2 className="h-3.5 w-3.5 mr-1" />
                  <span>Audio</span>
                </Button>
                
                {onEnhancedMemorization && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEnhancedMemorization}
                    className="h-8 px-3 rounded-lg text-xs btn-primary font-semibold"
                  >
                    <Target className="h-3.5 w-3.5 mr-1" />
                    <span>Review</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Floating Navigation Button - Always visible on mobile */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setMobileHeaderHidden(!mobileHeaderHidden)}
          className="h-12 w-12 p-0 rounded-full bg-white/95 dark:bg-gray-850/95 backdrop-blur-sm shadow-lg border-2 hover:scale-110 transition-all duration-300 border-amber-250/20"
          title={mobileHeaderHidden ? "Show navigation" : "Hide navigation"}
        >
          {mobileHeaderHidden ? (
            <Menu className="h-6 w-6 rotate-180 transition-transform duration-300" />
          ) : (
            <X className="h-6 w-6 transition-transform duration-300" />
          )}
        </Button>
      </div>      {/* Navigation Modal */}
      {showSurahSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[85vh] flex flex-col bg-[#FAF8F5]/95 dark:bg-[#12161A]/95 border border-amber-200/30 dark:border-border/30 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            
            {modalViewState === 'chapters' ? (
              <>
                <div className="p-6 border-b border-amber-200/10 dark:border-border/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700/80 dark:text-accent/80 tracking-widest uppercase block mb-0.5 font-sans">Navigation</span>
                      <h3 className="text-xl font-bold font-serif-header text-gray-900 dark:text-white">Quran Index</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSurahSelector(false)}
                      className="h-8.5 w-8.5 rounded-full p-0 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="h-4.5 w-4.5" />
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Search chapters or type verse (e.g. Al-Fatiha, 2:255)..."
                      value={surahSearchTerm}
                      onChange={(e) => setSurahSearchTerm(e.target.value)}
                      className="w-full pl-10 h-10.5 rounded-xl border-amber-200/60 dark:border-[#2C3440] bg-white dark:bg-[#181D23] font-sans text-sm focus:ring-1 focus:ring-accent"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 max-h-[50vh] scrollbar-thin">
                  {directSearchResult && (
                    <div className="mb-3 p-1">
                      <Button
                        variant="outline"
                        className="w-full justify-start h-auto px-4 py-3 rounded-xl border-amber-500/30 dark:border-accent/30 bg-amber-500/5 dark:bg-accent/5 hover:bg-amber-500/10 dark:hover:bg-accent/10 text-amber-900 dark:text-accent font-semibold transition-all flex items-center space-x-3.5 animate-pulse-once"
                        onClick={() => {
                          onNavigateToAyah(directSearchResult.surah.number, directSearchResult.ayah);
                          setShowSurahSelector(false);
                          setSurahSearchTerm('');
                        }}
                      >
                        <Search className="h-4 w-4 text-amber-600 dark:text-accent flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-xs text-amber-700/80 dark:text-accent/80 font-bold uppercase tracking-wider">Direct Verse Jump</div>
                          <div className="text-sm truncate">
                            Go to Surah {directSearchResult.surah.englishName} ({directSearchResult.surah.number}), Verse {directSearchResult.ayah}
                          </div>
                        </div>
                      </Button>
                      <div className="h-px bg-amber-200/15 dark:bg-border/15 my-3" />
                    </div>
                  )}

                  <div className="space-y-1.5 font-sans">
                    {(() => {
                      const surahsToShow = surahSearchTerm 
                        ? surahList.filter(surah => 
                            surah.name.toLowerCase().includes(surahSearchTerm.toLowerCase()) ||
                            (surah.englishName && surah.englishName.toLowerCase().includes(surahSearchTerm.toLowerCase())) ||
                            surah.number.toString().includes(surahSearchTerm)
                          )
                        : surahList;
                      
                      if (surahsToShow.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs font-sans">
                            No chapters match your search query.
                          </div>
                        );
                      }
                      
                      return surahsToShow.map((surah) => (
                        <Button
                          key={surah.number}
                          variant="ghost"
                          className={`w-full justify-start h-auto px-4 py-3 rounded-xl border border-transparent transition-all ${
                            surah.number === currentSurah && !surahSearchTerm
                              ? 'bg-amber-500/10 dark:bg-accent/10 border-amber-500/20 dark:border-accent/20 text-amber-900 dark:text-accent font-semibold'
                              : 'hover:bg-amber-500/5 dark:hover:bg-[#181D23] text-gray-700 dark:text-gray-300'
                          }`}
                          onClick={() => {
                            setSelectedSurahForAyah(surah.number);
                            setModalViewState('verses');
                          }}
                        >
                          <div className="flex items-center space-x-3.5 w-full">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-sans border flex-shrink-0 ${
                              surah.number === currentSurah && !surahSearchTerm
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-accent dark:border-accent/30'
                                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {surah.number}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">{surah.englishName}</span>
                                <span className="font-serif text-sm text-amber-600 dark:text-accent">{surah.name}</span>
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-sans mt-0.5">{surah.numberOfAyahs} verses</div>
                            </div>
                          </div>
                        </Button>
                      ));
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 border-b border-amber-200/10 dark:border-border/10">
                  <div className="flex items-center space-x-3 mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setModalViewState('chapters')}
                      className="h-8.5 w-8.5 rounded-full p-0 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center"
                    >
                      <ChevronLeft className="h-4.5 w-4.5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-amber-700/80 dark:text-accent/80 tracking-widest uppercase block mb-0.5 font-sans">
                        Surah {selectedSurahForAyah}
                      </span>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {surahList.find(s => s.number === selectedSurahForAyah)?.englishName}
                        </h3>
                        <span className="font-serif text-sm text-amber-600 dark:text-accent">
                          {surahList.find(s => s.number === selectedSurahForAyah)?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full h-10 rounded-xl border-amber-200/60 dark:border-[#2C3440] text-xs font-semibold hover:bg-amber-500/5 dark:hover:bg-accent/10 flex items-center justify-center space-x-2"
                    onClick={() => {
                      onSurahSelect(selectedSurahForAyah);
                      setShowSurahSelector(false);
                    }}
                  >
                    <span>Read from beginning (Verse 1)</span>
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 max-h-[50vh] scrollbar-thin">
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                    Select Verse
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                    {Array.from({ length: surahList.find(s => s.number === selectedSurahForAyah)?.numberOfAyahs || 1 }, (_, i) => i + 1).map((verseNum) => (
                      <button
                        key={verseNum}
                        onClick={() => {
                          onNavigateToAyah(selectedSurahForAyah, verseNum);
                          setShowSurahSelector(false);
                        }}
                        className={`h-10 w-10 text-xs font-bold rounded-lg border transition-all flex items-center justify-center ${
                          selectedSurahForAyah === currentSurah && verseNum === (currentAyah || 1)
                            ? 'bg-amber-500 text-white border-amber-600 dark:bg-accent dark:border-accent dark:text-[#12161A] shadow-sm'
                            : 'bg-white dark:bg-[#181D23] border-amber-200/20 dark:border-border/30 text-gray-700 dark:text-gray-300 hover:bg-amber-500/10 dark:hover:bg-accent/10 hover:border-amber-500/30'
                        }`}
                      >
                        {verseNum}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* View Settings Modal */}
      {showViewSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-[#FAF8F5]/95 dark:bg-[#12161A]/95 border border-amber-200/30 dark:border-border/30 rounded-2xl shadow-2xl p-6 animate-fade-in-up font-sans">
            <div className="flex items-center justify-between mb-6 border-b border-amber-200/10 dark:border-border/10 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-700/80 dark:text-accent/80 tracking-widest uppercase block mb-0.5">Configuration</span>
                <h3 className="text-xl font-bold font-serif-header text-gray-900 dark:text-white">Display Settings</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewSettings(false)}
                className="h-9 w-9 rounded-full p-0 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-5">
              {/* Layout & Structure Section */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100/50 dark:border-border/10 pb-1">
                  Layout & Structure
                </div>
                {/* Reading Mode Segmented Select */}
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wide">Reading Layout</Label>
                  <div className="flex bg-gray-105 dark:bg-gray-800/80 p-0.5 rounded-xl border border-amber-200/20 dark:border-border/20 shadow-inner">
                    <button
                      type="button"
                      onClick={() => onReadingLayoutChange('verse')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        readingLayout === 'verse'
                          ? 'bg-white dark:bg-gray-700 text-amber-850 dark:text-accent shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Editorial List
                    </button>
                    <button
                      type="button"
                      onClick={() => onReadingLayoutChange('mushaf')}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        readingLayout === 'mushaf'
                          ? 'bg-white dark:bg-gray-700 text-amber-850 dark:text-accent shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      Continuous Mushaf
                    </button>
                  </div>
                </div>

                {/* Layout toggle only for desktop */}
                <div className="hidden lg:flex items-center justify-between py-1">
                  <Label className="text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wide">Spread Layout Mode</Label>
                  <Button variant="outline" size="sm" onClick={onToggleLayout} className="h-8.5 rounded-lg border-amber-200/40 dark:border-[#2C3440] font-sans text-xs">
                    {layoutMode === 'spread' ? <Minimize2 className="h-4 w-4 mr-1.5" /> : <Maximize2 className="h-4 w-4 mr-1.5" />}
                    <span className="font-semibold">{layoutMode === 'spread' ? 'Single Page' : 'Two-Page Spread'}</span>
                  </Button>
                </div>
              </div>

              {/* Typography Section */}
              <div className="space-y-3.5">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100/50 dark:border-border/10 pb-1">
                  Typography & Spacing
                </div>
                
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wide">Font Adjust Target</Label>
                  <Button
                    variant="outline"
                    onClick={onToggleFontTarget}
                    className={`h-8.5 rounded-lg text-xs font-semibold font-sans ${
                      fontTargetArabic 
                        ? 'bg-amber-500/10 text-amber-850 dark:bg-accent/15 dark:text-accent border-amber-400/40 dark:border-accent/40' 
                        : 'bg-blue-500/10 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-400/30 dark:border-blue-800/30'
                    }`}
                  >
                    {fontTargetArabic ? 'Arabic Text' : <><Languages className="h-3.5 w-3.5 mr-1.5" />Translation</>}
                  </Button>
                </div>

                <div className="space-y-2 py-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wide">Font Size</Label>
                    <span className="text-xs font-bold text-amber-700 dark:text-accent bg-amber-500/5 dark:bg-accent/10 px-2 py-0.5 rounded-full">{fontSize}px</span>
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
                    <Label className="text-xs font-bold text-gray-555 dark:text-gray-400 uppercase tracking-wide">Reading Side Margins</Label>
                    <span className="text-xs font-bold text-amber-700 dark:text-accent bg-amber-500/5 dark:bg-accent/10 px-2 py-0.5 rounded-full">{padding}px</span>
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

              {/* Display Options Section */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100/50 dark:border-border/10 pb-1">
                  Content Filters
                </div>

                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wide">Show Translations</Label>
                  <Switch
                    checked={showTranslation}
                    onCheckedChange={onToggleTranslation}
                  />
                </div>

                {onToggleHideMistakes && (
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wide">Hide Mistakes (Self-Test)</Label>
                    <Switch
                      checked={hideMistakes}
                      onCheckedChange={onToggleHideMistakes}
                    />
                  </div>
                )}

                {onToggleWordByWordTooltip && (
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wide">Word Translation Tooltips</Label>
                    <Switch
                      checked={showWordByWordTooltip}
                      onCheckedChange={onToggleWordByWordTooltip}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Audio Settings Modal */}
      {showReciterSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-[#FAF8F5]/95 dark:bg-[#12161A]/95 border border-amber-200/30 dark:border-border/30 rounded-2xl shadow-2xl p-6 animate-fade-in-up font-sans">
            <div className="flex items-center justify-between mb-4 border-b border-amber-200/10 dark:border-border/10 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-700/80 dark:text-accent/80 tracking-widest uppercase block mb-0.5">Audio Settings</span>
                <h3 className="text-xl font-bold font-serif-header text-gray-900 dark:text-white">Audio Selection</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReciterSelector(false)}
                className="h-9 w-9 rounded-full p-0 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-amber-500/5 dark:bg-gray-855/80 p-0.5 rounded-xl border border-amber-200/25 dark:border-[#2C3440] mb-4 shadow-inner">
              <button
                type="button"
                onClick={() => setAudioTab('reciters')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  audioTab === 'reciters'
                    ? 'bg-white dark:bg-[#12161A] text-amber-850 dark:text-accent shadow-sm border border-amber-200/10'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Reciters
              </button>
              <button
                type="button"
                onClick={() => setAudioTab('info')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  audioTab === 'info'
                    ? 'bg-white dark:bg-[#12161A] text-amber-850 dark:text-accent shadow-sm border border-amber-200/10'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Shortcuts & Info
              </button>
            </div>

            {audioTab === 'reciters' ? (
              <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                {reciters.map((reciter) => (
                  <Button
                    key={reciter.id}
                    variant="ghost"
                    className={`w-full justify-start h-12 rounded-xl px-4 text-left transition-all ${
                      selectedReciter === reciter.id 
                        ? 'bg-amber-500/10 dark:bg-accent/10 border border-amber-500/20 dark:border-accent/20 text-amber-900 dark:text-accent font-semibold' 
                        : 'hover:bg-amber-500/5 dark:hover:bg-[#181D23] text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      onReciterChange(reciter.id);
                      setShowReciterSelector(false);
                    }}
                  >
                    <span className="truncate text-xs font-semibold tracking-wide" title={reciter.name}>
                      {reciter.name}
                    </span>
                    {selectedReciter === reciter.id && (
                      <div className="ml-auto w-2 h-2 bg-amber-500 dark:bg-accent rounded-full flex-shrink-0" />
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              /* Audio Playback Info & Shortcuts Pane */
              <div className="space-y-4 text-xs">
                <div className="space-y-2 bg-amber-500/5 dark:bg-gray-800/30 p-3.5 rounded-xl border border-amber-200/20 dark:border-border/20">
                  <h4 className="font-semibold text-amber-900 dark:text-accent flex items-center">
                    <Info className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" /> Playback Controls
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                    When you play a verse, the bottom audio panel will appear. Use it to:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-gray-400 mt-1">
                    <li>Toggle <span className="font-semibold">Infinite Loop</span> to repeat the verse.</li>
                    <li>Set a <span className="font-semibold">Custom Loop Range</span> to repeat a specific duration segment.</li>
                    <li>Adjust <span className="font-semibold">Playback Speed</span> (0.5x to 2x) for slower/faster recitation.</li>
                  </ul>
                </div>

                <div className="space-y-2 border border-gray-100 dark:border-border/20 p-3.5 rounded-xl">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <Keyboard className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" /> Keyboard Shortcuts
                  </h4>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-1 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-border/30 rounded text-[10px] font-sans mr-2">Space</kbd> Play/Pause</div>
                    <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-border/30 rounded text-[10px] font-sans mr-2">Esc</kbd> Stop Audio</div>
                    <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-border/30 rounded text-[10px] font-sans mr-2">←</kbd> Rewind 10s</div>
                    <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-border/30 rounded text-[10px] font-sans mr-2">→</kbd> Forward 10s</div>
                    <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-border/30 rounded text-[10px] font-sans mr-2">↑</kbd> Vol Up</div>
                    <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-border/30 rounded text-[10px] font-sans mr-2">↓</kbd> Vol Down</div>
                    <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-border/30 rounded text-[10px] font-sans mr-2">M</kbd> Mark Start/End</div>
                    <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-border/30 rounded text-[10px] font-sans mr-2">[</kbd> Mark Start</div>
                    <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-border/30 rounded text-[10px] font-sans mr-2">]</kbd> Mark End</div>
                    <div className="flex items-center"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border dark:border-border/30 rounded text-[10px] font-sans mr-2">C</kbd> Clear Markers</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}