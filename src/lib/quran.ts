export interface QuranAyah {
  surah: number;
  ayah: number;
  text: string;
  translation: string;
  words?: WordSegment[];
  audioUrl?: string;
}

export interface WordSegment {
  arabic: string;
  translation: string;
  start: number;
  end: number;
}

export interface SurahInfo {
  number: number;
  name: string;
  nameArabic: string;
  nameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  ayahCount: number;
}

// Complete Quran data structure for all 114 surahs
export const SURAH_NAMES: Record<number, SurahInfo> = {
  1: { number: 1, name: 'Al-Fatiha', nameArabic: 'الفاتحة', nameTranslation: 'The Opening', revelationType: 'Meccan', ayahCount: 7 },
  2: { number: 2, name: 'Al-Baqarah', nameArabic: 'البقرة', nameTranslation: 'The Cow', revelationType: 'Medinan', ayahCount: 286 },
  3: { number: 3, name: 'Aal-Imran', nameArabic: 'آل عمران', nameTranslation: 'The Family of Imran', revelationType: 'Medinan', ayahCount: 200 },
  4: { number: 4, name: 'An-Nisa', nameArabic: 'النساء', nameTranslation: 'The Women', revelationType: 'Medinan', ayahCount: 176 },
  5: { number: 5, name: 'Al-Ma\'idah', nameArabic: 'المائدة', nameTranslation: 'The Table Spread', revelationType: 'Medinan', ayahCount: 120 },
  6: { number: 6, name: 'Al-An\'am', nameArabic: 'الأنعام', nameTranslation: 'The Cattle', revelationType: 'Meccan', ayahCount: 165 },
  7: { number: 7, name: 'Al-A\'raf', nameArabic: 'الأعراف', nameTranslation: 'The Heights', revelationType: 'Meccan', ayahCount: 206 },
  8: { number: 8, name: 'Al-Anfal', nameArabic: 'الأنفال', nameTranslation: 'The Spoils of War', revelationType: 'Medinan', ayahCount: 75 },
  9: { number: 9, name: 'At-Tawbah', nameArabic: 'التوبة', nameTranslation: 'The Repentance', revelationType: 'Medinan', ayahCount: 129 },
  10: { number: 10, name: 'Yunus', nameArabic: 'يونس', nameTranslation: 'Jonah', revelationType: 'Meccan', ayahCount: 109 },
  11: { number: 11, name: 'Hud', nameArabic: 'هود', nameTranslation: 'Hud', revelationType: 'Meccan', ayahCount: 123 },
  12: { number: 12, name: 'Yusuf', nameArabic: 'يوسف', nameTranslation: 'Joseph', revelationType: 'Meccan', ayahCount: 111 },
  13: { number: 13, name: 'Ar-Ra\'d', nameArabic: 'الرعد', nameTranslation: 'The Thunder', revelationType: 'Medinan', ayahCount: 43 },
  14: { number: 14, name: 'Ibrahim', nameArabic: 'إبراهيم', nameTranslation: 'Abraham', revelationType: 'Meccan', ayahCount: 52 },
  15: { number: 15, name: 'Al-Hijr', nameArabic: 'الحجر', nameTranslation: 'The Rocky Tract', revelationType: 'Meccan', ayahCount: 99 },
  16: { number: 16, name: 'An-Nahl', nameArabic: 'النحل', nameTranslation: 'The Bee', revelationType: 'Meccan', ayahCount: 128 },
  17: { number: 17, name: 'Al-Isra', nameArabic: 'الإسراء', nameTranslation: 'The Night Journey', revelationType: 'Meccan', ayahCount: 111 },
  18: { number: 18, name: 'Al-Kahf', nameArabic: 'الكهف', nameTranslation: 'The Cave', revelationType: 'Meccan', ayahCount: 110 },
  19: { number: 19, name: 'Maryam', nameArabic: 'مريم', nameTranslation: 'Mary', revelationType: 'Meccan', ayahCount: 98 },
  20: { number: 20, name: 'Ta-Ha', nameArabic: 'طه', nameTranslation: 'Ta-Ha', revelationType: 'Meccan', ayahCount: 135 },
  21: { number: 21, name: 'Al-Anbya', nameArabic: 'الأنبياء', nameTranslation: 'The Prophets', revelationType: 'Meccan', ayahCount: 112 },
  22: { number: 22, name: 'Al-Hajj', nameArabic: 'الحج', nameTranslation: 'The Pilgrimage', revelationType: 'Medinan', ayahCount: 78 },
  23: { number: 23, name: 'Al-Mu\'minun', nameArabic: 'المؤمنون', nameTranslation: 'The Believers', revelationType: 'Meccan', ayahCount: 118 },
  24: { number: 24, name: 'An-Nur', nameArabic: 'النور', nameTranslation: 'The Light', revelationType: 'Medinan', ayahCount: 64 },
  25: { number: 25, name: 'Al-Furqan', nameArabic: 'الفرقان', nameTranslation: 'The Criterion', revelationType: 'Meccan', ayahCount: 77 },
  26: { number: 26, name: 'Ash-Shu\'ara', nameArabic: 'الشعراء', nameTranslation: 'The Poets', revelationType: 'Meccan', ayahCount: 227 },
  27: { number: 27, name: 'An-Naml', nameArabic: 'النمل', nameTranslation: 'The Ant', revelationType: 'Meccan', ayahCount: 93 },
  28: { number: 28, name: 'Al-Qasas', nameArabic: 'القصص', nameTranslation: 'The Stories', revelationType: 'Meccan', ayahCount: 88 },
  29: { number: 29, name: 'Al-\'Ankabut', nameArabic: 'العنكبوت', nameTranslation: 'The Spider', revelationType: 'Meccan', ayahCount: 69 },
  30: { number: 30, name: 'Ar-Rum', nameArabic: 'الروم', nameTranslation: 'The Romans', revelationType: 'Meccan', ayahCount: 60 },
  31: { number: 31, name: 'Luqman', nameArabic: 'لقمان', nameTranslation: 'Luqman', revelationType: 'Meccan', ayahCount: 34 },
  32: { number: 32, name: 'As-Sajdah', nameArabic: 'السجدة', nameTranslation: 'The Prostration', revelationType: 'Meccan', ayahCount: 30 },
  33: { number: 33, name: 'Al-Ahzab', nameArabic: 'الأحزاب', nameTranslation: 'The Combined Forces', revelationType: 'Medinan', ayahCount: 73 },
  34: { number: 34, name: 'Saba', nameArabic: 'سبإ', nameTranslation: 'Sheba', revelationType: 'Meccan', ayahCount: 54 },
  35: { number: 35, name: 'Fatir', nameArabic: 'فاطر', nameTranslation: 'Originator', revelationType: 'Meccan', ayahCount: 45 },
  36: { number: 36, name: 'Ya-Sin', nameArabic: 'يس', nameTranslation: 'Ya-Sin', revelationType: 'Meccan', ayahCount: 83 },
  37: { number: 37, name: 'As-Saffat', nameArabic: 'الصافات', nameTranslation: 'Those who set the Ranks', revelationType: 'Meccan', ayahCount: 182 },
  38: { number: 38, name: 'Sad', nameArabic: 'ص', nameTranslation: 'The Letter "Saad"', revelationType: 'Meccan', ayahCount: 88 },
  39: { number: 39, name: 'Az-Zumar', nameArabic: 'الزمر', nameTranslation: 'The Troops', revelationType: 'Meccan', ayahCount: 75 },
  40: { number: 40, name: 'Ghafir', nameArabic: 'غافر', nameTranslation: 'The Forgiver', revelationType: 'Meccan', ayahCount: 85 },
  41: { number: 41, name: 'Fussilat', nameArabic: 'فصلت', nameTranslation: 'Explained in Detail', revelationType: 'Meccan', ayahCount: 54 },
  42: { number: 42, name: 'Ash-Shuraa', nameArabic: 'الشورى', nameTranslation: 'The Consultation', revelationType: 'Meccan', ayahCount: 53 },
  43: { number: 43, name: 'Az-Zukhruf', nameArabic: 'الزخرف', nameTranslation: 'The Ornaments of Gold', revelationType: 'Meccan', ayahCount: 89 },
  44: { number: 44, name: 'Ad-Dukhan', nameArabic: 'الدخان', nameTranslation: 'The Smoke', revelationType: 'Meccan', ayahCount: 59 },
  45: { number: 45, name: 'Al-Jathiyah', nameArabic: 'الجاثية', nameTranslation: 'The Kneeling', revelationType: 'Meccan', ayahCount: 37 },
  46: { number: 46, name: 'Al-Ahqaf', nameArabic: 'الأحقاف', nameTranslation: 'The Wind-Curved Sandhills', revelationType: 'Meccan', ayahCount: 35 },
  47: { number: 47, name: 'Muhammad', nameArabic: 'محمد', nameTranslation: 'Muhammad', revelationType: 'Medinan', ayahCount: 38 },
  48: { number: 48, name: 'Al-Fath', nameArabic: 'الفتح', nameTranslation: 'The Victory', revelationType: 'Medinan', ayahCount: 29 },
  49: { number: 49, name: 'Al-Hujurat', nameArabic: 'الحجرات', nameTranslation: 'The Private Apartments', revelationType: 'Medinan', ayahCount: 18 },
  50: { number: 50, name: 'Qaf', nameArabic: 'ق', nameTranslation: 'The Letter "Qaf"', revelationType: 'Meccan', ayahCount: 45 },
  51: { number: 51, name: 'Adh-Dhariyat', nameArabic: 'الذاريات', nameTranslation: 'The Winnowing Winds', revelationType: 'Meccan', ayahCount: 60 },
  52: { number: 52, name: 'At-Tur', nameArabic: 'الطور', nameTranslation: 'The Mount', revelationType: 'Meccan', ayahCount: 49 },
  53: { number: 53, name: 'An-Najm', nameArabic: 'النجم', nameTranslation: 'The Star', revelationType: 'Meccan', ayahCount: 62 },
  54: { number: 54, name: 'Al-Qamar', nameArabic: 'القمر', nameTranslation: 'The Moon', revelationType: 'Meccan', ayahCount: 55 },
  55: { number: 55, name: 'Ar-Rahman', nameArabic: 'الرحمن', nameTranslation: 'The Beneficent', revelationType: 'Medinan', ayahCount: 78 },
  56: { number: 56, name: 'Al-Waqi\'ah', nameArabic: 'الواقعة', nameTranslation: 'The Inevitable', revelationType: 'Meccan', ayahCount: 96 },
  57: { number: 57, name: 'Al-Hadid', nameArabic: 'الحديد', nameTranslation: 'The Iron', revelationType: 'Medinan', ayahCount: 29 },
  58: { number: 58, name: 'Al-Mujadila', nameArabic: 'المجادلة', nameTranslation: 'The Pleading Woman', revelationType: 'Medinan', ayahCount: 22 },
  59: { number: 59, name: 'Al-Hashr', nameArabic: 'الحشر', nameTranslation: 'The Exile', revelationType: 'Medinan', ayahCount: 24 },
  60: { number: 60, name: 'Al-Mumtahanah', nameArabic: 'الممتحنة', nameTranslation: 'The Woman to be Examined', revelationType: 'Medinan', ayahCount: 13 },
  61: { number: 61, name: 'As-Saf', nameArabic: 'الصف', nameTranslation: 'The Ranks', revelationType: 'Medinan', ayahCount: 14 },
  62: { number: 62, name: 'Al-Jumu\'ah', nameArabic: 'الجمعة', nameTranslation: 'The Congregation, Friday', revelationType: 'Medinan', ayahCount: 11 },
  63: { number: 63, name: 'Al-Munafiqun', nameArabic: 'المنافقون', nameTranslation: 'The Hypocrites', revelationType: 'Medinan', ayahCount: 11 },
  64: { number: 64, name: 'At-Taghabun', nameArabic: 'التغابن', nameTranslation: 'The Mutual Disillusion', revelationType: 'Medinan', ayahCount: 18 },
  65: { number: 65, name: 'At-Talaq', nameArabic: 'الطلاق', nameTranslation: 'Divorce', revelationType: 'Medinan', ayahCount: 12 },
  66: { number: 66, name: 'At-Tahrim', nameArabic: 'التحريم', nameTranslation: 'The Prohibition', revelationType: 'Medinan', ayahCount: 12 },
  67: { number: 67, name: 'Al-Mulk', nameArabic: 'الملك', nameTranslation: 'The Sovereignty', revelationType: 'Meccan', ayahCount: 30 },
  68: { number: 68, name: 'Al-Qalam', nameArabic: 'القلم', nameTranslation: 'The Pen', revelationType: 'Meccan', ayahCount: 52 },
  69: { number: 69, name: 'Al-Haqqah', nameArabic: 'الحاقة', nameTranslation: 'The Reality', revelationType: 'Meccan', ayahCount: 52 },
  70: { number: 70, name: 'Al-Ma\'arij', nameArabic: 'المعارج', nameTranslation: 'The Ascending Stairways', revelationType: 'Meccan', ayahCount: 44 },
  71: { number: 71, name: 'Nuh', nameArabic: 'نوح', nameTranslation: 'Noah', revelationType: 'Meccan', ayahCount: 28 },
  72: { number: 72, name: 'Al-Jinn', nameArabic: 'الجن', nameTranslation: 'The Jinn', revelationType: 'Meccan', ayahCount: 28 },
  73: { number: 73, name: 'Al-Muzzammil', nameArabic: 'المزمل', nameTranslation: 'The Enshrouded One', revelationType: 'Meccan', ayahCount: 20 },
  74: { number: 74, name: 'Al-Muddathir', nameArabic: 'المدثر', nameTranslation: 'The Cloaked One', revelationType: 'Meccan', ayahCount: 56 },
  75: { number: 75, name: 'Al-Qiyamah', nameArabic: 'القيامة', nameTranslation: 'The Resurrection', revelationType: 'Meccan', ayahCount: 40 },
  76: { number: 76, name: 'Al-Insan', nameArabic: 'الإنسان', nameTranslation: 'Man', revelationType: 'Medinan', ayahCount: 31 },
  77: { number: 77, name: 'Al-Mursalat', nameArabic: 'المرسلات', nameTranslation: 'The Emissaries', revelationType: 'Meccan', ayahCount: 50 },
  78: { number: 78, name: 'An-Naba', nameArabic: 'النبإ', nameTranslation: 'The Tidings', revelationType: 'Meccan', ayahCount: 40 },
  79: { number: 79, name: 'An-Nazi\'at', nameArabic: 'النازعات', nameTranslation: 'Those who drag forth', revelationType: 'Meccan', ayahCount: 46 },
  80: { number: 80, name: 'Abasa', nameArabic: 'عبس', nameTranslation: 'He frowned', revelationType: 'Meccan', ayahCount: 42 },
  81: { number: 81, name: 'At-Takwir', nameArabic: 'التكوير', nameTranslation: 'The Overthrowing', revelationType: 'Meccan', ayahCount: 29 },
  82: { number: 82, name: 'Al-Infitar', nameArabic: 'الإنفطار', nameTranslation: 'The Cleaving', revelationType: 'Meccan', ayahCount: 19 },
  83: { number: 83, name: 'Al-Mutaffifin', nameArabic: 'المطففين', nameTranslation: 'The Defrauding', revelationType: 'Meccan', ayahCount: 36 },
  84: { number: 84, name: 'Al-Inshiqaq', nameArabic: 'الإنشقاق', nameTranslation: 'The Splitting Open', revelationType: 'Meccan', ayahCount: 25 },
  85: { number: 85, name: 'Al-Buruj', nameArabic: 'البروج', nameTranslation: 'The Mansions of the Stars', revelationType: 'Meccan', ayahCount: 22 },
  86: { number: 86, name: 'At-Tariq', nameArabic: 'الطارق', nameTranslation: 'The Morning Star', revelationType: 'Meccan', ayahCount: 17 },
  87: { number: 87, name: 'Al-A\'la', nameArabic: 'الأعلى', nameTranslation: 'The Most High', revelationType: 'Meccan', ayahCount: 19 },
  88: { number: 88, name: 'Al-Ghashiyah', nameArabic: 'الغاشية', nameTranslation: 'The Overwhelming', revelationType: 'Meccan', ayahCount: 26 },
  89: { number: 89, name: 'Al-Fajr', nameArabic: 'الفجر', nameTranslation: 'The Dawn', revelationType: 'Meccan', ayahCount: 30 },
  90: { number: 90, name: 'Al-Balad', nameArabic: 'البلد', nameTranslation: 'The City', revelationType: 'Meccan', ayahCount: 20 },
  91: { number: 91, name: 'Ash-Shams', nameArabic: 'الشمس', nameTranslation: 'The Sun', revelationType: 'Meccan', ayahCount: 15 },
  92: { number: 92, name: 'Al-Layl', nameArabic: 'الليل', nameTranslation: 'The Night', revelationType: 'Meccan', ayahCount: 21 },
  93: { number: 93, name: 'Ad-Duha', nameArabic: 'الضحى', nameTranslation: 'The Morning Hours', revelationType: 'Meccan', ayahCount: 11 },
  94: { number: 94, name: 'Ash-Sharh', nameArabic: 'الشرح', nameTranslation: 'The Relief', revelationType: 'Meccan', ayahCount: 8 },
  95: { number: 95, name: 'At-Tin', nameArabic: 'التين', nameTranslation: 'The Fig', revelationType: 'Meccan', ayahCount: 8 },
  96: { number: 96, name: 'Al-\'Alaq', nameArabic: 'العلق', nameTranslation: 'The Clot', revelationType: 'Meccan', ayahCount: 19 },
  97: { number: 97, name: 'Al-Qadr', nameArabic: 'القدر', nameTranslation: 'The Power', revelationType: 'Meccan', ayahCount: 5 },
  98: { number: 98, name: 'Al-Bayyinah', nameArabic: 'البينة', nameTranslation: 'The Clear Proof', revelationType: 'Medinan', ayahCount: 8 },
  99: { number: 99, name: 'Az-Zalzalah', nameArabic: 'الزلزلة', nameTranslation: 'The Earthquake', revelationType: 'Medinan', ayahCount: 8 },
  100: { number: 100, name: 'Al-\'Adiyat', nameArabic: 'العاديات', nameTranslation: 'The Coursers', revelationType: 'Meccan', ayahCount: 11 },
  101: { number: 101, name: 'Al-Qari\'ah', nameArabic: 'القارعة', nameTranslation: 'The Calamity', revelationType: 'Meccan', ayahCount: 11 },
  102: { number: 102, name: 'At-Takathur', nameArabic: 'التكاثر', nameTranslation: 'The Rivalry in world increase', revelationType: 'Meccan', ayahCount: 8 },
  103: { number: 103, name: 'Al-\'Asr', nameArabic: 'العصر', nameTranslation: 'The Declining Day', revelationType: 'Meccan', ayahCount: 3 },
  104: { number: 104, name: 'Al-Humazah', nameArabic: 'الهمزة', nameTranslation: 'The Traducer', revelationType: 'Meccan', ayahCount: 9 },
  105: { number: 105, name: 'Al-Fil', nameArabic: 'الفيل', nameTranslation: 'The Elephant', revelationType: 'Meccan', ayahCount: 5 },
  106: { number: 106, name: 'Quraish', nameArabic: 'قريش', nameTranslation: 'Quraish', revelationType: 'Meccan', ayahCount: 4 },
  107: { number: 107, name: 'Al-Ma\'un', nameArabic: 'الماعون', nameTranslation: 'The Small kindnesses', revelationType: 'Meccan', ayahCount: 7 },
  108: { number: 108, name: 'Al-Kawthar', nameArabic: 'الكوثر', nameTranslation: 'The Abundance', revelationType: 'Meccan', ayahCount: 3 },
  109: { number: 109, name: 'Al-Kafirun', nameArabic: 'الكافرون', nameTranslation: 'The Disbelievers', revelationType: 'Meccan', ayahCount: 6 },
  110: { number: 110, name: 'An-Nasr', nameArabic: 'النصر', nameTranslation: 'The Divine Support', revelationType: 'Medinan', ayahCount: 3 },
  111: { number: 111, name: 'Al-Masad', nameArabic: 'المسد', nameTranslation: 'The Palm Fiber', revelationType: 'Meccan', ayahCount: 5 },
  112: { number: 112, name: 'Al-Ikhlas', nameArabic: 'الإخلاص', nameTranslation: 'The Sincerity', revelationType: 'Meccan', ayahCount: 4 },
  113: { number: 113, name: 'Al-Falaq', nameArabic: 'الفلق', nameTranslation: 'The Daybreak', revelationType: 'Meccan', ayahCount: 5 },
  114: { number: 114, name: 'An-Nas', nameArabic: 'الناس', nameTranslation: 'Mankind', revelationType: 'Meccan', ayahCount: 6 },
};

