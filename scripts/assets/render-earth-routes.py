"""Isolated geographic route/material trial; not the live WebGPU implementation."""
import bpy, math, json, hashlib, time, os
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'verification/a-earth-routes-20261007'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.render.engine = 'CYCLES'
s.cycles.samples = 48
s.cycles.use_denoising = True
s.cycles.volume_bounces = 6
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'OPTIX'
prefs.get_devices()
for d in prefs.devices: d.use = d.type == 'OPTIX'
s.cycles.device = 'GPU' if any(d.use for d in prefs.devices) else 'CPU'
s.render.resolution_x, s.render.resolution_y = 1280, 720
s.render.resolution_percentage = 100
s.view_settings.view_transform = 'AgX'
s.world = bpy.data.worlds.new('Space')
s.world.use_nodes = True
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .012

verts, faces, coords = [], [], []
W,H = 384,192
for iy in range(H+1):
    lat = -math.pi/2 + math.pi*iy/H
    for ix in range(W+1):
        lon = -math.pi+2*math.pi*ix/W
        verts.append((math.cos(lat)*math.cos(lon), math.cos(lat)*math.sin(lon), math.sin(lat)))
        coords.append((ix/W, iy/H))
for iy in range(H):
    for ix in range(W):
        k=iy*(W+1)+ix
        faces.append((k,k+1,k+W+2,k+W+1))
mesh=bpy.data.meshes.new('Explicit longitude latitude UV sphere')
mesh.from_pydata(verts,[],faces)
mesh.update()
uv=mesh.uv_layers.new()
for poly in mesh.polygons:
    poly.use_smooth=True
    for li in poly.loop_indices: uv.data[li].uv=coords[mesh.loops[li].vertex_index]
earth=bpy.data.objects.new('Earth geographic anchor',mesh)
s.collection.objects.link(earth)

