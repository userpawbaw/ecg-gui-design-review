# A 지형·지역 지도·고궤도 광학 재설계 조사

2026-10-07 · D090/F058 · RESEARCH_READY / 새 제작 미실행

## 1. 사용자 피드백과 이전 판단 교정

[대화] low orbit/cloud height에서 산맥·해발 차이가 읽혀야 하는데 너무 매끈함. low orbit부터 상세지도 필요. 실측지도와 달라도 좋으니 국소 3D지형/완성 에셋 사용 가능. high orbit도 완성도 부족; Moto처럼 특징적인 극지 윤곽과 빛·밤도시·적절한 대기 두께/광량으로 화면 구성 요청.

F057의 **현재 시험에서 DEM 기여가 작았다는 관측**은 유지한다. 이를 산맥 표현이 필요 없거나 높이 과장이 부적절하다는 일반 결론으로 확대하지 않는다. 현재 목표는 지리 측량 복원이 아니라 ECG 도입부의 설득력 있는 공간·완성도다. 비교 패널의 ECG 정확성 계약은 독립 유지한다.

### 실제 코드·카메라 감사 [코드/계산]

| 시험 이름 | 방사 고도 | 목표 지형까지 사선거리 | 높이로 생기는 화면 이동 최대 / p95 |
|---|---:|---:|---:|
| high orbit | 1593km | 3868km | .44px / .26px |
| low orbit | 382km | 1490km | 1.19px / .69px |
| cloud height | 76km | 645km | 2.98px / 1.71px |

verification/a-terrain-research-20261007/camera-detail-audit.json. 1280×720/35mm/36mm sensor 기준, 구면+추출고도 projection 계산. 실제 raster/그림자/LOD 품질 점수나 모든 가시 지표의 검증은 아니다. 높이차는 visible한 원본 추출grid와 경계fade를 적용한 위치의 화면 이동만 계산.

현재자료는 ArcticDEM 원본32m를 출력455m×260m로 average한 뒤 mesh약910m×520m로 다시 낮췄다. 높이1×/최고1369m/경계8% fade, normal기여off/거의같은roughness/daylight. 이런조건이 ridge/valley·사면음영을약하게한다. **cloud height라는 이름도 실제 구름 진입으로 오해를 준다:** 아직76km 고도에 있고 645km 떨어진 지면을 바라보는 프레임이었다.

먼지표가 매끈해 보이는 물리적인 부분과, 원본/메시/카메라/광학을 잘못 줄인 제작상의 부분을 구별한다. 고도 숫자만 바꾸거나 height gain만 크게 해서는 해결하지 않는다.

## 2. 업계 구현·기법: 실제 확인과 적용

