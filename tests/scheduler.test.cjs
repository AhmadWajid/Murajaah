const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DateTime, Settings } = require('luxon');
const { calculateReviewInterval: review, elapsedReviewDays, normalizeSchedulingItem, getReviewSettings } = require('../src/lib/reviewAlgorithms.ts');
const { mockPassage, simulate, presetEvents, PRESETS, ALGORITHMS, reviewBurden } = require('../src/lib/reviewSimulator.ts');
const { updateIndividualAyahRating, getDueItems } = require('../src/lib/spacedRepetition.ts');
const { toUserTimeZoneDate } = require('../src/lib/utils.ts');
const start = '2026-01-01';
const step = (item, rating, algorithm = 'adaptive', date = item.nextReview, zone = 'UTC') => review(item, rating, { algorithm }, zone, date);
for (const algorithm of ALGORITHMS) {
 for (const beginner of [false, true]) {
  for (const pattern of [['easy'], ['medium'], ['hard'], ['easy', 'hard'], ['easy', 'medium', 'hard', 'easy']]) {
   test(`${algorithm}: 100 due reviews ${pattern}, beginner=${beginner}`, () => {
    let item = mockPassage(start, beginner);
    for (let i = 0; i < 100; i++) {
     const previous = structuredClone(item);
     const next = step(item, pattern[i % pattern.length], algorithm);
     assert.deepEqual(item, previous, 'input must not mutate');
     assert(Number.isInteger(next.interval) && next.interval >= 1 && next.interval <= 365);
     assert(DateTime.fromISO(next.nextReview).isValid);
     assert(next.nextReview > item.nextReview);
     for (const key of ['easeFactor', 'stability', 'difficulty']) if (next[key] !== undefined) assert(Number.isFinite(next[key]));
     item = JSON.parse(JSON.stringify(next));
    }
    if (beginner && !pattern.includes('hard')) assert.equal(item.isBeginner, false);
    if (pattern.length === 1 && pattern[0] === 'hard') assert(item.interval <= 1);
   });
  }
 }
 test(`${algorithm}: beginner spaced graduation, failure reset, reentry and same-day`, () => {
  let item = mockPassage(start, true);
  for (let i = 0; i < 4; i++) item = step(item, 'medium', algorithm);
  assert(item.isBeginner);
  item = step(item, 'hard', algorithm);
  for (let i = 0; i < 4; i++) { item = step(item, 'easy', algorithm); assert(item.isBeginner); }
  item = step(item, 'easy', algorithm); assert.equal(item.isBeginner, false);
  item = { ...item, isBeginner: true, beginnerStartedAtReview: item.reviewCount };
  item = step(item, 'easy', algorithm); assert(item.interval <= 1);
  const date = item.lastReviewed;
  for (let i = 0; i < 20; i++) item = step(item, 'easy', algorithm, date);
  assert(item.isBeginner);
 });
 test(`${algorithm}: all presets use identical shared event dates`, () => {
  for (const name of Object.keys(PRESETS)) {
   const events = presetEvents(name, 'adaptive', start, true, 'America/Los_Angeles');
   const rows = simulate(algorithm, start, true, events, 'America/Los_Angeles');
   assert.deepEqual(rows.map(row => row.event), events);
   assert.deepEqual(rows, simulate(algorithm, start, true, events, 'America/Los_Angeles'));
  }
 });
 test(`${algorithm}: recover missing/corrupt numeric state`, () => {
  for (const bad of [undefined, null, NaN, Infinity, -100, 1e300]) {
   const item = { ...mockPassage(start, true), interval: bad, easeFactor: bad, stability: bad, difficulty: bad, reviewCount: bad, beginnerStartedAtReview: bad, lastReviewed: 'bad' };
   const next = step(item, 'medium', algorithm, start);
   assert(Number.isFinite(next.interval)); assert(Number.isFinite(next.easeFactor)); assert(DateTime.fromISO(next.nextReview).isValid);
  }
 });
 test(`${algorithm}: early, overdue and burden bounds`, () => {
  const item = { ...mockPassage(start, false), interval: 30, reviewCount: 8, lastReviewed: start, nextReview: '2026-01-31', stability: 30, difficulty: 5 };
  for (const days of [0, 1, 29, 30, 31, 3650]) for (const rating of ['easy', 'medium', 'hard']) {
   const next = step(item, rating, algorithm, DateTime.fromISO(start).plus({ days }).toISODate());
   assert(Number.isFinite(next.interval)); assert(DateTime.fromISO(next.nextReview).isValid);
  }
  for (const horizon of [30, 90, 180, 365]) assert(reviewBurden(algorithm, start, false, ['medium'], horizon, 'UTC') <= horizon);
 });
}
test('FSRS reference vectors: initialization and unclamped mean reversion', () => {
 const first = step(mockPassage(start, false), 'medium');
 assert.equal(first.stability, 2.3065);
 assert(Math.abs(first.difficulty - (6.4133 - Math.exp(.8334 * 2) + 1)) < 1e-10);
 const next = step(first, 'medium');
 const r = (1 + (Math.pow(.9, -1 / .1542) - 1) * 2 / first.stability) ** -.1542;
 const expectedS = first.stability * (1 + Math.exp(1.8722) * (11 - first.difficulty) * first.stability ** -.1666 * (Math.exp(.796 * (1-r))-1));
 assert(Math.abs(next.stability - expectedS) < 1e-10);
 const expectedD = .001 * (6.4133 - Math.exp(.8334 * 3) + 1) + .999 * first.difficulty;
 assert(Math.abs(next.difficulty - expectedD) < 1e-10);
 const lapse = step(next, 'hard'); assert(lapse.stability < next.stability);
 assert.equal(step(mockPassage(start, false), 'hard').stability, .212);
});
test('Hifz follows interval tier instead of total review count', () => {
 let item = { ...mockPassage(start, false), reviewCount: 80, interval: 7, lastReviewed: start, nextReview: '2026-01-08' };
 assert.equal(step(item, 'medium', 'hifz').interval, 7);
 item = step(item, 'hard', 'hifz'); assert.equal(item.interval, 1);
 item = step(item, 'hard', 'hifz'); assert.equal(item.interval, 1);
 item = step(item, 'hard', 'hifz'); assert.equal(item.interval, 1);
});
test('algorithm switching clears synthetic FSRS metrics and safely bootstraps on return', () => {
 let item = step(mockPassage(start, false), 'easy');
 item = step(item, 'medium', 'classic'); assert.equal(item.stability, undefined); assert.equal(item.difficulty, undefined);
 item = step(item, 'easy', 'hifz'); assert.equal(item.stability, undefined);
 item = step(item, 'medium', 'adaptive'); assert(Number.isFinite(item.stability));
});
test('calendar dates survive western zones, DST and timestamp conversion', () => {
 assert.equal(toUserTimeZoneDate('2026-03-08', 'America/Los_Angeles'), '2026-03-08');
 assert.equal(toUserTimeZoneDate('2026-03-08T01:00:00Z', 'America/Los_Angeles'), '2026-03-07');
 for (const date of ['2026-03-08', '2026-11-01']) {
  const next = step(mockPassage(date, true), 'medium', 'adaptive', date, 'America/Los_Angeles');
  assert.equal(elapsedReviewDays(date, next.nextReview, 'America/Los_Angeles'), 1);
 }
 assert.equal(elapsedReviewDays('2026-03-07T23:59:00-08:00', '2026-03-08', 'America/Los_Angeles'), 1);
 assert.throws(() => step(mockPassage(start, false), 'easy', 'adaptive', 'invalid'));
 assert.throws(() => step({ ...mockPassage(start, false), lastReviewed: '2026-02-01' }, 'easy'));
});
test('ayah completion schedules once using weakest rating and retains passage identity', () => {
 const originalNow = Settings.now; Settings.now = () => Date.parse(start + 'T00:00:00Z');
 try {
  let item = { ...mockPassage(start, false), ayahEnd: 3 };
  const expected = step(item, 'hard');
  item = updateIndividualAyahRating(item, 1, 'easy', 'UTC').updatedItem;
  assert.equal(item.reviewCount, 0); assert.equal(item.lastReviewed, undefined);
  item = updateIndividualAyahRating(item, 2, 'hard', 'UTC').updatedItem;
  const result = updateIndividualAyahRating(item, 3, 'medium', 'UTC');
  assert.equal(result.shouldSplit, false); assert.equal(result.updatedItem.interval, expected.interval); assert.equal(result.updatedItem.reviewCount, 1);
  assert.equal(result.updatedItem.id, item.id);
  item = updateIndividualAyahRating(result.updatedItem, 1, 'easy', 'UTC').updatedItem;
  item = updateIndividualAyahRating(item, 2, 'easy', 'UTC').updatedItem;
  item = updateIndividualAyahRating(item, 3, 'easy', 'UTC').updatedItem;
  assert.equal(item.reviewCount, 2);
  assert.throws(() => updateIndividualAyahRating(item, 4, 'easy'));
 } finally { Settings.now = originalNow; }
});
test('simulator isolation: explicit scheduling never reads or writes browser storage', () => {
 global.window = {}; global.localStorage = new Proxy({}, { get() { throw new Error('Storage access forbidden'); } });
 try {
  for (const algorithm of ALGORITHMS) {
   const events = presetEvents('Mixed performance', algorithm, start, true, 'UTC');
   simulate(algorithm, start, true, events, 'UTC');
   reviewBurden(algorithm, start, true, ['easy'], 365, 'UTC');
  }
 } finally { delete global.window; delete global.localStorage; }
});
test('local persistence round-trip retains beginner zero marker and FSRS state', () => {
 const storage = require('../src/lib/storage.ts');
 const values = new Map();
 global.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
 try {
  const item = step(mockPassage(start, true), 'medium');
  storage.addMemorizationItem(item);
  assert.deepEqual(storage.getMemorizationItem(item.id), JSON.parse(JSON.stringify(item)));
  assert.equal(storage.getMemorizationItem(item.id).beginnerStartedAtReview, 0);
  const old = { ...mockPassage(start, false), stability: undefined, difficulty: undefined };
  storage.addMemorizationItem(old);
  assert(Number.isFinite(step(storage.getMemorizationItem(old.id), 'easy').stability));
 } finally { delete global.localStorage; }
});
test('fixed-date before/after fixtures guard documented results', () => {
 const fixture = require('../docs/scheduler-before-after.json');
 const events = fixture.dates.map((date, i) => ({ date, rating: fixture.ratings[i] }));
 for (const algorithm of ALGORITHMS) {
  const rows = simulate(algorithm, fixture.dates[0], false, events, 'UTC');
  assert.deepEqual(rows.map(r => r.after.interval), fixture.algorithms[algorithm].after.map(r => r.interval));
 }
});
test('same-day Classic/Hifz successes retain next due and invalid due dates are repaired', () => {
 for (const algorithm of ['classic', 'hifz']) {
  const item = step(mockPassage(start, false), 'easy', algorithm);
  const next = step(item, 'easy', algorithm, item.lastReviewed);
  assert.equal(next.nextReview, item.nextReview);
  assert.equal(next.interval, item.interval);
  const repaired = step({ ...item, nextReview: 'bad' }, 'easy', algorithm, item.lastReviewed);
  assert(DateTime.fromISO(repaired.nextReview).isValid);
 }
});
test('legacy reviewed item missing lastReviewed advances out of overdue state', () => {
 for (const algorithm of ALGORITHMS) {
  const item = { ...mockPassage(start, false), reviewCount: 9, interval: 7, nextReview: '2025-01-01' };
  const next = step(item, 'medium', algorithm, start);
  assert(next.nextReview > start);
 }
});
test('daily recitation policy prevents massed Easy inflation but permits same-day lapse', () => {
 let item = step(mockPassage(start, false), 'easy');
 const first = item;
 for (let i = 0; i < 100; i++) item = step(item, 'easy', 'adaptive', start);
 assert.equal(item.stability, first.stability); assert.equal(item.difficulty, first.difficulty);
 assert.equal(item.nextReview, first.nextReview); assert.equal(item.interval, first.interval);
 item = step(item, 'hard', 'adaptive', start);
 assert(item.stability < first.stability);
});
test('same-day beginner re-entry applies a real cap to interval AND due date', () => {
 for (const algorithm of ALGORITHMS) {
  const item = { ...mockPassage(start, true), reviewCount: 20, beginnerStartedAtReview: 20, interval: 180, nextReview: '2026-06-30', lastReviewed: start, stability: 180, difficulty: 3 };
  const next = step(item, 'easy', algorithm, start);
  assert.equal(next.interval, 1); assert.equal(next.nextReview, '2026-01-02'); assert(next.isBeginner);
 }
});
