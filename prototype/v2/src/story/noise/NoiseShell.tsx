// Story noise scenes (brief 3). Entry: ?story=noise&cond=pli|bw|ma (one scene; ?t= freezes the clock), or NoiseSequence
// in the main flow: intro → power line → baseline wander → muscle artifact → Lab, on one stage so the camera carries on
// from scene to scene (user 2026-10-08: "장면 사이도 카메라로 이어지게 해줘").
import {useEffect,useMemo,useRef,useState} from 'react';
import {decode} from '../../engine';
import type {Bank} from '../../data';
import {loadLong,type LongScene} from '../longData';
import {detectR} from '../intro/beats';
import {rankScene} from '../storyData';
import {createNoiseStage,type Cond,type NoiseData,type WaveUi} from './noiseStage';
import './noise.css';

const SCENE:Record<Cond,{id:string,ko:string,en:string,synthetic:boolean}>={
 pli:{id:'d0-pli--5',ko:'전원 간섭',en:'POWER-LINE INTERFERENCE',synthetic:false},
 bw:{id:'d0-bw_synth--5',ko:'기저선 변동',en:'BASELINE WANDER',synthetic:true},
 ma:{id:'d0-ma_synth--5',ko:'근육 잡음',en:'MUSCLE ARTIFACT',synthetic:true}};
type LabTarget={axis:string,noise:string,snr:number,method:string};

type Long=Partial<Record<Cond,LongScene>>;
function sceneData(bank:Bank,cond:Cond,long?:Long){
 const s=bank.scenes.find(x=>x.id===SCENE[cond].id);if(!s)throw Error('noise scene missing: '+SCENE[cond].id);
 const winner=rankScene(s).ranking[0].id,L=long?.[cond]&&long[cond]!.traces[winner]?long[cond]:undefined;   // S-16: 600 s package when present (longData.ts)
 const d=(k:string)=>L?L.traces[k]:decode(s.traces[k],s.scale,bank.n);
 const clean=d('clean'),input=d('input'),output=d(winner),n=clean.length;
 const data:NoiseData={cond,fs:bank.fs,loop:{start:0,end:n,beats:detectR(clean,bank.fs)},input,output,clean};
 return{s:L?{...s,record:L.record}:s,winner,data,seconds:n/bank.fs};
}
async function loadLongConds(conds:Cond[]):Promise<Long>{
 const got=await loadLong(conds.map(c=>SCENE[c].id)),out:Long={};for(const c of conds){const v=got[SCENE[c].id];if(v)out[c]=v;}return out;
}

export function NoiseShell(p:{bank:Bank,conds?:Cond[],onLab?:(t:LabTarget)=>void}){
 const q=new URLSearchParams(location.search);
 const order=useMemo<Cond[]>(()=>p.conds??(q.get('cond')==='all'?['pli','bw','ma']:[(['pli','bw','ma'].includes(q.get('cond')||'')?q.get('cond'):'pli') as Cond]),[]);   // cond=all: the three scenes in a row (QA)
 const [long,setLong]=useState<Long|undefined|'pending'>('pending');
 useEffect(()=>{let live=true;loadLongConds(order).then(l=>{if(live)setLong(l);},()=>{if(live)setLong(undefined);});return()=>{live=false;};},[]);
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
   .then(s=>{if(dead){s.dispose();return;}stageRef.current=s;(window as unknown as {__noise:unknown}).__noise={set:s.set,renderOnce:s.renderOnce,next:()=>advance.current(),get cond(){return s.cond;},ready:true,probe:s.probe,qaPose:s.qaPose,around:s.around,leave:s.leave,bursts:s.bursts,scroll:s.scroll,overlay:s.toggleOverlay,
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
 const debug=q.has('debug');
 return <div className="ns-root">
  {debug&&<QaPanel stage={()=>stageRef.current}/>}
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

// QA panel (?debug=1, 2026-10-14 user: "실제 시연에서 비교할 수 있도록 디버깅용 버튼"): switches the candidates live on the stage.
const QA_GROUPS:[string,string,[string,string][]][]=[
 ['comp','멀티탭 구도',[['A0','이전(가까이)'],['A1','멀리'],['A2','위에서']]],
 ['speed','동심원 속도',[['B0','이전(고정)'],['B1','거리 비례'],['B2','거리 비례+흐리게']]],
 ['ac','교류 표시',[['C0','이전(말풍선)'],['C1','아이콘만'],['C2','아이콘+60 Hz']]],
 ['sonar','소나',[['D0','이전(4+5 ×2)'],['D1','1초마다 계속'],['D2','3회 두드림 · 2초 주기']]],
 ['fade','계속 소나 투명도',[['Ea','낮은 시작'],['Eb','테두리만'],['Ec','완만한 감쇠']]],
 ['light','책상 조명',[['L0','끔(기본, 화면 꺼짐)'],['L1','램프 + 화면 빛(D-067)'],['L2','+ 그림자 · 갓 빛']]],
 ['fist','주먹(근육)',[['F0','이전(잡음 동안 쥐어 감)'],['F1','잡음 시작에 다 쥠 · 끝나면 폄'],['F2','빠르게 쥠 · 끝나는 순간부터 천천히 폄']]],
 ['set','공간',[['A','A안: 서고 + 책상 세트(D-070)'],['C','C안: 다락방 새로 짓기(D-071)']]]];
type QaStage={setQa:(k:string,v:string)=>void,qa:Record<string,string>,jump:(t:number)=>void}|null;
function QaPanel({stage}:{stage:()=>unknown}){
 const st=()=>stage() as QaStage;const [,force]=useState(0);
 const cur=st()?.qa??{};const msaa=new URLSearchParams(location.search).get('msaa')!=='0';
 const reload=(k:string,v:string)=>{const u=new URL(location.href);u.searchParams.set(k,v);for(const [kk,vv] of Object.entries(cur))u.searchParams.set(kk,vv);location.href=u.toString();};
 return <div className="ns-qa" onWheel={e=>e.stopPropagation()}>
  {QA_GROUPS.map(([k,label,opts])=><div key={k}><span>{label}</span>{opts.map(([v,t])=>
   <button key={v} className={cur[k]===v?'on':''} onClick={()=>{st()?.setQa(k,v);if(k==='comp')st()?.jump(9.5);force(x=>x+1);}}>{v} {t}</button>)}</div>)}
  <div><span>구간</span><button onClick={()=>st()?.jump(9.5)}>멀티탭부터</button><button onClick={()=>st()?.jump(13.5)}>동심원부터</button><button onClick={()=>st()?.jump(0)}>처음부터</button>
   <button onClick={()=>reload('msaa',msaa?'0':'4')}>MSAA {msaa?'끄기':'켜기'}</button></div>
 </div>;
}
