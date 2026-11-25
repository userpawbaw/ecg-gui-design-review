// 렌더러 메인 스레드 시간(장당): 작업 · 스크립트 · 스타일 · 레이아웃 — GPU가 있어도 CPU에 남는 몫(CDP Performance 지표, 10 s)
const {chromium}=require('playwright'),fs=require('fs');(async()=>{const b=await chromium.launch();const out=[];
 for(const [label,q,play] of [['이전 · 스크롤','&livelayers=0&heartlive=1','scroll'],['새 · 스크롤','','scroll'],['이전 · 스윕','&livelayers=0&heartlive=1','sweep'],['새 · 스윕','','sweep'],['이전 · 중첩','&livelayers=0&heartlive=1','overlay'],['새 · 중첩','','overlay']]){const p=await b.newPage({viewport:{width:1920,height:1032}});
  await p.goto(process.argv[2]+'/?route=lab'+q,{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(5000);
  if(play==='sweep'){await p.getByRole('button',{name:'스윕'}).click();await p.waitForTimeout(2000);}if(play==='overlay'){await p.getByRole('button',{name:'중첩'}).click();await p.waitForTimeout(2000);}
  const c=await p.context().newCDPSession(p);await c.send('Performance.enable');const M=async()=>Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  const f0=await p.evaluate(()=>({...globalThis.__liveStats})),m0=await M();await p.waitForTimeout(10000);const m1=await M(),f1=await p.evaluate(()=>({...globalThis.__liveStats}));
  const n=f1.frames-f0.frames,per=k=>((m1[k]-m0[k])*1000/n).toFixed(1);
  const l=`${label}: ${(n/10).toFixed(0)}장/s · 메인 스레드 작업 장당 ${per('TaskDuration')} ms(스크립트 ${per('ScriptDuration')} · 스타일 ${per('RecalcStyleDuration')} · 레이아웃 ${per('LayoutDuration')}) · 그리기 JS ${((f1.ms-f0.ms)/n).toFixed(1)} ms`;console.log(l);out.push(l);await p.close();}
 fs.writeFileSync(process.argv[3]||'main_thread.txt',out.join('\n')+'\n');await b.close();})();
