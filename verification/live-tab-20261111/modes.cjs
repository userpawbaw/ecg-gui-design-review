// same mode in both tabs (sweep, then scroll), glow pinned. node modes.cjs
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1032}});
 await p.goto('http://127.0.0.1:5179/?route=lab&labfx=2',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(4500);await p.screenshot({path:'m_lab_sweep.png'});
 await p.getByRole('button',{name:'스크롤',exact:true}).first().click();await p.waitForTimeout(3000);await p.screenshot({path:'m_lab_scroll.png'});
 await p.getByRole('button',{name:'실시간 측정'}).click();await p.waitForSelector('.live-native canvas',{timeout:60000});await p.waitForTimeout(7000);
 await p.screenshot({path:'m_live_scroll.png'});await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(7000);await p.screenshot({path:'m_live_sweep.png'});
 await b.close();})();
