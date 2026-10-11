"""D128: transparent native 2K cloud asset probes; no live scene adoption."""
import bpy, json, math, hashlib, time, argparse, sys, shutil
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser()
group=parser.add_mutually_exclusive_group()
group.add_argument('--sampling-audit',action='store_true')
group.add_argument('--density-audit',action='store_true')
parser.add_argument('--preview',action='store_true')
parser.add_argument('--preview-round',type=int,choices=[1,2,3],default=1)
parser.add_argument('--density-fields',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:])
if args.density_fields and not args.density_audit:parser.error('--density-fields requires --density-audit')
OUT=ROOT/('verification/a-cloud-sampling-20261012' if args.sampling_audit else 'verification/a-cloud-texture-assets-20261011')
if args.density_audit:OUT=ROOT/'verification/a-cloud-density-20261012'
if args.preview:
 if not args.density_audit:parser.error('--preview requires --density-audit')
 OUT=OUT/('preview' if args.preview_round==1 else f'preview-round{args.preview_round}')
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene;sc.render.engine='CYCLES'
sc.cycles.samples=16 if args.preview else 96;sc.cycles.use_denoising=True;sc.cycles.volume_bounces=6
sc.cycles.volume_step_rate=.35
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='OPTIX'
sc.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
sc.render.resolution_x=sc.render.resolution_y=384 if args.preview else (1024 if args.sampling_audit or args.density_audit else 2048);sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA';sc.render.image_settings.color_depth='8'
sc.render.film_transparent=True;sc.view_settings.view_transform='AgX'
world=bpy.data.worlds.new('Low sky fill');sc.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.35,.5,.8,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.08
bpy.ops.object.light_add(type='SUN');sun=bpy.context.object
sun.data.energy=6;sun.data.angle=math.radians(.53)
direction=Vector((0,-math.cos(math.radians(15)),math.sin(math.radians(15))))
sun.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;sc.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=5 if args.sampling_audit or args.density_audit else 10
mat=bpy.data.materials.new('White cloud scattering');mat.use_nodes=True;mat.node_tree.nodes.clear()
o=mat.node_tree.nodes.new('ShaderNodeOutputMaterial');v=mat.node_tree.nodes.new('ShaderNodeVolumePrincipled')
v.inputs['Density'].default_value=1;v.inputs['Density Attribute'].default_value='density'
v.inputs['Color'].default_value=(.98,.99,1,1);v.inputs['Anisotropy'].default_value=.35
mat.node_tree.links.new(v.outputs['Volume'],o.inputs['Volume'])
manifest={'status':'native offline asset probes; not actual northern scene or runtime performance evidence','renderer':bpy.app.version_string,'engine':'Cycles','samples':96,'denoising':True,'volumeBounces':6,'stepRate':.35,'size':[2048,2048],'sunElevationDegrees':15,'sunEnergy':6,'skyStrength':.08,'transparent':True,'sunDirection':list(direction),'frames':[],'limitations':['fixed baked lighting; not relightable normal atlas','single isolated cloud, not kilometre-scale weather or geographic handoff','denoising may soften fine wisps; needs original-density comparison','camera elevation probes are asset previews; no validated multi-view interpolation']}
manifest['adaptiveSampling']=sc.cycles.use_adaptive_sampling
manifest['adaptiveThreshold']=sc.cycles.adaptive_threshold
manifest['denoiser']=sc.cycles.denoiser
def density_material(kind):
 """World-fixed procedural scalar density; no image/RGB sharpening."""
 if kind=='baseline':return mat
 m=mat.copy();m.name=kind;nodes=m.node_tree.nodes;links=m.node_tree.links
 volume=next(n for n in nodes if n.type=='PRINCIPLED_VOLUME');volume.inputs['Density Attribute'].default_value=''
 info=nodes.new('ShaderNodeVolumeInfo');d=info.outputs['Density']
 pos=nodes.new('ShaderNodeNewGeometry').outputs['Position']
 def math_node(op,a,b):
  n=nodes.new('ShaderNodeMath');n.operation=op
  for i,x in enumerate([a,b]):
   if isinstance(x,(float,int)):n.inputs[i].default_value=x
   else:links.new(x,n.inputs[i])
  return n.outputs[0]
 # Fade the change from tenuous edges to original thick cores.
 mask=math_node('SUBTRACT',1.,math_node('MINIMUM',1.,math_node('MULTIPLY',d,1/.30)))
 noise=nodes.new('ShaderNodeTexNoise');noise.noise_dimensions='3D'
 links.new(pos,noise.inputs['Vector']);noise.inputs['Scale'].default_value=5.
 noise.inputs['Detail'].default_value=2.;noise.inputs['Roughness'].default_value=.65
 contrast=math_node('MINIMUM',1.,math_node('MAXIMUM',0.,math_node('MULTIPLY',math_node('SUBTRACT',noise.outputs['Fac'],.36),1/.28)))
 factor=math_node('ADD',.2,math_node('MULTIPLY',contrast,1.8))
 gain=math_node('ADD',1.,math_node('MULTIPLY',mask,math_node('SUBTRACT',factor,1.)))
 result=math_node('MULTIPLY',d,gain)
 if kind=='billow-wisp':
  stretch=nodes.new('ShaderNodeVectorMath');stretch.operation='MULTIPLY'
  links.new(pos,stretch.inputs[0]);stretch.inputs[1].default_value=(.45,2.8,4.5)
  wisp=nodes.new('ShaderNodeTexNoise');wisp.noise_dimensions='3D'
  links.new(stretch.outputs['Vector'],wisp.inputs['Vector']);wisp.inputs['Scale'].default_value=4.
  wisp.inputs['Detail'].default_value=2.;wisp.inputs['Roughness'].default_value=.55
  wcontrast=math_node('MINIMUM',1.,math_node('MAXIMUM',0.,math_node('MULTIPLY',math_node('SUBTRACT',wisp.outputs['Fac'],.36),1/.28)))
  signed=math_node('SUBTRACT',math_node('MULTIPLY',wcontrast,2.),1.)
  modulation=math_node('ADD',1.,math_node('MULTIPLY',math_node('MULTIPLY',mask,signed),.8))
  result=math_node('MULTIPLY',result,modulation)
 links.new(result,volume.inputs['Density'])
 return m