def material(style):
    mat=bpy.data.materials.new(style)
    mat.use_nodes=True
    ns=mat.node_tree.nodes; ns.clear(); lk=mat.node_tree.links
    def node(t): return ns.new(t)
    def mathnode(op,a,b=None):
        n=node('ShaderNodeMath'); n.operation=op
        for i,v in enumerate([a,b] if b is not None else [a]):
            if hasattr(v,'node'): lk.new(v,n.inputs[i])
            else: n.inputs[i].default_value=v
        return n.outputs[0]
    def tex(path, srgb):
        n=node('ShaderNodeTexImage'); n.image=bpy.data.images.load(str(path),check_existing=True)
        n.image.colorspace_settings.name='sRGB' if srgb else 'Non-Color'
        return n.outputs['Color']
    base=ROOT/'assets/source/moto-reference-20261007'
    day=tex(base/'day.webp',True) if style=='moto' else tex(ROOT/'prototype/spikes/a-climb/assets/earth/day.webp',True)
    night=tex(base/'night.webp',True) if style=='moto' else tex(ROOT/'prototype/v2/src/story/intro/assets/earth_night.jpg',True)
    packed=tex(base/'bump.webp',False) if style=='moto' else tex(ROOT/'prototype/spikes/a-climb/assets/earth/relief.webp',False)
    split=node('ShaderNodeSeparateColor'); lk.new(packed,split.inputs['Color'])
    bs=node('ShaderNodeBsdfPrincipled'); lk.new(day,bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value=.32
    if style=='moto':
        lk.new(mathnode('ADD',mathnode('MULTIPLY',split.outputs['Green'],.10),.25),bs.inputs['Roughness'])
        height=mathnode('MAXIMUM',split.outputs['Red'],split.outputs['Blue'])
    else: height=split.outputs['Red']
    bump=node('ShaderNodeBump'); bump.inputs['Distance'].default_value=.0008
    bump.inputs['Strength'].default_value=.6
    lk.new(height,bump.inputs['Height']); lk.new(bump.outputs['Normal'],bs.inputs['Normal'])
    geo=node('ShaderNodeNewGeometry')
    dot=node('ShaderNodeVectorMath'); dot.operation='DOT_PRODUCT'
    lk.new(geo.outputs['Normal'],dot.inputs[0])
    # Both maps use the same translated lighting/mix so texture appearance is isolated.
    remap=node('ShaderNodeMapRange'); remap.clamp=True
    remap.interpolation_type='SMOOTHSTEP'
    remap.inputs['From Min'].default_value=-.25; remap.inputs['From Max'].default_value=.5
    lk.new(dot.outputs['Value'],remap.inputs['Value'])
    emit=node('ShaderNodeEmission'); lk.new(night,emit.inputs['Color']); emit.inputs['Strength'].default_value=.95
    mix=node('ShaderNodeMixShader'); lk.new(remap.outputs['Result'],mix.inputs[0])
    lk.new(emit.outputs[0],mix.inputs[1]); lk.new(bs.outputs[0],mix.inputs[2])
    out=node('ShaderNodeOutputMaterial'); lk.new(mix.outputs[0],out.inputs['Surface'])
    return mat,dot
materials={k:material(k) for k in ['moto','existing']}
earth.data.materials.append(materials['moto'][0])

# Rim-only optical aid; no reflective glass BSDF. Not physical atmospheric scattering.
shell=bpy.data.objects.new('Thin rim diagnostic',mesh.copy()); s.collection.objects.link(shell)
am=bpy.data.materials.new('Rim transparent emission'); am.use_nodes=True
ns=am.node_tree.nodes; ns.clear(); lk=am.node_tree.links
out=ns.new('ShaderNodeOutputMaterial'); mix=ns.new('ShaderNodeMixShader')
tr=ns.new('ShaderNodeBsdfTransparent'); em=ns.new('ShaderNodeEmission')
em.inputs['Color'].default_value=(.025,.22,.8,1); em.inputs['Strength'].default_value=2
fr=ns.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value=1.045
lk.new(fr.outputs[0],mix.inputs[0]); lk.new(tr.outputs[0],mix.inputs[1]); lk.new(em.outputs[0],mix.inputs[2]); lk.new(mix.outputs[0],out.inputs[0])
shell.data.materials.clear(); shell.data.materials.append(am)
bpy.ops.object.light_add(type='SUN'); sun=bpy.context.object
sun.data.energy=4; sun.data.color=(1,.91,.80); sun.data.angle=math.radians(.55)
bpy.ops.object.camera_add(); cam=bpy.context.object; s.camera=cam
cam.data.lens=35; cam.data.clip_start=.00001; cam.data.clip_end=30

frames=json.loads((OUT/'render-manifest.json').read_text())['frames'] if os.environ.get('EARTH_ORBIT_ONLY') else []
routes=[('north',64.1,12.4),('south',-38.0,-71.0)]
shots=[('01-globe',4.0,.30,.20,0),('02-turn',2.8,.18,.12,.10),('03-high-orbit',1.25,.09,.025,.74),('04-low-orbit',1.06,.025,.014,.94),('05-cloud-entry',1.012,.007,.005,1)]
clouds=[]
for name in ['cloud_06','cloud_01']:
    path=next((ROOT/'assets/source/jangafx-cloud-pack/unpacked').rglob(name+'_variant_0000.vdb'))
    bpy.ops.object.volume_import(filepath=str(path)); obj=bpy.context.object
    obj.data.grids.load(); bpy.context.view_layer.update()
    low=Vector([min(p[i] for p in obj.bound_box) for i in range(3)])
    high=Vector([max(p[i] for p in obj.bound_box) for i in range(3)])
    obj['bounds_low']=list(low); obj['bounds_high']=list(high)
    cm=bpy.data.materials.new(name+' accepted shape trial'); cm.use_nodes=True
    ns=cm.node_tree.nodes; ns.clear(); vo=ns.new('ShaderNodeVolumePrincipled'); out=ns.new('ShaderNodeOutputMaterial')
    vo.inputs['Density'].default_value=400; vo.inputs['Density Attribute'].default_value='density'
    vo.inputs['Color'].default_value=(.99,.99,1,1); vo.inputs['Anisotropy'].default_value=.45
    cm.node_tree.links.new(vo.outputs['Volume'],out.inputs['Volume']); obj.data.materials.append(cm)
    clouds.append(obj)
for route,lat,lon in routes:
    a,b=math.radians(lat),math.radians(lon)
    n=Vector((math.cos(a)*math.cos(b),math.cos(a)*math.sin(b),math.sin(a)))
    east=Vector((-math.sin(b),math.cos(b),0)); up=n.cross(east)
    light=(n*.30-east*.94+up*.15).normalized()
    sun.rotation_euler=(-light).to_track_quat('-Z','Y').to_euler()
    for mat,dot in materials.values(): dot.inputs[1].default_value=light
    for shot,d,ex,uy,blend in shots:
        if os.environ.get('EARTH_ORBIT_ONLY') and shot in ['01-globe','02-turn']: continue
        pos=n*d+east*ex+up*uy
        target=n*blend
        delta={'03-high-orbit':.50,'04-low-orbit':.22,'05-cloud-entry':.10}.get(shot)
        if delta:
            pos=d*(n*math.cos(delta)+east*math.sin(delta))
            target=n
        s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.32,.46,.65,1)
        s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35 if shot=='05-cloud-entry' else .012
        cam.location=pos; cam.rotation_euler=(target-pos).to_track_quat('-Z','Y').to_euler()
        shell.scale=(1.004 if d>1.25 else 1.0004,)*3
        for i,obj in enumerate(clouds):
            obj.hide_render=shot!='05-cloud-entry'
            low=Vector(obj['bounds_low']); high=Vector(obj['bounds_high']); center=(low+high)/2
            scale=.005/max(high-low); obj.scale=(scale,)*3
            obj.rotation_euler=n.to_track_quat('Z','Y').to_euler()
            obj.location=n*1.002+east*(.012 if i==0 else .016)+up*(.0005 if i==0 else -.001)-obj.rotation_euler.to_matrix()@(center*scale)
        for style in (['moto','existing'] if shot=='01-globe' else ['moto']):
            earth.data.materials[0]=materials[style][0]
            tag=f'{route}-{shot}-{style}'
            s.render.filepath=str(OUT/(tag+'.png'))
            start=time.time(); bpy.ops.render.render(write_still=True)
            frame={'name':tag,'route':route,'lat':lat,'lon':lon,'style':style,'camera':list(pos),'target':list(target),'sun':list(light),'nominal_radial_altitude_km':(d-1)*6371,'seconds':round(time.time()-start,2),'sha256':hashlib.sha256((OUT/(tag+'.png')).read_bytes()).hexdigest()}
            frames=[f for f in frames if f['name']!=tag]+[frame]
            (OUT/'render-manifest.json').write_text(json.dumps({'scope':'Blender material translation, geographic frame trial; not original shader or regional terrain proof','renderer':bpy.app.version_string,'samples':48,'view':'AgX exposure 0, bloom off','frames':frames},indent=2),encoding='utf-8')
            print('FRAME COMPLETE',tag,flush=True)
