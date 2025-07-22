// Spaced Repetition Algorithm Constants
export const SPACED_REPETITION = {
  INITIAL_INTERVAL: 1,
  INITIAL_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  MAX_EASE_FACTOR: 2.5,
  RATING_MULTIPLIERS: {
    easy: 2.5,
    medium: 1.5,
    hard: 1.0, // This will be overridden to always be 1 day
  },
  EASE_FACTOR_ADJUSTMENTS: {
    easy: 0.1,
    hard: -0.15,
  },
} as const;

// UI Constants
export const UI = {
  UPCOMING_DAYS_DEFAULT: 7,
  CONTAINER_PADDING: 'px-4 py-8',
  CARD_SPACING: 'mb-6',
  BUTTON_GAP: 'gap-2',
} as const;

// Storage Constants
export const STORAGE = {
  KEY: 'mquran_memorization_data',
  COMPLEX_KEY: 'mquran_complex_memorization_data',
  VERSION: '1.0.0',
} as const;

// Date Formatting
export const DATE_FORMAT = {
  ISO_DATE_ONLY: 'T' as const,
  MILLISECONDS_PER_DAY: 1000 * 60 * 60 * 24,
} as const;

// Audio Constants
export const AUDIO = {
  PRELOAD: 'metadata' as const,
  UPDATE_INTERVAL: 100, // milliseconds
} as const;

// Component States
export const VIEW_STATES = {
  MAIN: 'main',
  REVIEW: 'review',
} as const;

export const FILTER_TYPES = {
  ALL: 'all',
  DUE: 'due',
  UPCOMING: 'upcoming',
} as const;

export const SORT_TYPES = {
  NEXT_REVIEW: 'nextReview',
  CREATED_AT: 'createdAt',
  REVIEW_COUNT: 'reviewCount',
} as const;

// Review Ratings
export const REVIEW_RATINGS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

// Default Values
export const DEFAULTS = {
  SURAH: 1,
  AYAH_START: 1,
  AYAH_END: 1,
} as const; 