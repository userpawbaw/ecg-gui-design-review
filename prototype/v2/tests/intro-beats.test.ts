import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {decode} from '../src/engine';
import {detectR,makeLoop,sampleAt,beatPhase} from '../src/story/intro/beats';
const file=new URL('../public/archive.json',import.meta.url);
const bank=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null;
const skip=!bank&&'run scripts/prepare-v2.cjs first';

test('R peaks of D0 S038 include the ectopic beat and give real R–R intervals (D-041)',{skip},()=>{
 const s=bank.scenes.find((x:{id:string})=>x.id==='d0-awgn-0');assert.equal(s.record,'S038');
 const r=detectR(decode(s.traces.clean,s.scale,bank.n),bank.fs);
 assert.equal(r.length,17);
 const rr=r.slice(1).map((v,i)=>(v-r[i])*1000/bank.fs);
 assert.ok(rr.every(v=>v>=540&&v<=662),'R–R '+rr.join(','));
 assert.ok(r.some(i=>Math.abs(i/bank.fs-1.88)<.02),'wide negative beat near 1.88 s found');
});

test('loop seam keeps a real R–R interval and a small jump on every shown trace',{skip},()=>{
 const s=bank.scenes.find((x:{id:string})=>x.id==='d0-awgn-0');
 const tr=['clean','input','M06'].map(k=>decode(s.traces[k],s.scale,bank.n));
 const r=detectR(tr[0],bank.fs),l=makeLoop(r,tr,bank.fs);
 const rrSet=new Set(r.slice(1).map((v,i)=>v-r[i]));
 const last=l.beats[l.beats.length-1],first=l.beats[0];
 assert.ok(rrSet.has((l.end-last)+(first-l.start)),'seam interval is one of the record intervals');
 assert.ok(tr.every(t=>Math.abs(t[l.end]-t[l.start])<.06),'seam jump < 0.06 mV');
 assert.ok((l.end-l.start)/bank.fs>8,'loop longer than 8 s');
});

test('beat phase and sample index use the same clock',()=>{
 const l={start:100,end:600,beats:[150,300,450]},fs=250;
 for(const t of [0,.2,.6,1.19,2.01,5.3,150/250,2*500/250+300/250]){
  const p=beatPhase(l,fs,t);assert.ok(p.sincePrev>=0&&p.untilNext>0);
  const idx=sampleAt(l,fs,p.prev);assert.ok(l.beats.includes(idx),`R at prev (${p.prev}) → sample ${idx}`);
  if(l.beats.includes(sampleAt(l,fs,t)))assert.equal(p.sincePrev<1e-9,true,'on an R sample the beat starts now');
 }
});
