// D-190: the title fluid costs only while the pointer moves and is off below 700 px (prof.cjs runs at 640 px) — force it on (?fluid=1)
// and compare with ?fluid=0 at the same 640 × 400 view, pointer moving. node prof_fluid.cjs <appBase> <view p>
const {chromium}=require('playwright');const [BASE,PV]=[process.argv[2],Number(process.argv[3]||.25)];
(async()=>{const b=await chromium.launch();for(const [label,q] of [['유체 켬(강제)','fluid=1'],['유체 끔','fluid=0']]){const p=await b.newPage({viewport:{width:640,height:400}});
 await p.goto(`${BASE}/?${q}`,{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro,null,{timeout:120000});await p.evaluate(v=>globalThis.__intro.set({p:v}),PV);await p.waitForTimeout(4000);
 const f0=await p.evaluate(()=>globalThis.__intro.state.frame),t0=Date.now();while(Date.now()-t0<20000){const k=(Date.now()-t0)/700;await p.mouse.move(320+200*Math.cos(k),200+120*Math.sin(k*1.3));await p.waitForTimeout(60);}
 const f1=await p.evaluate(()=>globalThis.__intro.state.frame);console.log(label.padEnd(16),'fps',((f1-f0)/((Date.now()-t0)/1000)).toFixed(2));await p.close();}await b.close();})();
