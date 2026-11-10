// Story wave panel interaction (REVIEW-R1-STORY-20261011 S-06 / S-07 / S-08, D-063). Pure state, no DOM — unit tested.
//   'wait'    panel not yet processing
//   'auto'    first visit only: the heart's R peaks release the input → output cross-fade one quarter at a time
//   'scroll'  then the wheel/keys move a target and the cross-fade follows it like Lenis (REF-003 RCP-01, lerp 0.1 per 60 Hz
//             frame): fast at first, slowing into place, settled ~0.3 s after the wheel stops; reversible. (Was 2.5 % steps,
//             D-055 — user 2026-10-12: "여러 단계로 적용되긴 했는데 … 부드러움은 … 가속도를 적용해서")
//   'overlay' at the clean end the viewer may show both traces at once; scrolling is ignored until they go back
// The next scene is never reached by scrolling: only the explicit button (S-07). Mode changes fade over FADE_S, so no
// trace appears or disappears at once (S-08). The values are display weights only; the traces are stored samples.
export type WavePhase='wait'|'auto'|'scroll'|'overlay';
export const STEPS=4,STEP_S=.16,SCROLL_SPAN=900,SCROLL_LERP=.1,FADE_S=.45,END_AT=.98;
// 2026-11-10 (user): after the 4th beat the scroll hint shows; until the first scroll the input fades back in slowly (AWAIT_DELAY,
// then over AWAIT_FADE_S) and stays overlaid; the first scroll takes it out faster than the overlay button's FADE_S (LEAVE_S)
export const AWAIT_DELAY=.8,AWAIT_FADE_S=2.4,LEAVE_S=.18;
// 2026-11-10 (user, implement then review): in scroll mode, a wheel pause of IDLE_HOLD drifts the display toward an even 50:50
// overlay over IDLE_FADE_S; the wheel position is kept, so the next scroll returns there (plus the new delta) within LEAVE_S
export const IDLE_HOLD=1,IDLE_FADE_S=1.6,IDLE_MIX=.5;
const clamp=(x:number,a=0,b=1)=>Math.min(b,Math.max(a,x));

export function createWaveMode(){
 let phase:WavePhase='wait',
  shown=0,from=0,goal=0,stepT=-1,lastBeat=NaN,flash=0,       // auto (beat-released quarters)
  pos=1,mix=0,                                               // scroll: wheel position and the eased mix
  ov=0,ovGoal=0,ovRate=FADE_S,                              // overlay weight, seconds for a full fade
  awaiting=false,awaitT=0,                                   // auto done, no scroll yet
  now=0,lastScroll=-1e9,idleK=0;                            // pause drift (0 = following the wheel, 1 = 50:50)
 return{
  /** procOn: the panel may start processing; prevR: time of the last R peak (s); t: scene clock; dt: frame time. */
  update(o:{procOn:boolean,prevR:number,t:number,dt:number,reduced:boolean}){
   const {t,dt,reduced}=o;now=t;
   if(phase==='wait'&&o.procOn){phase='auto';lastBeat=o.prevR;}            // the first quarter waits for the next beat
   if(phase==='auto'){
    if(reduced){shown=goal=1;}
    else{
     if(o.prevR!==lastBeat){lastBeat=o.prevR;if(goal<1){from=shown;goal=Math.min(1,Math.round((goal+1/STEPS)*STEPS)/STEPS);stepT=o.prevR;}}
     const k=stepT<0?1:clamp((t-stepT)/STEP_S),e=1-(1-k)**3;shown=from+(goal-from)*e;
     flash=stepT<0?0:Math.exp(-Math.max(0,t-stepT)/.15);
    }
    mix=shown;
    if(goal>=1&&shown>=1-1e-3){phase='scroll';pos=1;mix=1;flash=0;awaiting=true;awaitT=t;}
   }else if(phase==='scroll'||phase==='overlay'){
    const g=pos;mix=reduced?g:mix+(g-mix)*(1-(1-SCROLL_LERP)**(Math.max(0,dt)*60));if(Math.abs(g-mix)<1e-3)mix=g;   // frame-rate independent Lenis lerp; the last 0.1 % snaps (Lenis stops the same way)
    flash=0;
    const idle=phase==='scroll'&&!awaiting&&t-lastScroll>=IDLE_HOLD;
    idleK=reduced?(idle?1:0):clamp(idleK+(idle?dt/IDLE_FADE_S:-dt/LEAVE_S));
   }else idleK=0;
   if(awaiting&&phase==='scroll'&&t-awaitT>=AWAIT_DELAY){ovGoal=1;ovRate=AWAIT_FADE_S;}
   ov=reduced?ovGoal:ov+Math.sign(ovGoal-ov)*Math.min(Math.abs(ovGoal-ov),Math.max(0,dt)/ovRate);
  },
  /** wheel/keys: positive = forward (toward the clean output). Ignored before 'scroll' and while overlaid. */
  scroll(deltaPx:number){if(phase!=='scroll')return false;lastScroll=now;if(awaiting){awaiting=false;ovGoal=0;ovRate=LEAVE_S;}pos=clamp(pos+deltaPx/SCROLL_SPAN);return true;},
  /** overlay toggle: only from the clean end (S-08); going back returns to scroll mode at the clean end. */
  toggleOverlay(){
   if(phase==='scroll'&&this.atEnd){phase='overlay';ovGoal=1;ovRate=FADE_S;awaiting=false;return true;}
   if(phase==='overlay'){phase='scroll';ovGoal=0;ovRate=FADE_S;pos=1;lastScroll=now;return true;}
   return false;
  },
  get phase(){return phase;},
  /** waiting for the first scroll after the auto pass (the scroll hint shows) */
  get awaiting(){return awaiting&&phase==='scroll';},
  /** cross-fade 0 = input, 1 = output (scroll/auto); quarters filled for the 4-cell strip */
  /** displayed cross-fade (the wheel-following value drifted toward 50:50 during a pause) */
  get mix(){const e=idleK*idleK*(3-2*idleK);return mix+(IDLE_MIX-mix)*e;},
  /** the wheel-following cross-fade, kept through a pause */
  get followed(){return mix;},get idle(){return idleK;},get flash(){return flash;},get overlay(){return ov;},
  get quarters(){return phase==='wait'?0:phase==='auto'?Math.round(goal*STEPS):Math.floor(mix*STEPS+1e-6);},
  /** buttons are offered at the clean end of scroll mode, and stay while overlaid */
  get atEnd(){return phase==='overlay'||(phase==='scroll'&&pos>=1-1e-6&&mix>=END_AT);},
  /** display weights for the two stored traces: (input, output); blur only when one of them is fading */
  weights(){
   const m=this.mix,ai=(1-m)*(1-ov)+.62*ov,ao=m*(1-ov)+1*ov;
   return{input:ai,output:ao,blurIn:m*(1-ov),blurOut:(1-m)*(1-ov)};
  },
  reset(){phase='wait';shown=from=goal=0;stepT=-1;lastBeat=NaN;flash=0;pos=1;mix=0;ov=ovGoal=0;ovRate=FADE_S;awaiting=false;awaitT=0;now=0;lastScroll=-1e9;idleK=0;},
 };
}
export type WaveMode=ReturnType<typeof createWaveMode>;
