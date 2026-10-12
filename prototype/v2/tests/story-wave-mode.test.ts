// S-06 / S-07 / S-08 (REVIEW-R1-STORY-20261011): wave panel state — one beat-released pass, then reversible scroll,
// overlay only from the clean end, and every mode change fades (no trace pops in or out).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWaveMode,FADE_S,SCROLL_SPAN,SCROLL_LERP} from '../src/story/noise/waveMode';

function run(m:ReturnType<typeof createWaveMode>,from:number,to:number,beats:number[],dt=1/60,procOn=true){
 let prevR=beats.filter(b=>b<=from).pop()??-1;
 for(let t=from;t<to;t+=dt){const r=beats.filter(b=>b<=t).pop();if(r!==undefined)prevR=r;m.update({procOn,prevR,t,dt,reduced:false});}
}
const BEATS=Array.from({length:30},(_,i)=>.4+i*.6);

test('auto pass: one quarter per beat, then scroll mode at the clean end',()=>{
 const m=createWaveMode();run(m,0,.3,BEATS,1/60,false);assert.equal(m.phase,'wait');
 run(m,.3,.95,BEATS);assert.equal(m.phase,'auto');assert.equal(m.quarters,1);
 run(m,.95,1.55,BEATS);assert.equal(m.quarters,2);
 run(m,1.55,3.2,BEATS);assert.equal(m.phase,'scroll');assert.ok(m.mix>.999);assert.ok(m.atEnd);
});
test('scroll is reversible and never jumps (smooth follow, small change per frame)',()=>{
 const m=createWaveMode();run(m,0,3.2,BEATS);
 let prev=m.mix;
 for(let i=0;i<60;i++){m.scroll(-SCROLL_SPAN/60);run(m,3.2+i*.05,3.25+i*.05,BEATS);assert.ok(m.mix<=prev+1e-9);assert.ok(prev-m.mix<.1);prev=m.mix;}
 run(m,6.2,7,BEATS);assert.ok(m.mix<.01,'scrolled all the way back to the noisy input');assert.equal(m.atEnd,false);
 for(let i=0;i<60;i++)m.scroll(SCROLL_SPAN/60);run(m,7,8.5,BEATS);assert.ok(m.mix>.999);assert.ok(m.atEnd);
});
test('overlay: only from the clean end, scroll ignored, both traces fade in/out over FADE_S',()=>{
 const m=createWaveMode();run(m,0,3.2,BEATS);
 m.scroll(-300);run(m,3.2,3.6,BEATS);assert.equal(m.toggleOverlay(),false,'not offered away from the clean end');
 m.scroll(300);run(m,3.6,4.2,BEATS);assert.equal(m.toggleOverlay(),true);assert.equal(m.phase,'overlay');
 const w0=m.weights();run(m,4.2,4.2+FADE_S/2,BEATS);const w1=m.weights();
 assert.ok(w1.input>w0.input+.1&&w1.input<.62-.05,'input fades in, not at once');
 assert.equal(m.scroll(-500),false);run(m,4.5,5.5,BEATS);assert.ok(Math.abs(m.weights().input-.62)<1e-6);assert.ok(m.mix>.999);
 assert.equal(m.toggleOverlay(),true);assert.equal(m.phase,'scroll');run(m,5.5,5.5+FADE_S/2,BEATS);
 const w2=m.weights();assert.ok(w2.input>.05&&w2.input<.6,'input fades out, not at once');
 run(m,5.8,7,BEATS);assert.ok(m.weights().input<1e-6);
});
test('Lenis-like follow: one wheel move eases in — ~10 % of the gap on the first 60 Hz frame, settled within ~0.8 s',()=>{
 const m=createWaveMode();run(m,0,3.2,BEATS);
 m.scroll(-SCROLL_SPAN/2);const a=m.mix;m.update({procOn:true,prevR:0,t:3.21,dt:1/60,reduced:false});
 assert.ok(Math.abs((a-m.mix)/(a-.5)-SCROLL_LERP)<.01,'first frame closes the lerp fraction of the gap');
 const d1=a-m.mix;m.update({procOn:true,prevR:0,t:3.23,dt:1/60,reduced:false});assert.ok(a-m.mix-d1<d1,'decelerates');
 run(m,3.23,4.05,BEATS);assert.ok(Math.abs(m.mix-.5)<.01,'settled');
});
test('reduced motion: no animation, same states',()=>{
 const m=createWaveMode();m.update({procOn:true,prevR:0,t:0,dt:1/60,reduced:true});m.update({procOn:true,prevR:0,t:.02,dt:1/60,reduced:true});
 assert.equal(m.phase,'scroll');assert.equal(m.mix,1);assert.equal(m.toggleOverlay(),true);m.update({procOn:true,prevR:0,t:.04,dt:1/60,reduced:true});assert.equal(m.overlay,1);
});
