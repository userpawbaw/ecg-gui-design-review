# A-P2 구름·얼음·푸른 수평선 재조사

2026-10-06 · F-042 / D-071 · RESEARCH + 다음 구현 설계

## 1. 결론과 이번 범위

**지구 전체 에셋 교체보다 렌더링 방식 교체와 필요한 데이터의 국소 보강을 권한다.** 8K 색상 사진만으로 구름의 부피, 얼음의 윤곽/그림자, 대기 산란이 생기지 않는다. 기존 NASA 색상/육지 배치는 유지할 수 있다. 구름 density, 남극 geometry/normal/roughness, 대기 광경로가 핵심 수정 대상이다.

사용자의 두 첨부 이미지는 목표 룩이다. 첫 이미지는 낮은 시점의 푸른 곡선 수평선·따뜻한 역광·얼음 relief, 두 번째는 큰 지구와 타이틀의 구도다. 이미지가 실제 지리/물리 렌더 증거라는 주장은 하지 않는다. 구현된 기존 화면보다 구름 높이차·얼음의 국소 밝음/음영·푸른 수평선이 강하다. 이는 첨부 이미지와 기존 최종 캡처를 대조한 시각 판단이다.

현재 기준 코드 SHA: `55b0e3ac03b114738f6096fd32201c2ff2d3114e`. 이번에는 코드/공식 자료/에셋 후보를 조사했다. 새 renderer 구현, 라이브 데모 화면 촬영, 후보 다운로드/로컬 실행/성능 시험은 하지 않았다. 기존 QA PASS를 신규 기법의 PASS로 옮기지 않는다. 서고 빛·소품 KEEP, A-P3/Story/B/C 후속 보류 유지.

## 2. 현재 코드가 만들지 못하는 것

| 증상 | 확인한 코드 | 원인 해석 / 다음 분리 검증 |
|---|---|---|
| 지구 위 구름이 평평함 | r1.056의 단일 구면 + 2K alpha + 작은 bump/opacity .14 | 알파는 분포를 보여주지만 실제 높이별 밀도/자기 그림자/시차는 없음. 해상도 교체만으로 해결 안 됨 |
| 진입 구름이 안개 같음 | screen UV 기반 ro/ray, fbm, 두 거리 shadow 근사, 고정 lightDir | 세계 좌표의 camera ray와 무관하며 유한한 cloud 덩어리/층 경계가 없다. 카메라가 구름 옆면을 지나가는 깊이 관계가 약함. 태양 이동과도 직접 연동되지 않음 |
| 얼음이 흰 면에 가까움 | 전 지구 384×192 sphere, 4K 8-bit relief/bump, 소량 periodic ridge, roughness에서 흰 pixel 분류 | texture 픽셀 수보다 실제 silhouette geometry/큰 지형/미세 normal 분리 부족. 동일 roughness는 눈/노출 얼음을 구분하지 못함 |
| 유리막 같은 표면 | 실제 transmission/clearcoat 없음. 바다의 큰 specular hotspot + r1.078 BackSide additive Fresnel 대기 + 떠 있는 cloud shell | '유리 재질이 들어갔다'는 진단은 틀림. 이 세 요소가 복합 원인 후보. ocean specular-off/atmosphere-off/cloud-shell-off를 별도로 비교해야 기여를 확정할 수 있음 |
| 궤도에서 푸른 수평선이 약함 | 대기는 normal/view Fresnel과 sun dot의 색 혼합, 광경로 적분 없음. end camera (.4,.5,1.53) 길이≈1.66R, 중심 쪽 look | 얇은 공기층을 접선으로 길게 바라보는 낮은 시점과 Rayleigh 산란이 없음. camera와 scattering을 함께 고쳐야 함 |

현재 지형 .042R/구름 .056R/대기 .078R은 서로 강하게 과장된 비율이다. 이를 실제 지구 축척이라 부르지 않는다. 대기만 얇게 줄이면 과장 지형과 충돌하므로 세 층의 scale를 함께 재설계한다. 이전의 'bump를 올렸다 내렸다'식 반복은 이번 재제작의 중심으로 삼지 않는다.

