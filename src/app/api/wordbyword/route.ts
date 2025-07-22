import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');
  const language = searchParams.get('language') || 'en';

  if (!page) {
    return NextResponse.json({ error: 'Missing page parameter' }, { status: 400 });
  }

  try {
    // Fetch word-by-word data from Quran.com API
    const apiUrl = `https://api.quran.com/api/v4/verses/by_page/${page}?words=true&language=${language}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Quran.com API' }, { status: 502 });
    }
    const data = await response.json();

    // Structure: data.verses[].words[]
    // Flatten all words for the page
    const words = [];
    for (const verse of data.verses) {
      for (const word of verse.words) {
        words.push({
          id: word.id,
          surah: verse.surah_number,
          ayah: verse.verse_number,
          position: word.position,
          arabic: word.text_uthmani,
          translation: word.translation?.text || '',
        });
      }
    }

    return NextResponse.json({ words });
  } catch (error) {
    console.error('Word-by-word API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 