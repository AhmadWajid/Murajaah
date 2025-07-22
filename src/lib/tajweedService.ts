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
  madda_permissible: 'Madda Permissible - Can be prolonged for 2-6 counts',
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
  ikhafa_shafawi: 'Ikhafa Shafawi - Partial hiding with labial letters',
  idgham_shafawi: 'Idgham Shafawi - Assimilation with labial letters',
  izhar_shafawi: 'Izhar Shafawi - Clear pronunciation with labial',
  madd_al_tamkeen: 'Madd Al Tamkeen - Strengthening prolongation',
  tafkheem: 'Tafkheem - Heavy/thick pronunciation',
  tarqeeq: 'Tarqeeq - Light/thin pronunciation',
};

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