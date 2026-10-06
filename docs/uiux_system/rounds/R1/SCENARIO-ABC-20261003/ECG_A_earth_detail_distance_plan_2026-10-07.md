# A 지구 확대: 지역 지형·거리별 디테일 인계

2026-10-07 · D-086 / F-054 / CASE-007 · 코드 감사·문헌 조사, 구현 전

## 사용자 피드백과 유지 범위

“구름 모양은 만족스럽네.” 외부 VDB 형태는 KEEP. 조명/군집/궤도 인계/웹 전체 결과까지 승인된 것은 아니다. 제작 피드백1/2 유지. 가까운 구름·지형의 선명함과 먼 구름의 흐릿한 모습이 조화되어야 하며, 확대하면서 지표 디테일이 바뀌어야 한다. 서고/인체/파형의 기존 확정 구조는 유지한다.

## 지형 에셋이 따로 필요한가

**확대 구역에 별도 디테일 자료가 필요하다. 전 지구를 고밀도 단일 모델로 바꾸기보다 전 지구 외관→지역 색상/고도→근접 지형/재질로 인계한다.** 색상 이미지의 해상도와 입체 형상을 구별한다. 고해상도 사진은 바닥의 흐림을 개선하지만 능선·해안의 실루엣/그림자에는 DEM 기반 geometry가 필요하다. normal은 작은 음영, roughness는 반사 폭, geometry는 형상/가림을 담당한다.

## 현재 코드에서 확인한 병목

- day/height/roughness/relief 실제 파일 모두4096×2048. 확대 지역 전용 imagery나 texture tile 전환 없음. 적도에서 구면 둘레/4096은 약9.76km/texel의 단순 평균. 위도별 경도 간격/투영은 다르므로 모든 지점에 같은 수치로 적용하지 않는다.
- globe SphereGeometry384×192; relief bump .004 / displacement .0003. Antarctic cap은 REMA v2 **1km** source→2048×512 grid→고정 SphereGeometry512×192에 높이5배를 표시. 원본 고도 자료의 작은 형상을 메시 세분화만으로 복원할 수 없다.
- 남극 cap의 범위는 남위60–90°. 기본 경로 t=0의 이상 구면 계산에서 subcamera는 북위15.15°, p.245/.315 중심ray 지표 hit도 북위13.75/15.08°. **현재 확대 위치에 남극 패치를 더 정밀하게 만들어도 지역이 맞지 않는다.** 위치/지구회전/지역자료의 정합부터 고정해야 한다.
- p.28/.30의 중심ray는 구면에 닿지 않는다. 수평선/구름을 바라보는 구도일 수 있으므로 화면 전체 지표가 없다는 증거로 확대하지 않는다. 실 viewport footprint 계산과 실제 캡처가 다음 검증이다.
- 기본 경로 camera.near=.025(환산159km), 종점 altitude=.0025(15.9km). 가까운 지표 clip 위험을 검토한다. layers/sculpt/photo 경로는 다른 near와 bank 조정을 쓰므로 동일하다고 주장하지 않는다.
- anisotropy=4가 이미 적용되어 있다. 사선 minification 개선에는 유효하나 확대할 원본에 없는 지형 디테일을 만들지 않는다. 진단: sharpening/AA만으로 해결할 문제가 아님.

증거: scripts/assets/audit-earth-detail.mjs → verification/a-earth-detail-20261007/source-audit.json. default t0/이상sphere/center-ray만의 계산, runtime 전체 뭉개짐 원인 단독 확정 아님.

## 확보 가능한 자료와 완성 도구

