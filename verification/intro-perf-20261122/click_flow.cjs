// D-190 2차: first screen waits (wheel does nothing) → click on the title (not a button) starts → auto descent → wave: quarters fill on beats → wheel moves the mix → end buttons.
// Uses a small window so the software renderer keeps up (the beat clock is real time).
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:800,height:500}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(process.argv[2]+'/?perf=pr50,msaa',{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:120000});await p.waitForTimeout(3000);
 const st=()=>p.evaluate(()=>{const s=globalThis.__intro.state;return {mode:s.mode,p:+s.p.toFixed(3),mix:+s.mix.toFixed(2),end:s.end,steps:document.querySelectorAll('.it-steps i.on').length};});
 await p.mouse.move(400,250);await p.mouse.wheel(0,800);await p.waitForTimeout(1500);console.log('after wheel on first screen',JSON.stringify(await st()));
 await p.screenshot({path:'cf_0_first.png'});
 await p.mouse.click(400,200);await p.waitForTimeout(500);console.log('after click',JSON.stringify(await st()));
 for(let i=0;i<60&&(await st()).mode!=='wave';i++)await p.waitForTimeout(500);console.log('wave reached',JSON.stringify(await st()));
 const log=[];for(let i=0;i<16;i++){await p.waitForTimeout(500);const s=await st();log.push(`${s.steps}:${s.mix}`);}console.log('quarters/mix over 8 s',log.join(' '));
 await p.screenshot({path:'cf_1_wave.png'});
 await p.mouse.wheel(0,-600);await p.waitForTimeout(1500);console.log('after wheel up',JSON.stringify(await st()));
 await p.mouse.wheel(0,900);await p.waitForTimeout(2000);console.log('after wheel down',JSON.stringify(await st()));await p.screenshot({path:'cf_2_end.png'});
 console.log('errors',errs.join('|')||'none');await b.close();})();
