# 공통 검증 기준 · 비교 전 고정

독립안과 기존안 모두 동일 과업·동일 기준으로 평가한다. 파일 수·모델 등급·자기평가 점수는 품질 증거가 아니다. 항목은 PASS / PARTIAL / FAIL / NOT VERIFIED로 기록하고 실제 관찰을 붙인다.

## 반드시 통과할 근거·상태 조건

| ID | 확인할 행동 | 통과 조건 |
|---|---|---|
| R01 | SNR 10→0→10 | 같은 axis/noise 내 record와 구간, realization 정체성이 유지되며 돌아온 파형 일치 |
| R02 | 방법 A→B | input/reference/selection/amplitude 유지, 선택과 설명·출력·지표 일치 |
| R03 | 입력·FE·출력 읽기 | 동일 시간·mV축, FE 기여 분리, clipping 고지 |
| R04 | strict/scaled 비교 | 보정 SNR만 단독으로 성공 표시하지 않음. α는 최적 출력 배율이며 단순 R 진폭 오차가 아님 |
| R05 | scene→전체 결과 | 범위·실험 ID·분할·집계 단위가 명시되고 혼합되지 않음 |
| R06 | source 확인 | archived/freshness·reference 종류·상대 시간·누락 metadata 명시 |
| R07 | 계측 진입 | 장치 미연결이면 LIVE/가짜 지표 없음. replay는 명시 |
| R08 | 오류/누락 | unavailable/unknown을 0·성공으로 치환하지 않음, recovery 경로 존재 |
| R09 | 질환/형태 주장 | 검증 annotation 없으면 병명을 부여하지 않음. QRS floor 이하 차이로 합격하지 않음 |

## GUI 완성도 과업

| ID | 과업 | 통과 조건 |
|---|---|---|
| U01 | 첫 화면에서 무엇을 비교하는지 설명 | 주요 질문, 입력 조건, reference, selected method 식별 가능 |
| U02 | hover→click→pointer leave | preview와 고정 선택 구별, pointer leave 후 선택 복구 |
| U03 | 3.0–4.2s 선택 | 클릭·숫자·이동 버튼, 드래그 없이 동일 결과 도달 |
| U04 | method 설명 읽기 | 원리·관찰점·한계가 현재 선택과 대응, 과도한 글은 단계 공개 |
| U05 | 실험실→계측→복귀 | 조건 보존, 숨은 재생 정지, 예상 가능한 focus |
| U06 | 주요 버튼 키보드 사용 | Tab 순서, Enter/Space, focus ring, dialog Escape·focus 복귀 |
| U07 | 움직임 줄이기 / 정지 | OS reduced motion 존중, 자동 재생 안 함, 사용자가 정지 가능 |
| U08 | 좁은 화면·확대 | 내용 clipping 없이 읽고 조작, 데이터 표만 지역 스크롤 허용 |
| U09 | 로컬 실행 | 외부 CDN/폰트/네트워크 의존 없이 페이지와 실제 저장 파형 작동 |
| U10 | 팀 버그 재현 | component ID, 현재 조건, 기대/실제, metadata를 문서/내보내기로 재현 가능 |

## 방법과 증거

1. 원본 소스와 데이터 정적 검토: 구현 존재와 동작 관찰을 구분한다.
2. 실제 브라우저에서 입력을 조작하고 DOM/화면/console을 확인한다.
3. 수치 핵심은 독립 식으로 재계산하거나 known-input 테스트를 한다. DOM 존재만으로 계산 정확성을 입증하지 않는다.
4. 대표 데스크톱과 좁은 화면의 스크린샷을 눈으로 확인한다. 폰트·대비·잘림·선택 상태를 점검한다.
5. 미검증 장치/환경은 NOT VERIFIED로 남긴다. PARTIAL은 무엇이 남았는지 명시한다.

## 심각도·판정

- P0: 데이터 출처·성능·Live 상태를 잘못 전달하는 문제. 공개 시연 전 차단.
- P1: 주요 과업 불가능, 선택/지표 불일치, 복귀 손실. 최종 prototype에서 수정.
- P2: 정보 밀도, 불필요한 클릭, 보조 가독성, 모션·표현 개선.
- P3: 디자인 취향·추가 기능. 목적이 분명할 때만 도입.

최종 판정은 GUI prototype gate와 실제 연구/장치 deployment gate를 나눈다. prototype이 작동해도 연구 재현·하드웨어 적합은 자동 통과하지 않는다.

## 기준 출처

- [W3C: Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [W3C: Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html): 키보드뿐 아니라 단일 포인터로도 drag 대안 제공.
- [W3C: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- 이전 범용 GUI 매뉴얼은 S3에서 다시 대조한다. 이 기준은 이번 원본 분석으로 미리 고정한 평가 기준이다.
