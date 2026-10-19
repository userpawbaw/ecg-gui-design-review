// D-148: optical/interaction/render regression checks against the actual staged artifact.
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(join(root,'prototype/v2/package.json'));
const {chromium}=require('playwright');
const out=resolve(root,process.env.ARCHIVE_VOLUME_RESULTS||'verification/r1-archive-volumetric-20261019');
await mkdir(join(out,'frames'),{recursive:true});
const site=await mkdtemp(join(tmpdir(),'archive-volume-qa-'));
const staged=spawnSync(process.env.ARCHIVE_STAGE_PYTHON||(process.platform==='win32'?'python':'python3'),[join(root,'scripts/assets/stage-archive-web-preview.py'),'--destination',site],{cwd:root,encoding:'utf8'});
if(staged.status!==0)throw new Error(staged.stderr||staged.error?.message||'Staging failed');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.includes('..'))throw new Error('Invalid path');const file=path==='/bench.html'?join(root,'verification/r1-archive-volumetric-20261019/bench.html'):join(site,path);const bytes=await readFile(file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const report={result:'IN_PROGRESS',scope:'staged Chromium/SwiftShader functional and image-buffer checks; no physical GPU claim',errors:[],failedRequests:[],checks:{}};
let browser;
const halfSummary=async(page,bench=false)=>page.evaluate(async(bench)=>{
 const T=await import('three'),a=bench?window.__bench:window.__archiveLightStudy,e=a.engine,{pixels,width,height}=e.readVolume();let sum=0,max=0,count=0,hash=2166136261;
 for(let i=0;i<pixels.length;i++){hash=Math.imul(hash^pixels[i],16777619);if(i%4===0){const v=T.DataUtils.fromHalfFloat(pixels[i]);sum+=v;max=Math.max(max,v);if(v>.001)count++;}}
 return {mean:sum/(width*height),max,litPixels:count,hash:hash>>>0,width,height,depthRenders:e.stats.lightDepthRenders};
},bench);
try{
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{}),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});report.browser=browser.version();
 const page=await browser.newPage({viewport:{width:640,height:480},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('requestfailed',r=>report.failedRequests.push({url:new URL(r.url()).pathname,error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()>=400)report.errors.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`);});
 await page.goto(base+'/bench.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__bench,{timeout:120000});
 const bench={};
 for(const mode of ['open','closed','alpha']){await page.evaluate(m=>window.__bench.mode(m),mode);bench[mode]=await halfSummary(page,true);await page.screenshot({path:join(out,`bench-${mode}.png`)});}
 assert(bench.open.max>.01);assert.equal(bench.closed.max,0);assert(bench.alpha.litPixels>bench.open.litPixels);
 bench.sourceOffscreen=await page.evaluate(()=>{const b=window.__bench,v=b.lighting.toSun.clone().multiplyScalar(100).project(b.camera);return Math.abs(v.x)>1||Math.abs(v.y)>1||v.z< -1||v.z>1;});assert(bench.sourceOffscreen);
 bench.resourceCounts=[];for(let i=0;i<5;i++)bench.resourceCounts.push(await page.evaluate(()=>window.__bench.recreate()));assert.equal(new Set(bench.resourceCounts).size,1);report.checks.bench=bench;
 console.log('PASS: open/closed/alpha/offscreen bench; recreate resources stable');
 await page.goto(base+'/light-study.html?view=shafts',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__archiveLightStudy?.engine.stats.frames>0,{timeout:120000});await page.evaluate(()=>window.__archiveLightStudy.pause());
 report.checks.glb=await page.evaluate(async()=>{const a=window.__archiveLightStudy,T=await import('three'),ray=new T.Raycaster();ray.far=.8;const roof={};for(const [name,x,z] of [['hatch',.8,-3.1],['skylight',2.4,-3.1],['solid',-2,-2]]){ray.set(new T.Vector3(x,5.45,z),new T.Vector3(0,-1,0));roof[name]=ray.intersectObject(a.root,true).map(h=>h.distance);}let triangles=0;a.root.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});return {triangles,roof,materials:a.materialAudit,stats:a.engine.stats,normalMaps:a.normalMaps,roughnessMaps:a.roughnessMaps};});
 assert.equal(report.checks.glb.roof.hatch.length,0);assert.equal(report.checks.glb.roof.skylight.length,0);assert(report.checks.glb.roof.solid.length>0);
 // Actual range input and keyboard, not just direct uniform mutation.
 const before=await page.evaluate(()=>window.__archiveLightStudy.engine.stats.lightDepthRenders);
 await page.locator('#azimuth').fill('90');await page.locator('#elevation').fill('50');await page.locator('#azimuth').press('ArrowRight');
 await page.evaluate(()=>window.__archiveLightStudy.renderNow({moving:false}));
 report.checks.rangeInput=await page.evaluate(()=>({state:window.__archiveLightStudy.snapshot(),depthRenders:window.__archiveLightStudy.engine.stats.lightDepthRenders}));
 assert(Math.abs(report.checks.rangeInput.state.light.azimuth-90.1)<1e-6);assert.equal(report.checks.rangeInput.depthRenders-before,1);
 const saved=await page.evaluate(()=>window.__archiveLightStudy.snapshot());await page.getByText('결·품질 설정',{exact:true}).click();await page.locator('#share').click();const hash=await page.evaluate(()=>JSON.parse(decodeURIComponent(location.hash.slice(1))));assert.deepEqual(hash,saved);
 await page.locator('#reset').click();const reset=await page.evaluate(()=>window.__archiveLightStudy.snapshot());assert.equal(reset.light.azimuth,225);assert.equal(reset.light.elevation,35);assert(Math.max(...reset.camera.position.map((v,i)=>Math.abs(v-[8.5,5.5,17][i])))<1e-9);
 await page.evaluate(s=>{window.__archiveLightStudy.restore(s);window.__archiveLightStudy.renderNow({moving:false});},saved);const restored=await page.evaluate(()=>window.__archiveLightStudy.snapshot());assert(Math.max(...restored.camera.position.map((v,i)=>Math.abs(v-saved.camera.position[i])))<1e-9);assert.deepEqual(restored.light,saved.light);report.checks.resetAndRestore='PASS';
 report.checks.grain=[];
 for(const grain of ['0','0.3']){await page.locator('#grain').fill(grain);await page.evaluate(()=>window.__archiveLightStudy.renderNow({moving:false}));report.checks.grain.push({grain:+grain,...await halfSummary(page)});}assert.notEqual(report.checks.grain[0].hash,report.checks.grain[1].hash);assert.equal(report.checks.grain[0].depthRenders,report.checks.grain[1].depthRenders);
 await page.locator('#strength').fill('0');await page.evaluate(()=>window.__archiveLightStudy.renderNow({moving:false}));assert.equal(await page.evaluate(()=>window.__archiveLightStudy.engine.stats.fullScreenPasses),1);
 await page.locator('#strength').fill('1');await page.locator('#grain').fill('0.15');await page.locator('#enabled').uncheck();await page.evaluate(()=>window.__archiveLightStudy.renderNow({moving:false}));assert.equal(await page.evaluate(()=>window.__archiveLightStudy.engine.stats.fullScreenPasses),1);await page.locator('#enabled').check();await page.evaluate(()=>window.__archiveLightStudy.renderNow({moving:false}));assert.equal(await page.evaluate(()=>window.__archiveLightStudy.engine.stats.fullScreenPasses),4);report.checks.effectSwitchAndZeroStrength='PASS';
 await page.locator('#shaftsView').click();await page.locator('#panel').evaluate(e=>e.open=false);await page.evaluate(()=>{document.querySelector('aside').style.display='none';window.__archiveLightStudy.setState({quality:'fast',grain:.15});window.__archiveLightStudy.renderNow({moving:false});});
 // Same scene and light: output transform is applied once. MSAA edge differences are reported separately.
 report.checks.outputParity=await page.evaluate(()=>{const a=window.__archiveLightStudy;a.setState({enabled:false});a.renderNow({moving:false});const r=a.renderer,gl=r.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,off=new Uint8Array(w*h*4),direct=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,off);r.setRenderTarget(null);r.render(a.scene,a.camera);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,direct);let total=0,max=0,over2=0;for(let i=0;i<off.length;i++)if(i%4<3){const d=Math.abs(off[i]-direct[i]);total+=d;max=Math.max(max,d);if(d>2)over2++;}return {meanAbsRGB:total/(w*h*3),maxAbsRGB:max,channelsOver2:over2};});assert(report.checks.outputParity.meanAbsRGB<=1);
 await page.evaluate(()=>{window.__archiveLightStudy.setState({enabled:true});window.__archiveLightStudy.renderNow({moving:false});});
 report.checks.directions=[];
 for(const [az,el] of [[46.4,54.4],[0,35],[90,35],[180,35],[225,35],[270,35]]){await page.evaluate(v=>{const a=window.__archiveLightStudy;a.setState({azimuth:v[0],elevation:v[1]});a.renderNow({moving:false});},[az,el]);report.checks.directions.push({az,el,...await halfSummary(page)});}
 assert(new Set(report.checks.directions.map(x=>x.hash)).size>=5);
 await page.evaluate(()=>{const a=window.__archiveLightStudy;a.setState({azimuth:46.4,elevation:54.4});a.renderNow({moving:false});});
 report.checks.cameras=[];
 for(const [name,position,target,fov] of [['wide',[8.5,5.5,17],[0,2.15,-1.5],37],['front',[.15,1.6,-.95],[.75,2.75,-4.7],52],['side',[-1,1.5,-3.8],[1.5,3.4,-3.5],52]]){await page.evaluate(v=>{const a=window.__archiveLightStudy;a.positionCamera(v[0],v[1],v[2]);a.renderNow({moving:false});},[position,target,fov]);report.checks.cameras.push({name,position,...await halfSummary(page)});await page.screenshot({path:join(out,`camera-${name}.png`)});}
 report.checks.serializedSoftwareRenderWaitMs={};
 for(const quality of ['fast','auto']){const samples=[];for(let i=0;i<14;i++){const elapsed=await page.evaluate(q=>{const a=window.__archiveLightStudy;a.setState({quality:q});const start=performance.now();a.renderNow({moving:false});const gl=a.renderer.getContext();gl.finish();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));return performance.now()-start;},quality);if(i>=2)samples.push(elapsed);}const sorted=[...samples].sort((a,b)=>a-b);report.checks.serializedSoftwareRenderWaitMs[quality]={samples,p50:sorted[5],p95:sorted[11],scope:'640x480 paused render + gl.finish + synchronous 1px framebuffer readback wall time; not isolated GPU ms or display FPS'};}
 await page.evaluate(()=>{window.__archiveLightStudy.setState({quality:'fast'});window.__archiveLightStudy.renderNow({moving:false});});
 report.checks.fixedFrames=[];for(let i=0;i<12;i++){await page.evaluate(()=>window.__archiveLightStudy.renderNow({moving:false}));report.checks.fixedFrames.push(await halfSummary(page));}assert.equal(new Set(report.checks.fixedFrames.map(x=>x.hash)).size,1);
 report.checks.sweep=[];report.checks.orbit=[];
 for(let i=0;i<12;i++){const az=25+i*5;await page.evaluate(az=>{const a=window.__archiveLightStudy;a.setState({azimuth:az,elevation:54.4});a.renderNow({moving:false});},az);report.checks.sweep.push({az,...await halfSummary(page)});await page.screenshot({path:join(out,'frames',`sweep-${String(i).padStart(2,'0')}.png`)});}
 await page.evaluate(()=>window.__archiveLightStudy.setState({azimuth:46.4,elevation:54.4}));
 const lightCount=await page.evaluate(()=>window.__archiveLightStudy.engine.stats.lightDepthRenders);
 for(let i=0;i<12;i++){const position=[-1+i*.1,1.5,-3.8];await page.evaluate(p=>{const a=window.__archiveLightStudy;a.positionCamera(p,[1.5,3.4,-3.5],52);a.renderNow({moving:false});},position);report.checks.orbit.push({position,...await halfSummary(page)});await page.screenshot({path:join(out,'frames',`orbit-${String(i).padStart(2,'0')}.png`)});}
 // First orbit frame consumes the pending light change; subsequent camera moves reuse raw light depth.
 assert.equal(new Set(report.checks.orbit.map(x=>x.depthRenders)).size,1);assert.equal(report.checks.orbit[0].depthRenders-lightCount,1);
 report.checks.cameraDepthCache='PASS';
 await page.evaluate(()=>{document.querySelector('aside').style.display='';document.querySelector('#panel').open=true;window.__archiveLightStudy.resume();window.__archiveLightStudy.setState({quality:'auto',enabled:true});});
 await page.waitForTimeout(1000);await page.locator('#azimuth').fill('47');await page.waitForTimeout(1000);
 report.checks.autoQuality=await page.evaluate(()=>window.__archiveLightStudy.qualityEvents.map(e=>e.quality));assert(report.checks.autoQuality.includes('fast'));assert.equal(report.checks.autoQuality.at(-1),'settled');await page.evaluate(()=>window.__archiveLightStudy.pause());
 await page.setViewportSize({width:1280,height:720});await page.locator('#shaftsView').click();await page.evaluate(()=>{const a=window.__archiveLightStudy;a.setState({quality:'high',strength:1});a.renderNow({moving:false});});await page.screenshot({path:join(out,'archive-curtain-1280.png'),timeout:120000});
 await page.locator('#panel').evaluate(e=>e.open=false);await page.evaluate(()=>window.__archiveLightStudy.renderNow({moving:false}));await page.screenshot({path:join(out,'archive-curtain-clear-1280.png'),timeout:120000});
 report.checks.highSettings=await page.evaluate(()=>({snapshot:window.__archiveLightStudy.snapshot(),stats:window.__archiveLightStudy.engine.stats}));
 await page.evaluate(()=>{window.__archiveLightStudy.setState({enabled:false});window.__archiveLightStudy.renderNow({moving:false});});await page.screenshot({path:join(out,'archive-curtain-off-1280.png'),timeout:120000});
 await page.setViewportSize({width:375,height:667});await page.locator('#panel').evaluate(e=>e.open=true);await page.evaluate(()=>window.__archiveLightStudy.renderNow({moving:false}));report.checks.mobileLayout=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(report.checks.mobileLayout.scrollWidth<=375);
 const reduced=await browser.newPage({viewport:{width:375,height:667},reducedMotion:'reduce'});await reduced.goto(base+'/light-study.html?view=shafts',{waitUntil:'networkidle'});await reduced.waitForFunction(()=>window.__archiveLightStudy?.engine.stats.frames>0,{timeout:120000});assert.equal(await reduced.evaluate(()=>window.__archiveLightStudy.lighting.state.frozen),true);await reduced.close();report.checks.reducedMotion='PASS';
 report.result='PASS';assert.equal(report.errors.length,0);assert.equal(report.failedRequests.length,0);console.log('PASS: GLB optical audit, range/reset/share, tone parity, 12 fixed/sweep/orbit, cache, quality, viewport/reduced-motion');
}catch(e){report.result='FAIL';report.failure=String(e?.stack||e);process.exitCode=1;console.error(report.failure);}finally{await writeFile(join(out,'qa-result.json'),JSON.stringify(report,null,2)+'\n','utf8');await browser?.close();await new Promise(r=>server.close(r));await rm(site,{recursive:true,force:true});console.log('Evidence:',out);}
