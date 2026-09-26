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
const py = ['python3', 'python', 'py'].find(c => spawnSync(c, ['-c', 'import cv2, numpy'], {stdio: 'ignore'}).status === 0);
if (!py) { console.error('Python with OpenCV not found. Install: pip install opencv-python-headless numpy'); process.exit(1); }
const run = (args, label) => {
  console.log(`\n== ${label}`);
  const r = spawnSync(py, args, {cwd: root, stdio: 'inherit'});
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
  attic: () => run(['scripts/import_clip.py', s('attic_c.mp4'), 'attic', '--brief', brief('TEST-attic-descent.json'), '--variant-l', s('attic_l.mp4'), '--variant-r', s('attic_r.mp4'),
    '--variant-offset', 'dx ±0.12', '--depth-dir', s('depth_true'), '--depth-source', 'true (render)'], 'attic — descent + head-offset variants + true depth'),
  attic_est: () => run(['scripts/import_clip.py', s('attic_c.mp4'), 'attic_est', '--brief', brief('TEST-attic-descent.json'), '--depth-dir', s('depth_est'),
    '--depth-source', 'estimated (Depth Anything V2 S)'], 'attic_est — same descent + estimated depth'),
  globe: () => run(['scripts/import_clip.py', s('globe.mp4'), 'globe', '--brief', brief('TEST-globe-loop.json')], 'globe — one turn, loopable (idle=play test)'),
};
for (const [k, f] of Object.entries(jobs)) if (!only || only === k) f();
console.log('\nclips ready → npm run dev, then open the URLs in README.md');
