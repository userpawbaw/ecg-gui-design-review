const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'prototype/v2/public');fs.mkdirSync(dest,{recursive:true});
const parse=s=>JSON.parse(s.slice(s.indexOf('=')+1,s.indexOf(';\n')));
const base=parse(fs.readFileSync(path.join(root,'data/bank.js'),'utf8')),ext=parse(fs.readFileSync(path.join(root,'data/extension.js'),'utf8'));
const m=new Map(base.scenes.map(s=>[s.id,s]));for(const s of ext.scenes){const old=m.get(s.id);m.set(s.id,{...old,...s,traces:{...old?.traces,...s.traces}});}
fs.writeFileSync(path.join(dest,'archive.json'),JSON.stringify({...base,methods:ext.methods,scenes:[...m.values()]}));
// Extract only the fixed metadata object authored in the reviewed prototype.
const source=fs.readFileSync(path.join(root,'prototype/app.js'),'utf8');
const metadata=vm.runInNewContext('('+source.match(/const methods = (\{[\s\S]*?\n  \});/)[1]+')');
fs.mkdirSync(path.join(root,'prototype/v2/src'),{recursive:true});
fs.writeFileSync(path.join(root,'prototype/v2/src/methods.json'),JSON.stringify(metadata,null,2));
// Preserve access to all earlier evidence/acquisition/detail capabilities during migration.
fs.mkdirSync(path.join(dest,'legacy/data'),{recursive:true});
for(const name of ['index.html','style.css','app.js','core.js']){let s=fs.readFileSync(path.join(root,'prototype',name),'utf8');if(name==='index.html')s=s.replaceAll('../data/','data/');fs.writeFileSync(path.join(dest,'legacy',name),s);}
for(const name of ['bank.js','extension.js'])fs.copyFileSync(path.join(root,'data',name),path.join(dest,'legacy/data',name));
console.log('Prepared 98 archived scenes, method explanations and preserved legacy workspace.');
