"""D-152 cloud-only renderer QA. Serve staged package plus the existing optical bench."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import argparse,json,time
args=argparse.ArgumentParser();args.add_argument('--base',default='http://127.0.0.1:8768/');options=args.parse_args()
root=Path(__file__).resolve().parents[2];out=root/'verification/r1-archive-curtain-motion-20261021';out.mkdir(exist_ok=True);(out/'frames').mkdir(exist_ok=True)
r={'errors':[],'failed_requests':[],'base':options.base,'scope':'Chromium SwiftShader; fixed-time image/readback QA, not physical GPU FPS'}
summary='''async()=>{const a=window.__archiveLightStudy||window.__bench,T=await import('three'),d=a.engine.readVolume();let sum=0,max=0,hash=2166136261;for(let i=0;i<d.pixels.length;i++){hash=Math.imul(hash^d.pixels[i],16777619);if(i%4===0){const v=T.DataUtils.fromHalfFloat(d.pixels[i]);sum+=v;max=Math.max(max,v);}}return {mean:sum/(d.width*d.height),max,hash:hash>>>0,depthRenders:a.engine.stats.lightDepthRenders};}'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page(viewport={'width':640,'height':480})
 page.on('pageerror',lambda e:r['errors'].append(str(e)));page.on('console',lambda m:r['errors'].append(m.text) if m.type=='error' else None);page.on('requestfailed',lambda q:r['failed_requests'].append(q.url))
 try:
  page.goto(options.base+'light-study.html?view=curtain');page.wait_for_function('window.__archiveLightStudy?.engine.stats.frames>0',timeout=120000);page.evaluate('window.__archiveLightStudy.pause()');page.locator('#panel').evaluate('(e)=>e.open=false')
  r['initial']=page.evaluate('window.__archiveLightStudy.snapshot()')
  # Identical sun, camera, frozen time for the three art modes.
  r['modes']={}
  for mode in ['legacy','sun','flow']:
   page.evaluate('(m)=>{const a=window.__archiveLightStudy;a.curtainPreset(m);a.setTime(8);a.renderNow({moving:false});}',mode);r['modes'][mode]=page.evaluate(summary);page.screenshot(path=str(out/(mode+'.png')),timeout=120000)
  assert r['modes']['flow']['mean']>r['modes']['legacy']['mean']*2
  # Three actual room poses; compare A/B within each, do not compare raw means across poses.
  r['views']={}
  for name,pos,target in [('away',[.7,1.6,2.5],[.7,2.7,-4.5]),('side',[.9,1.8,-2.5],[.2,3,.1]),('toward',[.7,1.6,-3.8],[.7,3,1])]:
   r['views'][name]={}
   for mode in ['legacy','sun']:
    page.evaluate('(s)=>{const a=window.__archiveLightStudy;a.positionCamera(s.pos,s.target,60);a.setState({curtainMode:s.mode,frozen:true});a.setTime(0);a.renderNow({moving:false});}',{'pos':pos,'target':target,'mode':mode});r['views'][name][mode]=page.evaluate(summary);page.screenshot(path=str(out/f'{name}-{mode}.png'),timeout=120000)
  assert r['views']['away']['sun']['mean']>r['views']['away']['legacy']['mean']
  assert r['views']['side']['sun']['mean']>r['views']['side']['legacy']['mean']
  # Twelve time samples and a deterministic repeat, with unchanged light-depth generation.
  page.evaluate("()=>{const a=window.__archiveLightStudy;a.positionCamera([.7,1.6,2.5],[.7,2.7,-4.5],60);a.setState({curtainMode:'flow',frozen:true});}")
  r['frames']=[]
  for i in range(12):
   page.evaluate('(t)=>{const a=window.__archiveLightStudy;a.setTime(t);a.renderNow({moving:false});}',i*2);v=page.evaluate(summary);v['time']=i*2;r['frames'].append(v);page.screenshot(path=str(out/f'frames/flow-{i:02}.png'),timeout=120000)
  assert len(set(x['hash']for x in r['frames']))==12
  assert len(set(x['depthRenders']for x in r['frames']))==1
  page.evaluate('window.__archiveLightStudy.setTime(8);window.__archiveLightStudy.renderNow({moving:false})');repeat=page.evaluate(summary);assert repeat['hash']==r['frames'][4]['hash'];r['deterministic_repeat']='PASS'
  # Actual freeze control stops the last nonzero field time, rather than replacing it by zero.
  page.locator('#panel').evaluate('(e)=>e.open=true');page.evaluate('window.__archiveLightStudy.setTime(7.25);window.__archiveLightStudy.resume()');page.locator('#frozen').uncheck();page.wait_for_function('window.__archiveLightStudy.clock.time>7.25',timeout=120000);page.locator('#frozen').check();page.evaluate('window.__archiveLightStudy.pause();window.__archiveLightStudy.renderNow({moving:false})');frozen=page.evaluate('window.__archiveLightStudy.clock.time');a=page.evaluate(summary);page.wait_for_timeout(100);page.evaluate('window.__archiveLightStudy.renderNow({moving:false})');assert page.evaluate('window.__archiveLightStudy.clock.time')==frozen;assert page.evaluate(summary)['hash']==a['hash'];assert frozen>=7.25;r['freeze_last_time']=frozen
  page.locator('#curtainSettings').evaluate('(e)=>e.open=true');depth=page.evaluate('window.__archiveLightStudy.engine.stats.lightDepthRenders');page.locator('#flowSpeed').fill('0.2');page.locator('#flowSpeed').press('ArrowRight');page.evaluate('window.__archiveLightStudy.renderNow({moving:false})');assert abs(page.evaluate('window.__archiveLightStudy.lighting.state.flowSpeed')-.21)<1e-6;assert page.evaluate('window.__archiveLightStudy.engine.stats.lightDepthRenders')==depth
  # Snapshot/share time + params, reset, legacy-link fallback while already in a new mode.
  saved=page.evaluate('window.__archiveLightStudy.snapshot()');page.get_by_text('결·품질 설정',exact=True).click();page.locator('#share').click();assert page.evaluate('JSON.parse(decodeURIComponent(location.hash.slice(1)))')==saved;page.locator('#reset').click();reset=page.evaluate('window.__archiveLightStudy.snapshot()');assert reset['light']['curtainMode']=='legacy' and reset['animationTime']==0
  page.evaluate('(s)=>window.__archiveLightStudy.restore(s)',saved);restored=page.evaluate('window.__archiveLightStudy.snapshot()');assert restored['light']==saved['light'] and restored['animationTime']==saved['animationTime']
  old={'version':1,'light':{'azimuth':0,'elevation':35,'frozen':True},'camera':saved['camera']};page.evaluate('(s)=>window.__archiveLightStudy.restore(s)',old);assert page.evaluate('window.__archiveLightStudy.lighting.state.curtainMode')=='legacy';assert page.evaluate('window.__archiveLightStudy.clock.time')==0;r['range_share_reset_legacy_restore']='PASS'
  # Clock pause/hidden is explicitly suspended. Check no hidden-time jump on sample.
  r['clock_transitions']=page.evaluate('''async()=>{const {createCurtainClock}=await import('./study/curtain-field.js'),c=createCurtainClock();c.sample(1000,true);c.sample(2000,true);const played=c.time;c.sample(9000,false);const held=c.time;c.suspend();c.sample(100000,true);const resumed=c.time;c.sample(100100,true);return {played,held,resumed,next:c.time};}''');assert r['clock_transitions']=={'played':1,'held':1,'resumed':1,'next':1.1}
  page.emulate_media(reduced_motion='reduce');page.goto(options.base+'light-study.html?view=curtain');page.wait_for_function('window.__archiveLightStudy?.engine.stats.frames>0',timeout=120000);page.evaluate('window.__archiveLightStudy.pause()');assert page.locator('#frozen').is_checked() and page.locator('#frozen').is_disabled();assert page.evaluate('window.__archiveLightStudy.lighting.state.curtainMode')=='flow';r['reduced_motion']='PASS';page.emulate_media(reduced_motion='no-preference')
  # Optical fixture: moving density never emits through a closed aperture.
  page.goto(options.base+'bench.html');page.wait_for_function('window.__bench',timeout=120000);r['optical']={}
  for mode in ['open','closed','alpha']:
   page.evaluate('(mode)=>{const a=window.__bench;a.lighting.set({curtainMode:"flow",cloudContrast:.7,airDensity:.032,beamGain:2.4});a.mode(mode);a.engine.render({time:8});}',mode);r['optical'][mode]=page.evaluate(summary)
  assert r['optical']['open']['mean']>0 and r['optical']['closed']['max']==0 and r['optical']['alpha']['mean']>0
  r['basis_continuity']=page.evaluate('''()=>{const a=window.__bench,saved={...a.lighting.state},v=[];for(const elevation of [75,76,77,85]){a.lighting.set({azimuth:0,elevation});a.engine.field.update(8);v.push({elevation,u:a.engine.field.uniforms.cfBasisU.value.toArray(),v:a.engine.field.uniforms.cfBasisV.value.toArray()});}a.lighting.set(saved);a.engine.markLightDirty();a.engine.render({time:8});return v;}''');assert all(abs(x['u'][0]+1)<1e-6 for x in r['basis_continuity'])
  r['shared_field']=page.evaluate('''()=>{const e=window.__bench.engine;return Object.keys(e.field.uniforms).every(k=>e.field.uniforms[k]===e.volumeUniforms[k]&&e.field.uniforms[k]===e.surfaceUniforms[k]);}''');assert r['shared_field']
  # Cloud animation affects actual PBR direct sunlight when the volume is off.
  def surface_read():return page.evaluate('''async()=>{const a=window.__bench,T=await import('three'),rt=a.engine.colorRT,p=new Uint16Array(rt.width*rt.height*4);a.renderer.readRenderTargetPixels(rt,0,0,rt.width,rt.height,p);let sum=0,hash=2166136261;for(let i=0;i<p.length;i++){hash=Math.imul(hash^p[i],16777619);if(i%4===0)sum+=T.DataUtils.fromHalfFloat(p[i]);}return {hash:hash>>>0,mean:sum/(rt.width*rt.height),depth:a.engine.stats.lightDepthRenders};}''')
  page.evaluate('window.__bench.camera.position.set(1.2,1.4,1.6);window.__bench.camera.lookAt(0,0,-.35);window.__bench.mode("open");window.__bench.lighting.set({enabled:false,cloudContrast:1,cloudScale:3});window.__bench.engine.render({time:0})');first=surface_read();page.evaluate('window.__bench.engine.render({time:20})');second=surface_read();assert first['hash']!=second['hash'] and first['depth']==second['depth'];r['surface_cloud_time']={'first':first,'second':second}
  assert not r['errors'],r['errors'];assert not r['failed_requests'],r['failed_requests'];r['result']='PASS'
 finally:
  (out/'qa-result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');b.close()
print('PASS three views / twelve times / freeze / share / legacy / reduced-motion / optical / shared cloud',flush=True)
