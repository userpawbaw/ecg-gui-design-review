# A 구름 외부 VDB 실제 조달·광학 시험

2026-10-06 · D-085 / F-053 / CASE-007

## 범위와 결론

JangaFX 원본 Cloud Pack을 실제 조달했다. 10개 density VDB를 같은 빛/카메라로 렌더하고 01/06/10의 세 시점을 비교한다. 단독 에셋 광학 시험이며 현재 웹 전이를 교체하지 않았다. 사용자 제작 피드백 **1/2** 유지. 기존 NASA 광역 texture와 서고 KEEP를 보존한다.

현 단계 판단은 **조달/불러오기/오프라인 렌더 PASS, 목업 충실도 TUNE**. 개별 적운의 조형이 있다는 것과 넓은 궤도 구름층·하강 통로가 완성되었다는 것은 별개다.

## 출처와 실제 파일

- 공식 배포: https://jangafx.com/software/embergen/download/free-vdb-animations
- 공식 링크의 파일: https://www.mediafire.com/file/879onggscuon7ew/CloudPackVDB.zip/file
- 실제 ZIP 109,761,538 bytes, sha256 3676ba4c7ac431446731f956f98e925ad3db31354b8b4adcb137dc0250595f73.
- 10개 VDB + EmberGen preset, README/LICENSE. 원본은 assets/source/jangafx-cloud-pack/에 보존(기존 gitignore). VDB별 bytes/hash/grid/transform/bounds는 survey-manifest.json. 원문 LICENSE/README 사본과 acquisition.json은 검증 폴더에 보존.
- assets/registry.json: jangafx-cloud-pack-vdb-20261006 / test-only. 현재 내부 시안 정책 D084. 이 팩은 파일 안에서도 CC0 명시.

## 동일 조건 시험

Blender bpy 4.5.3 LTS / Cycles / 실제 RTX3070 OptiX. 10종 survey 480×270, 24 samples. 선별 3종 960×540, 96 samples. AgX/노출0, 백색 density/anisotropy .45, volume bounces6, step .5, 태양방향 (.7058,-.4836,.5176), energy4/따뜻한색, sky .35. Bloom/flare/DOF 없음. 자동 denoise 사용.

각 VDB의 최대 bbox 폭을8로 정규화해 같은 frame으로 비교한다. 다른 원본 크기의 물리 단위를 임의로 km라고 주장하지 않는다. 측정 지표가 아닌 조형 비교용 스케일이며 실제 지구 인계 때 voxel/광학 길이·밀도를 다시 맞춘다.

- survey: (10,-13,8) → (0,0,1.3)
- far-diagnostic: (26,-34,23) → (0,0,1.3)
- orbit-top: (7,-9,7) → (0,0,1.4)
- descent-side: (7,-10,2.6) → (0,0,1.5)

far는 개별 구름 축소 시험이고 지구 전체 렌더가 아니다. 파란 평면은 그림자 확인용 receiver, 실제 바다/행성 지형이 아니다. 각 asset의 위/옆/원거리만 비교하며 이전 mockup과 동일 구도라고 주장하지 않는다.

## 자체 시각 검토와 선택 이유

| 후보 | 보이는 형태와 용도 | 보완 필요 |
|---|---|---|
| 01 | 두 큰 lobes 사이 홈/틈과 얇은 주변부. 군집 사이 통로 후보 | 단독 덩어리처럼 고립되지 않도록 다른 크기의 군집과 연결 |
| 06 | 길게 펼쳐진 낮은 군집. 궤도 층의 바탕 후보 | 한 자산 반복 패턴 회피, 넓은 분포/곡률·지표 그림자 필요 |
| 10 | 세로로 솟는 형태와 작은 주변 돌기. 하강 옆면 강조 후보 | 화면을 모두 메우는 탑형 조형은 제한, 전체 층 높이 차를 자연스럽게 연결 |

survey에서 기존 동일한 구형 돌기보다 큰 형상 변화·경계 침식·홈을 확인했다. 다만 미세한 솜뭉치 인상과 회색조의 단조로움이 남아 목업 수준 KEEP는 주지 않는다. 실사진의 매끈한 넓은 면/얇은 띠는 이 적운 팩만으로 해결되지 않는다.

## 광학 기여 분리

06 옆면에서 기준(하늘광 .35 / bounces6), direct(하늘광0 / bounces0), single(하늘광 .35 / bounces0)을 같은 카메라로 비교한다. volume bounce 제한 변화는 특정 renderer/asset에서의 실험이며 Arnold 숫자와 동등한 물리 설정이라는 뜻은 아니다. 최종 결과/비교값은 manifest와 해당 PNG로 확인한다.

## 다음 제작 packet

1. 06 기반의 넓은 군집, 01의 통로와 10의 일부 옆면을 조합. 원거리 coverage와 목표 확대 footprint부터 고정한다. 얇은 권운은 별도 texture/낮은 density층 후보.
2. 반사/대기/얼음과 독립된 구름 기준에서 태양각·sky fill·optical length를 보정. 넓은 흰 면과 깊은 홈, 구름 아래 그림자, 얇은 가장자리 확인. Bloom은 이후.
3. 같은 배치와 빛을 국소 density/cache로 웹 변환하거나 경로 제한 베이크로 비교. 먼 지구에 이 군집을 크게 붙이는 방식은 제외. 현재 스크롤/Rclock/서고 유지.
4. 전체 전이의 실제 정역 wheel·경계 정지·해상도·그림자/대기 접합을 확인한 후 사용자 제작 피드백2. 이 독립 시험을 2차 실패로 계수하지 않는다. 실패 시 D080 두 fallback 비교.

## 증거와 미확인

verification/a-cloud-vdb-20261006/gallery.html, survey-contact.jpg, survey/detail/광학 분리 manifest, acquisition 및 source LICENSE/README. 실제 whole-Earth cloud map, 구름층/하강 통로, 얇은 층, 웹 변환, runtime 같은 camera 비교, 실 GPU frame budget/targetPC는 미검증. bpy 공식 manual web fetch 402 실패: 버전별 수치의 근거는 설치 API/실행 결과이며 공식 권장치로 기록하지 않는다.

최종 광학 직접 검토: direct와 single은 짙은 회색, 기준6bounce는 훨씬 밝은 내부/홈을 보인다(optical-contact.jpg). 이 조건에서 내부 빛 전달의 기여가 큰 것을 확인. 아직 기준의 흰면도 평범하고 솜뭉치 인상이 있어 목업충실도 TUNE 유지. 21개 PNG 디코드/크기 검증, 증거 sha256 고정.
