// 덧층 옵션별 확대 fps(나눔 방식, CPU 감속 4배): 무엇이 남은 비용인가
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const out=[];const base={decel:true,move:true,ghost:true,caliper:true,progress:true,recap:false,zoom:true,dof:true,glass:true,minimap:true};
 for(const [label,o] of [['전부 켬',{}],['흐림(dof) 끔',{dof:false}],['유리 카드 끔',{glass:false}],['덧층 거의 끔',{dof:false,glass:false,minimap:false,ghost:false,caliper:false}]]){
  const p=await b.newPage({viewport:{width:1920,height:1032}});await p.addInitScript(x=>{localStorage.setItem('diseaseTourOptsV','2');localStorage.setItem('diseaseTourOpts',x);},JSON.stringify({...base,...o}));
  await p.goto(process.argv[2]+'/?route=disease&disease=pvc&zoomfps',{waitUntil:'networkidle'});await p.waitForSelector('.dt-layer');await p.waitForTimeout(1500);
  const c=await p.context().newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:+(process.argv[3]||4)});await p.getByRole('button',{name:'재생'}).click();
  for(let i=0;i<300;i++){const ph=await p.evaluate(()=>document.querySelector('.dt-layer').dataset.phase);if(ph==='idle'&&i>20)break;await p.waitForTimeout(200);}
  const t=await p.evaluate(()=>document.getElementById('zoomfps')?.textContent??'');out.push(`${label}: ${t.split('\n').reverse().join(' | ')}`);console.log(out[out.length-1]);await p.close();}
 require('fs').writeFileSync('fps_overlay.txt',out.join('\n')+'\n');await b.close();})();
