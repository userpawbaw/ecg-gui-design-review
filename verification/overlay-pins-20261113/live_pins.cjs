// Live overlay: legend chips — pin two methods by clicking, move the mouse away, screenshot; unpin one; screenshot. node live_pins.cjs <appBase> <tag>
const {chromium}=require('playwright');const [BASE,TAG]=[process.argv[2],process.argv[3]];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1100}});
 await p.goto(BASE+'/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.waitForTimeout(7000);
 const chips=await p.$$eval('.ov-chip',e=>e.map(x=>x.dataset.series));console.log('chips',chips.join(','));
 const row=p.locator('.live-native .live-row').last();await row.screenshot({path:`${TAG}_0.png`});
 await p.click(`.ov-chip[data-series="${chips[1]}"]`);await p.click(`.ov-chip[data-series="${chips[2]}"]`);await p.mouse.move(5,5);await p.waitForTimeout(900);
 console.log('pressed',await p.$$eval('.ov-chip[aria-pressed=true]',e=>e.map(x=>x.dataset.series).join(',')));await row.screenshot({path:`${TAG}_1_pin2.png`});
 await p.click(`.ov-chip[data-series="${chips[2]}"]`);await p.mouse.move(5,5);await p.waitForTimeout(900);await row.screenshot({path:`${TAG}_2_pin1.png`});
 await p.click(`.ov-chip[data-series="${chips[1]}"]`);await p.mouse.move(5,5);await p.waitForTimeout(900);await row.screenshot({path:`${TAG}_3_none.png`});await b.close();})();
