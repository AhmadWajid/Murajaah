/**
 * Review Algorithms — Three spaced repetition strategies for Quran memorization.
 *
 * Research-based implementation drawing from:
 *  - FSRS-6 (Free Spaced Repetition Scheduler) — DSR model (Difficulty, Stability, Retrievability)
 *    https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm
 *  - SM-2 (SuperMemo 2) — Classic ease-factor algorithm used by Anki for years
 *  - Traditional Hifz methods — Sabak/Sabqi/Dhor + 7-3-2-1 method
 *
 * Beginner Mode (per-passage): When a passage is marked as "still learning",
 * intervals stay short until the student builds confidence. Auto-disables
 * after 5-7 successful reviews. Can always be re-toggled per passage.
 */

import { MemorizationItem, ReviewRating } from './spacedRepetition';
import { getUserTimeZone, getTodayInUserTimeZone, addDaysInUserTimeZone } from './utils';
import { DateTime } from 'luxon';

export type AlgorithmType = 'adaptive' | 'classic' | 'hifz';

export interface ReviewSettings {
  algorithm: AlgorithmType;
}

export const DEFAULT_SETTINGS: ReviewSettings = {
  algorithm: 'adaptive',
};

export const ALGORITHM_INFO: Record<AlgorithmType, { name: string; shortDesc: string; details: string; recommended?: boolean }> = {
  adaptive: {
    name: 'Adaptive',
    shortDesc: 'Learns your memory and adjusts automatically',
    recommended: true,
    details: 'This method tracks how difficult each passage is for you personally and how stable your memory of it is. When you rate a review, it uses that history to predict the best time to see it again — not too soon (wastes your time), not too late (you forget). Over time, passages you find easy get longer intervals automatically, while passages you struggle with come back sooner. This means fewer total reviews for the same retention — about 20-30% fewer than the classic method. Best for most users.',
  },
  classic: {
    name: 'Classic',
    shortDesc: 'Predictable intervals with a fixed ease factor',
    details: 'This is the SM-2 algorithm, the method Anki used for most of its history. Each passage has an "ease factor" (a multiplier) that starts at 2.5 and adjusts slightly based on your ratings: Easy increases it, Hard decreases it. Your next interval is always the previous interval multiplied by this factor. The rules are the same for everyone — two people who rate identically get identical schedules. Simple and predictable, but it doesn\'t adapt to your actual memory patterns.',
  },
  hifz: {
    name: 'Traditional Hifz',
    shortDesc: 'Fixed schedule based on traditional madrasa methods',
    details: 'This follows the 7-3-2-1 method used in traditional Quran memorization, combined with the Sabak/Sabqi/Dhor tier system. Reviews follow a fixed schedule: Day 1 → 2 → 4 → 7 → 14 → 30 → 60 → 90 → 180. When you rate Easy, you advance to the next tier. Medium keeps you at the current tier. Hard sends you back one tier. This is the method used in madrasas for centuries — it doesn\'t adapt to individual memory patterns, but it matches the traditional hifz curriculum that many students follow with their teachers.',
  },
};

/* ─── FSRS-6 Default Parameters ─── */
// Source: https://github.com/open-spaced-repetition/py-fsrs/blob/main/fsrs/scheduler.py
const FSRS_PARAMS = [
  0.212,    // w0:  initial stability for Again
  1.2931,   // w1:  initial stability for Hard
  2.3065,   // w2:  initial stability for Good (Medium)
  8.2956,   // w3:  initial stability for Easy
  6.4133,   // w4:  initial difficulty (D0 when rating = Again)
  0.8334,   // w5:  difficulty slope
  3.0194,   // w6:  difficulty delta multiplier
  0.001,    // w7:  mean reversion weight
  1.8722,   // w8:  stability growth base (e^w8)
  0.1666,   // w9:  stability decay (S^-w9)
  0.796,    // w10: retrievability impact on growth
  1.4835,   // w11: forget stability base
  0.0614,   // w12: forget difficulty impact (D^-w12)
  0.2629,   // w13: forget stability impact ((S+1)^w13 - 1)
  1.6483,   // w14: forget retrievability impact
  0.6014,   // w15: hard penalty multiplier
  1.8729,   // w16: easy bonus multiplier
  0.5425,   // w17: short-term stability growth
  0.0912,   // w18: short-term rating offset
  0.0658,   // w19: short-term stability decay
  0.1542,   // w20: forgetting curve decay
];

