import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../../',import.meta.url)),out=path.join(root,'verification/a-aa-20261005');fs.mkdirSync(out,{recursive:true});
const cache=path.resolve(root,'../.npm-browser-cache/_npx');
let cli=process.env.A_BROWSER_BIN;
if(!cli&&fs.existsSync(cache))for(const d of fs.readdirSync(cache)){const f=path.join(cache,d,'node_modules/agent-browser/bin',process.platform==='win32'?'agent-browser-win32-x64.exe':'agent-browser-linux-x64');if(fs.existsSync(f)){cli=f;break;}}
cli||='agent-browser';
function run(args,json=false){const r=spawnSync(cli,['--session','a-climb',...args,...(json?['--json']:[])],{encoding:'utf8',cwd:root});if(r.error||r.status!==0)throw Error(r.error?.message||r.stderr||r.stdout);if(json){const x=JSON.parse(r.stdout);if(!x.success)throw Error(JSON.stringify(x));return x.data.result;}return r.stdout;}
const js=s=>run(['eval',s],true),url=process.env.A_PREVIEW_URL||'http://127.0.0.1:4198/';
const report={scope:'AA comparison; identical 1920x1080/DPR/path/time/48 steps. Not target-PC quality proof',modes:[],diagnostics:[]};
for(const mode of ['none','msaa','smaa','hybrid']){
 run(['open',url+'?aa='+mode]);run(['set','viewport','1920','1080']);run(['wait','--fn','!!window.aPreview']);run(['wait','1000']);
 const states=[];
 for(let i=0;i<12;i++){const state=js('window.aPreview.set('+i/11+',2.4,{frame:12,steps:48,grain:false,jitter:true})');run(['screenshot',path.join(out,mode+'-'+String(i).padStart(2,'0')+'.png')]);states.push(state);}
 // Fixed scene/time, changing sample frames diagnoses ray-march variance separately from camera motion.
 for(const f of [0,1,2,3]){js('window.aPreview.set(.35,2.4,{frame:'+f+',steps:48,grain:false,jitter:true})');run(['screenshot',path.join(out,mode+'-jitter-'+f+'.png')]);}
 const errors=run(['errors']);assert.equal(errors.trim(),'');
 const gpu=js("(()=>{const g=document.getElementById('gl').getContext('webgl2'),e=g.getExtension('WEBGL_debug_renderer_info');return {renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),gpuTimer:!!g.getExtension('EXT_disjoint_timer_query_webgl2')};})()");
 report.modes.push({mode,states,errors:errors.trim(),gpu});
}
run(['open',url+'?aa=msaa']);run(['wait','--fn','!!window.aPreview']);
for(const [name,opts] of Object.entries({noVolume:{volume:false,grain:false,steps:48},noBloom:{volume:true,bloom:false,grain:false,steps:48},stable48:{volume:true,bloom:true,grain:false,jitter:false,steps:48},stable64:{jitter:false,steps:64},temporal64:{jitter:true,steps:64},temporal96:{jitter:true,steps:96},grain:{jitter:true,steps:64,grain:true}})){
 const state=js('window.aPreview.set(.35,2.4,'+JSON.stringify({...opts,frame:12})+')');run(['screenshot',path.join(out,'diag-'+name+'.png')]);report.diagnostics.push({name,state});
}
fs.writeFileSync(path.join(out,'comparison.json'),JSON.stringify(report,null,2));
console.log('PASS: 64 candidate + 7 diagnostic captures; no browser errors');
