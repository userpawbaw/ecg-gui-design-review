# 로컬 세션 작업 지시서 — 레퍼런스·우리 앱 프레임 단위 분석 도구 만들기

작성: 2026-09-30 · 발행 세션: 클라우드 세션(브랜치 `ccr-efb769e0-o5cmli`, 기준 커밋 `602bc89`)
대상: 사용자 Windows PC에서 실행하는 **로컬 Claude Code 세션**
배경 `[대화]`:
> "로컬 세션에서 직접 만들게 할게. 어떻게 지시하면 될 지 문서로 작성해줘." — 사용자, 2026-09-30

클라우드 컨테이너에서는 두 가지가 막혀 있다. ① 헤드리스 Chromium이 에이전트 프록시 인증서를 신뢰하지 않아 외부 레퍼런스 사이트를 열 수 없다(R-016). ② GPU가 없어 WebGL 화면이 초당 1.6–4프레임으로만 그려진다. 그래서 `REFMINE-R1-INTRO-ASSET.md`의 레퍼런스 12개는 제작기·소스만 근거로 한 L1이다. 사용자 PC에서는 두 문제가 모두 없다.

---

## 1. 사용자가 할 일 (순서대로)

### 1.1 준비 (처음 한 번)

1. Claude Code 로컬 설치: https://code.claude.com/docs (설치 안내대로. VS Code 확장도 가능)
2. VS Code 터미널에서 저장소 폴더를 연 뒤 아래 줄을 **한 줄씩** 실행한다.

```
git fetch origin
git switch ccr-efb769e0-o5cmli
git pull
npm run doctor
```

`npm run doctor`가 `[문제]`를 내면 그 안내부터 해결한다(`docs/LOCAL_WINDOWS.md`).

### 1.2 로컬 Claude Code에 붙여 넣을 지시문

터미널에서 저장소 폴더를 연 채로 Claude Code를 실행하고, 아래 블록을 그대로 붙여 넣는다.

```text
docs/uiux_system/handoffs/LOCAL_CAPTURE_TOOL_BRIEF_2026-09-30.md 를 읽고 §2~§8대로
레퍼런스·우리 앱 프레임 단위 분석 도구를 만들어줘.
- 먼저 AGENTS.md와 이 문서 §2에 적힌 문서만 읽고, 만들 구조와 순서를 짧게 보여준 뒤 시작해.
- 이 PC는 Windows + PowerShell + Edge, Python 3.14(cp949)야. 실행 방법은 npm run 한 줄로만 안내해.
- 단계마다 한국어로 짧게 진행 상황을 알려주고, §7 합격 기준을 실제로 돌려서 결과를 보여줘.
- 레퍼런스 사이트의 코드·에셋·캡처 파일은 저장소에 커밋하지 마.
- 끝나면 §8대로 기록하고 커밋·푸시해.
```

### 1.3 사용자가 중간에 확인할 것

| 시점 | 확인 |
|---|---|
| 구조 제안 직후 | 명령 이름·출력 폴더 위치가 괜찮은지 |
| §7 시험 중 | 창이 뜬 Edge에서 사이트가 실제로 움직이는지(창을 가리거나 최소화하지 않는다 — 가리면 프레임이 멈출 수 있음) |
| 끝날 때 | 연속 프레임 시트(PNG)를 열어 전환 중간 단계가 빠짐없이 보이는지 |

---

## 2. 로컬 세션이 먼저 읽을 것 (필요한 절만)

