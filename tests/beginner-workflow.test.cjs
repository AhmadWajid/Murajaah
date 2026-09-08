const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DateTime } = require('luxon');
const { calculateReviewInterval } = require('../src/lib/reviewAlgorithms.ts');
const { mockPassage } = require('../src/lib/reviewSimulator.ts');
const { run } = require('../scripts/check-beginner-workflow.cjs');

// Production regression checks for the temporary graduation transition.
test('beginner graduation leads to 10-day Easy / 8-day Medium transition gaps', () => {
 for (const [scenario, interval] of [['strong', 10], ['repeatedMedium', 8]]) {
  const rows = run(scenario).rows;
  assert.deepEqual(rows.slice(0, 6).map(r => r.day), [0, 1, 2, 4, 7, 12]);
  assert.equal(rows[3].beginner, true);
  assert.equal(rows[4].beginner, false);
  assert.equal(rows[4].interval, 5);
  assert.equal(rows[5].interval, interval);
  assert(rows[4].stability > rows[4].interval);
  assert(rows.at(-1).day > 365, 'run must cover all reported horizons');
 }
});

test('an unrecorded Day-0 recitation does not invent a review before first Day-1 rating', () => {
 const rows = run('strong', 1).rows;
 assert.deepEqual(rows.slice(0, 6).map(r => r.day), [1, 2, 3, 5, 8, 13]);
 assert.equal(rows[4].beginner, false);
 assert.equal(rows[5].interval, 10);
});

test('100 same-day Easy actions leave the entire subsequent due-only beginner path unchanged', () => {
 const zone = 'America/Los_Angeles';
 let control = mockPassage('2026-03-01', true);
 const review = (item, date = item.nextReview) => calculateReviewInterval(item, 'easy', { algorithm: 'adaptive' }, zone, date);
 control = review(control);
 let practice = control;
 for (let i = 0; i < 100; i++) practice = review(practice, '2026-03-01');
 for (let i = 0; i < 8; i++) {
  for (const field of ['nextReview', 'interval', 'stability', 'difficulty', 'isBeginner']) assert.equal(practice[field], control[field], field);
  assert.equal(practice.reviewCount - control.reviewCount, 100);
  control = review(control);
  practice = review(practice);
 }
});

test('early failures delay graduation and mature lapse recovers without erasing memory', () => {
 const early = run('earlyFailure').rows;
 assert.equal(early[1].rating, 'hard');
 assert.equal(early[1].interval, 1);
 assert(early.slice(1, 6).every(r => r.beginner));
 assert.equal(early[6].beginner, false);
 const rows = run('forgotten').rows;
 assert.equal(rows[6].day, 22);
 assert.equal(rows[6].rating, 'hard');
 assert.equal(rows[6].interval, 1);
 assert(rows[6].stability < rows[5].stability);
 assert.deepEqual(rows.slice(7, 10).map(r => r.interval), [1, 1, 2]);
 assert(rows[6].beginner, 'failure during transition restores beginner reinforcement');
});

test('whole beginner-to-adaptive timeline survives spring/fall DST and zone changes', () => {
 for (const start of ['2026-03-01', '2026-10-25']) {
  for (const zone of ['UTC', 'America/Los_Angeles', 'Europe/London', 'Asia/Riyadh']) {
   let item = mockPassage(start, true);
   const days = [];
   for (let i = 0; i < 7; i++) {
    days.push(Math.round(DateTime.fromISO(item.nextReview, {zone}).diff(DateTime.fromISO(start, {zone}), 'days').days));
    item = calculateReviewInterval(item, 'easy', {algorithm: 'adaptive'}, zone, item.nextReview);
   }
   assert.deepEqual(days, [0, 1, 2, 4, 7, 12, 22]);
  }
 }
});

test('hypothetical growth guard keeps early contacts and graduates to 10 days without daily trapping', () => {
 const { candidate } = require('../scripts/check-beginner-growth-cap.cjs');
 for (const name of ['strong', 'repeatedMedium']) {
  const result = candidate(name);
  assert.deepEqual(result.rows.slice(0, 6).map(r => r.day), [0, 1, 2, 4, 7, 12]);
  assert.deepEqual(result.rows.slice(5, 11).map(r => r.interval), [10, 20, 40, 80, 160, 320]);
  assert.deepEqual(Object.values(result.burden), [7, 9, 10, 11]);
 }
});
