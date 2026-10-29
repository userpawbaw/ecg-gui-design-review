// R1 story shell (HYB-R1-001, D-038). React owns only slow state (step, leaving); GSAP ticker drives
// per-frame values into the WebGL horizon and the Canvas 2D signal stage (D-028). No Lenis: the story
// advances by discrete wheel gestures (AP-03, AP-13).
import {useEffect,useMemo,useRef,useState} from 'react';
import gsap from 'gsap';
import methodData from '../methods.json';
import {decode} from '../engine';
import type {Bank} from '../data';
import {buildStory,type StoryData} from './storyData';
import {createHorizon} from './horizon';
import {createSignalStage,type SceneTraces,type StageView,type RowBox} from './signalStage';
import {COPY,NOISE_KO,dB} from './copy';
import './story.css';
gsap.ticker.lagSmoothing(0); // RCP-01: never stretch tweens after a slow frame

const methods=methodData as Record<string,{name:string,family:string,principle:string,limit:string}>;
export type LabTarget={axis:string,noise:string,snr:number,method:string};
type Props={bank:Bank,onEnterLab:(t:LabTarget)=>void,onDone:()=>void,initialStep?:number,onIntro?:()=>void};
const STEPS=6; // 0 attract · 1–3 conditions · 4 grid · 5 bars
const AMPLITUDE=1.2,STRIP_MV=.15; // AP-01: fixed physical scale for the component strip

function loadTraces(bank:Bank,sceneId:string,method:string):SceneTraces{
 const s=bank.scenes.find(x=>x.id===sceneId);if(!s)throw Error('scene missing '+sceneId);
 const d=(k:string)=>{const e=s.traces[k];if(!e)throw Error(`${sceneId}: no stored ${k}`);return decode(e,s.scale,bank.n);};
 return{id:s.id,axis:s.axis,record:s.record,cond:s.cond,snr:s.snr,fs:bank.fs,n:bank.n,input:d('input'),clean:d('clean'),out:d(method),method};
}
const box=(W:number,H:number,l:number,r:number,t:number,b:number,alpha=1)=>({left:l*W,right:r*W,top:t*H,bottom:b*H,alpha});

function rowsFor(step:number,W:number,H:number){
 const hidden=(b:ReturnType<typeof box>)=>({...b,alpha:0});
 if(step===0)return{attract:box(W,H,.05,.95,.31,.54),strip:hidden(box(W,H,.18,.80,.27,.325)),input:hidden(box(W,H,.05,.95,.31,.54)),output:hidden(box(W,H,.05,.95,.31,.54))};
 if(step<=3)return{attract:hidden(box(W,H,.05,.95,.31,.54)),strip:box(W,H,.18,.80,.27,.325),input:box(W,H,.18,.80,.375,.49),output:box(W,H,.18,.80,.55,.665)};
 return{attract:hidden(box(W,H,.05,.95,.31,.54)),strip:hidden(box(W,H,.18,.80,.20,.22)),input:box(W,H,.18,.80,.215,.30),output:box(W,H,.18,.80,.345,.43)};
}

