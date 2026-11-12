// Overlay (scroll is fine; sweep keeps old samples still): move the pointer over a grid inside the plot and record which series the app
// picks at each point where at least one trace is within the radius. Counts picks per series, and the points where a clean trace (tier front)
// was within the radius but a rougher one was picked. node pick_scan.cjs <appBase> <tag> [extra]
const {chromium}=require('playwright');const [BASE,TAG,EXTRA]=[process.argv[2],process.argv[3],process.argv[4]||''];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto(BASE+'/?route=lab&bgres=.35&ovdbg=1'+EXTRA,{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(7000);
 const cv=p.locator('.live-native canvas').last();const box=await cv.boundingBox();
 const cnt={},buried={n:0,of:0};
 for(const fx of [.2,.35,.5,.65,.8])for(let y=box.height*.2;y<box.height*.8;y+=5){await p.mouse.move(box.x+box.width*fx,box.y+y);await p.waitForTimeout(40);
  const d=await p.evaluate(()=>globalThis.__ovDbg);if(!d||!d.dd)continue;const inR=d.dd.filter(c=>c.dist<=16);if(!inR.length)continue;
  cnt[d.hit??'none']=(cnt[d.hit??'none']||0)+1;const clean=inR.filter(c=>c.name!=='raw'&&c.name!=='M01'&&c.name!=='M_FE');
  if(clean.length){buried.of++;if(d.hit==='raw'||d.hit==='M01'||d.hit==='M_FE'||!d.hit)buried.n++;}
  await p.mouse.move(box.x+box.width/2,box.y+box.height+40);await p.waitForTimeout(20);}
 await b.close();console.log(TAG,'picks',JSON.stringify(cnt),'· points with a clean trace within 16 px:',buried.of,'→ picked raw/noisy instead:',buried.n);})();
