export interface TajweedWord {
  id: number;
  location: string;
  surah: number;
  ayah: number;
  word: number;
  text: string;
  tajweedRules: TajweedRule[];
  translation?: { text: string };
}

export interface TajweedRule {
  class: string;
  text: string;
  startIndex: number;
  endIndex: number;
  // Fields from the quranpedia engine (populated when using the new engine API)
  ruleId?: string;
  hukumId?: string;
  categoryId?: string;
  topicId?: string;
  hukumLabel?: string;   // Arabic, e.g. "المد الطبيعي الكلمي"
  ruleLabel?: string;    // Arabic, e.g. "الألف الساكنة المسبوقة بحرف مفتوح"
  topicLabel?: string;   // Arabic, e.g. "المد"
  hukumLabelEn?: string; // English, e.g. "Natural Madd (Madd Tabi'i — 2 counts)"
  topicLabelEn?: string; // English, e.g. "Prolongation (Madd)"
  ruleLabelEn?: string;  // English, e.g. "Sukoon alef preceded by a fatha letter"
}

// Tajweed rule colors for different rule types
export const TAJWEED_COLORS: Record<string, string> = {
  ham_wasl: 'text-red-500',
  laam_shamsiyah: 'text-yellow-600',
  madda_normal: 'text-green-500',
  madda_permissible: 'text-green-500',
  madda_necessary: 'text-green-600',
  slnt: 'text-gray-600',
  ghunnah: 'text-indigo-600',
  qalaqah: 'text-orange-600',
  ikhafa: 'text-purple-600',
  madda_obligatory_mottasel: 'text-green-600',
  madda_obligatory_monfasel: 'text-green-600',
  iqlab: 'text-teal-600',
  izhar: 'text-blue-500',
  idgham_ghunnah: 'text-blue-600',
  idgham_wo_ghunnah: 'text-blue-500',
  idgham_mutajanisayn: 'text-blue-600',
  idgham_mutaqaribayn: 'text-blue-600',
  ikhafa_shafawi: 'text-purple-600',
  idgham_shafawi: 'text-blue-600',
  izhar_shafawi: 'text-blue-500',
  madd_al_tamkeen: 'text-green-500',
  tafkheem: 'text-red-600',
  tarqeeq: 'text-blue-400',
};

// Tajweed rule descriptions
export const TAJWEED_DESCRIPTIONS: Record<string, string> = {
  ham_wasl: 'Hamza Wasl - Silent hamza at the beginning of words',
  laam_shamsiyah: 'Laam Shamsiyah - Solar laam (assimilated)',
  madda_normal: 'Madda Normal - Natural prolongation',
  madda_permissible: 'Madda Tabi\'i (Normal) - Natural letter madd, 2 counts',
  madda_necessary: 'Madda Necessary - Must be prolonged for 4-5 counts',
  slnt: 'Silent - Letter is not pronounced',
  ghunnah: 'Ghunnah - Nasalization for 2 counts',
  qalaqah: 'Qalaqah - Bouncing sound on qalqalah letters (ق ط ب ج د)',
  ikhafa: 'Ikhafa - Partial hiding of noon/tanween',
  madda_obligatory_mottasel: 'Madda Obligatory Connected - Must be prolonged for 4-5 counts',
  madda_obligatory_monfasel: 'Madda Obligatory Separated - Must be prolonged for 4-5 counts',
  iqlab: 'Iqlab - Converting noon to meem when followed by ب',
  izhar: 'Izhar - Clear pronunciation of noon/tanween',
  idgham_ghunnah: 'Idgham with Ghunnah - Assimilation with nasalization',
  idgham_wo_ghunnah: 'Idgham without Ghunnah - Assimilation without nasalization',
  idgham_mutajanisayn: 'Idgham Mutajanisayn - Assimilation of letters with the same articulation point',
  idgham_mutaqaribayn: 'Idgham Mutaqaribayn - Assimilation of letters with close articulation points',
  ikhafa_shafawi: 'Ikhafa Shafawi - Partial hiding with labial letters',
  idgham_shafawi: 'Idgham Shafawi - Assimilation with labial letters',
  izhar_shafawi: 'Izhar Shafawi - Clear pronunciation with labial',
  madd_al_tamkeen: 'Madd Al Tamkeen - Strengthening prolongation',
  tafkheem: 'Tafkheem - Heavy/thick pronunciation',
  tarqeeq: 'Tarqeeq - Light/thin pronunciation',
};

