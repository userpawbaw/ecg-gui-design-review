// 실시간 탭 효과별 CPU 비중: 같은 코어(taskset으로 이 스크립트 · 브라우저 · 브리지를 함께 묶어 실행)에서
// 설정마다 20 s 동안 브라우저 전체 CPU(모든 chrome 프로세스) · 브리지 CPU · 브리지 RTF(루프 전체, D-198 패치) · 밀림 · 화면 그리기 시간.
// node live_cpu.cjs <app url> <bridge url> <out.txt>
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),{execSync}=require('child_process');
const HZ=100;
const cpuOf=pat=>{let t=0;for(const pid of fs.readdirSync('/proc').filter(x=>/^\d+$/.test(x))){try{const cmd=fs.readFileSync(`/proc/${pid}/cmdline`,'utf8');if(!pat.test(cmd))continue;const f=fs.readFileSync(`/proc/${pid}/stat`,'utf8').split(') ')[1].split(' ');t+=(+f[11])+(+f[12]);}catch{}}return t/HZ;};
const sse=(url,ms)=>new Promise(res=>{const st=[];const r=http.get(url,x=>{let b='';x.on('data',c=>{b+=c;let i;while((i=b.indexOf('\n\n'))>=0){const ev=b.slice(0,i);b=b.slice(i+2);const m=ev.match(/^data: (.*)$/m);if(!m)continue;try{const d=JSON.parse(m[1]);if(d.stat)st.push(d.stat);}catch{}}});});setTimeout(()=>{r.destroy();res(st);},ms);});
(async()=>{const [APP,BR,OUT]=process.argv.slice(2);const b=await chromium.launch();const lines=[];
 const cfgs=(process.env.CFGS?JSON.parse(process.env.CFGS):null)??[['탭 숨김(그리기 없음 — 브리지만)','hidden',''],['실험실 탭 정지 화면(배경만)','lab',''],['실시간 탭 · 파형 캔버스 숨김(페이지 · 배경 · 칩만)','nocanvas',''],['분리 · 스크롤 · 효과 켬(기본)','split',''],['분리 · 스윕 · 효과 켬','sweep',''],['분리 · 스크롤 · 「최신 구간 강조」 끔','noglow',''],['분리 · 스크롤 · 번짐 0(labfx=0)','split','&labfx=0'],['분리 · 이전 그리기(wave=prev)','split','&wave=prev'],['중첩 · 효과 켬','overlay','']];
 for(const [label,mode,q] of cfgs){const p=await b.newPage({viewport:{width:1920,height:1032}});if(process.env.NOHEART)await p.addInitScript(()=>{const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){if(this.classList.contains('hr-heart')&&/webgl/.test(t))return null;return g.call(this,t,...a);};});
  await p.goto(APP+'/?route=lab'+q,{waitUntil:'load'});await p.waitForTimeout(1500);
  if(mode!=='lab'&&!(await p.locator('.live-native').count())){const btn=p.getByRole('button',{name:/실시간 측정/}).first();if(await btn.count())await btn.click();}
  if(mode!=='lab')await p.waitForSelector('.live-status',{timeout:30000});await p.waitForTimeout(4000);
  if(mode==='sweep')await p.getByRole('button',{name:'스윕'}).click();
  if(mode==='overlay')await p.getByRole('button',{name:'중첩'}).click();
  if(mode==='noglow')await p.evaluate(()=>{const i=[...document.querySelectorAll('label')].find(l=>l.textContent.includes('최신 구간 강조'))?.querySelector('input');if(i&&i.checked)i.click();});
  if(mode==='nocanvas')await p.addStyleTag({content:'.live-native canvas{display:none!important}'});
  if(mode==='hidden')await p.goto('about:blank');
  await p.waitForTimeout(5000);
  const f0=mode==='hidden'||mode==='lab'?null:await p.evaluate(()=>({...globalThis.__liveStats}));
  const c0=cpuOf(/headless_shell|chrom/i),b0=cpuOf(/serial_bridge/),t0=Date.now();
  const st=await sse(BR+'/stream',20000);
  const c1=cpuOf(/headless_shell|chrom/i),b1=cpuOf(/serial_bridge/),dt=(Date.now()-t0)/1000;
  const f1=mode==='hidden'||mode==='lab'?null:await p.evaluate(()=>({...globalThis.__liveStats}));
  const med=(a)=>{const s=a.filter(x=>x!=null&&isFinite(x)).sort((x,y)=>x-y);return s.length?s[s.length>>1]:NaN;},mx=a=>Math.max(...a.filter(x=>x!=null&&isFinite(x)));
  const fr=f1&&f0?f1.frames-f0.frames:0,ms=f1&&f0?f1.ms-f0.ms:0;
  const line=`${label}: 브라우저 CPU ${((c1-c0)/dt*100).toFixed(0)} % · 브리지 CPU ${((b1-b0)/dt*100).toFixed(0)} % · RTF(루프) 중앙 ${med(st.map(s=>s.rtf)).toFixed(2)} 최대 ${mx(st.map(s=>s.rtf)).toFixed(2)} · 밀림 최대 ${mx(st.map(s=>s.lag_ms))} ms · 건너뜀 ${mx(st.map(s=>s.skip))} · 그리기 ${(fr/dt).toFixed(0)} 회/s × ${fr?(ms/fr).toFixed(1):'-'} ms(JS) · 그림 한 장당 브라우저 CPU ${fr?(((c1-c0)*1000)/fr).toFixed(1):'-'} ms`;
  console.log(line);lines.push(line);await p.close();}
 fs.writeFileSync(OUT,lines.join('\n')+'\n');await b.close();})();
