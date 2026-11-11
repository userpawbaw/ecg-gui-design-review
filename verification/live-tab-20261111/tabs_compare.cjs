// lab vs live at 1920 × 1032: whole-page screenshots + mean luminance of (a) the backdrop strip right of the panels, (b) a waveform
// plot area, (c) the brightest 0.3 % in that plot area (trace core), (d) pixels at the 97–99.7th percentile (glow). node tabs_compare.cjs
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1032}});
 await p.goto('http://127.0.0.1:5179/?route=lab',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(5000);await p.screenshot({path:'tab_lab.png'});
 const labPlot=await p.locator('.signal-panel canvas').first().boundingBox();
 await p.getByRole('button',{name:'실시간 측정'}).click();await p.waitForSelector('.live-native canvas',{timeout:60000});await p.waitForTimeout(9000);
 await p.screenshot({path:'tab_live.png'});const livePlot=await p.locator('.live-native canvas').first().boundingBox();
 const stat=async(f,box)=>p.evaluate(async([src,box])=>{const i=new Image();await new Promise(o=>{i.onload=o;i.src=src;});const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d');g.drawImage(i,0,0);
  const L=(x,y,w,h)=>{const d=g.getImageData(x,y,w,h).data,a=[];for(let k=0;k<d.length;k+=4)a.push(.2126*d[k]+.7152*d[k+1]+.0722*d[k+2]);return a.sort((u,v)=>u-v);};
  const mean=a=>+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(1);const bd=L(1880,200,30,700);const pl=L(Math.round(box.x+60),Math.round(box.y+20),Math.round(box.width-120),Math.round(box.height-60));
  return {backdrop:mean(bd),plotMean:mean(pl),plotMedian:+pl[pl.length>>1].toFixed(1),core:mean(pl.slice(Math.floor(.997*pl.length))),glow:mean(pl.slice(Math.floor(.97*pl.length),Math.floor(.997*pl.length)))};},
  ['data:image/png;base64,'+fs.readFileSync(f).toString('base64'),box]);
 console.log('lab ',JSON.stringify(await stat('tab_lab.png',labPlot)));console.log('live',JSON.stringify(await stat('tab_live.png',livePlot)));await b.close();})();
