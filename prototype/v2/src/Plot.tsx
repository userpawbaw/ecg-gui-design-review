import {useEffect,useRef} from 'react';
import {Transport,visiblePoints,type Mode} from './engine';
import {amplitudeTicks} from './plot-scale';
import type {Loaded} from './data';
import {ageGradient,freshGradient,paper,createGlow,rgb,BAND_S,type Box} from './labFx';
type Props={data:Loaded;transport:Transport;mode:Mode;span:number;inspect:boolean;amplitude:number;reference:number;method:string;preview:string|null;comparison:string|null;large?:boolean;soft:boolean;residual?:boolean;gain?:number};
const BG='#0a1a21',GAP_S=.12;
// D-073 laptop budget: glow levels 2 (three blur levels) → 1 (two) → 0 (none). Level 2 is the default again at the thinner lines (user 2026-10-18 "이 두께에선 &labfx=2가 기본값"). ?labfx= pins it; otherwise it steps down when the
// frame interval while playing stays above 26 ms (< ~38 fps) — the script part of a draw is ~2.5 ms, the cost is in rasterising
// the glow, so the interval is what shows it — and never back up, so the picture does not pulse between levels.
const FX_PIN=(()=>{const v=new URLSearchParams(location.search).get('labfx');return v===null?null:Math.max(0,Math.min(2,Number(v)||0));})();
export function Plot(p:Props){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(p);latest.current=p;
 const fx=useRef({level:FX_PIN??2,ema:0,frames:0,last:0});
 useEffect(()=>{const c=canvas.current!;const g=c.getContext('2d');if(!g)return;let raf=0,signature='',bgSig='';
 const bg=document.createElement('canvas'),bgg=bg.getContext('2d')!,hot=document.createElement('canvas'),hg=hot.getContext('2d')!,glow=createGlow();
 const draw=()=>{const t0=performance.now(),q=latest.current,t=q.transport.time;const rect=c.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
 const sig=[t,q.mode,q.span,q.inspect,q.amplitude,q.reference,q.method,q.preview,q.comparison,q.data.scene.id,q.data.offset,q.soft,q.residual,q.gain,rect.width,rect.height,dpr,fx.current.level].join('|');
 // a collapsed canvas (0 × 0 while the layout changes) is skipped: drawImage of a 0-size static layer throws
 if(sig!==signature&&rect.width>=1&&rect.height>=1){signature=sig;const W=Math.round(rect.width*dpr),H=Math.round(rect.height*dpr);if(c.width!==W||c.height!==H){c.width=W;c.height=H;}g.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;
 const rows=[{id:'input',label:'입력 · Noisy',color:'#ffbc79'},{id:q.method,label:q.method+' · 선택 출력',color:'#67e7c3'}];if(q.comparison)rows.push({id:q.comparison,label:q.comparison+' · 고정 비교',color:'#97c2ff'});
 const count=rows.length;const rh=(h-(q.residual?144:0))/count;if(q.residual)rows.push({id:q.method,label:`Reference와 차이 · Output − Reference · 표시 ×${q.gain||1}`,color:'#c0ced7'});g.font='11px system-ui';const labelWidth=Math.max(...amplitudeTicks(q.amplitude,q.residual?q.gain||1:1).concat(amplitudeTicks(q.amplitude)).map(t=>g.measureText(t.label).width));const left=Math.max(72,labelWidth+26),right=w-18,pw=right-left;
 const boxes:Box[]=rows.map((_,r)=>{const isDiff=q.residual&&r===count,top=r*rh+36;return{l:left,r:right,t:top,b:isDiff?top+72:(r+1)*rh-30};});
 // static layer (background, ECG paper, labels, amplitude ticks) + a brighter paper copy for A — redrawn only when the layout changes
 const clearBg=document.body.classList.contains('lab-dark')&&!c.closest('.large-dialog');   // D-074: the panel shows the archive faintly through
 const bs=[w,h,dpr,q.amplitude,q.span,q.residual,q.gain,q.method,q.comparison,clearBg].join('|');
 if(bs!==bgSig){bgSig=bs;for(const [cv,cg] of [[bg,bgg],[hot,hg]] as const){cv.width=W;cv.height=H;cg.setTransform(dpr,0,0,dpr,0,0);cg.clearRect(0,0,w,h);}
  if(!clearBg){bgg.fillStyle=BG;bgg.fillRect(0,0,w,h);}
  rows.forEach((row,r)=>{const isDiff=q.residual&&r===count,b=boxes[r],amp=isDiff?q.amplitude/(q.gain||1):q.amplitude;
   paper(bgg,b,q.span,amp,1);paper(hg,b,q.span,amp,4.2);
   bgg.textAlign='left';bgg.textBaseline='alphabetic';bgg.font='11px system-ui';bgg.fillStyle='#acc2cd';bgg.fillText('[mV]',10,r*rh+22);bgg.font='600 14px system-ui';bgg.fillStyle=row.color;bgg.fillText(row.label,left,r*rh+22);
   bgg.font='11px system-ui';bgg.fillStyle='#acc2cd';bgg.textAlign='right';bgg.textBaseline='middle';for(const tick of amplitudeTicks(q.amplitude,isDiff?q.gain||1:1))bgg.fillText(tick.label,left-10,b.t+tick.fraction*(b.b-b.t));});}
 g.clearRect(0,0,w,h);g.drawImage(bg,0,0,w,h);
 const pts=visiblePoints(t,q.span,q.data.fs,q.data.n,q.mode,q.inspect,q.soft).filter(p=>p.index>=q.data.offset&&p.index<q.data.offset+q.data.traces.input.length);
 // the sweep head and how many seconds behind it a screen x lies (afterglow, leading fade, A, C); none while inspecting
 const live=!q.inspect,count_=Math.round(q.span*q.data.fs),headX=q.mode==='sweep'?left+((Math.floor(t*q.data.fs)%count_)/count_)*pw:right;
 const ageOf=(x:number)=>q.mode==='sweep'?((((headX-x)/pw*q.span)%q.span)+q.span)%q.span:(right-x)/pw*q.span;
 const fxOn=live&&q.soft,level=fx.current.level;
 // A: one light column of brighter ECG paper across every row, just behind the head, cooling over BAND_S (replaces the sweep line)
 if(fxOn){const band=pw/q.span*BAND_S,top=boxes[0].t,bot=boxes[boxes.length-1].b;g.save();g.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){let x0=headX-band*(i+1)/5;const bw=band/5;if(x0+bw<left)x0+=pw;if(x0<left-1)continue;g.globalAlpha=(1-i/5)*.7;g.drawImage(hot,x0*dpr,top*dpr,bw*dpr,(bot-top)*dpr,x0,top,bw,bot-top);}
  g.restore();}
 rows.forEach((row,r)=>{const isDiff=q.residual&&r===count,b=boxes[r],top=b.t,bottom=b.b,ph=bottom-top;
 g.save();g.beginPath();g.rect(left,top,pw,ph);g.clip();
 const yOf=(a:Float32Array,index:number,residual:boolean)=>{const i=index-q.data.offset;return top+ph/2-(residual?(a[i]-q.data.traces.clean[i])*(q.gain||1):a[i])/q.amplitude*ph/2;};
 // one path per trace (breaks where the sweep wraps or the gap opens); afterglow + leading fade come from a gradient along x
 const pathOf=(a:Float32Array,residual=false)=>{const pa=new Path2D();let pen=false,prev:typeof pts[number]|null=null;for(const pt of pts){if(pt.alpha<=0||(prev&&pt.breakBefore)){pen=false;}if(pt.alpha>0){const x=left+pt.x*pw,y=yOf(a,pt.index,residual);if(pen)pa.lineTo(x,y);else{pa.moveTo(x,y);pen=true;}}prev=pt;}return pa;};
 const styleOf=(color:string,white:number,alphaK=1)=>live?ageGradient(g,left,right,rgb(color),ageOf,q.span,GAP_S,q.soft?white:0,alphaK):(()=>{g.globalAlpha=alphaK;return color;})();
 const trace=(a:Float32Array|undefined,color:string,width:number,opacity:number,dash=false,residual=false,white=0,glowK=0)=>{if(!a)return;const pa=pathOf(a,residual),st=styleOf(color,white,opacity);
  if(glowK>0&&level>0&&q.soft)glow(g,b,pa,st,level,glowK);
  g.globalAlpha=live?1:opacity;g.strokeStyle=st;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.setLineDash(dash?[5,4]:[]);g.stroke(pa);g.globalAlpha=1;g.setLineDash([]);};
 // C: the band between this row's trace and the Reference, lit just behind the head and gone within FRESH_S (output rows only)
 if(fxOn&&!isDiff&&r>0&&q.data.traces[row.id]){const a=q.data.traces[row.id]!,cl=q.data.traces.clean;const fresh=pts.filter(pt=>pt.alpha>0&&ageOf(left+pt.x*pw)<.5);
  if(fresh.length>1){const pa=new Path2D();let run:typeof fresh=[];const flush=()=>{if(run.length>1){run.forEach((pt,i)=>{const x=left+pt.x*pw,y=yOf(a,pt.index,false);if(i)pa.lineTo(x,y);else pa.moveTo(x,y);});for(let i=run.length-1;i>=0;i--)pa.lineTo(left+run[i].x*pw,yOf(cl,run[i].index,false));pa.closePath();}run=[];};
   fresh.forEach((pt,i)=>{if(i&&(pt.breakBefore||pt.index!==fresh[i-1].index+1))flush();run.push(pt);});flush();
   g.save();g.globalCompositeOperation='lighter';g.fillStyle=freshGradient(g,left,right,rgb(row.color),ageOf,r===1?.34:.22);g.fill(pa);g.restore();}}
 if(!isDiff)trace(q.data.traces.clean,'#c4c6c7',1.8,q.reference);   // thinner lines (user 2026-10-18 "선 두께도 좀 더 줄여"): Reference 2.4 → 1.8, traces 1.6 → 1.2
 trace(q.data.traces[row.id],row.color,1.2,1,false,!!isDiff,isDiff?0:r===1?1.15:.8,isDiff?0:r===1?.55:r===0?.35:0);   // glow ×0.55 on the output; the input too (user 2026-10-18 "입력에도 이 효과가 포함"), lower — its dense noise stacks far more glow per pixel (intro sweep.ts)
 if(r===1&&q.preview&&q.preview!==q.method&&q.preview!==q.comparison)trace(q.data.traces[q.preview],'#f6d18d',1.2,1,true);
 // head marker: a small hot point at the newest sample (brighter on the selected output)
 if(fxOn&&!isDiff&&q.data.traces[row.id]){const hi=Math.min(q.data.n-1,Math.floor(t*q.data.fs))-q.data.offset,a=q.data.traces[row.id]!;if(hi>=0&&hi<a.length){const x=headX,y=yOf(a,hi+q.data.offset,false),R=r===1?16:11;
  const rg=g.createRadialGradient(x,y,0,x,y,R);rg.addColorStop(0,`rgba(255,255,255,${r===1?.75:.4})`);rg.addColorStop(1,'rgba(255,255,255,0)');g.globalCompositeOperation='lighter';g.fillStyle=rg;g.fillRect(x-R,y-R,2*R,2*R);g.globalCompositeOperation='source-over';}}
 g.restore();const values=q.data.traces[row.id];const clipped=values?pts.filter(p=>Math.abs(isDiff?(values[p.index-q.data.offset]-q.data.traces.clean[p.index-q.data.offset])*(q.gain||1):values[p.index-q.data.offset])>q.amplitude).length:0;g.font='11px system-ui';g.textAlign='left';g.textBaseline='alphabetic';if(clipped){g.fillStyle='#ffbc79';g.fillText('표시 범위 밖 '+clipped+' samples · 범위 맞춤',left+10,top+18);}if(!q.data.traces[row.id]){g.fillStyle='#ffbc79';g.fillText('이 방법 출력 없음',left+10,top+30);}
 g.fillStyle='#adc3ce';g.font='12px system-ui';for(let k=0;k<=4;k++){const at=q.inspect?Math.max(0,t-q.span)+k*Math.min(t,q.span)/4:t-q.span+k*q.span/4;const label=q.mode==='sweep'&&!q.inspect?(k*q.span/4).toFixed(1)+'s 위치':at<0?'—':at.toFixed(1)+'s';g.fillText(label,left+k*pw/4-(k===4?55:0),bottom+20);}
 // reduced motion: the plain sweep line stays (no light column)
 if(q.mode==='sweep'&&live&&!fxOn){g.strokeStyle='#bfd8e0';g.lineWidth=1;g.beginPath();g.moveTo(headX,top);g.lineTo(headX,bottom);g.stroke();}
 });c.dataset.time=t.toFixed(3);c.dataset.mode=q.inspect?'inspect':q.mode;c.dataset.difference=String(!!q.residual);c.dataset.fx=String(fx.current.level);
 if(q.transport.playing){const f=fx.current,dt=t0-f.last;f.last=t0;if(dt>0&&dt<250){f.ema=f.frames?f.ema*.95+dt*.05:dt;f.frames++;}c.dataset.frameMs=f.ema.toFixed(1);
  if(FX_PIN===null&&f.frames>90&&f.level>0&&f.ema>26){f.level--;f.frames=0;}}
 }if(q.transport.playing)raf=requestAnimationFrame(draw);};draw();const resize=new ResizeObserver(()=>{cancelAnimationFrame(raf);signature='';draw();});resize.observe(c);return()=>{cancelAnimationFrame(raf);resize.disconnect();};
 },[p.data,p.transport.playing,p.mode,p.span,p.inspect,p.amplitude,p.reference,p.method,p.preview,p.comparison,p.large,p.soft,p.residual,p.gain]);
 return <canvas ref={canvas} className={'ecg-canvas '+(p.large?'large':'')+(p.comparison?' three':'')+(p.residual?' difference':'')} role="img" aria-label={`동일 시간·진폭의 입력 및 ${p.method} 출력과 회색 Reference${p.preview?' · 점선 '+p.preview:''}${p.residual?' · Output − Reference 차이':''}`}/>;
}
