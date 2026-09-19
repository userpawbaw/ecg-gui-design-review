# Dual Director / Superdesign 사용 예시

공통 계약: [16_DUAL_CREATIVE_DIRECTOR.md](16_DUAL_CREATIVE_DIRECTOR.md). 모드 실행: [14_SUPERDESIGN_GENERATION_LAYER.md](14_SUPERDESIGN_GENERATION_LAYER.md). 설치/auth/CLI syntax는 현재 공식 vendor skill을 읽는다.

| 사용자 요청 | 실제 경로/기대 결과 |
|---|---|
| 새 디자인 라운드 시작해줘. Attract 첫인상을 새로 잡자 | HIGH 신규 → Dual. A 5~8 concepts, 독립 B 4~6 cards → 1~2 drafts |
| 듀얼 디렉터 진행해줘 | 명시 Dual, 공통 baseline 고정 후 독립 A/B |
| 레퍼런스 디렉터만 진행해줘 | A_ONLY; B 호출 없음 |
| Superdesign 독립 탐색 진행해줘 | NATIVE_DIRECTOR; A의 아이디어 없이 B-only |
| 이 후보 C2를 Superdesign 시안으로 만들어줘 | CONCRETIZER, 선택 후보 한 개; 독립 discovery 재실행 없음 |
| C2/C4/C5를 같은 baseline에서 비교해줘 | CONCRETIZER 3 drafts, 실제 허용 범위 확인 |
| Method Explorer 새 방향 제안 | MEDIUM → A 우선; B가 줄 정보 가치가 크면 제안 |
| y축 레이블/버튼 대비/수치 오류 수정 | LOW/polish → 해당 수정, 자동 Dual 없음 |
| 이미 선택한 Attract 방향 구현 | HIGH여도 freeze 구현 → 새 Dual 없음 |

## Chat → Work

Chat은 A를 실행하고 06번의 B clean packet을 따로 만든다. A reference/후보/선호가 든 Chat 대화 전체를 B에게 넘기지 않는다. shell/격리 context에서 B 결과가 돌아올 때까지 상태는 B_HANDOFF_READY다. 그때 cross-review를 재개한다.

B용 요청 예:

> 지정 baseline의 Attract를 NATIVE_DIRECTOR로 탐색한다. 공통 packet에 나열된 UI source/goal/constraints만 읽고 A 폴더/선호/draft와 전체 대화를 읽지 않는다. 14와 16의 B 계약을 따라 실제 native 검색 → 4~6 cards → prefilter → 1~2 drafts로 진행한다. 입력 manifest/실제 query/선택 이유/preview와 미검증 항목을 반환한다.

## Shell 환경

Orchestrator는 separate clean context로 A/B를 실행한다. B vendor preflight/auth 및 baseline init/resume를 확인한다. 독립성을 제공할 수 없으면 새 세션 handoff로 전환한다. 명령을 실행할 수 있다는 사실만으로 A/B 완료를 보고하지 않는다.

## Evidence와 transition

Evidence story의 관계/grammar가 미정이면 먼저 Data Storyteller로 고정한 뒤 공통 packet에 넣는다. A/B는 같은 데이터를 다른 composition으로 설명하며 metric을 바꾸지 않는다.

Lab→Evidence에서는 파형 morph 없이 spatial continuity/상태 의미를 탐색한다. 시작/중간/끝 상태는 하나의 방향을 설명하는 key states다. 여러 유료 생성이 필요하면 1~2 draft 예산과 별도로 숨기지 말고 산정한다. static draft는 motion runtime 검증이 아니다.

## Cross-review 이후

A concept와 B composition이 상보적이면 부모 ID와 검증할 가설을 적어 H1 한 개를 CONCRETIZER로 생성한다(허용 예산 안). 무조건 hybrid하지 않는다. 결과는 user alignment + validator KEEP/TUNE/REJECT로 보낸다.

반환 예시의 URL/IDs는 실제 tool 출력으로 채우며 임의 예시 값을 실제 결과처럼 표시하지 않는다. B 차단 시 A 결과와 clean packet만 반환하고 native draft 미실행을 명시한다.
