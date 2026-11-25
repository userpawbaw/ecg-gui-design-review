// 확인: 저장된 옵션(recap true)이 있어도 숫자 표식이 안 나오는지, 질환 전환 때 준비 중 띠가 안 뜨는지
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.addInitScript(()=>{if(!sessionStorage.getItem('x')){sessionStorage.setItem('x','1');localStorage.setItem('diseaseTourOpts',JSON.stringify({recap:true}));localStorage.removeItem('diseaseTourOptsV');}});
 await p.goto(process.argv[2]+'/?route=disease&disease=pvc',{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer');await p.waitForTimeout(1000);
 let banner=0;p.on('console',()=>{});await p.evaluate(()=>{window.__ban=0;new MutationObserver(()=>{if(document.querySelector('.request-status'))window.__ban++;}).observe(document.body,{subtree:true,childList:true});});
 for(const id of ['apc','vt','afib','pvc']){await p.click(`button[data-disease="${id}"]`);await p.waitForTimeout(1500);}
 banner=await p.evaluate(()=>window.__ban);
 await p.getByRole('button',{name:'재생'}).click();for(let i=0;i<300;i++){const ph=await p.evaluate(()=>document.querySelector('.dt-layer').dataset.phase);if(ph==='idle'&&i>20)break;await p.waitForTimeout(200);}
 await p.waitForTimeout(500);const pins=await p.evaluate(()=>document.querySelectorAll('.dt-pin').length),rec=await p.evaluate(()=>JSON.parse(localStorage.getItem('diseaseTourOpts')).recap);
 console.log('준비 중 띠 등장', banner, '· 끝 숫자 표식', pins, '· 저장된 recap', rec);await b.close();})();
