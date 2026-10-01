#!/usr/bin/env node
// Cross-platform local runner (Windows PowerShell / cmd / VS Code terminal, macOS, Linux).
// Every local step is one `npm run …` line, so no `&&`, no `python3`, no POSIX-only syntax is needed in the terminal.
//   npm run doctor               — check Node, npm, Python, OpenCV, Playwright browser, line endings, encoding
//   npm run story                — prepare data if missing, install v2 deps if missing, start the R1 story (opens browser)
//   npm run story:check          — typecheck + build + unit tests + browser tests (if a browser is available)
//   npm run spike -- video-scrub — install deps if missing and start a spike dev server
//   npm run py -- <script> [args]— run a Python script with the right interpreter and UTF-8 forced
//   npm run v2:prepare           — build prototype/v2/public (keeps the checked-in methods.json)
//   npm run ref:capture -- <url|story> [--mode frames|trace] …  — frame-level capture of a reference site or our app (tools/reference-capture)
//   npm run ref:sheet -- <folder> [<app folder>]               — 12-frame sheets / side-by-side comparison sheets
import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {findEdge} from '../../tools/reference-capture/lib/browser.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const win=process.platform==='win32';
const [cmd,...args]=process.argv.slice(2);
const env={...process.env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8'};
const say=(s)=>console.log(s),ok=(s)=>console.log('  [OK]   '+s),warn=(s)=>console.log('  [확인] '+s),bad=(s)=>console.log('  [문제] '+s);

// npm/npx are .cmd shims on Windows; Node ≥ 18.20/20.12 requires shell:true to spawn them.
function run(bin,argv,opts={}){
 const r=spawnSync(bin,argv,{stdio:'inherit',env,cwd:opts.cwd||root,shell:win&&/^(npm|npx)$/.test(bin)});
 if(r.error)throw r.error;if(r.status!==0&&!opts.allowFail){console.error(`\n실패: ${bin} ${argv.join(' ')} (종료 코드 ${r.status})`);process.exit(r.status||1);}return r.status;
}
function capture(bin,argv){const r=spawnSync(bin,argv,{encoding:'utf8',env,shell:win&&/^(npm|npx)$/.test(bin)});return r.error||r.status!==0?null:(r.stdout||'').trim();}

// Python: prefer the Windows launcher (py -3), then python, then python3. The Microsoft Store stub prints an
// install hint and exits non-zero, so a candidate counts only if `--version` succeeds.
export function pythonCandidates(platform=process.platform){return platform==='win32'?[['py','-3'],['python'],['python3']]:[['python3'],['python']];}
function findPython(){for(const [bin,...pre] of pythonCandidates()){const v=capture(bin,[...pre,'--version']);if(v&&/^Python 3\./.test(v))return{bin,pre,version:v};}return null;}

function ensureDeps(dir){if(!existsSync(join(dir,'node_modules'))){say(`의존성 설치: ${dir.replace(root,'.')}`);run('npm',['install','--no-audit','--no-fund'],{cwd:dir});}}
function ensureV2Data(){const pub=join(root,'prototype/v2/public/archive.json');if(!existsSync(pub)){say('자료 준비: prototype/v2/public (archive.json)');run(process.execPath,[join(root,'scripts/prepare-v2.cjs')]);}}
function browserPath(){
 // Ask the installed Playwright which browser build it expects (a different build in the cache does not count).
 if(process.env.PW_EXECUTABLE&&existsSync(process.env.PW_EXECUTABLE))return process.env.PW_EXECUTABLE;
 try{const req=createRequire(join(root,'prototype/v2/package.json'));const p=req('playwright-core').chromium.executablePath();return p&&existsSync(p)?p:null;}catch{return null;}
}

function doctor(){
 say('\n로컬 환경 점검 — ECG GUI design review\n');
 const [major]=process.versions.node.split('.').map(Number);
 major>=22?ok(`Node ${process.version}`):bad(`Node ${process.version} — 22 이상 필요(권장 24). https://nodejs.org 에서 LTS 설치`);
 const npmV=capture('npm',['--version']);npmV?ok(`npm ${npmV}`):bad('npm을 찾지 못함 — Node 설치 시 함께 설치됨');
 const py=findPython();
 if(py){ok(`${py.version} (${[py.bin,...py.pre].join(' ')})`);
  const cv=capture(py.bin,[...py.pre,'-c','import cv2,numpy;print(cv2.__version__,numpy.__version__)']);
  cv?ok(`OpenCV·numpy ${cv} (영상 도구용)`):warn(`OpenCV 없음 — 영상 도구(video-scrub 클립)를 쓸 때만 필요: npm run py:setup`);
 }else warn('Python 3 없음 — 영상 도구·Blender 스크립트를 쓸 때만 필요. https://www.python.org 설치 시 "py launcher" 포함');
 const b=browserPath();b?ok(`Playwright 브라우저: ${b}`):warn('Playwright가 쓰는 브라우저가 설치돼 있지 않음 — 브라우저 테스트를 쓸 때만: npm run browsers');
 const edge=findEdge();edge?ok(`Microsoft Edge: ${edge} (ref:capture가 창을 띄워 실제 GPU로 캡처)`):warn('Edge를 찾지 못함 — ref:capture는 Playwright Chromium으로 대체됨(GPU 정보 확인 필요). Chromium: npm run browsers');
 const eol=capture('git',['config','--get','core.autocrlf']);
 // check files a pull does not rewrite (package.json was re-written as LF when it changed)
 const crlf=['data/bank.js','AGENTS.md','prototype/v2/src/main.tsx'].some(f=>existsSync(join(root,f))&&readFileSync(join(root,f),'utf8').slice(0,200000).includes('\r\n'));
 crlf?warn(`작업 폴더 파일이 CRLF(core.autocrlf=${eol}) — 이 저장소 도구는 CRLF도 처리하지만, LF로 맞추려면 LOCAL_WINDOWS.md §4`):ok(`줄바꿈 LF (core.autocrlf=${eol??'미설정'}; .gitattributes가 LF 고정)`);
 if(win){const cp=capture('cmd',['/c','chcp']);cp&&!/65001/.test(cp)?warn(`터미널 코드 페이지 ${cp.replace(/\D+/g,'')} (cp949). 이 저장소 명령은 UTF-8을 강제하므로 그대로 써도 됨`):ok('터미널 UTF-8');
  say('\n  참고: PowerShell에서 "스크립트를 실행할 수 없으므로" 오류가 나면 LOCAL_WINDOWS.md §3');}
 ok(`PYTHONUTF8=1 (npm run 경유 시 자동)`);
 say('\n다음: npm run story   (R1 Story 실행)\n');
}

function story(){ensureV2Data();const v2=join(root,'prototype/v2');ensureDeps(v2);say('\nR1 Story: http://127.0.0.1:5173/  (Lab부터: ?route=lab, 단계 이동: ?step=3)  — 멈추려면 Ctrl+C\n');run('npm',['run','dev','--','--open'],{cwd:v2});}
function storyCheck(){
 ensureV2Data();const v2=join(root,'prototype/v2');ensureDeps(v2);
 run('npm',['run','build'],{cwd:v2});
 const unit=run('npm',['test'],{cwd:v2,allowFail:true});
 if(unit!==0)warn('단위 테스트 일부 실패 — 600초 replay 자료가 없으면 chunks 테스트 1개는 원래 실패합니다(위 출력 확인)');
 const b=browserPath();if(!b){warn('브라우저 테스트 건너뜀 — npm run browsers 후 다시 실행');return;}
 run('npx',['playwright','test','--reporter=list'],{cwd:v2});
}
function spike(name){
 const dir=join(root,'prototype/spikes',name||'');if(!name||!existsSync(join(dir,'package.json'))){bad('사용법: npm run spike -- <이름>   ('+readdirSync(join(root,'prototype/spikes')).join(', ')+')');process.exit(1);}
 ensureDeps(dir);if(name==='video-scrub'&&!existsSync(join(dir,'public/clips')))run('npm',['run','clips'],{cwd:dir});
 run('npm',['run','dev','--','--open'],{cwd:dir});
}
// Reference / app frame capture. Both tools use the Playwright already installed in prototype/v2.
function refTool(file){if(args[0]==='story')ensureV2Data();ensureDeps(join(root,'prototype/v2'));process.exit(run(process.execPath,[join(root,'tools/reference-capture',file),...args],{allowFail:true}));}
function py(argv){const p=findPython();if(!p){bad('Python 3를 찾지 못함 — npm run doctor');process.exit(1);}const code=run(p.bin,[...p.pre,...argv],{allowFail:true,cwd:process.env.INIT_CWD||root});process.exit(code);}
function pySetup(){const p=findPython();if(!p){bad('Python 3를 찾지 못함');process.exit(1);}run(p.bin,[...p.pre,'-m','pip','install','--upgrade','-r',join(root,'tools/video-qa/requirements-local.txt')]);}

const table={doctor,'ref:capture':()=>refTool('capture.mjs'),'ref:sheet':()=>refTool('sheet.mjs'),story,'story:check':storyCheck,spike:()=>spike(args[0]),py:()=>py(args),'py:setup':pySetup,browsers:()=>run('npx',['playwright','install','chromium'],{cwd:join(root,'prototype/v2')}),'v2:prepare':()=>run(process.execPath,[join(root,'scripts/prepare-v2.cjs'),...args])};
if(fileURLToPath(import.meta.url)===resolve(process.argv[1]||'')){
 if(!table[cmd]){say('사용법: npm run doctor | story | story:check | spike -- <이름> | py -- <스크립트> | py:setup | browsers | v2:prepare | ref:capture -- <url|story> | ref:sheet -- <폴더>');process.exit(cmd?1:0);}
 table[cmd]();
}
