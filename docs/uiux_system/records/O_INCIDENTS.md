# O — UI/UX Incidents

형식은 `../10_RECORD_KEEPING.md`를 따른다.  
판별 질문: **"같은 일이 또 나면 다시 시간을 잃는가?"**

---

## O-001. repository-wide execution lock이 stale 상태로 남아 관계없는 작업까지 막았다

| | |
|---|---|
| 시점 | 2026-09-16 `[대화]` `[커밋]` |
| 잃은 것 | UI/UX 문서 업로드 지연, 세션 간 병렬 작업 차단 |
| 재발 방지 | global mutex 폐기, resource-scoped conflict policy로 교체 |

### 증상
Work 사용량 제한으로 중단된 뒤 `execution_lock.active=true`가 남아 있었고, 실제 실행이 없는데도 Chat에서 UI/UX 시스템 문서를 GitHub에 반영하지 못했다. `[대화]`

### 원인
동시 실행 문제를 **세션/기기 존재 여부**로 모델링하고, 저장소 전체를 하나의 mutex로 잠갔다. 그러나 실제 충돌 위험은 같은 파일·같은 generated output·같은 release/deployment·같은 long-running job 등 **resource 단위**였다. `[추론]`

### 조치
`execution_lock`을 폐기하고 `WORK_STATE`를 상태/체크포인트 기록으로 되돌렸다. `WORK_RESUME_POLICY.md` v1.2와 `docs/23_concurrency_and_resume_policy_revision.md`에서 resource-scoped conflict만 조정하도록 변경했다. `[커밋]`

### 재발 방지와 자동화 상태
- 다른 세션이 있다는 이유만으로 관계없는 docs/UI/code 작업을 막지 않는다.
- 시작/재개 시 remote SHA와 관련 파일을 확인한다.
- 실제 충돌 resource만 `active_jobs` 등 advisory state로 표시할 수 있다.
- force push로 다른 변경을 덮지 않는다.

자동 검사는 아니지만 `AGENTS.md`, `WORK_RESUME_POLICY.md`, `00_UIUX_MASTER.md`의 상위 운영 규칙으로 승급됐다. `[커밋]`

## O-002. OpenCV를 설치하다 시스템 numpy가 2.x로 올라가 Blender(bpy)가 깨졌다

| | |
|---|---|
| 시점 | 2026-09-26, AI 영상 입고 QA 도구 준비 중 `[런타임]` |
| 잃은 것 | 되돌리기 1회, 이후 모든 Blender 베이크·렌더 스크립트가 깨질 위험 |
| 재발 방지 | 시스템 파이썬은 numpy 1.26 고정 + OpenCV 4.10(호환판). torch·transformers 같은 ML 의존성은 별도 가상환경 |

### 증상
`pip install opencv-python-headless`가 최신 OpenCV와 함께 numpy 2.4.6을 설치했고, pip가 "bpy 4.5.3 requires numpy<2.0" 경고를 냈다 `[런타임]`.

### 원인
bpy·OpenCV·torch가 같은 시스템 파이썬을 공유하는데 버전 고정이 없었다 `[추론]`.

### 조치
`numpy>=1.26,<2.0`과 `opencv-python-headless==4.10.0.84`로 되돌리고 `import bpy`를 확인했다. 깊이 추정(torch 2.14 CPU, transformers 5.17, torchvision)은 scratchpad 가상환경에 따로 설치했다 `[런타임]`.

### 재발 방지와 자동화 상태
- 시스템 파이썬에 패키지를 더할 때는 `import bpy`를 바로 확인한다.
- 무거운 ML 의존성은 가상환경에서만. `25` §3 스택 기준에 명시. 자동 검사는 없음.

## O-003. 사용자가 로컬에서 AI 영상 플레이어를 열자 `loading frames 0%`에서 멈췄다

| | |
|---|---|
| 시점 | 2026-09-26, 사용자 로컬 확인 "loading frame 0%에서 바뀌지 않네. readme도 없는데" `[대화]` |
| 잃은 것 | 사용자 검증 시도 1회, 신뢰 |
| 재발 방지 | 생성 데이터에 의존하는 spike는 준비 명령·README·누락 시 화면 안내를 갖추고, 깨끗한 클론 기준으로 확인한다 |

### 증상
플레이어가 로딩 화면에서 오류 표시 없이 0 %에 머물렀다 `[대화]`.

### 원인
플레이어가 읽는 `public/clips/`는 `.gitignore` 대상이었고, 대역 영상 원본(다락방·지구 렌더, 깊이 맵)은 AI의 scratchpad에만 있었다 `[코드]`. 매니페스트 요청이 실패하면 예외만 나고 화면은 초기 문구(0 %)에 그대로 남았다 `[코드]`. AI의 모든 시험은 원본이 있는 컨테이너에서만 돌았다 — "내 환경에서 PASS"가 "받은 사람도 실행 가능"을 뜻하지 않았다 `[추론]`.

