// D-186: live + lab overlay — (1) the 3 s entry tip (shot at 0.7 s and 4 s), (2) layer/front order the app uses (?ovdbg data-layers),
// (3) hover scan: at grid points with ≥1 trace within 16 px, which series is picked (pointer leaves between points, so no stickiness).
// node layers_check.cjs <appBase> <tag>
const {chromium}=require('playwright');const [BASE,TAG]=[process.argv[2],process.argv[3]];
const scan=async(p,cv,dbg)=>{const box=await cv.boundingBox(),cnt={},near={};
 for(const fx of [.2,.35,.5,.65,.8])for(let y=box.height*.2;y<box.height*.85;y+=5){await p.mouse.move(box.x+box.width*fx,box.y+y);await p.waitForTimeout(40);
  const r=await dbg();if(!r)continue;const inR=r.dd.filter(c=>c.dist<=16);if(!inR.length)continue;cnt[r.hit??'none']=(cnt[r.hit??'none']||0)+1;
  for(const c of inR)near[c.name]=(near[c.name]||0)+1;await p.mouse.move(box.x+box.width/2,box.y+box.height+60);await p.waitForTimeout(25);}
 return {picks:cnt,within16:near};};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1100}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 // live
 await p.goto(BASE+'/?route=lab&bgres=.35&ovdbg=1',{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.waitForTimeout(4000);
 await p.getByRole('button',{name:'중첩',exact:true}).first().click();const row=p.locator('.live-native .live-row').last();
 await p.waitForTimeout(700);await row.screenshot({path:`${TAG}_live_tip.png`});
 const lv=p.locator('.live-native canvas').last();const L=[];for(let i=0;i<6;i++){await p.waitForTimeout(1000);L.push(await lv.evaluate(c=>c.dataset.layers));}
 await row.screenshot({path:`${TAG}_live_after.png`});console.log('live layers (name:front/tier) per s:\n '+L.join('\n '));
 console.log('live tip opacity now',await p.$eval('.ov-tip',e=>getComputedStyle(e).opacity));
 await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(1500);
 console.log('live scan',JSON.stringify(await scan(p,lv,()=>p.evaluate(()=>globalThis.__ovDbg))));
 // lab
 await p.getByRole('button',{name:'실험실',exact:false}).first().click().catch(()=>{});await p.goto(BASE+'/?route=lab&bgres=.35&ovdbg=1',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 for(const id of ['M04','M06']){await p.locator('.method-panel .method-list button',{hasText:id}).first().click();await p.waitForTimeout(400);}
 await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(2500);
 await p.getByRole('button',{name:'중첩',exact:true}).first().click();const panel=p.locator('.signal-panel').first();
 await p.waitForTimeout(700);await panel.screenshot({path:`${TAG}_lab_tip.png`});
 const cv=p.locator('.signal-panel canvas').first();const B=[];for(let i=0;i<4;i++){await p.waitForTimeout(1000);B.push(await cv.evaluate(c=>c.dataset.layers));}
 console.log('lab layers per s:\n '+B.join('\n '));
 {const ps=p.getByRole('button',{name:/일시정지/}).first();if(await ps.count())await ps.click();}await p.waitForTimeout(600);await panel.screenshot({path:`${TAG}_lab_after.png`});
 console.log('lab scan',JSON.stringify(await scan(p,cv,()=>cv.evaluate(c=>{const s=c.dataset.cands;if(!s)return null;return {hit:c.dataset.focus||null,dd:s.split(' ').filter(Boolean).map(x=>{const [n,d]=x.split(':');return {name:n,dist:+d};})};}))));
 console.log('errors',errs.join(' | ')||'none');await b.close();})();
