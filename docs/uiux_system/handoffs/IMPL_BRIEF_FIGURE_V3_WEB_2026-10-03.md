# 구현 위임 브리프 2 — 사람 v3 · 3전극 · 흐르는 점선을 웹 서고에 (별도 Claude Code 세션용)

작성 2026-10-03 · 발행: 계획·검증 채팅(브랜치 `claude/r1-autopilot-recommended`) · 작업 방식 D-047(혼합)
결정 근거: D-048(H5, 원본 A, 3전극, 색 규칙, 배치 수정 1–3) · 앞선 브리프: `IMPL_BRIEF_ARCHIVE_WEB_2026-10-02.md`(브리프 1)

## −1. 브리프 1과의 관계 (먼저 확인)

두 브리프는 같은 파일(`archive.ts`, `introStage.ts`, `figure.ts`)을 고친다. 충돌을 피하려고:

| 상황 | 할 일 |
|---|---|
| 브리프 1 세션을 **아직 시작하지 않음** | 이 세션이 **브리프 1의 T1–T9를 먼저**(아래 §3 A단계) 하고, 이어서 B·C단계. 브리프 1은 따로 실행하지 않는다 |
| 브리프 1 세션이 **진행 중이거나 결과 검토 전** | 이 브리프를 시작하지 않는다. 브리프 1 결과를 계획 채팅이 검토·반영한 뒤 그 커밋을 기준으로 시작(A단계 생략) |

## 0. 먼저 읽을 것 (이 순서로)

1. `AGENTS.md` — 한국어 대화, 데이터 계약, 레퍼런스 에셋·코드 복사 금지, 로컬 실행 안내는 `npm run …` 한 줄만
2. `docs/uiux_system/records/D_DECISIONS.md` **D-048 전체**(갱신 2026-10-03 두 개 포함), D-046, D-047
3. `docs/uiux_system/rounds/R1/PLAN-R1-INTRO-STORY-V2.md` §9(특히 9.1, 9.2b)
4. `docs/uiux_system/rounds/R1/SPACE-R1-ARCHIVE.md` §1–3(도입부 카메라 표)
5. 브리프 1 전체(A단계를 할 경우 그 수용 기준이 그대로 적용)
6. 비교 기준 정지 렌더(Blender): `verification/r1-figure-v3-20261002/v3_archive_sheet.jpg`, `archive/*.png`, `check/sheet_A.jpg`, README의 자체 검토 표
7. 코드: `prototype/v2/src/story/intro/{archive.ts, introStage.ts, figure.ts, IntroShell.tsx}`, 빌드 `scripts/assets/build-figure-v3.py`, `scripts/blender/build_archive.py`(`--fig v3 --signal` 부분: `tube()`, `dash_mat()`, 전극·리드선·트렁크·통신선·전원선 경로)

## 1. 목표

도입부 서고 장면(`?look=archive`)의 사람을 **v3**(원본 A + 달걀 머리 + 옆대를 쥔 오른손 + **3전극**)로 바꾸고, **H5 표현**(젖빛 반투명 면 + 은은한 고리)과 **선을 따라 흐르는 네온 점선**(파랑·빨강·보라)을 웹에서 정지 렌더와 같은 성격으로 보이게 한다. Story(P5)가 나중에 쓸 수 있도록 점선 상태와 쥠·숨 형태 키를 **API로 열어 두되**, Story 장면 자체는 만들지 않는다.

## 2. 현재 상태 (발행 시점, 커밋 `c19af88` 기준)

| 항목 | 상태 |
|---|---|
| 사람 v3 | `prototype/v2/src/story/intro/assets/body_seated_v3.glb`(2.3 MB, 형태 키 `breath`·`grip`, 속성 `_SLICE`) — **수정 금지**. `figure.json` 키 `seated_v3`: `seat`, `heart_b`, `heart_q_wxyz`, `hand_r`, `electrodes{RA,LA,LL: p, n, torso}`, `joints`, `stile`. 좌표는 Blender(z 위) 사람 좌표 → three(x, z, −y) |
| 서고 배치 | `build_archive.py`의 v3 배치: 사람은 사다리 가운데(`LAD_X − seat.x`), **바닥 멀티탭**(−0.95, 3.62), 전원선이 트렁크 옆을 지나 책상으로, 통신선은 책상 위, 리드선 묶음은 오른쪽 허리 |
| 웹 서고 에셋 | `assets/archive/`는 **옛 배치(벽 콘센트)로 구운 것** → 다시 굽기 필요(B1) |
| 웹 사람 | 아직 v2(`body_seated.glb`) + H3b 고리 셰이더. 형태 키는 셰이더가 읽지 않음 |
| 정지 렌더 색 | 파랑 `#3d8bff`, 빨강 `#ff3048`, 보라 `#b24dff`. 점선 주기: 리드 4.5 cm, 트렁크·통신 6–7 cm, 몸속 3 cm, 듀티 ≈ 0.42–0.5 |

