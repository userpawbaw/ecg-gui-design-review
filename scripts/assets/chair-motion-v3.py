"""Preview of the D-053 story pose: the figure on the measurement chair, breathing and clenching the right fist (D-052/D-053).

Not run on its own — `FIST_POSE=chair python scripts/assets/fist-v3.py` poses the chair figure, solves and gates the fist
(42 frames) and then calls render() here with its globals.
  breath  2 per 10 s (D-053): inhale 2.0 s, exhale 3.0 s (smoothstep), deep-breath key × 0.8 (breath_deep_v3.npz, breath-v3.py)
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
        if x not in (o, rig): bpy.data.objects.remove(x, do_unlink=True)
    rig.hide_render = True
    for m in o.modifiers: m.show_viewport = True
    cs = o.modifiers.new('cs', 'CORRECTIVE_SMOOTH'); cs.smooth_type = 'SIMPLE'; cs.factor = .5; cs.iterations = 8
    D = np.load(os.path.join(ROOT, 'assets', 'source', 'blender-human-base-meshes', 'breath_deep_v3.npz'))['offsets']
    kb = o.data.shape_keys.key_blocks; B = np.array([v.co[:] for v in kb['Basis'].data])
    sk = o.shape_key_add(name='breath_deep'); sk.data.foreach_set('co', (B + D).astype(np.float32).ravel())
    for k in kb:
        if k.name != 'Basis': k.value = 0.0
    dark = bpy.data.materials.new('dark'); dark.diffuse_color = (.16, .15, .14, 1)
    bpy.ops.mesh.primitive_plane_add(size=8); fl = bpy.context.object; fl.data.materials.append(dark)
    seat_y = P.head('ORG-spine').y + .02
    bpy.ops.mesh.primitive_cube_add(size=1); seat = bpy.context.object
    seat.scale = (.46, .44, g['CHAIR_H']); seat.location = (0, seat_y + .02, g['CHAIR_H'] / 2); seat.data.materials.append(dark)
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
    sc.display.shading.show_cavity = True; sc.render.resolution_x = sc.render.resolution_y = 520
    clay = bpy.data.materials.new('clay'); clay.diffuse_color = (.66, .64, .61, 1); o.data.materials.clear(); o.data.materials.append(clay)
    sc.world = sc.world or bpy.data.worlds.new('w'); sc.world.color = (.30, .32, .36)

    # ---- cameras (placed on the open-hand pose) ----
    A0, T0 = state('close', 0.0); apply(A0, T0)
    hand = P.head('ORG-hand.R'); chest = P.head('ORG-spine.003')
    cams = {}
    c1 = bpy.data.cameras.new('ma'); o1 = bpy.data.objects.new('ma', c1); sc.collection.objects.link(o1); c1.lens = 24
    o1.location = hand + Vector((-.16, -.34, -.10)); tgt = hand.lerp(chest, .62) + Vector((.06, 0, 0))   # fist low-left, chest behind
    o1.rotation_euler = (tgt - o1.location).to_track_quat('-Z', 'Y').to_euler(); cams['ma'] = o1
    c2 = bpy.data.cameras.new('side'); o2 = bpy.data.objects.new('side', c2); sc.collection.objects.link(o2)
    c2.type = 'ORTHO'; c2.ortho_scale = 1.05; o2.location = Vector((-3.0, chest.y - .12, chest.z - .05))
    o2.rotation_euler = (math.radians(90), 0, math.radians(-90)); cams['side'] = o2

    # ---- frames ----
    FPS, DUR = 15, 10.0; n = int(FPS * DUR)
    for i in range(n):
        t = i / FPS; A, T = fist_at(t); apply(A, T)
        o.data.shape_keys.key_blocks['breath_deep'].value = .8 * breath_at(t)
        for name, cam in cams.items():
            sc.camera = cam; sc.render.filepath = os.path.join(FR, f'{name}_{i:04d}.png')
            bpy.ops.render.render(write_still=True)
        if i % 15 == 0: print(f'   frame {i}/{n}', flush=True)
    mp4 = os.path.join(OUT, 'chair_motion.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(FPS), '-i', os.path.join(FR, 'ma_%04d.png'),
                    '-framerate', str(FPS), '-i', os.path.join(FR, 'side_%04d.png'),
                    '-filter_complex', 'hstack=inputs=2,format=yuv420p', '-c:v', 'libx264', '-crf', '20', mp4], check=True)
    # key-frame sheet: open, mid-close, fist, inhale peak, exhale trough
    from PIL import Image, ImageDraw
    keys = [(0.0, 'open, exhaled'), (1.0 + cl * .5, 'closing'), (1.0 + cl + .2, 'fist, inhaling'), (2.0, 'inhale peak'), (4.95, 'exhale end')]
    W = 300; sheet = Image.new('RGB', (W * len(keys), W * 2 + 22), 'white'); dr = ImageDraw.Draw(sheet)
    for c, (t, lab) in enumerate(keys):
        i = min(n - 1, int(round(t * FPS)))
        dr.text((c * W + 4, 5), f't={i / FPS:.2f}s {lab}  breath {breath_at(i / FPS):.2f}', fill='black')
        for r, name in enumerate(('ma', 'side')):
            sheet.paste(Image.open(os.path.join(FR, f'{name}_{i:04d}.png')).convert('RGB').resize((W, W)), (c * W, 22 + r * W))
    sheet.save(os.path.join(OUT, 'chair_motion_keys.jpg'), quality=85)
    print('   video →', mp4)
