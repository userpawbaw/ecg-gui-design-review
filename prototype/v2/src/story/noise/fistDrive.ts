// Muscle-artifact scene: the fist follows the stored noise (REVIEW-R1-STORY-20261011 S-14, user 2026-10-12).
// "주먹 쥐는 속도는 일정하게, 다만 … 노이즈가 … 0.2초만 나오고 다시 잦아든다면 전부 쥐지 말고 0.2/0.6 해서 1/3만 쥐다가 다시 펴게"
// The noise is the stored input minus the stored clean trace (no model output involved). A burst is where its short RMS
// envelope stays above a threshold; while a burst lasts the fist closes at a constant speed (CLOSE_S to close completely)
// and when it ends the fist opens. Speeds are the clench timing measured from the video (D-053: 0.56 s to close fully,
// 0.39 s to open fully; user 2026-10-12: "기존에 쥐던 속도"), so a 0.2 s burst closes it to 0.2/0.56 ≈ 36 % and a long one holds it shut.
// Display only: the hand is a picture of the cause, it does not drive or change any sample.
export const CLOSE_S=.56,OPEN_S=.39,ENV_WIN_S=.1,MERGE_S=.08,MIN_S=.05;
export type Burst={start:number,end:number,peak:number};

/** centred RMS envelope of (input − clean) over ENV_WIN_S */
export function noiseEnvelope(input:Float32Array,clean:Float32Array,fs:number){
 const n=input.length,w=Math.max(1,Math.round(ENV_WIN_S*fs)),h=w>>1,sq=new Float64Array(n+1),e=new Float32Array(n);
 for(let i=0;i<n;i++){const d=input[i]-clean[i];sq[i+1]=sq[i]+d*d;}
 for(let i=0;i<n;i++){const a=Math.max(0,i-h),b=Math.min(n,i+h+1);e[i]=Math.sqrt(Math.max(0,(sq[b]-sq[a])/(b-a)));}
 return e;
}

/** bursts: envelope above `on` (fraction of the range above the quiet floor), ends below `off`; short gaps merge */
export function findBursts(env:Float32Array,fs:number,on=.3,off=.18):Burst[]{
 const s=Float32Array.from(env).sort(),floor=s[Math.floor(s.length*.2)],top=s[Math.floor(s.length*.995)],span=Math.max(1e-9,top-floor);
 const hi=floor+on*span,lo=floor+off*span,out:Burst[]=[];let a=-1,pk=0;
 for(let i=0;i<env.length;i++){
  if(a<0){if(env[i]>=hi){a=i;pk=env[i];}}
  else{pk=Math.max(pk,env[i]);if(env[i]<lo){out.push({start:a/fs,end:i/fs,peak:(pk-floor)/span});a=-1;}}
 }
 if(a>=0)out.push({start:a/fs,end:env.length/fs,peak:(pk-floor)/span});
 const merged:Burst[]=[];
 for(const b of out){const p=merged[merged.length-1];if(p&&b.start-p.end<MERGE_S){p.end=b.end;p.peak=Math.max(p.peak,b.peak);}else merged.push({...b});}
 return merged.filter(b=>b.end-b.start>=MIN_S).map(b=>({...b,peak:Math.min(1,b.peak)}));
}

/** fist closure 0..1 sampled at `rate` Hz over [0, T): constant-speed close during bursts, constant-speed open after */
export function fistTrack(bursts:Burst[],T:number,rate=100){
 const n=Math.ceil(T*rate),f=new Float32Array(n),up=1/(CLOSE_S*rate),down=1/(OPEN_S*rate);let v=0,k=0;
 for(let i=0;i<n;i++){const t=i/rate;while(k<bursts.length&&bursts[k].end<=t)k++;
  const on=k<bursts.length&&bursts[k].start<=t;v=on?Math.min(1,v+up):Math.max(0,v-down);f[i]=v;}
 return f;
}

/** F1 (D-072, user 2026-10-17 "주먹을 다 쥐었을 때와 잡음이 생겨나는 시점이 동기화되고 잡음이 사라지는 시점부터 주먹을 펴도록"):
 *  every burst gets a full clench — closing starts CLOSE_S early so the fist is shut when the noise starts (the noise is stored,
 *  so its start is known), it holds while the noise lasts and opens over OPEN_S after it ends. Between close bursts the hand
 *  opens part way and closes again (depth = gap / (OPEN_S + CLOSE_S)); gaps under HOLD_GAP_S would only twitch, so they hold. */
export const HOLD_GAP_S=.25;
export function fistTrackHold(bursts:Burst[],T:number,rate=100){
 const seg:{s:number,e:number}[]=[];
 for(const b of bursts){const p=seg[seg.length-1];if(p&&b.start-p.e<HOLD_GAP_S)p.e=b.end;else seg.push({s:b.start,e:b.end});}
 const all=[-1,0,1].flatMap(k=>seg.map(x=>({s:x.s+k*T,e:x.e+k*T})));   // the loop wraps: neighbours across the seam count
 const n=Math.ceil(T*rate),f=new Float32Array(n);
 for(let i=0;i<n;i++){const t=i/rate;let v=0;
  for(const x of all){const p=t<x.s?1-(x.s-t)/CLOSE_S:t<=x.e?1:1-(t-x.e)/OPEN_S;if(p>v)v=p;}
  f[i]=Math.max(0,Math.min(1,v));}
 return f;
}

export function createFistDrive(input:Float32Array,clean:Float32Array,fs:number,mode='F1'){
 const T=input.length/fs,env=noiseEnvelope(input,clean,fs),bursts=findBursts(env,fs),track=mode==='F0'?fistTrack(bursts,T):fistTrackHold(bursts,T),RATE=100;
 // noise level 0..1 (quiet floor → loud top), the same envelope the bursts come from, for the red marker's strength
 const sorted=Float32Array.from(env).sort(),floor=sorted[Math.floor(sorted.length*.2)],top=sorted[Math.floor(sorted.length*.995)];
 const level=env.map(v=>Math.min(1,Math.max(0,(v-floor)/Math.max(1e-9,top-floor))));
 const at=(arr:Float32Array,t:number,rate:number)=>{const x=(((t%T)+T)%T)*rate,i=Math.floor(x),j=(i+1)%arr.length,u=x-i;return arr[i%arr.length]*(1-u)+arr[j]*u;};
 return{
  bursts,T,
  /** fist closure at loop time t */
  fist:(t:number)=>at(track,t,RATE),
  /** noise level 0..1 at loop time t (the stored noise's envelope) */
  level:(t:number)=>at(level,t,fs),
  /** the burst that started last at or before t (for the red band up the forearm): time since its start, its size */
  burstAt(t:number){const x=((t%T)+T)%T;let b:Burst|null=null;for(const c of bursts){if(c.start<=x)b=c;else break;}
   return b?{since:x-b.start,active:x<b.end,len:b.end-b.start,peak:b.peak}:null;},
 };
}
