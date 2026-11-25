// D-195: 도입부 3D 장면을 프레임 단위로 렌더(1920×1080, 엔진 시계 · 진행값 고정, DOM 숨김) → JPEG.
// node render_frames.cjs <url> <outDir> <part: first|descent|heart|probe> [W] [H]
// first: 첫 화면(p=PV0) t=3..13 s 300장 · descent: 클릭 뒤 하강 t=T0..T0+AUTO_S(진행 곡선 = 엔진과 같은 코사인) · heart: p=PVA 박동 위상 프레임(R 뒤 0–0.5 s 16장, R 앞 심방 6장, 쉼 1장)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const [BASE,OUT,PART,W,H]=[process.argv[2],process.argv[3],process.argv[4],+(process.argv[5]||1920),+(process.argv[6]||1080)];
const FPS=30,T0=20;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
 await p.goto(`${BASE}/?perf=fluid&introlive=1`,{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__intro?.videoConst,null,{timeout:180000});await p.waitForTimeout(3000);
 await p.addStyleTag({content:'body *{visibility:hidden!important} .it-gl{visibility:visible!important}'});
 await p.evaluate(()=>globalThis.__intro.pause(true));
 const C=await p.evaluate(()=>globalThis.__intro.videoConst);const cv=p.locator('.it-gl');
 const warm=async(o,n=150)=>p.evaluate(([o,n,dt])=>{const e=globalThis.__intro;e.set(o);for(let i=0;i<n;i++)e.renderOnce(false,dt);},[o,n,1/FPS]);   // 감쇠 값 수렴(그리지 않음)
 const shot=async(name,o)=>{await p.evaluate(([o,dt])=>{const e=globalThis.__intro;e.set(o);e.renderOnce(true,dt);},[o,1/FPS]);await cv.screenshot({path:path.join(OUT,name),type:'jpeg',quality:95});};
 const t0=Date.now();let n=0;const tick=()=>{n++;if(n%20===0)console.log(PART,n,((Date.now()-t0)/n/1000).toFixed(2)+' s/장');};
 if(PART==='probe'){await warm({p:C.PV0,t:3,beat:null});await shot('probe_first.jpg',{p:C.PV0,t:3,beat:null});await warm({p:C.PVA,t:T0+C.AUTO_S,beat:null});await shot('probe_wave.jpg',{p:C.PVA,t:T0+C.AUTO_S,beat:null});console.log('const',JSON.stringify(C),'s/장',((Date.now()-t0)/2000).toFixed(2));}
 if(PART==='first'){await warm({p:C.PV0,t:3,beat:null});}if(PART==='first')for(let i=0;i<10*FPS;i++){await shot(`f${String(i).padStart(5,'0')}.jpg`,{p:C.PV0,t:3+i/FPS,beat:null});tick();}
 if(PART==='descent'){await warm({p:C.PV0,t:T0,beat:null});const N=Math.round(C.AUTO_S*FPS);for(let i=0;i<=N;i++){const k=i/N;await shot(`d${String(i).padStart(5,'0')}.jpg`,{p:C.PV0+(C.PVA-C.PV0)*(.5-.5*Math.cos(Math.PI*k)),t:T0+i/FPS,beat:null});tick();}}
 if(PART==='heart'){const pt={p:C.PVA,t:T0+C.AUTO_S};await warm({...pt,beat:{sincePrev:9,untilNext:9}});for(let j=0;j<16;j++){await shot(`hv${String(j).padStart(2,'0')}.jpg`,{...pt,beat:{sincePrev:j/FPS,untilNext:9}});tick();}
  for(let j=0;j<6;j++){await shot(`ha${String(j).padStart(2,'0')}.jpg`,{...pt,beat:{sincePrev:9,untilNext:.22-j/FPS}});tick();}
  await shot('hidle.jpg',{...pt,beat:{sincePrev:9,untilNext:9}});}
 fs.writeFileSync(path.join(OUT,`meta_${PART}.json`),JSON.stringify({W,H,FPS,T0,...C}));await b.close();})();
