> Historical pre-fix evaluation. The graduation fix is now implemented; see [current implementation and verification](GRADUATION_TRANSITION.md).

# B — Small adjustment recommended

Evaluation date: 2026-09-08. Baseline commit: `00fbeda`.

**The early schedule works, but graduation currently removes protection too abruptly.** In the actual due-only simulations, an all-Easy passage receives a 101-day interval on Day 12; repeated Medium receives 50 days. I do not recommend declaring this configuration sufficiently conservative for newly memorized two-page Quran passages without further calibration. This is a transition-policy concern, not evidence that the FSRS equations are broken or that a mandatory Recent/Sabqi/Dhor system is necessary.

**Production scheduling was not changed.** This investigation adds reproducible experiments, focused characterization tests, and this report. The two-times-growth alternative below is an evaluated recommendation, not an implemented setting or feature.

## What was inspected and run

Read `reviewAlgorithms.ts`, `spacedRepetition.ts`, `reviewSimulator.ts`, `AppDataBoundary.tsx`, the creation/beginner paths in both pages, and the existing scheduler tests. The code confirms Adaptive is default, Hard is grade 1 (lapse), Medium grade 3, Easy grade 4. Beginner graduation uses five successes and short interval caps. All scheduled passage reviews use the canonical function, and the simulator uses it too. Hifz currently restarts daily after Hard, rather than retreating only one tier as one part of the handoff suggested; it was left untouched.

Ran synthetic on-time events through the existing `simulate()` function, which calls production `calculateReviewInterval()`. No live browser storage, user records, or Neon connection was used. Page count is not an input to the memory equations: these results describe one rated passage/unit, including a two-page unit. They do not prove that two pages have the same memory characteristics as a small flashcard. For a continuous passage, rate the entire unaided performance honestly, including its weakest ayah.

Reproduce:

- `node scripts/check-beginner-workflow.cjs`
- `node scripts/check-beginner-growth-cap.cjs` — explicitly hypothetical policy only
- `npm test`
- `npm run typecheck`

Full dated offsets, stability, difficulty, intervals, graduation state, and horizon counts are in `beginner-workflow-results.json`. The experiment results are in `beginner-growth-cap-experiment.json`.

## Timeline conventions

Day 0 means memorized and added. **The app actually creates the item due on Day 0**, even though its initial interval field is 1. Adding an item does not automatically record a successful review. The main simulations rate that initial due item on Day 0, then only review on due dates. There is no extra recent revision or hidden practice.

For each scenario, the requested rating prefix is followed by: all Easy for strong; all Medium for repeated Medium; alternating Easy then Medium starting at review 6 for normal/shaky/early difficulty; explicit recovery ratings after lapses, then Medium. All continuations are declared in the script. These are conditional response sequences, not predictions that a learner will actually succeed.

Dates below show `Day:rating`; E=Easy, M=Medium, H=Hard. Graduation marks the fifth successful review; its resulting interval is still capped at 5 days.

## Actual current beginner timelines and first 14 days

**Strong learner**

Memorized Day 0. Reviews: **0:E → 1:E → 2:E → 4:E → 7:E (graduates) → 12:E → 113:E**.

The first five intervals are 1, 1, 2, 3, 5 days. At Day 12, the first uncapped interval is **101 days**. On Day 113, another Easy schedules **365 days**, next due Day 478. Six rated contacts occur by Day 14, but no scheduled review occurs between Day 12 and Day 113.

**Normal successful learner — M, M, E, M, E**

Reviews: **0:M → 1:M → 2:E → 4:M → 7:E (graduates) → 12:E → 98:M**.

First uncapped interval: **86 days**. Day 98 Medium then schedules 307 days, next due Day 405. Six contacts by Day 14.

**Initially strong, then effortful — E, E, M, M, E**

Reviews: **0:E → 1:E → 2:M → 4:M → 7:E (graduates) → 12:E → 103:M**.

