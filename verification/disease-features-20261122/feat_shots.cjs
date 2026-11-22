// D-191: disease tab, PVC — the feature card: one screenshot per feature (clicking each item), errors.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:1100}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(process.argv[2]+'/?route=disease&disease=pvc&bgres=.35',{waitUntil:'networkidle'});await p.waitForSelector('.disease-features',{timeout:60000});await p.waitForTimeout(1500);
 const n=await p.locator('.df-list li').count();for(let i=0;i<n;i++){await p.locator('.df-list li button').nth(i).click();await p.waitForTimeout(900);await p.locator('.disease-features').screenshot({path:`f_${i+1}.png`});}
 console.log('features',n,'errors',errs.join('|')||'none');await b.close();})();
