"""Cloud visual/optical QA; serve the staged package and this task's bench.html first."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import argparse,json
args=argparse.ArgumentParser();args.add_argument('--base',default='http://127.0.0.1:8767/');options=args.parse_args()
root=Path(__file__).resolve().parents[2];out=root/'verification/r1-archive-window-penumbra-20261020';out.mkdir(exist_ok=True)
r={'errors':[],'failed_requests':[],'base':options.base}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page(viewport={'width':960,'height':640})
 page.on('pageerror',lambda e:r['errors'].append(str(e)));page.on('console',lambda m:r['errors'].append(m.text) if m.type=='error' else None);page.on('requestfailed',lambda q:r['failed_requests'].append(q.url))
 page.goto(options.base+'light-study.html?view=window');page.wait_for_function('window.__archiveLightStudy?.engine.stats.frames>0',timeout=120000);page.evaluate('window.__archiveLightStudy.pause()');page.locator('#panel').evaluate('(e)=>e.open=false')
 r['geometry']=page.evaluate('''async()=>{const a=window.__archiveLightStudy,T=await import('three'),ray=new T.Raycaster(),states=[];for(const roof of [false,true])for(const win of [false,true]){a.setApertures(roof);a.setWindow(win,false);a.root.updateWorldMatrix(true,true);ray.far=.8;ray.set(new T.Vector3(-4,3.05,-4.4),new T.Vector3(1,0,0));const windowHits=ray.intersectObject(a.root,true).filter(h=>h.object.visible).map(h=>({material:h.object.material.name,point:h.point.toArray()}));ray.set(new T.Vector3(.55,5.45,-1.85),new T.Vector3(0,-1,0));const roofHits=ray.intersectObject(a.root,true).filter(h=>h.object.visible).map(h=>h.distance);ray.set(new T.Vector3(-2,5.45,-2),new T.Vector3(0,-1,0));const solid=ray.intersectObject(a.root,true).map(h=>h.distance);states.push({roof,win,windowHits,roofHits,solid});}return states;}''')
 for s in r['geometry']:
  assert bool(s['windowHits'])!=s['win'],s
  assert bool(s['roofHits'])!=s['roof'],s
  assert s['solid'],s
 print('PASS roof/window independent toggles and outside solid',flush=True)
 page.evaluate('window.__archiveLightStudy.setApertures(true)')
 for name,win,props,diameter in [('original',False,False,0),('large-window',True,False,0),('props-hard',True,True,0),('props-soft',True,True,.53),('props-wide',True,True,1.5)]:
  page.evaluate('(s)=>{const a=window.__archiveLightStudy;a.setWindow(s.win,s.props);a.setState({sunDiameter:s.diameter});a.renderNow({moving:false});}',{'win':win,'props':props,'diameter':diameter});page.screenshot(path=str(out/(name+'.png')),timeout=120000)
 page.locator('#panel').evaluate('(e)=>e.open=true');page.locator('#windowReceiver').click();page.locator('#panel').evaluate('(e)=>e.open=false');page.evaluate('window.__archiveLightStudy.renderNow({moving:false})');page.screenshot(path=str(out/'bookshelf-receiver.png'),timeout=120000)
 # Six directions, fixed camera/air, including side-window no-direct-light cases.
 r['sweep']=[]
 for i,az in enumerate([270,285,300,315,330,345]):
  page.evaluate('(a)=>{const s=window.__archiveLightStudy;s.setState({azimuth:a});s.renderNow({moving:false});}',az);page.screenshot(path=str(out/f'angle-{az}.png'),timeout=120000);r['sweep'].append(page.evaluate('window.__archiveLightStudy.snapshot()'))
 # Compare saved link and actual range control; changing disc does not rerender light depth.
 page.locator('#panel').evaluate('(e)=>e.open=true');before=page.evaluate('window.__archiveLightStudy.engine.stats.lightDepthRenders');page.locator('#sunDiameter').fill('0.53');page.locator('#sunDiameter').press('ArrowRight');page.evaluate('window.__archiveLightStudy.renderNow({moving:false})');assert abs(page.evaluate('window.__archiveLightStudy.lighting.state.sunDiameter')-.54)<1e-6;assert page.evaluate('window.__archiveLightStudy.engine.stats.lightDepthRenders')==before
 saved=page.evaluate('window.__archiveLightStudy.snapshot()');page.locator('#reset').click();assert page.evaluate('window.__archiveLightStudy.snapshot().light.sunDiameter')==0;assert not page.evaluate('window.__archiveLightStudy.windowStudy.enabled');page.evaluate('(s)=>window.__archiveLightStudy.restore(s)',saved);assert page.evaluate('window.__archiveLightStudy.snapshot().windowStudy')==saved['windowStudy'];r['range_reset_restore']='PASS'
 # Isolate self-authored kit in clay. Engine mirrors exact source visibility and materials.
 r['kit']=page.evaluate('''async()=>{const a=window.__archiveLightStudy,T=await import('three');a.setWindow(true,true);a.setState({azimuth:290,elevation:40,enabled:false,sunDiameter:.53});const g=a.windowStudy.group;a.root.traverse(o=>{if(o.isMesh&&!g.getObjectById(o.id))o.visible=false;});g.traverse(o=>{if(o.isMesh){o.material=new T.MeshStandardMaterial({color:0xb6b6b6,roughness:.8,side:T.DoubleSide});o.castShadow=o.receiveShadow=true;}});a.engine.markLightDirty();const audit=[];g.traverse(o=>{if(!o.isMesh)return;const pos=o.geometry.attributes.position,idx=o.geometry.index;let degenerate=0;for(let i=0;i<(idx?.count||pos.count);i+=3){const v=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,idx?idx.getX(i+j):i+j));if(new T.Vector3().subVectors(v[1],v[0]).cross(new T.Vector3().subVectors(v[2],v[0])).lengthSq()<1e-18)degenerate++;}audit.push({name:o.name,triangles:(idx?.count||pos.count)/3,degenerate,scale:o.scale.toArray()});});return audit;}''')
 assert all(x['degenerate']==0 for x in r['kit']),r['kit']
 for name,pos,target in [('clay-front',[.4,3.75,-3.375],[-3.6,3.75,-3.375]),('clay-side',[-3.2,3.75,-.4],[-3.6,3.75,-3.375]),('clay-threequarter',[-.2,4.4,-1.2],[-3.6,3.75,-3.375])]:
  page.locator('#panel').evaluate('(e)=>e.open=false');page.evaluate('(s)=>{const a=window.__archiveLightStudy;a.positionCamera(s.pos,s.target,45);a.renderNow({moving:false});}',{'pos':pos,'target':target});page.screenshot(path=str(out/(name+'.png')),timeout=120000)
 # Contact-hardening fixture, identical blockers at .15 and 3 m above the same plane.
 page.goto(options.base+'penumbra-bench.html');page.wait_for_function('window.__penumbraBench',timeout=120000);r['penumbra']={}
 for diameter in [0,.53,1.5]:
  page.evaluate('(d)=>window.__penumbraBench.render(d)',diameter);profiles=page.evaluate('()=>({near:window.__penumbraBench.profile(-.9,.15),far:window.__penumbraBench.profile(.9,3)})');widths={}
  for kind,center in [('near',-.9),('far',.9)]:
   profile=profiles[kind];lo,hi=min(profile),max(profile);widths[kind]=sum(.1<(profile[i]-lo)/(hi-lo)<.9 for i in range(round((center+.15+2)*256),round((center+.4+2)*256)))
  r['penumbra'][str(diameter)]={'profiles':profiles,'transition_10_90_px':widths};page.screenshot(path=str(out/f'penumbra-{diameter}.png'),timeout=120000)
 assert r['penumbra']['0.53']['transition_10_90_px']['far']>r['penumbra']['0.53']['transition_10_90_px']['near']
 assert r['penumbra']['1.5']['transition_10_90_px']['far']>r['penumbra']['0.53']['transition_10_90_px']['far']
 assert not r['errors'],r['errors'];assert not r['failed_requests'],r['failed_requests'];r['result']='PASS';b.close()
(out/'qa-result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print('PASS geometry/kit/range/reset/restore/six directions/contact hardening',flush=True)