export function StoryShell({bank,onEnterLab,onDone,initialStep=0,onIntro}:Props){
 const story:StoryData=useMemo(()=>buildStory(bank),[bank]);
 const params=new URLSearchParams(location.search);
 const [step,setStep]=useState(()=>Math.max(0,Math.min(STEPS-1,params.has('step')?Number(params.get('step'))||0:initialStep)));
 const [leaving,setLeaving]=useState(false);
 const reduced=useMemo(()=>params.get('reduced')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
 const root=useRef<HTMLDivElement>(null),horizonCanvas=useRef<HTMLCanvasElement>(null),signalCanvas=useRef<HTMLCanvasElement>(null);
 const stepRef=useRef(step);stepRef.current=step;
 const scenes=useMemo(()=>({attract:loadTraces(bank,story.attractSceneId,story.attractMethod),beats:story.beats.map(b=>loadTraces(bank,b.sceneId,b.winner.id))}),[bank,story]);
 const mainIds=story.beats[0].ranking.map(r=>r.id);
 const extraIds=story.experiment.scaled.map(b=>b.id).filter(id=>!mainIds.includes(id));      // M07, M10 — EXP-A only
 const barIds=story.experiment.scaled.map(b=>b.id);
 const view=useRef<StageView|null>(null),engine=useRef<{draw:(v:StageView)=>void,resize:()=>void}|null>(null),horizon=useRef<ReturnType<typeof createHorizon>|null>(null);
 const glow=useRef({rim:0,apexY:.64,apexGlow:1}),dirty=useRef(true),clock=useRef({t0:performance.now(),frozen:params.has('t')?Number(params.get('t')):null as number|null});

 // --- engine setup (once) ---
 useEffect(()=>{
  const W=innerWidth,H=innerHeight,r=rowsFor(step,W,H);
  view.current={mode:step===0?'attract':'story',prev:null,cur:step===0?scenes.attract:scenes.beats[Math.min(2,Math.max(0,step-1))],mix:1,attractTime:0,reduced,amplitude:AMPLITUDE,stripMv:STRIP_MV,rows:r,axisAlpha:1,labels:{strip:COPY.stripLabel,input:COPY.inputLabel,output:''},sweepApexY:.64*H};
  engine.current=createSignalStage(signalCanvas.current!);
  horizon.current=createHorizon(horizonCanvas.current!,{rim:0,apexY:step===0?.64:step<=3?.78:.86,apexGlow:1});
  glow.current={rim:0,apexY:step===0?.64:step<=3?.78:.86,apexGlow:step===0?1:.5};
  gsap.to(glow.current,{rim:step===0?.62:.45,duration:reduced?0:1.2,ease:'power2.out',onUpdate:()=>horizon.current?.set(glow.current)});
  const tick=()=>{const v=view.current!;if(v.mode==='attract'){const c=clock.current;v.attractTime=c.frozen??Math.max(0,(performance.now()-c.t0)/1000-1.4)%10;dirty.current=true;}
   if(dirty.current){dirty.current=false;v.sweepApexY=glow.current.apexY*innerHeight;engine.current!.draw(v);}};
  gsap.ticker.add(tick);
  const onResize=()=>{engine.current?.resize();horizon.current?.resize();layout(stepRef.current,true);dirty.current=true;};
  addEventListener('resize',onResize);
  (window as any).__story={go:(s:number)=>setStep(Math.max(0,Math.min(STEPS-1,s))),freeze:(t:number|null)=>{clock.current.frozen=t;},get step(){return stepRef.current;},enterLab:()=>enterLab(),slow:(k:number)=>{gsap.globalTimeline.timeScale(k);}};  // capture only: slow motion, same code path
  return()=>{gsap.ticker.remove(tick);removeEventListener('resize',onResize);horizon.current?.dispose();delete (window as any).__story;};
 },[]);

 // --- per-step layout: rows, glow, dots (all targets are a pure function of step → reversible) ---
 const dur=(s:number)=>reduced?0:s;
 function layout(s:number,instant=false){
  const v=view.current;if(!v)return;const W=innerWidth,H=innerHeight,r=rowsFor(s,W,H),d=(x:number)=>instant?0:dur(x);
  const prevScene=v.cur,nextScene=s===0?scenes.attract:scenes.beats[Math.min(2,Math.max(0,s-1))];
  if(s===0&&v.mode!=='attract'){v.mode='attract';v.prev=null;v.mix=1;v.cur=nextScene;clock.current.t0=performance.now()-1400;}
  else if(s>0&&v.mode==='attract'){v.mode='story';v.prev=null;v.cur=nextScene;v.mix=1;
   // attract row becomes the input row; output row appears under it (Beta M-B)
   const a=v.rows.attract;v.rows.input={...a,alpha:1};v.rows.output={...a,alpha:0};v.rows.strip={...r.strip,alpha:0};}
  else if(nextScene!==prevScene){v.prev=prevScene;v.cur=nextScene;v.mix=0;gsap.to(v,{mix:1,duration:d(.5),ease:'none',onUpdate:()=>{dirty.current=true;}});}
  const meth=methods[v.cur.method];v.labels.output=COPY.outputLabel(v.cur.method,meth?.name||'');
  for(const k of ['attract','strip','input','output'] as const)gsap.to(v.rows[k],{...r[k],duration:d(s===0?.6:.8),ease:'expo.inOut',onUpdate:()=>{dirty.current=true;}});
  gsap.to(glow.current,{rim:s===0?.62:s<=3?.45:.32,apexY:s===0?.64:s<=3?.78:.86,apexGlow:s===0?1:.5,duration:d(.8),ease:'power2.inOut',onUpdate:()=>horizon.current?.set(glow.current)});
  placeDots(s,W,H,instant);dirty.current=true;
 }
 function placeDots(s:number,W:number,H:number,instant:boolean){
  const el=root.current;if(!el)return;const d=(x:number)=>instant?0:dur(x);
  const beat=story.beats[Math.min(2,Math.max(0,s-1))],order=beat.ranking.map(r=>r.id);
  const colX=.855*W,colY=(i:number)=>.235*H+i*.043*H;
  const grid=story.grid,gx=(snr:number)=>(.34+grid.snrs.indexOf(snr)*(.44/(grid.snrs.length-1)))*W,gy=(c:string)=>(.52+grid.conds.indexOf(c)*.04)*H;
  const firstCell:Record<string,string>={};for(const c of grid.cells)if(!firstCell[c.winner])firstCell[c.winner]=c.sceneId;
  const barMax=16,bx0=.30*W,bx1=.76*W,by=(id:string)=>(.535+barIds.indexOf(id)*.028)*H,bx=(v:number)=>bx0+v/barMax*(bx1-bx0);
  const barVal=(id:string)=>story.experiment.scaled.find(b=>b.id===id)?.value;
  el.querySelectorAll<HTMLElement>('.st-dot[data-main]').forEach(dot=>{const id=dot.dataset.id!;let x=colX,y=colY(order.indexOf(id)),o=1;
   if(s===0){y=colY(mainIds.indexOf(id));o=0;}
   else if(s===4){const cell=grid.cells.find(c=>c.sceneId===firstCell[id]);if(cell){x=gx(cell.snr);y=gy(cell.cond);}else{y=colY(order.indexOf(id));o=.25;}}
   else if(s===5){const v=barVal(id);if(v!==undefined){x=bx(v);y=by(id);}else{x=.84*W;y=.535*H;o=.7;}}
   const rank=order.indexOf(id),winner=s>=1&&s<=3&&rank===0;
   dot.classList.toggle('winner',winner);dot.classList.toggle('in-grid',s===4);dot.classList.toggle('in-bars',s===5);dot.classList.toggle('exiled',s===5&&barVal(id)===undefined);
   gsap.to(dot,{x,y,opacity:o,duration:d(.7),ease:'expo.inOut',delay:instant?0:dur(Math.max(0,rank)*.02)});
  });
  el.querySelectorAll<HTMLElement>('.st-clone').forEach((dot,i)=>{const cell=grid.cells.find(c=>c.sceneId===dot.dataset.cell)!;const owner=cell.winner;
   const home={x:colX,y:colY(Math.max(0,order.indexOf(owner)))};let x=home.x,y=home.y,o=0;
   if(s===4){x=gx(cell.snr);y=gy(cell.cond);o=1;}else if(s===5){const v=barVal(owner);x=v!==undefined?bx(v):.84*W;y=v!==undefined?by(owner):.535*H;o=0;}
   gsap.to(dot,{x,y,opacity:o,duration:d(.8),ease:'expo.inOut',delay:instant?0:dur((i%49)*(.3/49))});
  });
  el.querySelectorAll<HTMLElement>('.st-dot[data-extra]').forEach(dot=>{const id=dot.dataset.id!,v=barVal(id)!;gsap.to(dot,{x:s===5?bx(v):W*1.02,y:by(id),opacity:s===5?1:0,duration:d(.7),ease:'expo.out',delay:instant?0:dur(.3)});});
  el.querySelectorAll<HTMLElement>('.st-bar').forEach(bar=>{const v=barVal(bar.dataset.id!)!;gsap.set(bar,{top:by(bar.dataset.id!)-2,left:bx0});gsap.to(bar,{width:s===5?bx(v)-bx0:0,opacity:s===5?1:0,duration:d(.8),ease:'expo.inOut',delay:instant?0:dur(.25)});});
 }
 useEffect(()=>{layout(step);},[step]);
 useEffect(()=>{placeDots(step,innerWidth,innerHeight,true);},[]);

 // --- input: one wheel gesture = one step; keyboard; idle return ---
 const lastInput=useRef(performance.now());
 function go(delta:number){if(leaving)return;const next=stepRef.current+delta;lastInput.current=performance.now();if(next>=STEPS){enterLab();return;}if(next<initialStep&&onIntro){onIntro();return;}if(next<0)return;setStep(next);}
 useEffect(()=>{
  let acc=0,locked=false,lastWheel=0,movedAt=0;
  const wheel=(e:WheelEvent)=>{e.preventDefault();const now=performance.now();lastWheel=now;lastInput.current=now;if(locked)return;acc+=e.deltaY;if(Math.abs(acc)>30){go(Math.sign(acc));acc=0;locked=true;movedAt=now;}};
  // a gesture ends after 350 ms without wheel events; at most one step per gesture and per 700 ms
  const release=setInterval(()=>{const now=performance.now();if(locked&&now-lastWheel>350&&now-movedAt>700){locked=false;acc=0;}},50);
  const key=(e:KeyboardEvent)=>{if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();go(1);}else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(-1);}};
  const idle=setInterval(()=>{if(stepRef.current>0&&!leaving&&performance.now()-lastInput.current>180000){if(onIntro)onIntro();else setStep(0);}},1000);
  addEventListener('wheel',wheel,{passive:false});addEventListener('keydown',key);
  return()=>{removeEventListener('wheel',wheel);removeEventListener('keydown',key);clearInterval(release);clearInterval(idle);};
 },[leaving]);

 // --- Lab handoff (Beta M-D + Alpha M-10): same scene, same 0–10 s window, rows land on the Lab plot rows ---
 function enterLab(){
  if(leaving)return;const s=stepRef.current,sc=s===0?scenes.attract:scenes.beats[Math.min(2,Math.max(0,s-1))];
  setLeaving(true);onEnterLab({axis:sc.axis,noise:sc.cond,snr:sc.snr,method:sc.method});
  const v=view.current!;if(v.mode==='attract'){v.mode='story';v.prev=null;v.mix=1;const a=v.rows.attract;v.rows.input={...a,alpha:1};v.rows.output={...a,alpha:0};v.rows.attract={...a,alpha:0};}
  gsap.to(root.current!.querySelectorAll('.st-chrome'),{opacity:0,duration:dur(.3)});
  gsap.to(v.rows.strip,{alpha:0,duration:dur(.4),onUpdate:()=>{dirty.current=true;}});
  gsap.to(glow.current,{rim:0,duration:dur(.8),ease:'power2.in',onUpdate:()=>horizon.current?.set(glow.current)});
  const started=performance.now();
  const wait=()=>{const c=document.querySelector<HTMLCanvasElement>('.large-dialog canvas.ecg-canvas');
   if(c&&c.dataset.mode==='inspect'&&c.getBoundingClientRect().width>0){land(c);return;}
   if(performance.now()-started>4000){gsap.to(root.current,{opacity:0,duration:dur(.3),onComplete:onDone});return;}requestAnimationFrame(wait);};
  requestAnimationFrame(wait);
 }
 function land(c:HTMLCanvasElement){
  const rc=c.getBoundingClientRect(),rh=rc.height/2,left=rc.left+72,right=rc.left+rc.width-18,v=view.current!;
  const target=(i:number):RowBox=>({left,right,top:rc.top+i*rh+36,bottom:rc.top+(i+1)*rh-30});
  const t=gsap.timeline({onUpdate:()=>{dirty.current=true;},onComplete:()=>{gsap.to(root.current,{opacity:0,duration:dur(.35),onComplete:onDone});}});
  t.to(v.rows.input,{...target(0),alpha:1,duration:dur(.9),ease:'expo.inOut'},0).to(v.rows.output,{...target(1),alpha:1,duration:dur(.9),ease:'expo.inOut'},0).to(v,{axisAlpha:0,duration:dur(.3)},0);
 }

 const header=step>=1&&step<=3?COPY.storyHeader(story.beats[0].record,story.beats[0].snr):step===4?COPY.gridNote:step===5?COPY.barsNote:'';
 const title=step===0?COPY.attractTitle:step<=3?COPY.storyTitle:step===4?COPY.gridTitle:COPY.barsTitle;
 const cta=step===0?COPY.attractCta:step<3?COPY.ctaNext:step<5?COPY.ctaWider:COPY.ctaLab;
 const beat=story.beats[Math.min(2,Math.max(0,step-1))];
 return <div ref={root} className={'story step-'+step+(reduced?' reduced':'')} data-step={step} data-leaving={leaving||undefined}>
  <canvas ref={horizonCanvas} className="st-horizon" aria-hidden="true"/>
  <canvas ref={signalCanvas} className="st-signal" role="img" aria-label={step===0?`저장 재생 · 합성 기록 S038 · 전원 간섭 ${scenes.attract.snr} dB · 입력과 ${scenes.attract.method} 출력, 회색 Reference`:`입력 − Reference, 입력, ${beat.winner.id} 출력과 Reference · ${NOISE_KO[beat.cond]} ${beat.snr} dB`}/>
  <div className="st-chrome st-text">
   {header&&<p className="st-header">{header}</p>}
   <h1 className={step===0?'st-title attract':'st-title'}>{title}</h1>
   {step===0&&<p className="st-sub">{COPY.attractSub(scenes.attract.snr,scenes.attract.method)}</p>}
   {step===3&&<p className="st-conclusion">{COPY.conclusion}</p>}
  </div>
  {step===0&&<div className="st-chrome st-chips" role="group" aria-label="잡음 종류">{story.beats.map((b,i)=><button key={b.cond} aria-pressed={i===0} onClick={()=>go(i+1)}>{i===0&&<span className="sonar" aria-hidden="true"><i/><i/></span>}{NOISE_KO[b.cond]}</button>)}</div>}
  <nav className={'st-chrome st-path'+(step>=1&&step<=3?' on':'')} aria-label="잡음 조건 진행"><ol>{story.beats.map((b,i)=><li key={b.cond} aria-current={step===i+1?'step':undefined} className={step>i+1?'visited':step===i+1?'current':''}><button onClick={()=>setStep(i+1)}><span className="station">{step===i+1&&<span className="sonar" aria-hidden="true"><i/><i/></span>}</span>{NOISE_KO[b.cond]}</button></li>)}</ol></nav>
  <div className="st-dots" aria-hidden={step===0}>
   {mainIds.map(id=>{const rank=beat.ranking.findIndex(r=>r.id===id);return <div key={id} className="st-dot" data-main data-id={id} title={methods[id]?.name}><i/><span className="code">{id}</span>{step>=1&&step<=3&&rank===0&&<span className="val">{COPY.winnerValue(dB(beat.winner.value))}</span>}{step===5&&story.experiment.scaled.find(b=>b.id===id)&&<span className="val">{dB(story.experiment.scaled.find(b=>b.id===id)!.value)}</span>}{step===5&&!story.experiment.scaled.find(b=>b.id===id)&&<span className="note">{COPY.notInExpA}</span>}<span className="card" role="tooltip"><b>{id} · {methods[id]?.name}</b>{methods[id]?.principle}<em>{methods[id]?.limit}</em></span></div>;})}
   {extraIds.map(id=><div key={id} className="st-dot extra" data-extra data-id={id}><i/><span className="code">{id}</span><span className="val">{dB(story.experiment.scaled.find(b=>b.id===id)!.value)}</span><span className="note">{COPY.notInBank}</span></div>)}
   {story.grid.cells.filter(c=>story.grid.cells.find(x=>x.winner===c.winner)!.sceneId!==c.sceneId).map(c=><div key={c.sceneId} className="st-clone" data-cell={c.sceneId}><i/><span className="code">{c.winner}</span></div>)}
   {barIds.map(id=><div key={id} className="st-bar" data-id={id}/>)}
  </div>
  {step>=1&&step<=3&&<div className="st-chrome st-oracle"><i/>{COPY.oracle}</div>}
  {step===4&&<div className="st-chrome st-grid-axes" aria-hidden="true">{story.grid.snrs.map((s,i)=><span key={s} className="col" style={{left:`${(.34+i*(.44/(story.grid.snrs.length-1)))*100}%`}}>{s} dB</span>)}{story.grid.conds.map((c,i)=><span key={c} className="row" style={{top:`${(.52+i*.04)*100}%`}}>{NOISE_KO[c]} · 기록 {story.grid.cells.find(x=>x.cond===c)?.record}</span>)}</div>}
  {step===4&&<div className="sr-only"><table><caption>{COPY.gridTitle}</caption><tbody>{story.grid.conds.map(c=><tr key={c}><th>{NOISE_KO[c]}</th>{story.grid.snrs.map(s=><td key={s}>{story.grid.cells.find(x=>x.cond===c&&x.snr===s)?.winner}</td>)}</tr>)}</tbody></table></div>}
  {step===5&&<div className="sr-only"><table><caption>{COPY.barsTitle}</caption><tbody>{story.experiment.scaled.map(b=><tr key={b.id}><th>{b.id}</th><td>{dB(b.value)} dB</td></tr>)}</tbody></table></div>}
  {step>=1&&<p className="st-chrome st-legend"><span className="ref">━ {COPY.legendRef(beat.axis)}</span><span className="in">━ 입력</span><span className="out">━ 출력</span></p>}
  <button className="st-chrome st-cta" onClick={()=>step===0?go(1):enterLab()}>{step===0?<span className="wheel" aria-hidden="true"/>:null}{step===0?cta:COPY.ctaLab}</button>
  {step>=1&&step<5&&<p className="st-chrome st-hint">{cta}</p>}
  {step>=1&&<button className="st-chrome st-skip" onClick={enterLab}>{COPY.skipLab}</button>}
  <p className="st-chrome st-notice">{COPY.notice}</p>
 </div>;
}
