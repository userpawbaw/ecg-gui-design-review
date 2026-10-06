from pathlib import Path
import bpy,math,json,os
from mathutils import Vector
r=Path(__file__).resolve().parents[2];assets=r/'prototype/spikes/a-climb/assets/cloud-sculpt';out=r/'verification/a-cloud-sculpt-20261006'/os.environ.get('CLOUD_CYCLES_ROUND','cycles-tune1');out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=int(os.environ.get("CLOUD_CYCLES_SAMPLES","64"));scene.cycles.use_denoising=True;scene.cycles.volume_bounces=2;scene.cycles.volume_step_rate=float(os.environ.get("CLOUD_VOLUME_STEP",".15"))
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
 prefs.compute_device_type=os.environ.get('CLOUD_CYCLES_DEVICE','OPTIX');prefs.get_devices()
 for d in prefs.devices:d.use=d.type==prefs.compute_device_type
 scene.cycles.device='GPU' if any(d.use and d.type!='CPU' for d in prefs.devices) else 'CPU'
 if scene.cycles.device=='CPU':
  for d in prefs.devices:d.use=d.type=='CPU'
except Exception:scene.cycles.device='CPU'
scene.render.resolution_x=int(os.environ.get('CLOUD_RENDER_WIDTH','960'));scene.render.resolution_y=int(scene.render.resolution_x*9/16);scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.view_settings.exposure=1;scene.world.color=(.08,.10,.14)
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.14,.21,.32,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.18
mat=bpy.data.materials.new('SharedDensityAtlas');mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear();links=mat.node_tree.links
outNode=nodes.new('ShaderNodeOutputMaterial');vol=nodes.new('ShaderNodeVolumePrincipled');vol.inputs['Color'].default_value=(1,1,1,1);vol.inputs['Anisotropy'].default_value=.45;links.new(vol.outputs['Volume'],outNode.inputs['Volume'])
def calc(op,a,b=0):
 n=nodes.new('ShaderNodeMath');n.operation=op
 for i,v in enumerate([a,b]):
  if isinstance(v,(float,int)):n.inputs[i].default_value=v
  else:links.new(v,n.inputs[i])
 return n.outputs[0]
coord=nodes.new('ShaderNodeTexCoord');sep=nodes.new('ShaderNodeSeparateXYZ');links.new(coord.outputs['Generated'],sep.inputs[0]);X=sep.outputs['X'];Y=sep.outputs['Z'];Z=calc('MULTIPLY',sep.outputs['Y'],127);K=calc('FLOOR',Z);F=calc('SUBTRACT',Z,K)
image=bpy.data.images.load(str(assets/'density-atlas.png'));image.colorspace_settings.name='Non-Color';image.pack()
def atlas(k):
 col=calc('MODULO',k,16);row=calc('FLOOR',calc('DIVIDE',k,16));u=calc('DIVIDE',calc('ADD',col,calc('DIVIDE',calc('ADD',calc('MULTIPLY',X,127),.5),128)),16);v=calc('DIVIDE',calc('ADD',row,calc('DIVIDE',calc('ADD',calc('MULTIPLY',Y,127),.5),128)),8)
 vec=nodes.new('ShaderNodeCombineXYZ');links.new(u,vec.inputs[0]);links.new(v,vec.inputs[1]);tex=nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Closest';tex.extension='EXTEND';links.new(vec.outputs[0],tex.inputs['Vector']);bw=nodes.new('ShaderNodeRGBToBW');links.new(tex.outputs['Color'],bw.inputs[0]);return bw.outputs[0]
a=atlas(K);b=atlas(calc('MINIMUM',calc('ADD',K,1),127));density=calc('ADD',calc('MULTIPLY',a,calc('SUBTRACT',1,F)),calc('MULTIPLY',b,F));links.new(calc('MULTIPLY',density,12),vol.inputs['Density'])
bpy.ops.mesh.primitive_cube_add();cloud=bpy.context.object;cloud.name='Cloud density bound 4x4x2km';cloud.scale=(2,2,1);cloud.data.materials.append(mat)
# blue receiver makes underside and cast shadow readable; Blender unit is one km.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-1.25));floor=bpy.context.object;fm=bpy.data.materials.new('Ocean receiver');fm.diffuse_color=(.018,.06,.10,1);fm.use_nodes=True;fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.018,.06,.10,1);fm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.6;floor.data.materials.append(fm)
bpy.ops.object.light_add(type='SUN');sun=bpy.context.object;sun.data.energy=6;sun.data.angle=.035;sun.data.color=(1,.86,.69);sun.rotation_euler=(-Vector((.70583314,-.4836477,.51757557))).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.lens=45;cam.data.clip_start=.001;cam.data.clip_end=250
shots=[('01-wide',(6,-8,4),(0,0,-.1)),('02-above',(3,-4,3),(0,0,0)),('03-side',(3,-5,.7),(0,0,0)),('04-gap',(.8,-2.8,.1),(0,.1,0)),('05-core',(.1,-1,.0),(0,.5,0)),('06-cut',(-.15,-.1,-.2),(0,.4,0))]
states=[]
for name,pos,look in shots:
 if os.environ.get("CLOUD_CYCLES_SHOT") and name!=os.environ["CLOUD_CYCLES_SHOT"]:continue
 if os.environ.get("CLOUD_CYCLES_QUICK")=="1" and name!="03-side":continue
 cam.location=pos;cam.rotation_euler=(Vector(look)-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True);states.append({'file':name+'.png','camera_km':pos,'look_km':look})
bpy.ops.wm.save_as_mainfile(filepath=str(assets/'cloud-sculpt.blend'));(out/'manifest.json').write_text(json.dumps({'bpy':bpy.app.version_string,'engine':'Cycles','samples':scene.cycles.samples,'device_requested':scene.cycles.device,'devices_available':[{'name':d.name,'type':d.type,'enabled':d.use} for d in prefs.devices],'density':'same R8 atlas; Principled Volume differs from realtime approximation','shots':states},indent=2),encoding='utf-8');print('Cycles reference frames complete:',len(states))
