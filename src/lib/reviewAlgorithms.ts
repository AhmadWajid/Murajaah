/**
 * Review Algorithms — Three spaced repetition strategies for Quran memorization.
 *
 * Research-based implementation drawing from:
 *  - FSRS-6 (Free Spaced Repetition Scheduler) — DSR model (Difficulty, Stability, Retrievability)
 *    https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm
 *  - SM-2 (SuperMemo 2) — Classic ease-factor algorithm used by Anki for years
 *  - An app-specific fixed ladder inspired by staged Hifz revision
 *
 * Beginner Mode (per-passage): When a passage is marked as "still learning",
 * intervals stay short until the student builds confidence. Auto-disables
 * after five successful reviews on separate calendar days. Can always be re-toggled per passage.
 */

import type { MemorizationItem, ReviewRating } from './spacedRepetition';
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
  adaptive: { name: 'Adaptive', shortDesc: 'FSRS-6 memory model', recommended: true,
    details: 'Estimates stability and difficulty using FSRS-6 default parameters and a 90% model retention target. Easy means fluent unaided recall; Medium means successful but effortful recall; Hard means needed help or forgot. The target is a model estimate, not a Quran-specific guarantee. Intervals are capped at 365 days.' },
  classic: { name: 'Classic', shortDesc: 'Simple ease-based progression',
    details: 'An SM-2-inspired three-rating scheduler, not exact SM-2. Successful spaced reviews grow intervals with ease. Hard returns to daily review. Early reviews use elapsed days to avoid awarding a full interval of growth.' },
  hifz: { name: 'Traditional Hifz', shortDesc: 'Fixed revision ladder',
    details: 'An app-specific ladder inspired by staged revision: 1, 2, 4, 7, 14, 30, 60, 90, 180 days. Easy advances one tier when due; Medium holds; Hard restarts daily review. This is not a universal traditional curriculum. Keep continuous recitation and teacher-led revision alongside scheduled passage reviews.' },
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
// Three-button contract: hard=Again, medium=Good, easy=Easy.
function ratingToGrade(rating: ReviewRating): number {
  if (rating === 'easy') return 4;
  if (rating === 'medium') return 3;
  return 1; // Hard means failed unaided recitation in this three-button app.
}

// Initial stability after first review: S0(G) = w[G-1]
function initStability(grade: number): number {
  return Math.max(0.01, FSRS_PARAMS[grade - 1]);
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
  const d0Easy = FSRS_PARAMS[4] - Math.exp(FSRS_PARAMS[5] * 3) + 1; // mean reversion target
  const nextD = FSRS_PARAMS[7] * d0Easy + (1 - FSRS_PARAMS[7]) * dampedD;
  return Math.min(10, Math.max(1, nextD));
}

// Retrievability: R(t, S) = (1 + FACTOR * t/S)^DECAY
function retrievability(elapsedDays: number, stability: number): number {
  const t = Math.max(0, elapsedDays);
  const s = Math.max(0.01, stability);
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
  return Math.max(0.01, s * growth);
}

// Next stability after lapse (Again)
// S'f = w11 * D^-w12 * ((S+1)^w13 - 1) * e^(w14*(1-R))
function nextForgetStability(d: number, s: number, r: number): number {
  const longTerm = FSRS_PARAMS[11] *
    Math.pow(d, -FSRS_PARAMS[12]) *
    (Math.pow(s + 1, FSRS_PARAMS[13]) - 1) *
    Math.exp((1 - r) * FSRS_PARAMS[14]);
  const shortTermCap = s / Math.exp(FSRS_PARAMS[17] * FSRS_PARAMS[18]);
  return Math.max(0.01, Math.min(longTerm, shortTermCap));
}

// Short-term stability (same-day review)
// S' = S * e^(w17*(G-3+w18)) * S^-w19
function shortTermStability(s: number, grade: number): number {
  const inc = Math.exp(FSRS_PARAMS[17] * (grade - 3 + FSRS_PARAMS[18])) * Math.pow(s, -FSRS_PARAMS[19]);
  // Ensure SInc >= 1 for non-Again ratings
  const clampedInc = grade >= 2 ? Math.max(1, inc) : inc;
  return Math.max(0.01, s * clampedInc);
}

/* ─── Helpers ─── */

/** Calendar days, including across DST. Date-only values are floating local dates. */
export function reviewDay(value: string, zone: string): string {
  const date = DateTime.fromISO(value, { zone });
  if (!date.isValid) throw new RangeError('Invalid review date or timezone');
  return date.toISODate()!;
}

export function elapsedReviewDays(previous: string | undefined, today: string, zone: string): number {
  if (!previous) return 0;
  const last = DateTime.fromISO(previous, { zone }).startOf('day');
  if (!last.isValid) return 0;
  return Math.max(0, Math.round(DateTime.fromISO(today, { zone }).diff(last, 'days').days));
}