### 조치
대역 원본을 재압축해 `prototype/spikes/video-scrub/standins/`(5.3 MB)로 커밋, `npm run clips` 한 번으로 시험 영상 5개 생성, 매니페스트·프레임이 없으면 이유와 명령을 화면에 표시, README(준비·URL별 확인 항목)를 추가했다. `public/clips/`를 지운 상태에서 `npm run clips` → 개발 서버에서 없는 클립 안내·pan·attic·globe 로딩을 확인했다 `[테스트]`.

### 재발 방지와 자동화 상태
- spike를 "사용자가 확인할 수 있다"고 보고하기 전에: README, 준비 명령, 누락 안내, 커밋된 원본만으로 재생성되는지(깨끗한 상태) 확인.
- 자동 검사 없음 — 체크리스트 §9(커밋 전)에 항목 추가.

## O-004. 한국어 Windows에서 파이썬 도구가 UTF-8 JSON을 cp949로 읽다가 멈췄다 — 반복되던 오류

| | |
|---|---|
| 시점 | 2026-09-27, 사용자 로컬 `npm run clips` 실행 `[대화]` |
| 잃은 것 | 사용자 확인 시도 1회. 사용자 말: "cp 949 에러는 항상 생기는 오류인데, 매번 강제로 utf-8로 읽도록 수정해야 하니 번거롭네" |
| 재발 방지 | `tests/encoding.test.cjs`(npm test 포함, `npm run encoding:check`) + 스크립트 실행 시 `PYTHONUTF8=1` |

### 증상
`check_video.py` 23번 줄 `json.load(open(a.brief))`에서 `UnicodeDecodeError: 'cp949' codec can't decode byte 0xe2` — 브리프 JSON의 UTF-8 문자(×, — 등) `[대화]`.

### 원인
파이썬은 `open()`에 encoding이 없으면 OS 로캘 인코딩을 쓴다. 한국어 Windows는 cp949, AI가 시험하는 Linux 컨테이너는 UTF-8이라 AI 쪽 시험에서는 한 번도 드러나지 않았다 `[추론]`. 저장소 파이썬 18개 파일에 인코딩 없는 텍스트 파일 접근이 30곳 있었다 `[코드]`.

### 조치
30곳 모두 `encoding='utf-8'` 추가(바이너리 `rb`·`Image.open`·`urlopen` 제외). 모든 파일 `py_compile` 통과. 정적 검사 테스트를 만들어 수정 전 `check_video.py`로 되돌리면 23·117·149·150번 줄 4곳을 잡는 것을 확인했다 `[테스트]`. Windows 실기 재실행: 사용자가 이후 로컬에서 `attic_est` 클립을 열어 녹화함 — 클립 생성이 Windows에서 통과한 것으로 확인 `[영상]`.

### 재발 방지와 자동화 상태
- **자동화됨**: `npm test`가 모든 추적 파이썬 파일의 `open`/`read_text`/`write_text`에 인코딩이 있는지 검사(검사기 자체 시험 7개 포함).
- Node에서 파이썬을 부를 때는 `PYTHONUTF8=1`을 넘긴다(두 번째 방어).
- 체크리스트 §9에 "Windows(cp949) 사용자" 항목.


## O-005. 사용자가 로컬 확인 전마다 Windows 호환 오류(cp949·`&&`·호환성)를 손으로 고쳐야 했다

| | |
|---|---|
| 시점 | 2026-09-28, 사용자 "로컬에서 실행할 때 항상 오류가 발생하는데 … 윈도우 vs code의 터미널에서 실행하는데. 매번 cp949 오류나 호환성 오류, 터미널에서 &&를 받지 못해 발생하는 오류 등 로컬 확인 전 자잘하게 수정해야 하는게 번거롭네." `[대화]` |
| 잃은 것 | 매 확인마다 사용자 수정 시간(횟수 기록 없음). O-003·O-004와 같은 계열의 반복 |
| 재발 방지 | `npm run …` 단일 진입점(`scripts/local/run.mjs`), VS Code 작업(cmd.exe), `tests/portability.test.cjs`(npm test 포함), `docs/LOCAL_WINDOWS.md` |

### 증상
사용자 보고: cp949 오류, 호환성 오류, PowerShell이 `&&`를 받지 못하는 오류 `[대화]`. 저장소 점검 결과 `[코드]`:
- 실행 안내가 `a && b`, `python3 …` 형태(Windows PowerShell 5.1은 `&&` 미지원, Windows에는 `python3`가 없거나 스토어 안내용 가짜 실행 파일).
- 스파이크 npm 스크립트 4곳이 `python3` 고정.
- 캡처·QA 스크립트 13곳이 컨테이너 전용 브라우저 경로(`/opt/pw-browsers/…`) 고정.
- `prepare-v2.cjs`가 실행할 때마다 `methods.json`을 옛 문구로 덮어씀(R-a, 2026-09-25 기준선 분석에서 알려졌으나 고치지 않았음).
- 영상 도구 설치 안내가 클라우드용 numpy 1.26 고정(Blender 전용)이라 Python 3.14 휠이 없음.
- 설치된 Playwright가 기대하는 브라우저 빌드와 실제 설치 빌드가 다르면 테스트가 바로 실패.

