import {useEffect,useRef} from 'react';
import {Transport,visiblePoints,type Mode} from './engine';
import {amplitudeTicks} from './plot-scale';
import type {Loaded} from './data';
import methodData from './methods.json';
const NAME:Record<string,string>=Object.fromEntries(Object.entries(methodData as Record<string,{name:string}>).map(([k,v])=>[k,v.name]));
import {ageGradient,freshGradient,paper,createGlow,rgb,BAND_S,ERASE_S,type Box} from './labFx';
import {StripRow,AgeRamps,composeRow,headSprite} from './waveStrip';
import {WAVE} from './waveMode';
import {createFocus,setPointer,pick,cycle,step,emphasis,roughness,tierOf,containment,layerDepths,layerTier,hold,COVER_MARGIN_PX,type Held} from './live/overlayFocus';
// D-161: ?wave=all 이면 재생 중 파형을 링 스트립으로(새 표본만 긋고 효과는 램프·스프라이트). 그 밖(정지 · 구간 고정 · 효과 끔)은 아래 원래 경로.
const STRIP=WAVE==='all';
export const labStats={frames:0,ms:0};(globalThis as unknown as {__labStats:typeof labStats}).__labStats=labStats;
export const SHOWN_COLORS=['#67e7c3','#97c2ff','#c9a7ff','#ffa8c5','#e8d27a','#8fe3ff'];   // D-165 표시 기법 행 색(추가 순서)
type Props={data:Loaded;transport:Transport;mode:Mode;span:number;inspect:boolean;amplitude:number;reference:number;method:string;preview:string|null;shown:string[];large?:boolean;soft:boolean;residual?:boolean;gain?:number;
 /** D-185 실험실 겹치기: 입력 · 기법을 한 칸에(동일 축 · 동일 진폭). pins = 범례 단추로 고정한 계열, chip = 범례 단추 위 계열, onTiers = 계열별 거칠기 단계 알림 */
 overlay?:boolean;pins?:string[];chip?:string|null;onTiers?:(t:Record<string,number>)=>void};
