"""D135 copy actual native renders to runtime with alpha and hash gates."""
from pathlib import Path
import json,hashlib,shutil
from PIL import Image
r=Path(__file__).resolve().parents[2];o=r/'verification/a-disney-atlas-20261012';native=o/'native';runtime=r/'prototype/spikes/a-climb/assets/disney-atlas';runtime.mkdir(parents=True,exist_ok=True)
m=json.loads((native/'manifest.json').read_text(encoding='utf-8'));assert len(m['frames'])==3
frames=[]
for f in m['frames']:
 p=native/f['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==f['sha256'];assert hashlib.sha256((r/f['source']).read_bytes()).hexdigest()==f['sourceSha256']
 im=Image.open(p).convert('RGBA');assert im.size==(1024,768);alpha=im.getchannel('A');assert alpha.getextrema()[0]==0 and alpha.getextrema()[1]>128
 assert all(alpha.getpixel(q)==0 for q in [(0,0),(1023,0),(0,767),(1023,767)])
 filename=f'atlas-e{f["atlasElevationDegrees"]:g}.png';shutil.copyfile(p,runtime/filename)
 frames.append({**f,'runtimeFile':filename,'alphaCorners':0,'projection':'orthographic','legacyPerspectiveFovIgnored':True,'sourceUnitsAreMetres':False})
manifest={'source':'Disney WDAS cloud / Copyright2017 Disney Enterprises Inc / CC BY-SA3.0 / Kevin Udy photographic reference','technique':'fixed-light multi-elevation impostor atlas; runtime not a volume','files':frames,'runtimeTextureSize':[1024,768],'nominalRGBA8MipMiB':12,'nearTraversal':False,'groundCameraVisibility':False,'indirectGroundRetained':True,'sourceObjectScale':[1,.28,1],'ambientRgb':[.23,.23,.25],'geometryMeaning':'artistic height compression for orbit-scale bank, not measured meteorology','fixedSunLocalTowardLight':[0,.258819,-.965926],'displayPipeline':'baked AgX +1EV, PNG sRGB; runtime decode and composite after tone mapping','limitations':['fixed lighting, not relit at runtime','camera azimuth differing from bake can alter apparent light direction','elevation interpolation can ghost silhouettes','no live depth or self-shadow reconstruction','near pass through not supported; fade .245-.285']}
(runtime/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');(o/'atlas-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('D135 native/runtime alpha/hash PASS; nominal12MiB RGBA8+mips, not measured VRAM')
