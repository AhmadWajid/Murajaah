-- Migration: Add hide_words column to user_settings
-- Run this in your Neon SQL editor

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS hide_words BOOLEAN NOT NULL DEFAULT FALSE;
