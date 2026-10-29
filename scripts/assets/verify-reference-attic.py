"""D-158: verify a scratch-only original-data replay, keeping all captures out of Git."""
import argparse
import hashlib
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--artifacts',type=Path,required=True);p.add_argument('--report',type=Path,required=True);a=p.parse_args();out=a.artifacts.resolve()
if out==ROOT or ROOT in out.parents:raise SystemExit('Original-data captures must stay outside the repository')
if a.report.suffix!='.json':raise SystemExit('The durable report must be numeric JSON')
out.mkdir(parents=True,exist_ok=True);r={'scope':'Original-asset analysis replay; not self-authored assets/full website clone','errors':[],'failed_requests':[],'frames':[],'omitted':['floor hash blur3','website DOM/postprocessing','cloud/dust overlays','pointer motion playback']}
with sync_playwright()as pw:
    b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page(viewport={'width':1280,'height':720});page.set_default_timeout(120000);page.set_default_navigation_timeout(120000);page.on('pageerror',lambda e:r['errors'].append(str(e)));page.on('console',lambda m:r['errors'].append(m.text)if m.type=='error'else None);page.on('requestfailed',lambda q:r['failed_requests'].append(q.url))
    page.goto(a.url);page.wait_for_function('window.__referenceAnalysis');page.locator('aside').evaluate('(e)=>e.style.display="none"')
    r['audit']=page.evaluate('({meshes:window.__referenceAnalysis.meshAudit,base:window.__referenceAnalysis.base,rotation:window.__referenceAnalysis.rotation})')
    assert len(r['audit']['meshes'])==13 and sum(x['triangles']for x in r['audit']['meshes'])==22796
    assert len(set(x['texture']for x in r['audit']['meshes']))==7
    r['progress_input']=page.evaluate('''()=>{const slider=document.querySelector('#progress');slider.value='.375';slider.dispatchEvent(new Event('input',{bubbles:true}));return window.__referenceAnalysis.camera.position.toArray();}''');assert abs(r['progress_input'][1]-(r['audit']['base']['y']-2.75*1.375))<1e-8
    for i in range(12):
        progress=i/11;page.evaluate('(p)=>window.__referenceAnalysis.setProgress(p)',progress)
        state=page.evaluate('({position:window.__referenceAnalysis.camera.position.toArray(),fov:window.__referenceAnalysis.camera.fov,quaternion:window.__referenceAnalysis.camera.quaternion.toArray(),drawCalls:window.__referenceAnalysis.renderer.info.render.calls})');state['progress']=progress
        assert abs(state['position'][1]-(r['audit']['base']['y']-2.75*(1+progress)))<1e-8
        assert abs(state['fov']-22.8951919564)<1e-8 and abs(state['position'][0]-14.7563982)<1e-8
        page.screenshot(path=str(out/f'descent-{i:02}.png'));r['frames'].append(state)
    page.evaluate('window.__referenceAnalysis.setProgress(.5)');first=page.screenshot(path=str(out/'attic-midpoint.png'))
    page.evaluate('window.__referenceAnalysis.setProgress(.9);window.__referenceAnalysis.setProgress(.5)');second=page.screenshot();assert hashlib.sha256(first).digest()==hashlib.sha256(second).digest();r['same_progress_repeat']='PASS'
    pieces=page.evaluate('window.__referenceAnalysis.measureComponents()');assert sum(x['triangles']for x in pieces)==22796;r['component_count']=len(pieces)
    page.evaluate('window.__referenceAnalysis.upper()');page.screenshot(path=str(out/'upper.png'));page.evaluate('window.__referenceAnalysis.overview()');page.screenshot(path=str(out/'overview.png'))
    assert not r['errors']and not r['failed_requests'],r
    r['result']='PASS';b.close()
a.report.parent.mkdir(exist_ok=True,parents=True);a.report.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('PASS source decode/mapping/camera path12frames/repeat/input/components; captures stay in scratch')
