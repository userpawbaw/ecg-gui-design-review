// D-187: park the pointer at fixed heights in the live overlay for SEC s each (sampling every 250 ms) and count how often the emphasised set
// and the zone composition change. Heights: middle of each up/down zone as measured at the start. node stability.cjs <appBase> <tag> [sec] [extra]
const {chromium}=require('playwright');const [BASE,TAG,SEC,EX]=[process.argv[2],process.argv[3],Number(process.argv[4]||20),process.argv[5]||''];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1100}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+'/?route=lab&bgres=.35&ovdbg=1'+EX,{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(10000);
 const cv=p.locator('.live-native canvas').last(),box=await cv.boundingBox(),row=p.locator('.live-native .live-row').last();
 await p.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await p.waitForTimeout(600);
 const Z=JSON.parse(await cv.evaluate(c=>c.dataset.zones));const spots=[];
 for(const k of ['up','down'])Z[k].forEach((g,i)=>{const prev=i?Z[k][i-1].edge:0,mid=(prev+g.edge)/2;spots.push({lab:`${k}${i}[${g.names.join('+')}]`,y:k==='up'?Z.c-mid:Z.c+mid});});
 console.log('zones at start',JSON.stringify(Z));
 for(const s of spots){await p.mouse.move(box.x+box.width*.5,box.y+s.y);await p.waitForTimeout(400);let lastH=null,lastZ=null,ch=0,zc=0;const seen={};
  for(let i=0;i<SEC*4;i++){await p.waitForTimeout(250);const [h,z]=await cv.evaluate(c=>{const z=c.dataset.zones?JSON.parse(c.dataset.zones):null;return [c.dataset.hov||'-',z?[...z.up,{names:['|']},...z.down].map(g=>[...g.names].sort().join('+')).join('/'):''];});
   seen[h]=(seen[h]||0)+1;if(lastH!==null&&h!==lastH)ch++;if(lastZ!==null&&z!==lastZ)zc++;lastH=h;lastZ=z;}
  await row.screenshot({path:`${TAG}_${s.lab.replace(/[\[\]+]/g,'_')}.png`});
  console.log(`${s.lab} y=${s.y.toFixed(0)}: emphasis changes ${ch} in ${SEC}s, zone-composition changes ${zc} · shares ${JSON.stringify(seen)}`);}
 console.log('errors',errs.join(' | ')||'none');await b.close();})();
