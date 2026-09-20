import type {Transport} from './engine';
import type {Loaded} from './data';

export type AttractVariant='baseline'|'question'|'orbit'|'exhibition';

export type AttractVariantConfig={
 eyebrow:string;
 title:string;
 subtitle:string;
 cta:string;
 ctaNote:string;
 preserveLoopRange:boolean;
};

export const attractVariantConfig:Record<AttractVariant,AttractVariantConfig>={
 baseline:{
  eyebrow:'SAME INPUT · SHARED TIME',
  title:'같은 ECG, 다른 잡음 제거 결과',
  subtitle:'회색 Reference와 입력·출력을 같은 시간과 mV 축에서 비교합니다.',
  cta:'REPLAY · 전시용 10초 반복 — 직접 비교해보세요',
  ctaNote:'',
  preserveLoopRange:false
 },
 question:{
  eyebrow:'V1 · QUESTION POSTER',
  title:'어떤 굴곡이\n남았을까요?',
  subtitle:'회색 Reference와 나란히 보세요.',
  cta:'직접 비교 이어가기',
  ctaNote:'같은 장면 · 같은 방법',
  preserveLoopRange:false
 },
 orbit:{
  eyebrow:'V2 · SIGNAL ORBIT',
  title:'같은 신호,\n같은 시간.',
  subtitle:'입력과 선택 출력을 같은 시각에 겹쳐 읽습니다.',
  cta:'이 장면에서 비교하기',
  ctaNote:'REPLAY · 저장 출력',
  preserveLoopRange:false
 },
 exhibition:{
  eyebrow:'V3 · EXHIBITION GRID',
  title:'같은 장면,\n직접 비교.',
  subtitle:'보던 시각과 방법은 그대로, 조작 도구만 엽니다.',
  cta:'이 장면에서 직접 비교',
  ctaNote:'같은 시각 · 같은 방법 · controls만 열기',
  preserveLoopRange:true
 }
};

export function resolveAttractVariant(search:string):AttractVariant{
 const value=new URLSearchParams(search).get('attractVariant');
 return value==='question'||value==='orbit'||value==='exhibition'||value==='baseline'?value:'baseline';
}

export function finishAttractTransport(transport:Transport,variant:AttractVariant){
 if(!attractVariantConfig[variant].preserveLoopRange)transport.loopRange=null;
 return{
  time:transport.time,
  playing:transport.playing,
  loopRange:transport.loopRange?{...transport.loopRange}:null
 };
}

export function waveformSignature(data:Loaded,method:string){
 let hash=2166136261;
 const update=(value:number)=>{hash^=value;hash=Math.imul(hash,16777619)>>>0;};
 for(const id of ['clean','input',method]){
  for(const code of id)update(code.charCodeAt(0));
  const values=data.traces[id];
  if(!values)continue;
  const bytes=new Uint8Array(values.buffer,values.byteOffset,values.byteLength);
  for(const byte of bytes)update(byte);
 }
 return `${data.scene.id}:${data.fs}:${data.n}:${method}:${hash.toString(16).padStart(8,'0')}`;
}
