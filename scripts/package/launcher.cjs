#!/usr/bin/env node
// Signal Studio launcher (D-176). Built into SignalStudio.exe as a Node single executable application; only Node built-ins.
// One process does what `npm run story` + `npm run bridge:replay` did:
//   web/      v2 build, served on 127.0.0.1:4173 with the same-origin proxies /bridge → 8765 and /bridge-ctl → 8764
//   source/   bridge files from the source repository (claude/pli-harmonic-canceller), run with python/python.exe
//   python/   embeddable Python 3.12 with numpy · scipy · PyWavelets · PyYAML · pyserial · wfdb (PyTorch is added on demand)
// Signal source (D-179): at start a menu lists the serial ports (pyserial) and the replay — Enter = replay of D1 record 100 with mixed noise
//   at 0 dB (source/replay/*.csv, made at build time by scripts/local/replay_signal.py, seed 13), a number = that board port.
// Start checks (D-180): PyTorch + Visual C++ runtime + path length (torch), USB-serial driver problems (board menu).
// Options: --port COM3 (board, no menu; other bridge flags pass through) · --replay (replay, no menu) · --synth (old synthetic replay)
//          --methods M_FE,M04,M05S
//          --no-browser · --kiosk · --install-torch · --no-torch · --selftest · --selftest-dl · --root <dir> (dev)
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{spawn,spawnSync}=require('node:child_process'),readline=require('node:readline');

