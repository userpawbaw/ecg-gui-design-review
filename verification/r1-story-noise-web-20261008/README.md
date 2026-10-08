# R1 Story 잡음 장면 웹 1차 (브리프 3) — 2026-10-08

브리프: `docs/uiux_system/handoffs/IMPL_BRIEF_STORY_NOISE_WEB_2026-10-08.md`. 결정: D-053, D-054. 비교 기준: `verification/r1-inflow-20261007/`.
로컬 실행: `npm run story` 뒤 브라우저 주소 끝에 `?story=noise&cond=pli`(또는 `bw`, `ma`).

## 한 일
- A1·A2 에셋: `EXPORT_STORY=prototype/v2/src/story/noise/assets FIST_POSE=chair CAM_LENS=16 python scripts/assets/fist-v3.py` (`scripts/assets/story-export-v3.py`). 관문(손가락 42프레임, 숨 0/0.4/0.8 × 편 손/주먹) FAIL 0 뒤 내보냄.
  - `body_v3_story.glb` 781 KB(meshopt, 원본 3.2 MB): 의자 자세 + 형태 키 `fist25/50/75/100`, `breath` + 속성 `_SLICE`, `_INFLOW_D`, `_INFLOW_M`.
  - `chair_v3_story.glb` 281 KB(GreenChair_01, CC0), `story.json`(전극·심장(근사)·팔 경로 길이·카메라).
- B 웹: `prototype/v2/src/story/noise/{noiseStage.ts, NoiseShell.tsx, noise.css}`, 진입 `?story=noise&cond=…`(`main.tsx`). 기존 App·도입부·Story는 그대로.
  - 서고(지금 웹 굽기) + 측정 자리(r2 chair_fit)에 의자와 사람. 의자는 굽기에 없어서 따로 얹고 반구광 + 방향광으로 밝힘.
  - H5 몸 셰이더(`intro/figure.ts`)에 유입 빨강 항 추가: `uCommon`, `uFront`, `uWaveK` + 속성 `aInD`, `aInM`. 기본값 0이라 도입부 변화 없음(도입부 브라우저 테스트 통과).
  - 전극 원판 3 + RA 고리 + RA 리드 한 가닥, 형태 키를 반영한 피부 위치(정점 3개 CPU 혼합).
  - 오른쪽 40 % 70 % 어둡게 + 도입부 sweep·격자·박동 교차(`createSweep`, `createGrid`, `createBeatMix`) 재사용 — 그리는 점은 모두 저장 표본. 막 위 4칸 상태줄.
  - 타이밍(F-030): bw 숨 = 저장 입력 1초 이동평균(정규화), ma 쥠 = 저장 잡음(입력 − 깨끗) 0.5초 RMS 문턱 시작점 + 영상 길이(0.56/0.45/0.39 s), pli 숨 = 10초 2회.
  - B-b 빛줄기: 가슴점(형태 키 반영, 화면 투영) → sweep 머리의 저장 기저선 점. 막의 0 mV = 날숨 가슴 높이(배치만).

## 결과 (`web_sheet.jpg`: 행 = pli / ma / bw, 시각 고정 `?t=`)
| 항목 | 웹 | Blender 기준 | 판정 |
|---|---|---|---|
| 구도 | 'ma' 16 mm, 사람 왼쪽, 막 오른쪽 40 % | `chair_motion.mp4` | PASS(머리 윗부분 잘림은 기준과 같음) |
| P-b | 0.6 s 옅은 분홍 → 2.6 s RA 고리·리드 빨강 | `clip_pli.mp4` | CONDITIONAL — 몸 전체 분홍이 웹에서 더 옅음(세기 0.3 배율, 화면에서 조정 필요) |
| M-b | 2.2 s 아래팔 빛 → 2.6 s 어깨 → 3.0 s RA 고리·리드 | `clip_ma.mp4` | PASS |
| B-b | 옆모습(사람의 오른쪽), 가슴 → 기저선 빛줄기, 막 0 mV = 가슴 높이 | `clip_bw.mp4` | PASS |
| 파형 | 저장 입력 sweep, 상태줄 4칸 차며 저장 출력으로 교차 | 도입부 규칙 | PASS(같은 모듈 재사용) |
| 회귀 | `npm test`(루트), v2 단위, `intro.spec`·`story.spec` 5개 | — | PASS |

