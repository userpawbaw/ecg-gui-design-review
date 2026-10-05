"""A-P1 ladder climbing pose, derived from pinned body.glb. Internal modeling artifact.
Run with Blender 4.5 Python: build-a-climb.py. Does not mutate existing assets.
Coordinates: Blender Z-up; archive-world placement stored separately in metadata.
"""
import bpy, json, math, pathlib, sys, hashlib
import numpy as np
from mathutils import Vector, Matrix
ROOT=pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0,str(pathlib.Path(__file__).parent))
import importlib.util
spec=importlib.util.spec_from_file_location("figure_base",str(pathlib.Path(__file__).with_name("build-intro-figure.py")))
base=importlib.util.module_from_spec(spec); spec.loader.exec_module(base)
AS=ROOT/"prototype/v2/src/story/intro/assets"
OUT=AS/"a-climb"; OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(AS/"body.glb"))
body=next(o for o in bpy.data.objects if o.type=="MESH")
bpy.context.view_layer.objects.active=body
body.select_set(True)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
# Import is already Blender Z-up. Build same measured anatomical skeleton used for the seated asset.
B=base._bones()
ad=bpy.data.armatures.new("AClimbRig"); rig=bpy.data.objects.new("AClimbRig",ad)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode="EDIT")
for name,(h,t,parent) in B.items():
    e=ad.edit_bones.new(name); e.head=h; e.tail=t
for name,(h,t,parent) in B.items():
    if parent: ad.edit_bones[name].parent=ad.edit_bones[parent]
bpy.ops.object.mode_set(mode="OBJECT")
bpy.ops.object.select_all(action="DESELECT")
body.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active=rig
bpy.ops.object.parent_set(type="ARMATURE_AUTO")
root=Vector((.55,3.76,.525))
ROT=Matrix.Rotation(math.pi,4,"Z")
def local(p): return ROT.inverted()@(Vector(p)-root)
def rung(z): return 4.62-(4.25-z)*math.tan(math.radians(14))
def aim(name,d):
    pb=rig.pose.bones[name]; bpy.context.view_layer.update()
    rest=pb.bone.matrix_local.to_3x3()
    R=(rest@Vector((0,1,0))).rotation_difference(Vector(d).normalized()).to_matrix()@rest
    pb.matrix=Matrix.Translation(pb.matrix.translation.copy())@R.to_4x4()
    bpy.context.view_layer.update()
for n,d in {"spine":(0,-.12,1),"chest":(0,-.08,1),"neck":(0,-.18,1),"head":(0,-.15,1)}.items(): aim(n,d)
# Solve the two-bone chains analytically. Pole selects an anatomical elbow/knee bend.
def solve(upper,lower,target,pole):
    a=rig.pose.bones[upper].head.copy(); t=Vector(target)
    l1=rig.data.bones[upper].length; l2=rig.data.bones[lower].length
    v=t-a; dist=v.length; direction=v.normalized()
    if not abs(l1-l2)+.001<dist<l1+l2-.001:
        raise RuntimeError(f"Unreachable {upper}: {dist:.4f}, limb {l1+l2:.4f}")
    e=Vector(pole)-a; e=(e-e.dot(direction)*direction).normalized()
    x=(dist*dist+l1*l1-l2*l2)/(2*dist)
    joint=a+direction*x+e*math.sqrt(max(0,l1*l1-x*x))
    aim(upper,joint-a); aim(lower,t-joint)
    return (rig.pose.bones[lower].tail-t).length
contacts={}; residual={}
for side,x,z in [("R",.68,.58),("L",.42,1.16)]:
    # Shoe-less foot mesh has a 6 cm ankle-to-sole offset and 13 cm toe length.
    ankle=local((x,rung(z)-.085,z+.083))
    residual["ankle."+side]=solve("thigh."+side,"shin."+side,ankle,Vector((ankle.x,-.65,ankle.z+.4)))
    aim("foot."+side,(0,-1,-.38))
    contacts["foot."+side]={"rung_height":z,"rung_world_blender":[x,rung(z),z],"ankle_target_local":list(ankle)}
