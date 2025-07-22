# 📖 Murajaah – AI-Powered Quran Memorization Tool

A personalized Quran memorization assistant that helps users track, review, and retain their memorization using spaced repetition and feedback-based learning. Built with Next.js, Tailwind CSS, and AI-enhanced tips.

## 🌟 Features

- ✅ **Add and store memorized Quran ranges** (e.g. Surah 2:255–257)
- ✅ **Daily review prompts** using spaced repetition (SM2 algorithm)
- ✅ **Rate your recall** (Easy, Medium, Hard) to personalize revision intervals
- ✅ **Auto-adjust revision schedules** based on performance
- ✅ **Highlight ayahs with audio** + word-by-word timing
- ✅ **View translations, tajweed, and AI-assisted tips**
- 🧠 **GPT-powered review suggestions** (optional)
- 📈 **View memorization history and upcoming reviews**
- 🎨 **Beautiful, responsive UI** with dark mode support
- 📱 **Mobile-friendly design**

## 📦 Tech Stack

| Area       | Tech               |
|------------|--------------------|
| Frontend   | Next.js 15, React 19, TypeScript |
| Styling    | Tailwind CSS 4 |
| Data       | Quranic Universal Library (QUL) JSON/API |
| Storage    | localStorage (browser-based) |
| Audio      | HTML5 `<audio>`, QUL audio segments |
| Scheduler  | Custom spaced repetition (SM2-lite) |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/murajaah
cd murajaah

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🧱 Project Structure

```
murajaah/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata
│   │   ├── page.tsx            # Main application page
│   │   └── globals.css         # Global styles and Tailwind
│   ├── components/
│   │   ├── QuranSelector.tsx   # Add new memorization ranges
│   │   ├── MemorizationList.tsx # Display and manage items
│   │   └── ReviewCard.tsx      # Review interface with audio
│   └── lib/
│       ├── spacedRepetition.ts # Core SRS algorithm
│       ├── quran.ts            # Quran data utilities
│       └── storage.ts          # localStorage management
├── public/
│   └── audio/                  # Ayah audio files (from QUL)
├── README.md
└── package.json
```

## 🔁 Spaced Repetition Algorithm (SM2-lite)

The app uses a modified SuperMemo 2 algorithm to optimize review intervals:

```typescript
export function updateInterval(oldInterval: number, rating: 'easy' | 'medium' | 'hard') {
  const multiplier = {
    easy: 2.5,    // Increase interval significantly
    medium: 1.5,  // Moderate increase
    hard: 1.0,    // Keep same interval
  }[rating];

  const newInterval = Math.max(1, Math.round(oldInterval * multiplier));
  return newInterval;
}
```

### How it works:

1. **Easy**: Interval increases by 2.5x (you remember well)
2. **Medium**: Interval increases by 1.5x (you remember okay)
3. **Hard**: Interval stays the same (you need more practice)

## 🧠 AI Features (Optional GPT-4)

Future enhancements will include:

- **Tips on difficult ayahs**: Get personalized memorization strategies
- **Progress summaries**: AI-generated insights on your learning patterns
- **Word meaning quizzes**: Test understanding of specific terms
- **Revision recommendations**: Smart suggestions for what to review

Example GPT prompt:
```
"You struggled with Surah 2:255. Give tips for memorizing this verse."
```

## 📥 Quran Dataset Integration

The app is designed to work with Quranic Universal Library (QUL) data:

### QUL Tools Integration:

- **Word by Word Translation**: Precise translations for each word
- **Surah Audio Segments**: Timestamped audio with word highlighting
- **Tajweed Rules**: Proper recitation guidelines
- **Ayah Translations**: Multiple language support

### Data Format:

```json
{
  "surah": 1,
  "ayah": 1,
  "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "translation": "In the name of Allah, the Most Gracious, the Most Merciful.",
  "words": [
    {
      "arabic": "بِسْمِ",
      "translation": "In the name",
      "start": 0.0,
      "end": 0.6
    }
  ],
  "audioUrl": "/audio/001001.mp3"
}
```

## 🎯 Usage Guide

### 1. Adding New Memorization

1. Select a surah from the dropdown
2. Choose ayah range (start and end)
3. Click "Add to Memorization List"
4. The item will be scheduled for review

### 2. Daily Review Process

1. Check the dashboard for items due for review
2. Click "Review Now" on any due item
3. Read/recite the ayah(s)
4. Rate your performance (Easy/Medium/Hard)
5. The system adjusts your next review date

### 3. Practice Mode

- Use "Practice" button to review any item anytime
- Toggle Arabic text and translations
- Listen to audio with word-by-word highlighting
- No impact on spaced repetition schedule

## 🎨 UI Components

### Custom CSS Classes:

```css
.arabic-text {
  font-family: 'Amiri', serif;
  direction: rtl;
  text-align: right;
}

.quran-card {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-6;
}

.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
}
```

### Color Scheme:

- **Primary**: Blue (#2563eb) for main actions
- **Success**: Green (#16a34a) for easy ratings
- **Warning**: Yellow (#ca8a04) for medium ratings  
- **Danger**: Red (#dc2626) for hard ratings

## 📊 Data Management

### Storage:

- **localStorage**: Browser-based persistence
- **Export/Import**: Backup and restore functionality
- **Data validation**: Ensures data integrity

### Backup:

```typescript
// Export your data
const data = exportData();
// Save to file or cloud storage

// Import data
importData(jsonString);
```

## 🔮 Planned Features

- [ ] **User accounts** (Supabase/Firebase integration)
- [ ] **Cross-device sync** (cloud storage)
- [ ] **Daily streaks** and gamification
- [ ] **Meaning quiz mode**
- [ ] **Bookmark favorite ayahs**
- [ ] **Progress analytics** and charts
- [ ] **Multiple translations** support
- [ ] **Tajweed highlighting**
- [ ] **Social features** (study groups)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines:

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Test on mobile devices
- Ensure accessibility compliance

## 📄 License

MIT License – open for all to benefit in memorizing the Qur'an.

## 🙏 Acknowledgments

- **Quranic Universal Library (QUL)** for providing comprehensive Quran data
- **SuperMemo** for the spaced repetition algorithm inspiration
- **Amiri Font** for beautiful Arabic typography
- **Next.js team** for the excellent framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/murajaah/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/murajaah/discussions)
- **Email**: support@murajaah.app

---

**May Allah ﷻ bless your Quran memorization journey! 📖✨**
