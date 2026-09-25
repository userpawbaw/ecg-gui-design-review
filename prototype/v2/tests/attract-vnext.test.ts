import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Transport} from '../src/engine';
import type {Loaded} from '../src/data';
import {createSignalView,sampleAt,sampleX,valueY,geometry,captureSession,handoffSession} from '../src/attract/signal';

function loaded(offset=0):Loaded{return{scene:{id:'d1-mixed-10',axis:'d1',cond:'mixed',snr:10,record:'MIT-BIH 106',scale:1,traces:{}},fs:250,n:150000,offset,chunkIndex:0,traces:{input:new Float32Array([.1,.3,-.2,.8]),M08:new Float32Array([.1,.2,-.1,.7]),clean:new Float32Array([.1,.2,-.1,.7])},provenance:{}};}
test('input/output/reference use one absolute sample and one time coordinate, including a chunk offset',()=>{
 const view=createSignalView(loaded(7500),'M08');const s=sampleAt(view,7502)!;
 assert.equal(s.timeSeconds,30.008);assert.equal(s.input,view.input[2]);assert.equal(s.output,view.output[2]);assert.equal(s.reference,view.reference[2]);
 assert.equal(sampleAt(view,7499),null);assert.equal(sampleAt(view,7504),null);
 const g=geometry(view,30.01,{width:1000,height:400},2,5);
 assert.equal(sampleX(g,s.absoluteIndex,view.fs),sampleX(g,7502,view.fs));
 assert.equal(valueY(g,1)-valueY(g,0),-g.height/4);
});
test('same scene, method, current clock, playback and speed survive handoff',()=>{
 const view=createSignalView(loaded(7500),'M08'),transport=new Transport();transport.time=30.004;transport.duration=600;transport.speed=.5;transport.loopRange={start:20,end:40};transport.play();
 const snapshot=captureSession(view,transport,2,5);transport.time=30.008;transport.speed=1.7;transport.loopRange=null;
 const actual=handoffSession(snapshot,view,transport);
 assert.equal(actual.sceneId,view.sceneId);assert.equal(actual.methodId,'M08');assert.equal(actual.timeSeconds,30.008);assert.equal(actual.playing,true);assert.equal(transport.speed,.5);assert.deepEqual(transport.loopRange,{start:20,end:40});
});
test('missing output and missing handoff chunk fail explicitly',()=>{
 assert.throws(()=>createSignalView(loaded(),'M07'),/동일 구간/);
 const view=createSignalView(loaded(7500),'M08'),t=new Transport();t.time=31;
 assert.throws(()=>handoffSession(captureSession(view,t,2,5),view,t),/청크/);
});
