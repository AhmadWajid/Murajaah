import { memorizationItems } from './schema';
import { MemorizationItem } from '../spacedRepetition';

export function dbToItem(row: typeof memorizationItems.$inferSelect): MemorizationItem {
  return {
    id: row.id.startsWith(`${row.userId}/`) ? row.id.slice(row.userId.length + 1) : row.id,
    surah: row.surah,
    ayahStart: row.ayahStart,
    ayahEnd: row.ayahEnd,
    interval: row.intervalDays,
    nextReview: row.nextReview,
    easeFactor: row.easeFactor,
    reviewCount: row.reviewCount,
    lastReviewed: row.lastReviewed || undefined,
    completedToday: row.completedToday || undefined,
    createdAt: row.createdAt,
    memorizationAge: row.memorizationAge ?? undefined,
    individualRatings: row.individualRatings as any || undefined,
    individualRecallQuality: row.individualRecallQuality as any || undefined,
    rukuStart: row.rukuStart || undefined,
    rukuEnd: row.rukuEnd || undefined,
    rukuCount: row.rukuCount || undefined,
    difficultyLevel: row.difficultyLevel as any || undefined,
    name: row.name || undefined,
    description: row.description || undefined,
    tags: row.tags as any || undefined,
    isBeginner: row.isBeginner || undefined,
    beginnerStartedAtReview: row.beginnerStartedAtReview ?? undefined,
    stability: row.stability || undefined,
    difficulty: row.difficulty || undefined,
  };
}

export function itemToDb(item: MemorizationItem, userId: string) {
  return {
    id: item.id,
    userId,
    surah: item.surah,
    ayahStart: item.ayahStart,
    ayahEnd: item.ayahEnd,
    intervalDays: item.interval,
    nextReview: item.nextReview,
    easeFactor: item.easeFactor,
    reviewCount: item.reviewCount,
    lastReviewed: item.lastReviewed || null,
    completedToday: item.completedToday || null,
    createdAt: item.createdAt,
    memorizationAge: item.memorizationAge ?? null,
    individualRatings: item.individualRatings || {},
    individualRecallQuality: item.individualRecallQuality || {},
    rukuStart: item.rukuStart || null,
    rukuEnd: item.rukuEnd || null,
    rukuCount: item.rukuCount || null,
    difficultyLevel: item.difficultyLevel || null,
    name: item.name || null,
    description: item.description || null,
    tags: item.tags || [],
    isBeginner: item.isBeginner ?? null,
    beginnerStartedAtReview: item.beginnerStartedAtReview ?? null,
    stability: item.stability ?? null,
    difficulty: item.difficulty ?? null,
  };
}

