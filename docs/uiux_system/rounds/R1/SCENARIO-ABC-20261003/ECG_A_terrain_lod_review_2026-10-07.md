# A-P2 높이1.5×·필요 영역 지형 LOD 제작 검토

2026-10-07 · D-092 / F-060 / O-013 / CASE-007

## 1. 사용자 결정과 작업 흐름

지형 디테일은 사용자 **KEEP**. 높이는 **1.5×를 사용해보고 근접 문제가 있으면1×로 복귀 가능**. 지구 전체에 같은 고해상도를 적용하는 것이 아니라 확대 화면에서 필요한 지역/시점만 상세하게 만들고, 해당 화면의 부족함을 피드백·튜닝한다. 이전1× 권장은 이번 결정으로 갱신한다.

대기광·바다 반사·극지 재질과 구름은 앞으로 연결되는 전이의 **각 시점에서 함께 보완**한다. 이번 최적화가 그 광학 항목을 완료한 것이 아니다. 서고 빛·소품과 VDB 구름 형태 KEEP 유지. 사용자 전체 구름 제작 피드백은1/2 유지한다.

## 2. 실제 적용

1. **1.5× 자산:** 같은 원본 고도를 변형하고 normal 재계산. Cycles3장과 새로운 packed Blender 파일 저장, 이전1×/2.5× 원본 유지.
2. **지역 분할:** 이전 연결지형의 표면을64타일로 나눠4단계(원본 grid stride8/4/2/1)를 생성. 256개 압축 geometry 파일 약15.1MB. 지구 전체용 고해상도 자산이 아니다.
3. **화면 오차:** 각 coarse mesh의 실제 대각 삼각형 높이와 전체 원본의 최대 높이 차이를 측정. 카메라의 tile 최근접 거리/FOV/그리는 pixel 높이로 투영해 **1.2px** 기준으로 선택한다. 단순 방사 고도만으로 정하지 않는다.
4. **전환:** 더 높은 품질은 바로 요청, 낮추기는20% 여유를 둬 경계 왕복의 반복 전환을 억제. 다음 refinement를 임계값70%에서 선행 요청. 로딩 중에는 이미 준비된 지형을 유지한다. 최초 로딩은 아직 일부 타일이 나타날 수 있고, geometry morph는 미구현이라 연속 움직임 popping은 TUNE.
5. **화면 밖:** tile box가 카메라 frustum 밖이면 신규 요청·일반 표시를 제외. 가까운 기존 지형은 그림자 caster로 유지하며 Three.js가 카메라/광원 frustum을 따로 처리한다. GPU clipping·shadow draw까지 비용0이라고 주장하지 않는다.
6. **경계:** 공통 원본 normals와500m downward skirt로 다른 subdivision 사이 틈을 가린다. skirt는 LOD 차이보다 충분한지 움직임에서 추가 확인한다.
7. **로딩/메모리:** 동시4요청, coarse fallback, 실패 타일 무한 재요청 방지. geometry 배열48MiB 예산과 미사용 오래된 mesh dispose. 역스크롤 재진입을 위해 필요한 자산은 cache에 유지한다. 이 수치는 실제 전체 VRAM이 아니라 geometry CPU/GPU 배열 산정량이다. texture/렌더 타깃/driver 메모리는 별도다.
8. **지도:** 초기1024px 광역 지도, level2이상 필요시 원본 광역/국소 지도를 지연 로딩. 국소는5% 경계 혼합과 약17프레임 fade-in. mipmap·최대8 anisotropy. 국소 지도 해상도는 이전18m 샘플이며 근접 상세 부족시 더 높은 자산을 해당 구도에 추가한다. 모든 지역을 무한 확대할 수 있다는 의미가 아니다.

## 3. 조사 근거와 실제 번안

