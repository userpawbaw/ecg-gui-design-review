import {useEffect,useRef} from 'react';
import {Transport,visiblePoints,type Mode} from './engine';
import {amplitudeTicks} from './plot-scale';
import type {Loaded} from './data';
import methodData from './methods.json';
const NAME:Record<string,string>=Object.fromEntries(Object.entries(methodData as Record<string,{name:string}>).map(([k,v])=>[k,v.name]));
import {ageGradient,freshGradient,paper,createGlow,rgb,BAND_S,ERASE_S,type Box} from './labFx';
import {StripRow,AgeRamps,composeRow,headSprite} from './waveStrip';
import {WAVE} from './waveMode';
import {createFocus,setPointer,pick,cycle,step,emphasis,roughness,tierOf,containment,layerDepths,layerTier,hold,COVER_MARGIN_PX,zonePeaks,zoneCenter,qrsMask,zoneBands,zoneAt,holdZones,zoneStep,alignTo,createZoneHold,zoneHit,type Held} from './live/overlayFocus';
import {HOVER_NEAR,drawZoneBar} from './live/livePlotFx';
// D-161: ?wave=all 이면 재생 중 파형을 링 스트립으로(새 표본만 긋고 효과는 램프·스프라이트). 그 밖(정지 · 구간 고정 · 효과 끔)은 아래 원래 경로.
const STRIP=WAVE==='all';
export const labStats={frames:0,ms:0};(globalThis as unknown as {__labStats:typeof labStats}).__labStats=labStats;
export const SHOWN_COLORS=['#67e7c3','#97c2ff','#c9a7ff','#ffa8c5','#e8d27a','#8fe3ff'];   // D-165 표시 기법 행 색(추가 순서)
type Props={data:Loaded;transport:Transport;mode:Mode;span:number;inspect:boolean;amplitude:number;reference:number;method:string;preview:string|null;shown:string[];large?:boolean;soft:boolean;residual?:boolean;gain?:number;
 /** D-185 실험실 겹치기: 입력 · 기법을 한 칸에(동일 축 · 동일 진폭). pins = 범례 단추로 고정한 계열, chip = 범례 단추 위 계열, onTiers = 계열별 거칠기 단계 알림 */
 overlay?:boolean;pins?:string[];chip?:string|null;onTiers?:(t:Record<string,number>)=>void;
 /** D-192 질환 탭: 입력 행 이름 · 정상 기준 행(traces.normal, 입력 바로 아래, Reference 없음) · 그린 기하를 밖으로(설명 덧층이 시각 → 화면 좌표를 계산) */
 inputLabel?:string;normalRow?:{label:string,color:string};geomOut?:{current:PlotGeom|null};
 /** D-194 구간 확대: 있으면 그리기마다 표시 구간 · 오른쪽 끝 시각 · 격자 위상(초)을 이 값으로(매 프레임 값 — React 상태 아님). redrawOut = 같은 프레임에 다시 그리기 */
 viewRef?:{current:PlotView|null};redrawOut?:{current:(()=>void)|null}};
