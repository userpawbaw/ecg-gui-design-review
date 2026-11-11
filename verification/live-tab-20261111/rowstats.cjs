// per-row trace brightness from a panel screenshot: rows are split by the 4 plot boxes; metric = mean luminance of the top 1 % pixels
// and of pixels between the 90th and 99th percentile (the halo). node rowstats.cjs a.png b.png
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 for(const f of process.argv.slice(2)){const src='data:image/png;base64,'+fs.readFileSync(f).toString('base64');
  const r=await p.evaluate(async src=>{const i=new Image();await new Promise(o=>{i.onload=o;i.src=src;});const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d');g.drawImage(i,0,0);
   const out=[];for(const [y0,y1] of [[35,190],[255,410],[475,630],[695,850]]){const d=g.getImageData(80,y0,1040,y1-y0).data;const L=[];for(let k=0;k<d.length;k+=4)L.push(.2126*d[k]+.7152*d[k+1]+.0722*d[k+2]);L.sort((a,b)=>a-b);
    const pct=q=>L[Math.floor(q*(L.length-1))];const top=L.slice(Math.floor(.99*L.length));const halo=L.slice(Math.floor(.9*L.length),Math.floor(.99*L.length));
    out.push({top1:+(top.reduce((a,b)=>a+b,0)/top.length).toFixed(1),halo:+(halo.reduce((a,b)=>a+b,0)/halo.length).toFixed(1)});}return out;},src);
  console.log(f,JSON.stringify(r));}
 await b.close();})();