### 원인
AI가 시험하는 곳이 Linux 컨테이너(bash, UTF-8, `python3`, 고정 브라우저 경로)뿐이었고, 실행 안내도 그 환경의 문법으로 썼다 `[추론]`. O-004(cp949)는 파이썬 인코딩만 막았고 명령·경로·도구 버전은 다루지 않았다.

### 조치
- `scripts/local/run.mjs` + 루트 npm 스크립트: `doctor`(환경 점검, Playwright가 기대하는 빌드 확인), `story`, `story:check`, `spike -- <이름>`, `py -- <스크립트>`(py → python → python3, UTF-8 강제), `py:setup`(로컬용 요구사항), `browsers`, `v2:prepare`.
- 스파이크 스크립트의 `python3` → `run.mjs py`. 브라우저 경로 13곳 → `PW_EXECUTABLE` → (Linux만) 컨테이너 경로 → Playwright 기본.
- `prepare-v2.cjs`는 기존 `methods.json`을 유지(`--methods`일 때만 다시 생성).
- `.vscode/tasks.json`(Windows에서 cmd.exe로 실행 — 실행 정책·`&&` 회피), `.vscode/settings.json`(터미널 `PYTHONUTF8=1`).
- `.gitattributes`로 작업 폴더 LF 고정. 기록 검사기는 CRLF를 정규화 — 단, CRLF 사본 시뮬레이션에서 기존 검사기도 통과했으므로 이 둘은 **관측된 실패의 수정이 아니라 예방**이다 `[테스트]`.
- 이 컨테이너에서 확인: `npm run doctor`, `npm run py`(한글 출력), 자료를 지운 상태에서 `npm run story:check`(자료 재생성·`methods.json` 유지·빌드·단위 15/16·브라우저 5 PASS), `npm run story` 개발 서버 200 `[테스트]`. **Windows 실기 확인은 사용자 몫** — 미검증.

### 재발 방지와 자동화 상태
- **자동화됨**: `tests/portability.test.cjs`(npm test) — npm 스크립트의 `python3`·`VAR=` 접두·POSIX 명령·작은따옴표·`$VAR` 금지, 대체 경로 없는 `/opt/pw-browsers` 금지, Windows 파이썬 탐색 순서, CRLF 사본에서 기록 검사 통과.
- 체크리스트 §9와 AGENTS.md: 사용자에게 주는 실행 안내는 `npm run …` 한 줄 형식.

### 후속 (2026-09-28, 같은 날) — CRLF가 실제로 깨뜨린 곳
사용자 Windows 실행: `SyntaxError: Unexpected non-whitespace character after JSON at position 2987852` at `prepare-v2.cjs:3` `[대화]`. 원인: `prepare-v2.cjs`가 `data/*.js`에서 JSON 끝을 `';\n'`으로 찾았는데, `.gitattributes` 이전에 받은 Windows 작업 폴더는 CRLF(`;\r\n`)라 찾지 못하고 뒤 코드까지 파싱했다. 앞의 "CRLF는 예방"이라는 판단은 기록 검사기에 대해서만 맞았고, **데이터 파서는 실제로 깨졌다** — 정정. 조치: 파서를 `scripts/lib/data-file.cjs`로 분리(`/;\r?\n/`), 컨테이너에서 CRLF 사본으로 옛 파서 실패 재현 → 새 파서 통과(98 장면) 확인 `[테스트]`. `tests/portability.test.cjs`에 `data/bank.js`·`data/extension.js`의 LF/CRLF 파싱 동일성 검사 추가. `doctor`는 pull이 다시 쓰지 않는 파일(`data/bank.js` 등)로 CRLF를 판정(전에는 `package.json`만 봐서 놓쳤다).

## O-006. 도입부 헤드리스 캡처가 반복해서 멈췄다 — Canvas 2D 블러 필터(소프트웨어 렌더)와 적용되지 않은 스크립트 수정

| | |
|---|---|
| 시점 | 2026-09-29, R1 도입부 구현 검증 중 `[런타임]` |
| 잃은 것 | 캡처 재시도 약 6회(각 2–10분). 두 번은 코드 수정에 따른 개발 서버 새로고침으로 중단 |
| 재발 방지 | 캡처는 빌드본(`scripts/serve-v2.cjs`, :4173)으로, 캡처 중 `__intro.pause(true)`, 시간 걷기는 `renderOnce(false)`(상태만), 파형 발광은 필터 없는 축소·확대 방식 |

