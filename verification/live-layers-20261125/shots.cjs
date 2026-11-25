// D-200 화면 비교: 이전(?livelayers=0) 대 층 구조, 스크롤 · 스윕, 실시간 탭 칸 두 개 확대 캡처 + 콘솔 오류
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const errs=[];
 for(const [q,tag] of [['&livelayers=0','old'],['','new']])for(const play of ['scroll','sweep']){const p=await b.newPage({viewport:{width:1600,height:1000}});p.on('pageerror',e=>errs.push(tag+': '+e));p.on('console',m=>{if(m.type()==='error')errs.push(tag+' console: '+m.text());});
  await p.goto(process.argv[2]+'/?route=lab'+q,{waitUntil:'load'});await p.waitForTimeout(1500);await p.getByRole('button',{name:/실시간 측정/}).first().click();await p.waitForSelector('.live-status');await p.waitForTimeout(6000);
  if(play==='sweep'){await p.getByRole('button',{name:'스윕'}).click();await p.waitForTimeout(4000);}
  const rows=p.locator('.live-row');const n=await rows.count();for(let i=0;i<Math.min(2,n);i++)await rows.nth(i).screenshot({path:`${tag}_${play}_${i}.png`});
  const info=await p.evaluate(()=>[...document.querySelectorAll('.live-row')].map(r=>r.querySelectorAll('canvas').length).join(','));console.log(tag,play,'칸마다 캔버스 수',info);await p.close();}
 console.log('오류',errs.join(' | ')||'없음');await b.close();})();
