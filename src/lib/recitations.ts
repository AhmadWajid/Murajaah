/**
 * Recitation library — mp3quran.net + quranpedia.net catalog.
 *
 * Two playback modes:
 *  - "verse": each ayah has its own audio file at `${server}${SSS}${AAA}.mp3`
 *    (e.g. https://verse.mp3quran.net/arabic/maher_almuaiqly/128/010012.mp3)
 *  - "surah": one full-surah file at `${server}${SSS}.mp3`
 *    (e.g. https://server16.mp3quran.net/i_sanankoua/Rewayat-Hafs-A-n-Assem/010.mp3)
 *    Per-ayah playback uses timing segments fetched from
 *    https://quranpedia.net/api/recitation/{id}/timings/{surah}
 */

export type RecitationMode = 'verse' | 'surah';

export interface Reciter {
  /** Stable identifier (the numeric recitation id as a string). */
  id: string;
  /** Numeric recitation id used by the quranpedia timings API. */
  numericId: number;
  /** Display name (Arabic). */
  name: string;
  /** English transliteration name. */
  englishName: string;
  /** Base server URL for audio files. */
  server: string;
  /** Playback mode. */
  mode: RecitationMode;
  /** Catalog group label (Arabic). */
  group: string;
  /** Catalog group label (English). */
  groupEn: string;
}

export interface AyahTiming {
  ayah_number: number;
  start_time: number; // milliseconds
  end_time: number; // milliseconds
}

export interface AudioPlan {
  url: string;
  mode: RecitationMode;
  /** Absolute start of the ayah segment within the audio file (seconds). */
  segmentStart: number;
  /** Absolute end of the ayah segment within the audio file (seconds). */
  segmentEnd: number;
}

interface RawReciter {
  id: number;
  name: string;
  englishName: string;
  server: string;
  mode: RecitationMode;
}

const VERSE_GROUP = 'تلاوات بالآية';
const VERSE_GROUP_EN = 'Per-Verse Recitations';
const SURAH_GROUP = 'تلاوات بالسورة كاملة';
const SURAH_GROUP_EN = 'Full-Surah Recitations';

const RAW_VERSE_RECITERS: RawReciter[] = [
  { id: 28, name: 'ماهر المعيقلي', englishName: 'Maher Al Muaiqly', server: 'https://verse.mp3quran.net/arabic/maher_almuaiqly/128/', mode: 'verse' },
  { id: 31, name: 'محمد جبريل', englishName: 'Muhammad Jibreel', server: 'https://verse.mp3quran.net/arabic/mohammad_jibreel/128/', mode: 'verse' },
  { id: 33, name: 'المنشاوي — مجود', englishName: 'Al-Minshawi — Mujawwad', server: 'https://verse.mp3quran.net/arabic/mohammad_alminshawi_mujawwd/128/', mode: 'verse' },
  { id: 37, name: 'محمود علي البنا', englishName: 'Mahmoud Ali Al-Banna', server: 'https://verse.mp3quran.net/arabic/mahmoud_ali_albanna/32/', mode: 'verse' },
  { id: 39, name: 'ياسر سلامة', englishName: 'Yasser Salamah', server: 'https://verse.mp3quran.net/arabic/yaser_salamah/128/', mode: 'verse' },
  { id: 41, name: 'الحصري — معلم', englishName: 'Al-Husary — Muallim', server: 'https://verse.mp3quran.net/arabic/mahmood_alhusary_muallim/128/', mode: 'verse' },
  { id: 248, name: 'محمد صديق المنشاوي', englishName: 'Muhammad Siddiq Al-Minshawi', server: 'https://files.quranpedia.net/recitations/248/', mode: 'verse' },
  { id: 249, name: 'محمد أيوب بن محمد يوسف', englishName: 'Muhammad Ayyub', server: 'https://files.quranpedia.net/recitations/249/', mode: 'verse' },
  { id: 251, name: 'إبراهيم الأخضر', englishName: 'Ibrahim Akhdar', server: 'https://files.quranpedia.net/recitations/251/', mode: 'verse' },
  { id: 253, name: 'عبد الله بصفر', englishName: 'Abdullah Basfar', server: 'https://files.quranpedia.net/recitations/253/', mode: 'verse' },
  { id: 254, name: 'علي بن عبد الرحمن الحذيفي', englishName: 'Ali Al-Hudhaify', server: 'https://files.quranpedia.net/recitations/254/', mode: 'verse' },
  { id: 255, name: 'مشاري راشد العفاسي', englishName: 'Mishary Rashid Alafasy', server: 'https://files.quranpedia.net/recitations/255/', mode: 'verse' },
  { id: 256, name: 'مفتاح محمد السلطني', englishName: 'Muftah Al-Sultani', server: 'https://files.quranpedia.net/recitations/256/', mode: 'verse' },
];

