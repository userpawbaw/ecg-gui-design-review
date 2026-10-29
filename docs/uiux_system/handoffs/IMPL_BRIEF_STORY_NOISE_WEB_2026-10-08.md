# 구현 브리프 3 — Story 잡음 장면(의자 · 유입 표시 · 파형 막) 웹 1차

작성 2026-10-08 · 브랜치 `claude/r1-autopilot-recommended` · 작업 방식 D-047(혼합). 이번에는 같은 세션이 작성 후 바로 구현한다(사용자 2026-10-08: "웹 구현 브리프 작성하고 진행하자").
결정 근거: D-053(의자 하나, 숨 10초 2회, 영상 속도 쥠), D-054(유입 표시 P-b · B-b · M-b, 처리 4칸 = 파형 막 위 상태줄, 옆모습 = 사람의 오른쪽), D-048(H5, 색 규칙), D-052(주먹 곡선), F-030(움직임 타이밍은 저장 잡음에서), IDEA-R1-NOISE §10(장면별 카메라 v3).
앞선 브리프: `IMPL_BRIEF_ARCHIVE_WEB_2026-10-02.md`(1), `IMPL_BRIEF_FIGURE_V3_WEB_2026-10-03.md`(2) — 둘 다 병합됨(fa04f53).

## 0. 먼저 읽을 것
1. `AGENTS.md` — 한국어, 데이터 계약, 로컬 안내는 `npm run …` 한 줄
2. D-053, D-054 전체 · `rounds/R1/IDEA-R1-NOISE.md` §9–10
3. 비교 기준(Blender): `verification/r1-inflow-20261007/`(시트 6장 + `clip_*.mp4`, README 판정), `verification/r1-chair-motion-20261006/chair_motion.mp4`
4. 코드: `scripts/assets/{fist-v3.py, chair-motion-v3.py, inflow-preview-v3.py, inflow-field-v3.py}`, `prototype/v2/src/story/intro/{figure.ts, signalRig.ts, archive.ts, introStage.ts}`

## 1. 목표 (1차)
세 잡음 장면을 웹에서 **고정 구도로** 재생한다: 서고 + GreenChair_01에 앉은 H5 사람(숨 · 주먹) + 유입 표시 + 오른쪽 파형 막(저장 입력 sweep) + 막 위 처리 4칸 상태줄. 확인 진입점 `?story=noise&cond=pli|bw|ma`. 기존 Story(`StoryShell`, 20 dB 막대·격자)와 도입부는 건드리지 않는다.
2차(이 브리프 밖): §10 카메라 움직임(추적·크레인·궤도·휩 줌), 전원선 장 껍질(원경), 장면 이음, 기존 Story 흐름에 끼우기.

## 2. 데이터 계약
- 파형 = 저장값만: `archive.json`의 `d0-pli--5`, `d0-bw_synth--5`, `d0-ma_synth--5`(−5 dB, D-040) `input`과 저장 출력(방법은 기존 Story 규칙: 그 장면 storedMetrics `snr_imp` 1위, 오라클 제외). 물리 눈금(mV 고정, 장면 사이 같은 크기).
- 움직임 타이밍(F-030): 숨 = 저장 기저선(1 s 이동평균)의 위상(B-b), 주먹 = 저장 잡음 포락선(0.5 s RMS) 문턱을 넘는 시작점 + 영상 길이(쥠 0.56 s · 유지 0.45 s · 폄 0.39 s, D-053), 겹치면 묶음. 전원·근육 장면의 숨은 10초 2회 고정 곡선(D-053).
- 고지 "합성 잡음 · 설명용 연출"(bw, ma). 3D 표시(빨강·물결·빛줄기)는 데이터가 아님.
- B-b 빛줄기: 막의 0 mV 높이를 날숨 가슴 높이에 둔다(배치만). 값은 바꾸지 않는다.

## 3. 작업과 수용 기준

### A — 에셋 (Blender, 이 저장소 스크립트)
| # | 작업 | 수용 기준 |
|---|---|---|
| A1 | 사람 story glb | `FIST_POSE=chair EXPORT_STORY=<dir> python scripts/assets/fist-v3.py`: 의자 자세(편 손, 숨 0)를 기본 형태로, 형태 키 `fist25/50/75/100`(쥠 곡선 s 표본 — 관절 순서 유지), `breath`(깊은 숨 키 × 0.8 + 상체 뼈, 숨 1), 속성 `_slice`(H5 고리), `_inflow_d`·`_inflow_m`(M-b 물결). 관문 FAIL 0 뒤에만 내보냄. 크기 ≤ 3 MB(meshopt) |
| A2 | `story.json` | 의자 놓임(사람 좌표), 전극 RA/LA/LL 정점 번호, 가슴점(sternum) 정점, 심장 위치, 팔 경로 길이(`total`), 카메라 'ma'(16 mm 자동 구도 결과)와 'side'(직교, 사람의 오른쪽) |
| A3 | 의자 glb | GreenChair_01(CC0)을 사람 좌표에 놓은 그대로 glb(1k 텍스처). 서고 다시 굽기(r2 빛, D-049)는 이번 범위 밖 — 웹 서고는 지금 굽기 그대로, 의자는 따로 얹고 서고 빛 RT로 밝힘 |

### B — 웹 (`prototype/v2/src/story/noise/`)
| # | 작업 | 수용 기준 |
|---|---|---|
| B1 | 장면 무대 | 서고(`createArchive`) + 의자 + 사람(H5 셰이더 재사용, 형태 키) + 심장 박동(도입부 동기 규칙) — 서고 안 측정 자리(chair_fit)에 사람 좌표 정렬 |
| B2 | 유입 표시 셰이더 | 몸 셰이더에 빨강 항 `uCommon`, `uFront`, `uWaveK`(Blender `add_red`와 같은 식). P-b: 몸 전체 0.70 → RA. M-b: 물결 12, 아래팔 → RA. RA 고리·리드 = 빨강 발광 |
| B3 | 전극 | 원판 3 + RA 고리 + RA 리드 한 가닥. 형태 키 반영 위치(CPU에서 정점 3개 혼합) |
| B4 | 파형 막 + 상태줄 | 오른쪽 40 % 70 % 어둡게(왼→오 그라데이션), Canvas 2D sweep(도입부 `sweep.ts` 규칙, R = 심장 박동 동기), 막 위 4칸이 박동마다 차며 입력 → 저장 출력 교차(T2 "박동마다 한 겹") |
| B5 | B-b 빛줄기 | 화면 좌표 선: 가슴점(3D 투영) → 막의 현재 sweep 머리 기저선 점 |
| B6 | 장면 시간표 | §10 고정 구도판: pli = 0–3 s 공통 모드 → 차이(RA), 이후 처리 막; bw = 옆모습, 숨·빛줄기 계속; ma = 쥠마다 물결 |
| B7 | 검증 | 장면마다 12장 캡처 시트 + Blender 클립과 나란히 비교 표, 파형 수치 불변(G1), `npm test`, 빌드, 기존 intro/story spec 통과 |

## 4. 범위 밖이면 멈추고 기록
서고 다시 굽기, 기존 Story 흐름 변경, 색·세기 결정 변경, 데이터 가공. 필요하면 `RETURN_STORY_NOISE_WEB_<날짜>.md`.

## 5. 반환
`verification/r1-story-noise-web-<날짜>/README.md`: 한 일, 캡처, 비교 표(PASS/CONDITIONAL/FAIL), 확인하지 못한 것.
