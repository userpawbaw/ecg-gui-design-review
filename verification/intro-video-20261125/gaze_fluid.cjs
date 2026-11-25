// D-195: 영상 경로의 시점 흔들림(부드럽게 따라감) · 화면 유체 — 포인터를 오른쪽 끝으로 옮긴 뒤 시간별 이동량, 유체 오버레이 존재 · 움직임 중 캡처.
const {chromium}=require('playwright');(async()=>{const W=1280,H=800;const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(process.argv[2]+'/',{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:180000});await p.waitForTimeout(2000);
 const tr=()=>p.evaluate(()=>{const m=getComputedStyle(document.querySelector('.it-vid-wrap')).transform.match(/matrix\(([^)]+)\)/);return m?m[1].split(',').map(Number)[4].toFixed(1):'none';});
 await p.mouse.move(W/2,H/2);await p.waitForTimeout(2500);const x0=await tr();
 await p.mouse.move(W-5,H/2,{steps:4});const seq=[];for(let i=0;i<8;i++){await p.waitForTimeout(250);seq.push(await tr());}
 console.log('translateX center',x0,'→ after move every 0.25 s',seq.join(' '),'(목표',(-1*.06/2*W).toFixed(1)+')');
 console.log('fluid overlay',await p.evaluate(()=>!!document.querySelector('.it-screen-fluid')));
 for(let i=0;i<10;i++)await p.mouse.move(300+i*60,300+(i%2)*80);await p.screenshot({path:'gf_fluid.png'});
 console.log('errors',errs.join('|')||'none');await b.close();})();
