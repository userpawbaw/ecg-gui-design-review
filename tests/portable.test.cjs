/* Executes the actual delivered HTML in a DOM host. No browser rendering or native download claim. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let jsdom;try{jsdom=require('jsdom');}catch(error){if(!process.env.ECG_QA_NODE_MODULES)throw error;jsdom=require(path.join(process.env.ECG_QA_NODE_MODULES,'jsdom'));}
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/ecg-signal-studio.html'),'utf8');
const build=JSON.parse(fs.readFileSync(path.join(root,'verification/portable-build.json'))),checks=[],errors=[],network=[],downloads=[];
const check=(name,fn)=>{fn();checks.push({name,status:'PASS'});};
const vc=new jsdom.VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new jsdom.JSDOM(html,{url:'https://portable-test.invalid/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const w=dom.window,d=w.document,$=id=>d.getElementById(id);
const forbidden=kind=>{network.push(kind);throw Error('Forbidden network: '+kind);};
w.fetch=()=>forbidden('fetch');w.XMLHttpRequest=class{constructor(){forbidden('XHR');}};w.EventSource=class{constructor(){forbidden('SSE');}};w.WebSocket=class{constructor(){forbidden('WebSocket');}};w.navigator.sendBeacon=()=>forbidden('beacon');
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
// Test host captures the app's exact serialization and requested filename, not a browser filesystem write.
w.Blob=class{constructor(parts,options){this.content=parts.join('');this.type=options?.type;}};
w.URL.createObjectURL=blob=>{downloads.push({blob});return 'blob:test-fixture';};w.URL.revokeObjectURL=()=>{};
w.HTMLAnchorElement.prototype.click=function(){downloads.at(-1).filename=this.download;};
check('Delivered bytes match build receipt; no runtime asset references',()=>{
 assert.equal(Buffer.byteLength(html),build.bytes);assert.equal(crypto.createHash('sha256').update(html).digest('hex'),build.sha256);
 assert.equal(d.querySelectorAll('script[src],link[href],img[src],iframe[src],source[src],audio[src],video[src]').length,0);
 assert.doesNotMatch(d.querySelector('style').textContent,/@import|url\(\s*['"]?(?:https?:)?\/\//i);
});
for(const script of d.querySelectorAll('script'))w.eval(script.textContent);
check('Portable app initializes actual 98 scenes and methods without requests',()=>{assert.deepEqual(errors,[]);assert.deepEqual(network,[]);assert.equal(w.ECG_BANK.scenes.length,98);assert.equal(d.querySelectorAll('[data-method]').length,12);assert.equal($('data-error').hidden,true);});
check('Portable controls recalculate real traces and retain the same input on method selection',()=>{
 const input=()=>d.querySelector('[data-trace="input"] path').getAttribute('d');
 const original=input();d.querySelector('[data-snr="0"]').click();assert.notEqual(input(),original);assert.match($('record').textContent,/111/);
 const changed=input();d.querySelector('[data-method="M04"]').click();assert.equal(input(),changed);assert.match($('focus-method').textContent,/M04/);assert.notEqual($('strict').textContent,'—');
});
check('Portable export serializes notes, scope and nonfabricated metadata into the requested JSON',()=>{
 d.querySelector('[data-workspace="acquisition"]').click();$('acquisition-scenario').value='gap';$('acquisition-scenario').dispatchEvent(new w.Event('change'));$('replay-open').click();$('export-open').click();
 $('review-note').value='ACQ-06 / 4–5초 gap 검토';$('review-note').dispatchEvent(new w.Event('input'));
 $('export-download').click();assert.equal(downloads.length,1);
 const item=downloads[0],value=JSON.parse(item.blob.content);assert.equal(item.filename,'ecg-review-d1-mixed-0.json');assert.match(item.blob.type,/application\/json/);
 assert.equal(value.notes,'ACQ-06 / 4–5초 gap 검토');assert.equal(value.scope.currentWorkspace,'acquisition');assert.equal(value.scope.currentViewSource,'NO_DEVICE_SESSION');
 assert.equal(value.context.acquisitionPreview.scenario,'gap');assert.equal(value.context.acquisitionPreview.replayOpen,true);assert.equal(value.context.acquisitionPreview.deviceSession,null);
 for(const key of ['runId','checkpointHash','lead','noiseSeed','annotations'])assert.equal(value.source[key],null);
 assert.equal(value.source.sourceBlob,'4a94d1b79db95b8cb8afa5e8f944955d756c5db6');assert.ok(value.uiEvents.length>0);assert.match(value.scope.localMetrics,/not current acquisition/);
});
check('Team guide describes every actual component exactly once',()=>{
 const guide=fs.readFileSync(path.join(root,'docs/06_team_guide.md'),'utf8');
 const actual=[...d.querySelectorAll('[data-component]')].map(e=>e.dataset.component).sort();
 const described=[...guide.matchAll(/^\| ((?:G|LAB|EVD|ACQ|OPS)-\d+) ·/gm)].map(m=>m[1]).sort();
 assert.equal(actual.length,38);assert.equal(new Set(actual).size,38);assert.deepEqual(actual,described);
});
check('Offline operations made no network requests or DOM runtime errors',()=>{assert.deepEqual(network,[]);assert.deepEqual(errors,[]);});
w.close();
const report={status:'PASS',artifact:build.file,artifactSha256:build.sha256,engine:'jsdom 30.0.1; actual portable script execution, no rendered browser',dialogAndDownloadHostShims:true,checks,componentsMatched:38,notVerified:['native file download','native dialog/focus/Escape','pixel layout','browser performance','hardware']};
fs.writeFileSync(path.join(root,'verification/portable-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:checks.length,componentsMatched:38,sha256:build.sha256}));
