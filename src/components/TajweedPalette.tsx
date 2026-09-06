'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TOPIC_COLORS, TOPIC_ARABIC_NAMES, TOPIC_ENGLISH_NAMES } from '@/lib/tajweedService';

interface TopicRule {
  id: string;
  name: string;
  color: string;
  arabicName: string;
  englishName: string;
  description: string;
}

// The 7 topics from the quranpedia tajweed engine corpus.
// Colour carries the topic; text carries the ruling.
const TAJWEED_TOPICS: TopicRule[] = [
  {
    id: 'tafkheem-tarqeeq',
    name: 'tafkheem-tarqeeq',
    color: TOPIC_COLORS['tafkheem-tarqeeq'],
    arabicName: 'التفخيم والترقيق',
    englishName: 'Heavy & Light Letters',
    description: 'Tafkheem (heavy/thick) and Tarqeeq (light/thin) pronunciation of letters, including ranks of tafkheem for the letter راء and laam al-jalalah.',
  },
  {
    id: 'letter-relations',
    name: 'letter-relations',
    color: TOPIC_COLORS['letter-relations'],
    arabicName: 'علاقات الحروف',
    englishName: 'Letter Relations',
    description: 'Idgham (assimilation) between adjacent letters — mutamathilain (identical), mutajanisain (same articulation point), and mutaqaribain (close articulation points).',
  },
  {
    id: 'noon-tanween',
    name: 'noon-tanween',
    color: TOPIC_COLORS['noon-tanween'],
    arabicName: 'النون والتنوين',
    englishName: 'Noon Sakinah & Tanween',
    description: 'Izhar (clear), Idgham (merging), Iqlab (conversion), and Ikhfa (hiding) of noon sakinah and tanween.',
  },
  {
    id: 'meem-sakinah',
    name: 'meem-sakinah',
    color: TOPIC_COLORS['meem-sakinah'],
    arabicName: 'الميم الساكنة',
    englishName: 'Meem Sakinah',
    description: 'Izhar shafawi (clear), Idgham shafawi (assimilation), and Ikhfa shafawi (hiding) of meem sakinah.',
  },
  {
    id: 'mushaddadatan',
    name: 'mushaddadatan',
    color: TOPIC_COLORS['mushaddadatan'],
    arabicName: 'المشددتان',
    englishName: 'Doubled Letters (Ghunnah)',
    description: 'Ghunnah (nasalization) on doubled noon and meem — held for 2 counts.',
  },
  {
    id: 'madd',
    name: 'madd',
    color: TOPIC_COLORS['madd'],
    arabicName: 'المد',
    englishName: 'Prolongation (Madd)',
    description: 'Madd tabi\'i (natural, 2 counts), madd muttasil (connected, 4-5 counts), madd munfasil (separated, 2-4-5 counts), and madd lazim (necessary, 6 counts).',
  },
  {
    id: 'qalqalah',
    name: 'qalqalah',
    color: TOPIC_COLORS['qalqalah'],
    arabicName: 'القلقلة',
    englishName: 'Qalqalah (Echo)',
    description: 'Bouncing/echoing sound on the qalqalah letters (ق ط ب ج د) when sakin — sughra (minor), kubra (major).',
  },
];

interface TajweedPaletteProps {
  className?: string;
  showDetails?: boolean;
}

export function TajweedPalette({ className = '', showDetails = true }: TajweedPaletteProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">Tajweed Rules</span>
          <Badge variant="secondary">7 Topics · 182 Rules</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {TAJWEED_TOPICS.map((topic) => (
            <div key={topic.id} className="border-b border-gray-200 pb-3 last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: topic.color }}
                    title={topic.englishName}
                  ></div>
                  <span
                    className="text-lg font-arabic"
                    style={{ fontFamily: "'UthmanicHafs_V22', 'qpc-v2-fallback', 'Amiri', serif" }}
                    lang="ar"
                  >
                    {topic.arabicName}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {topic.englishName}
                </Badge>
              </div>

              {showDetails && (
                <div className="ml-6 space-y-1">
                  <div className="text-xs text-gray-600">
                    {topic.description}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="text-xs text-gray-500 text-center">
          <p>Colour carries the topic; hover text carries the ruling.</p>
          <p className="mt-1">Powered by the quranpedia tajweed engine — 182 scholar-authored rules.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for smaller spaces
export function TajweedPaletteCompact({ className = '' }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Tajweed Rules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {TAJWEED_TOPICS.map((topic) => (
            <div key={topic.id} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: topic.color }}
                title={topic.englishName}
              ></div>
              <span
                className="font-arabic"
                style={{ fontFamily: "'UthmanicHafs_V22', 'qpc-v2-fallback', 'Amiri', serif" }}
                lang="ar"
              >
                {topic.arabicName}
              </span>
              <span className="text-gray-500 truncate">— {topic.englishName}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
