// D-192: whole page during the first hold (left title list with progress line + options) and a seek during the tour (tour should stop cleanly).
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(process.argv[2]+'/?route=disease&disease=pvc',{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer',{timeout:60000});await p.waitForTimeout(1200);
 await p.locator('.tour-opts summary').click();await p.getByRole('button',{name:'재생'}).click();
 await p.waitForFunction(()=>document.querySelector('.dt-layer').dataset.phase==='hold',null,{timeout:30000});await p.waitForTimeout(2000);
 await p.locator('.viewer-grid').screenshot({path:'page_hold0.png'});
 // seek with the range input mid-tour → tour ends, speed back to 1
 await p.locator('input[aria-label="전체 시간 탐색"]').fill('30');await p.waitForTimeout(800);
 console.log('after seek phase',await p.evaluate(()=>document.querySelector('.dt-layer').dataset.phase));
 // click title 3 → tour jumps to step 3
 await p.locator('.tour-list button').nth(2).click();await p.waitForFunction(()=>{const l=document.querySelector('.dt-layer');return l.dataset.phase==='hold';},null,{timeout:30000});
 console.log('jump step',await p.evaluate(()=>document.querySelector('.dt-layer').dataset.step));console.log('errors',errs.join('|')||'none');await b.close();})();
