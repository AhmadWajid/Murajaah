-- Migration: Create tables for Murajaah app (Neon/Postgres)
-- Run this in your Neon SQL editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (custom email/password auth)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memorization items
CREATE TABLE IF NOT EXISTS memorization_items (
  id TEXT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah INTEGER NOT NULL,
  ayah_start INTEGER NOT NULL,
  ayah_end INTEGER NOT NULL,
  interval_days INTEGER NOT NULL,
  next_review TEXT NOT NULL,
  ease_factor REAL NOT NULL,
  review_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed TEXT,
  completed_today TEXT,
  created_at TEXT NOT NULL,
  memorization_age INTEGER,
  individual_ratings JSONB,
  individual_recall_quality JSONB,
  ruku_start INTEGER,
  ruku_end INTEGER,
  ruku_count INTEGER,
  difficulty_level TEXT,
  name TEXT,
  description TEXT,
  tags JSONB,
  is_beginner BOOLEAN,
  beginner_started_at_review INTEGER,
  stability REAL,
  difficulty REAL
);

CREATE INDEX IF NOT EXISTS idx_memorization_items_user_id ON memorization_items(user_id);
CREATE INDEX IF NOT EXISTS idx_memorization_items_next_review ON memorization_items(user_id, next_review);

-- Mistakes
CREATE TABLE IF NOT EXISTS mistakes (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  surah INTEGER NOT NULL,
  ayah INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  UNIQUE(user_id, surah, ayah)
);

CREATE INDEX IF NOT EXISTS idx_mistakes_user_id ON mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_verse_order ON mistakes(user_id, surah, ayah);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  selected_reciter TEXT DEFAULT 'Ayman_Sowaid_64kbps',
  hide_mistakes BOOLEAN DEFAULT false,
  last_page INTEGER DEFAULT 1,
  arabic_font_size INTEGER DEFAULT 24,
  translation_font_size INTEGER DEFAULT 20,
  font_target_arabic BOOLEAN DEFAULT true,
  font_size INTEGER DEFAULT 24,
  padding INTEGER DEFAULT 16,
  layout_mode TEXT DEFAULT 'single',
  selected_language TEXT DEFAULT 'en',
  selected_translation TEXT DEFAULT 'en.hilali',
  enable_tajweed BOOLEAN DEFAULT true,
  audio_loop_mode TEXT DEFAULT 'none',
  audio_custom_loop JSONB,
  audio_playback_speed REAL DEFAULT 1.0,
  show_word_by_word_tooltip BOOLEAN DEFAULT false,
  mobile_header_hidden BOOLEAN DEFAULT false,
  user_timezone TEXT
);

-- Storage metadata
CREATE TABLE IF NOT EXISTS storage_metadata (
  user_id VARCHAR(36) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  version TEXT DEFAULT '1'
);
