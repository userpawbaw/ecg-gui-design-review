import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));const require=createRequire(import.meta.url);
const {parseDataFile}=require(path.join(root,'scripts/lib/data-file.cjs'));
const base=parseDataFile(fs.readFileSync(path.join(root,'data/bank.js'),'utf8'));
const ext=parseDataFile(fs.readFileSync(path.join(root,'data/extension.js'),'utf8'));
const id='d0-mixed-0',a=base.scenes.find(s=>s.id===id),b=ext.scenes.find(s=>s.id===id);
if(!a)throw Error('Stored mixed scene missing');const scene={...a,...b,traces:{...a.traces,...b?.traces}};
const winner=Object.entries(scene.storedMetrics).filter(([k,v])=>!k.startsWith('B')&&typeof v.snr_imp==='number').sort((a,b)=>b[1].snr_imp-a[1].snr_imp)[0][0];
fs.mkdirSync('public',{recursive:true});fs.writeFileSync('public/wave.json',JSON.stringify({id,fs:base.fs,n:base.n,scale:scene.scale,winner,record:scene.record,input:scene.traces.input,clean:scene.traces.clean,output:scene.traces[winner]}));
console.log('Prepared stored '+id+' / '+winner);

