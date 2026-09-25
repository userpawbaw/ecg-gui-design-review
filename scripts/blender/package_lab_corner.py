"""Package the baked lab corner for the web (run after build_lab_corner.py).

- glb: gltf-transform optimize with meshopt + WebP textures, keeping TEXCOORD_1 (lightmap UV) and
  disabling simplification (both would otherwise break the lightmap: see REF/audit notes 2026-09-25).
- lightmaps: PNG (sqrt-encoded) -> WebP q92 via ffmpeg/libwebp; manifest file names updated.
"""
import json, os, subprocess, sys, glob
import imageio_ffmpeg

out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'prototype/spikes/lab-corner/public/scene')
glb = os.path.join(out, 'lab_corner.glb'); tmp = glb + '.opt.glb'
subprocess.run(['npx', '--yes', '@gltf-transform/cli@4', 'optimize', glb, tmp, '--compress', 'meshopt',
                '--texture-compress', 'webp', '--texture-size', '1024', '--prune-attributes', 'false', '--simplify', 'false'], check=True)
os.replace(tmp, glb)
ff = imageio_ffmpeg.get_ffmpeg_exe()
for png in sorted(glob.glob(os.path.join(out, '*.png'))):
    name = os.path.basename(png)
    if not name.startswith(('light_', 'indirect_', 'ao_', 'sky_', 'bounce_')): continue
    subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '92', png[:-4] + '.webp'], check=True)
    os.remove(png)
mp = os.path.join(out, 'manifest.json'); m = json.load(open(mp))
for a in m['azimuths']:
    for k in ('files', 'indirect_files', 'bounce_files'):
        if k in a: a[k] = {g: f.replace('.png', '.webp') for g, f in a[k].items()}
if 'sky_files' in m: m['sky_files'] = {g: f.replace('.png', '.webp') for g, f in m['sky_files'].items()}
m['web_encoding'] = 'lightmaps: libwebp q92 of the sqrt-encoded PNG; glb: gltf-transform optimize (meshopt, WebP <=1024, TEXCOORD_1 kept, no simplify)'
json.dump(m, open(mp, 'w'), indent=2)
print('packaged', out, round(sum(os.path.getsize(f) for f in glob.glob(os.path.join(out, '*'))) / 1e6, 2), 'MB')
