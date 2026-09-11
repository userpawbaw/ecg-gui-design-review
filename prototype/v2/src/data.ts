import {decode} from './engine';
export type Scene={id:string,axis:string,cond:string,snr:number,record:string,scale:number,traces:Record<string,string>,metadata?:Record<string,unknown>};
export type Bank={fs:number,n:number,scenes:Scene[],provenance:Record<string,unknown>,evidence:{rows:Array<Record<string,any>>},long?:boolean};
export type Loaded={scene:Scene,fs:number,n:number,traces:Record<string,Float32Array>,provenance:Record<string,unknown>};
export const noiseNames:Record<string,string>={mixed:'혼합 잡음',pli:'전원 간섭',ma_synth:'근육 잡음',em_synth:'전극 움직임',bw_synth:'기저선 변동',impulse:'임펄스',awgn:'백색 잡음'};
export async function loadArchive():Promise<Bank>{const r=await fetch('./archive.json');if(!r.ok)throw Error('기본 파형 파일을 열 수 없습니다.');return r.json();}
const cache=new Map<string,Loaded>();
export async function loadScene(bank:Bank,s:Scene,signal:AbortSignal):Promise<Loaded>{
 const key=(bank.long?'long:':'archive:')+s.id;if(cache.has(key))return cache.get(key)!;
 let item=s;
 if(bank.long){const r=await fetch('./long/'+s.id+'.json',{signal});if(!r.ok)throw Error('10분 자료가 아직 생성되지 않았거나 파일을 읽을 수 없습니다.');item=await r.json();if(item.id!==s.id)throw Error('데이터 조건이 일치하지 않습니다.');}
 const traces:Record<string,Float32Array>={};for(const [id,encoded] of Object.entries(item.traces)){try{traces[id]=decode(encoded,item.scale,bank.n);}catch(e){if(id==='clean'||id==='input')throw e;}}
 if(!traces.clean||!traces.input)throw Error('입력/Reference가 없습니다.');traces.M00=traces.input;
 const result={scene:item,fs:bank.fs,n:bank.n,traces,provenance:bank.provenance};cache.set(key,result);while(cache.size>3)cache.delete(cache.keys().next().value!);return result;
}
