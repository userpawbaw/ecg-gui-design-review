"""Package the baked attic for the web: gltf-transform (meshopt + WebP ≤1024, keep lightmap UV and COLOR_0,
no simplify, no join/flatten/palette so the per-group node names survive) and lightmap PNG → WebP q92. Usage: python3 scripts/package.py public/scene"""
import glob, json, os, subprocess, sys
import imageio_ffmpeg
out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'public/scene')
glb = os.path.join(out, 'attic.glb'); tmp = glb + '.opt.glb'
subprocess.run(['npx', '--yes', '@gltf-transform/cli@4', 'optimize', glb, tmp, '--compress', 'meshopt', '--texture-compress', 'webp',
                '--texture-size', '1024', '--prune-attributes', 'false', '--simplify', 'false',
                '--join', 'false', '--flatten', 'false', '--palette', 'false'], check=True)   # keep Attic_<group> nodes: each group has its own lightmap
os.replace(tmp, glb)
ff = imageio_ffmpeg.get_ffmpeg_exe()
for png in sorted(glob.glob(os.path.join(out, 'light_*.png'))):
    subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '92', png[:-4] + '.webp'], check=True); os.remove(png)
for png in sorted(glob.glob(os.path.join(out, 'print_*.png'))): os.remove(png)       # prints are embedded in the glb
mp = os.path.join(out, 'manifest.json'); m = json.load(open(mp))
for g in m['groups'].values():
    if 'file' in g: g['file'] = g['file'].replace('.png', '.webp')
m['web_encoding'] = 'lightmaps libwebp q92 of sqrt-encoded PNG; glb gltf-transform optimize (meshopt, WebP ≤1024, TEXCOORD_1 + COLOR_0 kept, no simplify)'
json.dump(m, open(mp, 'w'), indent=1)
print('packaged', round(sum(os.path.getsize(f) for f in glob.glob(os.path.join(out, '*'))) / 1e6, 2), 'MB')
