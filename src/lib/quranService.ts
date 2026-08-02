import { ALQURAN_API_BASE, DEFAULT_EDITIONS } from './quran';
import { DEFAULT_RECITER_ID, getEveryAyahAudioUrl } from './recitations';

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

// Get individual ayah audio URL (EveryAyah.com)
export function getAyahAudioUrl(surahNumber: number, ayahNumber: number, reciter: string = DEFAULT_RECITER_ID, _bitrate?: number): string {
  return getEveryAyahAudioUrl(surahNumber, ayahNumber, reciter);
}

// Surah-level audio is not provided by EveryAyah; fall back to sequential ayah URLs via getAyahRangeAudioUrls.
export function getSurahAudioUrl(surahNumber: number, reciter: string = DEFAULT_RECITER_ID, _bitrate?: number): string {
  return getEveryAyahAudioUrl(surahNumber, 1, reciter);
}

// Utility function to get audio URL for an ayah
export function getAudioUrl(surahNumber: number, ayahNumber: number, reciter: string = DEFAULT_RECITER_ID, bitrate?: number): string {
  return getAyahAudioUrl(surahNumber, ayahNumber, reciter, bitrate);
}

// Get audio URLs for a range of ayahs
export function getAyahRangeAudioUrls(surahNumber: number, startAyah: number, endAyah: number, reciter: string = DEFAULT_RECITER_ID, bitrate?: number): string[] {
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