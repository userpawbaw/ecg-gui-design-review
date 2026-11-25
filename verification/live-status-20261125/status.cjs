// 실시간 탭 상태 줄: 한 줄 고정 높이 확인 — 정상 · 칩이 많은 상황(CPU 감속으로 몰림 · 한계 초과 유도) 캡처와 높이 기록
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto(process.argv[2]+'/?route=lab',{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(6000);
 const H=new Set();const snap=async t=>{const h=await p.evaluate(()=>{const e=document.querySelector('.live-status');return [e.getBoundingClientRect().height,e.innerText.replace(/\s+/g,' '),[...e.querySelectorAll('.state-chip.icon')].map(x=>x.getAttribute('title')?.split('\n')[0]).join(' | ')];});H.add(h[0]);console.log(t,'높이',h[0],'글자:',h[1],'· 아이콘:',h[2]);};
 await snap('정상');await p.locator('.live-status').screenshot({path:'status_normal.png'});
 const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:8});
 for(let i=0;i<8;i++){await p.waitForTimeout(2500);await snap('감속 '+i);if(i===5)await p.locator('.live-status').screenshot({path:'status_busy.png'});}
 console.log('관측된 높이',[...H].join(', '));await b.close();})();
