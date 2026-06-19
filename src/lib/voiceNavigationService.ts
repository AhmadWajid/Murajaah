import { SURAH_NAMES } from './quran';

export interface VoiceNavigationResult {
  surahNumber: number | null;
  ayahNumber: number | null;
  confidence: number;
  recognizedText: string;
  error?: string;
}

// Comprehensive surah name mappings for voice recognition
const SURAH_NAME_MAPPINGS: Record<string, number> = {
  // Arabic names and phonetic variations
  'فاتحة': 1,
  'الفاتحة': 1,
  'فاتحه': 1,
  'فتحة': 1,
  'فتحه': 1,
  
  // English names (primary)
  'fatiha': 1,
  'al-fatiha': 1,
  'al fatiha': 1,
  'the opening': 1,
  'opening': 1,
  'fatihah': 1,
  'fateha': 1,
  'faatiha': 1,
  
  'baqarah': 2,
  'al-baqarah': 2,
  'al baqarah': 2,
  'the cow': 2,
  'cow': 2,
  'bakara': 2,
  
  'aal-imran': 3,
  'aal imran': 3,
  'al-imran': 3,
  'al imran': 3,
  'imran': 3,
  'family of imran': 3,
  'the family of imran': 3,
  
  'nisa': 4,
  'an-nisa': 4,
  'an nisa': 4,
  'women': 4,
  'the women': 4,
  'nisaa': 4,
  
  'maidah': 5,
  'al-maidah': 5,
  'al maidah': 5,
  'table spread': 5,
  'the table spread': 5,
  'maida': 5,
  
  'anam': 6,
  'al-anam': 6,
  'al anam': 6,
  'cattle': 6,
  'the cattle': 6,
  'an\'am': 6,
  
  'araf': 7,
  'al-araf': 7,
  'al araf': 7,
  'heights': 7,
  'the heights': 7,
  'a\'raf': 7,
  
  'anfal': 8,
  'al-anfal': 8,
  'al anfal': 8,
  'spoils of war': 8,
  'the spoils of war': 8,
  
  'tawbah': 9,
  'at-tawbah': 9,
  'at tawbah': 9,
  'repentance': 9,
  'the repentance': 9,
  'taubah': 9,
  
  'yunus': 10,
  'jonah': 10,
  
  'hud': 11,
  
  'yusuf': 12,
  'joseph': 12,
  'yousuf': 12,
  
  'raad': 13,
  'ar-raad': 13,
  'ar raad': 13,
  'thunder': 13,
  'the thunder': 13,
  'ra\'d': 13,
  
  'ibrahim': 14,
  'abraham': 14,
  
  'hijr': 15,
  'al-hijr': 15,
  'al hijr': 15,
  'rocky tract': 15,
  'the rocky tract': 15,
  
  'nahl': 16,
  'an-nahl': 16,
  'an nahl': 16,
  'bee': 16,
  'the bee': 16,
  
  'isra': 17,
  'al-isra': 17,
  'al isra': 17,
  'night journey': 17,
  'the night journey': 17,
  'israa': 17,
  
  'kahf': 18,
  'al-kahf': 18,
  'al kahf': 18,
  'cave': 18,
  'the cave': 18,
  
  'maryam': 19,
  'mary': 19,
  'mariam': 19,
  
  'ta-ha': 20,
  'ta ha': 20,
  'taha': 20,
  
  'anbya': 21,
  'al-anbya': 21,
  'al anbya': 21,
  'prophets': 21,
  'the prophets': 21,
  'anbiya': 21,
  
  'hajj': 22,
  'al-hajj': 22,
  'al hajj': 22,
  'pilgrimage': 22,
  'the pilgrimage': 22,
  
  'muminun': 23,
  'al-muminun': 23,
  'al muminun': 23,
  'believers': 23,
  'the believers': 23,
  'mu\'minun': 23,
  
  'nur': 24,
  'an-nur': 24,
  'an nur': 24,
  'light': 24,
  'the light': 24,
  
  'furqan': 25,
  'al-furqan': 25,
  'al furqan': 25,
  'criterion': 25,
  'the criterion': 25,
  
  'shuara': 26,
  'ash-shuara': 26,
  'ash shuara': 26,
  'poets': 26,
  'the poets': 26,
  'shu\'ara': 26,
  
  'naml': 27,
  'an-naml': 27,
  'an naml': 27,
  'ant': 27,
  'the ant': 27,
  
  'qasas': 28,
  'al-qasas': 28,
  'al qasas': 28,
  'stories': 28,
  'the stories': 28,
  
  'ankabut': 29,
  'al-ankabut': 29,
  'al ankabut': 29,
  'spider': 29,
  'the spider': 29,
  
  'rum': 30,
  'ar-rum': 30,
  'ar rum': 30,
  'romans': 30,
  'the romans': 30,
  
  'luqman': 31,
  'lukman': 31,
  
  'sajdah': 32,
  'as-sajdah': 32,
  'as sajdah': 32,
  'prostration': 32,
  'the prostration': 32,
  
  'ahzab': 33,
  'al-ahzab': 33,
  'al ahzab': 33,
  'combined forces': 33,
  'the combined forces': 33,
  
  'saba': 34,
  'sheba': 34,
  
  'fatir': 35,
  'originator': 35,
  
  'ya-sin': 36,
  'ya sin': 36,
  'yasin': 36,
  'يس': 36,
  'ياسين': 36,
  'yaseen': 36,
  'yassine': 36,
  'ya seen': 36,
  
  'saffat': 37,
  'as-saffat': 37,
  'as saffat': 37,
  'those who set the ranks': 37,
  
  'sad': 38,
  
  'zumar': 39,
  'az-zumar': 39,
  'az zumar': 39,
  'troops': 39,
  'the troops': 39,
  
  'ghafir': 40,
  'forgiver': 40,
  'the forgiver': 40,
  'ghaafir': 40,
  
  'fussilat': 41,
  'explained in detail': 41,
  
  'shuraa': 42,
  'ash-shuraa': 42,
  'ash shuraa': 42,
  'consultation': 42,
  'the consultation': 42,
  'shura': 42,
  
  'zukhruf': 43,
  'az-zukhruf': 43,
  'az zukhruf': 43,
  'ornaments of gold': 43,
  'the ornaments of gold': 43,
  
  'dukhan': 44,
  'ad-dukhan': 44,
  'ad dukhan': 44,
  'smoke': 44,
  'the smoke': 44,
  
  'jathiyah': 45,
  'al-jathiyah': 45,
  'al jathiyah': 45,
  'kneeling': 45,
  'the kneeling': 45,
  'jaathiyah': 45,
  
  'ahqaf': 46,
  'al-ahqaf': 46,
  'al ahqaf': 46,
  'wind-curved sandhills': 46,
  'the wind-curved sandhills': 46,
  
  'muhammad': 47,
  'mohammed': 47,
  
  'fath': 48,
  'al-fath': 48,
  'al fath': 48,
  'victory': 48,
  'the victory': 48,
  
  'hujurat': 49,
  'al-hujurat': 49,
  'al hujurat': 49,
  'private apartments': 49,
  'the private apartments': 49,
  
  'qaf': 50,
  
  'dhariyat': 51,
  'adh-dhariyat': 51,
  'adh dhariyat': 51,
  'winnowing winds': 51,
  'the winnowing winds': 51,
  
  'tur': 52,
  'at-tur': 52,
  'at tur': 52,
  'mount': 52,
  'the mount': 52,
  
  'najm': 53,
  'an-najm': 53,
  'an najm': 53,
  'star': 53,
  'the star': 53,
  
  'qamar': 54,
  'al-qamar': 54,
  'al qamar': 54,
  'moon': 54,
  'the moon': 54,
  
  'rahman': 55,
  'ar-rahman': 55,
  'ar rahman': 55,
  'beneficent': 55,
  'the beneficent': 55,
  'rahmaan': 55,
  'الرحمن': 55,
  'رحمن': 55,
  'rahaman': 55,
  'rehman': 55,
  
  'waqiah': 56,
  'al-waqiah': 56,
  'al waqiah': 56,
  'inevitable': 56,
  'the inevitable': 56,
  'waaqiah': 56,
  
  'hadid': 57,
  'al-hadid': 57,
  'al hadid': 57,
  'iron': 57,
  'the iron': 57,
  
  'mujadila': 58,
  'al-mujadila': 58,
  'al mujadila': 58,
  'pleading woman': 58,
  'the pleading woman': 58,
  'mujaadila': 58,
  
  'hashr': 59,
  'al-hashr': 59,
  'al hashr': 59,
  'exile': 59,
  'the exile': 59,
  
  'mumtahanah': 60,
  'al-mumtahanah': 60,
  'al mumtahanah': 60,
  'woman to be examined': 60,
  'the woman to be examined': 60,
  'mumtahana': 60,
  
  'saf': 61,
  'as-saf': 61,
  'as saf': 61,
  'ranks': 61,
  'the ranks': 61,
  'saff': 61,
  
  'jumuah': 62,
  'al-jumuah': 62,
  'al jumuah': 62,
  'congregation': 62,
  'friday': 62,
  'the congregation': 62,
  'jumu\'ah': 62,
  
  'munafiqun': 63,
  'al-munafiqun': 63,
  'al munafiqun': 63,
  'hypocrites': 63,
  'the hypocrites': 63,
  'munaafiqun': 63,
  
  'taghabun': 64,
  'at-taghabun': 64,
  'at taghabun': 64,
  'mutual disillusion': 64,
  'the mutual disillusion': 64,
  
  'talaq': 65,
  'at-talaq': 65,
  'at talaq': 65,
  'divorce': 65,
  'talaaq': 65,
  
  'tahrim': 66,
  'at-tahrim': 66,
  'at tahrim': 66,
  'prohibition': 66,
  'the prohibition': 66,
  'tahreem': 66,
  
  'mulk': 67,
  'al-mulk': 67,
  'al mulk': 67,
  'sovereignty': 67,
  'the sovereignty': 67,
  
  'qalam': 68,
  'al-qalam': 68,
  'al qalam': 68,
  'pen': 68,
  'the pen': 68,
  
  'haqqah': 69,
  'al-haqqah': 69,
  'al haqqah': 69,
  'reality': 69,
  'the reality': 69,
  'haaqqah': 69,
  
  'maarij': 70,
  'al-maarij': 70,
  'al maarij': 70,
  'ascending stairways': 70,
  'the ascending stairways': 70,
  'ma\'arij': 70,
  
  'nuh': 71,
  'noah': 71,
  'nooh': 71,
  
  'jinn': 72,
  'al-jinn': 72,
  'al jinn': 72,
  'the jinn': 72,
  
  'muzzammil': 73,
  'al-muzzammil': 73,
  'al muzzammil': 73,
  'enshrouded one': 73,
  'the enshrouded one': 73,
  
  'muddathir': 74,
  'al-muddathir': 74,
  'al muddathir': 74,
  'cloaked one': 74,
  'the cloaked one': 74,
  'muddaththir': 74,
  
  'qiyamah': 75,
  'al-qiyamah': 75,
  'al qiyamah': 75,
  'resurrection': 75,
  'the resurrection': 75,
  'qiyaamah': 75,
  
  'insan': 76,
  'al-insan': 76,
  'al insan': 76,
  'man': 76,
  'insaan': 76,
  
  'mursalat': 77,
  'al-mursalat': 77,
  'al mursalat': 77,
  'emissaries': 77,
  'the emissaries': 77,
  
  'naba': 78,
  'an-naba': 78,
  'an naba': 78,
  'tidings': 78,
  'the tidings': 78,
  'nabaa': 78,
  
  'naziat': 79,
  'an-naziat': 79,
  'an naziat': 79,
  'those who drag forth': 79,
  'naazi\'at': 79,
  
  'abasa': 80,
  'he frowned': 80,
  
  'takwir': 81,
  'at-takwir': 81,
  'at takwir': 81,
  'overthrowing': 81,
  'the overthrowing': 81,
  
  'infitar': 82,
  'al-infitar': 82,
  'al infitar': 82,
  'cleaving': 82,
  'the cleaving': 82,
  'infitaar': 82,
  
  'mutaffifin': 83,
  'al-mutaffifin': 83,
  'al mutaffifin': 83,
  'defrauding': 83,
  'the defrauding': 83,
  'mutaffifeen': 83,
  
  'inshiqaq': 84,
  'al-inshiqaq': 84,
  'al inshiqaq': 84,
  'splitting open': 84,
  'the splitting open': 84,
  'inshiqaaq': 84,
  
  'buruj': 85,
  'al-buruj': 85,
  'al buruj': 85,
  'mansions of the stars': 85,
  'the mansions of the stars': 85,
  'burooj': 85,
  
  'tariq': 86,
  'at-tariq': 86,
  'at tariq': 86,
  'morning star': 86,
  'the morning star': 86,
  'taariq': 86,
  
  'ala': 87,
  'al-ala': 87,
  'al ala': 87,
  'most high': 87,
  'the most high': 87,
  'a\'la': 87,
  
  'ghashiyah': 88,
  'al-ghashiyah': 88,
  'al ghashiyah': 88,
  'overwhelming': 88,
  'the overwhelming': 88,
  'ghaashiyah': 88,
  
  'fajr': 89,
  'al-fajr': 89,
  'al fajr': 89,
  'dawn': 89,
  'the dawn': 89,
  
  'balad': 90,
  'al-balad': 90,
  'al balad': 90,
  'city': 90,
  'the city': 90,
  
  'shams': 91,
  'ash-shams': 91,
  'ash shams': 91,
  'sun': 91,
  'the sun': 91,
  
  'layl': 92,
  'al-layl': 92,
  'al layl': 92,
  'night': 92,
  'the night': 92,
  'lail': 92,
  
  'duha': 93,
  'ad-duha': 93,
  'ad duha': 93,
  'morning hours': 93,
  'the morning hours': 93,
  'duhaa': 93,
  
  'sharh': 94,
  'ash-sharh': 94,
  'ash sharh': 94,
  'relief': 94,
  'the relief': 94,
  'inshirah': 94,
  
  'tin': 95,
  'at-tin': 95,
  'at tin': 95,
  'fig': 95,
  'the fig': 95,
  'teen': 95,
  
  'alaq': 96,
  'al-alaq': 96,
  'al alaq': 96,
  'clot': 96,
  'the clot': 96,
  'iqra': 96,
  
  'qadr': 97,
  'al-qadr': 97,
  'al qadr': 97,
  'power': 97,
  'the power': 97,
  'lailat al-qadr': 97,
  'night of power': 97,
  
  'bayyinah': 98,
  'al-bayyinah': 98,
  'al bayyinah': 98,
  'clear proof': 98,
  'the clear proof': 98,
  'bayyina': 98,
  
  'zalzalah': 99,
  'az-zalzalah': 99,
  'az zalzalah': 99,
  'earthquake': 99,
  'the earthquake': 99,
  'zilzaal': 99,
  
  'adiyat': 100,
  'al-adiyat': 100,
  'al adiyat': 100,
  'coursers': 100,
  'the coursers': 100,
  'aadiyaat': 100,
  
  'qariah': 101,
  'al-qariah': 101,
  'al qariah': 101,
  'calamity': 101,
  'the calamity': 101,
  'qaari\'ah': 101,
  
  'takathur': 102,
  'at-takathur': 102,
  'at takathur': 102,
  'rivalry in world increase': 102,
  'the rivalry in world increase': 102,
  'takaathur': 102,
  
  'asr': 103,
  'al-asr': 103,
  'al asr': 103,
  'declining day': 103,
  'the declining day': 103,
  'time': 103,
  
  'humazah': 104,
  'al-humazah': 104,
  'al humazah': 104,
  'traducer': 104,
  'the traducer': 104,
  'humaza': 104,
  
  'fil': 105,
  'al-fil': 105,
  'al fil': 105,
  'elephant': 105,
  'the elephant': 105,
  'feel': 105,
  
  'quraish': 106,
  'quraysh': 106,
  'qureysh': 106,
  
  'maun': 107,
  'al-maun': 107,
  'al maun': 107,
  'small kindnesses': 107,
  'the small kindnesses': 107,
  'maa\'un': 107,
  
  'kawthar': 108,
  'al-kawthar': 108,
  'al kawthar': 108,
  'abundance': 108,
  'the abundance': 108,
  'kauthar': 108,
  'kausar': 108,
  
  'kafirun': 109,
  'al-kafirun': 109,
  'al kafirun': 109,
  'disbelievers': 109,
  'the disbelievers': 109,
  'kafiroon': 109,
  
  'nasr': 110,
  'an-nasr': 110,
  'an nasr': 110,
  'divine support': 110,
  'the divine support': 110,
  'help': 110,
  'victory': 110,
  
  'masad': 111,
  'al-masad': 111,
  'al masad': 111,
  'palm fiber': 111,
  'the palm fiber': 111,
  'lahab': 111,
  'abu lahab': 111,
  
  'ikhlas': 112,
  'al-ikhlas': 112,
  'al ikhlas': 112,
  'sincerity': 112,
  'the sincerity': 112,
  'ikhlاs': 112,
  'purity': 112,
  'الإخلاص': 112,
  'إخلاص': 112,
  'ikhlaas': 112,
  'akhlas': 112,
  'ekhlas': 112,
  
  // Al-Falaq with phonetic variations (this is the one that was being heard as "Philip")
  'falaq': 113,
  'al-falaq': 113,
  'al falaq': 113,
  'daybreak': 113,
  'the daybreak': 113,
  'dawn': 113,
  'فلق': 113,
  'الفلق': 113,
  'falak': 113,
  'felaq': 113,
  'felipe': 113, // Common misheard version
  'philip': 113, // Common misheard version
  'fillip': 113, // Common misheard version
  
  'nas': 114,
  'an-nas': 114,
  'an nas': 114,
  'mankind': 114,
  'people': 114,
  'men': 114,
  'naas': 114,
};

