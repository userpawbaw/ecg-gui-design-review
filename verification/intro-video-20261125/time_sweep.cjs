// D-195 2차: 파형 단계(p 0.8)에서 시계 t만 바꿔 3D 화면 평균 밝기 — 시간에 따라 바뀌는 빛(구름 그림자 · 햇빛) 확인
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:640,height:360}});
 await p.goto(process.argv[2]+'/?introlive=1&fluid=0',{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:180000});await p.waitForTimeout(2000);
 await p.addStyleTag({content:'body *{visibility:hidden!important} .it-gl{visibility:visible!important}'});await p.evaluate(()=>globalThis.__intro.pause(true));
 const out=[];for(const t of [0,5,10,15,20,25,31,40,50,60,80,100]){const m=await p.evaluate(t=>{const I=globalThis.__intro;I.set({p:.8,t});for(let i=0;i<3;i++)I.renderOnce(true,1/30);return 0;},t);
  const buf=await p.screenshot({type:'png'});const {PNG}=(()=>{try{return require('pngjs');}catch{return {};}})();out.push([t,buf.length]);await p.screenshot({path:`/tmp/claude-0/-home-user-ecg-gui-design-review/2b86e017-71c3-50ca-a7b4-2d88262370fe/scratchpad/ts_${t}.png`});}
 console.log('saved',out.map(x=>x[0]).join(','));await b.close();})();
