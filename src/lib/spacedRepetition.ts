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
}

export type ReviewRating = 'easy' | 'medium' | 'hard';
export type RecallQuality = 'perfect' | 'partial' | 'hint-needed' | 'forgot';

import { SPACED_REPETITION, UI } from './constants';
import { formatToISODate, getTodayISODate, generateMemorizationId, getUserTimeZone, getTodayInUserTimeZone, addDaysInUserTimeZone, toUserTimeZoneDate } from './utils';
import { DateTime } from 'luxon';

function addDaysLocal(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return formatToISODate(date);
}

export function updateInterval(
  item: MemorizationItem,
  rating: ReviewRating,
  userTimeZone?: string
): MemorizationItem {
  const tz = userTimeZone || getUserTimeZone();
  const today = getTodayInUserTimeZone(tz);
  
  // Special handling for "hard" rating - always schedule for next day
  let newInterval: number;
  let nextReviewDate: string;
  
  if (rating === 'hard') {
    newInterval = 1; // Always 1 day for hard
    nextReviewDate = addDaysInUserTimeZone(today, 1, tz);
  } else {
    // For easy and medium, use the normal spaced repetition algorithm
    const multiplier = SPACED_REPETITION.RATING_MULTIPLIERS[rating];
    newInterval = Math.max(1, Math.round(item.interval * multiplier));
    
    // Check if this item was already reviewed today
    const wasAlreadyReviewedToday = item.completedToday === today;
    
    if (wasAlreadyReviewedToday) {
      // If already reviewed today, recalculate based on new rating
      // This allows updating the rating and interval on the same day
      nextReviewDate = addDaysInUserTimeZone(today, newInterval, tz);
    } else {
      // First review of the day - calculate new nextReview date
      nextReviewDate = addDaysInUserTimeZone(today, newInterval, tz);
    }
  }
  
  const newEaseFactor = calculateNewEaseFactor(item.easeFactor, rating);

  return {
    ...item,
    interval: newInterval,
    nextReview: nextReviewDate,
    easeFactor: newEaseFactor,
    reviewCount: item.reviewCount + 1,
    lastReviewed: today,
    completedToday: today, // Mark as completed today
  };
}

