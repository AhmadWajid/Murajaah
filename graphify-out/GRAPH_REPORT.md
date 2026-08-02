# Graph Report - mquran  (2026-08-02)

## Corpus Check
- 80 files · ~79,739 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 788 nodes · 1582 edges · 49 communities (26 shown, 23 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.71)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36619d94`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- storageService.ts
- QuranContent.tsx
- database.ts
- quranService.ts
- storage.ts
- Performance Optimizations Guide
- voiceNavigationService.ts
- utils.ts
- quran.ts
- devDependencies
- compilerOptions
- Supabase Setup Guide for MQuran
- components.json
- AuthProvider.tsx
- manifest.json
- 📖 Murajaah – Quran Memorization Tool
- route.ts
- supabase_schema.sql
- dependencies
- performance.ts
- rules
- rukuService.ts
- middleware.ts
- FontLoader
- eslint.config.mjs
- AddModal.tsx
- better-sqlite3
- clsx
- lucide-react
- luxon
- next
- next.config.ts
- @radix-ui/react-alert-dialog
- @radix-ui/react-dialog
- @radix-ui/react-label
- @radix-ui/react-select
- @radix-ui/react-switch
- react-dom
- react-markdown
- react-tooltip
- recharts
- @supabase/auth-ui-react
- @supabase/ssr
- tailwind-merge
- @types/better-sqlite3
- postcss.config.mjs
- tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 48 edges
2. `getSupabaseClient()` - 28 edges
3. `getCurrentUser()` - 28 edges
4. `QuranPageContent()` - 22 edges
5. `withFallback()` - 19 edges
6. `isAuthenticated()` - 18 edges
7. `Dashboard()` - 16 edges
8. `VoiceNavigationService` - 16 edges
9. `compilerOptions` - 16 edges
10. `Button()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `TajweedAyahText()` --references--> `react`  [EXTRACTED]
  src/components/TajweedAyahText.tsx → package.json
- `Slider()` --references--> `react`  [EXTRACTED]
  src/components/ui/slider.tsx → package.json
- `useRenderTracking()` --references--> `react`  [EXTRACTED]
  src/lib/utils/performance.ts → package.json
- `middleware()` --calls--> `updateSession()`  [EXTRACTED]
  middleware.ts → src/lib/supabase/middleware.ts
