# A 도입부 · 궤도 구름의 분포와 국소 양감 재설계

2026-10-08 · RESEARCH / MOTION · D-113 / F-079 / CASE-007

## 1. 이번 요청과 판단

[대화] 사용자는 D112 북유럽 광역·지역 확대의 타원 덩어리를 부정적으로 평가했다. 첨부 3장을 기준으로 기존 웹 구름층에 일부의 선명도·명암·부피와 같은 방향의 그림자를 추가하는 방법을 제안했고, 실제 3D에 적용할 자료·트릭 조사를 요청했다.

이번 단위는 사진 분석, 현재 코드 대조, 업계 자료 조사와 구현 후보 설계이다. 렌더러 수정·새 목업·성능 실험은 하지 않았다. 이전 영상/구도/지형/빛 커튼 증거는 보존한다. 원경 타원 분포는 후속 후보에서 교체할 대상으로 기록하며, 개선 성공으로 처리하지 않는다. 그림자 기존 결함 추적은 계속 보류한다. 이번 요청에 포함된 원경 투영 그림자는 설계 항목이며 아직 구현하지 않았다.

결론: **사진에서 읽은 2D 단서를 coverage / optical thickness / cloud-top height / thin-vs-thick 유형으로 나눠 3D 공간에 고정하면 된다.** 멀리서도 모든 구름에 동일한 3D 솜뭉치를 적용할 필요는 없다.

## 2. 첨부 사진 분석 — 관찰과 추론 분리

| 이미지 | 실제로 보이는 특징 [이미지 관찰] | 제작에 번안할 것 [설계 추론] |
|---|---|---|
| 1 floating laboratory | 긴 구름띠와 큰 빈 공간, 군집된 작은 셀, 반투명한 얇은 결, 일부 두꺼운 가장자리. 수평선 쪽은 압축되고 희미하며 가까운 부분은 선명하다. | 큰 기상 분포 → 중간 크기 갈래·찢어진 틈 → 작은 셀의 세 크기 계층. 가까운 모든 구름을 같은 강도로 선명하게 하지 않는다. |
| 2 0dd184… | 화면 위의 넓고 연속적인 층과 아래의 드문 밝은 군집이 공존한다. 작은 군집 주변의 어두운 영역과 명암 차이가 높이를 암시한다. | 얇은 층과 두꺼운 셀의 별도 파라미터. 전체에 같은 두께·노말 세기를 적용하지 않는다. |
| 3 istock | 대륙을 읽을 넓은 틈, 서로 이어지다 끊긴 밝은 구름, 바다 위 큰 층과 그 내부의 작은 무늬가 함께 있다. | 해안선/지형을 읽을 여백을 유지하면서 크기가 다른 구름 군집을 겹친다. 모든 곳의 미세 입자를 같은 크기로 뿌리지 않는다. |

- 1번 중앙의 매우 넓은 밝은 영역은 해수면 sunglint로 보인다 [추론]. 이것을 구름 광량이나 bloom 목표로 삼으면 화면이 흰 막이 된다.
- 구름의 흰 부분은 주로 물방울/얼음 입자의 산란으로 다룬다. 얼음 지형·바다의 표면 반사와 같은 metallic/specular 재질로 구현하지 않는다.
- 사진에서 읽히는 어두운 부분은 구름 자체의 음영, 지면 투영 그림자, 지형 색/바다 반사가 혼합되어 있다. 위치와 방향을 읽되 사진만으로 고도·광학 두께·정확한 태양 각도를 역산했다고 주장하지 않는다.
- 첨부 파일명만으로 촬영 출처/시각/실사진 여부가 전부 확정되지는 않는다. 3번의 우주 배경·해상도·편집 여부도 미확인이다. 세 장은 미감/스케일 기준이며 렌더 스택의 증거가 아니다.
- 실제 셀 무늬와 렌더링 aliasing은 다르다. 정지 상태의 무늬가 카메라 이동 때 깜박이는지 별도로 확인해야 한다.

## 3. 현재 실패가 어디서 왔는가

[코드] `prototype/spikes/a-climb/cloud-handoff.ts`의 bakeHandoffWeather는 band(anchor, scale, angle) 세 개를 max로 합치고 source weather 세부를 곱한다. band의 중심 윤곽은 length(d/scale) 기반 타원이며 작은 사인 변형만 있다. 9배 macro / 6배 fine은 반복 주기를 나눴지만 타원 기하 자체를 제거하지 않았다.