1. `AGENTS.md` — 한국어 대화, Windows 실행 규칙(O-005), 레퍼런스 코드·에셋 복사 금지, 기록 규칙
2. `docs/LOCAL_WINDOWS.md`, `scripts/local/run.mjs` — `npm run` 진입점 방식(여기에 새 명령을 붙인다)
3. `tools/reference-capture/README.md`(D-017 촬영 순서), `capture-site.mjs`(기존 HAR·스크린샷 도구 — 확장 또는 대체), `scroll-hud.js`
4. `docs/uiux_system/21_REFERENCE_EFFECT_RECORDS.md` §8(효과 구간 최소 6장·권장 12장 대조)
5. `docs/uiux_system/records/R_AI_COLLABORATION.md`의 **R-016**(확보 방식은 렌더 층으로 고른다)
6. `docs/uiux_system/25_EFFECT_PRODUCTION_PIPELINE.md` §6(충실도 게이트 G3·G4)
7. `verification/r1-intro-20260929/capture.mjs` — 우리 앱의 `window.__intro` 고정 캡처(비교 대상)
8. `docs/uiux_system/rounds/R1/REFMINE-R1-INTRO-ASSET.md` §3·§8 — 첫 사용 대상 레퍼런스

## 3. 목표

**같은 입력 → 같은 프레임 시퀀스**를 레퍼런스 사이트와 우리 앱에서 똑같이 뽑아 나란히 비교할 수 있게 한다. 세 가지 증거를 분리해서 얻는다.

| 층 | 무엇을 보나 | 방법 | 이유 |
|---|---|---|---|
| **A. 설계된 움직임** | 전환 중간 프레임, 가속·감속 곡선, 요소별 시차, 입력 반응 모델(위치/속도/문턱/시간) | 가상 시계로 1/60 s씩 넘기며 매 프레임 캡처 | PC 속도와 무관하게 **완전한 60 fps 시퀀스**. 같은 입력이면 매번 같은 결과(재현 가능) |
| **B. 실제 성능** | 프레임 간격, 떨어진 프레임, 긴 작업, GPU 정보 | 실시간(가상 시계 없음) + Chromium 성능 추적 | 부드러움이 실제 하드웨어에서 유지되는지 |
| **C. 체감** | 휠 감각, 관성 | 기존 OBS 60 fps 고정 + HUD 녹화(D-017) — **이 도구 범위 밖**, 사용자가 필요할 때만 | 사람 눈에 보인 화면 그대로 |

**쓰지 말 것**: Playwright `recordVideo`를 부드러움 판단 근거로 쓰지 않는다(프레임률 가변·압축 — REF-001 녹화의 중복 프레임 24.5 % 문제와 같은 종류). 필요하면 참고용으로만 남긴다.

## 4. 만들 명령 (이름은 제안 — 사용자와 확정)

`scripts/local/run.mjs`의 `table`에 붙이고, 루트 `package.json`에 스크립트를 추가한다.

| 명령 | 하는 일 |
|---|---|
| `npm run ref:capture -- <url>` | 레퍼런스 사이트: A(가상 시계 프레임) + B(실시간 추적) + 목록·자산·라이브러리 정보 |
| `npm run ref:capture -- story` | 같은 입력 대본을 우리 앱(`npm run story`와 같은 dev 서버)에 적용 |
| `npm run ref:capture -- <url> --mode frames` / `--mode trace` | 층 하나만 |
| `npm run ref:capture -- <url> --script transition --from 0.18 --to 0.30` | 페이지의 한 구간만 아주 천천히(전환 분석용) |
| `npm run ref:sheet -- <출력 폴더>` | 구간별 12장 시트, 나란히 비교 시트(레퍼런스 ↔ 우리 앱) |

Windows 규칙: `&&` 없음, `python3` 호출 없음, npm/npx는 `run.mjs`의 `run()`으로(shell 처리), 파일 읽기·쓰기는 UTF-8 명시. 새 스크립트가 `tests/portability.test.cjs`를 통과해야 한다.

## 5. 기술 요구사항

### 5.1 브라우저

