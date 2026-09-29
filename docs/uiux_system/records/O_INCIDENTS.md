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
