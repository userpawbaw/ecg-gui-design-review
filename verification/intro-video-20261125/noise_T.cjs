// D-196: 잡음 장면별 신호 길이 T(반복 주기) · 카메라 고정 시각 — 영상 반복 길이 판단
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:640,height:360}});
 for(const c of ['pli','bw','ma']){await p.goto(`${process.argv[2]}/?story=noise&cond=${c}`,{waitUntil:'networkidle'});await p.waitForTimeout(8000);
  console.log(c,await p.evaluate(()=>{const n=globalThis.__noise;if(!n)return 'no __noise '+Object.keys(globalThis).filter(k=>k.startsWith('__')).join(',');return JSON.stringify({seconds:typeof n.seconds==='function'?n.seconds():n.seconds,probe:typeof n.probe==='function'?String(n.probe).slice(0,80):0});}));}
 await b.close();})();