| ID / 원문 | 확인된 내용 [문헌] | 우리 적용 [설계 추론] / 조건 |
|---|---|---|
| T01 [Cesium Globe](https://cesium.com/learn/cesiumjs/ref-doc/Globe.html) | 화면오차로 지형LOD refinement, 조명과 ground atmosphere 제어 | 높이별 고정grid 대신 footprint/화면오차·loading-ready로 region mesh/map 인계. Cesium 엔진 교체는 미결정 |
| T02 [VerticalExaggeration](https://cesium.com/learn/cesiumjs/ref-doc/VerticalExaggeration.html) | 기준높이에 대한 수직gain 제공 | 실제data1×/연출용2–3×를 후보로 비교. 물면/건물·구름높이도 같은 기준. 그대로 최종값 확정 아님 |
| T03 [EA DICE/Frostbite2 adaptive terrain thesis](https://media.contentapi.ea.com/content/dam/eacom/frostbite/files/adaptive-terrain-tessellation.pdf) | 2012 논문, heightfield곡률 분석으로 tessellation밀도 분배, 경계/LOD연결 | ridge/곡률/가까운 silhouette에 geometry 집중. 현재 WebGL에 DX11 tessellation을 그대로 가져온다는 뜻 아님 |
| T04 [SideFX terrain creation](https://www.sidefx.com/docs/houdini/heightfields/creation.html) / [Erode3.0](https://www.sidefx.com/docs/houdini/nodes/sop/heightfield_erode.html) | terrain형상+다중스케일 침식, flow/debris/sediment 등의 보조층 | 큰산맥/중간골짜기/미세표면을 분리. 단일noise로솜털같은산을 만들지않음. DCC생성후 height/normal/mask/mesh로 export |
| T05 [World Creator terrains](https://docs.world-creator.com/walkthrough/terrain-setup/understanding-terrains) / [features](https://www.world-creator.com/en/features.phtml) | real-world height/color streaming, imported map·3D stamp와 procedural blending | 실제 해안·육지위에 hero산악stamp 삽입. MapTiler 연동은계정/구독 필요, 현재툴설치/원본확보없음 |
| T06 [SideFX texture basics](https://www.sidefx.com/docs/houdini/heightfields/texturing.html) | 큰지형재질의tile/tri-planar와mask·색상처리 | 가파른절벽에satelliteUV만늘리지않고 rock/snow/soil normal·roughness 분리. slope/height/curvature로재질구분 |
| T07 [Bruneton 원저자 구현](https://ebruneton.github.io/precomputed_atmospheric_scattering/index.html) | Rayleigh/Mie·multiple scattering LUT 기반 대기 | blue limb와sunwardwarmhaze/먼곳원근을연결. 실제광로 기반으로두께를읽히게하고유리구반사/화면전체뿌연막은제외 |
| T08 [Takram WebGPU 구현](https://github.com/takram-design-engineering/three-geospatial/blob/main/packages/atmosphere/WEBGPU.md) | Bruneton/Hillaire 기반 광학·aerial perspective/lighting, WebGPU WIP | 현재A에도Takram/Bruneton경로가있음. 새로운genericrim추가보다units/depth/sun/노출보정이먼저. 기존WebGL과nodeAPI·postprocessing호환 검증전 자동교체안함 |

포럼 교차점검: [Cesium height exaggeration/normal(2019)](https://community.cesium.com/t/terrain-exaggeration-vertex-normals/8011)은 높이만 바꾸면 사면조명이 맞지않는 사례, [SideFX small-scale erosion(2023)](https://www.sidefx.com/forum/topic/92483/?page=1)은 small-scale 해상도/erosion artifact 사례. 현재버전의미수정bug나사용자PC재현으로단정하지않음. 우리시험은 displacement후normal재생성·normalmap·물면높이를함께검증한다.

## 3. 이미 존재하는 데이터·완성 에셋·렌더 프리셋

아래는 **실제 공개 상세페이지/제품 문서 확인**이다. 썸네일/판매자quality값을 우리의 실제 렌더 품질판정으로사용하지않는다. 새모델/지도 원본다운로드·DCC실행·renderer채택은 이번에 수행하지않았다. 기존 NASA/ArcticDEM 원본은 유지한다.

| ID / 후보 | 확인된 제공물 | 적합한 장면 / 다음 접근·제약 |
|---|---|---|
| A01 [EOxCloudless viewing](https://cloudless.eox.at/products/viewing) / [usage](https://cloudless.eox.at/documentation/usage) | cloud-free Sentinel-2 RGB제품,10m급GeoTIFF/캐시/모자이크, WMS/WMTS공개 | low부터넓은80–160km지역을수십m급으로, 가까운20–40km통로는10m급sourcecrop. publictile최대level이원본10m보존을보증하지않음. bulk파일/날짜/원본해상도·가격조건은개별확인 |
| A02 [Kartverket 지형](https://kartverket.no/en/api-and-data/terrengdata) / [NDH](https://kartverket.no/geodataarbeid/nasjonal-detaljert-hoydemodell) | 국가정밀고도, høydedata.no/API, 일부layer는login | 노르웨이실측1–10m후보. 먼저도착지역/가용타일·datum확인. [orthophoto](https://www.kartverket.no/api-og-data/kjope-kartdata)는상세자료구매/공급경로별도,고도무료라고사진전체도무료라고하지않음 |
| A03 기존 [ArcticDEM](https://www.pgc.umn.edu/data/arcticdem/) | 2/10/32m원본타일 | 현재32m를다시1km메시로낮추지않고선정10–40km산지에local높은밀도mesh+native normal. Greenland ice와지역산악별patch도후보 |
| A04 [Mountain Valley and Lake Landscape](https://www.blendkit.com/asset-gallery-detail/866328b6-8354-4f86-be57-e6cde52dfc4a/) | FREE표시,3km×3km/능선·계곡·하천,132117polygons/183.7MiB | 가까운하강의조형·재질baseline. 대륙wideview전체를3kmasset으로대체불가. add-on/account acquisition 경로,원본·실제mapresolution 미검증 |
| A05 [Large Mountain Peak Terrain](https://www.blendkit.com/asset-gallery-detail/50b720c2-bef5-4e9c-8506-1b3094b64a29/) | FREE표시,Canadianmountainsidephotoscan,849380polygons/332.5MiB | 가까운hero능선의실제사진형상/재질candidate. 북유럽실측이라표시하지않음. account/download/decimation·texture해상도 검증후사용 |
| A06 [Large Scale8k Alpine Landscape](https://www.fab.com/listings/5b5927c0-c6ef-4483-966f-93c75d411ef3) | 8km×8km(64km²) 지형,snow/non-snow,7LOD,14FBX,8K32bitEXRheight/normal·12masks,GLB제공표시 | 가장구성명세가완비된지형교체후보. 원본구매/라이선스선택필요,가격확인안됨. 미구매. 상품의AI사용조건도개별표시되어있으며내부시안정책이접근/조건을소거하지않음 |
| A07 [Rocky Mountain Terrain Landscape](https://www.blendkit.com/asset-gallery-detail/3cb2f328-c8f4-4d9c-afac-c90d0bb23b63/) | FullPlan,568249polygons/578.8MiB | 유료/구독대안,가까운암산조형. 높은폴리곤수만으로quality승인안함 |
| A08 [SideFX Heightfield Textures](https://www.sidefx.com/contentlibrary/heightfield-textures/) | 제작자가제공한HIP94.4KB,heightfield생성+Copernicus재질예제,Houdini20.5 | 완성scene·nodegraph를재질설계baseline으로활용. .hip다운로드/실행/목표Threeexport 미실행, Houdini런타임필요 |

EOX실제access시험: 공개WMTS GetCapabilities67,911bytes조회, 2021/2023/2025등Sentinel layer/URL template/좌표matrix확인. verification/a-terrain-research-20261007/eox-access-audit.json. 원본snapshot assets/source/a-terrain-research-20261007/eox-wmts.xml. **tile이미지sample·원본10m지역 파일·최종색/조명은 미확인.** GoogleMapsCompatible의matrix21까지정의되어있지만각layer가원본detail을그level까지제공한다고추정하지않는다.

검색한Sketchfab Norwayterrain은상세metadata/원본접근근거가부족해우선목록에서제외. Fabpreview이미지fetch도cachemiss였으므로상품visual을직접본척하지않는다. Blendkit명세와public페이지의사진scan설명은읽었으나native렌더없음.

## 4. 권장 구성: 넓은 지구 룩 + 가까운 상세 지형

### H — high orbit/처음 지구의 룩 [설계 제안]

- 전체상세지형을동등하게늘리지않는다. Greenland의빙상/해안·선정산맥 edge에국소geometry를집중한다. 북극해빙전체를두꺼운빙하메시로만드는것과구별한다.
- 지구arc를화면하단2/3,극지밝은edge를상단혹은왼쪽arc에,밤도시를반대쪽대륙의어두운면에배치. 낮/밤경계가해안·빙상형태를드러내는사선광을설계한다. 실제첫globe타이틀구도와겹침은다음scene별조정.
- 도시빛은night-onlymix+좁은glow,ice는roughness/normal과낮은sun각으로 읽힌다. 대기는 blue limb+sunward warmscatter,접선방향광로를따라적절히두껍게보이되표면전체막으로덮지않음.
- global지표가밝은정면광에노출되면서저해상도사진처럼읽히는상태를피한다. 광학과구도로먼표면비용을줄이되 가까운map detail준비는별도로한다.

### L — low orbit: 산맥·해안·골짜기가 읽히는 화면

- current382km/사선1490km를그대로유지하지않는다. provisional camera고도80–180km/hero지형사선150–350km구간부터 footprint검토. 물리궤도설명/숫자를product에노출하는것이아니므로명칭에구속되지않음.
- 전경능선은하단1/3,골짜기는중앙을비스듬히지나고먼육지/수평선은상단. 중심landanchor만맞추는것을구도합격으로삼지않음.
- color는500m에서10–30m급지역자료로전환. hero지형은native10–32m/선정mesh간격25–100m부터곡률별LOD검토. actual원본정보와화면footprint에따라범위/밀도조정,무조건16K파일전체전송안함.
- 산맥높이1×/연출gain2–3×/완성asset혼합을후보비교. silhouette와골짜기음영·normal이같이변해야한다. 해당geo정확성은Introvisual에필수아님;그럴듯한규모/해안정합/전환연속성은유지.

현재64.1°N/12.4°E anchor도최종고정아님. 그곳의능선/골짜기가약하면북유럽의더특징적인산악·빙하해안지역이나완성asset에맞는목적지로재선정하고원형지구와의geoanchor를함께맞춘다.

### C — cloud approach/진입: 상세지형이구름과같은공간에있음

- 접근고도15–25km/지형거리30–80km부터,실제cloudentry는고도2–8km/지형거리10–40km의구도를추가. 이는제작시험범위이지확정camera/구름종류의기상학적정의아님.
- 앞능선이frame하단을가르고뒤능선이서로다른깊이에있어parallax를보이게. valley틈에선정VDB가걸리고그그림자가실제지표에떨어짐. 먼곳은대기원근,가까운terrain은선명.
- 3–8km완성지형asset은이구간의hero부분에사용가능. 큰지역의실측color/height와접합하거나구름가림에서다음scale로인계. 바다/해안모양이갑자기바뀌지않도록마스크·높이경계/normal/skirt/morph를맞춤.
- 정지상태에서도ridge/valley/높이차가보여야한다. 스크롤·parallax만으로빈약한mesh를감추는판정을금지한다.

## 5. 제작 순서와 구체적 비교

1. **카메라·형상판 먼저:** high/low/approach/entry에서footprint/사선거리·hero능선화면px확인. low/entry clay/noatmos에서정지능선과골짜기가읽히는구도. 아트용pixel목표는능선차이6–15px부터비교,정량PASS가시각합격을대신하지않음.
2. **같은 구도에서 지형3안:** nativeDEM상세/DEM+완만한연출gain/완성산악asset혼합. source32m→평균500m→mesh1km루프를반복하지않는다. 실제map와달라도더좋은조형을허용.
3. **color·재질:** EOX/Sentinel실제타일과선정지형normal/slope·flowmask로rock/ice/snow/soil/sea분리. 투영된map텍셀/메시·normal정보는별개측정. bakedSatellite그림자+새Sun중복과절벽UVstretch점검.
4. **high 룩 별도:** Moto의publicday/night/bump표현과극지heroedge+물리대기/역광비교. edge두께/광량·nightmask·노출을각각조절하고bloomoff에서도원형/ice/city위계확인.
5. **거리 인계+승인구름·같은서고:** p별stage전환을preload/화면오차·연속빛과연결. 역스크롤/idle/camera-up/clip·texture메모리점검. 완성후사용자제작피드백2. 지금조사와자체진단은1/2를소진하지않음.

권장 우선: **실측지역의해안·큰형상 + 가까운완성산악asset/상세height + 거리별재질/광학**. 완전실측만으로제약하지않고그대로에셋/가공/제작을비교한다. 무료Blendkit후보를먼저조달가능성확인,안되면이미접근가능한ArcticDEM의선정patch상세와SideFX/WorldCreator스타일의mask/재질로진행. 유료후보는임의구매하지않는다.

## 6. 기록·검증 상태

PASS: 현재camera거리/화면높이기여계산,원문/asset명세/EOXcapabilities조사. RESEARCH_READY: 새high/low/entry구도·원본고해상도/완성asset후보. NOT VERIFIED: 새완성asset획득/실제렌더/10m지역tile원본/engine호환·GPU·전체전이.

기본web/서고KEEP/구름형태KEEP는유지. 새high·low·entry품질은TUNE. waveform비교패널은정확성계약유지. D089/F057와이전렌더를삭제하지않고이번후속교정으로연결한다. 내부시안D084는유지하고원본출처·조건/출품시대체목록을보존한다.
