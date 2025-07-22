import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

let tajweedDb: Database.Database | null = null;
let pagesDb: Database.Database | null = null;

function getTajweedDatabase(): Database.Database {
  if (!tajweedDb) {
    const dbPath = path.join(process.cwd(), 'db', 'qpc-hafs-tajweed-1.db');
    tajweedDb = new Database(dbPath);
  }
  return tajweedDb;
}

function getPagesDatabase(): Database.Database {
  if (!pagesDb) {
    const dbPath = path.join(process.cwd(), 'db', 'uthmani-15-lines.db');
    pagesDb = new Database(dbPath);
  }
  return pagesDb;
}

// Parse tajweed rules from XML-like tags in the text
function parseTajweedRules(text: string): any[] {
  const rules: any[] = [];
  const ruleRegex = /<rule class=([^>]+)>([^<]+)<\/rule>/g;
  let match;
  let offset = 0;

  while ((match = ruleRegex.exec(text)) !== null) {
    const ruleClass = match[1].replace(/['"]/g, ''); // Remove quotes
    const ruleText = match[2];
    const startIndex = match.index - offset;
    const endIndex = startIndex + ruleText.length;

    rules.push({
      class: ruleClass,
      text: ruleText,
      startIndex,
      endIndex,
    });

    // Adjust offset for next matches
    offset += match[0].length - ruleText.length;
  }

  return rules;
}

// Clean text by removing tajweed rule tags
function cleanText(text: string): string {
  return text.replace(/<rule class=[^>]+>([^<]+)<\/rule>/g, '$1');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    const tajweedDatabase = getTajweedDatabase();
    const pagesDatabase = getPagesDatabase();
    
    switch (action) {
      case 'words':
        const surah = parseInt(searchParams.get('surah') || '1');
        const ayah = parseInt(searchParams.get('ayah') || '1');
        
        const stmt = tajweedDatabase.prepare(`
          SELECT id, location, surah, ayah, word, text 
          FROM words 
          WHERE surah = ? AND ayah = ? 
          ORDER BY word
        `);
        
        const rows = stmt.all(surah, ayah) as any[];
        
        const words = rows.map(row => ({
          id: row.id,
          location: row.location,
          surah: row.surah,
          ayah: row.ayah,
          word: row.word,
          text: cleanText(row.text),
          tajweedRules: parseTajweedRules(row.text),
        }));
        
        return NextResponse.json({ words });
        
      case 'surahs':
        const surahsStmt = tajweedDatabase.prepare('SELECT DISTINCT surah FROM words ORDER BY surah');
        const surahsRows = surahsStmt.all() as any[];
        const surahs = surahsRows.map(row => row.surah);
        
        return NextResponse.json({ surahs });
        
      case 'ayahCount':
        const surahNum = parseInt(searchParams.get('surah') || '1');
        const ayahStmt = tajweedDatabase.prepare('SELECT MAX(ayah) as maxAyah FROM words WHERE surah = ?');
        const ayahRow = ayahStmt.get(surahNum) as any;
        const maxAyah = ayahRow?.maxAyah || 0;
        
        return NextResponse.json({ maxAyah });
        
      case 'stats':
        const statsStmt = tajweedDatabase.prepare(`
          SELECT 
            COUNT(*) as total_words,
            COUNT(CASE WHEN text LIKE '%<rule class=%' THEN 1 END) as words_with_rules
          FROM words
        `);
        
        const statsRow = statsStmt.get() as any;
        const stats = {
          totalWords: statsRow.total_words,
          wordsWithRules: statsRow.words_with_rules,
        };
        
        return NextResponse.json(stats);
        
      case 'ruleClasses':
        const rulesStmt = tajweedDatabase.prepare(`
          SELECT DISTINCT 
            CASE 
              WHEN text LIKE '%<rule class=%' 
              THEN substr(text, instr(text, 'class=') + 6, instr(substr(text, instr(text, 'class=') + 6), '>') - 1)
            END as rule_class
          FROM words 
          WHERE text LIKE '%<rule class=%'
          AND rule_class IS NOT NULL
          ORDER BY rule_class
        `);
        
        const rulesRows = rulesStmt.all() as any[];
        const ruleClasses = rulesRows.map(row => row.rule_class.replace(/['"]/g, ''));
        
        return NextResponse.json({ ruleClasses });
        
      case 'pageLayout':
        const pageNumber = parseInt(searchParams.get('page') || '1');
        const pageStmt = pagesDatabase.prepare(`
          SELECT page_number, line_number, line_type, is_centered, first_word_id, last_word_id, surah_number
          FROM pages 
          WHERE page_number = ? 
          ORDER BY line_number
        `);
        
        const pageRows = pageStmt.all(pageNumber) as any[];
        
        return NextResponse.json({ pageLayout: pageRows });
        
      case 'pageWords':
        const pageNum = parseInt(searchParams.get('page') || '1');
        const lineNum = parseInt(searchParams.get('line') || '1');
        
        // Get the line info
        const lineStmt = pagesDatabase.prepare(`
          SELECT first_word_id, last_word_id, line_type, is_centered, surah_number
          FROM pages 
          WHERE page_number = ? AND line_number = ?
        `);
        
        const lineRow = lineStmt.get(pageNum, lineNum) as any;
        
        if (!lineRow || lineRow.line_type !== 'ayah') {
          return NextResponse.json({ words: [] });
        }
        
        // Get words for this line
        const lineWordsStmt = tajweedDatabase.prepare(`
          SELECT id, location, surah, ayah, word, text 
          FROM words 
          WHERE id BETWEEN ? AND ? 
          ORDER BY word
        `);
        
        const lineWordsRows = lineWordsStmt.all(lineRow.first_word_id, lineRow.last_word_id) as any[];
        
        const lineWords = lineWordsRows.map(row => ({
          id: row.id,
          location: row.location,
          surah: row.surah,
          ayah: row.ayah,
          word: row.word,
          text: cleanText(row.text),
          tajweedRules: parseTajweedRules(row.text),
        }));
        
        return NextResponse.json({ 
          words: lineWords,
          lineInfo: {
            type: lineRow.line_type,
            isCentered: lineRow.is_centered === 1,
            surahNumber: lineRow.surah_number
          }
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Tajweed API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 