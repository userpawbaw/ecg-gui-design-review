# EFX parity · recipe packet template

계약: `26_REFERENCE_TO_ECG_WORKFLOW.md` Phase 2–6, `21_REFERENCE_EFFECT_RECORDS.md`, `25_EFFECT_PRODUCTION_PIPELINE.md` G1–G6. 복사한 뒤 `<...>`를 실제 값 또는 `미확인 — 이유/확인법`으로 채운다. 기록이 없으면 READY 상태를 쓰지 않는다.

## 1. 대상과 재생 조건

| 항목 | 값 |
|---|---|
| REF/EFX·wow 구간·primary/supporting/excluded | <...> |
| 원본 관찰 출처·증거 레벨·권리 | <URL/영상 시각/source; 원본 프레임은 repo 밖> |
| 원본/재현 viewport·DPR·입력 궤적 | <...> |
| 입력 모델 및 검증 근거·신뢰도 | <position/velocity/time/pointer/복합> |
| 재현 SHA·코드 경로·에셋 출처/해시 | <...> |
| 기준 G1–G6·성능/대체 경로 | <...> |

## 2. 캡처 manifest와 상태 범위

| progress/time | 입력 및 정지 경과 | 원본 증거 위치 | 재현 캡처/측정 | KEEP/TUNE/GAP |
|---|---|---|---|---|
| <0%> | <...> | <repo 밖 경로/시각> | <우리 파일/수치> | <...> |
| <최소 6장, 권장 12장; onset·전환 추가> | <...> | <...> | <...> | <...> |

관찰/요구 상태: 시작 전 <...>, onset <...>, 중간 <...>, 끝 <...>, stop/resume <...>, reverse <...>, hover/drag/release <해당 여부와 근거>, reduced motion <...>. 연속 녹화와 입력 로그 <경로/없다면 이유>. 미포함 조합 <pairwise 선택·제외 이유>.

## 3. Detail parity 결함 장부

Geometry · timing · motion · layering · lighting · material · post · color · typography · interaction · scroll · assets · transition · micro-detail을 검토한다. **원본의 의도적 차이**와 **ECG 번안의 의도적 변경**은 분리한다.

| ID/구간 | 원본 증거 | 우리 관측 | 차이 / P0·P1·P2 | 원인 가설·신뢰도 | 수정/회차 | 회귀 위험·전체 재캡처 결과 |
|---|---|---|---|---|---|---|
| <...> | <...> | <...> | <...> | <...> | <...> | <...> |

P0/P1 미해결 <개수>. 자체 수정 <0–3회>. 변경 뒤 **전체 구간·관련 상태·연속 motion** 재확인 <근거>. 원본 캡처 저장소 밖 <예/아니오>. console/runtime <결과>. 실제 GPU·터치·L4 <결과/미검증>.

## 4. 상태 결정

`CANDIDATE` / `REPRO_PARITY_READY` / `BLOCKED_FOR_REVIEW`: <판정과 근거>. P0/P1이 남거나 필수 증거가 없으면 READY 금지. 차이 공개 <P2/의도적 변경/불확실성>. 3회 뒤 차단 시 선택지·비용·재개 조건 <...>.

## 5. Recipe (READY 뒤 작성)

| 항목 | 값 |
|---|---|
| RCP-ID·version·성숙도 | <unique ID / semver / observed·spiked·parity-checked·target-PC-verified·production-used> |
| 지각 목표·EFX/캡처 증거 | <...> |
| 알고리즘·입력·critical parameter/range·단위 | <...> |
| code path·clean-start 명령·asset provenance/권리/hash | <...> |
| 성능·오프라인·reduced motion·fallback | <...> |
| 실패 사례·pitfalls·전체 QA 재현 명령 | <...> |

ECG concept에 인계: 자료 scope/record/sample index·연구 주장·recipe version·의도적 변경·검증할 새 위험 <...>. 제품 통합/자체 QA의 `HUMAN_REVIEW_READY`는 Phase 10–11에서 별도 판정한다.
