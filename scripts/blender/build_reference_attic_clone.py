"""D-159: independently authored attic kit. Reads measured poses, never reference assets.
Usage: bpyenv/bin/python scripts/blender/build_reference_attic_clone.py --stage clay|finish|bake
Intermediate blend stays outside repository. All output geometry/UV/materials are authored here.
"""
import argparse, json, math, random, time
from pathlib import Path
import bpy
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'verification/r1-reference-attic-clone-20261030'; OUT.mkdir(exist_ok=True)
SCRATCH=Path('/tmp/ecg-authored-attic'); SCRATCH.mkdir(exist_ok=True)
p=argparse.ArgumentParser();p.add_argument('--stage',choices=['clay','finish','bake'],default='clay');a=p.parse_args()
spec=json.loads((OUT/'kit-spec.json').read_text()); random.seed(159)
GROUPS={}; group='studio'; mats={}
def mat(name,hexcol,grain=False):
 m=bpy.data.materials.new(name);m.diffuse_color=tuple(int(hexcol[i:i+2],16)/255 for i in (0,2,4))+(1,);m.use_nodes=True
 ns=m.node_tree.nodes;bs=ns.get('Principled BSDF');rgb=m.diffuse_color[:3]; linear=tuple(((c+.055)/1.055)**2.4 if c>.04045 else c/12.92 for c in rgb)
 bs.inputs['Base Color'].default_value=linear+(1,);bs.inputs['Roughness'].default_value=.78
 if grain:
  tex=ns.new('ShaderNodeTexWave');tex.bands_direction='Z';tex.inputs['Scale'].default_value=110;tex.inputs['Distortion'].default_value=1.7;tex.inputs['Detail Scale'].default_value=.4
  coord=ns.new('ShaderNodeTexCoord');m.node_tree.links.new(coord.outputs['Generated'],tex.inputs['Vector'])
  ramp=ns.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=tuple(x*.94 for x in linear)+(1,);ramp.color_ramp.elements[1].color=linear+(1,)
  m.node_tree.links.new(tex.outputs['Color'],ramp.inputs[0]);m.node_tree.links.new(ramp.outputs[0],bs.inputs['Base Color'])
 mats[name]=m;return m
def register(o,name,material):
 o.name=name
 if material:o.data.materials.append(mats.get(material) or bpy.data.materials[material])
 GROUPS.setdefault(group,[]).append(o);return o
def box(name,c,s,material='wood',bevel=.003,axes=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=c);o=bpy.context.object;o.dimensions=[max(.001,float(x)) for x in s];bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if axes:o.rotation_euler=Matrix(axes).to_euler()
 register(o,name,material)
 if bevel:
  b=o.modifiers.new('Authored edge radius','BEVEL');b.width=min(bevel,min(s)*.2);b.segments=2
  b=o.modifiers.new('Face weighted normals','WEIGHTED_NORMAL');b.keep_sharp=True
 return o
def sphere(name,c,s,material='white',ico=False):
 if ico:bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=c)
 else:bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=1,location=c)
 o=bpy.context.object;o.scale=tuple(x/2 for x in s);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if not ico:
  for f in o.data.polygons:f.use_smooth=True
 return register(o,name,material)
def tube(name,pts,r,material='white',poly=False):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=2;sp=cu.splines.new('POLY' if poly else 'BEZIER')
 if poly:
  sp.points.add(len(pts)-1)
  for b,pt in zip(sp.points,pts):b.co=tuple(pt)+(1,)
 else:
  sp.bezier_points.add(len(pts)-1)
  for b,pt in zip(sp.bezier_points,pts):b.co=pt;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);return register(o,name,material)
def cylinder(name,c,r,depth,material='wood'):
 bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=depth,location=c);return register(bpy.context.object,name,material)