// AlQuran.cloud API base URL
export const ALQURAN_API_BASE = 'https://api.alquran.cloud/v1';

// Default editions for different purposes
export const DEFAULT_EDITIONS = {
  arabic: 'quran-uthmani',
  english: 'en.asad',
  audio: 'ar.alafasy',
} as const;

export function getSurahName(surahNumber: number): string {
  return SURAH_NAMES[surahNumber]?.name || `Surah ${surahNumber}`;
}

export function getSurahNameArabic(surahNumber: number): string {
  return SURAH_NAMES[surahNumber]?.nameArabic || '';
}

export function formatAyahRange(surah: number, start: number, end: number): string {
  const surahName = getSurahName(surah);
  if (start === end) {
    return `${surahName} ${start}`;
  }
  return `${surahName} ${start}-${end}`;
}

export function formatAyahRangeArabic(surah: number, start: number, end: number): string {
  const surahName = getSurahNameArabic(surah);
  if (start === end) {
    return `${surahName} ${start}`;
  }
  return `${surahName} ${start}-${end}`;
}

export function getAyahCount(surah: number): number {
  return SURAH_NAMES[surah]?.ayahCount || 0;
}

export function validateAyahRange(surah: number, start: number, end: number): boolean {
  const maxAyahs = getAyahCount(surah);
  return start > 0 && end <= maxAyahs && start <= end;
}

