// Asset-research stage (D-022): search every catalogued source for a query and record candidates.
// Usage: node scripts/assets/explore.mjs "<query>" --kind=model|material|hdri|photo|video|sprite|texture [--limit=6]
// Writes assets/research/<date>-<kind>-<query>.json and updates assets/auth-requests.json when an auth
// source has candidates (or cannot be searched) and its token is missing. Candidates are not downloads:
// pick one, add a registry entry, then run fetch.mjs (licence allowlist + sha256 pin apply as usual).
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const cat = JSON.parse(await readFile(path.join(root, 'assets/sources.json'), 'utf8'));
const args = process.argv.slice(2);
const query = args.find(a => !a.startsWith('--'));
const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const kind = opt('kind'), limit = +(opt('limit') || 6);
if (!query || !kind) { console.error('usage: explore.mjs "<query>" --kind=<kind> [--limit=N]'); process.exit(2); }

const UA = {'User-Agent': 'ECG-Signal-Studio-asset-pipeline/1.0 (non-profit academic exhibit)'};
const BROWSER = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) ECG-Signal-Studio-asset-research'};
const q = encodeURIComponent(query), words = query.toLowerCase().split(/\s+/);
const get = async (url, h = UA) => { const r = await fetch(url, {headers: h}); if (!r.ok) throw Error(`HTTP ${r.status} ${url}`); return r; };
const uniq = xs => [...new Set(xs)];
const phType = {model: 'models', material: 'textures', hdri: 'hdris'};
const acgType = {material: 'Material', hdri: 'HDRI', model: '3DModel'};

