// Slow-motion 12-frame captures (gsap timeScale 0.1) for the condition crossfade and the Lab landing — G3/G5.
import {chromium} from '../../prototype/v2/node_modules/@playwright/test/index.mjs';
import {mkdirSync} from 'node:fs';
const out=process.argv[2];mkdirSync(out,{recursive:true});
const b=await chromium.launch({executablePath:process.env.PW_EXECUTABLE || (process.platform === 'linux' ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-proxy-server']});
const p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto('http://127.0.0.1:4173/?step=1');await p.waitForFunction(()=>window.__story);await p.waitForTimeout(2500);
const seq=async(name,act,span)=>{await p.evaluate(()=>window.__story.slow(.1));await p.evaluate(act);const t0=Date.now();for(let i=0;i<12;i++){await p.screenshot({path:`${out}/${name}-${String(i).padStart(2,'0')}.png`});const next=t0+(i+1)*span/12;await p.waitForTimeout(Math.max(0,next-Date.now()));}await p.evaluate(()=>window.__story?.slow(1));};
await seq('slow-1-2',()=>window.__story.go(2),9000);
await p.waitForTimeout(500);await p.evaluate(()=>window.__story.go(3));await p.waitForTimeout(1500);
await seq('slow-3-4',()=>window.__story.go(4),10000);
await p.evaluate(()=>window.__story.go(3));await p.waitForTimeout(1500);
await seq('slow-lab',()=>window.__story.enterLab(),14000);
await b.close();
