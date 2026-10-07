"""D093: actual approved VDB and terrain receiver in one native lighting scene."""
import bpy,json,math,time,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];O=R/'verification/a-north-handoff-20261007';O.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(R/'assets/processed/a-terrain-detailed-20261007/detailed-terrain-height1.5.blend'))
s=bpy.context.scene;s.cycles.samples=48;s.render.resolution_x,s.render.resolution_y=1280,720
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
for device in prefs.devices:device.use=device.type=='OPTIX'
s.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
print('VDB DEVICES',[(d.name,d.type,d.use) for d in prefs.devices],flush=True)
source=next((R/'assets/source/jangafx-cloud-pack/unpacked').rglob('cloud_06*.vdb'))
bpy.ops.object.volume_import(filepath=str(source));cloud=bpy.context.object;cloud.data.grids.load();bpy.context.view_layer.update();bounds=[Vector(p) for p in cloud.bound_box];low=Vector([min(p[i] for p in bounds) for i in range(3)]);high=Vector([max(p[i] for p in bounds) for i in range(3)]);scale=18/max(high-low);center=(low+high)/2;cloud.scale=(scale,)*3;cloud.location=(-center.x*scale,-center.y*scale,-low.z*scale+4.2)
mat=bpy.data.materials.new('Approved cloud06 same terrain lighting');mat.use_nodes=True;ns=mat.node_tree.nodes;ns.clear();v=ns.new('ShaderNodeVolumePrincipled');v.inputs['Density'].default_value=.8;v.inputs['Density Attribute'].default_value='density';v.inputs['Color'].default_value=(.98,.99,1,1);v.inputs['Anisotropy'].default_value=.45;out=ns.new('ShaderNodeOutputMaterial');mat.node_tree.links.new(v.outputs['Volume'],out.inputs['Volume']);cloud.data.materials.append(mat);s.cycles.volume_bounces=6;s.cycles.volume_step_rate=.5
frames=[]
for name,pos,target in [('terrain-cloud-approach',(18,-25,14),(0,0,4.5)),('terrain-cloud-side',(10,-16,6),(0,0,5.5)),('cloud-cover',(0,-5,6),(0,8,6))]:
 cam=s.camera;cam.location=pos;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=42;s.render.filepath=str(O/(name+'.png'));start=time.time();bpy.ops.render.render(write_still=True);frames.append({'name':name,'camera':pos,'target':target,'seconds':time.time()-start,'sha256':hashlib.sha256((O/(name+'.png')).read_bytes()).hexdigest()});print('VDB RECEIVER READY',name,flush=True)
(O/'native-vdb-manifest.json').write_text(json.dumps({'source':str(source.relative_to(R)),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'heightGain':1.5,'cloud_width_km':18,'cloud_base_km':4.2,'density':.8,'samples':48,'sun':'same packed detailed terrain scene','devices':[(d.name,d.type,d.use) for d in prefs.devices],'frames':frames,'scope':'actual VDB shadows/occlusion on terrain; web uses cover bake only, not real-time VDB volume'},indent=2)+'\n')
(R/'prototype/spikes/a-climb/public/north-earth/cloud-cover.png').write_bytes((O/'cloud-cover.png').read_bytes())
