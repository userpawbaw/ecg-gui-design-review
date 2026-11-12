// Overlay hover focus in the live tab: hover legend label of series 1 → (mid-transition) label of series 2 → onto a trace → leave.
// Captures the overlay canvas pixels every animation frame via an in-page rAF hook (no screenshots), and per frame sums the light of
// pixels whose colour is close to each series colour. node focus_seq.cjs <appBase> <tag>
const {chromium}=require('playwright');const [BASE,TAG]=[process.argv[2],process.argv[3]];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto(BASE+'/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.getByRole('button',{name:'실시간 측정'}).click();
 await p.waitForSelector('.live-native canvas',{timeout:60000});await p.getByRole('button',{name:'중첩',exact:true}).first().click();await p.waitForTimeout(8000);
 const cv=p.locator('.live-native canvas').last();const box=await cv.boundingBox();
 // series colours + legend rows from the canvas (right-top labels): read colours from LiveStream via the legend text colour is not exposed; use known slot colours
 const COLORS={'#67e7c3':[103,231,195],'#97c2ff':[151,194,255],'#f6d18d':[246,209,141],'#d7a6ff':[215,166,255]};
 await p.evaluate((C)=>{const c=[...document.querySelectorAll('.live-native canvas')].at(-1);window.__fr=[];const g=c.getContext('2d');
  const loop=()=>{if(window.__stop)return;const W=c.width,H=c.height,d=g.getImageData(0,0,W,H).data,acc={};for(const k in C)acc[k]=0;
   for(let i=0;i<d.length;i+=16){const r=d[i],gg=d[i+1],bb=d[i+2],a=d[i+3];if(a<10)continue;for(const k in C){const [R,G,B]=C[k];const s=Math.max(r,gg,bb);if(s<60)continue;
     const dr=r/s-R/255*255/Math.max(R,G,B),dg=gg/s-G/Math.max(R,G,B),db=bb/s-B/Math.max(R,G,B);if(dr*dr+dg*dg+db*db<.012)acc[k]+=s*a/255;}}
   window.__fr.push([performance.now(),acc]);requestAnimationFrame(loop);};requestAnimationFrame(loop);},COLORS);
 const P=(x,y)=>p.mouse.move(box.x+x,box.y+y);
 const lab=async k=>{await P(box.width-40,0+14+ (await p.evaluate(()=>0)) + 4 + k*14+ 0);}; // label row k: y ≈ P.t + 14 + 14k - 4 (P.t ≈ 0 + top pad)
 const mark=async n=>p.evaluate(n=>window.__fr.push([performance.now(),{mark:n}]),n);
 await p.mouse.move(box.x+box.width/2,box.y+box.height+60);await p.waitForTimeout(400);
 await mark('label1');await lab(0);await p.waitForTimeout(70);await mark('label2 (mid)');await lab(1);await p.waitForTimeout(700);
 await mark('label3');await lab(2);await p.waitForTimeout(700);await mark('leave');await p.mouse.move(box.x+box.width/2,box.y+box.height+60);await p.waitForTimeout(900);
 await p.evaluate(()=>{window.__stop=1;});const fr=await p.evaluate(()=>window.__fr);await b.close();
 const t0=fr[0][0];const keys=Object.keys(COLORS);let out=[];
 for(const [t,a] of fr){if(a.mark){out.push(`--- ${a.mark} @${(t-t0).toFixed(0)}ms`);continue;}out.push(`${(t-t0).toFixed(0).padStart(5)} `+keys.map(k=>`${k}:${(a[k]/1000).toFixed(1).padStart(6)}`).join(' '));}
 require('fs').writeFileSync(`${TAG}_frames.txt`,out.join('\n'));console.log(out.filter((_,i)=>i%3===0||/---/.test(out[i])).join('\n'));})();
