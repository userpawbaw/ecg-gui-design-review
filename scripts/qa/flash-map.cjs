#!/usr/bin/env node
// Overlay the one-frame flash pixels of frame i (same rule as frame-metrics.cjs) in magenta on that frame: node flash-map.cjs <dir> <i> [--t 24]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const [DIR,I]=process.argv.slice(2);const T=Number((process.argv.indexOf('--t')>0?process.argv[process.argv.indexOf('--t')+1]:24));
const f=k=>'data:image/png;base64,'+fs.readFileSync(path.join(DIR,`frame_${String(k).padStart(4,'0')}.png`)).toString('base64');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const i=Number(I);
 const out=await p.evaluate(async([a,c,e,T])=>{const ld=s=>new Promise(r=>{const m=new Image();m.onload=()=>r(m);m.src=s;});const [A,C,E]=await Promise.all([ld(a),ld(c),ld(e)]);
  const w=C.width,h=C.height,cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');const get=m=>{g.drawImage(m,0,0);const d=g.getImageData(0,0,w,h).data,L=new Float32Array(w*h);for(let k=0,j=0;k<d.length;k+=4,j++)L[j]=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];return L;};
  const la=get(A),le=get(E),lc=get(C);g.drawImage(C,0,0);const img=g.getImageData(0,0,w,h);let n=0;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const j=y*w+x;if(lc[j]-Math.max(la[j],le[j])>=T||Math.min(la[j],le[j])-lc[j]>=T){n++;img.data[j*4]=255;img.data[j*4+1]=0;img.data[j*4+2]=255;}}
  g.putImageData(img,0,0);return [cv.toDataURL('image/png'),n];},[f(i-1),f(i),f(i+1),T]);
 fs.writeFileSync(path.join(DIR,`flashmap_${i}.png`),Buffer.from(out[0].split(',')[1],'base64'));console.log('frame',i,'flash px',out[1]);await b.close();})();
