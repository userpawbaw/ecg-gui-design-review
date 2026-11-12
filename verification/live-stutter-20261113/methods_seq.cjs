// Live tab: apply method sets in order through the UI (queue + 적용) and list the panels shown after each apply.
// node methods_seq.cjs <appBase> "<set1>;<set2>;…"  (each set: comma list, ≤ 3)
const {chromium}=require('playwright');const [BASE,SEQ]=[process.argv[2],process.argv[3]];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1100}});
 await p.goto(BASE+'/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.waitForTimeout(4000);
 const panels=()=>p.$$eval('.live-native .live-row h4, .live-native .live-row .live-title, .live-native [data-series]',e=>e.map(x=>x.getAttribute('data-series')||x.textContent.trim()));
 const shown=async()=>p.evaluate(()=>[...document.querySelectorAll('.live-native canvas')].map(c=>c.getAttribute('aria-label')||c.dataset.series||'?'));
 for(const set of SEQ.split(';')){const want=set.split(',');
  // clear draft to exactly `want`: click currently-on methods not wanted, then wanted ones not on
  for(let k=0;k<3;k++){const on=await p.$$eval('.live-methods .method[aria-pressed="true"]',e=>e.map(x=>x.dataset.method));
   for(const m of on)if(!want.includes(m)){await p.click(`.live-methods .method[data-method="${m}"]`);}
   const on2=await p.$$eval('.live-methods .method[aria-pressed="true"]',e=>e.map(x=>x.dataset.method));
   for(const m of want)if(!on2.includes(m)){await p.click(`.live-methods .method[data-method="${m}"]`);}}
  const q=await p.$$eval('.live-methods .method[aria-pressed="true"]',e=>e.map(x=>x.dataset.method));
  const btn=p.locator('.lm-apply');if(await btn.isEnabled())await btn.click();
  await p.waitForTimeout(1500);await p.waitForFunction(()=>!document.querySelector('.live-reload.on'),null,{timeout:120000});await p.waitForTimeout(2500);
  console.log('applied',set,'(queue',q.join(','),') → panels:',(await shown()).join(' | '));}
 await b.close();})();
