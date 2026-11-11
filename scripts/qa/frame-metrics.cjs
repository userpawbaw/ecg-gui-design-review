#!/usr/bin/env node
// Per-frame metrics for a frame-stepped capture (step-capture.cjs): node scripts/qa/frame-metrics.cjs <dir> [--region x,y,w,h] [--t 24]
//  motion[i]  mean |luma(i) − luma(i−1)| in the region (0–255) — a smooth scroll shows a smooth curve; a stutter shows 0 0 0 spike 0 0
//  flash[i]   pixels that jump ≥ t above (or below) BOTH neighbours in frame i and come back (one-frame flashes; 3 × 3 neighbourhood
//             minimum so a moving edge does not count) — the "번쩍임" detector
// Writes metrics.json and prints a summary.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const DIR=process.argv[2];const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d;};
const T=Number(arg('t',24));const R=arg('region');
(async()=>{const files=fs.readdirSync(DIR).filter(f=>/^frame_\d+\.png$/.test(f)).sort();const b=await chromium.launch();const p=await b.newPage();
 await p.evaluate(()=>{window.__L=[];});
 for(const f of files){const src='data:image/png;base64,'+fs.readFileSync(path.join(DIR,f)).toString('base64');
  await p.evaluate(async([src,R])=>{const i=new Image();await new Promise(o=>{i.onload=o;i.src=src;});const [x,y,w,h]=R?R.split(',').map(Number):[0,0,i.width,i.height];
   const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(i,-x,-y);const d=g.getImageData(0,0,w,h).data;const L=new Float32Array(w*h);
   for(let k=0,j=0;k<d.length;k+=4,j++)L[j]=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];window.__L.push(L);window.__W=w;window.__H=h;},[src,R]);}
 const r=await p.evaluate(T=>{const F=window.__L,w=window.__W,h=window.__H,n=F.length,motion=[0],flash=[0];
  for(let i=1;i<n;i++){let s=0;const a=F[i],b=F[i-1];for(let j=0;j<a.length;j++)s+=Math.abs(a[j]-b[j]);motion.push(+(s/a.length).toFixed(3));}
  for(let i=1;i<n-1;i++){const a=F[i-1],c=F[i],e=F[i+1];let cnt=0;
   for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const j=y*w+x;const up=c[j]-Math.max(a[j],e[j]),dn=Math.min(a[j],e[j])-c[j];
    if(up>=T){let m=1e9;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const q=j+dy*w+dx;m=Math.min(m,c[j]-Math.max(a[q],e[q]));}if(m>=T*.5)cnt++;}
    else if(dn>=T){let m=1e9;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const q=j+dy*w+dx;m=Math.min(m,Math.min(a[q],e[q])-c[j]);}if(m>=T*.5)cnt++;}}
   flash.push(cnt);}
  flash.push(0);return {n,motion,flash};},T);
 fs.writeFileSync(path.join(DIR,'metrics.json'),JSON.stringify(r));
 const mv=r.motion.slice(1),still=mv.filter(v=>v<.02).length,fl=r.flash.reduce((a,v)=>a+v,0),flFrames=r.flash.filter(v=>v>0).length;
 console.log(`frames ${r.n} · motion mean ${(mv.reduce((a,v)=>a+v,0)/mv.length).toFixed(3)} max ${Math.max(...mv).toFixed(3)} · still frames ${still} · flash px total ${fl} in ${flFrames} frames (max ${Math.max(...r.flash)})`);
 console.log('motion',mv.map(v=>v.toFixed(2)).join(' '));console.log('flash ',r.flash.join(' '));await b.close();})();
