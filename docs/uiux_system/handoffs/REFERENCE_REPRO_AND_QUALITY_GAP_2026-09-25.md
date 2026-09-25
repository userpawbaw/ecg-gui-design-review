# 레퍼런스 재현 시험과 품질 격차 분석 — REF-003·REF-004 재현, 연구실 코너 v3, 기술 스택 점검

작성 2026-09-25 · 상태: **보고 — 파이프라인 결정(P1·P5) 입력** · 관련: F-013, F-014, F-015, `EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` §20–21, REF-003, REF-004

## 0. 요청

> "v2는 외부 에셋들과 고품질 쉐이더, 뭐 기타 등등 레퍼런스에 가까운 결과를 만들어내려면 어떻게 해야 할지 알 수 있어? 가능하다면 레퍼런스처럼 시점이 내려오는 듯하게 만들어보는 것도 연습이 될 것 같은데. 그리고 어떻게 실행하면 되는지 한번 다시 확인해줘. 이거 blender 프로그램이 필요한 거 맞나? 레퍼런스에 비해서 시안의 퀄리티가 떨어지는 이유는 뭐고, 해결하려면 어떤 방법이 적절해? … 레퍼런스 3와 4도 사용할 만한 외부 에셋, 외부 완성된 UI 컴포넌트 등을 가져와서 최대한 레퍼런스와 유사한 퀄리티로 만들어보고, 구현 결과를 보여줘 봐. 다른 기술 스택이 더 적용될 필요가 있는지도 확인해주고." `[대화]`

## 1. 실행 방법과 Blender 필요 여부

| 하고 싶은 일 | 필요한 것 | Blender 프로그램 |
|---|---|---|
| **결과 보기**(연구실 코너, REF-003·004 재현) | Node.js 20+ 만. 베이크 결과·에셋이 저장소에 들어 있다 | **불필요** |
| 장면을 다시 굽기(가구 배치·조명 변경) | Python 3.11 + `pip install bpy`(Blender를 파이썬 모듈로 설치, 창 없음) | 앱 설치는 불필요. `bpy` 모듈이 곧 Blender 엔진 |
| 에셋 다시 렌더(구름·hero 영상) | 위와 같음 + ffmpeg(`imageio-ffmpeg`) + Pillow | 불필요 |
| 결과를 눈으로 고치고 싶을 때 | Blender 앱(무료)으로 `.glb`를 열어 볼 수는 있다 | 선택 |

```bash
# 결과 보기
cd prototype/spikes/lab-corner && npm install && npm run build && npm run preview    # http://127.0.0.1:4190/
cd prototype/spikes/ref-repro  && npm install && npm run build && npm run preview    # http://127.0.0.1:4191/ (REF-003·004)
# 재료부터 다시 만들기(선택)
node scripts/assets/fetch.mjs --only=ph-        # Poly Haven 소품·텍스처·HDRI·사진 (sha256 고정)
node scripts/assets/fetch.mjs --only=nasa-      # NASA Blue Marble
python3 scripts/blender/build_lab_corner.py --azimuths 8 --size 1024 --samples 256 --passes sky,bounce
python3 scripts/blender/package_lab_corner.py prototype/spikes/lab-corner/public/scene
YAWBASE=245 YAW0=-7 YAW1=7 python3 scripts/blender/render_repro_assets.py hero --out <dir>/hero --frames 240
python3 scripts/blender/render_repro_assets.py clouds --out <dir>/clouds --samples 64
python3 prototype/spikes/ref-repro/scripts/prepare_assets.py --renders <dir>
# 결과 영상(헤드리스, 프레임 단위 캡처 → mp4)
node tools/spike-capture/capture-frames.mjs ref003|ref004|lab <outDir>
```

## 2. 연구실 코너 v3 — 시점이 내려오는 연습 (REF-002 EFX-002-01·02)

