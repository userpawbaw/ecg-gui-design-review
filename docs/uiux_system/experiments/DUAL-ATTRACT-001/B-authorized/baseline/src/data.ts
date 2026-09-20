import {decode,metric} from './engine';
export type Chunk={path:string,start:number,n:number,bytes:number,sha256:string};
export type Scene={id:string,axis:string,cond:string,snr:number,record:string,scale:number,traces:Record<string,string>,metadata?:Record<string,unknown>,channels?:string[],chunks?:Chunk[],sessionMetrics?:Record<string,NonNullable<ReturnType<typeof metric>>>};
export type Bank={fs:number,n:number,scenes:Scene[],provenance:Record<string,unknown>,evidence:{rows:Array<Record<string,any>>},long?:boolean};
export type Loaded={scene:Scene,fs:number,n:number,offset:number,chunkIndex:number,traces:Record<string,Float32Array>,provenance:Record<string,unknown>};
export const noiseNames:Record<string,string>={mixed:'혼합 잡음',pli:'전원 간섭',ma_synth:'근육 잡음 · 합성',em_synth:'전극 움직임 · 합성',bw_synth:'기저선 변동 · 합성',impulse:'임펄스',awgn:'백색 잡음'};
export async function loadArchive():Promise<Bank>{const r=await fetch('./archive.json');if(!r.ok)throw Error('기본 파형 파일을 열 수 없습니다.');return r.json();}
const cache=new Map<string,ArrayBuffer>();
export async function verifiedChunk(c:Chunk,signal:AbortSignal){
 const key=c.path+':'+c.sha256;const cached=cache.get(key);if(cached){cache.delete(key);cache.set(key,cached);return cached;}
 const r=await fetch('./replay/'+c.path,{signal});if(!r.ok)throw Error('재생 청크를 읽을 수 없습니다: '+c.path);
 const b=await r.arrayBuffer();if(b.byteLength!==c.bytes)throw Error('청크 길이가 다릅니다.');
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!==c.sha256)throw Error('청크 해시가 다릅니다.');if(signal.aborted)throw new DOMException('Aborted','AbortError');
 cache.set(key,b);while(cache.size>9)cache.delete(cache.keys().next().value!);return b;
}
export async function loadScene(bank:Bank,s:Scene,signal:AbortSignal,time=5):Promise<Loaded>{
 const traces:Record<string,Float32Array>={};let offset=0,chunkIndex=0;
 if(bank.long){
  if(!s.channels||!s.chunks||s.chunks.length!==20)throw Error('30초 청크 manifest가 없습니다.');
  chunkIndex=Math.min(19,Math.floor(time/30));const chunks=s.chunks.slice(Math.max(0,chunkIndex-1),Math.min(20,chunkIndex+2));
  const buffers=await Promise.all(chunks.map(c=>verifiedChunk(c,signal)));offset=chunks[0].start;const count=chunks.reduce((n,c)=>n+c.n,0);
  for(const [channel,id]of s.channels.entries()){
   const values=new Float32Array(count);let destination=0;
   for(const [index,c]of chunks.entries()){const view=new DataView(buffers[index]);for(let i=0;i<c.n;i++)values[destination+i]=view.getInt16((channel*c.n+i)*2,true)*s.scale;destination+=c.n;}
   traces[id]=values;
  }
 }else{for(const [id,encoded]of Object.entries(s.traces))traces[id]=decode(encoded,s.scale,bank.n);}
 if(!traces.clean||!traces.input)throw Error('입력/Reference가 없습니다.');traces.M00=traces.input;
 return{scene:s,fs:bank.fs,n:bank.n,offset,chunkIndex,traces,provenance:bank.provenance};
}
