// 투어 끝 → 원래 방식(스윕)으로 돌아가는 프레임 앞뒤 화면(그래프 칸). OUT 접두어로 저장
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const pre=process.env.OUT||'after';
 const p=await b.newPage({viewport:{width:1600,height:1000}});await p.goto(process.argv[2]+'/?route=disease&disease=pvc&tourdbg',{waitUntil:'load'});await p.waitForSelector('.dt-layer');await p.waitForTimeout(2000);
 await p.getByRole('button',{name:'재생'}).click();
 // 마지막 단계 out 까지 기다렸다가, 모드가 바뀌기 직전 · 직후를 멈춰서 찍는다
 await p.waitForFunction(()=>globalThis.__tour.S.phase==='out'&&globalThis.__tour.S.k===2,null,{timeout:120000,polling:20});
 const mode0=await p.evaluate(()=>globalThis.__tour.getMode());
 await p.waitForFunction(m=>globalThis.__tour.getMode()!==m,mode0,{timeout:20000,polling:'raf'});
 const a=await p.evaluate(()=>{const T=globalThis.__tour;T.transport.pause?.();return [T.transport.time,T.getMode()];});
 await p.waitForTimeout(300);const plot=p.locator('.plot-wrap').first();await plot.screenshot({path:pre+'_switch_new.png'});
 await p.evaluate(m=>globalThis.__tour.setMode(m),mode0);await p.waitForTimeout(300);await plot.screenshot({path:pre+'_switch_old.png'});
 // 이전 동작 재현: 끝난 그 시각(19.5 s, 구간 중간)에 바로 바꾸면
 await p.evaluate(()=>{const T=globalThis.__tour;T.transport.time=19.5;T.S.lastTime=19.5;T.setMode('scroll');});await p.waitForTimeout(300);await plot.screenshot({path:'before_end_scroll.png'});
 await p.evaluate(()=>globalThis.__tour.setMode('sweep'));await p.waitForTimeout(300);await plot.screenshot({path:'before_end_sweep.png'});
 console.log('바뀐 순간',JSON.stringify(a));await b.close();})();