| 추가 | 방법 | 결과 `[캡처]` |
|---|---|---|
| 스크롤 카메라 하강 | 직교 카메라 → **좁은 화각(약 20°) 원근 카메라**로 바꿔 시작 화면은 아이소메트릭처럼 보이게 하고, 스크롤 진행률 p를 3개 키프레임(전경 → 책상 위 하강 → 모니터 정면)의 centripetal Catmull-Rom 경로에 매핑. 화각 20° → 34° → 30°. p는 RCP-08 지수 감쇠(시간상수 약 0.17 s) | 전경 → 의자·책상 위로 내려옴 → 모니터 화면이 화면을 채움. 마지막에 "파형 뷰어로 이어지는 match cut 지점(데모)" 문구 |
| 포인터 시선 | 커서 위치로 시선 목표를 ±약 1° 이동, 감쇠 k=2 | 가까울수록 크게 |
| 모니터 화면 | glb의 512 px 텍스처 대신 **브라우저에서 2048 px 캔버스에 저장 replay 파형(d1-mixed-10 M08)을 직접 그림**, "decorative" 표기 | 클로즈업에서도 선명 — 실제 파형 뷰어로 넘기는 match cut의 조건 |
| 금속 반사 | RoomEnvironment PMREM을 **반사 전용**으로(확산 IBL은 셰이더에서 0 — 베이크와 중복 방지) | 램프·책상 금속에 하이라이트 |
| 먼지 | 700개 입자, 해를 마주 볼수록 밝게(전방 산란), 가까우면 크기 제한 | 역광에서 공기감 |

라이트맵은 보는 방향과 무관해서 **다시 굽지 않았다**(카메라 이동은 웹에서만). 결과 영상: `verification/ref-repro-20260925/lab.mp4`(빛 360° 회전 → 스크롤 하강).

## 3. REF-003·REF-004 재현 (`prototype/spikes/ref-repro`)

### 3.1 쓴 외부 재료와 부품

| 구분 | 재료 | 출처·라이선스 | 가공 |
|---|---|---|---|
| hero 영상 | horn-koppe_snow 파노라마(8192×4096 톤매핑 JPG) | Poly Haven, CC0 | Blender 월드로 넣고 84° 카메라로 10 s 패닝 렌더(240프레임, 약 19분) → mp4(x264) 2.5 MB + webm(VP9) 2.4 MB |
| 구름 2층·안개 판 | Blender 볼륨 구름(노이즈 밀도 + 높이 감쇠, 투명 배경) | 자체 렌더 | 1920×1080 RGBA, 장당 약 2.2분 → WebP 알파 139–167 KB |
| 경로 지도 | Blue Marble NG 2004-07 타일 B2(21600², 240 px/도) | NASA, 공공 도메인 | 서경 78–50°, 남위 44–70° 자르기 → 위도 57° 기준 가로 보정 → 바다 거의 검정·육지 회색 보정 → 1440×2455 WebP 186 KB |
| 지구 텍스처 | Blue Marble NG 5400×2700 | NASA, 공공 도메인 | 바다 청록·육지 세이지·얼음 흰색으로 재채색 + 밝기에서 노멀 맵 생성(4096×2048) |
| hover 사진 | Poly Haven HDRI 미리보기 6장(해안·부두) | CC0 | 320 px 정사각 WebP |
| 스크롤·모션 | Lenis 1.3.26, GSAP 3.15 + ScrollTrigger + **DrawSVG + MotionPath**(무료 플러그인) | MIT / GSAP 표준 라이선스 | — |
| 3D | three.js 0.186(vanilla, **r3f 없이**) + `Line2`(점선 항적) | MIT | — |
| 글꼴 | Oswald, Instrument Serif, Inter Tight / Instrument Sans, IBM Plex Mono | OFL(@fontsource) | 레퍼런스의 상용 서체 자리 대체 |

모든 문구·지명 카드·관측선은 **데모**이며 페이지에 표기했다. 거리 1,234.4 km는 푼타아레나스–세종기지 대원거리 계산값(haversine)이다. 레퍼런스의 에셋·코드는 복사하지 않았다.

### 3.2 효과별 충실도 판정 `[캡처]` (레퍼런스 녹화와 나란히 비교 — 비교 이미지는 저작권상 저장소에 넣지 않음)

