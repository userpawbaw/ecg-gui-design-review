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
const BROWSER = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) ECG-Signal-Studio-asset-pipeline/1.0 (non-profit academic exhibit)'};

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
  if (s.type === 'ambientcg') {
    // ambientCG API v2 (all assets CC0). The zip link redirects to their CDN; size from the API is checked.
    const ua = {'User-Agent': 'ECG-Signal-Studio-asset-pipeline/1.0 (non-profit academic exhibit)'};
    const j = await (await fetch(`https://ambientcg.com/api/v2/full_json?id=${s.asset_id}&include=downloadData`, {headers: ua})).json();
    const dl = j.foundAssets?.[0]?.downloadFolders?.default?.downloadFiletypeCategories?.zip?.downloads?.find(x => x.attribute === s.attribute);
    if (!dl) throw Error(`${a.id}: no ${s.attribute} zip for ${s.asset_id} in ambientCG API`);
    const r = await fetch(dl.downloadLink, {headers: ua});
    if (!r.ok) throw Error(`${a.id}: HTTP ${r.status} ${dl.downloadLink}`);
    const buf = Buffer.from(await r.arrayBuffer());
    if (dl.size && buf.length !== dl.size) throw Error(`${a.id}: size ${buf.length} != API ${dl.size}`);
    s.resolved_url = dl.downloadLink;
    return buf;
  }
  if (s.type === 'openverse') {
    // Openverse (CC search index). The API's licence must match the registry licence before download.
    const ua = {'User-Agent': 'ECG-Signal-Studio-asset-pipeline/1.0 (non-profit academic exhibit)'};
    const m = await (await fetch(`https://api.openverse.org/v1/images/${s.openverse_id}/`, {headers: ua})).json();
    const lic = m.license === 'pdm' ? 'public-domain' : `${m.license === 'cc0' ? 'CC0' : 'CC-' + m.license.toUpperCase()}-${m.license_version}`;
    if (lic !== a.licence) throw Error(`${a.id}: Openverse licence ${lic} != registry ${a.licence}`);
    const r = await fetch(m.url, {headers: ua});
    if (!r.ok) throw Error(`${a.id}: HTTP ${r.status} ${m.url}`);
    s.resolved_url = m.url; s.attribution = m.attribution;
    return Buffer.from(await r.arrayBuffer());
  }
  if (s.type === 'page') {
    // Sites without an API (Kenney, OpenGameArt, Three D Scans, Mixkit — D-022): read the item page, take the first
    // link matching `pattern`, download it. The page is the licence record; sha256 pinning catches silent changes.
    const html = await (await fetch(s.page, {headers: BROWSER})).text();
    const m = html.match(new RegExp(s.pattern));
    if (!m) throw Error(`${a.id}: no link matching ${s.pattern} on ${s.page}`);
    const url = new URL(m[0].replace(/&amp;/g, '&'), s.page).href;
    const r = await fetch(url, {headers: BROWSER});
    if (!r.ok) throw Error(`${a.id}: HTTP ${r.status} ${url}`);
    s.resolved_url = url;
    return Buffer.from(await r.arrayBuffer());
  }
  if (s.type === 'gdrive') {
    // Public Google Drive folder (Quaternius packs): walk `path` (folder names, then file name) via the embedded
    // folder view, then download through drive.usercontent. Works without login for publicly shared folders.
    let id = s.folder, file;
    for (const [k, name] of s.path.entries()) {
      const html = await (await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`, {headers: BROWSER})).text();
      const entries = [...html.matchAll(/href="https:\/\/drive\.google\.com\/(drive\/folders|file\/d)\/([A-Za-z0-9_-]+)[^"]*"[\s\S]*?flip-entry-title">([^<]*)/g)].map(m => ({kind: m[1], id: m[2], name: m[3]}));
      const e = entries.find(x => x.name === name);
      if (!e) throw Error(`${a.id}: "${name}" not in Drive folder ${id} (${entries.map(x => x.name).slice(0, 8).join(', ')})`);
      if (k === s.path.length - 1) file = e.id; else id = e.id;
    }
    const url = `https://drive.usercontent.google.com/download?id=${file}&export=download&confirm=t`;
    const r = await fetch(url, {headers: BROWSER});
    if (!r.ok) throw Error(`${a.id}: HTTP ${r.status} Drive file ${file}`);
    s.resolved_url = url;
    return Buffer.from(await r.arrayBuffer());
  }
  if (s.type === 'sketchfab' || s.type === 'pexels') {
    // Account sources (D-022): the token comes from the environment, never from chat or the repo.
    const env = s.type === 'sketchfab' ? 'SKETCHFAB_API_TOKEN' : 'PEXELS_API_KEY', key = process.env[env];
    if (!key) throw Error(`${a.id}: LOGIN REQUIRED — ask the user to add ${env} in the environment settings (see assets/auth-requests.json)`);
    let url;
    if (s.type === 'sketchfab') {
      const m = await (await fetch(`https://api.sketchfab.com/v3/models/${s.uid}`)).json();
      const lic = {cc0: 'CC0-1.0', by: 'CC-BY-4.0', 'by-sa': 'CC-BY-SA-4.0', 'by-nc': 'CC-BY-NC-4.0', 'by-nc-sa': 'CC-BY-NC-SA-4.0'}[m.license?.slug];
      if (lic !== a.licence) throw Error(`${a.id}: Sketchfab licence ${m.license?.slug} != registry ${a.licence}`);
      const d = await (await fetch(`https://api.sketchfab.com/v3/models/${s.uid}/download`, {headers: {Authorization: `Token ${key}`}})).json();
      url = d[s.format || 'glb']?.url;
      if (!url) throw Error(`${a.id}: no ${s.format || 'glb'} download for ${s.uid}`);
      s.attribution = `"${m.name}" by ${m.user?.displayName} (${m.viewerUrl}), ${m.license?.label}`;
    } else {
      const ep = s.media === 'video' ? `https://api.pexels.com/videos/videos/${s.pexels_id}` : `https://api.pexels.com/v1/photos/${s.pexels_id}`;
      const p = await (await fetch(ep, {headers: {Authorization: key}})).json();
      url = s.media === 'video' ? p.video_files?.find(f => f.quality === (s.quality || 'hd'))?.link : p.src?.[s.size || 'original'];
      if (!url) throw Error(`${a.id}: no Pexels file for ${s.pexels_id}`);
      s.attribution = `${s.media === 'video' ? p.user?.name : p.photographer} on Pexels (${p.url})`;
    }
    const r = await fetch(url);
    if (!r.ok) throw Error(`${a.id}: HTTP ${r.status} download`);
    return Buffer.from(await r.arrayBuffer());   // signed URLs expire; resolved_url is not stored
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
