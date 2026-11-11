// D-172 A/B: the same scripted session with the old behaviour (switches) and the new one. SwiftShader → relative numbers only.
// node measure.cjs <outdir>   (dev server on 127.0.0.1:5179)
const {chromium}=require('playwright');const fs=require('fs');
const OUT=process.argv[2]||'.';const BASE='http://127.0.0.1:5179/?route=lab&bgprof=1&bgsoft=0';
const OLD='&livebg=live&bgmove=full&bgmask=0&bgidle=0';
const snap=p=>p.evaluate(()=>({...window.__bgStats}));
const diff=(a,b)=>Object.fromEntries(Object.keys(b).filter(k=>typeof b[k]==='number').map(k=>[k,+(b[k]-(a[k]||0)).toFixed(1)]));
async function settle(p,ms=2500){await p.waitForTimeout(ms);let n=-1;for(let i=0;i<120;i++){const d=(await snap(p)).draws;if(d===n)return;n=d;await p.waitForTimeout(1000);}}   // until the backdrop stops drawing
async function session(label,extra){
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:960,height:540}});
 await p.goto(BASE+extra,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__bgStats&&window.__bgStats.draws>0,null,{timeout:120000});await settle(p,4000);
 const r={label};
 // 1) Lab scroll: 6 wheel steps over ~3 s, then rest 3 s
 let a=await snap(p);const t0=Date.now();
 for(let i=0;i<6;i++){await p.mouse.wheel(0,90);await p.waitForTimeout(500);}await settle(p,3000);
 r.labScroll={...diff(a,await snap(p)),wall_s:(Date.now()-t0)/1000};
 // 2) Lab pointer sweep: 20 moves over 2 s, then rest 2 s
 a=await snap(p);for(let i=0;i<20;i++){await p.mouse.move(100+i*38,300);await p.waitForTimeout(100);}await settle(p,2000);
 r.labPointer=diff(a,await snap(p));
 // 3) Lab idle 5 s (curtain drift)
 a=await snap(p);await p.waitForTimeout(5000);r.labIdle=diff(a,await snap(p));r.labIdle.note='ambient drift frames over 5 s';r.curtainAtEnd=(await snap(p)).curtain;r.driftAtEnd=(await snap(p)).drift;
 await p.screenshot({path:`${OUT}/${label}_lab.png`});
 // 4) Live tab: enter, pointer sweep 2 s, idle 3 s
 await p.evaluate(()=>scrollTo(0,0));await settle(p,2500);a=await snap(p);
 await p.getByRole('button',{name:'실시간 측정'}).click();await settle(p,2500);r.liveEnter=diff(a,await snap(p));
 a=await snap(p);for(let i=0;i<20;i++){await p.mouse.move(900-i*40,300);await p.waitForTimeout(100);}await settle(p,1500);r.livePointer=diff(a,await snap(p));
 a=await snap(p);await p.waitForTimeout(3000);r.liveIdle=diff(a,await snap(p));
 for(const x of [0,480,959]){await p.mouse.move(x,300);await settle(p,2500);await p.screenshot({path:`${OUT}/${label}_live_x${x}.png`});}
 await b.close();return r;}
(async()=>{const res=[];for(const [l,e] of [['old',OLD],['new','']]){res.push(await session(l,e));console.log(JSON.stringify(res.at(-1)));}
 fs.writeFileSync(`${OUT}/measure.json`,JSON.stringify(res,null,1));})();
