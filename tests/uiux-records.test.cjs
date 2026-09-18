'use strict';

const { execFileSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const checker = path.join(root, 'scripts', 'check-uiux-records.cjs');
execFileSync(process.execPath, [checker], { cwd: root, stdio: 'inherit' });

// Mutate isolated fixtures, never the user's working tree.
let count = 0;
function fixture(label, mutate, expected = 1, diagnostic = '') {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uiux-records-'));
  try {
    for (const name of ['docs/uiux_system', '.claude/skills', 'AGENTS.md', 'package.json']) {
      const dest = path.join(tmp, name);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.cpSync(path.join(root, name), dest, { recursive: true });
    }
    const edit = (name, fn) => {
      const file = path.join(tmp, name);
      fs.writeFileSync(file, fn(fs.readFileSync(file, 'utf8')));
    };
    mutate(edit, tmp);
    const result = spawnSync(process.execPath, [checker], {
      env: { ...process.env, UIUX_RECORDS_ROOT: tmp }, encoding: 'utf8'
    });
    assert.equal(result.status, expected, `${label}: ${result.stdout}${result.stderr}`);
    if (diagnostic) assert.ok(result.stderr.includes(diagnostic), `${label}: ${result.stderr}`);
    count++;
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
const d = 'docs/uiux_system/records/D_DECISIONS.md';
const rr = 'docs/uiux_system/records/R_AI_COLLABORATION.md';
const row = '| CASE | CASE-001 |';
for (const file of [d, rr]) {
  fixture('missing CASE field', edit => edit(file, s => s.replace(row, '')), 1, 'CASE 필드');
  fixture('missing main CASE', edit => edit(file, s => s.replace(row, '| CASE | CASE-999 |')), 1, '존재하지 않는 main CASE');
}
fixture('duplicate field', edit => edit(d, s => s.replace(row, row + '\n' + row)), 1, 'CASE 필드');
for (const value of ['', '불필요 — ', '불필요 — TODO', '불필요 — 구체적 사유', '보류 — 단일 사건이라 후속 논의를 기다림', '보류 — 단일 사건이라 후속 논의를 기다림; 재검토: TODO']) {
  fixture('invalid disposition ' + value, edit => edit(d, s => s.replace(row, `| CASE | ${value} |`)), 1, 'CASE');
}
fixture('valid unnecessary reason', edit => edit(d, s => s.replace(row, '| CASE | 불필요 — 기존 설계 안의 단일 간격 조정이며 방법론 변경이 없음 |')), 0);
fixture('valid deferred condition', edit => edit(rr, s => s.replace(row, '| CASE | 보류 — 단일 사건으로 후속 근거가 아직 없음; 재검토: 같은 문제의 다음 관측 시 |')), 0);
fixture('multiple references', edit => edit(d, s => s.replace(row, '| CASE | CASE-001, CASE-004 |')), 0);
fixture('duplicate main case number', (_, tmp) => fs.copyFileSync(
  path.join(tmp, 'docs/uiux_system/cases/CASE-004_DUAL_CREATIVE_DIRECTOR_EVOLUTION.md'),
  path.join(tmp, 'docs/uiux_system/cases/CASE-004_DUPLICATE.md')), 1, '중복 main CASE');
fixture('transcript is not a main case', (_, tmp) => fs.renameSync(
  path.join(tmp, 'docs/uiux_system/cases/CASE-004_DUAL_CREATIVE_DIRECTOR_EVOLUTION.md'),
  path.join(tmp, 'docs/uiux_system/cases/CASE-004_SUMMARY_EN.md')), 1, '존재하지 않는 main CASE');
for (const [prefix, file] of Object.entries({F: 'F_FINDINGS.md', D: 'D_DECISIONS.md', O: 'O_INCIDENTS.md', R: 'R_AI_COLLABORATION.md'})) {
  fixture('duplicate record ID ' + prefix, edit => edit('docs/uiux_system/records/' + file, s => {
    const block = s.match(new RegExp('^## ' + prefix + '-\\d+\\.[\\s\\S]*?(?=^## ' + prefix + '-|$(?![\\s\\S]))', 'm'));
    assert.ok(block);
    return s + '\n' + block[0];
  }), 1, '중복 ID');
}
for (const [prefix, file] of [['D', d], ['R', rr]]) {
  fixture('new record without CASE ' + prefix, edit => edit(file, s => {
    const start = s.indexOf('## ' + prefix + '-001.');
    const end = s.indexOf('\n## ' + prefix + '-', start + 1);
    const block = s.slice(start, end).replace(prefix + '-001.', prefix + '-999.').replace(row, '');
    return s + '\n' + block;
  }), 1, prefix + '-999: CASE 필드');
}
for (const value of ['불필요 — **TODO**', '불필요 — [추후 작성]', '불필요 — 사유 입력', '보류 — 이유 작성 예정; 재검토: **TBD**']) {
  fixture('formatted placeholder ' + value, edit => edit(d, s => s.replace(row, `| CASE | ${value} |`)), 1, 'CASE');
}
console.log(`[uiux-records tests] PASS — ${count} isolated regression fixtures`);
