from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib
r=Path.cwd();v=r/'verification/a-arrival-20261006';out=r.parents[1]/'outputs/A_cloud_layers_review';out.mkdir(parents=True,exist_ok=True)
def sheet(files,dest,cols=3):
 im=Image.new('RGB',(480*cols,294*((len(files)+cols-1)//cols)),(15,15,15));d=ImageDraw.Draw(im)
 for i,f in enumerate(files):
  a=Image.open(f).convert('RGB');a.thumbnail((480,270));x=i%cols*480;y=i//cols*294;im.paste(a,(x,y+24));d.text((x+8,y+6),f.parent.name+'/'+f.name,fill='white')
 im.save(dest,quality=93)
ref=r.parents[1]/'outputs/A_detailed_15'
sheet([ref/'T01.png',v/'planet-verified/arrival-00.png',v/'cloud-layers-verified/arrival-00.png',ref/'T03.png',v/'planet-verified/arrival-06.png',v/'cloud-layers-final-diagnostics/base-0.295.png'],out/'reference-before-trial.jpg')
sheet(sorted((v/'cloud-layers-verified').glob('arrival-*.png')),v/'cloud-layers-verified/sheet.jpg')
sheet(sorted((v/'cloud-layers-final-diagnostics').glob('*.png')),v/'cloud-layers-final-diagnostics/sheet.jpg',4)
report={'scope':'Different mockup/camera/geometry: descriptive only; visual fidelity FAIL','room_pixel_differences':{},'effect_differences':{},'asset_hashes':{},'sources':{}}
def pix(f):return np.asarray(Image.open(f).convert('RGB'),dtype=float)
for i in range(7,12):
 a=abs(pix(v/f'planet-verified/whole-{i:02}.png')-pix(v/f'cloud-layers-verified/whole-{i:02}.png'));report['room_pixel_differences'][str(i)]={'max_rgb':float(a.max()),'mean_rgb':float(a.mean())}
for p in [0,.295]:
 base=pix(v/f'cloud-layers-final-diagnostics/base-{p}.png')
 for mode in ['no-cloud','no-shadow','thick-only','thin-only','no-bloom']:
  a=abs(base-pix(v/f'cloud-layers-final-diagnostics/{mode}-{p}.png'));report['effect_differences'][f'{p}/{mode}']={'mean_rgb':float(a.mean()),'max_rgb':float(a.max()),'fraction_pixels_gt_2rgb':float((a.max(2)>2).mean())}
reg=json.loads((r/'assets/registry.json').read_text(encoding='utf-8'))
for a in reg['assets']:
 if a['id'].startswith('cloud-layers-'):
  src=a['generated'];report['asset_hashes'][a['id']]=hashlib.sha256((r/src['file']).read_bytes()).hexdigest()==src['sha256']
for name in ['planet-cloud-layers.ts','arrival.ts','planet-terrain.ts','main.ts']:
 f=r/'prototype/spikes/a-climb'/name;report['sources'][str(f.relative_to(r))]=hashlib.sha256(f.read_bytes()).hexdigest()
(v/'cloud-layers-review-metrics.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'room':report['room_pixel_differences'],'hashes':report['asset_hashes'],'shadow':report['effect_differences']['0/no-shadow']},indent=2))
