# 레퍼런스 사이트 촬영·프레임 분석 (D-017 촬영 규칙 + D-045 자동 도구)

목적: 레퍼런스 사이트(와 우리 앱)의 연출이 **스크롤할 때**와 **멈췄을 때** 어떻게 다른지, 스크롤 위치와 속도 중 무엇에 반응하는지를 **같은 입력 → 같은 프레임 시퀀스**로 뽑아 나란히 비교한다.
배경: `docs/uiux_system/handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` §14–15, 로컬 도구 지시서 `handoffs/LOCAL_CAPTURE_TOOL_BRIEF_2026-09-30.md`.

## 0. 증거를 세 층으로 나눈다 (D-045)

| 층 | 무엇을 보나 | 방법 | 누가 |
|---|---|---|---|
| **A. 설계된 움직임** | 전환 중간 프레임, 가속·감속 곡선, 요소별 시차, 입력 반응(위치/속도/문턱/시간) | **가상 시계**로 16 ms씩 넘기며 매 프레임 PNG | `ref:capture`(자동) |
| **B. 실제 성능** | 프레임 간격, 떨어진 프레임, 긴 작업, GPU 정보 | 실시간 + Chromium 추적 + rAF 기록 | `ref:capture`(자동) |
| **C. 체감** | 휠 감각, 관성 | OBS 60 fps 고정 + HUD(§2, §3) | 사용자 녹화(필요할 때만) |

- A층은 PC 속도와 무관하게 **빠진 프레임 없는 시퀀스**이고 같은 입력이면 같은 결과다. 대신 "실제 화면이 부드러웠는가"는 알려 주지 않는다 → B층.
- B층은 실제 GPU에서만 의미가 있다. WebGL이 소프트웨어 렌더(SwiftShader 등)이면 `perf-summary.json`에 "성능 판단 불가"가 찍힌다. 전시 PC 성능은 여전히 모른다.
- Playwright `recordVideo`는 쓰지 않는다(프레임률 가변·압축 — REF-001 녹화의 중복 프레임 24.5 %와 같은 문제).

## 0.5 어떤 방식으로 찍을까 (AI가 조작할 때 · D-046)

D-017 촬영 순서(정지 → 휠 1칸 × 3 → 연속 → 정지 → 빠르게 → 정지 → 되돌리기)는 **사람이 직접 녹화할 때** 효과를 구분하려고 만든 규칙이다. AI가 조작할 때는 효과를 더 확실히 가려내는 실험을 쓴다.

| 알고 싶은 것 | 방법(`--script`) | 모드 | 결과 |
|---|---|---|---|
| 페이지 전체에 어떤 장면·효과가 있고 어디가 크게 움직이나 | `survey`: 일정 거리씩 내려가며 **정지 화면**(2 s 정착 뒤) + 올라오며 같은 위치로 복귀 | `fast` | `survey.json`(정지 지점별 이동 중 변화량·정착 시간·평소 움직임·왕복 차이), `survey-down.png`·`survey-up.png` |
| 스크롤 위치의 함수인가(scrub) vs 한 번 발동(trigger) vs 시간 | survey의 왕복 비교: 같은 스크롤 위치의 내려갈 때/올라올 때 정지 화면 차이 | `fast` | `hysteresis` 요약 |
| 입력 후 정착이 얼마나 늦나(관성·감속) | survey의 정착 시간(입력이 끝난 뒤 변화가 평소 수준으로 돌아오는 시간) | `fast` | `settleMs` |
| 가만히 있을 때 계속 움직이나(앰비언트) | survey 각 지점 마지막 0.6 s 변화량 | `fast` | `ambientEnergy` |
| 큰 전환이 어떻게 진행되나 | survey에서 찾은 구간을 `transition --from --to`로 **프레임 정확** 캡처 | `frames`(A층) | 12장 시트·곡선 |
| 마우스 호버·포인터 따라가기 | `hover`: 화면 가로·세로 훑기 + 후보 요소별 접근 → 머무름 → 이탈(클릭 없음) | `fast` 또는 `frames` | `hover.json`(반응 여부·범위(영역/화면 전체)·t50/t90·이탈 후 역방향 애니메이션), 구간별 시트 |
| 실제 성능 | 표준 대본 실시간 + 추적 | `trace` | `perf-summary.json` |

