# A · 같은 지형 위 80개 실제 VDB 구름 필드

2026-10-07 · D102 / F068 / O017 / CASE007 · 구현 후보 TUNE, 사용자 리뷰 대기.

## 이번 작업 범위와 결과

사용자 “한번 진행해보자” 승인에 따라 근경4·중경16·원경60군집을 제작했다. 기존 북반구 terrain/height1.5×/지형 LOD/태양/서고를 유지하고 화면 plate 대신 같은 3D 공간에 cloud-only 합성했다. D100 단독 구름은 `cloudMode=single`로 보존한다. A-P3/Story/BC 별도, 이전 combined 후보 feedback2/2 실패와 D080 두 대안 미실행 기록도 유지한다. 현재 사진 레퍼런스 품질 달성/최종 KEEP를 선언하지 않는다.

## 실제 에셋과 변환

기존 JangaFX cloud06/01/10 원본을 native OpenVDB13 `copyToArray`로 변환했다. 실제 연속 density를 사용하며 procedural noise/0·1 topology로 대체하지 않았다. 고해상도128×64×192, 중간64×32×96, 원경32×16×48 R16F, 태양 광학깊이64×32×96, 보수적 occupancy16×8×24 R8. 원본 transform/범위/hash는 source manifest, 제공 runtime 파일 SHA는 `verification/a-cloud-field-20261007/asset-pins.json`.

세 source를 공유하고 균일 확대만 적용해 고정 태양 cache 방향을 유지한다. 광학두께는 instance scale을 반영. seed10207 불규칙 배치로 첫 격자 반복 trial을 보완했다. 원래 기상의 지리적 위치 복원은 아니다. 내부 검토용 D084 정책/기존 JangaFX 출처·이용조건을 계승하며 출품 전 재검토한다.

## 렌더와 거리별 품질

- 전체 field가 기존 위치에 존재하고 카메라 접근으로 커진다. 원경도 우선 저해상도 실제 volume을 사용했다. D101의 impostor 혼합은 이번에는 미적용; 비용/질감에 따라 후속 대안이다.
- 화면 투영 크기160→100px에서 high→mid, 40→20px에서 mid→far density를 연속 혼합. 광선 샘플160/48/20, 빈 occupancy cell 건너뛰기, 60% 축 해상도 공통 volume target.
- terrain depth는 군집마다 반복하지 않고 정확한 현재 scene/camera에서 한 번, volume은 정렬된 InstancedMesh 한 번으로 렌더. ray distance를 scene depth로 제한한다.
- fixed receiver-plane ground transmittance 두 cache를 near/wide 혼합. OFF/4/20/80 모드마다 해당 구성 cache를 사용하며 공통 약한 wind 이동을 따라간다.
- cloud 내부 p.365 camera(0,7,-3) / look(0,7,-8); p.37 이후 가림 카메라를 명시해 역방향 점프도 과거 camera 상태에 의존하지 않게 했다. p.385–.445 cover 해제, 기존 서고 유지.

## 리소스 산술

실제 scalar+light+occupancy+6 shadow cache **15,098,880bytes =14.399MiB**. 1080p에서 공통1152×648 volume RGBA16F와 depth color/depthfloat 추정11.391MiB. 구름 관련 합계 약**25.79MiB**, mesh/driver/base postprocessing/기존 terrain 제외. JS CPU 업로드 buffer도 별도 약14.4MiB이며 VRAM 측정치로 합산하지 않는다. 실제 atlas가 없는 경로여서 D101 hybrid45–80MiB 산술과 동일 구현의 비교가 아니다.

## 실제 GPU 측정

RTX3070 ANGLE D3D11, renderer1920×1080/pixelRatio1/MSAA4, 고정t2.4/frame12/grainOFF, 각 case warm40RAF 후 유효GPU120샘플. timer는 실제 composer.render 구간: CPU/DOM/arch.update GPU 작업/전체 display latency 제외. Khronos 공식 `EXT_disjoint_timer_query_webgl2` 기준 기존 타이머 사용.

