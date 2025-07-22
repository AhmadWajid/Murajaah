# 📖 Murajaah – Quran Memorization Tool

> **⚠️ This project is under active development. Features, UI, and data may change frequently. Feedback and contributions are welcome!**

Murajaah is a personalized Quran memorization assistant that helps users track, review, and retain their memorization using spaced repetition and feedback-based learning. Built with Next.js and Tailwind CSS.

*AI-powered features are planned for future releases, but are not yet available.*

---

## 🚧 Development Status

- Core review and memorization features are functional
- UI/UX is being actively improved for mobile and desktop
- Some features (accounts, sync, AI tips) are planned but not yet implemented
- Expect bugs and rapid changes!

---

## 🌟 Features

- **Add and store memorized Quran ranges** (e.g. Surah 2:255–257)
- **Daily review prompts** using spaced repetition (SM2 algorithm)
- **Rate your recall** (Easy, Medium, Hard) to personalize revision intervals
- **Auto-adjust revision schedules** based on performance
- **Highlight ayahs with audio** + word-by-word timing
- **View translations, tajweed, and review tips**
- **Beautiful, responsive UI** with dark mode support
- **Mobile-friendly design**
- *(Planned)* User accounts, cloud sync, AI-powered review suggestions, and more!

---

## 📦 Tech Stack

| Area       | Tech               |
|------------|--------------------|
| Frontend   | Next.js, React, TypeScript |
| Styling    | Tailwind CSS       |
| Data       | Quranic Universal Library (QUL) |
| Storage    | localStorage (browser-based) |
| Audio      | HTML5 `<audio>`, QUL audio segments |
| Scheduler  | Custom spaced repetition (SM2-lite) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/murajaah
cd murajaah
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧱 Project Structure

```
mquran/
├── src/
│   ├── app/           # Next.js app directory
│   ├── components/    # Shared React components
│   └── lib/           # Utilities and data logic
├── public/            # Static assets (fonts, images, audio)
├── db/                # Local database files (if any)
├── README.md
└── package.json
```

---

## 🔁 Spaced Repetition Algorithm

The app uses a modified SuperMemo 2 algorithm to optimize review intervals:

```typescript
export function updateInterval(oldInterval: number, rating: 'easy' | 'medium' | 'hard') {
  const multiplier = {
    easy: 2.5,
    medium: 1.5,
    hard: 1.0,
  }[rating];
  return Math.max(1, Math.round(oldInterval * multiplier));
}
```

---

## 🎯 Usage Guide

1. **Add a memorization range** (select surah/ayahs)
2. **Review daily**: The app prompts you for due reviews
3. **Rate your recall**: Easy/Medium/Hard
4. **Intervals auto-adjust**: The system schedules your next review

---

## 🔮 Planned Features

- [ ] User accounts (Supabase/Firebase)
- [ ] Cross-device sync
- [ ] Daily streaks and gamification
- [ ] Meaning quiz mode
- [ ] Progress analytics and charts
- [ ] Multiple translations
- [ ] Tajweed highlighting
- [ ] Social features (study groups)
- [ ] AI-powered review suggestions and insights

---

## 🤝 Contributing

- Fork the repository
- Create a feature branch (`git checkout -b feature/amazing-feature`)
- Commit your changes
- Push to your branch and open a Pull Request

**Guidelines:**
- Use TypeScript and Tailwind CSS
- Test on mobile and desktop
- Write clear commit messages
- Ensure accessibility

---

## 📄 License

MIT License – open for all to benefit in memorizing the Qur'an.

---

## 🙏 Acknowledgments

- Quranic Universal Library (QUL)
- SuperMemo (spaced repetition inspiration)
- Amiri Font (Arabic typography)
- Next.js team

---

**May Allah ﷻ bless your Quran memorization journey!**