export function updateIndividualAyahRating(
  item: MemorizationItem,
  ayahNumber: number,
  rating: ReviewRating,
  userTimeZone?: string
): { updatedItem: MemorizationItem; shouldSplit: boolean; newItems?: MemorizationItem[] } {
  const tz = userTimeZone || getUserTimeZone();
  const today = getTodayInUserTimeZone(tz);
  
  console.log('updateIndividualAyahRating called with:', {
    itemId: item.id,
    ayahNumber,
    rating,
    currentReviewCount: item.reviewCount,
    currentIndividualRatings: item.individualRatings
  });
  
  // Initialize individualRatings if it doesn't exist
  const individualRatings = item.individualRatings || {};
  
  // Update the rating for this specific ayah
  const updatedIndividualRatings = {
    ...individualRatings,
    [ayahNumber]: rating
  };
  
  console.log('Updated individual ratings:', updatedIndividualRatings);
  
  // Check if we have ratings for all ayahs in the range
  const totalAyahs = item.ayahEnd - item.ayahStart + 1;
  const ratedAyahs = Object.keys(updatedIndividualRatings).length;
  
  console.log('Rating check:', { totalAyahs, ratedAyahs, ayahStart: item.ayahStart, ayahEnd: item.ayahEnd });
  
  if (ratedAyahs < totalAyahs) {
    // Not all ayahs have been rated yet, just update the individual ratings
    console.log('Not all ayahs rated yet, updating individual ratings only');
    return {
      updatedItem: {
        ...item,
        individualRatings: updatedIndividualRatings,
        lastReviewed: today,
        completedToday: today
      },
      shouldSplit: false
    };
  }
  
  // All ayahs have been rated, check if we need to split
  const ratings = Object.values(updatedIndividualRatings);
  const uniqueRatings = [...new Set(ratings)];
  
  console.log('All ayahs rated, checking for split:', { ratings, uniqueRatings });
  
  if (uniqueRatings.length === 1) {
    // All ayahs have the same rating, update the entire item
    const rating = uniqueRatings[0];
    const newEaseFactor = calculateNewEaseFactor(item.easeFactor, rating);
    
    console.log('updateIndividualAyahRating - Processing single rating:', {
      itemId: item.id,
      rating,
      currentInterval: item.interval,
      currentNextReview: item.nextReview,
      completedToday: item.completedToday,
      today,
      currentReviewCount: item.reviewCount
    });
    
    // Special handling for "hard" rating - always schedule for next day
    let newInterval: number;
    let nextReviewDate: string;
    
    if (rating === 'hard') {
      newInterval = 1; // Always 1 day for hard
      nextReviewDate = addDaysInUserTimeZone(today, 1, tz);
      
      console.log('updateIndividualAyahRating - Hard rating applied:', {
        newInterval,
        nextReviewDate
      });
    } else {
      // For easy and medium, use the normal spaced repetition algorithm
      const multiplier = SPACED_REPETITION.RATING_MULTIPLIERS[rating];
      newInterval = Math.max(1, Math.round(item.interval * multiplier));
      
      // Check if this item was already reviewed today
      const wasAlreadyReviewedToday = item.completedToday === today;
      
      if (wasAlreadyReviewedToday) {
        // If already reviewed today, check if the rating changed
        const previousRating = item.individualRatings ? Object.values(item.individualRatings)[0] : null;
        
        if (previousRating && previousRating !== rating) {
          // Rating changed - recalculate next review date
          const nextReview = new Date();
          nextReview.setDate(nextReview.getDate() + newInterval);
          nextReviewDate = formatToISODate(nextReview);
          console.log('Rating changed from', previousRating, 'to', rating, '- updating next review date to:', nextReviewDate);
        } else {
          // Same rating or no previous rating - keep existing next review date
          nextReviewDate = item.nextReview;
          console.log('Same rating or no change - keeping existing next review date:', nextReviewDate);
        }
      } else {
        // First review of the day - calculate new nextReview date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);
        nextReviewDate = formatToISODate(nextReview);
        console.log('First review of the day - setting next review date to:', nextReviewDate);
      }
      
      console.log('updateIndividualAyahRating - Normal rating applied:', {
        rating,
        multiplier,
        newInterval,
        nextReviewDate,
        wasAlreadyReviewedToday
      });
    }
    
    // Only increment review count if this is the first time all ayahs are being rated in this session
    // Check if we already have individual ratings for all ayahs (meaning this is a subsequent call)
    const existingIndividualRatings = item.individualRatings || {};
    const existingRatedAyahs = Object.keys(existingIndividualRatings).length;
    const shouldIncrementReviewCount = existingRatedAyahs < totalAyahs;
    
    const newReviewCount = shouldIncrementReviewCount ? item.reviewCount + 1 : item.reviewCount;
    console.log('Review count update:', { 
      oldCount: item.reviewCount, 
      newCount: newReviewCount, 
      existingRatedAyahs, 
      totalAyahs, 
      shouldIncrementReviewCount 
    });
    
    const updatedItem = {
      ...item,
      interval: newInterval,
      nextReview: nextReviewDate,
      easeFactor: newEaseFactor,
      reviewCount: newReviewCount,
      lastReviewed: today,
      // Keep completedToday as today to allow multiple reviews per day
      completedToday: today,
      individualRatings: updatedIndividualRatings
    };
    
    console.log('Final updated item:', updatedItem);
    
    return {
      updatedItem,
      shouldSplit: false
    };
  } else {
    // Mixed ratings, need to split the item
    console.log('Mixed ratings detected, splitting item');
    const newItems: MemorizationItem[] = [];
    let currentStart = item.ayahStart;
    let currentRating: ReviewRating | null = null;
    
    for (let ayah = item.ayahStart; ayah <= item.ayahEnd; ayah++) {
      const ayahRating = updatedIndividualRatings[ayah];
      
      if (currentRating === null) {
        currentRating = ayahRating;
      } else if (currentRating !== ayahRating) {
        // Rating changed, create a new item for the previous range
        if (currentStart < ayah) {
          const newItem = createSplitItem(item, currentStart, ayah - 1, currentRating, tz);
          newItems.push(newItem);
        }
        currentStart = ayah;
        currentRating = ayahRating;
      }
    }
    
    // Add the last range
    if (currentStart <= item.ayahEnd) {
      const newItem = createSplitItem(item, currentStart, item.ayahEnd, currentRating!, tz);
      newItems.push(newItem);
    }
    
    console.log('Split items created:', newItems);
    
    return {
      updatedItem: item, // Original item will be removed
      shouldSplit: true,
      newItems
    };
  }
}