const DECAY = -FSRS_PARAMS[20];
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;
const DESIRED_RETENTION = 0.9;
const MAX_INTERVAL = 365;

/* ─── FSRS Core Functions ─── */

// Map our 3-grade system (easy/medium/hard) to FSRS 4-grade (1=again, 2=hard, 3=good, 4=easy)
// We don't have "again" (lapse), so hard=2, medium=3, easy=4
function ratingToGrade(rating: ReviewRating): number {
  if (rating === 'easy') return 4;
  if (rating === 'medium') return 3;
  return 2; // hard
}

// Initial stability after first review: S0(G) = w[G-1]
function initStability(grade: number): number {
  return Math.max(0.1, FSRS_PARAMS[grade - 1]);
}

// Initial difficulty: D0(G) = w4 - e^(w5*(G-1)) + 1, clamped to [1, 10]
function initDifficulty(grade: number): number {
  const d = FSRS_PARAMS[4] - Math.exp(FSRS_PARAMS[5] * (grade - 1)) + 1;
  return Math.min(10, Math.max(1, d));
}

// Next difficulty with linear damping and mean reversion
function nextDifficulty(d: number, grade: number): number {
  const deltaD = -FSRS_PARAMS[6] * (grade - 3);
  const dampedD = d + (deltaD * (10 - d) / 9);
  const d0Easy = initDifficulty(4); // mean reversion target
  const nextD = FSRS_PARAMS[7] * d0Easy + (1 - FSRS_PARAMS[7]) * dampedD;
  return Math.min(10, Math.max(1, nextD));
}

// Retrievability: R(t, S) = (1 + FACTOR * t/S)^DECAY
function retrievability(elapsedDays: number, stability: number): number {
  const t = Math.max(0, elapsedDays);
  const s = Math.max(0.1, stability);
  return Math.pow(1 + FACTOR * t / s, DECAY);
}

// Next interval from stability: I = (S / FACTOR) * (R^(1/DECAY) - 1)
function nextInterval(stability: number): number {
  const interval = (stability / FACTOR) * (Math.pow(DESIRED_RETENTION, 1 / DECAY) - 1);
  return Math.min(MAX_INTERVAL, Math.max(1, Math.round(interval)));
}

// Next stability after successful recall (Hard/Good/Easy)
// S'r = S * (1 + e^w8 * (11-D) * S^-w9 * (e^(w10*(1-R)) - 1) * hardPenalty * easyBonus)
function nextRecallStability(d: number, s: number, r: number, grade: number): number {
  const hardPenalty = grade === 2 ? FSRS_PARAMS[15] : 1;
  const easyBonus = grade === 4 ? FSRS_PARAMS[16] : 1;
  const growth = 1 +
    Math.exp(FSRS_PARAMS[8]) *
    (11 - d) *
    Math.pow(s, -FSRS_PARAMS[9]) *
    (Math.exp((1 - r) * FSRS_PARAMS[10]) - 1) *
    hardPenalty *
    easyBonus;
  return Math.max(0.1, s * growth);
}

// Next stability after lapse (Again)
// S'f = w11 * D^-w12 * ((S+1)^w13 - 1) * e^(w14*(1-R))
function nextForgetStability(d: number, s: number, r: number): number {
  const longTerm = FSRS_PARAMS[11] *
    Math.pow(d, -FSRS_PARAMS[12]) *
    (Math.pow(s + 1, FSRS_PARAMS[13]) - 1) *
    Math.exp((1 - r) * FSRS_PARAMS[14]);
  const shortTermCap = s / Math.exp(FSRS_PARAMS[17] * FSRS_PARAMS[18]);
  return Math.max(0.1, Math.min(longTerm, shortTermCap));
}