const argv=process.argv.slice(2),has=k=>argv.includes(k),val=(k,d)=>{const i=argv.indexOf(k);return i>=0&&i+1<argv.length?argv[i+1]:d;};
const isSea=(()=>{try{return require('node:sea').isSea();}catch{return false;}})();
const ROOT=path.resolve(val('--root',process.env.ECG_PKG_ROOT||(isSea?path.dirname(process.execPath):path.join(__dirname,'..','..','dist','package'))));
const WEB=path.join(ROOT,'web'),SRC=path.join(ROOT,'source');
const WIN=process.platform==='win32';
const PY=process.env.ECG_PYTHON||(WIN?path.join(ROOT,'python','python.exe'):path.join(ROOT,'python','bin','python3'));
let PORT_WEB=Number(process.env.ECG_WEB_PORT||4173),PORT_BR=Number(process.env.ECG_BRIDGE_PORT||8765),PORT_CTL=Number(process.env.ECG_BRIDGE_CTL_PORT||8764);
const SELF=has('--selftest')||has('--selftest-dl');
// D-181: everything printed also goes to logs/SignalStudio-<time>.log next to the exe (a double-clicked console closes with the process)
const LOG=(()=>{try{const d=path.join(ROOT,'logs');fs.mkdirSync(d,{recursive:true});const t=new Date(),z=n=>String(n).padStart(2,'0');
 return path.join(d,`SignalStudio-${t.getFullYear()}${z(t.getMonth()+1)}${z(t.getDate())}-${z(t.getHours())}${z(t.getMinutes())}${z(t.getSeconds())}.log`);}catch{return null;}})();
{const orig=console.log.bind(console);console.log=(...a)=>{orig(...a);if(LOG)try{fs.appendFileSync(LOG,a.join(' ')+'\n');}catch{}};}
const say=s=>console.log(s),ok=s=>console.log('  [OK]   '+s),warn=s=>console.log('  [주의] '+s),bad=s=>console.log('  [문제] '+s);
if(WIN)spawnSync('cmd',['/c','chcp','65001'],{stdio:'ignore'});   // 한글 출력(콘솔 cp949 → UTF-8)
const pyEnv={...process.env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8',PYTHONDONTWRITEBYTECODE:'1'};

// D-181: a fatal error never closes the window silently — the message stays until Enter (double-clicked exe), and is in the log file
let dying=false;
async function fatal(msg,code=1){if(dying)return;dying=true;bad(msg);if(LOG)say('  기록 파일: '+LOG);
 try{if(sup.child){sup.state='stopping';sup.child.kill();}}catch{}
 if(!SELF&&process.stdin.isTTY){await new Promise(res=>{const rl=readline.createInterface({input:process.stdin,output:process.stdout});rl.question('\n창을 닫으려면 Enter 를 누르세요… ',()=>{rl.close();res();});});}
 process.exit(code);}
process.on('uncaughtException',e=>fatal('예기치 않은 오류: '+(e&&e.stack||e)));
process.on('unhandledRejection',e=>fatal('예기치 않은 오류: '+(e&&e.stack||e)));
function need(p,what){if(!fs.existsSync(p)){fatal(`${what} 없음: ${p}\n  압축을 푼 폴더 그대로 실행해야 합니다(web · python · source 폴더가 exe 옆에).`,2);return false;}return true;}
// D-181: ports — if another Signal Studio or `npm run bridge:replay` already holds 4173/8764/8765, use the next free ones
const net=require('node:net');
function portFree(port){return new Promise(res=>{const sv=net.createServer();sv.once('error',()=>res(false));sv.once('listening',()=>sv.close(()=>res(true)));sv.listen(port,'127.0.0.1');});}
async function nextFree(port,taken){for(let p=port;p<port+40;p++)if(!taken.includes(p)&&await portFree(p))return p;return null;}
async function portStep(){const want={web:PORT_WEB,br:PORT_BR,ctl:PORT_CTL},busy=[];
 for(const [k,p] of Object.entries(want))if(!await portFree(p))busy.push(`${p}`);
 if(!busy.length)return true;
 let other='';try{const st=await get(`http://127.0.0.1:${PORT_CTL}/status`,1500);if(st.code===200)other=' — 다른 Signal Studio 또는 npm run bridge:replay 가 켜져 있습니다(같이 켜 두면 CPU를 두 배로 씁니다)';}catch{}
 warn(`포트 ${busy.join(' · ')} 이(가) 이미 쓰이고 있음${other}`);
 const taken=[];const pick=async p=>{const q=await nextFree(p,taken);if(q)taken.push(q);return q;};
 const w=await pick(PORT_WEB),b=await pick(PORT_BR),c=await pick(PORT_CTL);
 if(!w||!b||!c){await fatal('빈 포트를 찾지 못함 — 다른 Signal Studio 창 · npm run bridge:replay 를 닫고 다시 실행하세요',3);return false;}
 PORT_WEB=w;PORT_BR=b;PORT_CTL=c;ok(`다른 포트로 켭니다: 화면 ${w} · 브리지 ${b} · 제어 ${c}`);return true;}

// ---------------------------------------------------------------- PyTorch: check, ask, install into the bundled Python
// D-180: PyTorch on Windows needs the Visual C++ runtime (msvcp140.dll …). The package ships it app-local next to python.exe;
// if it is missing anyway (folder copied without it), the check offers Microsoft's installer. Long paths: the deepest torch file
// is ~119 characters under site-packages, so a package unpacked deep in the tree can exceed Windows' 260-character limit.
const TORCH_DEEPEST=145;   // "Lib\\site-packages\\" + deepest torch path, measured on torch 2.x
function torchState(){const r=spawnSync(PY,['-c','import importlib.util,json,sys\ns={"spec":importlib.util.find_spec("torch") is not None}\ntry:\n import torch;s["ver"]=torch.__version__\nexcept Exception as e:\n s["err"]=f"{type(e).__name__}: {e}"\nsys.stdout.write(json.dumps(s))'],{env:pyEnv,encoding:'utf8'});
 try{return JSON.parse(r.stdout);}catch{return{spec:false,err:(r.stderr||'').slice(-300)};}}
function hasTorch(){const s=torchState();return s.ver||null;}
const VC_DLLS=['msvcp140.dll','vcruntime140.dll','vcruntime140_1.dll'];
function vcState(){if(!WIN)return{ok:true};const pyDir=path.dirname(PY),sys32=path.join(process.env.SystemRoot||'C:\\Windows','System32');
 const miss=VC_DLLS.filter(d=>!fs.existsSync(path.join(pyDir,d))&&!fs.existsSync(path.join(sys32,d)));return{ok:!miss.length,miss,local:VC_DLLS.every(d=>fs.existsSync(path.join(pyDir,d)))};}
function installVc(){const url='https://aka.ms/vs/17/release/vc_redist.x64.exe',tmp=path.join(require('node:os').tmpdir(),'vc_redist.x64.exe');
 say('\nVisual C++ 런타임 설치 프로그램 내려받는 중(Microsoft, 약 25 MB)…');
 const d=spawnSync('powershell',['-NoProfile','-Command',`$ProgressPreference='SilentlyContinue';Invoke-WebRequest '${url}' -OutFile '${tmp}'`],{stdio:'inherit'});
 if(d.status!==0||!fs.existsSync(tmp)){bad('내려받기 실패 — 인터넷 연결을 확인하거나 직접 설치: '+url);return false;}
 say('설치 창이 뜹니다(관리자 권한 확인 「예」).');const r=spawnSync(tmp,['/install','/passive','/norestart'],{stdio:'inherit'});
 if([0,1638,3010].includes(r.status??-1)){ok('Visual C++ 런타임 설치됨'+(r.status===3010?' (다시 시작 권장)':''));return true;}
 bad(`Visual C++ 런타임 설치 실패(코드 ${r.status}) — 직접 설치: ${url}`);return false;}
function longPathOk(){if(!WIN)return true;const need=path.join(path.dirname(PY)).length+1+TORCH_DEEPEST;if(need<259)return true;
 const r=spawnSync('reg',['query','HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem','/v','LongPathsEnabled'],{encoding:'utf8'});return /0x1\b/.test(r.stdout||'');}
function installTorch(){
 if(!longPathOk()){bad(`폴더 경로가 길어(${ROOT.length}자) PyTorch 파일 경로가 Windows 한도(260자)를 넘습니다 — 압축을 짧은 경로(예: C:\\SignalStudio)에 풀고 다시 실행하세요.`);return false;}
 say('\nPyTorch(CPU) 설치 중 — 약 200 MB 내려받기, 몇 분 걸릴 수 있습니다…');
 const r=spawnSync(PY,['-m','pip','install','--no-warn-script-location','torch','--index-url','https://download.pytorch.org/whl/cpu'],{env:pyEnv,stdio:'inherit'});
 const st=torchState();if(r.status===0&&st.ver){ok('PyTorch 설치 완료: '+st.ver);return true;}
 if(st.spec&&!st.ver){bad('PyTorch 는 설치됐지만 불러오지 못함: '+(st.err||'').slice(0,200));return false;}
 bad('PyTorch 설치 실패 — 인터넷 연결을 확인하세요. 고전 기법(M_FE~M05S)은 그대로 쓸 수 있습니다.');return false;}
function ask(q){return new Promise(res=>{if(!process.stdin.isTTY)return res('');const rl=readline.createInterface({input:process.stdin,output:process.stdout});rl.question(q,a=>{rl.close();res(a.trim());});});}
async function vcStep(why){const v=vcState();if(v.ok)return true;
 warn(`Visual C++ 런타임 없음(${v.miss.join(', ')}) — ${why}`);if(SELF)return false;
 const a=await ask('Microsoft Visual C++ 재배포 패키지를 지금 설치할까요? [Y/n] ');if(a===''||/^y/i.test(a))return installVc()&&vcState().ok;
 warn('설치하지 않음 — 딥러닝 기법은 쓸 수 없습니다(고전 기법은 그대로)');return false;}
async function torchStep(){
 let st=torchState();
 if(st.ver){ok('PyTorch '+st.ver+' — 딥러닝 기법(M06 · M06L6 · M08 · M09) 사용 가능');return;}
 if(st.spec){bad('PyTorch 가 설치돼 있지만 불러오지 못함: '+(st.err||'').slice(0,240));
  if(WIN&&!vcState().ok&&await vcStep('PyTorch 를 불러오려면 필요합니다')&&(st=torchState()).ver){ok('PyTorch '+st.ver+' — 사용 가능');return;}
  warn('딥러닝 기법은 쓸 수 없습니다. 다시 설치하려면: SignalStudio.exe --install-torch');if(has('--install-torch')){spawnSync(PY,['-m','pip','uninstall','-y','torch'],{env:pyEnv,stdio:'inherit'});installTorch();}return;}
 if(has('--no-torch')){warn('PyTorch 없음 — 딥러닝 기법은 고를 수 없습니다(--no-torch)');return;}
 if(has('--install-torch')){if(await vcStep('PyTorch 에 필요합니다')||SELF)installTorch();return;}
 if(SELF){warn('PyTorch 없음(시험 모드: 묻지 않음)');return;}
 const a=await ask('\nPyTorch가 설치되어 있지 않습니다. 딥러닝 기법(M06 · M08 · M09)을 쓰려면 필요합니다.\n지금 설치할까요? (CPU 판, 약 200 MB 내려받기) [Y/n] ');
 if(a===''||/^y/i.test(a)){if(await vcStep('PyTorch 에 필요합니다'))installTorch();}else warn('설치하지 않음 — 다음에 켤 때 다시 묻습니다(고전 기법은 그대로 사용 가능)');}

// ---------------------------------------------------------------- USB serial drivers (D-180): a known USB-serial chip without a working driver
const USB_SERIAL={'1A86':'CH340/CH341 (WCH) — https://www.wch-ic.com/downloads/CH341SER_EXE.html','2341':'Arduino — Arduino IDE 설치 또는 Windows 업데이트','2A03':'Arduino — Arduino IDE 설치 또는 Windows 업데이트','0403':'FTDI — https://ftdichip.com/drivers/vcp-drivers/','10C4':'CP210x (Silicon Labs) — https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers'};
function driverProblems(){if(!WIN)return[];
 const ps="Get-CimInstance Win32_PnPEntity | Where-Object { $_.DeviceID -match 'USB\\\\VID_(1A86|2341|2A03|0403|10C4)' } | Select-Object Name,DeviceID,ConfigManagerErrorCode | ConvertTo-Json -Compress";
 const r=spawnSync('powershell',['-NoProfile','-Command',ps],{encoding:'utf8',timeout:15000});let list=[];try{list=JSON.parse(r.stdout||'[]');}catch{}
 if(!Array.isArray(list))list=[list];return list.filter(d=>d&&d.ConfigManagerErrorCode!==0).map(d=>{const vid=(String(d.DeviceID).match(/VID_([0-9A-F]{4})/i)||[])[1]?.toUpperCase();return{name:d.Name||d.DeviceID,code:d.ConfigManagerErrorCode,hint:USB_SERIAL[vid]||''};});}

// ---------------------------------------------------------------- signal source: replay (D1 · mixed 0 dB) or a board port (D-179)
const REPLAY_CSV=path.join(SRC,'replay','d1_100_mixed_0dB.csv'),REPLAY_LABEL='d1 · 기록 100 · 혼합 잡음 0 dB';
const SRC_FLAGS=new Set(['--replay','--synth']);
let SOURCE={kind:'replay',label:REPLAY_LABEL,args:[]};
function listPorts(){const r=spawnSync(PY,['-c','import json,serial.tools.list_ports as L;print(json.dumps([[p.device,p.description or "",p.hwid or ""] for p in sorted(L.comports(),key=lambda p:p.device)]))'],{env:pyEnv,encoding:'utf8'});
 try{return JSON.parse(r.stdout.trim()||'[]');}catch{return [];}}
function replaySource(){if(has('--synth'))return{kind:'replay',label:'합성 심전도 · 합성 잡음 8 dB',args:['--replay','synth']};
 if(fs.existsSync(REPLAY_CSV))return{kind:'replay',label:REPLAY_LABEL,args:['--replay','csv','--csv',REPLAY_CSV]};
 warn('재생 파일 없음('+REPLAY_CSV+') — 합성 신호로 재생합니다');return{kind:'replay',label:'합성 심전도 · 합성 잡음 8 dB',args:['--replay','synth']};}
async function sourceStep(){
 if(argv.includes('--port')){SOURCE={kind:'board',label:'보드 '+val('--port','?'),args:[]};ok('신호원: '+SOURCE.label+' (--port)');return;}
 if(has('--replay')||has('--synth')||SELF){SOURCE=replaySource();ok('신호원: 재생 — '+SOURCE.label);return;}
 const ports=listPorts();
 say('\n신호원을 고르세요');say('  [Enter] 재생 신호 — '+REPLAY_LABEL+' (보드 없이)');
 ports.forEach(([dev,desc],i)=>say(`  [${i+1}] 보드 ${dev}${desc&&desc!=='n/a'?' — '+desc:''}`));
 if(!ports.length)say('  (연결된 시리얼 포트 없음 — 보드를 꽂았다면 USB 케이블 · 드라이버를 확인하세요)');
 for(const d of driverProblems())warn(`USB 직렬 장치 「${d.name}」 드라이버 문제(코드 ${d.code}) — 포트로 안 보입니다. 드라이버: ${d.hint||'장치 관리자에서 확인'}`);
 for(;;){const a=await ask('선택: ');
  if(a===''){SOURCE=replaySource();break;}
  const n=Number(a),byNum=Number.isInteger(n)&&n>=1&&n<=ports.length?ports[n-1][0]:null,byName=/^(COM\d+|\/dev\/\S+)$/i.test(a)?a.toUpperCase().startsWith('COM')?a.toUpperCase():a:null,dev=byNum||byName;
  if(dev){SOURCE={kind:'board',label:'보드 '+dev,args:['--port',dev]};break;}
  warn((ports.length?'번호(1–'+ports.length+'), ':'')+'포트 이름(예: COM3) 또는 Enter(재생)');}
 ok('신호원: '+(SOURCE.kind==='board'?SOURCE.label:'재생 — '+SOURCE.label));}

// ---------------------------------------------------------------- bridge supervisor (scripts/local/run.mjs supervise(), D-170)
const LIVE_ALLOWED=new Set(['M_FE','M01','M02','M03','M04','M05','M05S','M06','M06L6','M08','M09']);
const sup={state:'stopped',methods:'',err:'',child:null};
function bridgeArgs(methods){
 const pass=[],skip=new Set(['--no-browser','--kiosk','--install-torch','--no-torch','--selftest','--selftest-dl']);
 for(let i=0;i<argv.length;i++){const a=argv[i];if(skip.has(a))continue;if(a==='--root'||a==='--methods'){i++;continue;}
  if(SRC_FLAGS.has(a)){if(a==='--replay'&&/^(synth|csv)$/.test(argv[i+1]??''))i++;continue;}pass.push(a);}
 const src=pass.includes('--port')?[]:SOURCE.args;
 return ['scripts/serial_bridge.py',...src,'--serve','--http-port',String(PORT_BR),'--methods',methods,...pass];}
function supervise(initial){
 let prev=null,gen=0,tries=0,since=0;sup.methods=initial;
 const start=()=>{const g=++gen;sup.state='starting';sup.err='';since=Date.now();say(`\n브리지 시작: --methods ${sup.methods}`);
  const c=spawn(PY,bridgeArgs(sup.methods),{cwd:SRC,env:pyEnv,stdio:['ignore',SELF?'pipe':'inherit','pipe']});sup.child=c;
  if(SELF)c.stdout.on('data',()=>{});
  c.stderr.on('data',b=>{if(!SELF)process.stderr.write(b);sup.err=(sup.err+b).slice(-1500);});
  c.on('exit',code=>{if(g!==gen)return;sup.child=null;if(sup.state==='stopping')return;
   const early=Date.now()-since<8000,portBusy=/address already in use|10048|WinError 10013|Errno 98/i.test(sup.err);
   if(early&&portBusy&&tries<4){tries++;warn(`브리지가 바로 끝남(코드 ${code}) — ${tries}/4 다시 시도`);setTimeout(start,1000);return;}
   sup.state='failed';tries=0;bad(`브리지 종료(코드 ${code})`+(/No module named 'torch'/.test(sup.err)?' — 딥러닝 기법은 PyTorch 필요: SignalStudio.exe --install-torch':''));
   if(SELF)console.log(sup.err.slice(-800));
   if(prev&&prev!==sup.methods){warn(`이전 기법으로 되돌림: ${prev}`);sup.methods=prev;prev=null;setTimeout(start,800);}});
  const poll=()=>{if(g!==gen||sup.state!=='starting')return;
   http.get({host:'127.0.0.1',port:PORT_BR,path:'/fe'},r=>{r.resume();if(r.statusCode===200){sup.state='running';prev=null;tries=0;ok('브리지 준비됨: '+sup.methods);}else setTimeout(poll,400);})
    .on('error',()=>setTimeout(poll,400));};
  setTimeout(poll,500);};
 const restart=list=>{prev=sup.methods;sup.methods=list.join(',');tries=0;
  if(sup.child){sup.state='stopping';const c=sup.child;c.once('exit',()=>setTimeout(start,400));c.kill();}else start();};
 http.createServer((req,res)=>{const j=(code,o)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(o));};
  const u=req.url.split('?')[0];
  if(req.method==='GET'&&u==='/status')return j(200,{state:sup.state,methods:sup.methods.split(','),err:sup.state==='failed'?sup.err.slice(-400):'',source:{kind:SOURCE.kind,label:SOURCE.label}});
  if(req.method==='POST'&&u==='/restart'){let body='';req.on('data',c=>{body+=c;if(body.length>2000)req.destroy();});req.on('end',()=>{
   let list;try{list=JSON.parse(body).methods;}catch{return j(400,{error:'json'});}
   if(!Array.isArray(list)||!list.length||list.length>4||!list.every(m=>typeof m==='string'&&LIVE_ALLOWED.has(m)))return j(400,{error:'methods: 1–4 of '+[...LIVE_ALLOWED].join(',')});
   restart([...new Set(list)]);j(202,{state:sup.state,methods:list});});return;}
  j(404,{error:'not found'});}).on('error',e=>{fatal(`제어 창구 포트 ${PORT_CTL} 사용 불가(${e.code}) — 다른 Signal Studio · npm run bridge:replay 가 켜져 있으면 닫으세요`,3);})
  .listen(PORT_CTL,'127.0.0.1');
 start();}