/**
 * Check if a specific item is currently in beginner mode.
 * Uses the per-item isBeginner flag, auto-disabled after enough successful reviews.
 */
export function isItemBeginner(item: MemorizationItem): boolean {
  return !!item.isBeginner;
}

/* ─── 1. Adaptive Algorithm (FSRS-6) ─── */
/*
 * FSRS-6 memory formulas with default parameters, wrapped in a daily recitation policy.
 * Tracks per-item stability (S) and difficulty (D) stored on the item.
 * Falls back to deriving S/D from interval/easeFactor for existing items.
 *
 * Beginner mode: caps intervals based on review count so the student
 * gets frequent reinforcement while still making progress.
 */

function getStability(item: MemorizationItem): number {
  // Use stored stability if available, otherwise derive from interval
  if (item.stability && item.stability > 0) return item.stability;
  return Math.max(0.01, item.interval);
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
  elapsedDays: number,
): { interval: number; easeFactor: number; stability?: number; difficulty?: number } {
  const grade = ratingToGrade(rating);
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
        // Failed unaided recitation.
        s = nextForgetStability(currentD, currentS, r);
      } else {
        // Hard / Good / Easy
        s = nextRecallStability(currentD, currentS, r, grade);
      }
    }

    d = nextDifficulty(currentD, grade);
  }

  // Calculate interval from stability
  const newInterval = nextInterval(s);

  // Update easeFactor for backward compatibility / display
  let newEaseFactor = item.easeFactor;
  if (rating === 'easy') newEaseFactor = Math.min(2.5, item.easeFactor + 0.1);
  else if (rating === 'hard') newEaseFactor = Math.max(1.3, item.easeFactor - 0.15);

  return { interval: newInterval, easeFactor: newEaseFactor, stability: s, difficulty: d };
}

/* ─── 2. Classic Algorithm (SM-2 style) ─── */
/*
 * Uses ease factor (starts at 2.5, floor 1.3).
 * First success: 1 day; second: Easy 3 / Medium 2; later: elapsed-adjusted ease growth.
 * Beginner mode: forces daily review for first few reviews.
 */

function classicInterval(
  item: MemorizationItem,
  rating: ReviewRating,
  elapsedDays: number,
): { interval: number; easeFactor: number; stability?: number; difficulty?: number } {
  // Update ease factor
  let newEaseFactor = item.easeFactor;
  if (rating === 'easy') newEaseFactor = Math.min(2.5, item.easeFactor + 0.1);
  else if (rating === 'hard') newEaseFactor = Math.max(1.3, item.easeFactor - 0.15);

  // SM-2 interval calculation
  let newInterval: number;
  if (rating === 'hard') {
    newInterval = 1;
  } else if (item.reviewCount === 0) {
    newInterval = 1;
  } else if (item.reviewCount === 1) {
    newInterval = rating === 'easy' ? 3 : 2;
  } else {
    const ratingMultiplier = rating === 'easy' ? 1.3 : 1.0;
    newInterval = Math.round(Math.min(item.interval, Math.max(1, elapsedDays)) * newEaseFactor * ratingMultiplier);
  }

  newInterval = Math.max(1, Math.min(newInterval, MAX_INTERVAL));

  return { interval: newInterval, easeFactor: newEaseFactor, stability: undefined, difficulty: undefined };
}

/* ─── 3. Traditional Hifz: app-specific fixed ladder ─── */

const HIFZ_SCHEDULE = [1, 2, 4, 7, 14, 30, 60, 90, 180];

function hifzInterval(
  item: MemorizationItem,
  rating: ReviewRating,
  elapsedDays: number,
): { interval: number; easeFactor: number; stability?: number; difficulty?: number } {
  const currentTier = Math.max(0, HIFZ_SCHEDULE.findLastIndex(days => days <= item.interval));

  let nextTier: number;
  if (rating === 'easy') {
    nextTier = Math.min(currentTier + 1, HIFZ_SCHEDULE.length - 1);
  } else if (rating === 'medium') {
    nextTier = currentTier;
  } else {
    // Hard now means unaided recall failed. A 180→90 day retreat would be unsafe
    // as a recovery schedule; restart the existing ladder at daily revision.
    nextTier = 0;
  }

  let newInterval = HIFZ_SCHEDULE[nextTier];

  if (item.reviewCount === 0) newInterval = 1;
  if (rating !== 'hard' && elapsedDays < item.interval && item.reviewCount > 0) newInterval = item.interval;
  return { interval: newInterval, easeFactor: item.easeFactor, stability: undefined, difficulty: undefined };
}

/* ─── Main entry point ─── */

