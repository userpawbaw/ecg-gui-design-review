// R-peak times from the stored clean trace (D-041). The heart beats at these times and the sweep draws the same
// samples, so both are functions of one clock — no separate metronome (IDEA-R1-INTRO U7).
// The record (D0 S038) contains a wide ectopic beat with a negative QRS, so peaks are found on |x − median|.

export function detectR(x:Float32Array,fs:number):number[]{
 const n=x.length,sorted=Float32Array.from(x).sort(),med=sorted[n>>1];
 // slope energy, smoothed over ~40 ms
 const e=new Float32Array(n),w=Math.max(1,Math.round(.04*fs));
 for(let i=1;i<n-1;i++)e[i]=Math.abs(x[i+1]-x[i-1]);
 const s=new Float32Array(n);let acc=0;
 for(let i=0;i<n;i++){acc+=e[i];if(i>=w)acc-=e[i-w];s[i]=acc/w;}
 let max=0;for(const v of s)max=Math.max(max,v);
 const thr=.35*max,refractory=Math.round(.25*fs),out:number[]=[];
 for(let i=0;i<n;){
  if(s[i]<thr){i++;continue;}
  let j=i;while(j<n&&s[j]>=thr*.5)j++;             // one QRS region
  let best=i,bv=-1;for(let k=Math.max(0,i-w);k<Math.min(n,j+w);k++){const d=Math.abs(x[k]-med);if(d>bv){bv=d;best=k;}}
  if(!out.length||best-out[out.length-1]>=refractory)out.push(best);
  i=Math.max(j,best+refractory);
 }
 return out;
}

export type Loop={start:number,end:number,beats:number[]};   // sample indices; beats inside [start,end)

// Loop between two cut points placed the same distance before an R peak, so the interval across the seam is a real
// R–R interval of the record. Among candidates, pick the longest loop whose seam jump (over every given trace) is smallest.
export function makeLoop(r:number[],traces:Float32Array[],fs:number):Loop{
 const lead=Math.round(.3*fs);let best:Loop|null=null,bestCost=Infinity;
 for(let a=0;a<r.length;a++)for(let b=r.length-1;b>a+2;b--){
  const start=r[a]-lead,end=r[b]-lead;if(start<0||end>=traces[0].length)continue;
  const jump=traces.reduce((m,t)=>Math.max(m,Math.abs(t[end]-t[start])),0);
  const cost=jump-(end-start)/fs*.02;                 // prefer long loops when the seam is equally clean
  if(cost<bestCost){bestCost=cost;best={start,end,beats:r.filter(i=>i>=start&&i<end)};}
 }
 if(!best)throw Error('no R-aligned loop');
 return best;
}

// Map continuous playback time (s) to a sample index inside the loop.
export const loopLength=(l:Loop,fs:number)=>(l.end-l.start)/fs;
export function sampleAt(l:Loop,fs:number,t:number){const len=l.end-l.start;const k=Math.floor(t*fs+1e-6);return l.start+((k%len)+len)%len;}
// Last R at or before t and the next R after t, on the same integer sample grid as the sweep head
// (floor(t·fs + 1e-6)), so the frame that draws an R sample is exactly the frame the beat starts.
export function beatPhase(l:Loop,fs:number,t:number){
 const len=l.end-l.start,abs=Math.floor(t*fs+1e-6),cyc=Math.floor(abs/len),local=abs-cyc*len;
 const off=l.beats.map(i=>i-l.start);
 let prevAbs=-Infinity,nextAbs=Infinity;
 for(const o of off){if(o<=local)prevAbs=cyc*len+o;else{nextAbs=cyc*len+o;break;}}
 if(prevAbs===-Infinity)prevAbs=(cyc-1)*len+off[off.length-1];
 if(nextAbs===Infinity)nextAbs=(cyc+1)*len+off[0];
 const prev=prevAbs/fs,next=nextAbs/fs;
 return{prev,next,sincePrev:Math.max(0,t-prev),untilNext:next-t};
}
