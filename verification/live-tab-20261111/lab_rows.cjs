// Lab: pick three methods, play, capture the waveform panel; per-row brightness of the trace (mean of the brightest 0.5 % pixels and
// the glow halo = mean of pixels 3–8 px around the trace). node lab_rows.cjs <outdir> <tag>
const {chromium}=require('playwright');const OUT=process.argv[2]||'.',TAG=process.argv[3]||'new';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 await p.goto('http://127.0.0.1:5179/?route=lab&bg=v18&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 for(const id of ['M04','M06']){const btn=p.locator('.method-panel .method-list button',{hasText:id}).first();await btn.click();await p.waitForTimeout(1200);}
 await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(4000);
 const panel=p.locator('.signal-panel').first();await panel.screenshot({path:`${OUT}/lab_rows_${TAG}.png`});
 const canvases=await p.$$eval('.signal-panel canvas',cs=>cs.map(c=>{const r=c.getBoundingClientRect();return {w:c.width,h:c.height,top:r.top,height:r.height};}));
 console.log(TAG,JSON.stringify(canvases));await b.close();})();
