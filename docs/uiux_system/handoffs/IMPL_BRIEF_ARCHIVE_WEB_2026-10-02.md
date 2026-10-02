# 구현 위임 브리프 — 기록 서고(archive) 웹 연결 검증 (별도 Claude Code 세션용)

작성 2026-10-02 · 발행: 계획·검증 채팅(브랜치 `claude/r1-autopilot-recommended`) · 작업 방식 D-047(혼합: 이 브리프의 세부 구현은 위임, 결정·검토는 발행 채팅)
대상 체크리스트: `docs/uiux_system/rounds/R1/PLAN-R1-INTRO-STORY-V2.md` §9.2 **3번**

## 0. 먼저 읽을 것 (이 순서로)

1. `AGENTS.md` — 한국어 대화, 데이터 계약, 레퍼런스 에셋·코드 복사 금지, 로컬 실행 안내는 `npm run …` 한 줄만
2. `docs/uiux_system/rounds/R1/PLAN-R1-INTRO-STORY-V2.md` §9 — 확정된 결정과 진행 순서
3. `docs/uiux_system/rounds/R1/SPACE-R1-ARCHIVE.md` §1–3 — 서고 배치, 빛, **도입부 시나리오(스크롤 진행률별 카메라)**
4. `docs/uiux_system/records/D_DECISIONS.md` D-046
5. 코드: `prototype/v2/src/story/intro/archive.ts`(서고 모듈), `introStage.ts`(`arch` 분기, `archCam`), `figure.ts`(고리 셰이더: `USE_SLICE`, `uRefDist`, `uSunOn`), `IntroShell.tsx`(`?look=`)
6. 참고 구현: `prototype/spikes/attic/src/main.ts`(같은 굽기·빛줄기·먼지 방식, 이미 동작 확인된 spike)
7. 비교 기준 정지 렌더: `verification/r1-archive-20261001/s1_top.png … s6_grip.png`(Blender Cycles), `verification/r1-archive-20261001/README.md`

## 1. 목표

`?look=archive`(지금은 선택 사항, 미검증)를 검증해 **도입부 기본 화면으로 만들 수 있는 상태**로 만든다. 지구(p 0–.27) → 서고(p .25–.72: 지붕 아래 → 들보 아래 → 통로 → 사다리 위 사람 → 가슴) → 심장 + 파형 무대(p .72–1, 기존 그대로) 흐름이 끊김 없이 동작해야 한다.

## 2. 현재 상태 (발행 시점)

| 항목 | 상태 |
|---|---|
| 서고 에셋 | `prototype/v2/src/story/intro/assets/archive/`(manifest.json, archive.glb, light_shell.webp) — Blender 굽기 + meshopt/WebP 압축본. 다시 만들기: `python scripts/blender/build_archive.py --bake prototype/v2/public/intro-archive --size 2048 --bsamples 128` → `python scripts/assets/package-archive.py prototype/v2/public/intro-archive` → 세 파일을 assets/archive/로 복사. 원본(assets/source/)은 저장소에 없음 — 필요하면 registry의 url로 받기 |
| 사람 | `assets/body_seated.glb`(앉은 자세, `_SLICE` 뼈 축 좌표 속성, 형태 키 breath·grip) — **수정 금지**(표현 H3b vs H5는 사용자 결정 대기) |
| 웹 코드 | `archive.ts` 작성, `introStage.ts`에 연결(카메라 Catmull–Rom, 페이드, 고리 햇빛 반응, 빛줄기 패스, 먼지). **헤드리스 렌더 한 번도 확인 안 됨** |
| 기본값 | `IntroShell.tsx`·`introStage.ts` 모두 `v2`(격자). archive는 `?look=archive` |

## 3. 작업과 수용 기준

