import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const final=process.env.A_AA_FINAL==='1';
const root=fileURLToPath(new URL('../../../',import.meta.url)),out=process.env.A_MOTION_DIR?path.join(root,process.env.A_MOTION_DIR):path.join(root,'verification/a-aa-20261005',final?'final':''),cache=path.resolve(root,'../.npm-browser-cache/_npx');let cli=process.env.A_BROWSER_BIN;
if(!cli)for(const d of fs.readdirSync(cache)){const f=path.join(cache,d,'node_modules/agent-browser/bin',process.platform==='win32'?'agent-browser-win32-x64.exe':'agent-browser-linux-x64');if(fs.existsSync(f)){cli=f;break;}}
function js(code){const r=spawnSync(cli,['--session','a-climb','eval',code,'--json'],{encoding:'utf8',cwd:root,maxBuffer:16*1024*1024});if(r.status!==0)throw Error(r.stderr||r.stdout);const x=JSON.parse(r.stdout);if(!x.success)throw Error(JSON.stringify(x));return x.data.result;}
const metadata=[];
for(const mode of final?['msaa']:['none','msaa']){
 const src='http://127.0.0.1:4198/@fs/'+path.join(out,mode+'-motion.webm').replaceAll('\\','/');
 const info=js(`(async()=>{window.aaReviewVideo?.remove();const v=document.createElement('video');v.muted=true;v.src=${JSON.stringify(src)};window.aaReviewVideo=v;document.body.append(v);await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j;});return {width:v.videoWidth,height:v.videoHeight};})()`);metadata.push({mode,...info});
 for(let i=0;i<12;i++){const sec=.4+i*.65;const data=js(`(async()=>{const v=window.aaReviewVideo;const done=new Promise(r=>v.onseeked=r);v.currentTime=${sec};await done;const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);return c.toDataURL('image/jpeg',.92);})()`);fs.writeFileSync(path.join(out,mode+'-video-'+String(i).padStart(2,'0')+'.jpg'),Buffer.from(data.split(',')[1],'base64'));}
}
fs.writeFileSync(path.join(out,'video-review.json'),JSON.stringify(metadata,null,2));console.log(metadata.length*12+' decoded moving-video review frames saved');
