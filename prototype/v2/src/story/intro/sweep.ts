// Neon sweep stage for the R1 intro (IDEA-R1-INTRO N2, X4, W4). Canvas 2D on top of the WebGL scene.
// Data contract: every drawn vertex is a stored sample (clean-record R peaks only time the heart); glow, blur and the
// afterglow colour are style layers that never move a vertex. Physical scale is fixed (mV per px) for both traces.
import type {Loop} from './beats';

// glow/white: per-trace luminance balance — the dense noisy input stacks far more glow per pixel than the clean output,
// and #ffbc79 is brighter than #67e7c3, so the input is scaled down to read at the same level (user feedback 2026-09-30).
export type SweepTrace={values:Float32Array,color:[number,number,number],glow?:number,core?:number,white?:number};
export type SweepView={
 t:number,                       // playback clock (s) — same clock as the heart
 startAbs:number|null,           // first absolute sample drawn (W4: the trace starts at the R the light pulse lands on)
 mix:number,                     // 0 = noisy input only, 1 = clean output only (X4 cross-fade)
 alpha:number,                   // whole stage opacity (scroll)
 reduced:boolean,
 ring:{x:number,y:number,r:number,a:number}|null,          // pulse ring around the heart (screen px)
 comet:{x0:number,y0:number,x1:number,y1:number,k:number,a:number}|null, // light streak heart → sweep head
};
export const WINDOW_S=2.5,GAP_S=.12,ERASE_S=.3,GLOW_TAU=.2;

