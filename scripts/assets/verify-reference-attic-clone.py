"""Browser QA for the self-authored D-159 clone; no reference data required.
Accepts a local staged URL or public Pages URL. Captures only our new scene.
"""
import argparse,base64,hashlib,json,math,subprocess,time
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
pins=[]
for cert in Path('/usr/local/share/ca-certificates').glob('*proxy*.crt'):
 pub=subprocess.check_output(['openssl','x509','-in',str(cert),'-pubkey','-noout']);der=subprocess.check_output(['openssl','pkey','-pubin','-outform','DER'],input=pub);pins.append(base64.b64encode(hashlib.sha256(der).digest()).decode())
args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
if pins:args.append('--ignore-certificate-errors-spki-list='+','.join(pins))
r={'url':a.url,'errors':[],'failed_requests':[],'bad_responses':[],'requests':[],'frames':[]}
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=args);page=b.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
 page.on('request',lambda q:r['requests'].append(q.url));page.on('pageerror',lambda e:r['errors'].append(str(e)));page.on('requestfailed',lambda q:r['failed_requests'].append({'url':q.url,'failure':q.failure}));page.on('response',lambda q:r['bad_responses'].append({'url':q.url,'status':q.status}) if q.status>=400 else None)
 t=time.monotonic();response=page.goto(a.url,wait_until='networkidle',timeout=120000);assert response.status==200
 page.wait_for_function('window.__atticClone',timeout=120000);r['load_seconds']=round(time.monotonic()-t,3);r['browser']=b.version
 r['scene']=page.evaluate('''()=>{const a=window.__atticClone;let meshes=0,triangles=0;const atlas=[];a.root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;atlas.push({name:o.name,width:o.material.uniforms.map.value.image.width,height:o.material.uniforms.map.value.image.height});}});return {meshes,triangles,atlas,fov:a.camera.fov,build:a.build,render:a.renderer.info.render};}''')
 assert r['scene']['meshes']==4;assert len(r['scene']['atlas'])==4;assert all(t['width']==4096 for t in r['scene']['atlas'])
 page.screenshot(path=str(a.output/'preview.png'));page.add_style_tag(content='header,.panel{visibility:hidden}')
 for i in range(12):
  p=i/11;page.evaluate('(p)=>{__atticClone.setProgress(p);__atticClone.render()}',p);page.screenshot(path=str(a.output/f'descent-{i:02}.png'))
  pose=page.evaluate('({position:__atticClone.camera.position.toArray(),rotation:__atticClone.camera.quaternion.toArray()})');expected=-.43924284-2.75*p;assert abs(pose['position'][1]-expected)<1e-7
  r['frames'].append({'progress':p,**pose,'sha256':hashlib.sha256((a.output/f'descent-{i:02}.png').read_bytes()).hexdigest()})
 assert len({f['sha256'] for f in r['frames']})==12
 for name,progress in [('upper',-1),('attic-midpoint',.5)]:
  page.evaluate('(p)=>{__atticClone.setProgress(p);__atticClone.render()}',progress);page.screenshot(path=str(a.output/(name+'.png')))
 page.screenshot(path=str(a.output/'repeat-1.png'));page.evaluate('__atticClone.setProgress(-1);__atticClone.setProgress(.5);__atticClone.render()');page.screenshot(path=str(a.output/'repeat-2.png'))
 assert (a.output/'repeat-1.png').read_bytes()==(a.output/'repeat-2.png').read_bytes();r['same_position_repeat']='PASS'
 page.add_style_tag(content='header,.panel{visibility:visible}');page.locator('#progress').fill('0.8');assert abs(page.evaluate('__atticClone.progress')-.8)<1e-7;page.locator('#upper').click();assert page.evaluate('__atticClone.progress')==-1;page.locator('#attic').click();assert page.evaluate('__atticClone.progress')==.5
 page.mouse.move(500,300);before=page.evaluate('__atticClone.camera.quaternion.toArray()');page.mouse.move(1200,600);page.wait_for_timeout(400);after=page.evaluate('__atticClone.camera.quaternion.toArray()');assert before!=after;r['pointer']='PASS'
 page.locator('#orbit').click();assert page.locator('#orbit').get_attribute('aria-pressed')=='true';before=page.evaluate('__atticClone.camera.position.toArray()');page.mouse.move(700,340);page.mouse.down();page.mouse.move(800,380,steps=6);page.mouse.up();page.wait_for_timeout(250);after=page.evaluate('__atticClone.camera.position.toArray()');assert before!=after;r['orbit']='PASS'
 page.locator('#reset').click();assert page.locator('#orbit').get_attribute('aria-pressed')=='false';assert page.evaluate('__atticClone.progress')==.5;r['reset']='PASS'
 page.mouse.move(600,350);page.mouse.wheel(0,100);assert page.evaluate('__atticClone.progress')>.5;r['wheel']='PASS'
 page.emulate_media(reduced_motion='reduce');page.locator('#reset').click();page.mouse.move(1200,600);page.wait_for_timeout(200);r['reduced_motion_rotation']=page.evaluate('__atticClone.camera.rotation.toArray().slice(0,3)');assert max(abs(n) for n in r['reduced_motion_rotation'])<1e-7
 page.set_viewport_size({'width':390,'height':844});page.wait_for_function('__atticClone.camera.aspect===innerWidth/innerHeight');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=str(a.output/'mobile.png'));r['mobile']='390x844 no horizontal overflow; actual touch not tested'
 assert not any('leoparpeix.com' in u for u in r['requests']);assert not r['errors'],r['errors'];assert not r['failed_requests'],r['failed_requests'];assert not r['bad_responses'],r['bad_responses'];r['result']='PASS';b.close()
(a.output/'browser-result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print('PASS',r['scene'],flush=True)
