import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const python=process.env.A_MODEL_PY||join(root,'.tools/python311',process.platform==='win32'?'python.exe':'bin/python');
if(!existsSync(python)){console.error('Blender 4.5 Python 3.11 실행 경로가 필요합니다. A_MODEL_PY 또는 .tools/python311을 준비하세요.');process.exit(1);}
const user=join(root,'.tools/blender-user');mkdirSync(user,{recursive:true});
const env={...process.env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8',BLENDER_USER_RESOURCES:user};
for(const script of ['build-a-climb.py',...(process.argv.includes('--verify')?['verify-a-climb.py']:[])]){
 const r=spawnSync(python,[join(root,'scripts/assets',script)],{cwd:root,env,stdio:'inherit'});
 if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);
}

