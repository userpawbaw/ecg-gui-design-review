// 같은 확대(구간 a → b) 40장을 방식별로 그려 프레임당 시간(장면 준비 제외). CPU 감속 1 · 4배
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const out=[];
 for(const [q,label] of [['','나눔(선 새로·번짐 늘임, 3장면)'],['&zoomsplit=0','통째 늘임(3장면)']])for(const [id,T,SA,SB,SH] of [['pvc',18.6,5,2.75,.4],['lbbb',12,5,1.5,.3]]){
  const p=await b.newPage({viewport:{width:1600,height:1000}});await p.goto(process.argv[2]+'/?route=disease&disease='+id+'&zoomdbg'+q,{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer');await p.waitForTimeout(1500);
  const c=await p.context().newCDPSession(p);
  for(const [thr,flush] of [[1,true],[4,true],[4,false]]){await c.send('Emulation.setCPUThrottlingRate',{rate:thr});
   const a={span:SA,right:T,phase:0},bb={span:SB,right:T-SH,phase:0};
   for(const mode of (q?['fast']:['full','fast'])){await p.evaluate(([a,bb,m])=>globalThis.__plotZoom.bench(a,bb,8,m),[a,bb,mode]);const r=await p.evaluate(([a,bb,m,f])=>globalThis.__plotZoom.bench(a,bb,40,m,f),[a,bb,mode,flush]);
    out.push(`${id} CPU×${thr}${flush?' 래스터 포함':' JS만'} ${mode==='full'?'정석(매 프레임 전부)':label}: 평균 ${r.mean.toFixed(1)} · 중앙 ${r.median.toFixed(1)} · 90% ${r.p90.toFixed(1)} ms`);console.log(out[out.length-1]);}}
  await p.close();}
 require('fs').writeFileSync(process.argv[3]||'bench2.txt',out.join('\n')+'\n');await b.close();})();
