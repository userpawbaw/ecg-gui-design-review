// 질환 탭: 단계(run · in · hold …)별 Plot 그리기 한 번의 평균 시간(__labStats)과 rAF 간격 — CPU 감속 적용
// node draw_ms.cjs <url> <disease> <throttle> [query]
const {chromium}=require('playwright');(async()=>{const [base,id,thr,qs]=[process.argv[2],process.argv[3]||'pvc',+(process.argv[4]||4),process.argv[5]||''];
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1032}});if(process.argv[6])await p.addInitScript(o=>{try{localStorage.setItem('diseaseTourOpts',o);}catch{}},process.argv[6]);
 await p.goto(base+'/?route=disease&disease='+id+qs,{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer',{timeout:60000});await p.waitForTimeout(1500);
 await p.evaluate(()=>{const acc=window.__acc={};let lf=0,lt=0,lm=0;const f=t=>{const l=document.querySelector('.dt-layer'),s=window.__labStats,ph=l?.dataset.phase||'?';
   const a=acc[ph]??={n:0,dt:0,frames:0,ms:0,max:0};if(lt){a.n++;a.dt+=t-lt;a.max=Math.max(a.max,t-lt);}const P=window.__pp,pk=a.pp??={},lp=window.__lpp??={};for(const k in P){pk[k]=(pk[k]??0)+P[k]-(lp[k]??0);lp[k]=P[k];}a.frames+=s.frames-lf;a.ms+=s.ms-lm;lf=s.frames;lm=s.ms;lt=t;requestAnimationFrame(f);};requestAnimationFrame(f);});
 const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:thr});
 await p.getByRole('button',{name:'재생'}).click();await p.waitForTimeout(1000);
 for(let i=0;i<400;i++){const ph=await p.evaluate(()=>document.querySelector('.dt-layer').dataset.phase);if(ph==='idle'&&i>20)break;await p.waitForTimeout(150);}
 const acc=await p.evaluate(()=>window.__acc);
 for(const [k,a] of Object.entries(acc))console.log(`${k.padEnd(6)} rAF ${a.n} · 간격 평균 ${(a.dt/Math.max(1,a.n)).toFixed(1)} ms 최대 ${a.max.toFixed(0)} · 그리기 ${a.frames}회 평균 ${(a.ms/Math.max(1,a.frames)).toFixed(1)} ms · `+Object.entries(a.pp||{}).map(([k,v])=>k+' '+(k==='bgN'?v:(v/Math.max(1,a.frames)).toFixed(1))).join(' '));
 await b.close();})();