First uncapped interval: **91 days**. The later Medium schedules 322 days, next due Day 425. Six contacts by Day 14. Medium denotes successful effortful recall; this scenario has no actual failure.

**Early failure — M, H, M, E, E**

Reviews: **0:M → 1:H → 2:M → 3:E → 4:E → 6:E → 9:M (graduates) → 14:E → 73:M**.

Hard correctly restores daily review and restarts progress. There are eight contacts through Day 14 inclusive. The first uncapped interval is **59 days**, starting on Day 14.

**Immediate difficulty — H, M, M, E, E**

Reviews: **0:H → 1:M → 2:M → 3:E → 5:E → 8:E (graduates) → 13:M → 71:E**.

There are seven contacts through Day 14. The first uncapped interval is **58 days**, despite that review being Medium rather than Easy.

**Repeated Medium**

Reviews: **0:M → 1:M → 2:M → 4:M → 7:M (graduates) → 12:M → 62:M → 238:M**.

The post-graduation intervals are **50, 176, then 365 days**. Repeated Medium does not get stuck in beginner mode or daily review. Its early transition is still large.

**If your first test is Day 1 instead**

When you add on Day 0 but do not rate until Day 1, the strong path becomes **1 → 2 → 3 → 5 → 8 (graduates) → 13 → 114**. It still gives 101 days at the first uncapped review. Waiting one day to start does not fix the cliff. In the default Day-0 path, graduation includes the initial same-day demonstration plus four delayed successful reviews; it is not five independently delayed tests after memorization.

## Why the cliff happens

Beginner caps the scheduled interval, **not the underlying memory estimate**. At graduation on Day 7, strong recall has stability about **65.85 days** despite the actual interval being 5 days. On Day 12 that stability becomes about **100.99 days**, and the uncapped 90%-target interval rounds to 101.

Repeated Medium has stability about **32.27 days** at graduation and **50.42 days** at the next review. The same mechanism explains its 50-day interval. Simply requiring one more short beginner review would not address the structural discontinuity: latent stability could keep growing until the cap is removed.

This is not same-day inflation. The contacts occurred on different dates; the existing same-day guard works. It is the abrupt switch between a strongly capped policy and the default model estimate, extrapolating from a small number of short-delay observations.

