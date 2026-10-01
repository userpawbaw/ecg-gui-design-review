// R1 intro (IDEA-R1-INTRO, D-041): backlit globe → person outline → heart → neon sweep, noisy input → stored output.
// React renders the static DOM once and hands refs to the vanilla engine (D-028); no per-frame React state.
import {useEffect,useMemo,useRef,useState} from 'react';
import {decode} from '../../engine';
import type {Bank} from '../../data';
import {rankScene} from '../storyData';
import {detectR,makeLoop} from './beats';
import {createIntro,type Intro} from './introStage';
// fonts (OFL, bundled — no network at the exhibit): Pretendard for Korean display, IBM Plex Mono for the HUD tier (L1)
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './intro.css';
import '../hoverfx.css';
import {useHoverDim} from '../hoverFx';

export const INTRO_SCENE='d0-awgn-0';    // D0 S038, white noise 0 dB (D-041 → D-042: R peaks must stay visible in the noise)
type Props={bank:Bank,onNext:()=>void,onLab:(t:{axis:string,noise:string,snr:number,method:string})=>void};

export function IntroShell({bank,onNext,onLab}:Props){
 const params=new URLSearchParams(location.search);
 const reduced=params.get('reduced')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const scene=useMemo(()=>{
  const s=bank.scenes.find(x=>x.id===INTRO_SCENE);if(!s)throw Error('intro scene missing: '+INTRO_SCENE);
  const winner=rankScene(s as never).ranking[0].id;       // oracle excluded; winner is deep learning (M06) at −5 and 0 dB (D-040, D-042)
  const d=(k:string)=>decode(s.traces[k],s.scale,bank.n);
  const clean=d('clean'),input=d('input'),output=d(winner);
  const loop=makeLoop(detectR(clean,bank.fs),[clean,input,output],bank.fs);
  const m=(s as unknown as {storedMetrics:Record<string,{snr_out:number,cc:number}>}).storedMetrics[winner];
  return{s,winner,input,output,loop,metrics:{snrIn:s.snr,snrOut:m.snr_out,cc:m.cc}};
 },[bank]);
 const refs={wrapper:useRef<HTMLDivElement>(null),content:useRef<HTMLDivElement>(null),gl:useRef<HTMLCanvasElement>(null),sweep:useRef<HTMLCanvasElement>(null),
  title:useRef<HTMLHeadingElement>(null),noise:useRef<HTMLSpanElement>(null),sub:useRef<HTMLParagraphElement>(null),hint:useRef<HTMLDivElement>(null),
  labels:useRef<HTMLDivElement>(null),labelIn:useRef<HTMLDivElement>(null),labelOut:useRef<HTMLDivElement>(null),outMono:useRef<HTMLElement>(null),steps:useRef<HTMLDivElement>(null),scale:useRef<HTMLDivElement>(null),grid:useRef<HTMLCanvasElement>(null),ann:useRef<HTMLDivElement>(null),end:useRef<HTMLDivElement>(null),
  sweepWrap:useRef<HTMLDivElement>(null)};
 const [ready,setReady]=useState(false),[failed,setFailed]=useState('');
 const rootRef=useRef<HTMLDivElement>(null);
 useHoverDim(rootRef);   // D-048: delegated hover/focus → data-hd on the root (scene veil + control fill)
 const engine=useRef<Intro|null>(null);
 useEffect(()=>{
  let alive=true;
  const r=Object.fromEntries(Object.entries(refs).map(([k,v])=>[k,v.current])) as Record<string,HTMLElement>;
  createIntro({wrapper:r.wrapper,content:r.content,gl:r.gl as HTMLCanvasElement,sweep:r.sweep as HTMLCanvasElement,title:r.title,
   noiseChars:[...r.noise.querySelectorAll('i')] as HTMLElement[],sub:r.sub,hint:r.hint,labels:r.labels,labelIn:r.labelIn,labelOut:r.labelOut,outMono:r.outMono,steps:[...r.steps.querySelectorAll('i')] as HTMLElement[],scale:r.scale,grid:r.grid as HTMLCanvasElement,ann:r.ann,sweepWrap:r.sweepWrap,end:r.end,
   parallax:[r.sweepWrap,r.title]},
   {fs:bank.fs,loop:scene.loop,input:scene.input,output:scene.output,metrics:scene.metrics},
   {reduced,frozenT:params.has('t')?Number(params.get('t')):null,frozenP:params.has('p')?Number(params.get('p')):null})
   .then(e=>{if(!alive){e.dispose();return;}engine.current=e;setReady(true);
    (window as unknown as {__intro:unknown}).__intro={state:e.state,set:e.set,renderOnce:e.renderOnce,pause:e.pause,loop:scene.loop,fs:bank.fs,winner:scene.winner,
     slotOf:(abs:number)=>((abs%625)+625)%625};})
   .catch(err=>{console.error(err);setFailed(String(err?.message||err));});
  return()=>{alive=false;engine.current?.dispose();engine.current=null;delete (window as unknown as {__intro?:unknown}).__intro;};
 },[]);
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==='Enter'&&engine.current&&engine.current.state.p>.95)onNext();};addEventListener('keydown',k);return()=>removeEventListener('keydown',k);},[onNext]);
 const lab=()=>onLab({axis:scene.s.axis,noise:scene.s.cond,snr:scene.s.snr,method:scene.winner});
 return <div ref={rootRef} className={'intro'+(ready?' ready':'')+(reduced?' reduced':'')}>
  <canvas ref={refs.gl} className="it-gl" aria-hidden="true"/>
  <div className="hd-dim" aria-hidden="true"/>{/* B1: veil above the 3D scene, below the waveform stage and all text (D-048) */}
  <div ref={refs.sweepWrap} className="it-sweep-wrap">
   <canvas ref={refs.grid} className="it-grid" aria-hidden="true"/>
   <canvas ref={refs.sweep} className="it-sweep" aria-hidden="true"/>
   <div ref={refs.ann} className="it-ann" aria-hidden="true"><i/><span><b>R 피크</b><small>심장이 수축하는 순간</small></span></div>
   <div ref={refs.scale} className="it-scale" aria-hidden="true"><span>큰 칸 0.2 s × 0.5 mV</span><span>작은 칸 0.04 s × 0.1 mV</span></div>
  </div>
  <h1 ref={refs.title} className="it-title"><small>ECG DENOISING</small>심전도 <span ref={refs.noise} className="it-noise">{[...'잡음'].map((c,i)=><i key={i}>{c}</i>)}</span> 제거</h1>
  <p ref={refs.sub} className="it-sub">잡음이 섞인 심전도에서 원래 신호를 되살리는 방법들을, 같은 기록으로 비교합니다.</p>
  <div ref={refs.hint} className="it-hint"><span className="wheel" aria-hidden="true"/>스크롤</div>
  <div ref={refs.labels} className="it-labels" aria-live="polite">
   <div ref={refs.labelIn} className="it-lab in is-current"><i className="bar"/><b>잡음 섞인 입력</b><small>INPUT · WHITE NOISE {scene.s.snr} dB · {scene.s.record}</small></div>
   <div ref={refs.labelOut} className="it-lab out"><i className="bar"/><b>잡음 제거 출력</b><small ref={refs.outMono as never}>OUTPUT · 저장값</small></div>
   <div ref={refs.steps} className="it-steps" aria-hidden="true"><i/><i/><i/><i/><em>박동마다 한 겹</em></div>
  </div>
  <div ref={refs.end} className="it-end">
   <p>같은 심장, 같은 기록 — 잡음을 걷어내기 전과 후.</p>
   <div><button className="hv hv-solid" data-sub="STORY · 잡음 종류별로 비교" onClick={onNext}>잡음마다 다를까요?<span className="arr" aria-hidden="true">→</span></button><button className="ghost hv" data-sub="LAB · 방법을 직접 고르기" onClick={lab}>직접 비교해 보기</button></div>
  </div>
  <button className="it-skip hv" data-sub="LAB · 바로 이동" onClick={lab}>바로 실험실<span className="arr" aria-hidden="true">→</span></button>
  <p className="it-notice">합성 기록 S038 · 저장된 입력과 잡음 제거 출력 · {((scene.loop.end-scene.loop.start)/bank.fs).toFixed(1)} s 반복 재생 · 실제 장치 연결 없음</p>
  {failed&&<p className="it-failed" role="alert">3D 장면을 불러오지 못했습니다: {failed}</p>}
  <div ref={refs.wrapper} className="it-scroll"><div ref={refs.content} className="it-scroll-content"/></div>
 </div>;
}