| p / 시점 | OFF p50/p95 ms | 4군집 | 20군집 | 80군집 |
|---|---|---|---|---|
| .235 북유럽 확대 | 5.785 / 8.472 | 6.514 / 9.045 | 6.570 / 9.171 | 6.782 / 9.532 |
| .300 구름 접근 | 5.845 / 8.820 | 7.255 / 9.911 | 5.639 / 8.145 | 5.657 / 7.948 |
| .365 내부 | 3.692 / 5.736 | 5.690 / 7.873 | 5.767 / 7.973 | 5.725 / 8.772 |

80개가 개수에 비례해80배 비용이 되지는 않았다. .235/.365 중앙값 차는 약1.00/2.03ms지만 **.300은 모드 순서·시스템 편차 때문에 OFF보다 낮게 측정**되었다. 이를 구름이 성능을 개선한다는 의미로 해석하지 않고, 정확한 추가 cloud 비용/예산 충족 판단은 보류한다. percentile 차는 paired cloud p95가 아니다. 별도 기본창 round2 8case 측정은 다른 배치/LOD 버전으로 보존, 해상도만의 효과를 주장하지 않는다. OFF도 common compositor/ground shader baseline이므로 완전한 cloud 시스템 제거 비용과 다르다.

## 브라우저 증거

최종1080p12 benchmark case + 지구→서고13 fixed PNG/JSON. 추가 일반창 정역 wheel 샘플은 unlocked scroll 메타로 확인하며 전체 연속영상이 아니다. 원본 canvas, source/code/capture hash, benchmark 값은 `verification/a-cloud-field-20261007/browser-manifest.json` / `gallery.html`. fixed13장의 짧은 timing값은 성능 결과로 사용하지 않는다. 최신 shader 오류는 없고 O017의 초기 `edge` 충돌 기록은 도구 로그에 역사적으로 남아 있다.

## 자체 피드백 및 제한

TUNE: 근·중·원경 분리와 동일 terrain 유지/같은 구름 내부 접근은 구현했다. 실제 화면에서 밝은 면이 너무 희게 뭉칠 수 있고 구름 크기/간격/반복 silhouette는 사진과 대조해 튜닝해야 한다. 새 넓은 뷰에서 먼 지형의 직선 수평선/mesh 경계가 드러나므로 카메라·far terrain coverage·haze를 별도 보완한다. 기존 근접 지형 디테일 KEEP를 철회하는 것이 아니다.

center 기반 back-to-front sorting은 서로 관통하는 volume의 완전한 광학 해법이 아니다. occupancy는 보수적인 block-max지만 interpolation support dilation 검증은 미완. fixed plane 그림자는 실제 굴곡 receiver 높이·구름 상호 그림자·다중산란의 정밀해법과 다르다. wind는 약한 공통 이동이며 실제 fluid density evolution이 아니다. global thin cloud shell과 local field의 완전한 기상 연속성도 미완. 타깃PC/mobile/reduced motion/600초 replay/soak/전체 연속 영상은 미검증.

## 검증 게이트와 다음 단계

source scalar/hash PASS, actual depth/shared draw 구조 확인, build67 PASS. 자동 record PASS는 시각품질 PASS가 아니다. 최종 상태 **TUNE / 사용자 같은공간·부피/음영·거리별 밀도·내부 가림 리뷰 대기**. 다음은 사용자 피드백 후 필요한 cloud exposure/coverage와 먼 지형 경계를 좁혀 보완한다. 승인 없이 Story/BC나 D080 winner를 확정하지 않는다.

## 참조 자료

공식 OpenVDB https://www.openvdb.org/documentation/doxygen/python.html · native scalar 변환 근거. 공식 Three volume https://threejs.org/examples/webgl_texture3d.html · 실제3Dtexture 경로. 공식 GPU timer https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/ · 측정 범위/유효 query. D101의 Epic/Guerrilla source mining 및 기존 Arnold 광학 기준을 계승하되 native 광학과 동등하다고 주장하지 않는다.
