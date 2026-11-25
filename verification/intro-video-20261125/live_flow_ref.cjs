// D-195 2차: 실제 흐름(클릭 → 하강 → 파형 단계)의 실시간 3D 화면(?introlive=1) — 진행값을 바로 지정한 녹화 방식과 비교. node live_flow_ref.cjs <url> <out.jpg> [W H]
const {chromium}=require('playwright');(async()=>{const [W,H]=[+(process.argv[4]||960),+(process.argv[5]||540)];const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
 await p.goto(`${process.argv[2]}/?introlive=1&fluid=0`,{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:180000});await p.waitForTimeout(3000);
 await p.mouse.click(W/2,H/2);for(let i=0;i<120&&await p.evaluate(()=>globalThis.__intro.state.mode)!=='wave';i++)await p.waitForTimeout(500);
 await p.waitForTimeout(8000);console.log('state',await p.evaluate(()=>JSON.stringify({m:globalThis.__intro.state.mode,p:globalThis.__intro.state.p})));
 await p.addStyleTag({content:'body *{visibility:hidden!important} .it-gl{visibility:visible!important}'});await p.waitForTimeout(800);
 await p.screenshot({path:process.argv[3],type:'jpeg',quality:90,timeout:120000});await b.close();})();
