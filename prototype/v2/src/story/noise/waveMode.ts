// Story wave panel interaction (REVIEW-R1-STORY-20261011 S-06 / S-07 / S-08, D-063). Pure state, no DOM — unit tested.
//   'wait'    panel not yet processing
//   'auto'    first visit only: the heart's R peaks release the input → output cross-fade one quarter at a time
//   'scroll'  then the wheel/keys move the cross-fade (2.5 % steps, eased, reversible — the intro's D-055 rule)
//   'overlay' at the clean end the viewer may show both traces at once; scrolling is ignored until they go back
// The next scene is never reached by scrolling: only the explicit button (S-07). Mode changes fade over FADE_S, so no
// trace appears or disappears at once (S-08). The values are display weights only; the traces are stored samples.
export type WavePhase='wait'|'auto'|'scroll'|'overlay';
export const STEPS=4,STEP_S=.16,SCROLL_SPAN=900,SCROLL_STEP=.025,SCROLL_TAU=.08,FADE_S=.45,END_AT=.98;
const clamp=(x:number,a=0,b=1)=>Math.min(b,Math.max(a,x));

export function createWaveMode(){
 let phase:WavePhase='wait',
  shown=0,from=0,goal=0,stepT=-1,lastBeat=NaN,flash=0,       // auto (beat-released quarters)
  pos=1,mix=0,                                               // scroll: wheel position and the eased mix
  ov=0,ovGoal=0;                                             // overlay weight
 const step=(x:number,k:number)=>Math.round(clamp(x)/k)*k;
 return{
  /** procOn: the panel may start processing; prevR: time of the last R peak (s); t: scene clock; dt: frame time. */
  update(o:{procOn:boolean,prevR:number,t:number,dt:number,reduced:boolean}){
   const {t,dt,reduced}=o;
   if(phase==='wait'&&o.procOn){phase='auto';lastBeat=o.prevR;}            // the first quarter waits for the next beat
   if(phase==='auto'){
    if(reduced){shown=goal=1;}
    else{
     if(o.prevR!==lastBeat){lastBeat=o.prevR;if(goal<1){from=shown;goal=Math.min(1,Math.round((goal+1/STEPS)*STEPS)/STEPS);stepT=o.prevR;}}
     const k=stepT<0?1:clamp((t-stepT)/STEP_S),e=1-(1-k)**3;shown=from+(goal-from)*e;
     flash=stepT<0?0:Math.exp(-Math.max(0,t-stepT)/.15);
    }
    mix=shown;
    if(goal>=1&&shown>=1-1e-3){phase='scroll';pos=1;mix=1;flash=0;}
   }else if(phase==='scroll'||phase==='overlay'){
    const g=step(pos,SCROLL_STEP);mix=reduced?g:mix+(g-mix)*(1-Math.exp(-Math.max(0,dt)/SCROLL_TAU));if(Math.abs(g-mix)<1e-4)mix=g;
    flash=0;
   }
   ov=reduced?ovGoal:ov+Math.sign(ovGoal-ov)*Math.min(Math.abs(ovGoal-ov),Math.max(0,dt)/FADE_S);
  },
  /** wheel/keys: positive = forward (toward the clean output). Ignored before 'scroll' and while overlaid. */
  scroll(deltaPx:number){if(phase!=='scroll')return false;pos=clamp(pos+deltaPx/SCROLL_SPAN);return true;},
  /** overlay toggle: only from the clean end (S-08); going back returns to scroll mode at the clean end. */
  toggleOverlay(){
   if(phase==='scroll'&&this.atEnd){phase='overlay';ovGoal=1;return true;}
   if(phase==='overlay'){phase='scroll';ovGoal=0;pos=1;return true;}
   return false;
  },
  get phase(){return phase;},
  /** cross-fade 0 = input, 1 = output (scroll/auto); quarters filled for the 4-cell strip */
  get mix(){return mix;},get flash(){return flash;},get overlay(){return ov;},
  get quarters(){return phase==='wait'?0:phase==='auto'?Math.round(goal*STEPS):Math.floor(mix*STEPS+1e-6);},
  /** buttons are offered at the clean end of scroll mode, and stay while overlaid */
  get atEnd(){return phase==='overlay'||(phase==='scroll'&&step(pos,SCROLL_STEP)>=1&&mix>=END_AT);},
  /** display weights for the two stored traces: (input, output); blur only when one of them is fading */
  weights(){
   const ai=(1-mix)*(1-ov)+.62*ov,ao=mix*(1-ov)+1*ov;
   return{input:ai,output:ao,blurIn:mix*(1-ov),blurOut:(1-mix)*(1-ov)};
  },
  reset(){phase='wait';shown=from=goal=0;stepT=-1;lastBeat=NaN;flash=0;pos=1;mix=0;ov=ovGoal=0;},
 };
}
export type WaveMode=ReturnType<typeof createWaveMode>;
