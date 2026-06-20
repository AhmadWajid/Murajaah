'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Repeat, Repeat1, FastForward, X } from 'lucide-react';
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
  onStop,
}: AudioPlayerProps) {
  const [loopMode, setLoopMode] = useState<'none' | 'infinite' | 'custom'>('none');
  const [customLoop, setCustomLoop] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showCustomLoopInputs, setShowCustomLoopInputs] = useState(false);
  const [isStartSet, setIsStartSet] = useState(false);
  const [isEndSet, setIsEndSet] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Drag state
  const draggingMarker = useRef<'start' | 'end' | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

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
              if (end !== 0) setIsEndSet(true);
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

  useEffect(() => {
    if (settingsLoaded) saveAudioSettings({ loopMode });
  }, [loopMode, settingsLoaded]);

  useEffect(() => {
    if (settingsLoaded) saveAudioSettings({ customLoop });
  }, [customLoop, settingsLoaded]);

  useEffect(() => {
    if (settingsLoaded) saveAudioSettings({ playbackSpeed });
  }, [playbackSpeed, settingsLoaded]);

  // Reset custom loop markers when changing Ayah
  useEffect(() => {
    if (currentPlayingAyah) handleReset();
  }, [currentPlayingAyah]);

  // Apply playback speed
  useEffect(() => {
    if (currentAudio) currentAudio.playbackRate = playbackSpeed;
  }, [currentAudio, playbackSpeed]);

  // Handle loop logic
  useEffect(() => {
    if (!currentAudio) return;
    currentAudio.loop = loopMode === 'infinite';
    if (loopMode === 'custom') {
      // Mid-playback: if an end marker is set and we pass it, jump back
      const handleTimeUpdate = () => {
        if (isEndSet && customLoop.end > 0 && currentAudio.currentTime > customLoop.end) {
          currentAudio.currentTime = customLoop.start;
          currentAudio.play();
        }
      };
      // Natural end of track: always loop back to start marker
      const handleEnded = () => {
        currentAudio.currentTime = customLoop.start;
        currentAudio.play();
      };
      currentAudio.addEventListener('timeupdate', handleTimeUpdate);
      currentAudio.addEventListener('ended', handleEnded);
      return () => {
        currentAudio.removeEventListener('timeupdate', handleTimeUpdate);
        currentAudio.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentAudio, loopMode, customLoop, duration, isEndSet]);

  // Auto-show/hide custom loop editor
  useEffect(() => {
    if (loopMode === 'custom') setShowCustomLoopInputs(true);
    else setShowCustomLoopInputs(false);
  }, [loopMode]);

  // Drag helpers
  const getPosFromEvent = useCallback((e: MouseEvent | TouchEvent, rect: DOMRect): number => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return (x / rect.width) * duration;
  }, [duration]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingMarker.current || !timelineRef.current || duration <= 0) return;
      if ('touches' in e) e.preventDefault();
      const rect = timelineRef.current.getBoundingClientRect();
      const time = getPosFromEvent(e, rect);
      if (draggingMarker.current === 'start') {
        handleSetStart(time);
      } else {
        handleSetEnd(time);
      }
    };
    const onUp = () => { draggingMarker.current = null; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [duration, getPosFromEvent]);

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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!currentAudio || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      switch (event.key) {
        case ' ':
          event.preventDefault();
          onTogglePlayPause();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          currentAudio.currentTime = Math.max(0, currentAudio.currentTime - 10);
          break;
        case 'ArrowRight':
          event.preventDefault();
          currentAudio.currentTime = Math.min(currentAudio.duration, currentAudio.currentTime + 10);
          break;
        case 'ArrowUp':
          event.preventDefault();
          currentAudio.volume = Math.min(1, currentAudio.volume + 0.1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          currentAudio.volume = Math.max(0, currentAudio.volume - 0.1);
          break;
        case 'Escape':
          event.preventDefault();
          onStop();
          break;
        case 'm':
        case 'M': {
          event.preventDefault();
          setLoopMode('custom');
          setShowCustomLoopInputs(true);
          const now = currentAudio.currentTime;
          if (!isStartSet) handleSetStart(now);
          else if (!isEndSet) handleSetEnd(now);
          else handleReset();
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

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const startPct = duration > 0 ? (customLoop.start / duration) * 100 : 0;
  const endPct = duration > 0 ? ((isEndSet && customLoop.end > 0 ? customLoop.end : duration) / duration) * 100 : 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:w-[720px] lg:w-[820px] z-50 animate-fade-in-up">
      {/* Main player card */}
      <div className="bg-white dark:bg-[#0f1318] border-t md:border border-black/[0.08] dark:border-white/[0.08] md:rounded-2xl shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08),0_8px_32px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4),0_16px_48px_rgba(0,0,0,0.6)]">

        {/* Progress bar — sits flush at the top */}
        <div
          className="relative h-1 w-full md:rounded-t-2xl overflow-hidden cursor-pointer group/progress"
          onClick={(e) => {
            if (!currentAudio || duration <= 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            currentAudio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
          }}
        >
          <div className="absolute inset-0 bg-black/[0.06] dark:bg-white/[0.06]" />
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 transition-[width] duration-100"
            style={{ width: `${progressPct}%` }}
          />
          {/* Hover thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-500 dark:bg-amber-400 shadow opacity-0 group-hover/progress:opacity-100 transition-opacity -translate-x-1/2"
            style={{ left: `${progressPct}%` }}
          />
        </div>

        {/* Main content */}
        <div className="px-4 pt-3 pb-4 md:px-5 md:pt-3.5 md:pb-4">

          {/* Row 1: Now playing + controls + close */}
          <div className="flex items-center gap-3">

            {/* Play / Stop */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onTogglePlayPause}
                className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Ayah info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600/80 dark:text-amber-400/70 font-sans leading-none mb-0.5">
                Now Playing
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white font-sans truncate leading-tight">
                {currentPlayingAyah
                  ? `Surah ${currentPlayingAyah.surah} · Ayah ${currentPlayingAyah.ayah}`
                  : 'No audio playing'}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-sans tabular-nums mt-0.5">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Loop toggle */}
              <button
                aria-label={loopMode === 'infinite' ? 'Infinite Loop' : loopMode === 'custom' ? 'Custom Loop' : 'Loop Off'}
                onClick={() => setLoopMode(prev => prev === 'none' ? 'infinite' : prev === 'infinite' ? 'custom' : 'none')}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                  loopMode !== 'none'
                    ? 'bg-amber-500/15 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400'
                    : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/5'
                }`}
              >
                {loopMode === 'infinite' ? <Repeat1 className="w-4 h-4" /> : <Repeat className={`w-4 h-4 ${loopMode === 'none' ? 'opacity-50' : ''}`} />}
              </button>

              {/* Speed */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100/70 dark:bg-white/5 border border-black/[0.05] dark:border-white/[0.06]">
                <FastForward className="w-3 h-3 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                <select
                  id="audio-speed"
                  className="text-[11px] font-semibold font-sans bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer appearance-none"
                  value={playbackSpeed}
                  aria-label="Playback Speed"
                  onChange={e => setPlaybackSpeed(Number(e.target.value))}
                >
                  <option value={0.5}>0.5×</option>
                  <option value={0.75}>0.75×</option>
                  <option value={1}>1×</option>
                  <option value={1.25}>1.25×</option>
                  <option value={1.5}>1.5×</option>
                  <option value={2}>2×</option>
                </select>
              </div>

              {/* Close */}
              <button
                onClick={onStop}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-white/5 transition-all"
                aria-label="Close Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Custom Loop editor — only when active */}
          {showCustomLoopInputs && (
            <div className="mt-3 rounded-xl bg-amber-500/[0.06] dark:bg-amber-400/[0.05] border border-amber-500/[0.12] dark:border-amber-400/[0.1] p-3 space-y-2.5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 font-sans">Loop Range</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans tabular-nums">
                    {isStartSet ? formatTime(customLoop.start) : '0:00'} – {isEndSet ? formatTime(customLoop.end) : formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="text-[9px] font-mono font-bold bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">M</kbd>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans">mark</span>
                </div>
              </div>

              {/* ─── Draggable Timeline ─── */}
              <div
                ref={timelineRef}
                className="relative h-10 rounded-lg overflow-visible bg-black/[0.04] dark:bg-black/40 border border-black/[0.06] dark:border-white/[0.06] cursor-pointer select-none"
                onClick={(e) => {
                  // Only seek if we're not dragging
                  if (draggingMarker.current || !currentAudio || duration <= 0) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  currentAudio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
                }}
              >
                {/* Loop region fill */}
                {duration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 dark:from-amber-400/15 dark:to-orange-400/15 border-x border-amber-500/30 dark:border-amber-400/30"
                    style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
                  />
                )}

                {/* Playhead */}
                {duration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-red-500 dark:bg-red-400 pointer-events-none z-10 transition-[left] duration-100"
                    style={{ left: `${progressPct}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500 dark:bg-red-400 shadow" />
                  </div>
                )}

                {/* Start marker — draggable */}
                {isStartSet && duration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 z-20 flex items-center justify-center"
                    style={{ left: `${startPct}%` }}
                  >
                    {/* line */}
                    <div className="absolute inset-y-0 w-0.5 bg-amber-500 dark:bg-amber-400" />
                    {/* drag handle */}
                    <div
                      className="absolute -left-3 w-6 h-full cursor-ew-resize"
                      onMouseDown={(e) => { e.stopPropagation(); draggingMarker.current = 'start'; }}
                      onTouchStart={(e) => { e.stopPropagation(); draggingMarker.current = 'start'; }}
                    />
                    {/* label chip */}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-amber-500 dark:bg-amber-400 text-white dark:text-gray-950 text-[9px] font-extrabold font-sans px-1.5 py-0.5 rounded-full shadow-sm pointer-events-none whitespace-nowrap">
                      S
                    </div>
                    {/* top time tooltip */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800/80 dark:bg-black/70 text-white text-[9px] font-sans px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap">
                      {formatTime(customLoop.start)}
                    </div>
                  </div>
                )}

                {/* End marker — draggable */}
                {isEndSet && duration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 z-20 flex items-center justify-center"
                    style={{ left: `${(customLoop.end / duration) * 100}%` }}
                  >
                    <div className="absolute inset-y-0 w-0.5 bg-orange-500 dark:bg-orange-400" />
                    <div
                      className="absolute -left-3 w-6 h-full cursor-ew-resize"
                      onMouseDown={(e) => { e.stopPropagation(); draggingMarker.current = 'end'; }}
                      onTouchStart={(e) => { e.stopPropagation(); draggingMarker.current = 'end'; }}
                    />
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-orange-500 dark:bg-orange-400 text-white dark:text-gray-950 text-[9px] font-extrabold font-sans px-1.5 py-0.5 rounded-full shadow-sm pointer-events-none whitespace-nowrap">
                      E
                    </div>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800/80 dark:bg-black/70 text-white text-[9px] font-sans px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap">
                      {formatTime(customLoop.end)}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSetStart(currentTime)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/15 text-[11px] font-semibold font-sans transition-all active:scale-95"
                >
                  Set Start
                  <kbd className="ml-0.5 font-mono text-[9px] bg-white/50 dark:bg-black/30 px-1 rounded border border-amber-500/20">[</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetEnd(currentTime)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/15 text-[11px] font-semibold font-sans transition-all active:scale-95"
                >
                  Set End
                  <kbd className="ml-0.5 font-mono text-[9px] bg-white/50 dark:bg-black/30 px-1 rounded border border-orange-500/20">]</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const now = currentAudio.currentTime;
                    if (!isStartSet) handleSetStart(now);
                    else if (!isEndSet) handleSetEnd(now);
                    else handleReset();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 text-white dark:text-gray-950 text-[11px] font-bold font-sans shadow-sm hover:opacity-90 active:scale-95 transition-all"
                >
                  {!isStartSet ? 'Mark Start' : !isEndSet ? 'Mark End' : 'Reset'}
                  <kbd className="ml-0.5 font-mono text-[9px] bg-black/10 dark:bg-white/20 px-1 rounded">M</kbd>
                </button>

                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-sans">
                    Start: <input
                      type="number" min={0} max={Math.floor(duration)} step={0.1}
                      value={Number(customLoop.start.toFixed(1))}
                      aria-label="Loop start seconds"
                      onChange={e => handleSetStart(Number(e.target.value))}
                      className="w-11 text-center text-[10px] font-sans bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 rounded px-1 py-0.5 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </span>
                  <span className="text-[10px] text-gray-400 font-sans">
                    End: <input
                      type="number" min={customLoop.start} max={Math.floor(duration)} step={0.1}
                      value={isEndSet && customLoop.end > 0 ? Number(customLoop.end.toFixed(1)) : ''}
                      placeholder={duration > 0 ? Math.floor(duration).toString() : '—'}
                      aria-label="Loop end seconds"
                      onChange={e => handleSetEnd(Number(e.target.value))}
                      className="w-11 text-center text-[10px] font-sans bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 rounded px-1 py-0.5 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}