# AB-R1-001 Cross Review — ALPHA-R1-001 × BETA-R1-001

작성: 2026-09-27 · branch `claude/r1-autopilot-recommended` · 오케스트레이터: Claude Code
**자동 진행 모드**: 사용자가 몇 시간 개입할 수 없어 "내 결정이 있어야 하는 부분은 모두 권장안으로" 진행하라고 지시했다 `[대화]`. 이 문서의 §5 "사용자 시각 정렬"은 **AI 대리 판단**이며 사용자 판단이 아니다. 모든 자동 결정은 `AUTOPILOT_DECISIONS.md`에 되돌리는 방법과 함께 모았다. 복귀 지점: `claude/optimistic-goldberg-jnzpni` `1570dd4`.

## 1. Same Common Packet

두 트랙 모두 `R1_STEP1_PACKET_AND_REFERENCE_PACK.md`(FROZEN + F-025 정정)만 공통 입력으로 받았다.
- Alpha: 오케스트레이터가 직접 작성(2026-09-27, `83544fa`).
- Beta: 별도 에이전트(새 컨텍스트, 허용 파일만 읽음). Alpha 파일을 열지 않았다고 매 보고에서 밝혔다. 오케스트레이터는 Beta에 이미지 품질 비평과 사용자 답만 전달했다 — Alpha 내용은 전달하지 않았다. 판정: **독립성 유지**(한계: 같은 모델 계열, 같은 패킷).

## 2. Alpha Summary

"한 줄의 신호, 바뀌는 1등". Attract(D1 기록 111 · 혼합 −5 dB · M08 sweep, 배경 격자·먼지 포인터 시차) → Story 4박자(성분 쌓기 / 방법 토큰 순위 재배열 / D1 49장면 1등 격자 → EXP-A 평균 막대 / 지표 재정렬) → 파형 match cut으로 Lab. 스크롤 위치 함수(연속 scrub, RCP-26). 토큰은 Canvas, 모양으로 계열 구분.

## 3. Beta Summary

역광 호 세계(REF-001 호 → sweep 선 match cut)를 전 장면의 공통 배경으로. Attract(D0 S038 · 전원 간섭 0 dB · M04) → Story 3박자(같은 합성 기록 · 20 dB, 조건 경로 + Noise 띠 + 입력/출력 행 + DOM 순위 열 Flip 재배열) → push-in으로 Lab(근육 · M06L6 · 같은 시각). 휠 제스처 1회 = 1박자 스냅. 스틸 7장(KEEP 4 · TUNE 3), Gap 17개, 자동 채택 OQ 7개.

## 4. Common Evaluation (`20` §4 — 1–5 보조 점수, 합산으로 승자를 정하지 않음)

| 기준 | Alpha | Beta | 근거 |
|---|---|---|---|
| Creative Impact | 3 | **5** | Beta는 완성 스틸로 "멈춰 볼 이유"(역광 호가 신호가 되는 순간)를 보였다. Alpha는 글로만 존재 |
| Reference Translation | 4 | 4 | Alpha는 6개 레퍼런스를 고르게 번역, REF-006 재배열이 핵심. Beta는 REF-001이 강하고 REF-006은 순위 열 Flip으로만 |
| ECG Identity | 4 | 4 | 둘 다 파형이 주인공. Beta의 호는 ECG와 무관한 은유지만 "빛이 신호가 된다"로 연결됨 |
| Waveform Centrality | 4 | **5** | Beta 스틸에서 파형이 화면의 중심 띠. Alpha의 3박자(격자·막대)는 파형 무대를 비움 |
| Story Power | **5** | 4 | Alpha는 한 장면(S1) → 전체 실험(EXP-A) → 지표 한계까지 연결. Beta는 S1 한 장면에서 끝남(결론 줄) |
| Near-final Completeness | 2 | **5** | Beta 스틸이 제품 후보 수준(`19` 기준). Alpha는 구조 문서 |
| Interaction Coherence | 4 | 4 | Alpha 연속 scrub은 R2D3 충실, Beta 스냅은 전시 관람에 적합 |
| Component Coherence | 3 | **5** | Beta는 칩·pill·경로·순위 열이 한 언어로 측정·토큰화됨 |
| Data Integrity | 4 | 4 | Alpha: F-025 반영, D1 격자는 "기록 다름" 표기 필요. Beta: 잡음 진폭 과장·범례 오류를 스스로 Gap으로 잡음(F-026) |
| Implementation Reality | 4 | 4 | 둘 다 vanilla 엔진 + React(D-028). Beta는 WebGL 호 1개, Alpha는 WebGL 먼지층 1개 |
| Accessibility / Reduced Motion | 4 | 4 | 둘 다 정지 대안 명시 |

