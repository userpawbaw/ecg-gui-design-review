# A 노르웨이 지역 지표 자료와 실제 렌더 검토
2026-10-07 · D089/F057 · 독립 지표 진단 · 전체 도입부 품질평가 아님

## 재개와 실제 수행
사용량 중단 직전 D088의 Moto/반구12프레임과 원격 b6471d0 저장은 완료되어 있었다. 재실행하지 않고 다음 승인 단위인 지역 imagery/DEM 확보와 색상·geometry 기여 비교로 이어갔다.

- NASA [BMNG July C1 full-resolution](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/) 원본21600² JPEG,87,763,762bytes 실제 확보. 500m급 월별2004년7월 합성색상. pixel crop(0,3600,10800,10800)→10800×7200, longitude0–45/latitude45–75. 업샘플 안함. BMNG에는 원래 topography shading이 포함되어 있어 순수 albedo/현재 위성영상이 아니다.
- PGC [ArcticDEM](https://www.pgc.umn.edu/data/arcticdem/) v4.1 32m VRT 확보, target 주변(10–14.8°E/63.5–64.7°N)과 교차하는 COG11개만 range read. 전체 북극/2m자료 다운로드 안함. read coverage99.7735%, 유효DSM36–1369m,median434.54m. fullCOG파일 hash는 확보하지 않았으며 VRT/selectedVRT/지역출력 hash만 고정했다.
- EPSG3413 원본→EPSG4326 513² average 재투영. 출력샘플 약455m×260m, mesh257² 지역grid 약910m×520m. 원본32m detail 전체가 renderer에 보존된다고 표시하지 않는다.
- WGS84 ellipsoid DSM를 구형 sea-zero에 연결하는 시안 근사. geoid수정/수직datum측량 검증 없음. nodata는0처리,지역경계8%높이fade. 강·호수 watermask/shoreline datum은 후속 TUNE.

메타데이터: assets/processed/a-norway-region-20261007/metadata.json. 원본/source VRT는 gitignore 보존, crop/height array/metadata는 저장. 제작자/기관 provenance를 유지하며 두 자산 registry test-only, 권리상태unknown으로 기록. D084 내부시안 허용과 출품 전 검토를 구별한다.

## 비교 구성
3높이(높은궤도1593km/낮은궤도382km/구름높이76km) × global4K / 지역색상 / 지역색상+DEM = 9PNG.
같은 camera-up(지역 수직을 화면 위로), 같은낮태양/PBR roughness.65, 1280×720/Cycles4.5.3/OptiX48samples/AgX0/denoise/bloomoff. cloud/city/bump off. 세 variant 모두 같은 adaptive single-sphere topology이며 DEM만 radius에추가. 지형높이1×, 과장없음. 전 지구의중복불투명surface crossfade는 쓰지않음.

앞 시험의 rim은 grazing surface를회색막으로덮었다. 첫9장(rim on)은 assets/source/a-norway-region-20261007/rim-diagnostic-v1/에보존하고, surface 품질 기여를 가리지않도록 최신9장은 rim off로렌더. 대기·구름이꺼진 진단을완성도입부라고보여주지않는다.

## 실제 결과와 판단
- 가까운4K 색상은넓은색덩어리로보임. 지역색상은해안·호수·육지의경계를더뚜렷하게보인다. 확보/좌표/색상기여 시험 PASS, 최종목업 품질 TUNE.
- DEM추가의실제윤곽·음영기여는작았다. 전체평균RGB변화(color→DEM)는high .00266/low .01870/cloud-height .05297. pixel변화이지품질점수아님. 원본native32m와mesh·출력축소, 낮은산지·멀리있는camera조건 모두영향을준다. 이결과를모든지형/가까운하강까지일반화하지않음.
- 이시점에서산을과장해크게튀어나오게할필요없다. 색상해상도를우선인계하고 DEM은낮은궤도/하강의국소normal·그림자로사용한다. 정말가까운특정지형이주인공이면고도grid/원본imagery를그곳에만늘린다.
- 현재진단에도광역밝은반사와저채도표면이있어조명/재질완성도는TUNE. 큰 specular를data해상도부족과혼동하지않도록 후속에서는land/sea/ice roughness·normal을분리한다. NASA의baked shading과실제Sun그림자중복도점검한다.

갤러리: verification/a-norway-region-20261007/gallery.html. 이전북남비교와다른camera-up/낮광원진단이므로두갤러리pixel을직접성능/품질비율로비교하지않음.

## 다음 제작 단계
1. 이번지역색상/고도자료를 **A 웹실험의 거리인계**로연결. Moto wholeearth 룩→지역texture/height의해안좌표·색/빛·밤불빛소거를맞추고,준비완료후projectedtexel기준인계/역스크롤hysteresis 적용.
2. 광역coverage는먼구름용,가까운선정VDB군집만부피. 지역scale·solar/sky광학두께·밑그림자·대기scatter를함께맞춤. 단순emission rim과단계별sky abruptswitch를완성전이에남기지않음.
3. 현재서고KEEP를같은도착점으로연결한전체후보를완성한후 사용자제작피드백2. 구름형태KEEP/제작피드백1/2/실패후두fallback비교는유지한다.

PASS: 실제 원본/선택지역read/coverage·hash·9PNG hash와size, 단일surface형상 비교. TUNE: 지역룩/광학/데이터와시안높이기준, 실제runtime 인계. NOT VERIFIED: 새지형web성능/애니메이션/서고전체전이/원작pixel충실도/최종목업품질. 기존 웹기본값과서고는미변경.

미리보기 전달 점검: 중단 후 기존4198 연결거부 확인. 서버를 재시작해 Vite ready를 확인했으나, 앱 Browser Use가 URL 정책으로 갤러리 접근을 차단했다. 같은 접근을 다른 브라우저로 우회하지 않았다. 갤러리의 실제 앱 브라우저 표시/console 검증은 NOT VERIFIED이며 직접 검토한 로컬 PNG/contact를 전달한다. 별도 데이터/API/env가 없는 정적 갤러리다.
