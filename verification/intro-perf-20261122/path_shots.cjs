// D-190: frozen progress values along the new intro (first screen → fixed descent → wave stage) — one still each, plus a contact sheet.
// node path_shots.cjs <appBase> <tag>
const {chromium}=require('playwright');const [BASE,TAG]=[process.argv[2],process.argv[3]];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:960,height:600}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+'/?',{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:120000});await p.waitForTimeout(2000);
 for(const v of [.25,.31,.38,.44,.5,.56,.62,.7,.8,.9]){await p.evaluate(v=>{globalThis.__intro.set({p:v});},v);await p.waitForTimeout(3500);await p.screenshot({path:`${TAG}_p${v.toFixed(2)}.png`});}
 console.log('errors',errs.join(' | ')||'none');await b.close();})();