// Arabic names for tajweed rules (authoritative names, since English labels can be inaccurate)
export const TAJWEED_ARABIC_NAMES: Record<string, string> = {
  ham_wasl: 'همزة الوصل',
  laam_shamsiyah: 'لام شمسية',
  madda_normal: 'مد طبيعي',
  madda_permissible: 'مَدّ طبيعي',
  madda_necessary: 'مد لازم',
  slnt: 'لا يُلفَظ',
  ghunnah: 'غُنَّة',
  qalaqah: 'قلقلة',
  ikhafa: 'إخفاء',
  madda_obligatory_mottasel: 'مد واجب متصل',
  madda_obligatory_monfasel: 'مد جائز منفصل',
  iqlab: 'إقلاب',
  izhar: 'إظهار',
  idgham_ghunnah: 'إدغام بغنة',
  idgham_wo_ghunnah: 'إدغام بغير غنة',
  idgham_mutajanisayn: 'إدغام متجانسين',
  idgham_mutaqaribayn: 'إدغام متقاربين',
  ikhafa_shafawi: 'إخفاء شفوي',
  idgham_shafawi: 'إدغام شفوي',
  izhar_shafawi: 'إظهار شفوي',
  madd_al_tamkeen: 'مد التمكين',
  tafkheem: 'تفخيم',
  tarqeeq: 'ترقيق',
};

// Builds tooltip text: "الإخفاء — Ikhafa"
// Handles both old rule-class names and new topic IDs from the quranpedia engine.
export function getTajweedTooltip(ruleClass: string): string {
  // New topic-based system (quranpedia engine)
  if (TOPIC_ARABIC_NAMES[ruleClass]) {
    const arabic = TOPIC_ARABIC_NAMES[ruleClass];
    const english = TOPIC_ENGLISH_NAMES[ruleClass] || ruleClass;
    return `${arabic} — ${english}`;
  }
  // Old rule-class system (SQLite DB)
  const english = TAJWEED_DESCRIPTIONS[ruleClass] || ruleClass;
  const arabic = TAJWEED_ARABIC_NAMES[ruleClass];
  // Use short English name (first part before " - ")
  const shortEnglish = english.split(' - ')[0];
  return arabic ? `${arabic} — ${shortEnglish}` : shortEnglish;
}

// Short Arabic explanation for each rule (used in the per-ayah breakdown)
export const TAJWEED_ARABIC_DETAILS: Record<string, string> = {
  ghunnah: 'صوت يخرج من الخَيْشوم — حركتان',
  qalaqah: 'اضطراب صوت الحرف عند سكونه (ق ط ب ج د)',
  idgham_ghunnah: 'إدغام النون الساكنة أو التنوين في حروف: ي ن م و',
  idgham_wo_ghunnah: 'إدغام النون الساكنة أو التنوين في حرفَي: ل ر',
  idgham_mutajanisayn: 'إدغام حرفين متماثلين في المخرج والصفة',
  idgham_mutaqaribayn: 'إدغام حرفين متقاربين في المخرج أو الصفة',
  ikhafa: 'إخفاء النون الساكنة أو التنوين عند ١٥ حرفًا (ص ذ ث ك ج ...)',
  ikhafa_shafawi: 'إخفاء الميم الساكنة قبل باء',
  iqlab: 'نون ساكنة أو تنوين قبل باء تُقلب ميمًا',
  idgham_shafawi: 'إدغام الميم الساكنة في ميم',
  izhar: 'إظهار النون الساكنة أو التنوين عند حروف الحلق (ء ه ع ح غ خ)',
  izhar_shafawi: 'إظهار الميم الساكنة عند بقية الحروف',
  madda_normal: 'مقدار المد حركتان',
  madda_permissible: 'حرف مدّ ساكن مسبوق بحركة من جنسه — حركتان',
  madda_necessary: '٦ حركات',
  madda_obligatory_mottasel: '٤-٥ حركات (همز بعد حرف المد في كلمة واحدة)',
  madda_obligatory_monfasel: '٢-٤-٥ حركات (همز في أول الكلمة التالية)',
  ham_wasl: 'لا تُنطق في الوصل',
  laam_shamsiyah: 'لا تُنطق — تُدغم في الحرف التالي',
  slnt: 'حرف لا يُنطق',
  madd_al_tamkeen: 'مد لتثبيت النطق بين همزتين',
  tafkheem: 'تسمين صوت الحرف',
  tarqeeq: 'ترقيق صوت الحرف',
};

