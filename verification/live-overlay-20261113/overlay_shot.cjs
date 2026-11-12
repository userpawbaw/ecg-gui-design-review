// Live tab overlay mode (sweep and scroll) screenshot of the overlay canvas. node overlay_shot.cjs <appBase> <tag> [extra query]
const {chromium}=require('playwright');const [BASE,TAG,EXTRA]=[process.argv[2],process.argv[3],process.argv[4]||''];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto(BASE+'/?route=lab&bgres=.35'+EXTRA,{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.waitForTimeout(9000);
 const cv=p.locator('.live-native canvas').last();await cv.screenshot({path:`${TAG}_scroll.png`});
 await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(6000);await cv.screenshot({path:`${TAG}_sweep.png`});await b.close();})();
