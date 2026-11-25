// D-195: 실시간 엔진(멈추지 않음)으로 같은 진행값의 3D 화면 — 프레임 렌더와 대조용. node live_ref.cjs <url> <p> <out.jpg>
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.goto(`${process.argv[2]}/?perf=fluid&introlive=1`,{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro?.videoConst,null,{timeout:180000});
 await p.evaluate(v=>globalThis.__intro.set({p:v}),+process.argv[3]);await p.waitForTimeout(25000);
 await p.addStyleTag({content:'body *{visibility:hidden!important} .it-gl{visibility:visible!important}'});await p.waitForTimeout(500);
 await p.screenshot({path:process.argv[4],type:'jpeg',quality:90,timeout:120000});await b.close();})();
