// Lab overlay: 3 methods, 중첩, play → screenshot; pin two chips → screenshot; pause, hover a trace found by scanning → screenshot.
// node lab_overlay.cjs <appBase> <tag>
const {chromium}=require('playwright');const [BASE,TAG]=[process.argv[2],process.argv[3]];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1100}});
 const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+'/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 for(const id of ['M04','M06']){await p.locator('.method-panel .method-list button',{hasText:id}).first().click();await p.waitForTimeout(500);}
 await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.waitForTimeout(400);
 const panel=p.locator('.signal-panel').first();
 await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(1200);await panel.screenshot({path:`${TAG}_0_overlay.png`});
 const chips=await p.$$eval('.ov-chip',e=>e.map(x=>x.dataset.series));console.log('chips',chips.join(','));
 await p.click(`.ov-chip[data-series="${chips[2]}"]`);await p.click(`.ov-chip[data-series="${chips[3]}"]`);await p.mouse.move(5,5);await p.waitForTimeout(900);
 await panel.screenshot({path:`${TAG}_1_pin2.png`});
 await p.click(`.ov-chip[data-series="${chips[2]}"]`);await p.click(`.ov-chip[data-series="${chips[3]}"]`);   // unpin
 {const ps=p.getByRole('button',{name:/일시정지/}).first();if(await ps.count())await ps.click();}await p.waitForTimeout(500);
 const cv=p.locator('.signal-panel canvas').first(),box=await cv.boundingBox();
 // hover: scan a column; cursor turns into a pointer on a pickable trace
 let found=null;for(let y=box.height*.3;y<box.height*.8&&!found;y+=3){await p.mouse.move(box.x+box.width*.4,box.y+y);await p.waitForTimeout(40);if(await cv.evaluate(c=>c.style.cursor)==='pointer')found=y;}
 await p.waitForTimeout(700);await panel.screenshot({path:`${TAG}_2_hover.png`});console.log('hover at y',found,'errors',errs.join(' | ')||'none');await b.close();})();
