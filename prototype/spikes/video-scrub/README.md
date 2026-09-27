# video-scrub — AI 영상 → 스크롤 플레이어 (spike)

`docs/uiux_system/22_AI_VIDEO_SCROLL_PIPELINE.md`(D-023)의 플레이어와 시험 도구. **시험 영상은 AI 영상이 아니다** — Blender·three.js로 우리가 렌더한 대역이다. 화면의 문구·수치는 모두 데모다.

## 1. 준비 (처음 한 번)

필요한 것: Node 20+, Python 3.10+ 와 OpenCV.

```bash
pip install opencv-python-headless numpy      # Blender(bpy)를 같은 파이썬에 쓴다면 numpy는 1.26 유지
cd prototype/spikes/video-scrub
npm install
npm run clips      # public/clips/ 에 시험 영상 6개 생성 (약 2분). 이 폴더는 커밋되지 않는다
npm run dev        # → http://127.0.0.1:5173/
```

`npm run clips`(클립 6개)를 건너뛰면 화면에 "Clip … not found — run npm run clips"가 뜬다(예전에는 `loading frames 0%`에서 멈췄다 — O-003).

| 클립 | 원본(커밋됨) | 무엇을 시험하나 | 입고 QA |
|---|---|---|---|
| `pan` | `../ref-repro/public/ref003/hero.mp4` (Blender 설원 팬) | 기본 스크롤·블렌딩·시선 | PASS |
| `eased` | 위를 느리다 빨라지게 재가공 | 속도 보정(remap) | FAIL(일부러 — 중복 프레임) |
| `attic` | `standins/attic_c.mp4`(240프레임, 10 s) + `standins/depth_true.mp4` (우리 다락방 렌더) | 하강 스크롤, 실제 깊이 시차, 정지 생명감 | PASS (프레임당 2.65 px) |
| `attic_est` | `standins/attic_c.mp4` + `standins/depth_est.mp4` | **추정** 깊이 시차(Depth Anything V2) | PASS |
| `attic_grid` | `standins/attic48_{c,l,r}.mp4`(옛 48프레임) | 좌·중·우 시점 섞기 시연(기각된 방식)과 **프레임 부족 시 끊김** 예시 | FAIL(일부러 — 프레임당 13 px) |
| `globe` | `standins/globe.mp4` (우리 지구 한 바퀴) | 멈춰도 재생 + 스크롤 가속 | FAIL(일부러 — 한 바퀴 144프레임이라 프레임당 31 px. 부드러우려면 약 1,500프레임 → 도는 물체는 실시간 3D가 맞다) |

## 2. 무엇을 보면 되나 — URL별

스크롤은 휠·트랙패드로, 시선은 마우스를 좌우로 움직여 확인한다. 왼쪽 위 HUD에 현재 프레임·옵션이 나온다(`hud=0`으로 끔).

| URL (`http://127.0.0.1:5173/` 뒤) | 볼 것 | 기대 |
|---|---|---|
| `?clip=pan` | 스크롤에 따라 부드럽게 팬, 멈추면 정지. 마우스 좌우 → 화면이 살짝 따라옴(약 1.5 s에 자리 잡음) | 끊김 없음, 멈춤 없는 로딩 |
| `?clip=eased&remap=0` 과 `?clip=eased&remap=1` | 같은 스크롤 양에 화면이 움직이는 양 | remap=1 쪽이 고르게 움직인다(CV 0.605 → 0.11) |
| `?clip=attic&overlay=0` | 카메라가 책장을 따라 내려감. 마우스 좌우 = **여백 이동**(REF-002식 고개 돌림) | 진짜 회전과 거의 같음(F-019) |
| `?clip=attic_grid&overlay=0&grid=1` | 마우스 좌우 = 좌·중·우 시점 영상 섞기 | 사다리·소품이 **이중으로 보임**(잔상 — 기각된 방식) |
| `?clip=attic_grid&overlay=0` 과 `?clip=attic&overlay=0` | 천천히 휠 한 칸씩 | 48프레임은 사다리가 겹쳐 보이며 끊기고, 240프레임은 부드럽다(F-021) |
| `?clip=attic&overlay=0&depth=1` | 마우스 좌우 = **실제 깊이** 시차: 가까운 사다리가 뒤 책장보다 더 움직임 | 원근감, 사다리 기둥이 끊기지 않음(F-022 수정). 가려졌던 곳에는 약간 늘어짐 |
| `?clip=attic_est&overlay=0&depth=1` | 같은 시차를 **영상에서 추정한 깊이**로 | 비슷함. 스크롤하면 깊이가 조금씩 떨림. `depthAmp`(기본 0.018)를 올릴수록 늘어짐이 커진다 |
| `?clip=attic&overlay=0&live=1` | 스크롤을 멈춘 상태로 몇 초 보기 | 빛 받는 곳에서 먼지가 떠다님. 영상에 원래 찍힌 먼지는 멈춰 있음(F-020) |
| `?clip=globe&idle=play` | 가만히 두기 → 휠 굴리기 → 멈추기 | 천천히 돌다가 빨라지고 다시 느려짐(moto 지구식) |
| `?clip=attic&overlay=0&idle=play` | 같은 방식을 카메라 경로 영상에 | 멈춰 있어도 내려가다가 스크롤보다 먼저 끝남 — **안 되는 경우의 예시** |

그 밖의 옵션: `fx=0`(grain·vignette 끔), `kiosk=1`(마우스 없이 자동 시선), `blend=0`(프레임 사이 블렌딩 끔), `idleFps=4`, `overlay=0`(REF-003 데모 문구 숨김).

## 3. 자동 시험

```bash
npm run build && npm run preview          # :4193
node scripts/qa.mjs                        # 12장 스크롤 캡처, 시선 95 % 시간, 디코딩 대기 → qa-output/
node scripts/wheel-test.mjs                # 연속 휠 스크롤 대기 횟수
node scripts/qa-idle.mjs                   # 정지 생명감·idle=play·시선 방식 캡처 → qa-output/idle/
```

## 4. 실제 AI 영상을 넣을 때

`22_AI_VIDEO_SCROLL_PIPELINE.md` §8. 요약: 브리프(`docs/uiux_system/templates/AI_VIDEO_BRIEF.md` + `tools/video-qa/briefs/VB-NNN.json`) → `python3 tools/video-qa/check_video.py`로 입고 QA → `python3 scripts/import_clip.py <영상> <이름> --brief <json>` → `?clip=<이름>`.

## 5. 대역 영상을 다시 만들 때 (선택)

`standins/`는 `scripts/render_standins.mjs`로 만들었다(다락방 spike `:4192`의 `?capture=1`, ref-repro `:4191`의 `ref004.html?manual=1`이 떠 있어야 함, 약 6분). 추정 깊이는 `tools/video-qa/estimate_depth.py`(torch·transformers 별도 가상환경).
