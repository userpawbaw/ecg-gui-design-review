"""P-b first stage on a wide crane shot: the 60 Hz field around the power cable reaches the seated figure (D-054, IDEA-R1-NOISE §10.2).

Not run on its own — `INFLOW=field FIST_POSE=chair ARCHIVE_BLEND=… python scripts/assets/fist-v3.py`; chair-motion-v3.render()
hands its locals to run() here, which reuses inflow-preview-v3 (body red term, electrode stand-ins, sheet/panel helpers).
  field   nested translucent shells around the archive's PowerCable + PowerStrip (equipotential layers, the cable's own field —
          not "waves from the computer", §6.4 S2); the shells grow until they wrap the figure (symbolic 1 Hz breathing of a 60 Hz
          field, not its speed or shape)
  stills  0 no field · 1 field around the cable · 2 field reaches the body = common mode (whole body faint red) · 3 difference at
          RA (ring + lead bright, shells fade)
  camera  crane-up wide: high front-right, 45° down, auto-framed so cable, strip, chair and figure all sit inside the frame
Output: verification/r1-inflow-20261007/inflow_pli_field.jpg
"""
import math, os
import numpy as np


def shell_material(bpy, name, strength):
    """Soft red shell: glows at its silhouette (layer weight), transparent face-on, so nested shells read as layers."""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); N = nt.nodes.new; L = nt.links.new
    out = N('ShaderNodeOutputMaterial'); lw = N('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .45
    em = N('ShaderNodeEmission'); em.inputs['Color'].default_value = (1.0, .19, .28, 1); em.inputs['Strength'].default_value = strength
    tr = N('ShaderNodeBsdfTransparent'); mx = N('ShaderNodeMixShader')
    pw = N('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 1.6; L(lw.outputs['Facing'], pw.inputs[0])
    k = N('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = .55; L(pw.outputs[0], k.inputs[0])
    L(k.outputs[0], mx.inputs[0]); L(tr.outputs[0], mx.inputs[1]); L(em.outputs[0], mx.inputs[2]); L(mx.outputs[0], out.inputs['Surface'])
    return m, em.inputs['Strength']


def run(L):
    g = L['g']; bpy, o, Vector, ROOT = g['bpy'], g['o'], g['Vector'], g['ROOT']; sc = L['sc']; ip = L['ip']
    from PIL import Image
    from bpy_extras.object_utils import world_to_camera_view as w2c
    OUT = os.path.join(ROOT, 'verification', 'r1-inflow-20261007'); FR = os.environ.get('FRAMES_DIR', '/tmp/inflow-frames')
    os.makedirs(FR, exist_ok=True)
    cable = [x for x in bpy.data.objects if x.name.startswith('PowerCable') and x.type == 'CURVE']
    strip = [x for x in bpy.data.objects if x.name.startswith('PowerStrip')]
    if not cable: raise SystemExit('PowerCable not in the archive blend')
    cab = cable[0]
    # ---- field shells: copies of the cable curve with a wide bevel, plus spheres around the strip ----
    dg = bpy.context.evaluated_depsgraph_get()
    cm_ = cab.evaluated_get(dg).to_mesh(); CP = np.array([(cab.matrix_world @ v.co)[:] for v in cm_.vertices]); cab.evaluated_get(dg).to_mesh_clear()
    me = o.evaluated_get(dg).to_mesh(); BP = np.array([(o.matrix_world @ v.co)[:] for v in list(me.vertices)[::40]]); o.evaluated_get(dg).to_mesh_clear()
    reach = float(min(np.min(np.linalg.norm(BP - c, axis=1)) for c in CP[::max(1, len(CP) // 200)]))
    print(f'   field: cable {len(CP)} pts, nearest body point {reach:.2f} m from the cable')
    shells = []
    for i in range(3):
        cu = cab.data.copy(); cu.bevel_depth = .02; cu.bevel_resolution = 4; cu.materials.clear()
        sh = bpy.data.objects.new(f'field_{i}', cu); sh.matrix_world = cab.matrix_world.copy(); sc.collection.objects.link(sh)
        m, s = shell_material(bpy, f'field_m{i}', 0.0); cu.materials.append(m); shells.append((cu, s))
    def field(r_out, strength):
        for i, (cu, s) in enumerate(shells):
            cu.bevel_depth = max(.01, r_out * (i + 1) / 3); s.default_value = strength * (1 - .25 * i)
    # ---- wide crane camera, auto-framed ----
    pts = [Vector(p) for p in CP[::max(1, len(CP) // 40)]] + [Vector(p) for p in BP[::50]]
    for x in strip: pts += [x.matrix_world @ Vector(c) for c in x.bound_box]
    ctr = sum(pts, Vector()) / len(pts)
    cd = bpy.data.cameras.new('wide'); cam = bpy.data.objects.new('wide', cd); sc.collection.objects.link(cam); cd.lens = 24; cd.sensor_width = 36
    d = Vector((-.55, -.75, .75)).normalized()                     # front-right of the figure, high, ~45° down
    for dist in np.arange(1.5, 6.0, .1):
        cam.location = ctr + d * dist; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler(); bpy.context.view_layer.update()
        q = [w2c(sc, cam, p) for p in pts]
        if all(.06 < v.x < .94 and .06 < v.y < .94 and v.z > 0 for v in q): break
    print(f'   wide camera at {tuple(round(v, 2) for v in cam.location)}, {dist:.1f} m from the centre')
    cams = dict(L['cams']); cams['wide'] = cam
    common, front = ip.add_red(bpy, o.data.materials[0]) if not L.get('red') else L['red']
    ring, lead = L['with_electrodes'](0.0, 0.0)
    W, H = sc.render.resolution_x, sc.render.resolution_y
    frames = []
    for i, (lab, r_out, fs, c, rr, ll) in enumerate((
            ('P-b wide 0  before', 0, 0, 0, 0, 0),
            ('P-b wide 1  field around the power cable', .10, 3.0, 0, 0, 0),
            (f'P-b wide 2  field reaches the body ({reach:.2f} m) → common mode', reach + .12, 2.2, .35, .6, 0),
            ('P-b wide 3  difference at RA, field fades', reach + .12, .6, .08, 14, 9))):
        field(r_out, fs); common.default_value, ring.default_value, lead.default_value = c, rr, ll
        sc.camera = cam; f = os.path.join(FR, f'field_{i}.png'); sc.render.filepath = f; bpy.ops.render.render(write_still=True)
        frames.append((lab, Image.open(f).convert('RGB')))
    L['sheet'](frames, os.path.join(OUT, 'inflow_pli_field.jpg'))
