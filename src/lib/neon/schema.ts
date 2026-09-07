/**
 * Drizzle ORM schema for Neon database.
 * Mirrors the previous Supabase tables plus a users table for custom auth.
 */
import { pgTable, text, integer, boolean, real, timestamp, jsonb, varchar } from 'drizzle-orm/pg-core';

// ─── Users (custom email/password auth) ───
export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Memorization Items ───
export const memorizationItems = pgTable('memorization_items', {
  id: text('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  surah: integer('surah').notNull(),
  ayahStart: integer('ayah_start').notNull(),
  ayahEnd: integer('ayah_end').notNull(),
  intervalDays: integer('interval_days').notNull(),
  nextReview: text('next_review').notNull(),
  easeFactor: real('ease_factor').notNull(),
  reviewCount: integer('review_count').notNull().default(0),
  lastReviewed: text('last_reviewed'),
  completedToday: text('completed_today'),
  createdAt: text('created_at').notNull(),
  memorizationAge: integer('memorization_age'),
  individualRatings: jsonb('individual_ratings'),
  individualRecallQuality: jsonb('individual_recall_quality'),
  rukuStart: integer('ruku_start'),
  rukuEnd: integer('ruku_end'),
  rukuCount: integer('ruku_count'),
  difficultyLevel: text('difficulty_level'),
  name: text('name'),
  description: text('description'),
  tags: jsonb('tags'),
  isBeginner: boolean('is_beginner'),
  beginnerStartedAtReview: integer('beginner_started_at_review'),
  stability: real('stability'),
  difficulty: real('difficulty'),
});

// ─── Mistakes ───
export const mistakes = pgTable('mistakes', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  surah: integer('surah').notNull(),
  ayah: integer('ayah').notNull(),
  timestamp: text('timestamp').notNull(),
});

// ─── User Settings ───
export const userSettings = pgTable('user_settings', {
  userId: varchar('user_id', { length: 36 }).primaryKey(),
  selectedReciter: text('selected_reciter').default('Ayman_Sowaid_64kbps'),
  hideMistakes: boolean('hide_mistakes').default(false),
  lastPage: integer('last_page').default(1),
  arabicFontSize: integer('arabic_font_size').default(24),
  translationFontSize: integer('translation_font_size').default(20),
  fontTargetArabic: boolean('font_target_arabic').default(true),
  fontSize: integer('font_size').default(24),
  padding: integer('padding').default(16),
  layoutMode: text('layout_mode').default('single'),
  selectedLanguage: text('selected_language').default('en'),
  selectedTranslation: text('selected_translation').default('en.hilali'),
  enableTajweed: boolean('enable_tajweed').default(true),
  audioLoopMode: text('audio_loop_mode').default('none'),
  audioCustomLoop: jsonb('audio_custom_loop'),
  audioPlaybackSpeed: real('audio_playback_speed').default(1.0),
  showWordByWordTooltip: boolean('show_word_by_word_tooltip').default(false),
  mobileHeaderHidden: boolean('mobile_header_hidden').default(false),
  userTimezone: text('user_timezone'),
  favoriteReciters: jsonb('favorite_reciters'),
  reviewSettings: jsonb('review_settings'),
  readingLayout: text('reading_layout').default('verse'),
  hideWordsDelay: integer('hide_words_delay').default(500),
});

// ─── Storage Metadata ───
export const storageMetadata = pgTable('storage_metadata', {
  userId: varchar('user_id', { length: 36 }).primaryKey(),
  lastSync: timestamp('last_sync').defaultNow(),
  version: text('version').default('1'),
});

// ─── Bookmarks ───
export const bookmarks = pgTable('bookmarks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  type: text('type').notNull(), // 'page' | 'ayah'
  page: integer('page'),
  surah: integer('surah'),
  ayah: integer('ayah'),
  label: text('label'), // optional custom label
  surahName: text('surah_name'), // cached surah name for display
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