// Short-term stability (same-day review)
// S' = S * e^(w17*(G-3+w18)) * S^-w19
function shortTermStability(s: number, grade: number): number {
  const inc = Math.exp(FSRS_PARAMS[17] * (grade - 3 + FSRS_PARAMS[18])) * Math.pow(s, -FSRS_PARAMS[19]);
  // Ensure SInc >= 1 for non-Again ratings
  const clampedInc = grade >= 2 ? Math.max(1, inc) : inc;
  return Math.max(0.1, s * clampedInc);
}

/* ─── Helpers ─── */

function daysSinceCreation(item: MemorizationItem, tz: string): number {
  const createdAt = DateTime.fromISO(item.createdAt, { zone: tz });
  const todayDate = DateTime.now().setZone(tz).startOf('day');
  const daysPassed = todayDate.diff(createdAt, 'days').days;
  if (item.memorizationAge !== undefined) {
    return item.memorizationAge + daysPassed;
  }
  return daysPassed;
}

function daysSinceLastReview(item: MemorizationItem, tz: string): number {
  if (!item.lastReviewed) return 0;
  const lastReview = DateTime.fromISO(item.lastReviewed, { zone: tz });
  const todayDate = DateTime.now().setZone(tz).startOf('day');
  return Math.max(0, Math.floor(todayDate.diff(lastReview, 'days').days));
}

function shouldDisableBeginnerMode(item: MemorizationItem): boolean {
  // Count reviews since beginner mode was (re)enabled
  const startedAt = item.beginnerStartedAtReview ?? 0;
  const reviewsSinceEnabled = item.reviewCount - startedAt;

  // Need at least 5 reviews since beginner was enabled
  if (reviewsSinceEnabled < 5) return false;

  // Check individual verse ratings (from Quran page reviews)
  const ratings = Object.values(item.individualRatings || {});
  if (ratings.length >= 5) {
    const recentRatings = ratings.slice(-5);
    const successCount = recentRatings.filter((r) => r === 'easy' || r === 'medium').length;
    if (successCount >= 4) return true;
  }

  // Fallback: if enough reviews since enable and ease factor is healthy
  if (reviewsSinceEnabled >= 5 && item.easeFactor >= 2.3) return true;

  return false;
}

/**
 * Check if a specific item is currently in beginner mode.
 * Uses the per-item isBeginner flag, auto-disabled after enough successful reviews.
 */
export function isItemBeginner(item: MemorizationItem): boolean {
  if (!item.isBeginner) return false;
  return !shouldDisableBeginnerMode(item);
}

/* ─── 1. Adaptive Algorithm (FSRS-6) ─── */
/*
 * Uses the actual FSRS-6 formulas with default parameters.
 * Tracks per-item stability (S) and difficulty (D) stored on the item.
 * Falls back to deriving S/D from interval/easeFactor for existing items.
 *
 * Beginner mode: caps intervals based on review count so the student
 * gets frequent reinforcement while still making progress.
 */

function getStability(item: MemorizationItem): number {
  // Use stored stability if available, otherwise derive from interval
  if (item.stability && item.stability > 0) return item.stability;
  return Math.max(0.1, item.interval);
}

function getDifficulty(item: MemorizationItem): number {
  // Use stored difficulty if available, otherwise derive from easeFactor
  if (item.difficulty && item.difficulty > 0) return item.difficulty;
  // easeFactor 2.5 → difficulty ~2.25, easeFactor 1.3 → difficulty ~5.45
  return Math.min(10, Math.max(1, 11 - item.easeFactor * 3.5));
}

