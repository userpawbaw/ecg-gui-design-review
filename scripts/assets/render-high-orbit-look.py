"""Independent high-orbit look candidate: polar accent, city/night and radial scattering."""
import bpy,numpy as np,math,json,time,hashlib
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2]
code=(R/'scripts/assets/render-earth-routes.py').read_text(encoding='utf-8').split('frames=json.loads')[0]
code=code.replace('ROOT = Path(__file__).resolve().parents[2]','ROOT = R').replace('verification/a-earth-routes-20261007','verification/a-high-orbit-look-20261007')
exec(code)
shell.hide_render=True
# Polar outline accent is an art-directed proxy from the public packed map, not measured Greenland thickness.
image=bpy.data.images.load(str(R/'assets/source/moto-reference-20261007/bump.webp'),check_existing=True)
pixels=np.empty(len(image.pixels),np.float32);image.pixels.foreach_get(pixels);pixels=pixels.reshape(image.size[1],image.size[0],4)
for vertex in earth.data.vertices:
    v=vertex.co;lat=math.degrees(math.asin(max(-1,min(1,v.z))));lon=math.degrees(math.atan2(v.y,v.x))
    if 60<lat<84 and -60<lon<-15:
        mask=min(1,(lat-60)/3,(84-lat)/3,(lon+60)/4,(-15-lon)/4)
        xx=int((lon+180)/360*(image.size[0]-1));yy=int((lat+90)/180*(image.size[1]-1));height=float(pixels[yy,xx,0])
        vertex.co*=1+.002*mask*height
earth.data.update()
earth.data.materials[0]=materials['moto'][0]
bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=48,radius=1.025)
atm=bpy.context.object;atm.name='Radial exponentially falling atmospheric volume'
mat=bpy.data.materials.new('Blue radial scattering, no glass BSDF');mat.use_nodes=True
ns=mat.node_tree.nodes;ns.clear();lk=mat.node_tree.links
geo=ns.new('ShaderNodeNewGeometry');length=ns.new('ShaderNodeVectorMath');length.operation='LENGTH';lk.new(geo.outputs['Position'],length.inputs[0])
def calc(op,a,b=None):
    n=ns.new('ShaderNodeMath');n.operation=op
    for i,v in enumerate([a,b] if b is not None else [a]):
        if hasattr(v,'node'):lk.new(v,n.inputs[i])
        else:n.inputs[i].default_value=v
    return n.outputs[0]
h=calc('SUBTRACT',length.outputs['Value'],1)
density=calc('MULTIPLY',calc('EXPONENT',calc('MULTIPLY',calc('MAXIMUM',h,0),-1/.002)),24)
density=calc('MULTIPLY',density,calc('GREATER_THAN',h,0))
scatter=ns.new('ShaderNodeVolumeScatter');scatter.inputs['Color'].default_value=(.18,.42,1,1);scatter.inputs['Anisotropy'].default_value=.15;lk.new(density,scatter.inputs['Density'])
out=ns.new('ShaderNodeOutputMaterial');lk.new(scatter.outputs[0],out.inputs['Volume']);atm.data.materials.append(mat)
s.cycles.volume_bounces=2;s.cycles.volume_step_rate=.5;s.cycles.samples=48
s.render.resolution_x,s.render.resolution_y=1600,900
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.003
sun.data.energy=5;sun.data.color=(1,.91,.80)
lat,lon=math.radians(64.1),math.radians(12.4);n=Vector((math.cos(lat)*math.cos(lon),math.cos(lat)*math.sin(lon),math.sin(lat)));east=Vector((-math.sin(lon),math.cos(lon),0));up=n.cross(east)
light=(n*.10-east*.97+up*.20).normalized();sun.rotation_euler=(-light).to_track_quat('-Z','Y').to_euler()
for mm,dot in materials.values():dot.inputs[1].default_value=light
s.use_nodes=True;ns=s.node_tree.nodes;ns.clear();rl=ns.new('CompositorNodeRLayers');gl=ns.new('CompositorNodeGlare');gl.glare_type='FOG_GLOW';gl.quality='HIGH';gl.threshold=.85;gl.size=7;comp=ns.new('CompositorNodeComposite');s.node_tree.links.new(rl.outputs['Image'],gl.inputs['Image']);s.node_tree.links.new(gl.outputs['Image'],comp.inputs['Image'])
frames=[]
for shot,dist,offset in [('earth-hero',4,.3),('high-orbit',2.8,.18)]:
    cam.location=n*dist+east*offset+up*.15;cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler()
    for mode in ['volume-off','volume-on']:
        atm.hide_render=mode=='volume-off';tag=shot+'-'+mode;s.render.filepath=str(OUT/(tag+'.png'));start=time.time();bpy.ops.render.render(write_still=True)
        frames.append({'name':tag,'camera':list(cam.location),'sun':list(light),'atmosphere':mode,'seconds':time.time()-start,'sha256':hashlib.sha256((OUT/(tag+'.png')).read_bytes()).hexdigest()})
        (OUT/'render-manifest.json').write_text(json.dumps({'renderer':bpy.app.version_string,'samples':48,'polar_relief':'0.002 Earth-radius bounded artistic packed-map proxy, not measured ice DEM','atmosphere':'radial single-color scattering volume, not full spectral Bruneton Rayleigh/Mie','density_scale_height_earth_radii':.002,'surface_density':24,'frames':frames},indent=2)+'\n')
        print('HIGH LOOK READY',tag,flush=True)
