import { useState, useCallback, useRef } from 'react';

// V4 word data structure from quranwbw CDN:
// { chapter: { verse: [words[], lineNumbers[], endIcons[], [pageNumber]] } }
interface V4ChapterData {
  [verse: string]: [string[], number[], string[], number[]];
}

interface V4Data {
  [chapter: string]: V4ChapterData;
}

interface V4VerseInfo {
  words: string[];
  lines: number[];
  endIcon: string;
  page: number;
}

const V4_DATA_BASE = 'https://static.quranwbw.com/data/v4/words-data/arabic';
const V4_VERSION = 7;

// Cache for V4 chapter data (shared across all hook instances)
const v4Cache: Map<string, { data: V4ChapterData; timestamp: number }> = new Map();
const V4_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function useV4WordData() {
  const [loadingChapters, setLoadingChapters] = useState<Set<string>>(new Set());
  const fetchPromises = useRef<Map<string, Promise<V4ChapterData | null>>>(new Map());

  const fetchChapterData = useCallback(async (chapter: number): Promise<V4ChapterData | null> => {
    const chapterKey = String(chapter);

    // Check cache
    const cached = v4Cache.get(chapterKey);
    if (cached && Date.now() - cached.timestamp < V4_CACHE_TTL) {
      return cached.data;
    }

    // Check if already fetching
    if (fetchPromises.current.has(chapterKey)) {
      return fetchPromises.current.get(chapterKey)!;
    }

    setLoadingChapters(prev => new Set(prev).add(chapterKey));

    const promise = (async (): Promise<V4ChapterData | null> => {
      try {
        const response = await fetch(`${V4_DATA_BASE}/${chapter}.json?version=${V4_VERSION}`);
        if (!response.ok) {
          return null;
        }
        // Check content-type to avoid parsing non-JSON responses (CDN returns "hello" for missing chapters)
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          return null;
        }
        const text = await response.text();
        if (!text.startsWith('{')) {
          return null;
        }
        const data: V4Data = JSON.parse(text);
        const chapterData = data[chapterKey] || {};

        // Only cache if we actually got data for this chapter
        if (Object.keys(chapterData).length > 0) {
          v4Cache.set(chapterKey, { data: chapterData, timestamp: Date.now() });
          return chapterData;
        }
        return null;
      } catch (error) {
        console.error(`Error fetching V4 data for chapter ${chapter}:`, error);
        return null;
      } finally {
        setLoadingChapters(prev => {
          const next = new Set(prev);
          next.delete(chapterKey);
          return next;
        });
        fetchPromises.current.delete(chapterKey);
      }
    })();

    fetchPromises.current.set(chapterKey, promise);
    return promise;
  }, []);

  const getVerseInfo = useCallback(async (chapter: number, verse: number): Promise<V4VerseInfo | null> => {
    const chapterData = await fetchChapterData(chapter);
    if (!chapterData) return null;

    const verseData = chapterData[String(verse)];
    if (!verseData) return null;

    return {
      words: verseData[0] || [],
      lines: verseData[1] || [],
      endIcon: verseData[2]?.[0] || '',
      page: verseData[3]?.[0] || 1,
    };
  }, [fetchChapterData]);

  const isChapterLoading = useCallback((chapter: number): boolean => {
    return loadingChapters.has(String(chapter));
  }, [loadingChapters]);

  // Get cached verse info without fetching (returns null if not cached)
  const getCachedVerseInfo = useCallback((chapter: number, verse: number): V4VerseInfo | null => {
    const chapterData = v4Cache.get(String(chapter));
    if (!chapterData) return null;

    const verseData = chapterData.data[String(verse)];
    if (!verseData) return null;

    return {
      words: verseData[0] || [],
      lines: verseData[1] || [],
      endIcon: verseData[2]?.[0] || '',
      page: verseData[3]?.[0] || 1,
    };
  }, []);

  return {
    fetchChapterData,
    getVerseInfo,
    getCachedVerseInfo,
    isChapterLoading,
  };
}
