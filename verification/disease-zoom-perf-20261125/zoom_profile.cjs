// 질환 탭 축 확대 애니메이션 성능: 투어 재생 중 rAF 간격(확대 구간만)과 CPU 프로파일(함수별 자기 시간 상위)
// node zoom_profile.cjs <url> <disease> <cpu throttle> <out prefix> [query]
const {chromium}=require('playwright');(async()=>{const [base,id,thr,out,qs]=[process.argv[2],process.argv[3]||'pvc',+(process.argv[4]||4),process.argv[5]||'run',process.argv[6]||''];
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1032}});if(process.argv[7])await p.addInitScript(o=>{try{localStorage.setItem('diseaseTourOpts',o);}catch{}},process.argv[7]);const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(base+'/?route=disease&disease='+id+qs,{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer',{timeout:60000});await p.waitForTimeout(1500);
 await p.evaluate(()=>{window.__fr=[];const L=()=>document.querySelector('.dt-layer');const f=t=>{const l=L();window.__fr.push([t,l?.dataset.phase,+(l?.dataset.span||0)]);requestAnimationFrame(f);};requestAnimationFrame(f);});
 const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:thr});await c.send('Profiler.enable');await c.send('Profiler.setSamplingInterval',{interval:200});
 await p.getByRole('button',{name:'재생'}).click();let prof=false,done=false,t0=Date.now();
 while(Date.now()-t0<90000&&!done){const s=await p.evaluate(()=>{const l=document.querySelector('.dt-layer');return {ph:l.dataset.phase,k:+l.dataset.step};});
  if(!prof&&s.ph===(process.env.PH||'in')){await c.send('Profiler.start');prof=true;}
  if(prof&&s.ph!==(process.env.PH||'in'))done=true;await p.waitForTimeout(30);}   // 첫 확대(in) 구간만 프로파일
 await p.waitForTimeout(6000);
 const {profile}=await c.send('Profiler.stop');await c.send('Emulation.setCPUThrottlingRate',{rate:1});
 const fr=await p.evaluate(()=>window.__fr);
 // 확대 프레임 = span 이 바뀌는 프레임
 const zd=[];for(let i=1;i<fr.length;i++)if(Math.abs(fr[i][2]-fr[i-1][2])>1e-4)zd.push(fr[i][0]-fr[i-1][0]);
 const all=fr.slice(1).map((x,i)=>x[0]-fr[i][0]);const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]||0;};
 const self=new Map(),byId=new Map(profile.nodes.map(n=>[n.id,n]));const dt=profile.timeDeltas;let tot=0;
 profile.samples.forEach((sid,i)=>{const n=byId.get(sid),k=`${n.callFrame.functionName||'(anon)'} ${(n.callFrame.url||'').split('/').pop()}:${n.callFrame.lineNumber}`;self.set(k,(self.get(k)||0)+(dt[i]||0));tot+=dt[i]||0;});
 const top=[...self].sort((a,b)=>b[1]-a[1]).slice(0,18).map(([k,v])=>`${(v/tot*100).toFixed(1)}% ${k}`);
 const lines=[`[${out}] ${id} CPU×${thr} ${qs}`,`확대 프레임 ${zd.length}개 · 간격 중앙 ${med(zd).toFixed(1)} ms(≈${(1000/med(zd)).toFixed(0)} fps) · 최대 ${Math.max(...zd).toFixed(0)} ms`,`전체 rAF 간격 중앙 ${med(all).toFixed(1)} ms`,'자기 시간 상위:',...top,'errors '+(errs.join('|')||'none')];
 console.log(lines.join('\n'));require('fs').writeFileSync(out+'.txt',lines.join('\n')+'\n');await b.close();})();
