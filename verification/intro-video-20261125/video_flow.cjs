// D-195: 영상 경로 흐름 — 첫 화면(영상) → 클릭 → 하강 영상(엔진 시계 = 영상 시각) → 파형 단계(심장 박동 프레임 · 4칸 채움 · 휠 겹침), 단계별 wall fps.
// node video_flow.cjs <url> [W] [H]
const {chromium}=require('playwright');(async()=>{const [W,H]=[+(process.argv[3]||1280),+(process.argv[4]||800)];const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(process.argv[2]+'/',{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:180000});await p.waitForTimeout(2500);
 const st=()=>p.evaluate(()=>{const s=globalThis.__intro.state,v=[...document.querySelectorAll('.it-vid')].map(e=>e.className.split(' ')[1]+':'+getComputedStyle(e).opacity+(e.tagName==='VIDEO'?'@'+e.currentTime.toFixed(2):'')).join(' ');return {mode:s.mode,p:+s.p.toFixed(3),t:+s.t.toFixed(2),mix:+s.mix.toFixed(2),steps:document.querySelectorAll('.it-steps i.on').length,frame:s.frame,v};});
 const fps=async(ms)=>{const a=await st(),t0=Date.now();await p.waitForTimeout(ms);const z=await st();return ((z.frame-a.frame)/((Date.now()-t0)/1000)).toFixed(1);};
 console.log('first',JSON.stringify(await st()),'fps',await fps(4000));await p.screenshot({path:'vf_0_first.png'});
 await p.mouse.click(W/2,H/2);await p.waitForTimeout(3000);console.log('descent 3 s',JSON.stringify(await st()));await p.screenshot({path:'vf_1_descent.png'});
 console.log('descent fps',await fps(4000));
 for(let i=0;i<40&&(await st()).mode!=='wave';i++)await p.waitForTimeout(500);console.log('wave',JSON.stringify(await st()));
 const log=[];for(let i=0;i<12;i++){await p.waitForTimeout(500);const s=await st();log.push(s.steps+':'+s.mix);}console.log('quarters',log.join(' '));
 await p.screenshot({path:'vf_2_wave.png'});console.log('wave fps',await fps(4000));
 await p.mouse.move(W*.7,H*.5);await p.mouse.wheel(0,-500);await p.waitForTimeout(1200);console.log('wheel up',JSON.stringify(await st()));await p.screenshot({path:'vf_3_wheel.png'});
 console.log('errors',errs.join('|')||'none');await b.close();})();
