import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const final=process.env.A_AA_FINAL==='1';
const root=fileURLToPath(new URL('../../../',import.meta.url)),out=path.join(root,'verification/a-aa-20261005',final?'final':'');fs.mkdirSync(out,{recursive:true});
const cache=path.resolve(root,'../.npm-browser-cache/_npx');let cli=process.env.A_BROWSER_BIN;
if(!cli)for(const d of fs.readdirSync(cache)){const f=path.join(cache,d,'node_modules/agent-browser/bin',process.platform==='win32'?'agent-browser-win32-x64.exe':'agent-browser-linux-x64');if(fs.existsSync(f)){cli=f;break;}}
function run(args,json=false){const r=spawnSync(cli,['--session','a-climb',...args,...(json?['--json']:[])],{encoding:'utf8',cwd:root,maxBuffer:32*1024*1024,timeout:60000});if(r.error||r.status!==0)throw Error(r.error?.message||r.stderr||r.stdout);if(json){const x=JSON.parse(r.stdout);if(!x.success)throw Error(JSON.stringify(x));return x.data.result;}return r.stdout;}
const js=s=>run(['eval',s],true),url=process.env.A_PREVIEW_URL||'http://127.0.0.1:4198/';const report=[];
for(const mode of final?['msaa']:['none','msaa','smaa','hybrid']){
 run(['open',url+'?aa='+mode+'&timing=1']);run(['set','viewport','1920','1080']);run(['wait','--fn','!!window.aPreview']);run(['wait','1200']);
 js('window.aPreview.set(0,0,{steps:'+(final?96:48)+',grain:'+final+',jitter:true,volume:true,frame:null})');
 const video=js(`(async()=>{const canvas=document.getElementById('gl'),stream=canvas.captureStream(30),mime='video/webm;codecs=vp9';if(!MediaRecorder.isTypeSupported(mime))throw Error('VP9 unavailable');const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:12000000}),chunks=[];const done=new Promise(r=>recorder.onstop=async()=>{const blob=new Blob(chunks,{type:mime});const reader=new FileReader();reader.onload=()=>r({data:reader.result,state:window.aPreview.state(),bytes:blob.size});reader.readAsDataURL(blob);});recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();window.aPreview.path(8);await new Promise(r=>setTimeout(r,8300));recorder.stop();const result=await done;stream.getTracks().forEach(t=>t.stop());return result;})()`);
 fs.writeFileSync(path.join(out,mode+'-motion.webm'),Buffer.from(video.data.split(',')[1],'base64'));
 const errors=run(['errors']).trim();if(errors)throw Error(errors);
 report.push({mode,file:mode+'-motion.webm',bytes:video.bytes,state:video.state,errors,scope:'3D canvas only, 8s rear-to-side path, VP9 recording overhead included'});
 // Unrecorded same path benchmark avoids MediaRecorder overhead, still headless/single local GPU.
 js('window.aPreview.path(8)');run(['wait','8300']);report.at(-1).unrecorded=js('window.aPreview.state()');
 console.log(mode+' motion + GPU/RAF benchmark captured');
}
run(['open',url+'?aa=msaa']);run(['wait','--fn','!!window.aPreview']);
if(!final)for(const steps of [64,96])for(const frame of [0,1,2,3]){js('window.aPreview.set(.35,2.4,{steps:'+steps+',frame:'+frame+',grain:false,jitter:true})');run(['screenshot',path.join(out,'steps'+steps+'-jitter-'+frame+'.png')]);}
fs.writeFileSync(path.join(out,'motion.json'),JSON.stringify(report,null,2));