| 후보 | 확인한 기능 / 용도 | 우리 판단 |
|---|---|---|
| [NASA Blue Marble Next Generation](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/) | 전 지구 월별500m급 합성색상 자료 | 실제 전체 해상도에서 확대 지역 crop. 지금4K로 재축소하면 이득 상실. 가까운 지표용 세부자료는 별도 |
| [PGC REMA](https://www.pgc.umn.edu/data/rema/) | 남극 2m DSM, mosaic2/10/32m 타일과100/500m/1km 자료 | 남극을 확대할 때만 해당 지역타일. 1km 전체자료를2m로 단순 업샘플하지 않음. 색상/roughness는 별도 |
| [Copernicus Sentinel-2](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-2) | 지역 광학영상 컬렉션·검색/데이터 접근 | 실제 선정 위치의 cloud-free 지역이미지 후보. 계정/파일/밴드해상도·시기·표면 snow 상태는 개별 확인 전. 현재 다운로드 없음 |
| [CesiumTerrainProvider](https://cesium.com/learn/cesiumjs/ref-doc/CesiumTerrainProvider.html) | quantized mesh/heightmap terrain, level geometric error, 공급시 vertex normals | 계층 타일/지형+색상overlay 참고/완성기술 후보. 프로젝트 엔진 전체를 Cesium으로 교체하는 결정 아님 |
| [NASA-AMMOS 3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS) | Three renderer, texture overlays, quantized mesh, tile LoD fade/지역 load 예제 | 현재Three에서 사용할 수 있는 완성 구현 후보. 외부provider key/좌표/깊이/후처리·offline 조건 시험 필요. 타일 데이터가 포함된 완성 지구 모델은 아님 |
| 기존 Snow014 등 PBR / 공개 terrain·ice 모델 | 형상/눈·얼음 반사·normal 조각 | 목업같은 해안·빙상 조형에 보완 후보. 임의 generic mountain을 실측지형으로 표시하지 않음. 기존Snow자료 감사 재사용 |

[Three Texture](https://threejs.org/docs/pages/Texture.html) 공식 문서: mipmap/minification과 anisotropy는 먼/사선 표면 필터링. magnification은 별도 원본 디테일이 필요하다. 업계의 계층 지형 방식에서 착안하되 이번 고정 스크롤 경로는 **지역 patch 3단계**부터 작은 비용으로 시험한다. 새 framework/package 자동 도입은 없다. NASA renderer 개별 plugin source fetch 실패: README 예제 목록 확인을 설치/실행 성공으로 표시하지 않는다.

## 추천하는 화면별 인계

| 시점 | 지표 | 구름 | 빛/전환 |
|---|---|---|---|
| 원형 지구 | 기존 만족한 외관, 전 지구map/mipmap | 광역 coverage+자연스러운 음영. 부피 강조 불필요 | 남극 등 시각 anchor와 확대 목적지 정합 |
| 높은 궤도 | 보이는 지역의 고해상도 색상 tile + 중간DEM geometry | 가까운선정군집 silhouette/홈, 먼군집은 낮은해상도표현 | 같은색/해안/높이 유지, 일찍 preload하고 준비후인계 |
| 낮은 궤도 | 선택구역 DEM+국소normal/roughness, 그밖은 coarse | 가까운VDB부분만 입체, 먼구름은 mip/대기 원근 | 앞의선명도와 먼거리contrast 감소; 태양/그림자일치 |
| 하강/구름통로 | 잠깐보이는지면/지붕만 상세, 먼지표추가비용제한 | 01통로/06층/10국소옆면 + 얇은층 | 구름가림에서지역scale압축/서고인계, 배경/지붕점프검증 |

먼 곳을 저품질로 그린다는 것은 샘플/해상도/형상 비용을 줄이되 alias/noise/경계점프를 남기지 않는다는 뜻이다. 거리부드러움은 mip/대기transmittance·scatter와 함께 조정한다. 화면 전체blur, 과한DOF, 가까운지형까지 흐리는 저해상도합성은 피한다.

새 고도patch는 같은geographic frame/높이기준과 경계(skirt/morph)를 공유해야 한다. 단순불투명mesh crossfade의 겹침/zfighting·이중윤곽을 피하고, 필요하면 경계morph/dither 또는 단일surface에서texture인계. 스크롤 p만으로 해상도를 고정하지 않고 화면 projected texel·geometry오차와 로딩준비를 기준으로 한다. blur가 눈에 띄기 전에 다음layer준비, 역스크롤 hysteresis 유지.

## 다음 실행 순서와 합격 기준

1. 현행 approved earth/orbit 구도와서고 접합을 기준으로 확대 목적지·camera footprint를 고정. 남극 표면을 주인공으로 쓰면 경로를 남극patch에 맞춤. 다른지역이면 해당자료 확보. 촬영구도/날짜별가시영역을 기록.
2. 동일light/camera에서 현재4K → 지역색상crop만 → 지역DEM 추가 → normal/roughness 추가를 비교. cloudoff/atmosoff/AAoff 진단으로 선명도와 geometry 기여를 분리. 가림없는 대표3구도부터.
3. 승인된VDB형태와 지역표면을 같은경로에 배치, 가까움/멀어짐/역스크롤 경계의 seam·노출·그림자·loading/near clipping검증. 원거리표현은 유지.
4. 완성도 있는 전체전이 후보를 사용자 제작피드백2로 제시. 이번 구름형태 승인/소스감사를2차실패로 계수하지 않는다. 두번째실패후D080조건대로 두fallback 비교.

현재: 구름형태 KEEP, 광학/군집/웹인계 TUNE. 지형자료 후보와경로진단 완료; 새타일다운로드·runtime수정·추가렌더는 미실행. 서고KEEP/심장공통clock/A-P3·Story·BC보류 유지.
