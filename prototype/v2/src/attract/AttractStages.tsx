import {useState,type PointerEvent} from 'react';
import type {Transport} from '../engine';
import {noiseNames} from '../data';
import type {SignalView} from './signal';
import '@fontsource-variable/noto-sans-kr/wght.css';
import {AttractCanvas} from './AttractCanvas';
import './attract.css';

type Props={view:SignalView;transport:Transport;variant:'a'|'b';amplitudeMv:number;spanSeconds:number;reducedMotion:boolean;onEnterLab:()=>Promise<void>;onNext:()=>void;onClose:()=>void;onTogglePlayback:()=>void};
function Mini({view,kind}:{view:SignalView;kind:'input'|'output'|'reference'}){
 const array=view[kind],start=Math.max(0,Math.min(array.length-300,Math.floor(view.fs))),length=Math.min(300,array.length);
 const pts:string[]=[];for(let j=0;j<length;j+=3)pts.push(`${j/length*170},${35-array[start+j]/2*22}`);
 return <svg viewBox="0 0 170 70" role="img" aria-label={`${kind} 자료 미리보기`}><polyline points={pts.join(' ')} fill="none" stroke={kind==='input'?'#9471ff':kind==='output'?'#8effdc':'#a6aec6'} strokeWidth="1.5"/></svg>;
}
export function AttractStage(p:Props){
 const [boundary,setBoundary]=useState(.5),[reference,setReference]=useState(false),[busy,setBusy]=useState(false),[failure,setFailure]=useState('');
 const [playing,setPlaying]=useState(p.transport.playing);
 const b=p.variant==='b',name=p.view.methodId;
 const enter=async()=>{if(busy)return;setBusy(true);setFailure('');try{await p.onEnterLab();}catch(e){setFailure(String(e));setBusy(false);}};
 const toggle=()=>{p.onTogglePlayback();setPlaying(p.transport.playing);};
 const update=(e:PointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.parentElement!.getBoundingClientRect();setBoundary(Math.max(.2,Math.min(.8,(e.clientX-r.left-48)/(r.width-66))));};
 return <div className={`attract-vnext ${b?'attract-b':'attract-a'}`} data-attract={p.variant} data-scene={p.view.sceneId} data-method={name}>
  <header className="attract-top"><div className="attract-brand"><span className="attract-heart">⌁</span><span>{b?'ECG 신호처리 연구실':'ECG Signal Studio'}<small>{b?'신호처리 · 저장 출력 비교':'ECG DENOISING · SIGNAL COMPARISON'}</small></span></div><nav aria-label="Attract 장면"><button onClick={p.onClose}>실험실</button><button onClick={p.onNext}>{b?'A 시안':'B 시안'}</button><span>실제 저장 파형 기반 시안</span></nav><button className="attract-top-cta" onClick={enter} disabled={busy}>{b?'ECG Denoising Explorer':'Enter Lab'} <span>↗</span></button></header>
  <aside className="attract-intro"><div className="attract-kicker">{b?'실시간 계측이 아닌 저장 출력 재생':'A SIGNAL PROCESSING PROJECT'}</div><h1>{b?<>ECG<br/><em>Denoising Explorer</em></>:<>ECG<br/>Signal <em>Studio</em></>}</h1><p className="attract-lead">{b?<>노이즈가 포함된 심전도 신호를<br/>선택한 방법의 저장 출력과<br/>같은 시각에서 비교합니다.</>:<>잡음이 섞인 ECG 신호를 복원하고,<br/>방법별 결과를 직접 비교합니다.</>}</p><p className="attract-copy">{b?<>같은 sample index와 mV 눈금으로<br/>두 파형의 차이를 확인하세요.</>:<>입력 신호와 선택한 출력, 기준 파형을<br/>같은 구간에서 확인합니다.</>}</p><button className="attract-primary" onClick={enter} disabled={busy}>{busy?'연결 중…':b?'직접 비교하기':'Enter Lab'} <span>→</span></button><div className="attract-credentials"><span>{p.view.record}</span><span>{noiseNames[p.view.noise]||p.view.noise} · {p.view.snr} dB</span><span>{name} 출력 · REPLAY</span></div></aside>
  <section className="attract-stage" aria-label={b?'B Transformation Stage':'A Signal Field'}>
   {b?<><div className="attract-stage-heading"><span>동일 시각의 입력과 출력</span><h2>노이즈에서 신호로</h2><p>비교 렌즈를 움직여 두 저장 파형을 확인하세요.</p></div><div className="attract-stage-tools"><button aria-pressed={!reference} onClick={()=>setReference(false)}>Waveform</button><button aria-pressed={reference} onClick={()=>setReference(true)}>Reference 겹침</button><button onClick={toggle}>{playing?'일시정지':'재생'}</button></div><div className="attract-b-legend"><span>━ 입력 · Noisy</span><span>━ {name} 출력</span>{reference&&<span>┄ Reference · 공통 FE 기준</span>}</div></>:<div className="attract-a-caption">잡음 속 심전도 신호를<br/>복원합니다.</div>}
   <div className="attract-visual"><AttractCanvas view={p.view} transport={p.transport} variant={p.variant} boundary={boundary} reference={reference} amplitudeMv={p.amplitudeMv} spanSeconds={p.spanSeconds} reducedMotion={p.reducedMotion}/>{b&&<div className="compare-lens-track" style={{left:`calc(${boundary*100}% + ${48-66*boundary}px)`}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);update(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))update(e);}}><input className="compare-lens-boundary" aria-label="비교 렌즈 경계 · 처리 시점 아님" aria-valuetext={`렌즈 ${Math.round(boundary*100)}%, 두 파형은 같은 시각`} type="range" min="20" max="80" step="1" value={Math.round(boundary*100)} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setBoundary(v=>Math.max(.2,Math.min(.8,v+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?.1:.02))));}}} onChange={e=>setBoundary(+e.target.value/100)}/></div>}</div>
   {b?<><div className="attract-signal-labels"><div><b>입력 · Noisy</b><small>실제 저장 입력의 잡음 포함 파형</small></div><div><b>{name} 출력</b><small>동일 시간의 선택 방법 저장 결과</small></div></div><div className="attract-b-lower"><div className="attract-miniatures">{(['input','reference','output'] as const).map((kind,i)=><div key={kind}><Mini view={p.view} kind={kind}/><small>{i+1}. {kind==='input'?'입력':kind==='reference'?'Reference':'출력'}</small></div>)}</div><div className="attract-facts"><strong>비교 기준</strong><p>입력과 출력의 시간·진폭 눈금 일치.<br/>Reference는 공통 FE 처리 기준입니다.</p><small>{p.view.fs} Hz · {p.view.source==='replay'?'600초 replay':'10초 archive'}</small></div></div></>:<div className="attract-a-legend"><span>┄ Input (Noisy) · ghost</span><span>━ {name} output</span><span>REPLAY · {p.view.fs} Hz</span></div>}
  </section>{failure&&<div className="attract-failure" role="alert">{failure} · 현재 장면에서 다시 시도할 수 있습니다.</div>}<footer className="attract-bottom"><span>{b?'02 / 03':'01 / 03'}</span><button onClick={p.onNext}>{b?'Signal Field 보기':'다음 · Transformation Stage'} →</button><button onClick={enter} disabled={busy}>Compare 열기 →</button><span>파형은 실제 저장 샘플로 표시 · 장치 연결 없음</span></footer>
 </div>;
}
