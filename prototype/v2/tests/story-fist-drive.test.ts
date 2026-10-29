import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fistTrack,findBursts,noiseEnvelope,createFistDrive,CLOSE_S,OPEN_S} from '../src/story/noise/fistDrive';

// S-14: constant-speed fist driven by the stored noise bursts
test('a 0.2 s burst closes the fist to 0.2/CLOSE_S, then it opens at the opening speed',()=>{
 const f=fistTrack([{start:1,end:1.2,peak:1}],3);
 const peak=Math.max(...f);assert.ok(Math.abs(peak-.2/CLOSE_S)<.02,`peak ${peak}`);
 assert.equal(f[99],0);                                          // before the burst: open
 assert.ok(f[120+Math.ceil(.2/CLOSE_S*OPEN_S*100)+1]<.01,'open again after peak × OPEN_S');
});
test('a long burst holds the fist shut and opens after it ends',()=>{
 const f=fistTrack([{start:1,end:2.5,peak:1}],4);
 assert.equal(f[200],1);assert.equal(f[249],1);assert.ok(f[270]<.6&&f[270]>.3);assert.equal(f[300],0);
});
test('bursts follow the stored noise (input − clean): two separated bursts found at their times',()=>{
 const fs=500,n=fs*6,clean=new Float32Array(n),input=new Float32Array(n);
 for(let i=0;i<n;i++){const t=i/fs;clean[i]=Math.sin(2*Math.PI*1.2*t);input[i]=clean[i]+.01*Math.sin(i*1.7)+((t>1&&t<1.25)||(t>3&&t<4)?.6*Math.sin(2*Math.PI*90*t):0);}
 const b=findBursts(noiseEnvelope(input,clean,fs),fs);
 assert.equal(b.length,2);assert.ok(Math.abs(b[0].start-1)<.08&&Math.abs(b[0].end-1.25)<.08,JSON.stringify(b));
 assert.ok(Math.abs(b[1].start-3)<.08&&Math.abs(b[1].end-4)<.08);
 const d=createFistDrive(input,clean,fs);
 assert.ok(d.fist(1.2)>.25&&d.fist(1.2)<.5);assert.ok(d.fist(3.9)>.99);assert.ok(d.fist(2.5)<.01);
 assert.equal(d.burstAt(3.5)?.active,true);assert.equal(d.burstAt(4.5)?.active,false);
});
