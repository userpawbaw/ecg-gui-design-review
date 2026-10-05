"""Create internal review sheets and descriptive look metrics, not fidelity PASS."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib
r=Path(__file__).resolve().parents[1];v=r/'verification/a-arrival-20261006'
def sheet(files,out,cols=3):
    w,h=480,294;im=Image.new('RGB',(w*cols,h*((len(files)+cols-1)//cols)),(15,15,15));d=ImageDraw.Draw(im)
    for i,f in enumerate(files):
        img=Image.open(f).convert('RGB');img.thumbnail((480,270));x=i%cols*w;y=i//cols*h;im.paste(img,(x,y+24));d.text((x+8,y+6),f.parent.name+'/'+f.name,fill='white')
    im.save(out,quality=92)
for folder in ['lighting-before','lighting-round1','lighting-round2','lighting-final','lighting-final3']:
    at=v/folder;sheet(sorted(at.glob('arrival-*.png')),at/'sheet.jpg')
diag=v/'lighting-final-diagnostics'
if (diag/'review.json').exists():
    states=json.loads((diag/'review.json').read_text())['states'];sheet([diag/s['file'] for s in states],diag/'sheet.jpg',4)
    sheet([diag/f'reverse-{i}.jpg' for i in range(12)],diag/'reverse-sheet.jpg')
motion=v/'lighting-motion'
if (motion/'video-review.json').exists():sheet(sorted(motion.glob('msaa-video-*.jpg')),motion/'sheet.jpg')
reference=r.parents[1]/'outputs/A_detailed_15'
comparison=r.parents[1]/'outputs/A_lighting_review';comparison.mkdir(exist_ok=True)
sheet([reference/'T01.png',v/'lighting-before/arrival-00.png',v/'lighting-final3/arrival-00.png',reference/'T02.png',v/'lighting-before/arrival-04.png',v/'lighting-final3/arrival-04.png',reference/'T03.png',v/'lighting-before/arrival-06.png',v/'lighting-final3/arrival-06.png'],comparison/'reference-before-after.jpg')
def metrics(f):
    x=np.asarray(Image.open(f).convert('RGB'),dtype=float)/255;linear=np.where(x<=.04045,x/12.92,((x+.055)/1.055)**2.4);lum=linear@np.array([.2126,.7152,.0722]);sat=(x.max(2)-x.min(2))/np.maximum(x.max(2),1e-6)
    return {'mean':float(lum.mean()),'p5_p50_p95':[float(a) for a in np.percentile(lum,[5,50,95])],'saturation_mean':float(sat.mean()),'warm_fraction':float(((x[:,:,0]>x[:,:,2]*1.1)&(lum>.03)).mean())}
report={'scope':'Descriptive full-frame statistics. Different camera/geometry; not fidelity PASS. Mockups are concepts, not runtime reference site captures.','looks':{}}
for f in [reference/'T01.png',reference/'T02.png',reference/'T03.png']+[v/k/f'arrival-{i:02}.png' for k in ['lighting-before','lighting-final3'] for i in range(12)]:report['looks'][str(f.relative_to(r.parents[1]))]=metrics(f)
report['kept_room_pixel_differences']={}
for i in range(7,12):
    a=np.asarray(Image.open(v/f'lighting-before/whole-{i:02}.png').convert('RGB'),dtype=int);b=np.asarray(Image.open(v/f'lighting-final3/whole-{i:02}.png').convert('RGB'),dtype=int)
    report['kept_room_pixel_differences'][str(i)]={'max':int(abs(a-b).max()),'mean':float(abs(a-b).mean())}
manifest=json.loads((r/'prototype/spikes/a-climb/assets/earth/manifest.json').read_text())
report['hashes']={a['id']:hashlib.sha256((r/a['processed_file']).read_bytes()).hexdigest()==a['processed_sha256'] for a in manifest}
(v/'lighting-look-metrics.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'room':report['kept_room_pixel_differences'],'hashes':report['hashes']}))
