// 실시간 탭: 본문 불투명(배경 1번) 화면 · 중첩 범례의 「입력」 칩(마우스 올림 → 입력 강조, 누름 → 고정)
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:2});
 await p.goto(process.argv[2]+'/?route=lab',{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(5000);
 await p.screenshot({path:'live_split.png'});
 await p.getByRole('button',{name:'중첩',exact:true}).click();await p.waitForTimeout(2500);
 const chips=await p.$$eval('.overlay-chips button, [class*=chip] button',e=>e.map(x=>x.innerText.replace(/\s+/g,' ')));console.log('칩:',chips.join(' | '));
 await p.screenshot({path:'live_overlay.png'});
 const c=p.getByRole('button',{name:/^입력/}).last();await c.hover();await p.waitForTimeout(800);console.log('강조(hover):',await p.$eval('canvas.live-canvas.tall',e=>e.dataset.hov));await p.screenshot({path:'live_overlay_input_hover.png'});
 await c.click();await p.mouse.move(5,5);await p.waitForTimeout(800);console.log('고정 후 aria-pressed:',await c.getAttribute('aria-pressed'),'· 강조:',await p.$eval('canvas.live-canvas.tall',e=>e.dataset.hov));await p.screenshot({path:'live_overlay_input_pinned.png'});
 await b.close();})();
