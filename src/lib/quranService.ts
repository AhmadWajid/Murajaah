import { ALQURAN_API_BASE, DEFAULT_EDITIONS } from './quran';

export interface QuranApiResponse {
  code: number;
  status: string;
  data: any;
}

export interface AyahData {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahs: AyahData[];
}

export interface SurahListItem {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(endpoint: string): string {
  return endpoint;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

async function fetchWithCache(endpoint: string): Promise<any> {
  const cacheKey = getCacheKey(endpoint);
  const cached = cache.get(cacheKey);
  
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  try {
    const response = await fetch(`${ALQURAN_API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  } catch (error) {
    console.error(`Error fetching from AlQuran API: ${endpoint}`, error);
    throw error;
  }
}

export async function getSurah(surahNumber: number, edition: string = DEFAULT_EDITIONS.arabic): Promise<SurahData> {
  const response = await fetchWithCache(`/surah/${surahNumber}/${edition}`);
  return response.data;
}

export async function getSurahList(): Promise<SurahListItem[]> {
  const response = await fetchWithCache('/surah');
  return response.data;
}

export async function getQuranMeta(): Promise<any> {
  const response = await fetchWithCache('/meta');
  return response.data;
}

export async function getPage(pageNumber: number, translation: string = 'en.hilali'): Promise<any> {
  const response = await fetchWithCache(`/page/${pageNumber}/${translation}`);
  return response.data;
}

export async function getAyah(surahNumber: number, ayahNumber: number, edition: string = DEFAULT_EDITIONS.arabic): Promise<AyahData> {
  const response = await fetchWithCache(`/ayah/${surahNumber}:${ayahNumber}/${edition}`);
  return response.data;
}

export async function getAyahRange(
  surahNumber: number, 
  startAyah: number, 
  endAyah: number, 
  edition: string = DEFAULT_EDITIONS.arabic
): Promise<AyahData[]> {
  const response = await fetchWithCache(`/surah/${surahNumber}/${edition}?offset=${startAyah - 1}&limit=${endAyah - startAyah + 1}`);
  return response.data.ayahs;
}

export async function getAvailableEditions(): Promise<EditionData[]> {
  const response = await fetchWithCache('/edition');
  return response.data;
}

export interface EditionData {
  identifier: string;
  name: string;
  englishName: string;
  format: string;
  language: string;
  type: string;
  direction: string;
}

export async function getEditionsByLanguage(language: string): Promise<EditionData[]> {
  const response = await fetchWithCache(`/edition/language/${language}`);
  return response.data;
}

export async function getEditionsByType(type: string): Promise<EditionData[]> {
  const response = await fetchWithCache(`/edition/type/${type}`);
  return response.data;
}

export interface SearchResult {
  count: number;
  text: string;
  edition: EditionData;
  surah: SurahListItem;
  numberInSurah: number;
  ayah: number;
}

export async function searchQuran(
  keyword: string, 
  surah: number | 'all' = 'all', 
  edition: string = DEFAULT_EDITIONS.english
): Promise<SearchResult[]> {
  const surahParam = surah === 'all' ? 'all' : surah.toString();
  const response = await fetchWithCache(`/search/${encodeURIComponent(keyword)}/${surahParam}/${edition}`);
  return response.data.matches;
}

// Convert surah:ayah to ayah number (1-6236)
function getAyahNumber(surah: number, ayah: number): number {
  // This is a simplified calculation - in a real app, you'd want to use a lookup table
  // or fetch this data from the API for accuracy
  const surahAyahCounts: Record<number, number> = {
    1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
    11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
    21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
    31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
    41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
    51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
    61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
    71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
    81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
    91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
    101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
    111: 5, 112: 4, 113: 5, 114: 6
  };

  let ayahNumber = 0;
  for (let i = 1; i < surah; i++) {
    ayahNumber += surahAyahCounts[i] || 0;
  }
  return ayahNumber + ayah;
}

// Get individual ayah audio URL
export function getAyahAudioUrl(surahNumber: number, ayahNumber: number, reciter: string = DEFAULT_EDITIONS.audio, bitrate: number = 128): string {
  const globalAyahNumber = getAyahNumber(surahNumber, ayahNumber);
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${globalAyahNumber}.mp3`;
}

// Get surah audio URL
export function getSurahAudioUrl(surahNumber: number, reciter: string = DEFAULT_EDITIONS.audio, bitrate: number = 128): string {
  return `https://cdn.islamic.network/quran/audio-surah/${bitrate}/${reciter}/${surahNumber}.mp3`;
}

// Utility function to get audio URL for an ayah using the correct CDN format
export function getAudioUrl(surahNumber: number, ayahNumber: number, reciter: string = DEFAULT_EDITIONS.audio, bitrate: number = 128): string {
  // For now, return individual ayah audio
  return getAyahAudioUrl(surahNumber, ayahNumber, reciter, bitrate);
}

// Get audio URLs for a range of ayahs
export function getAyahRangeAudioUrls(surahNumber: number, startAyah: number, endAyah: number, reciter: string = DEFAULT_EDITIONS.audio, bitrate: number = 128): string[] {
  const urls: string[] = [];
  for (let ayah = startAyah; ayah <= endAyah; ayah++) {
    urls.push(getAyahAudioUrl(surahNumber, ayah, reciter, bitrate));
  }
  return urls;
}

// Utility function to format ayah reference
export function formatAyahReference(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

// Clear cache (useful for testing or when cache becomes stale)
export function clearCache(): void {
  cache.clear();
}

// Get cache statistics
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
} 

// Fetch available languages from the Quran API
export const fetchAvailableLanguages = async (): Promise<string[]> => {
  try {
    const response = await fetch('https://api.alquran.cloud/v1/edition/language');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching available languages:', error);
    return [];
  }
};

// Fetch available translations from the Quran API
export const fetchAvailableTranslations = async (): Promise<Array<{
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
  direction: string;
}>> => {
  try {
    const response = await fetch('https://api.alquran.cloud/v1/edition/format/text');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching available translations:', error);
    return [];
  }
};

// Get translations by language
export const getTranslationsByLanguage = async (language: string) => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/edition/language/${language}`);
    const data = await response.json();
    return data.data?.filter((t: any) => t.type === 'translation') || [];
  } catch (error) {
    console.error('Error getting translations by language:', error);
    return [];
  }
};

// Fetch page data with specific translation
export const fetchPageWithTranslation = async (pageNumber: number, translationIdentifier: string) => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/${translationIdentifier}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching page with translation:', error);
    return null;
  }
};

// Fetch surah data with specific translation
export const fetchSurahWithTranslation = async (surahNumber: number, translationIdentifier: string) => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${translationIdentifier}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching surah with translation:', error);
    return null;
  }
};

// Fetch ayah range with specific translation
export const fetchAyahRangeWithTranslation = async (
  surahNumber: number, 
  ayahStart: number, 
  ayahEnd: number, 
  translationIdentifier: string
) => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${translationIdentifier}?ayah=${ayahStart}-${ayahEnd}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ayah range with translation:', error);
    return null;
  }
};

// Import translations from JSON file
import translationsData from './translations.json';

// Get all available languages with their translations
export const getLanguagesWithTranslations = async () => {
  try {
    const translations = new Map<string, Array<{
      identifier: string;
      name: string;
      englishName: string;
      direction: string;
    }>>();

    // Convert JSON data to Map
    Object.entries(translationsData).forEach(([language, translationList]: [string, any]) => {
      translations.set(language, translationList.map((t: any) => ({
        identifier: t.identifier,
        name: t.name,
        englishName: t.englishName,
        direction: t.direction
      })));
    });

    return translations;
  } catch (error) {
    console.error('Error getting languages with translations:', error);
    return new Map();
  }
}; 