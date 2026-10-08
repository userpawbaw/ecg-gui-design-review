// Frame-stepped recording of the R1 flow (intro → power line → baseline wander → muscle artifact → Lab) for review.
// The page clocks are frozen and stepped 1/FPS per frame, so the video plays at real speed even when the renderer is slow
// (headless SwiftShader here). Frames are resumable (existing PNGs are skipped). Encode with ffmpeg at the end.
// Run (from prototype/v2, built and served on :4173): node ../../scripts/record-story.mjs <frames dir> <out.mp4>
import {existsSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(new URL('../prototype/v2/node_modules/playwright/index.mjs',import.meta.url).href);   // v2's Playwright
const [dir='rec',out='story.mp4']=process.argv.slice(2),FPS=Number(process.env.FPS||24),INTRO_S=Number(process.env.INTRO_S||45);
const SCENES=[['pli',35],['bw',33],['ma',35]],LAB_S=5;
mkdirSync(dir,{recursive:true});
const b=await chromium.launch({executablePath:process.env.PW_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:Number(process.env.VW||1280),height:Number(process.env.VH||720)}});
let n=0;const f=()=>`${dir}/f_${String(n).padStart(5,'0')}.png`;
const snap=async(fn)=>{const path=f();if(!existsSync(path)){await fn();await p.screenshot({path});}n++;};
await p.goto('http://127.0.0.1:4173/?p=0&t=0');await p.waitForFunction(()=>window.__intro,null,{timeout:180000});
await p.evaluate(()=>window.__intro.pause(true));
const NI=Math.round(INTRO_S*FPS);
for(let i=0;i<NI;i++)await snap(()=>p.evaluate(([i,NI,FPS])=>{const k=i/(NI-1);window.__intro.set({p:k*.995,t:i/FPS});window.__intro.renderOnce(true);},[i,NI,FPS]));
console.log('intro frames',n);
await p.getByText('잡음마다 다를까요?').click();await p.waitForFunction(()=>window.__noise?.ready,null,{timeout:180000});
for(const [cond,dur] of SCENES){
 const N=Math.round(dur*FPS);
 for(let i=0;i<N;i++)await snap(()=>p.evaluate(t=>{window.__noise.set({t});window.__noise.renderOnce();},i/FPS));
 console.log(cond,'frames',n);await p.evaluate(()=>window.__noise.next());
}
await p.waitForTimeout(4000);
for(let i=0;i<LAB_S*FPS;i++){const path=f();if(!existsSync(path))await p.screenshot({path});n++;}   // Lab: real-time stills (static screen)
await b.close();
execFileSync('ffmpeg',['-v','error','-y','-framerate',String(FPS),'-i',`${dir}/f_%05d.png`,'-vf','format=yuv420p','-c:v','libx264','-crf','21',out]);
console.log('video →',out,n,'frames');
