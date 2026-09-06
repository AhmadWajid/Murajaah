/**
 * English translations for the quranpedia tajweed corpus.
 * The corpus ships Arabic-only labels; these translations cover all 7 topics
 * and 58 ahkam so tooltips can show both languages.
 *
 * Translations are concise descriptions, not literal word-for-word renderings,
 * so an English reader understands what the ruling is about.
 */

// --- 7 topics ---

export const TOPIC_LABELS_EN: Readonly<Record<string, string>> = {
  'tafkheem-tarqeeq': 'Heavy & Light Letters (Tafkheem & Tarqeeq)',
  'letter-relations': 'Letter Relations (Idgham)',
  'noon-tanween': 'Noon Sakinah & Tanween',
  'meem-sakinah': 'Meem Sakinah',
  mushaddadatan: 'Doubled Letters (Ghunnah)',
  madd: 'Prolongation (Madd)',
  qalqalah: 'Qalqalah (Echo Sound)',
}

// --- 58 ahkam ---

export const HUKUM_LABELS_EN: Readonly<Record<string, string>> = {
  // Tafkheem ranks (Ibn al-Jazari school)
  'tafkheem-rank-1-jazari': 'Highest Tafkheem Rank (Ibn al-Jazari)',
  'tafkheem-rank-2-jazari': 'Second Tafkheem Rank (Ibn al-Jazari)',
  'tafkheem-rank-3-jazari': 'Third Tafkheem Rank (Ibn al-Jazari)',
  'tafkheem-rank-4-jazari': 'Lowest Tafkheem Rank (Ibn al-Jazari)',
  'tafkheem-rank-5-relative-jazari': 'Relative Tafkheem Rank (Ibn al-Jazari)',
  // Tafkheem ranks (Ibn al-Tahhan school)
  'tafkheem-rank-1-tahhan': 'Highest Tafkheem Rank (Ibn al-Tahhan)',
  'tafkheem-rank-2-tahhan': 'Second Tafkheem Rank (Ibn al-Tahhan)',
  'tafkheem-rank-3-relative-tahhan': 'Relative Tafkheem Rank (Ibn al-Tahhan)',
  // Always-tarqeeq letters
  'always-tarqeeq': 'Always Light Letters (Tarqeeq)',
  // Ikhfa ghunnah quality
  'ikhfa-ghunnah-tarqeeq': 'Light Ikhfa Ghunnah (Nasalization)',
  'ikhfa-ghunnah-tafkheem': 'Heavy Ikhfa Ghunnah (Nasalization)',
  // Lam Jalalah
  'lam-jalalah-tafkheem': 'Heavy Lam of Allah (Lam Jalalah)',
  'lam-jalalah-tarqeeq': 'Light Lam of Allah (Lam Jalalah)',
  // Raa rules
  'raa-tafkheem': 'Heavy Raa (Tafkheem)',
  'raa-tarqeeq': 'Light Raa (Tarqeeq)',
  'raa-either-permissible': 'Raa — Permissible Heavy or Light',
  // Alef quality
  'alef-tafkheem': 'Heavy Alef (follows heavy letter)',
  'alef-tarqeeq': 'Light Alef (follows light letter)',
  // Mutamathilain (identical letters)
  'mutamathilain-idgham-kamil': 'Complete Idgham of Identical Letters',
  'mutamathilain-izhar': 'Izhar of Identical Letters (no merging)',
  // Mutajanisain (homorganic letters)
  'mutajanisain-idgham-naqis': 'Incomplete Idgham of Homorganic Letters',
  'mutajanisain-ikhfa-shafawi': 'Labial Ikhfa of Homorganic Letters',
  // Izhar halqi (noon/tanween)
  'izhar-halqi-noon': 'Izhar of Noon Sakinah (clear pronunciation)',
  'izhar-halqi-tanween': 'Izhar of Tanween (clear pronunciation)',
  // Idgham bi-ghunnah (with nasalization)
  'idgham-bi-ghunnah-noon': 'Idgham of Noon with Ghunnah (ي ن م و)',
  'idgham-bi-ghunnah-tanween': 'Idgham of Tanween with Ghunnah (ي ن م و)',
  // Idgham bila ghunnah (without nasalization)
  'idgham-bila-ghunnah-noon': 'Idgham of Noon without Ghunnah (ل ر)',
  'idgham-bila-ghunnah-tanween': 'Idgham of Tanween without Ghunnah (ل ر)',
  // Idgham kamil (complete merging)
  'idgham-kamil-noon': 'Complete Idgham of Noon',
  'idgham-kamil-tanween': 'Complete Idgham of Tanween',
  // Idgham naqis (incomplete merging)
  'idgham-naqis-noon': 'Incomplete Idgham of Noon',
  'idgham-naqis-tanween': 'Incomplete Idgham of Tanween',
  // Iqlab (conversion)
  'iqlab-noon': 'Iqlab of Noon Sakinah (ن → م before ب)',
  'iqlab-tanween': 'Iqlab of Tanween (ن → م before ب)',
  // Ikhfa haqiqi (hiding)
  'ikhfa-haqiqi-noon': 'Ikhfa of Noon Sakinah (hidden before 15 letters)',
  'ikhfa-haqiqi-tanween': 'Ikhfa of Tanween (hidden before 15 letters)',
  // Izhar mutlaq
  'izhar-mutlaq': 'Absolute Izhar (clear, no ghunnah)',
  // Meem sakinah — idgham shafawi
  'idgham-shafawi-meem': 'Idgham of Meem Sakinah (م into م)',
  // Mushaddadatan (doubled letters)
  'noon-mushaddadah': 'Doubled Noon (Ghunnah — 2 counts)',
  'meem-mushaddadah': 'Doubled Meem (Ghunnah — 2 counts)',
  // Madd tabee (natural prolongation)
  'madd-tabee-kalimi': 'Natural Madd (Madd Tabi\'i — 2 counts)',
  // Leen (soft prolongation)
  'leen-waw': 'Soft Waw (Leen — 2-6 counts)',
  'leen-yaa': 'Soft Yaa (Leen — 2-6 counts)',
  // Madd iwad (compensation)
  'madd-iwad': 'Madd al-Iwad (compensation at pause — 2 counts)',
  // Madd silah sughra (small connecting madd)
  'madd-silah-sughra': 'Small Connecting Madd (Madd Silah Sughra — 2 counts)',
  // Seven alefs
  'seven-alefs': 'The Seven Alefs (special prolonged alefs)',
  'seven-alefs-khulf': 'The Seven Alefs with Khilaf (disputed)',
  // Madd badal (substitute madd)
  'madd-badal': 'Madd al-Badal (substitute for hamza — 2 counts)',
  // Madd muttasil (connected obligatory madd)
  'madd-muttasil': 'Obligatory Connected Madd (Madd Muttasil — 4-5 counts)',
  // Madd munfasil (separated permissible madd)
  'madd-munfasil': 'Permissible Separated Madd (Madd Munfasil — 2-4-5 counts)',
  // Meem sakinah — ikhfa shafawi
  'ikhfa-shafawi-meem': 'Ikhfa of Meem Sakinah (hidden before ب)',
  // Meem sakinah — izhar shafawi
  'izhar-shafawi-meem': 'Izhar of Meem Sakinah (clear, except before ب/م)',
  // Qalqalah ranks
  'qalqalah-sughra': 'Minor Qalqalah (middle of word)',
  'qalqalah-mutatarrifa': 'Qalqalah at Word End (not followed by sukoon)',
  'qalqalah-kubra': 'Major Qalqalah (at pause on sukoon)',
  // Madd lazim (necessary madd)
  'madd-lazim-kalimi-muthaqqal': 'Necessary Heavy Madd (Madd Lazim — 6 counts, with shadda)',
  'madd-lazim-kalimi-mukhaffaf': 'Necessary Light Madd (Madd Lazim — 6 counts, no shadda)',
  'madd-lazim-harfi': 'Necessary Letter Madd (Madd Lazim Harfi — 6 counts, in surah openings)',
}

