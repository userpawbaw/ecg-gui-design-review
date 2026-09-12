import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {loadScene,verifiedChunk,type Bank} from '../src/data';
import {decode,visiblePoints} from '../src/engine';
const root=path.resolve('public');
test('hashed chunks preserve source samples across 30s boundaries and 600s end',async()=>{
 const bank:Bank=JSON.parse(fs.readFileSync(path.join(root,'replay/manifest.json'),'utf8'));assert.equal(bank.scenes.length,98);
 const scene=bank.scenes.find(s=>s.id==='d1-mixed--5')!;const original=JSON.parse(fs.readFileSync(path.join(root,'long',scene.id+'.json'),'utf8'));
 const originalFetch=globalThis.fetch;let requests=0;
 globalThis.fetch=async(url)=>{requests++;const bytes=fs.readFileSync(path.join(root,String(url).replace('./','')));return new Response(bytes);};
 try{
  for(const t of [0,29.996,30,59.996,60,299.996,300,599.996,600]){
   const d=await loadScene(bank,scene,new AbortController().signal,t);assert.ok(d.traces.input.length<=22500,'bounded window, not whole 600s');
   for(const id of ['clean','input','M04','M08']){const full=decode(original.traces[id],original.scale,150000);for(const p of visiblePoints(t,10,250,150000,'sweep'))assert.equal(d.traces[id][p.index-d.offset],full[p.index],`${id} at ${t}/${p.index}`);}
  }
  assert.ok(requests<27,'overlapping windows reused cached chunks');
  const c={...scene.chunks![0],path:scene.chunks![0].path,sha256:'0'.repeat(64)};await assert.rejects(verifiedChunk(c,new AbortController().signal),/해시/);
 }finally{globalThis.fetch=originalFetch;}
});
