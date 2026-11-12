// Samples the lab canvas glow level (data-fx), frame interval (data-frame-ms) and time every 0.5 s while playing, CPU throttled after play.
// node drop.cjs <query> <methods> <throttle>
const {chromium}=require('playwright');const [Q,M,T]=[process.argv[2]||'',process.argv[3]||'',Number(process.argv[4]||1)];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35'+Q,{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 for(const id of M.split(',').filter(Boolean)){await p.locator('.method-panel .method-list button',{hasText:id}).first().click();await p.waitForTimeout(600);}
 await p.getByRole('button',{name:/재생/}).first().click();if(T>1){const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:T});}
 const s=[];for(let i=0;i<16;i++){await p.waitForTimeout(500);s.push(await p.$eval('.signal-panel canvas',c=>`${c.dataset.time}:${c.dataset.fx}@${c.dataset.frameMs}`));}
 console.log(Q||'(default)',M,'thr',T,'\n ',s.join(' '));await b.close();})();
