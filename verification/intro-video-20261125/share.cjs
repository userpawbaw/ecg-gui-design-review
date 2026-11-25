// 2026-11-25 영상 대체 판단: 파형 단계(p 0.8)에서 3D 장면 · 파형 패널이 각각 프레임 시간의 얼마를 쓰는지 — wall fps 비(소프트웨어 렌더, 상대값만), 두 크기.
const {chromium}=require('playwright');const BASE=process.argv[2];
const CONF=[['기준',''],['3D 안 그림(nogl)','nogl'],['파형 안 그림(nosweep)','nosweep'],['둘 다 안 그림','nogl,nosweep']];
(async()=>{const b=await chromium.launch();
 for(const [W,H] of [[640,400],[1280,800]]){console.log(`-- ${W}×${H}`);
 for(const [label,q] of CONF){const p=await b.newPage({viewport:{width:W,height:H}});
  await p.goto(`${BASE}/?perf=${q}`,{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:120000});
  await p.evaluate(()=>globalThis.__intro.set({p:.8}));await p.waitForTimeout(4000);
  const f0=await p.evaluate(()=>globalThis.__intro.state.frame),t0=Date.now();await p.waitForTimeout(15000);const f1=await p.evaluate(()=>globalThis.__intro.state.frame);
  console.log(label.padEnd(22),'fps',((f1-f0)/((Date.now()-t0)/1000)).toFixed(2));await p.close();}}
 await b.close();})();
