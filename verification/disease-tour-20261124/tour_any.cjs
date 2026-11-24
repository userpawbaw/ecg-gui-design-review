// D-193: same as tour_shots.cjs for any disease: node tour_any.cjs <url> <opts json> <prefix> <disease id>
// D-192: disease tab PVC tour — initial 2 rows, play starts the tour, capture each hold / move / recap, read card text and phase sequence.
// Usage: node tour_shots.cjs <base url> [opts json for localStorage] [prefix]
const {chromium}=require('playwright');(async()=>{const base=process.argv[2],opts=process.argv[3]||'{}',pre=process.argv[4]||'t';
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await p.addInitScript(o=>{try{localStorage.setItem('diseaseTourOpts',o);}catch{}},opts);
 await p.goto(base+'/?route=disease&disease='+(process.argv[5]||'pvc'),{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer',{timeout:60000});await p.waitForTimeout(1500);
 const plot=p.locator('.plot-wrap').first();await plot.scrollIntoViewIfNeeded();
 console.log('rows',await p.evaluate(()=>document.querySelectorAll('.tour-list li').length),'list',await p.locator('.tour-list').innerText());
 await plot.screenshot({path:pre+'_0_initial.png'});
 const ph=()=>p.evaluate(()=>{const l=document.querySelector('.dt-layer');return l.dataset.phase+':'+l.dataset.step+':'+document.querySelector('.ecg-canvas').dataset.time;});
 await p.getByRole('button',{name:'재생'}).click();
 const seq=[];let last='',shot=new Set();const t0=Date.now();
 while(Date.now()-t0<60000){const s=await ph();const [phase,step]=s.split(':');const key=phase+step;if(key!==last){seq.push(s);last=key;}
  if(phase==='hold'&&!shot.has('h'+step)){shot.add('h'+step);await p.waitForTimeout(900);await plot.screenshot({path:`${pre}_hold${step}.png`});console.log('card',step,JSON.stringify(await p.locator('.dt-card').innerText()));}
  if(phase==='move'&&!shot.has('m'+step)){shot.add('m'+step);await p.waitForTimeout(250);await plot.screenshot({path:`${pre}_move${step}.png`});}
  if(phase==='idle'&&seq.length>3){await p.waitForTimeout(1200);await plot.screenshot({path:pre+'_end.png'});break;}
  await p.waitForTimeout(60);}
 console.log('seq',seq.join(' '));console.log('pins',await p.locator('.dt-pin').count());console.log('errors',errs.join('|')||'none');await b.close();})();
