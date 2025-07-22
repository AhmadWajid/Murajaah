'use client';

import { useEffect, useState } from 'react';
import { Repeat, Repeat1, FastForward, XCircle, Info } from 'lucide-react';

interface AudioPlayerProps {
  currentAudio: HTMLAudioElement | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentPlayingAyah: { surah: number; ayah: number } | null;
  onTogglePlayPause: () => void;
  onStop: () => void;
}

export default function AudioPlayer({
  currentAudio,
  isPlaying,
  currentTime,
  duration,
  currentPlayingAyah,
  onTogglePlayPause,
  onStop
}: AudioPlayerProps) {
  // --- New State for Loop, Custom Loop, and Speed ---
  const [loopMode, setLoopMode] = useState<'none' | 'infinite' | 'custom'>('none');
  const [customLoop, setCustomLoop] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showCustomLoopInputs, setShowCustomLoopInputs] = useState(false);

  // --- Effect: Apply playback speed to audio ---
  useEffect(() => {
    if (currentAudio) {
      currentAudio.playbackRate = playbackSpeed;
    }
  }, [currentAudio, playbackSpeed]);

  // --- Effect: Handle loop logic ---
  useEffect(() => {
    if (!currentAudio) return;
    if (loopMode === 'infinite') {
      currentAudio.loop = true;
    } else {
      currentAudio.loop = false;
    }
    if (loopMode === 'custom') {
      const handleTimeUpdate = () => {
        if (currentAudio.currentTime > customLoop.end) {
          currentAudio.currentTime = customLoop.start;
          currentAudio.play();
        }
      };
      currentAudio.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        currentAudio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [currentAudio, loopMode, customLoop]);

  // Keyboard controls for audio player
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle audio controls if there's an audio element and user is not typing
      if (!currentAudio || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case ' ':
          // Spacebar - Play/Pause
          event.preventDefault();
          onTogglePlayPause();
          break;
        case 'ArrowLeft':
          // Left arrow - Rewind 10 seconds
          event.preventDefault();
          if (currentAudio) {
            currentAudio.currentTime = Math.max(0, currentAudio.currentTime - 10);
          }
          break;
        case 'ArrowRight':
          // Right arrow - Forward 10 seconds
          event.preventDefault();
          if (currentAudio) {
            currentAudio.currentTime = Math.min(currentAudio.duration, currentAudio.currentTime + 10);
          }
          break;
        case 'ArrowUp':
          // Up arrow - Volume up
          event.preventDefault();
          if (currentAudio) {
            currentAudio.volume = Math.min(1, currentAudio.volume + 0.1);
          }
          break;
        case 'ArrowDown':
          // Down arrow - Volume down
          event.preventDefault();
          if (currentAudio) {
            currentAudio.volume = Math.max(0, currentAudio.volume - 0.1);
          }
          break;
        case 'Escape':
          // Escape - Stop audio
          event.preventDefault();
          onStop();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentAudio, onTogglePlayPause, onStop]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentAudio) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 border-t border-amber-200 dark:border-amber-700 p-4 backdrop-blur-sm z-50">
      <div className="max-w-6xl mx-auto">
        {/* --- Top Bar Controls --- */}
        <div className="flex items-center gap-4 mb-2 flex-wrap">
          {/* Loop Mode Dropdown */}
          <div className="flex items-center gap-1 relative group">
            <button
              aria-label={
                loopMode === 'infinite'
                  ? 'Infinite Loop Enabled'
                  : loopMode === 'custom'
                  ? 'Custom Loop Enabled'
                  : 'Loop Off'
              }
              className={`p-2 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900 hover:bg-amber-100 dark:hover:bg-amber-800 transition-colors ${
                loopMode === 'infinite' || loopMode === 'custom' ? 'text-amber-700 dark:text-amber-200' : 'text-gray-400'
              }`}
              tabIndex={0}
              onClick={() => {
                setLoopMode((prev) =>
                  prev === 'none' ? 'infinite' : prev === 'infinite' ? 'custom' : 'none'
                );
                setShowCustomLoopInputs(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setLoopMode((prev) =>
                    prev === 'none' ? 'infinite' : prev === 'infinite' ? 'custom' : 'none'
                  );
                  setShowCustomLoopInputs(false);
                }
              }}
            >
              {loopMode === 'infinite' ? (
                <Repeat1 className="w-5 h-5" />
              ) : loopMode === 'custom' ? (
                <Repeat className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5 opacity-40" />
              )}
            </button>
            <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 text-xs bg-amber-700 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {loopMode === 'infinite'
                ? 'Infinite Loop'
                : loopMode === 'custom'
                ? 'Custom Loop'
                : 'Loop Off'}
            </span>
            {loopMode === 'custom' && (
              <button
                aria-label="Set Custom Loop Range"
                className="ml-1 px-2 py-1 text-xs rounded bg-amber-200 dark:bg-amber-800 border border-amber-400 dark:border-amber-700 hover:bg-amber-300 dark:hover:bg-amber-700"
                onClick={() => setShowCustomLoopInputs(v => !v)}
              >
                Set Range
              </button>
            )}
          </div>
          {/* Custom Loop Inputs */}
          {showCustomLoopInputs && (
            <div className="flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded px-2 py-1">
              <span>Start:</span>
              <input
                type="number"
                min={0}
                max={Math.floor(duration)}
                value={customLoop.start}
                aria-label="Custom Loop Start (seconds)"
                onChange={e => setCustomLoop({ ...customLoop, start: Number(e.target.value) })}
                className="w-12 rounded px-1 py-0.5 border border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-900"
              />
              <span>End:</span>
              <input
                type="number"
                min={customLoop.start}
                max={Math.floor(duration)}
                value={customLoop.end}
                aria-label="Custom Loop End (seconds)"
                onChange={e => setCustomLoop({ ...customLoop, end: Number(e.target.value) })}
                className="w-12 rounded px-1 py-0.5 border border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-900"
              />
              <button
                aria-label="Reset Custom Loop"
                className="ml-1 p-1 rounded-full bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-300"
                onClick={() => {
                  setCustomLoop({ start: 0, end: 0 });
                  setShowCustomLoopInputs(false);
                  setLoopMode('none');
                }}
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                aria-label="Done Setting Custom Loop"
                className="ml-1 px-2 py-0.5 rounded bg-amber-300 dark:bg-amber-700 text-xs hover:bg-amber-400 dark:hover:bg-amber-600"
                onClick={() => setShowCustomLoopInputs(false)}
              >
                Done
              </button>
              <span className="ml-2 text-amber-600 dark:text-amber-300" title="Set start and end in seconds"> <Info className="inline w-3 h-3" /> </span>
            </div>
          )}
          {/* Playback Speed */}
          <div className="flex items-center gap-2 ml-2 relative group">
            <FastForward className="w-5 h-5 text-amber-700 dark:text-amber-200" />
            <label htmlFor="audio-speed" className="text-xs font-medium text-amber-700 dark:text-amber-200 sr-only">Speed</label>
            <select
              id="audio-speed"
              className="rounded px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              value={playbackSpeed}
              aria-label="Playback Speed"
              onChange={e => setPlaybackSpeed(Number(e.target.value))}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
            <span className="absolute left-1/2 -bottom-7 -translate-x-1/2 text-xs bg-amber-700 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Playback Speed
            </span>
          </div>
        </div>
        {/* --- End Top Bar Controls --- */}
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={onTogglePlayPause}
            className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Stop Button */}
          <button
            onClick={onStop}
            className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>

          {/* Current Ayah Info */}
          <div className="flex-1">
            <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {currentPlayingAyah ? `Surah ${currentPlayingAyah.surah}, Ayah ${currentPlayingAyah.ayah}` : 'No audio playing'}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1">
            <div className="w-full bg-amber-200 dark:bg-amber-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-100 shadow-sm"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 