[캡처] D112 p.18의 커다란 타원 내부에 비슷한 크기의 작은 밝은 덩어리가 분포한다. 이는 자연스러운 기상 분포가 아니라 타원 stencil을 읽게 만든다. 단순 선명도/노출/해상도 증가로는 고칠 수 없는 분포 문제이다.

[코드] pinned Takram clouds.glsl은 cube-sphere 반복 UV, RGBA별 coverage, 높이 profile과 3D erosion을 조합한다. 원경 shapeAmount를 0으로 만든 D112 시험은 얇은 양의 밀도막을 남겼다. 따라서 이번에도 shapeAmount 전체 제거/두께를 스크롤로 키우는 우회를 재사용하지 않는다.

우선순위: **타원 macro 교체 → 얇은층/두꺼운 군집 분리 → 국소 광학 → 동일 footprint 인계 → 움직임 필터**. TAA/선명도는 큰 형태를 결정하는 도구가 아니다.

## 4. 조사 결과와 증거 범위

### 4.1 NASA: 실제 분포 에셋과 분리 합성

[Blue Marble Clouds](https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/77558l)는 구름만의 전 지구 자료와 높은 해상도 파일을 제공한다. [Crafting the Blue Marble](https://science.nasa.gov/blogs/earth-matters/2011/10/06/crafting-the-blue-marble/)는 구름·지면·반사·대기를 분리 렌더하고 합성한 제작 과정을 설명한다. 이 방식은 모든 디테일을 하나의 볼륨으로 강제할 필요가 없다는 선례이다.

사진 RGB를 그대로 density로 쓰지는 않는다. 밝기는 조명 영향도 포함한다. 별도 cloud-only 지도를 형태 seed로 사용하고, 두께/높이는 아트디렉션 후보로 추가한다. 실제 북유럽 기상 재현으로 표시하지 않는다.

### 4.2 Guerrilla: 얇은 2D층 + 두꺼운 volume / custom weather

[공식 2015 발표](https://www.guerrilla-games.com/read/the-real-time-volumetric-cloudscapes-of-horizon-zero-dawn), [공식 PDF](https://d3d3g8mu99pzk9.cloudfront.net/AndrewSchneider/The-Real-time-Volumetric-Cloudscapes-of-Horizon-Zero-Dawn.pdf)의 PDF49쪽은 low-frequency base / high-frequency erosion 구분, PDF48쪽은 shot별 custom weather, PDF74쪽은 얇은 상층 2D와 두꺼운 하층 volume 구분을 설명한다. 해당 게임의 고도/거리값을 우리 궤도 카메라 기준으로 그대로 가져오지 않는다.

Beer attenuation, 위상함수, powder 근사로 구름 명암을 만들며 표면 Lambert 하나로 환원하지 않는다. [Nubis Evolved](https://www.guerrilla-games.com/read/nubis-evolved)는 근접 통과 및 temporal artifacts를 별도 난제로 다룬다. 게임의 PS 성능 수치를 WebGL/현재 PC 보장으로 사용하지 않는다.

### 4.3 Epic: 구름 자체 음영과 지면 그림자는 별도 경로

[Volumetric Cloud 공식 문서](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine)는 다중 산란 근사, secondary light march, Beer shadow maps, 대기 산란과 그림자 거리/해상도 제어를 설명한다. BSM은 넓은 지면 그림자에 유리하지만 volume 내부의 세밀한 음영과 동일하지 않다. Unreal을 웹에 그대로 이식하거나 품질을 보장한다는 뜻은 아니다.

### 4.4 Takram: 근경 광학은 유지하되 우주 표현은 따로 설계

[현재 README](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/clouds)의 Known issues / Possible improvements / Planned features에는 sparse cloud temporal 번짐, cube-sphere 반복 seam, 일정 cloud base, global coverage / space views 계획이 명시되어 있다. [issue50](https://github.com/takram-design-engineering/three-geospatial/issues/50)은 줌아웃의 구름 소실·그림자 clipping 사례이다. 우리 원경 문제가 모두 동일한 버그라는 증거는 아니지만, 로컬 renderer를 전 지구까지 확장한 한계를 조사할 근거이다.

4개 weather 채널은 layer별 coverage이며 Nubis의 RGB=coverage/precipitation/type와 다르다. NASA mask를 Takram에 넣을 때 단순 채널 복사 대신 각 layer density 응답을 보정해야 한다. 현재 설치/pinned 버전과 main 문서를 분리하여 적용 전에 소스 대조한다.

### 4.5 Skybolt / 개발자 포럼: 저주파 분포와 원경 대체

[Skybolt Clouds.h](https://github.com/Prograda/Skybolt/blob/master/Assets/Core/Shaders/Clouds.h)는 base coverage와 coverage detail, 지리 UV, low-res density hull을 분리한다 [코드]. 낮은 해상도에서도 high-res 형태와 비슷하도록 보정하는 구조가 직접적인 참고이다. 코드를 그대로 웹에서 실행하거나 엔진 결과를 재현한 것은 아니다.

[three.js 개발자 포럼의 구면 cloud shadow](https://discourse.threejs.org/t/how-to-cast-shadows-from-an-outer-sphere-to-an-inner-sphere/53732)에서는 cloud alpha를 사용한 지면 감쇠와 광원 방향 UV 변위를 제안한다 [작성자 직접 설명]. 화면에 고정된 검은 복제본보다 월드/구면 위치와 태양 방향으로 그림자를 계산해야 하는 이유를 보여준다. 단순 alpha 곱은 광학적/지형적 정확도가 제한되므로 초기 근사와 최종 경로를 구분한다.

## 5. 구현 후보 3개 — 선택과 한계

| 후보 | 원경 | 근경 | 비용/위험 | 판단 |
|---|---|---|---|---|
| A 전 구간 volume 개선 | 새로운 불규칙 weather + 모든층 raymarch | 같은 volume | 근경 광학 재사용 쉬움. 원경 샘플링/반복/비용 한계가 계속됨 | 비교 기준으로 보존 |
| B 위성 형태 + 높이/광학두께 proxy + 국소 volume | 얇은 cloud shell, 두꺼운 부분만 relief/광학 shadow 근사 | 같은 coverage를 따르는 Takram | 형태 일치/밝기 보정 작업 필요. 원경 품질을 독립적으로 설계 가능 | **추천 후보, 미구현/미채택** |
| C 원경을 오프라인 다층 렌더/영상으로 준비 | 깊이/투과/조명 pass 또는 고정 영상 | 제한 구간 실제volume | 좋은 빛 가능, 카메라 자유도·역스크롤·재조명 제약 | B 실패시 별도 비교; D080 대안과 연결 |

사용자 의견에 가장 가까운 B를 제안한다. 여기서 proxy는 지구 surface에 흰색을 인쇄하는 것이 아니라 실제 고도에 놓인 구면 층이다. 기존 embeddedCloud 색 혼합을 다시 켜는 것만으로 해결하지 않는다.

## 6. B 후보의 구체적 자료 계약

- `Cthin(x)` 얇은층 coverage / `Cthick(x)` 두꺼운 군집 coverage: 위성 cloud-only 형태를 seed로 사용한다. 큰 빈 공간·길게 끊긴 띠·다른 크기의 셀을 먼저 정한다. 타원 mask 3개 교체.
- `tau(x)` 광학 두께: coverage와 분리한다. 빈 곳=0, 얇은 영역은 작은 값, 선택된 두꺼운 군집만 큰 값. 사진 luminance=높이로 변환하지 않는다.
- `Hbase(x), Htop(x)` 높이: 얇은층/두꺼운층별 의미 있는 범위를 두되 정지한 기상장은 카메라/scroll로 성장시키지 않는다. 낮은 해상도 구름 꼭대기 높이장과 근경 density profile을 맞춘다.
- `rho(x,h)` near volume: 같은 지리 좌표의 C/tau/H를 바탕으로 3D shape erosion을 추가한다. 지나치게 작은 Worley 셀로 전체를 도배하지 않는다.
- `sunWorld` 하나, `windWorld` 하나: 모든 cloud/pass/지면에서 공유. 현재 wind OFF를 먼저 유지하여 인계와 이동 효과를 분리한다.
- equirectangular 자료 → ECEF 위경도 → 기존cube UV bake/샘플 경로를 명시한다. 두 UV 체계를 좌표정합 없이 겹치지 않는다. high-latitude seam과 latitude stretch 검사.
- 실제 cloud observation을 조형에 차용하더라도 tau/H는 생성된 값이다. 형태 provenance와 생성 height/volume provenance를 나눈다.

## 7. 2D 단서를 3D로 만드는 핵심 트릭

### 7.1 원경은 2.5D, 입체를 읽을 부분만 강하게

구름 꼭대기 Htop의 완만한 기울기로 구면 tangent normal을 만들고, 일정한 태양광 방향으로 밝은 면/어두운 면을 만든다. 이는 원경의 저비용 relief 근사이며 실제 volume scattering을 대신했다고 주장하지 않는다. H의 절대높이는 약한 parallax/구면 가장자리에 반영하고, small-detail normal은 화면의 미세 셀을 깜박이게 할 만큼 키우지 않는다.

두꺼운 군집만 normal/height 효과가 강하다. 얇은층은 투과+넓은 부드러운 조명으로 둔다. `Cthick` mask로 양감을 선택할 수 있으므로 사용자의 '필요한 만큼'을 공간적으로 제어한다. 필요한 부분에 normals를 무작위로 찍는 것이 아니라 동일 cloud-top field의 기울기에서 만든다.

### 7.2 지면 그림자는 구름의 화면 복제가 아니다

지면 월드점 P에서 태양을 향하는 단위 벡터 S로 ray를 쏘아 cloud shell에 교차하는 Q를 찾고 Q의 tau를 샘플한다. 구면→지역DEM 양쪽 지면 shader에서 같은 함수/좌표를 쓴다. 높은 산은 P가 높으므로 cloud까지 거리와 그림자 위치가 달라진다.

평면 국소 검산: shadow displacement ≈ cloud-above-ground height × cot(solar elevation). 예:8km,15°라면 약29.9km. 따라서 '바로 밑에 검은 복제본'은 현재 낮은 태양에서 상당히 어긋날 수 있다. 궤도 전체에는 이 평면식을 쓰지 말고 구면 교차를 사용한다. horizon/night의 교차 부재·작은cos값은 별도 처리한다.

방향투과 `Tsun=exp(-tauSun)`를 **직사광 성분**에 적용한다. 대기/환경광/도심발광까지 모두 곱해 검게 만드는 것은 피한다. 초기 얇은 shell은 경로길이 보정된 tau 근사, 근경은 기존 BSM을 활용한다. 그림자 폭/경도/강도는 광학두께와 거리, 광원 크기에 맞춰 설계한다. 추가 blur 하나로 모든 방향을 같게 만들지 않는다.

### 7.3 동일 구름을 서로 다른 방식으로 렌더한다

원경 proxy와 근경volume을 각각 동일 view ray의 premultiplied radiance L와 transmittance T로 출력한다. 중간 구간은 `L=(1-w)Lfar+wLnear`, `T=(1-w)Tfar+wTnear`로 **같은 구름의 두 표현을 교체**한다. 둘을 서로 다른 실제 구름처럼 over 합성하면 두꺼워지고 밝기가 중복된다. 얇은 상층과 두꺼운 하층처럼 실제 다른 층끼리는 depth 순서의 radiative composition을 사용한다.

이 수식은 source renderer가 노출하는 buffer/alpha와 맞춘 뒤 적용해야 한다. 단순 최종 RGB 화면끼리 dissolve하지 않는다. TAA history는 새 표현 출현·분리 때 invalidation/가중치 검토가 필요하고, 매 scroll마다 전부 reset하면 noise가 재발할 수 있다.

## 8. 카메라·LOD·조명 계획

| 기존 고정 시점 | 목표 | 표현 |
|---|---|---|
| p.18 북유럽 광역 | 대륙이 읽히는 틈 + 비정형 큰 분포. 가까운 일부만 밝고 어두운 relief | 위성형 얇은 shell + 선택된 두꺼운 proxy. 전체 volume은 비교 대조용 |
| p.235 지역 확대 | 작은 셀이 갑자기 솜 덩어리로 바뀌지 않고 같은 띠의 안쪽이 읽힘 | 필요한 지역texture mip/tile + 일부 volume 기여, 화면 크기에 따라 조절 |
| p.300 접근 | 선택한 두꺼운 군집 옆면과 밑면이 보이고 지형 유지 | 해당 군집 volume 주도, 먼 구름은 proxy 유지 |
| p.365 커튼 | 기존 사용자가 좋아한 빛 커튼, 실제 빈틈/옆 구름을 읽음 | Takram near 광학/BSM/lightShafts. 원경 shell이 얇은 유리막처럼 겹치지 않게 함 |
| p.387 가장자리 | 같은 군집 내부로 들어감, 새 spawn 없음 | near volume. proxy contribution 종료 전에 opacity/radiance 정합 |
| p.410 가림 | 기존 가림 gate/같은 구름 유지 | 마지막 불투명 가림. 아직서고 컷 강제하지 않음 |

전환을 altitude만으로 정하지 않는다. 화면에 투영되는 구름 셀 크기, camera-to-cloud 거리, 옆면이 보이는 각도를 사용한다. 예비 후보는2px미만=원경평균,2–8px=relief/전환,8px이상=volume세부이며 **설계값/실측 전**이다. 기존p값은 비교 구도 유지용이며 최종LOD 경계값이 아니다.

원경에도 조명 대비는 있지만 모든 구름에 똑같은 하이라이트를 넣지 않는다. 현재15°태양은 낮아 그림자/옆면이 강조되는 후보이고, 사진같은 상단명암이 나오는지는 고정sun30° 비교를 별도 검토한다. 최종sun 변경은 사용자채택 전이다. Bloom OFF에서도 효과가 보여야 하며 노출로 지형을 묻지 않는다.

## 9. 필요한 에셋·비용

1. 먼저 로컬 earth_clouds 및 NASA별도 cloud-only의 출처/해상도/북유럽 crop/mask형태를 대조한다. 현재 local_weather.png는 작은 weather detail 재료로 유지할 수 있지만 대륙급 분포를 대신하지 않는다.
2. 원경 cloud mask 후보: NASA2048×1024는 빠른 분포 확인, 확대용은21600급의 필요한 crop만. 한장의거대한GPU texture로 올리지 않는다. 지역세부는 같은 원본의 mips/crop·좌표정합 사용.
3. 선택한군집의 tau/top height는 별도 제작해야 한다. 새VDB 구매/대량 다운로드보다 먼저 shape/coverage를확정한다. 기존JangaFX/VDB는 근경기준에 쓸 수 있지만 위치/형태가다르면 갑자기지형/구름교체가되는문제를반복한다.
4. 참고예산: 4096×2048 RGBA8+mips 약42.7MiB, 2048² RGBA8+mips 약21.3MiB. 여러데이터를RGBA로pack하거나필요crop만쓸수있다. JPEG/PNG파일크기와GPU메모리는다르다. 압축지원/채널정밀도/RT형식은구현전점검.
5. far shell은volume적분을줄이지만 추가texture샘플/overdraw/인계중동시계산이생긴다. 현재D112 GPU값에서얼마개선되는지아직측정하지않았다. 성능이좋아진다고확정하지않는다.

## 10. 다음 제작 순서와 리뷰 기준

1. **분포 먼저:** p.18/.235에위성형coverage만동일camera로적용. thin/thick분리,타원윤곽·눈송이도배·해안선가림검토. 기존후보와나란히제시.
2. **광학:** 같은분포에서 relief OFF/ON, 원경투영shadow OFF/ON을따로비교. 기존near그림자결함추적은보류. 단순albedo/사진밝기→높이변환금지.
3. **인계:** 같은cloud C/tau/H 좌표로6구도및중간정역영상. 두표현동시coverage/밝기중복,새구름출현,구름밑과그림자방향확인.
4. **움직임:** 고정pose잘나온뒤에TAA history/mips/alphacoverage보정으로정역깜박임·잔상점검. staticPASS로motionPASS처리하지않음.
5. **제품연결:** 원경사용자리뷰후기존빛커튼/가림/서고KEEP연결. Story/BC/비교panel은별도.

수용 기준은 사진의 정확한기상복제가 아니라 (a)대륙급불규칙분포 (b)얇음과국소두께차이 (c)밝은면/음영/지면shadow가같은sun (d)동일군집인계 (e)움직임noise/TAA잔상이거슬리지않음이다. 수치gate는 품질판정의보조이다. 이번연구는설계완료, 새렌더품질은미검증이다.

## 11. 입력 파일 provenance

첨부 파일은 로컬 원본을 식별하고 보존한다. 저장소에 복사하지 않았다. 촬영/합성 출처와 실제 광원 수치는 미확인이다.

| 파일 | 바이트 | SHA256 |
|---|---:|---|
| a-floating-laboratory-of-discoveries.webp | 541382 | 3bd108e3ce7d4f105baf92c29ac57399d7fc25a38793d3dc2530b8126530f8f4 |
| 0dd18433fac029a28c0a4f19d227a010.jpg | 40473 | 3b349163c40c3b6dd753bac2d1371022e839f87bef1313b90812f1c5c07ec99c |
| istockphoto-1130538644-1024x1024.jpg | 152772 | b4b9517237db86640be75de09d13a467e404c19658beed36c44fe3bef310275f |