- `fast` 모드: 대본을 **실시간으로 한 번** 실행하면서 Chromium 화면 스트림(CDP screencast, JPEG)을 받는다. 화면이 바뀔 때만 프레임이 오므로 60 Hz 격자로 다시 맞춰(마지막 프레임 유지) OpenCV(`frame_diff.py`)로 변화량을 계산한다. 사이트당 **1–5분**. 프레임 정확도는 화면 주사율(이 PC 약 58 Hz)과 PC 성능에 묶이므로, 정밀 분석은 해당 구간만 A층으로 다시 찍는다.
- 정지 화면(still)은 1920×1080 JPEG(품질 90)이고 `frames/stills/`에 남는다. 에너지 계산용 저해상도 프레임은 끝나면 지운다(`--keep-frames`로 보존).

## 1. 명령 (Windows PowerShell에서 한 줄씩)

```
npm run ref:capture -- https://oryzo.ai
npm run ref:capture -- story
npm run ref:capture -- https://oryzo.ai --mode frames
npm run ref:capture -- story --mode trace
npm run ref:capture -- https://atmos.leeroy.ca --script transition --from 0.18 --to 0.30
npm run ref:sheet -- C:\Users\사용자\ecg-captures\oryzo.ai-20261001-1330
npm run ref:sheet -- <레퍼런스 폴더> <story 폴더>
npm run ref:capture -- selftest
npm run ref:capture -- https://oryzo.ai --mode fast --script survey
npm run ref:capture -- https://oryzo.ai --mode fast --script hover --hover-count 4
npm run ref:capture -- https://www.igloo.inc --mode fast --script hover --hover "a.link,button.menu"
npm run ref:sheet -- <캡처 폴더> --hover
npm run ref:sheet -- <캡처 폴더> --survey
```

| 옵션 | 기본 | 뜻 |
|---|---|---|
| `<url>` / `story` | — | `story`는 우리 앱. 개발 서버가 안 떠 있으면 같은 서버(`prototype/v2`)를 띄웠다가 끝나면 끈다 |
| `--mode all\|frames\|trace\|fast` | all | A+B+정보 / A층만 / B층만 / 실시간 녹화 빠른 모드(§0.5) |
| `--script standard\|transition\|hover\|survey` | standard | 입력 대본(§0.5, §4). `transition`은 `--from`·`--to`(진행률 0–1 또는 CSS 선택자) 필요. `survey`는 `fast` 전용(`--stops N` 기본 36, `--stop-px P`). `hover`는 `--hover auto\|"선택자,선택자"`, `--hover-count N`(기본 4), `--from`(먼저 그 진행률까지 스크롤) |
| `--track ".a,.b"` | — | 선택자 요소의 위치·크기·opacity·transform을 프레임마다 `tracks.json`에 저장하고 곡선 통계(onset/t10·t50·t90/최대 속도/이징 종류/오버슈트)를 계산 |
| `--out 폴더` | `%USERPROFILE%\ecg-captures\<host>-<날짜-시각>` | 저장소 밖 |
| `--har` | 끔 | 네트워크 HAR 저장(용량 큼, 본문 제외) |
| `--max-frames N` | 180 | 구간당 캡처 상한(넘으면 시계만 진행하고 경고) |
| `--settle ms` | 4000 | 로드 단계(ready + 요청 없음 1 s) 뒤 **가상 시간으로** 더 진행하는 시간. 이후 캡처 시작 |
| `--ready "JS 식"` | story: `window.__intro` | 이 식이 참이 될 때까지 기다림(자산·장면 준비) |
| `--no-determinism` | — | 결정성 검사(처음 60프레임 재캡처) 생략 |
| `--browser edge\|chromium` | edge | Edge가 없으면 Playwright Chromium으로 대체하고 manifest에 기록 |

