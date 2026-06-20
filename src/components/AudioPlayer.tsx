'use client';

import { useEffect, useState } from 'react';
import { Repeat, Repeat1, FastForward, XCircle, Info, Flag } from 'lucide-react';
import { saveAudioSettings, loadAudioSettings } from '@/lib/storageService';

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
  const [isStartSet, setIsStartSet] = useState(false);
  const [isEndSet, setIsEndSet] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load initial settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await loadAudioSettings();
        if (settings) {
          if (settings.loopMode === 'none' || settings.loopMode === 'infinite' || settings.loopMode === 'custom') {
            setLoopMode(settings.loopMode);
          }
          if (settings.customLoop && (settings.customLoop.start !== undefined || settings.customLoop.end !== undefined)) {
            const start = settings.customLoop.start || 0;
            const end = settings.customLoop.end || 0;
            setCustomLoop({ start, end });
            if (start !== 0 || end !== 0) {
              setIsStartSet(true);
              if (end !== 0) {
                setIsEndSet(true);
              }
            }
          }
          if (typeof settings.playbackSpeed === 'number') {
            setPlaybackSpeed(settings.playbackSpeed);
          }
        }
      } catch (error) {
        console.error('Error loading audio settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (settingsLoaded) {
      saveAudioSettings({ loopMode });
    }
  }, [loopMode, settingsLoaded]);

  useEffect(() => {
    if (settingsLoaded) {
      saveAudioSettings({ customLoop });
    }
  }, [customLoop, settingsLoaded]);

  useEffect(() => {
    if (settingsLoaded) {
      saveAudioSettings({ playbackSpeed });
    }
  }, [playbackSpeed, settingsLoaded]);

  // Reset custom loop markers when changing Ayah
  useEffect(() => {
    if (currentPlayingAyah) {
      handleReset();
    }
  }, [currentPlayingAyah]);

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
        // If end marker is not set yet, loop to the end of duration (smooth play of entire Ayah)
        const loopEnd = isEndSet && customLoop.end > 0 ? customLoop.end : (duration > 0 ? duration : currentAudio.duration);
        if (loopEnd > 0 && currentAudio.currentTime > loopEnd) {
          currentAudio.currentTime = customLoop.start;
          currentAudio.play();
        }
      };
      currentAudio.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        currentAudio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [currentAudio, loopMode, customLoop, duration, isEndSet]);

  const handleSetStart = (time: number) => {
    const newStart = Math.max(0, Math.min(duration, time));
    if (isEndSet && newStart >= customLoop.end) {
      setCustomLoop({ start: newStart, end: 0 });
      setIsEndSet(false);
    } else {
      setCustomLoop(prev => ({ ...prev, start: newStart }));
    }
    setIsStartSet(true);
  };

  const handleSetEnd = (time: number) => {
    const newEnd = Math.max(0, Math.min(duration, time));
    if (isStartSet && newEnd <= customLoop.start) {
      setCustomLoop({ start: newEnd, end: customLoop.start });
      setIsStartSet(true);
      setIsEndSet(true);
    } else {
      setCustomLoop(prev => ({ ...prev, end: newEnd }));
      setIsEndSet(true);
    }
  };

  const handleReset = () => {
    setCustomLoop({ start: 0, end: 0 });
    setIsStartSet(false);
    setIsEndSet(false);
  };

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
          currentAudio.currentTime = Math.max(0, currentAudio.currentTime - 10);
          break;
        case 'ArrowRight':
          // Right arrow - Forward 10 seconds
          event.preventDefault();
          currentAudio.currentTime = Math.min(currentAudio.duration, currentAudio.currentTime + 10);
          break;
        case 'ArrowUp':
          // Up arrow - Volume up
          event.preventDefault();
          currentAudio.volume = Math.min(1, currentAudio.volume + 0.1);
          break;
        case 'ArrowDown':
          // Down arrow - Volume down
          event.preventDefault();
          currentAudio.volume = Math.max(0, currentAudio.volume - 0.1);
          break;
        case 'Escape':
          // Escape - Stop audio
          event.preventDefault();
          onStop();
          break;
        case 'm':
        case 'M': {
          event.preventDefault();
          setLoopMode('custom');
          setShowCustomLoopInputs(true);
          const now = currentAudio.currentTime;
          if (!isStartSet) {
            handleSetStart(now);
          } else if (isStartSet && !isEndSet) {
            handleSetEnd(now);
          } else {
            handleReset();
          }
          break;
        }
        case '[': {
          event.preventDefault();
          setLoopMode('custom');
          setShowCustomLoopInputs(true);
          handleSetStart(currentAudio.currentTime);
          break;
        }
        case ']': {
          event.preventDefault();
          setLoopMode('custom');
          setShowCustomLoopInputs(true);
          handleSetEnd(currentAudio.currentTime);
          break;
        }
        case 'c':
        case 'C': {
          if (loopMode === 'custom' || showCustomLoopInputs) {
            event.preventDefault();
            handleReset();
          }
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentAudio, onTogglePlayPause, onStop, isStartSet, isEndSet, loopMode, showCustomLoopInputs, duration, customLoop]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentAudio) return null;

  // Automatically open inputs when Custom Loop mode is activated
  useEffect(() => {
    if (loopMode === 'custom') {
      setShowCustomLoopInputs(true);
    } else {
      setShowCustomLoopInputs(false);
    }
  }, [loopMode]);

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[760px] lg:w-[880px] bg-white/75 dark:bg-[#12161A]/80 backdrop-blur-xl border-t md:border border-amber-200/30 dark:border-border/30 p-4 md:rounded-3xl shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] z-50 pb-safe transition-all duration-300 animate-fade-in-up">
      {/* Close button in top right */}
      <button
        onClick={onStop}
        className="absolute top-3 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
        title="Close Player"
        aria-label="Close Audio Player"
      >
        <XCircle className="w-4.5 h-4.5" />
      </button>

      <div className="w-full">
        {/* --- Top Bar Controls --- */}
        <div className="flex items-center gap-4 mb-3 flex-wrap justify-between border-b border-amber-200/10 dark:border-border/20 pb-2.5">
          <div className="flex items-center gap-3.5 flex-wrap">
            {/* Loop Mode Dropdown */}
            <div className="flex items-center gap-1.5 relative group">
              <button
                aria-label={
                  loopMode === 'infinite'
                    ? 'Infinite Loop Enabled'
                    : loopMode === 'custom'
                    ? 'Custom Loop Enabled'
                    : 'Loop Off'
                }
                className={`p-2 rounded-full border transition-all duration-200 ${
                  loopMode === 'infinite' || loopMode === 'custom' 
                    ? 'text-amber-700 dark:text-accent border-amber-300 dark:border-accent/40 bg-amber-500/10 dark:bg-accent/10 shadow-sm' 
                    : 'text-gray-400 border-gray-200/40 dark:border-gray-800/40 bg-transparent hover:text-gray-600 dark:hover:text-gray-200'
                }`}
                tabIndex={0}
                onClick={() => {
                  setLoopMode((prev) =>
                    prev === 'none' ? 'infinite' : prev === 'infinite' ? 'custom' : 'none'
                  );
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setLoopMode((prev) =>
                      prev === 'none' ? 'infinite' : prev === 'infinite' ? 'custom' : 'none'
                    );
                  }
                }}
              >
                {loopMode === 'infinite' ? (
                  <Repeat1 className="w-4.5 h-4.5" />
                ) : loopMode === 'custom' ? (
                  <Repeat className="w-4.5 h-4.5" />
                ) : (
                  <Repeat className="w-4.5 h-4.5 opacity-40" />
                )}
              </button>
              {loopMode === 'custom' && (
                <button
                  aria-label="Set Custom Loop Range"
                  className="px-2.5 py-1 text-[11px] font-sans font-medium rounded-lg bg-amber-500/10 dark:bg-accent/15 border border-amber-400/30 dark:border-accent/30 text-amber-800 dark:text-accent hover:bg-amber-500/20 dark:hover:bg-accent/25 transition-all"
                  onClick={() => setShowCustomLoopInputs(v => !v)}
                >
                  {showCustomLoopInputs ? 'Hide Editor' : 'Set Range'}
                </button>
              )}
            </div>
          </div>
          
          {/* Playback Speed */}
          <div className="flex items-center gap-2 relative group mr-6 md:mr-8">
            <FastForward className="w-4.5 h-4.5 text-amber-700/80 dark:text-accent/80" />
            <label htmlFor="audio-speed" className="text-xs font-medium text-amber-700 dark:text-amber-200 sr-only">Speed</label>
            <select
              id="audio-speed"
              className="rounded-lg px-2.5 py-1 text-xs bg-amber-50/60 dark:bg-[#181D23] border border-amber-200/40 dark:border-[#2C3440] dark:text-white focus:outline-none focus:ring-1 focus:ring-accent font-sans font-medium transition-all"
              value={playbackSpeed}
              aria-label="Playback Speed"
              onChange={e => setPlaybackSpeed(Number(e.target.value))}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x (Normal)</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>
        </div>

        {/* --- Custom Loop Timeline Panel --- */}
        {showCustomLoopInputs && (
          <div className="flex flex-col gap-2.5 w-full bg-amber-500/5 dark:bg-accent/5 border border-amber-200/20 dark:border-accent/10 rounded-2xl p-3.5 mb-3.5 animate-fade-in-up">
            {/* Header & Status */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-sans font-semibold text-amber-800 dark:text-accent flex items-center gap-1.5">
                  <Repeat className="w-4 h-4" /> Custom Loop Editor
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans">
                  ({isStartSet ? formatTime(customLoop.start) : '0:00'} - {isEndSet ? formatTime(customLoop.end) : formatTime(duration)})
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-sans">
                <span className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700 font-mono font-bold mr-1">M</span> Mark Hotkey
              </div>
            </div>

            {/* Visual Range Timeline */}
            <div className="relative h-6 bg-amber-500/5 dark:bg-black/40 rounded-xl overflow-hidden border border-amber-200/20 dark:border-border/30 flex items-center group/timeline select-none">
              {/* Loop Range Highlight */}
              {duration > 0 && (
                <div 
                  className="absolute h-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-400/10 dark:to-accent/10 border-l border-r border-amber-500/40 dark:border-accent/40"
                  style={{ 
                    left: `${(customLoop.start / duration) * 100}%`, 
                    width: `${(((isEndSet && customLoop.end > 0 ? customLoop.end : duration) - customLoop.start) / duration) * 100}%` 
                  }}
                />
              )}

              {/* Playback Head (Current Time) */}
              {duration > 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 dark:bg-red-400 shadow-sm z-10 pointer-events-none transition-all duration-100"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 dark:bg-red-400 rounded-full shadow-md" />
                </div>
              )}

              {/* Start Marker Pin */}
              {isStartSet && duration > 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-amber-600 dark:bg-accent z-20 pointer-events-none"
                  style={{ left: `${(customLoop.start / duration) * 100}%` }}
                >
                  <div className="absolute -bottom-1.5 -translate-x-1/2 bg-amber-600 dark:bg-accent text-white dark:text-gray-950 text-[9px] font-sans font-extrabold px-1 rounded shadow-sm">
                    S
                  </div>
                </div>
              )}

              {/* End Marker Pin */}
              {isEndSet && duration > 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-orange-650 dark:bg-amber-450 z-20 pointer-events-none"
                  style={{ left: `${(customLoop.end / duration) * 100}%` }}
                >
                  <div className="absolute -bottom-1.5 -translate-x-1/2 bg-orange-600 dark:bg-amber-400 text-white dark:text-gray-950 text-[9px] font-sans font-extrabold px-1 rounded shadow-sm">
                    E
                  </div>
                </div>
              )}
              
              {/* Click overlay to seek */}
              <div 
                className="absolute inset-0 cursor-pointer z-0" 
                onClick={(e) => {
                  if (!currentAudio || duration <= 0) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const targetTime = (clickX / rect.width) * duration;
                  currentAudio.currentTime = targetTime;
                }}
              />
            </div>

            {/* Button Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-amber-200/10 dark:border-border/10">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Set Start Button */}
                <button
                  type="button"
                  aria-label="Set start marker here"
                  onClick={() => handleSetStart(currentTime)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-accent border border-amber-500/20 rounded-xl text-xs font-sans font-semibold transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>Set Start</span>
                  <kbd className="hidden sm:inline bg-white/40 dark:bg-black/30 px-1 rounded text-[9px] border border-amber-500/20 font-sans font-bold">[</kbd>
                </button>

                {/* Set End Button */}
                <button
                  type="button"
                  aria-label="Set end marker here"
                  onClick={() => handleSetEnd(currentTime)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-amber-400 border border-orange-500/20 rounded-xl text-xs font-sans font-semibold transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span>Set End</span>
                  <kbd className="hidden sm:inline bg-white/40 dark:bg-black/30 px-1 rounded text-[9px] border border-orange-500/20 font-sans font-bold">]</kbd>
                </button>

                {/* Quick Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const now = currentAudio.currentTime;
                    if (!isStartSet) {
                      handleSetStart(now);
                    } else if (isStartSet && !isEndSet) {
                      handleSetEnd(now);
                    } else {
                      handleReset();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-accent text-white dark:text-gray-950 rounded-xl text-xs font-sans font-bold shadow-sm hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Flag className="w-3.5 h-3.5" />
                  {!isStartSet ? (
                    <>
                      <span>Mark Start</span>
                      <kbd className="bg-black/10 dark:bg-white/20 px-1 rounded text-[9px] font-bold">M</kbd>
                    </>
                  ) : !isEndSet ? (
                    <>
                      <span>Mark End</span>
                      <kbd className="bg-black/10 dark:bg-white/20 px-1 rounded text-[9px] font-bold">M</kbd>
                    </>
                  ) : (
                    <>
                      <span>Reset Markers</span>
                      <kbd className="bg-black/10 dark:bg-white/20 px-1 rounded text-[9px] font-bold">M</kbd>
                    </>
                  )}
                </button>
              </div>

              {/* Numeric Inputs & Reset */}
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                {/* Start Input */}
                <div className="flex items-center gap-1 bg-white/40 dark:bg-[#181D23]/40 px-2 py-0.5 rounded-lg border border-amber-250/20 dark:border-border/30">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans font-bold uppercase">Start:</span>
                  <input
                    type="number"
                    min={0}
                    max={Math.floor(duration)}
                    value={Number(customLoop.start.toFixed(1))}
                    step={0.1}
                    aria-label="Custom Loop Start (seconds)"
                    onChange={e => handleSetStart(Number(e.target.value))}
                    className="w-12 rounded px-1.5 py-0.5 border border-amber-200/40 dark:border-[#2C3440] bg-white dark:bg-[#181D23] dark:text-white text-center font-sans text-xs focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* End Input */}
                <div className="flex items-center gap-1 bg-white/40 dark:bg-[#181D23]/40 px-2 py-0.5 rounded-lg border border-amber-250/20 dark:border-border/30">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans font-bold uppercase">End:</span>
                  <input
                    type="number"
                    min={customLoop.start}
                    max={Math.floor(duration)}
                    value={isEndSet && customLoop.end > 0 ? Number(customLoop.end.toFixed(1)) : ''}
                    placeholder={duration > 0 ? Math.floor(duration).toString() : 'End'}
                    step={0.1}
                    aria-label="Custom Loop End (seconds)"
                    onChange={e => handleSetEnd(Number(e.target.value))}
                    className="w-12 rounded px-1.5 py-0.5 border border-amber-200/40 dark:border-[#2C3440] bg-white dark:bg-[#181D23] dark:text-white text-center font-sans text-xs focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Reset Button */}
                <button
                  type="button"
                  aria-label="Clear Markers"
                  className="p-2 rounded-xl bg-red-500/10 dark:bg-red-500/15 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all hover:scale-[1.02] active:scale-95"
                  onClick={handleReset}
                  title="Clear Markers (C)"
                >
                  <XCircle className="w-4 h-4" />
                </button>

                {/* Done Button */}
                <button
                  type="button"
                  aria-label="Done Setting Custom Loop"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 dark:bg-accent/20 text-xs font-sans font-bold hover:bg-amber-500/25 dark:hover:bg-accent/30 text-amber-800 dark:text-accent transition-colors"
                  onClick={() => setShowCustomLoopInputs(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* --- Playback Control Row --- */}
        <div className="flex items-center gap-4 md:gap-5 flex-wrap md:flex-nowrap">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={onTogglePlayPause}
              className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-accent text-white dark:text-gray-950 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
            >
              {isPlaying ? (
                <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Stop Button */}
            <button
              onClick={onStop}
              className="p-3 bg-gray-50 dark:bg-[#181D23] hover:bg-gray-100 dark:hover:bg-[#20262E] text-gray-600 dark:text-gray-300 border border-gray-200/40 dark:border-gray-800/40 rounded-full transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </div>

          {/* Current Ayah Info */}
          <div className="min-w-[130px] flex-shrink-0">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 font-sans uppercase tracking-wider">Now Playing</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white font-sans mt-0.5 truncate max-w-[180px]">
              {currentPlayingAyah ? `Surah ${currentPlayingAyah.surah}, Ayah ${currentPlayingAyah.ayah}` : 'No audio playing'}
            </div>
            <div className="text-xs text-amber-700/80 dark:text-accent/80 font-sans mt-0.5">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 min-w-[200px]">
            <div className="w-full bg-amber-200/30 dark:bg-[#20252C] rounded-full h-2 relative">
              <div 
                className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-accent h-2 rounded-full transition-all duration-100 shadow-sm"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}