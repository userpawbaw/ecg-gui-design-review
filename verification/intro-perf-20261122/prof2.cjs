// D-190 round 2 (user: 「후처리 한번에 + FXAA … 비교하게」): ?perf= variants — wall fps over 20 s at 640 × 400 (software renderer, ratios only),
// and a 1280 × 800 still of each at the same frozen view and clock (?t= freezes the grain) for an image diff against the baseline.
// node prof2.cjs <appBase> <view p>
const {chromium}=require('playwright');const [BASE,PV]=[process.argv[2],Number(process.argv[3]||.25)];
const CONF=[['기준',''],['후처리 합치기','merge'],['FXAA(MSAA 대신)','fxaa'],['합치기 + FXAA','merge,fxaa'],['MSAA 끔(비교)','msaa'],['합치기 + FXAA + 픽셀 비 0.75','merge,fxaa,pr75']];
(async()=>{const b=await chromium.launch();
 for(const [label,q] of CONF){const p=await b.newPage({viewport:{width:640,height:400}});
  await p.goto(`${BASE}/?perf=${q}`,{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:120000});
  await p.evaluate(v=>globalThis.__intro.set({p:v}),PV);await p.waitForTimeout(4000);
  const f0=await p.evaluate(()=>globalThis.__intro.state.frame),t0=Date.now();await p.waitForTimeout(20000);const f1=await p.evaluate(()=>globalThis.__intro.state.frame);
  console.log(label.padEnd(26),'fps',((f1-f0)/((Date.now()-t0)/1000)).toFixed(2));await p.close();
  const s=await b.newPage({viewport:{width:1280,height:800}});await s.goto(`${BASE}/?perf=${q}`,{waitUntil:'networkidle'});await s.waitForFunction(()=>globalThis.__intro,null,{timeout:120000});
  await s.evaluate(v=>{globalThis.__intro.set({p:v,t:3});},PV);await s.waitForTimeout(6000);await s.screenshot({path:`p2_${PV}_${q||'base'}.png`.replace(/,/g,'+')});await s.close();}
 await b.close();})();
