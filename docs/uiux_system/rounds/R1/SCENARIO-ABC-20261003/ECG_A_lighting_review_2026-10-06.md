# A-P2 빛·재질·후처리 구현 검토

2026-10-06 · D-070 / F-041 · 실제 구현 및 로컬 QA 완료 / 시각 TUNE

## 1. 변경과 범위

사용자 “조명이 없는 느낌” 피드백에 따라 지구/궤도/구름을 보완했다. 승인된 서고 GLB·bake·소품과 내부 조명은 유지한다. A-P3 처리/출력·의자 인계와 B/C를 이번 작업에 섞지 않았다.

| 파트 | 실제 변경 | 판정과 한계 |
|---|---|---|
| 지구 | 따뜻한 방향광, 낮/밤 emission 마스크, 바다·육지·얼음 roughness, 바다 albedo 보완. 남극을 더 드러내는 초기 tilt/카메라 | 빛과 음영은 읽힘. 바다 specular hotspot이 아직 크며 얼음 silhouette의 미세 relief는 목업보다 약함 — TUNE |
| 얼음 | NASA/GEBCO 높이에서 연출용 polar ridge를 더한 4K relief/bump/displacement | 실제 측정 지형을 추가한 것이 아님. 개별 빙하/해안의 지리적 정확성 주장 없음 |
| 궤도·역광 | 광원과 같은 방향의 태양 원반/halo/streak, 약한 optical ghosts, Earth ray 가림 마스크. 대기는 따뜻한 쪽과 푸른 쪽 구분 | flare/bloom-off에도 표면 shading 유지. sphere radius의 보수적 근사 가림이며 구름·지형에 대한 완전 ray occlusion 아님 |
| 지구 구름층 | 작은 bump, alpha 경계 완화, offset opacity로 표면 cloud shadow 근사 | 물리적인 cloud shadow ray tracing이 아님. 기존 2K cloud source의 확대 해상도 GAP 유지 |
| 구름 진입 | 40 sample/4 octave density, 광원 방향의 두 거리 밀도로 감쇠/가장자리 강조, 따뜻한 빛/푸른 내부 음영 | 이전 하얀 안개보다 대비 개선. 가까운 구름의 형태는 목업처럼 뚜렷한 솜 덩어리에 미치지 못함 — GAP |
| 서고 접합 | 완전 cloud 가림 컷/고정 앞쪽 고창/기존 연속 grade 유지 | 새 건축/서고 변경 없음. 5개 동일 room frame에서 max RGB delta 0, 마지막 frame은 극미량 1/255 차이 |

## 2. 기술·재료 판단

- C1–C3: 현행 Three r186 PBR/onBeforeCompile/ShaderPass와 기존 HDR composer 사용. 외부 flare 라이브러리, AI 영상, 새 geometry renderer 추가 없음. 실제 Three shader의 map/normal/emissive 순서를 확인한 후 확장했다.
- REF-001의 역광·rim 경험과 승인 A 목업의 광원 방향이 목표다. 이번 작업에서 Moto 사이트를 새 촬영/측정하지 않았다. shader/수치는 로컬 구현 선택이며 레퍼런스 원본 값으로 주장하지 않는다.
- 태양 5.6, relief displacement .042/bump .025, cloud radius1.056/opacity .14/bump .0015. 기존 지구 r=1, 최대 relief1.042 바깥 cloud shell. 대기 r1.078. full cloud cover .315–.335, scene cut .32 유지.
- 신규 roughness(.4 ocean/.82 land/.64 ice)·relief는 기존 pinned NASA color/height에서 파생. manifest/registry에 두 source hash와 변환 hash, artistic 구분 기록. 신규 전송 파일 roughness406,752 B + relief872,410 B. 기존 height는 제작 source로 보존하지만 renderer는 relief를 사용한다.
- 텍스처 GPU decoding 기준 4096×2048 RGBA 한 장 약32 MiB(+mips). Earth 3장과 night/cloud 추가 메모리가 있으며 전체 scene 메모리 상한/전체 다운로드 예산을 통과했다고 주장하지 않는다. source/GPU map 비용 분리.
- SSS/굴절/DOF/blur/TAA 제외: 지구 shading/빛을 검증하고 기존 선명도를 유지. MSAA4/volume96/grain35/ACES/서고 bloom .35 기존 설정 유지.
- `?flare=0`, `?cloud=0`, `?cloudShadow=0`은 원인 분리용. cloud-off는 컷을 노출하는 **진단**이지 배포용 저사양 전환이 아니다. API set도 같은 옵션 지원.

