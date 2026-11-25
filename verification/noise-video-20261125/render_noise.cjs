// D-196: 잡음 장면(전원 간섭 · 기저선 · 근육)의 3D 장면을 프레임 단위로 렌더 — 장면 시계 고정, DOM(파형 · 오버레이 · 안내) 숨김.
// 장면 이어받기(카메라가 앞 장면 끝 자리에서 출발)를 그대로 재현하려고, 앞 장면은 고정 시각에서 몇 장만 계산한 뒤 next()로 넘어간다.
// node render_noise.cjs <url> <outDir> <pli|bw|ma> [W H]
//   pli: t 10 → 30.6(들어옴 10 → 18.6, 반복 원본 18.6 → 29.6 + 1 s) · bw · ma: t 0 → 16(들어옴 0 → 4, 반복 4 → 15 + 1 s) · ma는 이어서 나가기 t 16 → 20
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const [BASE,OUT,COND,W,H]=[process.argv[2],process.argv[3],process.argv[4],+(process.argv[5]||1920),+(process.argv[6]||1080)];
const FPS=30,PLAN={pli:{start:10,end:30.6,hold:18.6},bw:{start:0,end:16,hold:4},ma:{start:0,end:16,hold:4,out:4}};
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
 await p.goto(`${BASE}/?story=noise&cond=all&introlive=1&fluid=0`,{waitUntil:'networkidle'});await p.waitForFunction(()=>globalThis.__noise?.ready,null,{timeout:240000});await p.waitForTimeout(3000);
 await p.addStyleTag({content:'body *{visibility:hidden!important} .ns-gl{visibility:visible!important}'});
 await p.evaluate(()=>globalThis.__noise.pause(true));
 const step=(t)=>p.evaluate(t=>{const n=globalThis.__noise;n.set({t});n.renderOnce();},t);
 // 앞 장면들: 끝 자리(반복 구간)까지 시계를 몇 단계 진행 후 다음 장면으로
 const order=['pli','bw','ma'];for(const c of order){if(c===COND)break;const P=PLAN[c];for(let t=P.hold;t<=P.hold+1;t+=.25)await step(t);await p.evaluate(()=>globalThis.__noise.next());}
 const cv=p.locator('.ns-gl'),P=PLAN[COND],t0=Date.now();let n=0;
 const shot=async(name,t)=>{await step(t);await cv.screenshot({path:path.join(OUT,name),type:'jpeg',quality:95});if(++n%20===0)console.log(COND,n,((Date.now()-t0)/n/1000).toFixed(2)+' s/장');};
 // 예열(감쇠 · 느린 시계가 연속이 되게): 시작 시각 앞 1 s를 그리지 않고 지나감 — 장면 시계가 시작점이면 생략
 const N=Math.round((P.end-P.start)*FPS);for(let i=0;i<N;i++)await shot(`s${String(i).padStart(5,'0')}.jpg`,P.start+i/FPS);
 if(P.out){await p.evaluate(()=>globalThis.__noise.leave());const L=P.end;for(let i=0;i<=Math.round(P.out*FPS);i++)await shot(`o${String(i).padStart(5,'0')}.jpg`,L+i/FPS);}
 fs.writeFileSync(path.join(OUT,'meta.json'),JSON.stringify({W,H,FPS,cond:COND,...P}));console.log('done',COND,n);await b.close();})();
