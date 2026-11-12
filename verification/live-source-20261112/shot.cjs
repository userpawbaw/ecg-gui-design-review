// Live tab (scroll, default) after the axis settles: screenshot of the waveform panels. node shot.cjs <out.png>
const {chromium}=require('playwright');const out=process.argv[2];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(1500);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.waitForTimeout(Number(process.env.WAIT||14000));
 await p.locator('.live-native').screenshot({path:out});await b.close();})();
