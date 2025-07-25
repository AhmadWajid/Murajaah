'use client';

import { useState, useEffect } from 'react';

interface MemorizationSelection {
  surah: number;
  ayahStart: number;
  ayahEnd: number;
  surahName?: string;
}

interface AddModalProps {
  isOpen: boolean;
  currentSurah: number;
  addRange: { start: number; end: number };
  surahList: any[];
  onConfirm: (selections: MemorizationSelection[], name: string, description?: string, difficultyLevel?: 'easy' | 'medium' | 'hard') => void;
  onClose: () => void;
}

export default function AddModal({
  isOpen,
  currentSurah,
  addRange,
  surahList,
  onConfirm,
  onClose
}: AddModalProps) {
  const [selections, setSelections] = useState<MemorizationSelection[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'simple' | 'complex'>('simple');
  const [newSelection, setNewSelection] = useState({
    surah: currentSurah,
    ayahStart: addRange.start,
    ayahEnd: addRange.end
  });
  const [initialRating, setInitialRating] = useState<'easy' | 'medium' | 'hard'>('medium');

  useEffect(() => {
    if (isOpen) {
      // Initialize with current selection
      const currentSurahInfo = surahList.find(s => s.number === currentSurah);
      setSelections([{
        surah: currentSurah,
        ayahStart: addRange.start,
        ayahEnd: addRange.end,
        surahName: currentSurahInfo?.englishName
      }]);
      setName(`Surah ${currentSurah} Ayahs ${addRange.start}-${addRange.end}`);
      setMode('simple');
    }
  }, [isOpen, currentSurah, addRange, surahList]);

  const addSelection = () => {
    const surahInfo = surahList.find(s => s.number === newSelection.surah);
    const selection: MemorizationSelection = {
      ...newSelection,
      surahName: surahInfo?.englishName
    };
    setSelections([...selections, selection]);
    setNewSelection({
      surah: currentSurah,
      ayahStart: 1,
      ayahEnd: 1
    });
  };

  const removeSelection = (index: number) => {
    setSelections(selections.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (selections.length === 0) return;
    
    if (mode === 'simple' && selections.length === 1) {
      // Use the original simple format for backward compatibility
      onConfirm(selections, name, description, initialRating);
    } else {
      // Use the new complex format
      onConfirm(selections, name, description, initialRating);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 dark:bg-gray-800/95 rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-amber-200 dark:border-amber-700 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-2">
            Add New Memorization
          </h3>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Select the Quran passages you want to memorize
          </p>
        </div>

        {/* Initial Review Difficulty Selector */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">
            How difficult do you expect this to be?
          </h4>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              className={`px-4 py-2 rounded-lg border-2 transition-all font-medium text-base ${initialRating === 'easy' ? 'border-green-500 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 hover:border-green-300'}`}
              onClick={() => setInitialRating('easy')}
            >
              Easy
              <span className="block text-xs font-normal text-gray-500 dark:text-gray-300">7 days</span>
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg border-2 transition-all font-medium text-base ${initialRating === 'medium' ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' : 'border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 hover:border-yellow-300'}`}
              onClick={() => setInitialRating('medium')}
            >
              Medium
              <span className="block text-xs font-normal text-gray-500 dark:text-gray-300">5 days</span>
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg border-2 transition-all font-medium text-base ${initialRating === 'hard' ? 'border-red-500 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' : 'border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 hover:border-red-300'}`}
              onClick={() => setInitialRating('hard')}
            >
              Hard
              <span className="block text-xs font-normal text-gray-500 dark:text-gray-300">1 day</span>
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('simple')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all duration-300 ${
              mode === 'simple' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Single Range
          </button>
          <button
            onClick={() => setMode('complex')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all duration-300 ${
              mode === 'complex' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Multiple Ranges
          </button>
        </div>

        {/* Current Selections */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">
            Selected Passages ({selections.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selections.map((selection, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                <div className="flex-1">
                  <div className="font-medium text-amber-800 dark:text-amber-200">
                    {selection.surahName || `Surah ${selection.surah}`}
                  </div>
                  <div className="text-sm text-amber-600 dark:text-amber-400">
                    Ayahs {selection.ayahStart}-{selection.ayahEnd}
                  </div>
                </div>
                {mode === 'complex' && (
                  <button
                    onClick={() => removeSelection(index)}
                    className="ml-3 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add New Selection (Complex Mode Only) */}
        {mode === 'complex' && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
            <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">
              Add Another Range
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Surah
                </label>
                <select
                  value={newSelection.surah}
                  onChange={(e) => setNewSelection({...newSelection, surah: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white/80 dark:bg-gray-700/80 text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {surahList.map(surah => (
                    <option key={surah.number} value={surah.number}>
                      {surah.number}. {surah.englishName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Start Ayah
                </label>
                <input
                  type="number"
                  min="1"
                  value={newSelection.ayahStart}
                  onChange={(e) => setNewSelection({...newSelection, ayahStart: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white/80 dark:bg-gray-700/80 text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  End Ayah
                </label>
                <input
                  type="number"
                  min={newSelection.ayahStart}
                  value={newSelection.ayahEnd}
                  onChange={(e) => setNewSelection({...newSelection, ayahEnd: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-white/80 dark:bg-gray-700/80 text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <button
              onClick={addSelection}
              disabled={newSelection.ayahEnd < newSelection.ayahStart}
              className="w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all duration-300 disabled:cursor-not-allowed"
            >
              Add Range
            </button>
          </div>
        )}

        {/* Name and Description */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this memorization set"
              className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-white/80 dark:bg-gray-700/80 text-amber-900 dark:text-amber-100 placeholder-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description to help you remember what this set contains"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-white/80 dark:bg-gray-700/80 text-amber-900 dark:text-amber-100 placeholder-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={selections.length === 0 || !name.trim()}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            Add to Memorization
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 