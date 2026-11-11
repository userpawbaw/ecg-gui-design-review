// picker while choosing (not yet applied): two new picks on a full queue. node queue_shot.cjs
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(1500);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-methods .lm-apply',{timeout:60000});await p.waitForTimeout(3000);
 for(const id of ['M01','M02']){await p.locator('.live-methods button',{hasText:id}).first().click();await p.waitForTimeout(300);}
 await p.locator('.live-methods').screenshot({path:'queue_pending.png'});
 console.log(await p.locator('.live-methods .subtle').last().innerText());await b.close();})();
