# 서고 빛 커튼 — 독립 실시간 구현

판정: **CONDITIONAL** — 광학 bench·staged Chromium 기능/연속 캡처 PASS. 사용자 미감·실제 GPU 속도·Cycles 최종 비교는 확인 안 함.

D-148 / REF-016, `claude/archive-light-r7-ag2rja`, baseline `224e413`. 기존 Story 파일을 import/수정하지 않은 별도 PBR study의 방향광 볼륨 구현이다.

## 보기와 재현

- Pages 배포 후 진입 경로: `light-study.html?view=shafts`. **빛결 옆에서 보기**는 기준 태양 방향과 옆/아래 시점으로 이동한다. **정면 기준 보기**, **처음 설정**도 있다. query 없는 기존 초기값225°/35°는 유지한다.
- 방위·고도·빛줄기 강도, 빛 커튼 on/off, 공간 noise 결의 세기, 자동/높음/빠름, 공기 흐름 정지와 설정 링크를 제공한다. 헤더를 접으면 전체 화면을 볼 수 있다.
- 기본225°/35°는 천창에 거의 빛이 안 드는 방향이다. 효과 오류를 숨기려 추가 beam을 그리지 않는다. 옆보기 버튼은 별도 탐색 프리셋이며 Story/r8/D-084 기본값을 변경하지 않는다.
- 개발 검증(임시 패키지와 로컬 서버를 도구가 만들고 정리함):

```powershell
npm run verify:archive-volume
```

Python 표준 라이브러리와 v2의 pinned Three/Playwright·Chromium이 필요하다. `ARCHIVE_STAGE_PYTHON`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, `ARCHIVE_VOLUME_RESULTS` 환경변수로 도구 경로/증거 경로를 지정할 수 있다. bench fixture는 검증 서버에서만 제공되고 공개 artifact에는 포함되지 않는다.

## 실제 측정·광학/기능 검사

전체 수치와 판정은 [qa-result.json](qa-result.json)에 있다. 환경은 Chromium154, 640×480 기능/연속 프레임 및1280×720 최종 캡처, headless ANGLE SwiftShader다.

| 검사 | 관측값·판정 |
|---|---|
| 닫힌 천창 | raw 산란 max=0 / mean=0 / lit pixel0 |
| 열린 천창 | raw 산란 max≈0.04227, mean≈0.003149, lit49440 (480×360 적분 RT) |
| alpha cutout 천창 | raw 산란 max≈0.06927, mean≈0.01728, lit124183. alpha가 무시되면 불투명 판이 되어 이 값이0이 됨 |
| source offscreen | bench 광원이 화면 밖인데도 열린 구멍 beam 유지 |
| 5회 engine 재생성 | bench GPU texture 수11/11/11/11/11; 소스 geometry는 proxy와 공유 |
| 실제 GLB | 62mesh, 295864triangle, normal map22/roughness map21, baked color attribute35개 제거 |
| 실제 roof ray | hatch/skylight sample은 천장 slab hit없음. solid sample은 y≈5.14988 / 4.99996 hit |
| 외부 caster 포함 | bounds min≈(-3.7499,-0.0998,-5.15), max≈(5.0892,8.2771,5), room 밖 잎/가지까지 광원 depth 범위에 포함 |
| 입력·복원 | 실제 range fill·ArrowRight 키로90.1° 반영, 여러 입력이 raw depth1회 갱신으로 합쳐짐. reset225°/35° 및 version1 설정 링크/복원 통과 |
| 결·off/강도0 | range grain0/0.3의 buffer hash 차이, 같은 light-depth 재사용. off/강도0은 출력1pass, on은4pass |
| 출력 변환 대조 | effect off vs direct PBR의 전체 RGB 평균 절대차≈0.953/255. 최대75/255는 MSAA/선형 resolve 경계 차이도 포함하며 픽셀 동일 주장은 하지 않음 |
| 6방향 | 각도별 volume buffer/밝기 변화. 180°/35°는 산란0, 225°/35°는 거의0, 270°/35°는 가시 경로 증가 |
| 정지/변경 프레임 | fixed12 buffer hash동일, sweep12 + camera/orbit12 캡처, 카메라 이동 동안 광원 raw depth 추가 갱신 없음 |
| 품질/레이아웃 | input 중 fast·정지 후 settled로 전환, 375×667 overflow없음, reduced-motion 시작 시 공기흐름 정지 |
| 브라우저 오류 | page/console error0, failed request0 |

실제 GLB material은 조사한62mesh 모두 opaque/DoubleSide/alphaTest0이다. cutout 지원은 별도 synthetic bench에서 검증한 것이며 원래 GLB가 alpha texture를 쓴다고 기록하지 않는다.

색·매질 비교는 동일 카메라의 [on 캡처](archive-curtain-clear-1280.png) / [off 캡처](archive-curtain-off-1280.png)를 쓴다. [조작 UI](archive-curtain-1280.png), [각도12프레임](sweep-contact.jpg), [시점12프레임](orbit-contact.jpg), 개별 `frames/`도 함께 남겼다. 벽/목재 albedo의 기존 얼룩은 이 효과에서 교체하지 않았다. 천창 밖에서 보이는 검은 잎 실루엣도 원본 caster geometry다.

## 구현과 비용

