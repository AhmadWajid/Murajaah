'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TajweedRule {
  id: number;
  name: string;
  color: string;
  description: string;
  letters: string;
  examples: string;
}

const TAJWEED_RULES: TajweedRule[] = [
  {
    id: 1,
    name: 'ham_wasl',
    color: 'text-red-500',
    description: 'Hamza Wasl - Silent hamza at the beginning of words',
    letters: 'ٱ',
    examples: 'ٱللَّهِ'
  },
  {
    id: 2,
    name: 'laam_shamsiyah',
    color: 'text-yellow-600',
    description: 'Laam Shamsiyah - Solar laam (assimilated)',
    letters: 'ل',
    examples: 'لرَّحۡمَ'
  },
  {
    id: 3,
    name: 'madda_normal',
    color: 'text-green-500',
    description: 'Madda Normal - Natural prolongation',
    letters: 'ـٰ',
    examples: 'رَّحۡمَـٰنِ'
  },
  {
    id: 4,
    name: 'madda_permissible',
    color: 'text-green-500',
    description: 'Madda Permissible - Can be prolonged for 2-6 counts',
    letters: 'ِي',
    examples: 'رَّحِيْمِ'
  },
  {
    id: 5,
    name: 'madda_necessary',
    color: 'text-green-600',
    description: 'Madda Necessary - Must be prolonged for 4-5 counts',
    letters: 'لٓ مٓ',
    examples: 'الٓمٓ'
  },
  {
    id: 6,
    name: 'slnt',
    color: 'text-gray-600',
    description: 'Silent - Letter is not pronounced',
    letters: 'Various',
    examples: 'Silent letters'
  },
  {
    id: 7,
    name: 'ghunnah',
    color: 'text-indigo-600',
    description: 'Ghunnah - Nasalization for 2 counts',
    letters: 'مّ OR نّ',
    examples: 'مّ OR نّ'
  },
  {
    id: 8,
    name: 'qalaqah',
    color: 'text-orange-600',
    description: 'Qalaqah - Bouncing sound on qalqalah letters',
    letters: 'ْق ْط ْب ْج ْد',
    examples: 'ْق ْط ْب ْج ْد'
  },
  {
    id: 9,
    name: 'ikhafa',
    color: 'text-purple-600',
    description: 'Ikhafa - Partial hiding of noon/tanween',
    letters: '(ت,ث,ج,د,ذ,ز,س,ش,ص,ض,ط,ظ,ف,ق,ك) < (نْ or ـًـٍـٌ)',
    examples: 'Partial hiding'
  },
  {
    id: 10,
    name: 'madda_obligatory_mottasel',
    color: 'text-green-600',
    description: 'Madda Obligatory Connected - Must be prolonged for 4-5 counts',
    letters: 'ـٰٓ',
    examples: 'يَـٰٓأَيُّهَا'
  },
  {
    id: 11,
    name: 'madda_obligatory_monfasel',
    color: 'text-green-600',
    description: 'Madda Obligatory Separated - Must be prolonged for 4-5 counts',
    letters: 'Various',
    examples: 'Separated madda'
  },
  {
    id: 12,
    name: 'iqlab',
    color: 'text-teal-600',
    description: 'Iqlab - Converting noon to meem',
    letters: '(ب) < (نْ or ـًـٍـٌ)',
    examples: 'Noon to meem conversion'
  },
  {
    id: 13,
    name: 'izhar',
    color: 'text-blue-500',
    description: 'Izhar - Clear pronunciation',
    letters: '(ا,ح,خ,ع,غ,ه) < (نْ or ـًـٍـٌ)',
    examples: 'Clear pronunciation'
  },
  {
    id: 14,
    name: 'idgham_ghunnah',
    color: 'text-blue-600',
    description: 'Idgham with Ghunnah - Assimilation with nasalization',
    letters: '(ي، ن، م، و) < (نْ or ـًـٍـٌ)',
    examples: 'Assimilation with nasalization'
  },
  {
    id: 15,
    name: 'idgham_wo_ghunnah',
    color: 'text-blue-500',
    description: 'Idgham without Ghunnah - Assimilation without nasalization',
    letters: '(ل,ر) < (نْ or ـًـٍـٌ)',
    examples: 'Assimilation without nasalization'
  },
  {
    id: 16,
    name: 'ikhafa_shafawi',
    color: 'text-purple-600',
    description: 'Ikhafa Shafawi - Partial hiding with labial letters',
    letters: 'Labial letters',
    examples: 'Partial hiding with labial'
  },
  {
    id: 17,
    name: 'idgham_shafawi',
    color: 'text-blue-600',
    description: 'Idgham Shafawi - Assimilation with labial letters',
    letters: 'Labial assimilation',
    examples: 'Labial assimilation'
  },
  {
    id: 18,
    name: 'izhar_shafawi',
    color: 'text-blue-500',
    description: 'Izhar Shafawi - Clear pronunciation with labial',
    letters: 'Labial clear pronunciation',
    examples: 'Labial clear pronunciation'
  },
  {
    id: 19,
    name: 'madd_al_tamkeen',
    color: 'text-green-500',
    description: 'Madd Al Tamkeen - Strengthening prolongation',
    letters: 'Various',
    examples: 'Strengthening prolongation'
  },
  {
    id: 20,
    name: 'tafkheem',
    color: 'text-red-600',
    description: 'Tafkheem - Heavy/thick pronunciation',
    letters: 'Heavy letters',
    examples: 'Heavy pronunciation'
  },
  {
    id: 21,
    name: 'tarqeeq',
    color: 'text-blue-400',
    description: 'Tarqeeq - Light/thin pronunciation',
    letters: 'Light letters',
    examples: 'Light pronunciation'
  }
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
          <span className="text-lg">Tajweed Rules Palette</span>
          <Badge variant="secondary">{TAJWEED_RULES.length} Rules</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {TAJWEED_RULES.map((rule) => (
            <div key={rule.id} className="border-b border-gray-200 pb-2 last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-500 w-6">{rule.id}</span>
                  <div 
                    className={`w-4 h-4 rounded ${rule.color.replace('text-', 'bg-')}`}
                    title={rule.description}
                  ></div>
                  <span className="text-sm font-medium capitalize">
                    {rule.name.replace(/_/g, ' ')}
                  </span>
                </div>
                {showDetails && (
                  <Badge variant="outline" className="text-xs">
                    {rule.letters.length > 10 ? 'Multiple' : rule.letters}
                  </Badge>
                )}
              </div>
              
              {showDetails && (
                <div className="ml-8 space-y-1">
                  <div className="text-xs text-gray-600">
                    {rule.description}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Letters:</span>
                    <span 
                      className="text-xl sm:text-2xl font-arabic"
                      style={{ fontFamily: "'qpc-v2-fallback', 'Amiri', serif" }}
                    >
                      {rule.letters}
                    </span>
                  </div>
                  {rule.examples && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Examples:</span>
                      <span 
                        className="text-lg sm:text-xl font-arabic"
                        style={{ fontFamily: "'qpc-v2-fallback', 'Amiri', serif" }}
                      >
                        {rule.examples}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <div className="text-xs text-gray-500 text-center">
          <p>Hover over colored squares to see rule descriptions</p>
          <p>Click on tajweed text in the Quran to see detailed explanations</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TAJWEED_RULES.slice(0, 12).map((rule) => (
            <div key={rule.id} className="flex items-center gap-2 text-xs">
              <div 
                className={`w-3 h-3 rounded ${rule.color.replace('text-', 'bg-')}`}
                title={rule.description}
              ></div>
              <span className="capitalize truncate">
                {rule.name.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 