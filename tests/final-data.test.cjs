const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),core=require('../prototype/core.js');
const context=vm.createContext({window:{}});
for(const name of ['bank','extension'])vm.runInContext(fs.readFileSync(path.join(root,`data/${name}.js`),'utf8'),context);
const bank=context.window.ECG_BANK;
assert.equal(bank.scenes.length,98);assert.equal(bank.methods.length,11);
let maxDifference=0,metricsChecked=0,maxReferenceDrift=0,minNoiseCorrelation=1;
const decoded=new Map();
for(const s of bank.scenes){
 const traces=Object.fromEntries(Object.entries(s.traces).map(([k,v])=>[k,core.decode(v,s.scale,bank.n)]));decoded.set(s.id,traces);
 for(const method of bank.methods){
  const m=core.metrics(traces.clean,traces[method],traces.input);assert.ok(m,`${s.id}/${method}`);
  const diff=Math.abs(m.scaled-s.storedMetrics[method].snr_out);maxDifference=Math.max(diff,maxDifference);
  assert.ok(diff<.03,`${s.id}/${method}: ${diff}`);metricsChecked++;
 }
}
for(const axis of ['d0','d1'])for(const cond of bank.conditions){
 const scenes=bank.scenes.filter(s=>s.axis===axis&&s.cond===cond);assert.equal(scenes.length,7);
 assert.equal(new Set(scenes.map(s=>s.record)).size,1);
 const base=scenes.find(s=>s.snr===10),a=decoded.get(base.id);
 for(const s of scenes){
  const b=decoded.get(s.id),drift=Math.max(...b.clean.map((v,i)=>Math.abs(v-a.clean[i])));
  maxReferenceDrift=Math.max(drift,maxReferenceDrift);assert.ok(drift<=(s.scale+base.scale)*.51+1e-10);
 }
 // Differences between adjacent SNR input arrays remove the shared raw ECG, leaving the same noise shape.
 scenes.sort((a,b)=>a.snr-b.snr);const differences=[];
 for(let i=1;i<scenes.length;i++){const hi=decoded.get(scenes[i].id).input,lo=decoded.get(scenes[i-1].id).input;differences.push(hi.map((v,j)=>lo[j]-v));}
 for(const d of differences.slice(1)){const cc=core.metrics(differences[0],d)?.cc;assert.ok(cc>.9999,`${axis}/${cond}: noise correlation ${cc}`);minNoiseCorrelation=Math.min(minNoiseCorrelation,cc);}
}
const report={status:'PASS',scenes:98,traceArrays:98*13,metricsChecked,maxScaledSnrDifferenceDb:maxDifference,maxReferenceDriftMv:maxReferenceDrift,minAdjacentNoiseDifferenceCorrelation:minNoiseCorrelation,interpretation:'Differences are consistent with shared noise realization across SNR within each condition, allowing int16 quantization. This does not verify current-code model reruns.'};
fs.mkdirSync(path.join(root,'verification'),{recursive:true});fs.writeFileSync(path.join(root,'verification/final-data-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