The [Anki FSRS documentation](https://docs.ankiweb.net/deck-options.html#fsrs) explains model parameters and the retention/workload tradeoff; it does not validate these settings for multi-ayah recitation. The finding here comes from running the app, not from assuming all generic FSRS intervals are wrong. The desired 90% is a model target, not a measured guarantee of flawless recitation.

## What happens over 30 / 90 / 180 / 365 days

Counts below are **per passage**, include the initial Day-0 rating, and exclude the horizon endpoint: `0 ≤ review day < horizon`. Each scenario follows its own due dates. Counts are conditional on the stated future ratings.

- Strong: **6 / 6 / 7 / 7** reviews. No review after Day 113 within the first year.
- Normal: **6 / 6 / 7 / 7**. Last review within the year is Day 98.
- Initially strong then effortful: **6 / 6 / 7 / 7**. Last is Day 103.
- Early failure: **8 / 9 / 9 / 10**.
- Immediate difficulty: **7 / 8 / 8 / 8**.
- Repeated Medium: **6 / 7 / 7 / 8**. Reviews on Days 62 and 238 after the initial six.
- Strong, then Hard at the first long-gap review on Day 113: **6 / 6 / 10 / 11**.

These low successful-path counts demonstrate efficiency **if the model's expectations are accurate**. They do not show that actual newly memorized Quran will remain strong with that little contact.

## Forgetting and recovery

After strong beginner progression and Easy on Day 12:

**Day 113 H → 4-day gap → Day 117 M → 11-day gap → Day 128 M → 27-day gap → Day 155 E → 90-day gap → Day 245 E → 305-day gap.**

Stability drops from about 100.99 to 4.15 days at the lapse. Adaptive clearly responds to failure and relearns; it does not extend the forgotten passage's old interval. A mature lapse does **not** automatically turn Beginner Mode back on or guarantee next-day review. That is the actual current behavior, and it should not be described as “every Hard is daily.”

For an even more mature passage that succeeds on Day 113 and returns on Day 478, Hard gives **7 days**, then Medium recovery gives **18 and 42 days**. Repeated failures in the existing stress tests return to very short intervals. Whether a single substantial Quran lapse should get a mandatory next-day relearning check is a separate policy question; this investigation did not change that behavior.

## Same-day practice and dates

Inserted **100 additional Easy actions on Day 0** and compared the entire subsequent due-only timeline to a control. Due dates, intervals, stability, difficulty, and graduation stayed identical. Only the action counter increased; the beginner offset compensates. Extra recitation that is not rated does not generate an event at all.

The new tests also exercise the entire graduation timeline across spring/fall DST in UTC, Los Angeles, London, and Riyadh. Existing timestamp/date-only boundary tests pass. Calendar-date separation remains a daily scheduling approximation: a review just before and just after midnight can count as different days. No elapsed-hour/session tracking was introduced.

## Small adjustment evaluated, not deployed

**Recommendation:** smooth the release of interval protection instead of introducing a separate Recent Revision system. An intentionally simple candidate limits a successful Adaptive interval to at most **twice the previous scheduled interval**, while leaving FSRS stability/difficulty, lapse equations, beginner caps, and the 365-day maximum intact.

Current strong intervals: **1, 1, 2, 3, 5, 101, 365**.

Candidate strong intervals: **1, 1, 2, 3, 5, 10, 20, 40, 80, 160, 320, 365**.

Candidate due dates after the common early phase: **Day 12 → 22 → 42 → 82 → 162 → 322 → 642**. Repeated Medium also gets a 10-day first post-graduation interval. The guard is a ceiling; it does not force the memory model to produce any minimum interval.

Candidate successful-path counts at 30/90/180/365 days: **7 / 9 / 10 / 11**. That is four additional passage reviews in the first year for the all-Easy example, rather than daily review forever. For a two-page unit, it adds eight page-recitations over that year, excluding any correction/practice time.

**Why not silently implement this exact candidate?** The global guard also changes mature Adaptive scheduling, and in these strong synthetic paths it dominates the model, making Easy and Medium schedules coincide. Two-times growth is a product safety choice, not an empirically optimized Quran parameter. A temporary, explicitly persisted post-beginner transition could scope that guard more narrowly, but it would introduce state and require migration/compatibility decisions. The demonstration justifies fixing the discontinuity; it does not establish one uniquely correct replacement.

No production scheduler, settings, dashboard, schema, or user data was modified. The experiment wrapper exists only in an audit script and is not imported by the app or production simulator. It uses the production scheduler and adjusts only the hypothetical next interval/date; it contains no copied FSRS implementation.

## Tests and conclusion

All **54 existing tests** passed before investigation. Added **6 focused tests**, giving **60 passing tests**: current graduation characterization, Day-1-first-review behavior, same-day spam followed through graduation, early failure plus long-gap lapse recovery, full DST timeline, and the explicitly hypothetical guard's workload/interval path. TypeScript passes. The characterization tests document the current cliff, not a requirement to preserve it forever; update them deliberately when the policy changes.

**Can Adaptive be the long-term engine? Yes.** The existing architecture can support frequent new/weak review, spaced strong review, and lapse recovery without a mandatory Recent Revision feature. The concern is its present graduation handoff, not the absence of Sabqi/Dhor.

**Can I recommend trusting the current configuration blindly for two pages memorized today, with due reviews as the only future contact? Not yet.** The early contacts are coherent, but the immediate 50–101-day graduation gap is too large to endorse confidently without Quran-specific validation. Smooth that transition inside Beginner + Adaptive; a separate mandatory revision routine is not required by anything demonstrated here.
