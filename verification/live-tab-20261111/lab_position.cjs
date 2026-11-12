// Same method (M04) as a middle row vs as the last-picked row, in sweep and scroll mode.
// A: click M04 then M06 → rows input · M08 · M04 · M06 (M04 = row 3, middle)
// B: click M06 then M04 → rows input · M08 · M06 · M04 (M04 = row 4, last picked)
// Metric per row, columns left of the head: median over columns of the brightest pixel's max(R,G,B) (colour-independent) and the
// number of pixels with max(R,G,B) > 70 (glow width). node lab_position.cjs <tag>
const {chromium}=require('playwright');const fs=require('fs');const TAG=process.argv[2]||'cur';
const ROWS=[['input',35,190],['row2',255,410],['row3',475,630],['row4',695,850]];
async function shot(order,mode){const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:1000}});
 await p.goto('http://127.0.0.1:5179/?route=lab&bgres=.35&labfx=2',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
 for(const id of order){await p.locator('.method-panel .method-list button',{hasText:id}).first().click();await p.waitForTimeout(800);}
 if(mode==='scroll')await p.getByRole('button',{name:'스크롤',exact:true}).first().click();
 await p.getByRole('button',{name:/재생/}).first().click();await p.waitForTimeout(4500);
 const f=`pos_${TAG}_${mode}_${order.join('')}.png`;await p.locator('.signal-panel').first().screenshot({path:f});await b.close();return f;}
async function measure(p,f){return p.evaluate(async([src,ROWS])=>{const i=new Image();await new Promise(o=>{i.onload=o;i.src=src;});const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d');g.drawImage(i,0,0);
 const out={};for(const [name,y0,y1] of ROWS){const w=1000,h=y1-y0,d=g.getImageData(80,y0,w,h).data,mx=[],wid=[];
  for(let x=0;x<w;x++){let m=0,n=0;for(let y=0;y<h;y++){const k=(y*w+x)*4,V=Math.max(d[k],d[k+1],d[k+2]);if(V>m)m=V;if(V>70)n++;}mx.push(m);wid.push(n);}
  const med=a=>a.slice().sort((u,v)=>u-v)[a.length>>1];out[name]=[med(mx),med(wid)];}return out;},['data:image/png;base64,'+fs.readFileSync(f).toString('base64'),ROWS]);}
(async()=>{const res={};for(const mode of ['sweep','scroll'])for(const order of [['M04','M06'],['M06','M04']])res[mode+':'+order.join('>')]=await shot(order,mode);
 const b=await chromium.launch();const p=await b.newPage();
 for(const [k,f] of Object.entries(res)){const m=await measure(p,f);console.log(TAG,k.padEnd(18),'input',m.input,'row2(M08)',m.row2,'row3',m.row3,'row4',m.row4);}
 await b.close();})();
