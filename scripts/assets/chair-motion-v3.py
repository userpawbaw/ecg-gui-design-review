"""Preview of the D-053 story pose: the figure on the measurement chair, breathing and clenching the right fist (D-052/D-053).

Not run on its own — `FIST_POSE=chair python scripts/assets/fist-v3.py` poses the chair figure, solves and gates the fist
(42 frames) and then calls render() here with its globals.
  breath  2 per 10 s (D-053): inhale 2.0 s, exhale 3.0 s (smoothstep), deep-breath key × 0.8 (breath_deep_v3.npz, breath-v3.py)
          + bones on the same curve (r1-breath README 'left'): thoracic extension (chest control back about its head, 4° × 0.8),
          the neck turned forward by the same angle so the gaze stays put, both shoulders raised 1.5 cm × 0.8; the hands are IK
          (fixed), so only the elbows follow. Gated at breath 0 / .5 / 1 × open / fist (pose-check + chair contact) before frames
  fist    the video's timing: close window = mean close core / .62, open window = median open core / .62 (the profile window
          spans the core widened 30 % each side), hold 0.45 s; three clenches in 10 s
  views   'ma'   low, in front of the right knee looking up past the fist to the chest (IDEA-R1-NOISE §8.5)
          'side' orthographic from the person's right (§8.4: the chest front reads best in profile)
Output: verification/r1-chair-motion-20261006/ — chair_motion.mp4 (both views side by side, 15 fps), key-frame sheet.
"""
import math, os, subprocess
import numpy as np


def smooth(x):
    x = min(1.0, max(0.0, x)); return x * x * (3 - 2 * x)


def breath_at(t, period=5.0, inhale=2.0):
    u = t % period
    return smooth(u / inhale) if u < inhale else 1.0 - smooth((u - inhale) / (period - inhale))


BR_EXT, BR_SH = 4.0, 1.5          # deep-breath peak: thoracic extension (°), shoulder rise (cm); ×0.8 like the shape key
SH_CM_PER_DEG = 1.4 / 5           # probe: shoulder.R 5° about +y lifts the shoulder joint 1.4 cm


def breath_bones(P, Vector, base, b):
    """Breath b (0..1, already × 0.8) on the spine/shoulder controls, from their posed matrix_basis in `base`.
    The figure faces −y: a turn about +x at the chest control bends the upper body forward, so extension is negative."""
    for k, M in base.items(): P.pb[k].matrix_basis = M.copy()
    X, Y = Vector((1, 0, 0)), Vector((0, 1, 0))
    if b <= 0: P.up(); return
    fa0 = (P.tail('ORG-forearm.L') - P.head('ORG-forearm.L')).normalized()
    P.turn('chest', -BR_EXT * b, X); P.turn('neck', BR_EXT * b, X)
    a = BR_SH * b / SH_CM_PER_DEG
    P.turn('shoulder.R', a, Y); P.turn('shoulder.L', -a, Y)
    # the left hand rests on the thigh: with it fixed, the rising shoulder swings the forearm and the wrist passes its radial
    # deviation limit at the peak (20.8° > 20°, first gate run) — the hand rolls with the forearm instead (about the wrist)
    fa1 = (P.tail('ORG-forearm.L') - P.head('ORG-forearm.L')).normalized()
    q = fa0.rotation_difference(fa1); ax, ang = q.axis, q.angle
    if ang > 1e-5: P.turn('hand_ik.L', math.degrees(ang), ax)


FIG_ANCHOR = (0.0, .0087, .4313)                                     # figure.json poses_v3.chair.anchor (rig frame): buttock contact


