import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';
import {buildStory,rankScene} from '../src/story/storyData';
const file=new URL('../public/archive.json',import.meta.url);
const bank=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):null;
test('story beats share one synthetic record and match stored winners (F-025)',{skip:!bank&&'run scripts/prepare-v2.cjs first'},()=>{
 const s=buildStory(bank);
 assert.deepEqual(s.beats.map(b=>b.record),['S038','S038','S038']);assert.ok(s.beats.every(b=>b.axis==='d0'&&b.snr===20));
 assert.deepEqual(s.beats.map(b=>[b.cond,b.winner.id,b.winner.value.toFixed(2)]),[['pli','M04','19.45'],['bw_synth','M_FE','23.20'],['ma_synth','M06L6','9.91']]);
 assert.ok(s.beats.every(b=>b.ranking.every(r=>!r.id.startsWith('B'))),'oracle excluded from ranking');
 assert.ok(s.beats.every(b=>b.ranking.length===10));
});
test('D1 win counts and EXP-A bars equal stored values',{skip:!bank&&'run scripts/prepare-v2.cjs first'},()=>{
 const s=buildStory(bank);
 assert.equal(s.winCounts.total,49);assert.deepEqual(s.winCounts.counts,{M06L6:18,M09:8,M04:8,M08:7,M06:4,M_FE:3,M01:1});
 assert.equal(s.experiment.scaled[0].id,'M08');assert.equal(s.experiment.psd.at(-1)!.id,'M01');
 assert.equal(Math.round(s.experiment.m00.scaled*100)/100,2.56);assert.ok(Math.abs(s.experiment.m00.strict)<1e-9);
 assert.deepEqual(s.support.map(b=>[b.record,b.winner.id]),[['219','M04'],['123','M06L6'],['202','M_FE']]);
});
test('ranking ties break by id and oracle is separated',()=>{
 const r=rankScene({id:'x',axis:'d0',cond:'pli',snr:0,record:'r',scale:1,traces:{},storedMetrics:{M02:{snr_imp:1},M01:{snr_imp:1},B01:{snr_imp:9},M03:{snr_imp:null}}} as never);
 assert.deepEqual(r.ranking.map(x=>x.id),['M01','M02']);assert.deepEqual(r.oracle.map(x=>x.id),['B01']);
});
