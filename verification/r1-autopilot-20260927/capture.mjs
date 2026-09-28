// R1 story headless capture: states (G5) + 12-frame transition sequences (G3). Run: node verification/r1-autopilot-20260927/capture.mjs <outDir>
import {chromium} from '../../prototype/v2/node_modules/@playwright/test/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.argv[2]||'verification/r1-autopilot-20260927/shots';mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.PW_EXECUTABLE || (process.platform === 'linux' ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-proxy-server']});
const log=[];
async function page(q=''){const p=await b.newPage({viewport:{width:1920,height:1080}});p.on('console',m=>{if(m.type()==='error')log.push(m.text());});p.on('pageerror',e=>log.push('pageerror '+e.message));await p.goto('http://127.0.0.1:4173/'+q);await p.waitForFunction(()=>window.__story,null,{timeout:20000});await p.waitForTimeout(2500);return p;}
const p=await page('?t=6.4');
const shot=async(n)=>p.screenshot({path:`${out}/${n}.png`});
await shot('state-0-attract');
for(const s of [1,2,3,4,5]){await p.evaluate(s=>window.__story.go(s),s);await p.waitForTimeout(1400);await shot(`state-${s}`);}
// 12-frame sequences for each transition (time-sampled, 90 ms apart ≈ 1.1 s)
for(const [from,to] of [[0,1],[1,2],[3,4],[4,5]]){await p.evaluate(s=>window.__story.go(s),from);await p.waitForTimeout(1500);await p.evaluate(s=>window.__story.go(s),to);for(let i=0;i<12;i++){await shot(`seq-${from}-${to}-${String(i).padStart(2,'0')}`);await p.waitForTimeout(60);}}
// dot count constancy across steps 1–3
const counts=[];for(const s of [1,2,3]){await p.evaluate(s=>window.__story.go(s),s);await p.waitForTimeout(1200);counts.push(await p.evaluate(()=>document.querySelectorAll('.st-dot[data-main]').length));}
// Lab handoff from step 3
await p.evaluate(()=>window.__story.go(3));await p.waitForTimeout(1300);await p.evaluate(()=>window.__story.enterLab());
for(let i=0;i<12;i++){await shot(`seq-lab-${String(i).padStart(2,'0')}`);await p.waitForTimeout(120);}
await p.waitForTimeout(1500);await shot('state-lab');
const lab=await p.evaluate(()=>({story:!!document.querySelector('.story'),canvas:document.querySelector('.large-dialog canvas.ecg-canvas')?.getAttribute('aria-label'),mode:document.querySelector('.large-dialog canvas.ecg-canvas')?.dataset.mode,heading:document.querySelector('.large-dialog .viewer-heading p')?.textContent}));
// wheel gesture: one burst = one step
// wheel: a burst of 20 events 30 ms apart (one gesture) must move exactly one step; after a pause one reverse notch moves back
const w=await page('?t=6.4');const burst=(dy,n)=>w.evaluate(([dy,n])=>new Promise(r=>{let i=0;const t=setInterval(()=>{dispatchEvent(new WheelEvent('wheel',{deltaY:dy,cancelable:true}));if(++i>=n){clearInterval(t);r();}},30);}),[dy,n]);
await burst(120,20);await w.waitForTimeout(1200);const afterBurst=await w.evaluate(()=>window.__story.step);
await burst(-120,1);await w.waitForTimeout(1200);const afterBack=await w.evaluate(()=>window.__story.step);
// reduced motion
const r=await page('?reduced=1');await r.screenshot({path:`${out}/reduced-0.png`});await r.evaluate(()=>window.__story.go(2));await r.waitForTimeout(400);await r.screenshot({path:`${out}/reduced-2.png`});
writeFileSync(`${out}/result.json`,JSON.stringify({counts,lab,afterBurst,afterBack,errors:log},null,1));
console.log(JSON.stringify({counts,lab,afterBurst,afterBack,errors:log},null,1));
await b.close();
