// D-173: the power-line scene's first frame with the clock frozen at the scene start (?t=0 → the stage resets it to its start time).
// new = starts on the strip (t 10 s) · old = ?plifrom=0 (the 0–10 s opening). node shoot.cjs <outdir>   (dev server 127.0.0.1:5179)
const {chromium}=require('playwright');const OUT=process.argv[2]||'.';
(async()=>{const b=await chromium.launch();
 for(const [lab,q] of [['new_start',''],['old_start','&plifrom=0']]){const p=await b.newPage({viewport:{width:960,height:540}});
  const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://127.0.0.1:5179/?story=noise&cond=pli&t=0'+q,{waitUntil:'networkidle'});
  await p.waitForFunction(()=>window.__noise&&window.__noise.ready,null,{timeout:120000});await p.waitForTimeout(3000);
  await p.screenshot({path:`${OUT}/${lab}.png`});console.log(lab,'errors',errs.length?errs:'none');await p.close();}
 await b.close();})();
