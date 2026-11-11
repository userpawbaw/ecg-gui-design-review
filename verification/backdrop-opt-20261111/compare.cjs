// pixel difference between old/new screenshots (mean |Δ| per channel 0–255, share of pixels with |Δ| > 16); node compare.cjs
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const out={};
 for(const n of ['lab','live_x0','live_x480','live_x959']){
  const a='data:image/png;base64,'+fs.readFileSync(`old_${n}.png`).toString('base64'),c='data:image/png;base64,'+fs.readFileSync(`new_${n}.png`).toString('base64');
  out[n]=await p.evaluate(async([a,c])=>{const ld=s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=s;});const [A,C]=await Promise.all([ld(a),ld(c)]);
   const cv=document.createElement('canvas');cv.width=A.width;cv.height=A.height;const g=cv.getContext('2d');g.drawImage(A,0,0);const da=g.getImageData(0,0,cv.width,cv.height).data;g.drawImage(C,0,0);const dc=g.getImageData(0,0,cv.width,cv.height).data;
   let s=0,big=0;for(let i=0;i<da.length;i+=4){const d=(Math.abs(da[i]-dc[i])+Math.abs(da[i+1]-dc[i+1])+Math.abs(da[i+2]-dc[i+2]))/3;s+=d;if(d>16)big++;}
   return {mean:+(s/(da.length/4)).toFixed(2),over16:+(big/(da.length/4)*100).toFixed(2)+'%'};},[a,c]);}
 console.log(JSON.stringify(out));fs.writeFileSync('compare.json',JSON.stringify(out,null,1));await b.close();})();
