// Headless evidence for the spike: scroll positions, autoplay, reduced motion, frame intervals, console errors.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.SPIKE_URL||'http://127.0.0.1:4180/';const out=new URL('../qa-output/',import.meta.url).pathname;await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const stats=a=>{const s=[...a].sort((x,y)=>x-y);return{samples:s.length,medianMs:+s[s.length>>1]?.toFixed(2),p95Ms:+s[Math.floor(s.length*.95)]?.toFixed(2)};};
const result={url,runs:{}};
async function run(name,{query='',reduced=false,positions=[]}){
 const ctx=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:reduced?'reduce':'no-preference'});const p=await ctx.newPage();const errors=[];
 p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto(url+query);await p.waitForFunction(()=>window.__spike?.ready);await p.waitForTimeout(1500);
 const shots=[];
 for(const f of positions){await p.evaluate(f=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*f),f);await p.waitForTimeout(2200);
  const s=await p.evaluate(()=>({progress:+window.__spike.progress.toFixed(3),rotationY:+window.__spike.rotationY.toFixed(3)}));const file=`${name}-${Math.round(f*100)}.png`;await p.screenshot({path:out+file});shots.push({target:f,...s,file});}
 if(!positions.length){for(const wait of [0,4000]){await p.waitForTimeout(wait);const s=await p.evaluate(()=>({progress:+window.__spike.progress.toFixed(3)}));const file=`${name}-${shots.length}.png`;await p.screenshot({path:out+file});shots.push({...s,file});}}
 await p.evaluate(()=>{window.__spike.frames.length=0;});await p.waitForTimeout(3000);
 const info=await p.evaluate(()=>({mode:window.__spike.mode,webgl:window.__spike.webgl,frames:[...window.__spike.frames]}));
 result.runs[name]={mode:info.mode,webgl:info.webgl,shots,frameIntervals:stats(info.frames),errors};await ctx.close();}
await run('scroll',{positions:[0,.3,.6,1]});
await run('reduced',{reduced:true,positions:[0,.6]});
await run('autoplay',{query:'?autoplay=1'});
await browser.close();await writeFile(out+'results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,1));