for side,x,z in [("R",.72,1.74),("L",.38,2.32)]:
    contact=Vector((x,rung(z),z))
    wrist=local(contact+Vector((0,-.055,-.060)))
    residual["wrist."+side]=solve("upper."+side,"fore."+side,wrist,Vector((wrist.x*2,.08,wrist.z-.2)))
    # Align the palm to the near face of the rung; fingers rise then curl over it.
    hp=rig.pose.bones["hand."+side]; rest=hp.bone.matrix_local.to_3x3()
    y0=(rest@Vector((0,1,0))).normalized(); s=1 if side=="L" else -1
    n0=Vector((-s,0,0)); n0=(n0-n0.dot(y0)*y0).normalized()
    f,n=Vector((0,0,1)),Vector((0,-1,0))
    M0=Matrix((y0,n0,y0.cross(n0))).transposed(); M1=Matrix((f,n,f.cross(n))).transposed()
    hp.matrix=Matrix.Translation(hp.matrix.translation.copy())@(M1@M0.inverted()@rest).to_4x4()
    bpy.context.view_layer.update()
    Mh=hp.matrix@hp.bone.matrix_local.inverted(); axis=Mh.to_3x3().inverted()@Vector((1,0,0))
    C=Matrix.Identity(4)
    for k,share in ((1,.40),(2,.35),(3,.25)):
        p=rig.pose.bones[f"finger{k}.{side}"]; K=p.bone.head_local
        C=C@Matrix.Translation(K)@Matrix.Rotation(math.radians(105*share),4,axis)@Matrix.Translation(-K)
        p.matrix=Mh@C@p.bone.matrix_local; bpy.context.view_layer.update()
    thumb=rig.pose.bones["thumb."+side]; K=thumb.bone.head_local
    thumb.matrix=Mh@Matrix.Translation(K)@Matrix.Rotation(math.radians(28),4,axis)@Matrix.Translation(-K)@thumb.bone.matrix_local
    contacts["hand."+side]={"rung_height":z,"rung_world_blender":list(contact),"wrist_target_local":list(wrist)}
bpy.context.view_layer.update()
# Bake the pose with the existing breath morph. Keep source and rig workspace for reproducibility.
def evaluated(value):
    if body.data.shape_keys and "breath" in body.data.shape_keys.key_blocks:
        body.data.shape_keys.key_blocks["breath"].value=value
    bpy.context.view_layer.update()
    ev=body.evaluated_get(bpy.context.evaluated_depsgraph_get()); me=ev.to_mesh()
    P=np.array([v.co[:] for v in me.vertices]); F=[list(p.vertices) for p in me.polygons]
    ev.to_mesh_clear(); return P,F
P,F=evaluated(0); P1,_=evaluated(1)
# Contact correction on the baked surface, against the exact rectangular rung.
# Apply identically to basis and breath; no topology change and no new pose drift.
contact_corrections={}
def remove_rung_penetration(Pin):
    W=Pin@np.array(ROT.to_3x3()).T+np.array(root)
    stats={}
    for name,c in contacts.items():
        center=np.array(c["rung_world_blender"]); d=W-center
        mask=(np.linalg.norm(d,axis=1)<.18)&(np.abs(W[:,0]-.55)<.24)&(np.abs(d[:,1])<.045)&(np.abs(d[:,2])<.015)
        ids=np.where(mask)[0]; stats[name]=len(ids)
        if name.startswith("foot"):
            W[ids,2]=center[2]+.0158
        else:
            for i in ids:
                distances=[.045+d[i,1],.045-d[i,1],.015+d[i,2],.015-d[i,2]]
                face=int(np.argmin(distances))
                if face==0: W[i,1]=center[1]-.0458
                elif face==1: W[i,1]=center[1]+.0458
                elif face==2: W[i,2]=center[2]-.0158
                else: W[i,2]=center[2]+.0158
    return (W-np.array(root))@np.array(ROT.to_3x3()),stats
