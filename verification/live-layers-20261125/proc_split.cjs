// 이전 · 새 구조: chrome 프로세스 종류별 CPU(10 s) + 그림 횟수 — GPU 노트북에서도 CPU로 남는 몫(렌더러)과 합성(gpu-process, 여기서는 소프트웨어)을 나눠 본다
const {chromium}=require('playwright'),fs=require('fs');
const procs=()=>{const m={};for(const pid of fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x))){try{const cmd=fs.readFileSync(`/proc/${pid}/cmdline`,'utf8');if(!/headless_shell|chrom/i.test(cmd))continue;const ty=(cmd.match(/--type=([\w-]+)/)||[,'browser'])[1];const f=fs.readFileSync(`/proc/${pid}/stat`,'utf8').split(') ')[1].split(' ');m[ty]=(m[ty]||0)+(+f[11])+(+f[12]);}catch{}}return m;};
(async()=>{const b=await chromium.launch();const out=[];
 for(const [label,q,play] of [['이전 · 스크롤','&livelayers=0&heartlive=1','scroll'],['새 · 스크롤','','scroll'],['이전 · 스윕','&livelayers=0&heartlive=1','sweep'],['새 · 스윕','','sweep']]){const p=await b.newPage({viewport:{width:1920,height:1032}});
  await p.goto(process.argv[2]+'/?route=lab'+q,{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(5000);
  if(play==='sweep'){await p.getByRole('button',{name:'스윕'}).click();await p.waitForTimeout(2000);}
  const f0=await p.evaluate(()=>({...globalThis.__liveStats}));const a=procs();await p.waitForTimeout(10000);const z=procs();const f1=await p.evaluate(()=>({...globalThis.__liveStats}));
  const fr=(f1.frames-f0.frames)/10,ren=((z.renderer||0)-(a.renderer||0))/10,gpu=((z['gpu-process']||0)-(a['gpu-process']||0))/10;
  const l=`${label}: 그림 ${fr.toFixed(0)}장/s · 렌더러 ${ren.toFixed(0)} %(장당 ${(ren*10/fr).toFixed(1)} ms) · 합성(gpu-process) ${gpu.toFixed(0)} %(장당 ${(gpu*10/fr).toFixed(1)} ms) · 그리기 JS 장당 ${((f1.ms-f0.ms)/(f1.frames-f0.frames)).toFixed(1)} ms`;console.log(l);out.push(l);await p.close();}
 fs.writeFileSync('proc_split.txt',out.join('\n')+'\n');await b.close();})();