### 교차 검토에서 새로 드러난 사실 (F-026)
Beta의 수치 대조가 Alpha의 전제 하나를 흔든다: **20 dB에서 전원 간섭·기저선 잡음은 신호보다 훨씬 작고(p2p 0.072·0.061 mV 대 신호 −0.88…0.90 mV), 방법 사이 출력 차이도 눈에 보이지 않는다(M04 대 M_FE RMS 0.0025 mV).** Alpha M-04의 "입력 − Reference 행을 같은 ±mV 축에"는 20 dB에서 거의 평평한 선이 되고, Alpha·Beta 모두의 "1등 출력이 파형 행에 바뀌어 그려짐"은 눈으로 구분되지 않는다. 따라서 Story의 메시지는 **파형 모양이 아니라 순위·수치가 전달**해야 하고, 잡음 성분은 **표시 확대(물리 mV 눈금 유지)**가 있어야 보인다. 세 조건의 1등이 서로 다른 것은 15–25 dB에서만 성립한다(저장값, Beta 확인) — 낮은 SNR로 옮길 수 없다.

## 5. User Visual Alignment — **AI 대리 판단 (사용자 부재)**

`20` Step 5 항목을 오케스트레이터가 사용자 기존 발화(CASE-005 "Awwwards·Godly류 장면성", REF-006 "같은 점이 사라지지 않고 … 놀랍네. 애니메이션의 완성도도 높고", S1 동의)를 근거로 대리 작성했다 `[추론]`.

| 항목 | 대리 판단 | 근거 |
|---|---|---|
| 반드시 살릴 것 | Beta의 역광 호 → sweep 선 match cut(S01), Beta Story 레이아웃(S03), **REF-006식 같은 객체 재배열**(사용자가 직접 놀랍다고 한 것) | 사용자 발화 |
| 거슬리는 것 | 과장된 잡음·같은 모양 출력(F-026), S07 범례 오류(G-04) | 자료 계약 |
| 더 과감하게 | REF-006 재배열을 순위 열 Flip 이상으로 — 점들이 흩어졌다 모이는 장면 하나 | 사용자 REF-006 지목 |
| 프로젝트답지 않은 것 | 없음(두 안 모두 파형 중심) | — |
| 실제로 구현해 볼 것 | Hybrid 1개(§7) | — |

## 6. Complementary Parts

| Beta가 더 나은 것 | Alpha가 더 나은 것 |
|---|---|
| 시각 세계(역광 호), 컴포넌트 토큰(측정값), Attract 자료 선택(같은 S038 기록 · 0 dB — Story와 이어짐), 박자 스냅, Noise 띠 확대 규칙, DOM 순위 열(접근성) | Story를 전체 실험으로 넓히는 박자(D1 49장면 1등 격자 → EXP-A 평균 막대 — REF-006 객체 연속 재배열의 가장 강한 번역), 자료 표(A-08), idle 복귀·handoff 상태 계약 |

## 7. Optional Hybrid (1개)

> **Beta의 장면 세계와 3박자를 뼈대로 쓰고, Alpha의 "전체 실험" 박자를 4번째 박자로 붙여 — 순위 열의 같은 10개 점이 49장면 격자로 흩어졌다가 EXP-A 평균 막대로 모인다 — S1(한 장면)의 범위를 전체 실험과 연결한다.**

