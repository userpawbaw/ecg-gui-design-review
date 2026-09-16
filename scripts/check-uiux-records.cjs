#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UIUX = path.join(ROOT, 'docs', 'uiux_system');
const RECORD_DIR = path.join(UIUX, 'records');
const CASE_DIR = path.join(UIUX, 'cases');

const evidenceTags = [
  '[캡처]', '[영상]', '[런타임]', '[테스트]', '[코드]', '[커밋]',
  '[대화]', '[사용자평가]', '[플러그인]', '[문헌]', '[추론]', '[재구성]'
];

const specs = {
  F: {
    file: 'F_FINDINGS.md',
    required: [
      ['### 발단'],
      ['### 먼저 의심한 것과 배제 방법'],
      ['### 결정적 근거'],
      ['### 놓쳤다면']
    ]
  },
  D: {
    file: 'D_DECISIONS.md',
    required: [
      ['### 갈림길'],
      ['### 검토한 선택지'],
      ['### 고른 것과 근거'],
      ['### 버린 것과 이유'],
      ['### 되돌려야 하는 조건']
    ]
  },
  O: {
    file: 'O_INCIDENTS.md',
    required: [
      ['### 증상'],
      ['### 원인'],
      ['### 조치'],
      ['### 재발 방지와 자동화 상태']
    ]
  },
  R: {
    file: 'R_AI_COLLABORATION.md',
    required: [
      ['### AI/도구가 내놓은 것'],
      ['### 사람이 문제 삼은 것'],
      ['### 검증 방법과 결과'],
      ['### 재사용 규칙']
    ]
  }
};

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function blocks(text, prefix) {
  const re = new RegExp(`^## (${prefix}-\\d+)\\.\\s+(.+)$`, 'gm');
  const found = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    found.push({ id: m[1], title: m[2], start: m.index, bodyStart: re.lastIndex });
  }
  return found.map((item, i) => {
    const end = i + 1 < found.length ? found[i + 1].start : text.length;
    return { ...item, body: text.slice(item.bodyStart, end) };
  });
}

function fail(errors, message) {
  errors.push(message);
}

function checkRecords(errors) {
  const allIds = new Map();
  const validIds = new Set();

  for (const [prefix, spec] of Object.entries(specs)) {
    const rel = path.join('docs', 'uiux_system', 'records', spec.file);
    const text = read(rel);
    const items = blocks(text, prefix);
    if (!items.length) fail(errors, `${spec.file}: ${prefix} 항목이 없다`);

    for (const item of items) {
      if (allIds.has(item.id)) fail(errors, `중복 ID ${item.id}: ${allIds.get(item.id)} / ${spec.file}`);
      allIds.set(item.id, spec.file);
      validIds.add(item.id);

      for (const alternatives of spec.required) {
        if (!alternatives.some(h => item.body.includes(h))) {
          fail(errors, `${item.id}: 필수 절 누락 (${alternatives.join(' 또는 ')})`);
        }
      }

      const hasEvidence = evidenceTags.some(tag => item.body.includes(tag));
      if (!hasEvidence && !item.body.includes('기록 없음')) {
        fail(errors, `${item.id}: 근거 태그도 '기록 없음'도 없다`);
      }

      if (prefix === 'R' && !item.body.includes('### 재사용 규칙')) {
        fail(errors, `${item.id}: R은 재사용 규칙으로 끝나야 한다`);
      }
      if (prefix === 'D' && !item.body.includes('### 되돌려야 하는 조건')) {
        fail(errors, `${item.id}: D는 되돌려야 하는 조건이 필요하다`);
      }
    }
  }

  return validIds;
}

function checkCases(errors, validIds) {
  if (!fs.existsSync(CASE_DIR)) return;
  const files = fs.readdirSync(CASE_DIR).filter(n => /^CASE-\d+_.*\.md$/.test(n));
  const mainCases = files.filter(n => !/SUMMARY_EN/i.test(n) && !/TRANSCRIPT/i.test(n));

  for (const name of mainCases) {
    const text = fs.readFileSync(path.join(CASE_DIR, name), 'utf8');
    const requiredPatterns = [
      /^## 배경/m,
      /^## 논의 흐름/m,
      /^## 구축된 시스템/m,
      /^## 재사용 가능한 AI 사용 패턴/m,
      /^## 한계/m
    ];
    for (const re of requiredPatterns) {
      if (!re.test(text)) fail(errors, `${name}: 필수 CASE 절 누락 (${re})`);
    }

    const refs = [...text.matchAll(/\b([FDOR]-\d+)\b/g)].map(m => m[1]);
    if (!refs.length) {
      fail(errors, `${name}: F/D/O/R 연결이 하나도 없다`);
      continue;
    }
    for (const id of new Set(refs)) {
      if (!validIds.has(id)) fail(errors, `${name}: 존재하지 않는 기록 ${id}를 가리킨다`);
    }
  }
}

function checkSkillProvenance(errors) {
  const skillRoot = path.join(ROOT, '.claude', 'skills');
  if (!fs.existsSync(skillRoot)) return;
  const provenance = read(path.join('docs', 'uiux_system', '07_EXTERNAL_SKILLS_PROVENANCE.md'));
  for (const dir of fs.readdirSync(skillRoot, { withFileTypes: true }).filter(d => d.isDirectory())) {
    const skillPath = path.join(skillRoot, dir.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    const text = fs.readFileSync(skillPath, 'utf8');
    const m = text.match(/^name:\s*(.+)$/m);
    const name = (m ? m[1] : dir.name).trim();
    if (!provenance.includes(name) && !provenance.includes(`.claude/skills/${dir.name}`)) {
      fail(errors, `project-local skill '${name}'가 07_EXTERNAL_SKILLS_PROVENANCE.md에 없다`);
    }
  }
}

function checkEntrypoints(errors) {
  const master = read(path.join('docs', 'uiux_system', '00_UIUX_MASTER.md'));
  const index = read(path.join('docs', 'uiux_system', 'README.md'));
  const agents = read('AGENTS.md');
  const pkg = JSON.parse(read('package.json'));

  for (const target of ['10_RECORD_KEEPING.md', '11_CHECKLISTS.md']) {
    if (!master.includes(target)) fail(errors, `00_UIUX_MASTER.md가 ${target}를 가리키지 않는다`);
    if (!index.includes(target)) fail(errors, `docs/uiux_system/README.md가 ${target}를 가리키지 않는다`);
  }
  if (!master.includes('records/') || !index.includes('records/')) {
    fail(errors, 'MASTER/Index 중 하나가 records/ 계층을 설명하지 않는다');
  }
  if (!agents.includes('10_RECORD_KEEPING.md')) {
    fail(errors, 'AGENTS.md가 UI/UX 기록 규약 진입점을 가리키지 않는다');
  }
  if (!pkg.scripts || !String(pkg.scripts['records:check'] || '').includes('check-uiux-records.cjs')) {
    fail(errors, 'package.json에 records:check script가 없다');
  }
}

function main() {
  const errors = [];
  const validIds = checkRecords(errors);
  checkCases(errors, validIds);
  checkSkillProvenance(errors);
  checkEntrypoints(errors);

  if (errors.length) {
    console.error(`\n[uiux-records] FAIL — ${errors.length} issue(s)`);
    for (const e of errors) console.error(` - ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log(`[uiux-records] PASS — ${validIds.size} F/D/O/R records + CASE/provenance/entrypoint checks`);
}

main();
