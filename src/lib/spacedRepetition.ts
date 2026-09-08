export interface MemorizationItem {
  id: string;
  surah: number;
  ayahStart: number;
  ayahEnd: number;
  interval: number;
  nextReview: string; // ISO date string
  easeFactor: number;
  reviewCount: number;
  lastReviewed?: string;
  completedToday?: string; // ISO date string for daily completion tracking
  createdAt: string;
  memorizationAge?: number; // Days since first memorized (user-specified)
  individualRatings?: Record<number, 'easy' | 'medium' | 'hard'>;
  individualRecallQuality?: Record<number, RecallQuality>;
  rukuStart?: number;
  rukuEnd?: number;
  rukuCount?: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  
  // Optional metadata for named memorization sets
  name?: string; // Optional name for the memorization set
  description?: string; // Optional description
  tags?: string[]; // Optional tags for organization

  // Per-item beginner mode: this passage is still being learned
  // When true, intervals stay short until the student builds confidence
  isBeginner?: boolean;
  // Progress offset: count minus this value is consecutive successful spaced reviews.
  // Reset on enabling/Hard; shifted on same-day successes to avoid false graduation.
  beginnerStartedAtReview?: number;
  // FSRS memory state: stability (days until 90% recall) and difficulty (1-10)
  // Used by the adaptive algorithm. Derived from interval/easeFactor for old items.
  stability?: number;
  difficulty?: number;
}

export type ReviewRating = 'easy' | 'medium' | 'hard';
export type RecallQuality = 'perfect' | 'partial' | 'hint-needed' | 'forgot';

import { SPACED_REPETITION, UI } from './constants';
import { generateMemorizationId, getUserTimeZone, getTodayInUserTimeZone, addDaysInUserTimeZone, toUserTimeZoneDate } from './utils';
import { DateTime } from 'luxon';
import { calculateReviewInterval, getReviewSettings, ReviewSettings } from './reviewAlgorithms';

/**
 * Update a memorization item's review interval based on the rating.
 *
 * This now delegates to the selected review algorithm (Adaptive/Classic/Hifz)
 * based on the user's settings. Falls back to Adaptive if
 * settings can't be loaded (e.g., during SSR).
 */
export function updateInterval(
  item: MemorizationItem,
  rating: ReviewRating,
  userTimeZone?: string
): MemorizationItem {
  const settings = getReviewSettings();
  return calculateReviewInterval(item, rating, settings, userTimeZone);
}

/**
 * Update interval with explicit settings (for preview or when settings are already loaded).
 */
export function updateIntervalWithSettings(
  item: MemorizationItem,
  rating: ReviewRating,
  settings: ReviewSettings,
  userTimeZone?: string
): MemorizationItem {
  return calculateReviewInterval(item, rating, settings, userTimeZone);
}

/** A complete recitation is scheduled once, using its weakest ayah.
 * Pending ratings never mark a passage reviewed. No automatic destructive splits.
 */
export function updateIndividualAyahRating(
  item: MemorizationItem, ayahNumber: number, rating: ReviewRating, userTimeZone?: string,
): { updatedItem: MemorizationItem; shouldSplit: boolean; newItems?: MemorizationItem[] } {
  if (!Number.isInteger(ayahNumber) || ayahNumber < item.ayahStart || ayahNumber > item.ayahEnd) {
    throw new RangeError('Ayah outside passage');
  }
  const ratings: Record<number, ReviewRating> = {};
  // Legacy completed ratings must not count as a new recitation.
  const stored = item.individualRatings ?? {};
  const previous = Object.keys(stored).length >= item.ayahEnd - item.ayahStart + 1 ? {} : stored;
  for (let ayah = item.ayahStart; ayah <= item.ayahEnd; ayah++) {
    if (['easy', 'medium', 'hard'].includes(previous[ayah])) ratings[ayah] = previous[ayah];
  }
  ratings[ayahNumber] = rating;
  if (Object.keys(ratings).length < item.ayahEnd - item.ayahStart + 1) {
    return { updatedItem: { ...item, individualRatings: ratings }, shouldSplit: false };
  }
  const values = Object.values(ratings);
  const overall = values.includes('hard') ? 'hard' : values.includes('medium') ? 'medium' : 'easy';
  return { updatedItem: updateInterval(item, overall, userTimeZone), shouldSplit: false };
}

