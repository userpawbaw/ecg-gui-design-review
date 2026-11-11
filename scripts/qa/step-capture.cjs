#!/usr/bin/env node
// Frame-stepped capture (2026-11-11): the page runs on Playwright's fake clock, and each frame advances it by exactly 1/fps before a
// screenshot, so a software renderer (no GPU, a few real frames a second) still yields the frames a 60 fps screen would show.
// Usage: node scripts/qa/step-capture.cjs --url <url> --out <dir> [--fps 60] [--frames 120] [--size 960x540] [--warm 3000]
//        [--action "wheel:3@10,move:0.2@40"]   (wheel:<notches>@<frame> scrolls 100 px per notch · move:<x 0–1>@<frame> moves the pointer)
//        [--click "<button text>@<frame>"]  [--clip x,y,w,h]
//        [--perframe "<js using i>"]   (evaluated before each frame, e.g. "window.__intro.set({p:.38+i*.0004})")
// Writes frame_0000.png … and frames.json (per-frame time). Then: node scripts/qa/frame-metrics.cjs <dir>
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d;};
const URL=arg('url'),OUT=arg('out','step-out'),FPS=Number(arg('fps',60)),N=Number(arg('frames',120)),[W,H]=arg('size','960x540').split('x').map(Number),WARM=Number(arg('warm',3000));
const acts=(arg('action','')||'').split(',').filter(Boolean).map(a=>{const [k,rest]=a.split(':');const [v,f]=rest.split('@');return {k,v:Number(v),f:Number(f)};});
const clicks=(arg('click','')||'').split(',').filter(Boolean).map(a=>{const [t,f]=a.split('@');return {t,f:Number(f)};});
const PER=arg('perframe');
const clip=arg('clip')?(([x,y,w,h])=>({x,y,width:w,height:h}))(arg('clip').split(',').map(Number)):undefined;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
 await p.clock.install({time:new Date('2026-11-11T12:00:00Z')});
 await p.goto(URL,{waitUntil:'domcontentloaded'});
 // warm-up: let loading finish in fake time (assets load in real time meanwhile)
 for(let t=0;t<WARM;t+=250){await p.clock.runFor(250);await p.waitForTimeout(150);}
 await p.mouse.move(W/2,H/2);const dt=1000/FPS,log=[];
 for(let i=0;i<N;i++){
  for(const a of acts)if(a.f===i){if(a.k==='wheel')await p.mouse.wheel(0,100*a.v);if(a.k==='move')await p.mouse.move(a.v*W,H/2,{steps:1});}
  for(const c of clicks)if(c.f===i)await p.getByRole('button',{name:c.t}).first().click();
  if(PER)await p.evaluate(([code,i])=>{new Function('i',code)(i);},[PER,i]);
  await p.clock.runFor(dt);
  await p.screenshot({path:path.join(OUT,`frame_${String(i).padStart(4,'0')}.png`),clip});log.push({i,t:+(i*dt).toFixed(2)});}
 fs.writeFileSync(path.join(OUT,'frames.json'),JSON.stringify({url:URL,fps:FPS,size:[W,H],frames:log},null,1));await b.close();
 console.log(`captured ${N} frames at ${FPS} fps (fake clock) → ${OUT}`);})();
