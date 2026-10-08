// Story noise scenes (brief 3). Entry: ?story=noise&cond=pli|bw|ma (one scene; ?t= freezes the clock), or NoiseSequence
// in the main flow: intro → power line → baseline wander → muscle artifact → Lab, on one stage so the camera carries on
// from scene to scene (user 2026-10-08: "장면 사이도 카메라로 이어지게 해줘").
import {useEffect,useMemo,useRef,useState} from 'react';
import {decode} from '../../engine';
import type {Bank} from '../../data';
import {detectR} from '../intro/beats';
import {rankScene} from '../storyData';
import {createNoiseStage,type Cond,type NoiseData} from './noiseStage';
import './noise.css';

const SCENE:Record<Cond,{id:string,ko:string,en:string,synthetic:boolean}>={
 pli:{id:'d0-pli--5',ko:'전원 간섭',en:'POWER-LINE INTERFERENCE',synthetic:false},
 bw:{id:'d0-bw_synth--5',ko:'기저선 변동',en:'BASELINE WANDER',synthetic:true},
 ma:{id:'d0-ma_synth--5',ko:'근육 잡음',en:'MUSCLE ARTIFACT',synthetic:true}};
type LabTarget={axis:string,noise:string,snr:number,method:string};

function sceneData(bank:Bank,cond:Cond){
 const s=bank.scenes.find(x=>x.id===SCENE[cond].id);if(!s)throw Error('noise scene missing: '+SCENE[cond].id);
 const winner=rankScene(s).ranking[0].id,d=(k:string)=>decode(s.traces[k],s.scale,bank.n);
 const clean=d('clean'),input=d('input'),output=d(winner);
 const data:NoiseData={cond,fs:bank.fs,loop:{start:0,end:bank.n,beats:detectR(clean,bank.fs)},input,output,clean};
 return{s,winner,data};
}

export function NoiseShell({bank,conds,onLab}:{bank:Bank,conds?:Cond[],onLab?:(t:LabTarget)=>void}){
 const q=new URLSearchParams(location.search);
 const order=useMemo<Cond[]>(()=>conds??[(['pli','bw','ma'].includes(q.get('cond')||'')?q.get('cond'):'pli') as Cond],[]);
 const scenes=useMemo(()=>order.map(c=>sceneData(bank,c)),[bank,order]);
 const [i,setI]=useState(0),iRef=useRef(0);
 const gl=useRef<HTMLCanvasElement>(null),grid=useRef<HTMLCanvasElement>(null),sweep=useRef<HTMLCanvasElement>(null),overlay=useRef<HTMLCanvasElement>(null),strip=useRef<HTMLDivElement>(null);
 const stageRef=useRef<Awaited<ReturnType<typeof createNoiseStage>>|null>(null);
 // next scene on the same stage (camera continues), or Lab after the last one
 const advance=useRef(()=>{});
 advance.current=()=>{
  const k=iRef.current,st=stageRef.current;if(!st)return;
  if(k+1<order.length){iRef.current=k+1;setI(k+1);st.setScene(scenes[k+1].data,{last:k+2===order.length});}
  else if(onLab){const sc=scenes[k];onLab({axis:sc.s.axis,noise:sc.s.cond,snr:sc.s.snr,method:sc.winner});}
 };
 useEffect(()=>{
  let dead=false;
  const frozen=q.has('t')?Number(q.get('t')):null,reduced=q.get('reduced')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;
  createNoiseStage({gl:gl.current!,grid:grid.current!,sweep:sweep.current!,overlay:overlay.current!,cells:[...strip.current!.querySelectorAll<HTMLElement>('i')]},
   scenes[0].data,{frozenT:frozen,reduced,last:order.length===1,onEnd:()=>advance.current()})
   .then(s=>{if(dead){s.dispose();return;}stageRef.current=s;(window as unknown as {__noise:unknown}).__noise={set:s.set,renderOnce:s.renderOnce,next:()=>advance.current(),get cond(){return s.cond;},ready:true};});
  return()=>{dead=true;stageRef.current?.dispose();stageRef.current=null;};
 },[]);
 // skip: one wheel gesture / → / space / Enter ends the current scene (same path as its natural end)
 useEffect(()=>{if(!onLab)return;let lastSkip=0;const go=()=>{const n=performance.now();if(n-lastSkip<900)return;lastSkip=n;advance.current();};
  const k=(e:KeyboardEvent)=>{if(['ArrowRight','ArrowDown','PageDown',' ','Enter'].includes(e.key)){e.preventDefault();go();}};
  let acc=0;const w=(e:WheelEvent)=>{acc+=e.deltaY;if(acc>120){acc=0;go();}};
  addEventListener('keydown',k);addEventListener('wheel',w,{passive:true});return()=>{removeEventListener('keydown',k);removeEventListener('wheel',w);};},[onLab]);
 const cur=scenes[i],info=SCENE[order[i]];
 return <div className="ns-root">
  <canvas ref={gl} className="ns-gl"/><canvas ref={overlay} className="ns-overlay"/><canvas ref={grid} className="ns-grid"/><canvas ref={sweep} className="ns-sweep"/>
  <div ref={strip} className="ns-strip" aria-label="박동마다 한 겹 처리"><i/><i/><i/><i/><span>박동마다 한 겹 · {cur.winner}</span></div>
  <div className="ns-title" key={order[i]}><b>{info.ko}</b><small>{info.en} · INPUT −5 dB · {cur.s.record}</small></div>
  <p className="ns-notice">{info.synthetic?'합성 잡음 · 설명용 연출 · ':''}저장된 입력과 잡음 제거 출력 · 사람의 움직임·빨간 표시는 설명용 · 실제 장치 연결 없음</p>
 </div>;
}

/** Intro → power line → baseline wander → muscle artifact → Lab (user 2026-10-08), one continuous camera. */
export function NoiseSequence({bank,onLab}:{bank:Bank,onLab:(t:LabTarget)=>void}){
 return <NoiseShell bank={bank} conds={['pli','bw','ma']} onLab={onLab}/>;
}