결합 이유 한 문장: 사용자가 가장 강하게 반응한 REF-006 재배열을 Beta가 약하게만 썼고, Alpha의 그 박자가 바로 그 효과이면서 S1의 "한 구간" 한계를 보완한다.

HYB-R1-001 구성:
| 장면 | 출처 | 비고 |
|---|---|---|
| Attract | Beta S02→S01, M-A | 자료 `d0-pli-0` · 출력 M04(27.42 dB, 그 장면 3위 — Attract에서는 순위·수치 주장 없음), 부제 "합성 기록 S038 · 전원 간섭 0 dB · 출력 M04" |
| Story 1–3 | Beta S03–S05, M-C | 20 dB, 박자 스냅, Noise 띠 = 입력 − Reference 확대 축(±0.15 mV 고정, 물리 mV 눈금 — v2.2.1 Difference gain 선례), 순위 열 DOM Flip |
| Story 4 | Alpha 3박자(M-07·M-08) | 순위 열 10점 → D1 49장면 격자(조건 7 × SNR 7)의 1등 칸 → EXP-A scaled 평균 막대. 파형 무대는 마지막 박자 장면 유지(비우지 않음 — Waveform Centrality). 문구에 "D1 실제 기록 · 잡음마다 기록이 다름", "EXP-A · D1 · TEST 22 · 혼합 −5…20 dB" |
| Lab 전환 | Beta M-D(S05→S06→S07) + Alpha M-10 상태 계약 | 도착 = 마지막으로 파형 무대에 있던 장면(`d0-ma_synth-20`, M06L6), 같은 playhead 4 s |
| 뺀 것 | Alpha 지표 재정렬 박자(M-09), Alpha 배경 먼지·격자층 | 박자 수·관람 시간(4박자 이하), 역광 호와 중복 |

## 8. KEEP / TUNE / REJECT (Validator, `04` 기준)

| 항목 | 판정 | 조건 |
|---|---|---|
| 역광 호 WebGL 배경 | KEEP | 파형 영역에 빛이 닿지 않음, Lab 진입 전 rim 0, WebGL 실패 시 CSS |
| Attract `d0-pli-0` + M04 | KEEP | 조건·dB·방법 표기, 순위 주장 없음 |
| Noise 띠 확대 축 | **TUNE** | 행 이름 "입력 − Reference", 눈금은 물리 mV, "표시 확대" 문구, 세 박자 같은 축(±0.15 mV) — 입력·출력 행은 같은 ±mV 축 유지 |
| 1등 출력 교체 | TUNE | 교차 페이드만(보간 금지). 모양 차이가 거의 없음을 숨기지 않음 — 차이는 순위·수치가 말한다 |
| 순위 열 Flip | KEEP | 같은 DOM 노드, B01은 분리, 1등 수치만 |
| 1등 수치 표기 | TUNE | 저장값 그대로 소수 둘째 자리(19.45 dB). 반올림으로 19.4/19.5가 갈리는 문제 제거(G-10) |
| 4박자 격자 → 막대 | TUNE | 격자 칸 = 저장 장면, "D1 기록은 잡음마다 다름" 표기, M06L6은 EXP-A에 없음 표기, M07·M10은 전시 자료에 출력 없음 표기 |
| 범례 Reference 문구 | TUNE | axis별: D0 "Reference · 합성 기준 신호", D1 "Reference · 원기록에 공통 FE 적용"(G-04) |
| 박자 스냅 | KEEP | 되돌림 가능, 키보드 ←/→, reduced-motion 즉시 전환 |
| G-02 60 Hz 시간 확대 렌즈 | **보류** | 1차 구현 범위 밖 — 전체 창에서는 규칙적 띠로 보임. 사용자 확인 후 |
| 원근·morph·가짜 실시간 | 없음 | — |

## 9. Decision Needed Before Implementation

→ **D-038**(HYB-R1-001 채택, 자동 결정) + `CHANGE_CONTRACT_R1.md`. 둘 다 사용자 복귀 후 뒤집을 수 있다.