// English translations of the Arabic rule details
export const TAJWEED_ENGLISH_DETAILS: Record<string, string> = {
  ghunnah: 'Nasal sound from the nose — held 2 counts',
  qalaqah: 'Echoing/bouncing sound when the letter is sakin (ق ط ب ج د)',
  idgham_ghunnah: 'Merge noon sakinah/tanween into: ي ن م و',
  idgham_wo_ghunnah: 'Merge noon sakinah/tanween into: ل ر',
  idgham_mutajanisayn: 'Merge two letters identical in articulation point',
  idgham_mutaqaribayn: 'Merge two letters close in articulation point',
  ikhafa: 'Hide noon sakinah/tanween before 15 letters (ص ذ ث ك ج ...)',
  ikhafa_shafawi: 'Hide meem sakinah before ب',
  iqlab: 'Noon sakinah/tanween before ب converts to meem',
  idgham_shafawi: 'Merge meem sakinah into a following meem',
  izhar: 'Pronounce clearly at throat letters (ء ه ع ح غ خ)',
  izhar_shafawi: 'Pronounce meem sakinah clearly at all other letters',
  madda_normal: 'Prolonged 2 counts',
  madda_permissible: 'Sakin madd letter (و ي ا) preceded by a matching vowel — 2 counts',
  madda_necessary: 'Prolonged 6 counts',
  madda_obligatory_mottasel: '4-5 counts (hamza after madd letter in the same word)',
  madda_obligatory_monfasel: '2-4-5 counts (hamza at the start of the next word)',
  ham_wasl: 'Not pronounced when starting from it',
  laam_shamsiyah: 'Not pronounced — assimilated into the next letter',
  slnt: 'Letter is written but not pronounced',
  madd_al_tamkeen: 'Prolongation easing two consecutive hamzas',
  tafkheem: 'Heavy/thick pronunciation of the letter',
  tarqeeq: 'Light/thin pronunciation of the letter',
};

// --- New quranpedia tajweed engine (7-topic color system) ---
// The engine uses 7 topics instead of 21+ rule classes. Colour carries the
// topic; text carries the ruling. See src/lib/tajweed/ for the full integration.

export const TOPIC_COLORS: Record<string, string> = {
  'tafkheem-tarqeeq': '#c2410c',
  'letter-relations': '#7e22ce',
  'noon-tanween': '#0369a1',
  'meem-sakinah': '#0f766e',
  mushaddadatan: '#a16207',
  madd: '#be123c',
  qalqalah: '#15803d',
};

// Tailwind class equivalents for the 7 topics (used by TajweedAyahText)
export const TOPIC_TAILWIND_COLORS: Record<string, string> = {
  'tafkheem-tarqeeq': 'text-orange-700',
  'letter-relations': 'text-purple-700',
  'noon-tanween': 'text-sky-700',
  'meem-sakinah': 'text-teal-700',
  mushaddadatan: 'text-amber-700',
  madd: 'text-rose-700',
  qalqalah: 'text-green-700',
};

export const TOPIC_ARABIC_NAMES: Record<string, string> = {
  'tafkheem-tarqeeq': 'التفخيم والترقيق',
  'letter-relations': 'علاقات الحروف',
  'noon-tanween': 'النون والتنوين',
  'meem-sakinah': 'الميم الساكنة',
  mushaddadatan: 'المشددتان',
  madd: 'المد',
  qalqalah: 'القلقلة',
};

export const TOPIC_ENGLISH_NAMES: Record<string, string> = {
  'tafkheem-tarqeeq': 'Heavy & Light Letters',
  'letter-relations': 'Letter Relations',
  'noon-tanween': 'Noon Sakinah & Tanween',
  'meem-sakinah': 'Meem Sakinah',
  mushaddadatan: 'Doubled Letters (Ghunnah)',
  madd: 'Prolongation (Madd)',
  qalqalah: 'Qalqalah (Echo)',
};

export interface TajweedRuleInfo {
  ruleClass: string;
  arabicName: string;
  arabicDetail: string;
  english: string;
  englishDetail: string;
}

// Full info for a rule class/topic: Arabic name + Arabic detail + English description
// Handles both old rule-class names and new topic IDs from the quranpedia engine.
export function getTajweedRuleInfo(ruleClass: string): TajweedRuleInfo {
  // New topic-based system (quranpedia engine)
  if (TOPIC_ARABIC_NAMES[ruleClass]) {
    return {
      ruleClass,
      arabicName: TOPIC_ARABIC_NAMES[ruleClass],
      arabicDetail: '',
      english: TOPIC_ENGLISH_NAMES[ruleClass] || ruleClass,
      englishDetail: '',
    };
  }
  // Old rule-class system (SQLite DB)
  return {
    ruleClass,
    arabicName: TAJWEED_ARABIC_NAMES[ruleClass] || ruleClass,
    arabicDetail: TAJWEED_ARABIC_DETAILS[ruleClass] || '',
    english: TAJWEED_DESCRIPTIONS[ruleClass] || ruleClass,
    englishDetail: TAJWEED_ENGLISH_DETAILS[ruleClass] || '',
  };
}

