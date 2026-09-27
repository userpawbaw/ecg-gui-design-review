# R1 Change Contract — HYB-R1-001 구현

상태: 자동 진행(사용자 부재) — D-038 · branch `claude/r1-autopilot-recommended`
입력: `AB-R1-001_CROSS_REVIEW.md` §7·§8, `BETA-R1-001.md`(레이아웃·토큰·모션), `ALPHA-R1-001.md`(A-06 M-07·M-08, A-08 자료 계약)
구현 위치: `prototype/v2/src/story/` + `main.tsx` 진입 경로. **Lab·Compare 화면 자체는 바꾸지 않는다**(2라운드).

## 1. 범위

| 포함 | 제외 |
|---|---|
| 시작 화면 = Story 셸(Attract → Story 5단계 → Lab 전환). `?route=lab`이면 기존처럼 Lab부터 | Lab 레이아웃 재배치, 글꼴 교체, Loss 뷰(D-035) |
| 역광 호 WebGL 배경(실패 시 CSS) | Alpha 지표 재정렬 박자, 배경 먼지층 |
| Canvas 2D 파형 무대(입력 − Reference 띠, 입력, 출력 + Reference) | G-02 시간 확대 렌즈(보류) |
| DOM 방법 점(순위 열 → 49장면 격자 → EXP-A 막대) | 600초 replay 경로(자료 없음) |
| Lab 진입 전환(같은 장면·같은 10초 창) | 실제 장치·실시간 |
| 무인 운영 복귀 대상을 새 Attract로 | |

## 2. 단계와 자료 (모두 `archive.json` 저장값 — `storyData.ts`)

| 단계 | 입력 | 화면 |
|---|---|---|
| A Attract | 시간 | `d0-pli-0` 입력/출력 M04, sweep이 지나간 왼쪽 = 출력 + Reference, 남은 오른쪽 = 입력. 10초 반복 |
| S1 | 휠 1회 | `d0-pli-20`, 1등 M04 19.45 dB |
| S2 | 휠 1회 | `d0-bw_synth-20`, 1등 M_FE 23.20 dB |
| S3 | 휠 1회 | `d0-ma_synth-20`, 1등 M06L6 9.91 dB, 결론 줄 |
| S4 | 휠 1회 | 방법 점이 D1 49장면 격자(잡음 7 × SNR 7)의 1등 칸으로 흩어짐(M06L6 18 · M04 8 · M09 8 · M08 7 · M06 4 · M_FE 3 · M01 1) |
| S5 | 휠 1회 | 칸의 점들이 EXP-A scaled SNR 개선 평균 막대로 모임(M06L6 퇴장·표기, M07·M10 입장·표기) |
| Lab | 클릭(어느 단계든 CTA) 또는 S5에서 휠 | 현재 파형 무대 장면으로 Lab 도착(inspect, 0–10 s 창). Attract에서 클릭하면 `d0-pli-0` · M04 |

## 3. 수용 기준 (검증 → `verification/r1-autopilot-*`)

1. **자료**: 화면의 모든 수치 = storyData 값(단위 테스트). 순위에 B01 없음. 1등 수치 소수 둘째 자리.
2. **축**: 입력·출력 행은 같은 ±mV 축과 같은 sample index. 입력 − Reference 띠는 고정 ±0.15 mV 물리 눈금과 "표시 확대" 문구.
3. **전환**: 조건 전환 12장 캡처 중 어떤 장에도 두 저장 trace 사이 보간 곡선이 없음(순차/교차 페이드만). 방법 점 10개는 S1–S3 전 구간에서 사라지지 않음(DOM 노드 수 불변).
4. **표기**: 모든 단계에 `ARCHIVED REPLAY` 고지. D0/D1과 기록 번호 표기. Reference 범례 axis별 문구. 단위 dB·mV·Hz 소문자 유지.
5. **Lab 도착**: Lab 상태 = {axis, noise, snr, method} 마지막 무대 장면, inspect 0–10 s. 기존 Lab 기능(재생·Sweep/Scroll·방법 선택) 그대로 동작.
6. **입력**: 휠 한 제스처 = 한 단계(연속 휠에 단계 건너뜀 없음), 역방향 휠 = 이전 단계, ←/→·PageUp/PageDown·Enter 키, CTA 버튼.
7. **reduced-motion**: 모든 전환 즉시(≤ 0.3 s 페이드), sweep 정지(출력 전체 표시), 소나 정지.
8. **회귀**: 기존 단위 테스트 통과(600초 chunk 테스트는 자료 없음으로 기존과 같이 실패 허용), `npm run build` 통과, 콘솔 오류 0(replay manifest 404 제외).
9. **충실도 게이트 G1–G6**(`25` §6): 스틸 S01·S03·S05·S07과 구현 캡처 나란히(생성 이미지는 레퍼런스가 아니라 목표 시안), 단계마다 12장, 자기 수정 최대 3회.
