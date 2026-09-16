# UI/UX Decision & Experiment Protocol

목적: **한 번의 후보 비교/프로토타입/검증 실험을 어떻게 운영할지** 정한다.  
판단 과정의 장기 역사와 F/D/O/R 작성 규칙은 [`10_RECORD_KEEPING.md`](10_RECORD_KEEPING.md)가 담당한다. 두 문서는 중복하지 않는다.

## 1. 실험 단위

각 의미 있는 후보/변경 실험에 `UX-YYYYMMDD-NN` 또는 기존 `UI-xx` ID를 사용한다.

실험 카드에는 다음을 남긴다.

- 문제/기회
- 화면/상태
- Creative Freedom Zone
- 실험할 후보/variant
- 현재 가설
- 변경 금지 범위
- 위험
- acceptance criteria
- 승인 범위
- 구현 commit/PR
- 필요한 증거 레벨(L0~L4)
- 검증 결과
- 후속

**중요한 갈림길은 이 카드만으로 끝내지 않는다.** 구현 전에 `records/D_DECISIONS.md`에 D 항목을 만들고 검토한 선택지와 기각 이유를 남긴다.

## 2. 아이디어·결정·승인·구현·검증을 분리한다

다음은 서로 같은 상태가 아니다.

- 아이디어 제안 ≠ 디자인 결정
- `KEEP / TUNE` ≠ 구현 승인
- 사용자 "좋아 보인다" ≠ 모든 viewport/runtime 검증 PASS
- Plugin prototype ≠ final spec
- Flourish visualization ≠ 프로젝트 성능 증거
- 코드가 존재함 ≠ 실제 브라우저/target-PC 동작이 증명됨

상태가 바뀔 때 무엇이 승인됐는지 명시한다.

## 3. 비교 실험

Motion/visual 후보는 가능하면 2~3 variant를 **같은 데이터·viewport·상태**에서 비교한다.

예:
- A: fade only
- B: subtle glow + short fade
- C: stronger glow + same fade

비교 항목 예:
- 첫 시선/주의 유도
- signal readability
- 피로도
- 상태 이해
- data integrity
- reduced-motion
- 성능/jank

비교 전에 **무엇을 보면 어느 후보를 버릴 것인지** 적으면 결과를 본 뒤 이유를 만드는 위험이 줄어든다.

## 4. Rejected Ideas도 실험 결과다

거절한 후보를 삭제하지 않는다. `UX-*` 실험 카드에는 reject 이유를 남기고, 중요한 갈림길이면 D의 `버린 것과 이유`와 연결한다.

예:
- waveform crossover: 시각적으로 흥미롭지만 signal overlap/identity ambiguity 때문에 core view에서는 reject

기각 후보는 구현 산출물이 남지 않으므로 **결과가 나온 뒤 기록하려 하면 가장 먼저 사라진다.** 따라서 후보를 고른 순간 선기록한다.

## 5. 검증 결과가 판단을 바꾸면 F로 승급한다

단순히 "B가 더 예뻤다"가 아니라 기존 해석 자체가 바뀌었다면 `records/F_FINDINGS.md`에 남긴다.

예:
- high-motion이 ECG UI 전체에 부적합한 것이 아니라 attract/transition과 core waveform의 task criticality가 달랐다는 발견
- 동일한 3D card가 중요성 강조에는 유효하지만 서로 다른 단위 metric의 값 encoding으로는 오해를 만든다는 발견

F는 `발단 → 먼저 의심한 것 → 결정적 근거 → 놓쳤다면`의 판단 흐름을 보존한다.

## 6. 증거 수준

실험 결과는 `00_UIUX_MASTER.md`의 L0~L4를 사용한다.

- L0 IDEA — 개념/레퍼런스
- L1 SOURCE — 코드/명세 검토
- L2 STATIC — 동일 조건 screenshot/render
- L3 INTERACTIVE — 실제 browser/Playwright
- L4 TARGET — 목표 PC/배율/폰트/soak/AFE 등

F/D/O/R의 `[대화]`, `[코드]`, `[런타임]` 같은 태그는 **근거의 출처 종류**이고 L0~L4는 **검증 깊이**다.

## 7. 정기 전체 감사

국소 수정이 누적될 때 다음을 다시 확인한다.

- focal point drift
- accent/motion 과잉
- data hierarchy 약화
- 같은 기능의 다른 control language
- rejected idea의 변형이 근거 없이 되살아났는지
- responsive/target PC 영향
- Creative Freedom Zone 경계가 흐려졌는지

횟수 자체보다 영향 범위와 누적 위험을 기준으로 전체 감사를 실행한다.

## 8. 작업 종료

한 실험을 종료할 때:

1. candidate별 KEEP/TUNE/REJECT/DEFER 판정
2. 구현/미구현/미승인 구분
3. 증거 레벨과 미검증 조건
4. 중요한 판단 변화가 있으면 F/D/O/R 반영
5. 후속 실험 또는 종료 조건
6. `npm run records:check`

여러 실험·대화가 함께 하나의 재사용 가능한 AI/workflow 시스템을 만들었다면 `10_RECORD_KEEPING.md`의 CASE 조건을 검토한다.
