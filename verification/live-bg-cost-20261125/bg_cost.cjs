// 실시간 탭 배경(서고) 비용: 켬 · 끔(?bg=0) × 마우스 가만 · 계속 움직임 — 초당 그림 수, 렌더러 · 합성(gpu-process) CPU, 배경 그리기 횟수(코어 2개, 10 s)
const {chromium}=require('playwright'),fs=require('fs');
const procs=()=>{const m={};for(const pid of fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x))){try{const cmd=fs.readFileSync(`/proc/${pid}/cmdline`,'utf8');if(!/headless_shell|chrom/i.test(cmd))continue;const ty=(cmd.match(/--type=([\w-]+)/)||[,'browser'])[1];const f=fs.readFileSync(`/proc/${pid}/stat`,'utf8').split(') ')[1].split(' ');m[ty]=(m[ty]||0)+(+f[11])+(+f[12]);}catch{}}return m;};
(async()=>{const b=await chromium.launch();const out=[];
 for(const [label,q,move,cssx] of process.env.V2?[['배경 켬','',false,''],['배경 켬 + 커튼 숨김','',false,'.lab-backdrop-curtain{display:none!important}'],['배경 켬 + 실시간 칸 불투명','',false,'.live-row{background:#112b39!important;opacity:1!important} .live-native,.live-shell{background:#0a1a21!important}'],['배경 끔','&bg=0',false,'']]:[['배경 켬 · 마우스 가만','',false],['배경 끔 · 마우스 가만','&bg=0',false],['배경 켬 · 마우스 계속 움직임','',true],['배경 끔 · 마우스 계속 움직임','&bg=0',true,'']]){
  const p=await b.newPage({viewport:{width:1920,height:1032}});await p.goto(process.argv[2]+'/?route=lab&bgprof=1'+q,{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(5000);if(cssx)await p.addStyleTag({content:cssx});
  let alive=true;const mover=(async()=>{let i=0;while(alive&&move){await p.mouse.move(300+((i*37)%1300),200+((i*23)%600));i++;await p.waitForTimeout(30);}})();
  await p.waitForTimeout(1000);const f0=await p.evaluate(()=>({...globalThis.__liveStats}));const a=procs();await p.waitForTimeout(10000);const z=procs();const f1=await p.evaluate(()=>({...globalThis.__liveStats}));alive=false;await mover;
  const fr=(f1.frames-f0.frames)/10,ren=((z.renderer||0)-(a.renderer||0))/10,gpu=((z['gpu-process']||0)-(a['gpu-process']||0))/10;
  const l=`${label}: 파형 그림 ${fr.toFixed(0)}장/s · 렌더러 ${ren.toFixed(0)} % · 합성 ${gpu.toFixed(0)} %`;console.log(l);out.push(l);await p.close();}
 fs.writeFileSync(process.env.V2?'bg_cost2.txt':'bg_cost.txt',out.join('\n')+'\n');await b.close();})();
