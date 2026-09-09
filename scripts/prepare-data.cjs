/* Extract stored outputs, never execute source JavaScript or invent inference. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const source = path.resolve(process.argv[2] || '../review-source');
const dest = path.resolve(__dirname, '../data');
const raw = fs.readFileSync(path.join(source, 'demo/demo_bank.js'));
const expected = '4a94d1b79db95b8cb8afa5e8f944955d756c5db6';
const blob = crypto.createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex');
if (blob !== expected) throw Error('Pinned source bank bytes do not match');
const text = raw.toString('utf8');
const bank = JSON.parse(text.slice(text.indexOf('=') + 1, text.lastIndexOf(';')));
const methods = ['M_FE', 'M01', 'M04', 'M05', 'M06', 'M08', 'M09'];
const conditions = ['mixed', 'pli', 'ma_synth', 'em_synth'];
const selected = bank.scenes.filter(s => conditions.includes(s.cond) && s.snr <= 20);
const subset = {
  schema: 1, fs: bank.fs, n: bank.n, guard_s: bank.guard_s, seg_s: bank.seg_s,
  methods, conditions, snrs: [-5, 0, 5, 10, 15, 20],
  provenance: {
    repository: 'userpawbaw/ECG_denoising_method_comparision',
    sourceCommit: '5eb27946087faca3c6e70b3925e2ba132b2ee680',
    sourcePath: 'demo/demo_bank.js', sourceBlob: blob,
    status: 'archived', builderHashMatches: true, datasetHashMatches: false,
    metadataUnavailable: ['exact noise seed', 'lead in export', 'beat/rhythm annotations', 'checkpoint hashes', 'absolute record start timestamp'],
    reference: 'D1: band-limited FE(x_raw); D0: synthetic reference from source bank',
    traceEncoding: 'signed int16 little-endian base64; mV = integer * scene.scale',
    time: 'central 10 s of a processed 20 s segment; relative to stored-array start',
    sourceLicense: 'See original repository and PhysioNet dataset terms; no new license over source data is asserted.'
  },
  scenes: selected.map(s => ({
    id: s.id, axis: s.axis, cond: s.cond, snr: s.snr, record: s.record, seg: s.seg,
    scale: s.scale, selection: s.selection, ref_exp: s.ref_exp,
    storedMetrics: Object.fromEntries(methods.map(m => [m, s.metrics[m]])),
    ref_mean: Object.fromEntries(methods.map(m => [m, s.ref_mean?.[m] ?? null])),
    traces: Object.fromEntries(['clean','input',...methods].map(m => [m,s.traces[m]]))
  }))
};
for (const s of subset.scenes) {
  for (const [m,t] of Object.entries(s.traces)) {
    if (typeof t !== 'string' || Buffer.from(t,'base64').length !== 2*bank.n) throw Error(`Bad trace ${s.id}/${m}`);
  }
}
const csv = fs.readFileSync(path.join(source, 'results/d1/report/table_main.csv'), 'utf8').trim().split(/\r?\n/);
const keys = csv.shift().split(',');
subset.evidence = {
  sourcePath: 'results/d1/report/table_main.csv', experiment: 'EXP-A', axis: 'D1',
  scope: 'record-level mean across mixed-noise SNR grid -5..20 dB; TEST n=22; primary L1 training',
  rows: csv.map(line => Object.fromEntries(line.split(',').map((v,i) => [keys[i], v === '' ? null : (i>=4 ? Number(v) : v)])))
};
fs.mkdirSync(dest, {recursive:true});
fs.writeFileSync(path.join(dest,'bank.js'), 'window.ECG_BANK = '+JSON.stringify(subset)+';\n');
fs.writeFileSync(path.join(dest,'provenance.json'),JSON.stringify({...subset.provenance,scenes:subset.scenes.length,methods,conditions,fs:bank.fs,n:bank.n},null,2)+'\n');
console.log(JSON.stringify({scenes:subset.scenes.length,traceCount:subset.scenes.length*(methods.length+2),sourceBlob:blob,bytes:fs.statSync(path.join(dest,'bank.js')).size}));
