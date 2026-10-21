# 구름 햇빛 가독성과 오로라형 운동 — D-152

2026-10-21. RESEARCH / 기존 서고 효과의 보완 설계. **새 runtime을 구현하거나 배포한 결과가 아니다.** 원본 bake·Story·GLB·r8/D-084·기존 기본값은 보존한다. 사용자가 언급한 오로라는 강한 일렁임의 기준으로 읽었고, 녹색/보라색 발광의 승인은 추론하지 않는다.

## 현재 진단

현재 source bdf963a. `preview.html`은 정적 baked 기준이며, 제어·운동은 `light-study.html`에 있다. 라이브 study의 한계도 별도로 존재한다.

- volume phase는 HG g=0.5. 같은 경로·밀도일 때 위상항은 광원방향6 / 측면0.5367 / 반대방향0.2222. 최대비27배. **화면의 최종 명도비가 아니다.** 실제 길이/가림/톤매핑이 추가로 영향을 준다.
- sigmaT=.012/m. 균질10m의 이론 투과율88.69%. 현재 장면은 boundary fade/noise가 있어 실제 투과율을 이 값으로 단정하지 않는다.
- frozen=true 기본. 움직여도 광원기준 좌표의 한 축만 time×.01로 이동한다. 그 축은3noise units/m이므로 drift는약3.33mm/s. grain=.15는 density배율0.85~1.15의 작은 변화다.
- 세기만 높이면 강한 각도 의존성이 유지되고 밝은 시점의 포화·책장 대비 저하가 먼저 생길 수 있다. 이 후자의 화면 영향은 아직 실측하지 않은 위험 가설이다.

## 추천: 햇빛의 가림 + 넓은 시점 산란 + 큰 공간 흐름

| 층 | 구현 후보 | 지켜야 할 것 |
|---|---|---|
| 가독성 | HG g=.1~.25 후보 또는 HG+등방 성분 연출 blend; beam gain 별도 | 단일 전방광 증폭을 피하고 최소3시점 비교. 정확한 다중산란이라고 부르지 않음 |
| 굵은 광선 | 광원기준2D cloud mask의 빈틈·경계 대비와 스케일 | 표면 direct sunlight와 volume에 같은 mask/시간/좌표 적용. 물체 raw shadow는 별도로 유지 |
| 공기 운동 | 저주파3D density domain warp + 중간규모 띠 + 고주파 작은 결 | world/light space에 고정, 카메라 UV noise 금지. 큰 흐름을 작은 grain와 분리 |
| 일렁임 강화 | 높이에 따라 위상이 다른 밀도띠를 부드럽게 변형·이동 | 햇빛 ray 자체를 굽히지 않고 lit volume 안의 밝은 밀도띠가 합쳐지고 분리되게 함 |
| 더 복잡한 흐름 | 필요할 때 curl-noise 속도장/소형 flow texture의 advection | 매 sample마다 고비용 curl 미분을 먼저 넣지 않음. 단순 warp를 curl 유체해법으로 부르지 않음 |

빛이 실제로 휘거나 색띠 자체가 발광하는 결과를 원하면 별도 emissive ribbon/volume aurora가 더 적합하다. 그것은 햇빛 산란과 다른 효과이므로 별도 선택지로 남긴다. 태양빛을 유지하는 이번 추천에 자동으로 혼합하지 않는다.

### 시작 후보 — 아직 채택값/실측값 아님

- 산란 시점편차 g=.15는 위상항 최대비약2.48. 기존27보다 작지만, 같은 source 에너지에서 전방의 강도도 내려간다. gain/광학두께를 같이 비교해야 한다.
- sigmaT=.025~.045/m를 후보로 삼으면 균질10m 이론 투과율77.88~63.76%. sigmaS≤sigmaT를 유지하고 책장 대비를 함께 본다. 전역 안개 밀도만 올리는 처방으로 고정하지 않는다.
- flow speed .08~.25m/s, 큰변형 규모 .4~1.2m, 작은결 .05~.2m를 비교 출발점으로 제안한다. 실제로 가장 보기 좋은 속도/폭을 측정한 값이 아니다.
- 햇빛색 유지, 강도/각도/크기와 별개로 ‘시점 가독성’, ‘공기 농도’, ‘흐름 속도’, ‘일렁임 폭’, ‘구름 대비’, ‘흐름 정지’를 제어한다. 기존 UI를 전부 펼치지 않고 preset+고급설정으로 묶는다.

