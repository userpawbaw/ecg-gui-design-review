"""Internal contact QA for A climb. Clay is not a user-facing quality preview."""
import bpy,json,math,pathlib
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
ROOT=pathlib.Path(__file__).resolve().parents[2]; AS=ROOT/"prototype/v2/src/story/intro/assets"
OUT=ROOT/"verification/a-climb-20261005"; OUT.mkdir(parents=True,exist_ok=True)
meta=json.loads((AS/"a-climb/manifest.json").read_text(encoding="utf-8"))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(AS/"a-climb/body_climb.glb"))
body=next(o for o in bpy.data.objects if o.type=="MESH")
body.location=meta["archive_root_blender"]; body.rotation_mode="XYZ"; body.rotation_euler.z=math.pi
def material(name,color):
    m=bpy.data.materials.new(name); m.use_nodes=True
    m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value=(*color,1)
    m.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value=.8
    return m
body.data.materials.clear(); body.data.materials.append(material("internal_clay",(.4,.42,.44)))
wood=material("ladder",(.17,.075,.025))
def box(name,pos,scale,rot=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos); o=bpy.context.object; o.name=name; o.scale=scale; o.rotation_euler.x=rot
    o.data.materials.append(wood); return o
angle=math.radians(14); foot=4.62-4.25*math.tan(angle)
for dx in (-.24,.24):
    box("stile",(.55+dx,(foot+4.62)/2,4.25/2),(.045,.07,4.25/math.cos(angle)+.1),-angle)
for i in range(1,15):
    z=i*.29
    if z>4.15: break
    box("rung",(.55,foot+z*math.tan(angle),z),(.48,.09,.03))
bpy.context.view_layer.update()
tree=BVHTree.FromObject(body,bpy.context.evaluated_depsgraph_get())
# BVH uses object coordinates. Transform archive contact point into local posed frame.
surface={}
for name,c in meta["contacts"].items():
    contact=Vector(c["rung_world_blender"])
    if name.startswith("foot"): contact.z+=.015
    p=body.matrix_world.inverted()@contact
    hit=tree.find_nearest(p)
    surface[name]={"nearest_body_surface_m":hit[3],"threshold_m":.018,
                  "status":"PASS_proximity_only" if hit[3]<.018 else "TUNE_surface_contact"}
    # Local rung AABB: 0.48 x 0.09 x 0.03 m, with 1 mm interior margin.
    c=Vector(meta["contacts"][name]["rung_world_blender"])
    intruding=[]
    for v in body.data.vertices:
        w=body.matrix_world@v.co
        if (w-c).length>.18: continue
        if abs(w.x-.55)<.239 and abs(w.y-c.y)<.044 and abs(w.z-c.z)<.014:
            intruding.append(v.index)
    surface[name]["rung_interior_vertex_count"]=len(intruding)
    surface[name]["penetration_status"]="PASS_vertices_only" if not intruding else "TUNE_penetration"
cam=bpy.data.cameras.new("QA"); co=bpy.data.objects.new("QA",cam); bpy.context.scene.collection.objects.link(co); bpy.context.scene.camera=co
world=bpy.data.worlds.new("QA"); world.use_nodes=True; world.node_tree.nodes["Background"].inputs[0].default_value=(.35,.35,.35,1); bpy.context.scene.world=world
l=bpy.data.lights.new("QA_key","AREA"); l.energy=600; l.size=4; lo=bpy.data.objects.new("QA_key",l); bpy.context.scene.collection.objects.link(lo); lo.location=(2,1,5); lo.rotation_euler=(Vector((.55,3.9,1.5))-lo.location).to_track_quat("-Z","Y").to_euler()
sc=bpy.context.scene; sc.render.engine="CYCLES"; sc.cycles.samples=12; sc.cycles.use_denoising=True
sc.render.resolution_x=800; sc.render.resolution_y=600; sc.render.resolution_percentage=100
sc.view_settings.view_transform="AgX"
target=Vector((.55,3.87,1.55)); views=[]
for i,deg in enumerate((0,20,40,60,75,90)):
    a=math.radians(deg); pos=target+Vector((3.2*math.sin(a),-3.2*math.cos(a),.4))
    views.append((f"orbit_{i:02}",pos,target,45))
for name,c in meta["contacts"].items():
    target=Vector(c["rung_world_blender"]); views.append((name.replace(".","_"),target+Vector((.45,-.65,.15)),target,60))
    if name.startswith("hand"): views.append((name.replace(".","_")+"_side",target+Vector((.65,-.05,.10)),target,60))
for name,pos,tgt,lens in views:
    co.location=pos; co.rotation_euler=(tgt-pos).to_track_quat("-Z","Y").to_euler(); cam.lens=lens
    sc.render.filepath=str(OUT/(name+".png")); bpy.ops.render.render(write_still=True)
(OUT/"contact_review.json").write_text(json.dumps({"scope":"internal clay / source asset geometry","surface":surface,"frames":[x[0]+".png" for x in views],"limits":["nearest distance does not prove grip or full support","no full archive lighting/runtime/target PC verification"]},indent=2),encoding="utf-8")
print(json.dumps(surface))

