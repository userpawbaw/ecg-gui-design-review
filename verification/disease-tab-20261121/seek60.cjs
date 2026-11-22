// D-189 60 s: disease tab — duration, seek to 45 s (beyond the 30 s chunk boundary the 10-min data uses), play 3 s, no error.
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1700,height:1300}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(process.argv[2]+'/?route=disease&disease=pvc&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(4000);
 const tm=()=>p.$eval('.transport .time',e=>e.textContent);console.log('time',await tm());
 await p.$eval('input[aria-label="전체 시간 탐색"]',el=>{const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(el,'45');el.dispatchEvent(new Event('input',{bubbles:true}));});await p.waitForTimeout(2500);
 console.log('after seek',await tm(),'| error box:',await p.locator('.request-status, [role=alert]').count());
 await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(3000);console.log('playing',await tm());
 await p.locator('.viewer-grid').first().screenshot({path:'t60_pvc_45s.png'});console.log('errors',errs.join('|')||'none');await b.close();})();
