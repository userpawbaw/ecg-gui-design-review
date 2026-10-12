"""D133 Disney example translated to Cycles; not an identical Mitsuba reproduction."""
from pathlib import Path
import argparse, bpy, math, json, hashlib, time
from mathutils import Vector, Matrix
p=argparse.ArgumentParser();p.add_argument('--level',choices=['eighth','quarter','half'],default='eighth');p.add_argument('--preview',action='store_true');p.add_argument('--bounces',type=int,default=64);p.add_argument('--exposure',type=float,default=0);p.add_argument('--fov',type=float,default=54.43);a=p.parse_args()
r=Path(__file__).resolve().parents[2];out=r/'verification/a-disney-cloud-20261012';out.mkdir(parents=True,exist_ok=True)
src=r/f'assets/source/disney-cloud/unpacked/wdas_cloud/wdas_cloud_{a.level}.vdb'
bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='CYCLES'
s.cycles.samples=32 if a.preview else 96;s.cycles.use_denoising=True;s.cycles.seed=7
s.cycles.max_bounces=a.bounces;s.cycles.volume_bounces=a.bounces;s.cycles.volume_step_rate=.35
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='OPTIX'
s.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
s.render.resolution_x=512 if a.preview else 1024;s.render.resolution_y=277 if a.preview else 554
s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True;s.view_settings.view_transform='AgX';s.view_settings.exposure=a.exposure
w=bpy.data.worlds.new('Official example ambient RGB');s.world=w;w.use_nodes=True
w.node_tree.nodes['Background'].inputs['Color'].default_value=(.03,.07,.23,1)
w.node_tree.nodes['Background'].inputs['Strength'].default_value=1
bpy.ops.object.light_add(type='SUN');sun=bpy.context.object;sun.data.energy=2.6;sun.data.color=(1,2.5/2.6,2.3/2.6);sun.data.angle=0
light=Vector((-.5826,-.7660,-.2717));sun.rotation_euler=light.to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;s.camera=cam
origin=Vector((648.064,-82.473,-63.856));target=Vector((6.021,100.043,-43.679));up=Vector((.273,.962,-.009))
forward=(target-origin).normalized();right=forward.cross(up).normalized();corrected=right.cross(forward).normalized()
cam.matrix_world=Matrix((right,corrected,-forward)).transposed().to_4x4();cam.location=origin
cam.data.type='PERSP';cam.data.sensor_fit='HORIZONTAL';cam.data.sensor_width=36;cam.data.lens=36/(2*math.tan(math.radians(a.fov)/2));cam.data.clip_start=1;cam.data.clip_end=1000000
bpy.ops.object.volume_import(filepath=str(src));cloud=bpy.context.object;cloud.data.grids.load();bpy.context.view_layer.update()
if cloud.data.grids.error_message:raise RuntimeError(cloud.data.grids.error_message)
# Blender's import operator defaults to a +90deg X rotation. The original XML
# camera/light/ground are already in the source y-up coordinates, so undo it.
cloud.rotation_euler=(0,0,0)
# Keep original coordinate transform and object scale: no normalized-density ambiguity.
mat=bpy.data.materials.new('Official example albedo1 HG.877 density4');mat.use_nodes=True;mat.node_tree.nodes.clear()
o=mat.node_tree.nodes.new('ShaderNodeOutputMaterial');v=mat.node_tree.nodes.new('ShaderNodeVolumePrincipled');v.inputs['Density Attribute'].default_value='density';v.inputs['Density'].default_value=4;v.inputs['Color'].default_value=(1,1,1,1);v.inputs['Anisotropy'].default_value=.877;mat.node_tree.links.new(v.outputs['Volume'],o.inputs['Volume']);cloud.data.materials.append(mat)
# Original diffuse disk: y-up floor, y=-1000, radius20000. Very far below cloud.
bpy.ops.mesh.primitive_circle_add(vertices=64,radius=20000,fill_type='NGON',location=(0,-1000,0),rotation=(math.radians(-90),0,0));ground=bpy.context.object
gm=bpy.data.materials.new('Official diffuse ground .2');gm.use_nodes=True;gm.node_tree.nodes.clear();go=gm.node_tree.nodes.new('ShaderNodeOutputMaterial');gd=gm.node_tree.nodes.new('ShaderNodeBsdfDiffuse');gd.inputs['Color'].default_value=(.2,.2,.2,1);gm.node_tree.links.new(gd.outputs['BSDF'],go.inputs['Surface']);ground.data.materials.append(gm)
fn=f'{a.level}-b{a.bounces}'+(f'-fov{a.fov:g}' if a.fov!=54.43 else '')+(f'-ev{a.exposure:g}' if a.exposure else '')+('-preview' if a.preview else '')+'.png';s.render.filepath=str(out/fn)
start=time.time();bpy.ops.render.render(write_still=True)
row={'file':fn,'level':a.level,'source':src.relative_to(r).as_posix(),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'sha256':hashlib.sha256((out/fn).read_bytes()).hexdigest(),'seconds':time.time()-start,'size':[s.render.resolution_x,s.render.resolution_y],'maxSamples':s.cycles.samples,'adaptiveSampling':s.cycles.use_adaptive_sampling,'adaptiveThreshold':s.cycles.adaptive_threshold,'denoiser':s.cycles.denoiser,'volumeBounces':a.bounces,'maxBounces':a.bounces,'stepRate':.35,'densityMultiplier':4,'anisotropy':.877,'albedo':[1,1,1],'volumeSpace':cloud.data.render.space,'objectScale':list(cloud.scale),'bounds':[list(b) for b in cloud.bound_box],'camera':{'origin':list(origin),'target':list(target),'up':list(up),'horizontalFov':54.43},'sun':{'direction':list(light),'rgbIrradianceApproximation':[2.6,2.5,2.3]},'skyRgb':[.03,.07,.23],'renderer':bpy.app.version_string,'device':s.cycles.device,'viewTransform':'AgX','limitations':['Cycles translation, not original Mitsuba integrator or Hyperion','source example uses maxDepth1000000/sampleCount1024; this trial uses bounded depth and adaptive max samples','RGB sunlight is a translated approximation; radiometric/spectral equivalence not established','transparent sky + AgX rather than original EXR display pipeline','offline asset; no live geographic scene or GPU frame performance evidence']}
row['displayExposureEv']=a.exposure;row['objectRotationEuler']=list(cloud.rotation_euler)
row['camera']['horizontalFov']=a.fov
mf=out/'manifest.json';m=json.loads(mf.read_text(encoding='utf-8')) if mf.exists() else {'frames':[]}
m['frames']=[f for f in m['frames'] if f['file']!=fn]+[row];mf.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print('COMPLETE',fn,flush=True)