## 3. 자체 수정 이력

baseline31장 후 initial/수정1/수정2/수정3의 31장 세트를 각각 보존했다.

1. 초기: 따뜻한 조명/재질/flare/구름 통합. 금빛 과다와 거친 cloud bump가 대륙을 덮음.
2. 수정1: 광색을 완화하고 cloud bump/opacity를 줄임. 남극이 보이도록 초기 tilt/카메라를 조정. solar direction과 화면 태양을 같은 위치에 연결.
3. 수정2: 바다 색과 flare halo 보완. elevation만으로 ocean을 나누면 낮은 육지가 파랗게 바뀌는 문제를 발견.
4. 수정3: RGB와 높이로 바다 마스크 보정, ocean roughness .4로 반사 완화. 최종 `lighting-final3`. 추가 시각 튜닝은 하지 않음. 남은 GAP를 사용자 리뷰로 넘긴다.

파일명 lighting-final은 수정2의 중간본이다. 최종본은 lighting-final3/lighting-final-diagnostics/lighting-runtime/lighting-motion이다. 이전 diagnostics도 중간 증거로 보존한다.

## 4. 검증과 충실도 게이트

증거: `verification/a-arrival-20261006/lighting-*`.

- 최종31 전이/전체/접합 캡처, 24 효과 on/off +12 정지 시간 +2 reduced 캡처, 17 runtime 캡처. 브라우저 오류0.
- runtime 3 R 경계, 스크롤 정지 중 재생, native scroll, reduced-motion PASS. 데이터/심장 시계 변경 없음.
- 정방향/역방향 각8초 3D canvas VP9 + 각12 decoded frames 검토. DOM/ECG overlay는 영상에 없으며 전체 캡처/runtime으로 따로 검증. 전체 무충돌/모든 속도의 시각 품질 증명 아님.
- 녹화 없는 정방향8초 RTX3070/Chromium/1920×1080/DPR1 GPU query479: composer p50 **8.02ms / p95 22.57ms**, RAF p50 16.7/p95 16.8ms. 이전 p95~10.34ms보다 비용 상승. 높은 구름 비용은 후속 성능 TUNE; 로컬 짧은 영상의 프레임 간격을 전시PC 60fps 보장으로 확대하지 않는다.
- Vite build38 modules PASS. 최초 sandbox realpath EPERM은 승인된 동일 build 실행으로 재검증. >500KB JS chunk 경고는 유지.
- G1: 로컬 파라미터/REF-ID 기록. 원본 Moto 수치 복제 PASS 아님.
- G2: source/derived hashes4개 PASS. 2K cloud 근접 1:1 texel 및 전체 전송·메모리 예산은 GAP.
- G3: 전이12장, 효과 전중후와 정역 영상 확인. T01–T03와 전후 나란히 비교 이미지는 workspace `outputs/A_lighting_review/reference-before-after.jpg`에 보존. 목업은 개념 목표이며 Moto runtime 촬영물이 아님. 정확한 원본 레퍼런스 같은 비율 전체 대조는 이번에 새 수행하지 않음.
- G4: `lighting-look-metrics.json`. 초기 frame linear luma mean .04697→.05844, p95 .19501→.34293, warm fraction .00550→.09191. T01은 mean .16236/p95 .85716/warm .07868. 구도/면적이 다르므로 수치는 설명용이며 품질 PASS 판정값이 아님.
- G5: 현재 경로/효과off/시간/reduced/runtime/정역 검토. target PC/Edge/600초와 임의 카메라·임의 hover는 미검증.
- G6: 초기 이후 **자체 수정3회**. 최종 시각 판정은 TUNE, 기술 PASS와 구분.

## 5. 다음 피드백

현재4198 전체 장면을 새로고침해서 **태양 위치와 밝기, 얼음 shading, 구름의 빛·깊이, 고창 접합**을 한 흐름으로 확인한다. 목표 목업과 같은 퀄리티에 도달했다고 주장하지 않는다. 남은 얼음 silhouette/cloud close-up/specular와 성능 TUNE를 파트별로 처리한 뒤 A-P3로 진행한다. 승인된 서고 재평가는 선행 게이트가 아니다.
