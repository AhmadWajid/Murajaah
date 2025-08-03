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
  X
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
  } = props;

  const [showViewSettings, setShowViewSettings] = useState(false);
  const [showReciterSelector, setShowReciterSelector] = useState(false);
  const [showSurahSelector, setShowSurahSelector] = useState(false);
  const [showAyahNavigator, setShowAyahNavigator] = useState(false);
  const [surahSearchTerm, setSurahSearchTerm] = useState('');
  const [selectedSurahForAyah, setSelectedSurahForAyah] = useState(currentSurah);
  const [selectedAyahNumber, setSelectedAyahNumber] = useState(1);

  const [mobileHeaderHidden, setMobileHeaderHidden] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mobileHeaderHidden');
      return saved === 'true';
    }
    return false;
  });

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
        const translations = await getLanguagesWithTranslations();
        // setAvailableTranslations(translations); // This line was removed as per the edit hint
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

  return (
    <>
      {/* Main content container */}
      <div className="flex items-center justify-between flex-1 min-w-0 overflow-hidden relative">
        {/* Center Section - Navigation Group */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-shrink-0 min-w-0 flex-1 justify-center">
          {/* Page Navigation - RTL Direction */}
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(layoutMode === 'spread' ? currentPage + 2 : currentPage + 1)}
              disabled={layoutMode === 'spread' ? currentPage >= totalPages - 1 : currentPage >= totalPages}
              className="h-7 w-7 md:h-8 md:w-8 p-0 flex-shrink-0 group"
              title="Next Page (Forward in Reading)"
            >
              <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4 group-hover:text-blue-600" />
            </Button>
            
            <div className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3 flex-shrink-0">
              <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Page</span>
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
                className="w-14 md:w-16 h-7 md:h-8 text-center text-xs md:text-sm flex-shrink-0 px-1"
              />
              <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">of {totalPages}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(layoutMode === 'spread' ? currentPage - 2 : currentPage - 1)}
              disabled={layoutMode === 'spread' ? currentPage <= 2 : currentPage <= 1}
              className="h-7 w-7 md:h-8 md:w-8 p-0 flex-shrink-0 group"
              title="Previous Page (Backward in Reading)"
            >
              <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 group-hover:text-blue-600" />
            </Button>
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
              className="h-8 md:h-9 px-2 md:px-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
              title={`Go to next mistake: Surah ${nextMistake?.surah} Ayah ${nextMistake?.ayah}`}
            >
              <svg className="w-3 h-3 md:w-4 md:h-4 md:mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="hidden lg:inline">Next Mistake</span>
            </Button>
          )}

          {/* Navigation Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSurahSelector(true)}
            className="h-8 md:h-9 px-2"
          >
            <BookOpen className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden lg:inline">Navigate</span>
          </Button>
        </div>

        {/* Right Section - Controls (Desktop Only) */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
          {/* View Settings */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowViewSettings(true)}
            className="h-8 md:h-9 px-1.5 md:px-2"
          >
            <Settings className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden lg:inline">View</span>
          </Button>
            
          {/* Reciter Selection */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReciterSelector(true)}
            className="h-8 md:h-9 px-1.5 md:px-2"
          >
            <Volume2 className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden lg:inline">Audio</span>
          </Button>

          {/* Add Review Button */}
          {onEnhancedMemorization && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEnhancedMemorization}
              className="h-8 md:h-9 px-1.5 md:px-2"
            >
              <Target className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
              <span className="hidden lg:inline">Add Review</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {!mobileHeaderHidden ? (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 z-40 shadow-md border-t border-gray-200 dark:border-gray-800">
          {/* Mobile Header Bar */}
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(layoutMode === 'spread' ? currentPage + 2 : currentPage + 1)}
                disabled={layoutMode === 'spread' ? currentPage >= totalPages - 1 : currentPage >= totalPages}
                className="h-8 w-8 p-0"
                title="Next Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              
              <div className="flex items-center space-x-1 min-w-0">
                <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">Page</span>
                <Input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) {
                      onPageChange(value);
                    }
                  }}
                  className="w-16 h-7 text-center text-xs flex-shrink-0 px-1"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">of {totalPages}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(layoutMode === 'spread' ? currentPage - 2 : currentPage - 1)}
                disabled={layoutMode === 'spread' ? currentPage <= 2 : currentPage <= 1}
                className="h-8 w-8 p-0"
                title="Previous Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center space-x-1">
              {/* Next Mistake Button - Mobile */}
              {hasNextMistake && onNavigateToNextMistake && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (nextMistake) {
                      onNavigateToNextMistake(nextMistake.surah, nextMistake.ayah);
                    }
                  }}
                  className="h-8 px-2 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                  title={`Next mistake: Surah ${nextMistake?.surah} Ayah ${nextMistake?.ayah}`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="px-2 sm:px-4 py-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSurahSelector(true)}
                className="h-8 px-2 sm:px-3"
                title="Navigate"
              >
                <BookOpen className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden min-[380px]:inline text-xs ml-1">Navigate</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowViewSettings(true)}
                className="h-8 px-2 sm:px-3"
                title="View Settings"
              >
                <Settings className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden min-[380px]:inline text-xs ml-1">View</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReciterSelector(true)}
                className="h-8 px-2 sm:px-3"
                title="Audio Settings"
              >
                <Volume2 className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden min-[380px]:inline text-xs ml-1">Audio</span>
              </Button>
              
              {onEnhancedMemorization && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEnhancedMemorization}
                  className="h-8 px-2 sm:px-3"
                  title="Add Review"
                >
                  <Target className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden min-[380px]:inline text-xs ml-1">Add Review</span>
                </Button>
              )}
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
          className="h-12 w-12 p-0 rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg border-2 hover:scale-110 transition-all duration-300"
          title={mobileHeaderHidden ? "Show navigation" : "Hide navigation"}
        >
          {mobileHeaderHidden ? (
            <Menu className="h-6 w-6 rotate-180 transition-transform duration-300" />
          ) : (
            <X className="h-6 w-6 transition-transform duration-300" />
          )}
        </Button>
      </div>

      {/* Navigation Modal */}
      {showSurahSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Navigation</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAyahNavigator(true)}
                    className="h-9 px-3"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Go to Ayah
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSurahSelector(false)}
                    className="h-9 w-9 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <Input
                type="text"
                placeholder="Search surahs..."
                value={surahSearchTerm}
                onChange={(e) => setSurahSearchTerm(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 max-h-96">
              <div className="space-y-2">
                {(() => {
                  const surahsToShow = surahSearchTerm 
                    ? surahList.filter(surah => 
                        surah.name.toLowerCase().includes(surahSearchTerm.toLowerCase()) ||
                        surah.number.toString().includes(surahSearchTerm)
                      )
                    : surahList;
                  
                  return surahsToShow.map((surah) => (
                    <Button
                      key={surah.number}
                      variant={surah.number === currentSurah && !surahSearchTerm ? "default" : "ghost"}
                      className="w-full justify-start h-auto p-4"
                      onClick={() => {
                        onSurahSelect(surah.number);
                        setShowSurahSelector(false);
                        setSurahSearchTerm('');
                      }}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <Badge 
                          variant={surah.number === currentSurah && !surahSearchTerm ? "secondary" : "outline"}
                          className="w-10 h-10 rounded-full p-0 flex items-center justify-center"
                        >
                          {surah.number}
                        </Badge>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{surah.name}</div>
                          <div className="text-sm text-gray-500">{surah.numberOfAyahs} ayahs</div>
                        </div>
                      </div>
                    </Button>
                  ));
                })()}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* View Settings Modal */}
      {showViewSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">View Settings</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowViewSettings(false)}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Layout toggle only for desktop */}
                <div className="hidden lg:flex items-center justify-between">
                  <Label className="text-sm">Layout</Label>
                  <Button variant="outline" size="sm" onClick={onToggleLayout}>
                    {layoutMode === 'spread' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Font Target</Label>
                  <Button
                    variant="outline"
                    onClick={onToggleFontTarget}
                    className={`${
                      fontTargetArabic 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    }`}
                  >
                    {fontTargetArabic ? 'Arabic' : <><Languages className="h-4 w-4 mr-2" />Translation</>}
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Font Size</Label>
                    <span className="text-sm text-gray-500">{fontSize}px</span>
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

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Padding</Label>
                    <span className="text-sm text-gray-500">{padding}px</span>
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

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Show Translation</Label>
                  <Switch
                    checked={showTranslation}
                    onCheckedChange={onToggleTranslation}
                  />
                </div>

                {onToggleHideMistakes && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Hide Mistakes</Label>
                    <Switch
                      checked={hideMistakes}
                      onCheckedChange={onToggleHideMistakes}
                    />
                  </div>
                )}

                {onToggleWordByWordTooltip && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Word Tooltip</Label>
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

      {/* Reciter Selection Modal */}
      {showReciterSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Select Reciter</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReciterSelector(false)}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {reciters.map((reciter) => (
                  <Button
                    key={reciter.id}
                    variant={selectedReciter === reciter.id ? "default" : "ghost"}
                    className="w-full justify-start h-12"
                    onClick={() => {
                      onReciterChange(reciter.id);
                      setShowReciterSelector(false);
                    }}
                  >
                    <span className="truncate" title={reciter.name}>
                      {reciter.name.length > 30 ? `${reciter.name.substring(0, 30)}...` : reciter.name}
                    </span>
                    {selectedReciter === reciter.id && (
                      <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Ayah Navigator Modal */}
      {showAyahNavigator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Go to Specific Ayah</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAyahNavigator(false)}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Surah</Label>
                  <Select
                    value={selectedSurahForAyah.toString()}
                    onValueChange={(value) => {
                      setSelectedSurahForAyah(parseInt(value));
                      setSelectedAyahNumber(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {surahList.map((surah) => (
                        <SelectItem key={surah.number} value={surah.number.toString()}>
                          {surah.number}. {surah.name} ({surah.numberOfAyahs} ayahs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Ayah Number</Label>
                  <Input
                    type="number"
                    value={selectedAyahNumber}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value)) {
                        setSelectedAyahNumber(value);
                      }
                    }}
                    min="1"
                    max={surahList.find(s => s.number === selectedSurahForAyah)?.numberOfAyahs || 1}
                    className="w-full"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAyahNavigator(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      onNavigateToAyah(selectedSurahForAyah, selectedAyahNumber);
                      setShowAyahNavigator(false);
                    }}
                  >
                    Go to Ayah
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
} 