### 증상
p ≥ 0.86(파형이 그려지는 구간)에서 `page.screenshot`이 30초 제한을 넘겼다. 멈추지 않은 프레임은 파형이 머리 근처만 그려져 있었다.

### 원인
1. 파형 발광을 매 프레임 `ctx.filter = blur(…)`로 3겹 × 2파형 그렸다. 헤드리스(SwiftShader, GPU 없음)에서 Canvas 2D 필터가 페인트 단계에서 매우 느렸다. 필터를 끄면 즉시 통과했다(`noblur` 실험) `[런타임]`.
2. 캡처 스크립트의 "시간 걷기" 부분을 `renderOnce(false)`로 바꾸는 수정이 문자열 불일치로 **적용되지 않았는데** 확인하지 않았다. 그래서 상태마다 73프레임을 실제로 그렸고(WebGL + bloom + 파형), 1.2초만 걸어가서 파형이 짧게 보였다 `[코드]`.
3. 화면 배경이 #050608 대신 (24, 28, 37)로 떠 보였다 — WebGL 지우기 색이 출력 단계에서 밝아졌다. 검정(0x000000)으로 바꿔 해결(원인 미확정, 기록만) `[런타임]`.

### 조치
- 발광: 반해상도에 한 번 그린 선을 1/4·1/8로 두 번 줄인 뒤 확대해 겹침(필터 없음). 초점 이동(X4)은 선명한 중심선과 1/2 단계의 투명도 교차. 전시 PC GPU가 약해도 유리하다.
- 캡처: 빌드본 사용, 자동 렌더 정지, 상태 계산과 그리기 분리, 스크립트 수정 후 해당 줄을 다시 읽어 확인.

### 재발 방지와 자동화 상태
캡처 스크립트(`verification/r1-intro-20260929/capture.mjs`)가 빌드본·자동 렌더 정지·상태/그리기 분리를 기본으로 한다. 동기화는 `browser-tests/intro.spec.ts`가 자동 검사한다. 스크립트 수정의 적용 여부 확인은 수동 규칙이다(자동화 없음).

## O-007. "사람 3D 에셋을 고품질로 다시 제작" 요구를 셰이더 교체로 대체해 한 라운드를 잃었다

| | |
|---|---|
| 시점 | 2026-10-01, R1 도입부 첫 시도(e4db982) 보고 후 `[대화]` |
| 잃은 것 | 구현·캡처·보고 한 라운드(약 1시간)와 사용자 확인 1회. 머리·눈·입 문제는 그대로 남음 |
| 재발 방지 | 통합 계획 문서의 요구 추적표(`rounds/R1/PLAN-R1-INTRO-STORY-V2.md` §1–2)를 착수·보고 때마다 행 단위로 대조(R-018) |

### 증상
사용자: "사람 3d 에셋부터 고퀄리티로 다시 만들어달라는 내용이 적용 안되었네." / "사람 머리 부분 형태도 좀 이상하고, 애초에 눈과 입이 있을 필요가 없는데 들어가 있어서 불쾌해." `[대화]`

### 원인
1. 사용자 피드백(사람 품질이 가장 문제)과 AI 선택지(H1–H4 "표현 양식")를 같은 것으로 취급했다. H3(고리 셰이더)를 고르면 형태 문제도 풀린다고 가정했고, 메시 자체(머리 조형·눈·입 구멍·손·비율)는 검토하지 않았다 `[추론]`.
2. 사용자 지적이 여러 메시지에 나뉘어 있었고(품질 → 테마 분리 → 목록화·권장안 구현), 요구를 한 표로 묶지 않은 채 가장 최근 메시지만 기준으로 구현했다.
3. 자체 피드백 13개 중 구현·계획된 것이 무엇인지 보고에서 추적하지 않았다.

### 조치
통합 계획 문서 작성: 대화 흐름 9단계, 사용자 요구 U1–U19와 AI 피드백 A1–A13의 상태(✅/◐/✗/⏸), 단계 P0–P5. 사람 에셋은 새 CC0 메시(Blender Studio Human Base Meshes)에서 머리 재조형(눈·입 없음)·손·자세·리그까지 수용 기준을 두고 다시 만든다.

### 재발 방지와 자동화 상태
수동 규칙(R-018). 자동화 없음.

## O-008. 서고 웹의 해 깊이 지도를 한 번도 그리지 않아 빛줄기·먼지·고리 햇빛이 모두 0이었는데 "연결됨"으로 위임했다

| | |
|---|---|
| 시점 | 2026-10-02 브리프 1 발행 → 2026-10-03 위임 세션이 발견(브랜치 `claude/r1-autopilot-impl-3d1b78`, 98cba13) `[런타임]` |
| 잃은 것 | 위임 세션의 조사 시간(밀도를 바꿔도 수치가 같아 원인 추적), T3 밝기 조정 1회 재측정. 사용자 시간 손실은 없음(위임 세션이 잡음) |
| 재발 방지 | R-019 |

