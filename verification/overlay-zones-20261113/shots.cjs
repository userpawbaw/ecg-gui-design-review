// D-187 screenshots: live and lab overlay — pointer in each zone (zone bar visible), then a click inside a shared zone (front-most one only).
// node shots.cjs <appBase> <tag>
const {chromium}=require('playwright');const [BASE,TAG]=[process.argv[2],process.argv[3]];
async function zonesNow(cv){return JSON.parse(await cv.evaluate(c=>c.dataset.zones)||'null');}
async function tour(p,cv,shot,label){const box=await cv.boundingBox();await p.mouse.move(box.x+box.width*.55,box.y+box.height*.5);await p.waitForTimeout(700);const Z=await zonesNow(cv);const log=[];
 for(const k of ['up','down'])for(let i=0;i<Z[k].length;i++){const z=await zonesNow(cv),g=z[k][i],prev=i?z[k][i-1].edge:0,mid=(prev+g.edge)/2,y=k==='up'?z.c-mid:z.c+mid;if(y<4||y>box.height-4)continue;
  await p.mouse.move(box.x+box.width*.55,box.y+y);await p.waitForTimeout(700);const h=await cv.evaluate(c=>c.dataset.hov);await shot(`${TAG}_${label}_${k}${i}.png`);log.push(`${k}${i}[${g.names.join('+')}] → ${h}`);
  if(g.names.length>1){await p.mouse.click(box.x+box.width*.55,box.y+y);await p.waitForTimeout(700);log.push(`   click → ${await cv.evaluate(c=>c.dataset.hov)} (layers ${await cv.evaluate(c=>c.dataset.layers)})`);await shot(`${TAG}_${label}_${k}${i}_click.png`);
   await p.mouse.click(box.x+box.width*.55,box.y+y);await p.waitForTimeout(500);log.push(`   2nd click → ${await cv.evaluate(c=>c.dataset.hov)}`);}}
 return log;}
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1300}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+'/?route=lab&bgres=.35&ovdbg=1',{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(9000);
 const lv=p.locator('.live-native canvas').last(),row=p.locator('.live-native .live-row').last();await lv.scrollIntoViewIfNeeded();
 for(const l of await tour(p,lv,f=>row.screenshot({path:f}),'live'))console.log('live',l);
 await p.goto(BASE+'/?route=lab&bgres=.35&ovdbg=1',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 for(const id of ['M04','M06']){await p.locator('.method-panel .method-list button',{hasText:id}).first().click();await p.waitForTimeout(400);}
 await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(4000);
 {const ps=p.getByRole('button',{name:/일시정지/}).first();if(await ps.count())await ps.click();}
 const cv=p.locator('.signal-panel canvas').first(),panel=p.locator('.signal-panel').first();await cv.scrollIntoViewIfNeeded();
 for(const l of await tour(p,cv,f=>panel.screenshot({path:f}),'lab'))console.log('lab',l);
 console.log('errors',errs.join(' | ')||'none');await b.close();})();