| # | 작업 | 수용 기준 (모두 근거 파일과 함께 보고) |
|---|---|---|
| T1 | 불러오기 | `?look=archive`로 오류 없이 뜸(콘솔 오류 0, favicon 404 제외). 에셋 합계 크기·불러오기 시간 기록 |
| T2 | 카메라 경로 | p .25, .29, .33, .37, .41, .45, .49, .53, .57, .62, .67, .72 12장 시트. s1–s4 정지 렌더와 **구도가 같은 성격**(통로 소실점, 서가 끝면 시차, 사다리 위 사람 위치). 급한 꺾임·벽 관통 없음 |
| T3 | 밝기·색 | 웹 프레임과 같은 구도의 Blender 정지 렌더를 **수치로 비교**(평균 밝기, p5/p50/p95, 채도, 난색 R−B; 방법은 다락방 보고 `handoffs/ATTIC_BOOKSHELF_STUDY_2026-09-25.md` §3). 조정 대상: `archive.shared.uExposure`, 톤매핑 노출, `space.ts`의 `createGrade`. 3회 이내 반복, 수치 표로 보고 |
| T4 | 빛줄기·먼지 | 블라인드·서가 틈으로 **여러 갈래** 빛이 통로를 가로지름(한 덩어리 안개 아님). `vol.uniforms.uDensity/uIntensity` 조정. 사람 고리가 빛 갈래 안에서만 따뜻하게 밝아지는지 확인(`uSunOn`) |
| T5 | 사람 | 스캔 등장(p .45–.54), 고리가 팔다리를 따라 감김(H3b), 가까워질수록 촘촘해짐(H3c, `uRefDist`), 심장 박동·깊이 패스 정상, 몸이 방을 가리지 않음 |
| T6 | 전환 | 지구 → 서고(p .25–.31) 번쩍임·빈 화면 없음, 파형 무대 뒤 서고가 12 %로 어두워짐(p .64–.73), **파형 무대(Canvas 2D) 동작·수치 불변**(G1) |
| T7 | 성능 | 헤드리스 프레임 시간 기록(참고용, 실제 GPU 아님이라고 명시). 빛줄기 48단계 + 먼지 2,600 + 고리 몸 비용 메모 |
| T8 | 테스트 | `intro.spec`, `story.spec`, v2 단위, 루트 `npm test`가 **기본값 archive 상태에서** 통과 |
| T9 | 기본값 | T1–T8 통과 시에만 기본값을 archive로(`IntroShell.tsx`, `introStage.ts`). 실패 항목이 있으면 선택 사항으로 두고 이유 보고 |

캡처 방법: `node scripts/serve-v2.cjs`(빌드본 :4173) + `verification/r1-intro-20260929/capture.mjs`에 `EXTRA="&look=archive"`, `BASE=http://127.0.0.1:4173`. 브라우저 경로가 없으면 `PW_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. 결과는 `verification/r1-archive-web-<날짜>/`에.

## 4. 범위 밖 — 발행 채팅으로 되돌릴 것 (중요)

다음이 필요해 보이면 **구현하지 말고** `docs/uiux_system/handoffs/RETURN_ARCHIVE_WEB_<날짜>.md`에 제안(무엇을·왜·근거 캡처)을 적고 멈춘다. 발행 채팅이 검토해 계획을 고친 뒤 다시 내려보낸다.

- 시나리오·구도 변경(SPACE §3 표의 카메라 순서·대상, 새 장면·새 요소 추가, 서고 배치 변경)
- 사람 표현 변경(H3b vs H5, 메시 수정) — 사용자 결정 대기
- Story(P5), 지구 하강(P3), 글 요소(P4)
- 데이터 계약에 닿는 모든 것(파형·시간·단위·저장값)

## 5. 파일 소유 범위

| 수정 가능 | 수정 금지 |
|---|---|
| `archive.ts`, `introStage.ts`의 archive 분기·카메라, `figure.ts`의 셰이더 수치(구조 변경 금지), `IntroShell.tsx`의 기본값, `space.ts`의 `createGrade` 수치, `verification/r1-archive-web-*/`, `handoffs/RETURN_ARCHIVE_WEB_*.md`, (필요 시) 에셋 재압축 결과 | `docs/uiux_system/records/*`(F/D/O/R), `PLAN*.md`, `WORK_STATE.json`, `WORKLOG.md`, `rounds/R1/*` 보드, `body_seated.glb`·`heart.glb`·`build-intro-figure.py`, 파형 무대(`sweep.ts`, `waveUi.ts`, `beats.ts`) |

기록 번호가 겹치지 않게 F/D/O/R은 만들지 않는다 — 필요한 기록은 RETURN 문서 끝에 **초안**으로.

## 6. 데이터 계약

서고·빛·소품은 장식. 파형 꼭짓점·시간·진폭 눈금·수치는 저장값 그대로(파형 무대 코드 손대지 않음). 모니터·심전도 기계·용지에 파형을 그리지 않는다.

## 7. 반환

1. 작업 브랜치에 커밋·푸시(원격 반영 확인).
2. `verification/r1-archive-web-<날짜>/README.md`: T1–T9 표(PASS/CONDITIONAL/FAIL + 근거 파일), T3 수치 표, 캡처 시트, 남은 문제.
3. RETURN 문서(범위 밖 제안·기록 초안이 있으면).
4. 사용자에게 한국어 요약 + 브랜치 이름. 사용자가 발행 채팅에 "archive 웹 검증 브랜치 <이름> 검토해줘"라고 가져온다.

## 8. 새 세션 첫 메시지 (복사용)

```
origin/claude/r1-autopilot-recommended 최신 커밋을 기준으로, 이 세션에 지정된 작업 브랜치에서 작업해줘(claude/r1-autopilot-recommended에는 푸시하지 마).
docs/uiux_system/handoffs/IMPL_BRIEF_ARCHIVE_WEB_2026-10-02.md 를 읽고 §0 순서대로 문서를 읽은 뒤, §3 작업을 T1부터 진행해줘. §4 범위 밖이 필요해지면 구현하지 말고 RETURN 문서로 남기고 나에게 알려줘.
```
