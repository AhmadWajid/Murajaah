// Read-only historical production implementation, not a maintained second scheduler.
// Pin this commit so rerunning experiments after integration still compares the real baseline.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const baselineRevision = '00fbeda';
let cached;
function loadBaselineScheduler() {
 if (cached) return cached;
 const source = execFileSync('git', ['show', `${baselineRevision}:src/lib/reviewAlgorithms.ts`], {cwd:root, encoding:'utf8'});
 const filename = path.join(root, 'src/lib/reviewAlgorithms.baseline.ts');
 const snapshot = new Module(filename, module);
 snapshot.filename = filename;
 snapshot.paths = Module._nodeModulePaths(path.dirname(filename));
 snapshot._compile(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText, filename);
 cached = snapshot.exports.calculateReviewInterval;
 return cached;
}
module.exports = { loadBaselineScheduler, baselineRevision };
