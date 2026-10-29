# R1 자동 진행 결정 로그 (사용자 부재 · 권장안 채택)

> 사용자 지시(2026-09-27): "새 분기를 쳐서 새 branch에서 내 결정이 있어야 하는 부분은 모두 권장안으로 처리하여 진행해줘. … 결과를 확인하고, 일부분 결정에 대해 피드백으로 수정할 부분이 있다면 지적해서 수정하다가 완전히 복구 불가능하다고 생각될 경우 … 기존 branch로 돌아와 … 내가 결정할 부분을 직접 하나씩 검토" `[대화]`

- 자동 진행 branch: `claude/r1-autopilot-recommended`
- 복귀 지점: `claude/optimistic-goldberg-jnzpni` `1570dd4`(Beta 스틸 수신 직후)
- 규칙: 사용자 결정이 필요한 곳마다 이 표에 한 줄. **되돌리는 법**은 이 branch 안에서 고치는 경우의 최소 변경.

| ID | 단계 | 질문 | 채택(권장) | 대안 | 이유 | 되돌리는 법 |
|---|---|---|---|---|---|---|
| AP-01 | Beta OQ-1 | 잡음 성분 띠의 축 | 띠만 확대 축(물리 mV 눈금, 고정 ±0.15 mV) | 같은 축(거의 평평) / 낮은 SNR(1등 패턴 소멸) | F-026 | `signalStage.ts` `STRIP_MV` → 입력 축과 같게 |
| AP-02 | Beta OQ-2 | Attract 자료 | `d0-pli-0` + M04 | D1 111 mixed −5 · M08(Alpha) | Story와 같은 기록, 잡음이 보임 | `storyData.ts` `ATTRACT_*` |
| AP-03 | Beta OQ-5 | Story 휠 방식 | 휠 제스처 1회 = 1단계 | 연속 scrub(Alpha, R2D3 충실) | 전시 관람, 중간 상태 무의미 | `StoryShell` 휠 처리 |
| AP-04 | Beta OQ-6 | 고지 라벨 | `ARCHIVED REPLAY` | `REPLAY` | archive 자료 = v2.2.1이 ARCHIVED REPLAY로 표기 | 문구 상수 |
| AP-05 | Beta OQ-7 | Story 재생 시각 | **정지 전체 창 0–10 s**(Beta 권장 4 s 고정에서 변경) | 4 s 커서 | Lab 도착을 inspect 0–10 s로 하면 두 화면의 파형 좌표가 같아 match cut이 정확 | Lab 도착 `at`/`span` |
| AP-06 | Beta OQ-8 | TUNE 스틸 재생성 | 안 함 | 재생성 | Gap으로 사양화 | — |
| AP-07 | Beta OQ-9 | 공간 도입 인트로 | 보류 | 추가 | 3초 목표 지연 | — |
| AP-08 | Step 5 | 사용자 시각 정렬 | AI 대리(AB-R1-001 §5) | 사용자 직접 | 사용자 부재 | 사용자가 §5 표를 고쳐 쓰면 됨 |
| AP-09 | Step 6 | Hybrid | HYB-R1-001(Beta 뼈대 + Alpha 전체 실험 박자) | Alpha만 / Beta만 | AB-R1-001 §7 | S4·S5 단계 제거 → Beta만 |
| AP-10 | Step 8 | 결정·변경 계약 | D-038, CHANGE_CONTRACT_R1 | — | — | D-038 상태 변경 |
| AP-11 | 구현 | Attract sweep 방향과 색 | sweep이 지나간 왼쪽 = 출력(청록), 오른쪽 = 입력(주황) — Beta M-A 문구대로. **스틸 S01은 반대(왼쪽 주황)** | S01 구도 | "sweep이 지나가며 드러낸다"와 맞는 쪽 | `signalStage.ts` attract 그리기 |
| AP-12 | 구현 | 시작 화면 | Story 셸이 기본, `?route=lab`로 기존 Lab | Lab 기본 + Attract 버튼 | 전시 첫 화면 = Attract | `main.tsx` 초기 route |
| AP-13 | 구현 | 스크롤 엔진 | Lenis 없음(휠 단계 입력만) | Lenis 1개 | 연속 스크롤이 없어 불필요 — D-028 "하나 이하" 충족 | — |
| AP-14 | 구현 | 화면 문구 | 한국어(아래 문구표) | 영어(스틸) | v2.2.1 한국어, §8.1 | `copy.ts` |
| AP-15 | 구현 | 1등 수치 자릿수 | 저장값 소수 둘째(19.45) | 첫째(19.4) | 반올림 경계 모호성 제거(G-10) | formatter |
| AP-16 | 구현 | 무인 복귀 | 기존 "무인 운영" 체크 시 180 s 후 새 Attract로 | 60 s(Beta) | v2.2.1 값 유지 | `main.tsx` idle |
| AP-17 | 구현 | Reference 범례 | D0 "합성 기준 신호" / D1 "원기록에 공통 FE 적용" | v2.2.1 D0 "합성 신호에 공통 FE 적용" | `provenance.reference` 문구(G-04) — v2.2.1 Lab 범례는 2라운드 전까지 그대로 두고 Story에만 적용, 불일치는 F-026에 기록 | 문구 상수 |

## 문구표 (AP-14)

| 위치 | 문구 |
|---|---|
| Attract 제목 | 잡음 속에서, 신호를 |
| Attract 부제 | 저장 재생 · 합성 기록 S038 · 전원 간섭 0 dB · 출력 M04 |
| Attract 칩 | 전원 간섭 · 기저선 변동 · 근육 잡음 |
| Attract CTA | 휠을 굴리거나 클릭해 시작 |
| 고지 | ARCHIVED REPLAY — 실제 장치 세션 없음 |
| Story 머리글 | 같은 합성 ECG · 기록 D0 S038 · 20 dB · 저장된 10초 구간 |
| Story 제목 | 잡음이 바뀌면, 1등이 바뀝니다 |
| S3 결론 | 이 저장 구간에서는 잡음마다 가장 잘 맞는 방법이 달랐습니다 |
| S4 제목 / 주석 | 49개 장면으로 넓히면 / D1 실제 기록 · 잡음 종류마다 다른 기록 · 장면마다 저장된 10초 · 참조가 필요한 B01 제외 |
| S5 제목 / 주석 | 전체 실험 평균으로 보면, 차이는 생각보다 좁습니다 / EXP-A · D1 · TEST 22 기록 · 혼합 잡음 −5…20 dB · scaled SNR 개선 평균 |
| CTA | 휠: 다음 잡음 → / 휠: 더 넓게 보기 → / 클릭해 직접 바꿔 보기 → |
