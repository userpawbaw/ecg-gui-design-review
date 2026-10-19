from playwright.sync_api import sync_playwright
from pathlib import Path
import json
import argparse
args=argparse.ArgumentParser();args.add_argument('--url',default='http://127.0.0.1:8766/light-study.html?view=aisle');options=args.parse_args()
root=Path(__file__).resolve().parents[2]
out=root/'verification/r1-archive-aisle-apertures-20261019';out.mkdir(exist_ok=True);r={'errors':[],'url':options.url}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':960,'height':640});page.on('pageerror',lambda e:r['errors'].append(str(e)))
 page.goto(options.url);page.wait_for_function('window.__archiveLightStudy?.engine.stats.frames>0',timeout=120000);page.evaluate('window.__archiveLightStudy.pause()');page.locator('#panel').evaluate('(e)=>e.open=false')
 for value in [False,True]:
  page.evaluate('(v)=>{const a=window.__archiveLightStudy;a.setApertures(v);a.renderNow({moving:false});}',value)
  page.screenshot(path=str(out/('after.png' if value else 'before.png')),timeout=120000)
  r[str(value)]=page.evaluate('''async()=>{const a=window.__archiveLightStudy,T=await import('three'),ray=new T.Raycaster();ray.far=.4;const holes=a.apertures.holes.map(h=>{ray.set(new T.Vector3((h.x[0]+h.x[1])/2,5.45,(h.z[0]+h.z[1])/2),new T.Vector3(0,-1,0));return ray.intersectObject(a.root,true).map(v=>v.distance)});const d=a.engine.readVolume();let sum=0,max=0;for(let i=0;i<d.pixels.length;i+=4){const v=T.DataUtils.fromHalfFloat(d.pixels[i]);sum+=v;max=Math.max(max,v);}ray.far=.8;ray.set(new T.Vector3(-2,5.45,-2),new T.Vector3(0,-1,0));const solid=ray.intersectObject(a.root,true).map(v=>v.distance);return {solid,holes,volumeMean:sum/(d.width*d.height),volumeMax:max,geometry:a.apertures.stats,state:a.snapshot(),stats:a.engine.stats};}''')
 assert all(len(r[str(v)]['solid'])>0 for v in [False,True]),r
 page.locator('#panel').evaluate('(e)=>e.open=true');page.locator('#aisleFront').click();page.locator('#panel').evaluate('(e)=>e.open=false');page.evaluate('window.__archiveLightStudy.renderNow({moving:false})');page.screenshot(path=str(out/'bookshelf-front.png'),timeout=120000)
 assert not r['errors'],r
 assert all(len(x)==0 for x in r['True']['holes']),r
 assert all(len(x)>0 for x in r['False']['holes']),r
 (out/'qa-result.json').write_text(json.dumps(r,indent=2));b.close()
print(json.dumps(r,indent=2))
