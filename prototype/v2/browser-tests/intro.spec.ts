import {test,expect} from '@playwright/test';
// R1 intro (D-041): the heart and the sweep share one clock — at every R of the stored record the sweep head sits on
// that R sample and the heart flash/contraction starts on the same frame (IDEA-R1-INTRO U7, "타이밍이 어긋나면 구현하지 않는 것만 못한").
type I={state:{p:number,t:number,headAbs:number,heart:{V:number,flash:number},wave:{state:string}},set:(o:{p?:number,t?:number|null})=>void,renderOnce:(draw?:boolean)=>void,loop:{start:number,end:number,beats:number[]},fs:number,winner:string};
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
  return{rows,wave:i.state.wave.state,winner:i.winner};
 });
 expect(r.wave).toBe('on');expect(r.winner).toBe('M06');
 expect(r.rows.length).toBe(30);
 for(const [b,idx,before,flash,V] of r.rows){
  expect(idx,'sweep head on the R sample').toBe(b);
  expect(flash,'heart flash peaks on the R frame').toBeGreaterThan(1.25);
  expect(before,'no flash one frame earlier').toBeLessThan(.6);
  expect(V,'contraction starts at R, not before').toBeLessThan(.05);
 }
 expect(errors).toEqual([]);
});

test('intro: labels, stored-output note and Lab handoff',async({page})=>{
 test.setTimeout(180000);
 await page.goto('/?p=0.99&t=4');await page.waitForFunction(()=>(window as any).__intro,null,{timeout:150000});
 await expect(page.locator('.it-title')).toContainText('심전도');
 await expect(page.getByText('잡음 제거 출력 · 저장값')).toBeAttached();
 await expect(page.getByText(/합성 기록 S038/)).toBeVisible();
 await page.getByRole('button',{name:'직접 비교해 보기'}).click();
 const lab=page.locator('.large-dialog canvas.ecg-canvas');await expect(lab).toHaveAttribute('aria-label',/M06 출력/,{timeout:30000});
});
