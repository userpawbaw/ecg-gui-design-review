// Lab waveform styling (D-073, user 2026-10-18): the intro's neon sweep (story/intro/sweep.ts, waveUi.ts) carried to the Lab
// plot, plus A (one ECG-paper light column across every row behind the sweep head) and C (the band between the output and the
// Reference lit just behind the head, cooling within FRESH_S). Data contract: every vertex is a stored sample; glow, afterglow,
// grid light and the error band are style layers that never move a vertex and leave no quantity on screen once cooled.
// Laptop budget: static layers are cached, glow is a half → quarter → eighth resolution sum (no canvas filters) on the selected
// output row only, and the level drops (2 → 1 → 0) when the measured draw time stays high.
export const GLOW_TAU=.2,ERASE_S=.3,FRESH_S=.5,BAND_S=.35,SQUARE={s:.04,mv:.1};
export type Box={l:number,r:number,t:number,b:number};

/** age (s) behind the head → [intensity, whiteness]; the oldest samples just ahead of the head fade out (intro look()) */
export function look(age:number,span:number,gap:number):[number,number]{
 const end=span-gap;if(age>=end)return[0,0];
 const glow=Math.exp(-age/GLOW_TAU),f=age>end-ERASE_S?(end-age)/ERASE_S:1,e=f*f*(3-2*f);
 return[(.72+.28*glow)*e,glow];
}
/** horizontal gradient across [l, r] for a trace whose newest sample is at headX; ageOf(x) gives seconds behind the head */
export function ageGradient(g:CanvasRenderingContext2D,l:number,r:number,color:[number,number,number],ageOf:(x:number)=>number,span:number,gap:number,white:number,alphaK=1,steps=64){
 const gr=g.createLinearGradient(l,0,r,0);
 for(let i=0;i<=steps;i++){const x=l+(r-l)*i/steps,[k,w]=look(ageOf(x),span,gap),c=color.map(v=>Math.round(v+(255-v)*w*.75*white));
  gr.addColorStop(i/steps,`rgba(${c[0]},${c[1]},${c[2]},${(k*alphaK).toFixed(3)})`);}
 return gr;
}
/** C: the band between output and Reference fades with age (0.5 s); alpha only, same hue as the row */
export function freshGradient(g:CanvasRenderingContext2D,l:number,r:number,color:[number,number,number],ageOf:(x:number)=>number,strength:number,steps=48){
 const gr=g.createLinearGradient(l,0,r,0);
 for(let i=0;i<=steps;i++){const a=ageOf(l+(r-l)*i/steps),k=a<FRESH_S?(1-a/FRESH_S)**2:0;gr.addColorStop(i/steps,`rgba(${color[0]},${color[1]},${color[2]},${(k*strength).toFixed(3)})`);}
 return gr;
}
/** ECG paper (0.04 s × 0.1 mV small, 0.2 s × 0.5 mV large) in physical units of this row; small lines only when ≥ 5 px apart */
export function paper(g:CanvasRenderingContext2D,b:Box,spanS:number,ampMv:number,k:number){
 const pxS=(b.r-b.l)/spanS,pxMv=(b.b-b.t)/2/ampMv,mid=(b.t+b.b)/2;
 const lines=(dx:number,dy:number,a:number)=>{g.beginPath();
  if(dx>=5)for(let x=b.l;x<=b.r+.5;x+=dx){g.moveTo(Math.round(x)+.5,b.t);g.lineTo(Math.round(x)+.5,b.b);}
  if(dy>=5){for(let y=mid;y>=b.t-.5;y-=dy){g.moveTo(b.l,Math.round(y)+.5);g.lineTo(b.r,Math.round(y)+.5);}for(let y=mid+dy;y<=b.b+.5;y+=dy){g.moveTo(b.l,Math.round(y)+.5);g.lineTo(b.r,Math.round(y)+.5);}}
  g.strokeStyle=`rgba(103,231,195,${Math.min(1,a*k)})`;g.lineWidth=1;g.stroke();};
 lines(pxS*SQUARE.s,pxMv*SQUARE.mv,.05);lines(pxS*SQUARE.s*5,pxMv*SQUARE.mv*5,.13);
 g.beginPath();g.moveTo(b.l,Math.round(mid)+.5);g.lineTo(b.r,Math.round(mid)+.5);g.strokeStyle=`rgba(103,231,195,${Math.min(1,.16*k)})`;g.stroke();
}
/** glow from three downsampled copies of one stroke, added onto g (intro sweep.ts layer()) */
export function createGlow(){
 const lv=[1,2,3].map(()=>{const c=document.createElement('canvas');return{c,g:c.getContext('2d')!};}),PAD=36;
 return(g:CanvasRenderingContext2D,b:Box,path:Path2D,style:CanvasGradient|string,levels:number,strength:number)=>{
  if(levels<=0||strength<=.003)return;
  const gx=b.l-PAD,gy=b.t-PAD,gw=b.r-b.l+2*PAD,gh=b.b-b.t+2*PAD;
  lv.forEach((l,i)=>{const w=Math.ceil(gw/2**(i+1)),h=Math.ceil(gh/2**(i+1));if(l.c.width!==w||l.c.height!==h){l.c.width=w;l.c.height=h;}l.g.setTransform(1,0,0,1,0,0);l.g.clearRect(0,0,w,h);l.g.imageSmoothingEnabled=true;});
  const l0=lv[0];l0.g.setTransform(.5,0,0,.5,-gx*.5,-gy*.5);l0.g.lineJoin='round';l0.g.lineCap='round';l0.g.strokeStyle=style;l0.g.lineWidth=2.4;l0.g.stroke(path);
  for(let i=1;i<levels+1&&i<3;i++)lv[i].g.drawImage(lv[i-1].c,0,0,lv[i].c.width,lv[i].c.height);
  g.save();g.imageSmoothingEnabled=true;g.globalCompositeOperation='lighter';
  if(levels>=2){g.globalAlpha=.8*strength;g.drawImage(lv[2].c,gx,gy,gw,gh);}
  g.globalAlpha=.65*strength;g.drawImage(lv[1].c,gx,gy,gw,gh);
  g.globalAlpha=.35*strength;g.drawImage(lv[0].c,gx,gy,gw,gh);
  g.restore();
 };
}
export const rgb=(hex:string):[number,number,number]=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)) as [number,number,number];
