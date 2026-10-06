"""Build review gallery and pin inputs/output integrity, using bundled Pillow runtime."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib, math, shutil
R=Path(__file__).resolve().parents[2]; O=R/'verification/a-earth-routes-20261007'
manifest=json.loads((O/'render-manifest.json').read_text())
assert len(manifest['frames'])==12
for f in manifest['frames']:
    p=O/(f['name']+'.png')
    assert Image.open(p).size==(1280,720)
    assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256']
    c=f['camera']; t=f['target']; v=[t[i]-c[i] for i in range(3)]
    norm=math.sqrt(sum(q*q for q in v)); v=[q/norm for q in v]
    b=sum(c[i]*v[i] for i in range(3)); disc=b*b-(sum(q*q for q in c)-1)
    if disc>=0:
        dist=-b-math.sqrt(disc); hit=[c[i]+dist*v[i] for i in range(3)]
        f['center_ray_surface_latlon']=[math.degrees(math.asin(hit[2])),math.degrees(math.atan2(hit[1],hit[0]))]
    else: f['center_ray_surface_latlon']=None
(O/'render-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')

def contact(folder,out,names):
    sheet=Image.new('RGB',(960,294*math.ceil(len(names)/2)), '#111820')
    draw=ImageDraw.Draw(sheet)
    for i,name in enumerate(names):
        img=Image.open(folder/(name+'.png')).convert('RGB').resize((480,270))
        x=(i%2)*480; y=(i//2)*294
        sheet.paste(img,(x,y)); draw.text((x+8,y+274),name,fill='white')
    sheet.save(out,quality=92)
names=[f'{route}-{j:02}-{shot}-moto' for j,shot in enumerate(['globe','turn','high-orbit','low-orbit','cloud-entry'],1) for route in ['north','south']]
contact(O,O/'route-contact.jpg',names)
contact(O,O/'material-contact.jpg',[f'{r}-01-globe-{style}' for r in ['north','south'] for style in ['existing','moto']])
for version in ['topdown-v1','horizon-v2']:
    folder=R/f'verification/a-earth-routes-20261007-{version}'
    if list(folder.glob('*.png')): contact(folder,folder/'contact.jpg',names)
    dest=R/f'assets/source/earth-route-rejected-{version}'
    dest.mkdir(parents=True,exist_ok=True)
    for p in folder.glob('*.png'): shutil.move(str(p),str(dest/p.name))

audit=json.loads((R/'verification/moto-earth-audit-20261007/audit.json').read_text())
acq=[]
registry=json.loads((R/'assets/registry.json').read_text(encoding='utf-8'))
for a in audit['assets']:
    p=R/f"assets/source/moto-reference-20261007/{a['role']}.webp"
    pin={'role':a['role'],'url':a['url'],'file':str(p.relative_to(R)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'dimensions':list(Image.open(p).size)}
    acq.append(pin)
    entry={'id':f"moto-earth-{a['role']}-20261007",'title':f"Moto public Earth {a['role']} texture",'kind':'texture','status':'test-only','source':{'type':'page','page':'https://www.moto-card.com/','url':a['url']},'licence':'unknown','attribution_required':None,'original':{k:pin[k] for k in ['file','bytes','sha256']},'processed':None,'used_by':['scripts/assets/render-earth-routes.py'],'review':'D-084 internal concept use; D-088 independent frame trial. No exhibition rights clearance or authorship inferred.'}
    registry['assets']=[e for e in registry['assets'] if e['id']!=entry['id']]+[entry]
(R/'assets/registry.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(O/'acquisition.json').write_text(json.dumps({'use_stage':'internal concept D084','sources':acq,'rejected_originals':'assets/source/earth-route-rejected-{topdown-v1,horizon-v2}','method':'Same translated Blender material/lighting for both map sets; not old-runtime versus new-runtime. Moto blue channel not blended into base white cloud color: partial material translation. No new DEM or regional imagery yet.'},indent=2)+'\n')
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>지구 경로·자산 실제 렌더 비교</title><style>body{margin:32px;background:#10151c;color:#e9edf2;font:16px/1.7 system-ui}main{max-width:1440px;margin:auto}img{width:100%;display:block}section{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}h2{margin-top:48px}figcaption{padding:12px}a{color:#9be4ff}.note{background:#202a35;padding:20px}</style><main><h1>Moto 자산 · 북반구 / 남반구 경로</h1><p class="note">실제 공개 텍스처와 승인된 VDB를 사용하는 독립 Blender 렌더입니다. 완성 도입부·웹 구현·목업 충실도 승인 자료가 아닙니다. 확대 지표는 4K 그대로여서 뭉개짐이 남습니다. 구름의 밀도/지역 크기/하늘 fill도 추가 보정 대상입니다.</p><h2>같은 재질·광원에서 텍스처 비교</h2><section>'''
for r in ['north','south']:
    for style in ['existing','moto']:
        tag=f'{r}-01-globe-{style}'; html+=f'<figure><a href="{tag}.png"><img src="{tag}.png"></a><figcaption>{tag}</figcaption></figure>'
html+='</section>'
labels=['원형 지구','회전 접근','높은 궤도','낮은 궤도','구름 입구']
for i,label in enumerate(labels,1):
    html+=f'<h2>{i}. {label}</h2><section>'
    for r in ['north','south']:
        f=next(f for f in manifest['frames'] if f['name'].startswith(f'{r}-{i:02}') and f['style']=='moto')
        tag=f['name']; html+=f'<figure><a href="{tag}.png"><img src="{tag}.png"></a><figcaption>{r} · 목표 {f["lat"]}°, {f["lon"]}° · 방사 고도 {f["nominal_radial_altitude_km"]:.1f} km</figcaption></figure>'
    html+='</section>'
html+='<h2>판정</h2><p>원형 지구 외관: 북반구 우선 TUNE. 확대 경로: 두 안 모두 지역 지표 자료가 필요. 구름: 기존 모양 KEEP을 유지하며 지역 배치/빛은 TUNE. 반구 최종 확정과 사용자 제작 피드백2는 아직 진행하지 않았습니다.</p></main></html>'
(O/'gallery.html').write_text(html,encoding='utf-8')
print('12 rendered PNGs hash/dimension verified; source maps pinned; gallery built')
