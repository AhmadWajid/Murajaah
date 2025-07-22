import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DateTime } from 'luxon';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date to ISO date string (YYYY-MM-DD)
 */
export function formatToISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Gets today's date in ISO format
 */
export function getTodayISODate(): string {
  // Get the current date in the user's local timezone
  const now = new Date();
  
  // Use toLocaleDateString to get the date in local timezone, then parse it
  const localDateString = now.toLocaleDateString('en-CA'); // en-CA format is YYYY-MM-DD
  
  return localDateString;
}

/**
 * Calculates the number of days between two dates
 */
export function getDaysBetween(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * Checks if a date is today or in the past
 */
export function isDateDue(dateString: string): boolean {
  const today = getTodayISODate();
  return dateString <= today;
}

/**
 * Generates a unique ID for memorization items
 */
export function generateMemorizationId(surah: number, ayahStart: number, ayahEnd: number): string {
  return `${surah}:${ayahStart}-${ayahEnd}`;
}

/**
 * Generates a unique ID for complex memorization items
 */
export function generateComplexMemorizationId(name: string, timestamp?: number): string {
  const time = timestamp || Date.now();
  const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return `complex-${sanitizedName}-${time}`;
}

/**
 * Validates that a number is within a specified range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generate consistent colors for memorization items
export function getMemorizationItemColor(itemId: string): {
  bg: string;
  border: string;
  text: string;
  hover: string;
} {
  // Create a hash from the item ID to get consistent colors
  let hash = 0;
  for (let i = 0; i < itemId.length; i++) {
    const char = itemId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash to select from predefined color schemes
  const colorSchemes = [
    { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-600', hover: 'hover:bg-purple-200' },
    { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-600', hover: 'hover:bg-blue-200' },
    { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-600', hover: 'hover:bg-orange-200' },
    { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-600', hover: 'hover:bg-teal-200' },
    { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-600', hover: 'hover:bg-amber-200' },
    { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-600', hover: 'hover:bg-rose-200' },
    { bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-600', hover: 'hover:bg-violet-200' },
    { bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-600', hover: 'hover:bg-sky-200' },
    { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-600', hover: 'hover:bg-indigo-200' },
    { bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', text: 'text-fuchsia-600', hover: 'hover:bg-fuchsia-200' },
  ];
  
  const darkColorSchemes = [
    { bg: 'bg-purple-900/20', border: 'border-purple-600', text: 'text-purple-400', hover: 'hover:bg-purple-900/30' },
    { bg: 'bg-blue-900/20', border: 'border-blue-600', text: 'text-blue-400', hover: 'hover:bg-blue-900/30' },
    { bg: 'bg-orange-900/20', border: 'border-orange-600', text: 'text-orange-400', hover: 'hover:bg-orange-900/30' },
    { bg: 'bg-teal-900/20', border: 'border-teal-600', text: 'text-teal-400', hover: 'hover:bg-teal-900/30' },
    { bg: 'bg-amber-900/20', border: 'border-amber-600', text: 'text-amber-400', hover: 'hover:bg-amber-900/30' },
    { bg: 'bg-rose-900/20', border: 'border-rose-600', text: 'text-rose-400', hover: 'hover:bg-rose-900/30' },
    { bg: 'bg-violet-900/20', border: 'border-violet-600', text: 'text-violet-400', hover: 'hover:bg-violet-900/30' },
    { bg: 'bg-sky-900/20', border: 'border-sky-600', text: 'text-sky-400', hover: 'hover:bg-sky-900/30' },
    { bg: 'bg-indigo-900/20', border: 'border-indigo-600', text: 'text-indigo-400', hover: 'hover:bg-indigo-900/30' },
    { bg: 'bg-fuchsia-900/20', border: 'border-fuchsia-600', text: 'text-fuchsia-400', hover: 'hover:bg-fuchsia-900/30' },
  ];
  
  const index = Math.abs(hash) % colorSchemes.length;
  const lightScheme = colorSchemes[index];
  const darkScheme = darkColorSchemes[index];
  
  return {
    bg: `${lightScheme.bg} dark:${darkScheme.bg}`,
    border: `border-2 ${lightScheme.border} dark:${darkScheme.border}`,
    text: `${lightScheme.text} dark:${darkScheme.text}`,
    hover: `hover:${lightScheme.hover} dark:hover:${darkScheme.hover}`
  };
}

export function getUserTimeZone(): string {
  // Try localStorage first (user override), then auto-detect
  return (
    (typeof window !== 'undefined' && localStorage.getItem('userTimeZone')) ||
    (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) ||
    'UTC'
  );
}

export function getTodayInUserTimeZone(timeZone?: string): string {
  const zone = timeZone || getUserTimeZone();
  return DateTime.now().setZone(zone).startOf('day').toISODate() || "";
}

export function addDaysInUserTimeZone(isoDate: string, days: number, timeZone?: string): string {
  const zone = timeZone || getUserTimeZone();
  return DateTime.fromISO(isoDate, { zone })
    .plus({ days })
    .startOf('day')
    .toISODate() || "";
}

export function toUserTimeZoneDate(isoDate: string, timeZone?: string): string {
  const zone = timeZone || getUserTimeZone();
  return DateTime.fromISO(isoDate, { zone: 'utc' }).setZone(zone).toISODate() || "";
}
