// R1 intro captures (D-041): frozen progress p and clock t through window.__intro, same code path as live.
// Usage: node verification/r1-intro-20260929/capture.mjs [label] [p,t;p,t;...]   (dev server on :5173)
import {chromium} from '../../prototype/v2/node_modules/playwright/index.mjs';
import {mkdirSync} from 'node:fs';
const out=new URL('./frames/',import.meta.url).pathname;mkdirSync(out,{recursive:true});
const label=process.argv[2]||'states';
const pairs=(process.argv[3]||'0,3;.1,3;.2,3;.26,3;.3,3;.35,3;.42,3;.5,3;.6,3;.72,3;.76,6;.86,6;.99,6').split(';').map(s=>s.split(',').map(Number));
const browser=await chromium.launch({executablePath:process.env.PW_EXECUTABLE||(process.platform==='linux'?'/opt/pw-browsers/chromium-1194/chrome-linux/chrome':undefined),args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto(`${process.env.BASE||'http://127.0.0.1:5173'}/?p=${pairs[0][0]}&t=${pairs[0][1]}${process.env.EXTRA||''}`);
await page.waitForFunction(()=>window.__intro,null,{timeout:180000});
await page.waitForTimeout(1500);
await page.evaluate(()=>window.__intro.pause(true));   // only renderOnce draws while capturing
for(const [p,t,w] of pairs){
 // walk the clock up to t in frame steps so the W4 state machine sees the same sequence as live
 await page.evaluate(([p,t,w])=>{
  const i=window.__intro;
  // walk seconds before t: given (w) or 2.4 s once the sweep gate is open; reset to p=0 first so W4 re-arms
  const walk=Number.isFinite(w)?w:p>=.73?Math.min(t,2.4):0;
  if(walk>0){i.set({p:0,t:t-walk});i.renderOnce(false);}
  i.set({p,t:t-walk});const n=Math.round(walk*60);
  for(let k=0;k<=n;k++){i.set({t:t-walk+k/60});i.renderOnce(false);}   // state only, no drawing
  i.set({t});i.renderOnce(true);
 },[p,t,w]);
 await page.waitForTimeout(450);
 await page.screenshot({path:`${out}${label}-p${String(p).padStart(4,'0')}-t${t}${Number.isFinite(w)?'-w'+w:''}.jpg`,quality:82,type:'jpeg'});
}
console.log(JSON.stringify({errors,frames:pairs.length}));
await browser.close();
