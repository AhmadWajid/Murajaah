'use client';

import { useState, useEffect } from 'react';
import { getSurahName, getAyahCount, validateAyahRange, SURAH_NAMES } from '@/lib/quran';
import { createMemorizationItem, MemorizationItem } from '@/lib/spacedRepetition';
import { addMemorizationItem, getAllMemorizationItems, removeMemorizationItem } from '@/lib/storage';
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
}

// Memorization level options
const MEMORIZATION_LEVELS = [
  { value: 'new', label: 'New to Me', interval: 1, color: 'from-red-500 to-pink-500' },
  { value: 'beginner', label: 'Beginner', interval: 2, color: 'from-orange-500 to-red-500' },
  { value: 'intermediate', label: 'Intermediate', interval: 5, color: 'from-yellow-500 to-orange-500' },
  { value: 'advanced', label: 'Advanced', interval: 10, color: 'from-green-500 to-emerald-500' },
  { value: 'mastered', label: 'Mastered', interval: 20, color: 'from-blue-500 to-indigo-500' }
];

export default function QuranSelector({ onAdd, currentSurah = 1, hideSelectionType = false }: QuranSelectorProps) {
  const [surah, setSurah] = useState(currentSurah);
  const [ayahStart, setAyahStart] = useState(1);
  const [ayahEnd, setAyahEnd] = useState(1);
  const [memorizationLevel, setMemorizationLevel] = useState('new');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

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
    setError('');
  };

  const handleAdd = async () => {
    if (!validateAyahRange(surah, ayahStart, ayahEnd)) {
      setError('Invalid ayah range. Please check your selection.');
      return;
    }

    try {
      const item = await createMemorizationItem(surah, ayahStart, ayahEnd, memorizationLevel);
      item.name = name;
      item.description = description || '';
      addMemorizationItem(item);
      setError('');
      onAdd();
    } catch (error) {
      setError('Failed to add review item. Please try again.');
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
                  setError('');
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
                  setError('');
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
          </div>

      <Separator />

      {/* Knowledge Level */}
      <div className="space-y-2">
        <Label>Knowledge Level</Label>
        <div className="space-y-1">
          {MEMORIZATION_LEVELS.map((level) => (
            <Button
              key={level.value}
              variant={memorizationLevel === level.value ? "default" : "outline"}
              onClick={() => setMemorizationLevel(level.value)}
              className="w-full justify-between"
            >
              <span>{level.label}</span>
              <Badge variant={memorizationLevel === level.value ? "secondary" : "outline"}>
                {level.interval}d
              </Badge>
            </Button>
              ))}
            </div>
          </div>

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
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

      {/* Action Button */}
      <Button
            onClick={handleAdd}
        disabled={!name.trim()}
        className="w-full"
      >
        Add for Review
      </Button>
    </div>
  );
} 