import {test,expect} from '@playwright/test';
// R1 intro (D-041): the heart and the sweep share one clock — at every R of the stored record the sweep head sits on
// that R sample and the heart flash/contraction starts on the same frame (IDEA-R1-INTRO U7, "타이밍이 어긋나면 구현하지 않는 것만 못한").
type I={state:{p:number,t:number,headAbs:number,heart:{V:number,flash:number},wave:{state:string},mix:number,label:string},set:(o:{p?:number,t?:number|null})=>void,renderOnce:(draw?:boolean)=>void,loop:{start:number,end:number,beats:number[]},fs:number,winner:string};
const intro=()=>(window as unknown as {__intro:I}).__intro;

test('intro: every R peak lands on the heartbeat frame',async({page})=>{
 test.setTimeout(180000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?p=0.9&t=0');await page.waitForFunction(()=>(window as any).__intro,null,{timeout:150000});await page.evaluate(()=>(window as any).__intro.pause(true));
 const r=await page.evaluate(()=>{
  const i=(window as any).__intro as I,fs=i.fs,L=i.loop,len=(L.end-L.start)/fs,rows:number[][]=[];
  // arm the sweep (W4) by walking the clock, then check two full loops of beats
  i.set({p:.9,t:0});for(let k=0;k<180;k++){i.set({t:k/60});i.renderOnce(false);}
  for(let cycle=1;cycle<=2;cycle++)for(const b of L.beats){
   const tR=cycle*len+(b-L.start)/fs;
   i.set({t:tR-1/60});i.renderOnce(false);const before=i.state.heart.flash;
   i.set({t:tR});i.renderOnce(false);
   const len2=L.end-L.start,idx=L.start+((i.state.headAbs%len2)+len2)%len2;
   rows.push([b,idx,before,i.state.heart.flash,i.state.heart.V]);
  }
  return{rows,wave:i.state.wave.state,winner:i.winner,beats:L.beats.length};
 });
 expect(r.wave).toBe('on');expect(r.winner).toBe('M06');
 expect(r.rows.length).toBe(2*r.beats);                         // two full loops (15 beats in the 10 s S038 loop, 45 in the 40 s S022 one, D-066)
 for(const [b,idx,before,flash,V] of r.rows){
  expect(idx,'sweep head on the R sample').toBe(b);
  expect(flash,'heart flash peaks on the R frame').toBeGreaterThan(1.25);
  expect(before,'no flash one frame earlier').toBeLessThan(.6);
  expect(V,'contraction starts at R, not before').toBeLessThan(.05);
 }
 expect(errors).toEqual([]);
});

test('intro: labels, stored-output note and Lab handoff (10 s bank: stored metrics of S038)',async({page})=>{
 test.setTimeout(180000);
 await page.goto('/?p=0.99&t=0&long=0');await page.waitForFunction(()=>(window as any).__intro,null,{timeout:150000});
 await page.evaluate(()=>{const i=(window as any).__intro;i.pause(true);i.set({p:.99,t:0});for(let k=0;k<=480;k++){i.set({t:k/60});i.renderOnce(false);}});
 await expect(page.locator('.it-title')).toContainText('심전도');
 // T2 + L1: after four beat-released steps the output tier is current and shows the stored metrics (no method name)
 const st=await page.evaluate(()=>{const s=(window as any).__intro.state;return{mix:s.mix,label:s.label};});
 expect(st.mix).toBe(1);expect(st.label).toBe('out');
 await expect(page.locator('.it-lab.out.is-current b')).toHaveText('잡음 제거 출력');
 await expect(page.locator('.it-lab.out small')).toHaveText('SNR 0 dB → 12.44 dB · cc 0.971');
 await expect(page.locator('.it-steps i.on')).toHaveCount(4);
 await expect(page.getByText(/합성 기록 S038/)).toBeVisible();
 await page.getByRole('button',{name:'직접 비교해 보기'}).click();
 const lab=page.locator('.large-dialog canvas.ecg-canvas');await expect(lab).toHaveAttribute('aria-label',/M06 출력/,{timeout:30000});
});

test('intro: with the 600 s package the note names its record and the metrics are computed over the loop shown (D-066)',async({page})=>{
 test.setTimeout(180000);
 const has=await page.request.get('/replay/manifest.json').then(r=>r.ok()).catch(()=>false);test.skip(!has,'no replay package (prototype/v2/public/replay)');
 await page.goto('/?p=0.99&t=0');await page.waitForFunction(()=>(window as any).__intro,null,{timeout:150000});
 await page.evaluate(()=>{const i=(window as any).__intro;i.pause(true);i.set({p:.99,t:0});for(let k=0;k<=480;k++){i.set({t:k/60});i.renderOnce(false);}});
 await expect(page.getByText(/합성 기록 S022 · .* 3\d\.\d s 반복 재생/)).toBeVisible();
 await expect(page.locator('.it-lab.out small')).toHaveText(/^SNR 0 dB → \d+\.\d\d dB · cc 0\.\d{3}$/);
});

test('intro: cross-fade follows the scroll (D-055) — at the end of the range it rises to 1 and never goes back',async({page})=>{
 test.setTimeout(180000);
 await page.goto('/?p=0.99&t=0');await page.waitForFunction(()=>(window as any).__intro,null,{timeout:150000});
 const r=await page.evaluate(()=>{
  const i=(window as any).__intro,fs=i.fs;i.pause(true);i.set({p:.99,t:0});
  const out:number[][]=[];let last=-1;
  for(let k=0;k<=540;k++){const t=k/60;i.set({t});i.renderOnce(false);const m=i.state.mix;
   if(Math.abs(m-last)>1e-9){out.push([t,m]);last=m;}}
  return{out,beats:i.loop.beats.map((b:number)=>(b-i.loop.start)/fs),start:i.loop.start};
 });
 // (T2's quarter per R peak was replaced by D-055; this test still asserted T2 and failed on S038 too, 2026-10-13)
 const ms=r.out.map(([,m]:number[])=>m);
 expect(ms[ms.length-1]).toBe(1);for(let k=1;k<ms.length;k++)expect(ms[k]).toBeGreaterThanOrEqual(ms[k-1]);
});