// Common variations and alternative pronunciations
const ALTERNATIVE_MAPPINGS: Record<string, string[]> = {
  'go to': ['navigate to', 'take me to', 'show me', 'open', 'jump to'],
  'surah': ['sura', 'chapter', 'soorah'],
  'ayah': ['verse', 'aya', 'ayat'],
  'number': ['no', 'num', '#'],
};

export class VoiceNavigationService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    // Set to Arabic first, with English as fallback
    this.recognition.lang = 'ar-SA';
    this.recognition.maxAlternatives = 10; // More alternatives for better matching
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public async startListening(): Promise<VoiceNavigationResult> {
    return new Promise(async (resolve) => {
      if (!this.recognition) {
        resolve({
          surahNumber: null,
          ayahNumber: null,
          confidence: 0,
          recognizedText: '',
          error: 'Speech recognition not supported'
        });
        return;
      }

      // Try Arabic first, then English if needed
      const languages = ['ar-SA', 'ar-EG', 'en-US', 'en-GB'];
      let currentLanguageIndex = 0;

      const tryWithLanguage = (lang: string) => {
        this.recognition!.lang = lang;
        this.isListening = true;

        this.recognition!.onresult = (event) => {
          this.isListening = false;
          
          // Get all alternatives from all results
          const allResults: Array<{transcript: string, confidence: number}> = [];
          
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            for (let j = 0; j < result.length; j++) {
              allResults.push({
                transcript: result[j].transcript.toLowerCase().trim(),
                confidence: result[j].confidence
              });
            }
          }

          // Sort by confidence
          allResults.sort((a, b) => b.confidence - a.confidence);

          // Try to parse each result until we find a match
          let bestMatch: VoiceNavigationResult | null = null;
          let bestTranscript = '';

          for (const result of allResults) {
            const navigationResult = this.parseVoiceCommand(result.transcript);
            if (navigationResult.surahNumber !== null) {
              bestMatch = {
                ...navigationResult,
                confidence: result.confidence,
                recognizedText: result.transcript
              };
              break;
            }
            if (!bestTranscript) bestTranscript = result.transcript;
          }

          if (bestMatch) {
            resolve(bestMatch);
          } else {
            // If no match found and we have more languages to try
            if (currentLanguageIndex < languages.length - 1) {
              currentLanguageIndex++;
              setTimeout(() => tryWithLanguage(languages[currentLanguageIndex]), 100);
            } else {
              // No match found in any language
              resolve({
                surahNumber: null,
                ayahNumber: null,
                confidence: allResults[0]?.confidence || 0,
                recognizedText: bestTranscript,
                error: 'Could not identify surah from voice command'
              });
            }
          }
        };

        this.recognition!.onerror = (event) => {
          this.isListening = false;
          
          // If it's a language error and we have more languages to try
          if (event.error === 'language-not-supported' && currentLanguageIndex < languages.length - 1) {
            currentLanguageIndex++;
            setTimeout(() => tryWithLanguage(languages[currentLanguageIndex]), 100);
          } else {
            resolve({
              surahNumber: null,
              ayahNumber: null,
              confidence: 0,
              recognizedText: '',
              error: `Speech recognition error: ${event.error}`
            });
          }
        };

        this.recognition!.onend = () => {
          this.isListening = false;
        };

        try {
          this.recognition!.start();
        } catch (error) {
          this.isListening = false;
          resolve({
            surahNumber: null,
            ayahNumber: null,
            confidence: 0,
            recognizedText: '',
            error: 'Failed to start speech recognition'
          });
        }
      };

      // Start with the first language (Arabic)
      tryWithLanguage(languages[0]);
    });
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  private parseVoiceCommand(transcript: string): Omit<VoiceNavigationResult, 'confidence' | 'recognizedText'> {
    const normalizedText = this.normalizeText(transcript);
    
    // Try to extract surah and ayah information
    const surahMatch = this.extractSurahNumber(normalizedText);
    const ayahMatch = this.extractAyahNumber(normalizedText);

    return {
      surahNumber: surahMatch,
      ayahNumber: ayahMatch,
      error: surahMatch === null ? 'Could not identify surah from voice command' : undefined
    };
  }

  private normalizeText(text: string): string {
    let normalized = text.toLowerCase().trim();
    
    // Remove common filler words and commands
    normalized = normalized.replace(/^(go to|navigate to|take me to|show me|open|jump to)\s+/i, '');
    normalized = normalized.replace(/\b(surah|sura|chapter|soorah)\s+/gi, '');
    normalized = normalized.replace(/\b(ayah|verse|aya|ayat)\s+/gi, '');
    normalized = normalized.replace(/\b(number|no|num|#)\s+/gi, '');
    
    // Clean up extra spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  }

  private extractSurahNumber(text: string): number | null {
    // First, try to find exact matches in our mapping
    for (const [key, surahNumber] of Object.entries(SURAH_NAME_MAPPINGS)) {
      if (text.includes(key)) {
        return surahNumber;
      }
    }

    // Try to find numerical references (1-114)
    const numberMatch = text.match(/\b(\d{1,3})\b/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1], 10);
      if (num >= 1 && num <= 114) {
        return num;
      }
    }

    // Try fuzzy matching for similar sounding names
    return this.findBestMatch(text);
  }

  private extractAyahNumber(text: string): number | null {
    // Look for patterns like "verse 5", "ayah 10", etc.
    const ayahPatterns = [
      /\b(?:verse|ayah|aya|ayat)\s+(\d+)\b/i,
      /\b(\d+)(?:st|nd|rd|th)?\s+(?:verse|ayah|aya|ayat)\b/i,
      /\b(\d+)\b(?=\s*$)/, // Number at the end
    ];

    for (const pattern of ayahPatterns) {
      const match = text.match(pattern);
      if (match) {
        const ayahNumber = parseInt(match[1], 10);
        if (ayahNumber > 0 && ayahNumber <= 286) { // Max ayahs in any surah
          return ayahNumber;
        }
      }
    }

    return null;
  }

  private findBestMatch(text: string): number | null {
    let bestMatch: { surahNumber: number; score: number } | null = null;

    for (const [key, surahNumber] of Object.entries(SURAH_NAME_MAPPINGS)) {
      const score = this.calculateSimilarity(text, key);
      if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { surahNumber, score };
      }
    }

    return bestMatch?.surahNumber || null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Helper method to get surah info for display
  public getSurahInfo(surahNumber: number) {
    return SURAH_NAMES[surahNumber] || null;
  }

  // Method to get all possible voice commands for help
  public getVoiceCommandExamples(): string[] {
    return [
      // Arabic pronunciation examples
      "الفاتحة", // Al-Fatiha
      "سورة الفاتحة", // Surah Al-Fatiha  
      "يس", // Yasin
      "الإخلاص", // Al-Ikhlas
      "الفلق", // Al-Falaq
      "الرحمن", // Ar-Rahman
      
      // English examples
      "Go to Surah Al-Fatiha",
      "Take me to Surah Baqarah verse 255",
      "Navigate to Surah Yasin",
      "Show me Surah 18", // Al-Kahf
      "Open Surah Rahman",
      "Jump to Surah Ikhlas",
      "Go to chapter 2 verse 10",
      "Surah Mulk ayah 15",
      
      // Phonetic examples (common pronunciations)
      "Fatiha",
      "Yaseen", 
      "Rahman",
      "Ikhlaas",
      "Falaq"
    ];
  }
}

// Global instance
let voiceNavigationService: VoiceNavigationService | null = null;

export function getVoiceNavigationService(): VoiceNavigationService {
  if (!voiceNavigationService) {
    voiceNavigationService = new VoiceNavigationService();
  }
  return voiceNavigationService;
}

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly confidence: number;
  readonly transcript: string;
}

interface SpeechGrammarList {
  readonly length: number;
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}
