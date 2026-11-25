// D-196: 잡음 장면 영상 경로 흐름 — 전원 간섭(영상) → 파형 4칸 → 휠 → 「다음 잡음」 → 기저선 → … , 단계별 fps · 장면 시계 · 영상 상태.
// node noise_flow.cjs <url> [W H]
const {chromium}=require('playwright');(async()=>{const [W,H]=[+(process.argv[3]||1280),+(process.argv[4]||800)];const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(process.argv[2]+'/?story=noise&cond=all',{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__noise?.ready,null,{timeout:240000});
 const st=()=>p.evaluate(()=>{const v=[...document.querySelectorAll('.ns-vid')].filter(e=>getComputedStyle(e).opacity!=='0').map(e=>e.src.split('/').pop()+'@'+e.currentTime.toFixed(2));
  return {cond:globalThis.__noise.cond,cells:document.querySelectorAll('.ns-strip i.on').length,v:v.join(' '),btn:!!document.querySelector('.ns-btn:not(.ghost)')&&getComputedStyle(document.querySelector('.ns-end, .ns-btn')).opacity};});
 const fps=async ms=>p.evaluate(ms=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<ms)requestAnimationFrame(f);else r((n*1000/(performance.now()-t0)).toFixed(1));};requestAnimationFrame(f);}),ms);
 for(const k of [0,1,2]){
  for(let i=0;i<60;i++){const s=await st();if(s.cells>=4)break;await p.waitForTimeout(500);}
  console.log('scene',k,JSON.stringify(await st()),'rAF fps',await fps(3000));await p.screenshot({path:`nf_${k}_wave.png`});
  await p.mouse.move(W*.7,H*.5);for(let i=0;i<6;i++){await p.mouse.wheel(0,400);await p.waitForTimeout(150);}await p.waitForTimeout(1200);
  const btn=p.locator('.ns-btn:not(.ghost)');await btn.click({timeout:20000}).catch(e=>console.log('btn',String(e).slice(0,80)));await p.waitForTimeout(2500);console.log('after next',JSON.stringify(await st()));}
 console.log('errors',errs.join('|')||'none');await b.close();})();
