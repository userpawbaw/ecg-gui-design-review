// D-190 flow: intro first screen (dim archive, no globe) → wheel until the auto descent starts → snapshots during the descent → wave stage.
// node flow.cjs <appBase> <tag> [extra query]
const {chromium}=require('playwright');const [BASE,TAG,EX]=[process.argv[2],process.argv[3],process.argv[4]||''];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await p.goto(BASE+'/?'+EX,{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:120000});await p.waitForTimeout(3000);
 const st=()=>p.evaluate(()=>{const s=globalThis.__intro.state;return {mode:s.mode,p:+s.p.toFixed(3),frame:s.frame};});
 console.log('start',JSON.stringify(await st()));await p.screenshot({path:`${TAG}_0_first.png`});
 await p.mouse.move(720,450);for(let i=0;i<6;i++){await p.mouse.wheel(0,250);await p.waitForTimeout(400);}
 console.log('after wheel',JSON.stringify(await st()));await p.screenshot({path:`${TAG}_1_scrolled.png`});
 for(let i=0;i<20&&(await st()).mode==='first';i++){await p.mouse.wheel(0,400);await p.waitForTimeout(300);}
 const t0=Date.now();const log=[];for(let k=0;k<4;k++){await p.waitForTimeout(2500);const s=await st();log.push([((Date.now()-t0)/1000).toFixed(1),s.mode,s.p,s.frame]);await p.screenshot({path:`${TAG}_2_auto_${k}.png`});}
 console.log('auto',JSON.stringify(log));
 for(let i=0;i<6;i++){await p.mouse.wheel(0,300);await p.waitForTimeout(400);}await p.waitForTimeout(1500);console.log('wave',JSON.stringify(await st()));await p.screenshot({path:`${TAG}_3_wave.png`});
 console.log('errors',errs.join(' | ')||'none');await b.close();})();
