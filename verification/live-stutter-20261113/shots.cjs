// Live tab screenshots (scroll, then sweep) to check the sub-sample scroll draws cleanly. node shots.cjs <appBase> <tag>
const {chromium}=require('playwright');const [BASE,TAG]=[process.argv[2],process.argv[3]];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto(BASE+'/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.waitForTimeout(9000);
 await p.locator('.live-native').screenshot({path:`${TAG}_scroll.png`});
 await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(6000);
 await p.locator('.live-native').screenshot({path:`${TAG}_sweep.png`});await b.close();})();