실행 중에는 **Edge 창이 실제로 뜬다**(실제 GPU 사용). 가리거나 최소화하지 말 것. 한 번 실행에 레퍼런스 페이지를 2–3회 연다(A층 1 + 결정성 1 + B층 1).

## 2. 출력 폴더

```
manifest.json        URL, 날짜, 브라우저·버전, GPU, 창 크기, 대본, 시계 설정, CSS 보정 여부, 결정성 결과, 경고
input.json           입력 시각·값(대본이 실제로 보낸 휠)
frames/<구간>/0000.png …   무손실 PNG (구간당 ≤180장, 1920×1080)
diff.json            프레임 간 변화 에너지(전체 + 3×3 영역), 움직이는 구간, 급등 프레임
tracks.json          (--track) 요소별 프레임 값 + 곡선 통계
perf-summary.json    B층 요약(프레임 간격 중앙·p95·최대, 16.7/33.3 ms 초과, 50 ms↑ 긴 작업, 구간별)
trace.json           B층 원본 Chromium 추적(수십 MB)
assets.json          요청·자산(glb/ktx2/hdr/영상/글꼴…)·라이브러리·캔버스/컨텍스트·제목 글꼴 수치(D-044)
sheet-<구간>.png     구간별 12장 시트
```

**다른 세션(클라우드 등)에 넘길 때는 `manifest.json`·`perf-summary.json`·`diff.json`·`input.json`·`assets.json`·시트 PNG만 보낸다.** 원본 프레임은 사용자 PC에 남긴다.

**저장소에 커밋하지 않는다**(AGENTS.md: 레퍼런스 사이트의 코드·에셋·캡처 금지). 기본 출력이 저장소 밖이고, `ecg-captures/`는 `.gitignore`에 있다. 기록에는 수치·구조·짧은 인용만.

디스크·시간: 표준 대본 1회 ≈ 680프레임 × 0.4–3 MB. 실제 걸리는 시간은 사이트 무게에 달려 있다(우리 앱 ≈ 1.5분, 무거운 WebGL 사이트 oryzo.ai ≈ 8분, CSS 애니메이션 100여 개 사이트 ≈ 8분; 프레임마다 CSS 보정·스크린샷이 든다). 줄이려면 `--max-frames 60`. 끝나면 필요한 구간만 남겨도 된다.

## 3. A층이 무엇을 보장하고 무엇을 못 하나

