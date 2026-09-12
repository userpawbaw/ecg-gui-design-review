import {test} from 'node:test';
import assert from 'node:assert/strict';
import {amplitudeTicks} from '../src/plot-scale';
test('five left-axis ticks use physical mV and match the five grid lines',()=>{
 assert.deepEqual(amplitudeTicks(2).map(t=>t.label),['2.0','1.0','0','−1.0','−2.0']);
 assert.deepEqual(amplitudeTicks(2).map(t=>t.fraction),[0,.25,.5,.75,1]);
});
test('difference gain changes labeled range without claiming amplified mV',()=>{
 const ticks=amplitudeTicks(2,5);
 assert.deepEqual(ticks.map(t=>t.value),[.4,.2,0,-.2,-.4]);
 assert.equal(ticks[0].value*5,2);
 assert.equal(new Set(amplitudeTicks(.1,5).map(t=>t.label)).size,5);
 assert.equal(amplitudeTicks(2,3)[0].label,'0.67');
});
