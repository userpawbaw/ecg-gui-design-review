"""Controlled source-detail comparison using same camera/light and a single surface."""
import bpy, math, json, hashlib, time, numpy as np
from pathlib import Path
from mathutils import Vector, Matrix
R=Path(__file__).resolve().parents[2]
code=(R/'scripts/assets/render-earth-routes.py').read_text(encoding='utf-8').split('frames=json.loads')[0]
code=code.replace("ROOT = Path(__file__).resolve().parents[2]",'ROOT = R').replace("verification/a-earth-routes-20261007",'verification/a-norway-region-20261007')
exec(code)
shell.hide_render=True # surface-detail diagnostic: remove the nonphysical rim veil
P=R/'assets/processed/a-norway-region-20261007'
meta=json.loads((P/'metadata.json').read_text()); dem=np.load(P/'height-metres.npy')
west,south,east,north=meta['dem']['bounds']; N=dem.shape[0]
# Native detail is intentionally reduced to orbit-appropriate sampling. Do not upsample/rebrand.
lons=np.unique(np.r_[np.linspace(-180,180,193),np.linspace(west,east,257)])
lats=np.unique(np.r_[np.linspace(-90,90,97),np.linspace(south,north,257)])
vs=[]; fs=[]; uvcoords=[]; hs=[]
for lat in lats:
    for lon in lons:
        h=0
        if west<=lon<=east and south<=lat<=north:
            x=(lon-west)/(east-west)*(N-1); y=(north-lat)/(north-south)*(N-1)
            i=min(int(x),N-2); j=min(int(y),N-2); fx=x-i; fy=y-j
            values=dem[j:j+2,i:i+2].copy(); values[values==-9999]=0
            h=(values[0,0]*(1-fx)+values[0,1]*fx)*(1-fy)+(values[1,0]*(1-fx)+values[1,1]*fx)*fy
            # DSM ellipsoid altitude translated to synthetic spherical zero sea level for visual trial.
            h=max(0,float(h))
            edge=min((lon-west)/(east-west),(east-lon)/(east-west),(lat-south)/(north-south),(north-lat)/(north-south))
            h*=min(1,max(0,edge/.08))
        la,lo=math.radians(lat),math.radians(lon)
        vs.append((math.cos(la)*math.cos(lo),math.cos(la)*math.sin(lo),math.sin(la)))
        uvcoords.append(((lon+180)/360,(lat+90)/180)); hs.append(h/6371000)
cols=len(lons)
for y in range(len(lats)-1):
    for x in range(cols-1):
        i=y*cols+x; fs.append((i,i+1,i+cols+1,i+cols))
def build(displace):
    m=bpy.data.meshes.new('single globe with bounded ArcticDEM '+str(displace))
    vv=[tuple(c*(1+hs[i]*displace) for c in v) for i,v in enumerate(vs)]
    m.from_pydata(vv,[],fs); m.update(); uv=m.uv_layers.new()
    for poly in m.polygons:
        poly.use_smooth=True
        for li in poly.loop_indices: uv.data[li].uv=uvcoords[m.loops[li].vertex_index]
    return m
flat=build(0); height=build(1)
mat=materials['moto'][0]; ns=mat.node_tree.nodes; lk=mat.node_tree.links
bs=next(n for n in ns if n.bl_idname=='ShaderNodeBsdfPrincipled')
out=next(n for n in ns if n.bl_idname=='ShaderNodeOutputMaterial')
for socket in [bs.inputs['Normal'],bs.inputs['Roughness'],out.inputs['Surface']]:
    for link in list(socket.links): lk.remove(link)
bs.inputs['Roughness'].default_value=.65
lk.new(bs.outputs[0],out.inputs['Surface']) # daylight diagnostic, no city-emission contamination
oldcolor=bs.inputs['Base Color'].links[0].from_socket
tex=ns.new('ShaderNodeTexImage'); tex.image=bpy.data.images.load(str(P/'bmng-region.jpg')); tex.extension='EXTEND'
coord=ns.new('ShaderNodeTexCoord'); split=ns.new('ShaderNodeSeparateXYZ'); lk.new(coord.outputs['UV'],split.inputs[0])
def calc(op,a,b):
    n=ns.new('ShaderNodeMath'); n.operation=op
    for i,v in enumerate([a,b]):
        if hasattr(v,'node'): lk.new(v,n.inputs[i])
        else: n.inputs[i].default_value=v
    return n.outputs[0]
u=calc('MULTIPLY',calc('SUBTRACT',split.outputs['X'],.5),8)
v=calc('MULTIPLY',calc('SUBTRACT',split.outputs['Y'],.75),6)
combine=ns.new('ShaderNodeCombineXYZ'); lk.new(u,combine.inputs[0]); lk.new(v,combine.inputs[1]); lk.new(combine.outputs[0],tex.inputs['Vector'])
ed=calc('MINIMUM',calc('MINIMUM',u,calc('SUBTRACT',1,u)),calc('MINIMUM',v,calc('SUBTRACT',1,v)))
mask=calc('MULTIPLY',ed,20); clamp=ns.new('ShaderNodeClamp'); lk.new(mask,clamp.inputs[0])
mix=ns.new('ShaderNodeMixRGB'); lk.new(clamp.outputs[0],mix.inputs[0]); lk.new(oldcolor,mix.inputs[1]); lk.new(tex.outputs['Color'],mix.inputs[2])
a,b=math.radians(64.1),math.radians(12.4)
n=Vector((math.cos(a)*math.cos(b),math.cos(a)*math.sin(b),math.sin(a)))
e=Vector((-math.sin(b),math.cos(b),0)); localnorth=n.cross(e)
light=(n*.65-e*.65+localnorth*.15).normalized(); sun.rotation_euler=(-light).to_track_quat('-Z','Y').to_euler()
frames=[]
for shot,alt,angle in [('high-orbit',.25,.50),('low-orbit',.06,.22),('cloud-height',.012,.10)]:
    cam.location=(1+alt)*(n*math.cos(angle)+e*math.sin(angle))
    forward=(n-cam.location).normalized(); right=forward.cross(n).normalized(); camera_up=right.cross(forward).normalized()
    cam.rotation_euler=Matrix((right,camera_up,-forward)).transposed().to_euler()
    shell.scale=(1.0004,)*3
    for variant in ['global4k','regional-color','regional-dem']:
        earth.data=height if variant=='regional-dem' else flat
        earth.data.materials.clear(); earth.data.materials.append(mat)
        lk.new(oldcolor if variant=='global4k' else mix.outputs[0],bs.inputs['Base Color'])
        tag=shot+'-'+variant; s.render.filepath=str(OUT/(tag+'.png'))
        started=time.time(); bpy.ops.render.render(write_still=True)
        frames.append({'name':tag,'camera':list(cam.location),'target':list(n),'camera_up':list(camera_up),'sun':list(light),'height_exaggeration':1,'sha256':hashlib.sha256((OUT/(tag+'.png')).read_bytes()).hexdigest(),'seconds':round(time.time()-started,2)})
        (OUT/'render-manifest.json').write_text(json.dumps({'renderer':bpy.app.version_string,'samples':48,'scope':'Controlled daylight geometry/color diagnostic. Not whole Intro/Story. Sea zero sphere and ellipsoid DSM height are visual approximation, not surveyed geographic datum match.','vertices':len(vs),'imagery_bounds':[0,45,45,75],'dem_bounds':meta['dem']['bounds'],'frames':frames},indent=2)+'\n')
        print('COMPLETE',tag,flush=True)