export type PlotGeom={w:number,h:number,left:number,right:number,pw:number,t:number,span:number,fs:number,amplitude:number,mode:Mode,inspect:boolean,rows:{id:string,t:number,b:number}[]};
// D-183 단계 → 기본 배율(겹치기): 깨끗 1 · 중간 .62 · 거침 .4, 번짐 · 흰빛은 깨끗한 것만. 입력은 실시간 입력과 같게 .55 · 번짐 없음
const TIER_BASE=[{a:1,g:1,w:1},{a:.62,g:0,w:0},{a:.4,g:0,w:0}],IN_BASE={a:.55,g:0,w:0};
const BG='#0a1a21',GAP_S=.12,OV_DBG=new URLSearchParams(location.search).has('ovdbg');
const ZONE_ALL=new URLSearchParams(location.search).get('ovzone')==='all';   // D-187 QRS 포함(비교용)
// D-073 laptop budget: glow levels 2 (three blur levels) → 1 (two) → 0 (none). Level 2 is the default again at the thinner lines (user 2026-10-18 "이 두께에선 &labfx=2가 기본값"). ?labfx= pins it; otherwise it steps down when the
// frame interval while playing stays above 26 ms (< ~38 fps) — the script part of a draw is ~2.5 ms, the cost is in rasterising
// the glow, so the interval is what shows it — and never back up, so the picture does not pulse between levels.
// D-177 (user 2026-11-12, several methods looked darker): no automatic step-down by default — level 2 stays; ?labfx=auto restores the step-down.
const FX_PIN=(()=>{const v=new URLSearchParams(location.search).get('labfx');return v==='auto'?null:v===null?2:Math.max(0,Math.min(2,Number(v)||0));})();
/** 시간축 보기(D-194). z = 확대 · 축소 중: 처음(a) · 끝(b) 보기와 진행(e, 0 → 1) — 이 동안은 두 장면을 한 번씩만 그려 두고 늘여 섞는다. */
const mkLayer=()=>{const c=document.createElement('canvas');return {c,g:c.getContext('2d')!};};
const ZSNAP=new URLSearchParams(location.search).get('zoomsnap')!=='0';   // ?zoomsnap=0 : 확대 중에도 매 프레임 전부 다시 그림(이전 방식, 비교용)
const fit=(L:{c:HTMLCanvasElement},w:number,h:number)=>{if(L.c.width!==w)L.c.width=w;if(L.c.height!==h)L.c.height=h;};
export type PlotView={span:number,right:number,phase:number,z?:{a:{span:number,right:number,phase:number},b:{span:number,right:number,phase:number},e:number}};
export function Plot(p:Props){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(p);latest.current=p;
 const fx=useRef({level:FX_PIN??2,ema:0,frames:0,last:0});
 const focus=useRef(createFocus()),geomRef=useRef<{left:number,right:number,pw:number,top:number,ph:number,pts:{x:number,index:number,alpha:number,breakBefore?:boolean}[],ys:Map<string,(i:number)=>number>}|null>(null),drawRef=useRef<()=>void>(()=>{});
 const tierRef=useRef(new Map<string,Held>()),depthRef=useRef(new Map<string,Held>()),tierAt=useRef(-1e9),zoneRef=useRef({hold:createZoneHold(),at:-1e9,y:NaN});
 useEffect(()=>{const c=canvas.current!;const g=c.getContext('2d');if(!g)return;let raf=0,signature='',bgSig='';
 const bg=document.createElement('canvas'),bgg=bg.getContext('2d')!,hot=document.createElement('canvas'),hg=hot.getContext('2d')!,glow=createGlow();
 const strips:StripRow[]=[],ramps=new AgeRamps(),layer=(()=>{const lc=document.createElement('canvas');return{c:lc,g:lc.getContext('2d')!};})();
 // 2026-11-25 질환 탭 축 확대가 끊김(사용자 영상: 초당 약 15장): 확대 중에는 구간이 매 프레임 바뀌어 행마다 파형 층(잔광 · 번짐 · 사라짐)을
 // 처음부터 다시 긋고 합성했다(CPU 4배 감속에서 그리기 47–67 ms, 그중 합성 31–44 ms). 확대는 시간축 가로 배율만 바뀌므로
 // 확대가 시작될 때 처음 · 끝 장면의 파형만 한 번씩 그려 두고(snap), 그 사이 프레임은 격자 · 눈금만 새로 그린 뒤(bgOnly)
 // 두 장면을 시간 좌표에 맞춰 늘이고 섞는다. 처음 · 끝 프레임은 이전과 같은 그림이다.
 const signature0=()=>{const q=latest.current;return [q.amplitude,q.shown.join(','),q.reference,q.method,q.preview,q.data.scene.id,q.data.offset,q.soft,q.residual,q.gain,fx.current.level,q.normalRow?.label].join('|');};
 const zs={key:'',bKey:'',A:mkLayer(),B:mkLayer(),T:mkLayer()};let geo:{left:number,right:number,pw:number,boxes:Box[],dpr:number}|null=null;
 const zoomFrame=(v:PlotView)=>{const z=v.z!,k=[z.a.span,z.a.right,z.a.phase,z.b.span,z.b.right,z.b.phase].map(x=>x.toFixed(4)).join()+'|'+c.width+'x'+c.height+'|'+signature0();
  const snap=(vv:PlotView,S:{c:HTMLCanvasElement,g:CanvasRenderingContext2D})=>{drawCore({view:vv,mode:'snap'});fit(S,c.width,c.height);S.g.setTransform(1,0,0,1,0,0);S.g.globalCompositeOperation='copy';S.g.drawImage(c,0,0);S.g.globalCompositeOperation='source-over';};
  // 두 장면을 한 프레임에 그리면 시작에 한 번 멈칫한다 — 첫 프레임은 처음 장면만(끝 장면 비중 e≈0), 끝 장면은 다음 프레임에
  let bReady=zs.bKey===k;if(zs.key!==k){snap(z.a,zs.A);zs.key=k;}else if(!bReady){snap(z.b,zs.B);zs.bKey=k;bReady=true;}
  drawCore({view:v,mode:'bgOnly'});const G=geo;if(!G)return;const d=G.dpr,T=zs.T,e=Math.max(0,Math.min(1,z.e));fit(T,c.width,c.height);
  T.g.setTransform(1,0,0,1,0,0);T.g.globalCompositeOperation='source-over';T.g.globalAlpha=1;T.g.clearRect(0,0,T.c.width,T.c.height);T.g.globalCompositeOperation='lighter';T.g.imageSmoothingEnabled=true;
  for(const [S,vv,a] of (bReady?[[zs.A,z.a,1-e],[zs.B,z.b,e]]:[[zs.A,z.a,1]]) as [typeof zs.A,PlotView,number][]){if(a<.002)continue;const sx=vv.span/v.span,X0=G.left+((vv.right-vv.span)-(v.right-v.span))/v.span*G.pw;
   T.g.globalAlpha=a;T.g.drawImage(S.c,G.left*d,0,G.pw*d,S.c.height,X0*d,0,G.pw*sx*d,S.c.height);}
  // 끝 장면이 덮지 못하는 가장자리(좁은 구간 밖)는 처음 장면만 있다 — 거기서는 처음 장면을 온전히(섞느라 흐려지지 않게)
  if(bReady&&e>.002){const xb0=G.left+((z.b.right-z.b.span)-(v.right-v.span))/v.span*G.pw,xb1=xb0+G.pw*z.b.span/v.span,sx=z.a.span/v.span,X0=G.left+((z.a.right-z.a.span)-(v.right-v.span))/v.span*G.pw;
   T.g.save();T.g.beginPath();if(xb0>G.left)T.g.rect(G.left*d,0,(xb0-G.left)*d,T.c.height);if(xb1<G.right)T.g.rect(xb1*d,0,(G.right-xb1)*d,T.c.height);T.g.clip();
   T.g.globalAlpha=e;T.g.drawImage(zs.A.c,G.left*d,0,G.pw*d,zs.A.c.height,X0*d,0,G.pw*sx*d,zs.A.c.height);T.g.restore();}
  T.g.globalAlpha=1;T.g.globalCompositeOperation='source-over';
  g.save();g.setTransform(1,0,0,1,0,0);g.beginPath();for(const b of G.boxes)g.rect(G.left*d,b.t*d,G.pw*d,(b.b-b.t)*d);g.clip();g.drawImage(T.c,0,0);g.restore();};
 const draw=()=>{const v=latest.current.viewRef?.current;if(ZSNAP&&v?.z&&!latest.current.overlay)zoomFrame(v);else drawCore();};
 const drawCore=(o?:{view:PlotView|null,mode:'snap'|'bgOnly'})=>{const t0=performance.now(),q0=latest.current,vw=o?o.view:q0.viewRef?.current??null,q=vw?{...q0,span:vw.span}:q0,t=vw?vw.right:q0.transport.time;const rect=c.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);
 // D-185 겹치기 강조: 지난 그림의 기하로 마우스 판정 → 강조 상태 한 걸음(고정 · 범례 단추 포함)
 const OV=!!q.overlay&&!q.residual,F=focus.current,ovNames=['input',...q.shown];let ovMoving=false,curZone:string|null=null;const Z=zoneRef.current;
 if(OV){F.pinned=new Set((q.pins??[]).filter(n=>ovNames.includes(n)));F.chip=q.chip??null;let hit:string|string[]|null=null;const G=geomRef.current;
  const fr=new Map(ovNames.map((n,i)=>[n,(n==='input'?0:5-(depthRef.current.get(n)?.v??0))+i/1000]));   // 같은 층이면 나중에 그려지는(위) 것이 앞
  const candAt=(px:number,py:number)=>{const cands:{name:string,dist:number}[]=[];if(!G||px<G.left||px>G.right)return cands;
   for(const [n,y] of G.ys){let best=Infinity;for(let k=1;k<G.pts.length;k++){const a=G.pts[k-1],b=G.pts[k];if(a.alpha<=0||b.alpha<=0||b.breakBefore)continue;const x0=G.left+a.x*G.pw,x1=G.left+b.x*G.pw;if(Math.max(x0,x1)<px-6||Math.min(x0,x1)>px+6)continue;
    const y0=y(a.index),y1=y(b.index),vx=x1-x0,vy=y1-y0,L=vx*vx+vy*vy,u=L>0?Math.max(0,Math.min(1,((px-x0)*vx+(py-y0)*vy)/L)):0;best=Math.min(best,Math.hypot(px-(x0+u*vx),py-(y0+u*vy)));}
    if(best<Infinity)cands.push({name:n,dist:best});}return cands;};
  // D-187 높이 영역: 0.25 s마다 지난 그림의 화면 y로 단계를 재고(구성 바뀜은 1 s 유지), 마우스 높이로 강조 대상을 정한다
  const zNames=Z.hold.cur?Z.hold.cur.up.flatMap(b=>b.names).sort().join():'',hovering=!!G&&F.px!==null&&F.py!==null&&F.px>=G.left&&F.px<=G.right&&F.py>=G.top-8&&F.py<=G.top+G.ph+8;
  if(!HOVER_NEAR&&G&&t0-Z.at>=250&&(!hovering||zNames!==ovNames.filter(n=>G.ys.has(n)).sort().join())){   // D-187 마우스가 그래프 위면 단계 고정
  Z.at=t0;const idx=G.pts.filter(p=>p.alpha>0).map(p=>p.index),names=ovNames.filter(n=>G.ys.has(n));
   if(idx.length>50&&names.length){const px=new Map(names.map(n=>{const y=G.ys.get(n)!;return [n,idx.map(y)] as [string,number[]];})),outs=names.filter(n=>n!=='input');
    const ov=(outs.length?outs:names).map(n=>px.get(n)!),cy=zoneCenter(ov);if(Number.isFinite(cy)){if(px.has('input')&&outs.length)px.set('input',alignTo(px.get('input')!,cy));Z.y=cy;zoneStep(Z.hold,zonePeaks(px,cy,undefined,ZONE_ALL?undefined:qrsMask(ov,cy,Math.round(.08*q.data.fs))),t0);}}}
  const zoneOf=(x:number,y:number)=>!HOVER_NEAR&&G&&Z.hold.cur&&Number.isFinite(Z.y)&&x>=G.left&&x<=G.right&&y>=G.top-8&&y<=G.top+G.ph+8?zoneAt(Z.hold.cur,Z.y-y):null;
  if(F.click){cycle(F,candAt(F.click.x,F.click.y),fr,F.click.x,F.click.y);F.clickZone=zoneOf(F.click.x,F.click.y)?.key??null;F.click=undefined;}
  if(F.px!==null&&F.py!==null){const cs=candAt(F.px,F.py),zn=zoneOf(F.px,F.py);curZone=zn?.key??null;hit=HOVER_NEAR?pick(cs,F.target,fr):zoneHit(F,zn);if(OV_DBG)c.dataset.cands=cs.map(x=>x.name+':'+x.dist.toFixed(1)).join(' ');}
  ovMoving=step(F,t0,ovNames,hit);c.style.cursor=F.target&&F.px!==null?'pointer':'';c.dataset.focus=F.target??'';c.dataset.hov=F.hov.join(',');if(OV_DBG)c.dataset.layers=ovNames.map(n=>`${n}:${fr.get(n)}/${tierRef.current.get(n)?.v??0}`).join(' ');}
 const sig=[t,q.mode,q.span,q.inspect,q.amplitude,q.reference,q.method,q.preview,q.shown.join(','),q.data.scene.id,q.data.offset,q.soft,q.residual,q.gain,rect.width,rect.height,dpr,fx.current.level,OV,OV?ovNames.map(n=>(F.e.get(n)??0).toFixed(3)).join(',')+F.f.toFixed(3)+'|'+curZone+(F.px!==null)+Z.hold.sig+Math.round(Z.y):''].join('|');
 // a collapsed canvas (0 × 0 while the layout changes) is skipped: drawImage of a 0-size static layer throws
 if((o||sig!==signature)&&rect.width>=1&&rect.height>=1){signature=o?'':sig;const W=Math.round(rect.width*dpr),H=Math.round(rect.height*dpr);if(c.width!==W||c.height!==H){c.width=W;c.height=H;}g.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;
 const rows=[{id:'input',label:q.inputLabel??'입력',color:'#ffbc79'},...(q.normalRow&&q.data.traces.normal?[{id:'normal',...q.normalRow}]:[]),...q.shown.map((id,k)=>({id,label:(NAME[id]??id)+(id===q.method?' · 선택 기법':''),color:SHOWN_COLORS[k%SHOWN_COLORS.length]}))];   // D-165: 표시 목록 순서대로 아래에 쌓인다
 const count=rows.length;const rh=OV?h:(h-(q.residual?144:0))/count;if(q.residual)rows.push({id:q.method,label:`차이 신호(출력 − Reference) · 표시 ×${q.gain||1}`,color:'#c0ced7'});g.font='11px system-ui';const labelWidth=Math.max(...amplitudeTicks(q.amplitude,q.residual?q.gain||1:1).concat(amplitudeTicks(q.amplitude)).map(t=>g.measureText(t.label).width));const left=Math.max(72,labelWidth+26),right=w-18,pw=right-left;
 const boxes:Box[]=rows.map((_,r)=>{const isDiff=q.residual&&r===count,top=OV?36:r*rh+36;return{l:left,r:right,t:top,b:OV?h-30:isDiff?top+72:(r+1)*rh-30};});
 // static layer (background, ECG paper, labels, amplitude ticks) + a brighter paper copy for A — redrawn only when the layout changes
 const clearBg=document.body.classList.contains('lab-dark')&&!c.closest('.large-dialog');   // D-074: the panel shows the archive faintly through
 const bs=[w,h,dpr,q.amplitude,q.span,vw?.phase??0,q.residual,q.gain,q.method,q.shown.join(','),clearBg,OV,q.inputLabel,q.normalRow?.label].join('|');
 if(bs!==bgSig){bgSig=bs;for(const [cv,cg] of [[bg,bgg],[hot,hg]] as const){if(cv.width!==W)cv.width=W;if(cv.height!==H)cv.height=H;cg.setTransform(dpr,0,0,dpr,0,0);cg.clearRect(0,0,w,h);}   // 같은 크기면 버퍼를 다시 잡지 않음(축 확대 중 매 프레임)
  if(!clearBg){bgg.fillStyle=BG;bgg.fillRect(0,0,w,h);}
  rows.forEach((row,r)=>{if(OV&&r>0)return;const isDiff=q.residual&&r===count,b=boxes[r],amp=isDiff?q.amplitude/(q.gain||1):q.amplitude;
   paper(bgg,b,q.span,amp,1,vw?.phase??0,!!vw);paper(hg,b,q.span,amp,4.2,vw?.phase??0,!!vw);
   bgg.textAlign='left';bgg.textBaseline='alphabetic';bgg.font='11px system-ui';bgg.fillStyle='#acc2cd';bgg.fillText('[mV]',10,r*rh+22);bgg.font='600 14px system-ui';bgg.fillStyle=OV?'#d7e4e8':row.color;bgg.fillText(OV?'중첩: 입력 · 표시 기법 · Reference(동일 축 · 동일 진폭)':row.label,left,r*rh+22);
   bgg.font='11px system-ui';bgg.fillStyle='#acc2cd';bgg.textAlign='right';bgg.textBaseline='middle';for(const tick of amplitudeTicks(q.amplitude,isDiff?q.gain||1:1))bgg.fillText(tick.label,left-10,b.t+tick.fraction*(b.b-b.t));});}
 geo={left,right,pw,boxes,dpr};g.clearRect(0,0,w,h);if(o?.mode!=='snap')g.drawImage(bg,0,0,w,h);
 const pts=visiblePoints(t,q.span,q.data.fs,q.data.n,q.mode,q.inspect,q.soft).filter(p=>p.index>=q.data.offset&&p.index<q.data.offset+q.data.traces.input.length);
 // the sweep head and how many seconds behind it a screen x lies (afterglow, leading fade, A, C); none while inspecting
 const live=!q.inspect,count_=Math.round(q.span*q.data.fs),headX=q.mode==='sweep'?left+((Math.floor(t*q.data.fs)%count_)/count_)*pw:right;
 const ageOf=(x:number)=>q.mode==='sweep'?((((headX-x)/pw*q.span)%q.span)+q.span)%q.span:(right-x)/pw*q.span;
 const fxOn=live&&q.soft,level=fx.current.level;
 // A: one light column of brighter ECG paper across every row, just behind the head, cooling over BAND_S (replaces the sweep line)
 if(fxOn&&o?.mode!=='snap'){const band=pw/q.span*BAND_S,top=boxes[0].t,bot=boxes[boxes.length-1].b;g.save();g.globalCompositeOperation='lighter';
  for(let i=0;i<5;i++){let x0=headX-band*(i+1)/5;const bw=band/5;if(x0+bw<left)x0+=pw;if(x0<left-1)continue;g.globalAlpha=(1-i/5)*.7;g.drawImage(hot,x0*dpr,top*dpr,bw*dpr,(bot-top)*dpr,x0,top,bw,bot-top);}
  g.restore();}
 zz:{if(o?.mode==='bgOnly'){g.fillStyle='#adc3ce';g.font='12px system-ui';g.textAlign='left';g.textBaseline='alphabetic';
  boxes.forEach((b,r)=>{if(OV&&r>0)return;for(let k=0;k<=4;k++){const at=q.inspect?Math.max(0,t-q.span)+k*Math.min(t,q.span)/4:t-q.span+k*q.span/4;const label=q.mode==='sweep'&&!q.inspect?(k*q.span/4).toFixed(1)+'s 위치':at<0?'—':at.toFixed(q.span<2.5?2:1)+'s';g.fillText(label,left+k*pw/4-(k===4?55:0),b.b+20);}});break zz;}
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
  sr.update(H,off,[...(isDiff||OV||row.id==='normal'?[]:[{y:yv(cl,false),color:'#c4c6c7',width:1.8,alpha:q.reference,lit:false,glow:false}]),{y:yv(a,!!isDiff),color:row.color,width:1.2,alpha:1,lit:!isDiff,glow:!isDiff}]);
  ramps.build(q.span,GAP_S,ERASE_S);sr.clearAhead(H,Math.floor(GAP_S*q.data.fs)-1);
  const rightX=right-(t*q.data.fs+1-H)/cnt*pw;
  composeRow(g,sr,ramps,layer,{sweep:q.mode==='sweep',head:H,headX:q.mode==='sweep'?headX:rightX,rightX,r:right,white:(isDiff?0:OV?.6:lit?1.15:.8)*em.whiteK,glow:(isDiff?0:OV?.35:lit?.55:.35)*em.glowK/* 2026-11-10 사용자: 가운데 기법 행도 입력과 같은 빛(이전 0) */,level,liveK:1,span:q.span,gapS:GAP_S,tailS:GAP_S+ERASE_S,alphaK:em.alphaK});
 }else{
 if(!isDiff&&!OV&&row.id!=='normal')trace(q.data.traces.clean,'#c4c6c7',1.8,q.reference);   // thinner lines (user 2026-10-18 "선 두께도 좀 더 줄여"): Reference 2.4 → 1.8, traces 1.6 → 1.2
 trace(q.data.traces[row.id],row.color,1.2,Math.min(1,em.alphaK),false,!!isDiff,(isDiff?0:OV?.6:lit?1.15:.8)*em.whiteK,(isDiff?0:OV?.35:lit?.55:.35)*em.glowK);}   // 겹치기: 여러 줄의 흰빛 · 번짐이 더해져 색이 하얗게 바래지 않게 실시간 겹치기 값(.6 · .35)   // glow ×0.55 on the output; the input too (user 2026-10-18 "입력에도 이 효과가 포함"), lower — its dense noise stacks far more glow per pixel (intro sweep.ts)
 if(foc&&q.preview&&!q.shown.includes(q.preview))trace(q.data.traces[q.preview],'#f6d18d',1.2,1,true);
 // head marker: a small hot point at the newest sample (brighter on the selected output)
 if(fxOn&&!isDiff&&q.data.traces[row.id]){const hi=Math.min(q.data.n-1,Math.floor(t*q.data.fs))-q.data.offset,a=q.data.traces[row.id]!;if(hi>=0&&hi<a.length){const x=headX,y=yOf(a,hi+q.data.offset,false),R=lit?16:11;
  const hk=OV?Math.min(1,em.alphaK*Math.min(1.25,em.whiteK)):1;if(hk<.02){}else if(useStrip){g.globalCompositeOperation='lighter';g.globalAlpha=hk;g.drawImage(headSprite(R,lit?.75:.4,dpr),x-R,y-R,2*R,2*R);g.globalAlpha=1;g.globalCompositeOperation='source-over';}else{const rg=g.createRadialGradient(x,y,0,x,y,R);rg.addColorStop(0,`rgba(255,255,255,${(lit?.75:.4)*(OV?Math.min(1,em.alphaK*Math.min(1.25,em.whiteK)):1)})`);rg.addColorStop(1,'rgba(255,255,255,0)');g.globalCompositeOperation='lighter';g.fillStyle=rg;g.fillRect(x-R,y-R,2*R,2*R);g.globalCompositeOperation='source-over';}}}
 g.restore();const values=q.data.traces[row.id];const clipped=values?pts.filter(p=>Math.abs(isDiff?(values[p.index-q.data.offset]-q.data.traces.clean[p.index-q.data.offset])*(q.gain||1):values[p.index-q.data.offset])>q.amplitude).length:0;g.font='11px system-ui';g.textAlign='left';g.textBaseline='alphabetic';if(OV&&!firstOv){}else if(clipped&&!OV){g.fillStyle='#ffbc79';g.fillText('표시 범위 초과 '+clipped+' 샘플',left+10,top+18);}if(!q.data.traces[row.id]){g.fillStyle='#ffbc79';g.fillText('출력 없음',left+10,top+30);}
 if(!OV||firstOv){g.fillStyle='#adc3ce';g.font='12px system-ui';for(let k=0;k<=4;k++){const at=q.inspect?Math.max(0,t-q.span)+k*Math.min(t,q.span)/4:t-q.span+k*q.span/4;const label=q.mode==='sweep'&&!q.inspect?(k*q.span/4).toFixed(1)+'s 위치':at<0?'—':at.toFixed(q.span<2.5?2:1)+'s';g.fillText(label,left+k*pw/4-(k===4?55:0),bottom+20);}}
 // reduced motion: the plain sweep line stays (no light column)
 if(q.mode==='sweep'&&live&&!fxOn&&(!OV||firstOv)){g.strokeStyle='#bfd8e0';g.lineWidth=1;g.beginPath();g.moveTo(headX,top);g.lineTo(headX,bottom);g.stroke();}
 });if(q.geomOut)q.geomOut.current={w,h,left,right,pw,t,span:q.span,fs:q.data.fs,amplitude:q.amplitude,mode:q.mode,inspect:q.inspect,rows:rows.map((rw,i)=>({id:rw.id,t:boxes[i].t,b:boxes[i].b}))};if(OV)geomRef.current={left,right,pw,top:boxes[0].t,ph:boxes[0].b-boxes[0].t,pts,ys:ysOv};else geomRef.current=null;
 if(OV&&!HOVER_NEAR&&F.px!==null&&Z.hold.cur&&Number.isFinite(Z.y)){const col=new Map(rows.map(r=>[r.id,r.color]));drawZoneBar(c,{l:left,r:right,t:boxes[0].t,b:boxes[0].b,pw,ph:boxes[0].b-boxes[0].t},Z.hold.cur,Z.y,curZone,n=>col.get(n)??'#ccc');}
 }
 if(OV_DBG)c.dataset.zones=Z.hold.cur?JSON.stringify({c:Math.round(Z.y),...Z.hold.cur}):'';if(q.transport.playing){labStats.frames++;labStats.ms+=performance.now()-t0;}c.dataset.time=t.toFixed(3);c.dataset.mode=q.inspect?'inspect':q.mode;c.dataset.difference=String(!!q.residual);c.dataset.fx=String(fx.current.level);
 if(q.transport.playing){const f=fx.current,dt=t0-f.last;f.last=t0;if(dt>0&&dt<250){f.ema=f.frames?f.ema*.95+dt*.05:dt;f.frames++;}c.dataset.frameMs=f.ema.toFixed(1);
  if(FX_PIN===null&&f.frames>90&&f.level>0&&f.ema>26){f.level--;f.frames=0;}}
 }if(o?.mode!=='snap'&&(q.transport.playing||ovMoving||(OV&&F.px!==null&&!!F.target)))raf=requestAnimationFrame(draw);};drawRef.current=()=>{cancelAnimationFrame(raf);draw();};if(p.redrawOut)p.redrawOut.current=drawRef.current;draw();const resize=new ResizeObserver(()=>{cancelAnimationFrame(raf);signature='';draw();});resize.observe(c);return()=>{cancelAnimationFrame(raf);resize.disconnect();};
 },[p.data,p.transport.playing,p.inputLabel,p.normalRow?.label,p.mode,p.span,p.inspect,p.amplitude,p.reference,p.method,p.preview,p.shown.join(','),p.large,p.soft,p.residual,p.gain,p.overlay]);
 useEffect(()=>{drawRef.current();},[p.pins?.join(','),p.chip]);
 const nRows=p.shown.length+(p.normalRow&&p.data.traces.normal?1:0),ov=!!p.overlay&&!p.residual,onMove=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!ov)return;const r=e.currentTarget.getBoundingClientRect();setPointer(focus.current,e.clientX-r.left,e.clientY-r.top);drawRef.current();},onLeave=()=>{setPointer(focus.current,null,null);drawRef.current();},onClick=(e:React.MouseEvent<HTMLCanvasElement>)=>{if(!ov)return;const r=e.currentTarget.getBoundingClientRect();focus.current.click={x:e.clientX-r.left,y:e.clientY-r.top};drawRef.current();};
 return <canvas ref={canvas} onPointerMove={onMove} onPointerLeave={onLeave} onClick={onClick} className={'ecg-canvas '+(ov?'overlay ':'')+(p.large?'large':'')+(!ov&&nRows>1?' three':'')+(!ov&&nRows>2?' more':'')+(p.residual?' difference':'')} style={!ov&&nRows>2?{['--xr' as string]:nRows-2} as React.CSSProperties:undefined} role="img" aria-label={`동일 시간축 · 진폭의 입력, ${p.shown.join(' · ')} 출력과 회색 Reference${p.preview?' · 점선 '+p.preview:''}${p.residual?' · 차이 신호':''}`}/>;
}
