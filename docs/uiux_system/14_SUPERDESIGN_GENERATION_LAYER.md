# Superdesign — NATIVE_DIRECTOR / CONCRETIZER

2026-09-19: D-010/R-009, D-012의 역할 확장을 적용한다. 초기 generator 도입 판단은 CASE-003/D-009/R-008에 보존한다. 공통 activation·독립성·예산·cross-review 계약은 [16_DUAL_CREATIVE_DIRECTOR.md](16_DUAL_CREATIVE_DIRECTOR.md).

## 1. 모드를 먼저 정한다

| 모드 | 입력 | 실행 | 출력 |
|---|---|---|---|
| NATIVE_DIRECTOR | 공통 UI baseline/goal/constraints + 자체 inspiration | native prompt 탐색 → 4~6 cards → cheap prefilter → 1~2 drafts | 독립 B 방향과 provenance |
| CONCRETIZER | 이미 선택된 A/B/Hybrid concept과 필요 reference | 동일 baseline에서 시안화 | 선택한 concept의 concrete draft |

Native는 A 선행/Reference Mining 완료를 요구하지 않는다. Concretizer는 독립 발상이라고 부르지 않는다. 자동 HIGH Dual, MEDIUM A 우선, LOW 생략과 명시 모드 우선순위는 16번 §1을 따른다. 단순 polish/frozen 구현은 자동 생성 대상이 아니다.

## 2. Vendor 실행과 baseline

설치된 공식 Superdesign skill을 읽고 현재 CLI 규칙을 따른다. 현재 검토 skill: plugin 0.6.0, 과거 upstream pin `f9f05cd988c247dce6c072eaf9ac6b162f2ffc4b`; 실제 실행 버전은 매번 별도로 기록한다.

실제 실행 시 bare `npx --yes @superdesign/cli@latest`로 shell/auth 확인, auth 필요 시 vendor login 절차를 따른다. command flags는 현재 help에서 확인한다. 공식 skill의 repo init/resume 규칙을 적용하되 Native의 saved project/draft/context에 A 결과가 섞였으면 독립 탐색용으로 재사용하지 않는다. 기존 UI source/design-system의 깨끗한 baseline target을 준비한다. vendor 전체 지침을 wrapper에 복제하지 않는다.

기존 `prototype/v2` codebase를 사용하며 brand-new SaaS 생성으로 바꾸지 않는다. 유효한 init/resume를 재사용하되 fingerprint와 입력 provenance를 확인한다. 이 workflow 구현·오프라인 검증 자체에는 CLI/auth/유료 draft 실행이 필요하지 않다.

## 3. Native 실행

A를 보지 않은 별도 context에서 현재 code/design-system을 이해하고 실제 prompt/inspiration 검색을 한다. query, source slug/URL, 선택 이유를 남긴다. 독립 URL DNA 추출은 선택이다. 임의 slug/모델명/검색 성공을 만들어내지 않는다. 16번 §5 Direction Card 필드를 사용한다.

4~6 cards 단계에서는 draft 생성 없음. cheap prefilter는 data 훼손/무관성/B 내부 중복/낮은 정보 이득만 제거한다. 유효 후보 1~2개를 생성하고 prefilter 탈락 이유도 보존한다. first pass에서 A와의 중복 검사는 금지한다. 결과가 generic이어도 자동으로 추가 모델/라운드를 소비하지 않는다.

## 4. Concretizer 실행

이미 고른 후보와 목표를 받는다. 비교는 통상 2~4 branches, 단일 선택 후보와 Hybrid는 1개가 정상이다. 사용자 요청/허용 예산만 생성하며 Native의 1~2 budget을 이 규칙으로 확대하지 않는다. directional prompt로 차이를 비교하고 선택 후에는 replace/refine, 새 대안 비교에만 branch한다. Hybrid는 16번 §6의 최대 한 번 조건을 따른다.

## 5. Data/다른 역할과 경계

Evidence의 data story/visualization grammar가 미정이면 Data Storyteller/Flourish에서 관계를 먼저 고정하고 양쪽에 공통 제약으로 준다. Creative Production의 후보는 A 자료 또는 cross-review 뒤 입력이며 B에 몰래 주지 않는다. Figma는 선택한 방향의 editable freeze가 필요할 때만 사용한다.

파형 geometry/time/units, Reference/Difference/data-scope/metric 계약을 유지한다. 숫자를 임의로 만들어 차트를 채우지 않는다. `.superdesign` state/draft는 derived artifact이며 canonical source는 code와 프로젝트 문서다. UI source/style/token과 필요한 작은 reference만 전달하고 release/archive/raw data/credentials/bulk repo를 제외한다.

## 6. 환경과 실패

Chat: CLI 실행 없이 A와 B clean handoff 또는 선택 후보의 Concretizer handoff. Work/Codex/Claude: shell뿐 아니라 실제 vendor/auth/network와 clean contexts를 확인한다. 실패한 명령은 vendor 한도(최대 한 번 retry)를 따르며 결과 불명 생성은 먼저 상태 확인한다. 실패를 성공으로 보이지 말고 B_BLOCKED와 복구 packet을 반환한다. 다른 도구로 만든 시안은 fallback으로 표시한다.

## 7. Output와 validator

baseline/target/mode, query와 source, 실제 model/CLI, context manifest, card/prefilter/선택 IDs, 실제 canvas/preview URL와 draft IDs, 생성/비용 수, constraints와 미검증 항목을 반환한다. URL은 tool 출력에서 가져온다.

Native는 A/B freeze 뒤 cross-review; Concretizer는 선택 concept alignment로 반환한다. Product Design/design-taste/motion-review/project validator가 KEEP/TUNE/REJECT를 판단하며 사용자 의도를 확인한다. 생성기는 자기 승인 불가, draft HTML은 자동 production 반영 불가. 첫 실사용에서 fidelity/diversity/판단 속도/이식 비용을 측정한다. 문서 구현은 그 효과의 증거가 아니다.