// ---------------------------------------------------------------- web server (scripts/serve-v2.cjs) with the two proxies
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
 '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ktx2':'image/ktx2','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.bin':'application/octet-stream',
 '.wasm':'application/wasm','.mp4':'video/mp4','.webm':'video/webm','.woff2':'font/woff2','.woff':'font/woff','.hdr':'application/octet-stream','.csv':'text/csv; charset=utf-8','.txt':'text/plain; charset=utf-8'};
function proxy(req,res,port,strip){const up=http.request({host:'127.0.0.1',port,method:req.method,path:req.url.replace(strip,'')||'/',headers:{...req.headers,host:'127.0.0.1:'+port}},r=>{res.writeHead(r.statusCode||502,r.headers);r.pipe(res);});
 up.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'text/plain; charset=utf-8'});res.end('bridge not reachable');});res.on('close',()=>up.destroy());req.pipe(up);}
function serveWeb(){return new Promise(resolve=>{http.createServer((req,res)=>{
  if(req.url.startsWith('/bridge-ctl/'))return proxy(req,res,PORT_CTL,/^\/bridge-ctl/);
  if(req.url.startsWith('/bridge/')||req.url==='/bridge')return proxy(req,res,PORT_BR,/^\/bridge/);
  let p;try{p=path.resolve(WEB,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400).end();return;}
  if(!p.startsWith(WEB+path.sep)&&p!==WEB){res.writeHead(403).end();return;}
  if(p===WEB||p.endsWith(path.sep))p=path.join(p,'index.html');
  fs.stat(p,(e,s)=>{if(e||!s.isFile()){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(p).pipe(res);});})
 .on('error',e=>{fatal(`화면 포트 ${PORT_WEB} 사용 불가(${e.code}) — 이미 켜진 Signal Studio 창이 있으면 닫으세요`,3);})
 .listen(PORT_WEB,'127.0.0.1',resolve);});}

function openBrowser(url){if(has('--no-browser')||SELF)return;
 if(WIN){const edge=has('--kiosk')?['msedge','--kiosk',url,'--edge-kiosk-type=fullscreen','--no-first-run']:['msedge','--app='+url,'--start-maximized','--no-first-run'];
  const r=spawnSync('cmd',['/c','start','""',...edge],{stdio:'ignore',windowsVerbatimArguments:false});if(r.status!==0)spawn('cmd',['/c','start','""',url],{stdio:'ignore',detached:true});}
 else spawn(process.platform==='darwin'?'open':'xdg-open',[url],{stdio:'ignore',detached:true}).on('error',()=>{});}

// ---------------------------------------------------------------- self test (GitHub Actions on windows-latest)
const get=(url,ms=5000)=>new Promise((res,rej)=>{const r=http.get(url,x=>{let b='';x.on('data',c=>b+=c);x.on('end',()=>res({code:x.statusCode,body:b}));});r.setTimeout(ms,()=>r.destroy(new Error('timeout')));r.on('error',rej);});
const post=(url,o)=>new Promise((res,rej)=>{const u=new URL(url),d=JSON.stringify(o);const r=http.request({host:u.hostname,port:u.port,path:u.pathname,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},x=>{let b='';x.on('data',c=>b+=c);x.on('end',()=>res({code:x.statusCode,body:b}));});r.on('error',rej);r.end(d);});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function untilRunning(want,limit){const t=Date.now();while(Date.now()-t<limit){const s=JSON.parse((await get(`http://127.0.0.1:${PORT_WEB}/bridge-ctl/status`)).body);if(s.state==='running'&&(!want||s.methods.join()===want))return s;if(s.state==='failed'&&!want)throw new Error('bridge failed: '+s.err);await wait(1000);}throw new Error('bridge not running within '+limit/1000+' s');}
function streamKeys(ms){return new Promise((res,rej)=>{const keys=new Set();let n=0;const r=http.get(`http://127.0.0.1:${PORT_WEB}/bridge/stream`,x=>{let buf='';x.on('data',c=>{buf+=c;let i;while((i=buf.indexOf('\n\n'))>=0){const ev=buf.slice(0,i);buf=buf.slice(i+2);const m=ev.match(/^data: (.*)$/m);if(!m)continue;try{const d=JSON.parse(m[1]);if(d.out){n++;Object.keys(d.out).forEach(k=>keys.add(k));}}catch{}}});});
 r.on('error',rej);setTimeout(()=>{r.destroy();res({frames:n,keys:[...keys]});},ms);});}
async function selftest(){const out={ok:false,checks:[]},check=(name,pass,info)=>{out.checks.push({name,pass,info});console.log(`  ${pass?'PASS':'FAIL'} ${name} ${info??''}`);if(!pass)throw new Error(name);};
 try{const idx=await get(`http://127.0.0.1:${PORT_WEB}/`);check('web index.html',idx.code===200&&/<div id="root"|<script/.test(idx.body),'HTTP '+idx.code);
  // 10-minute replay (lab «10 min»): manifest + one chunk read through the same server
  const man=await get(`http://127.0.0.1:${PORT_WEB}/replay/manifest.json`);let mj=null;try{mj=JSON.parse(man.body);}catch{}
  const sc=mj?.scenes?.length??0,ch=mj?.scenes?.[0]?.chunks?.[0]?.path??mj?.chunks?.[0]?.path;
  check('10-min replay manifest',man.code===200&&sc>0,`HTTP ${man.code} · ${sc} scenes`);
  if(ch){const c=await get(`http://127.0.0.1:${PORT_WEB}/replay/${ch}`,15000);check('10-min replay chunk',c.code===200&&c.body.length>1000,`${ch} ${c.body.length} B`);}
  if(WIN){const v=vcState();check('Visual C++ runtime next to python.exe',v.local,v.ok?'present':'missing '+(v.miss||[]).join(','));}
  const st=await untilRunning(null,180000);check('bridge running',true,st.methods.join(','));
  check('signal source',st.source?.kind==='replay'&&!!st.source.label&&(has('--synth')||/d1/.test(st.source.label)),JSON.stringify(st.source));
  const fe=await get(`http://127.0.0.1:${PORT_WEB}/bridge/fe`);check('bridge /fe via proxy',fe.code===200,'HTTP '+fe.code);
  const s1=await streamKeys(6000);check('stream data',s1.frames>5&&['M_FE','M04','M05S'].every(k=>s1.keys.includes(k)),`${s1.frames} frames · ${s1.keys.join(',')}`);
  if(has('--selftest-dl')){const v=hasTorch();check('PyTorch present',!!v,v??'missing');
   if(WIN){const r=spawnSync(PY,['-c','import torch,ctypes,ctypes.wintypes as w\nk=ctypes.WinDLL("kernel32");k.GetModuleHandleW.restype=w.HMODULE;k.GetModuleHandleW.argtypes=[w.LPCWSTR]\nb=ctypes.create_unicode_buffer(600);h=k.GetModuleHandleW("msvcp140.dll");k.GetModuleFileNameW(w.HMODULE(h),b,600);print(b.value)'],{env:pyEnv,encoding:'utf8'});
    const where=(r.stdout||'').trim();check('torch loads msvcp140 from the package',where.toLowerCase().startsWith(path.dirname(PY).toLowerCase()),where||(r.stderr||'').slice(-200));}
   const r=await post(`http://127.0.0.1:${PORT_WEB}/bridge-ctl/restart`,{methods:['M_FE','M08']});check('restart accepted',r.code===202,'HTTP '+r.code);
   const t0=Date.now();await untilRunning('M_FE,M08',300000);check('bridge running with M08',true,((Date.now()-t0)/1000).toFixed(1)+' s');
   const s2=await streamKeys(8000);check('stream has M08',s2.keys.includes('M08'),`${s2.frames} frames · ${s2.keys.join(',')}`);}
  out.ok=true;}catch(e){out.error=String(e.message||e);}
 console.log('SELFTEST '+JSON.stringify(out));sup.state='stopping';if(sup.child)sup.child.kill();setTimeout(()=>process.exit(out.ok?0:1),500);}

// ---------------------------------------------------------------- main
(async()=>{
 say('Signal Studio — 심전도 잡음 제거 시연\n폴더: '+ROOT);
 if(!need(WEB,'화면 파일(web)')||!need(path.join(SRC,'scripts','serial_bridge.py'),'브리지(source)')||(path.isAbsolute(PY)&&!need(PY,'내장 Python(python)')))return;
 if(LOG)say('기록 파일: '+LOG);
 await torchStep();
 await sourceStep();
 if(!await portStep())return;
 const methods=val('--methods','M_FE,M04,M05S');supervise(methods);
 await serveWeb();const url=`http://127.0.0.1:${PORT_WEB}/`;ok('화면: '+url+'  (이 창을 닫으면 모두 종료)');
 if(SELF)return selftest();
 openBrowser(url);
 const stop=()=>{sup.state='stopping';if(sup.child)sup.child.kill();process.exit(0);};process.on('SIGINT',stop);process.on('SIGTERM',stop);process.on('SIGHUP',stop);
})();
