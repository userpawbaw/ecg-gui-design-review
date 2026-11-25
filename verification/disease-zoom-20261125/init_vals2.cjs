// Initial values when the user changed span/amplitude before: lab (10 s, 0.5 mV) → disease tab; on disease tab change to 2.5 s / 1 mV then switch disease; reload.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 const val=()=>p.evaluate(()=>({span:document.querySelector('select[aria-label="표시 구간"]')?.value,amp:document.querySelector('input[aria-label="표시 범위 ±mV"]')?.value}));
 await p.goto(process.argv[2]+'/?route=lab',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 await p.selectOption('select[aria-label="표시 구간"]','10');await p.fill('input[aria-label="표시 범위 ±mV"]','0.5');await p.waitForTimeout(300);console.log('lab set',JSON.stringify(await val()));
 await p.getByRole('button',{name:/심질환/}).first().click();await p.waitForTimeout(3000);console.log('disease entry (pvc)',JSON.stringify(await val()));
 await p.selectOption('select[aria-label="표시 구간"]','2.5');await p.fill('input[aria-label="표시 범위 ±mV"]','1');await p.waitForTimeout(300);
 await p.click('button[data-disease="avb2"]');await p.waitForTimeout(2500);console.log('switch avb2',JSON.stringify(await val()));
 await p.click('button[data-disease="pvc"]');await p.waitForTimeout(2500);console.log('back pvc',JSON.stringify(await val()));
 await b.close();})();
// (appended) back to the lab restores its own span / amplitude
;(async()=>{const {chromium}=require('playwright');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 const val=()=>p.evaluate(()=>({span:document.querySelector('select[aria-label="표시 구간"]')?.value,amp:document.querySelector('input[aria-label="표시 범위 ±mV"]')?.value}));
 await p.goto(process.argv[2]+'/?route=lab',{waitUntil:'networkidle'});await p.waitForTimeout(2500);await p.selectOption('select[aria-label="표시 구간"]','10');await p.fill('input[aria-label="표시 범위 ±mV"]','0.5');
 await p.getByRole('button',{name:/심질환/}).first().click();await p.waitForTimeout(3000);await p.getByRole('button',{name:/^실험실$/}).first().click();await p.waitForTimeout(2500);console.log('back to lab',JSON.stringify(await val()));await b.close();})();
