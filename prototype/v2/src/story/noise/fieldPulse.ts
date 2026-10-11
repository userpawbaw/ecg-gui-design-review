// Power-line field pulses (REVIEW-R1-STORY-20261011 S-05, user 2026-10-11): sphere shells centred on the power strip,
// fading as they travel out. Rhythm from the REF-003 sonar (rings 0.2 s apart): one eighth note = 0.2 s; four shells on
// four eighths, then five eighths in which only the emitted shells keep travelling, repeated twice. A shell never stops:
// its radius grows for its whole life (ease-out, not a hold), so the field reads as continuous. Illustration only — the
// pulse rate is a display rhythm, not 60 Hz and not a measured field.
export const EIGHTH=.2,PER_GROUP=4,REST=5,GROUPS=2,LIFE=2.6;
export function emissionTimes(start:number){
 const out:number[]=[];for(let g=0;g<GROUPS;g++)for(let k=0;k<PER_GROUP;k++)out.push(start+(g*(PER_GROUP+REST)+k)*EIGHTH);return out;
}
/** radius (m) and opacity of one shell at time t, or null when not alive */
export function shell(t:number,emit:number,rMax:number,r0=.04){
 const a=t-emit;if(a<0||a>LIFE)return null;
 const u=a/LIFE,e=1-(1-u)**2.2;                       // decelerating but strictly increasing until the end of life
 const r=r0+(rMax-r0)*e,fade=(1-r/rMax)**1.35;        // further out → more transparent (reaches 0 at rMax)
 return{r,a:Math.min(1,a/.12)*fade};                  // short fade-in at birth (no pop)
}
