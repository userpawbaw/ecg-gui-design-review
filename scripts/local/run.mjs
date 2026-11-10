#!/usr/bin/env node
// Cross-platform local runner (Windows PowerShell / cmd / VS Code terminal, macOS, Linux).
// Every local step is one `npm run …` line, so no `&&`, no `python3`, no POSIX-only syntax is needed in the terminal.
//   npm run doctor               — check Node, npm, Python, OpenCV, Playwright browser, line endings, encoding
//   npm run story                — prepare data if missing, install v2 deps if missing, start the R1 story (opens browser)
//   npm run story:check          — typecheck + build + unit tests + browser tests (if a browser is available)
//   npm run spike -- video-scrub — install deps if missing and start a spike dev server
//   npm run py -- <script> [args]— run a Python script with the right interpreter and UTF-8 forced
//   npm run v2:prepare           — build prototype/v2/public (keeps the checked-in methods.json)
import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

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
 const eol=capture('git',['config','--get','core.autocrlf']);
 // check files a pull does not rewrite (package.json was re-written as LF when it changed)
 const crlf=['data/bank.js','AGENTS.md','prototype/v2/src/main.tsx'].some(f=>existsSync(join(root,f))&&readFileSync(join(root,f),'utf8').slice(0,200000).includes('\r\n'));
 crlf?warn(`작업 폴더 파일이 CRLF(core.autocrlf=${eol}) — 이 저장소 도구는 CRLF도 처리하지만, LF로 맞추려면 LOCAL_WINDOWS.md §4`):ok(`줄바꿈 LF (core.autocrlf=${eol??'미설정'}; .gitattributes가 LF 고정)`);
 if(win){const cp=capture('cmd',['/c','chcp']);cp&&!/65001/.test(cp)?warn(`터미널 코드 페이지 ${cp.replace(/\D+/g,'')} (cp949). 이 저장소 명령은 UTF-8을 강제하므로 그대로 써도 됨`):ok('터미널 UTF-8');
  say('\n  참고: PowerShell에서 "스크립트를 실행할 수 없으므로" 오류가 나면 LOCAL_WINDOWS.md §3');}
 ok(`PYTHONUTF8=1 (npm run 경유 시 자동)`);
 say('\n다음: npm run story   (R1 Story 실행)\n');
}

// D-161 파형 그리기 비교: story:wave-prev / story:wave-all / story:wave-live 는 같은 앱을 ?wave=… 주소로 연다(waveMode.ts).
const WAVE_NOTE={prev:'이전 버전 — 실시간·실험실 모두 최적화 전 그리기',all:'최적화를 실험실 탭에도 — 두 탭 모두 링 스트립(기본값, npm run story 와 같음)',live:'실시간 탭에만 최적화 — 실험실은 기존 그리기'};
// 2026-11-10 사용자 「각 모드로 바로 진입하는 명령어」: 잡음 장면 · 실험실로 바로 연다(주소만 다르다)
const DIRECT={'story:pli':['/?story=noise&cond=pli','잡음 장면 — 전원선 간섭'],'story:bw':['/?story=noise&cond=bw','잡음 장면 — 기저선 변동'],
 'story:ma':['/?story=noise&cond=ma','잡음 장면 — 근육 잡음'],'story:noise':['/?story=noise&cond=all','잡음 장면 3개 연속(전원선 → 기저선 → 근육)'],'story:lab':['/?route=lab','실험실']};
function story(wave,direct){ensureV2Data();const v2=join(root,'prototype/v2');ensureDeps(v2);
 const path=direct?DIRECT[direct][0]:wave?`/?wave=${wave}`:'/';if(direct)say(`\n바로 진입: ${DIRECT[direct][1]}`);
 say(`\nR1 Story: http://127.0.0.1:5173${path}  (Lab부터: ?route=lab, 단계 이동: ?step=3, 잡음 장면: ?story=noise&cond=pli|bw|ma)  — 멈추려면 Ctrl+C`);
 if(wave)say(`파형 그리기: ${WAVE_NOTE[wave]}. 실시간 측정 탭은 브리지가 떠 있어야 파형이 나옵니다.`);say('');
 run('npm',['run','dev','--','--open',path],{cwd:v2});}
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
function py(argv){const p=findPython();if(!p){bad('Python 3를 찾지 못함 — npm run doctor');process.exit(1);}const code=run(p.bin,[...p.pre,...argv],{allowFail:true,cwd:process.env.INIT_CWD||root});process.exit(code);}
function pySetup(){const p=findPython();if(!p){bad('Python 3를 찾지 못함');process.exit(1);}run(p.bin,[...p.pre,'-m','pip','install','--upgrade','-r',join(root,'tools/video-qa/requirements-local.txt')]);}