- 프로젝트 `archive.ts`의 알고리즘을 독립 `study/` 모듈로 적응. 원문 외부 셰이더/이미지/모델 복사·새 외부 패키지 설치 없음. 공식 Three OutputPass/FullScreenQuad 사용.
- 표면 PBR·raw 광원 depth2048²·시점 depth를 동일 광원 방향으로 연결. 별도 depth proxy는 map/alphaTest/side를 보존한다. Three PCF 비교 texture/private framebuffer 접근을 쓰지 않는다.
- room/표면 앞까지 clip한 단일 산란. sigma_t0.012/m, sigma_s0.008/m, HG g0.5, 공간 농도 결15% 시작값. 빛에 수직인 짧은 결과 진행 방향의 긴 결은 미감 근사다. 흐름은 기본 정지한다.
- fast: 각 축0.25/16steps, settled:0.5/48steps, high:0.75/64steps. raw/filtered RT 쌍은 사전 생성·재사용한다. 저해상도 bilateral filter → 깊이 기반 upsample/HDR 합성 → 공식 OutputPass의 ACES/sRGB1회.
- opaque scene target MSAA4 + depth resolve. effect off/강도0은 volume/filter/composite를 건너뛰고 scene+OutputPass만 실행한다.
- 광원/가림체 변경은 depth dirty, 카메라/강도/결 변경은 재사용. freeze 상태 정지 때 렌더를 쉬고 탭이 숨겨지면 중단한다. bfcache 복귀는 기존 상태를 재개하며 실제 폐기 때 자원을 해제한다.
- 공개 artifact19files 약13.35MB. bench/보고서/캡처/recipe는 공개 artifact에서 제외하고 3개 study runtime·공식 addon만 명시 allowlist로 추가했다.
- 640×480 SwiftShader 동기 render+1px readback wall time: fast p50≈711.4ms/p95≈803.2ms, settled p50≈770.8ms/p95≈828.7ms. 소프트웨어 경로의 큰 비용이 관측됐다. 하드웨어 GPU의 실시간 목표 통과 수치가 아니다.
- 동일 카메라 beam ROI의 L* 중앙값은 off≈1.83→on≈38.38, 우측 서가 ROI는25.91→25.05였다. beam 영역의≥250/255 clipping은0. 지표 범위와 on/off 전체값은 [image-metrics.json](image-metrics.json)을 따른다.
- 검증 도구의 동기 render/readback 측정은 `serializedSoftwareRenderWaitMs`에 기록한다. 소프트웨어 renderer의 wall time이며 실제 GPU ms·화면 FPS·사용자 입력 지연으로 해석하지 않는다. 실제 GPU30/60fps 목표의 달성을 주장하지 않는다.

## 확인 안 함·남은 차이

- 실제 Windows Edge/물리 GPU·모바일 터치 체감·장기 soak, GPU timer query와 입력→디스플레이 지연, 실제 네트워크 속도.
- 원본 B3의 가까운 key SpotLight 및 간접광. 이번 구현은 현재 슬라이더의 방향광만 산란시킨다. 사용자 방향 선택 후 같은 camera/source/매질로 Cycles4.5.3 비교가 필요하다.
- 다중 산란·구름 유체·완전 투명 유리의 체적 누적·SSR·SSGI. 첫 버전에 별도 먼지 입자도 추가하지 않았다. 공간 noise와 실제 가림이 만드는 빛 커튼이 우선이다.
- 외부 데모를 같은 시점으로 촬영한 직접 fidelity 비교와 사용자 미감 승인. source 구조·우리 optical bench/연속 캡처를 검증했으며 최종 렌더 동등 품질은 아니다.
- 공개 배포/브라우저 결과는 별도 아래 기록으로 확정한다. 파일 존재·로컬 PASS만으로 배포 완료라고 하지 않는다.

## Pages 상태

이전 D-147 run39281362397는 반복 URL 조회에서 queued였으나 새 query를 붙인 재조회에서 success(updated2026-10-19T16:36:04Z)였다. 이번에는 run의 실제 최신 응답과 공개 HTML/modules를 별도 재확인한다. 본 구현의 run ID·source SHA·공개 검증 결과는 배포 후 WORKLOG/공개 결과 JSON과 함께 기록한다.

## 공개 배포·브라우저 확인 완료

- 공개 URL: https://userpawbaw.github.io/ecg-gui-design-review/light-study.html?view=shafts&v=4dc59ce
- source commit: `4dc59ce`; main workflow dispatch run [39295789728](https://github.com/userpawbaw/ecg-gui-design-review/actions/runs/39295789728), success. 실제 workflow head와 runtime source는 [deployment.json](deployment.json)에 구별했다.
- [public-result.json](public-result.json): 공개19files 모두HTTP200/sha256 일치. bench/README/recipe/QA 결과는 artifact에서 제외되어404. 공개1280×720 Chromium154/SwiftShader에서 volume 활성·raw2048²·settled0.5/48 확인, range75°/45° 변경 시 buffer hash/산란량 변화와 raw depth1회 갱신. browser error0/failed request0.
- [실제 공개 캡처](public-preview.png). 기존 bake 기준 링크로 이동하고 뒤로 돌아온 뒤 다시 렌더하는 동작 PASS. HTTPS는 session proxy CA의 SPKI를 한정 신뢰했고 광범위 ignoreHTTPSErrors를 사용하지 않았다.
- feature push run39295748312는 앱 문제가 아니라 github-pages 환경의 branch 보호 정책 때문에 배포 전 거절됐다. 정책은 유지하고, 후속 workflow는 main의 dispatch에서만 deploy하도록 guard했다. feature push는 배포 job을 skip한다. 이로써 새 커밋마다 불필요한 배포 실패를 만들지 않는다.
- 전체 구현/기능의 확인 범위는 위와 같으며 실제 물리 GPU·모바일 속도·사용자 미감·Cycles/near key 비교는 여전히 확인 안 함이다.
