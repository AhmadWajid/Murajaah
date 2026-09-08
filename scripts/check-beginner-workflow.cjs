// Synthetic due-only scenarios. Uses the production simulator and scheduler, never storage.
require('../tests/register.cjs');
const { DateTime } = require('luxon');
const { mockPassage, simulate } = require('../src/lib/reviewSimulator.ts');
const start = '2026-01-01';
const zone = 'America/Los_Angeles';
const scenarios = {
 strong: ['easy', 'easy', 'easy', 'easy', 'easy'],
 normal: ['medium', 'medium', 'easy', 'medium', 'easy'],
 shaky: ['easy', 'easy', 'medium', 'medium', 'easy'],
 earlyFailure: ['medium', 'hard', 'medium', 'easy', 'easy'],
 immediateDifficulty: ['hard', 'medium', 'medium', 'easy', 'easy'],
 repeatedMedium: ['medium'],
 forgotten: ['easy', 'easy', 'easy', 'easy', 'easy', 'easy', 'hard', 'medium', 'medium', 'easy', 'easy'],
 matureLapse: ['easy', 'easy', 'easy', 'easy', 'easy', 'easy', 'easy', 'hard', 'medium', 'medium', 'easy', 'easy'],
};
const day = date => Math.round(DateTime.fromISO(date, {zone}).diff(DateTime.fromISO(start, {zone}), 'days').days);
function ratingFor(name, index) {
 const pattern = scenarios[name];
 if (index < pattern.length) return pattern[index];
 if (name === 'strong') return 'easy';
 if (['forgotten', 'matureLapse', 'repeatedMedium'].includes(name)) return 'medium';
 return ['medium', 'easy'][index % 2];
}
function run(name, firstDay = 0, count = 18) {
 let date = DateTime.fromISO(start, {zone}).plus({days:firstDay}).toISODate();
 let events = [];
 let rows = [];
 for (let i = 0; i < count; i++) {
  const rating = ratingFor(name, i);
  events.push({date, rating});
  rows = simulate('adaptive', start, true, events, zone);
  date = rows.at(-1).after.nextReview;
 }
 return {name, firstDay, rows:rows.map((r,i) => ({review:i+1, day:day(r.event.date), rating:r.event.rating, interval:r.after.interval, dueDay:day(r.after.nextReview), beginner:r.after.isBeginner, stability:Number(r.after.stability.toFixed(3)), difficulty:Number(r.after.difficulty.toFixed(3))})), burden:Object.fromEntries([14,30,90,180,365].map(h => [h, rows.filter(r=>day(r.event.date)<h).length]))};
}
if (require.main === module) console.log(JSON.stringify({start, zone, notes:'Day 0 is memorization/addition; app creates an immediately due item. Counts use [0,horizon). Prefix followed by declared continuation in script.', scenarios:Object.keys(scenarios).map(name => run(name)), delayedFirst:run('strong',1)}, null, 2));
module.exports = {run, scenarios, ratingFor};
