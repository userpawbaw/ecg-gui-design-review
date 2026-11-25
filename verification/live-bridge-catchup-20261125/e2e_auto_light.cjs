// D-198 확인: 과부하 브리지 + 앱 실시간 탭 — 상태 칩(브리지 밀림 · 가벼운 계산), 진단 값, 감독 창구의 light 상태를 5 s마다 기록
// node e2e_auto_light.cjs <app url> <out dir> [sec]
const {chromium}=require('playwright');(async()=>{const [URL,OUT,SEC]=[process.argv[2],process.argv[3],+(process.argv[4]||120)];
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});
 await p.goto(URL+'/?route=lab',{waitUntil:'networkidle'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();
 const t0=Date.now();let shot=0;const log=[];
 while(Date.now()-t0<SEC*1000){await p.waitForTimeout(5000);
  const r=await p.evaluate(async()=>{const q=s=>document.querySelector(s);const st=q('.live-status')?.innerText.replace(/\s+/g,' ')??'';const cov=q('.live-reload.on')?.innerText.replace(/\s+/g,' ')??'';
   let c=null;try{c=await (await fetch('bridge-ctl/status',{cache:'no-store'})).json();}catch{}
   const d=[...document.querySelectorAll('.live-diag div div')].map(x=>x.innerText.replace(/\s+/g,' ')).join(' | ');return {st,cov,light:c?.light,methods:c?.methods?.join(','),state:c?.state,d};});
  const line=`${((Date.now()-t0)/1000).toFixed(0)}s 상태[${r.st}] 덮개[${r.cov}] 창구 light=${r.light} ${r.state} ${r.methods} 진단[${r.d}]`;console.log(line);log.push(line);
  if((/브리지 밀림|가벼운 계산/.test(r.st)||r.cov)&&shot<4){await p.screenshot({path:`${OUT}/e2e_${shot++}.png`});}}
 require('fs').writeFileSync(`${OUT}/e2e_auto_light.txt`,log.join('\n')+'\n');await b.close();})();
