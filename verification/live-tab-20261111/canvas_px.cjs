// backing-store size vs CSS size of the plot canvases, and the live fx level. node canvas_px.cjs <dpr>
const {chromium}=require('playwright');const DPR=Number(process.argv[2]||1);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1032},deviceScaleFactor:DPR});
 await p.goto('http://127.0.0.1:5179/?route=lab',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 console.log('lab',JSON.stringify(await p.$$eval('.signal-panel canvas',cs=>cs.map(c=>[c.width,c.height,Math.round(c.getBoundingClientRect().width),Math.round(c.getBoundingClientRect().height)]))));
 await p.getByRole('button',{name:'실시간 측정'}).click();await p.waitForSelector('.live-native canvas',{timeout:60000});await p.waitForTimeout(6000);
 console.log('live',JSON.stringify(await p.$$eval('.live-native canvas',cs=>cs.map(c=>[c.width,c.height,Math.round(c.getBoundingClientRect().width),Math.round(c.getBoundingClientRect().height)]))));
 await b.close();})();
