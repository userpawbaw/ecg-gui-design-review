// D-188 UI: live tab and lab tab — sample the heart badge every 100 ms (number, label, beat counter), screenshot at a pulse and when off.
// node ui_check.cjs <appBase> <tag>
const {chromium}=require('playwright');const [BASE,TAG]=[process.argv[2],process.argv[3]];
const sample=async(p,ms)=>{const out=[],t0=Date.now();for(let t=0;t<ms;t+=100){await p.waitForTimeout(100);out.push(await p.$eval('.hr-badge',e=>[e.querySelector('b').textContent,e.querySelector('span').textContent,+e.dataset.beat]));}out.el=(Date.now()-t0)/1000;return out;};
const summ=s=>{const vals=s.map(x=>x[0]).filter(v=>/^\d/.test(v)).map(v=>parseInt(v));const labels=[...new Set(s.map(x=>x[1]))];return `shown ${vals.length}/${s.length} · bpm ${vals.length?Math.min(...vals)+'–'+Math.max(...vals):'-'} · labels ${labels.join(', ')} · beats ${s[0][2]}→${s[s.length-1][2]} in ${s.el.toFixed(1)} s real time (${(60*(s[s.length-1][2]-s[0][2])/s.el).toFixed(0)} pulses/min)`;};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1100}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await p.goto(BASE+'/?route=lab&bgres=.35&hrdbg=1',{waitUntil:'networkidle'});await p.waitForTimeout(1500);
 // lab: default scene, play 9 s
 await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(300);
 const lab=await sample(p,8000);console.log('lab',summ(lab));await p.locator('.transport').first().screenshot({path:`${TAG}_lab_transport.png`});
 // live
 await p.getByRole('button',{name:'실시간 측정'}).click();await p.waitForSelector('.live-native canvas',{timeout:60000});await p.waitForTimeout(3000);
 const live=await sample(p,15000);console.log('live',summ(live),'badges',await p.locator('.hr-badge').count());console.log('engine keys',JSON.stringify(await p.evaluate(()=>[...new Set((globalThis.__hr||[]).map(x=>x[3]))])));
 // screenshot right after a pulse
 const b0=await p.$eval('.hr-badge',e=>+e.dataset.beat);for(let i=0;i<40;i++){await p.waitForTimeout(25);if(await p.$eval('.hr-badge',e=>+e.dataset.beat)>b0)break;}await p.waitForTimeout(60);
 await p.locator('.live-native').first().screenshot({path:`${TAG}_live_pulse.png`,clip:undefined});await p.locator('.live-stats').screenshot({path:`${TAG}_live_stats_pulse.png`});
 await p.waitForTimeout(500);await p.locator('.live-stats').screenshot({path:`${TAG}_live_stats_rest.png`});
 console.log('errors',errs.join(' | ')||'none');await b.close();})();
