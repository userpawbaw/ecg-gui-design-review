// 2026-11-25 실시간 탭 기법 전환 뒤 끊김: 브라우저에서 (1) 처리 결과 도착 간격, (2) 화면 그리기 간격, (3) 재생 위치 멈춤, (4) 브리지 RTF를 함께 잰다.
// node measure.cjs <url> <label> [sec]
const {chromium}=require('playwright');(async()=>{const [URL,label,SEC]=[process.argv[2],process.argv[3]||'run',+(process.argv[4]||25)];
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});
 await p.addInitScript(()=>{const E=window.EventSource;const log=window.__msg=[];window.EventSource=function(u,o){const es=new E(u,o);es.addEventListener('message',ev=>{try{const d=JSON.parse(ev.data);log.push([performance.now(),d.n||0,d.stat?.rtf??null,d.stat?.lat_ms??null,Object.keys(d.out||{}).join('+')]);}catch{}});return es;};window.EventSource.CLOSED=2;window.EventSource.prototype=E.prototype;});
 await p.goto(URL+'/?route=lab&livetrace=1',{waitUntil:'networkidle'});await p.waitForTimeout(2000);await p.getByRole('button',{name:/실시간 측정/}).first().click();
 for(let i=0;i<120;i++){const n=await p.evaluate(()=>window.__msg.length);if(n>50)break;await p.waitForTimeout(500);}
 await p.waitForTimeout(6000);await p.evaluate(()=>{window.__msg.length=0;window.__liveTrace.length=0;});await p.waitForTimeout(SEC*1000);
 const r=await p.evaluate(()=>({m:window.__msg.slice(),f:window.__liveTrace.slice()}));
 const gaps=r.m.slice(1).map((x,i)=>x[0]-r.m[i][0]).sort((a,b)=>a-b),q=a=>a[Math.floor(a.length*.5)],p99=a=>a[Math.floor(a.length*.99)];
 const fd=r.f.slice(1).map((x,i)=>x[0]-r.f[i][0]),fds=[...fd].sort((a,b)=>a-b);
 let stall=0,run=0,stalls=[];for(let i=1;i<r.f.length;i++){if(r.f[i][1]===r.f[i-1][1]){run+=r.f[i][0]-r.f[i-1][0];}else{if(run>100)stalls.push(Math.round(run));run=0;}}
 const rtf=r.m.map(x=>x[2]).filter(x=>x!=null);
 console.log(`[${label}] 메시지 ${r.m.length}개/${SEC}s · 도착 간격 중앙 ${q(gaps).toFixed(0)} ms · 99% ${p99(gaps).toFixed(0)} · 최대 ${gaps[gaps.length-1].toFixed(0)} ms · 블록당 표본 중앙 ${q(r.m.map(x=>x[1]).sort((a,b)=>a-b))}`);
 console.log(`[${label}] 화면 프레임 ${r.f.length}개(${(r.f.length/SEC).toFixed(1)} fps) · 간격 중앙 ${q(fds).toFixed(1)} · 최대 ${fds[fds.length-1].toFixed(0)} ms · 재생 위치 멈춤(>100 ms) ${stalls.length}회 ${stalls.slice(0,12).join(',')}`);
 console.log(`[${label}] RTF 중앙 ${q([...rtf].sort((a,b)=>a-b))} · 최대 ${Math.max(...rtf)} · 기법 ${r.m[0]?.[4]}`);
 require('fs').writeFileSync(`${label}.json`,JSON.stringify(r));await b.close();})();
