"""Inflow-marker check stills for the three Story noise scenes (D-054, IDEA-R1-NOISE §10) on the chair figure in the archive.

Not run on its own — `INFLOW=1 FIST_POSE=chair ARCHIVE_BLEND=… python scripts/assets/fist-v3.py` poses, solves and gates the
chair figure (fist + breath bones) and chair-motion-v3.render() hands its locals to run() here.
  P-b  power-line interference: common mode (the whole frosted body faintly red) → difference at one electrode (RA ring and
       its lead bright red). The field shell around the floor cable is not in this round (the cable is out of the 'ma' frame).
  B-b  baseline wander: side view; a thin light thread from the chest front to the baseline of the stored input waveform
       (d0-bw_synth--5, public/archive.json) drawn in the darkened right panel. The waveform is the stored value, never fitted to
       the chest; the thread only joins the two points.
  M-b  muscle noise: a red wave travels inside the body from the forearm up the arm to the RA electrode, fading with distance
       (volume conduction), while the fist is closed.
Stand-ins, not the web: electrodes are plain discs at the figure.json vertices (no lead routing to the yoke; one short lead
from RA), the wave is a per-vertex arc coordinate along wrist → elbow → shoulder → RA computed at rest.
Output: verification/r1-inflow-20261007/ — inflow_pli.jpg, inflow_bw.jpg, inflow_ma.jpg (+ the PNG frames outside the repo).
"""
import base64, json, math, os
import numpy as np

RED = (1.0, .19, .28)          # D-048 noise red (#ff3048, linear-ish)


def _seg_param(P, A, B):
    """Closest point of each row of P on segment AB: (distance, t in 0..1)."""
    d = B - A; L2 = float(d @ d)
    t = np.clip(((P - A) @ d) / L2, 0, 1)
    Q = A + t[:, None] * d
    return np.linalg.norm(P - Q, axis=1), t


def arc_attribute(bpy, o, rig, ra_v):
    """_inflow_d = arc length (m) from the mid-forearm along wrist → elbow → shoulder → RA; _inflow_m = 1 inside the arm/torso
    tube around that path, 0 beyond 9 cm (only the near tissue carries the wave)."""
    kb = o.data.shape_keys.key_blocks['Basis']
    V = np.array([v.co[:] for v in kb.data])
    Mo = np.array(o.matrix_world); Mr = np.array(rig.matrix_world)
    Vw = V @ Mo[:3, :3].T + Mo[:3, 3]
    def bone(n): b = rig.data.bones[n]; return np.array(Mr[:3, :3] @ np.array(b.head_local) + Mr[:3, 3])
    pts = [bone('ORG-hand.R'), bone('ORG-forearm.R'), bone('ORG-upper_arm.R'), Vw[ra_v]]
    seg_len = [float(np.linalg.norm(pts[i + 1] - pts[i])) for i in range(3)]
    start = .5 * seg_len[0]                                   # the wave starts in the forearm muscles, half way up
    best = np.full(len(V), 9.0); arc = np.zeros(len(V)); acc = 0.0
    for i in range(3):
        dist, t = _seg_param(Vw, pts[i], pts[i + 1])
        sel = dist < best; best[sel] = dist[sel]; arc[sel] = acc + t[sel] * seg_len[i]; acc += seg_len[i]
    d = np.clip(arc - start, 0, None); m = np.clip(1 - (best - .05) / .04, 0, 1)
    m *= np.clip((arc - .5 * start) / (.5 * start), 0, 1)         # hand and wrist excluded: the wave starts in the forearm muscle
                                                                   # (front 0 lit the whole fist in the first sheet)
    m[Vw[:, 0] > .02] = 0                                    # right side only (the figure's right is −x)
    for name, val in (('_inflow_d', d), ('_inflow_m', m)):
        a = o.data.attributes.get(name) or o.data.attributes.new(name, 'FLOAT', 'POINT')
        a.data.foreach_set('value', val.astype(np.float32))
    total = acc - start
    print(f'   inflow arc: forearm mid → RA {total:.3f} m, {int((m > .5).sum())} vertices in the tube')
    return total


