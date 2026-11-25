// D-199 품질: 같은 확대 순간(보기 v, 진행 e)을 정석(매 프레임 전부 그리기)과 빠른 길(처음·끝 장면 늘여 섞기)로 그려 PNG로 저장
// node zoom_quality.cjs <url> <disease> <right t> <spanA> <spanB> <shiftB>
const {chromium}=require('playwright');(async()=>{const [base,id]=[process.argv[2],process.argv[3]||'pvc'],T=+(process.argv[4]||18.6),SA=+(process.argv[5]||5),SB=+(process.argv[6]||2.75),SH=+(process.argv[7]||.4);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto(base+'/?route=disease&disease='+id+'&zoomdbg&zoomsplit=0',{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer');await p.waitForTimeout(2000);
 const a={span:SA,right:T,phase:0},bv={span:SB,right:T-SH,phase:0},fs=require('fs');
 for(const e of [0,.25,.5,.75,1]){const span=Math.exp(Math.log(SA)+(Math.log(SB)-Math.log(SA))*e),right=T+(T-SH-T)*e,v={span,right,phase:0,z:{a,b:bv,e}};
  for(const mode of ['full','fast']){const u=await p.evaluate(([m,v])=>globalThis.__plotZoom[m](v).toDataURL('image/png'),[mode,v]);fs.writeFileSync(`${id}_e${e}_${mode}.png`,Buffer.from(u.split(',')[1],'base64'));}}
 const g=await p.evaluate(()=>{const c=document.querySelector('.plot-wrap canvas');return {w:c.width,h:c.height};});console.log(JSON.stringify(g));await b.close();})();
