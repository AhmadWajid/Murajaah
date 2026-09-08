# Revision system audit — 2026-09-08

Baseline: commit `deaf9e1`. All scenarios in this report use synthetic passages. The database investigation used one read-only aggregate SELECT; no real passage or review state was changed, and no migration was applied.

## Current system before the changes

The home page's whole-passage review used `updateInterval` or `updateIntervalWithSettings` in `src/lib/spacedRepetition.ts`, delegating to `calculateReviewInterval` in `src/lib/reviewAlgorithms.ts`. QuickReviewModal previewed that same entry point. Quran-page overall reviews also delegated there.

There was a second scheduling system inside `updateIndividualAyahRating` and `createSplitItem`. It used memorization age to assign fixed 1/2/4/7-day intervals, ignoring the selected algorithm. ReviewCard's overall button rated every ayah sequentially through that alternate system. Quran quick ratings discarded split results, while storageService attempted to delete the parent then insert children. A failure halfway through those requests could leave an incomplete split.

The scheduler ran in the browser. `/api/data` authenticated the request and persisted the supplied result through explicit Drizzle converters; it did not calculate intervals. Local storage held serialized items under the existing application storage key. Authenticated reads preferred Neon; writes generally wrote local storage then attempted the API. Guest data was local only. Neither backend had a chronological per-review event journal: `reviewCount`, `lastReviewed`, and the latest item state were all that remained. The statistics code approximated daily reviews from each item's last review, so it could not establish historic review burden.

The algorithm preference lived in `mquran_review_settings`, mirrored in Neon `user_settings.review_settings`. AuthProvider asynchronously copied database preferences into local storage on login/mount. The home page originally read its React settings state only once, allowing its review modal to diverge from the current stored preference.

Neon stores interval, due/review/completion dates as text, ease, count, beginner fields, stability/difficulty, passage metadata, and individual ratings/recall annotations. Local storage stores the equivalent item objects plus preferences. Dates are predominantly `YYYY-MM-DD`, not timestamps. Creation used age-based heuristic stability/difficulty, but the first Adaptive review replaced these with rating-based initialization; memorization age is not measured memory stability.

## Definite bugs and mismatches

- Ayah and passage reviews used different scheduling mathematics.
- Partial ayah completion marked the entire passage reviewed, contaminating elapsed time and completion tracking. Previously completed ratings could be reused in a later session.
- Hifz inferred tier from total review count. Repeated Hard and Medium ratings consequently advanced through the ladder despite the documented retreat/hold behavior.
- Beginner graduation treated the final five entries of a verse-number-keyed map as five recent reviews. Ease was used as a fallback; Hifz did not update ease, so failure could still lead to graduation. Re-enabling beginner mode on an old item did not reset the interval cap progression.
- Neon converted `beginnerStartedAtReview = 0` to undefined through `||`, losing a meaningful zero. This is now preserved with `??`.
- Date-only due dates were interpreted as UTC midnight and shifted into the user zone, becoming the previous date in western zones. Elapsed time floored partial timestamp differences instead of comparing local calendar dates.
- The home page cached “today” for the lifetime of the mounted page and used browser-local dates even when a timezone override was selected.
- Invalid numeric values could propagate into intervals and dates. Unknown algorithm preferences were not validated.
- Classic/Hifz wrote artificial FSRS stability/difficulty, contaminating switching back to Adaptive.
- Difficulty mean reversion used a clamped initial Easy difficulty; the reference FSRS implementation uses the unclamped value before clamping the final result.
- The installed Next.js 16 toolchain no longer supports `next lint`; the old FlatCompat configuration also crashed. The lint command and flat configuration now run.

## Research and decisions

