"""Build the web assets of the ref-repro spike from registered sources (assets/registry.json).

Needs: Pillow, numpy, imageio-ffmpeg (build-time only). Inputs are fetched by `node scripts/assets/fetch.mjs`,
Blender renders by `scripts/blender/render_repro_assets.py` (pass their folder with --renders).

  python3 scripts/prepare_assets.py --renders <dir with hero/ frames and cloud_*.png>   [--only map,globe,photos,hero,clouds]

Outputs → public/ref003/ (hero.mp4, hero.webp, cloud_front.webp, cloud_back.webp, mist.webp, map.webp, route.json)
          public/ref004/ (earth_color.webp, earth_normal.webp, photo_*.webp)
"""
import argparse, glob, json, math, os, subprocess
import numpy as np
from PIL import Image, ImageFilter
import imageio_ffmpeg

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__)); SPIKE = os.path.dirname(HERE); ROOT = os.path.abspath(os.path.join(SPIKE, '../../..'))
SRC = os.path.join(ROOT, 'assets/source')
ap = argparse.ArgumentParser(); ap.add_argument('--renders', default=''); ap.add_argument('--only', default='map,globe,photos,hero,clouds')
args = ap.parse_args(); ONLY = set(args.only.split(','))
O3, O4 = os.path.join(SPIKE, 'public/ref003'), os.path.join(SPIKE, 'public/ref004')
os.makedirs(O3, exist_ok=True); os.makedirs(O4, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
smooth = lambda e0, e1, x: np.clip((x - e0) / (e1 - e0), 0, 1) ** 2 * (3 - 2 * np.clip((x - e0) / (e1 - e0), 0, 1))

# ---------- REF-003 route map: NASA Blue Marble tile B2 (90W–0, 0–90S, 240 px/deg), July 2004 ----------
LON0, LON1, LAT0, LAT1 = -78.0, -50.0, -44.0, -70.0          # crop (west, east, north, south)
MAP_W = 1440
KX = math.cos(math.radians((LAT0 + LAT1) / 2))              # local equal-scale correction (equirect → ~conformal at 57°S)
MAP_H = round(MAP_W * (LAT0 - LAT1) / ((LON1 - LON0) * KX))
PLACES = {'start': ('Punta Arenas', -53.1638, -70.9171), 'end': ('King Sejong Station', -62.2231, -58.7864)}
def to_px(lat, lon): return ((lon - LON0) / (LON1 - LON0) * MAP_W, (LAT0 - lat) / (LAT0 - LAT1) * MAP_H)
def haversine(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0]); dp = p2 - p1; dl = math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))

if 'map' in ONLY:
    tile = Image.open(os.path.join(SRC, 'nasa-bluemarble-200407-B2/world.200407.3x21600x21600.B2.jpg'))
    box = (round((LON0 + 90) * 240), round(-LAT0 * 240), round((LON1 + 90) * 240), round(-LAT1 * 240))
    crop = tile.crop(box).resize((MAP_W, MAP_H), Image.LANCZOS)
    a = np.asarray(crop).astype(np.float32) / 255
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    blue = a[..., 2] - np.maximum(a[..., 0], a[..., 1])            # ocean is blue-dominant
    land = np.maximum(smooth(0.02, -0.06, blue) * smooth(0.06, 0.16, lum), smooth(0.30, 0.45, lum))   # land, or bright ice
    v = np.where(land > 0, 0.14 + 0.72 * smooth(0.04, 0.95, lum) ** 0.75, 0.0)
    v = v * land + (1 - land) * (0.018 + 0.05 * smooth(0.02, 0.18, lum))   # near-black ocean with faint shelf detail
    out = np.stack([v * 0.96, v * 0.98, v * 1.02], -1)              # cool neutral
    Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(os.path.join(O3, 'map.webp'), quality=88, method=6)
    s, e = PLACES['start'], PLACES['end']
    route = {'map': {'w': MAP_W, 'h': MAP_H, 'lon': [LON0, LON1], 'lat': [LAT0, LAT1], 'source': 'NASA Blue Marble NG 2004-07 tile B2 (public domain)'},
             'start': {'name': s[0], 'lat': s[1], 'lon': s[2], 'px': to_px(s[1], s[2])},
             'end': {'name': e[0], 'lat': e[1], 'lon': e[2], 'px': to_px(e[1], e[2])},
             'distance_km': round(haversine(s[1:], e[1:]), 1),
             'note': 'Distance = great-circle (haversine, R 6371 km). Demo content, not an itinerary.'}
    json.dump(route, open(os.path.join(O3, 'route.json'), 'w'), indent=1)
    print('map', MAP_W, MAP_H, route['distance_km'], 'km', route['start']['px'], route['end']['px'])

