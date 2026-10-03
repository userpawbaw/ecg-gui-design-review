// Stored record (D0 S038, white noise 0 dB, D-042) → one clock for everything that beats.
// The heart, the room pulse (Ha) and the page waveform are all functions of this clock, never a separate metronome
// (IDEA-R1-INTRO U7). Loop cut as in prototype/v2/src/story/intro/beats.ts: cut points sit the same distance before
// an R peak so the seam interval is a real R–R interval.
export type Ecg={fs:number,n:number,clean:Float32Array,input:Float32Array,out:Float32Array,r:number[],start:number,end:number,beats:number[],dur:number,method:string,snr:number,record:string,cond:string};
export async function loadEcg():Promise<Ecg>{
 const j=await (await fetch('./ecg-s038.json')).json();
 const f=(a:number[])=>Float32Array.from(a),clean=f(j.clean),input=f(j.input),out=f(j.out),fs=j.fs as number,r=j.r as number[];
 const lead=Math.round(.3*fs);let best:{a:number,b:number}|null=null,bc=Infinity;
 for(let a=0;a<r.length;a++)for(let b=r.length-1;b>a+2;b--){const s=r[a]-lead,e=r[b]-lead;if(s<0||e>=clean.length)continue;
  const jump=[clean,input,out].reduce((m,t)=>Math.max(m,Math.abs(t[e]-t[s])),0),cost=jump-(e-s)/fs*.02;if(cost<bc){bc=cost;best={a,b};}}
 if(!best)throw Error('no R-aligned loop');
 const start=r[best.a]-lead,end=r[best.b]-lead;
 return{fs,n:j.n,clean,input,out,r,start,end,beats:r.filter(i=>i>=start&&i<end),dur:(end-start)/fs,method:j.method,snr:j.snr,record:j.record,cond:j.cond};
}
/** playback time (s) → sample index (float) inside the loop */
export const idxAt=(e:Ecg,t:number)=>e.start+(((t%e.dur)+e.dur)%e.dur)*e.fs;
/** beat envelope: smooth attack then decay after each R, periodic over the loop; peak-normalised to ~1.
 *  The first version decayed from an instant jump at R (discontinuous) — dust and light snapped, then relaxed (F-034). */
const ATT=.07;
export function pulse(e:Ecg,t:number,tau=.28):number{
 const tt=((t%e.dur)+e.dur)%e.dur;let v=0;
 const peakD=ATT*Math.log(1+tau/ATT),peak=(1-Math.exp(-peakD/ATT))*Math.exp(-peakD/tau);
 for(const b of e.beats){const tr=(b-e.start)/e.fs;let d=tt-tr;if(d<0)d+=e.dur;v+=(1-Math.exp(-d/ATT))*Math.exp(-d/tau)/peak;}
 return Math.min(1.15,v);
}