- `EditItemForm()` --calls--> `generateMemorizationId()`  [EXTRACTED]
  src/app/page.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (49 total, 23 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.07
Nodes (62): AuthMode, EditItemForm(), GroupedItems, EnhancedMemorizationModalProps, QuranHeader(), QuranHeaderContent(), QuranHeaderContentProps, QuranSelectorProps (+54 more)

### Community 1 - "storageService.ts"
Cohesion: 0.08
Nodes (54): PageData, QuranPageContent(), AudioPlayer(), AudioPlayerProps, EnhancedMemorizationModal(), ReviewCard(), RevisionModal(), RevisionModalProps (+46 more)

### Community 2 - "QuranContent.tsx"
Cohesion: 0.06
Nodes (29): PageLine, QuranContentProps, ruleColorMap, LineData, PageLine, QuranPageProps, SelectedAyahsModalProps, getTajweedColor() (+21 more)

### Community 3 - "database.ts"
Cohesion: 0.11
Nodes (48): addMemorizationItem(), batchAddMemorizationItems(), batchUpdateMemorizationItems(), clearAllMemorizationData(), clearAllMistakes(), convertDbItemToMemorizationItem(), convertMemorizationItemToDbItem(), DbMemorizationItem (+40 more)

### Community 4 - "quranService.ts"
Cohesion: 0.06
Nodes (34): EditItemFormProps, ReviewItem, MemorizationListProps, ExtendedMemorizationItem, ReviewCardProps, AyahData, cache, EditionData (+26 more)

### Community 5 - "storage.ts"
Cohesion: 0.07
Nodes (34): AUDIO, DATE_FORMAT, DEFAULTS, FILTER_TYPES, REVIEW_RATINGS, SORT_TYPES, SPACED_REPETITION, STORAGE (+26 more)

### Community 6 - "Performance Optimizations Guide"
Cohesion: 0.06
Nodes (33): 1. **Caching System**, 1. **Data Fetching**, 2. **Batch Database Operations**, 2. **React Optimization**, 3. **Database Operations**, 3. **Optimized Data Loading**, 4. **React Performance Optimizations**, 4. **User Experience** (+25 more)

### Community 7 - "voiceNavigationService.ts"
Cohesion: 0.07
Nodes (12): ALTERNATIVE_MAPPINGS, SpeechGrammar, SpeechGrammarList, SpeechRecognitionAlternative, SpeechRecognitionErrorEvent, SpeechRecognitionEvent, SpeechRecognitionResult, SpeechRecognitionResultList (+4 more)

### Community 8 - "utils.ts"
Cohesion: 0.18
Nodes (24): Dashboard(), StatisticsPage(), MemorizationList(), formatAyahRange(), getSurahName(), calculateNewEaseFactor(), createMemorizationItem(), createSplitItem() (+16 more)

### Community 9 - "quran.ts"
Cohesion: 0.08
Nodes (24): AyahCard(), AyahCardProps, stripRuleTags(), AyahDetailDrawer(), AyahDetailDrawerProps, QuranHeaderProps, QuranSelector(), TafsirContent() (+16 more)

### Community 10 - "devDependencies"
Cohesion: 0.06
Nodes (31): eslint, eslint-config-next, @eslint/eslintrc, devDependencies, eslint, eslint-config-next, @eslint/eslintrc, tailwindcss (+23 more)

### Community 11 - "compilerOptions"
Cohesion: 0.07
Nodes (29): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, ./src/* (+21 more)

### Community 12 - "Supabase Setup Guide for MQuran"
Cohesion: 0.08
Nodes (25): 1. Create Supabase Project, 2. Run Database Schema, 3. Configure Environment Variables, 4. Test the Setup, ✅ All Original Functionality, Automatic Migration, Common Issues, 🔄 Data Migration (+17 more)

### Community 13 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 14 - "AuthProvider.tsx"
Cohesion: 0.14
Nodes (14): geistMono, geistSans, metadata, viewport, AppHeader(), AppHeaderProps, AuthContext, AuthContextType (+6 more)

### Community 15 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, dir, display, icons, lang, name (+7 more)

### Community 16 - "📖 Murajaah – Quran Memorization Tool"
Cohesion: 0.13
Nodes (14): 🙏 Acknowledgments, 🤝 Contributing, 🚧 Development Status, 🌟 Features, 🚀 Getting Started, Installation, 📄 License, 📖 Murajaah – Quran Memorization Tool (+6 more)

### Community 17 - "route.ts"
Cohesion: 0.18
Nodes (14): AyahCountRow, cleanText(), GET(), getPagesDatabase(), getTajweedDatabase(), LineInfoRow, PageRow, parseTajweedRules() (+6 more)

### Community 18 - "supabase_schema.sql"
Cohesion: 0.20
Nodes (14): on_auth_user_created, public.due_items, public.handle_new_user(), public.handle_updated_at(), public.memorization_items, public.mistakes, public.recent_mistakes, public.storage_metadata (+6 more)

### Community 19 - "dependencies"
Cohesion: 0.15
Nodes (13): class-variance-authority, dependencies, class-variance-authority, @radix-ui/react-separator, @radix-ui/react-slider, @radix-ui/react-slot, @supabase/auth-ui-shared, @supabase/supabase-js (+5 more)

### Community 20 - "performance.ts"
Cohesion: 0.18
Nodes (8): react, react, PerformanceMetric, PerformanceMonitor, performanceUtils, trackAsyncOperation(), trackPerformance(), useRenderTracking()

### Community 21 - "rules"
Cohesion: 0.22
Nodes (8): stylelint-config-standard, stylelint-config-tailwindcss, extends, plugins, rules, at-rule-no-unknown, declaration-block-trailing-semicolon, no-descending-specificity

### Community 22 - "rukuService.ts"
Cohesion: 0.29
Nodes (4): getRukuForAyah(), getRukuRange(), RukuData, RukuReference

### Community 23 - "middleware.ts"
Cohesion: 0.38
Nodes (5): config, middleware(), IMPORTANT: Avoid writing any logic between createServerClient and, IMPORTANT: You *must* return the supabaseResponse object as it is. If you're, updateSession()

### Community 25 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

## Knowledge Gaps
- **251 isolated node(s):** `stylelint-config-standard`, `stylelint-config-tailwindcss`, `at-rule-no-unknown`, `declaration-block-trailing-semicolon`, `no-descending-specificity` (+246 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `performance.ts` to `page.tsx`, `QuranContent.tsx`, `dependencies`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `performance.ts`, `better-sqlite3`, `clsx`, `lucide-react`, `luxon`, `next`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-switch`, `react-dom`, `react-markdown`, `react-tooltip`, `recharts`, `@supabase/auth-ui-react`, `@supabase/ssr`, `tailwind-merge`, `@types/better-sqlite3`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `Slider()` connect `page.tsx` to `performance.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **What connects `stylelint-config-standard`, `stylelint-config-tailwindcss`, `at-rule-no-unknown` to the rest of the system?**
  _253 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06521739130434782 - nodes in this community are weakly interconnected._
- **Should `storageService.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0763000852514919 - nodes in this community are weakly interconnected._
- **Should `QuranContent.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057912457912457915 - nodes in this community are weakly interconnected._