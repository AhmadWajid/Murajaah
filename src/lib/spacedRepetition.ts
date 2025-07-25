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
}

export type ReviewRating = 'easy' | 'medium' | 'hard';
export type RecallQuality = 'perfect' | 'partial' | 'hint-needed' | 'forgot';

import { SPACED_REPETITION, UI } from './constants';
import { formatToISODate, generateMemorizationId, getUserTimeZone, getTodayInUserTimeZone, addDaysInUserTimeZone, toUserTimeZoneDate } from './utils';
import { DateTime } from 'luxon';

export function updateInterval(
  item: MemorizationItem,
  rating: ReviewRating,
  userTimeZone?: string
): MemorizationItem {
  const tz = userTimeZone || getUserTimeZone();
  const today = getTodayInUserTimeZone(tz);

  // Calculate the current memorization age by adding days passed since creation
  let daysSinceCreation: number;
  
  if (item.memorizationAge !== undefined) {
    // Calculate days passed since the item was added to the app
    const createdAt = DateTime.fromISO(item.createdAt, { zone: tz });
    const todayDate = DateTime.now().setZone(tz).startOf('day');
    const daysPassedSinceCreation = todayDate.diff(createdAt, 'days').days;
    
    // Current memorization age = original memorization age + days passed since creation
    daysSinceCreation = item.memorizationAge + daysPassedSinceCreation;
  } else {
    // Fallback to calculating from createdAt (for existing items without memorizationAge)
    const createdAt = DateTime.fromISO(item.createdAt, { zone: tz });
    const todayDate = DateTime.now().setZone(tz).startOf('day');
    daysSinceCreation = todayDate.diff(createdAt, 'days').days;
  }

  // Define intervals based on both rating and how "new" the memorization is
  let newInterval: number;

  if (daysSinceCreation < 10) {
    // First 10 days: always daily review
    newInterval = 1;
  } else if (daysSinceCreation < 180) {
    // 10 days to 6 months
    if (rating === 'easy') newInterval = 4;
    else if (rating === 'medium') newInterval = 2;
    else newInterval = 1;
  } else {
    // 6+ months
    if (rating === 'easy') newInterval = 7;
    else if (rating === 'medium') newInterval = 4;
    else newInterval = 1;
  }

  const nextReviewDate = addDaysInUserTimeZone(today, newInterval, tz);
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
    
    // Calculate the current memorization age by adding days passed since creation
    let daysSinceCreation: number;
    
    if (item.memorizationAge !== undefined) {
      // Calculate days passed since the item was added to the app
      const createdAt = DateTime.fromISO(item.createdAt, { zone: tz });
      const todayDate = DateTime.now().setZone(tz).startOf('day');
      const daysPassedSinceCreation = todayDate.diff(createdAt, 'days').days;
      
      // Current memorization age = original memorization age + days passed since creation
      daysSinceCreation = item.memorizationAge + daysPassedSinceCreation;
    } else {
      // Fallback to calculating from createdAt (for existing items without memorizationAge)
      const createdAt = DateTime.fromISO(item.createdAt, { zone: tz });
      const todayDate = DateTime.now().setZone(tz).startOf('day');
      daysSinceCreation = todayDate.diff(createdAt, 'days').days;
    }

    // Define intervals based on both rating and how "new" the memorization is
    let newInterval: number;
    let nextReviewDate: string;

    if (daysSinceCreation < 10) {
      // First 10 days: always daily review
      newInterval = 1;
    } else if (daysSinceCreation < 180) {
      // 10 days to 6 months
      if (rating === 'easy') newInterval = 4;
      else if (rating === 'medium') newInterval = 2;
      else newInterval = 1;
    } else {
      // 6+ months
      if (rating === 'easy') newInterval = 7;
      else if (rating === 'medium') newInterval = 4;
      else newInterval = 1;
    }
      
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
      
      console.log('updateIndividualAyahRating - Rating applied:', {
        rating,
        newInterval,
        nextReviewDate,
        wasAlreadyReviewedToday
      });
    
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
  
  // Calculate the current memorization age by adding days passed since creation
  let daysSinceCreation: number;
  
  if (originalItem.memorizationAge !== undefined) {
    // Calculate days passed since the item was added to the app
    const createdAt = DateTime.fromISO(originalItem.createdAt, { zone: tz });
    const todayDate = DateTime.now().setZone(tz).startOf('day');
    const daysPassedSinceCreation = todayDate.diff(createdAt, 'days').days;
    
    // Current memorization age = original memorization age + days passed since creation
    daysSinceCreation = originalItem.memorizationAge + daysPassedSinceCreation;
  } else {
    // Fallback to calculating from createdAt (for existing items without memorizationAge)
    const createdAt = DateTime.fromISO(originalItem.createdAt, { zone: tz });
    const todayDate = DateTime.now().setZone(tz).startOf('day');
    daysSinceCreation = todayDate.diff(createdAt, 'days').days;
  }

  // Define intervals based on both rating and how "new" the memorization is
  let newInterval: number;

  if (daysSinceCreation < 10) {
    // First 10 days: always daily review
    newInterval = 1;
  } else if (daysSinceCreation < 180) {
    // 10 days to 6 months
    if (rating === 'easy') newInterval = 4;
    else if (rating === 'medium') newInterval = 2;
    else newInterval = 1;
  } else {
    // 6+ months
    if (rating === 'easy') newInterval = 7;
    else if (rating === 'medium') newInterval = 4;
    else newInterval = 1;
  }
  
  // Calculate next review date
  const nextReviewDate = addDaysInUserTimeZone(today, newInterval, tz);
  
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
  
  // Set initial interval based on memorization age
  let initialInterval: number;
  const age = memorizationAge || 0;
  
  if (age <= 7) {
    // New memorization phase - use medium interval (1 day)
    initialInterval = 1;
  } else if (age <= 14) {
    // Consolidation phase - use medium interval (2 days)
    initialInterval = 2;
  } else {
    // Established memorization phase - use medium interval (5 days)
    initialInterval = 5;
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
    memorizationAge: memorizationAge || 0, // Default to 0 if not specified
    rukuStart: rukuInfo.startRuku,
    rukuEnd: rukuInfo.endRuku,
    rukuCount: rukuInfo.rukuCount,
    difficultyLevel: difficultyLevel as 'easy' | 'medium' | 'hard' | undefined,
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