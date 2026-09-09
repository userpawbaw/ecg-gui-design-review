/* Narrow source/document audit. Palette checks are not a full accessibility certification. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const gitHash=p=>{const b=fs.readFileSync(path.join(root,p));return crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');};
const frozen=JSON.parse(read('verification/S2-freeze-receipt.json')).files.filter(f=>f.path.startsWith('independent/')||f.path.startsWith('data/')||['docs/02_independent_design.md','docs/03_acceptance_rubric.md'].includes(f.path));
for(const f of frozen)assert.equal(gitHash(f.path),f.sha,'Frozen file changed: '+f.path);
const docs=['README.md','PLAN.md','WORKLOG.md',...fs.readdirSync(path.join(root,'docs')).filter(p=>p.endsWith('.md')).map(p=>'docs/'+p)];
let localLinks=0;const generatedReport=path.join(root,'verification/deliverable-audit.json');
for(const file of docs)for(const match of read(file).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
 const href=match[1];if(/^(?:[a-z]+:|#)/i.test(href))continue;
 const target=path.resolve(root,path.dirname(file),href.split('#')[0]);
 // This audit creates its own linked report only after every check succeeds.
 if(target!==generatedReport)assert.ok(fs.existsSync(target),`${file}: missing ${href}`);localLinks++;
}
const receipt=JSON.parse(read('verification/portable-build.json'));
for(const input of receipt.inputs)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,input.path))).digest('hex'),input.sha256,'Stale build input '+input.path);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,receipt.file))).digest('hex'),receipt.sha256);
const css=read('prototype/style.css'),app=read('prototype/app.js'),vars=Object.fromEntries([...css.matchAll(/--([\w-]+):(#[\da-fA-F]{3,6})/g)].map(m=>[m[1],m[2]]));
const color=v=>vars[v]||v;
const luminance=hex=>{let s=hex.slice(1);if(s.length===3)s=[...s].map(x=>x+x).join('');const rgb=[0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
const pairs=[
 ['Body','ink','bg',4.5],['Paper body','ink','paper',4.5],['Muted text','muted','paper',4.5],['Muted on page','muted','bg',4.5],
 ['Accent text','accent','paper',4.5],['Selected text','#fff','accent',4.5],['Selected method','ink','accent-soft',4.5],
 ['Plot label','#b0c6d1','navy',4.5],['Input trace','input','navy',3],['FE trace','fe','navy',3],['Selected trace','output','navy',3],['Reference trace','reference','navy',3],['Comparison trace','#97c2ff','navy',3],
 ['Detail output','#087763','#f7faf8',3],['Detail input','#bd702e','#f7faf8',3],['Detail reference','#796395','#f7faf8',3],['Focus on white','#d67829','paper',3],['Focus on dark','#d67829','navy',3]
].map(([name,fg,bg,threshold])=>{fg=color(fg);bg=color(bg);assert.ok((css+app).includes(fg)&& (css+app).includes(bg),'Palette drift: '+name);const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=threshold,`${name} contrast ${ratio} < ${threshold}`);return {name,foreground:fg,background:bg,ratio,threshold,status:'PASS'};});
const report={status:'PASS',frozenFilesMatched:frozen.length,documentLocalLinksChecked:localLinks,portableInputsMatch:true,palettePairs:pairs,paletteScope:'18 selected opaque foreground/background pairs from source. No actual layout, all-state contrast, control-boundary or screen-reader certification.'};
fs.writeFileSync(path.join(root,'verification/deliverable-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:'PASS',frozenFiles:frozen.length,localLinks,palettePairs:pairs.length}));
