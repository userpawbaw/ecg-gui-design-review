// S-05: 4 shells on eighth notes, 5 eighths of travel only, twice; shells never stop and fade with distance.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emissionTimes,shell,EIGHTH,LIFE} from '../src/story/noise/fieldPulse';
test('emission rhythm: 4 + rest 5 eighths, two groups',()=>{
 const e=emissionTimes(10);assert.equal(e.length,8);
 const gaps=e.slice(1).map((v,i)=>+(v-e[i]).toFixed(6));assert.deepEqual(gaps,[EIGHTH,EIGHTH,EIGHTH,6*EIGHTH,EIGHTH,EIGHTH,EIGHTH].map(v=>+v.toFixed(6)));
});
test('no pause: from the first emission to the last shell, something is always expanding',()=>{
 const e=emissionTimes(0),end=e[e.length-1]+LIFE;
 for(let t=0;t<end-.05;t+=.02){
  const grow=e.some(x=>{const a=shell(t,x,1.5),b=shell(t+.02,x,1.5);return a&&b&&b.r>a.r+1e-5;});assert.ok(grow,'expanding at '+t.toFixed(2));}
});
test('fades with distance and never pops in',()=>{
 let prev=Infinity;for(let a=.2;a<LIFE;a+=.1){const s=shell(a,0,1.5)!;assert.ok(s.a<=prev+1e-9);prev=s.a;}
 assert.ok(shell(.01,0,1.5)!.a<.15);assert.equal(shell(LIFE+.01,0,1.5),null);
});