- 시계: Playwright `page.clock`이 `Date`·`performance.now`·`setTimeout/Interval`·`requestAnimationFrame`을 제어한다. **페이지가 시작되기 전에 시계를 멈추고** 우리가 **16 ms씩** `runFor`로만 움직인다(로드 단계도 같은 방식: ready + 요청 없음 1 s까지, 이어서 `--settle` 가상 ms). 네트워크·디코딩 같은 실제 비동기 작업은 단계 사이에 실제 시간으로 진행된다. 캡처는 그 뒤 매 단계 스크린샷. 16 ms인 이유: Clock의 rAF 격자가 16 ms이고 `runFor(16)`이 rAF를 정확히 한 번 실행한다(16.667은 17 ms로 반올림). 즉 가상 62.5 fps; 프레임 시각은 `vt`(ms)로 기록한다.
- 시작 위상: 시계 시작값을 고정(16 ms 격자 정렬)하고 로드 중에도 시계를 흘리지 않아, 장면의 나이가 실제 로드 시간이 아니라 단계 수로 정해진다(첫 구현은 로드 중 시계를 흘려서 우리 앱 처음 60프레임이 0/60 일치였다). 같은 입력이면 같은 프레임이 나온다. 결정성은 매번 처음 60프레임 해시 비교로 manifest에 기록한다.
- **CSS transition/animation·Web Animations는 시계가 제어하지 않는다**(시계를 멈춰도 실시간으로 계속 감 — 확인됨). 그래서 프레임마다 `document.getAnimations()`를 멈추고 `currentTime`을 가상 시각에 맞춘다. 처음 보이는 애니메이션은 가상 나이 0에서 시작. 보정 여부와 개수가 manifest의 `cssAnimationCorrection`에 남는다. `npm run ref:capture -- selftest`가 정답이 알려진 페이지(CSS 애니메이션·전환·rAF가 같은 휠에서 시작해 2 s에 1000 px)로 이 보정과 결정성을 검증한다.
- 결정성 판정(manifest `determinism`): **PASS** = 처음 60프레임 해시 동일, **PASS(GPU 반올림 수준)** = 달라진 프레임이 ≤20픽셀·≤2단계, **CONDITIONAL** = 평균 차이 ≤ 0.5, **FAIL** = 그 이상(원인 후보는 `likelyCauses`와 경고). 실측: 우리 앱 PASS(반올림), CSS 애니메이션 51개 사이트 PASS(반올림), 워커·영상이 있는 oryzo.ai FAIL.
- 못 하는 것(감지하면 manifest 경고): `<video>` 재생(시계와 무관 → 영상 구간은 A층 신뢰 불가), Web Worker·OffscreenCanvas(시계 미적용), 무한 반복 CSS 애니메이션(시작 위상이 로드 시점에 달려 실행마다 다를 수 있음), 시계 밖 비동기 자산 로드(결정성 검사에서 드러남).
- 휠: `page.mouse.wheel`(신뢰된 입력)을 보내고 페이지가 이벤트를 받은 것을 확인한 뒤 시계를 진행한다. A층에서는 부드러운 스크롤을 끈다(`--disable-smooth-scrolling`) — 그 관성은 B층·C층 몫.
- WebGL 안의 물체는 요소로 추적할 수 없다 → `diff.json`의 프레임 간 변화 에너지와 3×3 영역별 값으로 대신한다.

## 4. 입력 대본 (D-017 촬영 순서를 코드로)

`standard`: ① 정지 2 s → ② 휠 1칸(100) × 3, 0.7 s 간격 → ③ 연속 2 s(0.1 s마다 100) → ④ 정지 2 s → ⑤ 빠르게 1회(0.25 s 동안 1200) → ⑥ 정지 1.5 s → ⑦ 되돌리기(−300) + 1.5 s. 구간 이름은 `1-idle`, `2-notches`, `3-continuous`, `4-idle`, `5-fast`, `6-idle`, `7-back`.

`transition --from A --to B`: 빠르게 A까지 이동한 뒤 휠 1칸(100)씩 0.5 s 간격으로 B까지 통과(2.5 s마다 구간 `pass-01`…). 전환 중간 단계를 여러 프레임에 담는다. A·B는 페이지 진행률(0–1)이나 CSS 선택자. 진행률을 읽지 못하는 페이지(`NaN`)에서는 이동하지 않는다.

우리 앱(`story`)도 `?p=`·`?t=` 고정 훅 없이 **같은 휠 대본**으로 캡처한다(조건을 레퍼런스와 맞추기 위해). 상태 전수 캡처(G5)는 기존 `verification/r1-intro-20260929/capture.mjs`가 맡는다.

## 5. 읽는 법

- `diff.json`의 `energy`는 인접 프레임의 화소당 평균 절대 RGB 차이(0–255). 값이 0이면 그 프레임은 앞 프레임과 같다. `jumps`는 이웃 값의 3배+1을 넘는 프레임 — **전환 중간 단계가 빠졌거나 컷이 있다는 신호**(정상 컷일 수도 있으니 시트로 확인).
- `ref:sheet -- <레퍼런스> <우리 앱>`: 같은 대본 구간을 12등분한 같은 위치의 프레임을 위/아래로 배치(`compare-<구간>.png`) + `compare.json`(구간별 평균 Δ). G3(나란히 캡처)에 쓴다. **레퍼런스 픽셀이 들어 있으므로 저장소에 넣지 않는다**.
- B층 수치는 화면 주사율에 묶인다(60 Hz면 중앙값 ≈16.7 ms). 16.7/33.3 ms 초과 개수는 1 ms 지터 여유를 둔 값이다. rAF 기록과 추적의 DrawFrame 값을 교차 확인한다.