// --- 182 rules ---
// Each rule is the specific condition under which the hukum applies.

export const RULE_LABELS_EN: Readonly<Record<string, string>> = {
  // Tafkheem ranks — Ibn al-Jazari school
  'tafkheem-rank-1-jazari.1': 'Elevation letter (خ ص ض غ ط ق ظ) with fatha followed by alef',
  'tafkheem-rank-1-jazari.2': 'Elevation letter (خ ص ض غ ط ق ظ) with fatha + shadda followed by alef',
  'tafkheem-rank-1-jazari.3': 'Pausing on a word ending with elevation letter (خ ص ض غ ط ق ظ) + fatha tanween',
  'tafkheem-rank-2-jazari.1': 'Elevation letter (خ ص ض غ ط ق ظ) with fatha, not followed by alef',
  'tafkheem-rank-2-jazari.2': 'Elevation letter (خ ص ض غ ط ق ظ) with fatha + shadda, not followed by alef',
  'tafkheem-rank-3-jazari.1': 'Elevation letter (خ ص ض غ ط ق ظ) with damma',
  'tafkheem-rank-3-jazari.2': 'Elevation letter (خ ص ض غ ط ق ظ) with damma + shadda',
  'tafkheem-rank-4-jazari.1': 'Elevation letter (خ ص ض غ ط ق ظ) with sukoon',
  'tafkheem-rank-5-relative-jazari.1': 'Elevation letter (خ ص ض غ ط ق ظ) with kasra',
  'tafkheem-rank-5-relative-jazari.2': 'Elevation letter (خ ص ض غ ط ق ظ) with kasra + shadda',
  // Tafkheem ranks — Ibn al-Tahhan school
  'tafkheem-rank-1-tahhan.1': 'Elevation letter (خ ص ض غ ط ق ظ) with fatha',
  'tafkheem-rank-1-tahhan.2': 'Elevation letter (خ ص ض غ ط ق ظ) with fatha + shadda',
  'tafkheem-rank-1-tahhan.3': 'Elevation letter (خ ص ض غ ط ق ظ) with sukoon after fatha',
  'tafkheem-rank-2-tahhan.1': 'Elevation letter (خ ص ض غ ط ق ظ) with damma',
  'tafkheem-rank-2-tahhan.2': 'Elevation letter (خ ص ض غ ط ق ظ) with damma + shadda',
  'tafkheem-rank-2-tahhan.3': 'Elevation letter (خ ص ض غ ط ق ظ) with sukoon after damma',
  'tafkheem-rank-3-relative-tahhan.1': 'Elevation letter (خ ص ض غ ط ق ظ) with kasra',
  'tafkheem-rank-3-relative-tahhan.2': 'Elevation letter (خ ص ض غ ط ق ظ) with kasra + shadda',
  'tafkheem-rank-3-relative-tahhan.3': 'Elevation letter (خ ص ض غ ط ق ظ) with sukoon after kasra',
  // Always tarqeeq
  'always-tarqeeq.1': 'All low (light) letters, except alef, raa, and lam of Allah',
  // Ikhfa ghunnah — tarqeeq (light)
  'ikhfa-ghunnah-tarqeeq.1': 'Noon sakinah followed by a light ikhfa letter (ذ ث ك ج ش س د ز ف ت)',
  'ikhfa-ghunnah-tarqeeq.2': 'Fatha tanween followed by a light ikhfa letter (ذ ث ك ج ش س د ز ف ت)',
  'ikhfa-ghunnah-tarqeeq.3': 'Damma tanween followed by a light ikhfa letter (ذ ث ك ج ش س د ز ف ت)',
  'ikhfa-ghunnah-tarqeeq.4': 'Kasra tanween followed by a light ikhfa letter (ذ ث ك ج ش س د ز ف ت)',
  // Ikhfa ghunnah — tafkheem (heavy)
  'ikhfa-ghunnah-tafkheem.1': 'Noon sakinah followed by a heavy ikhfa letter (ص ق ط ض ظ)',
  'ikhfa-ghunnah-tafkheem.2': 'Fatha tanween followed by a heavy ikhfa letter (ص ق ط ض ظ)',
  'ikhfa-ghunnah-tafkheem.3': 'Damma tanween followed by a heavy ikhfa letter (ص ق ط ض ظ)',
  'ikhfa-ghunnah-tafkheem.4': 'Kasra tanween followed by a heavy ikhfa letter (ص ق ط ض ظ)',
  // Lam Jalalah
  'lam-jalalah-tafkheem.1': 'Fatha or damma before the word Allah / Allahumma',
  'lam-jalalah-tarqeeq.1': 'Kasra or tanween before the word Allah / Allahumma',
  // Raa — tafkheem (heavy)
  'raa-tafkheem.1': 'Raa with fatha or damma',
  'raa-tafkheem.2': 'Raa with sukoon preceded by fatha or damma',
  'raa-tafkheem.3': 'Raa with sukoon preceded by a non-yaa sukoon, which is preceded by fatha or damma',
  'raa-tafkheem.4': 'Raa with sukoon preceded by hamzat al-wasl',
  'raa-tafkheem.5': 'Raa with sukoon preceded by kasra and followed by an elevation letter',
  // Raa — tarqeeq (light)
  'raa-tarqeeq.1': 'Raa with kasra',
  'raa-tarqeeq.2': 'Raa with sukoon preceded by kasra, not followed by an elevation letter',
  'raa-tarqeeq.3': 'Raa with sukoon preceded by yaa sakinah',
  'raa-tarqeeq.4': 'Raa with sukoon preceded by a non-yaa, non-elevation sukoon, which is preceded by kasra',
  // Raa — either permissible
  'raa-either-permissible.1': 'Raa with sukoon preceded by kasra and followed by a weak elevation letter',
  'raa-either-permissible.2': 'Raa with sukoon preceded by kasra and followed by an elevation letter with kasra (e.g. فِرْق)',
  'raa-either-permissible.3': 'Raa with sukoon at pause, preceded by an elevation sukoon, which is preceded by kasra',
  'raa-either-permissible.4': 'Raa with kasra at end of word, whose yaa is dropped at pause',
  // Alef quality
  'alef-tafkheem.1': 'Alef following a letter that is heavy by the preceding rules',
  'alef-tarqeeq.1': 'Alef following a letter that is light by the preceding rules',
  // Mutamathilain — complete idgham (identical letters)
  'mutamathilain-idgham-kamil.1': 'Hamza sakinah followed by hamza',
  'mutamathilain-idgham-kamil.2': 'Baa sakinah followed by baa',
  'mutamathilain-idgham-kamil.3': 'Taa sakinah followed by taa',
  'mutamathilain-idgham-kamil.4': 'Thaa sakinah followed by thaa',
  'mutamathilain-idgham-kamil.5': 'Jeem sakinah followed by jeem',
  'mutamathilain-idgham-kamil.6': 'Haa sakinah followed by haa',
  'mutamathilain-idgham-kamil.7': 'Khaa sakinah followed by khaa',
  'mutamathilain-idgham-kamil.8': 'Daal sakinah followed by daal',
  'mutamathilain-idgham-kamil.9': 'Dhaal sakinah followed by dhaal',
  'mutamathilain-idgham-kamil.10': 'Raa sakinah followed by raa',
  'mutamathilain-idgham-kamil.11': 'Zaay sakinah followed by zaay',
  'mutamathilain-idgham-kamil.12': 'Seen sakinah followed by seen',
  'mutamathilain-idgham-kamil.13': 'Sheen sakinah followed by sheen',
  'mutamathilain-idgham-kamil.14': 'Saad sakinah followed by saad',
  'mutamathilain-idgham-kamil.15': 'Daad sakinah followed by daad',
  'mutamathilain-idgham-kamil.16': 'Taa (ط) sakinah followed by taa (ط)',
  'mutamathilain-idgham-kamil.17': 'Zaa (ظ) sakinah followed by zaa (ظ)',
  'mutamathilain-idgham-kamil.18': 'Ayn sakinah followed by ayn',
  'mutamathilain-idgham-kamil.19': 'Ghayn sakinah followed by ghayn',
  'mutamathilain-idgham-kamil.20': 'Faa sakinah followed by faa',
  'mutamathilain-idgham-kamil.21': 'Qaaf sakinah followed by qaaf',
  'mutamathilain-idgham-kamil.22': 'Kaaf sakinah followed by kaaf',
  'mutamathilain-idgham-kamil.23': 'Lam sakinah followed by lam',
  'mutamathilain-idgham-kamil.24': 'Meem sakinah followed by meem',
  'mutamathilain-idgham-kamil.25': 'Noon sakinah followed by noon',
  'mutamathilain-idgham-kamil.26': 'Fatha tanween followed by noon',
  'mutamathilain-idgham-kamil.27': 'Damma tanween followed by noon',
  'mutamathilain-idgham-kamil.28': 'Kasra tanween followed by noon',
  'mutamathilain-idgham-kamil.29': 'Haa sakinah followed by haa',
  'mutamathilain-idgham-kamil.30': 'Waw sakinah preceded by fatha followed by waw',
  'mutamathilain-idgham-kamil.31': 'Yaa sakinah preceded by fatha followed by yaa',
  'mutamathilain-idgham-kamil.32': 'Daal sakinah followed by taa',
  'mutamathilain-idgham-kamil.33': 'Dhaal sakinah followed by zaa (ظ)',
  'mutamathilain-idgham-kamil.34': 'Taa sakinah followed by taa (ط)',
  'mutamathilain-idgham-kamil.35': 'Taa sakinah followed by daal',
  'mutamathilain-idgham-kamil.36': 'Baa sakinah followed by meem',
  'mutamathilain-idgham-kamil.37': 'Thaa sakinah followed by dhaal',
  // Mutamathilain — izhar (identical letters, no merging)
  'mutamathilain-izhar.1': 'Waw sakinah preceded by damma followed by waw',
  'mutamathilain-izhar.2': 'Yaa sakinah preceded by kasra followed by yaa',
  'mutamathilain-izhar.3': 'Hamza sakinah followed by haa',
  'mutamathilain-izhar.4': 'Haa sakinah followed by hamza',
  'mutamathilain-izhar.5': 'Haa (ح) sakinah followed by ayn',
  'mutamathilain-izhar.6': 'Ayn sakinah followed by haa (ح)',
  'mutamathilain-izhar.7': 'Ghayn sakinah followed by khaa',
  'mutamathilain-izhar.8': 'Khaa sakinah followed by ghayn',
  'mutamathilain-izhar.9': 'Jeem sakinah followed by sheen',
  'mutamathilain-izhar.10': 'Jeem sakinah followed by yaa',
  'mutamathilain-izhar.11': 'Yaa sakinah followed by sheen',
  'mutamathilain-izhar.12': 'Yaa sakinah followed by jeem',
  'mutamathilain-izhar.13': 'Sheen sakinah followed by yaa',
  'mutamathilain-izhar.14': 'Sheen sakinah followed by jeem',
  'mutamathilain-izhar.15': 'Daal sakinah followed by taa (ط)',
  'mutamathilain-izhar.16': 'Taa (ط) sakinah followed by daal',
  'mutamathilain-izhar.17': 'Seen sakinah followed by zaay',
  'mutamathilain-izhar.18': 'Seen sakinah followed by saad',
  'mutamathilain-izhar.19': 'Zaay sakinah followed by seen',
  'mutamathilain-izhar.20': 'Zaay sakinah followed by saad',
  'mutamathilain-izhar.21': 'Saad sakinah followed by zaay',
  'mutamathilain-izhar.22': 'Saad sakinah followed by seen',
  'mutamathilain-izhar.23': 'Dhaal sakinah followed by thaa',
  'mutamathilain-izhar.24': 'Thaa sakinah followed by zaa (ظ)',
  'mutamathilain-izhar.25': 'Zaa (ظ) sakinah followed by dhaal',
  'mutamathilain-izhar.26': 'Zaa (ظ) sakinah followed by thaa',
  'mutamathilain-izhar.27': 'Waw sakinah followed by meem',
  'mutamathilain-izhar.28': 'Waw sakinah followed by baa',
  'mutamathilain-izhar.29': 'Meem sakinah followed by waw',
  'mutamathilain-izhar.30': 'Baa sakinah followed by waw',
  // Mutajanisain — incomplete idgham (homorganic letters)
  'mutajanisain-idgham-naqis.1': 'Taa (ط) sakinah followed by taa',
  // Mutajanisain — labial ikhfa
  'mutajanisain-ikhfa-shafawi.1': 'Meem sakinah followed by baa',
  // Izhar halqi — noon
  'izhar-halqi-noon.1': 'Noon sakinah followed by one of the six throat letters (ء هـ ح خ ع غ)',
  // Izhar halqi — tanween
  'izhar-halqi-tanween.1': 'Fatha tanween followed by one of the six throat letters (ء هـ ح خ ع غ)',
  'izhar-halqi-tanween.2': 'Damma tanween followed by one of the six throat letters (ء هـ ح خ ع غ)',
  'izhar-halqi-tanween.3': 'Kasra tanween followed by one of the six throat letters (ء هـ ح خ ع غ)',
  // Idgham bi-ghunnah — noon
  'idgham-bi-ghunnah-noon.1': 'Noon sakinah followed by one of the ghunnah idgham letters (ي ن م و)',
  // Idgham bi-ghunnah — tanween
  'idgham-bi-ghunnah-tanween.1': 'Fatha tanween followed by one of the ghunnah idgham letters (ي ن م و)',
  'idgham-bi-ghunnah-tanween.2': 'Damma tanween followed by one of the ghunnah idgham letters (ي ن م و)',
  'idgham-bi-ghunnah-tanween.3': 'Kasra tanween followed by one of the ghunnah idgham letters (ي ن م و)',
  // Idgham bila ghunnah — noon
  'idgham-bila-ghunnah-noon.1': 'Noon sakinah followed by one of the no-ghunnah idgham letters (ل ر)',
  // Idgham bila ghunnah — tanween
  'idgham-bila-ghunnah-tanween.1': 'Fatha tanween followed by one of the no-ghunnah idgham letters (ل ر)',
  'idgham-bila-ghunnah-tanween.2': 'Damma tanween followed by one of the no-ghunnah idgham letters (ل ر)',
  'idgham-bila-ghunnah-tanween.3': 'Kasra tanween followed by one of the no-ghunnah idgham letters (ل ر)',
  // Idgham kamil — noon
  'idgham-kamil-noon.1': 'Noon sakinah followed by one of the complete idgham letters (ن ر م ل)',
  // Idgham kamil — tanween
  'idgham-kamil-tanween.1': 'Fatha tanween followed by one of the complete idgham letters (ن ر م ل)',
  'idgham-kamil-tanween.2': 'Damma tanween followed by one of the complete idgham letters (ن ر م ل)',
  'idgham-kamil-tanween.3': 'Kasra tanween followed by one of the complete idgham letters (ن ر م ل)',
  // Idgham naqis — noon
  'idgham-naqis-noon.1': 'Noon sakinah followed by one of the incomplete idgham letters (ي و), between two words only',
  // Idgham naqis — tanween
  'idgham-naqis-tanween.1': 'Fatha tanween followed by one of the incomplete idgham letters (ي و)',
  'idgham-naqis-tanween.2': 'Damma tanween followed by one of the incomplete idgham letters (ي و)',
  'idgham-naqis-tanween.3': 'Kasra tanween followed by one of the incomplete idgham letters (ي و)',
  // Iqlab — noon
  'iqlab-noon.1': 'Noon sakinah followed by meem',
  // Iqlab — tanween
  'iqlab-tanween.1': 'Fatha tanween followed by baa',
  'iqlab-tanween.2': 'Damma tanween followed by baa',
  'iqlab-tanween.3': 'Kasra tanween followed by baa',
  // Ikhfa haqiqi — noon
  'ikhfa-haqiqi-noon.1': 'Noon sakinah followed by one of the 15 ikhfa letters (ص ذ ث ك ج ش ق س د ط ز ف ت ض ظ)',
  // Ikhfa haqiqi — tanween
  'ikhfa-haqiqi-tanween.1': 'Fatha tanween followed by one of the 15 ikhfa letters (ص ذ ث ك ج ش ق س د ط ز ف ت ض ظ)',
  'ikhfa-haqiqi-tanween.2': 'Damma tanween followed by one of the 15 ikhfa letters (ص ذ ث ك ج ش ق س د ط ز ف ت ض ظ)',
  'ikhfa-haqiqi-tanween.3': 'Kasra tanween followed by one of the 15 ikhfa letters (ص ذ ث ك ج ش ق س د ط ز ف ت ض ظ)',
  // Izhar mutlaq
  'izhar-mutlaq.1': 'Noon sakinah followed by one of the ghunnah idgham letters (ي ن م و) within one word',
  'izhar-mutlaq.2': 'Noon sakinah at the end of the disjointed letters meeting waw',
  // Meem sakinah — idgham shafawi
  'idgham-shafawi-meem.1': 'Meem sakinah followed by meem',
  // Meem sakinah — ikhfa shafawi
  'ikhfa-shafawi-meem.1': 'Meem sakinah followed by baa',
  // Meem sakinah — izhar shafawi
  'izhar-shafawi-meem.1': 'Meem sakinah followed by any letter except baa and meem',
  // Mushaddadatan
  'noon-mushaddadah.1': 'Doubled noon (shadda on noon)',
  'meem-mushaddadah.1': 'Doubled meem (shadda on meem)',
  // Madd tabee — natural (2 counts)
  'madd-tabee-kalimi.1': 'Sukoon alef preceded by a fatha letter (except open hamza)',
  'madd-tabee-kalimi.2': 'Sukoon waw preceded by a damma letter (except damma hamza)',
  'madd-tabee-kalimi.3': 'Sukoon yaa preceded by a kasra letter (except kasra hamza)',
  // Leen (soft madd)
  'leen-waw.1': 'Sukoon waw preceded by a fatha letter',
  'leen-yaa.1': 'Sukoon yaa preceded by a fatha letter',
  // Madd iwad (compensation)
  'madd-iwad.1': 'Fatha tanween at pause (except fatha tanween on taa marbuta)',
  // Madd silah sughra (small connecting madd)
  'madd-silah-sughra.1': 'Haa at end of word followed by small waw, in connection only',
  'madd-silah-sughra.2': 'Haa at end of word followed by small curly yaa, in connection only',
  // Seven alefs (special prolonged alefs in Hafs)
  'seven-alefs.1': 'The word "لَكِنَّا" in Al-Kahf 38',
  'seven-alefs.2': 'The word "قَوَارِيرَا" in Al-Insan 15',
  'seven-alefs.3': 'The word "الظُّنُونَا" in Al-Ahzab 10',
  'seven-alefs.4': 'The word "الرَّسُولَا" in Al-Ahzab 66',
  'seven-alefs.5': 'The word "السَّبِيلَا" in Al-Ahzab 67',
  'seven-alefs.6': 'The word "أَنَا" wherever it occurs, provided no hamzat al-wasl follows',
  // Seven alefs with khilaf (disputed)
  'seven-alefs-khulf.1': 'The word "سَلَاسِلَا" in Al-Insan 4',
  // Madd badal (substitute madd)
  'madd-badal.1': 'Sukoon alef preceded by open hamza',
  'madd-badal.2': 'Sukoon waw preceded by damma hamza',
  'madd-badal.3': 'Sukoon yaa preceded by kasra hamza',
  // Madd muttasil (obligatory connected madd)
  'madd-muttasil.1': 'Sukoon alef preceded by fatha letter and followed by hamza in the same word',
  'madd-muttasil.2': 'Sukoon waw preceded by damma letter and followed by hamza in the same word',
  'madd-muttasil.3': 'Sukoon yaa preceded by kasra letter and followed by hamza in the same word',
  // Madd munfasil (permissible separated madd)
  'madd-munfasil.1': 'Sukoon alef preceded by fatha at end of word, followed by hamza at start of next word',
  'madd-munfasil.2': 'Sukoon waw preceded by damma at end of word, followed by hamza at start of next word',
  'madd-munfasil.3': 'Waw al-jamaa sakinah preceded by damma, followed by hamza at start of next word (the alef after waw is the separating alef)',
  'madd-munfasil.4': 'Sukoon yaa preceded by kasra at end of word, followed by hamza at start of next word',
  // Qalqalah ranks
  'qalqalah-sughra.1': 'A qalqalah letter (ق ط ب ج د) with sukoon in the middle of a word',
  'qalqalah-mutatarrifa.1': 'A qalqalah letter (ق ط ب ج د) with sukoon at the end of a word',
  'qalqalah-kubra.1': 'A qalqalah letter (ق ط ب ج د) at the end of an ayah (at pause)',
  // Madd lazim — kalimi muthaqqal (necessary heavy, with shadda)
  'madd-lazim-kalimi-muthaqqal.1': 'A shadda letter following the madd alef in the same word',
  'madd-lazim-kalimi-muthaqqal.2': 'A shadda letter following the madd waw in the same word',
  'madd-lazim-kalimi-muthaqqal.3': 'A shadda letter following the madd yaa in the same word',
  // Madd lazim — kalimi mukhaffaf (necessary light, no shadda)
  'madd-lazim-kalimi-mukhaffaf.1': 'An original sukoon letter (not shadda) following the madd alef in the same word',
  // Madd lazim — harfi (in surah openings)
  'madd-lazim-harfi.1': 'A surah-opening letter whose spelling is 3 letters with the middle being a madd letter (ل م س ص ع ق ك ن)',
}
