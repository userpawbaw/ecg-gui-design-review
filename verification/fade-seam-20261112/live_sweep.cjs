// Live tab in sweep mode: 4 screenshots 0.7 s apart of the first method panel (to find the fade end right of the erase gap). node live_sweep.cjs <tag>
const {chromium}=require('playwright');const TAG=process.argv[2]||'x';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(1500);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(12000);
 const cv=p.locator('.live-native canvas').nth(1);await cv.scrollIntoViewIfNeeded();
 for(let k=0;k<4;k++){await cv.screenshot({path:`${TAG}_${k}.png`});await p.waitForTimeout(700);}await b.close();})();