## 6. 한계

- 전시 PC 성능은 여전히 모른다(B층은 이 PC의 값).
- A층은 사이트마다 시계 적용 범위가 다르다. 사이트별 결과(보정 여부·경고)는 manifest에 남기고, 수치를 인용할 때는 `[런타임]` + "가상 시계" 표기.
- 로그인·결제·개인정보가 필요한 페이지는 캡처하지 않는다. 사이트에 과도한 요청을 보내지 않는다.
- 인증서 예외·프록시 우회 옵션을 쓰지 않는다(R-016).

## 7. 사용자가 직접 녹화할 때 (C층, D-017 · 2026-09-25)

### 7.1 녹화 설정

| 항목 | 권장 | 이유 |
|---|---|---|
| 프레임률 | **60 fps 고정(CFR)** | 첫 녹화는 프레임 24.5 %가 중복되어, 미세한 끊김이 사이트 탓인지 녹화 탓인지 구분할 수 없었음 |
| 해상도 | 1920×1080, 브라우저 배율 100 % | 측정 기준 통일 |
| 화면 | 브라우저 **전체화면(F11)**. 다른 창·알림 끄기 | 탭·작업표시줄 제거 |
| 도구 | OBS Studio(무료, 워터마크 없음, CFR 설정 가능) 권장 | 기존 녹화 도구 워터마크가 오른쪽 아래 문구를 가림 |
| 소리 | 필요 없음 | — |

OBS 참고 설정: 출력 → 녹화 형식 mp4 또는 mkv, 비디오 → FPS 60, 인코더는 하드웨어(NVENC/QuickSync) + 품질 높음.

### 7.2 입력 표시 HUD

`scroll-hud.js`를 레퍼런스 페이지의 DevTools 콘솔(F12 → Console)에 붙여 넣는다. 사이트가 허용하면 `bookmarklet.txt`의 한 줄을 북마크로 저장해 클릭해도 된다. 왼쪽 아래에 `WHEEL`(휠 입력 순간·방향·크기·누적), `KEY`, `scrollY`·`velocity`(관성 스크롤 확인), 진행 막대가 표시된다. 읽기 전용 스크립트다(이벤트를 듣기만 함). 새로고침하면 사라진다.

### 7.3 파트별 촬영 순서

새 화면(파트)마다 §4 `standard`와 같은 순서(정지 → 휠 1칸 × 3 → 연속 → 정지 → 빠르게 1회 → 정지 → 되돌리기)를 반복한다. 순서는 지키고 시간은 대략이면 된다. 전환 효과는 **아주 천천히 휠 1칸씩** 넘긴다. hover·클릭 반응 요소는 스크롤 녹화와 분리된 짧은 녹화로 찍는다. 함께 줄 것: URL, 날짜, 브라우저 버전, 궁금한 파트의 녹화 시각.

### 7.4 분석 산출 형식

영상(또는 이 도구의 캡처) 하나마다 **화면별 · 전환 효과별**로 관찰 → 정량 측정 → 입력 반응 유형(위치 / 속도 / 문턱 / 시간) → 구현 추정 → 필요 에셋·기술 → ECG 번역 메모를 기록한다(`21_REFERENCE_EFFECT_RECORDS.md`).

## 8. 이전 도구

`capture-site.mjs`(HAR + 스크롤 스냅샷 + 영상 녹화)는 이 도구가 흡수했다(요청 목록·자산·라이브러리 감지 = `assets.json`, HAR = `--har`). 영상 녹화는 프레임률이 가변이라 쓰지 않는다. 파일은 참고용으로만 남긴다.
