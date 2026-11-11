// per-column maximum luminance and halo width (pixels above 60) of the trace, median over columns of the middle half of a plot.
// node trace_profile.cjs <png> <x> <y> <w> <h> [label]
const {chromium}=require('playwright');const fs=require('fs');const [f,x,y,w,h,label]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 const r=await p.evaluate(async([src,x,y,w,h])=>{const i=new Image();await new Promise(o=>{i.onload=o;i.src=src;});const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d');g.drawImage(i,0,0);
  const d=g.getImageData(x,y,w,h).data,mx=[],wid=[];for(let cx=0;cx<w;cx++){let m=0,n=0;for(let cy=0;cy<h;cy++){const k=(cy*w+cx)*4,L=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];if(L>m)m=L;if(L>60)n++;}mx.push(m);wid.push(n);}
  const med=a=>a.slice().sort((u,v)=>u-v)[a.length>>1];return {peakMedian:+med(mx).toFixed(1),haloPxMedian:med(wid)};},['data:image/png;base64,'+fs.readFileSync(f).toString('base64'),+x,+y,+w,+h]);
 console.log(label||f,JSON.stringify(r));await b.close();})();