- Playwright(`prototype/v2`에 이미 있음, 1.63) — 새 의존성을 늘리지 말고 기존 설치를 쓴다(`createRequire`로 `prototype/v2/package.json` 기준 로드, `run.mjs browserPath()` 참고).
- **창을 띄운(headed) Edge**: `chromium.launch({channel: 'msedge', headless: false})`. Edge가 없으면 Playwright Chromium으로 대체하고 manifest에 기록.
- 창 크기 1920×1080, `deviceScaleFactor: 1`, 브라우저 배율 100 %. 가능하면 전체화면.
- 시작 시 WebGL 렌더러 문자열(`WEBGL_debug_renderer_info`)을 읽어 **실제 GPU인지 소프트웨어 렌더(SwiftShader 등)인지** manifest에 남긴다. 소프트웨어 렌더면 B층 결과에 "성능 판단 불가" 표시.
- 인증서 검사를 끄는 옵션(`ignoreHTTPSErrors`, `--ignore-certificate-errors*`)은 쓰지 않는다. 로컬에서는 필요 없다.

### 5.2 A층 — 가상 시계 프레임 캡처

- **Playwright Clock API** 사용: 페이지 로드 전에 `page.clock.install()`, 이후 `page.clock.runFor(1000/60)`로 한 프레임씩 진행 → `page.screenshot()`. Clock은 `Date`, `performance.now`, `setTimeout/Interval`, `requestAnimationFrame`을 제어한다. three.js·GSAP·Lenis처럼 rAF로 도는 연출은 이것으로 프레임 단위 재현된다.
- **먼저 검증할 것**(사이트마다 다를 수 있음 — 결과를 manifest에 기록):
  - CSS transition/animation과 Web Animations: Clock이 제어하지 않을 수 있다. 확인 후 필요하면 `document.getAnimations()`를 멈추고 프레임마다 `currentTime`을 가상 시각에 맞추는 보정을 넣는다. 보정 여부를 기록한다.
  - `<video>` 재생: Clock과 무관하다. 영상 요소가 있으면 `currentTime`을 프레임마다 맞추거나, "영상 구간은 A층 신뢰 불가"로 표시한다.
  - Web Worker·OffscreenCanvas: 시계가 적용되지 않는다. 감지하면 경고한다.
  - 로딩: 자산 로드가 끝날 때까지는 실제 시간으로 기다린 뒤(네트워크 유휴 + 사이트별 대기), 시계를 멈추고 캡처를 시작한다. 시작 방식을 기록한다.
- **입력**: 프레임 사이에 `page.mouse.wheel()`을 넣어 휠을 보낸다. 대본(§5.4)의 시각은 가상 시계 기준이다.
- **결정성 검사**: 같은 대본을 두 번 돌려 처음 60프레임의 이미지 해시(또는 픽셀 차이 합)가 같은지 확인한다. 다르면 원인(난수, 시계 밖 타이머, 경로 재생성 — 예: ATMOS의 매 방문 재생성 경로)을 manifest에 남긴다.
- 선택 요소 추적: `--track "<css selector>,..."`로 주면 프레임마다 `getBoundingClientRect()`와 `opacity`·`transform`을 JSON으로 저장 → 가속·감속 곡선과 요소별 지연을 수치로 뽑는다. WebGL 내부 물체는 추적할 수 없으므로 프레임 간 차이 에너지(연속 프레임의 평균 절대 차이)와 화면 영역별 차이로 대신한다.
- 파일: PNG(무손실). 1920×1080 PNG가 많으므로 기본은 구간당 최대 180프레임(3 s), 시트용 12장은 자동 선택.

### 5.3 B층 — 실시간 성능 추적

- 가상 시계 없이 같은 대본을 실제 시간으로 실행.
- `browser.startTracing(page, {categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'toplevel']})` → `browser.stopTracing()`으로 추적 JSON 저장.
- 요약 JSON: 프레임 간격의 중앙값·p95·최대, 16.7 ms·33.3 ms 초과 프레임 수, 50 ms 이상 긴 작업 수, 구간(대본 단계)별로 나눈 값.
- 보조: 페이지 안 `requestAnimationFrame` 타임스탬프 기록(추적과 교차 검증).

### 5.4 입력 대본 (레퍼런스와 우리 앱에 동일 적용)

D-017 촬영 순서를 코드로 옮긴다. 기본 대본 `standard`:

