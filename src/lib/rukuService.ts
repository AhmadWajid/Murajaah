export interface RukuReference {
  surah: number;
  ayah: number;
}

export interface RukuData {
  number: number;
  ayahs: Array<{
    number: number;
    text: string;
    surah: {
      number: number;
      name: string;
      englishName: string;
      englishNameTranslation: string;
      revelationType: string;
      numberOfAyahs: number;
    };
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean;
  }>;
}

// Cache for ruku references
let rukuReferences: RukuReference[] | null = null;

export async function getRukuReferences(): Promise<RukuReference[]> {
  if (rukuReferences) {
    return rukuReferences;
  }

  try {
    const response = await fetch('http://api.alquran.cloud/v1/meta');
    const data = await response.json();
    
    if (data.code === 200 && data.data?.rukus?.references) {
      rukuReferences = data.data.rukus.references;
      return rukuReferences!;
    }
    
    throw new Error('Failed to fetch ruku references');
  } catch (error) {
    console.error('Error fetching ruku references:', error);
    return [];
  }
}

export async function getRukuData(rukuNumber: number): Promise<RukuData | null> {
  try {
    const response = await fetch(`http://api.alquran.cloud/v1/ruku/${rukuNumber}/quran-uthmani`);
    const data = await response.json();
    
    if (data.code === 200) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ruku ${rukuNumber}:`, error);
    return null;
  }
}

export function getRukuForAyah(surah: number, ayah: number, rukuReferences: RukuReference[]): number {
  // Find the ruku that contains this ayah
  for (let i = 0; i < rukuReferences.length; i++) {
    const currentRuku = rukuReferences[i];
    const nextRuku = rukuReferences[i + 1];
    
    // Check if this ayah is in the current ruku
    if (currentRuku.surah === surah) {
      if (nextRuku && nextRuku.surah === surah) {
        // Same surah, check if ayah is between current and next ruku
        if (ayah >= currentRuku.ayah && ayah < nextRuku.ayah) {
          return i + 1; // Ruku numbers are 1-based
        }
      } else {
        // Last ruku in this surah or different surah
        if (ayah >= currentRuku.ayah) {
          return i + 1;
        }
      }
    }
  }
  
  return 1; // Default to first ruku if not found
}

export function getRukuRange(surah: number, ayahStart: number, ayahEnd: number, rukuReferences: RukuReference[]): {
  startRuku: number;
  endRuku: number;
  rukuCount: number;
} {
  const startRuku = getRukuForAyah(surah, ayahStart, rukuReferences);
  const endRuku = getRukuForAyah(surah, ayahEnd, rukuReferences);
  
  return {
    startRuku,
    endRuku,
    rukuCount: endRuku - startRuku + 1
  };
}

export function getRukuName(rukuNumber: number, surahName: string): string {
  return `Ruku ${rukuNumber} - ${surahName}`;
} 