## 3. 작업과 수용 기준

### A단계 — 브리프 1 (조건부, §−1 참고)
브리프 1의 T1–T9 그대로. 단, 서고 다시 굽기는 B1에서 한 번만 한다(A단계 캡처는 옛 에셋으로 해도 됨 — 보고서에 명시).

### B단계 — 에셋
| # | 작업 | 수용 기준 |
|---|---|---|
| B1 | 서고 다시 굽기(멀티탭 배치) | `python scripts/blender/build_archive.py --bake prototype/v2/public/intro-archive --size 2048 --bsamples 128 --fig v3` → `python scripts/assets/package-archive.py prototype/v2/public/intro-archive` → 세 파일을 `assets/archive/`로. 굽기에는 사람·전극·선·**전원선**을 넣지 않는다 — `--bake` 경로가 `RIG_PREFIX`(El_, Lead_, LeadYoke, TrunkCable, CommCable, Sig_, PowerCable …) 이름의 객체를 지운다(발행 직전 추가, 실행 검증은 이 세션에서). 전원선은 방에서 빠지므로 B2의 `PowerLine`으로 웹에 다시 들어온다. 합계 ≤ 12 MB, manifest의 `figure`가 v3 배치(가운데)인지 확인. **`--fig v3`가 굽기 경로에서 사람 위치만 바꾸고 방은 같은지** 확인 |
| B2 | 전극·선 메시 내보내기 | `build_archive.py`에 내보내기 옵션 추가(예: `--export-rig DIR`): 전극 부품(폼·젤·스냅·클립), 묶음, 리드선 3, 트렁크, 통신선, 전원선, 몸속 신호 경로 3을 **하나의 glb**로. 튜브는 지금 `tube()` 그대로(UV u = 길이 m — 점선이 이 값을 씀). 각 메시 이름으로 묶음 구분(`Lead_*`, `TrunkCable`, `CommCable`, `PowerLine`, `Sig_*`, `El_*`). 위치·경로는 **지금 정지 렌더와 같아야 함**(바꾸려면 RETURN). 크기 ≤ 1 MB(meshopt) |

### C단계 — 웹
| # | 작업 | 수용 기준 |
|---|---|---|
| C1 | 사람 v3 교체 | archive 분기에서 `body_seated_v3.glb` + `figure.json.seated_v3` 사용, 배치는 manifest/figure 기준(사다리 가운데). 심장 위치·회전 `heart_b`/`heart_q_wxyz`. v2(`?look=v2`) 경로는 그대로 |
| C2 | H5 셰이더 | 젖빛 반투명 면 + 은은한 고리(H3b `aSlice` + H3c 거리 밀도 유지) + 가장자리 밝음. 심장 빛이 비쳐 보임. 몸속 신호 경로(파랑)가 면 너머로 보임. 굴절·투과 실계산은 하지 않아도 됨(fresnel·불투명도·뒤 깊이로 흉내). **정지 렌더 s4·s7과 같은 구도의 웹 프레임을 나란히** 놓고 차이를 표로 |
| C3 | 형태 키 | 셰이더가 morph(`breath`, `grip`)를 읽음(`#include <morphtarget_vertex>` 등). `figure.setBreath(0–1)`, `figure.setGrip(0–1)` API. 도입부에서는 숨만 박동과 무관한 느린 주기(약 4 s, 진폭 작게), 쥠 0. `?grip=1`로 쥔 손 확인 캡처 |
| C4 | 흐르는 점선 셰이더 | uv.x(m) 기준 점선이 **신호 방향으로 흐름**(심장→전극→묶음→카트→컴퓨터, 전원선은 멀티탭→컴퓨터). 묶음별 색·상태 uniform: `sig`(몸속), `lead`, `trunk`, `comm`, `power`. 상태 값 `off / clean / noise`: clean = 파랑(몸속·리드·트렁크), 보라(통신), 전원선 무색; noise = 리드·트렁크·전원선 빨강, 몸속 파랑 유지, 통신 보라 유지, **RA 둘레 빨간 고리**. 블룸 패스와 어울리게 밝기 조정(파랑이 흰빛으로 뜨지 않게 — 정지 렌더에서 겪은 문제). API `rig.setSignal({lead,trunk,comm,power,sig})`, 확인용 `?signal=clean|noise|off` |
| C5 | 도입부 기본 상태 | 도입부(사람 등장 p .45 이후)는 **clean** 흐름, 속도는 느리게. 노이즈 연출(빨강)은 Story(P5)에서 — 도입부에 넣지 않는다 |
| C6 | 성능·검증 | 헤드리스 프레임 시간(참고용), 도입부 12장 시트(브리프 1 T2와 같은 p 값) + `?signal=noise`, `?grip=1` 확인 프레임. 파형 무대(Canvas 2D) 수치 불변(G1). `intro.spec`, `story.spec`, v2 단위, 루트 `npm test` 통과 |

