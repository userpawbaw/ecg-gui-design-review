// R1 intro (IDEA-R1-INTRO, D-041): backlit globe → person outline → heart → neon sweep, noisy input → stored output.
// React renders the static DOM once and hands refs to the vanilla engine (D-028); no per-frame React state.
import {useEffect,useMemo,useRef,useState} from 'react';
import {decode} from '../../engine';
import type {Bank} from '../../data';
import {rankScene} from '../storyData';
import {detectR,makeLoop} from './beats';
import {createIntro,type Intro} from './introStage';
import './intro.css';

export const INTRO_SCENE='d0-awgn--5';   // D0 S038, white noise −5 dB (D-041)
type Props={bank:Bank,onNext:()=>void,onLab:(t:{axis:string,noise:string,snr:number,method:string})=>void};

export function IntroShell({bank,onNext,onLab}:Props){
 const params=new URLSearchParams(location.search);
 const reduced=params.get('reduced')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const scene=useMemo(()=>{
  const s=bank.scenes.find(x=>x.id===INTRO_SCENE);if(!s)throw Error('intro scene missing: '+INTRO_SCENE);
  const winner=rankScene(s as never).ranking[0].id;       // oracle excluded; −5 dB winners are all deep learning (D-040)
  const d=(k:string)=>decode(s.traces[k],s.scale,bank.n);
  const clean=d('clean'),input=d('input'),output=d(winner);
  const loop=makeLoop(detectR(clean,bank.fs),[clean,input,output],bank.fs);
  return{s,winner,input,output,loop};
 },[bank]);
 const refs={wrapper:useRef<HTMLDivElement>(null),content:useRef<HTMLDivElement>(null),gl:useRef<HTMLCanvasElement>(null),sweep:useRef<HTMLCanvasElement>(null),
  title:useRef<HTMLHeadingElement>(null),noise:useRef<HTMLSpanElement>(null),sub:useRef<HTMLParagraphElement>(null),hint:useRef<HTMLDivElement>(null),
  labels:useRef<HTMLDivElement>(null),labelIn:useRef<HTMLSpanElement>(null),labelOut:useRef<HTMLSpanElement>(null),scale:useRef<HTMLDivElement>(null),end:useRef<HTMLDivElement>(null),
  sweepWrap:useRef<HTMLDivElement>(null)};
 const [ready,setReady]=useState(false),[failed,setFailed]=useState('');
 const engine=useRef<Intro|null>(null);
 useEffect(()=>{
  let alive=true;
  const r=Object.fromEntries(Object.entries(refs).map(([k,v])=>[k,v.current])) as Record<string,HTMLElement>;
  createIntro({wrapper:r.wrapper,content:r.content,gl:r.gl as HTMLCanvasElement,sweep:r.sweep as HTMLCanvasElement,title:r.title,
   noiseChars:[...r.noise.querySelectorAll('i')] as HTMLElement[],sub:r.sub,hint:r.hint,labels:r.labels,labelIn:r.labelIn,labelOut:r.labelOut,scale:r.scale,end:r.end,
   parallax:[r.sweepWrap,r.title]},
   {fs:bank.fs,loop:scene.loop,input:scene.input,output:scene.output},
   {reduced,frozenT:params.has('t')?Number(params.get('t')):null,frozenP:params.has('p')?Number(params.get('p')):null})
   .then(e=>{if(!alive){e.dispose();return;}engine.current=e;setReady(true);
    (window as unknown as {__intro:unknown}).__intro={state:e.state,set:e.set,renderOnce:e.renderOnce,pause:e.pause,loop:scene.loop,fs:bank.fs,winner:scene.winner,
     slotOf:(abs:number)=>((abs%625)+625)%625};})
   .catch(err=>{console.error(err);setFailed(String(err?.message||err));});
  return()=>{alive=false;engine.current?.dispose();engine.current=null;delete (window as unknown as {__intro?:unknown}).__intro;};
 },[]);
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==='Enter'&&engine.current&&engine.current.state.p>.95)onNext();};addEventListener('keydown',k);return()=>removeEventListener('keydown',k);},[onNext]);
 const lab=()=>onLab({axis:scene.s.axis,noise:scene.s.cond,snr:scene.s.snr,method:scene.winner});
 return <div className={'intro'+(ready?' ready':'')+(reduced?' reduced':'')}>
  <canvas ref={refs.gl} className="it-gl" aria-hidden="true"/>
  <div ref={refs.sweepWrap} className="it-sweep-wrap"><canvas ref={refs.sweep} className="it-sweep" aria-hidden="true"/></div>
  <h1 ref={refs.title} className="it-title"><small>ECG DENOISING</small>심전도 <span ref={refs.noise} className="it-noise">{[...'잡음'].map((c,i)=><i key={i}>{c}</i>)}</span> 제거</h1>
  <p ref={refs.sub} className="it-sub">잡음이 섞인 심전도에서 원래 신호를 되살리는 방법들을, 같은 기록으로 비교합니다.</p>
  <div ref={refs.hint} className="it-hint"><span className="wheel" aria-hidden="true"/>스크롤</div>
  <div ref={refs.labels} className="it-labels" aria-live="polite">
   <span ref={refs.labelIn} className="in">잡음 섞인 입력 · 백색 잡음 −5 dB</span>
   <span ref={refs.labelOut} className="out">잡음 제거 출력 · 저장값</span>
  </div>
  <div ref={refs.scale} className="it-scale" aria-hidden="true"><i className="sec"/>1 s<i className="mv"/>1 mV</div>
  <div ref={refs.end} className="it-end">
   <p>같은 심장, 같은 기록 — 잡음을 걷어내기 전과 후.</p>
   <div><button onClick={onNext}>잡음마다 다를까요? →</button><button className="ghost" onClick={lab}>직접 비교해 보기</button></div>
  </div>
  <button className="it-skip" onClick={lab}>바로 실험실 →</button>
  <p className="it-notice">합성 기록 S038 · 저장된 입력과 잡음 제거 출력 · {((scene.loop.end-scene.loop.start)/bank.fs).toFixed(1)} s 반복 재생 · 실제 장치 연결 없음</p>
  {failed&&<p className="it-failed" role="alert">3D 장면을 불러오지 못했습니다: {failed}</p>}
  <div ref={refs.wrapper} className="it-scroll"><div ref={refs.content} className="it-scroll-content"/></div>
 </div>;
}