P,contact_corrections=remove_rung_penetration(P);P1,_=remove_rung_penetration(P1)
mesh=bpy.data.meshes.new("AClimbBody"); mesh.from_pydata(P.tolist(),[],F); mesh.update()
posed=bpy.data.objects.new("AClimbBody",mesh); bpy.context.scene.collection.objects.link(posed)
bpy.context.view_layer.objects.active=posed
bpy.ops.object.select_all(action="DESELECT"); posed.select_set(True); bpy.ops.object.shade_smooth()
posed.shape_key_add(name="Basis"); posed.shape_key_add(name="breath").data.foreach_set("co",P1.astype(np.float32).ravel())
mat=bpy.data.materials.new("A_opaque_black"); mat.diffuse_color=(.006,.008,.009,1); mat.use_nodes=True
bsdf=mat.node_tree.nodes.get("Principled BSDF"); bsdf.inputs["Base Color"].default_value=(.006,.008,.009,1)
bsdf.inputs["Roughness"].default_value=.78; posed.data.materials.append(mat)
bpy.ops.export_scene.gltf(filepath=str(OUT/"body_climb.glb"),use_selection=True,export_format="GLB",export_yup=True,export_morph=True,export_morph_normal=False)
pb=rig.pose.bones["chest"]; chest_transform=pb.matrix@pb.bone.matrix_local.inverted()
fig=json.loads((AS/"figure.json").read_text(encoding="utf-8"))
# Canonical figure.json is Web Y-up.
heart=chest_transform@Vector((fig["heart"][0],-fig["heart"][2],fig["heart"][1]))
metadata={"status":"INTERNAL_TUNE_contact_surface_and_camera_review_pending","source":"../body.glb","source_sha256":hashlib.sha256((AS/"body.glb").read_bytes()).hexdigest(),
"units":"metres","local_frame":"Blender Z-up front -Y; GLB export Web Y-up",
"archive_root_blender":list(root),"archive_rotation_z":math.pi,"heart_local_blender":list(heart),
"heart_local_web":[heart.x,heart.z,-heart.y],"chest_q_wxyz":list(chest_transform.to_quaternion()),
"contacts":contacts,"joint_target_error_m":residual,"vertices":len(P),"polygons":len(F),
"surface_contact_corrections":contact_corrections,
"limitations":["joint endpoint match is not palm/sole mesh contact proof","finger wrap, surface penetration and electrodes require internal review","not a final runtime or lighting-quality result"]}
# Attach sites to the posed skin, not to approximate chest rectangles.
from mathutils.bvhtree import BVHTree
tree=BVHTree.FromObject(posed,bpy.context.evaluated_depsgraph_get())
sites={}
spine_transform=rig.pose.bones["spine"].matrix@rig.pose.bones["spine"].bone.matrix_local.inverted()
for tag,x,z,T in [("RA",-.115,1.34,chest_transform),("LA",.115,1.34,chest_transform),("LL",.10,1.05,spine_transform)]:
    q=T@Vector((x,-.09,z))
    hit=tree.ray_cast(Vector((q.x,-1,q.z)),Vector((0,1,0)))
    if hit[0] is None: raise RuntimeError("No skin hit for "+tag)
    p,n=hit[0],hit[1]
    sites[tag]={"p_blender":list(p),"n_blender":list(n),"p_web":[p.x,p.z,-p.y],"n_web":[n.x,n.z,-n.y]}
metadata["electrodes"]=sites
supports=[]
for tag,s in sites.items():
    p,n=Vector(s["p_blender"]),Vector(s["n_blender"])
    for label,r,depth,color in [("foam",.016,.002,(.11,.12,.13,1)),("snap",.005,.004,(.28,.27,.24,1))]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=depth,location=p+n*(depth/2+.001))
        el=bpy.context.object; el.name=tag+"_"+label; el.rotation_mode="QUATERNION"; el.rotation_quaternion=n.to_track_quat("Z","Y")
        em=bpy.data.materials.new(el.name); em.diffuse_color=color; el.data.materials.append(em); supports.append(el)
bpy.ops.object.select_all(action="DESELECT")
for el in supports: el.select_set(True)
bpy.context.view_layer.objects.active=supports[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/"electrodes_climb.glb"),use_selection=True,export_format="GLB",export_yup=True)
(OUT/"manifest.json").write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding="utf-8")
body.hide_render=True; body.hide_viewport=True; rig.hide_render=True
# Source rig is an internal, ignored workspace artifact; production output is the GLB + manifest.
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/".tools/a-climb-workspace.blend"))
print(json.dumps(metadata,ensure_ascii=False))

