// D-194: play a disease tour and record (phase, step, view span) changes; capture each hold and the middle of each span change.
// Usage: node zoom_shots.cjs <url> <disease> [opts json]
const {chromium}=require('playwright');(async()=>{const base=process.argv[2],id=process.argv[3]||'avb2',opts=process.argv[4]||'{}';
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(o=>{try{localStorage.setItem('diseaseTourOpts',o);}catch{}},opts);
 await p.goto(base+'/?route=disease&disease='+id,{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer',{timeout:60000});await p.waitForTimeout(1500);
 const plot=p.locator('.plot-wrap').first();await plot.scrollIntoViewIfNeeded();
 const st=()=>p.evaluate(()=>{const l=document.querySelector('.dt-layer');return {ph:l.dataset.phase,k:l.dataset.step,sp:+l.dataset.span,sel:document.querySelector('select[aria-label="표시 구간"]').value};});
 await p.getByRole('button',{name:'재생'}).click();const seq=[];let last='',lastSp=0,shots=new Set(),t0=Date.now(),mid=0;
 while(Date.now()-t0<70000){const s=await st();const key=s.ph+s.k;if(key!==last){seq.push(`${s.ph}:${s.k}@${s.sp.toFixed(2)}`);last=key;}
  if(Math.abs(s.sp-lastSp)>.02&&lastSp&&!shots.has('z'+s.k+s.ph)&&s.sp>1&&Math.abs(s.sp-5)>.05){shots.add('z'+s.k+s.ph);await plot.screenshot({path:`${id}_zoom_${s.ph}${s.k}.png`});mid++;}
  lastSp=s.sp;
  if(s.ph==='hold'&&!shots.has('h'+s.k)){shots.add('h'+s.k);await p.waitForTimeout(800);await plot.screenshot({path:`${id}_hold${s.k}.png`});const s2=await st();seq.push(`  hold${s.k} span ${s2.sp.toFixed(2)} (선택 ${s2.sel})`);}
  if(s.ph==='idle'&&seq.length>3){await p.waitForTimeout(600);const s3=await st();seq.push(`end span ${s3.sp.toFixed(2)} (선택 ${s3.sel})`);break;}
  await p.waitForTimeout(40);}
 console.log(seq.join(' | '));console.log('mid-zoom shots',mid,'errors',errs.join('|')||'none');await b.close();})();