def book(part):
 c=Vector(part['center']);s=part['size'];axes=Matrix(part['axes']);name=part['id'];color=part['palette']
 # Closed book, two hard covers and page block; independently generated topology.
 t=min(.005,s[0]*.12);size=[max(.008,s[0]-2*t),max(.01,s[1]-.012),max(.01,s[2]-.012)]
 box(name+' pages',c,size,'pages',.001,part['axes'])
 for sign in [-1,1]:box(name+' cover',c+axes@Vector((sign*(s[0]-t)/2,0,0)),[t,s[1],s[2]],color,.001,part['axes'])
 box(name+' spine',c+axes@Vector((0,-(s[1]-.009)/2,0)),[s[0],.009,s[2]],color,.0015,part['axes'])
def door(part):
 c=part['center'];w,d,h=part['size'];name=part['id'];rail=min(.045,h*.16)
 box(name+' recessed field',(c[0],c[1]+.008,c[2]),[w-.018,d,h-.012],'wood',.002)
 for sign in [-1,1]:
  box(name+' stile',(c[0]+sign*(w-rail)/2,c[1]-.012,c[2]),[rail,d,h],'wood')
  box(name+' rail',(c[0],c[1]-.012,c[2]+sign*(h-rail)/2),[w-2*rail,d,rail],'wood')
def arch_cut(cx,w,bottom,top):
 # New extruded silhouette: flat central top with rounded corners, side semicircle.
 r=min(w/2,.82); spring=top-r; pts=[(cx-w/2,bottom),(cx+w/2,bottom),(cx+w/2,spring)]
 for k in range(1,13):
  q=k*math.pi/24;pts.append((cx+w/2-r+r*math.cos(q),spring+r*math.sin(q)))
 pts.append((cx-w/2+r,top))
 for k in range(1,13):
  q=math.pi/2+k*math.pi/24;pts.append((cx-w/2+r+r*math.cos(q),spring+r*math.sin(q)))
 n=len(pts);vs=[(x,y,z) for y in [-.4,.4] for x,z in pts];fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 me=bpy.data.meshes.new('Authored arch cutter');me.from_pydata(vs,[],fs);me.update();import bmesh;bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free();o=bpy.data.objects.new('cut',me);bpy.context.collection.objects.link(o);return o,pts

