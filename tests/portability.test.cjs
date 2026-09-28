// Windows portability guard (O-005): local commands must run from a Windows VS Code terminal
// (PowerShell 5.1 / cmd) without hand edits. Checks: npm scripts use no POSIX-only syntax or `python3`,
// no hard-coded Linux browser path without a fallback, and the records checker passes on a CRLF checkout.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');const bad=[];
const tracked=execFileSync('git',['ls-files'],{cwd:root,encoding:'utf8'}).split('\n').filter(Boolean);

// 1. npm scripts: cmd.exe runs them on Windows — no `python3`, env-prefix assignments, rm/cp/mv, single-quoted args, $VARS
const posix=[[/\bpython3\b/,'python3 (Windows: py/python) — use node scripts/local/run.mjs py'],[/(^|&&\s*)[A-Z_]+=\S+\s/,'VAR=value prefix'],[/\b(rm|cp|mv|mkdir -p|export)\s/,'POSIX command'],[/'[^']*'/,'single quotes (cmd.exe keeps them)'],[/\$[A-Z_{(]/,'shell variable']];
for(const f of tracked.filter(f=>/(^|\/)package\.json$/.test(f))){
 const scripts=JSON.parse(fs.readFileSync(path.join(root,f),'utf8')).scripts||{};
 for(const [k,v] of Object.entries(scripts))for(const [re,why] of posix)if(re.test(v))bad.push(`${f} scripts.${k}: ${why} → ${v}`);
}
// 2. browser paths: a Linux-only executable path must have an env/platform fallback
for(const f of tracked.filter(f=>/\.(mjs|cjs|js|ts)$/.test(f))){
 const s=fs.readFileSync(path.join(root,f),'utf8');
 s.split('\n').forEach((line,i)=>{if(line.includes('/opt/pw-browsers')&&!/PW_EXECUTABLE|process\.platform/.test(line)&&!f.startsWith('tests/'))bad.push(`${f}:${i+1}: hard-coded /opt/pw-browsers without PW_EXECUTABLE/platform fallback`);});
}
// 3. python candidates: Windows tries the py launcher first
import('../scripts/local/run.mjs').then(m=>{
 const w=m.pythonCandidates('win32').map(c=>c.join(' '));if(w[0]!=='py -3'||!w.includes('python'))bad.push('run.mjs: Windows python order must start with "py -3" and include "python"');
 // 4. data files parse the same with CRLF line ends (prepare-v2 failed on Windows: "Unexpected non-whitespace character after JSON")
 {const {parseDataFile}=require('../scripts/lib/data-file.cjs');
  for(const f of ['data/bank.js','data/extension.js']){const lf=fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
   try{const a=parseDataFile(lf),b=parseDataFile(lf.replace(/\n/g,'\r\n'));if(JSON.stringify(a)!==JSON.stringify(b))bad.push(f+': CRLF parse differs');}catch(e){bad.push(f+': '+e.message);}}}
 // 5. records checker on a CRLF copy of the checked files
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'crlf-'));
 for(const f of tracked.filter(f=>/\.(md|json)$/.test(f)&&!/^(prototype|data|dist|assets|verification)\//.test(f)&&fs.statSync(path.join(root,f)).size<2e6)){
  const src=path.join(root,f),dst=path.join(tmp,f);fs.mkdirSync(path.dirname(dst),{recursive:true});
  const buf=fs.readFileSync(src);/\.(md|json|txt)$/.test(f)?fs.writeFileSync(dst,buf.toString('utf8').replace(/\r?\n/g,'\r\n')):fs.writeFileSync(dst,buf);
 }
 try{execFileSync(process.execPath,[path.join(root,'scripts/check-uiux-records.cjs')],{env:{...process.env,UIUX_RECORDS_ROOT:tmp},encoding:'utf8',stdio:'pipe'});}
 catch(e){bad.push('records checker fails on a CRLF checkout:\n'+String(e.stdout||e.message).slice(0,800));}
 finally{fs.rmSync(tmp,{recursive:true,force:true});}
 if(bad.length){console.error('[portability] FAIL\n  '+bad.join('\n  '));process.exit(1);}
 console.log('[portability] PASS — npm scripts cmd.exe-safe, browser paths have fallbacks, python lookup order, records checker on CRLF');
});