def place_chair(bpy, Vector, root, slug='GreenChair_01', height=None):
    """A Poly Haven chair (CC0) in the figure frame: backrest toward +y, standing on the floor, the chair_fit anchor
    (build_archive.py) under the figure's buttock contact in x/y; seat and armrests measured by casting rays. Returns the seat
    height the figure must sit at (h, figure.json convention: anchor = h + 1.3 mm).
    GreenChair_01 (native scale): armrests 0.21 m over the seat — the seated elbow rests on them (user 2026-10-06: "팔걸이 높은
    의자로 바꿔서"); modern_arm_chair_01 (the archive chair, scaled to 0.82 m) has them at 0.15 m, below the elbow."""
    import math as m
    from mathutils.bvhtree import BVHTree
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(root, f'assets/source/ph-{slug}/{slug}_1k.gltf'))
    new = [o for o in bpy.data.objects if o not in before]; roots = [o for o in new if o.parent is None]
    for o in new: o['chair'] = True
    def bbox():
        bpy.context.view_layer.update(); P = [o.matrix_world @ Vector(c) for o in new if o.type == 'MESH' for c in o.bound_box]
        return Vector([min(p[i] for p in P) for i in range(3)]), Vector([max(p[i] for p in P) for i in range(3)])
    def cast_all():
        dg = bpy.context.evaluated_depsgraph_get(); T = [(BVHTree.FromObject(o, dg), o.matrix_world.copy()) for o in new if o.type == 'MESH']
        def cast(a, d):
            best = None
            for t, M in T:
                Mi = M.inverted(); h = t.ray_cast(Mi @ a, (Mi.to_3x3() @ d).normalized())
                if h[0] is not None:
                    w = M @ h[0]
                    if best is None or (w - a).length < best[1]: best = (w, (w - a).length)
            return best
        return cast
    lo, hi = bbox(); sc_ = height / (hi.z - lo.z) if height else 1.0
    for r in roots: r.rotation_mode = 'XYZ'; r.scale = tuple(v * sc_ for v in r.scale)   # glTF roots are QUATERNION (F-033)
    lo, hi = bbox()
    for r in roots: r.location.z -= lo.z                                # stand on the floor
    def grid(cast, lo, hi, step=.02):
        c = (lo + hi) / 2; pts = []
        for i in range(-30, 31):
            for j in range(-30, 31):
                h = cast(Vector((c.x + i * step, c.y + j * step, hi.z + .2)), Vector((0, 0, -1)))
                if h: pts.append(h[0])
        return c, pts
    lo, hi = bbox(); cast = cast_all(); c, pts = grid(cast, lo, hi)
    zs = sorted(p.z for p in pts if abs(p.x - c.x) < .12 and abs(p.y - c.y) < .12); seat_z = zs[len(zs) // 2]
    back = [p for p in pts if p.z > seat_z + .25]; bc = sum(back, Vector()) / len(back)
    b = Vector((bc.x - c.x, bc.y - c.y, 0)).normalized(); yaw = m.atan2(b.x, b.y)       # turn the backrest toward +y
    for r in roots: r.rotation_euler.z += yaw
    lo, hi = bbox(); cast = cast_all(); c, pts = grid(cast, lo, hi)
    b = Vector((0, 1, 0)); hit = cast(Vector((c.x, c.y, seat_z + .22)), b); dback = hit[1] if hit else .25
    anchor = Vector((c.x, c.y, seat_z + .01)) + b * (dback - .21)
    d = Vector((FIG_ANCHOR[0] - anchor.x, FIG_ANCHOR[1] - anchor.y, 0))  # x/y only: the figure sits at this chair's height
    for r in roots: r.location += d
    lo, hi = bbox(); cast = cast_all(); c, pts = grid(cast, lo, hi)
    h = anchor.z - .0013; arms = {}
    for side, sg in (('R', -1), ('L', 1)):
        A = [p for p in pts if sg * p.x > .19 and seat_z + .08 < p.z < seat_z + .45]
        if not A: continue
        zt = sorted(p.z for p in A)[len(A) // 2]; top = [p for p in A if abs(p.z - zt) < .03]
        arms[side] = dict(x=sorted(p.x for p in top)[len(top) // 2], z=zt, front=min(p.y for p in top), back=max(p.y for p in top))
    print(f'   chair {slug}: seat {seat_z:.3f} m, figure h {h:.3f} m, armrests', {k: {kk: round(vv, 3) for kk, vv in v.items()} for k, v in arms.items()})
    return dict(objects=new, seat_z=seat_z, h=h, arms=arms)


def load_archive(bpy, path, sc):
    """Append the empty archive (build_archive.py --light r2 --nofig --save) and move it so its measurement-chair spot
    (scene['chair_fit'] = anchor xyz, yaw, seat z) lands on the figure's seat anchor; the archive's own chair is dropped
    (GreenChair_01 stands in for it, D-053). World = archive frame → figure frame: p_fig = an + R(−yaw)(p − spot)."""
    from mathutils import Matrix, Vector
    with bpy.data.libraries.load(path, link=False) as (src, dst):
        dst.objects = list(src.objects); dst.worlds = list(src.worlds); dst.scenes = list(src.scenes)
    cf = dst.scenes[0].get('chair_fit'); spot, yaw = Vector(cf[:3]), cf[3]
    for s_ in dst.scenes: bpy.data.scenes.remove(s_)
    M = Matrix.Translation(Vector(FIG_ANCHOR)) @ Matrix.Rotation(-yaw, 4, 'Z') @ Matrix.Translation(-spot)
    kept, drop = [], []
    for ob in dst.objects:
        if ob is None: continue
        (drop if ob.type == 'CAMERA' or ob.get('mchair') else kept).append(ob)
    for ob in kept: sc.collection.objects.link(ob)
    for ob in drop: bpy.data.objects.remove(ob, do_unlink=True)
    for ob in kept:
        if ob.parent is None: ob.matrix_basis = M @ ob.matrix_basis   # matrix_world is stale right after linking (all lights
                                                                         # landed on one point under the floor)
    keep = len(kept)
    if dst.worlds: sc.world = dst.worlds[0]
    print(f'   archive: {keep} objects, chair spot {tuple(round(v, 3) for v in spot)} yaw {yaw:.3f}')


def ring_material(bpy, look, density=42.0, attr='_SLICE_rest'):
    """Same node graph as build_archive.py ring_material (the stills stand-in for the web ring shader): bands on the bone-axis
    coordinate stored per vertex at rest, so the rings ride with the skin through the fist. h5 = frosted glass + faint bands
    (D-048 choice), h3b = bands + soft rim on a transparent body."""
    rm = bpy.data.materials.new('rings_' + look); rm.use_nodes = True; nt = rm.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = attr; coord = at.outputs['Fac']
    mth = nt.nodes.new('ShaderNodeMath'); mth.operation = 'MULTIPLY'; mth.inputs[1].default_value = density; nt.links.new(coord, mth.inputs[0])
    pp = nt.nodes.new('ShaderNodeMath'); pp.operation = 'PINGPONG'; pp.inputs[1].default_value = .5; nt.links.new(mth.outputs[0], pp.inputs[0])
    band = nt.nodes.new('ShaderNodeMath'); band.operation = 'LESS_THAN'; band.inputs[1].default_value = .07; nt.links.new(pp.outputs[0], band.inputs[0])
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (1.0, .9, .78, 1)
    lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .25
    if look == 'h5':
        k = nt.nodes.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = 1.2; nt.links.new(band.outputs[0], k.inputs[0]); nt.links.new(k.outputs[0], em.inputs['Strength'])
        gl = nt.nodes.new('ShaderNodeBsdfPrincipled'); gl.inputs['Base Color'].default_value = (.92, .94, .97, 1)
        gl.inputs['Transmission Weight'].default_value = 1; gl.inputs['Roughness'].default_value = .42; gl.inputs['IOR'].default_value = 1.25
        add = nt.nodes.new('ShaderNodeAddShader'); nt.links.new(gl.outputs[0], add.inputs[0]); nt.links.new(em.outputs[0], add.inputs[1]); nt.links.new(add.outputs[0], out.inputs['Surface'])
    else:
        rim = nt.nodes.new('ShaderNodeMath'); rim.operation = 'MULTIPLY'; rim.inputs[1].default_value = .9; nt.links.new(lw.outputs['Facing'], rim.inputs[0])
        bs = nt.nodes.new('ShaderNodeMath'); bs.operation = 'MULTIPLY'; bs.inputs[1].default_value = 4.0; nt.links.new(band.outputs[0], bs.inputs[0])
        st = nt.nodes.new('ShaderNodeMath'); st.operation = 'ADD'; nt.links.new(bs.outputs[0], st.inputs[0]); nt.links.new(rim.outputs[0], st.inputs[1])
        nt.links.new(st.outputs[0], em.inputs['Strength'])
        vis = nt.nodes.new('ShaderNodeMath'); vis.operation = 'MAXIMUM'; nt.links.new(band.outputs[0], vis.inputs[0])
        rv = nt.nodes.new('ShaderNodeMath'); rv.operation = 'MULTIPLY'; rv.inputs[1].default_value = .35
        nt.links.new(lw.outputs['Facing'], rv.inputs[0]); nt.links.new(rv.outputs[0], vis.inputs[1])
        mix = nt.nodes.new('ShaderNodeMixShader'); tr = nt.nodes.new('ShaderNodeBsdfTransparent')
        nt.links.new(vis.outputs[0], mix.inputs[0]); nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out.inputs['Surface'])
    return rm


def render(g):
    bpy, o, rig, P, state, apply = g['bpy'], g['o'], g['rig'], g['P'], g['state'], g['apply']
    Vector, ROOT, PROF = g['Vector'], g['ROOT'], g['PROF']
    OUT = os.path.join(ROOT, 'verification', 'r1-chair-motion-20261006'); os.makedirs(OUT, exist_ok=True)
    FR = os.environ.get('FRAMES_DIR', os.path.join('/tmp', 'chair-motion-frames')); os.makedirs(FR, exist_ok=True)   # 300 PNGs: not in the repo
    cl = np.mean(PROF['core_duration_s']['close']) / .62; op = float(np.median(PROF['core_duration_s']['open'])) / .62
    HOLD, CLENCH = .45, (1.0, 4.2, 7.4)
    print(f'   fist windows: close {cl:.2f} s, hold {HOLD} s, open {op:.2f} s; clenches at {CLENCH}')

    def fist_at(t):
        for t0 in CLENCH:
            if t0 <= t < t0 + cl: return state('close', (t - t0) / cl)
            if t0 + cl <= t < t0 + cl + HOLD: return state('close', 1.0)
            if t0 + cl + HOLD <= t < t0 + cl + HOLD + op: return state('open', (t - t0 - cl - HOLD) / op)
        return state('close', 0.0)

    # ---- scene ----
    sc = bpy.context.scene
    for x in list(bpy.data.objects):
        if x not in (o, rig) and not x.get('chair'): bpy.data.objects.remove(x, do_unlink=True)
    rig.hide_render = True
    for m in o.modifiers: m.show_viewport = True
    cs = o.modifiers.new('cs', 'CORRECTIVE_SMOOTH'); cs.smooth_type = 'SIMPLE'; cs.factor = .5; cs.iterations = 8
    D = np.load(os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes', 'breath_deep_v3.npz'))['offsets']
    kb = o.data.shape_keys.key_blocks; B = np.array([v.co[:] for v in kb['Basis'].data])
    sk = o.shape_key_add(name='breath_deep'); sk.data.foreach_set('co', (B + D).astype(np.float32).ravel())
    for k in kb:
        if k.name != 'Basis': k.value = 0.0
    ARCH = os.environ.get('ARCHIVE_BLEND')                           # the r2 archive built with build_archive.py --nofig --save
    if ARCH:
        load_archive(bpy, ARCH, sc)
        if os.environ.get('ENGINE', 'CYCLES') == 'CYCLES':          # the archive light (r2) is tuned for Cycles (build_archive --preview)
            sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = int(os.environ.get('SAMPLES', 32))
            sc.cycles.use_denoising = True; sc.cycles.max_bounces = 4; sc.cycles.volume_bounces = 0
        else:
            sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.eevee.taa_render_samples = int(os.environ.get('EEVEE_SAMPLES', 48))
        sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = float(os.environ.get('EXPOSURE', .8))
        clay = bpy.data.materials.new('clay'); clay.use_nodes = True
        bsdf = clay.node_tree.nodes['Principled BSDF']; bsdf.inputs['Base Color'].default_value = (.42, .40, .38, 1); bsdf.inputs['Roughness'].default_value = .7
        o.data.materials.clear(); o.data.materials.append(clay)
        LOOK = os.environ.get('LOOK', 'clay')
        if LOOK in ('h5', 'h3b'):                                      # the ring looks (user 2026-10-07: does the fist read in rings?)
            o.data.materials.clear(); o.data.materials.append(ring_material(bpy, LOOK, float(os.environ.get('DENS', 42))))
            sc.cycles.transparent_max_bounces = 16
    else:
        dark = bpy.data.materials.new('dark'); dark.diffuse_color = (.16, .15, .14, 1)
        bpy.ops.mesh.primitive_plane_add(size=8); fl = bpy.context.object; fl.data.materials.append(dark)
        for x in bpy.data.objects:                                   # clay read: leather brown chair, no textures in Workbench
            if x.get('chair') and x.type == 'MESH':
                for ms in x.material_slots:
                    if ms.material: ms.material.diffuse_color = (.24, .14, .09, 1)
        sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
        sc.display.shading.show_cavity = True
        clay = bpy.data.materials.new('clay'); clay.diffuse_color = (.66, .64, .61, 1); o.data.materials.clear(); o.data.materials.append(clay)
        sc.world = sc.world or bpy.data.worlds.new('w'); sc.world.color = (.30, .32, .36)

    # ---- breath bones: snapshot the posed controls, gate the extremes ----
    base = {k: P.pb[k].matrix_basis.copy() for k in ('chest', 'neck', 'shoulder.L', 'shoulder.R', 'hand_ik.L')}
    pc, chair_objs = g['pc'], [x for x in bpy.data.objects if x.get('chair')]
    bf = 0
    for b in (0.0, .4, .8):
        for lab, st in (('open', state('close', 0.0)), ('fist', state('close', 1.0))):
            breath_bones(P, Vector, base, b); apply(*st)
            rows = pc.check(rig, None, g['CHAIR_SPEC']); nf = sum(r['status'] == 'FAIL' for r in rows); bf += nf
            bad = [f"{r['status']} {r['name']} {r['value']}" for r in rows if r['status'] in ('FAIL', 'WARN')]
            print(f'   breath {b:.1f} {lab}: FAIL {nf}', '; '.join(bad), '| chair', pc.scene_collisions(o, chair_objs, reach=.06))
    if bf and not os.environ.get('POSE_ALLOW_FAIL'):
        print('   BREATH GATE FAIL — no renders'); import sys; sys.stdout.flush(); os._exit(1)
    breath_bones(P, Vector, base, 0.0)

    # ---- cameras (placed on the open-hand pose) ----
    A0, T0 = state('close', 0.0); apply(A0, T0)
    hand = P.head('ORG-hand.R'); chest = P.head('ORG-spine.003')
    cams = {}
    sc.render.resolution_x, sc.render.resolution_y = 960, 540                  # 16:9 like the reference stills
    c1 = bpy.data.cameras.new('ma'); o1 = bpy.data.objects.new('ma', c1); sc.collection.objects.link(o1)
    c1.lens = float(os.environ.get('CAM_LENS', 22)); c1.sensor_width = 36
    cl_ = [float(v) for v in os.environ.get('CAM_LOC', '-0.28,-1.25,0.86').split(',')]
    ct_ = [float(v) for v in os.environ.get('CAM_TGT', '0.14,0.0,0.97').split(',')]
    o1.location = Vector(cl_); tgt = Vector(ct_)   # user reference 2026-10-06: front, a little to the figure's right, belly height,
    o1.rotation_euler = (tgt - o1.location).to_track_quat('-Z', 'Y').to_euler(); cams['ma'] = o1   # wide, head top cropped, fist low-left
    if not os.environ.get('CAM_LOC'):                                 # auto-frame: put key points where the reference has them
        from bpy_extras.object_utils import world_to_camera_view as w2c
        A1, T1 = state('close', 1.0); apply(A1, T1)
        KP = {'fist': (P.head('ORG-f_middle.02.R'), (.20, .30)),               # fist low-left, large
              'head': (P.tail('ORG-spine.006') + Vector((0, 0, .02)), (.34, 1.02)),   # head top just cropped
              'lhand': (P.head('ORG-hand.L'), (.56, .14))}                     # left hand on the knee; right ~40 % kept for the waveform
        def err(x):
            o1.location = Vector(x[:3]); o1.rotation_euler = (Vector(x[3:]) - o1.location).to_track_quat('-Z', 'Y').to_euler()
            bpy.context.view_layer.update()
            df = (Vector(x[:3]) - KP['fist'][0]).length                   # front, the figure's right, belly height, fist close
            e = 1000 * (max(0.0, x[1] + .60) + max(0.0, .60 - x[2]) + max(0.0, x[2] - 1.0) + max(0.0, x[0])
                        + max(0.0, df - .80) + max(0.0, .55 - df)) ** 2
            for pt, (u, v) in KP.values():
                q = w2c(sc, o1, pt); e += (q.x - u) ** 2 + (q.y - v) ** 2 + (0 if q.z > .2 else 10)
            return e
        x = cl_ + ct_; best = err(x)
        for step in (.2, .1, .05, .02, .01, .005):
            moved = True
            while moved:
                moved = False
                for i in range(6):
                    for sg in (-1, 1):
                        y = list(x); y[i] += sg * step; e = err(y)
                        if e < best - 1e-7: best, x, moved = e, y, True
        err(x); print('   auto camera', [round(v, 3) for v in x], 'residual', round(best, 5),
                      {k: tuple(round(c, 2) for c in w2c(sc, o1, pt)[:2]) for k, (pt, _) in KP.items()})
    c2 = bpy.data.cameras.new('side'); o2 = bpy.data.objects.new('side', c2); sc.collection.objects.link(o2)
    c2.type = 'ORTHO'; c2.ortho_scale = 1.9; o2.location = Vector((-1.2, chest.y - .05, chest.z - .2))   # inside the archive walls
    o2.rotation_euler = (math.radians(90), 0, math.radians(-90)); cams['side'] = o2
    for lab, st in (('open', state('close', 0.0)), ('fist', state('close', 1.0))):
        apply(*st); bpy.context.view_layer.update()
        print(f'   body vs chair ({lab}):', pc.scene_collisions(o, chair_objs, reach=.06))
    if os.environ.get('STILLS_ONLY'):
        tag = os.environ.get('STILL_TAG', '')
        for lab, st in (('open', state('close', 0.0)), ('mid', state('close', .55)), ('fist', state('close', 1.0))):
            apply(*st)
            for name, cam in cams.items():
                if name != 'ma': continue
                sc.camera = cam; sc.render.filepath = os.path.join(OUT, f'still_{name}_{lab}{tag}.png'); bpy.ops.render.render(write_still=True)
        print('   stills →', OUT); return

    # ---- frames ----
    FPS, DUR = int(os.environ.get('FPS', 15)), 10.0; n = int(FPS * DUR)
    if os.environ.get('NO_SIDE'): cams = {'ma': cams['ma']}              # archive (Cycles) runs: the reference view only
    if os.environ.get('CLIP'):                                        # one clench, hand region only (ring-look readability test)
        t0, t1 = 0.9, 2.6; m = int((t1 - t0) * FPS); W_, H_ = sc.render.resolution_x, sc.render.resolution_y
        sc.render.use_border = True; sc.render.use_crop_to_border = True
        sc.render.border_min_x, sc.render.border_max_x = .03, .36; sc.render.border_min_y, sc.render.border_max_y = .06, .52
        clip = os.path.join(FR, os.environ['CLIP']); os.makedirs(clip, exist_ok=True)
        for i in range(m):
            t = t0 + i / FPS; breath_bones(P, Vector, base, .8 * breath_at(t)); A, T = fist_at(t); apply(A, T)
            o.data.shape_keys.key_blocks['breath_deep'].value = .8 * breath_at(t)
            sc.camera = cams['ma']; sc.render.filepath = os.path.join(clip, f'c_{i:04d}.png'); bpy.ops.render.render(write_still=True)
        print('   clip frames →', clip, m); return
    for i in range(n):
        t = i / FPS; breath_bones(P, Vector, base, .8 * breath_at(t)); A, T = fist_at(t); apply(A, T)
        o.data.shape_keys.key_blocks['breath_deep'].value = .8 * breath_at(t)
        for name, cam in cams.items():
            sc.camera = cam; sc.render.filepath = os.path.join(FR, f'{name}_{i:04d}.png')
            bpy.ops.render.render(write_still=True)
        if i % 15 == 0: print(f'   frame {i}/{n}', flush=True)
    # right ~40 % darkened to 70 % (user 2026-10-06: no monitor — the waveform is drawn there as in the intro, in the web layer)
    from PIL import Image
    Wd, Hd = sc.render.resolution_x, sc.render.resolution_y
    x0, feather = int(.58 * Wd), int(.08 * Wd)
    ramp = np.clip((np.arange(Wd) - x0) / feather, 0, 1) * .70
    alpha = Image.fromarray((np.tile(ramp, (Hd, 1)) * 255).astype(np.uint8))
    black = Image.new('RGB', (Wd, Hd), (0, 0, 0))
    for i in range(n):
        im = Image.open(os.path.join(FR, f'ma_{i:04d}.png')).convert('RGB')
        Image.composite(black, im, alpha).save(os.path.join(FR, f'ov_{i:04d}.png'))
    NAME = os.environ.get('OUT_NAME', 'chair_motion')
    mp4 = os.path.join(OUT, f'{NAME}.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(FR, 'ov_%04d.png'),
                    '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '20', mp4], check=True)
    # key-frame sheet: open, mid-close, fist, inhale peak, exhale trough
    from PIL import ImageDraw
    keys = [(0.0, 'open, exhaled'), (1.0 + cl * .5, 'closing'), (1.0 + cl + .2, 'fist held'), (2.0, 'inhale peak'), (4.95, 'exhale end')]
    keys.sort()
    rows_ = ('ov', 'side') if 'side' in cams else ('ov',)
    W, Hh = 384, 216; sheet = Image.new('RGB', (W * len(keys), Hh * len(rows_) + 22), 'white'); dr = ImageDraw.Draw(sheet)
    for c, (t, lab) in enumerate(keys):
        i = min(n - 1, int(round(t * FPS)))
        dr.text((c * W + 4, 5), f't={i / FPS:.2f}s {lab}  breath {breath_at(i / FPS):.2f}', fill='black')
        for r, name in enumerate(rows_):
            sheet.paste(Image.open(os.path.join(FR, f'{name}_{i:04d}.png')).convert('RGB').resize((W, Hh)), (c * W, 22 + r * Hh))
    sheet.save(os.path.join(OUT, f'{NAME}_keys.jpg'), quality=85)
    if 'side' in cams:                                                # breath check: side silhouettes, exhaled (t=0) vs inhale peak (t=2)
        a_ = np.asarray(Image.open(os.path.join(FR, 'side_0000.png')).convert('L'), float)
        b_ = np.asarray(Image.open(os.path.join(FR, f'side_{int(2.0 * FPS):04d}.png')).convert('L'), float)
        ov = np.stack([b_, a_, a_], -1).astype(np.uint8)              # red fringe = inhale only, cyan = exhale only
        Image.fromarray(ov).save(os.path.join(OUT, f'{NAME}_side_overlay.png'))
    print('   video →', mp4)