FSRS maintains a compact memory state; using current stability/difficulty is valid without replaying the entire history on every review. However, optimizing parameters or validating calibration requires actual review events. We retained the existing 21 FSRS-6 parameters and checked initialization, recall/lapse updates, the forgetting curve, and difficulty damping against the [FSRS reference implementation](https://github.com/open-spaced-repetition/py-fsrs/blob/main/fsrs/scheduler.py) and [algorithm description](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm).

The crucial rating distinction is successful recall versus failure. Standard FSRS Hard is a **successful** retrieval. The [Anki manual](https://docs.ankiweb.net/deck-options) explicitly warns against using Hard when information was forgotten. The application's previous “Struggled to remember” description did not establish this distinction and offered no lapse rating.

The three-button contract is now explicit: **Easy = fluent unaided recitation, Medium = effortful unaided recitation, Hard = needed help or forgot**. Adaptive maps these to grades 4, 3, and 1. This is a product adaptation, not a claim that the English word “Hard” universally means failure. Existing records are not retroactively regraded.

The [original SM-2 specification](https://www.super-memory.com/english/ol/sm2.htm) has a different quality scale and sequence. We therefore label Classic “SM-2-inspired” and retain its established 1-day, then 3/2-day success steps instead of claiming exact SM-2 fidelity.

[Research on spaced retrieval](https://pubmed.ncbi.nlm.nih.gov/21574747/) supports separating retrieval opportunities over time, but does not establish a specific Quran interval ladder or prove a midnight boundary. Our same-day guard is a conservative application policy because the app cannot distinguish repeated clicks, immediate rehearsals, and independent sessions. Additional successful ratings on the same date leave memory and due date unchanged; failures still update the model. Counts still record actions, but these actions do not advance beginner graduation.

Contemporary [Hifz revision guidance](https://hufaaz.com/blog/quran-hifz-revision-schedule/) distinguishes new learning, recent revision, and older revision. It does not establish this application's exact 1→180-day ladder as a universal historical curriculum. Unsupported claims about centuries of use and a guaranteed 20–30% workload saving were removed.

## Algorithm changes

### Adaptive

Retains the FSRS-6 power forgetting curve, `R = (1 + factor × elapsed / stability)^decay`, with `decay = -0.1542` and factor chosen so `R(stability) = 0.9`. The 90% target makes the uncapped interval approximately stability, rounded to days. Actual recall is not guaranteed to be 90% for Quran passages.

Hard now reaches the lapse equation; same-day Hard uses short-term deterioration. Difficulty mean reversion is corrected. First reviews initialize from the observed rating. Later records missing memory fields derive a conservative starting state from interval/ease; missing or invalid last-review dates use an assumed on-time interval rather than pretending to be same-day reviews. Same-day successes follow the daily policy above.

Intervals remain 1–365 days; stability is bounded to 0.01–36,500 days and difficulty to 1–10 for numerical safety. The stability floor, upper guard, calendar-day policy, three-button mapping, beginner caps, and lack of minute-level learning steps/fuzz are explicit departures from a complete generic flashcard scheduler.

### Classic

Preserves ease bounds 1.3–2.5, Easy +0.1, Hard −0.15, and existing success multipliers. Hard restarts daily review, fixing the old case where `0.5 × ease` could increase an interval after difficulty. Subsequent early successes use the lesser of elapsed days and scheduled interval as their multiplication base. Overdue reviews do not earn an arbitrary bonus. Same-day successes do not compound ease or intervals.

### Traditional Hifz

Preserves the fixed ladder `[1, 2, 4, 7, 14, 30, 60, 90, 180]`. The first review schedules one day. Tier is inferred from interval, not lifetime review count. Due Easy advances, Medium holds, and early successes hold. Hard restarts at one day: after defining Hard as failure, sending a failed 180-day passage to 90 days would be an unsuitable recovery schedule. Mature Easy remains at 180 days.

A non-ladder interval from a previous algorithm maps to the lower neighboring tier. No new database tier field is required. Medium can intentionally remain daily forever in this strategy; the simulator makes this workload visible. Adaptive or Classic is more suitable when successful-but-effortful recall should progressively space out.

### Beginner mode

One shared layer replaces three inconsistent implementations. Consecutive successful reviews on separate dates receive caps of 1, 1, 2, 3, and 5 days. Graduation happens on the fifth successful review, with that final review still capped; normal spacing starts with the next review. Hard resets progress. Same-day success shifts the existing progress offset so it cannot fake graduation. Manual re-entry starts at the first cap regardless of lifetime count.

The existing `beginnerStartedAtReview` numeric field is reused as a progress offset. Old records lacking it conservatively start their progress at the current count. This requires no schema change and never reduces reviewCount.

## Ayah-level behavior

Partial ratings are accumulated without changing lastReviewed or completedToday. A complete passage runs the canonical scheduler exactly once, using Hard if any ayah needed help, otherwise Medium if any was effortful, otherwise Easy. Out-of-range ayahs are rejected. Consumed ratings are cleared so the next recitation cannot reuse them; this map was not an event history. Other annotations and passage metadata remain intact.

Automatic splitting is disabled. This is a deliberate conservative choice: it retains continuous passage practice, avoids the former non-atomic delete/insert path, and prevents one recitation from creating many tiny independently due fragments. Previously split records still load normally. The tradeoff is extra repetition of strong neighbors around a weak ayah. Explicit teacher/user-approved splitting or a separately persisted weak-ayah overlay would be a future improvement requiring evaluation.

The older `individualRecallQuality` controls remain annotations; they do not silently trigger an additional scheduling event.

## Simulator

Open `/review-simulator`, or use **Review settings → Open revision simulator**. Development command: `npm run dev`; this audit's running instance uses port 3005.

It provides algorithm selection, beginner ON/OFF, starting date, timezone, Easy/Medium/Hard actions, custom review date, one-day advance, jump to next due, reset, replay, and JSON export. Comparison replays identical dates/ratings through all registered schedulers. The selected reference scheduler generates preset dates and controls the jump button; changing that selector does not rewrite existing event dates.

Nine presets: Perfect recall, Consistent recall, Struggling, Mixed performance, Learned then forgotten, Recovery, Same-day repetition, Long overdue, and Beginner progression.

Each log shows rating/date, interval transition, next due/date distance, review count, beginner transition, and relevant memory/ease transitions. Registry metadata determines applicable columns. Each algorithm has an SVG interval graph. No chart dependency was added.

A separate workload estimate repeats the specified ratings while each algorithm follows its own due dates over 30, 90, 180, and 365 days. Day zero is included; the horizon endpoint is excluded. These are prescribed-response simulations, **not** a generative model of memory or evidence that fewer reviews retain more Quran. The same-date comparison necessarily has equal action counts.

The simulator uses React memory only and explicitly passes dates, zones, and algorithms to production `calculateReviewInterval`. It imports no storage service. `AppDataBoundary` excludes AuthProvider and DataMigration on this route so merely opening it cannot trigger normal preference synchronization or migration prompts. No production keys, Neon writes, account settings, or real passages are used by its controls.

## Before vs. after

The checked-in `scheduler-before-after.json` contains full synthetic results and dates. Ratings: `Easy → Easy → Medium → Hard → Easy`. Shared UTC dates: January 1, January 9, January 31, March 2, March 3, 2026. Beginner OFF.

- Adaptive intervals: **8 → 66 → 139 → 196 → 200** before; **8 → 66 → 139 → 4 → 8** after.
- Classic intervals: **1 → 3 → 8 → 9 → 29** before; **1 → 3 → 8 → 1 → 3** after.
- Hifz intervals: **2 → 4 → 4 → 4 → 30** before; **1 → 2 → 2 → 1 → 2** after.

The Adaptive difference is primarily semantic: the old Hard represented successful recall, while the corrected three-button contract records failure. This comparison does not claim the reference FSRS Hard formula was mathematically wrong.

Eight same-day Easy actions previously reached an Adaptive interval of 113 days from the first 8-day interval. They now retain 8 days. The automated stress test checks this remains true through 100 same-day actions.

## Persistence and compatibility

No table or storage format migration. The API now retains meaningful zero values for beginner offset and memorization age. Existing IDs, ranges, counts, memorization metadata, and recall annotations are retained. Numerical normalization happens on the next scheduling calculation, not through bulk data rewriting. Invalid due dates are surfaced as due and repaired by a review. Timestamp dates convert into the selected zone; date-only values retain their calendar date across timezone changes.

Classic/Hifz stop manufacturing FSRS memory metrics. A later switch back to Adaptive derives memory from the current interval/ease. Old synthetic memory fields cannot be identified reliably without provenance; existing Adaptive state is therefore not wiped. Choosing another algorithm changes future reviews, not every stored due date immediately.

Preference change events now refresh the home page after database synchronization and cross-tab storage changes. Review submission reads current settings. Date rollover/focus refreshes today's display, and common date helpers respect the configured user zone.

The read-only Neon aggregate found **2 items, both beginners, maximum 2 reviews, maximum interval 1 day**, and no missing stability or out-of-range intervals. This tiny current-state sample cannot establish retention, lapse rates, or historical workload.

## Verification

- `npm test`: **54 passing tests** using Node's test runner and the installed TypeScript transpiler; no test dependency added.
- 100-review sequences for every algorithm, beginner ON/OFF, Easy/Medium/Hard/alternation/mixed patterns.
- FSRS formula vectors, lapse recovery, fixed-date before/after fixtures, Hifz tier independence, and cross-algorithm state changes.
- Same-day, early (1/29 days), on-time, late (31 days), and extremely overdue (3,650 days) review cases.
- Graduation, Hard reset, manual re-entry, repeated same-day success, legacy missing fields, NaN/Infinity/negative/huge values.
- Local serialization round-trip, explicit zero marker, ayah completion/no fragmentation, date-only and timestamp conversion, both US DST boundaries, invalid date rejection, missing last-review recovery.
- Simulator isolation test makes any browser-storage access throw while all algorithms/presets/burden calculations run.
- `npm run typecheck`: passes. `npm run build`: passes, including static generation of `/review-simulator`.
- ESLint passes for the scheduler, simulator, date/storage service, API converter, isolation boundary, and layout files. Full `npm run lint` runs but reports **79 pre-existing errors and 1 warning** elsewhere. With the repaired config, the edited home page decreases from 14 baseline errors to 11; ReviewCard remains at its pre-existing 1. No broad lint suppression was added.
- Browser: exercised all nine presets, comparison and single-algorithm view, all three manual ratings for each algorithm, time advance, jump-to-due, reset, replay, and beginner graduation. Inspected the rendered layout and found no browser error logs.

## Remaining concerns and boundaries

This engine has not been clinically or educationally validated for Quran memorization. Passage length, similar ayahs, tajweed errors, recitation continuity, and independent teacher assessment are not modeled. Keep teacher-led continuous revision alongside this aid. A 90% per-passage model target is not a guarantee of flawless whole-Quran recitation.

A chronological review-event journal would enable real calibration, loss analysis, offline conflict resolution, and measured workload. It cannot be reconstructed from the current schema's lastReviewed/count fields. No history was invented or discarded to manufacture such evidence.

The pre-existing write-through layer logs database failures and prefers database state on later authenticated reads; it has no durable offline outbox or multi-device conflict versioning. That remains a persistence risk and deserves a separate tested synchronization design. This audit avoids changing account ownership/merge semantics or bulk migrating records without historical evidence.

The remaining Hifz Medium hold policy and 180-day maturity cap are explicit product choices, not research-derived optima. FSRS defaults can produce long intervals quickly after very strong recall; no Quran-specific evidence presently supports choosing alternative parameters. The beginner caps and workload simulator make those effects observable without pretending to prove optimal retention.
