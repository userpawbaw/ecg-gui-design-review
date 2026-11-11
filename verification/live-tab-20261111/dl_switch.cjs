// Pick a method in the live tab and record, every second, whether the loading cover is still up, the supervisor state and what
// the page has received. node dl_switch.cjs <tag> <method> [queue]   (dev server 5179, npm run bridge:replay running)
const {chromium}=require('playwright');const TAG=process.argv[2]||'run',M=process.argv[3]||'M08',QUEUE=process.argv[4]==='queue';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});const log=[];
 p.on('console',m=>{if(/error|EventSource/i.test(m.text()))log.push('console: '+m.text().slice(0,160));});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(1500);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-methods button',{timeout:60000});await p.waitForTimeout(4000);
 await p.locator('.live-methods button',{hasText:M}).first().click();
 if(QUEUE){await p.waitForTimeout(300);await p.locator('.live-methods .lm-apply').click();}
 const t0=Date.now();let closed=-1;
 for(let i=0;i<120;i++){await p.waitForTimeout(1000);
  const on=await p.locator('.live-reload.on').count(),txt=on?await p.locator('.live-reload-card b').innerText().catch(()=>''):'';
  const st=await (await fetch('http://127.0.0.1:8764/status')).json().catch(()=>({}));
  const conn=await p.locator('.live-conn').innerText().catch(()=>'');
  log.push(`${((Date.now()-t0)/1000).toFixed(0)}s cover=${on?'on:'+txt:'off'} sup=${st.state}:${(st.methods||[]).join(',')} conn=${conn.replace(/\s+/g,' ')}`);
  if(!on){closed=(Date.now()-t0)/1000;break;}}
 await p.screenshot({path:`${TAG}_${M}.png`});console.log(log.join('\n'));console.log(TAG,M,'cover closed after',closed,'s');await b.close();})();