export const SCHEDULERS = {
  adaptive: { name: 'Adaptive', metrics: ['stability', 'difficulty'] as const, apply: adaptiveInterval },
  classic: { name: 'Classic', metrics: ['easeFactor'] as const, apply: classicInterval },
  hifz: { name: 'Traditional Hifz', metrics: [] as const, apply: hifzInterval },
};

const finite = (value: number | undefined, fallback: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value!)) : fallback;

/** Safe, lazy normalization: no writes or rescheduling on load. */
export function normalizeSchedulingItem(item: MemorizationItem): MemorizationItem {
  const reviewCount = Math.floor(finite(item.reviewCount, 0, 0, 1_000_000));
  return { ...item,
    interval: Math.round(finite(item.interval, 1, 1, MAX_INTERVAL)),
    easeFactor: finite(item.easeFactor, 2.5, 1.3, 2.5), reviewCount,
    stability: item.stability == null ? undefined : finite(item.stability, 1, 0.01, 36500),
    difficulty: item.difficulty == null ? undefined : finite(item.difficulty, 5, 1, 10),
    beginnerStartedAtReview: Math.floor(finite(item.beginnerStartedAtReview, reviewCount, 0, reviewCount)),
  };
}

/** Canonical scheduler. Supplying reviewDate and zone makes it deterministic and storage-free. */
export function calculateReviewInterval(
  input: MemorizationItem,
  rating: ReviewRating,
  settings: ReviewSettings,
  userTimeZone?: string,
  reviewDate?: string,
): MemorizationItem {
  const tz = userTimeZone || getUserTimeZone();
  const today = reviewDay(reviewDate ?? getTodayInUserTimeZone(tz), tz);
  if (!['easy', 'medium', 'hard'].includes(rating)) throw new RangeError('Invalid review rating');
  const item = normalizeSchedulingItem(input);
  if (reviewDate && item.lastReviewed && DateTime.fromISO(item.lastReviewed, { zone: tz }).isValid && reviewDay(item.lastReviewed, tz) > today) {
    throw new RangeError('Review date precedes last review');
  }
  const hasLastReview = !!item.lastReviewed && DateTime.fromISO(item.lastReviewed, { zone: tz }).isValid;
  // Legacy records with a count but no valid date are treated as due, not same-day practice.
  const elapsed = hasLastReview ? elapsedReviewDays(item.lastReviewed, today, tz) : item.interval;
  const beginner = !!item.isBeginner;
  const algorithm = Object.hasOwn(SCHEDULERS, settings.algorithm) ? settings.algorithm : 'adaptive';
  const result = SCHEDULERS[algorithm].apply(item, rating, elapsed);
  let interval = Math.round(finite(result.interval, 1, 1, MAX_INTERVAL));
  // Daily recitation policy: repeated clicks/practice on one date are not independent
  // long-term recall evidence. Keep memory/schedule on success; still process failures.
  const sameDaySuccess = hasLastReview && item.reviewCount > 0 && elapsed === 0 && rating !== 'hard';
  if (sameDaySuccess) {
    interval = item.interval;
    result.easeFactor = item.easeFactor;
    result.stability = algorithm === 'adaptive' ? item.stability : undefined;
    result.difficulty = algorithm === 'adaptive' ? item.difficulty : undefined;
  }
  let startedAt = item.beginnerStartedAtReview ?? item.reviewCount;
  if (beginner && (rating === 'hard' || sameDaySuccess)) startedAt = rating === 'hard' ? item.reviewCount + 1 : startedAt + 1;
  const successes = item.reviewCount + 1 - startedAt;
  const stillBeginner = beginner && successes < 5;
  if (beginner) interval = Math.min(interval, [1, 1, 2, 3, 5][Math.min(4, Math.max(0, successes - 1))]);
  return {
    ...item, ...result, interval,
    nextReview: sameDaySuccess && interval === item.interval && DateTime.fromISO(item.nextReview, { zone: tz }).isValid && reviewDay(item.nextReview, tz) > today
      ? reviewDay(item.nextReview, tz) : addDaysInUserTimeZone(today, interval, tz),
    stability: result.stability == null ? undefined : finite(result.stability, 1, 0.01, 36500),
    difficulty: result.difficulty == null ? undefined : finite(result.difficulty, 5, 1, 10),
    reviewCount: item.reviewCount + 1, lastReviewed: today, completedToday: today,
    isBeginner: stillBeginner, beginnerStartedAtReview: stillBeginner ? startedAt : undefined,
    individualRatings: undefined,
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
export const REVIEW_SETTINGS_EVENT = 'mquran:review-settings-changed';

export function getReviewSettings(): ReviewSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      algorithm: parsed && Object.hasOwn(SCHEDULERS, parsed.algorithm) ? parsed.algorithm : DEFAULT_SETTINGS.algorithm,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveReviewSettings(settings: ReviewSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event(REVIEW_SETTINGS_EVENT));
  } catch (e) {
    console.error('Failed to save review settings:', e);
  }
}