def build():
 global group
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for n,c in spec['palette'].items():mat(n,c)
 mat('wood','b8a181',True);mat('pages','ded9ca');mat('black','241f18');mat('wall','ded0b6');mat('floor','a38865',True);mat('leaf','dedccc');mat('sky','b7d2d8')
 group='library'
 for part in spec['parts']:
  name=part['id'];kind=part['kind']
  if name.startswith('TexBibli'):
   if kind=='door':door(part)
   elif kind=='knob':sphere(name,Vector(part['center'])+Vector((0,-.05,0)),[.025,.028,.025],'black')
   else:box(name,part['center'],part['size'],'wood',axes=part['axes'])
 for x in [-3.31,3.31]:
  box('outer upright',(x,-6.51,-1.85),[.06,.54,3.54]);box('side return',(x+(.25 if x>0 else -.25),-6.3,-1.85),[.05,.15,3.54])
 box('library backing',(0,-6.225,-1.77),[7.25,.045,3.33],'wall')
 group='books'
 for part in spec['parts']:
  if part['kind']=='book':book(part)
 group='studio'
 for part in spec['parts']:
  name=part['id']
  if name.startswith('TexMobilier'):
   ci=int(name.rsplit('-',1)[1]);s=part['size'];c=part['center']
   if name.startswith('TexMobilier-') and ci in [62,71]:cylinder(name,c,.24,.06)
   elif name.startswith('TexMobilier-') and ci in [48,55,63,70]:cylinder(name,c,.014,max(s))
   else:box(name,c,s,'cream' if part['kind']=='plinth' else 'wood',axes=part['axes'])
 # Newly built sculptural shapes in the measured positions.
 for c,sz in [((1.648,-4.499,1.459),(.35,.36,.36)),((2.755,-6.559,-1.206),(.208,.215,.214)),((-3.4,-5.2,.24),(.45,.42,.48))]:sphere('faceted sculpture',c,sz,'white',True)
 for c in [(-1.797,-4.368,1.402),(-.853,-6.647,-1.275)]:
  for axis in [0,1,2]:
   s=[.13]*3;s[axis]=.37;o=box('interlocking cross',c,s,'white',.002);o.rotation_euler=(.3,.35,.3)
 for c in [(1.644,-4.503,1.265),(2.753,-6.561,-1.321)]:box('sculpture foot',c,[.31,.28,.033],'white')
 cylinder('ceramic neck',(3.772,-1.968,1.83),.025,.16,'cream');sphere('ceramic body',(3.772,-1.968,1.64),(.15,.15,.35),'cream')
 # Self-authored flower: radial ellipsoidal petals, curved stem and sculpted pointed leaves.
 sphere('flower heart',(.002,-2.817,2.851),(.885,.241,.885))
 for i in range(12):
  q=i*math.tau/12;o=sphere('flower petal',(.002+.767*math.sin(q),-2.712,2.851+.767*math.cos(q)),(.43,.309,.80));o.rotation_euler[1]=q
 tube('flower stem',[(0,-2.82,.4),(0,-2.45,1.05),(.012,-2.48,1.8),(0,-2.71,2.49)],.022)
 for sign,z in [(1,1.14),(-1,1.39)]:
  vs=[(0,-2.46,z-.24),(sign*.31,-2.51,z-.02),(sign*.67,-2.56,z+.25),(sign*.39,-2.59,z+.19),(sign*.24,-2.55,z+.06)]
  me=bpy.data.meshes.new('own pointed leaf');me.from_pydata(vs,[],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)]);me.update();o=bpy.data.objects.new('leaf',me);bpy.context.collection.objects.link(o);register(o,'leaf','leaf')
 sphere('flower rock',(-.013,-2.84,.419),(1.464,1.578,.838),'white',True)
 for x in [-.05,.05]:sphere('flower eye',(x,-2.942,2.872),(.013,.009,.017),'black')
 tube('flower smile',[(-.10,-2.94,2.831),(0,-2.947,2.810),(.10,-2.94,2.831)],.003,'black')
 # Real Boolean openings in the upper wall; frame/mullions are separate 3D geometry.
 wall=box('upper plaster wall',(0,.10,2.5),[16.3,.18,5],'wall',0)
 for cx,w,top in [(0,3.356,4.77),(-3.196,1.492,4.76),(3.196,1.492,4.76)]:
  cutter,pts=arch_cut(cx,w,.836,top);bpy.context.view_layer.objects.active=wall;mod=wall.modifiers.new('Arch opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
  tube('arched timber surround',[(x,-.02,z) for x,z in pts]+[(pts[0][0],-.02,pts[0][1])],.026,'wood',poly=True)
  for z in [1.53,3.966]:box('window transom',(cx,-.025,z),[w,.055,.035],'wood',.001)
  for x in ([cx-.816,cx,cx+.816] if w>2 else [cx]):box('window mullion',(x,-.025,2.5),[.035,.055,3.33],'wood',.001)
  # Backdrop has no shadow; authored sky colour, not a reference image.
  sky=box('sky through window',(cx,.5,2.8),[w+.1,.01,4.1],'sky',0)
  sky.visible_shadow=False
 for x in [-6.2,-2.12,2.12,6.2]:box('wall pilaster',(x,-.06,2.55),[.16,.10,5.1],'cream')
 box('wall cornice',(0,-.05,5),[15,.14,.13],'cream')
 # Own artwork: vector-like procedural flowers/pots, no original pixels.
 for part in spec['parts']:
  if part['kind']!='art':continue
  c=part['center'];w,d,h=part['size'];border=min(w,h)*.045
  box(part['id']+' field',c,[w,.018,h],'cream',.001)
  for sign in [-1,1]:
   box('picture frame',(c[0]+sign*(w-border)/2,c[1]-.025,c[2]),[border,.04,h],'wood',.002)
   box('picture frame',(c[0],c[1]-.025,c[2]+sign*(h-border)/2),[w,.04,border],'wood',.002)
  for i in range(3):
   x=c[0]+(i-1)*w*.23;z=c[2]+h*(.08+.08*(i%2));sphere('own print flower',(x,c[1]-.02,z),[w*.22,.003,h*.18],['ochre','terracotta','rust'][i]);tube('print stalk',[(x,c[1]-.023,c[2]-h*.3),(x,c[1]-.023,z)],w*.006,'sage')
  box('own print pot',(c[0],c[1]-.026,c[2]-h*.26),[w*.36,.004,h*.16],'slate',0)
 group='floor'
 # Four independently authored slabs leave the actual hatch open.
 xmin,xmax=-7.5,7.2;ymin,ymax=-8.26,-.17;hx1,hx2=-1.60,1.60;hy1,hy2=-7.81,-6.99
 for x1,x2,y1,y2 in [(xmin,hx1,ymin,ymax),(hx2,xmax,ymin,ymax),(hx1,hx2,ymin,hy1),(hx1,hx2,hy2,ymax)]:box('upper oak floor',((x1+x2)/2,(y1+y2)/2,-.049),[x2-x1,y2-y1,.099],'floor',.001)
 box('lower oak floor',(0,-7.8,-3.46),[14,6,.064],'floor',.002)
 # Physical distant window-grid occluders cast a different scale of soft shadow.
 group='occluder'
 for x in [-5,-3,-1,1,3,5]:box('offscreen window grid',(x,-10.4,3.8),[.10,.08,5],'wood',0)
 for z in [2,4,6]:box('offscreen window grid',(0,-10.4,z),[14,.08,.09],'wood',0)
 for o in GROUPS['occluder']:o.visible_camera=False
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.render.threads_mode='FIXED';scene.render.threads=5;scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.cycles.max_bounces=6
 scene.world.color=(.16,.16,.16);scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.66,.75,.85,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.22
 bpy.ops.object.light_add(type='SUN',location=(-4,-10,7));sun=bpy.context.object;sun.name='Authored afternoon sunlight';sun.data.energy=3.0;sun.data.angle=math.radians(.8);sun.rotation_euler=Vector((.42,.40,-.81)).to_track_quat('-Z','Y').to_euler();sun.data.color=(1,.89,.75)
 bpy.ops.object.light_add(type='AREA',location=(3,-10,1));fill=bpy.context.object;fill.name='Soft studio fill';fill.data.energy=100;fill.data.shape='DISK';fill.data.size=4;fill.rotation_euler=(Vector((0,-6.3,-1))-fill.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(0,-14.7563982,2.31075716));cam=bpy.context.object;cam.rotation_euler=Vector((0,1,0)).to_track_quat('-Z','Y').to_euler();cam.data.sensor_fit='VERTICAL';cam.data.sensor_height=24;cam.data.lens=12/math.tan(math.radians(22.8951919564)/2);scene.camera=cam
 scene.render.resolution_x=1280;scene.render.resolution_y=720;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.image_settings.file_format='PNG'
 # Group labels survive scratch blend saves. No reference source is opened by this builder.
 for key,objects in GROUPS.items():
  for o in objects:o['authored_group']=key
 bpy.ops.wm.save_as_mainfile(filepath=str(SCRATCH/'authored.blend'))
 return scene

def finish_materials(scene):
 for n,c in spec['palette'].items():
  if n not in bpy.data.materials:mat(n,c)
 # A deterministic, newly drawn herringbone tile. Each board gets a subtle value change.
 import numpy as np
 from PIL import Image, ImageDraw
 rng=random.Random(159);n=2048;cell=32;length=4;image=Image.new('RGB',(n,n),(131,105,76));draw=ImageDraw.Draw(image)
 for i in range(-40,41):
  for j in range(-100,101):
   x=(i*length-j)*cell;y=(i*length+j)*cell
   for xx,yy,ww,hh in [(x,y,length*cell,cell),(x+(length-1)*cell,y+cell,cell,length*cell)]:
    if xx>n or yy>n or xx+ww<0 or yy+hh<0:continue
    t=rng.uniform(.94,1.06);col=tuple(int(c*t) for c in (169,143,107));draw.rectangle((xx+1,yy+1,xx+ww-1,yy+hh-1),fill=col)
    # Fine, low-contrast grain along each board; no dust/wear/noise texture.
    for k in range(3):
     if ww>hh:draw.line((xx+3,yy+4+k*8,xx+ww-3,yy+4+k*8),fill=tuple(max(0,c-3) for c in col))
     else:draw.line((xx+4+k*8,yy+3,xx+4+k*8,yy+hh-3),fill=tuple(max(0,c-3) for c in col))
 tile=SCRATCH/'own-herringbone.png';image.save(tile);teximage=bpy.data.images.load(str(tile),check_existing=True)
 m=bpy.data.materials['floor'];ns=m.node_tree.nodes;bs=ns.get('Principled BSDF');tex=ns.new('ShaderNodeTexImage');tex.image=teximage
 coord=ns.new('ShaderNodeTexCoord');anchor=bpy.data.objects.new('Global floor texture metres',None);scene.collection.objects.link(anchor);coord.object=anchor
 scale=ns.new('ShaderNodeVectorMath');scale.operation='SCALE';scale.inputs[3].default_value=1/5.12;m.node_tree.links.new(coord.outputs['Object'],scale.inputs[0]);m.node_tree.links.new(scale.outputs[0],tex.inputs[0]);m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
 # Flat authored sky: pure emission prevents scene shadows being baked onto the backdrop.
 sky=bpy.data.materials['sky'];ns=sky.node_tree.nodes;em=ns.new('ShaderNodeEmission');em.inputs['Color'].default_value=(.46,.64,.69,1);em.inputs['Strength'].default_value=.8;sky.node_tree.links.new(em.outputs[0],ns.get('Material Output').inputs['Surface'])
 # Correct coplanar crossings; endpoints are inset rather than overlapping front faces.
 for o in scene.objects:
  if o.name.startswith('window transom') and not o.get('crossing_fixed'):
   o.location.y-=.012;o['crossing_fixed']=True
  if o.name.startswith('picture frame') and o.dimensions.x>o.dimensions.z and not o.get('crossing_fixed'):
   o.dimensions.x-=2*o.dimensions.z;o['crossing_fixed']=True
 # Independently chosen palette distribution; old baked colours are not treated as albedo.
 for part in spec['parts']:
  if part['kind']=='book':
   for suffix in [' cover',' cover.001',' spine']:
    o=bpy.data.objects.get(part['id']+suffix)
    if o:o.data.materials.clear();o.data.materials.append(bpy.data.materials[part['palette']])
 # Elongate rail grain along the rail instead of producing horizontal stripes.
 wood=bpy.data.materials['wood'];vertical=bpy.data.materials.get('wood vertical') or wood.copy();vertical.name='wood vertical'
 for m in [wood,vertical]:
  for n in m.node_tree.nodes:
   if n.type=='VALTORGB':
    c=n.color_ramp.elements[1].color;n.color_ramp.elements[0].color=tuple(v*.985 for v in c[:3])+(1,)
 for n in vertical.node_tree.nodes:
  if n.type=='TEX_WAVE':n.bands_direction='X'
 for o in scene.objects:
  if o.name.startswith('TexMobilier') and o.type=='MESH' and o.dimensions.z>max(o.dimensions.x,o.dimensions.y)*1.5 and o.data.materials and o.data.materials[0]==wood:o.data.materials[0]=vertical
 # Inferred matching rig: a front light gives the lower cabinet a distinct ladder shadow.
 scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.12
 scene.objects['Soft studio fill'].data.energy=35
 if 'Lower room key' not in scene.objects:
  bpy.ops.object.light_add(type='SPOT',location=(-.8,-10,-.2));key=bpy.context.object;key.name='Lower room key';key.data.energy=500;key.data.shadow_soft_size=.055;key.data.spot_size=math.radians(78);key.data.spot_blend=.25;key.data.color=(1,.94,.85);key.rotation_euler=(Vector((.5,-6.3,-1.75))-key.location).to_track_quat('-Z','Y').to_euler()
 # Final contact/silhouette correction, retained as authored dimensions.
 rock=scene.objects.get('flower rock')
 if rock:rock.dimensions=(1.464,1.578,.838);rock.location.z=.419
 if 'upper frieze' not in scene.objects:
  o=box('upper frieze',(0,.10,5.80),(16.3,.18,1.6),'wall');o['authored_group']='studio'
 if 'dark oak' not in bpy.data.materials:mat('dark oak','665944',True)
 for o in scene.objects:
  if o.name.startswith('TexMobilier-'):
   try:ci=int(o.name.split('-')[1])
   except ValueError:continue
   if 78<=ci<=89 and o.type=='MESH' and o.data.materials:o.data.materials[0]=bpy.data.materials['dark oak']
 scene.cycles.samples=64

def render(scene,name,z):
 scene.camera.location.z=z;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
if a.stage=='clay':
 scene=build();clay=mat('clay','b5b1a9');scene.view_layers[0].material_override=clay;scene.cycles.samples=24
 render(scene,'clay-upper',2.31075716);render(scene,'clay-attic',-.43924284-2.75*.5)
 # Three-quarter shape audit at the lower case, without changing the delivery camera.
 scene.camera.location=(4.8,-12,-.9);scene.camera.rotation_euler=(Vector((0,-6.4,-1.6))-scene.camera.location).to_track_quat('-Z','Y').to_euler();render(scene,'clay-three-quarter',-.9)
elif a.stage=='finish':
 bpy.ops.wm.open_mainfile(filepath=str(SCRATCH/'authored.blend'));scene=bpy.context.scene
 finish_materials(scene)
 render(scene,'render-upper',2.31075716);render(scene,'render-attic',-.43924284-2.75*.5)
 bpy.ops.wm.save_as_mainfile(filepath=str(SCRATCH/'authored.blend'))
else:
 bpy.ops.wm.open_mainfile(filepath=str(SCRATCH/'authored.blend'));scene=bpy.context.scene;scene.cycles.samples=32;scene.render.bake.use_pass_color=True;scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.margin=16
 records={};started=time.monotonic()
 # Apply authored bevels before UV packing, then join only within the same atlas group.
 for key in ['library','books','studio','floor']:
  objects=[o for o in scene.objects if o.get('authored_group')==key];bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.convert(target='MESH');bpy.ops.object.join();o=bpy.context.object;o.name=key
  bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.004,area_weight=.7);bpy.ops.object.mode_set(mode='OBJECT')
  size=4096;img=bpy.data.images.new(key+' new combined bake',width=size,height=size,float_buffer=True);img.colorspace_settings.name='Linear Rec.709'
  for slot in o.material_slots:
   if not slot.material:continue
   node=slot.material.node_tree.nodes.new('ShaderNodeTexImage');node.image=img;slot.material.node_tree.nodes.active=node
  t=time.monotonic();bpy.ops.object.bake(type='COMBINED');img.save_render(str(SCRATCH/(key+'.png')),scene=scene)
  records[key]={'file':key+'.webp','width':size,'height':size,'bake_seconds':round(time.monotonic()-t,2),'vertices':len(o.data.vertices),'polygons':len(o.data.polygons)}
 # Only authored delivery meshes. Cameras, lights and shadow-only modelling helpers stay out.
 bpy.ops.object.select_all(action='DESELECT')
 for key in records:bpy.data.objects[key].select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(OUT/'attic-clone.glb'),use_selection=True,export_format='GLB',export_materials='NONE',export_yup=True,export_texcoords=True,export_normals=True,export_cameras=False,export_extras=False)
 (OUT/'manifest.json').write_text(json.dumps({'scope':'Self-authored geometry, procedural materials, new Cycles COMBINED bakes, AgX baked once into final display colour','bpy':bpy.app.version_string,'samples':scene.cycles.samples,'display_transform':scene.view_settings.view_transform,'display_look':scene.view_settings.look,'groups':records,'bake_seconds':round(time.monotonic()-started,2),'camera':{'fov':22.8951919564,'y':2.31075716,'z':14.7563982,'attic_start':-.43924284,'drop':2.75}},indent=2)+'\n')
 bpy.ops.wm.save_as_mainfile(filepath=str(SCRATCH/'baked.blend'))
