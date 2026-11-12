// Per-row trace profile (colour-independent): for each column left of the head, brightest max(R,G,B) and pixels with max(R,G,B) > 70.
// Medians per row. Rows are found from the panel screenshot height (equal row boxes, as Plot.tsx lays them out). node rows_v.cjs <png> <rows>
const {chromium}=require('playwright');const fs=require('fs');const [f,nr]=[process.argv[2],Number(process.argv[3])];
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 const r=await p.evaluate(async([src,nr])=>{const i=new Image();await new Promise(o=>{i.onload=o;i.src=src;});const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d');g.drawImage(i,0,0);
  // find plot rows: horizontal bands where the grid colour is present; simpler: split the canvas area (top 0 … legend) evenly
  const H=i.height,legend=H*0.705,out=[];for(let k=0;k<nr;k++){const y0=Math.round(k*legend/nr+35),y1=Math.round((k+1)*legend/nr-30);const w=1000,h=y1-y0,d=g.getImageData(80,y0,w,h).data,mx=[],wid=[];
   for(let x=0;x<w;x++){let m=0,n=0;for(let y=0;y<h;y++){const q=(y*w+x)*4,V=Math.max(d[q],d[q+1],d[q+2]);if(V>m)m=V;if(V>70)n++;}mx.push(m);wid.push(n);}
   const med=a=>a.slice().sort((u,v)=>u-v)[a.length>>1];out.push([med(mx),med(wid)]);}return out;},['data:image/png;base64,'+fs.readFileSync(f).toString('base64'),nr]);
 console.log(f,r.map((v,k)=>(k?'row'+(k+1):'input')+' '+v[0]+'/'+v[1]+'px').join(' · '));await b.close();})();
