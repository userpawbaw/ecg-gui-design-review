// Initial span / amplitude per disease: direct URL entry and switching by clicking the left disease buttons (also lab → disease tab entry).
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 const val=()=>p.evaluate(()=>({span:document.querySelector('select[aria-label="표시 구간"]')?.value,amp:document.querySelector('input[aria-label="표시 범위 ±mV"]')?.value,tour:!!document.querySelector('.dt-layer')}));
 await p.goto(process.argv[2]+'/?route=disease&disease=pvc',{waitUntil:'networkidle'});await p.waitForTimeout(2500);console.log('direct pvc',JSON.stringify(await val()));
 for(const id of ['apc','bigeminy','vt','sbr','afib','afl','lbbb','rbbb','avb2','pvc']){await p.click(`button[data-disease="${id}"]`);await p.waitForTimeout(2500);console.log('click',id,JSON.stringify(await val()));}
 console.log('errors',errs.join('|')||'none');await b.close();})();