# ---------- REF-004 globe: Blue Marble 5400 restyled (teal ocean, sage land, white ice) + relief normal map ----------
if 'globe' in ONLY:
    im = Image.open(os.path.join(SRC, 'nasa-bluemarble-200407-5400/world.200407.3x5400x2700.jpg')).resize((4096, 2048), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    blue = a[..., 2] - np.maximum(a[..., 0], a[..., 1])
    land = np.maximum(smooth(0.03, -0.05, blue) * smooth(0.06, 0.14, lum), smooth(0.42, 0.6, lum))   # + bright ice sheets
    land = np.asarray(Image.fromarray((land * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    ice = smooth(0.55, 0.8, lum) * land
    ocean_depth = smooth(0.02, 0.2, a[..., 2])                       # shallow shelves read lighter
    c_ocean = np.array([0.07, 0.40, 0.35]) * (1 - ocean_depth[..., None]) + np.array([0.16, 0.62, 0.52]) * ocean_depth[..., None]
    rel = smooth(0.05, 0.6, lum)[..., None]
    c_land = np.array([0.46, 0.55, 0.33]) * (1 - rel) + np.array([0.80, 0.84, 0.62]) * rel
    c = c_ocean * (1 - land[..., None]) + c_land * land[..., None]
    c = c * (1 - ice[..., None]) + np.array([0.90, 0.95, 0.90]) * ice[..., None]
    Image.fromarray((np.clip(c, 0, 1) * 255).astype(np.uint8)).save(os.path.join(O4, 'earth_color.webp'), quality=90, method=6)
    # normal map from a height proxy (land luminance), ocean flat
    h = (lum * land).astype(np.float32)
    h = np.asarray(Image.fromarray((h * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255
    gx = np.roll(h, -1, 1) - np.roll(h, 1, 1); gy = np.roll(h, -1, 0) - np.roll(h, 1, 0)
    k = 6.0; n = np.stack([-gx * k, gy * k, np.ones_like(h)], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
    Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8)).save(os.path.join(O4, 'earth_normal.webp'), quality=90, method=6)
    Image.fromarray((land * 255).astype(np.uint8)).resize((2048, 1024)).save(os.path.join(O4, 'earth_land.webp'), quality=85)
    print('globe textures')

if 'photos' in ONLY:
    for f in sorted(glob.glob(os.path.join(SRC, 'ph-thumb-*/*.png'))):
        name = os.path.basename(f)[:-4]
        im = Image.open(f).convert('RGB'); w, h = im.size; s = min(w, h)
        im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2)).resize((320, 320), Image.LANCZOS).save(os.path.join(O4, f'photo_{name}.webp'), quality=85)
    print('photos')

R = os.path.abspath(args.renders) if args.renders else ''
if 'hero' in ONLY and R:
    subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '24', '-i', os.path.join(R, 'hero/hero_%04d.png'),
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(O3, 'hero.mp4')], check=True)
    # VP9 webm too: open-source Chromium (headless QA) has no H.264 decoder
    subprocess.run([FF, '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '24', '-i', os.path.join(R, 'hero/hero_%04d.png'),
                    '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', os.path.join(O3, 'hero.webm')], check=True)
    Image.open(os.path.join(R, 'hero/hero_0000.png')).convert('RGB').save(os.path.join(O3, 'hero.webp'), quality=82)
    print('hero', os.path.getsize(os.path.join(O3, 'hero.mp4')))
if 'clouds' in ONLY and R:
    for n in ('front', 'back'):
        Image.open(os.path.join(R, f'clouds/cloud_{n}.png')).save(os.path.join(O3, f'cloud_{n}.webp'), quality=82, method=6)
    # mist board for the tilt transition: the back cloud, flipped so the dense part sits on top edge → gradient to white
    im = Image.open(os.path.join(R, 'clouds/cloud_back.png')).convert('RGBA')
    im.save(os.path.join(O3, 'mist.webp'), quality=80, method=6)
    print('clouds')