def add_red(bpy, mat):
    """Body material + red emission = common · 0.9 + wave(d − front) · m · 5 · exp(−d / 0.9). Returns the two Value nodes."""
    nt = mat.node_tree; N = nt.nodes.new; L = nt.links.new
    out = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'][0]
    prev = out.inputs['Surface'].links[0].from_socket
    common = N('ShaderNodeValue'); common.name = 'common'; common.outputs[0].default_value = 0
    front = N('ShaderNodeValue'); front.name = 'front'; front.outputs[0].default_value = -1
    ad = N('ShaderNodeAttribute'); ad.attribute_name = '_inflow_d'
    am = N('ShaderNodeAttribute'); am.attribute_name = '_inflow_m'
    def op(o_, a, b=None, v=None):
        n = N('ShaderNodeMath'); n.operation = o_
        L(a, n.inputs[0]) if not isinstance(a, float) else setattr(n.inputs[0], 'default_value', a)
        if b is not None: L(b, n.inputs[1])
        elif v is not None: n.inputs[1].default_value = v
        return n.outputs[0]
    x = op('DIVIDE', op('SUBTRACT', ad.outputs['Fac'], front.outputs[0]), v=.045)
    wave = op('EXPONENT', op('MULTIPLY', op('MULTIPLY', x, x), v=-1.0))
    fall = op('EXPONENT', op('MULTIPLY', ad.outputs['Fac'], v=-1 / .9))
    wk = N('ShaderNodeValue'); wk.name = 'wave_k'; wk.outputs[0].default_value = 5.0
    w = op('MULTIPLY', op('MULTIPLY', op('MULTIPLY', wave, am.outputs['Fac']), fall), wk.outputs[0])
    s = op('ADD', w, op('MULTIPLY', common.outputs[0], v=.9))
    em = N('ShaderNodeEmission'); em.inputs['Color'].default_value = (*RED, 1); L(s, em.inputs['Strength'])
    add = N('ShaderNodeAddShader'); L(prev, add.inputs[0]); L(em.outputs[0], add.inputs[1]); L(add.outputs[0], out.inputs['Surface'])
    return common.outputs[0], front.outputs[0]


