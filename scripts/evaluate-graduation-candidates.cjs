// Phase-one experiment: production memory equations, hypothetical scheduling overlays only.
require('../tests/register.cjs');
const { DateTime } = require('luxon');
const { loadBaselineScheduler } = require('./lib/load-scheduler-baseline.cjs');
const calculateReviewInterval = loadBaselineScheduler();
const { mockPassage } = require('../src/lib/reviewSimulator.ts');
const { adaptiveTransitionProgress } = require('../src/lib/reviewAlgorithms.ts');
const START = '2026-01-01', ZONE = 'America/Los_Angeles';
const definitions = {
 easy: {prefix:[], tail:['easy']},
 medium: {prefix:[], tail:['medium']},
 mixed: {prefix:['medium','medium','easy','medium','easy'],tail:['easy','medium','medium','easy','hard','medium','easy']},
 deepRecovery: {prefix:['hard','hard','hard','hard','medium','medium','medium','medium','medium'],tail:['easy','medium']},
 earlyFailure: {prefix:['medium','hard','medium','easy','easy'],tail:['medium','easy']},
 immediateLapse: {prefix:['easy','easy','easy','easy','easy','hard'],tail:['medium','easy']},
 laterLapse: {prefix:['easy','easy','easy','easy','easy','easy','easy','easy','hard'],tail:['medium','medium','easy']},
 overdue: {prefix:['medium','medium','easy','medium','easy'],tail:['easy','medium'], delay:i=>i===5?30:i===7?60:0},
 sameDay: {prefix:[],tail:['easy'],sameDay:true},
};
const ratingFor = (scenario, i) => scenario.prefix[i] ?? scenario.tail[(i-scenario.prefix.length)%scenario.tail.length];
const day = date => Math.round(DateTime.fromISO(date,{zone:ZONE}).diff(DateTime.fromISO(START,{zone:ZONE}),'days').days);
function run(policy, name, scheduler = calculateReviewInterval) {
 const scenario=definitions[name];
 let item=mockPassage(START,true), stage=null, phaseSuccesses=0;
 const rows=[];
 for(let i=0;i<(scenario.sameDay?100:512);i++) {
  const date=scenario.sameDay?START:DateTime.fromISO(item.nextReview,{zone:ZONE}).plus({days:scenario.delay?.(i)??0}).toISODate();
  const rating=ratingFor(scenario,i);
  const before=item;
  let next=scheduler(item,rating,{algorithm:'adaptive'},ZONE,date);
  const spaced= !item.lastReviewed || item.lastReviewed<date;
  let rawInterval=scheduler === calculateReviewInterval ? next.interval : calculateReviewInterval(item,rating,{algorithm:'adaptive'},ZONE,date).interval;
  let released=false;
  if(stage!==null && spaced) {
   // Failures during a bridge restart the existing beginner layer, not memory state.
   if(rating==='hard') {
    next={...next,interval:1,isBeginner:true,beginnerStartedAtReview:next.reviewCount};
    stage=null; phaseSuccesses=0;
   } else {
    let ceiling;
    if(policy==='extraSteps') ceiling=[7,14,30][phaseSuccesses] ?? rawInterval;
    if(policy==='blend') ceiling=Math.round(before.interval+(rawInterval-before.interval)*Math.min(1,(phaseSuccesses+1)/4));
    if(policy==='fixedGrowth') ceiling=Math.round(before.interval*(rating==='easy'?2:1.5));
    if(policy==='relaxingGrowth') ceiling=Math.round(before.interval*((rating==='easy'?2:1.5)+phaseSuccesses*.5));
    if(ceiling!==undefined) next.interval=Math.min(rawInterval,ceiling);
    phaseSuccesses++;
    if(rawInterval<=next.interval || (policy==='extraSteps'&&phaseSuccesses>=3) || (policy==='blend'&&phaseSuccesses>=4)) {stage=null;released=true;}
   }
  }
  if(before.isBeginner && !next.isBeginner) {
   if(policy==='resetStability') next.stability=Math.min(next.stability,next.interval);
   else if(policy!=='baseline') {stage='bridge';phaseSuccesses=0;}
  }
  next.nextReview=DateTime.fromISO(date,{zone:ZONE}).plus({days:next.interval}).toISODate();
  rows.push({review:i+1,day:day(date),rating,interval:next.interval,rawInterval,stability:next.stability,beginner:next.isBeginner,transition:stage!==null || (scheduler !== calculateReviewInterval && adaptiveTransitionProgress(next)!==undefined),released:released || (scheduler !== calculateReviewInterval && adaptiveTransitionProgress(before)!==undefined && adaptiveTransitionProgress(next)===undefined && !next.isBeginner)});
  item=next;
  if(!scenario.sameDay && rows.length>=18 && day(date)>=365) break;
 }
 return {policy,name,rows,burden:Object.fromEntries([30,90,180,365].map(h=>[h,rows.filter(r=>r.day<h).length])),firstRelease:rows.find(r=>r.released)?.day??null};
}
const policies=['baseline','resetStability','extraSteps','blend','fixedGrowth','relaxingGrowth'];
if(require.main===module) console.log(JSON.stringify({note:'Isolated candidate overlays; no production changes. Review horizons exclude endpoint. Same-day is deliberately a spam scenario, not due-date workload.',results:policies.flatMap(p=>Object.keys(definitions).map(n=>run(p,n)))},null,2));
module.exports={run,definitions,policies};