## 고친 결함(이번에 발견)
- 몸이 안 보임: H5 셰이더의 드러내기(`uScan`) 기본값이 위쪽이라 전부 가려짐 → 이 장면은 −1.
- 옆모습 카메라가 엉뚱한 곳을 봄: Blender 오일러 XYZ(= Rz·Ry·Rx)를 three 'XYZ'로 읽음 → 'ZYX'.
- meshopt 압축 뒤 몸 크기·전극 위치가 틀어짐: 위치 양자화의 노드 변환을 형상에 적용, 정점 재배열 때문에 전극·가슴점을 번호 대신 위치로 찾음.
- 루트 `npm test` 인코딩 검사 FAIL(이 세션의 Python 스크립트 7곳 `open()`에 `encoding` 빠짐) → 모두 utf-8.

## 확인하지 못한 것 / 남은 것
- 실제 GPU·전시 PC 프레임 시간(헤드리스 SwiftShader 캡처만).
- 심장 위치는 근사(D-050 의자 자세의 전극 삼각형 기준을 옮김).
- 주먹 폄은 쥠 곡선 표본을 거꾸로 씀(영상의 폄 순서 MCP → PIP는 2차).
- 2차 범위: §10 카메라 움직임, 전원선 장 껍질(원경), 장면 이음, 기존 Story 흐름에 넣기, 서고 r2 다시 굽기(의자 포함).

## 2차 — 장면별 카메라 움직임 (사용자 2026-10-08 "2차 카메라 움직임 진행해줘")
`noiseStage.ts` `camAt`: 키(시각, 위치, 바라보는 점, 가로 화각) 사이에서 시선 방향을 바라보는 점 둘레로 돌리고(궤도처럼) 거리·바라보는 점·화각을 부드럽게 바꿈. 마지막 키 = 1차 구도. 파형 막·상태줄·빛줄기는 카메라가 자리 잡은 뒤(TP) 0.6 s에 걸쳐 나타남.

| 장면 | 키 (IDEA-R1-NOISE §10) | 시트 |
|---|---|---|
| 전원 | 0 s 심장 극근경 → 3 s 뒤로 빠짐 → 7 s 궤도(의자 뒤 책상·컴퓨터) → 10 s 전원선 따라 바닥(사람의 오른쪽에서) → 13 s 멀티탭 극근경 → 17 s 크레인 업 원경 → 18.6 s 휩 줌(끝이 빠르게) → 19 s 막. 유입 빨강은 16.6 s부터(장이 몸에 닿는 때) | `camera_path_pli.jpg` |
| 기저선 | 0 s 정면('ma') → 4 s 90° 궤도로 옆모습(사람의 오른쪽, 직교 대신 4.5 m 먼 긴 렌즈) → 이후 숨에 맞춰 카메라 ±1.5 cm → 11 s 막·빛줄기 | `camera_path_bw.jpg` |
| 근육 | 0 s 사람 오른쪽 위 → 4 s 내려가며 낮은 정면('ma')으로 → 쥠·물결은 4 s 뒤부터 → 11 s 막 | `camera_path_ma.jpg` |

판정: CONDITIONAL.
- 읽히는 것: 원인(책상·전원선·멀티탭) → 원경 → 사람 → 파형 순서, 옆모습 궤도, 근육 장면의 낮은 구도.
- 남은 것: 전원 0 s는 카메라가 몸 안(심장 극근경)이라 화면이 분홍으로 덮임 — 도입부 끝 장면과 이어 붙일 때 맞출 것. 기저선 옆모습에서 카메라 쪽 팔걸이가 몸 아래를 가로지름. 얕은 초점(근육 장면 §10.4의 초점 이동)과 전원선 장 껍질은 아직 없음. 끝 크레인 업 → Lab 전환은 Story 흐름에 넣을 때.
- 검증: 헤드리스 캡처(시각 고정)만. 실제 재생 속도·끊김은 보지 못함.