def emissive(bpy, name, color, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (*color, 1); em.inputs['Strength'].default_value = strength
    nt.links.new(em.outputs[0], out.inputs['Surface']); return m, em.inputs['Strength']


def electrodes(bpy, Vector, o, fj):
    """Discs on the evaluated skin at the figure.json vertices + a red ring and a short lead at RA; returns (ring, lead) strengths."""
    dg = bpy.context.evaluated_depsgraph_get(); me = o.evaluated_get(dg).to_mesh(); Mo = o.matrix_world
    foam = bpy.data.materials.new('el_foam'); foam.use_nodes = True
    foam.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.85, .83, .78, 1)
    ring_m, ring_s = emissive(bpy, 'ra_ring', RED, 0.0); lead_m, lead_s = emissive(bpy, 'ra_lead', RED, 0.0)
    P = {}
    for k, e in fj['electrodes'].items():
        v = me.vertices[e['v']]; p = Mo @ v.co; n = (Mo.to_3x3() @ v.normal).normalized(); P[k] = (p, n)
        bpy.ops.mesh.primitive_cylinder_add(radius=.019, depth=.003, vertices=24, location=p + n * .002)
        d = bpy.context.object; d.rotation_euler = n.to_track_quat('Z', 'Y').to_euler(); d.data.materials.append(foam)
        if k == 'RA':
            bpy.ops.mesh.primitive_torus_add(major_radius=.024, minor_radius=.0022, location=p + n * .004)
            r = bpy.context.object; r.rotation_euler = d.rotation_euler; r.data.materials.append(ring_m)
    o.evaluated_get(dg).to_mesh_clear()
    p, n = P['RA']                                             # one lead off RA: out, down the chest front, toward the yoke
    cu = bpy.data.curves.new('ra_lead', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = .0018
    sp = cu.splines.new('BEZIER'); pts = [p + n * .006, p + n * .03 + Vector((0, 0, -.08)), Vector((p.x * .4, p.y - .06, p.z - .26))]
    sp.bezier_points.add(len(pts) - 1)
    for bp, q in zip(sp.bezier_points, pts): bp.co = q; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    lo = bpy.data.objects.new('ra_lead', cu); bpy.context.scene.collection.objects.link(lo); cu.materials.append(lead_m)
    return ring_s, lead_s


def stored_trace(root, sid, key='input'):
    j = json.load(open(os.path.join(root, 'prototype', 'v2', 'public', 'archive.json')))
    s = [a for a in j['scenes'] if a['id'] == sid][0]
    x = np.frombuffer(base64.b64decode(s['traces'][key]), dtype='<i2').astype(float) * s['scale']
    return x, j['fs']


def run(L):
    g = L['g']; bpy, o, rig, P, state, apply = g['bpy'], g['o'], g['rig'], g['P'], g['state'], g['apply']
    Vector, ROOT = g['Vector'], g['ROOT']; sc, cams, base = L['sc'], L['cams'], L['base']
    cm = L['cm']                                             # the chair-motion module (breath_at, breath_bones)
    from PIL import Image, ImageDraw
    from bpy_extras.object_utils import world_to_camera_view as w2c
    OUT = os.path.join(ROOT, 'verification', 'r1-inflow-20261007'); os.makedirs(OUT, exist_ok=True)
    FR = os.environ.get('FRAMES_DIR', '/tmp/inflow-frames'); os.makedirs(FR, exist_ok=True)
    fj = json.load(open(os.path.join(ROOT, 'prototype', 'v2', 'src', 'story', 'intro', 'assets', 'figure.json')))['poses_v3']['chair']
    total = arc_attribute(bpy, o, rig, fj['electrodes']['RA']['v'])
    common, front = add_red(bpy, o.data.materials[0])
    W, H = sc.render.resolution_x, sc.render.resolution_y

    def pose(t, fist):
        cm.breath_bones(P, Vector, base, .8 * cm.breath_at(t)); apply(*state('close', fist))
        o.data.shape_keys.key_blocks['breath_deep'].value = .8 * cm.breath_at(t); bpy.context.view_layer.update()

    def shot(cam, name):
        sc.camera = cams[cam]; f = os.path.join(FR, name + '.png'); sc.render.filepath = f
        bpy.ops.render.render(write_still=True); return Image.open(f).convert('RGB')

    def panel(im, a=.70):                                     # right ~40 % darkened (chair-motion overlay)
        x0, fe = int(.58 * W), int(.08 * W); ramp = np.clip((np.arange(W) - x0) / fe, 0, 1) * a
        al = Image.fromarray((np.tile(ramp, (H, 1)) * 255).astype(np.uint8))
        return Image.composite(Image.new('RGB', (W, H)), im, al)

    def sheet(frames, path):
        w, h = 480, 270; S = Image.new('RGB', (w * len(frames), h + 22), 'white'); d = ImageDraw.Draw(S)
        for i, (lab, im) in enumerate(frames):
            S.paste(im.resize((w, h)), (i * w, 22)); d.text((i * w + 4, 5), lab, fill='black')
        S.save(path, quality=88); print('   sheet →', path)

    # electrodes go on after the fist solve so their discs sit on the posed skin; re-placed per scene pose
    def with_electrodes(t, fist):
        for x in [x for x in bpy.data.objects if x.name.startswith(('Cylinder', 'Torus', 'ra_lead'))]:
            bpy.data.objects.remove(x, do_unlink=True)
        pose(t, fist); return electrodes(bpy, Vector, o, fj)

    ONLY = os.environ.get('INFLOW_ONLY', 'pli,ma,bw').split(',')     # rerun one scene: INFLOW_ONLY=bw
    # ---- P-b power line: none → common mode → difference at RA ----
    if 'pli' in ONLY:
        ring, lead = with_electrodes(0.0, 0.0); fr = []
        for lab, c, r, l in (('P-b 0  before', 0, 0, 0), ('P-b 1  common mode: whole body faint red', .35, .6, 0),
                             ('P-b 2  difference: RA ring + lead', .08, 14, 9)):
            common.default_value, ring.default_value, lead.default_value = c, r, l
            fr.append((lab, panel(shot('ma', 'pli_' + lab[4]))))
        sheet(fr, os.path.join(OUT, 'inflow_pli.jpg'))
        common.default_value = ring.default_value = lead.default_value = 0

    # ---- M-b muscle: fist closed, the wave front climbs forearm → RA ----
    if 'ma' in ONLY:
        ring, lead = with_electrodes(1.6, 1.0); fr = []
        for i, k in enumerate((0, .33, .66, 1.0)):
            front.default_value = k * total; ring.default_value = 14 * max(0, k - .8) / .2; lead.default_value = 9 * max(0, k - .9) / .1
            fr.append((f'M-b {i}  wave front {k * total:.2f} m of {total:.2f}', panel(shot('ma', f'ma_{i}'))))
        sheet(fr, os.path.join(OUT, 'inflow_ma.jpg'))
        front.default_value = -1; ring.default_value = lead.default_value = 0

    if 'field' in ONLY:                                          # P-b first stage on a wide crane shot (inflow-field-v3.py)
        import importlib.util as _iu, types
        _sp = _iu.spec_from_file_location('inflow_field', os.path.join(ROOT, 'scripts', 'assets', 'inflow-field-v3.py'))
        _f = _iu.module_from_spec(_sp); _sp.loader.exec_module(_f)
        _f.run(dict(g=g, sc=sc, cams=cams, ip=types.SimpleNamespace(add_red=add_red), red=(common, front),
                    with_electrodes=with_electrodes, sheet=sheet))
    if 'clip' in ONLY:                                           # short clips of the three markers (user 2026-10-08 "영상으로 보여줘")
        import subprocess
        FPS = int(os.environ.get('CLIP_FPS', 8)); wk = o.data.materials[0].node_tree.nodes['wave_k'].outputs[0]
        def ss(a, b, t): return float(np.clip((t - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((t - a) / (b - a), 0, 1)))
        def frame(path, render):
            if not os.path.exists(path): render().save(path)
        def mp4(tag, n):
            out = os.path.join(OUT, f'clip_{tag}.mp4')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(FR, f'clip_{tag}_%03d.png'),
                            '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '20', out], check=True); print('   clip →', out)
        # P-b 3 s: common mode rises (0–1.2 s), then the difference at RA (1.4–2.2 s) while the body fades back
        n = 3 * FPS
        for i in range(n):
            t = i / FPS; ring, lead = with_electrodes(t, 0.0)
            c = .7 * ss(0, 1.2, t) * (1 - .85 * ss(1.4, 2.2, t))
            common.default_value, ring.default_value, lead.default_value = c, .6 * ss(0, 1.2, t) + 13 * ss(1.4, 2.2, t), 9 * ss(1.6, 2.4, t)
            frame(os.path.join(FR, f'clip_pli_{i:03d}.png'), lambda: panel(shot('ma', '_clip')))
        mp4('pli', n); common.default_value = 0
        # M-b 3 s: one clench at 0.2 s (video timing: close .56, hold .45, open .39), the wave climbs 0.5–1.7 s
        wk.default_value = 12.0
        for i in range(n):
            t = i / FPS
            fist = ss(.2, .76, t) if t < 1.21 else 1 - ss(1.21, 1.6, t)
            ring, lead = with_electrodes(t, fist)
            front.default_value = (ss(.5, 1.7, t) * 1.15 - .05) * total
            ring.default_value = 13 * ss(1.55, 1.8, t) * (1 - ss(2.4, 3.0, t)); lead.default_value = 9 * ss(1.65, 1.95, t) * (1 - ss(2.4, 3.0, t))
            frame(os.path.join(FR, f'clip_ma_{i:03d}.png'), lambda: panel(shot('ma', '_clip')))
        mp4('ma', n); front.default_value = -1; wk.default_value = 5.0
        ring.default_value = lead.default_value = 0
    if 'tune' in ONLY:                                           # strength comparison (user 2026-10-07 "세기 조정")
        wk = o.data.materials[0].node_tree.nodes['wave_k'].outputs[0]
        ring, lead = with_electrodes(0.0, 0.0); fr = []
        for c in (.35, .7, 1.2):
            common.default_value, ring.default_value = c, .6
            fr.append((f'P-b common mode  {c:.2f}', panel(shot('ma', f'tune_pli_{c:.2f}'))))
        sheet(fr, os.path.join(OUT, 'tune_pli_common.jpg')); common.default_value = ring.default_value = 0
        ring, lead = with_electrodes(1.6, 1.0); fr = []
        for k in (5.0, 9.0, 14.0):
            wk.default_value = k
            for fi, fk in ((0, 0.0), (1, .45)):
                front.default_value = fk * total
                fr.append((f'M-b wave {k:.0f}  front {fk * total:.2f} m', panel(shot('ma', f'tune_ma_{k:.0f}_{fi}'))))
        sheet(fr, os.path.join(OUT, 'tune_ma_wave.jpg')); front.default_value = -1; wk.default_value = 5.0
    if 'bw' not in ONLY: print('   inflow stills →', OUT); return
    # ---- B-b baseline: side view, chest front → stored baseline thread ----
    x, fs = stored_trace(ROOT, 'd0-bw_synth--5')
    k_ = int(fs); base_lp = np.convolve(x, np.ones(k_) / k_, mode='same')          # 1 s moving average = the slow baseline
    pose(0.0, 0.0)                                               # pick the sternum on the posed skin (the rest mesh stands:
    dg = bpy.context.evaluated_depsgraph_get(); me = o.evaluated_get(dg).to_mesh()   # its z = .9 m is the hip — first run)
    V = np.array([(o.matrix_world @ v.co)[:] for v in me.vertices]); o.evaluated_get(dg).to_mesh_clear()
    ra = V[fj['electrodes']['RA']['v']]
    cand = np.where((np.abs(V[:, 0]) < .015) & (np.abs(V[:, 2] - (ra[2] - .06)) < .015))[0]
    sternum = int(cand[np.argmin(V[cand, 1])])                                       # most frontal (−y) point mid-chest
    print(f'   sternum vertex {sternum} at {np.round(V[sternum], 3)} (RA {np.round(ra, 3)})')
    cs = cams['side']; cs.data.ortho_scale = 1.9; cs.location.z += .2    # whole head in frame (1.6 and 1.75 + .12 cropped it)
    cs.data.clip_start = max(.05, abs(cs.location.x) - .45)     # ortho: skip the archive desk between the camera and the figure
    with_electrodes(0.0, 0.0); fr = []
    lo_, hi_ = float(np.percentile(x, 1)), float(np.percentile(x, 99))
    bmin, bmax = float(base_lp.min()), float(base_lp.max())
    def breath_bw(t):                                            # F-030: the breath follows the stored baseline (inhale = rise)
        return float(np.clip((base_lp[max(0, int(t * fs) - 1)] - bmin) / (bmax - bmin), 0, 1))
    def chest_px(bb):
        cm.breath_bones(P, Vector, base, .8 * bb); apply(*state('close', 0.0))
        o.data.shape_keys.key_blocks['breath_deep'].value = .8 * bb; bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get(); me = o.evaluated_get(dg).to_mesh()
        cp = o.matrix_world @ me.vertices[sternum].co; o.evaluated_get(dg).to_mesh_clear()
        q = w2c(sc, cams['side'], cp); return q.x * W, (1 - q.y) * H
    ex_x, ex_y = chest_px(0.0)                                   # exhaled chest point: the reference tick
    y0 = ex_y                                                    # panel layout only: 0 mV at the exhaled chest height
    k_px = min((y0 - .12 * H) / max(float(x.max()), 1e-3), (.95 * H - y0) / max(-float(x.min()), 1e-3))   # whole stored trace fits
    print(f'   B-b panel: 0 mV at y {y0:.0f} px, {k_px:.0f} px/mV (stored range {x.min():+.2f}..{x.max():+.2f} mV)')
    BWCLIP = 'clip' in ONLY; CF = int(os.environ.get('CLIP_FPS', 8))
    times = [1.1 + j / CF for j in range(int(3.5 * CF))] if BWCLIP else (1.1, 2.5, 4.6, 6.0)   # clip: 1.1–4.6 s, ↓ ↑ ↓
    for i, t in enumerate(times):                                # stills: stored baseline extremes (IDEA-R1-NOISE §6.2): ↓ ↑ ↓ ↑
        bb = breath_bw(t); cx, cy = chest_px(bb)
        fpath = os.path.join(FR, f'clip_bw_{i:03d}.png')
        if BWCLIP and os.path.exists(fpath): continue
        im = panel(shot('side', '_clip' if BWCLIP else f'bw_{i}')); d = ImageDraw.Draw(im)
        px0, px1, py0, py1 = int(.64 * W), int(.97 * W), int(.25 * H), int(.75 * H)
        n = int(t * fs) if t > 0 else 1; win = int(4 * fs)                           # sweep: the last 4 s up to t
        i0 = max(0, n - win); seg = x[i0:n]
        def Y(v): return y0 - v * k_px
        def X(j): return px0 + (j - (n - win)) / win * (px1 - px0)
        if len(seg) > 1: d.line([(X(i0 + j), Y(v)) for j, v in enumerate(seg)], fill=(235, 238, 245), width=2)
        hx, hy = X(n - 1), Y(base_lp[n - 1])
        for wd, col in ((7, (90, 60, 30)), (3, (255, 196, 120)), (1, (255, 240, 210))):   # warm thread with a soft glow
            d.line([(cx, cy), (hx, hy)], fill=col, width=wd)
        d.ellipse([hx - 4, hy - 4, hx + 4, hy + 4], outline=(255, 210, 150), width=2)
        d.line([(ex_x - 22, ex_y), (ex_x - 6, ex_y)], fill=(150, 140, 125), width=1)     # exhaled chest height (reference)
        d.line([(px0 - 8, y0), (px0 - 2, y0)], fill=(150, 140, 125), width=1)            # 0 mV on the panel edge
        d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=(255, 205, 140))                # chest point: its rise reads against the tick
        d.text((px0, int(.06 * H)), 'stored input  d0-bw_synth −5 dB  (synthetic noise · illustrative)', fill=(200, 200, 205))
        fr.append((f'B-b {i}  t={t:.1f} s  breath {bb:.2f}  baseline {base_lp[n - 1]:+.2f} mV  chest {ex_y - cy:+.0f} px', im))
        if BWCLIP: im.save(fpath); fr = []
    if BWCLIP:
        mp4('bw', len(times))
    else:
        sheet(fr, os.path.join(OUT, 'inflow_bw.jpg'))
    print('   inflow stills →', OUT)
