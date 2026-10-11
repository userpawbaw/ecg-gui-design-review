"""D128: transparent native 2K cloud asset probes; no live scene adoption."""
import bpy, json, math, hashlib, time, argparse, sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser()
parser.add_argument('--sampling-audit',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:])
OUT=ROOT/('verification/a-cloud-sampling-20261012' if args.sampling_audit else 'verification/a-cloud-texture-assets-20261011')
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene;sc.render.engine='CYCLES'
sc.cycles.samples=96;sc.cycles.use_denoising=True;sc.cycles.volume_bounces=6
sc.cycles.volume_step_rate=.35
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='OPTIX'
sc.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
sc.render.resolution_x=sc.render.resolution_y=1024 if args.sampling_audit else 2048;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA';sc.render.image_settings.color_depth='8'
sc.render.film_transparent=True;sc.view_settings.view_transform='AgX'
world=bpy.data.worlds.new('Low sky fill');sc.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.35,.5,.8,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.08
bpy.ops.object.light_add(type='SUN');sun=bpy.context.object
sun.data.energy=6;sun.data.angle=math.radians(.53)
direction=Vector((0,-math.cos(math.radians(15)),math.sin(math.radians(15))))
sun.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;sc.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=5 if args.sampling_audit else 10
mat=bpy.data.materials.new('White cloud scattering');mat.use_nodes=True;mat.node_tree.nodes.clear()
o=mat.node_tree.nodes.new('ShaderNodeOutputMaterial');v=mat.node_tree.nodes.new('ShaderNodeVolumePrincipled')
v.inputs['Density'].default_value=1;v.inputs['Density Attribute'].default_value='density'
v.inputs['Color'].default_value=(.98,.99,1,1);v.inputs['Anisotropy'].default_value=.35
mat.node_tree.links.new(v.outputs['Volume'],o.inputs['Volume'])
manifest={'status':'native offline asset probes; not actual northern scene or runtime performance evidence','renderer':bpy.app.version_string,'engine':'Cycles','samples':96,'denoising':True,'volumeBounces':6,'stepRate':.35,'size':[2048,2048],'sunElevationDegrees':15,'sunEnergy':6,'skyStrength':.08,'transparent':True,'sunDirection':list(direction),'frames':[],'limitations':['fixed baked lighting; not relightable normal atlas','single isolated cloud, not kilometre-scale weather or geographic handoff','denoising may soften fine wisps; needs original-density comparison','camera elevation probes are asset previews; no validated multi-view interpolation']}
manifest['adaptiveSampling']=sc.cycles.use_adaptive_sampling
manifest['adaptiveThreshold']=sc.cycles.adaptive_threshold
manifest['denoiser']=sc.cycles.denoiser
if args.sampling_audit:
 manifest.update(status='native offline sampling audit; fixed close crop, not live northern scene',size=[1024,1024],seed=7,orthoScale=5)
 manifest.pop('denoising');manifest.pop('stepRate')
 presets=[('cloud_06',65,.35,False),('cloud_06',65,.35,True),('cloud_06',65,.175,False),('cloud_06',65,.175,True)]
else:
 presets=[(name,elevation,.35,True) for name,elevation in [('cloud_01',65),('cloud_06',65),('cloud_06',35)]]
for name,elevation,step,denoise in presets:
 sc.cycles.volume_step_rate=step;sc.cycles.use_denoising=denoise
 if args.sampling_audit:sc.cycles.seed=7
 path=ROOT/f'assets/source/jangafx-cloud-pack/unpacked/CloudPack/CloudPackVDB/{name}_variant_0000.vdb'
 bpy.ops.object.volume_import(filepath=str(path));cloud=bpy.context.object;cloud.data.grids.load();bpy.context.view_layer.update()
 bounds=[Vector(p) for p in cloud.bound_box];lo=Vector([min(p[i] for p in bounds) for i in range(3)]);hi=Vector([max(p[i] for p in bounds) for i in range(3)])
 scale=7/max(hi-lo);cloud.scale=(scale,)*3;center=(lo+hi)/2;cloud.location=-center*scale;cloud.data.materials.append(mat)
 angle=math.radians(elevation);cam.location=(0,-20*math.cos(angle),20*math.sin(angle));cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler()
 file=f'{name}-step{step}-denoise{int(denoise)}.png' if args.sampling_audit else f'{name}-e{elevation}-2k.png'
 sc.render.filepath=str(OUT/file);start=time.time();bpy.ops.render.render(write_still=True)
 manifest['frames'].append({'file':file,'source':str(path.relative_to(ROOT)).replace('\\','/'),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'cameraElevation':elevation,'orthoScale':cam.data.ortho_scale,'stepRate':step,'denoising':denoise,'seconds':time.time()-start,'sha256':hashlib.sha256((OUT/file).read_bytes()).hexdigest()})
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 bpy.data.objects.remove(cloud,do_unlink=True);print('ASSET_COMPLETE',file,flush=True)