if args.density_audit:
 manifest.update(status='procedural density asset trial, not actual northern scene',samples=sc.cycles.samples,size=[sc.render.resolution_x]*2,seed=7,orthoScale=5,
                 model='mask=1-min(d/.30,1); c=clamp((noise5-.36)/.28); d1=d*(1+mask*(.2+1.8*c-1)); wisp=d1*(1+.8*mask*(2*clamp((anisotropicNoise4-.36)/.28)-1))',
                 limitations=['world-fixed 3D density noise, not Houdini Billowy/Wispy implementation','thin internal density breakup only; no new wisps outside source bounds','opacity/mass may change; same source envelope is not identical optical thickness','offline fixed view/light, no live motion or runtime performance proof'])
 if args.density_fields:
  manifest['model']='prepared native VDB density deformation; original bounds used for fixed normalization; original material'
  manifest['preparedDensityManifest']='verification/a-cloud-density-20261012/density/manifest.json'
  manifest['limitations'][0]='native density-grid deformation, not Houdini/Nubis implementation'
if args.sampling_audit:
 manifest.update(status='native offline sampling audit; fixed close crop, not live northern scene',size=[1024,1024],seed=7,orthoScale=5)
 manifest.pop('denoising');manifest.pop('stepRate')
 presets=[('cloud_06',65,.35,False),('cloud_06',65,.35,True),('cloud_06',65,.175,False),('cloud_06',65,.175,True)]
else:
 presets=[(name,elevation,.35,True) for name,elevation in [('cloud_01',65),('cloud_06',65),('cloud_06',35)]]
if args.density_audit:presets=[('cloud_06',65,.35,True,kind) for kind in (['baseline','billow','billow-wisp'] if args.preview else ['billow','billow-wisp'])]
else:presets=[(*p,'baseline') for p in presets]
for name,elevation,step,denoise,kind in presets:
 sc.cycles.volume_step_rate=step;sc.cycles.use_denoising=denoise
 if args.sampling_audit or args.density_audit:sc.cycles.seed=7
 path=ROOT/f'assets/source/jangafx-cloud-pack/unpacked/CloudPack/CloudPackVDB/{name}_variant_0000.vdb'
 bpy.ops.object.volume_import(filepath=str(path));cloud=bpy.context.object;cloud.data.grids.load();bpy.context.view_layer.update()
 bounds=[Vector(p) for p in cloud.bound_box];lo=Vector([min(p[i] for p in bounds) for i in range(3)]);hi=Vector([max(p[i] for p in bounds) for i in range(3)])
 prepared=None
 if args.density_fields and kind!='baseline':
  prepared=ROOT/f'verification/a-cloud-density-20261012/density/{kind}.vdb'
  bpy.data.objects.remove(cloud,do_unlink=True);bpy.ops.object.volume_import(filepath=str(prepared));cloud=bpy.context.object;cloud.data.grids.load()
 scale=7/max(hi-lo);cloud.scale=(scale,)*3;center=(lo+hi)/2;cloud.location=-center*scale;cloud.data.materials.append(mat if args.density_fields else density_material(kind))
 angle=math.radians(elevation);cam.location=(0,-20*math.cos(angle),20*math.sin(angle));cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler()
 file=f'{name}-step{step}-denoise{int(denoise)}.png' if args.sampling_audit else f'{name}-e{elevation}-2k.png'
 if args.density_audit:file=kind+'.png'
 sc.render.filepath=str(OUT/file);start=time.time();bpy.ops.render.render(write_still=True)
 manifest['frames'].append({'file':file,'kind':kind,'source':str(path.relative_to(ROOT)).replace('\\','/'),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'cameraElevation':elevation,'orthoScale':cam.data.ortho_scale,'stepRate':step,'denoising':denoise,'seconds':time.time()-start,'sha256':hashlib.sha256((OUT/file).read_bytes()).hexdigest()})
 if prepared:manifest['frames'][-1].update(preparedDensity=prepared.relative_to(ROOT).as_posix(),preparedDensitySha256=hashlib.sha256(prepared.read_bytes()).hexdigest(),fixedGeometryBounds=[list(lo),list(hi)],normalizationScale=scale,volumeSpace=cloud.data.render.space)
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 bpy.data.objects.remove(cloud,do_unlink=True);print('ASSET_COMPLETE',file,flush=True)
if args.density_audit and not args.preview:
 old=ROOT/'verification/a-cloud-sampling-20261012';previous=json.loads((old/'manifest.json').read_text(encoding='utf-8'))
 f=next(f for f in previous['frames'] if f['stepRate']==.35 and f['denoising'])
 assert f['sourceSha256']==manifest['frames'][0]['sourceSha256']
 assert hashlib.sha256((old/f['file']).read_bytes()).hexdigest()==f['sha256']
 shutil.copy2(old/f['file'],OUT/'baseline.png')
 manifest['frames'].insert(0,{**f,'file':'baseline.png','kind':'baseline','reusedFrom':'verification/a-cloud-sampling-20261012/'+f['file']})
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
