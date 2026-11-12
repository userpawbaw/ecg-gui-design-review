// Overlay focus screenshots: idle, mouse on the trace of each method colour (found by scanning a canvas column), after leaving.
// node focus_shots.cjs <appBase> <tag>
const {chromium}=require('playwright');const [BASE,TAG]=[process.argv[2],process.argv[3]];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto(BASE+'/?route=lab&bgres=.35&ovdbg=1',{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.getByRole('button',{name:'중첩',exact:true}).first().click();
 await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(8000);
 const cv=p.locator('.live-native canvas').last();const box=await cv.boundingBox();
 await cv.screenshot({path:`${TAG}_0_idle.png`});
 // find, for each method, a pointer position where its trace is near (< 8 px) and the others are far (sweep mode: old samples stay still)
 const rows=[];for(const fx of [.15,.3,.45,.6]){const X=box.width*fx;for(let y=20;y<box.height-20;y+=3){await p.mouse.move(box.x+X,box.y+y);await p.waitForTimeout(25);
  rows.push({X,y,d:await p.evaluate(()=>globalThis.__ovDbg?.dd||[])});}}
 const best={};for(const r of rows)for(const c of r.d){if(c.name==='raw'||c.dist>8)continue;const other=Math.min(...r.d.filter(o=>o.name!==c.name).map(o=>o.dist));const m=other-c.dist;if(!best[c.name]||m>best[c.name].m)best[c.name]={m,X:r.X,y:r.y,dist:c.dist};}
 await p.mouse.move(box.x+box.width/2,box.y+box.height+50);await p.waitForTimeout(900);let k=1;
 for(const [n,f] of Object.entries(best)){await p.mouse.move(box.x+f.X,box.y+f.y);await p.waitForTimeout(700);await cv.screenshot({path:`${TAG}_${k++}_hover_${n}.png`});   // A → B → C directly (no leave in between)
  console.log('hover',n,'at',f.X.toFixed(0),f.y,'dist',f.dist.toFixed(1),'margin',f.m.toFixed(1),'cursor',await cv.evaluate(c=>c.style.cursor));}
 await p.mouse.move(box.x+box.width/2,box.y+box.height+50);await p.waitForTimeout(900);await cv.screenshot({path:`${TAG}_${k}_left.png`});await b.close();})();
