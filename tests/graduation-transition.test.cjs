const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateReviewInterval: review, adaptiveTransitionProgress: progress } = require('../src/lib/reviewAlgorithms.ts');
const { mockPassage, simulate } = require('../src/lib/reviewSimulator.ts');
const { run, definitions } = require('../scripts/evaluate-graduation-candidates.cjs');
const { production } = require('../scripts/verify-graduation-transition.cjs');
const baseline = require('../scripts/lib/load-scheduler-baseline.cjs').loadBaselineScheduler();
const settings={algorithm:'adaptive'}, zone='America/Los_Angeles';
const apply=(item,rating='easy',date=item.nextReview)=>review(item,rating,settings,zone,date);
function graduate(rating='easy') {let item=mockPassage('2026-01-01',true);for(let i=0;i<5;i++) item=apply(item,rating);return item;}
for(const name of Object.keys(definitions)) test(`integrated transition matches isolated candidate: ${name}`,()=>{
 const actual=production(name), expected=run('relaxingGrowth',name);
 assert.deepEqual(actual.rows.map(r=>[r.day,r.rating,r.interval,r.stability,r.beginner]),expected.rows.map(r=>[r.day,r.rating,r.interval,r.stability,r.beginner]));
 assert.deepEqual(actual.burden,expected.burden);
});
test('transition keeps FSRS memory, differentiates ratings, and resets on failure',()=>{
 const item=graduate();assert.equal(progress(item),0);
 for(const rating of ['easy','medium','hard']) {
  const actual=apply(item,rating), model=baseline(item,rating,settings,zone,item.nextReview);
  assert.equal(actual.stability,model.stability);assert.equal(actual.difficulty,model.difficulty);
  assert.equal(actual.interval,{easy:10,medium:8,hard:1}[rating]);
 }
 assert.equal(apply(item,'hard').isBeginner,true);
});
test('same-day transition spam cannot change future growth, memory or phase',()=>{
 let control=graduate(), spam=control;
 for(let i=0;i<100;i++) spam=apply(spam,'easy',control.lastReviewed);
 assert.equal(progress(spam),progress(control));
 for(let i=0;i<10;i++) {
  for(const key of ['interval','nextReview','stability','difficulty','isBeginner']) assert.equal(spam[key],control[key],key);
  assert.equal(progress(spam),progress(control));
  control=apply(control);spam=apply(spam);
 }
});
test('early reviews do not advance transition or postpone existing due date',()=>{
 const item=graduate(); const early=apply(item,'easy','2026-01-08');
 assert.equal(progress(early),0); assert.equal(early.interval,item.interval);assert.equal(early.nextReview,item.nextReview);
});
test('mature legacy records remain unrestricted; transition persists through JSON',()=>{
 const item=graduate();assert.deepEqual(apply(JSON.parse(JSON.stringify(item))),apply(item));
 const mature={...item,beginnerStartedAtReview:undefined};
 for(const rating of ['easy','medium','hard']) assert.deepEqual(apply(mature,rating),baseline(mature,rating,settings,zone,mature.nextReview));
 for(const offset of [undefined,NaN,Infinity,-1,1000,1.5]) {
  const legacy={...mature,beginnerStartedAtReview:offset};assert.equal(progress(apply(legacy)),undefined);
 }
});
test('transition releases permanently and mature lapses retain normal FSRS behavior',()=>{
 for(const rating of ['easy','medium']) {
  let item=graduate(rating), n=0;
  while(progress(item)!==undefined && n++<20) item=apply(item,rating);
  assert(n<20);assert.equal(item.interval,365);
  assert.deepEqual(apply(item,'hard'),baseline(item,'hard',settings,zone,item.nextReview));
  assert.equal(apply(item,'hard').isBeginner,false);
 }
});
test('switching away clears bridge and simulator replays production exactly',()=>{
 const item=graduate();
 for(const algorithm of ['classic','hifz']) assert.equal(review(item,'easy',{algorithm},zone,item.nextReview).beginnerStartedAtReview,undefined);
 let current=mockPassage('2026-01-01',true); const events=[];
 for(let i=0;i<12;i++){events.push({date:current.nextReview,rating:i===7?'hard':'easy'});current=apply(current,events.at(-1).rating);}
 assert.deepEqual(simulate('adaptive','2026-01-01',true,events,zone).at(-1).after,current);
});
test('shared-date before/after comparison preserves FSRS memory for successful reviews',()=>{
 let old=mockPassage('2026-01-01',true), current=old;
 for(const [i,date] of ['2026-01-01','2026-01-02','2026-01-03','2026-01-05','2026-01-08','2026-01-13','2026-01-23','2026-02-17'].entries()) {
  const rating=i%3===0?'medium':'easy';
  old=baseline(old,rating,settings,zone,date);current=apply(current,rating,date);
  assert.equal(current.stability,old.stability);assert.equal(current.difficulty,old.difficulty);
  assert(current.interval<=old.interval);
 }
});
