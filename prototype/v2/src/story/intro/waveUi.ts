// Waveform stage UI for the R1 intro (IDEA-R1-WAVE round 1: G3, T2, L1+L2; P1 lives in introStage).
// - G3 grid: ECG paper (0.04 s × 0.1 mV small squares, 0.2 s × 0.5 mV large) drawn once, bleeding past the box
//   and fading out, plus a brighter copy the sweep head lights up (REF-008 "chart is part of the page").
// - T2 beat-stepped cross-fade: scroll sets the target, the heart's R peaks release it one quarter at a time
//   (same clock as the heart and the sweep, D-041), each step flashes the trace; when it reaches 1 the label hands
//   over (REF-007 EFX-007-01) and the stored metrics resolve after a symbol-only scramble (REF-009 EFX-009-01).
// - L1+L2: two-tier labels (large Korean word + small mono line) and an annotation pinned to an R sample (REF-008).
// Data contract: grid squares are physical units; metrics are the stored values; the scramble never shows digits.

export const SQUARE={s:.04,mv:.1};           // ECG paper small square (25 mm/s, 10 mm/mV proportions)

export function mvPerBoxFor(box:{l:number,r:number,t:number,b:number},windowS:number){
 const pxPerS=(box.r-box.l)/windowS,pxPerMv=pxPerS*SQUARE.s/SQUARE.mv;     // square grid
 return(box.b-box.t)/pxPerMv;
}

export function createGrid(canvas:HTMLCanvasElement){
 const g=canvas.getContext('2d')!;
 const hot=document.createElement('canvas'),hg=hot.getContext('2d')!;
 let dpr=1;
 function paint(ctx:CanvasRenderingContext2D,W:number,H:number,box:{l:number,r:number,t:number,b:number},windowS:number,mvPerBox:number,k:number){
  const pxS=(box.r-box.l)/windowS,pxMv=(box.b-box.t)/mvPerBox,mid=(box.t+box.b)/2;
  ctx.clearRect(0,0,W,H);
  const lines=(step:number,major:boolean)=>{
   ctx.beginPath();
   const dx=pxS*step*(major?5:1),dy=pxMv*SQUARE.mv*(major?5:1);
   for(let x=box.l-Math.ceil(box.l/dx)*dx;x<=W;x+=dx){ctx.moveTo(Math.round(x)+.5,0);ctx.lineTo(Math.round(x)+.5,H);}
   for(let y=mid-Math.ceil(mid/dy)*dy;y<=H;y+=dy){ctx.moveTo(0,Math.round(y)+.5);ctx.lineTo(W,Math.round(y)+.5);}
   ctx.strokeStyle=`rgba(103,231,195,${(major?.13:.05)*k})`;ctx.lineWidth=1;ctx.stroke();
  };
  lines(SQUARE.s,false);lines(SQUARE.s,true);
  // baseline (0 mV) a touch stronger
  ctx.beginPath();ctx.moveTo(0,Math.round(mid)+.5);ctx.lineTo(W,Math.round(mid)+.5);ctx.strokeStyle=`rgba(103,231,195,${.12*k})`;ctx.stroke();
  // bleed: crisp inside the box, fading out beyond it (elliptical mask)
  const cx=(box.l+box.r)/2,cy=mid,rx=(box.r-box.l)/2*1.45,ry=(box.b-box.t)/2*1.75;
  ctx.save();ctx.globalCompositeOperation='destination-in';ctx.translate(cx,cy);ctx.scale(1,ry/rx);
  const m=ctx.createRadialGradient(0,0,0,0,0,rx);m.addColorStop(0,'#000');m.addColorStop(.66,'#000');m.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=m;ctx.fillRect(-rx,-rx,2*rx,2*rx);ctx.restore();
 }
 function resize(box:{l:number,r:number,t:number,b:number},windowS:number,mvPerBox:number){
  dpr=Math.min(2,devicePixelRatio||1);const W=canvas.clientWidth,H=canvas.clientHeight;
  for(const c of [canvas,hot]){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);}
  g.setTransform(dpr,0,0,dpr,0,0);hg.setTransform(dpr,0,0,dpr,0,0);
  paint(g,W,H,box,windowS,mvPerBox,1);paint(hg,W,H,box,windowS,mvPerBox,4.2);
 }
 return{resize,hot,get dpr(){return dpr;}};
}
export type Grid=ReturnType<typeof createGrid>;

// T2: cross-fade released by R peaks, STEPS quarters; flash after each step
export function createBeatMix(steps=4){
 let shown=0,from=0,goal=0,stepT=-1,lastBeat=NaN,flash=0;
 return{
  update(target:number,prevR:number,t:number,reduced:boolean){
   if(reduced){shown=goal=from=target;flash=0;return;}
   if(t<stepT){stepT=-1;from=shown=goal;}                     // clock moved backwards (capture reset)
   const q=Math.round(target*steps)/steps;
   if(prevR!==lastBeat){
    lastBeat=prevR;
    if(Math.abs(q-goal)>1e-6){from=shown;goal=Math.round((goal+Math.sign(q-goal)/steps)*steps)/steps;stepT=prevR;}
   }
   const k=stepT<0?1:Math.min(1,Math.max(0,(t-stepT)/.16)),e=1-(1-k)**3;
   shown=from+(goal-from)*e;
   flash=stepT<0?0:Math.exp(-Math.max(0,t-stepT)/.15);
  },
  get value(){return shown;},get goal(){return goal;},get flash(){return flash;},
  reset(){shown=from=goal=0;stepT=-1;lastBeat=NaN;flash=0;},
 };
}

// D-055 (replaces T2 for the intro): the input→output blend follows the scroll, cut to 2.5 % steps and eased over ~0.08 s;
// scrolling back undoes it. Same interface as createBeatMix (value, goal, flash, reset).
export function createScrollMix(stepFrac=.025,tau=.08){
 let shown=0,goal=0;
 return{
  update(target:number,dt:number,reduced:boolean){
   goal=Math.round(Math.min(1,Math.max(0,target))/stepFrac)*stepFrac;
   shown=reduced?goal:shown+(goal-shown)*(1-Math.exp(-dt/tau));
   if(Math.abs(goal-shown)<1e-4)shown=goal;
  },
  get value(){return shown;},get goal(){return goal;},get flash(){return 0;},
  reset(){shown=goal=0;},
 };
}

// symbol-only scramble: unrevealed characters show symbols, never digits (no invented values)
const SYM='#%*/+<>=';
export function scrambled(final:string,k:number,seed:number){
 const n=final.length,shown=Math.floor(k*n);
 let s='';for(let i=0;i<n;i++){const c=final[i];s+=i<shown||c===' '||c==='·'?c:SYM[(i*7+seed)%SYM.length];}
 return s;
}