// API functions for fetching tajweed data
export async function getTajweedWords(surah: number, ayah: number): Promise<TajweedWord[]> {
  try {
    const response = await fetch(`/api/tajweed?action=words&surah=${surah}&ayah=${ayah}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tajweed words: ${response.statusText}`);
    }
    const data = await response.json();
    return data.words || [];
  } catch (error) {
    console.error('Error fetching tajweed words:', error);
    return [];
  }
}

export async function getTajweedAyah(surah: number, ayah: number): Promise<TajweedWord[]> {
  return getTajweedWords(surah, ayah);
}

export async function getTajweedAyahRange(surah: number, startAyah: number, endAyah: number): Promise<TajweedWord[]> {
  const allWords: TajweedWord[] = [];
  
  for (let ayah = startAyah; ayah <= endAyah; ayah++) {
    const words = await getTajweedWords(surah, ayah);
    allWords.push(...words);
  }
  
  return allWords;
}

export async function getAvailableSurahs(): Promise<number[]> {
  try {
    const response = await fetch('/api/tajweed?action=surahs');
    if (!response.ok) {
      throw new Error(`Failed to fetch surahs: ${response.statusText}`);
    }
    const data = await response.json();
    return data.surahs || [];
  } catch (error) {
    console.error('Error fetching surahs:', error);
    return [];
  }
}

export async function getAyahCount(surah: number): Promise<number> {
  try {
    const response = await fetch(`/api/tajweed?action=ayahCount&surah=${surah}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ayah count: ${response.statusText}`);
    }
    const data = await response.json();
    return data.maxAyah || 0;
  } catch (error) {
    console.error('Error fetching ayah count:', error);
    return 0;
  }
}

export async function getWordCount(surah: number, ayah: number): Promise<number> {
  const words = await getTajweedWords(surah, ayah);
  return words.length;
}

// Get statistics about tajweed rules
export async function getTajweedStats(): Promise<Record<string, number>> {
  try {
    const response = await fetch('/api/tajweed?action=stats');
    if (!response.ok) {
      throw new Error(`Failed to fetch tajweed stats: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      totalWords: data.totalWords || 0,
      wordsWithRules: data.wordsWithRules || 0,
    };
  } catch (error) {
    console.error('Error fetching tajweed stats:', error);
    return {
      totalWords: 0,
      wordsWithRules: 0,
    };
  }
}

// Get all unique tajweed rule classes
export async function getTajweedRuleClasses(): Promise<string[]> {
  try {
    const response = await fetch('/api/tajweed?action=ruleClasses');
    if (!response.ok) {
      throw new Error(`Failed to fetch rule classes: ${response.statusText}`);
    }
    const data = await response.json();
    return data.ruleClasses || [];
  } catch (error) {
    console.error('Error fetching rule classes:', error);
    return [];
  }
}

// --- New quranpedia tajweed engine API functions ---

// Fetch words with tajweed rules from the new engine (7-topic color system).
// Each word's tajweedRules use topic IDs as the `class` field (e.g. "madd").
export async function getTajweedWordsFromEngine(surah: number, ayah: number): Promise<TajweedWord[]> {
  try {
    const response = await fetch(`/api/tajweed-engine?action=ayah&surah=${surah}&ayah=${ayah}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tajweed engine data: ${response.statusText}`);
    }
    const data = await response.json();
    return (data.words || []).map((w: TajweedWord) => ({
      ...w,
      tajweedRules: w.tajweedRules.map((r: TajweedRule) => ({
        ...r,
        class: r.class, // topic ID from the engine
      })),
    }));
  } catch (error) {
    console.error('Error fetching tajweed engine words:', error);
    return [];
  }
}

// Fetch the 7 topics with their labels and colors.
export async function getTajweedTopics(): Promise<Array<{ id: string; labelAr: string; labelEn: string; color: string }>> {
  try {
    const response = await fetch('/api/tajweed-engine?action=topics');
    if (!response.ok) return [];
    const data = await response.json();
    return data.topics || [];
  } catch {
    return [];
  }
} 