// D-183 단계 → 기본 배율(겹치기): 깨끗 1 · 중간 .62 · 거침 .4, 번짐 · 흰빛은 깨끗한 것만. 입력은 실시간 입력과 같게 .55 · 번짐 없음
const TIER_BASE=[{a:1,g:1,w:1},{a:.62,g:0,w:0},{a:.4,g:0,w:0}],IN_BASE={a:.55,g:0,w:0};
const BG='#0a1a21',GAP_S=.12,OV_DBG=new URLSearchParams(location.search).has('ovdbg');
// D-073 laptop budget: glow levels 2 (three blur levels) → 1 (two) → 0 (none). Level 2 is the default again at the thinner lines (user 2026-10-18 "이 두께에선 &labfx=2가 기본값"). ?labfx= pins it; otherwise it steps down when the
// frame interval while playing stays above 26 ms (< ~38 fps) — the script part of a draw is ~2.5 ms, the cost is in rasterising
// the glow, so the interval is what shows it — and never back up, so the picture does not pulse between levels.
// D-177 (user 2026-11-12, several methods looked darker): no automatic step-down by default — level 2 stays; ?labfx=auto restores the step-down.
const FX_PIN=(()=>{const v=new URLSearchParams(location.search).get('labfx');return v==='auto'?null:v===null?2:Math.max(0,Math.min(2,Number(v)||0));})();
export function Plot(p:Props){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(p);latest.current=p;
 const fx=useRef({level:FX_PIN??2,ema:0,frames:0,last:0});
 const focus=useRef(createFocus()),geomRef=useRef<{left:number,right:number,pw:number,top:number,ph:number,pts:{x:number,index:number,alpha:number,breakBefore?:boolean}[],ys:Map<string,(i:number)=>number>}|null>(null),drawRef=useRef<()=>void>(()=>{});
 const tierRef=useRef(new Map<string,Held>()),depthRef=useRef(new Map<string,Held>()),tierAt=useRef(-1e9);
 useEffect(()=>{const c=canvas.current!;const g=c.getContext('2d');if(!g)return;let raf=0,signature='',bgSig='';
 const bg=document.createElement('canvas'),bgg=bg.getContext('2d')!,hot=document.createElement('canvas'),hg=hot.getContext('2d')!,glow=createGlow();
 const strips:StripRow[]=[],ramps=new AgeRamps(),layer=(()=>{const lc=document.createElement('canvas');return{c:lc,g:lc.getContext('2d')!};})();
 const draw=()=>{const t0=performance.now(),q=latest.current,t=q.transport.time;const rect=c.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
 // D-185 겹치기 강조: 지난 그림의 기하로 마우스 판정 → 강조 상태 한 걸음(고정 · 범례 단추 포함)
 const OV=!!q.overlay&&!q.residual,F=focus.current,ovNames=['input',...q.shown];let ovMoving=false;
 if(OV){F.pinned=new Set((q.pins??[]).filter(n=>ovNames.includes(n)));F.chip=q.chip??null;let hit:string|null=null;const G=geomRef.current;
  const fr=new Map(ovNames.map(n=>[n,n==='input'?0:5-(depthRef.current.get(n)?.v??0)]));
  const candAt=(px:number,py:number)=>{const cands:{name:string,dist:number}[]=[];if(!G||px<G.left||px>G.right)return cands;
   for(const [n,y] of G.ys){let best=Infinity;for(let k=1;k<G.pts.length;k++){const a=G.pts[k-1],b=G.pts[k];if(a.alpha<=0||b.alpha<=0||b.breakBefore)continue;const x0=G.left+a.x*G.pw,x1=G.left+b.x*G.pw;if(Math.max(x0,x1)<px-6||Math.min(x0,x1)>px+6)continue;
    const y0=y(a.index),y1=y(b.index),vx=x1-x0,vy=y1-y0,L=vx*vx+vy*vy,u=L>0?Math.max(0,Math.min(1,((px-x0)*vx+(py-y0)*vy)/L)):0;best=Math.min(best,Math.hypot(px-(x0+u*vx),py-(y0+u*vy)));}
    if(best<Infinity)cands.push({name:n,dist:best});}return cands;};
  if(F.click){cycle(F,candAt(F.click.x,F.click.y),fr,F.click.x,F.click.y);F.click=undefined;}
  if(F.px!==null&&F.py!==null){const cs=candAt(F.px,F.py);hit=pick(cs,F.target,fr);if(OV_DBG)c.dataset.cands=cs.map(x=>x.name+':'+x.dist.toFixed(1)).join(' ');}
  ovMoving=step(F,t0,ovNames,hit);c.style.cursor=F.target&&F.px!==null?'pointer':'';c.dataset.focus=F.target??'';if(OV_DBG)c.dataset.layers=ovNames.map(n=>`${n}:${fr.get(n)}/${tierRef.current.get(n)?.v??0}`).join(' ');}
 const sig=[t,q.mode,q.span,q.inspect,q.amplitude,q.reference,q.method,q.preview,q.shown.join(','),q.data.scene.id,q.data.offset,q.soft,q.residual,q.gain,rect.width,rect.height,dpr,fx.current.level,OV,OV?ovNames.map(n=>(F.e.get(n)??0).toFixed(3)).join(',')+F.f.toFixed(3):''].join('|');
 // a collapsed canvas (0 × 0 while the layout changes) is skipped: drawImage of a 0-size static layer throws
 if(sig!==signature&&rect.width>=1&&rect.height>=1){signature=sig;const W=Math.round(rect.width*dpr),H=Math.round(rect.height*dpr);if(c.width!==W||c.height!==H){c.width=W;c.height=H;}g.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;
 const rows=[{id:'input',label:'입력',color:'#ffbc79'},...q.shown.map((id,k)=>({id,label:(NAME[id]??id)+(id===q.method?' · 선택 기법':''),color:SHOWN_COLORS[k%SHOWN_COLORS.length]}))];   // D-165: 표시 목록 순서대로 아래에 쌓인다
 const count=rows.length;const rh=OV?h:(h-(q.residual?144:0))/count;if(q.residual)rows.push({id:q.method,label:`차이 신호(출력 − Reference) · 표시 ×${q.gain||1}`,color:'#c0ced7'});g.font='11px system-ui';const labelWidth=Math.max(...amplitudeTicks(q.amplitude,q.residual?q.gain||1:1).concat(amplitudeTicks(q.amplitude)).map(t=>g.measureText(t.label).width));const left=Math.max(72,labelWidth+26),right=w-18,pw=right-left;
 const boxes:Box[]=rows.map((_,r)=>{const isDiff=q.residual&&r===count,top=OV?36:r*rh+36;return{l:left,r:right,t:top,b:OV?h-30:isDiff?top+72:(r+1)*rh-30};});
 // static layer (background, ECG paper, labels, amplitude ticks) + a brighter paper copy for A — redrawn only when the layout changes
 const clearBg=document.body.classList.contains('lab-dark')&&!c.closest('.large-dialog');   // D-074: the panel shows the archive faintly through
 const bs=[w,h,dpr,q.amplitude,q.span,q.residual,q.gain,q.method,q.shown.join(','),clearBg,OV].join('|');
 if(bs!==bgSig){bgSig=bs;for(const [cv,cg] of [[bg,bgg],[hot,hg]] as const){cv.width=W;cv.height=H;cg.setTransform(dpr,0,0,dpr,0,0);cg.clearRect(0,0,w,h);}
  if(!clearBg){bgg.fillStyle=BG;bgg.fillRect(0,0,w,h);}
  rows.forEach((row,r)=>{if(OV&&r>0)return;const isDiff=q.residual&&r===count,b=boxes[r],amp=isDiff?q.amplitude/(q.gain||1):q.amplitude;
   paper(bgg,b,q.span,amp,1);paper(hg,b,q.span,amp,4.2);
   bgg.textAlign='left';bgg.textBaseline='alphabetic';bgg.font='11px system-ui';bgg.fillStyle='#acc2cd';bgg.fillText('[mV]',10,r*rh+22);bgg.font='600 14px system-ui';bgg.fillStyle=OV?'#d7e4e8':row.color;bgg.fillText(OV?'중첩: 입력 · 표시 기법 · Reference(동일 축 · 동일 진폭)':row.label,left,r*rh+22);
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
 // D-185 겹치기: 거칠기 단계(입력 대비, D-183과 같은 기준 · 1 s 유지) → 그리는 순서(입력 → 거친 것 → 깨끗한 것, 강조가 절반을 넘으면 맨 위)와 기본 배율
 const off0=q.data.offset,lo0=pts.length?Math.max(2,pts[0].index-off0):0,hi0=pts.length?pts[pts.length-1].index-off0:0;
 // D-186: 앞 순서 = 포함 비율 깊이(실시간과 같은 규칙 · 0.25 s마다 · 1 s 유지), 흐림 단계 = 거칠기 단계와 깊이 중 큰 쪽
 if(OV&&hi0>lo0+10&&t0-tierAt.current>=250){tierAt.current=t0;const L=q.data.traces.input.length,rIn=roughness(q.data.traces.input,L,lo0,hi0);
  const ids=q.shown.filter(id=>q.data.traces[id]),a0=Math.max(lo0,hi0-500),ph0=boxes[0].b-boxes[0].t,m=COVER_MARGIN_PX*2*q.amplitude/Math.max(1,ph0);
  const dep=ids.length>1?layerDepths(ids,containment(ids.map(id=>q.data.traces[id]!.subarray(a0,hi0+1)),m)):new Map(ids.map(id=>[id,0]));
  let want=ids.map(id=>layerTier(rIn>0?tierOf(roughness(q.data.traces[id]!,L,lo0,hi0)/rIn):0,hold(depthRef.current,id,dep.get(id)??0,t0)));
  if(!want.includes(0))want=want.map(()=>0);   // 모두 거칠면 같은 무게
  ids.forEach((id,i)=>hold(tierRef.current,id,want[i],t0));
  q.onTiers?.(Object.fromEntries(q.shown.map(id=>[id,tierRef.current.get(id)?.v??0])));}
 const baseOf=(id:string)=>id==='input'?IN_BASE:TIER_BASE[tierRef.current.get(id)?.v??0];
 const emOf=(id:string)=>OV?emphasis(F,id,baseOf(id)):{alphaK:1,glowK:1,whiteK:1};
 const rankOf=(r:number)=>{const id=rows[r].id;return (id==='input'?0:5-(depthRef.current.get(id)?.v??0))+((F.e.get(id)??0)>.5?100:0);};
 const order=rows.map((_,r)=>r);if(OV)order.sort((a,b)=>rankOf(a)-rankOf(b));
 const ysOv=new Map<string,(i:number)=>number>();
 // Reference: 겹치기에서는 한 번만, 강조와 무관하게 맨 아래(기준선)
 if(OV&&rows.length){const b=boxes[0],top=b.t,ph=b.b-b.t,cl=q.data.traces.clean;g.save();g.beginPath();g.rect(left,top,pw,ph);g.clip();
  if(STRIP&&fxOn){const sr=strips[99]??=new StripRow(),H=Math.min(q.data.n-1,Math.floor(t*q.data.fs)),cnt=count_,yv=(k:number)=>top+ph/2-cl[k-off0]/q.amplitude*ph/2;
   sr.configure([w,h,dpr,cnt,q.mode,q.amplitude,q.reference,q.data.scene.id,off0,'ref',top,ph,left,pw].join('|'),{l:left,t:top,w:pw,h:ph,nCols:cnt,dx:pw/cnt,dpr},level);
   sr.update(H,off0,[{y:yv,color:'#c4c6c7',width:1.8,alpha:q.reference,lit:false,glow:false}]);ramps.build(q.span,GAP_S,ERASE_S);sr.clearAhead(H,Math.floor(GAP_S*q.data.fs)-1);
   const rightX=right-(t*q.data.fs+1-H)/cnt*pw;composeRow(g,sr,ramps,layer,{sweep:q.mode==='sweep',head:H,headX:q.mode==='sweep'?headX:rightX,rightX,r:right,white:0,glow:0,level,liveK:1,span:q.span,gapS:GAP_S,tailS:GAP_S+ERASE_S});}
  else{const pa=new Path2D();let pen=false,prev:typeof pts[number]|null=null;for(const pt of pts){if(pt.alpha<=0||(prev&&pt.breakBefore))pen=false;if(pt.alpha>0){const x=left+pt.x*pw,y=top+ph/2-cl[pt.index-off0]/q.amplitude*ph/2;if(pen)pa.lineTo(x,y);else{pa.moveTo(x,y);pen=true;}}prev=pt;}
   g.strokeStyle=live?ageGradient(g,left,right,rgb('#c4c6c7'),ageOf,q.span,GAP_S,0,q.reference):'#c4c6c7';g.globalAlpha=live?1:q.reference;g.lineWidth=1.8;g.lineJoin='round';g.stroke(pa);g.globalAlpha=1;}
  g.restore();}
 order.forEach((r,oi)=>{const row=rows[r];const isDiff=q.residual&&r===count,b=boxes[r],top=b.t,bottom=b.b,ph=bottom-top;const em=emOf(row.id),firstOv=OV&&oi===0;const foc=!isDiff&&r>0&&row.id===q.method;const lit=!isDiff&&r>0;   // 2026-11-11 사용자: 2개 이상 고르면 앞서 고른 기법이 어두움 → 모든 기법 행을 마지막 기법과 같은 빛으로
 g.save();g.beginPath();g.rect(left,top,pw,ph);g.clip();
 const yOf=(a:Float32Array,index:number,residual:boolean)=>{const i=index-q.data.offset;return top+ph/2-(residual?(a[i]-q.data.traces.clean[i])*(q.gain||1):a[i])/q.amplitude*ph/2;};
 if(OV&&q.data.traces[row.id]){const a=q.data.traces[row.id]!;ysOv.set(row.id,(index:number)=>yOf(a,index,false));}
 // one path per trace (breaks where the sweep wraps or the gap opens); afterglow + leading fade come from a gradient along x
 const pathOf=(a:Float32Array,residual=false)=>{const pa=new Path2D();let pen=false,prev:typeof pts[number]|null=null;for(const pt of pts){if(pt.alpha<=0||(prev&&pt.breakBefore)){pen=false;}if(pt.alpha>0){const x=left+pt.x*pw,y=yOf(a,pt.index,residual);if(pen)pa.lineTo(x,y);else{pa.moveTo(x,y);pen=true;}}prev=pt;}return pa;};
 const styleOf=(color:string,white:number,alphaK=1)=>live?ageGradient(g,left,right,rgb(color),ageOf,q.span,GAP_S,q.soft?white:0,alphaK):(()=>{g.globalAlpha=alphaK;return color;})();
 const trace=(a:Float32Array|undefined,color:string,width:number,opacity:number,dash=false,residual=false,white=0,glowK=0)=>{if(!a)return;const pa=pathOf(a,residual),st=styleOf(color,white,opacity);
  if(glowK>0&&level>0&&q.soft)glow(g,b,pa,st,level,glowK);
  g.globalAlpha=live?1:opacity;g.strokeStyle=st;g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.setLineDash(dash?[5,4]:[]);g.stroke(pa);g.globalAlpha=1;g.setLineDash([]);};
 // C: the band between this row's trace and the Reference, lit just behind the head and gone within FRESH_S (output rows only)
 if(!OV&&fxOn&&!isDiff&&r>0&&q.data.traces[row.id]){const a=q.data.traces[row.id]!,cl=q.data.traces.clean;const fresh=pts.filter(pt=>pt.alpha>0&&ageOf(left+pt.x*pw)<.5);
  if(fresh.length>1){const pa=new Path2D();let run:typeof fresh=[];const flush=()=>{if(run.length>1){run.forEach((pt,i)=>{const x=left+pt.x*pw,y=yOf(a,pt.index,false);if(i)pa.lineTo(x,y);else pa.moveTo(x,y);});for(let i=run.length-1;i>=0;i--)pa.lineTo(left+run[i].x*pw,yOf(cl,run[i].index,false));pa.closePath();}run=[];};
   fresh.forEach((pt,i)=>{if(i&&(pt.breakBefore||pt.index!==fresh[i-1].index+1))flush();run.push(pt);});flush();
   g.save();g.globalCompositeOperation='lighter';g.fillStyle=freshGradient(g,left,right,rgb(row.color),ageOf,lit?.34:.22);g.fill(pa);g.restore();}}
 const useStrip=STRIP&&fxOn&&!!q.data.traces[row.id];
 if(useStrip){const sr=strips[r]??=new StripRow(),off=q.data.offset,cl=q.data.traces.clean,a=q.data.traces[row.id]!,H=Math.min(q.data.n-1,Math.floor(t*q.data.fs)),cnt=count_;
  const yv=(arr:Float32Array,res:boolean)=>(k:number)=>{const i=k-off;return top+ph/2-(res?(arr[i]-cl[i])*(q.gain||1):arr[i])/q.amplitude*ph/2;};
  sr.configure([w,h,dpr,cnt,q.mode,q.amplitude,q.reference,q.gain,q.method,q.shown.join(','),q.data.scene.id,off,row.id,isDiff,top,ph,left,pw].join('|'),{l:left,t:top,w:pw,h:ph,nCols:cnt,dx:pw/cnt,dpr},level);
  sr.update(H,off,[...(isDiff||OV?[]:[{y:yv(cl,false),color:'#c4c6c7',width:1.8,alpha:q.reference,lit:false,glow:false}]),{y:yv(a,!!isDiff),color:row.color,width:1.2,alpha:1,lit:!isDiff,glow:!isDiff}]);
  ramps.build(q.span,GAP_S,ERASE_S);sr.clearAhead(H,Math.floor(GAP_S*q.data.fs)-1);
  const rightX=right-(t*q.data.fs+1-H)/cnt*pw;
  composeRow(g,sr,ramps,layer,{sweep:q.mode==='sweep',head:H,headX:q.mode==='sweep'?headX:rightX,rightX,r:right,white:(isDiff?0:OV?.6:lit?1.15:.8)*em.whiteK,glow:(isDiff?0:OV?.35:lit?.55:.35)*em.glowK/* 2026-11-10 사용자: 가운데 기법 행도 입력과 같은 빛(이전 0) */,level,liveK:1,span:q.span,gapS:GAP_S,tailS:GAP_S+ERASE_S,alphaK:em.alphaK});
 }else{
 if(!isDiff&&!OV)trace(q.data.traces.clean,'#c4c6c7',1.8,q.reference);   // thinner lines (user 2026-10-18 "선 두께도 좀 더 줄여"): Reference 2.4 → 1.8, traces 1.6 → 1.2
 trace(q.data.traces[row.id],row.color,1.2,Math.min(1,em.alphaK),false,!!isDiff,(isDiff?0:OV?.6:lit?1.15:.8)*em.whiteK,(isDiff?0:OV?.35:lit?.55:.35)*em.glowK);}   // 겹치기: 여러 줄의 흰빛 · 번짐이 더해져 색이 하얗게 바래지 않게 실시간 겹치기 값(.6 · .35)   // glow ×0.55 on the output; the input too (user 2026-10-18 "입력에도 이 효과가 포함"), lower — its dense noise stacks far more glow per pixel (intro sweep.ts)
 if(foc&&q.preview&&!q.shown.includes(q.preview))trace(q.data.traces[q.preview],'#f6d18d',1.2,1,true);
 // head marker: a small hot point at the newest sample (brighter on the selected output)
 if(fxOn&&!isDiff&&q.data.traces[row.id]){const hi=Math.min(q.data.n-1,Math.floor(t*q.data.fs))-q.data.offset,a=q.data.traces[row.id]!;if(hi>=0&&hi<a.length){const x=headX,y=yOf(a,hi+q.data.offset,false),R=lit?16:11;
  const hk=OV?Math.min(1,em.alphaK*Math.min(1.25,em.whiteK)):1;if(hk<.02){}else if(useStrip){g.globalCompositeOperation='lighter';g.globalAlpha=hk;g.drawImage(headSprite(R,lit?.75:.4,dpr),x-R,y-R,2*R,2*R);g.globalAlpha=1;g.globalCompositeOperation='source-over';}else{const rg=g.createRadialGradient(x,y,0,x,y,R);rg.addColorStop(0,`rgba(255,255,255,${(lit?.75:.4)*(OV?Math.min(1,em.alphaK*Math.min(1.25,em.whiteK)):1)})`);rg.addColorStop(1,'rgba(255,255,255,0)');g.globalCompositeOperation='lighter';g.fillStyle=rg;g.fillRect(x-R,y-R,2*R,2*R);g.globalCompositeOperation='source-over';}}}
 g.restore();const values=q.data.traces[row.id];const clipped=values?pts.filter(p=>Math.abs(isDiff?(values[p.index-q.data.offset]-q.data.traces.clean[p.index-q.data.offset])*(q.gain||1):values[p.index-q.data.offset])>q.amplitude).length:0;g.font='11px system-ui';g.textAlign='left';g.textBaseline='alphabetic';if(OV&&!firstOv){}else if(clipped&&!OV){g.fillStyle='#ffbc79';g.fillText('표시 범위 초과 '+clipped+' 샘플',left+10,top+18);}if(!q.data.traces[row.id]){g.fillStyle='#ffbc79';g.fillText('출력 없음',left+10,top+30);}
 if(!OV||firstOv){g.fillStyle='#adc3ce';g.font='12px system-ui';for(let k=0;k<=4;k++){const at=q.inspect?Math.max(0,t-q.span)+k*Math.min(t,q.span)/4:t-q.span+k*q.span/4;const label=q.mode==='sweep'&&!q.inspect?(k*q.span/4).toFixed(1)+'s 위치':at<0?'—':at.toFixed(1)+'s';g.fillText(label,left+k*pw/4-(k===4?55:0),bottom+20);}}
 // reduced motion: the plain sweep line stays (no light column)
 if(q.mode==='sweep'&&live&&!fxOn&&(!OV||firstOv)){g.strokeStyle='#bfd8e0';g.lineWidth=1;g.beginPath();g.moveTo(headX,top);g.lineTo(headX,bottom);g.stroke();}
 });if(OV)geomRef.current={left,right,pw,top:boxes[0].t,ph:boxes[0].b-boxes[0].t,pts,ys:ysOv};else geomRef.current=null;if(q.transport.playing){labStats.frames++;labStats.ms+=performance.now()-t0;}c.dataset.time=t.toFixed(3);c.dataset.mode=q.inspect?'inspect':q.mode;c.dataset.difference=String(!!q.residual);c.dataset.fx=String(fx.current.level);
 if(q.transport.playing){const f=fx.current,dt=t0-f.last;f.last=t0;if(dt>0&&dt<250){f.ema=f.frames?f.ema*.95+dt*.05:dt;f.frames++;}c.dataset.frameMs=f.ema.toFixed(1);
  if(FX_PIN===null&&f.frames>90&&f.level>0&&f.ema>26){f.level--;f.frames=0;}}
 }if(q.transport.playing||ovMoving||(OV&&F.px!==null&&!!F.target))raf=requestAnimationFrame(draw);};drawRef.current=()=>{cancelAnimationFrame(raf);draw();};draw();const resize=new ResizeObserver(()=>{cancelAnimationFrame(raf);signature='';draw();});resize.observe(c);return()=>{cancelAnimationFrame(raf);resize.disconnect();};
 },[p.data,p.transport.playing,p.mode,p.span,p.inspect,p.amplitude,p.reference,p.method,p.preview,p.shown.join(','),p.large,p.soft,p.residual,p.gain,p.overlay]);
 useEffect(()=>{drawRef.current();},[p.pins?.join(','),p.chip]);
 const ov=!!p.overlay&&!p.residual,onMove=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!ov)return;const r=e.currentTarget.getBoundingClientRect();setPointer(focus.current,e.clientX-r.left,e.clientY-r.top);drawRef.current();},onLeave=()=>{setPointer(focus.current,null,null);drawRef.current();},onClick=(e:React.MouseEvent<HTMLCanvasElement>)=>{if(!ov)return;const r=e.currentTarget.getBoundingClientRect();focus.current.click={x:e.clientX-r.left,y:e.clientY-r.top};drawRef.current();};
 return <canvas ref={canvas} onPointerMove={onMove} onPointerLeave={onLeave} onClick={onClick} className={'ecg-canvas '+(ov?'overlay ':'')+(p.large?'large':'')+(!ov&&p.shown.length>1?' three':'')+(!ov&&p.shown.length>2?' more':'')+(p.residual?' difference':'')} style={!ov&&p.shown.length>2?{['--xr' as string]:p.shown.length-2} as React.CSSProperties:undefined} role="img" aria-label={`동일 시간축 · 진폭의 입력, ${p.shown.join(' · ')} 출력과 회색 Reference${p.preview?' · 점선 '+p.preview:''}${p.residual?' · 차이 신호':''}`}/>;
}
