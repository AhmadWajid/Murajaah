'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { TajweedWord } from '@/lib/tajweedService';
import { qpcFontLoader } from '@/lib/qpcFontLoader';
import { Tooltip } from 'react-tooltip';

interface TajweedAyahTextProps {
  ayahText: string;
  surahNumber: number;
  ayahNumber: number;
  className?: string;
  fontSize?: number;
  arabicFontSize?: number;
  translationFontSize?: number;
  fontTargetArabic?: boolean;
  pageNumber?: number; // Add page number prop
  hideWords?: boolean;
  hideWordsDelay?: number; // Add delay prop in milliseconds
  showWordTranslation?: boolean;
  wordByWordData?: any[];
  showWordByWordTooltip?: boolean;
}

export function TajweedAyahText({ 
  ayahText, 
  surahNumber, 
  ayahNumber, 
  className = '', 
  fontSize = 24,
  arabicFontSize = 24,
  translationFontSize = 20,
  fontTargetArabic = false,
  pageNumber,
  hideWords = false,
  hideWordsDelay = 500, // Default to 500ms
  showWordTranslation = false,
  wordByWordData = [],
  showWordByWordTooltip = true,
}: TajweedAyahTextProps) {
  const [tajweedWords, setTajweedWords] = useState<TajweedWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [hoveredRuleClass, setHoveredRuleClass] = useState<string | null>(null);
  // Track which word (by id) is currently hovered for tajweed
  const [hoveredTajweedWordId, setHoveredTajweedWordId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for delayed hide words feature
  const [visibleWordIds, setVisibleWordIds] = useState<Set<string>>(new Set());
  const wordTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      wordTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      wordTimeoutsRef.current.clear();
    };
  }, []);

  // Handlers for hide words delay feature
  const handleWordMouseEnter = (wordId: string, wordIndex: number) => {
    // Clear any existing timeout for this word
    if (wordTimeoutsRef.current.has(wordId)) {
      clearTimeout(wordTimeoutsRef.current.get(wordId)!);
      wordTimeoutsRef.current.delete(wordId);
    }
    
    // Show the word immediately
    setVisibleWordIds(prev => new Set(prev).add(wordId));
    
    // Hide all words that come after this one in the same ayah
    tajweedWords.forEach((word, index) => {
      if (index > wordIndex && word.surah === tajweedWords[wordIndex].surah && word.ayah === tajweedWords[wordIndex].ayah) {
        const laterWordId = String(word.id);
        
        // Clear any pending timeout for later words
        if (wordTimeoutsRef.current.has(laterWordId)) {
          clearTimeout(wordTimeoutsRef.current.get(laterWordId)!);
          wordTimeoutsRef.current.delete(laterWordId);
        }
        
        // Hide later words immediately
        setVisibleWordIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(laterWordId);
          return newSet;
        });
      }
    });
  };

  const handleWordMouseLeave = (wordId: string) => {
    if (hideWordsDelay > 0) {
      // Set timeout to hide word after delay
      const timeoutId = setTimeout(() => {
        setVisibleWordIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(wordId);
          return newSet;
        });
        wordTimeoutsRef.current.delete(wordId);
      }, hideWordsDelay);
      
      wordTimeoutsRef.current.set(wordId, timeoutId);
    } else {
      // Hide immediately if no delay
      setVisibleWordIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(wordId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const loadFont = async () => {
      const targetPage = pageNumber || 1;
      const fontUrl = `/fonts/QPC V2 Font.ttf/p${targetPage}.ttf`;
      try {
        await fetch(fontUrl, { method: 'HEAD' });
      } catch {}
      const loaded = await qpcFontLoader.loadPageFont(targetPage);
      setFontLoaded(loaded);
    };
    loadFont();
  }, [pageNumber]);

  const loadTajweedData = useCallback(async () => {
    if (!ayahText) {
      setTajweedWords([]);
      return;
    }
    setLoading(true);
    try {
      // Use the original tajweed endpoint
      const response = await fetch(`/api/tajweed?action=words&surah=${surahNumber}&ayah=${ayahNumber}`);
      const data = await response.json();
      setTajweedWords(data.words || []);
    } catch {
      setTajweedWords([]);
    } finally {
      setLoading(false);
    }
  }, [surahNumber, ayahNumber, ayahText]);

  useEffect(() => {
    loadTajweedData();
  }, [loadTajweedData]);

  // Always use arabicFontSize for Arabic text
  const currentFontSize = arabicFontSize;

  // Store tooltip data for rendering outside the text flow
  const tooltipData: Array<{ id: string; content: string; bgColor: string }> = [];

  // Always render with Tajweed highlighting
  const renderWordWithTajweed = (word: TajweedWord, index: number) => {
    // Find the translation for this word if available
    let translation = '';
    if (wordByWordData && wordByWordData.length > 0) {
      // Try to match by surah, ayah, and position (word.word is 1-based)
      let match = wordByWordData.find(
        (w) => w.surah === word.surah && w.ayah === word.ayah && (w.position === word.word)
      );
      // Fallback: match by ayah and index (nth word in ayah)
      if (!match) {
        const ayahWords = wordByWordData.filter(w => w.ayah === word.ayah);
        if (ayahWords && ayahWords.length > index) {
          match = ayahWords[index];
        }
      }
      if (match && match.translation) {
        translation = match.translation;
      }
    }

    // Handlers to set/clear hovered word for tajweed segments
    const handleTajweedMouseEnter = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setHoveredTajweedWordId(String(word.id));
    };
    const handleTajweedMouseLeave = () => {
      hoverTimeoutRef.current = setTimeout(() => setHoveredTajweedWordId(null), 80);
    };

    if (hideWords) {
      // Find the translation for this word if available
      let translation = '';
      if (wordByWordData && wordByWordData.length > 0) {
        // Try to match by surah, ayah, and position (word.word is 1-based)
        let match = wordByWordData.find(
          (w) => w.surah === word.surah && w.ayah === word.ayah && (w.position === word.word)
        );
        // Fallback: match by ayah and index (nth word in ayah)
        if (!match) {
          const ayahWords = wordByWordData.filter(w => w.ayah === word.ayah);
          if (ayahWords && ayahWords.length > index) {
            match = ayahWords[index];
          }
        }
        if (match && match.translation) {
          translation = match.translation;
        }
      }
      
      const wordId = String(word.id);
      const isWordVisible = visibleWordIds.has(wordId);
      
      return (
        <span
          key={word.id}
          className="inline-block transition-all duration-200 relative cursor-pointer"
          style={{ 
            fontSize: `${currentFontSize}px`,
            fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1, 'calt' 1, 'rlig' 1, 'ccmp' 1, 'locl' 1, 'mark' 1, 'mkmk' 1" : "'liga' 0, 'kern' 0, 'calt' 0, 'rlig' 0, 'ccmp' 0, 'locl' 0, 'mark' 0, 'mkmk' 0"
          }}
          onMouseEnter={() => handleWordMouseEnter(wordId, index)}
          onMouseLeave={() => handleWordMouseLeave(wordId)}
        >
          {/* Invisible text that takes up natural space */}
          <span 
            className="opacity-0" 
            style={{fontSize: `${currentFontSize}px`}}
          >
            {word.text}
          </span>
          
          {/* Overlay for hiding/showing */}
          <span
            className={`transition-opacity duration-200 absolute inset-0 flex items-center justify-center ${
              isWordVisible ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              backgroundColor: 'rgba(249, 250, 251, 0.9)',
              border: '1px dashed rgba(156, 163, 175, 0.6)',
              borderRadius: '3px'
            }}
          />
          
          {/* Visible text when revealed */}
          <span
            className={`transition-opacity duration-200 absolute inset-0 flex items-center justify-center ${
              isWordVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              fontSize: `${currentFontSize}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '3px'
            }}
          >
            {word.text}
          </span>
          
          {showWordByWordTooltip && translation && isWordVisible && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg transition-opacity whitespace-nowrap z-20">
              {translation}
            </span>
          )}
        </span>
      );
    }
    if (word.tajweedRules.length === 0) {
      // No tajweed rules, just render the word (with translation tooltip if enabled)
      if (showWordByWordTooltip && translation) {
        return (
          <span
            key={word.id}
            className="inline-block group relative cursor-pointer"
            style={{ fontSize: `${currentFontSize}px` }}
          >
            <span>{word.text}</span>
            {hoveredTajweedWordId !== String(word.id) && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                {translation}
              </span>
            )}
          </span>
        );
      }
      return (
        <span 
          key={word.id} 
          className="inline-block"
          style={{ 
            fontSize: `${currentFontSize}px`,
            fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1, 'calt' 1, 'rlig' 1, 'ccmp' 1, 'locl' 1, 'mark' 1, 'mkmk' 1" : "'liga' 0, 'kern' 0, 'calt' 0, 'rlig' 0, 'ccmp' 0, 'locl' 0, 'mark' 0, 'mkmk' 0"
          }}
        >
          {word.text}
        </span>
      );
    }
    // Render tajweed segments (with translation tooltip if enabled)
    const text = word.text;
    const rules = word.tajweedRules;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    const sortedRules = [...rules].sort((a, b) => a.startIndex - b.startIndex);
    sortedRules.forEach((rule, ruleIndex) => {
      // Add text before the rule
      if (rule.startIndex > lastIndex) {
        segments.push(
          <span 
            key={`text-${word.id}-${ruleIndex}`}
            style={{ 
              fontSize: `${currentFontSize}px`,
              fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1, 'calt' 1, 'rlig' 1, 'ccmp' 1, 'locl' 1, 'mark' 1, 'mkmk' 1" : "'liga' 0, 'kern' 0, 'calt' 0, 'rlig' 0, 'ccmp' 0, 'locl' 0, 'mark' 0, 'mkmk' 0"
            }}
          >
            {text.slice(lastIndex, rule.startIndex)}
          </span>
        );
      }

      // Add the rule text with tooltip trigger only
      const ruleColor = getTajweedColor(rule.class);
      const ruleDescription = getTajweedDescription(rule.class);
      const tooltipId = `tajweed-tooltip-${word.id}-${ruleIndex}`;
      const bgColor = ruleColorMap[rule.class] || '#222';
      // Collect tooltip data for later rendering
      tooltipData.push({ id: tooltipId, content: ruleDescription, bgColor });
      segments.push(
        <span
          key={`rule-${word.id}-${ruleIndex}`}
          className={ruleColor}
          data-tooltip-id={tooltipId}
          data-tooltip-content={ruleDescription}
          style={{ 
            fontSize: `${currentFontSize}px`,
            fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1, 'calt' 1, 'rlig' 1, 'ccmp' 1, 'locl' 1, 'mark' 1, 'mkmk' 1" : "'liga' 0, 'kern' 0, 'calt' 0, 'rlig' 0, 'ccmp' 0, 'locl' 0, 'mark' 0, 'mkmk' 0"
          }}
          onMouseEnter={handleTajweedMouseEnter}
          onMouseLeave={handleTajweedMouseLeave}
        >
          {rule.text}
        </span>
      );
      lastIndex = rule.endIndex;
    });
    if (lastIndex < text.length) {
      segments.push(
        <span 
          key={`text-${word.id}-end`}
          style={{ 
            fontSize: `${currentFontSize}px`,
            fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1, 'calt' 1, 'rlig' 1, 'ccmp' 1, 'locl' 1, 'mark' 1, 'mkmk' 1" : "'liga' 0, 'kern' 0, 'calt' 0, 'rlig' 0, 'ccmp' 0, 'locl' 0, 'mark' 0, 'mkmk' 0"
          }}
        >
          {text.slice(lastIndex)}
        </span>
      );
    }
    // If translation tooltip is enabled, wrap the whole word in a tooltip container
    if (showWordByWordTooltip && translation) {
      return (
        <span
          key={word.id}
          className="inline-block group relative cursor-pointer"
          style={{ fontSize: `${currentFontSize}px` }}
        >
          {segments}
          {hoveredTajweedWordId !== String(word.id) && (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
              {translation}
            </span>
          )}
        </span>
      );
    }
    // Default: just render the segments
    return (
      <span 
        key={word.id} 
        style={{ fontSize: `${currentFontSize}px` }}
      >
        {segments}
      </span>
    );
  };

  // Set a CSS variable for the tooltip background color
  const tooltipBgColor = hoveredRuleClass && ruleColorMap[hoveredRuleClass] ? ruleColorMap[hoveredRuleClass] : undefined;

  return (
    <div 
      className={`leading-loose text-amber-900 dark:text-amber-100 font-arabic arabic-text uthmanic-hafs ${className}`} 
      dir="rtl"
      style={{
        fontFamily: fontLoaded ? qpcFontLoader.getFontFamily(pageNumber || 1) : "'qpc-v2-fallback', 'Amiri', serif",
        fontSize: `${currentFontSize}px`,
        lineHeight: '2',
        textAlign: 'right',
        '--custom-font-size': `${currentFontSize}px`,
        fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1, 'calt' 1, 'rlig' 1, 'ccmp' 1, 'locl' 1, 'mark' 1, 'mkmk' 1" : "'liga' 0, 'kern' 0, 'calt' 0, 'rlig' 0, 'ccmp' 0, 'locl' 0, 'mark' 0, 'mkmk' 0",
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        // whiteSpace: 'nowrap', // Allow wrapping
        position: 'relative', // For absolute tooltips if needed
      } as React.CSSProperties}
    >
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-2 text-sm text-amber-600">Loading tajweed...</p>
        </div>
      ) : (
        tajweedWords.map((word, index) => (
          <React.Fragment key={word.id}>
            {renderWordWithTajweed(word, index)}
            {index < tajweedWords.length - 1 && <span className="mx-1"> </span>}
          </React.Fragment>
        ))
      )}
      {/* Render all tooltips at the end, outside the text flow */}
      {tooltipData.map(({ id, content, bgColor }) => (
        <Tooltip
          key={id}
          id={id}
          style={{
            backgroundColor: bgColor,
            color: isColorLight(bgColor) ? '#222' : '#fff',
            borderRadius: '0.375rem',
            padding: '0.25rem 0.5rem',
            fontSize: '0.875rem',
            zIndex: 9999,
            position: 'absolute',
          }}
        >
          {content}
        </Tooltip>
      ))}
    </div>
  );
}

// Helper functions for tajweed colors and descriptions
function getTajweedColor(ruleClass: string): string {
  const colors: Record<string, string> = {
    ham_wasl: 'text-red-500',
    laam_shamsiyah: 'text-yellow-600',
    madda_normal: 'text-green-500',
    madda_permissible: 'text-green-500',
    madda_necessary: 'text-green-600',
    slnt: 'text-gray-600',
    ghunnah: 'text-indigo-600',
    qalaqah: 'text-orange-600',
    ikhafa: 'text-purple-600',
    madda_obligatory_mottasel: 'text-green-600',
    madda_obligatory_monfasel: 'text-green-600',
    iqlab: 'text-teal-600',
    izhar: 'text-blue-500',
    idgham_ghunnah: 'text-blue-600',
    idgham_wo_ghunnah: 'text-blue-500',
    ikhafa_shafawi: 'text-purple-600',
    idgham_shafawi: 'text-blue-600',
    izhar_shafawi: 'text-blue-500',
    madd_al_tamkeen: 'text-green-500',
    tafkheem: 'text-red-600',
    tarqeeq: 'text-blue-400',
  };
  return colors[ruleClass] || 'text-gray-600';
}

function getTajweedDescription(ruleClass: string): string {
  const descriptions: Record<string, string> = {
    ham_wasl: 'Hamza Wasl - Silent hamza at the beginning of words',
    laam_shamsiyah: 'Laam Shamsiyah - Solar laam (assimilated)',
    madda_normal: 'Madda Normal - Natural prolongation',
    madda_permissible: 'Madda Permissible - Can be prolonged for 2-6 counts',
    madda_necessary: 'Madda Necessary - Must be prolonged for 4-5 counts',
    slnt: 'Silent - Letter is not pronounced',
    ghunnah: 'Ghunnah - Nasalization for 2 counts',
    qalaqah: 'Qalaqah - Bouncing sound on qalqalah letters (ق ط ب ج د)',
    ikhafa: 'Ikhafa - Partial hiding of noon/tanween',
    madda_obligatory_mottasel: 'Madda Obligatory Connected - Must be prolonged for 4-5 counts',
    madda_obligatory_monfasel: 'Madda Obligatory Separated - Must be prolonged for 4-5 counts',
    iqlab: 'Iqlab - Converting noon to meem when followed by ب',
    izhar: 'Izhar - Clear pronunciation of noon/tanween',
    idgham_ghunnah: 'Idgham with Ghunnah - Assimilation with nasalization',
    idgham_wo_ghunnah: 'Idgham without Ghunnah - Assimilation without nasalization',
    ikhafa_shafawi: 'Ikhafa Shafawi - Partial hiding with labial letters',
    idgham_shafawi: 'Idgham Shafawi - Assimilation with labial letters',
    izhar_shafawi: 'Izhar Shafawi - Clear pronunciation with labial',
    madd_al_tamkeen: 'Madd Al Tamkeen - Strengthening prolongation',
    tafkheem: 'Tafkheem - Heavy/thick pronunciation',
    tarqeeq: 'Tarqeeq - Light/thin pronunciation',
  };
  return descriptions[ruleClass] || ruleClass;
} 

// Map tajweed rule class to a hex color for tooltip backgrounds
const ruleColorMap: Record<string, string> = {
  ham_wasl: '#ef4444', // red-500
  laam_shamsiyah: '#f59e42', // yellow-500
  madda_normal: '#22c55e', // green-500
  madda_permissible: '#22c55e',
  madda_necessary: '#16a34a', // green-600
  slnt: '#6b7280', // gray-500
  ghunnah: '#6366f1', // indigo-500
  qalaqah: '#f97316', // orange-500
  ikhafa: '#a78bfa', // purple-400
  madda_obligatory_mottasel: '#16a34a',
  madda_obligatory_monfasel: '#16a34a',
  iqlab: '#14b8a6', // teal-500
  izhar: '#3b82f6', // blue-500
  idgham_ghunnah: '#2563eb', // blue-600
  idgham_wo_ghunnah: '#3b82f6',
  ikhafa_shafawi: '#a78bfa',
  idgham_shafawi: '#2563eb',
  izhar_shafawi: '#3b82f6',
  madd_al_tamkeen: '#22c55e',
  tafkheem: '#ef4444',
  tarqeeq: '#60a5fa', // blue-400
}; 

// Helper to determine if a hex color is light or dark
function isColorLight(hex: string): boolean {
  // Remove # if present
  hex = hex.replace('#', '');
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const r = parseInt(hex.substring(0,2), 16);
  const g = parseInt(hex.substring(2,4), 16);
  const b = parseInt(hex.substring(4,6), 16);
  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 180;
} 