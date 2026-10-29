"""D-158: collect authorized public reference material into scratch storage only.

Browser transport is intentional: the site's ordinary HTTP client path returned
Cloudflare1010 whereas its normal browser visit answered200. No stealth, proxy
bypass, credentials, or challenge solving is used. Do not publish these inputs.
"""
import argparse
import base64
from datetime import datetime,timezone
import hashlib
import json
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--destination',type=Path,required=True);p.add_argument('--resolution',choices=['2048','4096'],default='4096');a=p.parse_args();dest=a.destination.resolve()
if dest==ROOT or ROOT in dest.parents:raise SystemExit('Reference material must stay outside the repository')
dest.mkdir(parents=True,exist_ok=True)
args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
# Trust only the configured session CA keys, never disable TLS checking globally.
pins=[]
for cert in Path('/usr/local/share/ca-certificates').glob('*proxy*.crt'):
    public=subprocess.check_output(['openssl','x509','-in',str(cert),'-pubkey','-noout'])
    der=subprocess.check_output(['openssl','pkey','-pubin','-outform','DER'],input=public)
    pins.append(base64.b64encode(hashlib.sha256(der).digest()).decode())
if pins:args.append('--ignore-certificate-errors-spki-list='+','.join(pins))
report={'scope':'Scratch-only reference collection; not production assets','observed_at_utc':datetime.now(timezone.utc).isoformat(),'files':[]}
with sync_playwright()as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=args)
    page=browser.new_page(viewport={'width':1920,'height':1080});responses=[];page.on('response',lambda response:responses.append(response))
    response=page.goto('https://leoparpeix.com/',wait_until='domcontentloaded',timeout=120000);report['page_status']=response.status;report['page_url']=page.url
    if response.status!=200:raise SystemExit('Reference page did not return200')
    page.wait_for_timeout(12000)
    scripts=page.locator('script[src]').evaluate_all('(s)=>s.map(x=>x.src)')
    for response in responses:
        if response.url in scripts and 'leoparpeix.com/'in response.url and response.status==200:
            data=response.body();name=response.url.split('?')[0].rsplit('/',1)[-1];(dest/name).write_bytes(data);report['files'].append({'url':response.url,'file':name,'status':200,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
    urls=['https://cdn.leoparpeix.com/assets/models/home/scene_v9.glb']
    urls+=['https://cdn.leoparpeix.com/assets/textures/home/scene-ktx/'+a.resolution+'/'+n+'.ktx2'for n in ['TexFleur','TexProps','TexMobilier','TexTableaux','TexBibli','TexFloor','TexWalls']]
    for url in urls:
        result=page.evaluate('''async url=>{const r=await fetch(url);if(!r.ok)return {status:r.status};const bytes=new Uint8Array(await r.arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return {status:r.status,data:btoa(text)};}''',url)
        name=url.rsplit('/',1)[-1]
        if result['status']!=200:raise SystemExit(name+' returned '+str(result['status']))
        data=base64.b64decode(result['data']);(dest/name).write_bytes(data);report['files'].append({'url':url,'file':name,'status':200,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()});print(name,len(data))
    browser.close()
(dest/'source-probe.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
