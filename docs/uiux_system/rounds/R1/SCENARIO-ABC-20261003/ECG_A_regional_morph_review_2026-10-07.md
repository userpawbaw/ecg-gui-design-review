# A-P2 지역 인계 피드백·광역 바탕과 연속 morph

2026-10-07 · D-094 / F-062 / CASE-007 · 실제 구현 후보 TUNE

## 사용자 피드백과 변경 계약

[대화] “새롭게 나타날 때 툭 튀어나와서”, “경계가 너무 선명히 나타나고 자글자글해서”, “화면에 들어오는 지형 전체가 다 렌더링되어야”, “이후 능선 접근 단계의 퀄리티는 충분”.

지역 인계 직전/인계/주변 coverage 세 항목을 보완하고 가까운 능선1.5× detail을 유지한다. 구름 가림은 우선 경계·바탕 지형을 해결한 후의 대안. 현재 후보 중간 피드백이며 전체 구름 완성 제작 피드백2가 아니다.

## 원인과 실제 수정

| 지적 | 이전 원인 | 적용 |
|---|---|---|
| 갑자기 나타남 | p>.215에서 visibility 즉시 켜짐, 완성 높이 mesh 바로 노출 | p.135–.19 광역 높이 reveal, p.18–.245 상세 높이/법선 연속 보간. 미리 coarse64타일 준비 후 준비·프레임 보간. 이산 수십 mesh 교체가 아님 |
| 사각 경계·점무늬 | narrow geometry와 globe relief/normal/color 차이, alphaHash | alphaHash 제거, outer UV20% 높이/normal을 parent로, color18%를 macro로 혼합. 실제 geometry는 불투명이고 detail 강도가 가장자리에서 감소 |
| 주변만 평면 | 7.1–9.7E/61–62.2N 상세 지역 밖은 구체+지도 | 0–16E/56–68N 광역 DEM/131072삼각형 parent 추가. sea bathymetry0 처리. 지역 인계 화면의 주변 산맥도 coarse relief를 가짐 |
| 가까운 능선 만족 | 기존32m hero + near 지도 | 원본 tile/LOD/height1.5 유지. 국소 외곽 morph는 적용되므로 모든 정점 동일 claim은 아님 |

상세 지역 아래 parent는 4km×detail×경계 weight로 내려 겹침/z-fighting을 막는 **가시성용 relief proxy**다. 화면에서 보이는 상세 지형의 실제 고도 변경이 아니다. geospatial survey용 정합이나 완전 계층형 terrain 엔진으로 부르지 않는다. outer parent는 실제 구면으로 인계하고 상세 지역 주변에서만 기존 tangent 근사와 연결한다.

region 추가 coarseHeight/normal attributes도 cache bytes에 산입. base LOD64개는 인계 바탕 준비용으로 유지, 나머지 cache48MiB/지연 지도/4요청/1.2pxSSE 유지. parent geometry와 global sphere·textures는 이 지역 cache 예산 밖이므로 총 VRAM48MiB를 주장하지 않는다. globe1024×512는 수평선 면 분할 시험으로 증가, 성능 효과 아직 미측정.

## 자료·에셋

[AWS Terrain Tiles 공식 등록](https://registry.opendata.aws/terrain-tiles/)의 Mapzen 광역 bare-earth 자료와 [Terrarium 형식](https://github.com/tilezen/joerd/blob/master/docs/formats.md)을 확인했다. PNG 높이 `(R*256+G+B/256)-32768`m를 읽고 z7 실제60타일을 조달·hash pin, EPSG3857→4326 재투영513²/uint16m 파일526338bytes. 지형 원본 sample~650m, 새grid cell은 대략1.3–2.6km; 새 detail 생성 주장이 아니다. 음수 bathymetry는0으로 두며 해안별 정밀 water mask나 datum 일치가 아니다. 원본조건/출품 전 검토는 registry에 보존.

[Cesium 제작팀의 fill/ancestor 논의](https://github.com/CesiumGS/cesium-native/issues/269)를 참고해 바탕 coverage를 유지한다. 현재 custom Three.js 후보이며 Cesium 전체 engine·tile morph 알고리즘 재현이 아니다.

## 실제 검증·자체 판정

`verification/a-north-morph-20261007/native-captures`에 p.15/.18/.19/.20/.21/.215/.22/.225/.23/.235/.245/.265/.294 13개 PNG/state를 보존했다. 실제 IAB/RTX3070,64coarse ready/error0, cache 최대41258904bytes(캡처 관측치). 연속 morph가 진행 중인 캡처는 detailReveal 값을 manifest에 보존하며 정지 후 완전히 동일 상태를 보장한 비교가 아니다.

자체 관찰: 기존 상세 사각 patch의 점 경계가 사라지고 넓은 산악 relief가 이어짐, 근접 능선 detail 유지. TUNE: 먼 수평선/광역 지도 blur·곡률/normal 차이·광량과 움직임 중 residual popping. 전체 화면 모든 지형의 지리학적 정확도/각 화면 pixel footprint 완전 coverage를 자동증명한 것은 아니다.

실제 PageDown/PageUp 입력으로 locked=false/scrollTop·targetProgress 변화와 지역 재진입을 확인했다. 이것은 키보드 endpoint/재진입 증거이며 mouse-wheel/touch, 정역 영상, GPU timing/target PC/600초 증거가 아니다.

준비 중 Python3.11에3.12 geodeps를 잘못 사용해 ABI 오류→기존3.12 runtime으로 복구; metadata tuple index 수정 후60원본 캐시 재사용. Vite config restart 순간 connection-reset의 data error page를 Browser Use가 차단했다. 서버200 복구 후 같은 IAB의 새 정상 localhost 탭을 사용; 차단 data URL을 실행하지 않았다. 최종 콘솔 error0 확인.

## 다음 피드백 순서

광역 시작→인계1–7→지역 인계→능선 접근을 먼저 검토한다. 경계/높이 morph·coverage의 KEEP/TUNE를 별도 기록. 필요 시 계층 geomorph/곡률·normal 정합 추가. 승인된 VDB의 실제 웹 외곽/통과/receiver 구현은 이전 계획에 남아 있고 이번 작업에 완료했다고 표시하지 않는다. 서고KEEP/A-P3·Story·B/C 분리 및 전체 제작 피드백1/2 유지.
