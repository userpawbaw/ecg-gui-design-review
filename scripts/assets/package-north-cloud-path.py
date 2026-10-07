"""Pin the native optical plates and small runtime WebP derivatives."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
R=Path(__file__).resolve().parents[2];O=R/'verification/a-north-cloud-path-20261007';P=R/'prototype/spikes/a-climb/public/north-earth/cloud-path'
m=json.loads((O/'manifest.json').read_text());assert len(m['frames'])==m['count']==40
pins=[]
for f in m['frames']:
 source=O/f"{f['index']:03}.png";assert hashlib.sha256(source.read_bytes()).hexdigest()==f['sha256']
 image=Image.open(source).convert('RGB');assert image.size==(960,540)
 target=P/f"{f['index']:03}.webp";image.save(target,'WEBP',quality=92,method=6)
 pins.append({'file':str(target.relative_to(R)).replace('\\','/'),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
m['runtime_files']=pins;m['runtime_encoded_bytes']=sum(p['bytes'] for p in pins);m['decoded_rgba_bytes']=40*960*540*4;m['shader_color']='AgX sRGB plates after OutputPass; no second tone mapping';m['motion_limit']='40 native frames with neighbor crossfade; not optical-flow interpolation or verified <=3px/frame at 1920'
(P/'manifest.json').write_text(json.dumps(m,indent=2)+'\n',encoding='utf-8');(O/'manifest.json').write_text(json.dumps(m,indent=2)+'\n',encoding='utf-8')
sheet=Image.new('RGB',(1280,750),(15,18,23));draw=ImageDraw.Draw(sheet)
for j,i in enumerate([0,4,8,12,16,20,24,28,32,35,37,39]):
 im=Image.open(O/f'{i:03}.png');im.thumbnail((320,180));x=j%4*320;y=j//4*250;sheet.paste(im,(x,y));draw.text((x+10,y+190),f'VDB {i:03} / q={i/39:.3f}',fill='white')
sheet.save(O/'contact.jpg',quality=93)
registry=R/'assets/registry.json';r=json.loads(registry.read_text(encoding='utf-8'));items=r['assets']
entry={'id':'north-vdb-cloud-path-20261007','kind':'rendered-image-sequence','status':'test-only','source_url':'https://jangafx.com/software/embergen/download/free-vdb-animations','licence':'CC0 source CloudPack; terrain source licences retained in terrain entries','original':None,'processed':{'file':str((P/'manifest.json').relative_to(R)).replace('\\','/'),'sha256':hashlib.sha256((P/'manifest.json').read_bytes()).hexdigest(),'bytes':m['runtime_encoded_bytes']},'used_by':['prototype/spikes/a-climb/cloud-path.ts'],'review':'D098 physical Cycles VDB+1.5x terrain path, TUNE before user combined review; no live volume/AI video','pins_manifest':str((P/'manifest.json').relative_to(R)).replace('\\','/')}
items[:]=[e for e in items if e['id']!=entry['id']];items.append(entry);registry.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PACKAGED',len(pins),m['runtime_encoded_bytes'],'decoded',m['decoded_rgba_bytes'])
