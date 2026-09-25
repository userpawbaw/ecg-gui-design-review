// Download every registry asset into assets/source/, verify or pin its sha256,
// then build assets/processed/. Usage: node scripts/assets/fetch.mjs [--pin]
//   --pin  write missing sha256/bytes into registry.json (first acquisition only).
import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const regPath = path.join(root, 'assets/registry.json');
const reg = JSON.parse(await readFile(regPath, 'utf8'));
const pin = process.argv.includes('--pin');
const sha = b => createHash('sha256').update(b).digest('hex');

async function acquire(a) {
  const s = a.source;
  if (s.type === 'url') {
    const r = await fetch(s.url, {headers: {'User-Agent': 'ECG-Signal-Studio-asset-pipeline/1.0 (non-profit academic exhibit)'}});
    if (!r.ok) throw Error(`${a.id}: HTTP ${r.status} ${s.url}`);
    return Buffer.from(await r.arrayBuffer());
  }
  if (s.type === 'polyhaven') {
    // Poly Haven API terms: identify the tool via User-Agent. md5 from the API is checked.
    const ua = {'User-Agent': 'ECG-Signal-Studio-asset-pipeline/1.0 (non-profit academic exhibit)'};
    const files = await (await fetch(`https://api.polyhaven.com/files/${s.slug}`, {headers: ua})).json();
    const f = files[s.asset_type]?.[s.resolution]?.[s.format];
    if (!f) throw Error(`${a.id}: no ${s.asset_type}/${s.resolution}/${s.format} in Poly Haven files`);
    if (s.format === 'gltf') {
      // glTF + textures: every file md5-checked, stored beside the .gltf under assets/source/<id>/
      const dir = path.join(root, path.dirname(a.original.file));
      for (const [rel, inc] of Object.entries(f.include || {})) {
        const rr = await fetch(inc.url, {headers: ua});
        if (!rr.ok) throw Error(`${a.id}: HTTP ${rr.status} ${inc.url}`);
        const b = Buffer.from(await rr.arrayBuffer());
        if (inc.md5 && createHash('md5').update(b).digest('hex') !== inc.md5) throw Error(`${a.id}: md5 mismatch ${rel}`);
        await mkdir(path.dirname(path.join(dir, rel)), {recursive: true});
        await writeFile(path.join(dir, rel), b);
      }
    }
    const r = await fetch(f.url, {headers: ua});
    if (!r.ok) throw Error(`${a.id}: HTTP ${r.status} ${f.url}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const md5 = createHash('md5').update(buf).digest('hex');
    if (f.md5 && md5 !== f.md5) throw Error(`${a.id}: md5 mismatch with Poly Haven API`);
    s.resolved_url = f.url;
    return buf;
  }
  if (s.type === 'npm') {
    const dir = path.join(root, 'assets/.npm-cache');
    await mkdir(dir, {recursive: true});
    const tgz = execFileSync('npm', ['pack', `${s.package}@${s.version}`, '--silent', '--pack-destination', dir], {encoding: 'utf8'}).trim().split('\n').pop();
    execFileSync('tar', ['xzf', path.join(dir, tgz), '-C', dir]);
    const mod = await readFile(path.join(dir, 'package', s.path), 'utf8');
    const m = mod.match(/data:[^;]+;base64,([A-Za-z0-9+/=]+)/);
    if (!m) throw Error(`${a.id}: no base64 payload in ${s.path}`);
    return Buffer.from(m[1], 'base64');
  }
  throw Error(`${a.id}: unknown source type ${s.type}`);
}

function checkOrPin(a, slot, buf) {
  const rec = a[slot], digest = sha(buf);
  if (rec.sha256 && rec.sha256 !== digest) throw Error(`${a.id}: ${slot} sha256 mismatch (${digest})`);
  if (!rec.sha256) {
    if (!pin) throw Error(`${a.id}: ${slot} sha256 not pinned; rerun with --pin after review`);
    rec.sha256 = digest; rec.bytes = buf.length;
  }
}

const only = (process.argv.find(x => x.startsWith('--only=')) || '').slice(7);
for (const a of reg.assets.filter(a => (a.status !== 'superseded' || process.argv.includes('--all')) && a.id.startsWith(only))) {
  if (!reg.policy.licence_allowlist.includes(a.licence)) throw Error(`${a.id}: licence ${a.licence} not allowed`);
  const buf = await acquire(a);
  checkOrPin(a, 'original', buf);
  const src = path.join(root, a.original.file);
  await mkdir(path.dirname(src), {recursive: true});
  await writeFile(src, buf);
  if (!a.processed) { console.log(`${a.id}: source only (${buf.length} bytes) — consumed by a build script`); continue; }
  const out = path.join(root, a.processed.file);
  await mkdir(path.dirname(out), {recursive: true});
  if (a.kind === 'model') {
    execFileSync('npx', ['--yes', '@gltf-transform/cli@4', 'optimize', src, out,
      '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024'], {stdio: 'inherit'});
  } else {
    await copyFile(src, out);
  }
  checkOrPin(a, 'processed', await readFile(out));
  for (const v of a.variants || []) {
    // Higher-quality variant: resize only, then WebP at quality 90 (default optimize WebP showed blocky reflections).
    const vout = path.join(root, v.processed.file), tmp = vout + '.tmp.glb';
    execFileSync('npx', ['--yes', '@gltf-transform/cli@4', 'optimize', src, tmp,
      '--compress', 'meshopt', '--texture-compress', 'false', '--texture-size', '1024'], {stdio: 'inherit'});
    execFileSync('npx', ['--yes', '@gltf-transform/cli@4', 'webp', tmp, vout, '--quality', '90'], {stdio: 'inherit'});
    await (await import('node:fs/promises')).rm(tmp);
    checkOrPin(v, 'processed', await readFile(vout));
    console.log(`${v.id}: ${a.original.bytes} → ${v.processed.bytes} bytes`);
  }
  console.log(`${a.id}: ${a.original.bytes} → ${a.processed.bytes} bytes`);
}
if (pin) await writeFile(regPath, JSON.stringify(reg, null, 2) + '\n');
