# Beginner → Adaptive transition: implemented and verified

The original daily Beginner layer remained at 1, 1, 2, 3, 5 days while FSRS stability accumulated behind it. Removing that cap exposed 101 days after all Easy, or 50 days after all Medium, on Day 12. This was a scheduling-policy discontinuity, not an error in the FSRS equations.

## Decision and research basis

Retain the FSRS memory model and temporarily limit how quickly its interval is exposed after graduation. FSRS defines stability in relation to a modeled forgetting curve; clipping stability to an imposed learning interval would misrepresent that state. See the [official FSRS equations](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm). The [Anki retention guidance](https://docs.ankiweb.net/deck-options.html#desired-retention) also distinguishes modeled retention from review workload.

The selected transition is an app-specific reinforcement policy, not a published FSRS formula or empirically optimized Quran curriculum. Continuous unaided passage recitation is the relevant success criterion. Hard remains failed unaided recall; Medium remains successful, effortful recall. No Sabqi/Dhor feature was added.

## Candidates tested before production edits

All overlays used the historical production scheduler from commit `00fbeda`, loaded read-only through Git and transpiled in memory. No alternative memory equations were implemented. Each candidate ran repeated Easy, repeated Medium, mixed ratings, deep recovery, early failure, immediate post-graduation failure, later lapse/recovery, overdue reviews and 100 same-day actions. Due-date scenarios cover 30/90/180/365 days and continue beyond the final horizon.

- **Clip stability at graduation:** first Easy/Medium gaps 44/23 days. Still abrupt and changes the meaning of stored memory state. Rejected.
- **Three extra steps, 7/14/30:** all Easy then jumps from 30 to 365 days at Day 63. Relocates the cliff. Rejected.
- **Four-review blend toward FSRS:** first Easy/Medium gaps 29/16 days; Easy then 152 days. Still exposes too much too soon. Rejected.
- **Constant transition growth, Easy 2× / Medium 1.5×:** smooth but remains constrained until Day 642/938 in uninterrupted success scenarios; yearly counts 11/13. Rejected in favor of a faster, explicit relaxation.
- **Gradually relaxing growth — selected:** starts at Easy 2× / Medium 1.5×, adds 0.5× per successful due transition review. First gaps 10/8 days, yearly counts 9/10. Preserves rating differences and FSRS memory; does not constrain legacy mature passages.

Complete machine-readable candidate runs: `graduation-candidate-results.json`. Reproduce with `node scripts/evaluate-graduation-candidates.cjs`. Historical comparisons require Git commit `00fbeda` to be available.

## Exact production policy

1. Keep existing Beginner intervals and five successful distinct-day reviews.
2. On Adaptive graduation, retain the existing optional `beginnerStartedAtReview` progress offset.
3. On a successful due transition review, choose the smaller of FSRS's interval and `round(previous interval × (rating multiplier + 0.5 × completed transition successes))`.
4. Remove the transition permanently when FSRS's proposed interval already fits the limit. There is no fixed exit review that suddenly removes an active limit.
5. Hard during Transition gives one day and restarts Beginner successes, retaining the FSRS lapse update to stability/difficulty.
6. Same-day successes preserve memory, due date and phase progress. Different-day early successes may update FSRS memory but cannot advance the transition or extend an unchanged due interval. They are explicit recorded recall tests; unscheduled practice is not automatically recorded.
7. Switching to Classic/Hifz clears the transition. Existing mature passages without an offset remain unrestricted. Ordinary passage edits preserve the offset; explicitly changing familiarity can reset/clear it.

The exact multipliers are transparent product heuristics. Simulations establish their consequences, not their optimality. This policy meaningfully removes the initial cliff without promising uniformly small gaps forever.

## Actual old and new timelines

Day 0 is memorization plus the first recorded review. With the first review on Day 1, the uninterrupted timelines shift one day. Both versions review at Days **0, 1, 2, 4, 7, 12**; graduation is Day 7 and its next gap remains five days.

**All Easy:**

- Old review days: 0 → 1 → 2 → 4 → 7 → 12 → 113 → 478.
- New review days: 0 → 1 → 2 → 4 → 7 → 12 → 22 → 47 → 122 → 385.
- New intervals after graduation: 5 → 10 → 25 → 75 → 263 → 365.
- Fully unrestricted at Day 385. The 263-day interval is reached only after a successful 75-day gap, not after five-day reinforcement.

**All Medium:**

- Old review days: 0 → 1 → 2 → 4 → 7 → 12 → 62 → 238.
- New review days: 0 → 1 → 2 → 4 → 7 → 12 → 20 → 36 → 76 → 196.
- New intervals after graduation: 5 → 8 → 16 → 40 → 120 → 365.
- Fully unrestricted at Day 196. Medium's lower FSRS proposal fits its limit sooner than Easy; this does not imply stronger memory.

**Hard immediately after graduation:** five Easy reviews, then Hard on Day 12. New due date Day 13; recovery ratings M/E/M/E/M give reviews on Days 13, 14, 15, 17, 20, with intervals 1, 1, 2, 3, 5. Another gradual transition follows.

**Weak memory that does not need the bridge:** four Hard reviews followed by five Medium reviews graduate at Day 9 with interval 3. Day 12 Easy proposes six days and already fits the limit; unrestricted FSRS resumes immediately. Subsequent intervals 9, 18, 26, 49, 71, 129 show that exit does not require a fixed number of additional contacts.

**Overdue:** a 30-day delay at the first post-graduation review does not skip the transition: Day 42 Easy schedules 10 days, then Day 52 Medium schedules 20 days. A further 60-day delay is also modeled without advancing multiple transition steps.

## Review counts: 30 / 90 / 180 / 365 days

Counts include Day 0 and exclude the horizon endpoint. These are conditional prescribed-rating scenarios, not simulated biological forgetting. Before and after use identical rating sequences on their own due dates.

- All Easy: old **6 / 6 / 7 / 7**; new **7 / 8 / 9 / 9**.
- All Medium: old **6 / 7 / 7 / 8**; new **7 / 9 / 9 / 10**.
- Early failure, then alternating M/E: old **8 / 9 / 9 / 10**; new **9 / 10 / 11 / 12**.
- Immediate graduation lapse, then alternating M/E: old **8 / 9 / 10 / 10**; new **12 / 14 / 15 / 16**.
- Later lapse at review nine, then repeating M/M/E: old **6 / 6 / 7 / 7**; new **7 / 8 / 17 / 18**.
- Mixed recurring failures: old **6 / 6 / 7 / 7**; new **7 / 8 / 9 / 42**.
- Deep recovery: both **12 / 14 / 15 / 17**.
- Overdue: old **5 / 6 / 6 / 7**; new **5 / 7 / 8 / 9**.

The mixed/later-lapse counts need care: the old sparse schedule does not even reach the prescribed failure by one year, while the new schedule does. The difference is not evidence of worse retention or unnecessary reviews. The separate shared-date regression confirms identical FSRS memory for identical successful observations.

Complete actual production comparison: `graduation-production-results.json`; reproduce with `node scripts/verify-graduation-transition.cjs`. The nine production runs match the selected isolated candidate, including dates, intervals, stability and Beginner state.

## Implementation and persistence

- `src/lib/reviewAlgorithms.ts`: canonical policy, progress normalization, transition/phase helpers. FSRS equations and Classic/Hifz calculations unchanged.
- `src/lib/spacedRepetition.ts`: documents retained offset.
- `src/app/page.tsx`: preserves transition during ordinary passage edits.
- `src/app/review-simulator/page.tsx`: displays Beginner/Transition/Adaptive in summaries and timeline; still invokes the same production scheduler.
- Existing Neon `beginner_started_at_review` integer and JSON/localStorage serialization already preserve the optional offset, including zero. No schema change, migration, database query or real user-data write was performed for this work.
- Existing mature records are not retroactively identified/rescheduled; absence of historical transition data is not guessed. New graduations and existing active Beginners gain the protection on subsequent review.

## Verification

- 76 automated tests pass: original scheduler suite, updated Beginner regression suite and new transition tests.
- Coverage includes isolated-versus-production parity across all nine scenarios; same-day spam in Beginner and Transition; rating-sensitive first intervals; Hard reset and recovery; release to mature scheduling; unchanged legacy mature outputs; JSON persistence; invalid offsets; early/overdue behavior; algorithm switching; shared-date FSRS memory equivalence; canonical simulator parity; existing ayah aggregation/isolation tests; spring/fall DST across four zones.
- TypeScript passes. Next.js production build passes.
- Changed scheduler/model/simulator files pass ESLint. Full-project lint retains 79 existing errors and one warning, including pre-existing issues in `src/app/page.tsx`; the small passage-edit preservation change introduces no new lint diagnostic.
- Browser exercised Perfect recall, Consistent recall, Same-day repetition, Learned then forgotten, Long overdue, Beginner progression and Replay with three-algorithm comparison enabled. Visible transitions and counts match test outputs; no browser console errors observed.
- Simulator remains in memory and bypasses account migration/provider paths. No real account or passage was used in manual testing.

## Remaining uncertainty

The 90% target is a generic model estimate, not validated two-page Quran retention. Honest unaided ratings and passage size matter. Even the improved schedule can reach multi-month gaps; default FSRS parameters and these transition multipliers need longitudinal recitation data before claiming optimal retention/burden. No mandatory recent-revision subsystem is necessary to operate this workflow, but this engineering verification is not proof of long-term learning outcomes.