## 구현 연결 지점

1. `study/lighting-state.js`: 새모드/parameter schema와 clamp. 기존 default 및 version1 링크를 보존한다. 옛 링크에는 기존 모드가 적용돼야 한다.
2. 새 `study/curtain-field.js`: 공통 GLSL 생성/parameter/time 계약. cloud mask 좌표와 density warp를 소유한다. surface와 volume에서 같은 source cloud를 평가한다. full fluid solver는 첫 구현 범위에서 제외한다.
3. `study/volume-shaders.js`: 단일 HG 상수를 제어형 phase로 변경하고 실제 위치p에서 density를 계산한다. `visibility(p)`는 변형 전 실제 위치에서 평가해 물체를 통과하는 빛샘을 막는다. 밀도 warp가 ray/room/depth 좌표를 바꾸지 않는다.
4. `study/contact-shadows.js`: 선택모드에서 direct-light 색에 공통 cloud mask만 곱한다. PCSS·caster geometry는 보존한다. density의 국소 움직임까지 표면광에 억지로 복제하지 않는다.
5. `study/volumetric-light.js`: 공통 time/freeze/phase/field uniforms. 밀도/구름 시간 변화는 캐시된 정적 geometry depth를 다시 그리지 않는다.
6. `light-study.html`: 새비교preset/공유/복원, deterministic time 제어. elapsed clock으로 재생하며 freeze는 time0으로 되돌리는 대신 현재시간에 멈춘다. hidden tab·pause·resume에서 큰시간jump를 막고 reduced-motion은 정지를 우선한다.

## 비교·수용 관문

A 기존 산란 / B 넓은시점 강한햇빛 정지 / C 같은 설정+강한흐름을 같은광원·카메라로 비교한다. 이것은 향후 비교 설계이며 실제 이미지가 아니다.

- 바라봄/옆/등짐 최소3시점. 같은광량/밀도로 좁은밝기차·벽/책장대비를 측정하고 사용자미감 판정을 받는다. 보이는 beam 길이가 다른 시점의 buffer평균만으로 우열을 선언하지 않는다.
- 천창 closed/open, caster/shadow, surface/volume cloud 동기화. 가려진영역에 field 자체발광이 생기면 FAIL.
- 같은카메라/시간/seed에서12프레임 deterministic, 시간변화12장. 공간고정/흐름 이동/큰띠가 합쳐지고분리되는지 확인한다. 강한 움직임은 화면 grain 깜빡임으로 대체하지 않는다.
- freeze에서 마지막시간 유지, resume연속성, hidden/reduced-motion/공유링크/키보드, depthcache 재사용 검증.
- GPU timer 또는 readback 동기화 측정으로 비용 분리. 기존 JS submission시간을 FPS로 보고하지 않는다. 실제 PC/Edge budget 미확정은 확인 안 함으로 남긴다.
- blur/저해상도/48steps가 굵은띠를 뭉개면 sample/field크기부터 검토한다. temporal accumulation은 유령잔상/움직임 blur를 별도 검증할 때만 후보로 넣는다.

## 조사 출처와 범위

- PBRT v4 공식 `src/pbrt/util/scattering.h`, `media.h`: HG식과 위상함수 원리. PBRT의 양방향벡터 정의는 우리 camera ray/toSun 정의와 달라 cos 부호를 그대로 복사하지 않는다.
- Bridson·Hourihan·Nordenstam, *Curl-Noise for Procedural Fluid Flow* (2007): 절차적 발산없는 속도장/흐름 원리. 논문 source/그림은 저장소에 넣지 않는다. 정확한 curl velocity field와 임의 sine/domain warp를 구분한다.
- 웹 PBRT book/Unreal fog 문서는 이번 접속403으로 읽지 못했다. 위 소스/논문을 직접 읽은 범위만 근거로 사용한다.
- 근거/수식/원격번호 검사는 `verification/r1-archive-curtain-design-20261021/`에 있다. 새효과의 이미지·성능·완성도는 **확인 안 함**.
