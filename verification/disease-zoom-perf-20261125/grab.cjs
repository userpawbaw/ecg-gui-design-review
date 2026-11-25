// 확대 중 그래프 캔버스를 특정 구간 값에서 그 프레임 그대로 잡는다(rAF 안에서 toDataURL)
const {chromium}=require('playwright');(async()=>{const [base,qs,tag]=[process.argv[2],process.argv[3]||'',process.argv[4]||'x'];const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto(base+'/?route=disease&disease=pvc'+qs,{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer');await p.waitForTimeout(1500);
 await p.evaluate(()=>{window.__g=[];const want=[3.6,2.2,1.9];const f=()=>{const l=document.querySelector('.dt-layer'),sp=+l.dataset.span,ph=l.dataset.phase;
   for(let i=0;i<want.length;i++){if(want[i]&&(ph==='in'||ph==='move')&&sp<=want[i]){want[i]=0;const c=document.querySelector('.plot-wrap canvas');window.__g.push([ph,sp,c.toDataURL('image/png')]);}}requestAnimationFrame(f);};requestAnimationFrame(f);});
 await p.getByRole('button',{name:'재생'}).click();await p.waitForTimeout(16000);
 const g=await p.evaluate(()=>window.__g);for(const [ph,sp,u] of g)require('fs').writeFileSync(`${tag}_${ph}_${sp.toFixed(2)}.png`,Buffer.from(u.split(',')[1],'base64'));console.log(g.map(x=>x[0]+x[1].toFixed(2)).join(' '));await b.close();})();