### 증상
위임 세션 보고: "`renderSunDepth()`가 한 번도 호출되지 않아 해 깊이 지도가 비어 빛줄기·먼지·고리 햇빛 반응이 모두 0이었음(밀도를 바꿔도 수치 동일로 발견)." `[런타임]`

### 원인
1. 계획 채팅이 `archive.ts`에 `renderSunDepth()`를 만들고 `introStage.ts`에서 부르지 않았다 `[코드]`.
2. 발행 직전 확인은 p .45·.53 두 장이 "오류 없이 렌더됨"과 "먼지 보임"까지였다. 빛줄기가 실제로 깊이 지도로 가려지는지는 보지 않았고, 브리프 §2에 "빛줄기 패스 연결"로 적었다 `[대화]`. 먼지로 보인 것은 다른 원인(지터·안개)일 수 있었다 `[추론]`.

### 조치
위임 세션이 호출을 추가하고 블라인드 갈래를 확인(`T4_shafts_fixed.jpg`). 검토 문서 `handoffs/REVIEW_FIGURE_V3_WEB_2026-10-03.md`.

### 재발 방지와 자동화 상태
수동 규칙 R-019. 자동화 후보: 캡처 스크립트에 "세기 0 대 기본값" 비교 단계 추가(미착수).

## O-009. A-P2 자산 전달·패스 호환·공유 QA 세션 문제로 시험 캡처를 다시 실행했다

| | |
|---|---|
| 시점 | 2026-10-06 [코드] [런타임] |
| 잃은 것 | 부분 다운로드 pin 복구, 로딩/검은 화면/오류 오염 캡처와 공유 browser 겹침으로 추가 조사·재실행. 정확한 소요분 기록 없음 |
| 재발 방지 | 기존 resource-scoped 규칙과 실제 프레임 검증 적용; 신규 R 없음 |

### 증상
Snow 요청이 timeout 나며 앞서 받은 LUT/REMA의 trailing registry pin 저장도 빠졌다. `.gz` 응답은 browser가 이미 해제해 명시 decoder가 실패. Three r186 ShaderPass의 quad API와 UniformsUtils의 RT texture clone 때문에 검은 화면이 나왔다. 해결된 오류가 세션 로그에 남았다. 두 QA가 같은 a-climb browser를 겹쳐 사용해 증거 신뢰를 잃었다.

### 원인
성공 batch 마지막에만 pin을 쓰는 유틸리티, 압축 extension과 실제 전달 규약 불일치, 버전 API/texture identity 미검증, tool session 반환을 작업 완료로 취급한 resource scheduling 실수.

### 조치
받은 원본 hash만 고정하고 Snow를 제외했다. fetch 유틸리티는 성공 건마다 pin 및 generated hash 확인. gzip payload의 중립 `.bin` suffix와 명시 decoder, 공개 super.render 경로, RT 실제 texture 재연결. QA browser를 종료/재개하고 작업 완료 뒤 다음 검증을 실행. 중첩 결과 INVALID 표시 및 단독 authoritative 캡처 저장. 극점 no-data/재질 seam은 source 변경 없이 display mesh 결함으로 복구했다.

### 재발 방지와 자동화 상태
registry 성공 pin/생성hash 검증은 코드에 반영. 브라우저 직렬 실행과 깨끗한 로그 확인은 수동 규칙이며 자동 resource-lock 미구현. 불완전/실패 trial을 최종 PASS와 섞지 않는다.

## O-010. 새 구름 시험의 깊이 정밀도·RT texture 연결과 검증 재개 비용

| | |
|---|---|
| 시점 | 2026-10-06 [코드] [런타임] |
| 잃은 것 | 초기alias/RT경고분리·카메라복구 및 Windows빌드/Chromium재개 재실행; 정확한 소요분 기록 없음 |
| 재발 방지 | O-009의버전/texture identity와 실제프레임·resource직렬검증 규칙 적용; 새R 없음 |

### 증상
Earth far12/near.000025고정에서전경깊이정밀도가낮아동심패턴, RT texture복제로경고. Vite기본권한realpath EPERM과freshChromium연결실패/대기중단이있었다. 일회capture script cwd를root로잘못실행하여MODULE_NOT_FOUND, 경로수정뒤실행.

### 원인
행성전경/근접을같은작은near로처리했고 ShaderPassuniform복제후실제RTtexture재연결이빠졌다. 새프로세스와같은browser세션재시작경계를즉시연속실행한것도진단에시간을썼다. 품질미달의단독원인으로확정하지않는다.