const search = {
  async polyhaven() {
    const all = await (await get(`https://api.polyhaven.com/assets?t=${phType[kind]}`)).json();
    return Object.entries(all).filter(([slug, a]) => words.every(w => [slug, a.name, ...(a.tags || []), ...(a.categories || [])].join(' ').toLowerCase().includes(w)))
      .slice(0, limit).map(([slug, a]) => ({title: a.name, page: `https://polyhaven.com/a/${slug}`, licence: 'CC0-1.0', fetch: {type: 'polyhaven', slug}}));
  },
  async ambientcg() {
    // the API ignores `type` (2026-09-26: type=3DModel still returned materials) → filter on dataType locally
    const j = await (await get(`https://ambientcg.com/api/v2/full_json?q=${q}&limit=100&sort=Popular`)).json();
    return (j.foundAssets || []).filter(a => a.dataType === acgType[kind]).slice(0, limit).map(a => ({title: a.displayName, page: `https://ambientcg.com/view?id=${a.assetId}`, licence: 'CC0-1.0', fetch: {type: 'ambientcg', asset_id: a.assetId, attribute: '1K-JPG'}}));
  },
  async openverse() {
    const j = await (await get(`https://api.openverse.org/v1/images/?q=${q}&license=cc0,pdm,by,by-sa,by-nc,by-nc-sa&page_size=${limit}`)).json();
    return j.results.map(r => ({title: r.title, page: r.foreign_landing_url, licence: `${r.license} ${r.license_version || ''}`.trim(), size: r.width && `${r.width}×${r.height}`, attribution: r.attribution, fetch: {type: 'openverse', openverse_id: r.id}}));
  },
  async kenney() {
    const html = await (await get(`https://kenney.nl/assets?search=${q}`, BROWSER)).text();
    const slugs = uniq([...html.matchAll(/kenney\.nl\/assets\/([a-z0-9-]+)/g)].map(m => m[1])).filter(s => s !== 'category' && !s.startsWith('tag') && !s.startsWith('series'));
    const hit = slugs.filter(s => words.some(w => s.includes(w))), pick = (hit.length ? hit : slugs).slice(0, limit);
    return pick.map(s => ({title: s, page: `https://kenney.nl/assets/${s}`, licence: 'CC0-1.0', note: hit.length ? 'name match' : 'site search result (no name match — check relevance)'}));
  },
  async quaternius() {
    const html = await (await get('https://quaternius.com/', BROWSER)).text();
    const packs = uniq([...html.matchAll(/packs\/([a-z0-9]+)\.html/g)].map(m => m[1]));
    return packs.filter(p => words.some(w => p.includes(w))).slice(0, limit).map(p => ({title: p, page: `https://quaternius.com/packs/${p}.html`, licence: 'CC0-1.0', note: 'download is a Google Drive/itch link — manual'}));
  },
  async threedscans() {
    const html = await (await get(`https://threedscans.com/?s=${q}`, BROWSER)).text();
    return uniq([...html.matchAll(/href="(https:\/\/threedscans\.com\/[a-z0-9-]+\/[a-z0-9-]+\/)"/g)].map(m => m[1])).filter(u => !/\/(comments|feed|category|tag)\//.test(u))
      .slice(0, limit).map(u => ({title: u.split('/').slice(-2, -1)[0], page: u, licence: 'no copyright restrictions (verify page)'}));
  },
  async opengameart() {
    const html = await (await get(`https://opengameart.org/art-search-advanced?keys=${q}`, BROWSER)).text();
    return uniq([...html.matchAll(/href="\/content\/([a-z0-9-]+)"/g)].map(m => m[1])).filter(s => s !== 'faq').slice(0, limit)
      .map(s => ({title: s, page: `https://opengameart.org/content/${s}`, licence: 'per item — check page'}));
  },
  async mixkit() {
    const html = await (await get(`https://mixkit.co/free-stock-video/${encodeURIComponent(query.replace(/\s+/g, '-'))}/`, BROWSER)).text();
    return uniq([...html.matchAll(/https:\/\/assets\.mixkit\.co\/videos\/(\d+)\/\1-360\.mp4/g)].map(m => m[1])).slice(0, limit)
      .map(id => ({title: `mixkit video ${id}`, page: `https://mixkit.co/free-stock-video/${id}/`, preview: `https://assets.mixkit.co/videos/${id}/${id}-360.mp4`, licence: 'Mixkit License — check item'}));
  },
  async sketchfab() {
    const j = await (await get(`https://api.sketchfab.com/v3/search?type=models&downloadable=true&count=${limit}&q=${q}`)).json();
    return j.results.map(m => ({title: m.name, page: m.viewerUrl, licence: m.license?.label || 'unknown', faces: m.faceCount, fetch: {type: 'sketchfab', uid: m.uid}}));
  },
  async pexels(key) {
    const url = kind === 'video' ? `https://api.pexels.com/videos/search?query=${q}&per_page=${limit}` : `https://api.pexels.com/v1/search?query=${q}&per_page=${limit}`;
    const j = await (await get(url, {...UA, Authorization: key})).json();
    return (j.photos || j.videos || []).map(p => ({title: p.alt || p.url, page: p.url, licence: 'Pexels License', size: `${p.width}×${p.height}`, fetch: {type: 'pexels', pexels_id: p.id, media: kind === 'video' ? 'video' : 'photo'}}));
  },
};

const out = {query, kind, date: new Date().toISOString().slice(0, 10), sources: {}};
const authPath = path.join(root, 'assets/auth-requests.json');
let auth = {note: 'Written by explore.mjs. Each open request means: the user creates an account and adds the env var in the cloud environment settings. Never paste tokens into chat.', requests: []};
try { auth = JSON.parse(await readFile(authPath, 'utf8')); } catch {}

for (const s of cat.sources.filter(s => s.kinds.includes(kind) && search[s.id])) {
  const key = s.auth_env && process.env[s.auth_env];
  try {
    if (s.id === 'pexels' && !key) {
      out.sources[s.id] = {status: 'auth-required', reason: 'search needs the API key'};
    } else {
      const c = await search[s.id](key);
      out.sources[s.id] = {status: c.length ? 'ok' : 'no-match', access: s.access, candidates: c};
      if (s.access === 'auth' && !key && c.length) out.sources[s.id].status = 'candidates-need-login';
    }
  } catch (e) { out.sources[s.id] = {status: 'error', error: String(e.message || e)}; }
  const st = out.sources[s.id].status;
  if (st === 'auth-required' || st === 'candidates-need-login') {
    const req = {source: s.id, env: s.auth_env, query, kind, date: out.date, status: 'open',
      why: st === 'auth-required' ? `${s.name}: cannot search without a key` : `${s.name}: ${out.sources[s.id].candidates.length} downloadable candidates found; download needs a token`,
      how: s.auth_note, candidates: (out.sources[s.id].candidates || []).map(c => `${c.title} — ${c.licence} — ${c.page}`)};
    auth.requests = auth.requests.filter(r => !(r.source === s.id && r.query === query && r.kind === kind));
    auth.requests.push(req);
  }
}
const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const file = path.join(root, 'assets/research', `${out.date}-${kind}-${slug}.json`);
await mkdir(path.dirname(file), {recursive: true});
await writeFile(file, JSON.stringify(out, null, 2) + '\n');
await writeFile(authPath, JSON.stringify(auth, null, 2) + '\n');

for (const [id, r] of Object.entries(out.sources)) console.log(`${id.padEnd(12)} ${r.status.padEnd(22)} ${r.candidates ? r.candidates.length : ''} ${r.error || r.reason || ''}`);
const open = auth.requests.filter(r => r.status === 'open' && !process.env[r.env]);
if (open.length) {
  console.log('\n=== LOGIN REQUEST (ask the user; never ask for the token in chat) ===');
  for (const r of uniq(open.map(r => r.source))) {
    const rs = open.filter(x => x.source === r);
    console.log(`- ${r}: add ${rs[0].env} in the environment settings. ${rs[0].how || ''}`);
    for (const x of rs) console.log(`    ${x.kind} "${x.query}": ${x.why}`);
  }
}
console.log(`\nwrote ${path.relative(root, file)}`);
