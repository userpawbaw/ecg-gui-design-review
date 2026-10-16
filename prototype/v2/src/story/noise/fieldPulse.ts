// Power-line field pulses (REVIEW-R1-STORY-20261011 S-05, user 2026-10-11): sphere shells centred on the power strip,
// fading as they travel out. Rhythm from the REF-003 sonar (rings 0.2 s apart): one eighth note = 0.2 s; four shells on
// four eighths, then five eighths in which only the emitted shells keep travelling, repeated twice. A shell never stops:
// its radius grows for its whole life (ease-out, not a hold), so the field reads as continuous. Illustration only — the
// pulse rate is a display rhythm, not 60 Hz and not a measured field.
export const EIGHTH=.2,PER_GROUP=4,REST=5,GROUPS=2,LIFE=2.6;
export function emissionTimes(start:number){
 const out:number[]=[];for(let g=0;g<GROUPS;g++)for(let k=0;k<PER_GROUP;k++)out.push(start+(g*(PER_GROUP+REST)+k)*EIGHTH);return out;
}
/** D2 (user 2026-10-16 "3회만 두드렸다가 멈추고 다시 두드리는 것을 반복 … 2초 주기"): three shells an eighth apart, then rest,
 * every 2 s from start until the scene ends. idx-th emission time (idx = 0, 1, 2, …). */
export const TAPS=3,CYCLE=2;
export const tapTime=(start:number,idx:number)=>start+CYCLE*Math.floor(idx/TAPS)+(idx%TAPS)*EIGHTH;
/** index of the latest emission at or before t (−1 before the first) */
export function lastTap(start:number,t:number){if(t<start)return -1;const k=Math.floor((t-start)/CYCLE),j=Math.min(TAPS-1,Math.floor((t-start-k*CYCLE)/EIGHTH));return k*TAPS+j;}
/** radius (m) and opacity of one shell at time t, or null when not alive */
export function shell(t:number,emit:number,rMax:number,r0=.04,fadeK=1.35){
 const a=t-emit;if(a<0||a>LIFE)return null;
 const u=a/LIFE,e=1-(1-u)**2.2;                       // decelerating but strictly increasing until the end of life
 const r=r0+(rMax-r0)*e,fade=(1-r/rMax)**fadeK;       // further out → more transparent (reaches 0 at rMax)
 return{r,a:Math.min(1,a/.12)*fade};                  // short fade-in at birth (no pop)
}