### 조치
adaptiveEarthnear/별도ground-depth/실제RTtexture/groundprogramkey복구. archivecamera범위복구. 권한승인된로컬buildPASS, 설치Chromium명시별도open후fresh3frame/errors0/RTX3070확인. 누적console경고와fresh로그를구분. 브라우저jobs는완료후직렬로실행했다.

### 재발 방지와 자동화 상태
소스에near/textureidentity복구와실험opt-in반영. source/asset hash와frame/state/오류로그를보존. 자동resource-lock/nearprecisionassert는미구현. fresh검증실패를완료로기록하지않는다.

## O-011. Cycles GPU 요청과 browser 렌더 성공의 실제 장치 불일치

| | |
|---|---|
| 시점 | 2026-10-06 [런타임] [코드] |
| 잃은 것 | CUDA queue 실패/느린 CPU fallback/CLI WebGL context 실패 진단과 대체 QA; 정확한 소요분 미기록 |
| 연결 | D-075, F-046 |

### 증상
cuInit Invalid value와 Cycles queue 오류. 새 CLI Chromium의 빈 canvas WebGL/WebGL2도 false, BindToCurrentSequence 실패. IAB에서는 렌더되지만 Microsoft Basic Render Driver software. CUDA/OPTIX/isolated 중단 자료와 final-reference 완료 자료 분리.

### 원인
렌더 환경에서 GPU 장치가 열거되지 않았고 CLI context 생성이 실패한 것은 확인. 구체적인 driver/권한 원인과 두 증상 사이 인과는 미확정. scene.cycles.device=GPU 표시는 실제 장치 확인이 아니다. 초기 모든 browser 불가 판단은 IAB software 성공 후 정정.

### 조치
Cycles 장치실제목록 검사/CPU fallback명시. 사용자앱/driver reset 없이 IAB read-only UI검증과 query-only fixedframe harness/loopback save 사용. software 렌더부하가 CDP3sec timeout을 일으켜 즉시 DOMwait 대신 저장된 artifact 완료를 확인했다. Python 리뷰를 bpy용별도runtime에서 잘못실행해 PIL누락; bundled Python으로 복구. build/pycompile PASS.

### 재발 방지와 자동화 상태
GPUflag/device목록/renderer/vendor/실측query를 분리. source/asset pin과 scope 포함 metrics를 자동 생성. hardware timing/정역영상 재개는 미완. 일반 renderer 성공을 목표장치 성능으로 확대하지 않는다. 기존 R034 증거범위 규칙 적용, 새 R 없음.

## O-012. 고정 canvas stage가 스크롤 wrapper의 입력을 가로막음

| | |
|---|---|
| 시점 | 2026-10-06 |
| 상태 | 해결 / 실제 휠 경로 확인 |
| 연결 | F-052, D-081 |
| 원인 | #wrap의형제인fixed #stage/gl이휠hit대상,wrapper이벤트경로밖 |

### 증상
첫화면위에서휠을움직여도wrapperTop0이며다음장면확인불가.

### 원인
 [코드][캡처] fixed #stage/gl이 #wrap의 형제이므로 wrapper에 바인딩된 스크롤 입력을 받지 못했다.

### 조치
#stage pointer-events:none,QA/loading auto. 실제입력에서QA lock해제. reviewCapture로고정progress없이실제움직임증거저장.

### 검증과 한계
native wheel: content hit/scrollTop1254→3914/서고및심장파형도달. fixedset/path결과와분리. 구름질감/연출완성도성공은아님.

### 재발 방지와 자동화 상태
고정프레임/harness검증외에실제휠로첫화면→서고왕복경로를검증한다.

## O-013. 정적 호스트의 gzip 자동 해제로 지형 타일 이중 디코딩 실패

| | |
|---|---|
| 시점 | 2026-10-07 [코드] [캡처] |
| 상태 | 해결 / 실제3구도 로딩오류0 |
| 연결 | D-092, F-060 |
| 원인 | fetch가이미gzipdecode한payload에DecompressionStream을다시적용 |

### 증상
build성공후실제미리보기geometry0/Tile decode failed. coarse0-0 실제8512bytes를gzip으로다시해제했다.

### 원인
서버의압축전송처리와애플리케이션자체압축해제를구분하지않았다. 원본3895bytes/해제8512bytes 실제대조.

### 조치
gzipmagic1f8b인경우만해제,예상geometrybyteLength검증. 실패tile무한재요청방지. 기존Vite config.mjs에새entry를추가해terrain.html이실제build에포함되도록복구. 초기PCFSoftShadowMap경고는현재Three공식PCFShadowMap으로변경.

### 검증과 한계
IAB3구도/왕복새capture에서errors0,geometry렌더확인. 256gzip원본과index/hash검증. GPU성능과전체전이는미검증.

### 재발 방지와 자동화 상태
압축자산은원본압축/HTTP자동decode양쪽을지원하고length를검증한다. build출력에별도entry존재확인후실제로딩·화면을확인한다. geometry 검증script는추가했으나자동HTTPdecode두경로회귀테스트는미추가.

