import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Define interfaces for database responses
interface WordRow {
  id: number;
  location: string;
  surah: number;
  ayah: number;
  word: number;
  text: string;
}

interface SurahRow {
  surah: number;
}

interface AyahCountRow {
  maxAyah: number;
}

interface StatsRow {
  total_words: number;
  words_with_rules: number;
}

interface RuleClassRow {
  rule_class: string;
}

interface PageRow {
  page_number: number;
  line_number: number;
  line_type: string;
  is_centered: number;
  first_word_id: number;
  last_word_id: number;
  surah_number: number;
}

interface LineInfoRow {
  first_word_id: number;
  last_word_id: number;
  line_type: string;
  is_centered: number;
  surah_number: number;
}

interface TajweedRule {
  class: string;
  text: string;
  startIndex: number;
  endIndex: number;
}

interface ProcessedWord {
  id: number;
  location: string;
  surah: number;
  ayah: number;
  word: number;
  text: string;
  tajweedRules: TajweedRule[];
}

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

// Parse tajweed rules from XML-like tags in the text (handles nested tags)
function parseTajweedRules(text: string): TajweedRule[] {
  const rules: TajweedRule[] = [];
  // First, flatten nested rules by collecting all rule spans
  const ruleRegex = /<rule class=([^>]+)>([^<]*(?:(?!<\/rule>)<[^<]*)*)<\/rule>/g;
  let match;
  
  // We need to work with the cleaned text to compute correct indices.
  // Strategy: find all rules (including nested), compute their positions in the final clean text.
  const flattenAndParse = (rawText: string): TajweedRule[] => {
    const foundRules: TajweedRule[] = [];
    // Use a simple iterative approach: find innermost rules first
    let working = rawText;
    // Innermost rule regex: matches <rule> tags with no nested <rule> inside
    const innermostRegex = /<rule class=([^>]+)>([^<]*)<\/rule>/g;
    
    // Collect all rules with their positions in the original text
    const allMatches: { class: string; text: string; origStart: number; origEnd: number }[] = [];
    
    // Repeatedly extract innermost rules
    let safetyCounter = 0;
    while (innermostRegex.test(working) && safetyCounter < 50) {
      safetyCounter++;
      innermostRegex.lastIndex = 0;
      let innerMatch;
      while ((innerMatch = innermostRegex.exec(working)) !== null) {
        allMatches.push({
          class: innerMatch[1].replace(/['"]/g, ''),
          text: innerMatch[2],
          origStart: innerMatch.index,
          origEnd: innerMatch.index + innerMatch[0].length,
        });
      }
      // Strip innermost tags for next iteration
      working = working.replace(innermostRegex, '$2');
    }
    
    // Now compute positions relative to the fully cleaned text
    const cleanedText = cleanText(rawText);
    for (const m of allMatches) {
      const startIndex = cleanedText.indexOf(m.text);
      if (startIndex !== -1) {
        foundRules.push({
          class: m.class,
          text: m.text,
          startIndex,
          endIndex: startIndex + m.text.length,
        });
      }
    }
    
    return foundRules;
  };

  return flattenAndParse(text);
}

// Clean text by removing tajweed rule tags (handles nested tags)
function cleanText(text: string): string {
  // Repeatedly strip innermost <rule> tags until none remain
  const innermostRegex = /<rule class=[^>]+>([^<]*)<\/rule>/g;
  let result = text;
  let safetyCounter = 0;
  while (innermostRegex.test(result) && safetyCounter < 50) {
    safetyCounter++;
    result = result.replace(innermostRegex, '$1');
  }
  return result;
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
        
        const rows = stmt.all(surah, ayah) as WordRow[];
        
        const words: ProcessedWord[] = rows.map(row => ({
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
        const surahsRows = surahsStmt.all() as SurahRow[];
        const surahs = surahsRows.map(row => row.surah);
        
        return NextResponse.json({ surahs });
        
      case 'ayahCount':
        const surahNum = parseInt(searchParams.get('surah') || '1');
        const ayahStmt = tajweedDatabase.prepare('SELECT MAX(ayah) as maxAyah FROM words WHERE surah = ?');
        const ayahRow = ayahStmt.get(surahNum) as AyahCountRow | undefined;
        const maxAyah = ayahRow?.maxAyah || 0;
        
        return NextResponse.json({ maxAyah });
        
      case 'stats':
        const statsStmt = tajweedDatabase.prepare(`
          SELECT 
            COUNT(*) as total_words,
            COUNT(CASE WHEN text LIKE '%<rule class=%' THEN 1 END) as words_with_rules
          FROM words
        `);
        
        const statsRow = statsStmt.get() as StatsRow;
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
        
        const rulesRows = rulesStmt.all() as RuleClassRow[];
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
        
        const pageRows = pageStmt.all(pageNumber) as PageRow[];
        
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
        
        const lineRow = lineStmt.get(pageNum, lineNum) as LineInfoRow | undefined;
        
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
        
        const lineWordsRows = lineWordsStmt.all(lineRow.first_word_id, lineRow.last_word_id) as WordRow[];
        
        const lineWords: ProcessedWord[] = lineWordsRows.map(row => ({
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