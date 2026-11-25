// 최악: 글자 칩 3개(긴 것 포함) + 아이콘 6개를 넣고, 창 폭 1600 · 1100 · 800에서 상태 줄 높이
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();
 for(const W of [1600,1100,800]){const p=await b.newPage({viewport:{width:W,height:900}});
  await p.goto(process.argv[2]+'/?route=lab',{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(4000);
  const h=await p.evaluate(()=>{const e=document.querySelector('.live-status'),conn=e.querySelector('.live-conn');const mk=t=>{const c=conn.firstElementChild.cloneNode(true);c.querySelector('b').textContent=t;return c;};
   conn.after(mk('실시간 처리 한계 초과'),mk('처리 결과 몰림'));const ic=e.querySelector('.live-icons'),one=ic.querySelector('.state-chip.icon');for(let i=0;i<5;i++)ic.appendChild(one.cloneNode(true));return e.getBoundingClientRect().height;});
  await p.waitForTimeout(300);await p.locator('.live-status').screenshot({path:`status_worst_${W}.png`});console.log(W,'높이',h);await p.close();}
 await b.close();})();
