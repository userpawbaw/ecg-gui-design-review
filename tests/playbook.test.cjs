'use strict';
// Self-test for scripts/check-playbook.cjs: a valid sample passes; each "missing" and "padding" mutation fails for the
// expected reason. Fixtures are written to a temp folder (PLAYBOOK_ROOT) so the real playbook is not involved.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CHECKER = path.join(__dirname, '..', 'scripts', 'check-playbook.cjs');

const RECORDS = `# D\n\n## D-001. 예시 결정\n\n본문 [대화]\n`;
const JOURNEY = `# J-001. 예시 — 시작에서 끝까지

| | |
|---|---|
| 기간 | 2026-01-01 ~ 2026-01-02 |
| 도착 | P-001 |
| 기록 | D-001 |

## 출발점
예시 작업은 손으로 만든 도구에서 시작했다.

## 흐름 한눈에
T1 손 도구 → T2 표준 도구 → 끝

## T1. 손으로 만든 도구

| | |
|---|---|
| 날짜 | 2026-01-01 |
| 종류 | 시도 |
| 계기 | 첫 구현 |
| 가설 | 손 도구로 충분하다 |
| 판정 | 기각 |
| 다음 | T2 |
| 기록 | D-001 |

### 한 것
손 도구로 결과 3개를 만들었다.

### 결과
세 개 중 두 개가 깨졌다 [런타임].

### 왜 다음으로
깨진 원인이 도구 구조라서 표준 도구가 필요했다.

## T2. 표준 도구

| | |
|---|---|
| 날짜 | 2026-01-02 |
| 종류 | 시도 |
| 계기 | T1 실패 |
| 가설 | 표준 도구는 구조 문제가 없다 |
| 판정 | 채택 |
| 다음 | 끝 |
| 기록 | D-001 |

### 한 것
표준 도구로 같은 3개를 만들었다.

### 결과
세 개 모두 통과했다 [런타임].

## 도착점
P-001.
`;
const CARD = `# P-001. 예시 작업을 할 때 — 표준 도구를 쓴다

| | |
|---|---|
| 상태 | 유효 |
| 언제 읽나 | 예시 작업을 시작할 때 |
| 도달 수준 | 결과 3개 모두 통과 [런타임] |
| 근거 여정 | J-001 T1, T2 |
| 강제 장치 | 수동 — 예시라서 자동 장치가 없다 |
| 갱신 | 2026-01-02 |

## 권장 방법
1. \`tool --standard\`로 3개를 만든다.

## 도달한 품질
세 개 모두 통과했다.

## 가지 말 길
- **손으로 만든 도구** — 구조 때문에 세 개 중 두 개가 깨졌다(J-001 T1).

## 틀린 길이라는 신호
- 같은 부위가 두 번 깨진다(J-001 T1).

## 적용 범위와 재검토 조건
표준 도구가 없는 환경에서는 다시 연다.
`;
const README = '# 색인\n\n- P-001\n- J-001\n';

