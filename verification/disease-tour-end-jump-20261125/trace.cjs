// 심질환 투어: 마지막 특징 뒤 재생으로 돌아갈 때 화면이 튀는지 — 매 프레임 재생 시각 · 단계 · 보기 방식 · 화면 구간(오른쪽 끝) 기록
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const out=[];
 for(const id of (process.argv[3]||'pvc').split(',')){
  const p=await b.newPage({viewport:{width:1600,height:1000}});await p.goto(process.argv[2]+'/?route=disease&disease='+id+'&tourdbg',{waitUntil:'load'});await p.waitForSelector('.dt-layer');await p.waitForTimeout(2000);
  await p.evaluate(()=>{const L=globalThis.__trace=[];const f=()=>{const T=globalThis.__tour;if(T){const v=T.S.view;L.push([performance.now()|0,+T.transport.time.toFixed(3),T.S.phase,T.S.k,T.getMode(),T.getSpan(),v?+v.right.toFixed(3):null,v?+v.span.toFixed(3):null,T.transport.speed]);}requestAnimationFrame(f);};f();});
  await p.getByRole('button',{name:'재생'}).click();
  for(let i=0;i<400;i++){const ph=await p.evaluate(()=>globalThis.__tour.S.phase);if(ph==='idle'&&i>20)break;await p.waitForTimeout(200);}
  await p.waitForTimeout(1500);
  const L=await p.evaluate(()=>globalThis.__trace);
  // 투어 끝 전후 40 프레임 · 시각/모드/구간 변화가 큰 프레임
  const iEnd=L.findIndex((r,i)=>i>0&&L[i-1][2]!=='idle'&&r[2]==='idle'&&i>30);
  out.push(`== ${id}: 끝 프레임 ${iEnd}`);
  for(let i=Math.max(1,iEnd-25);i<Math.min(L.length,iEnd+(+process.env.AFTER||15));i++){const r=L[i],q=L[i-1];const j=Math.abs(r[1]-q[1])>.1||r[4]!==q[4]||r[5]!==q[5]||r[6]!==q[6];out.push((j?'★ ':'  ')+JSON.stringify(r));}
  await p.close();}
 console.log(out.join('\n'));require('fs').writeFileSync(process.env.OUT||'trace_before.txt',out.join('\n')+'\n');await b.close();})();