export function getDueItems(items: MemorizationItem[], userTimeZone?: string): MemorizationItem[] {
  const tz = userTimeZone || getUserTimeZone();
  const today = getTodayInUserTimeZone(tz);
  return items.filter(item => 
    (!DateTime.fromISO(item.nextReview, { zone: tz }).isValid || toUserTimeZoneDate(item.nextReview, tz) <= today)
    // Removed the completedToday filter to allow multiple reviews per day
  );
}

export function getUpcomingReviews(items: MemorizationItem[], days: number = UI.UPCOMING_DAYS_DEFAULT, userTimeZone?: string): MemorizationItem[] {
  const tz = userTimeZone || getUserTimeZone();
  const today = DateTime.now().setZone(tz).startOf('day');
  const futureDate = today.plus({ days });

  return items.filter(item => {
    const reviewDate = DateTime.fromISO(item.nextReview, { zone: tz }).startOf('day');
    return reviewDate >= today && reviewDate <= futureDate;
  }).sort((a, b) => {
    const aDate = DateTime.fromISO(a.nextReview, { zone: tz }).toMillis();
    const bDate = DateTime.fromISO(b.nextReview, { zone: tz }).toMillis();
    return aDate - bDate;
  });
}

export async function createMemorizationItem(
  surah: number,
  ayahStart: number,
  ayahEnd: number,
  difficultyLevel?: string,
  userTimeZone?: string,
  memorizationAge?: number
): Promise<MemorizationItem> {
  const id = generateMemorizationId(surah, ayahStart, ayahEnd);
  const tz = userTimeZone || getUserTimeZone();
  const today = getTodayInUserTimeZone(tz);
  
  // Get ruku information
  const { getRukuReferences, getRukuRange } = await import('./rukuService');
  const rukuReferences = await getRukuReferences();
  const rukuInfo = getRukuRange(surah, ayahStart, ayahEnd, rukuReferences);
  
  // Set initial interval and FSRS memory state based on memorization age.
  // The memorization age tells us how established the memory already is,
  // which maps to an initial stability (how long until 90% recall).
  let initialInterval: number;
  let initialStability: number;
  let initialDifficulty: number;
  const age = memorizationAge || 0;

  if (age <= 7) {
    // New memorization — memory is fragile, review soon
    initialInterval = 1;
    initialStability = 1;
    initialDifficulty = 5;
  } else if (age <= 14) {
    // Consolidation phase — memory is forming, can wait a bit longer
    initialInterval = 2;
    initialStability = 2.3; // FSRS w2 (Good initial stability)
    initialDifficulty = 5;
  } else if (age <= 30) {
    // Early established — memory is somewhat stable
    initialInterval = 4;
    initialStability = 4;
    initialDifficulty = 4;
  } else {
    // Well established — memory is solid, can wait longer
    initialInterval = 7;
    initialStability = 8.3; // FSRS w3 (Easy initial stability)
    initialDifficulty = 3;
  }

  const result = {
    id,
    surah,
    ayahStart,
    ayahEnd,
    interval: initialInterval,
    nextReview: today,
    easeFactor: SPACED_REPETITION.INITIAL_EASE_FACTOR,
    reviewCount: 0,
    createdAt: today,
    memorizationAge: memorizationAge || 0,
    rukuStart: rukuInfo.startRuku,
    rukuEnd: rukuInfo.endRuku,
    rukuCount: rukuInfo.rukuCount,
    difficultyLevel: difficultyLevel as 'easy' | 'medium' | 'hard' | undefined,
    stability: initialStability,
    difficulty: initialDifficulty,
  };
  
  return result;
}

export function resetDailyCompletions(items: MemorizationItem[], userTimeZone?: string): MemorizationItem[] {
  const tz = userTimeZone || getUserTimeZone();
  const today = getTodayInUserTimeZone(tz);
  return items.map(item => {
    // If the item was completed on a different day, clear the completedToday field
    if (item.completedToday && item.completedToday !== today) {
      return { ...item, completedToday: undefined };
    }
    return item;
  });
} 