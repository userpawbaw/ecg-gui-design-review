// 중첩: 범례 단추(SWT)에 마우스 → 그 기법 강조. 이전 · 새 비교 + 새 구조 창 불투명도
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
 for(const [q,tag] of [['&livelayers=0','old'],['','new']]){const p=await b.newPage({viewport:{width:1600,height:1000}});
  await p.goto(process.argv[2]+'/?route=lab'+q,{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(4000);
  await p.getByRole('button',{name:'중첩'}).click();await p.waitForTimeout(3000);
  await p.locator('.live-row button',{hasText:'SWT'}).first().hover();await p.waitForTimeout(1500);await p.locator('.live-row').first().screenshot({path:`${tag}_chip.png`});
  if(tag==='new')console.log(await p.evaluate(()=>{const c=document.querySelector('.live-canvas.tall');const clip=c.parentElement.lastElementChild.firstElementChild;return [...clip.children].filter(b=>b.style.display!=='none').map(b=>[...b.children].map(w=>w.style.opacity).join('/')).join('  ');}));
  await p.close();}
 await b.close();})();