## O-014. 북반구 연결 후보의 패스 interface·uniform 복제와 native 장치 복원

| | |
|---|---|
| 시점 | 2026-10-07 [코드] [캡처] [로그] |
| 상태 | 해결 / native3장 완료와 실제 가림 확인 |
| 연결 | D-093, F-061 |
| 원인 | 새cloudPass에uAspect부재,ShaderPass복제된uniform을외부준비값과혼동 |

### 증상
첫resize에서undefined.value오류. 이후준비상태true·오류0인데p.319에서구름가림보이지않음. native재개렌더의두번째shot예상12분대.

### 원인
기존resize계약의uAspect를누락. ShaderPass가복제한uniform과원래객체가달라texture/ready외부변경은렌더에반영되지않음. native scene을열때Cyclespreferences/device설정은복원하지않음;첫실행장치미검증이므로CPU라고확정하지않음.

### 조치
uAspect/crop계약추가. shaderPass.uniforms.uCloud/uReady직접갱신·state도실제uniform기준. 실패전9capture와첫nativePNG/로그보존. 정확한workspacePython+script명인자자체job만중지하고OptiX활성명시로재렌더. 기본CIM권한부족은escalation승인후동일자체process종료로해결.

### 검증과 한계
최종native장치RTX3070OptiX true/CPU false와3PNG/hash확인. 웹p.319실제로회색VDBinside가림을확인후9capture재저장. uniform준비값이독립적인visualPASS가아님. 지역livevolume/전체motion성능미검증.

### 재발 방지와 자동화 상태
후처리interface/복제uniform의실제render객체와loadingstate를일치시킨다. nativejob재개는preferences/장치활성출력을고정한다. 실제효과off/on/pixel기여로확인한다. 이번에uniform복제자동회귀테스트는미추가.

## O-015. 웹·native 카메라의 수평/수직 FOV 혼동으로 부분 경로 재렌더

2026-10-07 [코드] [렌더] · D098.

### 증상
Cycles 첫7frame에서 cam.angle47을horizontal sensorfit에 적용. 웹camera.fov47은verticalFOV여서 같은 위치에서도 crop/구도 불일치. 첫7native파일과manifest는 rejected-horizontal-fov에 보존.

### 원인과 영향
동일숫자만 확인하고FOV축을고정하지 못함. 초기7장 렌더비용을 잃었으며 외부preview로채택하지 않음. 별도CPUactualnormal32ms시험은 기능오류가아니라 비용 gate에서미채택.

### 조치
자체실행session Ctrl-C 종료 후 sensorfitVERTICAL/sensorheight24/lens=24/(2tan(47/2))로40frame 재렌더. 웹(x,y,z)→native(x,-z,y)과startcamera p.280 좌표 고정. 최종manifest40/hash/직접native및IAB접근캡처확인. Windowsregistry read_text cp949오류는UTF8명시로복구, packaging완료.

### 재발 방지와 자동화 상태
camera좌표·look·FOV축·aspect·color pipeline을같이핀한다. 본스크립트에verticalsensor명시. 자동native/web投影동일성테스트는미추가; 직접구도접합TUNE유지.

## O-016. 렌더 타깃 uniform 복제로 초기 live volume 합성이 검게 나옴

2026-10-07 [코드] [캡처] · D100. O014의 유사패턴 재발.

### 증상
live volume/terrain ready true와 shader error0에도 .300 canvas 검은 화면. clone renderTarget texture warning 발생.

### 원인과 영향
ShaderPass plain shader uniform의 volumeTarget.texture를 clone할때 null이됨. initial build66PASS는 시각기능증거아님. 초기검은캡처는owntrial에서덮었고원본PNG별도보존없음, 도구스크린샷이증거. JS밀도probe도parse성공후scalar불일치로별도REJECT.

### 조치
composite생성시tCloud null, 생성후actualuniform에volumeTarget.texture 직접대입. 실제화면확인/13구도재캡처. primaryPython packaging의cp949오류는명시UTF8로복구. native변환환경은workspace격리, sandbox실행제약은해당nativeexe만승격.

### 재발 방지와 자동화 상태
기존O014 지침을 실제postpass수정시확인해야함. runtime renderTargetuniform은constructor후직접부착. 자동회귀test미추가, 실제nativecanvas와off/on기여확인. 관련report ECG_A_cloud_live_same_scene_review_2026-10-07.md.


## O-017. Cloud shadow 주입 shader 변수와 기존 terrain 변수 충돌

2026-10-07 [코드] [런타임] · D102.

### 증상
최초 field 캡처에서 MeshPhysicalMaterial fragment compile error `edge : redefinition`. native first trial PNG/JSON 보존.