function adaptiveInterval(
  item: MemorizationItem,
  rating: ReviewRating,
  tz: string,
  beginnerMode: boolean,
): { interval: number; easeFactor: number; stability: number; difficulty: number } {
  const grade = ratingToGrade(rating);
  const elapsedDays = daysSinceLastReview(item, tz);
  const isFirstReview = item.reviewCount === 0;

  let s: number;
  let d: number;

  if (isFirstReview) {
    // First review: initialize S and D from FSRS default parameters
    s = initStability(grade);
    d = initDifficulty(grade);
  } else {
    // Subsequent reviews: update S and D using FSRS formulas
    const currentS = getStability(item);
    const currentD = getDifficulty(item);
    const r = retrievability(elapsedDays, currentS);

    if (elapsedDays < 1) {
      // Same-day review: use short-term formula
      s = shortTermStability(currentS, grade);
    } else {
      // Long-term review
      if (grade === 1) {
        // Again (lapse) — we don't use this, but handle it for completeness
        s = nextForgetStability(currentD, currentS, r);
      } else {
        // Hard / Good / Easy
        s = nextRecallStability(currentD, currentS, r, grade);
      }
    }

    d = nextDifficulty(currentD, grade);
  }

  // Calculate interval from stability
  let newInterval = nextInterval(s);

  // Beginner mode: keep intervals short while learning.
  // Use BOTH an absolute cap and a relative cap (fraction of computed interval)
  // so beginner mode always makes a visible difference.
  if (beginnerMode) {
    let absoluteCap: number;
    let relativeCap: number; // fraction of computed interval
    if (item.reviewCount < 2) {
      absoluteCap = 1;
      relativeCap = 0.5;
    } else if (item.reviewCount < 4) {
      absoluteCap = 2;
      relativeCap = 0.6;
    } else if (item.reviewCount < 6) {
      absoluteCap = 3;
      relativeCap = 0.7;
    } else if (item.reviewCount < 8) {
      absoluteCap = 5;
      relativeCap = 0.8;
    } else {
      absoluteCap = 7;
      relativeCap = 0.85;
    }
    // Apply the tighter of the two caps
    newInterval = Math.min(newInterval, absoluteCap, Math.max(1, Math.round(newInterval * relativeCap)));
  }

  // Update easeFactor for backward compatibility / display
  let newEaseFactor = item.easeFactor;
  if (rating === 'easy') newEaseFactor = Math.min(2.5, item.easeFactor + 0.1);
  else if (rating === 'hard') newEaseFactor = Math.max(1.3, item.easeFactor - 0.15);

  return { interval: newInterval, easeFactor: newEaseFactor, stability: s, difficulty: d };
}

/* ─── 2. Classic Algorithm (SM-2 style) ─── */
/*
 * Uses ease factor (starts at 2.5, floor 1.3).
 * I(1) = 1, I(2) = 6, I(n) = I(n-1) * EF
 * Beginner mode: forces daily review for first few reviews.
 */

function classicInterval(
  item: MemorizationItem,
  rating: ReviewRating,
  tz: string,
  beginnerMode: boolean,
): { interval: number; easeFactor: number; stability: number; difficulty: number } {
  // Update ease factor
  let newEaseFactor = item.easeFactor;
  if (rating === 'easy') newEaseFactor = Math.min(2.5, item.easeFactor + 0.1);
  else if (rating === 'hard') newEaseFactor = Math.max(1.3, item.easeFactor - 0.15);

  // Beginner mode: constrain intervals while learning
  if (beginnerMode && item.reviewCount < 3) {
    return { interval: 1, easeFactor: newEaseFactor, stability: 1, difficulty: 5 };
  }

  // SM-2 interval calculation
  let newInterval: number;
  if (item.reviewCount === 0) {
    newInterval = 1;
  } else if (item.reviewCount === 1) {
    newInterval = rating === 'easy' ? 3 : rating === 'medium' ? 2 : 1;
  } else {
    const ratingMultiplier = rating === 'easy' ? 1.3 : rating === 'medium' ? 1.0 : 0.5;
    newInterval = Math.round(item.interval * newEaseFactor * ratingMultiplier);
  }

  // Beginner mode: also cap at fraction of computed interval for later reviews
  if (beginnerMode) {
    const cap = item.reviewCount < 6 ? 3 : item.reviewCount < 8 ? 5 : 7;
    const fraction = item.reviewCount < 6 ? 0.6 : item.reviewCount < 8 ? 0.75 : 0.85;
    newInterval = Math.min(newInterval, cap, Math.max(1, Math.round(newInterval * fraction)));
  }

  newInterval = Math.max(1, Math.min(newInterval, MAX_INTERVAL));

  return { interval: newInterval, easeFactor: newEaseFactor, stability: newInterval, difficulty: 5 };
}

/* ─── 3. Traditional Hifz Algorithm (7-3-2-1 + Sabak/Sabqi/Dhor) ─── */