function createSplitItem(
  originalItem: MemorizationItem,
  ayahStart: number,
  ayahEnd: number,
  rating: ReviewRating,
  userTimeZone?: string
): MemorizationItem {
  const tz = userTimeZone || getUserTimeZone();
  const today = getTodayInUserTimeZone(tz);
  
  // Special handling for "hard" rating - always schedule for next day
  let newInterval: number;
  let nextReviewDate: string;
  
  if (rating === 'hard') {
    newInterval = 1; // Always 1 day for hard
    nextReviewDate = addDaysInUserTimeZone(today, 1, tz);
  } else {
    // For easy and medium, use the normal spaced repetition algorithm
    const multiplier = SPACED_REPETITION.RATING_MULTIPLIERS[rating];
    newInterval = Math.max(1, Math.round(originalItem.interval * multiplier));
    
    // Check if this item was already reviewed today
    const wasAlreadyReviewedToday = originalItem.completedToday === today;
    
    if (wasAlreadyReviewedToday) {
      // If already reviewed today, check if the rating changed
      const previousRating = originalItem.individualRatings ? Object.values(originalItem.individualRatings)[0] : null;
      
      if (previousRating && previousRating !== rating) {
        // Rating changed - recalculate next review date
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);
        nextReviewDate = formatToISODate(nextReview);
      } else {
        // Same rating or no previous rating - keep existing next review date
        nextReviewDate = originalItem.nextReview;
      }
    } else {
      // First review of the day - calculate new nextReview date
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + newInterval);
      nextReviewDate = formatToISODate(nextReview);
    }
  }
  
  const newEaseFactor = calculateNewEaseFactor(originalItem.easeFactor, rating);
  
  return {
    ...originalItem,
    id: generateMemorizationId(originalItem.surah, ayahStart, ayahEnd),
    ayahStart,
    ayahEnd,
    interval: newInterval,
    nextReview: nextReviewDate,
    easeFactor: newEaseFactor,
    reviewCount: originalItem.reviewCount + 1,
    lastReviewed: today,
    completedToday: today,
    individualRatings: undefined // Clear individual ratings for split items
  };
}

function calculateNewEaseFactor(currentEaseFactor: number, rating: ReviewRating): number {
  if (rating === 'easy') {
    return Math.min(SPACED_REPETITION.MAX_EASE_FACTOR, currentEaseFactor + SPACED_REPETITION.EASE_FACTOR_ADJUSTMENTS.easy);
  }
  if (rating === 'hard') {
    return Math.max(SPACED_REPETITION.MIN_EASE_FACTOR, currentEaseFactor + SPACED_REPETITION.EASE_FACTOR_ADJUSTMENTS.hard);
  }
  return currentEaseFactor;
}

export function getDueItems(items: MemorizationItem[], userTimeZone?: string): MemorizationItem[] {
  const tz = userTimeZone || getUserTimeZone();
  const today = getTodayInUserTimeZone(tz);
  return items.filter(item => 
    toUserTimeZoneDate(item.nextReview, tz) <= today
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
  memorizationLevel?: string,
  difficultyLevel?: string,
  userTimeZone?: string
): Promise<MemorizationItem> {
  console.log('createMemorizationItem called with:', { surah, ayahStart, ayahEnd, memorizationLevel, difficultyLevel });
  
  const id = generateMemorizationId(surah, ayahStart, ayahEnd);
  const tz = userTimeZone || getUserTimeZone();
  const today = getTodayInUserTimeZone(tz);
  
  console.log('Generated ID:', id, 'Today:', today);
  
  // Get ruku information
  const { getRukuReferences, getRukuRange } = await import('./rukuService');
  const rukuReferences = await getRukuReferences();
  const rukuInfo = getRukuRange(surah, ayahStart, ayahEnd, rukuReferences);
  
  // Determine initial interval based on memorization level
  let initialInterval: number = SPACED_REPETITION.INITIAL_INTERVAL;
  if (memorizationLevel) {
    switch (memorizationLevel) {
      case 'new':
        initialInterval = 1;
        break;
      case 'beginner':
        initialInterval = 2;
        break;
      case 'intermediate':
        initialInterval = 5;
        break;
      case 'advanced':
        initialInterval = 10;
        break;
      case 'mastered':
        initialInterval = 20;
        break;
      default:
        initialInterval = SPACED_REPETITION.INITIAL_INTERVAL;
    }
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
    rukuStart: rukuInfo.startRuku,
    rukuEnd: rukuInfo.endRuku,
    rukuCount: rukuInfo.rukuCount,
    difficultyLevel: difficultyLevel as 'easy' | 'medium' | 'hard' | undefined,
  };
  
  console.log('createMemorizationItem returning:', result);
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