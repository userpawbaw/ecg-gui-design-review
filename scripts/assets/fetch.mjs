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
    const r = await fetch(s.url);
    if (!r.ok) throw Error(`${a.id}: HTTP ${r.status} ${s.url}`);
    return Buffer.from(await r.arrayBuffer());
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

for (const a of reg.assets) {
  if (!reg.policy.licence_allowlist.includes(a.licence)) throw Error(`${a.id}: licence ${a.licence} not allowed`);
  const buf = await acquire(a);
  checkOrPin(a, 'original', buf);
  const src = path.join(root, a.original.file), out = path.join(root, a.processed.file);
  await mkdir(path.dirname(src), {recursive: true}); await mkdir(path.dirname(out), {recursive: true});
  await writeFile(src, buf);
  if (a.kind === 'model') {
    execFileSync('npx', ['--yes', '@gltf-transform/cli@4', 'optimize', src, out,
      '--compress', 'meshopt', '--texture-compress', 'webp', '--texture-size', '1024'], {stdio: 'inherit'});
  } else {
    await copyFile(src, out);
  }
  checkOrPin(a, 'processed', await readFile(out));
  console.log(`${a.id}: ${a.original.bytes} → ${a.processed.bytes} bytes`);
}
if (pin) await writeFile(regPath, JSON.stringify(reg, null, 2) + '\n');