const RAW_SURAH_RECITERS: RawReciter[] = [
  { id: 44, name: 'أحمد الحواشي', englishName: 'Ahmed Al-Hawashi', server: 'https://server11.mp3quran.net/hawashi', mode: 'surah' },
  { id: 46, name: 'أحمد الطرابلسي', server: 'https://server10.mp3quran.net/trabulsi', englishName: 'Ahmed Al-Trabulsi', mode: 'surah' },
  { id: 47, name: 'أحمد النفيس', englishName: 'Ahmed Al-Nufais', server: 'https://server16.mp3quran.net/nufais/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 48, name: 'أحمد بن علي العجمي', englishName: 'Ahmed ibn Ali Al-Ajamy', server: 'https://server10.mp3quran.net/ajm', mode: 'surah' },
  { id: 51, name: 'أحمد صابر', englishName: 'Ahmed Saber', server: 'https://server8.mp3quran.net/saber', mode: 'surah' },
  { id: 52, name: 'أحمد عامر', englishName: 'Ahmed Amer', server: 'https://server10.mp3quran.net/Aamer', mode: 'surah' },
  { id: 53, name: 'أحمد نعينع', englishName: 'Ahmed Neana', server: 'https://server11.mp3quran.net/ahmad_nu', mode: 'surah' },
  { id: 55, name: 'أكرم العلاقمي', englishName: 'Akram Al-Alaqimy', server: 'https://server9.mp3quran.net/akrm', mode: 'surah' },
  { id: 56, name: 'إبراهيم الأخضر', englishName: 'Ibrahim Akhdar', server: 'https://server6.mp3quran.net/akdr', mode: 'surah' },
  { id: 57, name: 'إدريس أبكر', englishName: 'Idris Abkar', server: 'https://server6.mp3quran.net/abkr', mode: 'surah' },
  { id: 64, name: 'ابراهيم العسيري', englishName: 'Ibrahim Al-Asiri', server: 'https://server6.mp3quran.net/3siri', mode: 'surah' },
  { id: 68, name: 'الزين محمد أحمد', englishName: 'Al-Zain Muhammad Ahmed', server: 'https://server9.mp3quran.net/alzain', mode: 'surah' },
  { id: 74, name: 'بندر بليله', englishName: 'Bandar Balilah', server: 'https://server6.mp3quran.net/balilah', mode: 'surah' },
  { id: 75, name: 'توفيق الصايغ', englishName: 'Tawfiq Al-Sayegh', server: 'https://server6.mp3quran.net/twfeeq', mode: 'surah' },
  { id: 78, name: 'جمعان العصيمي', englishName: 'Jamaan Al-Osaimi', server: 'https://server6.mp3quran.net/jaman', mode: 'surah' },
  { id: 82, name: 'خالد الجليل', englishName: 'Khalid Al-Jalil', server: 'https://server10.mp3quran.net/jleel', mode: 'surah' },
  { id: 86, name: 'خالد القحطاني', englishName: 'Khalid Al-Qahtani', server: 'https://server10.mp3quran.net/qht', mode: 'surah' },
  { id: 87, name: 'خالد المهنا', englishName: 'Khalid Al-Muhanna', server: 'https://server11.mp3quran.net/mohna', mode: 'surah' },
  { id: 89, name: 'خالد عبد الكافي', englishName: 'Khalid Abdul Kafi', server: 'https://server11.mp3quran.net/kafi', mode: 'surah' },
  { id: 90, name: 'خليفة الطنيجي', englishName: 'Khalifa Al-Tunaiji', server: 'https://server12.mp3quran.net/tnjy', mode: 'surah' },
  { id: 91, name: 'داود حمزة', englishName: 'Dawood Hamza', server: 'https://server9.mp3quran.net/hamza', mode: 'surah' },
  { id: 96, name: 'رعد محمد الكردي', englishName: "Ra'ad Muhammad Al-Kurdi", server: 'https://server6.mp3quran.net/kurdi', mode: 'surah' },
  { id: 100, name: 'زكي داغستاني', englishName: 'Zaki Daghestani', server: 'https://server9.mp3quran.net/zaki', mode: 'surah' },
  { id: 104, name: 'سعد الغامدي', englishName: "Sa'ad Al-Ghamdi", server: 'https://server7.mp3quran.net/s_gmd', mode: 'surah' },
  { id: 106, name: 'سعود بن إبراهيم الشريم', englishName: 'Saud Al-Shuraim', server: 'https://server7.mp3quran.net/shur', mode: 'surah' },
  { id: 108, name: 'سهل ياسين', englishName: 'Sahl Yassin', server: 'https://server6.mp3quran.net/shl', mode: 'surah' },
  { id: 112, name: 'شيخ أبو بكر الشاطري', englishName: 'Abu Bakr Al-Shatri', server: 'https://server11.mp3quran.net/shatri', mode: 'surah' },
  { id: 113, name: 'شيرزاد عبد الرحمن طاهر', englishName: 'Sherzad Abdul Rahman Taher', server: 'https://server12.mp3quran.net/taher', mode: 'surah' },
  { id: 114, name: 'صابر عبد الحكم', englishName: 'Sabir Abdul Hakam', server: 'https://server12.mp3quran.net/hkm', mode: 'surah' },
  { id: 116, name: 'صالح الصاهود', englishName: 'Saleh Al-Sahoud', server: 'https://server8.mp3quran.net/sahood', mode: 'surah' },
  { id: 117, name: 'صالح الهبدان', englishName: 'Saleh Al-Habdan', server: 'https://server6.mp3quran.net/habdan', mode: 'surah' },
  { id: 118, name: 'صلاح البدير', englishName: 'Salah Al-Budair', server: 'https://server6.mp3quran.net/s_bud', mode: 'surah' },
  { id: 120, name: 'صلاح الهاشم', englishName: 'Salah Al-Hashim', server: 'https://server12.mp3quran.net/salah_hashim_m', mode: 'surah' },
  { id: 121, name: 'صلاح بو خاطر', englishName: 'Salah Bukhatir', server: 'https://server8.mp3quran.net/bu_khtr', mode: 'surah' },
  { id: 125, name: 'عادل ريان', englishName: 'Adel Rayan', server: 'https://server8.mp3quran.net/ryan', mode: 'surah' },
  { id: 126, name: 'عبد الباري الثبيتي', englishName: 'Abdul Bari Al-Thubaiti', server: 'https://server6.mp3quran.net/thubti', mode: 'surah' },
  { id: 127, name: 'عبد البارئ محمد', englishName: 'Abdul Barie Muhammad', server: 'https://server12.mp3quran.net/bari', mode: 'surah' },
  { id: 129, name: 'عبد الباسط عبد الصمد', englishName: 'Abdul Basit Abdus-Samad', server: 'https://server7.mp3quran.net/basit', mode: 'surah' },
  { id: 131, name: 'عبد الباسط عبد الصمد — مجود', englishName: 'Abdul Basit — Mujawwad', server: 'https://server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad', mode: 'surah' },
  { id: 132, name: 'عبد الرحمن السديس', englishName: 'Abdul Rahman Al-Sudais', server: 'https://server11.mp3quran.net/sds', mode: 'surah' },
  { id: 133, name: 'عبد الرحمن العوسي', englishName: 'Abdul Rahman Al-Oosi', server: 'https://server6.mp3quran.net/aloosi', mode: 'surah' },
  { id: 134, name: 'عبد الرحمن الماجد', englishName: 'Abdul Rahman Al-Majed', server: 'https://server10.mp3quran.net/a_majed', mode: 'surah' },
  { id: 135, name: 'عبد الرشيد صوفي', englishName: 'Abdul Rashid Soufi', server: 'https://server16.mp3quran.net/soufi/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 138, name: 'عبد العزيز الأحمد', englishName: 'Abdul Aziz Al-Ahmed', server: 'https://server11.mp3quran.net/a_ahmed', mode: 'surah' },
  { id: 139, name: 'عبد العزيز الزهراني', englishName: 'Abdul Aziz Al-Zahrani', server: 'https://server9.mp3quran.net/zahrani', mode: 'surah' },
  { id: 142, name: 'عبد الله البعيجان', englishName: "Abdullah Al-Ba'ijan", server: 'https://server8.mp3quran.net/buajan', mode: 'surah' },
  { id: 143, name: 'عبد الله الخلف', englishName: 'Abdullah Al-Khalf', server: 'https://server14.mp3quran.net/khalf', mode: 'surah' },
  { id: 145, name: 'عبد الله المطرود', englishName: 'Abdullah Al-Matroud', server: 'https://server8.mp3quran.net/mtrod', mode: 'surah' },
  { id: 146, name: 'عبد الله الموسى', englishName: 'Abdullah Al-Mousa', server: 'https://server14.mp3quran.net/mousa/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 147, name: 'عبد الله بصفر', englishName: 'Abdullah Basfar', server: 'https://server6.mp3quran.net/bsfr', mode: 'surah' },
  { id: 148, name: 'عبد الله خياط', englishName: 'Abdullah Khayyat', server: 'https://server12.mp3quran.net/kyat', mode: 'surah' },
  { id: 149, name: 'عبد الله عواد الجهني', englishName: 'Abdullah Al-Juhany', server: 'https://server13.mp3quran.net/jhn', mode: 'surah' },
  { id: 153, name: 'عبد المحسن الحارثي', englishName: 'Abdul Mohsen Al-Harthi', server: 'https://server6.mp3quran.net/mohsin_harthi', mode: 'surah' },
  { id: 154, name: 'عبد المحسن العبيكان', englishName: 'Abdul Mohsen Al-Obaikan', server: 'https://server12.mp3quran.net/obk', mode: 'surah' },
  { id: 156, name: 'عبد المحسن القاسم', englishName: 'Abdul Mohsen Al-Qasim', server: 'https://server8.mp3quran.net/qasm', mode: 'surah' },
  { id: 157, name: 'عبد الهادي أحمد كناكري', englishName: 'Abdul Hadi Ahmed Kanakri', server: 'https://server6.mp3quran.net/kanakeri', mode: 'surah' },
  { id: 158, name: 'عبد الودود بن مقبول حنيف', englishName: 'Abdul Wadood Hanif', server: 'https://server8.mp3quran.net/wdod', mode: 'surah' },
  { id: 159, name: 'عبد الولي الأركاني', englishName: 'Abdul Wali Al-Arkani', server: 'https://server6.mp3quran.net/arkani', mode: 'surah' },
  { id: 163, name: 'علي بن عبد الرحمن الحذيفي', englishName: 'Ali Al-Hudhaify', server: 'https://server9.mp3quran.net/hthfi', mode: 'surah' },
  { id: 164, name: 'علي جابر', englishName: 'Ali Jaber', server: 'https://server11.mp3quran.net/a_jbr', mode: 'surah' },
  { id: 165, name: 'علي حجاج السويسي', englishName: 'Ali Hajjaj Al-Suwaisi', server: 'https://server9.mp3quran.net/hajjaj', mode: 'surah' },
  { id: 166, name: 'عماد بن زهير بن حافظ', englishName: 'Imad Al-Hafiz', server: 'https://server6.mp3quran.net/hafz', mode: 'surah' },
  { id: 169, name: 'فارس عباد', englishName: 'Fares Abbad', server: 'https://server8.mp3quran.net/frs_a', mode: 'surah' },
  { id: 174, name: 'ماجد الزامل', englishName: 'Majid Al-Zamil', server: 'https://server9.mp3quran.net/zaml', mode: 'surah' },
  { id: 180, name: 'محمد أيوب بن محمد يوسف', englishName: 'Muhammad Ayyub', server: 'https://server8.mp3quran.net/ayyub', mode: 'surah' },
  { id: 182, name: 'محمد البخيت', englishName: 'Muhammad Al-Bukheet', server: 'https://server14.mp3quran.net/bukheet', mode: 'surah' },
  { id: 185, name: 'محمد الطبلاوي', englishName: 'Muhammad Al-Tablawi', server: 'https://server12.mp3quran.net/tblawi', mode: 'surah' },
  { id: 191, name: 'محمد خليل القارئ', englishName: 'Muhammad Al-Qari', server: 'https://server8.mp3quran.net/m_qari', mode: 'surah' },
  { id: 193, name: 'محمد رشاد الشريف', englishName: 'Muhammad Rashad Al-Sharif', server: 'https://server10.mp3quran.net/rashad', mode: 'surah' },
  { id: 195, name: 'محمد صالح عالم شاه', englishName: 'Muhammad Alam Shah', server: 'https://server12.mp3quran.net/shah', mode: 'surah' },
  { id: 197, name: 'المنشاوي', englishName: 'Al-Minshawi', server: 'https://server10.mp3quran.net/minsh', mode: 'surah' },
  { id: 202, name: 'محمد عبد الكريم', englishName: 'Muhammad Abdul Karim', server: 'https://server12.mp3quran.net/m_krm', mode: 'surah' },
  { id: 207, name: 'الحصري — مجود', englishName: 'Al-Husary — Mujawwad', server: 'https://server13.mp3quran.net/husr/Almusshaf-Al-Mojawwad', mode: 'surah' },
  { id: 208, name: 'الحصري', englishName: 'Al-Husary', server: 'https://server13.mp3quran.net/husr', mode: 'surah' },
  { id: 209, name: 'محمود علي البنا — مجود', englishName: 'Mahmoud Ali Al-Banna — Mujawwad', server: 'https://server8.mp3quran.net/bna/Almusshaf-Al-Mojawwad', mode: 'surah' },
  { id: 212, name: 'مشاري راشد العفاسي', englishName: 'Mishary Rashid Alafasy', server: 'https://server8.mp3quran.net/afs', mode: 'surah' },
  { id: 223, name: 'منصور السالمي', englishName: 'Mansour Al-Salimi', server: 'https://server14.mp3quran.net/mansor', mode: 'surah' },
  { id: 227, name: 'ناصر القطامي', englishName: 'Nasser Al-Qatami', server: 'https://server6.mp3quran.net/qtm', mode: 'surah' },
  { id: 229, name: 'نبيل الرفاعي', englishName: 'Nabil Al-Rifai', server: 'https://server9.mp3quran.net/nabil', mode: 'surah' },
  { id: 230, name: 'نعمة الحسان', englishName: "Ni'mat Al-Hassan", server: 'https://server8.mp3quran.net/namh', mode: 'surah' },
  { id: 231, name: 'هاني الرفاعي', englishName: 'Hani Al-Rifai', server: 'https://server8.mp3quran.net/hani', mode: 'surah' },
  { id: 235, name: 'وديع اليمني', englishName: 'Wadee Al-Yamani', server: 'https://server6.mp3quran.net/wdee3', mode: 'surah' },
  { id: 239, name: 'ياسر الدوسري', englishName: 'Yasser Ad-Dussary', server: 'https://server11.mp3quran.net/yasser', mode: 'surah' },
  { id: 247, name: 'يوسف بن نوح أحمد', englishName: 'Yousuf bin Noah Ahmed', server: 'https://server8.mp3quran.net/noah', mode: 'surah' },
  { id: 291, name: 'ماهر المعيقلي — مجود', englishName: 'Maher Al Muaiqly — Mujawwad', server: 'https://server12.mp3quran.net/maher/Almusshaf-Al-Mojawwad', mode: 'surah' },
  { id: 295, name: 'مصطفى إسماعيل — مجود', englishName: 'Mustafa Ismail — Mujawwad', server: 'https://server8.mp3quran.net/mustafa/Almusshaf-Al-Mojawwad', mode: 'surah' },
  { id: 297, name: 'عبدالرحمن السويّد', englishName: 'Abdul Rahman Al-Suwaid', server: 'https://server16.mp3quran.net/a_swaiyd/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 299, name: 'أحمد طالب بن حميد', server: 'https://server16.mp3quran.net/a_binhameed/Rewayat-Hafs-A-n-Assem', englishName: 'Ahmed Talib bin Hamid', mode: 'surah' },
  { id: 301, name: 'إبراهيم الدوسري', englishName: 'Ibrahim Al-Dosari', server: 'https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 304, name: 'محمد برهجي', englishName: 'Muhammad Burhaji', server: 'https://server16.mp3quran.net/M_Burhaji/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 306, name: 'حسن الدغريري', englishName: 'Hassan Al-Daghriri', server: 'https://server16.mp3quran.net/H-Aldaghriri/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 315, name: 'أحمد خليل شاهين', englishName: 'Ahmed Khalil Shaheen', server: 'https://server16.mp3quran.net/shaheen/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 330, name: 'أحمد ديبان', englishName: 'Ahmed Deban', server: 'https://server16.mp3quran.net/deban/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 332, name: 'بيشه وا قادر الكردي', englishName: 'Peshawa Qadir Al-Kurdi', server: 'https://server16.mp3quran.net/peshawa/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 337, name: 'هيثم الدخين', englishName: 'Haitham Al-Dukhain', server: 'https://server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 342, name: 'أحمد عيسى المعصراوي', englishName: 'Ahmed Al-Maasaraawi', server: 'https://server16.mp3quran.net/a_maasaraawi/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 346, name: 'سيد أحمد هاشمي', englishName: 'Sayyid Ahmed Hashimi', server: 'https://server16.mp3quran.net/s_hashemi/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 347, name: 'خالد كريم محمدي', englishName: 'Khalid Karim Mohammadi', server: 'https://server16.mp3quran.net/kh_mohammadi/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 350, name: 'حسن صالح', englishName: 'Hassan Saleh', server: 'https://server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 352, name: 'عيسى عمر سناكو', englishName: 'Isa Omar Sananko', server: 'https://server16.mp3quran.net/i_sanankoua/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 356, name: 'صالح الشمراني', englishName: 'Saleh Al-Shamrani', server: 'https://server16.mp3quran.net/shamrani/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 358, name: 'أنس العمادي', englishName: 'Anas Al-Emadi', server: 'https://server16.mp3quran.net/a_alemadi/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
  { id: 366, name: 'عبدالعزيز التركي', englishName: 'Abdul Aziz Al-Turki', server: 'https://server16.mp3quran.net/a_turki/Rewayat-Hafs-A-n-Assem', mode: 'surah' },
];

function toReciter(r: RawReciter, group: string, groupEn: string): Reciter {
  return {
    id: String(r.id),
    numericId: r.id,
    name: r.name,
    englishName: r.englishName,
    server: r.server,
    mode: r.mode,
    group,
    groupEn,
  };
}

export const VERSE_RECITERS: Reciter[] = RAW_VERSE_RECITERS.map((r) => toReciter(r, VERSE_GROUP, VERSE_GROUP_EN));
export const SURAH_RECITERS: Reciter[] = RAW_SURAH_RECITERS.map((r) => toReciter(r, SURAH_GROUP, SURAH_GROUP_EN));

/** All reciters, verse group first then surah group, preserving catalog order. */
export const RECITERS: Reciter[] = [...VERSE_RECITERS, ...SURAH_RECITERS];

/** Reciter groups for UI rendering, preserving order. */
export const RECITER_GROUPS: { label: string; labelEn: string; reciters: Reciter[] }[] = [
  { label: VERSE_GROUP, labelEn: VERSE_GROUP_EN, reciters: VERSE_RECITERS },
  { label: SURAH_GROUP, labelEn: SURAH_GROUP_EN, reciters: SURAH_RECITERS },
];

/** Default reciter: Maher Al Muaiqly (verse mode, reliable mp3quran server). */
export const DEFAULT_RECITER_ID = '28';

/**
 * Map legacy alquran.cloud / EveryAyah identifiers to new numeric ids so that
 * previously saved selections keep working.
 */
const LEGACY_RECITER_MAP: Record<string, string> = {
  // alquran.cloud style
  'ar.alafasy': '255',
  'ar.abdurrahmaansudais': '132',
  'ar.abdullahbasfar': '253',
  'ar.ahmedajamy': '48',
  'ar.hanirifai': '231',
  'ar.hudhaify': '254',
  'ar.husary': '208',
  'ar.husarymujawwad': '207',
  'ar.ibrahimakhbar': '251',
  'ar.mahermuaiqly': '28',
  'ar.minshawi': '197',
  'ar.muhammadayyoub': '249',
  'ar.muhammadjibreel': '31',
  'ar.saoodshuraym': '106',
  'ar.shaatree': '112',
  // EveryAyah subfolder style (best-effort)
  'Alafasy_128kbps': '255',
  'MaherAlMuaiqly128kbps': '28',
  'Abdullah_Basfar_192kbps': '253',
  'Hudhaify_128kbps': '254',
  'Husary_128kbps': '208',
  'Husary_128kbps_Mujawwad': '207',
  'Husary_Muallim_128kbps': '41',
  'Ibrahim_Akhdar_64kbps': '251',
  'Muhammad_Jibreel_128kbps': '31',
  'Muhammad_Ayyoub_128kbps': '249',
  'Saood_ash-Shuraym_128kbps': '106',
  'Abu_Bakr_Ash-Shaatree_128kbps': '112',
  'ahmed_ibn_ali_al_ajamy_128kbps': '48',
  'Hani_Rifai_192kbps': '231',
  'Minshawy_Murattal_128kbps': '197',
  'Minshawy_Mujawwad_192kbps': '33',
  'Yasser_Ad-Dussary_128kbps': '239',
  'Nasser_Alqatami_128kbps': '227',
  'Ali_Hajjaj_AlSuesy_128kbps': '165',
  'Sahl_Yassin_128kbps': '108',
  'Yaser_Salamah_128kbps': '39',
  'Akram_AlAlaqimy_128kbps': '55',
  'Ali_Jaber_64kbps': '164',
  'Fares_Abbad_64kbps': '169',
  'Ayman_Sowaid_64kbps': '28',
  'Mishary Alafasy': '255',
  'Ayman Sowaid': '28',
};

export function resolveReciterId(reciterId: string): string {
  if (!reciterId) return DEFAULT_RECITER_ID;
  if (LEGACY_RECITER_MAP[reciterId]) return LEGACY_RECITER_MAP[reciterId];
  if (RECITERS.some((r) => r.id === reciterId)) return reciterId;
  return DEFAULT_RECITER_ID;
}

export function getReciterById(reciterId: string): Reciter {
  const resolved = resolveReciterId(reciterId);
  return RECITERS.find((r) => r.id === resolved) ?? RECITERS.find((r) => r.id === DEFAULT_RECITER_ID)!;
}

/** Ensure a server URL ends with exactly one trailing slash. */
function withTrailingSlash(server: string): string {
  return server.endsWith('/') ? server : `${server}/`;
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

/**
 * Build a per-ayah audio URL for a verse-mode reciter.
 * Filename is SSSAAA where SSS = surah (3 digits), AAA = ayah (3 digits).
 */
export function getVerseAyahAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  reciterId: string = DEFAULT_RECITER_ID
): string {
  const reciter = getReciterById(reciterId);
  const file = `${pad3(surahNumber)}${pad3(ayahNumber)}.mp3`;
  return `${withTrailingSlash(reciter.server)}${file}`;
}

/**
 * Build a full-surah audio URL for a surah-mode reciter.
 * Filename is SSS (3-digit surah number).
 */
export function getSurahAudioUrl(
  surahNumber: number,
  reciterId: string = DEFAULT_RECITER_ID
): string {
  const reciter = getReciterById(reciterId);
  return `${withTrailingSlash(reciter.server)}${pad3(surahNumber)}.mp3`;
}

// ─── Timings (quranpedia.net) ───────────────────────────────────────────────

const timingsCache = new Map<string, AyahTiming[]>();
const timingsInflight = new Map<string, Promise<AyahTiming[]>>();

const QURANPEDIA_TIMINGS_BASE = 'https://quranpedia.net/api/recitation';

/**
 * Fetch per-ayah timing segments for a surah-mode recitation.
 * Results are cached in-memory for the session and de-duplicated in-flight.
 */
export async function getAyahTimings(
  numericId: number,
  surah: number
): Promise<AyahTiming[]> {
  const key = `${numericId}:${surah}`;
  const cached = timingsCache.get(key);
  if (cached) return cached;

  let promise = timingsInflight.get(key);
  if (!promise) {
    promise = (async () => {
      const res = await fetch(`${QURANPEDIA_TIMINGS_BASE}/${numericId}/timings/${surah}`);
      if (!res.ok) {
        throw new Error(`Timings fetch failed (${res.status}) for recitation ${numericId} surah ${surah}`);
      }
      const data = (await res.json()) as AyahTiming[];
      const normalized = Array.isArray(data) ? data : [];
      timingsCache.set(key, normalized);
      return normalized;
    })();
    timingsInflight.set(key, promise);
    promise.finally(() => timingsInflight.delete(key));
  }
  return promise;
}

/**
 * Resolve everything needed to play a single ayah for the given reciter.
 * For verse-mode reciters this is a direct per-ayah file (segment = whole file).
 * For surah-mode reciters this is the full-surah file plus the ayah's segment.
 */
export async function getAyahAudioPlan(
  reciterId: string,
  surah: number,
  ayah: number
): Promise<AudioPlan> {
  const reciter = getReciterById(reciterId);

  if (reciter.mode === 'verse') {
    return {
      url: getVerseAyahAudioUrl(surah, ayah, reciterId),
      mode: 'verse',
      segmentStart: 0,
      segmentEnd: 0, // unknown until metadata loads; AudioPlayer treats 0 as "whole file"
    };
  }

  const url = getSurahAudioUrl(surah, reciterId);
  try {
    const timings = await getAyahTimings(reciter.numericId, surah);
    const t = timings.find((x) => x.ayah_number === ayah);
    if (t) {
      return {
        url,
        mode: 'surah',
        segmentStart: t.start_time / 1000,
        segmentEnd: t.end_time / 1000,
      };
    }
  } catch (err) {
    console.error('Failed to load ayah timings, falling back to full-surah playback:', err);
  }

  // Fallback: play the whole surah file from the start.
  return { url, mode: 'surah', segmentStart: 0, segmentEnd: 0 };
}

/**
 * Legacy alias kept for backward compatibility with older callers that expect an
 * EveryAyah-style per-ayah URL. Only meaningful for verse-mode reciters; for
 * surah-mode reciters it returns the full-surah URL (callers should prefer
 * `getAyahAudioPlan` for segment-aware playback).
 */
export function getEveryAyahAudioUrl(
  surahNumber: number,
  ayahNumber: number,
  reciterId: string = DEFAULT_RECITER_ID
): string {
  const reciter = getReciterById(reciterId);
  if (reciter.mode === 'verse') {
    return getVerseAyahAudioUrl(surahNumber, ayahNumber, reciterId);
  }
  return getSurahAudioUrl(surahNumber, reciterId);
}