## 3. 직접 확인한 구현 정보와 후보

### 구름: 볼륨과 빛의 경로

[Maxime Heckel의 구현 글](https://blog.maximeheckel.com/posts/real-time-cloudscapes-with-volumetric-raymarching/)은 밀도 raymarch, 빛 방향 lightmarch, Beer 감쇠, HG phase, 저해상도/blue-noise 기법을 설명한다. [Nubis 제작사 발표](https://www.guerrilla-games.com/read/nubis-authoring-real-time-volumetric-cloudscapes-with-the-decima-engine)는 cloud shape를 제작/제어하는 게임 제작 사례다. [PBRT phase 설명](https://pbr-book.org/4ed/Volume_Scattering/Phase_Functions)은 산란 방향 규약을 확인하는 기준이다.

적용 설계 [추론]: world-space camera ray로 한정된 구름층을 통과시키고, weather mask + 큰 base noise + 작은 erosion noise를 구분한다. primary ray에 누적 투과율을, light ray에 태양까지의 감쇠를 계산한다. 얇은 경계의 silver lining과 중심 음영을 만든다. HG 방향 부호를 확인하며 backlighting이 맞는지 검사한다. 단순히 sample 수를 늘리지 않는다.

- 먼 지구: weather map으로 전 지구 분포를 유지하되 density shell의 높이와 얕은 self-shadow를 보여준다.
- 궤도→구름: 카메라 주변의 같은 weather 영역을 더 자세한 유한 volume으로 연결. 멀고 가까운 두 representation 사이의 density/빛 방향을 맞춘다.
- 구름 내부: 큰 솜 덩어리 사이의 빈 공간을 지나며 전경은 빠르게, 먼 층은 느리게 움직인다. 화면 전체에 noise를 동일 배율로 씌우지 않는다.

필요 재료는 새 '고해상도 구름 사진'보다 **3D density/noise와 cloud cover/type 데이터**다. 미리 만든 tileable 3D noise와 샘플링을 검토한다. 128³ R8은 base level 약2 MiB(후보 크기, 아직 생성 안 함). raymarch를 반 해상도에서 시작하고 empty-space skip/early termination/depth-aware upsample을 비교한다. blue noise만 추가하면 shimmer가 남을 수 있으므로 정지/이동/역스크롤을 별도 검증한다. 시간 누적 사용 시 scene cut/seek/reduced에서 history를 초기화한다.

### 얼음: 지형 재료와 반사 재료를 분리

[PGC REMA](https://www.pgc.umn.edu/data/rema/)는 남극 DEM과 다양한 mosaic 해상도를 제공한다. 전체 2m 데이터 수집은 피하고 필요한 남극 patch/낮춘 해상도만 추출하는 후보로 둔다. DEM은 정점 displacement와 normal 생성의 입력이며 반사 지도는 아니다. 바다 얼음과 육지 빙상도 같은 데이터라고 간주하지 않는다.

에셋 조사 `explore.mjs "ice" --kind=material`: Poly Haven Rocks Ground04는 목표에 부적합; ambientCG Snow014/013/006 후보. [Snow014](https://ambientcg.com/view?id=Snow014)는 PBR pack/CC0와 실제 다운로드 옵션을 확인했다(2K-JPG24MB/4K-JPG90MB는 **전체 pack**, runtime 예산 아님). NASA/GEBCO 기존 source는 유지. 해당 탐색에서 출력된 Pexels/Sketchfab 요청은 과거 다른 검색의 누적 요청이며 이번 필수 조달이 아니다. 현재 선정 후보에 로그인 필요 없음.

적용 설계 [추론]: Antarctic patch의 coarse geometry로 능선·해안 silhouette, normal map으로 중간 detail, roughness로 눈/노출 얼음의 반사 폭을 나눈다. 외부 눈 texture의 metre급 입자는 궤도에서 그대로 보일 수 없으므로 그대로 전 지구에 반복해서 붙이지 않는다. macro detail이 우선이고 micro map은 필요한 확대에서만 쓴다.

[Three Standard material](https://threejs.org/docs/pages/MeshStandardMaterial.html)과 [Physical material](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)의 normal/displacement/environment 및 고급 재질 비용을 확인했다. globe 전체를 유리처럼 transmission/clearcoat 처리하지 않는다. 얼음은 opaque dielectric + 영역별 roughness/normal + 낮은 태양 각도의 shading을 기본으로 한다. 필요한 국소 얇은 얼음의 투과/SSS는 그 뒤 별도 비교 대상이다. sky-only 환경광/반사와 직접 태양광의 역할을 나누고 태양 원반 반사를 두 번 더하지 않도록 한다.

### 대기: 푸른 막이 아닌 경로 길이에 따른 빛

[Bruneton 저자 구현](https://ebruneton.github.io/precomputed_atmospheric_scattering/index.html)과 [원본 repository](https://github.com/ebruneton/precomputed_atmospheric_scattering)는 사전 계산한 transmittance/scattering/irradiance와 WebGL2 경로를 제공한다. 높은 시점에서 대기 안쪽으로 이동하는 경우를 검토할 수 있는 출발점이다. **그대로 붙이면 현재 composer/좌표/grade와 호환된다는 뜻은 아니다.**

적용 설계 [추론]: pixel별 camera ray의 지표/대기 교차를 구하고, 대기 구간의 산란 `L`과 지표까지 투과 `T`로 `C = surface*T + L`을 HDR에서 합성한다. Rayleigh가 푸른 접선 수평선을 만들고 Mie 성분이 태양 주위 따뜻한 haze를 만든다. 태양과 지구 그림자를 반영한다. 전체 표면을 cyan으로 칠하거나 동일 두께의 additive ring을 그리지 않는다. bloom은 이 결과의 좁은 밝은 부분만 퍼뜨린다.

## 4. C1–C3: 기존 스택에 넣는 경로 비교

| 후보 | 장점 | 비용/미검증 | 추천 |
|---|---|---|---|
| 현재 alpha/Fresnel에 해상도·강도 추가 | 변경 작음 | 핵심 depth/광경로가 여전히 없음 | 핵심 해결 경로에서 제외 |
| vanilla Three + 검증된 LUT/volume 기법을 참조해 로컬 구현 | 기존 composer/단위/scene 전환 제어 가능 | shader/lookup 정확성·성능 검증 필요 | 비교할 후보 |
| `@takram/three-atmosphere` + `three-clouds` WebGL 후보 | atmosphere/cloud 통합 구현과 vanilla 예제 존재 | pmndrs postprocessing과 현행 Three addon composer가 다름, ECEF metre frame 필요 | **별도 P2 시험에서 먼저 품질/호환성 확인** |
| Blender 고품질 사전 렌더 | 고정 경로의 cloud/ice 룩에 유리 | 자유 시차/시간층/역재생/전송·메모리, 실제서고 접합 검증 부담 | 실시간 품질·비용 부적합 시 대안 |

[Takram repository](https://github.com/takram-design-engineering/three-geospatial)와 원본 package JSON/README 확인: MIT, atmosphere/cloud는 Beta 표기. 읽은 repository snapshot은 atmosphere0.19.1/clouds0.7.6이며 npm 최신 배포 버전 검증을 대신하지 않는다. React/R3F peers는 optional, vanilla Three 예제가 있다. Three>=.170 peer 범위는 현재 .186과 형식상 맞지만 실행 호환성 증거는 아니다. WebGPU rewrite가 진행돼 API가 바뀌는 이력도 있으므로 도입 시 immutable SHA/정확 버전을 고정한다.

중요한 제약: [atmosphere README](https://raw.githubusercontent.com/takram-design-engineering/three-geospatial/main/packages/atmosphere/README.md)의 post-process lighting은 Lambertian/albedo 전제를 둔다. 기존 PBR ice buffer에 다시 태양광을 적용하면 double lighting 위험이 있다. PBR 경로와 light-source approximation/lighting mask의 선택을 시험해야 한다. ECEF 고정 reference frame, horizon precision artifact, light-shaft 미구현도 명시돼 있다. clouds의 transparency/depth/shadow 통합은 [원본 README](https://raw.githubusercontent.com/takram-design-engineering/three-geospatial/main/packages/clouds/README.md)를 참조하고 별도 확인한다. 전체 site를 R3F로 이식하지 않는다.

## 5. 다음 제작 순서와 화면 계약

### Q1 — 대기·카메라·유리막 원인 분리

고정 카메라에서 ocean specular/기존 atmosphere/cloud shell을 각각 끄고 원인을 분리한다. 새 atmosphere 경로는 먼저 단순 지구에서 시험한다. 통합 전, 고도/태양각 12장의 같은 상태에서 푸른 수평선/낮밤/빛 방향을 비교한다.

초기 hero는 현행 타이틀 안전 영역을 유지한다. 궤도로 내려가면 지구 중심을 보던 카메라가 접선 쪽을 보게 전환한다. 최종 구도 목표: 푸른 곡선 수평선은 화면 상단 약20–35%, 태양은 왼쪽 수평선 근처, 표면은 아래60–75%. 이 수치는 **제안 구도**이며 사용자 확정 값이 아니다. 엄밀한 orbital simulator가 아니라 편집된 A 전이지만, 이 구간 내부의 radius/altitude/near clip/LOD는 일관되게 계산한다.

물리 비율 기반 시작값은 R=1, 대기 약1.016, 지구 macro terrain 최대 약.001 정도를 후보로 둔다(지구 반지름/100km 대기/6km 지형에 대한 단순 규모 계산, 아직 적용 안 함). 실제 대기에는 딱 끊기는 경계가 없으므로 모델 top/밀도 profile은 LUT 설정을 따른다. 연출용 Antarctic relief를 더 키우면 전체 층의 충돌/축척을 다시 맞춘다. 기존 .042/.056/.078을 유지한 채 대기만 얇게 하지 않는다.

### Q2 — Antarctic patch·광응답

REMA의 필요한 area/해상도 및 snow 후보에서 쓸 map만 선정→hash/registry→coarse mesh/normal/roughness 생성. 같은 카메라에서 태양각을 움직여 능선에 highlight가 이동하고 골은 어둡게 남는지 검사한다. 작은빛을 전체얼음 bloom으로 대체하지 않는다. specular-off/normal-off/clay/shadow-off로 기여를 분리한다. 목표는 목업의 큰 형태/빛 반응이며 생성 이미지의 모든 능선을 실제 지형으로 재현한다는 계약은 아니다.

### Q3 — density cloud·태양/대기 연결

멀리서 weather 분포→근접 volume→구름 속 가림을 연결한다. 태양 방향/노출/대기 irradiance를 공유한다. 반 해상도 primary48–64/light4–6은 **시험 출발값**이며 성능 합격 수치가 아니다. 기존 p95 22.57ms보다 비용을 늘리기 전에 3D texture/empty-space skip/early termination/낮춘 render resolution을 비교한다. 화면 scale를 올리거나 ray sample만 늘리는 방법을 기본으로 삼지 않는다.

### Q4 — 연속 통합·품질 피드백

Q1–3은 내부 시험이다. 사용자에게는 지구/얼음/구름/대기/태양과 고창 접합을 갖춘 하나의 연속 장면으로 보여준다. 같은 상태에서 승인 목업과 12장 나란히 대조, 효과off/정지/정역/reduced/shimmer/scene seek/실제 GPU를 검증한다. 고창/서고 GLB·bake 유지와 기존 심장/R clock도 확인한다. 단순 오류0로 fidelity PASS를 주장하지 않는다. 구현에서 G6의 새 후보 라운드 최대3회 자기 보완 후 GAP를 남긴다.

## 6. 연구 증거와 남은 질문

검색/공식 문서 확인 2026-10-06 KST. `assets/research/2026-10-05-material-ice.json`은 tool의 UTC 파일명이다. 대상 후보 다운로드/새 라이브러리 설치 없음. 웹 README는 mutable main이며 실제 조달 전에 SHA/version/hash 고정이 필요하다. 현재 renderer 결과는 사용자 TUNE이며 다음은 **Q1 원인 분리 + 검증된 atmosphere 경로의 별도 시험**, 이어 Q2/Q3와 통합이다. 서고/Story 계획을 이 연구로 다시 설계하지 않는다.