| 효과 | 재현 방식 | 판정 | 남은 격차 |
|---|---|---|---|
| EFX-003-01 두 겹 구름 | 레퍼런스 측정 속도(0.9 / 0.55 px/px) 그대로, pin + 제목 흐림 0→10 px | **KEEP** | 레퍼런스 구름이 더 희고 빽빽함 — 볼륨 밀도·노출 1회 더 조정 필요. hero 피사체(펭귄 클로즈업 같은 강한 주제)가 없어 첫인상이 약함 |
| EFX-003-02 경로 + 표시점 | DrawSVG `0% → p%` + `getPointAtLength`, 지도 시차 0.55 vh | **KEEP** | 레퍼런스 지도는 음영 기복이 있음(우리는 7월 영상이라 남극이 평평) |
| EFX-003-03 소나 | 2 s 주기, 링 3개 0.2 s 간격, **transform: scale**(레퍼런스는 width/height 애니메이션) | **KEEP** | — |
| EFX-003-04 안개 판 | rotateX 90° → 0°, perspective 900 px | **TUNE** | 안개 판 모양이 구름 렌더 재사용이라 경계가 덜 자연스러움 |
| EFX-003-05 문장 마스크 | `--mask` −40 → 100 scrub | **KEEP** | — |
| EFX-004-01 합성 지구 | globe / glow / mark 렌더 타깃 + 합성 셰이더(ACES ×1.45, 8방향 윤곽선, 흰 표시층, 가림 구) | **KEEP** | 레퍼런스는 변위 맵으로 기복이 조금 더 입체적 |
| EFX-004-02 눈금 링 | 인스턴스 점, 위상 물결(10 s / 3 s, 반대 방향) | **KEEP** | — |
| EFX-004-03 hover 카드 | 레이캐스트(가림 구 우선) + DOM 카드, 조리개 clip-path 0.3 s | **KEEP** | 키보드 접근 없음(레퍼런스도 없음) |
| EFX-004-04 필터 회전 | 대원거리 군집 → 최단각 지수 보간(`1 − 0.95^(60·dt)`) | **KEEP** | 레퍼런스의 500 ms 인위 지연은 뺌(350 ms) |
| EFX-004-05 드래그 관성 | 레퍼런스 계수, 감쇠만 프레임률 독립으로 | **KEEP** | — |

결과 영상: `verification/ref-repro-20260925/ref003.mp4`(스크롤 전체 + 도착 후 소나), `ref004.mp4`(대기 → hover → 필터 3회 회전).

## 4. 왜 v1·v2 시안이 레퍼런스보다 떨어졌나 — 원인 분해 (F-015)

재현 두 건은 한 세션 안에 레퍼런스 가까이 갔고, 연구실 코너는 세 번 고쳐서 나아졌다. 차이를 층으로 나누면:

| 층 | v1 시안에서 부족했던 것 | 이번에 해결한 방법 | 규칙화 가능? |
|---|---|---|---|
| ① 메커니즘 수치 | 추정 속도·곡선 | REF 효과 카드의 **측정·코드 수치를 그대로** 사용(구름 0.9/0.55, 링 10 s/3 s, 보간 5 %/프레임) | **예** — 21번 규칙이 이미 강제 |
| ② 재료(에셋) | 단색 재질, 절차 생성 도형, 저해상도 텍스처 | CC0·공공 도메인 고해상도 원본 + Blender 렌더(구름·영상) + 스타일 재채색 | **예** — 에셋 스펙(해상도·텍셀 밀도·알파·용량)을 효과 카드의 "에셋" 필드에서 체크리스트로 |
| ③ 룩 개발(색·노출·대비) | 톤·노출을 한 번에 정함 | 캡처 → 레퍼런스와 나란히 → 2–3회 조정(지구 노출 2.0 → 1.45, 지도 명암 곡선 3회, 구름 조명 3회) | **절반** — 히스토그램·평균 밝기·대비 같은 수치 비교는 자동화 가능, "좋아 보이는가"는 판단 |
| ④ 모션 타이밍 | 선형·임의 시간 | 레퍼런스 곡선·주기 수치 + RCP-08 | **예** |
| ⑤ 구성·내용 | 피사체·카피·사진이 약함 | 부분 해결(데모 카피) | **아니오** — 아트 디렉션·사용자 판단 |
| ⑥ 렌더 함정 | 각도별 번짐, UV, 인코딩 | 모든 각도 캡처, 수치 검사 | **예** — F-013 규칙 |

**결론**: "결과를 보며 피드백하는 수밖에 없다"도, "규칙만 정하면 된다"도 아니다. ①②④⑥은 **규칙으로 미리 막을 수 있고**, ③은 **AI가 레퍼런스 프레임과 나란히 캡처해 스스로 여러 번 고치는 루프**로 대부분 줄일 수 있으며, ⑤와 최종 취향만 **사용자 판단**이 필요하다. 이번 재현에서 사용자 피드백 없이 레퍼런스 가까이 간 이유가 이 순서였다.

### 4.1 제안 — 레퍼런스 충실도 게이트 (사용자 결정 대기, P6)

