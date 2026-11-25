const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const errs=[];
 for(const [q,tag] of [['&livelayers=0','old'],['','new']]){const p=await b.newPage({viewport:{width:1600,height:1000}});p.on('pageerror',e=>errs.push(tag+': '+e));
  await p.goto(process.argv[2]+'/?route=lab'+q,{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(5000);
  await p.getByRole('button',{name:'중첩'}).click();await p.waitForTimeout(5000);await p.locator('.live-row').first().screenshot({path:`${tag}_overlay.png`});
  const box=await p.locator('.live-canvas.tall').boundingBox();await p.mouse.move(box.x+box.width*.5,box.y+box.height*.45);await p.waitForTimeout(1500);await p.locator('.live-row').first().screenshot({path:`${tag}_overlay_hover.png`});await p.close();}
 console.log('오류',errs.join(' | ')||'없음');await b.close();})();
