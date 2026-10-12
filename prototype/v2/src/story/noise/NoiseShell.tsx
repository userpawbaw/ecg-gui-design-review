// Story noise scenes (brief 3). Entry: ?story=noise&cond=pli|bw|ma (one scene; ?t= freezes the clock), or NoiseSequence
// in the main flow: intro → power line → baseline wander → muscle artifact → Lab, on one stage so the camera carries on
// from scene to scene (user 2026-10-08: "장면 사이도 카메라로 이어지게 해줘").
import {useEffect,useMemo,useRef,useState} from 'react';
import {decode} from '../../engine';
import {loadScene,type Bank} from '../../data';
import {detectR} from '../intro/beats';
import {rankScene} from '../storyData';
import {createNoiseStage,type Cond,type NoiseData,type WaveUi} from './noiseStage';
import './noise.css';

const SCENE:Record<Cond,{id:string,ko:string,en:string,synthetic:boolean}>={
 pli:{id:'d0-pli--5',ko:'전원 간섭',en:'POWER-LINE INTERFERENCE',synthetic:false},
 bw:{id:'d0-bw_synth--5',ko:'기저선 변동',en:'BASELINE WANDER',synthetic:true},
 ma:{id:'d0-ma_synth--5',ko:'근육 잡음',en:'MUSCLE ARTIFACT',synthetic:true}};
type LabTarget={axis:string,noise:string,snr:number,method:string};

// S-16 (user 2026-10-12: "10초밖에 없는 데이터 문제로 계속 끊기는 경험 … 30초 이상"): when the 600 s replay package is present
// (replay/manifest.json, hash-verified 30 s chunks of the same stored scenes), the Story uses its first LONG_S seconds of the
// same scene id; without it, the stored 10 s segment as before. The output method stays the 10 s ranking's winner; samples
// are the stored ones either way (no resampling, no synthesis).
export const LONG_S=40;
type Long=Partial<Record<Cond,{record:string,traces:Record<string,Float32Array>}>>;
function sceneData(bank:Bank,cond:Cond,long?:Long){
 const s=bank.scenes.find(x=>x.id===SCENE[cond].id);if(!s)throw Error('noise scene missing: '+SCENE[cond].id);
 const winner=rankScene(s).ranking[0].id,L=long?.[cond];
 const n=L&&L.traces[winner]?Math.min(Math.round(LONG_S*bank.fs),L.traces.clean.length):bank.n;
 const d=(k:string)=>L&&L.traces[winner]?L.traces[k].slice(0,n):decode(s.traces[k],s.scale,bank.n);
 const clean=d('clean'),input=d('input'),output=d(winner);
 const data:NoiseData={cond,fs:bank.fs,loop:{start:0,end:n,beats:detectR(clean,bank.fs)},input,output,clean};
 return{s:L&&L.traces[winner]?{...s,record:L.record}:s,winner,data,seconds:n/bank.fs};
}
async function loadLong(conds:Cond[]):Promise<Long|undefined>{
 const r=await fetch('./replay/manifest.json').catch(()=>null);if(!r||!r.ok)return undefined;
 const long=await r.json() as Bank;if(!long?.scenes?.length)return undefined;long.long=true;
 const out:Long={},ac=new AbortController();
 for(const c of conds){const sc=long.scenes.find(x=>x.id===SCENE[c].id);if(!sc)continue;
  try{const l=await loadScene(long,sc,ac.signal,0);if(l.offset===0)out[c]={record:sc.record,traces:l.traces};}catch{/* a failed hash keeps the 10 s segment */}}
 return out;
}

