'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TajweedWord, TAJWEED_COLORS, TOPIC_TAILWIND_COLORS, TOPIC_COLORS, getTajweedTooltip } from '@/lib/tajweedService';
import { qpcFontLoader } from '@/lib/qpcFontLoader';
import { Tooltip } from 'react-tooltip';
import { useTajweedCache } from '@/lib/hooks/useTajweedCache';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface TajweedAyahTextProps {
  ayahText: string;
  surahNumber: number;
  ayahNumber: number;
  className?: string;
  fontSize?: number;
  arabicFontSize?: number;
  translationFontSize?: number;
  fontTargetArabic?: boolean;
  pageNumber?: number;
  hideWords?: boolean;
  hideWordsDelay?: number;
  showWordTranslation?: boolean;
  wordByWordData?: any[];
  showWordByWordTooltip?: boolean;
  disableTajweedColors?: boolean;
  displayMode?: 'block' | 'inline';
  useV4Tajweed?: boolean;
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
  hideWordsDelay = 500,
  showWordTranslation = false,
  wordByWordData = [],
  showWordByWordTooltip = true,
  disableTajweedColors = false,
  displayMode = 'block',
  useV4Tajweed = false,
}: TajweedAyahTextProps) {
  const Tag = displayMode === 'inline' ? 'span' : 'div';
  const isMobile = useIsMobile();
  const { getTajweedWords, isTajweedLoading } = useTajweedCache();
  const [tajweedWords, setTajweedWords] = useState<TajweedWord[]>([]);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [hoveredTajweedWordId, setHoveredTajweedWordId] = useState<string | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // State for delayed hide words feature
  const [visibleWordIds, setVisibleWordIds] = useState<Set<string>>(new Set());
  const wordTimeoutsRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  // State for mobile click-to-show tooltips
  const [clickedWordId, setClickedWordId] = useState<string | null>(null);

  // Track mounted state for portal rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
    }
  }, []);

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      wordTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      wordTimeoutsRef.current.clear();
    };
  }, []);

  // Handle clicking outside to close mobile tooltip
  useEffect(() => {
    if (isMobile && clickedWordId) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        // Check if the click is outside the tooltip and word
        if (!target.closest('[data-word-tooltip]')) {
          setClickedWordId(null);
        }
      };
      
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobile, clickedWordId]);

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
    try {
      // Use optimized tajweed cache
      const words = await getTajweedWords(surahNumber, ayahNumber);
      setTajweedWords(words as unknown as TajweedWord[]);
    } catch {
      setTajweedWords([]);
    }
  }, [surahNumber, ayahNumber, ayahText, getTajweedWords]);

  useEffect(() => {
    if (!ayahText) {
      setTajweedWords([]);
      return;
    }

    if (hideWords) {
      // Construct plain words synchronously for immediate hide-words UI
      const plainWords = ayahText.split(/\s+/).map((wordText, idx) => ({
        id: surahNumber * 1000000 + ayahNumber * 1000 + idx,
        location: `${surahNumber}:${ayahNumber}:${idx + 1}`,
        surah: surahNumber,
        ayah: ayahNumber,
        word: idx + 1,
        text: wordText,
        tajweedRules: []
      })) as unknown as TajweedWord[];
      setTajweedWords(plainWords);

      // Load tajweed data from the DB (source of truth for word boundaries
      // and tajweed rules). The API text and DB can have different word
      // splits (e.g. the API may split a word + its stopping mark into two
      // "words" while the DB keeps them as one), so merging by index breaks.
      // Instead, replace the plain words entirely with DB words so the verse
      // marker (e.g. "٧٦") is consistently hidden/revealed like all other
      // words.
      const loadAndReplace = async () => {
        try {
          const words = await getTajweedWords(surahNumber, ayahNumber);
          if (words && words.length > 0) {
            setTajweedWords(words as unknown as TajweedWord[]);
          }
        } catch {
          // Keep plain words on error
        }
      };
      loadAndReplace();
    } else {
      loadTajweedData();
    }
  }, [hideWords, ayahText, loadTajweedData, surahNumber, ayahNumber, getTajweedWords]);

  // Always use arabicFontSize for Arabic text
  const currentFontSize = arabicFontSize;

  // Store tooltip data for rendering outside the text flow
  const tooltipData: Array<{ id: string; content: string; bgColor: string }> = [];
  const translationTooltipData: Array<{ id: string; content: string; wordId: string }> = [];

  // Combining marks that attach to the PRECEDING base letter.
  // Splitting them into a separate <span> detaches them from their base.
  const isCombiningMark = (ch: string) =>
    /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED]/.test(ch);

  // Tatweel (ـ U+0640) is a JOINING character — it connects letters horizontally.
  const isTatweel = (ch: string) => ch === '\u0640';

  // A rule is "mark-only" if it contains no base letters — just tatweel + combining marks.
  // These rules are rendered as absolutely positioned overlays to avoid breaking text shaping.
  const isMarkOnly = (text: string) =>
    text.length > 0 && [...text].every(ch => isCombiningMark(ch) || isTatweel(ch));

  // When a rule starts with a combining mark, pull the last base letter (+ its
  // attached marks) from the preceding text into the rule span.
  const splitBeforeBaseLetter = (beforeText: string): [string, string] => {
    let splitAt = beforeText.length;
    for (let i = beforeText.length - 1; i >= 0; i--) {
      if (!isCombiningMark(beforeText[i])) {
        splitAt = i;
        break;
      }
    }
    return [beforeText.slice(0, splitAt), beforeText.slice(splitAt)];
  };

  // When a rule starts with tatweel, pull the first base letter from the
  // FOLLOWING text into the rule span so the tatweel can connect forward.
  const splitAfterNextBaseLetter = (afterText: string): [string, string] => {
    if (!afterText) return ['', ''];
    let splitAt = 0;
    // Skip the first base letter and any combining marks attached to it
    for (let i = 0; i < afterText.length; i++) {
      if (!isCombiningMark(afterText[i]) && !isTatweel(afterText[i])) {
        // Found first base letter — include it and any following combining marks
        splitAt = i + 1;
        while (splitAt < afterText.length && isCombiningMark(afterText[splitAt])) {
          splitAt++;
        }
        break;
      }
    }
    return [afterText.slice(0, splitAt), afterText.slice(splitAt)];
  };

  // Render tajweed-colored segments for a word (no tooltips — used in hide-words overlay)
  const renderTajweedColoredText = (word: TajweedWord) => {
    if (!word.tajweedRules || word.tajweedRules.length === 0) {
      return word.text;
    }
    const text = word.text;
    const rules = word.tajweedRules;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    const sortedRules = [...rules].sort((a, b) => a.startIndex - b.startIndex);
    sortedRules.forEach((rule, ruleIndex) => {
      const ruleColor = getTajweedColor(rule.class);
      const firstChar = rule.text[0];
      const ruleStartsWithCombining = firstChar && isCombiningMark(firstChar);
      const markOnly = isMarkOnly(rule.text);

      if (rule.startIndex > lastIndex) {
        const beforeText = text.slice(lastIndex, rule.startIndex);
        if (markOnly) {
          // Mark-only rule: keep in text flow as plain text to preserve shaping
          segments.push(
            <span key={`text-${word.id}-${ruleIndex}`} style={{ fontSize: `${currentFontSize}px` }}>
              {beforeText}{rule.text}
            </span>
          );
        } else if (ruleStartsWithCombining && beforeText.length > 0) {
          // Combining mark: pull last base letter from BEFORE into rule span
          const [textBeforeBase, baseWithMarks] = splitBeforeBaseLetter(beforeText);
          if (textBeforeBase) {
            segments.push(
              <span key={`text-${word.id}-${ruleIndex}`} style={{ fontSize: `${currentFontSize}px` }}>
                {textBeforeBase}
              </span>
            );
          }
          segments.push(
            <span key={`rule-${word.id}-${ruleIndex}`} className={ruleColor} style={{ fontSize: `${currentFontSize}px` }}>
              {baseWithMarks}{rule.text}
            </span>
          );
        } else {
          segments.push(
            <span key={`text-${word.id}-${ruleIndex}`} style={{ fontSize: `${currentFontSize}px` }}>
              {beforeText}
            </span>
          );
          segments.push(
            <span key={`rule-${word.id}-${ruleIndex}`} className={ruleColor} style={{ fontSize: `${currentFontSize}px` }}>
              {rule.text}
            </span>
          );
        }
      } else {
        segments.push(
          <span key={`rule-${word.id}-${ruleIndex}`} className={ruleColor} style={{ fontSize: `${currentFontSize}px` }}>
            {rule.text}
          </span>
        );
      }
      lastIndex = rule.endIndex;
    });
    if (lastIndex < text.length) {
      segments.push(
        <span key={`text-${word.id}-end`} style={{ fontSize: `${currentFontSize}px` }}>
          {text.slice(lastIndex)}
        </span>
      );
    }
    return segments;
  };

  // Always render with Tajweed highlighting
  const renderWordWithTajweed = (word: TajweedWord, index: number) => {
    // Find the translation for this word if available and feature is enabled
    let translation = '';
    if (showWordByWordTooltip && wordByWordData && Array.isArray(wordByWordData) && wordByWordData.length > 0) {
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

    // Handle word click for mobile tooltip
    const handleWordClick = (e: React.MouseEvent) => {
      if (isMobile && showWordByWordTooltip && translation) {
        e.stopPropagation(); // Prevent ayah selection
        const wordId = String(word.id);
        setClickedWordId(clickedWordId === wordId ? null : wordId);
      }
    };

    // Handlers to set/clear hovered word for tajweed segments
    const handleTajweedMouseEnter = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setHoveredTajweedWordId(String(word.id));
    };
    const handleTajweedMouseLeave = () => {
      hoverTimeoutRef.current = setTimeout(() => setHoveredTajweedWordId(null), 80);
    };

    // V4 rendering is disabled — using span-based coloring with combining mark fix
    if (hideWords) {
      // Find the translation for this word if available
      let translation = '';
      if (showWordByWordTooltip && wordByWordData && Array.isArray(wordByWordData) && wordByWordData.length > 0) {
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
      const translationTooltipId = `translation-tooltip-${word.id}`;
      
      if (showWordByWordTooltip && translation) {
        translationTooltipData.push({ id: translationTooltipId, content: translation, wordId });
      }
      
      return (
        <span
          key={word.id}
          className="inline relative cursor-pointer"
          style={{
            fontSize: `${currentFontSize}px`,
            fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1, 'calt' 1, 'rlig' 1, 'ccmp' 1, 'locl' 1, 'mark' 1, 'mkmk' 1" : "'liga' 0, 'kern' 0, 'calt' 0, 'rlig' 0, 'ccmp' 0, 'locl' 0, 'mark' 0, 'mkmk' 0"
          }}
          onMouseEnter={() => handleWordMouseEnter(wordId, index)}
          onMouseLeave={() => handleWordMouseLeave(wordId)}
          data-tooltip-id={showWordByWordTooltip && translation ? translationTooltipId : undefined}
          data-word-tooltip
        >
          {/* The word itself — always rendered as inline text so Arabic
              ligature shaping works identically to non-hide mode.
              Opacity is toggled to hide/reveal. No flex, no absolute
              positioning on the text (those break letter connections). */}
          <span
            className={`transition-opacity duration-200 ${
              isWordVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ fontSize: `${currentFontSize}px` }}
          >
            {renderTajweedColoredText(word)}
          </span>

          {/* Dashed border placeholder — shown when word is hidden.
              Absolutely positioned so it doesn't affect text flow. */}
          {!isWordVisible && (
            <span
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: 'transparent',
                border: '1px dashed rgba(156, 163, 175, 0.6)',
                borderRadius: '3px'
              }}
            />
          )}
        </span>
      );
    }

    // Non-Safari: render per-segment coloring
    if (word.tajweedRules.length === 0) {
      // No tajweed rules, just render the word (with translation tooltip if enabled)
      if (showWordByWordTooltip && translation) {
        const wordId = String(word.id);
        const shouldShowTooltip = isMobile ? clickedWordId === wordId : hoveredTajweedWordId !== wordId;
        const translationTooltipId = `translation-tooltip-${word.id}`;
        
        if (shouldShowTooltip) {
          translationTooltipData.push({ id: translationTooltipId, content: translation, wordId });
        }
        
        return (
          <span
            key={word.id}
            className={`inline ${isMobile ? 'cursor-pointer' : ''}`}
            style={{ fontSize: `${currentFontSize}px` }}
            onClick={handleWordClick}
            data-tooltip-id={shouldShowTooltip ? translationTooltipId : undefined}
            data-word-tooltip
          >
            <span>{word.text}</span>
          </span>
        );
      }
      return (
        <span 
          key={word.id} 
          className="inline"
          style={{ fontSize: `${currentFontSize}px` }}
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
      // Add the rule text with tooltip trigger only
      const ruleColor = getTajweedColor(rule.class);
      const ruleDescription = getTajweedDescriptionHtml(rule);
      const tooltipId = `tajweed-tooltip-${word.id}-${ruleIndex}`;
      const bgColor = ruleColorMap[rule.class] || '#222';
      tooltipData.push({ id: tooltipId, content: ruleDescription, bgColor });
      const firstChar = rule.text[0];
      const ruleStartsWithCombining = firstChar && isCombiningMark(firstChar);
      const markOnly = isMarkOnly(rule.text);
      // Add text before the rule
      if (rule.startIndex > lastIndex) {
        const beforeText = text.slice(lastIndex, rule.startIndex);
        if (markOnly) {
          // Mark-only rule (tatweel + combining marks, no base letters):
          // Keep in the text flow as plain text to preserve shaping.
          // Attach tooltip to the preceding text span instead.
          segments.push(
            <span
              key={`text-${word.id}-${ruleIndex}`}
              className="cursor-help tajweed-rule"
              data-tooltip-id={tooltipId}
              data-tooltip-html={ruleDescription}
              style={{ fontSize: `${currentFontSize}px` }}
              onMouseEnter={handleTajweedMouseEnter}
              onMouseLeave={handleTajweedMouseLeave}
            >
              {beforeText}{rule.text}
            </span>
          );
        } else if (ruleStartsWithCombining && beforeText.length > 0) {
          // Combining mark: pull last base letter from BEFORE into rule span
          const [textBeforeBase, baseWithMarks] = splitBeforeBaseLetter(beforeText);
          if (textBeforeBase) {
            segments.push(
              <span
                key={`text-${word.id}-${ruleIndex}`}
                style={{ fontSize: `${currentFontSize}px` }}
              >
                {textBeforeBase}
              </span>
            );
          }
          segments.push(
            <span
              key={`rule-${word.id}-${ruleIndex}`}
              className={`${ruleColor} cursor-help tajweed-rule`}
              data-tooltip-id={tooltipId}
              data-tooltip-html={ruleDescription}
              style={{ fontSize: `${currentFontSize}px` }}
              onMouseEnter={handleTajweedMouseEnter}
              onMouseLeave={handleTajweedMouseLeave}
            >
              {baseWithMarks}{rule.text}
            </span>
          );
        } else {
          segments.push(
            <span
              key={`text-${word.id}-${ruleIndex}`}
              style={{ fontSize: `${currentFontSize}px` }}
            >
              {beforeText}
            </span>
          );
          segments.push(
            <span
              key={`rule-${word.id}-${ruleIndex}`}
              className={`${ruleColor} cursor-help tajweed-rule`}
              data-tooltip-id={tooltipId}
              data-tooltip-html={ruleDescription}
              style={{ fontSize: `${currentFontSize}px` }}
              onMouseEnter={handleTajweedMouseEnter}
              onMouseLeave={handleTajweedMouseLeave}
            >
              {rule.text}
            </span>
          );
        }
      } else {
        segments.push(
          <span
            key={`rule-${word.id}-${ruleIndex}`}
            className={`${ruleColor} cursor-help tajweed-rule`}
            data-tooltip-id={tooltipId}
            data-tooltip-html={ruleDescription}
            style={{ fontSize: `${currentFontSize}px` }}
            onMouseEnter={handleTajweedMouseEnter}
            onMouseLeave={handleTajweedMouseLeave}
          >
            {rule.text}
          </span>
        );
      }
      lastIndex = rule.endIndex;
    });
    if (lastIndex < text.length) {
      segments.push(
        <span
          key={`text-${word.id}-end`}
          style={{ fontSize: `${currentFontSize}px` }}
        >
          {text.slice(lastIndex)}
        </span>
      );
    }
    // If translation tooltip is enabled, wrap the whole word in a tooltip container
    if (showWordByWordTooltip && translation) {
      const wordId = String(word.id);
      const shouldShowTooltip = isMobile ? clickedWordId === wordId : hoveredTajweedWordId !== wordId;
      const translationTooltipId = `translation-tooltip-${word.id}`;
      
      if (shouldShowTooltip) {
        translationTooltipData.push({ id: translationTooltipId, content: translation, wordId });
      }
      
      return (
        <span
          key={word.id}
          className={`inline ${isMobile ? 'cursor-pointer' : ''}`}
          style={{ fontSize: `${currentFontSize}px` }}
          onClick={handleWordClick}
          data-tooltip-id={shouldShowTooltip ? translationTooltipId : undefined}
          data-word-tooltip
        >
          {segments}
        </span>
      );
    }
    // Default: just render the segments
    return (
      <span
        key={word.id}
        className="inline"
        style={{ fontSize: `${currentFontSize}px` }}
      >
        {segments}
      </span>
    );
  };

  // Set a CSS variable for the tooltip background color
  // const tooltipBgColor = hoveredRuleClass && ruleColorMap[hoveredRuleClass] ? ruleColorMap[hoveredRuleClass] : undefined;

  return (
    <>
      <Tag 
         className={`leading-relaxed sm:leading-loose text-accent-foreground font-arabic arabic-text uthmanic-hafs ${className}`} 
        dir="rtl"
        style={{
          fontFamily: fontLoaded ? qpcFontLoader.getFontFamily(pageNumber || 1) : "'UthmanicHafs_V22', 'qpc-v2-fallback', 'Amiri', serif",
          fontSize: `${currentFontSize}px`,
          lineHeight: displayMode === 'inline' ? 'inherit' : '1.8',
          textAlign: displayMode === 'inline' ? 'inherit' : 'right',
          '--custom-font-size': `${currentFontSize}px`,
          fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1, 'calt' 1, 'rlig' 1, 'ccmp' 1, 'locl' 1, 'mark' 1, 'mkmk' 1" : "'liga' 0, 'kern' 0, 'calt' 0, 'rlig' 0, 'ccmp' 0, 'locl' 0, 'mark' 0, 'mkmk' 0",
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
          hyphens: 'none',
          wordSpacing: '0.12em',
          whiteSpace: 'normal',
          position: 'relative',
          overflow: 'visible',
          display: displayMode === 'inline' ? 'inline' : 'block',
          width: displayMode === 'inline' ? 'auto' : '100%',
          maxWidth: displayMode === 'inline' ? 'none' : '100%',
          boxSizing: 'border-box',
        } as React.CSSProperties}
      >
        {!hideWords && isTajweedLoading(surahNumber, ayahNumber) ? (
          displayMode === 'inline' ? (
            <span className="inline-flex items-center mx-1 text-xs text-accent/40 animate-pulse font-sans">
              ...
            </span>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto"></div>
              <p className="mt-2 text-sm text-accent">Loading tajweed...</p>
            </div>
          )
        ) : (
          tajweedWords.map((word, index) => (
            <React.Fragment key={word.id}>
              {renderWordWithTajweed(word, index)}
              {index < tajweedWords.length - 1 && ' '}
            </React.Fragment>
          ))
        )}
      </Tag>
      
      {/* Render all tooltips outside the inline text flow at document.body using createPortal */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <>
          {tooltipData.map(({ id, content, bgColor }) => (
            <Tooltip
              key={id}
              id={id}
              style={{
                backgroundColor: bgColor,
                color: isColorLight(bgColor) ? '#222' : '#fff',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.75rem',
                fontSize: '0.875rem',
                zIndex: 9999,
                position: 'absolute',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {content}
            </Tooltip>
          ))}
          {translationTooltipData.map(({ id, content, wordId }) => {
            const tooltipProps = isMobile ? { isOpen: clickedWordId === wordId } : {};
            return (
              <Tooltip
                key={id}
                id={id}
                {...tooltipProps}
                style={{
                  backgroundColor: '#111827', // bg-gray-900
                  color: '#fff',
                  borderRadius: '0.375rem',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem', // text-xs
                  zIndex: 9999,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                }}
              >
                {content}
              </Tooltip>
            );
          })}
        </>,
        document.body
      )}
    </>
  );
}

// Helper functions for tajweed colors and descriptions
// Handles both old rule-class names (SQLite DB) and new topic IDs (quranpedia engine)
function getTajweedColor(ruleClass: string): string {
  // New topic-based system (quranpedia engine — 7 topics)
  if (TOPIC_TAILWIND_COLORS[ruleClass]) return TOPIC_TAILWIND_COLORS[ruleClass];
  // Old rule-class system (SQLite DB — 21+ classes)
  return TAJWEED_COLORS[ruleClass] || 'text-gray-600';
}

// Build a detailed tooltip from the full rule object as structured HTML.
// Layout: English name + description on top, divider, Arabic name + description on bottom.
// Falls back to the generic topic tooltip for old-style rules without labels.
function getTajweedDescriptionHtml(rule: { class: string; hukumLabel?: string; ruleLabel?: string; topicLabel?: string; hukumLabelEn?: string; topicLabelEn?: string; ruleLabelEn?: string }): string {
  if (rule.hukumLabel && rule.ruleLabel) {
    const enName = rule.hukumLabelEn || '';
    const enDetail = rule.ruleLabelEn || '';
    const arName = rule.hukumLabel;
    const arDetail = rule.ruleLabel;
    return [
      '<div style="text-align:left;max-width:240px">',
      `  <div style="font-weight:600;font-size:12px">${enName}</div>`,
      enDetail ? `  <div style="font-size:11px;opacity:0.85;line-height:1.4;margin-top:2px">${enDetail}</div>` : '',
      '  <div style="height:1px;background:currentColor;opacity:0.25;margin:6px 0"></div>',
      `  <div style="text-align:right" dir="rtl">`,
      `    <div style="font-weight:600;font-size:14px">${arName}</div>`,
      arDetail ? `    <div style="font-size:11px;opacity:0.85;line-height:1.6;margin-top:2px">${arDetail}</div>` : '',
      `  </div>`,
      '</div>',
    ].filter(Boolean).join('');
  }
  // Fallback: generic topic-based tooltip (plain text)
  return getTajweedTooltip(rule.class);
}

// Map tajweed rule class/topic to a hex color for tooltip backgrounds
const ruleColorMap: Record<string, string> = {
  // New topic-based system (quranpedia engine — 7 topics)
  'tafkheem-tarqeeq': '#c2410c',
  'letter-relations': '#7e22ce',
  'noon-tanween': '#0369a1',
  'meem-sakinah': '#0f766e',
  mushaddadatan: '#a16207',
  madd: '#be123c',
  qalqalah: '#15803d',
  // Old rule-class system (SQLite DB — kept for backward compatibility)
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
  idgham_mutajanisayn: '#2563eb',
  idgham_mutaqaribayn: '#2563eb',
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