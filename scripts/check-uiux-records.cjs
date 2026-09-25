#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.env.UIUX_RECORDS_ROOT || path.join(__dirname, '..'));
const UIUX = path.join(ROOT, 'docs', 'uiux_system');
const RECORD_DIR = path.join(UIUX, 'records');
const CASE_DIR = path.join(UIUX, 'cases');
const REF_DIR = path.join(UIUX, 'references');

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

function mainCaseFiles() {
  if (!fs.existsSync(CASE_DIR)) return [];
  return fs.readdirSync(CASE_DIR).filter(n => /^CASE-\d+_.*\.md$/.test(n) && !/SUMMARY_EN|TRANSCRIPT/i.test(n));
}

function checkCaseLink(errors, item) {
  const rows = [...item.body.matchAll(/^\|\s*CASE\s*\|([^\n]*)\|\s*$/gm)];
  if (rows.length !== 1) {
    fail(errors, `${item.id}: CASE 필드는 정확히 하나 필요하다`);
    return;
  }
  const value = rows[0][1].trim();
  if (/^CASE-\d+(?:\s*,\s*CASE-\d+)*$/.test(value)) {
    const known = new Set(mainCaseFiles().map(n => `CASE-${caseNumber(n)}`));
    for (const id of value.split(',').map(s => s.trim())) {
      if (!known.has(id)) fail(errors, `${item.id}: 존재하지 않는 main CASE ${id}`);
    }
    return;
  }
  const reason = value.match(/^(불필요|보류) — (.+)$/);
  const meaningful = s => {
    // Formatting must not turn an empty template into a substantive reason.
    const plain = s.replace(/[*_`\[\]<>]/g, '').trim();
    return plain.length >= 5 && !/^(?:TODO|TBD|N\/A|미정|없음|기록 없음|추후(?: 작성)?|나중에|구체적(?:인)? (?:사유|이유)|(?:사유|이유|조건)(?: 입력| 작성(?: 예정)?)?)[.!…\s]*$/i.test(plain);
  };
  if (!reason) {
    fail(errors, `${item.id}: CASE 연결 또는 구체적인 불필요/보류 사유가 필요하다`);
  } else if (reason[1] === '보류') {
    const parts = reason[2].split('; 재검토:');
    if (parts.length !== 2 || !parts.every(meaningful)) fail(errors, `${item.id}: CASE 보류 사유와 재검토 조건이 필요하다`);
  } else if (!meaningful(reason[2])) {
    fail(errors, `${item.id}: CASE 불필요 사유가 비어 있거나 placeholder다`);
  }
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

      if (prefix === 'D' || prefix === 'R') checkCaseLink(errors, item);

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

function caseNumber(name) {
  const m = name.match(/^CASE-(\d+)_/);
  return m ? m[1] : null;
}

function hasDialogueEvidence(text) {
  return text.includes('[대화]') || text.includes('[재구성]') || text.includes('기록 없음');
}

function quoteCount(text) {
  return (text.match(/^>\s+.+$/gm) || []).length;
}

function checkCases(errors, validIds) {
  if (!fs.existsSync(CASE_DIR)) return;
  const files = fs.readdirSync(CASE_DIR).filter(n => /^CASE-\d+_.*\.md$/.test(n));
  const mainCases = files.filter(n => !/SUMMARY_EN/i.test(n) && !/TRANSCRIPT/i.test(n));
  const transcriptFiles = files.filter(n => /TRANSCRIPT/i.test(n));
  const seenCases = new Set();
  for (const name of mainCases) {
    const number = caseNumber(name);
    if (seenCases.has(number)) fail(errors, `중복 main CASE 번호 CASE-${number}`);
    seenCases.add(number);
  }

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
    } else {
      for (const id of new Set(refs)) {
        if (!validIds.has(id)) fail(errors, `${name}: 존재하지 않는 기록 ${id}를 가리킨다`);
      }
    }

    if (!hasDialogueEvidence(text)) {
      fail(errors, `${name}: [대화]/[재구성]/'기록 없음' 중 하나로 대화 provenance를 명시해야 한다`);
    }

    const n = caseNumber(name);
    const hasTranscriptAppendix = n && transcriptFiles.some(f => f.startsWith(`CASE-${n}_`));
    const hasDedicatedDialogueSection = /^## (핵심 대화 근거|핵심 발화)/m.test(text);
    const hasQuotedTurningPoints = quoteCount(text) >= 2;
    if (!hasTranscriptAppendix && !hasDedicatedDialogueSection && !hasQuotedTurningPoints) {
      fail(errors, `${name}: 인간 재열람용 대화 근거가 부족하다 (핵심 대화 근거/핵심 발화 절, 2개 이상 직접 인용, 또는 TRANSCRIPT 부록 필요)`);
    }

    const hasUserContribution = /^(?:##|###) .*사용자.*기여|^(?:##|###) 사용자가 기여한 것/m.test(text);
    const hasAIContribution = /^(?:##|###) .*AI.*기여|^(?:##|###) AI가 기여한 것/m.test(text);
    if (!hasUserContribution || !hasAIContribution) {
      fail(errors, `${name}: 사용자 기여와 AI 기여를 heading 수준에서 구분해야 한다`);
    }
  }

  for (const name of transcriptFiles) {
    const text = fs.readFileSync(path.join(CASE_DIR, name), 'utf8');
    const n = caseNumber(name);
    if (!n || !mainCases.some(f => f.startsWith(`CASE-${n}_`))) {
      fail(errors, `${name}: 대응하는 main CASE가 없다`);
    }
    if (!hasDialogueEvidence(text)) {
      fail(errors, `${name}: transcript/excerpt 부록은 대화 provenance를 명시해야 한다`);
    }
    if (text.includes('[대화]') && quoteCount(text) < 2) {
      fail(errors, `${name}: [대화] 원문이 있다고 표시했지만 직접 인용이 2개 미만이다`);
    }
  }
}

// Reference effect records (21_REFERENCE_EFFECT_RECORDS.md): every REF file must carry the
// sections and per-effect fields needed to re-implement the effect without reopening the site.
const REF_SECTIONS = ['1. 레퍼런스 개요', '2. 입력 증거', '3. 기술 스택과 전역 설정', '4. 디자인 토큰',
  '5. 장면·전환 지도', '6. 효과 카드', '7. 에셋 목록과 조달 경로', '8. 성능·접근성·폴백', '9. 레시피 후보', '10. 열린 질문'];
const EFFECT_FIELDS = ['선정 이유', '지각', '입력 모델', '판별 근거', '구현 메커니즘', '파라미터', '타임라인', '에셋',
  '성능 기법', '접근성·폴백', '근거', '재현 요구사항', '수용 기준', 'ECG 번안', '재현 상태'];
const INPUT_MODELS = ['시간', '스크롤 위치', '스크롤 속도', '휠 충격', '문턱 발동', '포인터', '로드'];

function checkReferences(errors) {
  if (!fs.existsSync(REF_DIR)) return;
  for (const name of fs.readdirSync(REF_DIR).filter(n => /^REF-\d{3}_.*\.md$/.test(n))) {
    const text = fs.readFileSync(path.join(REF_DIR, name), 'utf8');
    const num = name.slice(4, 7);
    for (const sec of REF_SECTIONS) {
      if (!new RegExp('^## ' + sec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'm').test(text)) fail(errors, `${name}: 필수 절 누락 (## ${sec})`);
    }
    const cards = text.split(/^(?=### EFX-)/m).slice(1).map(c => c.split(/^## /m)[0]);
    if (!cards.length) fail(errors, `${name}: 효과 카드(### EFX-${num}-NN)가 없다`);
    const ids = new Set();
    for (const card of cards) {
      const id = (card.match(/^### (EFX-\d{3}-\d{2})/) || [])[1];
      if (!id || id.slice(4, 7) !== num) { fail(errors, `${name}: 잘못된 효과 ID (${card.split('\n')[0]})`); continue; }
      if (ids.has(id)) fail(errors, `${name}: 중복 효과 ID ${id}`);
      ids.add(id);
      for (const f of EFFECT_FIELDS) {
        const m = card.match(new RegExp('\\*\\*' + f + '\\*\\*[ \\t]*[:：]?[ \\t]*([^\\n]*)'));
        if (!m) { fail(errors, `${id}: 필드 누락 (**${f}**)`); continue; }
        const rest = card.slice(m.index + m[0].length).split(/\n\*\*/)[0];
        if (!(m[1] + rest).replace(/[\s|:-]/g, '').length) fail(errors, `${id}: 필드 값이 비어 있다 (**${f}**) — 모르면 '미확인 — 이유'`);
      }
      const im = card.match(/\*\*입력 모델\*\*[^\n]*/);
      if (im && !INPUT_MODELS.some(k => im[0].includes(k))) fail(errors, `${id}: 입력 모델은 ${INPUT_MODELS.join('/')} 중에서 적는다`);
      const st = card.match(/\*\*재현 상태\*\*[^\n]*/);
      if (st && !/`?(none|spike|verified)`?/.test(st[0])) fail(errors, `${id}: 재현 상태는 none/spike/verified 중 하나`);
      if (!evidenceTags.some(t => card.includes(t))) fail(errors, `${id}: 근거 태그가 없다`);
    }
    const map = (text.split(/^## 5\. 장면·전환 지도\s*$/m)[1] || '').split(/^## /m)[0];
    for (const id of ids) if (!map.includes(id)) fail(errors, `${name}: ${id}가 장면·전환 지도에 없다`);
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
  checkReferences(errors);
  checkEntrypoints(errors);

  if (errors.length) {
    console.error(`\n[uiux-records] FAIL — ${errors.length} issue(s)`);
    for (const e of errors) console.error(` - ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log(`[uiux-records] PASS — ${validIds.size} F/D/O/R records + CASE/dialogue/provenance/entrypoint checks`);
}

main();
