// Frame capture for the frame budget (playbook P-007): the Story noise scenes at fixed times, in the web tone pipeline.
// usage: node scripts/qa/frame-capture.cjs --out DIR [--frames pli@5,pli@7,…] [--query "&set=C"] [--size 1600x900]
// Needs the built prototype (npm run build in prototype/v2); starts scripts/serve-v2.cjs on 4173 if nothing answers there.
// Renders with SwiftShader and ?msaa=0 (the project's QA renderer); real-GPU confirmation stays with the user.
const {spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),http=require('node:http');
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d;};
const OUT=arg('out'),FR=arg('frames','pli@5,pli@7,pli@8.5,pli@11,pli@16,bw@6,ma@6'),Q=arg('query',''),[W,H]=arg('size','1600x900').split('x').map(Number);
if(!OUT){console.error('--out DIR is required');process.exit(2);}
const ROOT=path.resolve(__dirname,'../..');
const {chromium}=require(path.join(ROOT,'prototype/v2/node_modules/@playwright/test'));
const up=()=>new Promise(r=>http.get('http://127.0.0.1:4173/',s=>{s.resume();r(s.statusCode===200);}).on('error',()=>r(false)));
(async()=>{
 let srv=null;if(!await up()){srv=spawn(process.execPath,[path.join(ROOT,'scripts/serve-v2.cjs')],{stdio:'ignore'});for(let i=0;i<20&&!await up();i++)await new Promise(r=>setTimeout(r,500));}
 fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch({executablePath:process.env.PW_CHROMIUM||'/opt/pw-browsers/chromium',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const byCond={};for(const f of FR.split(',')){const [c,t]=f.split('@');(byCond[c]??=[]).push(t);}
 const errs=[];
 for(const [cond,ts] of Object.entries(byCond)){
  const p=await b.newPage({viewport:{width:W,height:H}});p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:4173/?story=noise&cond=${cond}&t=0&msaa=0${Q}`);
  await p.waitForFunction(()=>window.__noise&&window.__noise.ready,null,{timeout:180000});
  for(const t of ts){await p.evaluate(t=>{window.__noise.set({t:+t});window.__noise.renderOnce();window.__noise.renderOnce();},t);await p.waitForTimeout(400);
   const f=path.join(OUT,`${cond}@${t}.png`);await p.screenshot({path:f});console.log('captured',f);}
  await p.close();}
 await b.close();if(srv)srv.kill();
 if(errs.length){console.error('page errors',errs.slice(0,5));process.exit(1);}
})();