### 원인과 영향
onBeforeCompile 기존 shader에 같은 scope로 shadow 변수 edge를주입. build통과가실제shadercompile통과가아님. 초기지형이정상렌더되지않음.

### 조치
주입부 독립 block scope로 격리. 최종browser13fixed/12benchmark와실제wheel 확인, 후속오류없음. 도구로그 과거timestamp14:39:20 오류는보존되고새오류와구별.

### 재발 방지와 자동화 상태
shader주입변수namespace/scope를 확인하고nativecanvas를본다. 자동shader회귀test미추가, actualcompiledview근거. 상세 docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_A_cloud_field_production_review_2026-10-07.md


## O-018. Cloud optical chain에 이미 조명된 terrain을 넣은 이중 조명 시험

2026-10-08 [코드] [브라우저] · D104.
### 증상
첫 북유럽 시험에서 기존 PBR 지형의 빛과 Aerial sun/sky가 중복. rejected-double-light PNG/JSON 보존.
### 원인과 영향
Aerial input albedo 계약과 기존 rendered radiance 계약 불일치. texture/geometry unchanged만으로 조명 동일성은 성립하지 않는다.
### 조치
후보 MeshBasic albedo로 map/color/geometryhandoff 유지, Aerial Lambert에 단일 lighting 위임. 기본mainPBR 미변경.
### 재발 방지와 자동화 상태
새후처리 source의 입력색 의미/normal/depth/unit을 읽고 actualON/OFF 동일구도로 점검. 자동회귀test미추가, 북유럽시각TUNE/normalborder한계는 별도열림.

## O-019. 지원되지 않는 Effect.enabled 때문에 cloud OFF 대조가 무효였다

2026-10-08 [코드] [브라우저] [캡처] · D105 / F071 / CASE-007.

### 증상
D104의 north cloud OFF checkbox는 바뀌었지만, CloudsEffect는 렌더 패스에 남아 있었다.
### 원인과 영향
postprocessing Effect에는 Pass.enabled 제어가 없다. JavaScript에 속성을 추가해도 실행 목록은 바뀌지 않았다. D104 OFF 이미지와 p50/p95는 cloud OFF/증분 비용의 증거로 사용할 수 없다.
### 조치
EffectPass.setEffects와 recompile로 cloud를 제외하고 aerial overlay/shadow/shadowLength를 해제. native OFF에서 cloudPassAttached=false 확인. D104 원본 파일을 보존하고 보고서/갤러리/manifest에 정정 근거를 추가했다.
### 재발 방지와 자동화 상태
옵션 존재 여부를 source/type에서 확인하고, checkbox 변화와 렌더 기여의 실제 제거를 함께 확인한다. 별도 자동 회귀 테스트는 추가하지 않았다. D105 native ON/OFF가 기능 근거이며 software 상태의 성능 증거는 없다.

## O-020. GPU 컨텍스트 상실 뒤 소프트웨어 렌더로 전환된 구름 시험

2026-10-08 [런타임] [캡처] · D105 / F071 / CASE-007.

### 증상
북유럽 시험 중 Context Lost가 기록됐고 흰 프레임2쌍이 저장됐다. 이후 UI 입력이 지연됐으며 native renderer가 Microsoft Basic Render Driver로 바뀌었다.
### 원인과 영향
근본 원인(드라이버/메모리/watchdog)은 미확정. 흰 프레임의 renderer null과 과거 GPU query를 성능 근거로 사용하지 않는다. 정상 이미지 복구와 하드웨어 렌더 복구는 별개다.
### 조치
실패 PNG/JSON을 rejected-context에 보존. lost context 때 렌더 루프와 정상 저장을 중단. Basic 원형에서 북유럽 리소스를 lazy 초기화하고 25% 진단 옵션 추가. software에서 six fixed north pose와 OFF 기능을 확인했지만 GPU timer unavailable, 하드웨어 near-field 품질/안정성 재검증은 남았다.
### 재발 방지와 자동화 상태
각 native 캡처에 renderer/context/품질/층/패스 연결 조건을 기록한다. 고부하 시험의 결과 불명은 성공으로 처리하지 않는다. 테스트 PC GPU 복구 후 high six-pose 및 연속 움직임 확인이 필요하다. 사용자의 다른 앱이나 GPU 설정은 변경하지 않았다.

### D106 후속 검증 — 2026-10-08
사용자 새로고침 후 RTX3070/timer 회복을 실제로 확인했다. source와 최신 north high 세 조건×6구도, 별도 옵션 대조를 저장했고 새context loss/warn/error는 미관찰. 이 범위의 회복 확인으로 진행을 재개했으나 원래 컴퓨터 전체 중단 원인이 해결됐다고 결론 내리지 않는다. 장기/연속scroll/targetPC 검증은 남아 있다. D106/F072 및 ECG_A_takram_hardware_recheck_2026-10-08.md가 현재 기준이다.
