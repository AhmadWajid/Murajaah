'use client';

import { useEffect, useRef, useState } from 'react';
import { Repeat, X } from 'lucide-react';
import { saveAudioSettings, loadAudioSettings } from '@/lib/storageService';

interface AudioPlayerProps {
  currentAudio: HTMLAudioElement | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentPlayingAyah: { surah: number; ayah: number } | null;
  onTogglePlayPause: () => void;
  onStop: () => void;
  onPlayNext?: () => void;
}

export default function AudioPlayer({
  currentAudio,
  isPlaying,
  currentTime,
  duration,
  currentPlayingAyah,
  onTogglePlayPause,
  onStop,
  onPlayNext,
}: AudioPlayerProps) {
  const [loopMode, setLoopMode] = useState<'none' | 'custom'>('none');
  const [customLoop, setCustomLoop] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showCustomLoopInputs, setShowCustomLoopInputs] = useState(false);
  const [isStartSet, setIsStartSet] = useState(false);
  const [isEndSet, setIsEndSet] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Drag state for loop markers
  const draggingMarker = useRef<'start' | 'end' | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const mobileProgressRef = useRef<HTMLDivElement>(null);

  // Cycle through speeds
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const cycleSpeed = () => {
    const currentIndex = speedOptions.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    setPlaybackSpeed(speedOptions[nextIndex]);
  };

  // Load initial settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await loadAudioSettings();
        if (settings) {
          if (settings.loopMode === 'none' || settings.loopMode === 'custom') {
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
    currentAudio.loop = false;
    if (loopMode === 'custom') {
      const handleTimeUpdate = () => {
        if (isEndSet && customLoop.end > 0 && currentAudio.currentTime > customLoop.end) {
          currentAudio.currentTime = customLoop.start;
          currentAudio.play();
        }
      };
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
    } else if (loopMode === 'none' && onPlayNext) {
      // No loop — auto-advance to next verse when audio ends
      const handleEnded = () => {
        onPlayNext();
      };
      currentAudio.addEventListener('ended', handleEnded);
      return () => {
        currentAudio.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentAudio, loopMode, customLoop, duration, isEndSet, onPlayNext]);

  // Auto-show/hide custom loop inputs
  useEffect(() => {
    if (loopMode === 'custom') setShowCustomLoopInputs(true);
    else setShowCustomLoopInputs(false);
  }, [loopMode]);

  // Unified drag handler for both progress scrubbing and loop marker dragging
  useEffect(() => {
    if (!isScrubbing && !draggingMarker.current) return;

    const getRef = () => progressRef.current || mobileProgressRef.current;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const ref = getRef();
      if (!ref || duration <= 0) return;
      if ('touches' in e) e.preventDefault();
      const rect = ref.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const time = (x / rect.width) * duration;
      if (!isFinite(time)) return;

      if (draggingMarker.current === 'start') {
        handleSetStart(time);
      } else if (draggingMarker.current === 'end') {
        handleSetEnd(time);
      } else if (isScrubbing && currentAudio) {
        currentAudio.currentTime = time;
      }
    };
    const onUp = () => {
      setIsScrubbing(false);
      draggingMarker.current = null;
    };

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
  }, [isScrubbing, draggingMarker.current, currentAudio, duration]);

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
      if (!currentAudio || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.metaKey || event.ctrlKey || event.altKey) return;
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
  const hasLoopMarkers = showCustomLoopInputs && (isStartSet || isEndSet);
  const isExpanded = isHoveringProgress || isScrubbing || !!draggingMarker.current;

  // ─── Shared progress bar with integrated loop markers ───
  const renderProgressBar = (ref: React.RefObject<HTMLDivElement | null>, isMobile: boolean) => {
    const trackH = isMobile
      ? 'h-1'
      : (isExpanded ? 'h-1.5' : 'h-1');

    return (
      <div
        ref={ref}
        className={`relative ${isMobile ? 'w-full h-7' : 'w-full h-5'} flex items-center cursor-pointer select-none`}
        onMouseDown={(e) => {
          if (!currentAudio || duration <= 0) return;
          // Check if clicking near a loop marker (within 8px)
          if (hasLoopMarkers) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const startX = (startPct / 100) * rect.width;
            const endX = (endPct / 100) * rect.width;
            if (isStartSet && Math.abs(clickX - startX) < 8) {
              e.stopPropagation();
              draggingMarker.current = 'start';
              return;
            }
            if (isEndSet && Math.abs(clickX - endX) < 8) {
              e.stopPropagation();
              draggingMarker.current = 'end';
              return;
            }
          }
          setIsScrubbing(true);
          const rect = e.currentTarget.getBoundingClientRect();
          currentAudio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
        }}
        onTouchStart={(e) => {
          if (!currentAudio || duration <= 0) return;
          if (hasLoopMarkers) {
            const rect = e.currentTarget.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const startX = (startPct / 100) * rect.width;
            const endX = (endPct / 100) * rect.width;
            if (isStartSet && Math.abs(touchX - startX) < 14) {
              e.stopPropagation();
              draggingMarker.current = 'start';
              return;
            }
            if (isEndSet && Math.abs(touchX - endX) < 14) {
              e.stopPropagation();
              draggingMarker.current = 'end';
              return;
            }
          }
          setIsScrubbing(true);
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.touches[0].clientX - rect.left;
          currentAudio.currentTime = (Math.max(0, Math.min(x, rect.width)) / rect.width) * duration;
        }}
      >
        {/* Track background */}
        <div className={`absolute left-0 right-0 rounded-full bg-black/[0.08] dark:bg-white/[0.08] transition-all duration-150 ${trackH}`}>

          {/* Loop region highlight — rendered on the track itself */}
          {hasLoopMarkers && duration > 0 && (
            <div
              className="absolute inset-y-0 rounded-full bg-amber-500/20 dark:bg-amber-400/15 transition-all duration-75"
              style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
            />
          )}

          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400 transition-[width] duration-75"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Loop start marker */}
        {isStartSet && hasLoopMarkers && duration > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            style={{ left: `${startPct}%` }}
          >
            {/* Vertical tick */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-[3px] rounded-full bg-amber-500 dark:bg-amber-400 shadow-sm transition-all duration-150 ${isMobile ? 'h-3.5 -top-[7px]' : isExpanded ? 'h-3 -top-[6px]' : 'h-2.5 -top-[5px]'}`} />
            {/* Time label — only on hover/scrub */}
            {(isExpanded || isMobile) && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-500 dark:bg-amber-400 text-white dark:text-gray-950 text-[7px] font-bold font-sans tabular-nums px-1 py-px rounded-full whitespace-nowrap pointer-events-none">
                {formatTime(customLoop.start)}
              </div>
            )}
          </div>
        )}

        {/* Loop end marker */}
        {isEndSet && hasLoopMarkers && duration > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            style={{ left: `${endPct}%` }}
          >
            <div className={`absolute left-1/2 -translate-x-1/2 w-[3px] rounded-full bg-orange-500 dark:bg-orange-400 shadow-sm transition-all duration-150 ${isMobile ? 'h-3.5 -top-[7px]' : isExpanded ? 'h-3 -top-[6px]' : 'h-2.5 -top-[5px]'}`} />
            {(isExpanded || isMobile) && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-orange-500 dark:bg-orange-400 text-white dark:text-gray-950 text-[7px] font-bold font-sans tabular-nums px-1 py-px rounded-full whitespace-nowrap pointer-events-none">
                {formatTime(customLoop.end)}
              </div>
            )}
          </div>
        )}

        {/* Progress thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-amber-500 dark:bg-amber-400 shadow transition-all duration-150 ${
            isMobile
              ? 'w-3 h-3 opacity-100'
              : isExpanded
                ? 'w-3 h-3 opacity-100'
                : 'w-0 h-0 opacity-0'
          }`}
          style={{ left: `${progressPct}%` }}
        />
      </div>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-5 md:left-1/2 md:-translate-x-1/2 z-50 animate-fade-in-up"
      style={{ maxWidth: '100%' }}
    >
      <div className="md:w-[480px] lg:w-[520px] md:mx-auto">

        {/* ═══ Main Player Bar ═══ */}
        <div
          className="relative border-t md:border border-black/[0.06] dark:border-white/[0.06] md:rounded-2xl overflow-visible"
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(28px) saturate(150%)',
            WebkitBackdropFilter: 'blur(28px) saturate(150%)',
            boxShadow: '0 -2px 20px -4px rgba(0,0,0,0.06), 0 8px 32px -8px rgba(0,0,0,0.12)',
          }}
        >
          {/* Dark mode overlay */}
          <div
            className="hidden dark:block absolute inset-0 md:rounded-2xl"
            style={{
              background: 'rgba(12,15,20,0.85)',
              backdropFilter: 'blur(28px) saturate(150%)',
              WebkitBackdropFilter: 'blur(28px) saturate(150%)',
              boxShadow: '0 -2px 20px -4px rgba(0,0,0,0.3), 0 12px 40px -8px rgba(0,0,0,0.5)',
            }}
          />

          {/* ── Content row ── */}
          <div className="relative flex items-center gap-2 px-3 py-2 md:px-3 md:py-1.5">

            {/* Play/Pause */}
            <button
              onClick={onTogglePlayPause}
              className="w-9 h-9 md:w-7 md:h-7 flex-shrink-0 flex items-center justify-center
                bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-400
                text-white rounded-full shadow-sm
                hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-150"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-3.5 h-3.5 md:w-3 md:h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 md:w-3 md:h-3 translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Ayah info */}
            <div className="flex-shrink-0 min-w-0">
              <p className="text-[11px] md:text-[10px] font-semibold text-gray-800 dark:text-gray-100 font-sans truncate leading-tight">
                {currentPlayingAyah
                  ? `${currentPlayingAyah.surah}:${currentPlayingAyah.ayah}`
                  : '—'}
              </p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-sans tabular-nums leading-tight">
                {formatTime(currentTime)}<span className="opacity-40"> / </span>{formatTime(duration)}
              </p>
            </div>

            {/* ── Desktop inline progress scrubber with integrated loop markers ── */}
            <div
              className="hidden md:flex flex-1 items-center"
              onMouseEnter={() => setIsHoveringProgress(true)}
              onMouseLeave={() => { if (!isScrubbing && !draggingMarker.current) setIsHoveringProgress(false); }}
            >
              {renderProgressBar(progressRef, false)}
            </div>

            {/* ── Right controls ── */}
            <div className="flex items-center gap-0.5 flex-shrink-0">

              {/* Speed */}
              <button
                onClick={cycleSpeed}
                className={`h-6 px-1.5 flex items-center justify-center rounded-md text-[10px] font-bold font-sans tabular-nums transition-all duration-150
                  ${playbackSpeed !== 1
                    ? 'bg-amber-500/12 dark:bg-amber-400/12 text-amber-600 dark:text-amber-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
                aria-label="Playback Speed"
              >
                {playbackSpeed}×
              </button>

              {/* Loop toggle */}
              <button
                aria-label={loopMode === 'custom' ? 'Loop On' : 'Loop Off'}
                onClick={() => setLoopMode(prev => prev === 'none' ? 'custom' : 'none')}
                className={`w-7 h-7 md:w-6 md:h-6 flex items-center justify-center rounded-lg transition-all duration-150 ${
                  loopMode === 'custom'
                    ? 'bg-amber-500/12 dark:bg-amber-400/12 text-amber-600 dark:text-amber-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                }`}
              >
                <Repeat className={`w-3.5 h-3.5 md:w-3 md:h-3 ${loopMode === 'none' ? 'opacity-40' : ''}`} />
              </button>

              {/* Close */}
              <button
                onClick={onStop}
                className="w-7 h-7 md:w-6 md:h-6 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-150"
                aria-label="Close Player"
              >
                <X className="w-3.5 h-3.5 md:w-3 md:h-3" />
              </button>
            </div>
          </div>

          {/* ── Mobile: full-width progress scrubber with integrated loop markers ── */}
          <div className="md:hidden relative px-3 pb-2 -mt-0.5">
            {renderProgressBar(mobileProgressRef, true)}
          </div>

          {/* ── Mobile: loop quick-actions when custom loop is active ── */}
          {showCustomLoopInputs && (
            <div className="md:hidden relative px-3 pb-2.5 -mt-1">
              <div className="flex items-center gap-1.5">
                {/* Set Start */}
                <button
                  type="button"
                  onClick={() => handleSetStart(currentTime)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold font-sans transition-all active:scale-95 ${
                    isStartSet
                      ? 'bg-amber-500/15 dark:bg-amber-400/12 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-400/15'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 border border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                  aria-label="Set loop start at current time"
                >
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-amber-500 dark:bg-amber-400 text-white dark:text-gray-950 text-[8px] font-bold flex-shrink-0">S</span>
                  {isStartSet ? formatTime(customLoop.start) : 'Start'}
                </button>

                {/* Set End */}
                <button
                  type="button"
                  onClick={() => handleSetEnd(currentTime)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold font-sans transition-all active:scale-95 ${
                    isEndSet
                      ? 'bg-orange-500/15 dark:bg-orange-400/12 text-orange-600 dark:text-orange-400 border border-orange-500/20 dark:border-orange-400/15'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 border border-black/[0.06] dark:border-white/[0.08]'
                  }`}
                  aria-label="Set loop end at current time"
                >
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-orange-500 dark:bg-orange-400 text-white dark:text-gray-950 text-[8px] font-bold flex-shrink-0">E</span>
                  {isEndSet ? formatTime(customLoop.end) : 'End'}
                </button>

                {/* Reset — only show when at least one marker is set */}
                {(isStartSet || isEndSet) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-semibold font-sans text-gray-400 dark:text-gray-500 bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] transition-all active:scale-95"
                    aria-label="Reset loop markers"
                  >
                    Reset
                  </button>
                )}

                {/* Loop range display */}
                {isStartSet && (
                  <span className="ml-auto text-[9px] text-gray-400 dark:text-gray-500 font-sans tabular-nums">
                    {formatTime(customLoop.start)} – {isEndSet ? formatTime(customLoop.end) : formatTime(duration)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}