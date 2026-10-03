// T2 beat-stepped cross-fade (ported from prototype/v2/src/story/intro/waveUi.ts createBeatMix): scroll sets the target,
// the heart's R peaks release it one quarter at a time, each step flashes the trace.
import type {Ecg} from './ecg';
/** absolute clock time of the most recent R at or before t (the loop repeats) */
export function prevR(e:Ecg,t:number):number{
 const tt=((t%e.dur)+e.dur)%e.dur;let best=-1e9;
 for(const b of e.beats){const r=(b-e.start)/e.fs;if(r<=tt&&r>best)best=r;}
 return best>-1e8?t-tt+best:t-tt+(e.beats.length?(e.beats[e.beats.length-1]-e.start)/e.fs:0)-e.dur;
}
export function createBeatMix(steps=4){
 let shown=0,from=0,goal=0,stepT=-1,lastBeat=NaN,flash=0;
 return{
  update(target:number,prev:number,t:number){
   if(t<stepT){stepT=-1;from=shown=goal;}
   const q=Math.round(target*steps)/steps;
   if(prev!==lastBeat){lastBeat=prev;
    if(Math.abs(q-goal)>1e-6){from=shown;goal=Math.round((goal+Math.sign(q-goal)/steps)*steps)/steps;stepT=prev;}}
   const k=stepT<0?1:Math.min(1,Math.max(0,(t-stepT)/.16)),e=1-(1-k)**3;
   shown=from+(goal-from)*e;flash=stepT<0?0:Math.exp(-Math.max(0,t-stepT)/.15);
  },
  get value(){return shown;},get goal(){return goal;},get flash(){return flash;},
 };
}
