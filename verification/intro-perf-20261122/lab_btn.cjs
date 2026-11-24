// Lab button on the first screen must not start the intro (it navigates instead).
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:800,height:500}});
 await p.goto(process.argv[2]+'/?perf=pr50,msaa',{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:120000});await p.waitForTimeout(2000);
 const btn=p.locator('.it-skip');console.log('lab buttons',await btn.count());
 const box=await btn.boundingBox();const mode0=await p.evaluate(()=>globalThis.__intro.state.mode);
 await p.mouse.click(box.x+box.width/2,box.y+box.height/2);await p.waitForTimeout(800);
 console.log('mode before',mode0,'after',await p.evaluate(()=>globalThis.__intro?.state.mode),'url',p.url());await b.close();})();
