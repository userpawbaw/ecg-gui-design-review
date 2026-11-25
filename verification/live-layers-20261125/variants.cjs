// 새 구조에서 합성 비용 후보를 하나씩 빼 보기: 초당 그림 수 · gpu-process · 렌더러(코어 2개, 10 s)
const {chromium}=require('playwright'),fs=require('fs');
const procs=()=>{const m={};for(const pid of fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x))){try{const cmd=fs.readFileSync(`/proc/${pid}/cmdline`,'utf8');if(!/headless_shell|chrom/i.test(cmd))continue;const ty=(cmd.match(/--type=([\w-]+)/)||[,'browser'])[1];const f=fs.readFileSync(`/proc/${pid}/stat`,'utf8').split(') ')[1].split(' ');m[ty]=(m[ty]||0)+(+f[11])+(+f[12]);}catch{}}return m;};
(async()=>{const b=await chromium.launch();const out=[];
 const LIST=process.env.V3?[['기본(이전 그리기 + 미리 렌더 심장)','',''],['전 버전(3D 심장)','&heartlive=1',''],['층 구조(livelayers=1)','&livelayers=1','']]:process.env.V2?[['이전 그리기 + 3D 심장(전 버전)','&livelayers=0&heartlive=1',''],['이전 그리기 + 미리 렌더 심장','&livelayers=0',''],['새 구조','','']]:[['이전','&livelayers=0&heartlive=1',''],['새(그대로)','',''],['새 − 더하기 섞기','','[style*="mix-blend-mode"]{mix-blend-mode:normal!important}'],['새 − 마스크','','div{-webkit-mask-image:none!important;mask-image:none!important}'],['새 − 둘 다','','[style*="mix-blend-mode"]{mix-blend-mode:normal!important} div{-webkit-mask-image:none!important;mask-image:none!important}']];
 for(const [label,q,cssx] of LIST){
  const p=await b.newPage({viewport:{width:1920,height:1032}});await p.goto(process.argv[2]+'/?route=lab'+q,{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(4000);
  if(cssx)await p.addStyleTag({content:cssx});await p.waitForTimeout(2000);
  const f0=await p.evaluate(()=>({...globalThis.__liveStats}));const a=procs();await p.waitForTimeout(10000);const z=procs();const f1=await p.evaluate(()=>({...globalThis.__liveStats}));
  const fr=(f1.frames-f0.frames)/10,ren=((z.renderer||0)-(a.renderer||0))/10,gpu=((z['gpu-process']||0)-(a['gpu-process']||0))/10;
  const l=`${label}: 그림 ${fr.toFixed(0)}장/s · 렌더러 ${ren.toFixed(0)} % · 합성 ${gpu.toFixed(0)} %(장당 ${(gpu*10/Math.max(1,fr)).toFixed(1)} ms)`;console.log(l);out.push(l);await p.close();}
 fs.writeFileSync(process.env.V3?'variants3.txt':process.env.V2?'variants2.txt':'variants.txt',out.join('\n')+'\n');await b.close();})();
