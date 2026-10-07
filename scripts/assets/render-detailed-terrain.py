"""Real detailed mountain patch, connected surface, matched lighting height comparison."""
import bpy,numpy as np,math,json,time,hashlib,argparse
from pathlib import Path
from mathutils import Vector
args=argparse.ArgumentParser();args.add_argument('--gain',type=float);args.add_argument('--output',default='verification/a-terrain-detailed-20261007');args=args.parse_args()
gains=[args.gain] if args.gain is not None else [1,2.5]
R=Path(__file__).resolve().parents[2]; P=R/'assets/processed/a-terrain-detailed-20261007'; O=R/args.output; O.mkdir(exist_ok=True)
meta=json.loads((P/'metadata.json').read_text()); near=np.load(P/'height-metres.npy'); far=np.load(P/'far-height.npy')
bpy.ops.wm.read_factory_settings(use_empty=True); s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=64;s.cycles.use_denoising=True
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='OPTIX'
s.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
s.render.resolution_x,s.render.resolution_y=1600,900;s.render.resolution_percentage=100;s.view_settings.view_transform='AgX'
world=bpy.data.worlds.new('Atmospheric sky lighting');s.world=world;world.use_nodes=True
wn=world.node_tree.nodes; sky=wn.new('ShaderNodeTexSky');sky.sky_type='NISHITA';sky.sun_elevation=math.radians(16);sky.sun_rotation=math.radians(140);sky.sun_disc=False
world.node_tree.links.new(sky.outputs[0],wn['Background'].inputs['Color']);wn['Background'].inputs['Strength'].default_value=.28
bpy.ops.object.light_add(type='SUN');sun=bpy.context.object;sun.data.energy=3.0;sun.data.color=(1,.88,.72);sun.data.angle=math.radians(.7)
light=Vector((-.67,.70,.28)).normalized();sun.rotation_euler=(-light).to_track_quat('-Z','Y').to_euler()
lat0,lon0=meta['target'];kx=111.32*math.cos(math.radians(lat0));ky=111.32
nb=meta['dem']['bounds'];fb=meta['far_dem']['bounds']
lons=np.unique(np.r_[np.linspace(fb[0],fb[2],129),np.linspace(nb[0],nb[2],513)])
lats=np.unique(np.r_[np.linspace(fb[1],fb[3],129),np.linspace(nb[1],nb[3],513)])
lo,la=np.meshgrid(lons,lats);x=(lo-lon0)*kx;y=(la-lat0)*ky
def sample(arr,bounds):
    w,so,e,no=bounds;xx=np.clip((lo-w)/(e-w)*(arr.shape[1]-1),0,arr.shape[1]-1.001);yy=np.clip((no-la)/(no-so)*(arr.shape[0]-1),0,arr.shape[0]-1.001);i=xx.astype(int);j=yy.astype(int);dx=xx-i;dy=yy-j
    a=arr.copy();a[a==-9999]=0
    return (a[j,i]*(1-dx)+a[j,i+1]*dx)*(1-dy)+(a[j+1,i]*(1-dx)+a[j+1,i+1]*dx)*dy
ed=np.minimum.reduce([(lo-nb[0])/(nb[2]-nb[0]),(nb[2]-lo)/(nb[2]-nb[0]),(la-nb[1])/(nb[3]-nb[1]),(nb[3]-la)/(nb[3]-nb[1])]);mask=np.clip(ed/.05,0,1)
height=(sample(far,fb)*(1-mask)+sample(near,nb)*mask)/1000
curve=(x*x+y*y)/(2*6371)
rows,cols=lo.shape; faces=[]
for j in range(rows-1):
 for i in range(cols-1):
  k=j*cols+i;faces.append((k,k+1,k+cols+1,k+cols))
mat=bpy.data.materials.new('Satellite terrain rough land');mat.use_nodes=True; ns=mat.node_tree.nodes;lk=mat.node_tree.links;bs=ns['Principled BSDF'];bs.inputs['Roughness'].default_value=.87;bs.inputs['Specular IOR Level'].default_value=.12
coord=ns.new('ShaderNodeTexCoord');split=ns.new('ShaderNodeSeparateXYZ');lk.new(coord.outputs['UV'],split.inputs[0])
def mathnode(op,a,b):
 n=ns.new('ShaderNodeMath');n.operation=op
 for i,v in enumerate([a,b]):
  if hasattr(v,'node'):lk.new(v,n.inputs[i])
  else:n.inputs[i].default_value=v
 return n.outputs[0]
