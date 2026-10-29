// S-16 / S-19 (user 2026-10-12/13): the intro and the Story scenes read the first LONG_S seconds of the same stored scene
// from the 600 s replay package (replay/manifest.json, hash-verified 30 s chunks; recovered from release
// archive-v2.2.1-recovery). Base record there is D0 S022 for every d0 scene, so intro and Story stay one person.
// Without the package (or with ?long=0) callers fall back to the stored 10 s bank. Samples are the stored ones either way.
import {loadScene,type Bank} from '../data';

export const LONG_S=40;
export type LongScene={record:string,traces:Record<string,Float32Array>,fs:number};
let manifest:Promise<Bank|null>|null=null;

function getManifest(){
 if(!manifest)manifest=(async()=>{
  if(new URLSearchParams(location.search).get('long')==='0')return null;
  const r=await fetch('./replay/manifest.json').catch(()=>null);if(!r||!r.ok)return null;
  const b=await r.json() as Bank;if(!b?.scenes?.length)return null;b.long=true;return b;
 })();
 return manifest;
}

/** first LONG_S seconds of each requested scene id that the package has; ids it lacks (or that fail the hash) are left out */
export async function loadLong(ids:string[]):Promise<Record<string,LongScene>>{
 const bank=await getManifest(),out:Record<string,LongScene>={};if(!bank)return out;
 const ac=new AbortController(),n=Math.round(LONG_S*bank.fs);
 for(const id of ids){const sc=bank.scenes.find(x=>x.id===id);if(!sc)continue;
  try{const l=await loadScene(bank,sc,ac.signal,0);if(l.offset!==0)continue;
   const traces:Record<string,Float32Array>={};for(const [k,v] of Object.entries(l.traces))traces[k]=v.slice(0,Math.min(n,v.length));
   out[id]={record:sc.record,traces,fs:bank.fs};}catch{/* a failed hash keeps the 10 s segment */}}
 return out;
}
