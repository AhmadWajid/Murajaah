// Before/after runs use the same rating sequences, each on its own due dates.
require('../tests/register.cjs');
const { run, definitions } = require('./evaluate-graduation-candidates.cjs');
const { calculateReviewInterval } = require('../src/lib/reviewAlgorithms.ts');
function production(name) {
 const result = run('baseline', name, calculateReviewInterval);
 // run('baseline') applies no hypothetical overlay.
 result.policy='production';
 return result;
}
if(require.main===module) console.log(JSON.stringify({note:'Day zero is included; horizon endpoint excluded. Conditional rating scenarios, not retention predictions.',results:Object.keys(definitions).map(name=>({name,before:run('baseline',name),after:production(name)}))},null,2));
module.exports={production};
