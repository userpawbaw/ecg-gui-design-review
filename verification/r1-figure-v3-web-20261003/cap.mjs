// Brief 2 captures (frozen p/t through window.__intro, same path as live) + load time, console errors, frame time.
// Usage: node verification/r1-figure-v3-web-20261003/cap.mjs <label> "p,t;p,t;..."   env: EXTRA="&look=archive", BASE, PW_EXECUTABLE
// Based on verification/r1-intro-20260929/capture.mjs (Windows-safe paths, timing added). Headless SwiftShader: frame
// times are a reference only, not the exhibit GPU.
import {chromium} from '../../prototype/v2/node_modules/playwright/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('./frames/',import.meta.url));mkdirSync(out,{recursive:true});
const label=process.argv[2]||'states';
const pairs=(process.argv[3]||'.45,3').split(';').map(s=>s.split(',').map(Number));
const browser=await chromium.launch({executablePath:process.env.PW_EXECUTABLE||undefined,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[],bytes={};
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('response',async r=>{try{const u=r.url();if(/\.(glb|webp|json|jpg|png)$/.test(u.split('?')[0])){const b=await r.body();bytes[u.split('/').pop()]=b.length;}}catch{}});
const t0=Date.now();
await page.goto(`${process.env.BASE||'http://127.0.0.1:4173'}/?p=${pairs[0][0]}&t=${pairs[0][1]}${process.env.EXTRA||''}`);
await page.waitForFunction(()=>window.__intro,null,{timeout:240000});
const loadMs=Date.now()-t0;
await page.waitForTimeout(1500);
await page.evaluate(()=>window.__intro.pause(true));
if(process.env.HIDEUI)await page.addStyleTag({content:'.intro>*:not(.it-gl){visibility:hidden!important}'});   // stills comparison: WebGL layer only
if(process.env.TUNE)await page.evaluate(new Function(process.env.TUNE));   // e.g. TUNE='const a=window.__intro.arch;a.shared.uExposure.value=1.5'
const timing=[];
for(const [p,t,w] of pairs){
 const ms=await page.evaluate(([p,t,w])=>{
  const i=window.__intro;
  const walk=Number.isFinite(w)?w:p>=.73?Math.min(t,2.4):0;
  if(walk>0){i.set({p:0,t:t-walk});i.renderOnce(false);}
  i.set({p,t:t-walk});const n=Math.round(walk*60);
  for(let k=0;k<=n;k++){i.set({t:t-walk+k/60});i.renderOnce(false);}
  i.set({t});i.renderOnce(true);
    // readPixels forces the GPU queue to drain, so the wall clock covers the whole frame (SwiftShader CPU raster)
  const gl=document.querySelector('.it-gl').getContext('webgl2'),px=new Uint8Array(4);
  gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
  const a=performance.now();for(let k=0;k<5;k++){i.renderOnce(true);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}
  return (performance.now()-a)/5;
 },[p,t,w]);
 timing.push({p,t,ms:+ms.toFixed(1)});
 await page.waitForTimeout(400);
 await page.screenshot({path:`${out}${label}-p${String(p).padStart(4,'0')}-t${t}.jpg`,quality:85,type:'jpeg'});
}
const res={label,extra:process.env.EXTRA||'',loadMs,bytes,errors,timing};
writeFileSync(`${out}${label}.json`,JSON.stringify(res,null,1));
console.log(JSON.stringify(res));
await browser.close();
