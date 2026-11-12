// Live tab smoothness from the app's own per-frame head trace (?livetrace=1): per-frame advance (samples) and per-100 ms advance.
// node pace.cjs <appBase> <tag> [extra query] — scroll mode, 6 s sample after 8 s warm-up.
const {chromium}=require('playwright');const [BASE,TAG,EXTRA]=[process.argv[2],process.argv[3],process.argv[4]||''];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto(BASE+'/?route=lab&bgres=.35&livetrace=1'+EXTRA,{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.waitForTimeout(8000);
 await p.evaluate(()=>{window.__liveTrace.length=0;});await p.waitForTimeout(6000);
 const tr=await p.evaluate(()=>window.__liveTrace.slice());await b.close();
 const adv=[],dts=[];for(let i=1;i<tr.length;i++){adv.push(tr[i][1]-tr[i-1][1]);dts.push(tr[i][0]-tr[i-1][0]);}
 const T=(tr.at(-1)[0]-tr[0][0])/1000,rate=(tr.at(-1)[1]-tr[0][1])/T,exp=rate*16.67/1000;
 const w=[];for(let i=0;i<tr.length;i++){const k=Math.floor((tr[i][0]-tr[0][0])/100);w[k]=(w[k]??0)+(i?adv[i-1]:0);}
 const zero=adv.filter(a=>a===0).length,big=adv.filter(a=>a>2.5*exp).length,sd=Math.sqrt(w.reduce((s,x)=>s+(x-rate/10)**2,0)/w.length);
 console.log(`${TAG}: ${tr.length} frames/${T.toFixed(1)} s (${(tr.length/T).toFixed(0)} fps) · ${rate.toFixed(0)} samples/s · per-frame advance: zero ${zero} · >2.5x ${big} · max ${Math.max(...adv).toFixed(1)} (expected ${exp.toFixed(2)}) · per-100ms sd ${sd.toFixed(1)} samples (mean ${(rate/10).toFixed(1)})`);
 console.log('  per-100ms:',w.map(x=>x.toFixed(0)).join(' '));})();
