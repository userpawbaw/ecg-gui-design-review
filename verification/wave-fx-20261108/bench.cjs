// 파형 그리기 연산량 측정. 각 조건: 4 s 데움 → 10 s 측정. 지표: 프레임당 그리기 스크립트 ms, 초당 그리기 수, 브라우저 전체 CPU %.
const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
const tree=root=>{const all=execSync('ps -eo pid=,ppid=').toString().trim().split('\n').map(l=>l.trim().split(/\s+/).map(Number));const out=[root];for(let i=0;i<out.length;i++)for(const [p,pp] of all)if(pp===out[i])out.push(p);return out;};
const cpu=pids=>pids.reduce((s,p)=>{try{const f=fs.readFileSync(`/proc/${p}/stat`,'utf8').split(') ')[1].split(' ');return s+Number(f[11])+Number(f[12]);}catch{return s;}},0)/100;
(async()=>{const [which,dprS]=process.argv.slice(2);const dpr=Number(dprS||1);
 const gpu=process.argv[4]!=='cpu';const b=await chromium.launch({args:gpu?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--disable-gpu','--disable-gpu-compositing']});const pid=process.pid;
 const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:dpr});
 const cases=which==='lab'?[['live','sweep',0],['all','sweep',0],['live','sweep',1],['all','sweep',1],['live','scroll',0],['all','scroll',0]]:(process.env.CASES?JSON.parse(process.env.CASES):[['prev','sweep','split'],['naive','sweep','split'],['live','sweep','split'],['prev','scroll','split'],['naive','scroll','split'],['live','scroll','split'],['prev','sweep','overlay'],['naive','sweep','overlay'],['live','sweep','overlay']]);
 const res=[];
 for(const [wave,mode,x] of cases){const p=await ctx.newPage();
  await p.goto('http://localhost:4173/?route=lab&bg=0'+(process.env.AUTO?'':'&labfx=2')+'&wave='+wave);await p.waitForTimeout(3500);let stat;
  if(which==='lab'){const v=p.locator('.viewer');if(x){await p.getByRole('button',{name:'크게 비교 ↗'}).click();await p.waitForTimeout(800);}
   const root=x?p.locator('.large-dialog'):v;if(mode==='scroll')await root.getByRole('button',{name:'스크롤',exact:true}).click();
   await root.getByRole('button',{name:'재생',exact:true}).click();stat='__labStats';}
  else{await p.getByRole('button',{name:'실시간 측정',exact:true}).click();await p.waitForTimeout(2500);
   if(mode==='sweep')await p.getByRole('button',{name:'스윕',exact:true}).click();if(x==='overlay')await p.getByRole('button',{name:'중첩',exact:true}).click();if(x==='noglow'){await p.locator('.live-more summary').click();await p.getByLabel('최신 구간 강조').uncheck().catch(async()=>{await p.locator('.live-more label',{hasText:'최신 구간 강조'}).locator('input').uncheck();});}stat=wave==='prev'?'__livePrevStats':'__liveStats';}
  await p.waitForTimeout(which==='lab'?1500:4000);
  const s0=await p.evaluate(k=>({...globalThis[k]}),stat);const pids=tree(pid).filter(x=>x!==pid);const c0=cpu(pids),w0=Date.now();
  await p.waitForTimeout(which==='lab'?6000:10000);
  const s1=await p.evaluate(k=>({...globalThis[k]}),stat);if(process.env.AUTO)console.log('level',s1.level);const c1=cpu(pids),dt=(Date.now()-w0)/1000;
  const fr=s1.frames-s0.frames,ms=(s1.ms-s0.ms)/Math.max(1,fr);
  const r={case:`${which} wave=${wave} ${mode} ${x===1?'large':x===0?'normal':x}`,dpr,raster:gpu?'gpu(swiftshader)':'cpu',drawsPerSec:+(fr/dt).toFixed(1),scriptMsPerDraw:+ms.toFixed(2),browserCpuPct:+((c1-c0)/dt*100).toFixed(0)};
  console.log(JSON.stringify(r));res.push(r);await p.close();}
 await b.close();})();