1. 정지 2 s
2. 휠 1칸(deltaY 100) × 3, 간격 0.7 s
3. 연속 스크롤 2 s(0.1 s마다 deltaY 100)
4. 정지 2 s
5. 빠르게 1회(0.25 s 동안 deltaY 1200)
6. 정지 1.5 s
7. 되돌리기(deltaY −300)

추가 대본 `transition`: 지정 구간(`--from`·`--to`, 페이지 진행률 또는 섹션 선택자)까지 이동한 뒤 휠 1칸씩 0.5 s 간격으로 천천히 통과(전환 중간 단계 확보). 입력 시각·값은 `input.json`에 남긴다.

우리 앱(`story`)에서는 `?p=`·`?t=` 고정 훅을 쓰지 말고 **같은 휠 대본**으로 캡처한다(레퍼런스와 조건을 맞추기 위해). 기존 `verification/r1-intro-20260929/capture.mjs`는 G5 상태 전수용으로 그대로 둔다.

### 5.5 함께 모을 정보 (기존 `capture-site.mjs` 기능 흡수)

- 요청 목록(유형·MIME·크기), 3D·영상·글꼴 자산 목록(glb/gltf/drc/ktx2/basis/hdr/exr/splinecode/mp4/webm/woff2)
- 라이브러리 감지: `window.__THREE__`, `gsap.version`, Lenis, Spline 런타임, Webflow, 캔버스 개수·크기·WebGL/WebGPU 여부
- 제목·헤드라인 글꼴 수치(D-044 글자 설계용): 글꼴 가족, 크기, 굵기, 자간, 행간
- HAR은 선택(`--har`) — 용량이 크다.

### 5.6 출력 위치와 형식

