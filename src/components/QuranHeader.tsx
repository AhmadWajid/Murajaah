'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Volume2, 
  BookOpen, 
  Plus, 
  Search,
  Maximize2,
  Minimize2,
  Languages,
  Target,
  Repeat,
  Repeat1,
  FastForward,
  XCircle,
  Info
} from 'lucide-react';
import { getLanguagesWithTranslations } from '@/lib/quranService';
import { loadFontSettings, saveFontSettings, getNextMistakeInVerseOrder } from '@/lib/storageService';
import { MistakeData } from '@/lib/supabase/database';

interface QuranHeaderProps {
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
  onEnhancedMemorization?: () => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  padding: number;
  onPaddingChange: (padding: number) => void;
  fontTargetArabic: boolean;
  onToggleFontTarget: () => void;
  hideMistakes?: boolean;
  onToggleHideMistakes?: () => void;
  hideWords?: boolean;
  onToggleHideWords?: () => void;
  hideWordsDelay?: number;
  onHideWordsDelayChange?: (delay: number) => void;
  selectedLanguage?: string;
  selectedTranslation?: string;
  onLanguageChange?: (language: string) => void;
  onTranslationChange?: (translation: string) => void;
  showWordByWordTooltip?: boolean;
  onToggleWordByWordTooltip?: () => void;
  currentAyah?: number;
  mistakes?: Record<string, boolean | MistakeData>;
  onNavigateToNextMistake?: (surahNumber: number, ayahNumber: number) => void;
  pageData?: any;
}