캡처: `node scripts/serve-v2.cjs`(빌드본 :4173) + `verification/r1-intro-20260929/capture.mjs`(`EXTRA="&look=archive"`, `BASE=http://127.0.0.1:4173`). 브라우저 경로가 없으면 `PW_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. 결과는 `verification/r1-figure-v3-web-<날짜>/`.

## 4. 범위 밖 — 계획 채팅으로 되돌릴 것

구현하지 말고 `docs/uiux_system/handoffs/RETURN_FIGURE_V3_WEB_<날짜>.md`에 제안(무엇을·왜·근거 캡처)을 쓰고 멈춘다.
- 사람 메시·자세·전극 위치·선 경로 변경(`body_seated_v3.glb`, `build-figure-v3.py`, 경로 좌표)
- 색 규칙·상태 의미 변경, 도입부에 노이즈 연출 추가, Story 장면(P5) 구현
- 서고 배치·카메라 순서 변경(SPACE §3), 새 소품·새 요소
- 데이터 계약에 닿는 것

## 5. 파일 소유 범위

| 수정 가능 | 수정 금지 |
|---|---|
| `archive.ts`, `introStage.ts`(archive 분기), `figure.ts`(H5·morph·API — 구조 변경 허용), 새 모듈 `signalRig.ts`(이름 자유), `IntroShell.tsx`(쿼리·기본값), `space.ts`의 `createGrade` 수치, `build_archive.py`의 **내보내기 옵션 추가만**(방·사람·선 형태는 그대로), `assets/archive/*`(다시 굽기 결과), 새 rig glb, `verification/r1-figure-v3-web-*/`, `handoffs/RETURN_FIGURE_V3_WEB_*.md` | `docs/uiux_system/records/*`, `PLAN*.md`, `WORK_STATE.json`, `WORKLOG.md`, `rounds/R1/*`, `body_seated_v3.glb`·`heart.glb`·`figure.json`·`build-figure-v3.py`·`build-intro-figure.py`, 파형 무대(`sweep.ts`, `waveUi.ts`, `beats.ts`) |

F/D/O/R은 만들지 않는다 — 필요하면 RETURN 문서 끝에 초안.

## 6. 데이터 계약

점선·색은 **Story 상태 표시(장식)**이며 파형·시간·진폭·수치가 아니다. 점선의 밝기·속도를 실제 신호값이나 저장 파형에 묶지 않는다(묶고 싶으면 RETURN). 모니터·심전도 기계·용지에 파형을 그리지 않는다. 파형 무대 코드는 손대지 않는다.

## 7. 반환

1. 작업 브랜치에 커밋·푸시(원격 반영 확인).
2. `verification/r1-figure-v3-web-<날짜>/README.md`: (A단계 했으면 T1–T9 표) + B1–C6 표(PASS/CONDITIONAL/FAIL + 근거 파일), 정지 렌더 대 웹 비교 표, 남은 문제.
3. RETURN 문서(범위 밖 제안·기록 초안이 있으면).
4. 사용자에게 한국어 요약 + 브랜치 이름. 사용자가 계획 채팅에 "figure v3 웹 브랜치 <이름> 검토해줘"라고 가져온다.

## 8. 새 세션 첫 메시지 (복사용)

```
origin/claude/r1-autopilot-recommended 최신 커밋을 기준으로, 이 세션에 지정된 작업 브랜치에서 작업해줘(claude/r1-autopilot-recommended에는 푸시하지 마).
docs/uiux_system/handoffs/IMPL_BRIEF_FIGURE_V3_WEB_2026-10-03.md 를 읽고 §−1로 브리프 1과의 관계를 먼저 판단한 뒤(브리프 1은 아직 시작하지 않았어), §0 순서대로 문서를 읽고 §3을 A단계부터 진행해줘. §4 범위 밖이 필요해지면 구현하지 말고 RETURN 문서로 남기고 나에게 알려줘.
```
