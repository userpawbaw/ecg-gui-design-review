import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url)),out=path.join(root,process.env.A_PLANET_DIR||'verification/a-arrival-20261006/planet-diagnostics');fs.mkdirSync(out,{recursive:true});
const cache=path.resolve(root,'../.npm-browser-cache/_npx');let cli;for(const d of fs.readdirSync(cache)){const f=path.join(cache,d,'node_modules/agent-browser/bin/agent-browser-win32-x64.exe');if(fs.existsSync(f)){cli=f;break;}}
function run(args,json=false){const r=spawnSync(cli,['--session','a-climb',...args,...(json?['--json']:[])],{encoding:'utf8',cwd:root,maxBuffer:32*1024*1024});if(r.error||r.status!==0)throw Error(r.error?.message||r.stderr||r.stdout);if(json){const x=JSON.parse(r.stdout);if(!x.success)throw Error(JSON.stringify(x));return x.data.result;}return r.stdout;}
const js=s=>run(['eval',s],true),states=[];
for(const model of ['legacy','new']){
 run(['open','http://127.0.0.1:4198/?timing=1'+(model==='legacy'?'&planet=legacy':'')]);run(['set','viewport','1920','1080']);run(['wait','--fn','!!window.aPreview']);
 for(const p of [0,.23,.30])for(const mode of ['base','no-atmosphere','no-specular','no-cloud','no-bloom']){
  const opts={frame:12,grain:false,atmosphere:mode!=='no-atmosphere',specular:mode!=='no-specular',cloud:mode!=='no-cloud',bloom:mode!=='no-bloom',flare:true};
  const state=js(`window.aPreview.set(${p},2.4,${JSON.stringify(opts)})`),file=`${model}-${p}-${mode}.png`;run(['screenshot',path.join(out,file)]);states.push({file,opts,state});
 }
}
const errors=run(['errors']).trim();fs.writeFileSync(path.join(out,'review.json'),JSON.stringify({states,errors,scope:'Effect contributions within each model. Different cameras prevent pixel fidelity comparison across models.'},null,2));if(errors)throw Error(errors);console.log('PASS 30 planet effect separation frames, errors0');
