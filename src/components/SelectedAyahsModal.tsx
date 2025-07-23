'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2 } from 'lucide-react';
import { formatAyahRange } from '@/lib/quran';

interface SelectedAyahsModalProps {
  isOpen: boolean;
  selectedAyahs: Set<{surah: number, ayah: number}>;
  pageData: any;
  onClose: () => void;
  onAddForReview: () => void;
  onRemoveAyah: (surah: number, ayah: number) => void;
  onClearAll: () => void;
}

export default function SelectedAyahsModal({
  isOpen,
  selectedAyahs,
  pageData,
  onClose,
  onAddForReview,
  onRemoveAyah,
  onClearAll
}: SelectedAyahsModalProps) {
  if (!isOpen) return null;

  // Group selected ayahs by surah and create ranges
  const getSelectedAyahsInfo = () => {
    const selectedAyahsArray = Array.from(selectedAyahs);
    // Group by surah
    const groupedBySurah: { [key: number]: { surah: number, ayah: number }[] } = {};
    selectedAyahsArray.forEach(sel => {
      if (!groupedBySurah[sel.surah]) groupedBySurah[sel.surah] = [];
      groupedBySurah[sel.surah].push(sel);
    });
    return Object.entries(groupedBySurah).map(([surahNumber, ayahs]) => {
      const sortedAyahs = ayahs.sort((a, b) => a.ayah - b.ayah);
      const start = sortedAyahs[0].ayah;
      const end = sortedAyahs[sortedAyahs.length - 1].ayah;
      // Try to get surah name from pageData or fallback
      let surahName = 'Unknown';
      if (pageData?.ayahs) {
        const found = pageData.ayahs.find((a: any) => a.surah?.number === Number(surahNumber));
        if (found) surahName = found.surah?.englishName || found.surah?.name || 'Unknown';
      }
      return {
        surahNumber: Number(surahNumber),
        surahName,
        start,
        end,
        ayahs: sortedAyahs,
        range: start === end ? `${start}` : `${start}-${end}`
      };
    });
  };

  const selectedAyahsInfo = getSelectedAyahsInfo();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <span>Selected Ayahs for Review</span>
              </CardTitle>
              <CardDescription>
                {selectedAyahs.size} ayah{selectedAyahs.size !== 1 ? 's' : ''} selected
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {selectedAyahsInfo.length > 0 ? (
            <>
              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Summary
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {selectedAyahsInfo.length} range{selectedAyahsInfo.length !== 1 ? 's' : ''} across {selectedAyahsInfo.length} surah{selectedAyahsInfo.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-blue-700 dark:text-blue-300">
                    {selectedAyahs.size} total
                  </Badge>
                </div>
              </div>

              {/* Selected Ranges */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Selected Ranges
                </h4>
                {selectedAyahsInfo.map((range, index) => (
                  <div
                    key={`${range.surahNumber}-${range.start}-${range.end}`}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                          {range.surahNumber}
                        </Badge>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {range.surahName}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Ayah {range.range}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Remove all ayahs in this range
                          range.ayahs.forEach(ayah => onRemoveAyah(ayah.surah, ayah.ayah));
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Individual ayahs in this range */}
                    <div className="space-y-2">
                      {range.ayahs.map(ayah => (
                        <div
                          key={ayah.ayah}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {ayah.surah}:{ayah.ayah}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveAyah(ayah.surah, ayah.ayah)}
                            className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-lg mb-2">No ayahs selected</div>
              <p className="text-sm">Click on ayahs to select them for review</p>
            </div>
          )}
        </CardContent>

        {/* Action Buttons */}
        {selectedAyahs.size > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onClearAll}>
                Clear All
              </Button>
              <Button onClick={onAddForReview}>
                <Plus className="h-4 w-4 mr-2" /> Add for Review
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 