// 원본 저장소의 브리지(scripts/serial_bridge.py)를 이 저장소에서 한 줄로 띄운다(docs/DEMO_BRIDGE.md).
//   npm run bridge:setup   — 원본 브리지 재생 모드에 필요한 Python 패키지 설치(numpy · scipy · PyWavelets · PyYAML · pandas · matplotlib · wfdb)
//   npm run bridge:replay  — 보드 없이 합성 심전도를 실제 처리 경로로 흘리는 재생 브리지(127.0.0.1:8765)
//   npm run bridge:replay -- --methods M_FE,M04 --leadoff-every 8   — 뒤에 원본 브리지 옵션을 그대로 붙인다
//   npm run bridge:replay -- --signal mitdb:100 --noise ma --snr 5    — 신호(합성 · MIT-BIH) · 잡음 · SNR 고르기(replay_signal.py)
function sourceDir(){
 const cands=[process.env.ECG_SOURCE,join(root,'..','ECG_denoising_method_comparision'),join(root,'..','ecg_denoising_method_comparision')].filter(Boolean);
 for(const d of cands)if(existsSync(join(d,'scripts','serial_bridge.py')))return d;
 bad('원본 저장소(ECG_denoising_method_comparision)를 찾지 못함. 이 저장소와 같은 폴더(예: Documents\\GitHub)에 clone 하거나, 환경 변수 ECG_SOURCE 에 그 폴더 경로를 넣는다');
 say('  찾아본 곳: '+cands.join(' | '));process.exit(1);
}
function bridgeSetup(){const p=findPython();if(!p){bad('Python 3를 찾지 못함 — npm run doctor');process.exit(1);}
 run(p.bin,[...p.pre,'-m','pip','install','--upgrade','numpy','scipy','PyWavelets','PyYAML','pandas','matplotlib','wfdb']);ok('원본 브리지 재생 모드 준비 완료. 다음: npm run bridge:replay');}
function bridgeReplay(extra){const d=sourceDir(),p=findPython();if(!p){bad('Python 3를 찾지 못함 — npm run doctor');process.exit(1);}
 const br=capture('git',['-C',d,'branch','--show-current']);
 const WANT='claude/pli-harmonic-canceller';   // D-162: 전원선 고조파 추적 제거기(원본 D-52) · 보드 1000 Hz(D-53). 그 앞 단계는 claude/adoring-cray-nv6pvq
 if(br&&br!==WANT)warn(`원본 저장소 브랜치가 ${br} — 실시간 측정 화면은 ${WANT} 기준(전원선 고조파 추적 제거기 · M05S). 원본 폴더에서: git fetch origin 다음 줄에 git switch ${WANT}`);
 // 신호 · 잡음 고르기(--signal · --noise · --snr · --start · --sec · --seed): replay_signal.py 로 CSV 를 만들어 --replay csv 로 흘린다
 const own=['--signal','--noise','--snr','--start','--sec','--seed'],pick={},rest=[];
 for(let i=0;i<extra.length;i++){if(own.includes(extra[i])&&i+1<extra.length){pick[extra[i]]=extra[++i];}else rest.push(extra[i]);}
 let src=['--replay','synth'];
 if(Object.keys(pick).length){
  const slug=[pick['--signal']||'synth',pick['--noise']||'mixed',(pick['--snr']||'8')+'dB'].join('_').replace(/[^\w.-]+/g,'-');
  const out=join(root,'.cache','replay',slug+'.csv');
  const code=run(p.bin,[...p.pre,join(root,'scripts','local','replay_signal.py'),...Object.entries(pick).flat(),'--out',out],{cwd:d,allowFail:true});
  if(code!==0){bad('재생 신호를 만들지 못함(위 메시지). 패키지가 없으면 npm run bridge:setup');process.exit(code);}
  src=['--replay','csv','--csv',out];
 }
 // 2026-11-10: 실시간 탭 기법 선택(최대 3개 표시)을 위해 기본 계산 기법을 5개로(고전 기법, 이 환경 측정 6개에 CPU 1코어 약 46 %)
 const has=k=>rest.includes(k),argv=['scripts/serial_bridge.py',...src,'--serve',...(has('--methods')?[]:['--methods','M_FE,M02,M03,M04,M05S']),...rest];
 say(`\n재생 브리지(${src[1]==='csv'?'고른 신호':'합성 심전도'} → 실제 처리 경로, 실측 아님): ${d}\n  ${[p.bin,...p.pre,...argv].join(' ')}\n  앱은 다른 터미널에서 npm run story → «실시간 측정» 탭. 멈추려면 Ctrl+C\n`);
 const code=run(p.bin,[...p.pre,...argv],{cwd:d,allowFail:true});process.exit(code);}

const table={doctor,'bridge:setup':bridgeSetup,'bridge:replay':()=>bridgeReplay(args),story:()=>story(null),'story:wave-prev':()=>story('prev'),'story:wave-all':()=>story('all'),'story:wave-live':()=>story('live'),'story:check':storyCheck,...Object.fromEntries(Object.keys(DIRECT).map(k=>[k,()=>story(null,k)])),spike:()=>spike(args[0]),py:()=>py(args),'py:setup':pySetup,browsers:()=>run('npx',['playwright','install','chromium'],{cwd:join(root,'prototype/v2')}),'v2:prepare':()=>run(process.execPath,[join(root,'scripts/prepare-v2.cjs'),...args])};
if(fileURLToPath(import.meta.url)===resolve(process.argv[1]||'')){
 if(!table[cmd]){say('사용법: npm run doctor | story | story:pli | story:bw | story:ma | story:noise | story:lab | story:check | spike -- <이름> | py -- <스크립트> | py:setup | browsers | v2:prepare');process.exit(cmd?1:0);}
 table[cmd]();
}
