// Add the rest of the pinned source archive without changing the S2 frozen bank.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=path.resolve(process.argv[2]||'../review-source');
const raw=fs.readFileSync(path.join(source,'demo/demo_bank.js'));
const hash=crypto.createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex');
if(hash!=='4a94d1b79db95b8cb8afa5e8f944955d756c5db6')throw Error('Source bytes differ');
const parse=s=>JSON.parse(s.slice(s.indexOf('=')+1,s.lastIndexOf(';')));
const original=parse(raw.toString('utf8')),base=parse(fs.readFileSync(path.join(root,'data/bank.js'),'utf8'));
const extensions=original.scenes.map(s=>{
 const existing=base.scenes.find(b=>b.id===s.id),keys=Object.keys(s.traces).filter(k=>!existing?.traces[k]);
 return {id:s.id,axis:s.axis,cond:s.cond,snr:s.snr,record:s.record,seg:s.seg,scale:s.scale,selection:s.selection,ref_exp:s.ref_exp,
 traces:Object.fromEntries(keys.map(k=>[k,s.traces[k]])),storedMetrics:s.metrics,ref_mean:s.ref_mean};
});
const extension={methods:original.methods,conditions:original.conds,snrs:original.snrs,scenes:extensions};
const loader=`\n(() => { const b=window.ECG_BANK,e=window.ECG_EXTENSION; const byId=new Map(b.scenes.map(s=>[s.id,s])); for(const s of e.scenes){ const old=byId.get(s.id); byId.set(s.id, old?{...old,...s,traces:{...old.traces,...s.traces}}:s); } window.ECG_BANK={...b,methods:e.methods,conditions:e.conditions,snrs:e.snrs,scenes:[...byId.values()]}; delete window.ECG_EXTENSION; })();\n`;
fs.writeFileSync(path.join(root,'data/extension.js'),'window.ECG_EXTENSION = '+JSON.stringify(extension)+';'+loader);
console.log(JSON.stringify({sourceScenes:original.scenes.length,methods:original.methods,snrs:original.snrs,extensionBytes:fs.statSync(path.join(root,'data/extension.js')).size}));
