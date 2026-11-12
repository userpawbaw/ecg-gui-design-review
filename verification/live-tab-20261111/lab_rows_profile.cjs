// Per-row trace profile of a lab panel screenshot (lab_rows.cjs layout, 1600 × 1000, rows input + 3 methods):
// for every column left of the sweep head: brightest pixel in the row (trace core) and the number of pixels above 60 (glow width).
// Reports medians per row. node lab_rows_profile.cjs <png> [<png> …]
const {chromium}=require('playwright');const fs=require('fs');
const ROWS=[['input',35,190],['row2',255,410],['row3',475,630],['row4(last)',695,850]];
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 for(const f of process.argv.slice(2)){
  const r=await p.evaluate(async([src,ROWS])=>{const i=new Image();await new Promise(o=>{i.onload=o;i.src=src;});const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d');g.drawImage(i,0,0);
   // sweep head column: the brightest column of row 4 in the right third
   const out={};for(const [name,y0,y1] of ROWS){const d=g.getImageData(80,y0,1020,y1-y0).data,w=1020,h=y1-y0,mx=[],wid=[];
    for(let x=0;x<w;x++){let m=0,n=0;for(let y=0;y<h;y++){const k=(y*w+x)*4,L=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];if(L>m)m=L;if(L>60)n++;}mx.push(m);wid.push(n);}
    const med=a=>a.slice().sort((u,v)=>u-v)[a.length>>1],p90=a=>a.slice().sort((u,v)=>u-v)[Math.floor(a.length*.9)];
    out[name]={coreMedian:+med(mx).toFixed(1),coreP90:+p90(mx).toFixed(1),glowPxMedian:med(wid)};}return out;},['data:image/png;base64,'+fs.readFileSync(f).toString('base64'),ROWS]);
  console.log(f);for(const [k,v] of Object.entries(r))console.log('  ',k.padEnd(11),JSON.stringify(v));}
 await b.close();})();
