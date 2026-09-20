import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveAttractVariant,finishAttractTransport} from '../src/attract-variants';
import {Transport} from '../src/engine';

test('Attract variant query values are explicit and unknown values roll back to baseline',()=>{
 assert.equal(resolveAttractVariant('?attractVariant=question'),'question');
 assert.equal(resolveAttractVariant('?attractVariant=orbit'),'orbit');
 assert.equal(resolveAttractVariant('?attractVariant=exhibition'),'exhibition');
 assert.equal(resolveAttractVariant('?attractVariant=unknown'),'baseline');
 assert.equal(resolveAttractVariant(''),'baseline');
});

test('V3 handoff preserves transport time, playback and loop range without seeking',()=>{
 const transport=new Transport();
 transport.duration=600;
 transport.loopRange={start:110,end:120};
 transport.seek(114.25);
 transport.play();
 const loop=transport.loopRange;
 const before=transport.time;
 const result=finishAttractTransport(transport,'exhibition');
 assert.equal(transport.time,before);
 assert.equal(transport.playing,true);
 assert.equal(transport.loopRange,loop);
 assert.deepEqual(result,{time:114.25,playing:true,loopRange:{start:110,end:120}});
});

test('baseline handoff retains the v2.2.1 loop-clear rollback behavior',()=>{
 const transport=new Transport();
 transport.loopRange={start:0,end:10};
 finishAttractTransport(transport,'baseline');
 assert.equal(transport.loopRange,null);
});
