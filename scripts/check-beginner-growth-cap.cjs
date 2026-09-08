// EXPERIMENT ONLY: a hypothetical interval guard around the real scheduler.
// Not imported by production or the app's simulator. No memory formulas are duplicated.
require('../tests/register.cjs');
const { DateTime } = require('luxon');
const calculateReviewInterval = require('./lib/load-scheduler-baseline.cjs').loadBaselineScheduler();
const { mockPassage } = require('../src/lib/reviewSimulator.ts');
const { run, scenarios, ratingFor } = require('./check-beginner-workflow.cjs');
const start = '2026-01-01', zone = 'America/Los_Angeles';
function candidate(name) {
 let item = mockPassage(start, true);
 const rows = [];
 for (let i = 0; i < 30; i++) {
  const date = item.nextReview;
  const rating = ratingFor(name, i);
  const next = calculateReviewInterval(item, rating, {algorithm:'adaptive'}, zone, date);
  // This experiment follows due dates only. It is not a general production implementation.
  if (item.reviewCount > 0 && rating !== 'hard') {
   next.interval = Math.min(next.interval, item.interval * 2);
   next.nextReview = DateTime.fromISO(date, {zone}).plus({days:next.interval}).toISODate();
  }
  rows.push({day:Math.round(DateTime.fromISO(date,{zone}).diff(DateTime.fromISO(start,{zone}),'days').days), rating, interval:next.interval, beginner:next.isBeginner});
  item = next;
 }
 return {name, rows, burden:Object.fromEntries([30,90,180,365].map(h=>[h,rows.filter(r=>r.day<h).length]))};
}
if (require.main === module) console.log(JSON.stringify({warning:'Hypothetical 2x guard; NOT deployed. Changes scheduling dates, not FSRS stability/difficulty. Not a calibrated optimum.', scenarios:Object.keys(scenarios).map(name=>({name, baseline:run(name), candidate:candidate(name)}))},null,2));
module.exports = {candidate};
