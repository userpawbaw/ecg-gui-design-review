// D-187: hover by height zone. Live (sweep) and lab overlay with ?ovdbg: read the zones, park the pointer at the middle of each zone for 3 s
// sampling the emphasised set every 100 ms (should never change), screenshot each; then a vertical sweep at one x listing the zone per height.
// node zones_check.cjs <appBase> <tag> [extra query]
const {chromium}=require('playwright');const [BASE,TAG,EX]=[process.argv[2],process.argv[3],process.argv[4]||''];
const focusOf=c=>c.evaluate(c=>c.dataset.focus+'|'+(globalThis.__ovDbg?.zone??''));
async function park(p,cv,box,Z,label,shot){const out=[];
 for(const k of ['up','down'])Z[k].forEach((b,i)=>{const prev=i?Z[k][i-1].edge:0,mid=(prev+b.edge)/2;out.push({k,i,names:b.names.join('+'),y:k==='up'?Z.c-mid:Z.c+mid});});
 const res=[];for(const o of out){if(o.y<6||o.y>box.height-6)continue;await p.mouse.move(box.x+box.width*.5,box.y+o.y);await p.waitForTimeout(500);
  const seen=new Set();for(let i=0;i<30;i++){await p.waitForTimeout(100);seen.add(await cv.evaluate(c=>c.dataset.hov||'-'));}
  if(shot)await shot(`${TAG}_${label}_${o.k}${o.i}.png`);
  const before=await cv.evaluate(c=>c.dataset.hov);await p.mouse.click(box.x+box.width*.5,box.y+o.y);await p.waitForTimeout(500);const after=await cv.evaluate(c=>c.dataset.hov);
  res.push(`${o.k}${o.i} [${o.names}] y=${o.y.toFixed(0)} → emphasised sets over 3 s: ${[...seen].join(' / ')} · click: ${before} → ${after}`);await p.mouse.move(box.x+box.width/2,box.y+box.height+80);await p.waitForTimeout(400);}
 return res;}
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1100}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+'/?route=lab&bgres=.35&ovdbg=1'+EX,{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(8000);
 const lv=p.locator('.live-native canvas').last(),box=await lv.boundingBox(),row=p.locator('.live-native .live-row').last();
 await p.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await p.waitForTimeout(800);
 const Z=JSON.parse(await lv.evaluate(c=>c.dataset.zones)||'null');console.log('live zones',JSON.stringify(Z));
 if(Z)for(const l of await park(p,lv,box,Z,'live',f=>row.screenshot({path:f})))console.log(' ',l);
 // lab
 await p.goto(BASE+'/?route=lab&bgres=.35&ovdbg=1'+EX,{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 for(const id of ['M04','M06']){await p.locator('.method-panel .method-list button',{hasText:id}).first().click();await p.waitForTimeout(400);}
 await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(3000);
 const cv=p.locator('.signal-panel canvas').first(),bx=await cv.boundingBox(),panel=p.locator('.signal-panel').first();
 await p.mouse.move(bx.x+bx.width*.5,bx.y+bx.height*.5);await p.waitForTimeout(800);
 const ZL=JSON.parse(await cv.evaluate(c=>c.dataset.zones)||'null');console.log('lab zones',JSON.stringify(ZL));
 if(ZL)for(const l of await park(p,cv,bx,ZL,'lab',f=>panel.screenshot({path:f})))console.log(' ',l);
 console.log('errors',errs.join(' | ')||'none');await b.close();})();