function build(mut = {}, crlf = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'playbook-'));
  const files = {
    'docs/uiux_system/records/D_DECISIONS.md': RECORDS,
    'docs/playbook/journeys/J-001_EX.md': JOURNEY,
    'docs/playbook/P-001_EX.md': CARD,
    'docs/playbook/README.md': README,
    ...mut
  };
  for (const [rel, text] of Object.entries(files)) {
    if (text === null) continue;
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), crlf ? text.replace(/\r?\n/g, '\r\n') : text, 'utf8');  // Windows checkouts
  }
  return root;
}
function run(root) {
  const r = spawnSync(process.execPath, [CHECKER], { env: { ...process.env, PLAYBOOK_ROOT: root }, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const P = 'docs/playbook/P-001_EX.md', J = 'docs/playbook/journeys/J-001_EX.md';
const cases = [
  ['valid sample passes', {}, null],
  ['valid sample with CRLF line ends passes', { crlf: true }, null],
  // missing
  ['missing header field', { [P]: CARD.replace(/\| 강제 장치 \|.*\n/, '') }, "머리표 '강제 장치' 누락"],
  ['missing required section', { [P]: CARD.replace(/## 틀린 길이라는 신호\n.*\n\n/, '') }, '필수 절 누락 (## 틀린 길이라는 신호)'],
  ['rejected node but no dead-end section', { [P]: CARD.replace(/## 가지 말 길\n.*\n\n/, '') }, "'기각' 노드가 있는데 '## 가지 말 길'이 없다"],
  ['broken chain: no reason for next', { [J]: JOURNEY.replace(/### 왜 다음으로\n.*\n\n/, '') }, '왜 다음으로 누락'],
  ['next points to a missing node', { [J]: JOURNEY.replace('| 다음 | T2 |', '| 다음 | T3 |') }, '다음 T3가 없다'],
  ['unknown record id', { [J]: JOURNEY.replace('| 기록 | D-001 |\n\n### 한 것\n손 도구', '| 기록 | D-099 |\n\n### 한 것\n손 도구') }, '없는 기록 D-099'],
  ['missing path', { [P]: CARD.replace('수동 — 예시라서 자동 장치가 없다', '`scripts/nope.cjs`') }, '없는 경로 `scripts/nope.cjs`'],
  ['index omits a card', { 'docs/playbook/README.md': '# 색인\n\n- J-001\n' }, 'README 색인에 P-001가 없다'],
  ['failure not reflected in any card', { [P]: CARD.replace(/- \*\*손으로 만든 도구\*\*.*\n/, '- **손으로 만든 도구** — 깨졌다(J-001 T2).\n') }, "'기각' 노드가 어떤 카드의"],
  ['result without evidence', { [J]: JOURNEY.replace('세 개 모두 통과했다 [런타임].', '세 개 모두 통과했다.') }, '결과에 근거 태그'],
  // padding
  ['placeholder section', { [P]: CARD + '\n## 남은 한계\nTODO\n' }, 'placeholder만 있다'],
  ['bare 해당 없음', { [P]: CARD + '\n## 남은 한계\n해당 없음\n' }, "'해당 없음'에는"],
  ['untraced generic advice', { [P]: CARD.replace('- 같은 부위가 두 번 깨진다(J-001 T1).', '- 같은 부위가 두 번 깨진다(J-001 T1).\n- 도구를 바꾸기 전에 결과를 살펴본다.') }, '여정 근거 (J-nnn Tn)가 없는 항목'],
  ['vague bullet', { [P]: CARD.replace('1. `tool --standard`로 3개를 만든다.', '1. `tool --standard`로 3개를 만든다.\n2. 결과를 꼼꼼히 확인한다.') }, '막연한 항목'],
  ['copied sentence across sections', { [P]: CARD.replace('표준 도구가 없는 환경에서는 다시 연다.', '세 개 모두 통과했고 구조 문제가 없었다는 것을 확인했다.').replace('세 개 모두 통과했다.\n\n## 가지 말 길', '세 개 모두 통과했고 구조 문제가 없었다는 것을 확인했다.\n\n## 가지 말 길') }, '같은 문장 반복'],
  ['recommendation without any actionable hint', { [P]: CARD.replace('1. `tool --standard`로 3개를 만든다.', '- 표준 도구를 쓴다.') }, '실행 단서']
];

let failed = 0;
for (const [name, mut, expect] of cases) {
  const { crlf, ...files } = mut;
  const { code, out } = run(build(files, !!crlf));
  const ok = expect === null ? code === 0 : code !== 0 && out.includes(expect);
  if (!ok) { failed++; console.error(`FAIL ${name}\n  expected ${expect === null ? 'PASS' : `"${expect}"`}\n  got (${code}): ${out.trim().split('\n').slice(0, 6).join('\n  ')}`); }
}
if (failed) { console.error(`playbook self-test: ${failed}/${cases.length} failed`); process.exit(1); }
const nValid = cases.filter(c => c[2] === null).length;
console.log(`playbook self-test: ${cases.length}/${cases.length} PASS (${nValid} valid, ${cases.length - nValid} missing/padding mutations caught)`);
require(CHECKER);  // and the real playbook
