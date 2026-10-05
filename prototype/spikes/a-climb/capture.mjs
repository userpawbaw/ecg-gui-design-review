import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../../',import.meta.url)),out=path.join(root,process.env.A_QA_DIR||'verification/a-scene-20261005');
fs.mkdirSync(out,{recursive:true});
function findCli(){if(process.env.A_BROWSER_BIN)return process.env.A_BROWSER_BIN;
 const cache=path.resolve(root,'../.npm-browser-cache/_npx');if(fs.existsSync(cache))for(const d of fs.readdirSync(cache)){const p=path.join(cache,d,'node_modules/agent-browser/bin',process.platform==='win32'?'agent-browser-win32-x64.exe':'agent-browser-linux-x64');if(fs.existsSync(p))return p;}
 return 'agent-browser';}
const cli=findCli();
function run(args,json=false){const r=spawnSync(cli,['--session','a-climb',...args,...(json?['--json']:[])],{encoding:'utf8',cwd:root});
 if(r.error||r.status!==0)throw Error(r.error?.message||r.stderr||r.stdout);
 if(json){const x=JSON.parse(r.stdout);if(!x.success)throw Error(JSON.stringify(x));return x.data.result;}return r.stdout;}
const url=process.env.A_PREVIEW_URL||'http://127.0.0.1:4198/';
run(['open',url]);run(['set','viewport','1920','1080']);run(['wait','--fn','!!window.aPreview']);
const evalJs=s=>run(['eval',s],true);
assert.equal(evalJs('!!window.aPreview'),true,'A assets ready');
const states=[];
for(let i=0;i<12;i++){const p=i/11;const state=evalJs('window.aPreview.set('+p+',2.4,{volume:true,bloom:true,clay:false})');const file='sequence-'+String(i).padStart(2,'0')+'.png';run(['screenshot',path.join(out,file)]);states.push({file,state});}
for(const [name,opts] of Object.entries({'no-volume':{volume:false,bloom:true,clay:false},'no-bloom':{volume:true,bloom:false,clay:false},'clay':{volume:false,bloom:false,clay:true}})){
 const state=evalJs('window.aPreview.set(.35,2.4,'+JSON.stringify(opts)+')');const file=name+'.png';run(['screenshot',path.join(out,file)]);states.push({file,state});}
const offsets=evalJs('window.aPreview.state().rOffsets'),fsHz=evalJs('window.aPreview.state().fs'),beats=[];
for(const sample of offsets.filter(x=>x>fsHz).slice(0,3)){
 const before=evalJs('window.aPreview.set(.95,'+((sample-1)/fsHz)+',{volume:true,bloom:true,clay:false})');
 const at=evalJs('window.aPreview.set(.95,'+(sample/fsHz)+')');
 const after=evalJs('window.aPreview.set(.95,'+(sample/fsHz+.08)+')');
 assert.equal(at.sample,sample);assert.ok(at.beatAge<1e-6);assert.ok(at.heartScale>before.heartScale);assert.ok(at.heartScale>after.heartScale);
 beats.push({before,at,after});
}
const first=evalJs('window.aPreview.live(.95)');
await new Promise(r=>setTimeout(r,2200));
const later=evalJs('window.aPreview.state()');
assert.equal(first.p,later.p);assert.ok(later.t>first.t+1,'Playback continues with stationary scroll');
evalJs('window.aPreview.set(.95,2.4,{volume:true,bloom:true,clay:false})');
const errors=run(['errors']);assert.equal(errors.trim(),'','Browser errors');
run(['open',url+'?reduced=1']);run(['wait','--fn','!!window.aPreview']);
const reduced=evalJs('window.aPreview.set(1,2.4)');assert.equal(reduced.heartScale,1);
run(['screenshot',path.join(out,'reduced-motion.png')]);
const reducedErrors=run(['errors']);assert.equal(reducedErrors.trim(),'');
run(['open',url]);run(['wait','--fn','!!window.aPreview']);
evalJs("document.getElementById('wrap').scrollTop=1200");
await new Promise(r=>setTimeout(r,1300));
const nativeScroll=evalJs('window.aPreview.state()');assert.ok(nativeScroll.p>.1,'Native scroll drives camera');
run(['screenshot',path.join(out,'native-scroll.png')]);
const report={url,scope:'A4-A6 internal runtime, not final visual quality or target PC',states,beats,stationaryReplay:{first,later},nativeScroll,reduced,errors:errors.trim(),reducedErrors:reducedErrors.trim(),checks:'PASS render/load/R-onset/static-scroll replay/native scroll/reduced motion',limits:['CPU timing is not GPU timing','no 600-second/target-PC test','vertex contact is not complete triangle collision proof']};
fs.writeFileSync(path.join(out,'runtime_review.json'),JSON.stringify(report,null,2));
console.log('PASS: 17 captures / 3 R boundaries / stationary replay / native scroll / reduced motion / browser errors 0');

