"""Descriptive look metrics and review sheets. Never a mockup fidelity PASS."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib
r=Path(__file__).resolve().parents[1];v=r/'verification/a-arrival-20261006';final=v/'planet-verified';diag=v/'planet-diagnostics-final'
def sheet(files,out,cols=3):
 im=Image.new('RGB',(480*cols,294*((len(files)+cols-1)//cols)),(15,15,15));d=ImageDraw.Draw(im)
 for i,f in enumerate(files):
  img=Image.open(f).convert('RGB');img.thumbnail((480,270));x=i%cols*480;y=i//cols*294;im.paste(img,(x,y+24));d.text((x+8,y+6),f.parent.name+'/'+f.name,fill='white')
 im.save(out,quality=92)
sheet(sorted(final.glob('arrival-*.png')),final/'sheet.jpg')
sheet([diag/s['file'] for s in json.loads((diag/'review.json').read_text())['states']],diag/'sheet.jpg',5)
ref=r.parents[1]/'outputs/A_detailed_15';out=r.parents[1]/'outputs/A_planet_review';out.mkdir(exist_ok=True)
sheet([ref/'T01.png',v/'lighting-final3/arrival-00.png',final/'arrival-00.png',ref/'T02.png',v/'lighting-final3/arrival-04.png',final/'arrival-05.png',ref/'T03.png',v/'lighting-final3/arrival-06.png',final/'arrival-06.png'],out/'reference-before-after.jpg')
def pixels(f):return np.asarray(Image.open(f).convert('RGB'),dtype=float)/255
def metrics(f):
 x=pixels(f);linear=np.where(x<=.04045,x/12.92,((x+.055)/1.055)**2.4);lum=linear@np.array([.2126,.7152,.0722]);sat=(x.max(2)-x.min(2))/np.maximum(x.max(2),1e-6)
 return {'p5_p50_p95':[float(a) for a in np.percentile(lum,[5,50,95])],'mean':float(lum.mean()),'saturation_mean':float(sat.mean()),'warm_fraction':float(((x[:,:,0]>x[:,:,2]*1.1)&(lum>.03)).mean())}
report={'scope':'Concept mockups, different framing and geometry: statistics are descriptive, not objective fidelity PASS.','looks':{},'room_pixel_differences':{},'effect_differences':{}}
for f in [ref/'T01.png',ref/'T02.png',ref/'T03.png']+sorted(final.glob('arrival-*.png')):report['looks'][str(f.relative_to(r.parents[1]))]=metrics(f)
for i in range(7,12):
 delta=np.abs(pixels(v/f'lighting-final3/whole-{i:02}.png')-pixels(final/f'whole-{i:02}.png'))*255;report['room_pixel_differences'][str(i)]={'max_rgb':float(delta.max()),'mean_rgb':float(delta.mean())}
for model in ['legacy','new']:
 for p in [0,.23,.3]:
  base=pixels(diag/f'{model}-{p}-base.png')
  for effect in ['atmosphere','specular','cloud','bloom']:
   delta=abs(base-pixels(diag/f'{model}-{p}-no-{effect}.png'))*255;report['effect_differences'][f'{model}/{p}/{effect}']={'mean_rgb':float(delta.mean()),'max_rgb':float(delta.max()),'fraction_pixels_gt_2rgb':float((delta.max(2)>2).mean())}
reg=json.loads((r/'assets/registry.json').read_text(encoding='utf-8'));report['asset_hashes']={}
for a in reg['assets']:
 if not a['id'].startswith('planet-v2-'):continue
 for slot in ['processed','generated']:
  if a.get(slot):report['asset_hashes'][a['id']+'/'+slot]=hashlib.sha256((r/a[slot]['file']).read_bytes()).hexdigest()==a[slot]['sha256']
(v/'planet-look-metrics.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'room':report['room_pixel_differences'],'hashes':report['asset_hashes'],'effects_at_p0':{k:a for k,a in report['effect_differences'].items() if '/0/' in k}},indent=2))
