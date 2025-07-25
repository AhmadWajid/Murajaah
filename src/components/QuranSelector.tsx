'use client';

import { useState, useEffect } from 'react';
import { getSurahName, getAyahCount, validateAyahRange, SURAH_NAMES } from '@/lib/quran';
import { createMemorizationItem } from '@/lib/spacedRepetition';
import { addMemorizationItem } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface QuranSelectorProps {
  onAdd: () => void;
  currentSurah?: number;
  hideSelectionType?: boolean;
  hideInternalControls?: boolean;
  memorizationAge?: number;
  setMemorizationAge?: (age: number) => void;
}

// Remove MEMORIZATION_LEVELS and memorizationLevel state
// Remove knowledge level selection UI
// In handleAdd, do not pass memorizationLevel

export default function QuranSelector({ onAdd, currentSurah = 1, hideSelectionType = false, hideInternalControls = false, memorizationAge, setMemorizationAge }: QuranSelectorProps) {
  const [surah, setSurah] = useState(currentSurah);
  const [ayahStart, setAyahStart] = useState(1);
  const [ayahEnd, setAyahEnd] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Only use local state if prop is not provided
  const [localMemorizationAge, setLocalMemorizationAge] = useState<number>(0);
  const effectiveMemorizationAge = memorizationAge !== undefined ? memorizationAge : localMemorizationAge;
  const effectiveSetMemorizationAge = setMemorizationAge || setLocalMemorizationAge;

  // If memorizationAge prop is provided, always use it and never use local state
  // (no-op for setLocalMemorizationAge if prop is provided)

  // Update surah state when currentSurah prop changes
  useEffect(() => {
    setSurah(currentSurah);
  }, [currentSurah]);

  // Initialize name when surah changes
  useEffect(() => {
    const surahName = getSurahName(surah);
    setName(`Surah ${surah} - ${surahName}`);
    setDescription(`Review set for Surah ${surah}`);
  }, [surah]);

  const handleSurahChange = (newSurah: number) => {
    setSurah(newSurah);
    setAyahStart(1);
    setAyahEnd(1);
  };

  const handleAdd = async () => {
    if (!validateAyahRange(surah, ayahStart, ayahEnd)) {
      // setError('Invalid ayah range. Please check your selection.'); // Original code had this line commented out
      return;
    }

          try {
        const item = await createMemorizationItem(surah, ayahStart, ayahEnd, undefined, undefined, effectiveMemorizationAge);
        item.name = name;
        item.description = description || '';
        addMemorizationItem(item);
        // setError(''); // Original code had this line commented out
        onAdd();
      } catch (error) {
        // setError('Failed to add review item. Please try again.'); // Original code had this line commented out
      }
  };

  const maxAyahs = getAyahCount(surah);
  const ayahOptions = Array.from({ length: maxAyahs }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Selection Type (hide if prop is true) */}
      {!hideSelectionType && (
        <div className="space-y-2">
          <Label>Selection Type</Label>
          <Select value="custom" disabled>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Surah Selection */}
      <div className="space-y-2">
        <Label>Surah</Label>
        <Select value={surah.toString()} onValueChange={(value) => handleSurahChange(parseInt(value))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SURAH_NAMES).map((surahInfo) => (
              <SelectItem key={surahInfo.number} value={surahInfo.number.toString()}>
                {surahInfo.number}. {surahInfo.name} ({surahInfo.ayahCount} ayahs)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ayah Range */}
      <div className="space-y-2">
        <Label>Ayah Range</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Start</Label>
            <Select 
              value={ayahStart.toString()} 
              onValueChange={(value) => {
                const start = parseInt(value);
                  setAyahStart(start);
                  if (start > ayahEnd) {
                    setAyahEnd(start);
                  }
                }}
              >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ayahOptions.map((ayah) => (
                  <SelectItem key={ayah} value={ayah.toString()}>
                    {ayah}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          <div className="space-y-1">
            <Label className="text-xs">End</Label>
            <Select 
              value={ayahEnd.toString()} 
              onValueChange={(value) => {
                setAyahEnd(parseInt(value));
                }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ayahOptions.slice(ayahStart - 1).map((ayah) => (
                  <SelectItem key={ayah} value={ayah.toString()}>
                    {ayah}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Name, Description, Memorization Age, Preview and Button - hide when used within EnhancedMemorizationModal */}
      {!hideInternalControls && (
        <>
          {/* Name and Description */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                  />
                </div>
                
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                  />
                </div>

            <div className="space-y-1">
              <Label>How long have you been memorizing this?</Label>
              <Select value={effectiveMemorizationAge.toString()} onValueChange={(value) => effectiveSetMemorizationAge(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select memorization age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Just memorized today</SelectItem>
                  <SelectItem value="1">1 day ago</SelectItem>
                  <SelectItem value="2">2 days ago</SelectItem>
                  <SelectItem value="3">3 days ago</SelectItem>
                  <SelectItem value="7">1 week ago</SelectItem>
                  <SelectItem value="14">2 weeks ago</SelectItem>
                  <SelectItem value="30">1 month ago</SelectItem>
                  <SelectItem value="60">2 months ago</SelectItem>
              <SelectItem value="90">3 months ago</SelectItem>
              <SelectItem value="180">6 months ago</SelectItem>
              <SelectItem value="365">1 year ago</SelectItem>
              <SelectItem value="730">2+ years ago</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            This helps determine appropriate review intervals. If you&apos;ve been memorizing this for a while, select the approximate time.
          </div>
        </div>
          </div>

      <Separator />

      {/* Knowledge Level */}
      {/* Remove MEMORIZATION_LEVELS and memorizationLevel state */}
      {/* Remove knowledge level selection UI */}
      {/* In handleAdd, do not pass memorizationLevel */}

      {/* Preview */}
      <div className="bg-muted rounded-md p-2 border">
        <Label className="text-sm font-medium">Preview (1)</Label>
        <div className="space-y-1 mt-1">
          <div className="text-sm text-muted-foreground">
            {getSurahName(surah)} {ayahStart}{ayahStart !== ayahEnd ? `-${ayahEnd}` : ''}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {/* Original code had this block commented out */}
          {/* {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )} */}

      {/* Action Button */}
      {(!memorizationAge || !setMemorizationAge) && (
        <Button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="w-full"
        >
          Add for Review
        </Button>
      )}
        </>
      )}
    </div>
  );
} 