const HIFZ_SCHEDULE = [1, 2, 4, 7, 14, 30, 60, 90, 180];

function hifzInterval(
  item: MemorizationItem,
  rating: ReviewRating,
  tz: string,
  beginnerMode: boolean,
): { interval: number; easeFactor: number; stability: number; difficulty: number } {
  // Beginner mode: daily for first 3 reviews
  if (beginnerMode && item.reviewCount < 3) {
    return { interval: 1, easeFactor: item.easeFactor, stability: 1, difficulty: 5 };
  }

  const currentTier = Math.min(item.reviewCount, HIFZ_SCHEDULE.length - 1);

  let nextTier: number;
  if (rating === 'easy') {
    nextTier = Math.min(currentTier + 1, HIFZ_SCHEDULE.length - 1);
  } else if (rating === 'medium') {
    nextTier = currentTier;
  } else {
    nextTier = Math.max(0, currentTier - 1);
  }

  let newInterval = HIFZ_SCHEDULE[nextTier];

  // Beginner mode: cap at a lower tier than normal
  if (beginnerMode) {
    const maxTier = item.reviewCount < 6 ? 2 : item.reviewCount < 8 ? 4 : 5; // max 4/14/30 days
    const cappedInterval = HIFZ_SCHEDULE[Math.min(nextTier, maxTier)];
    newInterval = Math.min(newInterval, cappedInterval);
  }

  return { interval: newInterval, easeFactor: item.easeFactor, stability: newInterval, difficulty: 5 };
}

/* ─── Main entry point ─── */

export function calculateReviewInterval(
  item: MemorizationItem,
  rating: ReviewRating,
  settings: ReviewSettings,
  userTimeZone?: string,
): MemorizationItem {
  const tz = userTimeZone || getUserTimeZone();
  const today = getTodayInUserTimeZone(tz);

  // Per-item beginner mode (auto-disabled after enough successful reviews)
  const effectiveBeginner = isItemBeginner(item);

  let result: { interval: number; easeFactor: number; stability: number; difficulty: number };

  switch (settings.algorithm) {
    case 'classic':
      result = classicInterval(item, rating, tz, effectiveBeginner);
      break;
    case 'hifz':
      result = hifzInterval(item, rating, tz, effectiveBeginner);
      break;
    case 'adaptive':
    default:
      result = adaptiveInterval(item, rating, tz, effectiveBeginner);
      break;
  }

  const nextReviewDate = addDaysInUserTimeZone(today, result.interval, tz);

  // Auto-clear the isBeginner flag once the student has built confidence
  const shouldStillBeBeginner = item.isBeginner && !shouldDisableBeginnerMode(item);

  return {
    ...item,
    interval: result.interval,
    nextReview: nextReviewDate,
    easeFactor: result.easeFactor,
    reviewCount: item.reviewCount + 1,
    lastReviewed: today,
    completedToday: today,
    isBeginner: shouldStillBeBeginner,
    // Clear the started-at tracker when beginner mode ends
    beginnerStartedAtReview: shouldStillBeBeginner ? item.beginnerStartedAtReview : undefined,
    // Store FSRS memory state for the adaptive algorithm
    stability: result.stability,
    difficulty: result.difficulty,
  };
}

/* ─── Preview intervals (for UI display before rating) ─── */

export function previewIntervals(
  item: MemorizationItem,
  settings: ReviewSettings,
  userTimeZone?: string,
): { easy: number; medium: number; hard: number } {
  const tz = userTimeZone || getUserTimeZone();

  const easy = calculateReviewInterval(item, 'easy', settings, tz).interval;
  const medium = calculateReviewInterval(item, 'medium', settings, tz).interval;
  const hard = calculateReviewInterval(item, 'hard', settings, tz).interval;

  return { easy, medium, hard };
}

/* ─── Settings storage (localStorage) ─── */

const SETTINGS_KEY = 'mquran_review_settings';

export function getReviewSettings(): ReviewSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      algorithm: parsed.algorithm || DEFAULT_SETTINGS.algorithm,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveReviewSettings(settings: ReviewSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save review settings:', e);
  }
}