export function createSweep(canvas:HTMLCanvasElement,opts:{fs:number,loop:Loop,input:SweepTrace,output:SweepTrace,mvPerBox:number}){
 const g=canvas.getContext('2d')!;
 const {fs,loop}=opts,count=Math.round(WINDOW_S*fs),gap=Math.round(GAP_S*fs),erase=Math.round(ERASE_S*fs);
 const len=loop.end-loop.start;
 let W=0,H=0,dpr=1,box={l:0,r:0,t:0,b:0};
 function resize(b:{l:number,r:number,t:number,b:number}){
  dpr=Math.min(2,devicePixelRatio||1);W=canvas.clientWidth;H=canvas.clientHeight;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);box=b;
 }
 const yOf=(mv:number)=>{const mid=(box.t+box.b)/2;return mid-mv*(box.b-box.t)/opts.mvPerBox;};
 const xOfSlot=(slot:number)=>box.l+slot/count*(box.r-box.l);
 const idx=(abs:number)=>loop.start+((abs%len)+len)%len;
 // age (samples) → [intensity, whiteness]: fresh samples are hot and near-white, then cool to the trace colour;
 // the oldest samples just ahead of the head fade out locally before the blank gap (U9).
 function look(age:number):[number,number]{
  if(age>=count-gap)return[0,0];
  const a=age/fs,glow=Math.exp(-a/GLOW_TAU);
  const fade=age>count-gap-erase?(count-gap-age)/erase:1;
  const e=fade*fade*(3-2*fade);
  return[(.72+.28*glow)*e,glow];
 }
 function gradient(color:[number,number,number],headX:number,alphaK:number,boost:number){
  const gr=g.createLinearGradient(box.l,0,box.r,0),span=box.r-box.l,steps=96;
  for(let i=0;i<=steps;i++){
   const x=box.l+span*i/steps;let age=Math.round((headX-x)/span*count);age=((age%count)+count)%count;
   const [k,wht]=look(age);const c=color.map(v=>Math.round(v+(255-v)*wht*.75*boost));
   gr.addColorStop(i/steps,`rgba(${c[0]},${c[1]},${c[2]},${(k*alphaK).toFixed(3)})`);
  }
  return gr;
 }
 function path(trace:Float32Array,headAbs:number,first:number){
  // slots ordered left→right; break at the head so the newest sample never joins the oldest one
  const p=new Path2D();let pen=false;const headSlot=((headAbs%count)+count)%count;
  for(let slot=0;slot<count;slot++){
   const abs=headAbs-((headSlot-slot+count)%count);
   const age=headAbs-abs;
   if(abs<first||age>=count-gap){pen=false;continue;}
   const x=xOfSlot(slot),y=yOf(trace[idx(abs)]);
   if(!pen){p.moveTo(x,y);pen=true;}else p.lineTo(x,y);
   if(slot===headSlot)pen=false;
  }
  return p;
 }
 // Glow without canvas filters (software blur stalls; a GPU-light exhibit PC is not guaranteed): the stroke is drawn
 // at 1/2 resolution, halved twice more (each bilinear halving is a small box blur), and the three levels are scaled
 // back up with smoothing and added. The X4 focus pull cross-fades the sharp core with the 1/2 level.
 const lv=[1,2,3].map(()=>{const c=document.createElement('canvas');return{c,g:c.getContext('2d')!};}),PAD=48;
 function layer(tr:SweepTrace,headAbs:number,first:number,a:number,focus:number,boost:number){
  if(a<=.003)return;
  const headSlot=((headAbs%count)+count)%count,headX=xOfSlot(headSlot);
  const gr=gradient(tr.color,headX,1,boost*(tr.white??1)),p=path(tr.values,headAbs,first);
  const ga=a*(tr.glow??1),ca=a*(tr.core??1);
  const gx=box.l-PAD,gy=box.t-PAD,gw=box.r-box.l+2*PAD,gh=box.b-box.t+2*PAD;
  lv.forEach((l,i)=>{const w=Math.ceil(gw/2**(i+1)),h=Math.ceil(gh/2**(i+1));if(l.c.width!==w||l.c.height!==h){l.c.width=w;l.c.height=h;}l.g.setTransform(1,0,0,1,0,0);l.g.clearRect(0,0,w,h);l.g.imageSmoothingEnabled=true;});
  const l0=lv[0];l0.g.setTransform(.5,0,0,.5,-gx*.5,-gy*.5);l0.g.lineJoin='round';l0.g.lineCap='round';l0.g.strokeStyle=gr;l0.g.lineWidth=3.4;l0.g.stroke(p);
  for(let i=1;i<3;i++)lv[i].g.drawImage(lv[i-1].c,0,0,lv[i].c.width,lv[i].c.height);
  g.imageSmoothingEnabled=true;g.globalCompositeOperation='lighter';
  g.globalAlpha=.9*ga;g.drawImage(lv[2].c,gx,gy,gw,gh);                   // wide bloom
  g.globalAlpha=.7*ga;g.drawImage(lv[1].c,gx,gy,gw,gh);                   // mid glow
  g.globalAlpha=(.35*ga+.9*focus*ca);g.drawImage(lv[0].c,gx,gy,gw,gh);       // inner glow / defocused core
  // core: always the same vertices; out of focus it fades into the soft level instead of moving
  g.globalAlpha=ca*(1-focus);g.lineJoin='round';g.lineCap='round';g.strokeStyle=gr;g.lineWidth=1.6;g.stroke(p);
  g.globalAlpha=1;g.globalCompositeOperation='source-over';
  return headX;
 }
 function draw(v:SweepView){
  g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
  if(v.alpha>.003&&v.startAbs!==null){
   const headAbs=Math.floor(v.t*fs+1e-6);
   if(headAbs>=v.startAbs){
    const m=v.mix,blurMax=v.reduced?0:1;
    layer(opts.input,headAbs,v.startAbs,v.alpha*(1-m),blurMax*m,1);
    const hx=layer(opts.output,headAbs,v.startAbs,v.alpha*m,blurMax*(1-m),1.15);
    // head marker: small hot point at the newest sample (position marker only)
    const cur=m<.5?opts.input:opts.output,x=hx??xOfSlot(((headAbs%count)+count)%count),y=yOf(cur.values[idx(headAbs)]);
    const rg=g.createRadialGradient(x,y,0,x,y,18);rg.addColorStop(0,`rgba(255,255,255,${.75*v.alpha})`);rg.addColorStop(1,'rgba(255,255,255,0)');
    g.globalCompositeOperation='lighter';g.fillStyle=rg;g.fillRect(x-18,y-18,36,36);g.globalCompositeOperation='source-over';
   }
  }
  if(v.ring&&v.ring.a>.003){
   g.globalCompositeOperation='lighter';
   for(const [w,k] of [[16,.1],[7,.28],[2.2,1]] as const){g.strokeStyle=`rgba(255,196,186,${v.ring.a*k})`;g.lineWidth=w;g.beginPath();g.arc(v.ring.x,v.ring.y,v.ring.r,0,Math.PI*2);g.stroke();}
   g.globalCompositeOperation='source-over';
  }
  if(v.comet&&v.comet.a>.003){
   const c=v.comet,e=c.k<.5?4*c.k**3:1-(-2*c.k+2)**3/2;
   const x=c.x0+(c.x1-c.x0)*e,y=c.y0+(c.y1-c.y0)*e,tail=Math.max(0,e-.32),tx=c.x0+(c.x1-c.x0)*tail,ty=c.y0+(c.y1-c.y0)*tail;
   const lg=g.createLinearGradient(tx,ty,x,y);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(1,`rgba(235,255,248,${c.a})`);
   g.globalCompositeOperation='lighter';g.strokeStyle=lg;g.lineCap='round';
   for(const [w,k] of [[16,.14],[6,.4],[2.2,1]] as const){g.globalAlpha=k;g.lineWidth=w;g.beginPath();g.moveTo(tx,ty);g.lineTo(x,y);g.stroke();}
   const hg=g.createRadialGradient(x,y,0,x,y,22);hg.addColorStop(0,`rgba(255,255,255,${c.a})`);hg.addColorStop(1,'rgba(255,255,255,0)');g.globalAlpha=1;g.fillStyle=hg;g.fillRect(x-22,y-22,44,44);
   g.globalAlpha=1;g.globalCompositeOperation='source-over';
  }
 }
 return{resize,draw,slotX:(abs:number)=>xOfSlot(((abs%count)+count)%count),yOf,count,get box(){return box;}};
}
export type Sweep=ReturnType<typeof createSweep>;
