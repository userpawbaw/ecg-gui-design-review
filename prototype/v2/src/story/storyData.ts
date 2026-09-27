// R1 story data — derived only from stored values in archive.json (packet §1.1, F-025).
// Rankings use storedMetrics[*].snr_imp of one stored 10 s segment; oracle methods (B*) are excluded.
import type {Bank,Scene} from '../data';

export type Rank={id:string,value:number};
export type Beat={cond:string,sceneId:string,record:string,axis:string,snr:number,ranking:Rank[],winner:Rank,oracle:Rank[]};
export type Bar={id:string,value:number,std?:number};
export type Cell={cond:string,snr:number,sceneId:string,record:string,winner:string};
export type StoryData={
 attractSceneId:string,attractMethod:string,
 grid:{conds:string[],snrs:number[],cells:Cell[]},
 beats:Beat[],            // same synthetic record D0 S038 at 20 dB (F-025)
 support:Beat[],          // D1 real records, one record per noise type — always labelled with the record
 winCounts:{axis:string,total:number,counts:Record<string,number>},
 experiment:{scope:string,scaled:Bar[],psd:Bar[],m00:{scaled:number,strict:number}},
};

export const STORY_CONDITIONS=['pli','bw_synth','ma_synth'] as const;
export const STORY_SNR=20;
export const SUPPORT_SCENES=['d1-pli-5','d1-impulse-5','d1-bw_synth-20'];
export const ATTRACT_SCENE='d0-pli-0';   // AP-02: same record S038, noise visible (p2p 0.53 mV), no ranking claim
export const ATTRACT_METHOD='M04';
export const GRID_CONDS=['pli','bw_synth','ma_synth','em_synth','awgn','impulse','mixed'];

type Stored=Record<string,{snr_imp?:number|null}>;
const isOracle=(id:string)=>id.startsWith('B');

export function rankScene(s:Scene&{storedMetrics?:Stored}):{ranking:Rank[],oracle:Rank[]}{
 const stored=(s as {storedMetrics?:Stored}).storedMetrics;if(!stored)throw Error('storedMetrics missing for '+s.id);
 const all=Object.entries(stored).filter(([,v])=>typeof v?.snr_imp==='number').map(([id,v])=>({id,value:v.snr_imp as number}));
 const byValue=(a:Rank,b:Rank)=>b.value-a.value||a.id.localeCompare(b.id);
 return{ranking:all.filter(r=>!isOracle(r.id)).sort(byValue),oracle:all.filter(r=>isOracle(r.id)).sort(byValue)};
}

function beat(bank:Bank,id:string):Beat{
 const s=bank.scenes.find(x=>x.id===id);if(!s)throw Error('scene missing: '+id);
 const {ranking,oracle}=rankScene(s);return{cond:s.cond,sceneId:s.id,record:s.record,axis:s.axis,snr:s.snr,ranking,winner:ranking[0],oracle};
}

export function buildStory(bank:Bank):StoryData{
 const beats=STORY_CONDITIONS.map(c=>beat(bank,`d0-${c}-${STORY_SNR}`));
 const records=new Set(beats.map(b=>b.record));if(records.size!==1)throw Error('story beats must share one record (F-025)');
 const counts:Record<string,number>={};let total=0;const cells:Cell[]=[];
 for(const s of bank.scenes){if(s.axis!=='d1')continue;const w=rankScene(s).ranking[0];if(!w)continue;counts[w.id]=(counts[w.id]||0)+1;total++;cells.push({cond:s.cond,snr:s.snr,sceneId:s.id,record:s.record,winner:w.id});}
 const snrs=[...new Set(cells.map(c=>c.snr))].sort((a,b)=>a-b);
 const rows=bank.evidence.rows as Array<{metric:string,method:string,mean:number,std:number}>;
 const pick=(metric:string)=>rows.filter(r=>r.metric===metric&&!isOracle(r.method)&&r.method!=='M00'&&r.method!=='M04np'&&r.method!=='M05f').map(r=>({id:r.method,value:r.mean,std:r.std}));
 const m00=(metric:string)=>rows.find(r=>r.metric===metric&&r.method==='M00')?.mean;
 const scaled0=m00('snr_imp_scaled'),strict0=m00('snr_imp_strict');if(scaled0===undefined||strict0===undefined)throw Error('M00 evidence missing');
 return{
  attractSceneId:ATTRACT_SCENE,attractMethod:ATTRACT_METHOD,grid:{conds:GRID_CONDS.filter(c=>cells.some(x=>x.cond===c)),snrs,cells},beats,support:SUPPORT_SCENES.map(id=>beat(bank,id)),
  winCounts:{axis:'d1',total,counts},
  experiment:{scope:'EXP-A · D1 · TEST 22 · mixed noise −5…20 dB',scaled:pick('snr_imp_scaled').sort((a,b)=>b.value-a.value),psd:pick('psd_logdist').sort((a,b)=>a.value-b.value),m00:{scaled:scaled0,strict:strict0}},
 };
}
