import type {Loaded} from '../data';
import type {Transport} from '../engine';

export type SignalView={sceneId:string;source:'archive'|'replay';fs:number;totalSamples:number;offset:number;input:Float32Array;output:Float32Array;reference:Float32Array;methodId:string;record:string;noise:string;snr:number;provenance:Record<string,unknown>};
export type AttractSession={sceneId:string;methodId:string;timeSeconds:number;playing:boolean;speed:number;amplitudeMv:number;spanSeconds:number;loopRange:{start:number;end:number}|null};
export function createSignalView(data:Loaded,methodId:string):SignalView{
 const {input,clean}=data.traces,output=data.traces[methodId];
 if(!input||!clean||!output||input.length!==clean.length||input.length!==output.length)throw Error('동일 구간의 입력·출력·Reference 자료가 필요합니다.');
 if(data.offset<0||data.offset+input.length>data.n||!(data.fs>0))throw Error('신호의 시간 범위가 올바르지 않습니다.');
 return{sceneId:data.scene.id,source:data.n>2500?'replay':'archive',fs:data.fs,totalSamples:data.n,offset:data.offset,input,output,reference:clean,methodId,record:data.scene.record,noise:data.scene.cond,snr:data.scene.snr,provenance:data.provenance};
}
export function sampleAt(view:SignalView,absoluteIndex:number){
 const i=absoluteIndex-view.offset;
 if(i<0||i>=view.input.length||absoluteIndex>=view.totalSamples)return null;
 return{absoluteIndex,timeSeconds:absoluteIndex/view.fs,input:view.input[i],output:view.output[i],reference:view.reference[i]};
}
export type SignalGeometry={left:number;top:number;width:number;height:number;amplitudeMv:number;spanSeconds:number;windowStart:number;startIndex:number;endIndex:number};
export function geometry(view:SignalView,timeSeconds:number,rect:{width:number;height:number},amplitudeMv:number,spanSeconds:number):SignalGeometry{
 const duration=view.totalSamples/view.fs;
 const span=Math.min(Math.max(spanSeconds,.1),duration);
 const windowStart=Math.max(0,Math.min(duration-span,timeSeconds-span));
 return{left:48,top:34,width:Math.max(1,rect.width-66),height:Math.max(1,rect.height-98),amplitudeMv,spanSeconds:span,windowStart,startIndex:Math.max(view.offset,Math.ceil(windowStart*view.fs)),endIndex:Math.min(view.offset+view.input.length-1,view.totalSamples-1,Math.floor(timeSeconds*view.fs))};
}
export function sampleX(g:SignalGeometry,index:number,fs:number){return g.left+(index/fs-g.windowStart)/g.spanSeconds*g.width;}
export function valueY(g:SignalGeometry,value:number){return g.top+g.height/2-value/g.amplitudeMv*g.height/2;}
export function captureSession(view:SignalView,transport:Transport,amplitudeMv:number,spanSeconds:number):AttractSession{
 return{sceneId:view.sceneId,methodId:view.methodId,timeSeconds:transport.time,playing:transport.playing,speed:transport.speed,amplitudeMv,spanSeconds,loopRange:transport.loopRange?{...transport.loopRange}:null};
}
export function handoffSession(snapshot:AttractSession,view:SignalView,transport:Transport):AttractSession{
 if(snapshot.sceneId!==view.sceneId||snapshot.methodId!==view.methodId)throw Error('진입한 장면과 방법이 달라졌습니다.');
 const i=Math.floor(transport.time*view.fs);
 if(!sampleAt(view,Math.min(view.totalSamples-1,i)))throw Error('현재 시각의 재생 청크를 준비하는 중입니다.');
 transport.loopRange=snapshot.loopRange;
 transport.speed=snapshot.speed;
 return{...snapshot,timeSeconds:transport.time,playing:transport.playing};
}
