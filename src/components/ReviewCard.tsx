'use client';

import { useState, useRef, useEffect } from 'react';
import { MemorizationItem, ReviewRating, RecallQuality } from '@/lib/spacedRepetition';
import { formatAyahRange, formatAyahRangeArabic } from '@/lib/quran';
import { getAyahRange, getAyahAudioUrl } from '@/lib/quranService';
import { updateMemorizationItem, updateMemorizationItemWithIndividualRating, getMemorizationItem } from '@/lib/storageService';

interface ReviewCardProps {
  item: MemorizationItem;
  onComplete: (updatedItem: MemorizationItem) => void;
  onViewInQuran?: () => void;
}

// Extended interface to include individual ayah ratings and recall quality
interface ExtendedMemorizationItem extends MemorizationItem {
  individualRatings?: Record<number, ReviewRating>;
  individualRecallQuality?: Record<number, RecallQuality>;
}

export default function ReviewCard({ item, onComplete, onViewInQuran }: ReviewCardProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showArabic, setShowArabic] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(-1);
  const [ayahData, setAyahData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [memorizationItem, setMemorizationItem] = useState<ExtendedMemorizationItem>({
    ...item,
    individualRatings: (item as any).individualRatings || {},
    individualRecallQuality: (item as any).individualRecallQuality || {}
  });
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  // Fetch ayah data from AlQuran.cloud API
  useEffect(() => {
    async function fetchAyahData() {
      try {
        setLoading(true);
        setError('');
        
        const arabicAyahs = await getAyahRange(item.surah, item.ayahStart, item.ayahEnd, 'quran-uthmani');
        const englishAyahs = await getAyahRange(item.surah, item.ayahStart, item.ayahEnd, 'en.asad');
        
        const combinedAyahs = arabicAyahs.map((arabicAyah, index) => ({
          ...arabicAyah,
          translation: englishAyahs[index]?.text || '',
        }));
        
        setAyahData(combinedAyahs);
        audioRefs.current = new Array(combinedAyahs.length).fill(null);
      } catch (err) {
        console.error('Error fetching ayah data:', err);
        setError('Failed to load Quran text. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchAyahData();
  }, [item.surah, item.ayahStart, item.ayahEnd]);

  // Set up audio event listeners for each ayah
  useEffect(() => {
    const audioElements = audioRefs.current;
    
    const cleanupAudio = (audio: HTMLAudioElement | null, index: number) => {
      if (!audio) return;
      
      const updateTime = () => {
        if (index === currentAudioIndex) {
          setCurrentTime(Math.floor(audio.currentTime * 100) / 100);
        }
      };

      const handlePlay = () => {
        if (index === currentAudioIndex) {
          setIsPlaying(true);
        }
      };

      const handlePause = () => {
        if (index === currentAudioIndex) {
          setIsPlaying(false);
        }
      };

      const handleEnded = () => {
        if (index === currentAudioIndex) {
          setIsPlaying(false);
          setCurrentAyahIndex(-1);
          setCurrentTime(0);
          setCurrentAudioIndex(-1);
        }
      };

      const handleError = (e: Event) => {
        console.error(`Audio error for ayah ${index + 1}:`, e);
        if (index === currentAudioIndex) {
          setAudioError(true);
          setIsPlaying(false);
        }
      };

      const handleLoadedMetadata = () => {
        if (index === currentAudioIndex) {
          setDuration(audio.duration || 0);
        }
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    };

    const cleanupFunctions = audioElements.map(cleanupAudio);

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup?.());
    };
  }, [currentAudioIndex]);

  // Add smooth progress updates
  useEffect(() => {
    if (!isPlaying || currentAudioIndex < 0) return;

    const interval = setInterval(() => {
      const audio = audioRefs.current[currentAudioIndex];
      if (audio && !audio.paused) {
        setCurrentTime(Math.floor(audio.currentTime * 100) / 100);
      }
    }, 100); // Update every 100ms for smooth progress

    return () => clearInterval(interval);
  }, [isPlaying, currentAudioIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if clicking on the dropdown button or dropdown content
      const target = e.target as Element;
      if (target.closest('.dropdown-container')) {
        return;
      }
      setOpenDropdown(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const playAyahAudio = async (index: number) => {
    if (currentAudioIndex >= 0 && audioRefs.current[currentAudioIndex]) {
      audioRefs.current[currentAudioIndex]?.pause();
    }

    setCurrentAudioIndex(index);
    setCurrentAyahIndex(index);
    setAudioError(false);
    setCurrentTime(0);

    const audio = audioRefs.current[index];
    if (audio) {
      // Set duration if already loaded
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      
      try {
        await audio.play();
      } catch (err) {
        console.error('Failed to play audio:', err);
        setAudioError(true);
      }
    }
  };

  const handlePlayPause = () => {
    if (currentAudioIndex >= 0 && audioRefs.current[currentAudioIndex]) {
      const audio = audioRefs.current[currentAudioIndex];
      if (isPlaying) {
        audio?.pause();
      } else {
        setAudioError(false);
        audio?.play().catch((err) => {
          console.error('Failed to play audio:', err);
          setAudioError(true);
        });
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentAudioIndex >= 0 && audioRefs.current[currentAudioIndex] && duration > 0) {
      const audio = audioRefs.current[currentAudioIndex];
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleAyahClick = (index: number) => {
    playAyahAudio(index);
  };

  const handleDropdownToggle = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setOpenDropdown(prev => prev === index ? null : index);
  };

  const handleIndividualRating = async (ayahIndex: number, rating: ReviewRating) => {
    console.log('Individual rating clicked:', { ayahIndex, rating, ayahData: ayahData[ayahIndex] });
    
    // Get the actual ayah number (not the index)
    const ayahNumber = ayahData[ayahIndex]?.numberInSurah;
    if (!ayahNumber) {
      console.error('No ayah number found for index:', ayahIndex);
      return;
    }
    
    try {
      // Use the individual ayah rating system
      await updateMemorizationItemWithIndividualRating(memorizationItem.id, ayahNumber, rating);
      
      // Reload the memorization item to get updated data
      const updatedItem = await getMemorizationItem(memorizationItem.id);
      if (updatedItem) {
        setMemorizationItem(updatedItem as ExtendedMemorizationItem);
      }
    } catch (error) {
      console.error('Error updating individual rating:', error);
    }
    
    setOpenDropdown(null);
    
    // Show feedback
    console.log(`✅ Rated ayah ${ayahNumber} as ${rating}`);
    
    // Show a visual feedback
    alert(`Rated Ayah ${ayahNumber} as ${rating}`);
  };

  const handleRecallQuality = (ayahIndex: number, quality: RecallQuality) => {
    console.log('Recall quality clicked:', { ayahIndex, quality, ayahData: ayahData[ayahIndex] });
    
    // Update the memorization item with recall quality
    const updatedItem: ExtendedMemorizationItem = {
      ...memorizationItem,
      individualRecallQuality: {
        ...memorizationItem.individualRecallQuality,
        [ayahIndex]: quality
      }
    };
    
    console.log('Updated item with recall quality:', updatedItem);
    
    try {
      // Save the updated item
      updateMemorizationItem(updatedItem);
      setMemorizationItem(updatedItem);
      setOpenDropdown(null);
      
      // Show feedback
      const qualityText = quality === 'perfect' ? 'Perfect (100%)' : 
                         quality === 'partial' ? 'Partial (75%)' : 
                         quality === 'hint-needed' ? 'Needed Hint' : 'Forgot';
      alert(`Marked Ayah ${ayahData[ayahIndex]?.numberInSurah} as: ${qualityText}`);
    } catch (error) {
      console.error('Error marking recall quality:', error);
      alert('Error marking recall quality. Please try again.');
    }
  };

  const formatTime = (time: number): string => {
    if (isNaN(time) || time === 0) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRating = async (rating: ReviewRating) => {
    try {
      // For overall rating, we need to rate all ayahs in the range with the same rating
      // This simulates rating the entire passage as one unit
      const ayahNumbers = ayahData.map(ayah => ayah.numberInSurah);
      
      // Rate each ayah individually with the same rating
      for (const ayahNumber of ayahNumbers) {
        await updateMemorizationItemWithIndividualRating(memorizationItem.id, ayahNumber, rating);
      }
      
      // Get the updated item after all ratings are applied
      const updatedItem = await getMemorizationItem(memorizationItem.id);
      if (updatedItem) {
        onComplete(updatedItem);
      } else {
        console.error('Failed to get updated item after rating');
      }
    } catch (error) {
      console.error('Error handling rating:', error);
    }
  };

  const getAyahRating = (ayahIndex: number): ReviewRating | null => {
    return memorizationItem.individualRatings?.[ayahIndex] || null;
  };

  const getAyahRecallQuality = (ayahIndex: number): RecallQuality | null => {
    return memorizationItem.individualRecallQuality?.[ayahIndex] || null;
  };

  const renderArabicText = (text: string, index: number) => {
    if (!showArabic) return null;
    
    const isCurrentAyah = index === currentAyahIndex;
    const ayahRating = getAyahRating(index);
    
    return (
      <div className="relative">
        <div 
          className={`arabic-text text-2xl sm:text-3xl lg:text-4xl leading-relaxed sm:leading-loose mb-4 sm:mb-6 text-gray-900 dark:text-white text-right cursor-pointer transition-all duration-200 ${
            isCurrentAyah 
              ? 'bg-blue-50 dark:bg-blue-900/30 p-2 sm:p-4 rounded-xl border-l-4 border-blue-500 shadow-sm' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 sm:p-4 rounded-xl'
          }`}
          onClick={() => handleAyahClick(index)}
        >
          {text}
          <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex flex-col gap-1">
            {ayahRating && (
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                ayahRating === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                ayahRating === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {ayahRating}
              </span>
            )}
            {getAyahRecallQuality(index) && (
              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                getAyahRecallQuality(index) === 'perfect' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                getAyahRecallQuality(index) === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                getAyahRecallQuality(index) === 'hint-needed' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {getAyahRecallQuality(index) === 'perfect' ? '✅' :
                 getAyahRecallQuality(index) === 'partial' ? '🔄' :
                 getAyahRecallQuality(index) === 'hint-needed' ? '💡' : '❌'}
              </span>
            )}
          </div>
        </div>
        
        {/* Options dropdown */}
        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 z-20 dropdown-container">
          <button
            onClick={(e) => handleDropdownToggle(e, index)}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          <div 
            className={`absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 min-w-[180px] sm:min-w-[200px] dropdown-container transition-all duration-200 ${
              openDropdown === index 
                ? 'opacity-100 visible' 
                : 'opacity-0 invisible'
            }`}
          >
            <div className="py-1">
              {/* Difficulty Rating Section */}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                Difficulty Rating
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleIndividualRating(index, 'easy');
                }}
                className="w-full px-3 py-2 text-left text-xs sm:text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                Easy
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleIndividualRating(index, 'medium');
                }}
                className="w-full px-3 py-2 text-left text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
              >
                Medium
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleIndividualRating(index, 'hard');
                }}
                className="w-full px-3 py-2 text-left text-xs sm:text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Hard
              </button>
              
              {/* Recall Quality Section */}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mt-2">
                Recall Quality
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRecallQuality(index, 'perfect');
                }}
                className="w-full px-3 py-2 text-left text-xs sm:text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                ✅ Perfect (100%)
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRecallQuality(index, 'partial');
                }}
                className="w-full px-3 py-2 text-left text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
              >
                🔄 Partial (75%)
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRecallQuality(index, 'hint-needed');
                }}
                className="w-full px-3 py-2 text-left text-xs sm:text-sm text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
              >
                💡 Needed Hint
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRecallQuality(index, 'forgot');
                }}
                className="w-full px-3 py-2 text-left text-xs sm:text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                ❌ Forgot
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTranslation = (translation: string, index: number) => {
    if (!showTranslation) return null;
    
    const isCurrentAyah = index === currentAyahIndex;
    
    return (
      <div 
        className={`text-lg sm:text-xl leading-relaxed mb-4 sm:mb-6 text-gray-700 dark:text-gray-300 cursor-pointer transition-all duration-200 ${
          isCurrentAyah 
            ? 'bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-4 rounded-xl border-l-4 border-blue-400' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/30 p-2 sm:p-4 rounded-xl'
        }`}
        onClick={() => handleAyahClick(index)}
      >
        {translation}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading Quran text...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Review: {formatAyahRange(item.surah, item.ayahStart, item.ayahEnd)}
            </h1>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {formatAyahRangeArabic(item.surah, item.ayahStart, item.ayahEnd)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <span>Reviews: {memorizationItem.reviewCount}</span>
                              <span>Next: {(() => {
                  // Parse the date string into components and create a local date object
                  const [year, month, day] = memorizationItem.nextReview.split('-').map(Number);
                  const localNextReviewDate = new Date(year, month - 1, day); // month - 1 because months are 0-indexed
                  return localNextReviewDate.toLocaleDateString();
                })()}</span>
            </div>
            {onViewInQuran && (
              <button
                onClick={onViewInQuran}
                className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden sm:inline">View in Quran</span>
                <span className="sm:hidden">View</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-8 max-w-4xl mx-auto w-full pb-16 sm:pb-24">
        {/* Display Controls */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-8">
          <button
            onClick={() => setShowArabic(!showArabic)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              showArabic 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showArabic ? 'Hide' : 'Show'} Arabic
          </button>
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              showTranslation 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showTranslation ? 'Hide' : 'Show'} Translation
          </button>
        </div>

        {/* Instructions */}
        <div className="mb-4 sm:mb-8 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> Click on any verse to play its individual audio and highlight it. 
            Use the options menu (⋮) on each verse to rate difficulty and mark recall quality. 
            Individual ratings are saved with the main item.
          </p>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            <strong>Recall Quality:</strong> ✅ Perfect (100%) | 🔄 Partial (75%) | 💡 Needed Hint | ❌ Forgot
          </div>
        </div>

        {/* Quran Text */}
        <div className="mb-4 sm:mb-8">
          {ayahData.map((ayah, index) => (
            <div key={index} className="mb-4 sm:mb-8">
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 font-medium">
                Ayah {ayah.numberInSurah}
              </div>
              {renderArabicText(ayah.text, index)}
              {renderTranslation(ayah.translation, index)}
              
              {/* Hidden audio element for each ayah */}
              <audio
                ref={(el) => {
                  audioRefs.current[index] = el;
                }}
                src={getAyahAudioUrl(item.surah, ayah.numberInSurah)}
                preload="metadata"
                className="hidden"
                onError={() => {
                  if (index === currentAudioIndex) {
                    setAudioError(true);
                  }
                }}
                onLoadedMetadata={() => {
                  if (index === currentAudioIndex && audioRefs.current[index]) {
                    setDuration(audioRefs.current[index]!.duration || 0);
                  }
                }}
              />
            </div>
          ))}
        </div>

        {/* Review Rating */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-8">
          <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 text-gray-900 dark:text-white">
            How well did you remember this entire passage?
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => handleRating('hard')}
              className="flex-1 py-3 sm:py-4 px-4 sm:px-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium text-sm sm:text-base"
            >
              Hard
            </button>
            <button
              onClick={() => handleRating('medium')}
              className="flex-1 py-3 sm:py-4 px-4 sm:px-6 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-xl border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors font-medium text-sm sm:text-base"
            >
              Medium
            </button>
            <button
              onClick={() => handleRating('easy')}
              className="flex-1 py-3 sm:py-4 px-4 sm:px-6 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors font-medium text-sm sm:text-base"
            >
              Easy
            </button>
          </div>
        </div>
      </main>

      {/* Sticky Audio Player Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-2 sm:py-4 shadow-lg">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Current Time */}
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-mono min-w-[40px] sm:min-w-[60px]">
            {formatTime(currentTime)}
          </div>

          {/* Progress Bar */}
          <div className="flex-1 mx-2 sm:mx-6">
            <div 
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 sm:h-1.5 relative cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={handleProgressClick}
            >
              <div 
                className="bg-blue-500 h-1 sm:h-1.5 rounded-full transition-all duration-100 ease-out relative"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              >
                {/* Progress handle */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full shadow-sm opacity-0 hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          </div>

          {/* Total Duration */}
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-mono min-w-[40px] sm:min-w-[60px]">
            {formatTime(duration)}
          </div>

          {/* Audio Controls */}
          <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-6">
            <button
              onClick={handlePlayPause}
              disabled={audioError}
              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                audioError 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {audioError && (
              <span className="text-xs text-red-500 dark:text-red-400">
                Audio unavailable
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
} 