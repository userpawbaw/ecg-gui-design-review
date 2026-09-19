# 기록 단계 재검증 — 2026-09-18

기준: DUAL_CREATIVE_DIRECTOR_IMPLEMENTATION_2026-09-18.md §9–11. PR #9, 검증 시작 head `780170c4c8caddc3d21b83a414d4f81342374e79`, remote main `08ffec369b07c75d52f0728e1ee28869f241efa1`.

## 사람이 다시 읽는 관점의 검증

| 항목 | 판정 | 근거 |
|---|---|---|
| 문제 → AI 초기 framing → 반론 → 판단 변화 → Dual 구조 | PASS | CASE-004 배경/논의 1–5를 읽으면 capability gap, shortlist 뒤 generator 배치, 독립 발상 요구, 두 모드와 독립 입력/예산/cross-review로의 전환을 순서대로 설명할 수 있다. 사용자 비용 제안과 AI 구조화의 기여를 구별한다. |
| CASE-004 핵심 사용자 원문 | PASS | handoff §1–2의 인용 9개 전부 부록에 동일 문자열로 보존됨을 대조했다. 긴 순서 역전 설명과 1~2 drafts 제안도 생략하지 않았다. |
| CASE-001 발췌 | PASS | 기존 본문의 직접 사용자 인용 8개 전부 부록에 동일 문자열로 존재한다. 초기 framing/수정 해설은 재구성으로 표시한다. 네 우선 전환점(편의성/역량, Motion, Flourish, 기록 요구)을 보존한다. |
| 현재 확보된 추가 문답 | PASS after repair | CASE-004 §5B에 사용자 msg_idx 82의 activation/기록 보존 요구와 assistant msg_idx 83의 자동 보존 한계 진단을 추가했다. |
| 이전 판단 보존 | PASS | CASE-003은 main 원문 전체가 byte-identical prefix로 남고 후속 절만 추가됐다. D-009/R-008의 첫 ###부터 끝까지 초기 본문도 동일하다. CASE metadata/후속 안내만 추가하고 F-007/D-010/R-009로 연결했다. |
| 구현 범위 구별 | PASS | CASE-004와 D-010은 설계 채택과 실행 미구현을 구별한다. 16번 문서·새 skill·dual routing·UI 구현은 시작하지 않았다. |

## 발견한 문제와 수정

1. 기존 checker는 `불필요 — **TODO**`를 유효한 이유로 받아들였다. 새 negative fixture가 exit 0으로 실패하는 것을 먼저 재현했다. 서식 제거 후 placeholder를 검사하고 `추후 작성`, `사유 입력`, 보류 조건의 서식 placeholder도 거부하도록 수정했다.
2. 기존 16개 fixture에는 main CASE 중복은 있었지만 F/D/O/R 중복 ID와 새 D/R의 CASE 누락을 직접 검증하는 사례가 없었다. 네 prefix 중복, 새 D/R 누락, 네 placeholder 변형을 추가해 총 26개로 확대했다.
3. CASE-004 §5A의 AI 인용 두 문구는 이전 Work가 직접 발췌했다고 표시했지만 이번 전달 대화 앞부분이 생략되어 재대조 불가했다. 허위라고 단정하거나 조용히 지우지 않고 이전 판본 `780170c`와 한계를 주석에 남겼다. 현재 확인 가능한 역할 유지/확장 원문으로 교체했다.
4. 기록 자체를 자세히 남겨 달라는 사용자 문답이 요약에 머물러 있었다. 현재 확보된 원문을 §5B에 추가했다. CASE-001은 확보된 8개 발화가 모두 있어 수정할 필요가 없었다.

## 자동 검증

- `npm run records:check`: PASS, 29개 F/D/O/R 및 CASE/provenance/entrypoint.
- `npm test`: PASS. core 48 scenes/336 metrics, final data 98 scenes/1078 metrics, DOM 26 groups, checker fixture 26개.
- checker fixture: 오류 입력 23개는 exit 1과 의도한 진단, 유효 입력 3개는 exit 0. CASE 누락(D/R 기존 및 신규), 없는 CASE, transcript-only 대상, 빈/placeholder/보류 조건 누락, 중복 CASE field/main CASE/F/D/O/R ID를 검증한다.
- `git diff --check` 및 `git diff 08ffec3 --check`: PASS.
- 인용/과거 본문 대조: handoff 사용자 인용 9/9, CASE-001 8/8, CASE-003/D-009/R-008 보존 PASS.
- 기존 head CI run 35338610847: success 재확인. 수정 후 최종 head의 Actions 결과는 [PR #9 checks](https://github.com/userpawbaw/ecg-gui-design-review/pull/9/checks)에서 SHA와 함께 확인한다. 최종 채팅 보고는 그 확인 이후에만 한다. CI 자체는 records/checker fixtures를 실행하며 root 전체 npm test는 로컬에서 실행했다.

## 남은 한계

전체 채팅 export가 없어 원본 대화 전체와 byte-level 동일성을 증명할 수는 없다. 동일 문자열 검사는 handoff/기존 CASE라는 전달 출처까지의 검증이다. 초기 AI 답변 중 원문 없는 부분은 재구성이다. CASE-001의 나머지 전환점은 본문 해설로 남고 추가 원문은 없다.

checker는 CASE 존재·형식·ID와 알려진 placeholder를 강제한다. 그럴듯하지만 무의미한 사유, 실제 방법론 변화 여부, 발화의 진실성이나 충분함은 의미 검토가 필요하다. 이번 CASE들은 직접 읽고 대조했다. 다양성/성능/UI 품질 향상은 실행 실험 전이므로 이 PASS의 범위가 아니다.

병합하지 않는다. Dual Creative Director 실행 시스템 구현은 별도 사용자 지시 전까지 시작하지 않는다.
