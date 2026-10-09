"""Export the v3 body for upload to mixamo.com auto-rigging (2026-10-08; playbook P-001 step 1).
Mesh only (basis shape, no vertex groups, no armature), so Mixamo returns a rig on exactly our vertices: the downloaded FBX keeps
the 53,286 vertices in the same order, which autorig-export-v3.py checks before it uses the auto-rig.
Writes <out>/ecg_figure_v3_for_mixamo.fbx (upload this) and .obj (spare). Neither file, nor anything downloaded from Mixamo,
goes into the repository (Adobe terms); keep them outside, e.g. in the scratchpad.
Run: python scripts/assets/mixamo-upload-export-v3.py <out_dir>   (Blender's Python: blender -b --python … -- <out_dir>)
"""
import os, sys
import bpy
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
OUT = os.path.abspath(args[0]); os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes', 'figure_v3_rig_cache.blend'))
src = bpy.data.objects['body_v3']
me = src.data.copy(); ob = bpy.data.objects.new('ecg_figure_v3', me); bpy.context.scene.collection.objects.link(ob)
ob.matrix_world = src.matrix_world.copy()
if me.shape_keys: ob.shape_key_clear()                  # keep the basis only
ob.vertex_groups.clear()
for x in list(bpy.data.objects):
    if x is not ob: bpy.data.objects.remove(x, do_unlink=True)
print('verts', len(me.vertices), 'faces', len(me.polygons), 'dims', tuple(round(d, 3) for d in ob.dimensions))
bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
bpy.ops.export_scene.fbx(filepath=os.path.join(OUT, 'ecg_figure_v3_for_mixamo.fbx'), use_selection=True, object_types={'MESH'},
                         apply_scale_options='FBX_SCALE_ALL', use_mesh_modifiers=False, add_leaf_bones=False, bake_anim=False,
                         path_mode='STRIP')
bpy.ops.wm.obj_export(filepath=os.path.join(OUT, 'ecg_figure_v3_for_mixamo.obj'), export_selected_objects=True,
                      export_materials=False)
print('   wrote', OUT)
sys.stdout.flush(); os._exit(0)
