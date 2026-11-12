// Lab canvas backing size vs CSS size with 1, 2 and 3 methods shown. node canvas_rows.cjs
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 const m=async l=>console.log(l,JSON.stringify(await p.$eval('.signal-panel canvas',c=>{const r=c.getBoundingClientRect();return {backing:[c.width,c.height],css:[Math.round(r.width),Math.round(r.height)],cls:c.className};})));
 await m('1 method ');for(const id of ['M04','M06']){await p.locator('.method-panel .method-list button',{hasText:id}).first().click();await p.waitForTimeout(800);await m(id+' added');}
 await b.close();})();
