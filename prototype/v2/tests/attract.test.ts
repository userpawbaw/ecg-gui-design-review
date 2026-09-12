import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Transport} from '../src/engine';
test('Attract repeats only its declared interval and handoff keeps source time',()=>{
 const t=new Transport();t.duration=600;t.seek(110);t.loopRange={start:110,end:120};t.play();t.tick(0);t.tick(11500);assert.equal(t.time,111.5);
 t.loopRange=null;const handoff=t.time;t.tick(12500);assert.equal(t.time,handoff+1);assert.equal(t.duration,600);
});
