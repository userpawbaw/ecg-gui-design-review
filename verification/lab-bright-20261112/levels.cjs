// Lab playback without pinning: the canvas reports its glow level (data-fx: 2 full · 1 reduced · 0 none) and frame time (data-frame-ms).
// Sampled every second for 12 s with 1 method shown and with 3 methods shown. node levels.cjs <tag> [extra query]
const {chromium}=require('playwright');const TAG=process.argv[2]||'cur',EXTRA=process.argv[3]||'';
async function run(add){const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35'+EXTRA,{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 for(const id of add){await p.locator('.method-panel .method-list button',{hasText:id}).first().click();await p.waitForTimeout(600);}
 await p.getByRole('button',{name:/재생/}).first().click();const s=[];
 for(let i=0;i<4;i++){await p.waitForTimeout(1000);s.push(await p.$eval('.signal-panel canvas',c=>`${c.dataset.fx}@${c.dataset.frameMs}`));if(i===2)await p.locator('.signal-panel').first().screenshot({path:`${TAG}_${add.length+1}methods.png`});}
 s.push(await p.$eval('.signal-panel canvas',c=>'time '+c.dataset.time));await b.close();return s;}
(async()=>{console.log(TAG,'1 method :',(await run([])).join(' '));console.log(TAG,'3 methods:',(await run(['M04','M06'])).join(' '));})();