export function generateAyahList(surah: number, start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// API functions for fetching Quran data from AlQuran.cloud
export async function fetchSurah(surah: number, edition: string = DEFAULT_EDITIONS.arabic): Promise<any> {
  try {
    const response = await fetch(`${ALQURAN_API_BASE}/surah/${surah}/${edition}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch surah ${surah}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching surah ${surah}:`, error);
    throw error;
  }
}

export async function fetchAyah(surah: number, ayah: number, edition: string = DEFAULT_EDITIONS.arabic): Promise<any> {
  try {
    const response = await fetch(`${ALQURAN_API_BASE}/ayah/${surah}:${ayah}/${edition}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ayah ${surah}:${ayah}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ayah ${surah}:${ayah}:`, error);
    throw error;
  }
}

export async function fetchAyahRange(surah: number, start: number, end: number, edition: string = DEFAULT_EDITIONS.arabic): Promise<any> {
  try {
    const response = await fetch(`${ALQURAN_API_BASE}/surah/${surah}/${edition}?offset=${start - 1}&limit=${end - start + 1}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ayah range ${surah}:${start}-${end}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ayah range ${surah}:${start}-${end}:`, error);
    throw error;
  }
}

// Sample ayah data for fallback (in a real app, this would come from QUL API)
export const SAMPLE_AYAH_DATA: Record<string, QuranAyah> = {
  '1:1': {
    surah: 1,
    ayah: 1,
    text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    translation: 'In the name of Allah, the Most Gracious, the Most Merciful.',
    words: [
      { arabic: 'بِسْمِ', translation: 'In the name', start: 0, end: 0.6 },
      { arabic: 'اللَّهِ', translation: 'of Allah', start: 0.6, end: 1.2 },
      { arabic: 'الرَّحْمَٰنِ', translation: 'the Most Gracious', start: 1.2, end: 2.0 },
      { arabic: 'الرَّحِيمِ', translation: 'the Most Merciful', start: 2.0, end: 2.8 },
    ],
    audioUrl: '/audio/001001.mp3',
  },
  '2:255': {
    surah: 2,
    ayah: 255,
    text: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    translation: 'Allah - there is no deity except Him, the Ever-Living, the Self-Sustaining. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.',
    audioUrl: '/audio/002255.mp3',
  },
};

export function getAyahData(surah: number, ayah: number): QuranAyah | null {
  const key = `${surah}:${ayah}`;
  return SAMPLE_AYAH_DATA[key] || null;
}

export function getAyahRangeData(surah: number, start: number, end: number): QuranAyah[] {
  const ayahs: QuranAyah[] = [];
  for (let i = start; i <= end; i++) {
    const ayahData = getAyahData(surah, i);
    if (ayahData) {
      ayahs.push(ayahData);
    }
  }
  return ayahs;
} 