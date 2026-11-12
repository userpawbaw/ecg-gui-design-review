// Overlay click cycling (lab or live): find a spot where ≥ 2 traces are under the pointer (scan a column; candidates come from cursor =
// pointer and from clicking), hover → note focus, click ×3 at the same spot → focus after each click, move along a bit → focus stays.
// node click_cycle.cjs <appBase> <lab|live> <tag>
const {chromium}=require('playwright');const [BASE,WHERE,TAG]=[process.argv[2],process.argv[3],process.argv[4]];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1100}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(BASE+'/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(2500);let cv;
 if(WHERE==='lab'){for(const id of ['M04','M06']){await p.locator('.method-panel .method-list button',{hasText:id}).first().click();await p.waitForTimeout(400);}
  await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(1500);
  const ps=p.getByRole('button',{name:/일시정지/}).first();if(await ps.count())await ps.click();await p.waitForTimeout(400);cv=p.locator('.signal-panel canvas').first();}
 else{await p.getByRole('button',{name:'실시간 측정'}).click();await p.waitForSelector('.live-native canvas',{timeout:60000});await p.getByRole('button',{name:'중첩',exact:true}).first().click();
  await p.getByRole('button',{name:'스윕',exact:true}).first().click();await p.waitForTimeout(6000);cv=p.locator('.live-native canvas').last();}
 const box=await cv.boundingBox(),F=()=>cv.evaluate(c=>c.dataset.focus||'');
 // scan: a spot where the focus appears; then try clicks there
 const X=box.width*.42;let res=null;
 for(let y=box.height*.25;y<box.height*.85&&!res;y+=4){await p.mouse.move(box.x+X,box.y+y);await p.waitForTimeout(60);const f0=await F();if(!f0)continue;
  const seq=[f0];for(let k=0;k<3;k++){await p.mouse.click(box.x+X,box.y+y);await p.waitForTimeout(120);seq.push(await F());}
  if(new Set(seq).size>1)res={y,seq};else{await p.mouse.move(box.x+box.width/2,box.y+box.height+40);await p.waitForTimeout(300);}}
 if(!res){console.log(WHERE,'no overlapping spot found',errs.join('|'));await b.close();return;}
 await p.waitForTimeout(500);await cv.screenshot({path:`${TAG}_${WHERE}_after_clicks.png`});
 // sticky: move 6 px along without clicking → same focus
 const before=await F();for(let k=1;k<=4;k++){await p.mouse.move(box.x+X+k,box.y+res.y+(k%2));await p.waitForTimeout(60);}await p.waitForTimeout(150);const after=await F();
 console.log(WHERE,'spot y',res.y.toFixed(0),'hover→click×3:',res.seq.join(' → '),'| small moves (1–4 px):',before,'→',after,'| errors',errs.join('|')||'none');await b.close();})();
