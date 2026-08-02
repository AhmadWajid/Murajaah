/**
 * EveryAyah.com recitation library
 * Audio URL format: https://everyayah.com/data/{subfolder}/{SSSAAA}.mp3
 * Source metadata: https://everyayah.com/data/recitations.js
 */

export interface Reciter {
  id: string;
  name: string;
  subfolder: string;
  bitrate: string;
}

const EVERYAYAH_BASE = 'https://everyayah.com/data';

/**
 * Full EveryAyah catalog (Arabic recitations only).
 * Translations and non-Arabic editions are excluded.
 * When multiple bitrates exist for the same name, the highest is kept.
 */
const RAW_RECITERS: Omit<Reciter, 'id'>[] = [
  { name: 'Abdul Basit Murattal', subfolder: 'Abdul_Basit_Murattal_192kbps', bitrate: '192kbps' },
  { name: 'Abdul Basit Mujawwad', subfolder: 'Abdul_Basit_Mujawwad_128kbps', bitrate: '128kbps' },
  { name: 'Abdullah Basfar', subfolder: 'Abdullah_Basfar_192kbps', bitrate: '192kbps' },
  { name: 'Abdurrahmaan As-Sudais', subfolder: 'Abdurrahmaan_As-Sudais_192kbps', bitrate: '192kbps' },
  { name: 'AbdulSamad', subfolder: 'AbdulSamad_64kbps_QuranExplorer.Com', bitrate: '64kbps' },
  { name: 'Abu Bakr Ash-Shaatree', subfolder: 'Abu_Bakr_Ash-Shaatree_128kbps', bitrate: '128kbps' },
  { name: 'Ahmed ibn Ali al-Ajamy', subfolder: 'ahmed_ibn_ali_al_ajamy_128kbps', bitrate: '128kbps' },
  { name: 'Mishary Alafasy', subfolder: 'Alafasy_128kbps', bitrate: '128kbps' },
  { name: 'Ghamadi', subfolder: 'Ghamadi_40kbps', bitrate: '40kbps' },
  { name: 'Hani Rifai', subfolder: 'Hani_Rifai_192kbps', bitrate: '192kbps' },
  { name: 'Husary', subfolder: 'Husary_128kbps', bitrate: '128kbps' },
  { name: 'Husary Mujawwad', subfolder: 'Husary_128kbps_Mujawwad', bitrate: '128kbps' },
  { name: 'Husary (Muallim)', subfolder: 'Husary_Muallim_128kbps', bitrate: '128kbps' },
  { name: 'Hudhaify', subfolder: 'Hudhaify_128kbps', bitrate: '128kbps' },
  { name: 'Ibrahim Akhdar', subfolder: 'Ibrahim_Akhdar_64kbps', bitrate: '64kbps' },
  { name: 'Maher Al Muaiqly', subfolder: 'MaherAlMuaiqly128kbps', bitrate: '128kbps' },
  { name: 'Menshawi', subfolder: 'Menshawi_32kbps', bitrate: '32kbps' },
  { name: 'Minshawy Mujawwad', subfolder: 'Minshawy_Mujawwad_192kbps', bitrate: '192kbps' },
  { name: 'Minshawy Murattal', subfolder: 'Minshawy_Murattal_128kbps', bitrate: '128kbps' },
  { name: 'Mohammad al Tablaway', subfolder: 'Mohammad_al_Tablaway_128kbps', bitrate: '128kbps' },
  { name: 'Muhammad Ayyoub', subfolder: 'Muhammad_Ayyoub_128kbps', bitrate: '128kbps' },
  { name: 'Muhammad Jibreel', subfolder: 'Muhammad_Jibreel_128kbps', bitrate: '128kbps' },
  { name: 'Mustafa Ismail', subfolder: 'Mustafa_Ismail_48kbps', bitrate: '48kbps' },
  { name: 'Saood bin Ibraaheem Ash-Shuraym', subfolder: 'Saood_ash-Shuraym_128kbps', bitrate: '128kbps' },
  { name: 'Salaah AbdulRahman Bukhatir', subfolder: 'Salaah_AbdulRahman_Bukhatir_128kbps', bitrate: '128kbps' },
  { name: 'Muhsin Al Qasim', subfolder: 'Muhsin_Al_Qasim_192kbps', bitrate: '192kbps' },
  { name: 'Abdullaah Al-Juhaynee', subfolder: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps', bitrate: '128kbps' },
  { name: 'Salah Al Budair', subfolder: 'Salah_Al_Budair_128kbps', bitrate: '128kbps' },
  { name: 'Abdullah Matroud', subfolder: 'Abdullah_Matroud_128kbps', bitrate: '128kbps' },
  { name: 'Ahmed Neana', subfolder: 'Ahmed_Neana_128kbps', bitrate: '128kbps' },
  { name: 'Muhammad AbdulKareem', subfolder: 'Muhammad_AbdulKareem_128kbps', bitrate: '128kbps' },
  { name: 'Khalefa Al-Tunaiji', subfolder: 'khalefa_al_tunaiji_64kbps', bitrate: '64kbps' },
  { name: 'Mahmoud Ali Al-Banna', subfolder: 'mahmoud_ali_al_banna_32kbps', bitrate: '32kbps' },
  { name: '(Warsh) Ibrahim Al-Dosary', subfolder: 'warsh/warsh_ibrahim_aldosary_128kbps', bitrate: '128kbps' },
  { name: '(Warsh) Yassin Al-Jazaery', subfolder: 'warsh/warsh_yassin_al_jazaery_64kbps', bitrate: '64kbps' },
  { name: '(Warsh) Abdul Basit', subfolder: 'warsh/warsh_Abdul_Basit_128kbps', bitrate: '128kbps' },
  { name: 'Karim Mansoori', subfolder: 'Karim_Mansoori_40kbps', bitrate: '40kbps' },
  { name: 'Khalid Abdullah al-Qahtanee', subfolder: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps', bitrate: '192kbps' },
  { name: 'Yasser Ad-Dussary', subfolder: 'Yasser_Ad-Dussary_128kbps', bitrate: '128kbps' },
  { name: 'Nasser Alqatami', subfolder: 'Nasser_Alqatami_128kbps', bitrate: '128kbps' },
  { name: 'Ali Hajjaj AlSuesy', subfolder: 'Ali_Hajjaj_AlSuesy_128kbps', bitrate: '128kbps' },
  { name: 'Sahl Yassin', subfolder: 'Sahl_Yassin_128kbps', bitrate: '128kbps' },
  { name: 'Aziz Alili', subfolder: 'aziz_alili_128kbps', bitrate: '128kbps' },
  { name: 'Yaser Salamah', subfolder: 'Yaser_Salamah_128kbps', bitrate: '128kbps' },
  { name: 'Akram Al Alaqimy', subfolder: 'Akram_AlAlaqimy_128kbps', bitrate: '128kbps' },
  { name: 'Ali Jaber', subfolder: 'Ali_Jaber_64kbps', bitrate: '64kbps' },
  { name: 'Fares Abbad', subfolder: 'Fares_Abbad_64kbps', bitrate: '64kbps' },
  { name: 'Ayman Sowaid', subfolder: 'Ayman_Sowaid_64kbps', bitrate: '64kbps' },
  { name: 'Parhizgar', subfolder: 'Parhizgar_48kbps', bitrate: '48kbps' },
];

export const RECITERS: Reciter[] = RAW_RECITERS
  .map((r) => ({ ...r, id: r.subfolder }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const DEFAULT_RECITER_ID = 'Ayman_Sowaid_64kbps';

/** Map legacy alquran.cloud / display-name IDs to EveryAyah subfolders. */
const LEGACY_RECITER_MAP: Record<string, string> = {
  'ar.alafasy': 'Alafasy_128kbps',
  'ar.abdurrahmaansudais': 'Abdurrahmaan_As-Sudais_192kbps',
  'ar.abdullahbasfar': 'Abdullah_Basfar_192kbps',
  'ar.abdulsamad': 'AbdulSamad_64kbps_QuranExplorer.Com',
  'ar.ahmedajamy': 'ahmed_ibn_ali_al_ajamy_128kbps',
  'ar.aymanswoaid': 'Ayman_Sowaid_64kbps',
  'ar.hanirifai': 'Hani_Rifai_192kbps',
  'ar.hudhaify': 'Hudhaify_128kbps',
  'ar.husary': 'Husary_128kbps',
  'ar.husarymujawwad': 'Husary_128kbps_Mujawwad',
  'ar.ibrahimakhbar': 'Ibrahim_Akhdar_64kbps',
  'ar.mahermuaiqly': 'MaherAlMuaiqly128kbps',
  'ar.minshawi': 'Minshawy_Murattal_128kbps',
  'ar.muhammadayyoub': 'Muhammad_Ayyoub_128kbps',
  'ar.muhammadjibreel': 'Muhammad_Jibreel_128kbps',
  'ar.parhizgar': 'Parhizgar_48kbps',
  'ar.saoodshuraym': 'Saood_ash-Shuraym_128kbps',
  'ar.shaatree': 'Abu_Bakr_Ash-Shaatree_128kbps',
  'Ayman Sowaid': 'Ayman_Sowaid_64kbps',
  'Mishary Alafasy': 'Alafasy_128kbps',
};

export function resolveReciterId(reciterId: string): string {
  if (LEGACY_RECITER_MAP[reciterId]) {
    return LEGACY_RECITER_MAP[reciterId];
  }
  if (RECITERS.some((r) => r.id === reciterId)) {
    return reciterId;
  }
  return DEFAULT_RECITER_ID;
}

export function getReciterById(reciterId: string): Reciter {
  const resolved = resolveReciterId(reciterId);
  return RECITERS.find((r) => r.id === resolved) ?? RECITERS.find((r) => r.id === DEFAULT_RECITER_ID)!;
}

/**
 * Build EveryAyah ayah audio URL.
 * Filename is SSSAAA where SSS = surah (3 digits), AAA = ayah (3 digits).
 * Example: surah 10 ayah 12 → 010012.mp3
 */
export function getEveryAyahAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  reciterId: string = DEFAULT_RECITER_ID
): string {
  const reciter = getReciterById(reciterId);
  const file = `${String(surahNumber).padStart(3, '0')}${String(ayahNumber).padStart(3, '0')}.mp3`;
  return `${EVERYAYAH_BASE}/${reciter.subfolder}/${file}`;
}
