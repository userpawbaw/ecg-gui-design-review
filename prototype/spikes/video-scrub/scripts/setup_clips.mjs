// Prepare every test clip the player uses (public/clips/ is generated, not committed).
//   npm run clips            (needs Python 3.10+ with: pip install opencv-python-headless numpy)
// Sources are committed: ../ref-repro/public/ref003/hero.mp4 (Blender stand-in pan) and standins/ (renders of our
// attic and globe spikes + true / estimated depth maps). None of these is AI video — see README.
import {spawnSync} from 'node:child_process';
import {mkdtempSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const root = path.resolve(here, '..'), repo = path.resolve(root, '../../..');
const py = ['python3', 'python', 'py'].find(c => spawnSync(c, ['-c', 'import cv2, numpy'], {stdio: 'ignore', env: {...process.env, PYTHONUTF8: '1'}}).status === 0);
if (!py) { console.error('Python with OpenCV not found. Install: pip install opencv-python-headless numpy'); process.exit(1); }
const run = (args, label) => {
  console.log(`\n== ${label}`);
  const r = spawnSync(py, args, {cwd: root, stdio: 'inherit', env: {...process.env, PYTHONUTF8: '1'}});   // second guard for cp949 Windows (O-004)
  if (r.status !== 0) { console.error(`failed: ${label}`); process.exit(r.status || 1); }
};
const brief = n => path.join(repo, 'tools/video-qa/briefs', n);
const s = f => path.join(root, 'standins', f);
const hero = path.join(repo, 'prototype/spikes/ref-repro/public/ref003/hero.mp4');
if (!existsSync(hero)) { console.error(`missing ${hero}`); process.exit(1); }
const only = process.argv[2];
const jobs = {
  pan: () => run(['scripts/import_clip.py', hero, 'pan', '--brief', brief('TEST-stand-in-pan.json'), '--synthetic-depth'], 'pan — Blender stand-in pan (QA PASS expected)'),
  eased: () => {
    const tmp = path.join(mkdtempSync(path.join(tmpdir(), 'vs-')), 'eased.mp4');
    run([path.join(repo, 'tools/video-qa/make_test_clip.py'), hero, tmp, '--only-ease'], 'eased — make uneven-speed test clip');
    run(['scripts/import_clip.py', tmp, 'eased', '--brief', brief('TEST-stand-in-pan.json'), '--synthetic-depth', '--allow-fail'], 'eased — import (QA FAIL on purpose: remap test)');
  },
  attic: () => run(['scripts/import_clip.py', s('attic_c.mp4'), 'attic', '--brief', brief('TEST-attic-descent.json'),
    '--depth-video', s('depth_true.mp4'), '--depth-source', 'true (render)'], 'attic — 240-frame descent + true depth'),
  attic_est: () => run(['scripts/import_clip.py', s('attic_c.mp4'), 'attic_est', '--brief', brief('TEST-attic-descent.json'), '--depth-video', s('depth_est.mp4'),
    '--depth-source', 'estimated (Depth Anything V2 S)'], 'attic_est — same descent + estimated depth'),
  attic_grid: () => run(['scripts/import_clip.py', s('attic48_c.mp4'), 'attic_grid', '--brief', brief('TEST-attic-48-grid.json'), '--variant-l', s('attic48_l.mp4'),
    '--variant-r', s('attic48_r.mp4'), '--variant-offset', 'dx ±0.12', '--allow-fail'], 'attic_grid — old 48-frame clip + l/r variants (QA FAIL on purpose: too few frames; grid demo only)'),
  globe: () => run(['scripts/import_clip.py', s('globe.mp4'), 'globe', '--brief', brief('TEST-globe-loop.json'), '--allow-fail'], 'globe — one turn, loopable (idle=play test; QA FAIL on purpose: 144 frames per turn = 31 px/frame)'),
};
for (const [k, f] of Object.entries(jobs)) if (!only || only === k) f();
console.log('\nclips ready → npm run dev, then open the URLs in README.md');