- [Three.js LOD](https://threejs.org/docs/pages/LOD.html): 거리별 mesh와hysteresis. 기본LOD를 그대로 사용하는 대신 tile별 measured error를 screen size로 선택했다.
- [Three.js Object3D](https://threejs.org/docs/pages/Object3D.html): frustumCulled와shadow 처리. 카메라 밖이라고 그림자 기여도 일괄 제거하지 않는다.
- [Cesium Globe](https://cesium.com/learn/cesiumjs/ref-doc/Globe.html), [Cesium3DTileset](https://cesium.com/learn/cesiumjs/ref-doc/Cesium3DTileset.html): screen space error, preload와cache 예산을 참고했다. Cesium 엔진/3D Tiles를 설치한 것은 아니며 현재Three.js에 국소 적용한 구현이다.

공식 근거는 기능의 가능성을 뒷받침하며 우리 scene의 품질/성능을 보증하지 않는다. 원래 bilinear quad로 계산했던 오차는 실제 triangular mesh와 다를 수 있어 최종 exporter를 triangle interpolation으로 교정했다. 따라서 초기 검증의 광역496,966개 수치를 최종 성능값으로 쓰지 않는다.

## 4. 실측·검증

[실제 미리보기](http://127.0.0.1:4198/terrain.html) · [기준렌더와 웹 화면 비교](../../../../../verification/a-terrain-lod-20261007/gallery.html)

실제 IAB에서 광역→접근→능선→광역→접근 UI 이동/확대·축소와 최종3PNG/JSON 캡처를 확인했다. 최종 capture는 오류0/로딩0. `browser-check.json`과`asset-selection-check.json`에 근거가 있다.

| 최종 실제 화면 | 가시 tile | 선택 지형 삼각형 | 전체 tiled847,090 대비 | geometry 배열 cache |
|---|---:|---:|---:|---:|
| 광역, 역방향 복귀 후 | 64 | 715,300 | 약15.6% 감소 | 약25.6MiB |
| 접근 | 62 | 820,700 | 약3.1% 감소 | 약25.6MiB |
| 능선 | 46 | 609,416 | 약28.1% 감소 | 약25.6MiB |

이 값은 **선택한 주 카메라 지형의 비용 추정**이며 renderer 전체 삼각형에는 shadow pass 등이 더해진다. 실제 frame time/FPS/GPU성능 개선률이 아니다. 최고 품질로 보이는 지형이 많아 접근 시점 절감 폭은 작다. 과도하게 지형을 줄여 승인 디테일을 훼손하는 방식은 선택하지 않았다. 원래 unpartitioned812,800과 비교하면 skirt 비용 때문에 접근 선택값이 더 많을 수 있다.

추가 CPU 검증: 256개 geometry hash/gzip byte length/index범위,3camera에서screen오차1.2px이하, 반대쪽을보는 camera의 가시tile0 확인. viewport/target과hysteresis 이력 차이 때문에 CPU 값과 실제 캡처 값은 동일하지 않다. native3장 hash/1600×900 검증. 최종 웹 build는별도확인한다.

### 실제 화면 자체 피드백

- **KEEP:** 높이1.5×로 능선/골짜기 가독성 유지. 필요한 refinement는 확대에 따라 선택됨. 역방향 복귀 로딩 오류 없음.
- **TUNE:** native와WebGL 환경광/재질·그림자 차이, 가까운 경사면의 기존 지도 blur, LOD경계 연속전환 popping/shimmer. 아직 목업조명과같은최종룩이 아니다.
- **미검증:** 600초·targetPC성능, cache 압박 시 장시간 eviction, 실제휠/터치/다양한viewport 전체경로, global 지구와 구름/같은서고 연결.

초기 gzip 타일은 정적서버가 Content-Encoding 처리하여 fetch에서 이미 풀린 상태였는데 다시 압축해제를 시도해 실패했다. gzip magic+예상byte length를 확인해 원본압축/이미decode 양쪽을 지원하도록 수정했다. 빌드가 성공했다는 것만으로 실제 타일 렌더 성공이라고 보지 않은 사례다(O013). 기존 지구 기본 페이지에는 새지역scene을 덮어쓰지 않았다.

## 5. 다음 작업 — 시점별 필요한 양만

1. **원형 지구/높은 시점:** global 낮밤·극지 특징·대기광/해양 반사부터 보완. 아직 안 보이는 국소32m mesh는 그리지 않고 목적지 주변 자료만 준비한다.
2. **확대 인계:** 지역 지도의 footprint가 화면에서 커질 때 global→광역→국소를 연결. texture 전환·terrain 오차·카메라 좌표를 같은 시점에서 확인한다.
3. **구름 접근:** 현재1.5× tile에 승인VDB를 같은 태양/receiver로 배치. 먼구름은광역표현,가까운군집만상세volume. 지형과구름그림자/가림까지 해당 구도로 피드백한다.
4. **서고 진입:** 더 이상 화면에 들어오지 않는지형의draw/신규요청을중지하고역스크롤복귀정책후dispose. 승인된서고와카메라를연결한다.
5. **전체 후보:** 각시점의디테일부족을해당asset/빛/LOD에반영하고연속경로확인후사용자전체제작피드백2를진행한다. D080 두실패대안조건유지. A-P3·Story·B/C는각각후속작업이다.
