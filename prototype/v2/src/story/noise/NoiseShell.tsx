// Story noise scenes, first pass (brief 3). Entry: ?story=noise&cond=pli|bw|ma (fixed composition; ?t= freezes the clock).
import {useEffect,useMemo,useRef} from 'react';
import {decode} from '../../engine';
import type {Bank} from '../../data';
import {detectR} from '../intro/beats';
import {rankScene} from '../storyData';
import {createNoiseStage,type Cond} from './noiseStage';
import './noise.css';

const SCENE:Record<Cond,{id:string,ko:string,en:string,synthetic:boolean}>={
 pli:{id:'d0-pli--5',ko:'전원 간섭',en:'POWER-LINE INTERFERENCE',synthetic:false},
 bw:{id:'d0-bw_synth--5',ko:'기저선 변동',en:'BASELINE WANDER',synthetic:true},
 ma:{id:'d0-ma_synth--5',ko:'근육 잡음',en:'MUSCLE ARTIFACT',synthetic:true}};

export function NoiseShell({bank}:{bank:Bank}){
 const q=new URLSearchParams(location.search),cond=(['pli','bw','ma'].includes(q.get('cond')||'')?q.get('cond'):'pli') as Cond,info=SCENE[cond];
 const scene=useMemo(()=>{
  const s=bank.scenes.find(x=>x.id===info.id);if(!s)throw Error('noise scene missing: '+info.id);
  const winner=rankScene(s).ranking[0].id,d=(k:string)=>decode(s.traces[k],s.scale,bank.n);
  const clean=d('clean'),input=d('input'),output=d(winner);
  return{s,winner,clean,input,output,loop:{start:0,end:bank.n,beats:detectR(clean,bank.fs)}};
 },[bank,info.id]);
 const gl=useRef<HTMLCanvasElement>(null),grid=useRef<HTMLCanvasElement>(null),sweep=useRef<HTMLCanvasElement>(null),overlay=useRef<HTMLCanvasElement>(null),strip=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  let stage:Awaited<ReturnType<typeof createNoiseStage>>|null=null,dead=false;
  const frozen=q.has('t')?Number(q.get('t')):null,reduced=q.get('reduced')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;
  createNoiseStage({gl:gl.current!,grid:grid.current!,sweep:sweep.current!,overlay:overlay.current!,cells:[...strip.current!.querySelectorAll<HTMLElement>('i')]},
   {cond,fs:bank.fs,loop:scene.loop,input:scene.input,output:scene.output,clean:scene.clean},{frozenT:frozen,reduced})
   .then(s=>{if(dead){s.dispose();return;}stage=s;(window as unknown as {__noise:unknown}).__noise={set:s.set,renderOnce:s.renderOnce,ready:true};});
  return()=>{dead=true;stage?.dispose();};
 },[]);
 return <div className="ns-root">
  <canvas ref={gl} className="ns-gl"/><canvas ref={overlay} className="ns-overlay"/><canvas ref={grid} className="ns-grid"/><canvas ref={sweep} className="ns-sweep"/>
  <div ref={strip} className="ns-strip" aria-label="박동마다 한 겹 처리"><i/><i/><i/><i/><span>박동마다 한 겹 · {scene.winner}</span></div>
  <div className="ns-title"><b>{info.ko}</b><small>{info.en} · INPUT −5 dB · {scene.s.record}</small></div>
  <p className="ns-notice">{info.synthetic?'합성 잡음 · 설명용 연출 · ':''}저장된 입력과 잡음 제거 출력 · 사람의 움직임·빨간 표시는 설명용 · 실제 장치 연결 없음</p>
 </div>;
}
