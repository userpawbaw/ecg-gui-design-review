// D-190: relative cost of each lag candidate. Same viewport (960 × 600), same frozen view, one switch at a time:
// wall fps (frames drawn per second over 12 s — everything included) and mean CPU / gl.finish ms per frame (?introprof=1).
// 640 × 400 so the software renderer manages a few frames a second. Software renderer (SwiftShader) here — only the ratios between rows mean anything; absolute fps belongs to the target laptop.
// node prof.cjs <appBase> <view p> [sec] [move=1: pointer keeps moving]
const {chromium}=require('playwright');const [BASE,PV,SEC,MOVE]=[process.argv[2],Number(process.argv[3]||.25),Number(process.argv[4]||20),process.argv[5]==='1'];
const CONF=[['기준(현재)',''],['유체 끔','fluid=0'],['블룸 끔','ibloom=0'],['빛줄기 안개 끔','ifog=0'],['색보정 끔','igrade=0'],['과대값 가드 끔','iguard=0'],['MSAA 끔','msaa=0'],
 ['픽셀 비 1.0','ipr=1'],['픽셀 비 0.75','ipr=.75'],['먼지 끔','idust=0'],['전극 배선 끔','irig=0'],['사다리 사람 끔','iclimb=0'],
 ['묶음: 유체·MSAA 끔 + 픽셀 비 0.75','fluid=0&msaa=0&ipr=.75'],['묶음 + 블룸·가드 끔','fluid=0&msaa=0&ipr=.75&ibloom=0&iguard=0']];
(async()=>{const b=await chromium.launch();const rows=[];
 for(const [label,q] of CONF){const p=await b.newPage({viewport:{width:640,height:400}});
  await p.goto(`${BASE}/?introprof=1&${q}`,{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro&&globalThis.__introProf,null,{timeout:120000});
  await p.evaluate(v=>globalThis.__intro.set({p:v}),PV);await p.waitForTimeout(4000);
  const f0=await p.evaluate(()=>[globalThis.__intro.state.frame,globalThis.__introProf.length]);const t0=Date.now();
  if(MOVE){while(Date.now()-t0<SEC*1000){const k=(Date.now()-t0)/700;await p.mouse.move(320+200*Math.cos(k),200+120*Math.sin(k*1.3));await p.waitForTimeout(60);}}else await p.waitForTimeout(SEC*1000);
  const r=await p.evaluate(n=>{const a=globalThis.__introProf.slice(n);const m=i=>a.reduce((s,x)=>s+x[i],0)/Math.max(1,a.length);return {frames:globalThis.__intro.state.frame,cpu:m(0),gpu:m(1),n:a.length};},f0[1]);
  const fps=(r.frames-f0[0])/((Date.now()-t0)/1000);rows.push([label,fps,r.cpu,r.gpu,r.n]);console.log(label.padEnd(28),'fps',fps.toFixed(2),'cpu',r.cpu.toFixed(0),'ms','gpu-wait',r.gpu.toFixed(0),'ms','n',r.n);await p.close();}
 const base=rows[0][2]+rows[0][3];console.log('\nrelative frame cost (cpu+gpu) vs 기준:');for(const r of rows)console.log(r[0].padEnd(28),((r[2]+r[3])/base*100).toFixed(0)+' %');
 await b.close();})();
