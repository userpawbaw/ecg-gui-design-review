// live tab panel screenshot after 8 s of stream (sweep mode). node live_shot.cjs <tag>
const {chromium}=require('playwright');const TAG=process.argv[2]||'live';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(1500);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.waitForTimeout(9000);
 await p.screenshot({path:`${TAG}_full.png`});await p.locator('.live-native').screenshot({path:`${TAG}_panel.png`});await b.close();})();
