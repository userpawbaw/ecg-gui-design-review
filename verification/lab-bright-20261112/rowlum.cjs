// In-canvas per-row light profile during playback (reads the lab canvas pixels, same row geometry as Plot.tsx).
// Columns 0.4–2.0 s behind the sweep head: medians of brightest max(R,G,B) (peak), pixels with max(R,G,B) > 60 (halo px),
// and summed excess light max(R,G,B)-45 per column (energy). node rowlum.cjs <query> <methods comma> <label>
const {chromium}=require('playwright');const [Q,M,L]=[process.argv[2]||'',process.argv[3]||'',process.argv[4]||''];const THR=Number(process.env.THROTTLE||1),MODE=process.env.MODE||'sweep',SHOT=process.env.SHOT||'';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35'+Q,{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 const ms=M.split(',').filter(Boolean);
 for(const id of ms){await p.locator('.method-panel .method-list button',{hasText:id}).first().click();await p.waitForTimeout(600);}
 if(MODE==='scroll')await p.getByRole('button',{name:'스크롤',exact:true}).first().click();
 await p.getByRole('button',{name:/재생/}).first().click();if(THR>1){const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:THR});}await p.waitForTimeout(Number(process.env.WAIT||4300));
 if(SHOT)await p.locator('.signal-panel').first().screenshot({path:SHOT});
 const r=await p.$eval('.signal-panel canvas',(c,nShown)=>{const g=c.getContext('2d'),R=c.getBoundingClientRect(),dpr=c.width/R.width,w=R.width,h=R.height;
  const t=Number(c.dataset.time),span=5,count=1+nShown,rh=h/count,left=80,right=w-18,pw=right-72;const img=g.getImageData(0,0,c.width,c.height),d=img.data,W=c.width;
  const headX=c.dataset.mode==='scroll'?right:72+((t%span)/span)*pw,out=[];
  for(let r=0;r<count;r++){const top=r*rh+36,bot=(r+1)*rh-30,pk=[],hl=[],en=[];
   for(let x=headX-2.0/span*pw;x<headX-0.4/span*pw;x++){const X=Math.round((x<left?x+pw:x)*dpr);let m=0,n=0,e=0;
    for(let y=Math.round(top*dpr);y<Math.round(bot*dpr);y++){const q=(y*W+X)*4,V=Math.max(d[q],d[q+1],d[q+2]);if(V>m)m=V;if(V>60)n++;if(V>45)e+=V-45;}pk.push(m);hl.push(n/dpr);en.push(e/dpr);}
   const med=a=>a.slice().sort((u,v)=>u-v)[a.length>>1];out.push([med(pk),med(hl).toFixed(1),med(en).toFixed(0)]);}
  return {fx:c.dataset.fx,ms:c.dataset.frameMs,t,dpr,h:Math.round(h),rows:out};},ms.length+1);
 console.log(L.padEnd(18),'t',r.t,'fx',r.fx,'@',r.ms,'ms  h',r.h,' ',r.rows.map((v,k)=>(k?'m'+k:'in')+' '+v.join('/')).join(' · '));await b.close();})();