images=[]
for tag,bounds in [('broad',fb),('near',nb)]:
 u=mathnode('DIVIDE',mathnode('SUBTRACT',mathnode('ADD',mathnode('MULTIPLY',split.outputs['X'],fb[2]-fb[0]),fb[0]),bounds[0]),bounds[2]-bounds[0])
 v=mathnode('DIVIDE',mathnode('SUBTRACT',mathnode('ADD',mathnode('MULTIPLY',split.outputs['Y'],fb[3]-fb[1]),fb[1]),bounds[1]),bounds[3]-bounds[1])
 c=ns.new('ShaderNodeCombineXYZ');lk.new(u,c.inputs[0]);lk.new(v,c.inputs[1]);t=ns.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(P/(tag+'.jpg')));t.extension='EXTEND';lk.new(c.outputs[0],t.inputs['Vector']);images.append(t)
 if tag=='near':
  edge=mathnode('MINIMUM',mathnode('MINIMUM',u,mathnode('SUBTRACT',1,u)),mathnode('MINIMUM',v,mathnode('SUBTRACT',1,v)))
  clamp=ns.new('ShaderNodeClamp');lk.new(mathnode('MULTIPLY',edge,20),clamp.inputs[0])
mix=ns.new('ShaderNodeMixRGB');lk.new(clamp.outputs[0],mix.inputs[0]);lk.new(images[0].outputs[0],mix.inputs[1]);lk.new(images[1].outputs[0],mix.inputs[2]);lk.new(mix.outputs[0],bs.inputs['Base Color'])
meshes={}
for gain in gains:
 mesh=bpy.data.meshes.new('real terrain gain '+str(gain));vs=np.stack([x,y,height*gain-curve],-1).reshape(-1,3);mesh.from_pydata(vs.tolist(),[],faces);mesh.update();uv=mesh.uv_layers.new()
 uvvalues=np.stack([(lo-fb[0])/(fb[2]-fb[0]),(la-fb[1])/(fb[3]-fb[1])],-1).reshape(-1,2)
 for f in mesh.polygons:
  f.use_smooth=True
  for li in f.loop_indices:uv.data[li].uv=uvvalues[mesh.loops[li].vertex_index]
 mesh.materials.append(mat);meshes[gain]=mesh
obj=bpy.data.objects.new('Connected detailed mountain surface',meshes[gains[0]]);s.collection.objects.link(obj)
bpy.ops.object.camera_add();cam=bpy.context.object;s.camera=cam;cam.data.lens=42;cam.data.clip_start=.01;cam.data.clip_end=500
frames=[]
shots=[('low-orbit',(35,-70,45),(0,0,1.5)),('cloud-approach',(18,-25,14),(0,0,1.6)),('ridge-close',(10,-16,6),(0,1,1.8))]
for shot,pos,target in shots:
 cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();sky.altitude=0 # surface skylight is evaluated at terrain, not the distant camera
 for gain in gains:
  obj.data=meshes[gain];tag=f'{shot}-height{gain:g}';s.render.filepath=str(O/(tag+'.png'));start=time.time();bpy.ops.render.render(write_still=True)
  frames.append({'name':tag,'camera_km':pos,'target_km':target,'slant_distance_km':(Vector(pos)-Vector(target)).length,'height_gain':gain,'sha256':hashlib.sha256((O/(tag+'.png')).read_bytes()).hexdigest(),'seconds':time.time()-start})
  (O/'render-manifest.json').write_text(json.dumps({'renderer':bpy.app.version_string,'samples':64,'vertices':rows*cols,'target_latlon':meta['target'],'sun_local_direction':list(light),'units':'local km; spherical curvature approximation, not true orbital surveyed camera','scope':'detailed terrain/light candidate; broad satellite and near satellite blend; no VDB or archive integration','frames':frames},indent=2)+'\n')
  print('RENDER READY',tag,flush=True)
bpy.ops.file.pack_all()
obj.data=meshes[gains[0]]
native=P/('detailed-terrain.blend' if args.gain is None else f'detailed-terrain-height{args.gain:g}.blend')
bpy.ops.wm.save_as_mainfile(filepath=str(native),compress=True)
(O/'native-asset.json').write_text(json.dumps({'file':str(native.relative_to(R)),'bytes':native.stat().st_size,'sha256':hashlib.sha256(native.read_bytes()).hexdigest(),'height_gain_default':gains[0],'alternative_mesh_height_gain':gains[-1],'packed_textures':True,'scope':'native Blender scene; not a web-ready GLB or runtime integration'},indent=2)+'\n')
