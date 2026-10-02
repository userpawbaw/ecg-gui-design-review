"""Package the baked archive for the web (attic method, prototype/spikes/attic/scripts/package.py): gltf-transform
optimize (meshopt, WebP ≤1024, keep COLOR_0 / TEXCOORD_1, no simplify/join/flatten so the Archive_<group> nodes keep
their names) and lightmap PNG → WebP q92. Usage: python scripts/assets/package-archive.py prototype/v2/public/intro-archive"""
import glob, json, os, subprocess, sys
import imageio_ffmpeg
out = os.path.abspath(sys.argv[1])
glb = os.path.join(out, 'archive.glb'); tmp = glb + '.opt.glb'
npx = 'npx.cmd' if os.name == 'nt' else 'npx'
subprocess.run([npx, '--yes', '@gltf-transform/cli@4', 'optimize', glb, tmp, '--compress', 'meshopt', '--texture-compress', 'webp',
                '--texture-size', '1024', '--prune-attributes', 'false', '--simplify', 'false',
                '--join', 'false', '--flatten', 'false', '--palette', 'false'], check=True)
os.replace(tmp, glb)
ff = imageio_ffmpeg.get_ffmpeg_exe()
for png in sorted(glob.glob(os.path.join(out, 'light_*.png'))):
    subprocess.run([ff, '-hide_banner', '-loglevel', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '92', png[:-4] + '.webp'], check=True); os.remove(png)
mp = os.path.join(out, 'manifest.json'); m = json.load(open(mp, encoding='utf-8'))
for g in m['groups'].values():
    if 'file' in g: g['file'] = g['file'].replace('.png', '.webp')
m['web_encoding'] = 'lightmaps libwebp q92 of sqrt-encoded PNG; glb gltf-transform optimize (meshopt, WebP <=1024, COLOR_0 kept, no simplify)'
json.dump(m, open(mp, 'w', encoding='utf-8'), indent=1)
print('packaged', round(sum(os.path.getsize(f) for f in glob.glob(os.path.join(out, '*'))) / 1e6, 2), 'MB')