export default function QuranHeader({
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
  hideWords,
  onToggleHideWords,
  hideWordsDelay = 500,
  onHideWordsDelayChange,
  selectedLanguage = 'en',
  selectedTranslation = 'en.hilali',
  onLanguageChange,
  onTranslationChange,
  showWordByWordTooltip = true,
  onToggleWordByWordTooltip,
  currentAyah = 1,
  mistakes = {},
  onNavigateToNextMistake,
  pageData,
}: QuranHeaderProps) {
  const [showViewSettings, setShowViewSettings] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showSurahSelector, setShowSurahSelector] = useState(false);
  const [surahSearchTerm, setSurahSearchTerm] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [showAyahNavigator, setShowAyahNavigator] = useState(false);
  const [selectedSurahForAyah, setSelectedSurahForAyah] = useState(currentSurah);
  const [selectedAyahNumber, setSelectedAyahNumber] = useState(1);
  const [availableTranslations, setAvailableTranslations] = useState<Map<string, Array<{
    identifier: string;
    name: string;
    englishName: string;
    direction: string;
  }>>>(new Map());
  const surahListRef = useRef<HTMLDivElement>(null);

  // Get the next mistake in verse order
  const [nextMistake, setNextMistake] = useState<MistakeData | null>(null);
  
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
  const hasNextMistake = nextMistake !== null;

  // Language name mapping
  // Save translation settings
  const saveTranslationSettings = async (language: string, translation: string) => {
    try {
      const currentSettings = await loadFontSettings();
      const updatedSettings = {
        ...currentSettings,
        selectedLanguage: language,
        selectedTranslation: translation
      };
      await saveFontSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving translation settings:', error);
    }
  };

  const getLanguageName = (code: string) => {
    const languageNames: Record<string, string> = {
      'ar': 'Arabic',
      'en': 'English',
      'fr': 'French',
      'es': 'Spanish',
      'de': 'German',
      'tr': 'Turkish',
      'ur': 'Urdu',
      'fa': 'Persian',
      'bn': 'Bengali',
      'hi': 'Hindi',
      'id': 'Indonesian',
      'ms': 'Malay',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'pt': 'Portuguese',
      'it': 'Italian',
      'nl': 'Dutch',
      'pl': 'Polish',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'cs': 'Czech',
      'sk': 'Slovak',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'sr': 'Serbian',
      'sl': 'Slovenian',
      'et': 'Estonian',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'mt': 'Maltese',
      'ga': 'Irish',
      'cy': 'Welsh',
      'is': 'Icelandic',
      'fo': 'Faroese',
      'sq': 'Albanian',
      'mk': 'Macedonian',
      'bs': 'Bosnian',
      'me': 'Montenegrin',
      'am': 'Amharic',
      'az': 'Azerbaijani',
      'ber': 'Berber',
      'ce': 'Chechen',
      'dv': 'Divehi',
      'ha': 'Hausa',
      'ku': 'Kurdish',
      'ml': 'Malayalam',
      'ps': 'Pashto',
      'sd': 'Sindhi',
      'so': 'Somali',
      'sw': 'Swahili',
      'ta': 'Tamil',
      'tg': 'Tajik',
      'tt': 'Tatar',
      'ug': 'Uyghur',
      'uz': 'Uzbek'
    };
    return languageNames[code] || code.toUpperCase();
  };

  // Truncate long translator names to first 5 letters + "..." for button display only
  const truncateTranslatorName = (name: string) => {
    if (name.length <= 17) return name;
    return name.substring(0, 17) + '...';
  };

  // Close all modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is on a Select dropdown (Radix UI renders these outside the modal)
      const isOnSelectDropdown = target.closest('[data-radix-popper-content-wrapper]') || 
                                 target.closest('[data-radix-select-content]') ||
                                 target.closest('[role="option"]') ||
                                 target.closest('[data-state="open"]');
      
      // Check if click is outside all modal containers
      const isOutsideViewSettings = !target.closest('[data-modal="view-settings"]');
      const isOutsideAudioSettings = !target.closest('[data-modal="audio-settings"]');
      const isOutsideSurahSelector = !target.closest('[data-modal="surah-selector"]');
      const isOutsideActions = !target.closest('[data-modal="actions"]');
      // Check if click is outside the trigger buttons
      const isOutsideViewButton = !target.closest('[data-button="view-settings"]');
      const isOutsideAudioButton = !target.closest('[data-button="audio-settings"]');
      const isOutsideSurahButton = !target.closest('[data-button="surah-selector"]');
      const isOutsideActionsButton = !target.closest('[data-button="actions"]');
      
      if (showViewSettings && isOutsideViewSettings && isOutsideViewButton && !isOnSelectDropdown) {
        setShowViewSettings(false);
      }
      if (showAudioSettings && isOutsideAudioSettings && isOutsideAudioButton && !isOnSelectDropdown) {
        setShowAudioSettings(false);
      }
      if (showSurahSelector && isOutsideSurahSelector && isOutsideSurahButton && !isOnSelectDropdown) {
        setShowSurahSelector(false);
        setSurahSearchTerm('');
      }
      if (showActions && isOutsideActions && isOutsideActionsButton && !isOnSelectDropdown) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showViewSettings, showAudioSettings, showSurahSelector, showActions]);

  // Close other modals when opening a new one
  const openModal = (modalName: string) => {
    setShowViewSettings(false);
    setShowAudioSettings(false);
    setShowSurahSelector(false);
    setShowActions(false);
    setSurahSearchTerm('');
    
    switch (modalName) {
      case 'view-settings':
        setShowViewSettings(true);
        break;
      case 'audio-settings':
        setShowAudioSettings(true);
        break;
      case 'surah-selector':
        setShowSurahSelector(true);
        break;
      case 'actions':
        setShowActions(true);
        break;

    }
  };

  // Auto-scroll to current surah when dropdown opens
  useEffect(() => {
    if (showSurahSelector && !surahSearchTerm) {
      // Small delay to ensure the dropdown is rendered
      setTimeout(() => {
        const currentSurahButton = document.getElementById('current-surah-button');
        if (currentSurahButton && surahListRef.current) {
          currentSurahButton.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);
    }
  }, [showSurahSelector, currentSurah, surahSearchTerm]);

  // Load saved settings and fetch available translations on component mount
  useEffect(() => {
    const loadSettingsAndTranslations = async () => {
      try {
        // Load saved settings
        const savedSettings = await loadFontSettings();
        if (savedSettings.selectedLanguage && onLanguageChange) {
          onLanguageChange(savedSettings.selectedLanguage);
        }
        if (savedSettings.selectedTranslation && onTranslationChange) {
          onTranslationChange(savedSettings.selectedTranslation);
        }
        
        // Load available translations
        const translations = await getLanguagesWithTranslations();
        setAvailableTranslations(translations);
              } catch (error) {
          console.error('Error loading settings and translations:', error);
        }
    };
    
    loadSettingsAndTranslations();
  }, []);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Header */}
        <div className="flex items-center justify-between h-16 min-w-0">
          {/* Left Section - Brand & Navigation */}
          <div className="flex items-center space-x-6 flex-shrink-0">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 overflow-hidden">
                <Image 
                  src="/icon.svg" 
                  alt="Murajaah Logo" 
                  width={40} 
                  height={40} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Murajaah
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Quran Review & Memorization</div>
              </div>
            </Link>
          </div>

                    {/* Center Section - Navigation Group */}
          <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
            {/* Page Navigation - RTL Direction */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(layoutMode === 'spread' ? currentPage + 2 : currentPage + 1)}
                disabled={layoutMode === 'spread' ? currentPage >= totalPages - 1 : currentPage >= totalPages}
                className="h-8 w-8 p-0 flex-shrink-0 group"
                title="Next Page (Forward in Reading)"
              >
                <ChevronLeft className="h-4 w-4 group-hover:text-blue-600" />
              </Button>
              
              <div className="flex items-center space-x-2 px-3 flex-shrink-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Page</span>
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
                  className="w-16 h-8 text-center text-sm flex-shrink-0 px-1"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">of {totalPages}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(layoutMode === 'spread' ? currentPage - 2 : currentPage - 1)}
                disabled={layoutMode === 'spread' ? currentPage <= 2 : currentPage <= 1}
                className="h-8 w-8 p-0 flex-shrink-0 group"
                title="Previous Page (Backward in Reading)"
              >
                <ChevronRight className="h-4 w-4 group-hover:text-blue-600" />
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
                className="h-9 px-3 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                title={`Go to next mistake: Surah ${nextMistake?.surah} Ayah ${nextMistake?.ayah}`}
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="hidden sm:inline">Next Mistake</span>
              </Button>
            )}



            {/* Unified Navigation */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openModal('surah-selector')}
                className="h-9 px-2"
                data-button="surah-selector"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Navigate</span>
              </Button>
              
              {showSurahSelector && (
                <Card className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto shadow-lg border" data-modal="surah-selector">
                  <div className="p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium">Navigation</h3>
                                              <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAyahNavigator(true);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                        <Search className="h-3 w-3 mr-1" />
                        Go to Ayah
                      </Button>
                    </div>
                    
                    {/* Search input */}
                    <div className="mb-3">
                      <Input
                        type="text"
                        placeholder="Search surahs..."
                        value={surahSearchTerm}
                        onChange={(e) => setSurahSearchTerm(e.target.value)}
                        className="w-full"
                        autoFocus
                      />
                    </div>
                    
                    <div className="space-y-1" id="surah-list" ref={surahListRef}>
                      {(() => {
                        // Show all surahs, filtered by search if needed
                        const surahsToShow = surahSearchTerm 
                          ? surahList.filter(surah => 
                              surah.name.toLowerCase().includes(surahSearchTerm.toLowerCase()) ||
                              surah.number.toString().includes(surahSearchTerm)
                            )
                          : surahList;
                        
                        return (
                          <>
                            {surahSearchTerm && (
                              <div className="text-xs text-gray-500 mb-2 px-3 py-1">
                                Showing {surahsToShow.length} of {surahList.length} surahs
                              </div>
                            )}
                            {surahSearchTerm && surahsToShow.length === 0 && (
                              <div className="text-center text-gray-500 py-4">
                                No surahs found matching &quot;{surahSearchTerm}&quot;
                              </div>
                            )}
                            {surahSearchTerm && surahsToShow.length > 0 && (
                              <Button
                                variant="ghost"
                                className="w-full justify-start h-auto p-2 text-xs text-blue-600 dark:text-blue-400"
                                onClick={() => setSurahSearchTerm('')}
                              >
                                ← Clear search
                              </Button>
                            )}
                            {surahSearchTerm && surahsToShow.length > 0 && <Separator className="my-2" />}
                            {surahSearchTerm && surahsToShow.length > 0 && (
                              <div className="text-xs text-gray-500 mb-2 px-3 py-1">
                                Click surah to navigate, or use &quot;Go to Ayah&quot; for specific verse
                              </div>
                            )}
                            {surahsToShow.map((surah) => (
                              <Button
                                key={surah.number}
                                variant="ghost"
                                className={`w-full justify-start h-auto p-3 ${
                                  surah.number === currentSurah && !surahSearchTerm ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-l-blue-500' : ''
                                }`}
                                onClick={() => {
                                  onSurahSelect(surah.number);
                                  setShowSurahSelector(false);
                                  setSurahSearchTerm('');
                                }}
                                id={surah.number === currentSurah ? 'current-surah-button' : undefined}
                              >
                                <div className="flex items-center space-x-3 w-full">
                                  <Badge 
                                    variant={surah.number === currentSurah && !surahSearchTerm ? "default" : "secondary"} 
                                    className={`w-8 h-8 rounded-full p-0 flex items-center justify-center ${
                                      surah.number === currentSurah && !surahSearchTerm ? 'bg-blue-500' : ''
                                    }`}
                                  >
                                    {surah.number}
                                  </Badge>
                                  <div className="flex-1 text-left">
                                    <div className="text-sm font-medium">{surah.name}</div>
                                    <div className="text-xs text-gray-500">{surah.numberOfAyahs} ayahs</div>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </Card>
              )}
            </div>


          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* View Settings */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openModal('view-settings')}
                className="h-9 px-2"
                data-button="view-settings"
              >
                <Settings className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">View</span>
              </Button>
              
              {showViewSettings && (
                <Card className="absolute top-full right-0 mt-2 w-64 p-4 shadow-lg border" data-modal="view-settings">
                  <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Layout</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onToggleLayout();
                        }}
                      >
                        {layoutMode === 'spread' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {/* Font Target Toggle */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Font Target</Label>
                      <button
                        onClick={() => {
                          onToggleFontTarget();
                        }}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                          fontTargetArabic 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm' 
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 shadow-sm'
                        }`}
                      >
                        {fontTargetArabic ? (
                          <>
                            <span>Arabic</span>
                          </>
                        ) : (
                          <>
                            <Languages className="h-4 w-4" />
                            <span>Translation</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Font Size Slider */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Font Size</Label>
                      <div className="flex items-center space-x-2 w-32">
                        <Slider
                          min={16}
                          max={48}
                          step={1}
                          value={[fontSize]}
                          onValueChange={([size]) => onFontSizeChange(size)}
                        />
                        <span className="text-xs w-6 text-right">{fontSize}px</span>
                      </div>
                    </div>

                    {/* Padding Slider */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Verse Padding</Label>
                      <div className="flex items-center space-x-2 w-32">
                        <Slider
                          min={0}
                          max={64}
                          step={1}
                          value={[padding]}
                          onValueChange={([val]) => onPaddingChange(val)}
                        />
                        <span className="text-xs w-8 text-right">{padding}px</span>
                      </div>
                    </div>

                    {/* Show Translation Switch */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Show Translation</Label>
                      <Switch
                        checked={showTranslation}
                        onCheckedChange={onToggleTranslation}
                      />
                    </div>

                    {/* Translation Selector */}
                    <div className="space-y-2">
                      <Label className="text-sm">Translation</Label>
                      <Select
                        value={selectedLanguage}
                        onValueChange={(value) => {
                          if (onLanguageChange) {
                            onLanguageChange(value);
                          }
                          const translations = availableTranslations.get(value);
                          if (translations && translations.length > 0) {
                            const newTranslation = translations[0].identifier;
                            if (onTranslationChange) {
                              onTranslationChange(newTranslation);
                            }
                            saveTranslationSettings(value, newTranslation);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(availableTranslations.keys()).map(lang => (
                            <SelectItem key={lang} value={lang}>
                              {getLanguageName(lang)} - {availableTranslations.get(lang)?.length || 0} translations
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedLanguage && availableTranslations.has(selectedLanguage) && (availableTranslations.get(selectedLanguage)?.length || 0) > 0 && (
                        <Select
                          value={selectedTranslation}
                          onValueChange={(value) => {
                            if (onTranslationChange) {
                              onTranslationChange(value);
                            }
                            saveTranslationSettings(selectedLanguage, value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {truncateTranslatorName(availableTranslations.get(selectedLanguage)?.find(t => t.identifier === selectedTranslation)?.englishName || 'Unknown')}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableTranslations.get(selectedLanguage)?.map(translation => (
                              <SelectItem 
                                key={translation.identifier} 
                                value={translation.identifier}
                              >
                                {translation.englishName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      

                    </div>


                    {onToggleHideMistakes && (
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Hide Mistakes</Label>
                        <Switch
                          checked={hideMistakes}
                          onCheckedChange={() => {
                            onToggleHideMistakes();
                          }}
                        />
                      </div>
                    )}
                    {/* Hide Words Switch */}
                    {typeof hideWords !== 'undefined' && onToggleHideWords && (
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Hide Words</Label>
                        <Switch
                          checked={hideWords}
                          onCheckedChange={onToggleHideWords}
                        />
                      </div>
                    )}
                    
                    {/* Hide Words Delay Slider - Only show if hideWords is enabled */}
                    {typeof hideWords !== 'undefined' && hideWords && onHideWordsDelayChange && (
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Hide Delay</Label>
                        <div className="flex items-center space-x-2 w-32">
                          <Slider
                            min={0}
                            max={3000}
                            step={100}
                            value={[hideWordsDelay]}
                            onValueChange={([val]) => onHideWordsDelayChange(val)}
                          />
                          <span className="text-xs w-12 text-right">{hideWordsDelay}ms</span>
                        </div>
                      </div>
                    )}
                    {typeof showWordByWordTooltip !== 'undefined' && onToggleWordByWordTooltip && (
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Word-by-Word Tooltip</Label>
                        <Switch
                          checked={showWordByWordTooltip}
                          onCheckedChange={onToggleWordByWordTooltip}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
              
            {/* Audio Settings */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openModal('audio-settings')}
                className="h-9 px-2"
                data-button="audio-settings"
              >
                <Volume2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Audio</span>
              </Button>
              
              {showAudioSettings && (
                <Card className="absolute top-full right-0 mt-2 w-64 p-4 shadow-lg border" data-modal="audio-settings">
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <Label className="text-sm font-medium">Reciter</Label>
                    <Select
                      value={selectedReciter}
                      onValueChange={(value: string) => {
                        onReciterChange(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar.alafasy">Mishary Alafasy</SelectItem>
                        <SelectItem value="ar.abdurrahmaansudais">Abdur-Rahman As-Sudais</SelectItem>
                        <SelectItem value="ar.abdullahbasfar">Abdullah Basfar</SelectItem>
                        <SelectItem value="ar.abdulsamad">Abdul Samad</SelectItem>
                        <SelectItem value="ar.ahmedajamy">Ahmed ibn Ali al-Ajamy</SelectItem>
                        <SelectItem value="ar.aymanswoaid">Ayman Sowaid</SelectItem>
                        <SelectItem value="ar.hanirifai">Hani Rifai</SelectItem>
                        <SelectItem value="ar.hudhaify">Ali bin Abdur-Rahman Al-Hudhaify</SelectItem>
                        <SelectItem value="ar.husary">Mahmoud Khalil Al-Husary</SelectItem>
                        <SelectItem value="ar.husarymujawwad">Husary (Mujawwad)</SelectItem>
                        <SelectItem value="ar.ibrahimakhbar">Ibrahim Akhdar</SelectItem>
                        <SelectItem value="ar.mahermuaiqly">Maher Al Muaiqly</SelectItem>
                        <SelectItem value="ar.muhammadayyoub">Muhammad Ayyoub</SelectItem>
                        <SelectItem value="ar.muhammadjibreel">Muhammad Jibreel</SelectItem>
                        <SelectItem value="ar.parhizgar">Parhizgar</SelectItem>
                        <SelectItem value="ar.saoodshuraym">Saood bin Ibraaheem Ash-Shuraym</SelectItem>
                        <SelectItem value="ar.shaatree">Abu Bakr Ash-Shaatree</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* --- New Audio Features --- */}
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-700 space-y-3">
                      {/* Loop Mode */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-200">Loop</span>
                        <LoopSettings />
                      </div>
                      {/* Playback Speed */}
                      <div className="flex items-center gap-2">
                        <FastForward className="w-4 h-4 text-amber-700 dark:text-amber-200" />
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-200">Speed</span>
                        <SpeedSettings />
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Actions */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openModal('actions')}
                className="h-9 px-2"
                data-button="actions"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Actions</span>
              </Button>
              
              {showActions && (
                <Card className="absolute top-full right-0 mt-2 w-56 p-2 shadow-lg border" data-modal="actions">
                  <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                    {onEnhancedMemorization && (
                                              <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            onEnhancedMemorization();
                          }}
                        >
                        <Target className="h-4 w-4 mr-2" />
                        Add Review
                      </Button>
                    )}
                    


                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Page Navigation - RTL Direction */}
        <div className="lg:hidden py-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(layoutMode === 'spread' ? currentPage + 2 : currentPage + 1)}
              disabled={layoutMode === 'spread' ? currentPage >= totalPages - 1 : currentPage >= totalPages}
              title="Next Page (Forward in Reading)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Page</span>
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
                 className="w-16 h-8 text-center text-sm"
               />
               <span className="text-sm text-gray-600 dark:text-gray-400">of {totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(layoutMode === 'spread' ? currentPage - 2 : currentPage - 1)}
              disabled={layoutMode === 'spread' ? currentPage <= 2 : currentPage <= 1}
              title="Previous Page (Backward in Reading)"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          

        </div>
      </div>

      {/* Ayah Navigator Modal */}
      {showAyahNavigator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-modal="ayah-navigator">
          <Card className="max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Go to Specific Ayah</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAyahNavigator(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Surah Selection */}
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
              
              {/* Ayah Selection */}
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
                                     onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                   min="1"
                   max={surahList.find(s => s.number === selectedSurahForAyah)?.numberOfAyahs || 1}
                   placeholder="Enter ayah number"
                 />
                <p className="text-xs text-gray-500">
                  Max: {surahList.find(s => s.number === selectedSurahForAyah)?.numberOfAyahs || 1} ayahs
                </p>
              </div>
              
              {/* Action Buttons */}
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
                    
                    // Update URL with ayah parameter
                    const url = new URL(window.location.href);
                    url.searchParams.set('ayah', `${selectedSurahForAyah}:${selectedAyahNumber}`);
                    window.history.pushState({}, '', url.toString());
                  }}
                >
                  Go to Ayah
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </header>
  );
} 

// --- Helper Components for Modal State ---
function LoopSettings() {
  const getInitialLoopMode = (): 'none' | 'infinite' | 'custom' => {
    if (typeof window === 'undefined') return 'none';
    const val = localStorage.getItem('mquran_audio_loop_mode');
    if (val === 'none' || val === 'infinite' || val === 'custom') return val;
    return 'none';
  };
  const getInitialCustomLoop = () => {
    if (typeof window === 'undefined') return { start: 0, end: 0 };
    const stored = localStorage.getItem('mquran_audio_custom_loop');
    if (!stored) return { start: 0, end: 0 };
    try {
      return JSON.parse(stored);
    } catch {
      return { start: 0, end: 0 };
    }
  };
  const [loopMode, setLoopMode] = useState<'none' | 'infinite' | 'custom'>(getInitialLoopMode());
  const [customLoop, setCustomLoop] = useState<{ start: number; end: number }>(getInitialCustomLoop());
  const [showCustomLoopInputs, setShowCustomLoopInputs] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mquran_audio_loop_mode', loopMode);
    }
  }, [loopMode]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mquran_audio_custom_loop', JSON.stringify(customLoop));
    }
  }, [customLoop]);

  return (
    <div className="flex items-center gap-1 relative group flex-wrap">
      <button
        aria-label={
          loopMode === 'infinite'
            ? 'Infinite Loop Enabled'
            : loopMode === 'custom'
            ? 'Custom Loop Enabled'
            : 'Loop Off'
        }
        className={`p-1 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900 hover:bg-amber-100 dark:hover:bg-amber-800 transition-colors ${
          loopMode === 'infinite' || loopMode === 'custom' ? 'text-amber-700 dark:text-amber-200' : 'text-gray-400'
        }`}
        tabIndex={0}
        onClick={() => {
          setLoopMode((prev) =>
            prev === 'none' ? 'infinite' : prev === 'infinite' ? 'custom' : 'none'
          );
          setShowCustomLoopInputs(false);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            setLoopMode((prev) =>
              prev === 'none' ? 'infinite' : prev === 'infinite' ? 'custom' : 'none'
            );
            setShowCustomLoopInputs(false);
          }
        }}
      >
        {loopMode === 'infinite' ? (
          <Repeat1 className="w-4 h-4" />
        ) : loopMode === 'custom' ? (
          <Repeat className="w-4 h-4" />
        ) : (
          <Repeat className="w-4 h-4 opacity-40" />
        )}
      </button>
      <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 text-xs bg-amber-700 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {loopMode === 'infinite'
          ? 'Infinite Loop'
          : loopMode === 'custom'
          ? 'Custom Loop'
          : 'Loop Off'}
      </span>
      {loopMode === 'custom' && (
        <button
          aria-label="Set Custom Loop Range"
          className="ml-1 px-2 py-1 text-xs rounded bg-amber-200 dark:bg-amber-800 border border-amber-400 dark:border-amber-700 hover:bg-amber-300 dark:hover:bg-amber-700"
          onClick={() => setShowCustomLoopInputs(v => !v)}
        >
          Set Range
        </button>
      )}
      {showCustomLoopInputs && (
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded px-2 py-1 ml-2 max-w-full overflow-x-auto">
          <span>Start:</span>
          <input
            type="number"
            min={0}
            max={9999}
            value={customLoop.start}
            aria-label="Custom Loop Start (seconds)"
            onChange={e => setCustomLoop({ ...customLoop, start: Number(e.target.value) })}
            className="w-10 rounded px-1 py-0.5 border border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-900"
          />
          <span>End:</span>
          <input
            type="number"
            min={customLoop.start}
            max={9999}
            value={customLoop.end}
            aria-label="Custom Loop End (seconds)"
            onChange={e => setCustomLoop({ ...customLoop, end: Number(e.target.value) })}
            className="w-10 rounded px-1 py-0.5 border border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-900"
          />
          <button
            aria-label="Reset Custom Loop"
            className="ml-1 p-1 rounded-full bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-300"
            onClick={() => {
              setCustomLoop({ start: 0, end: 0 });
              setShowCustomLoopInputs(false);
              setLoopMode('none');
            }}
          >
            <XCircle className="w-4 h-4" />
          </button>
          <button
            aria-label="Done Setting Custom Loop"
            className="ml-1 px-2 py-0.5 rounded bg-amber-300 dark:bg-amber-700 text-xs hover:bg-amber-400 dark:hover:bg-amber-600"
            onClick={() => setShowCustomLoopInputs(false)}
          >
            Done
          </button>
          <span className="ml-2 text-amber-600 dark:text-amber-300" title="Set start and end in seconds"> <Info className="inline w-3 h-3" /> </span>
        </div>
      )}
    </div>
  );
}
function SpeedSettings() {
  // Load from localStorage on mount
  const getInitialSpeed = () => {
    if (typeof window === 'undefined') return 1;
    const stored = localStorage.getItem('mquran_audio_playback_speed');
    return stored ? Number(stored) : 1;
  };
  const [playbackSpeed, setPlaybackSpeed] = useState(getInitialSpeed());
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mquran_audio_playback_speed', String(playbackSpeed));
    }
  }, [playbackSpeed]);
  return (
    <select
      className="rounded px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
      value={playbackSpeed}
      aria-label="Playback Speed"
      onChange={e => setPlaybackSpeed(Number(e.target.value))}
    >
      <option value={0.5}>0.5x</option>
      <option value={0.75}>0.75x</option>
      <option value={1}>1x</option>
      <option value={1.25}>1.25x</option>
      <option value={1.5}>1.5x</option>
      <option value={2}>2x</option>
    </select>
  );
} 