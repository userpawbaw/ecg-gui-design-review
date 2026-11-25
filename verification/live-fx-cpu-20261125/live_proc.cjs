// 실시간 탭(캔버스 숨김/보임)에서 chrome 프로세스 종류별 CPU와 페이지 지표(스타일 · 레이아웃 · 칠하기 횟수), 애니메이션 중인 요소
const {chromium}=require('playwright'),fs=require('fs');
const procs=()=>{const m={};for(const pid of fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x))){try{const cmd=fs.readFileSync(`/proc/${pid}/cmdline`,'utf8');if(!/headless_shell|chrom/i.test(cmd))continue;const ty=(cmd.match(/--type=([\w-]+)/)||[,'browser'])[1];const f=fs.readFileSync(`/proc/${pid}/stat`,'utf8').split(') ')[1].split(' ');m[ty]=(m[ty]||0)+(+f[11])+(+f[12]);}catch{}}return m;};
(async()=>{const b=await chromium.launch();for(const hide of [true,false]){const p=await b.newPage({viewport:{width:1920,height:1032}});
 await p.goto(process.argv[2]+'/?route=lab',{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(5000);
 if(hide)await p.addStyleTag({content:'.live-native canvas{display:none!important}'});await p.waitForTimeout(2000);
 const c=await p.context().newCDPSession(p);await c.send('Performance.enable');const m0=Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));const a=procs();
 await p.waitForTimeout(10000);const m1=Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));const z=procs();
 const anim=await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').map(a=>(a.effect?.target?.className||a.effect?.target?.tagName||'?')+':'+(a.animationName||a.transitionProperty||'')).slice(0,20));
 console.log(hide?'[캔버스 숨김]':'[캔버스 보임]','CPU %/10s:',Object.entries(z).map(([k,v])=>k+' '+(((v-(a[k]||0))/100)/10*100).toFixed(0)).join(' · '));
 console.log('  10 s 동안: 스타일 재계산',m1.RecalcStyleCount-m0.RecalcStyleCount,'· 레이아웃',m1.LayoutCount-m0.LayoutCount,'· 작업 시간',((m1.TaskDuration-m0.TaskDuration)*1000).toFixed(0),'ms · 스크립트',((m1.ScriptDuration-m0.ScriptDuration)*1000).toFixed(0),'ms');
 console.log('  돌고 있는 애니메이션:',anim.join(' | ')||'없음');await p.close();}
 await b.close();})();