export function NoiseShell(p:{bank:Bank,conds?:Cond[],onLab?:(t:LabTarget)=>void}){
 const q=new URLSearchParams(location.search);
 const order=useMemo<Cond[]>(()=>p.conds??(q.get('cond')==='all'?['pli','bw','ma']:[(['pli','bw','ma'].includes(q.get('cond')||'')?q.get('cond'):'pli') as Cond]),[]);   // cond=all: the three scenes in a row (QA)
 const [long,setLong]=useState<Long|undefined|'pending'>('pending');
 useEffect(()=>{let live=true;(q.get('long')==='0'?Promise.resolve(undefined):loadLong(order)).then(l=>{if(live)setLong(l);},()=>{if(live)setLong(undefined);});return()=>{live=false;};},[]);
 if(long==='pending')return <div className="ns-root"/>;
 return <NoiseShellInner {...p} order={order} long={long}/>;
}
function NoiseShellInner({bank,order,long,onLab}:{bank:Bank,order:Cond[],long?:Long,onLab?:(t:LabTarget)=>void}){
 const q=new URLSearchParams(location.search);
 const scenes=useMemo(()=>order.map(c=>sceneData(bank,c,long)),[bank,order,long]);
 const [i,setI]=useState(0),iRef=useRef(0),[ui,setUi]=useState<WaveUi>({atEnd:false,overlay:false,phase:'wait'});
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
   scenes[0].data,{frozenT:frozen,reduced,last:order.length===1,onEnd:()=>advance.current(),onUi:setUi})
   .then(s=>{if(dead){s.dispose();return;}stageRef.current=s;(window as unknown as {__noise:unknown}).__noise={set:s.set,renderOnce:s.renderOnce,next:()=>advance.current(),get cond(){return s.cond;},ready:true,probe:s.probe,around:s.around,leave:s.leave,bursts:s.bursts,scroll:s.scroll,overlay:s.toggleOverlay,
    check:(o?:{dt?:number,all?:boolean,pathOnly?:boolean,viewOnly?:boolean,maxFg?:number})=>s.selfCheck((o?.all?(['pli','bw','ma'] as Cond[]).map(c=>sceneData(bank,c,long).data):scenes.map(x=>x.data)),o),seconds:scenes.map(x=>x.seconds)};});
  return()=>{dead=true;stageRef.current?.dispose();stageRef.current=null;};
 },[]);
 // S-06/S-07 (REVIEW-R1-STORY-20261011): the wheel and the arrow keys move the input ↔ output cross-fade; the scene changes
 // only through the button. Wheel lines/pages are scaled to pixels so every device scrolls the same distance.
 useEffect(()=>{
  const st=()=>stageRef.current;
  const w=(e:WheelEvent)=>{const k=e.deltaMode===1?40:e.deltaMode===2?innerHeight:1;st()?.scroll(e.deltaY*k);};
  const key=(e:KeyboardEvent)=>{const d={ArrowDown:90,PageDown:300,ArrowUp:-90,PageUp:-300}[e.key];if(d!==undefined){e.preventDefault();st()?.scroll(d);}};
  addEventListener('wheel',w,{passive:true});addEventListener('keydown',key);return()=>{removeEventListener('wheel',w);removeEventListener('keydown',key);};},[]);
 const next=()=>{setUi(u=>({...u,atEnd:false}));stageRef.current?.leave();};
 const toggle=()=>{stageRef.current?.toggleOverlay();};
 const cur=scenes[i],info=SCENE[order[i]];
 return <div className="ns-root">
  <canvas ref={gl} className="ns-gl"/><canvas ref={overlay} className="ns-overlay"/><canvas ref={grid} className="ns-grid"/><canvas ref={sweep} className="ns-sweep"/>
  <div ref={strip} className="ns-strip" aria-label="입력에서 출력으로 처리 단계"><i/><i/><i/><i/><span>{ui.overlay?'겹쳐 보기 · 입력 + 출력':ui.phase==='auto'?'박동마다 한 겹 · '+cur.winner:'입력 → 출력 · '+cur.winner}</span></div>
  <div className={'ns-actions'+(ui.atEnd?' on':'')} aria-hidden={!ui.atEnd}>
   <p className="ns-hint">{ui.overlay?'두 신호를 겹쳐 보는 중 · 스크롤은 멈춤':'스크롤을 올리면 잡음 섞인 입력으로 돌아감'}</p>
   <button type="button" className="ns-btn ghost" onClick={toggle} tabIndex={ui.atEnd?0:-1}>{ui.overlay?'한 신호로 보기':'두 신호 겹쳐 보기'}</button>
   <button type="button" className="ns-btn" onClick={next} tabIndex={ui.atEnd?0:-1}>{i+1<order.length?'다음 장면 →':onLab?'실험실로 →':'처음으로'}</button>
  </div>
  <div className="ns-title" key={order[i]}><b>{info.ko}</b><small>{info.en} · INPUT −5 dB · {cur.s.record}</small></div>
  <p className="ns-notice">{info.synthetic?'합성 잡음 · 설명용 연출 · ':''}저장된 입력과 잡음 제거 출력 · 사람의 움직임·빨간 표시는 설명용 · 실제 장치 연결 없음</p>
 </div>;
}

/** Intro → power line → baseline wander → muscle artifact → Lab (user 2026-10-08), one continuous camera. */
export function NoiseSequence({bank,onLab}:{bank:Bank,onLab:(t:LabTarget)=>void}){
 return <NoiseShell bank={bank} conds={['pli','bw','ma']} onLab={onLab}/>;
}
