'use client';

import React, { useEffect, useState } from 'react';
import { TajweedWord, TajweedRule, TAJWEED_COLORS, TAJWEED_DESCRIPTIONS } from '@/lib/tajweedService';
import { qpcFontLoader } from '@/lib/qpcFontLoader';

interface TajweedTextProps {
  words: TajweedWord[];
  className?: string;
  showTooltips?: boolean;
}

export function TajweedText({ words, className = '', showTooltips = true }: TajweedTextProps) {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    const loadFont = async () => {
      // For ayah view, we'll use the fallback font since we don't have page context
      const loaded = await qpcFontLoader.loadPageFont(1); // Load first page as fallback
      setFontLoaded(loaded);
    };
    loadFont();
  }, []);

  const renderWordWithTajweed = (word: TajweedWord) => {
    if (word.tajweedRules.length === 0) {
      return <span key={word.id} className="inline-block">{word.text}</span>;
    }

    const text = word.text;
    const rules = word.tajweedRules;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort rules by start index to process them in order
    const sortedRules = [...rules].sort((a, b) => a.startIndex - b.startIndex);

    sortedRules.forEach((rule, ruleIndex) => {
      // Add text before the rule
      if (rule.startIndex > lastIndex) {
        segments.push(
          <span key={`text-${word.id}-${ruleIndex}`}>
            {text.slice(lastIndex, rule.startIndex)}
          </span>
        );
      }

      // Add the rule text with styling
      const ruleColor = TAJWEED_COLORS[rule.class] || 'text-gray-600';
      const ruleDescription = TAJWEED_DESCRIPTIONS[rule.class] || rule.class;
      
      const ruleElement = (
        <span
          key={`rule-${word.id}-${ruleIndex}`}
          className={`${ruleColor} font-semibold ${showTooltips ? 'cursor-help' : ''}`}
          title={showTooltips ? ruleDescription : undefined}
        >
          {rule.text}
        </span>
      );

      segments.push(ruleElement);
      lastIndex = rule.endIndex;
    });

    // Add remaining text after the last rule
    if (lastIndex < text.length) {
      segments.push(
        <span key={`text-${word.id}-end`}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return (
      <span key={word.id} className="inline-block">
        {segments}
      </span>
    );
  };

  return (
    <div 
      className={`leading-relaxed ${className}`} 
      dir="rtl"
      style={{
        fontFamily: fontLoaded ? qpcFontLoader.getFontFamily(1) : "'qpc-v2-fallback', 'Amiri', serif",
        textAlign: 'right',
        fontFeatureSettings: fontLoaded ? "'liga' 1, 'kern' 1" : "normal"
      }}
    >
      {words.map((word, index) => (
        <React.Fragment key={word.id}>
          {renderWordWithTajweed(word)}
          {index < words.length - 1 && <span className="mx-1"> </span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// TajweedLegend component removed - now using TajweedPalette component instead

interface TajweedStatsProps {
  words: TajweedWord[];
  className?: string;
}

export function TajweedStats({ words, className = '' }: TajweedStatsProps) {
  const totalWords = words.length;
  const wordsWithRules = words.filter(word => word.tajweedRules.length > 0).length;
  const totalRules = words.reduce((sum, word) => sum + word.tajweedRules.length, 0);
  
  const ruleCounts: Record<string, number> = {};
  words.forEach(word => {
    word.tajweedRules.forEach(rule => {
      ruleCounts[rule.class] = (ruleCounts[rule.class] || 0) + 1;
    });
  });

  const topRules = Object.entries(ruleCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{totalWords}</div>
          <div className="text-xs text-gray-600">Total Words</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{wordsWithRules}</div>
          <div className="text-xs text-gray-600">With Rules</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{totalRules}</div>
          <div className="text-xs text-gray-600">Total Rules</div>
        </div>
      </div>
      
      {topRules.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2">Top Tajweed Rules:</h4>
          <div className="space-y-1">
            {topRules.map(([ruleClass, count]) => (
              <div key={ruleClass} className="flex justify-between text-xs">
                <span className="capitalize">{ruleClass.replace(/_/g, ' ')}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 