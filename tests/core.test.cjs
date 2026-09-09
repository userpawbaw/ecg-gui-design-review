const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../independent/core.js');
const close=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const r=Float64Array.from([-2,-1,0,1,2]);
const m=core.metrics(r,r.map(x=>x*.5+7));
close(m.alpha,2);close(m.cc,1);close(m.strict,6.020599913279624);assert.equal(m.scaled,Infinity);
assert.equal(core.metrics([1,1],[2,2]),null);
assert.equal(core.metrics([1,2],[1,NaN]),null);
assert.equal(core.metrics([1,2],[1]),null);
const zero=core.metrics(r,r.map(()=>0));assert.equal(zero.alpha,null);assert.equal(zero.cc,null);assert.equal(zero.scaled,-Infinity);
assert.deepEqual(core.selection(20,1.2,250,2500),{first:2200,last:2500,start:8.8,length:1.2,end:10,duration:10});
assert.equal(core.selection(-1,1.2,250,2500).first,0);
assert.equal(core.selection(NaN,0,250,2500).last,2);
const b64=Buffer.from([0,128,255,255,0,0,255,127]).toString('base64');
assert.deepEqual(Array.from(core.decode(b64,.001,4)),[-32.768,-.001,0,32.767]);
assert.throws(()=>core.decode(b64,.001,5));
const text=fs.readFileSync(require.resolve('../data/bank.js'),'utf8');
const bank=JSON.parse(text.slice(text.indexOf('=')+1,text.lastIndexOf(';')));
assert.equal(bank.scenes.length,48);
let maxDiff=0;
for(const s of bank.scenes){
  const ref=core.decode(s.traces.clean,s.scale,bank.n),input=core.decode(s.traces.input,s.scale,bank.n);
  for(const method of bank.methods){
    const output=core.decode(s.traces[method],s.scale,bank.n),v=core.metrics(ref,output,input);
    assert.ok(v);maxDiff=Math.max(maxDiff,Math.abs(v.scaled-s.storedMetrics[method].snr_out));
    // Stored metrics are rounded to two decimals; traces also have int16 quantization.
    assert.ok(Math.abs(v.scaled-s.storedMetrics[method].snr_out)<.03,`${s.id}/${method}`);
  }
}
for(const axis of ['d0','d1'])for(const cond of bank.conditions){
  const group=bank.scenes.filter(s=>s.axis===axis&&s.cond===cond);assert.equal(group.length,6);
  assert.equal(new Set(group.map(s=>s.record)).size,1);
}
console.log(JSON.stringify({status:'PASS',scenes:48,outputMetricsChecked:336,maxScaledSnrDifferenceDb:maxDiff,knownInputCases:10}));
