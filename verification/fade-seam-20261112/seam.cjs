// Lab sweep playback: canvas pixels just right of the erase gap (where old samples fade back in) on the first method row.
// Prints the per-column brightest max(R,G,B) across the fade end and saves a ×4 crop. node seam.cjs <tag>
const {chromium}=require('playwright');const TAG=process.argv[2]||'x';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(2600);
 await p.getByRole('button',{name:/일시정지/}).first().click().catch(()=>{});await p.waitForTimeout(300);
 const r=await p.$eval('.signal-panel canvas',c=>{const R=c.getBoundingClientRect(),dpr=c.width/R.width,w=R.width,h=R.height,t=Number(c.dataset.time),span=5;
  const left=72,pw=w-18-left,headX=left+((t%span)/span)*pw,rh=h/2,top=rh+36,bot=2*rh-30;const g=c.getContext('2d');
  const x0=Math.round(headX),x1=Math.round(headX+0.6/span*pw),d=g.getImageData(x0*dpr,top*dpr,(x1-x0)*dpr,(bot-top)*dpr);const col=[];
  for(let x=0;x<d.width;x++){let m=0;for(let y=0;y<d.height;y++){const q=(y*d.width+x)*4;m=Math.max(m,d.data[q],d.data[q+1],d.data[q+2]);}col.push(m);}
  return {t,headX,x0,top,bot,col,dpr};});
 await p.screenshot({path:`${TAG}_crop.png`,clip:{x:r.x0+(await p.$eval('.signal-panel canvas',c=>c.getBoundingClientRect().x)),y:r.top+(await p.$eval('.signal-panel canvas',c=>c.getBoundingClientRect().y)),width:r.col.length/r.dpr,height:r.bot-r.top}});
 console.log(TAG,'t',r.t,'col max',r.col.join(' '));await b.close();})();
