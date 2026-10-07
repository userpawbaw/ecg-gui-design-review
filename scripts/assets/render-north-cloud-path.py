"""D098: physical VDB camera-path bake, not AI video or a live volume."""
import bpy, math, json, time, hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2]
O=R/'verification/a-north-cloud-path-20261007'; O.mkdir(exist_ok=True)
P=R/'prototype/spikes/a-climb/public/north-earth/cloud-path'; P.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(R/'assets/processed/a-terrain-detailed-20261007/detailed-terrain-height1.5.blend'))
s=bpy.context.scene; s.cycles.samples=24; s.cycles.use_denoising=True
s.render.resolution_x,s.render.resolution_y=960,540
s.cycles.volume_bounces=6; s.cycles.volume_step_rate=1
prefs=bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type='OPTIX'; prefs.get_devices()
for d in prefs.devices:d.use=d.type=='OPTIX'
s.cycles.device='GPU' if any(d.use for d in prefs.devices) else 'CPU'
# The three.js frame is x east/y altitude/z south; Blender is x east/y north/z altitude.
sun=next(o for o in s.objects if o.type=='LIGHT' and o.data.type=='SUN')
light=Vector((-.67,.70,.28)).normalized(); sun.rotation_euler=(-light).to_track_quat('-Z','Y').to_euler()
sources=[]
for name,width,center,base in [('cloud_06',18,(0,-4),4.2),('cloud_01',12,(-10,-8),3.8),('cloud_10',10,(13,-5),4.0)]:
 source=next((R/'assets/source/jangafx-cloud-pack/unpacked').rglob(name+'_variant_0000.vdb'))
 bpy.ops.object.volume_import(filepath=str(source)); c=bpy.context.object; c.data.grids.load(); bpy.context.view_layer.update()
 bounds=[Vector(p) for p in c.bound_box]; low=Vector([min(p[i] for p in bounds) for i in range(3)]); high=Vector([max(p[i] for p in bounds) for i in range(3)])
 scale=width/max(high-low); middle=(low+high)/2; c.scale=(scale,)*3
 c.location=(center[0]-middle.x*scale,center[1]-middle.y*scale,base-low.z*scale)
 mat=bpy.data.materials.new(name+' physical scattering'); mat.use_nodes=True; ns=mat.node_tree.nodes; ns.clear()
 v=ns.new('ShaderNodeVolumePrincipled'); v.inputs['Density'].default_value=.8; v.inputs['Density Attribute'].default_value='density'; v.inputs['Color'].default_value=(.98,.99,1,1); v.inputs['Anisotropy'].default_value=.45
 out=ns.new('ShaderNodeOutputMaterial'); mat.node_tree.links.new(v.outputs['Volume'],out.inputs['Volume']); c.data.materials.append(mat)
 sources.append({'file':str(source.relative_to(R)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'width':width,'base':base,'center':center})
# Start at the web camera's p=.280 position, then descend towards a dense shoulder.
def smooth(t):return t*t*(3-2*t)
t=smooth((.280-.265)/(.290-.265))
start=Vector((35+(18-35)*t,-(70+(25-70)*t),45+(14-45)*t))
keys=[(0,start,Vector((0,0,1.8))),(.45,Vector((18,-25,14)),Vector((0,-3,4.5))),(.80,Vector((5,-12,7.0)),Vector((0,0,6))), (1,Vector((0,-6,6.0)),Vector((0,8,6)))]
frames=[]; count=40
for i in range(count):
 q=i/(count-1); k=next(j for j in range(len(keys)-1) if keys[j][0]<=q<=keys[j+1][0]); a,b=keys[k],keys[k+1]; f=(q-a[0])/(b[0]-a[0])
 # Linear progression keeps displacement uniform inside each path section.
 pos=a[1].lerp(b[1],f); target=a[2].lerp(b[2],f); cam=s.camera
 cam.location=pos; cam.rotation_euler=(target-pos).to_track_quat('-Z','Y').to_euler(); cam.data.type='PERSP'; cam.data.sensor_fit='VERTICAL'; cam.data.sensor_height=24; cam.data.lens=24/(2*math.tan(math.radians(47)/2));cam.data.clip_start=.01
 file=O/f'{i:03}.png'; s.render.filepath=str(file); started=time.time()
 if not file.exists():bpy.ops.render.render(write_still=True)
 frames.append({'index':i,'q':q,'camera':list(pos),'target':list(target),'seconds':time.time()-started,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
 manifest={'renderer':'Cycles '+bpy.app.version_string,'samples':24,'size':[960,540],'count':count,'heightGain':1.5,'source_assets':sources,'sun':list(light),'density':.8,'anisotropy':.45,'volume_bounces':6,'step_rate':1,'camera_start_web_progress':.280,'frames':frames,'scope':'physical offline VDB+terrain render; AgX plates. No live volume, AI video or free camera.'}
 (O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
 print('CLOUD_PATH_FRAME',i,frames[-1]['seconds'],flush=True)