구현 결과를 사용자에게 보이기 전에 다음을 통과시킨다. 채택되면 D 기록 + 21번 규칙 부록 + CASE-006 갱신으로 정식화한다.

1. **수치 계약**: 효과 카드의 파라미터 표 값을 코드 상수로 옮기고 출처 주석을 단다(REF-ID·EFX-ID).
2. **재료 스펙**: 해상도(화면 대비 텍셀 ≥ 1:1), 알파 여부, 용량 상한, 라이선스·registry 등록.
3. **나란히 캡처**: 레퍼런스 녹화의 같은 장면 프레임과 우리 캡처를 한 장에 놓고 비교(저장소 밖), 차이를 표로 기록 — KEEP / TUNE / GAP.
4. **자동 수치 비교**(도입 후보): 평균 밝기·명암 대비·주요 색 차이를 레퍼런스 프레임과 비교해 크게 벗어나면 TUNE.
5. **상태 전수 캡처**: 모든 각도·필터·스크롤 구간·hover 상태 캡처(한 상태에서만 터지는 문제 방지).
6. **AI 자기 수정 한도**: 3–5회 안에서 TUNE을 줄이고, 남은 GAP만 사용자에게 질문.

## 5. 기술 스택 점검 — 더 필요한가

| 구분 | 이번에 쓴 것 | 판단 |
|---|---|---|
| 3D 런타임 | three.js vanilla | **충분.** REF-004의 r3f 구조(렌더 타깃 4장 + 합성)를 vanilla로 그대로 재현 — P5의 "vanilla 엔진 + React 마운트" 권장을 뒷받침 |
| 스크롤·모션 | Lenis + GSAP ScrollTrigger + DrawSVG + MotionPath | **충분.** GSAP 3.13부터 플러그인 무료 |
| DOM 연출 | CSS mask·3D transform·keyframes | 충분(REF-003은 WebGL 없이 완성, F-014) |
| 에셋 제작 | `bpy`(Blender 헤드리스), ffmpeg(x264·VP9), Pillow·numpy, gltf-transform | **충분.** 구름·영상·지도·지구까지 이 조합으로 제작 |
| 글꼴 | @fontsource(OFL) | 충분. 상용 서체는 deferred |
| **추가 권장 후보** | — | ① **KTX2 인코더(KTX-Software `toktx`)** — 큰 텍스처를 GPU 압축으로(이 환경엔 없음, 전시 PC GPU 메모리 P2와 함께). ② **pmndrs `postprocessing`**(SMAA·N8AO 등) — three 기본 후처리보다 품질·성능 좋음, 필요 시. ③ **Theatre.js** — 스크롤 카메라 경로가 여러 개가 되면 키프레임 저작 도구로. 모두 선택 사항 |
| 불필요 | r3f(P5), Spline, Unity, Lottie(이번 효과에는 무관) | — |
| 후속 판단 | — | 추가 후보 3종의 득실(손해가 나는 경우 포함)은 `ATTIC_BOOKSHELF_STUDY_2026-09-25.md` §5 — 셋 다 **문제가 측정된 뒤 도입** |
| QA | `tools/spike-capture/capture-frames.mjs`(프레임 단위 캡처 → mp4) | 헤드리스 결과 영상은 가능. **실제 GPU fps 측정은 여전히 사용자 PC 필요** |

## 6. 검증과 한계

- 빌드: 두 spike `tsc --noEmit` + `vite build` PASS. 헤드리스 SwiftShader 캡처, 콘솔 오류는 favicon 404만 `[테스트]`.
- REF-004 hover 대상 명중(`hovered = b`), 필터 후 회전 각도 변화 확인 `[테스트]`.
- REF-003 경로 진행률 0 → 97 %, 스크롤 되돌림 시 역행(스크롤 위치 함수) `[테스트]`.
- **미검증**: 실제 GPU fps, 모바일·터치, 4K 전시 화면, reduced-motion 실기기 확인(코드 경로만 있음). 프레임 단위 캡처라 영상 속 움직임 속도는 실제 스크롤 속도와 다르다.
- 헤드리스 Chromium은 H.264를 못 틀어서 webm(VP9)을 같이 둔다.

## 7. 다음

파이프라인 결정(P1 채택 범위, P5 vanilla + React 확정, P6 충실도 게이트 채택 여부) → 재설계 Q1–Q4.