- 기본 출력: **저장소 밖** `%USERPROFILE%\ecg-captures\<host>-<YYYYMMDD-HHMM>\` (옵션 `--out`으로 변경). 저장소 안에 두려면 `.gitignore`에 등록된 폴더만.
- 폴더 구성:

```
manifest.json      URL, 날짜, 브라우저·버전, GPU 문자열, 창 크기, 대본, 시계 보정 여부, 결정성 결과, 경고
input.json         입력 시각·값
frames/<segment>/0000.png …
tracks.json        (선택) 요소별 프레임 값
diff.json          프레임 간 차이 에너지(전체·9분할 영역)
trace.json         B층 원본 추적
perf-summary.json  B층 요약
assets.json        요청·자산·라이브러리·글꼴
sheet-<segment>.png   12장 시트
```

- 클라우드 세션이나 다른 세션에 넘길 때는 `manifest.json`·`perf-summary.json`·`diff.json`·시트 PNG만 보내면 되게 한다(원본 프레임은 사용자 PC에 남긴다).

## 6. 금지·주의

- 레퍼런스 사이트의 코드·에셋·캡처를 **저장소에 커밋하지 않는다**(AGENTS). 기록에는 수치·구조·짧은 인용만.
- 로그인·결제·개인정보 입력이 필요한 페이지는 캡처하지 않는다. 사이트에 과도한 요청을 보내지 않는다(한 번 캡처에 페이지 로드 2–3회 이내).
- 인증서 예외·프록시 우회 옵션 금지.
- 데이터 계약: 이 도구는 관찰만 한다. 우리 앱의 파형·수치를 바꾸는 코드는 건드리지 않는다.
- `prototype/v2/src/**`는 수정하지 않는다(읽기만). 도구는 `tools/reference-capture/`와 `scripts/local/`에 둔다.

## 7. 합격 기준 (실제로 돌려서 보여 준다)

| # | 시험 | 합격 |
|---|---|---|
| T1 | `npm run ref:capture -- story --mode frames` | 도입부 지구 → 사람 전환 구간 12장 시트가 나오고, 중간 단계가 빠지지 않음(인접 프레임 차이가 급등하지 않음) |
| T2 | T1을 두 번 실행 | 처음 60프레임 해시 동일(또는 다른 원인을 manifest에 설명) |
| T3 | `npm run ref:capture -- story --mode trace` | GPU 문자열이 실제 GPU, 프레임 간격 요약이 나옴 |
| T4 | WebGL 레퍼런스 1개(예: https://oryzo.ai 또는 https://atmos.leeroy.ca) 전체 모드 | 프레임·추적·자산 목록 생성, 라이브러리 감지 결과가 소스 확인값과 일치 |
| T5 | CSS 전환 중심 사이트 1개(REF-007 https://hauntedbouldercity.com) frames 모드 | CSS 애니메이션이 가상 시계에 맞게 진행되는지 확인 결과와 보정 여부가 manifest에 기록 |
| T6 | `npm run ref:sheet -- <레퍼런스 폴더> <story 폴더>` | 같은 대본 단계의 나란히 비교 시트 |
| T7 | `npm test` | 전체 PASS(portability·records 포함). 분석 함수(차이 에너지·곡선 추출·프레임 선택)는 가짜 이미지·가짜 추적으로 단위 테스트 |
| T8 | `npm run doctor` | Edge(또는 Chromium) 사용 가능 여부를 새로 점검 |

각 시험의 결과를 PASS / CONDITIONAL / FAIL로 보고하고, 확인하지 못한 조건(예: 전시 PC 성능은 여전히 모름)을 적는다.

## 8. 기록과 커밋

작업 시작 전 `git pull`로 최신을 받고, 기록 번호는 그 시점 마지막 번호의 다음을 쓴다(2026-09-30 기준 D 마지막 = D-044).

| 파일 | 내용 |
|---|---|
| `docs/uiux_system/records/D_DECISIONS.md` | 새 D: "레퍼런스 확보를 A(가상 시계 프레임)·B(실시간 추적)·C(사용자 녹화) 세 층으로 나누고, A·B는 사용자 PC 로컬 세션에서 자동화한다". 검토한 대안(클라우드 인증서 예외 — 정책상 불가, Playwright recordVideo — 프레임률 가변, 사용자 녹화만 — 수작업 부담), 되돌아볼 조건. CASE 연결: CASE-006(레퍼런스 기록 체계) |
| `docs/uiux_system/records/R_AI_COLLABORATION.md` | R-016 본문은 고치지 않고, 끝에 "갱신(날짜): 로컬 도구가 생기면 WebGL 레퍼런스도 A·B층은 AI가 확보, C층만 사용자 녹화" 추가(또는 새 R — `10_RECORD_KEEPING.md` 판단) |
| `tools/reference-capture/README.md` | 새 명령·층 구분·출력 폴더·한계 절 추가 |
| `docs/LOCAL_WINDOWS.md` | 명령 표에 `ref:capture`, `ref:sheet` 행 추가 |
| `docs/uiux_system/21_REFERENCE_EFFECT_RECORDS.md` | 입력 증거 표에 이 도구 결과를 쓰는 방법 한 줄(근거 태그 `[런타임]`, 가상 시계 여부 표기) |
| `PLAN.md`, `WORKLOG.md`, `WORK_STATE.json` | 체크포인트 한 줄씩 |

커밋 전 `npm run records:check`와 `npm test`. 커밋·푸시는 `ccr-efb769e0-o5cmli`(또는 사용자가 정한 새 브랜치). 다른 세션(파형 탐색 세션: REF-011–019, `EXPLORE-WAVE-DISPLAY.md`)의 파일은 건드리지 않는다.

## 9. 도구가 생긴 뒤 첫 사용 (이 지시서 범위 밖 — 사용자가 다음에 요청)

`REFMINE-R1-INTRO-ASSET.md`의 RM-01(Oryzo)·RM-02(Igloo)·RM-03(ATMOS)·RM-08(Superpower)과 RM-12(Spline heart)를 캡처해 L1 → L3로 올리고, 우리 도입부 같은 구간과 나란히 비교한다. 결과는 클라우드 세션이나 로컬 세션 어느 쪽에서든 `21`번 형식 REF 효과 카드(REF-020 이후 번호)로 기록한다.
