// ?zoomfps 표시로 투어 확대의 fps를 방식별로(정석 · 통째 늘임 · 나눔), CPU 감속 1 · 4배
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const out=[];
 for(const thr of [1,4])for(const [q,label] of [['&zoomsnap=0','정석'],['&zoomsplit=0','통째 늘임'],['','나눔']]){const p=await b.newPage({viewport:{width:1920,height:1032}});
  await p.goto(process.argv[2]+'/?route=disease&disease=pvc&zoomfps'+q,{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer');await p.waitForTimeout(1500);
  const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:thr});await p.getByRole('button',{name:'재생'}).click();
  for(let i=0;i<300;i++){const ph=await p.evaluate(()=>document.querySelector('.dt-layer').dataset.phase);if(ph==='idle'&&i>20)break;await p.waitForTimeout(200);}
  const t=await p.evaluate(()=>document.getElementById('zoomfps')?.textContent??'');out.push(`CPU×${thr} ${label}: ${t.split('\n').reverse().join(' | ')}`);console.log(out[out.length-1]);await p.close();}
 require('fs').writeFileSync('fps_modes.txt',out.join('\n')+'\n');await b.close();})();
