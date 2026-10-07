# A-P2 상세 산악 지형·고시점 지구 실제 제작 검토

2026-10-07 · D-091 / F-059 / CASE-007 · IMPLEMENTATION / RESEARCH

## 1. 이번 결과와 판정

실제 지도·고도 데이터를 확보해 연결된 3D 지형과 조명 장면을 제작했다. AI 생성 목업이 아니라 Cycles 4.5.3 LTS / RTX3070 OptiX 렌더다. 가까운 지형 6장, 높은 시점 지구 광학 4장을 비교한다. **부분 자산 제작·파일 검증 PASS / 최종 시각 품질 TUNE / 전체 웹 전이 미통합.**

- [지형 6장 비교](../../../../../verification/a-terrain-detailed-20261007/gallery.html): 왼쪽 높이1× / 오른쪽2.5×.
- [지형 contact](../../../../../verification/a-terrain-detailed-20261007/contact.jpg).
- [높은 시점 광학 4장](../../../../../verification/a-high-orbit-look-20261007/gallery.html): 대기 off/on.
- [텍스처가 포함된 Blender 원본](../../../../../assets/processed/a-terrain-detailed-20261007/detailed-terrain.blend).

## 2. 확보한 에셋·해상도

| 요소 | 실제 획득 / 사용 | 해석 한계 |
|---|---|---|
| EOX Sentinel-2 cloudless 2023 | 광역 z10 64장 + 국소 z12 49장 = 113 JPEG 타일, 위경도 좌표로 재투영 | 목표 위도에서 실제 타일 샘플은 약73m / 18m. 제품의 native10m 원본 확보라고 부르지 않음 |
| ArcticDEM v4.1 32m | 국소 1025² bilinear 고도, 주변 513² average 고도 | 국소 출력 약27m는32m 원본의 약한 oversampling. 새 정보 생성 아님. 타원체 DSM, 측량용 geoid 보정 아님 |
| 연결 지형 | 광역129 + 국소513 좌표를 병합, 407,676 vertices / 406,400 quads | 근접 정보는 국소에 집중. 현재 고밀도 Blender 원본이며 실시간 성능 미검증 |
| 독립 고시점 재질 | 확보된 Moto 공개4096×2048 day/night/packed maps 사용 | 원작 shader를 그대로 실행한 것이 아니라 Blender 번역. 가까운 지형에는 이4K 지도를 확대하지 않음 |

목표 지역은 능선·눈·호수·골짜기가 뚜렷한 Jotunheimen **61.63N / 8.4E**의 제작 후보다. 원형 지구부터 여기로 내려오는 경로 및 최종 목적지는 아직 채택하지 않았다. 광역/국소 지도는 같은2023 제품이며5% 테두리에서 색상과 높이를 혼합한다. 지형 테두리는0m로 내려버리지 않고 주변 고도로 이어진다.

국소 유효 고도99.9978%, 최고2503.84m. 실제 출력/타일 원본 URL과 SHA256은 `assets/processed/a-terrain-detailed-20261007/metadata.json`에 있다. DEM은 원본 COG의 필요한 범위만 읽었으므로 전체 원격 COG 파일의 immutable hash를 확보한 것은 아니다. 파생 고도/VRT와 지도 타일을 pin했다.

관련 원천: [EOX 사용 문서](https://cloudless.eox.at/documentation/usage), [PGC ArcticDEM](https://www.pgc.umn.edu/data/arcticdem/). 시장 후보의 무료 표시와 계정 없이 원본을 확보할 수 있는지는 구별했다. Blendkit/Fab 원본은 이번에 확보하지 않았고 임의 구매도 하지 않았다. D084 내부 시안 이용 범위와 출품 전 확인 목록을 유지한다.

## 3. 구도·빛·높이 비교

| 프레임 | 카메라 높이 | 목표 사선 거리 | 목적 |
|---|---:|---:|---|
| low-orbit | 45km | 약89.5km | 광역 색상 안에서 가까운 산악 영역의 형상 확인 |
| cloud-approach | 14km | 약33km | 능선, 눈, 계곡 그림자와 지도 세부 확인 |
| ridge-close | 6km | 약20km | 경사면 텍스처·골짜기·가림의 근접 한계 확인 |

이 명칭은 연출 접근 구도의 작업명이며 안정적인 물리 궤도를 뜻하지 않는다. 이전 cloud76km/사선645km의 카메라와 같은 조건 비교도 아니다. 원본 정보 보존과 카메라 접근을 함께 바꾸어 제작했으므로 개선을 지도나 mesh 하나의 기여로 단정하지 않는다.

낮은 사선 태양, 거친 지표 재질(roughness .87), 약한 하늘광으로 능선의 밝은 면과 계곡 음영을 분리했다. 초기 렌더는 camera 고도를 Nishita 지표 환경광 고도에 그대로 적용해 골짜기가 과도하게 검어졌다. **지표에서 받는 환경광 기준을0m로 수정**해 보완했다. 실제 고궤도 대기의 완전한 물리 해법으로 주장하지 않는다. 초기6장은 `assets/source/a-terrain-detailed-20261007/lighting-v1`에 보존했다.

### 자체 피드백

- **KEEP 후보:** 1×에서도 능선/계곡과 높은 면의 눈, 낮은 면의 지표가 읽힘. 같은 연속 표면 안에 광역/국소 디테일이 존재함.
- **TUNE:** 최종 지구의 색온도와 지역 표면 색상 연결, 기하/지도 경계가 이동 중 드러나는지, 거리에 맞춘 텍스처와 mesh 감소.
- **2.5×는 비권장 후보:** 양감은 강하지만 가까운 경사면이 늘어나며 지도 정보가 흐려지고 일부 능선이 지나치게 날카로움. 현재1×를 다음 통합 기준으로 추천한다. 연출 gain 자체를 금지하지는 않는다.
- **GAP:** 구름 VDB·그림자·지역 지형·지구 구면의 연속 인계, 같은 서고 진입까지의 움직임, Three.js 성능은 아직 없음.

## 4. 높은 시점 광학 시험 — 별도 항목

기존 emissive 투명 shell을 숨기고 표면이 없는 방사형 산란 volume을 시험했다. 밝은 극지와 어두운 대륙의 도시 불빛, 사선 태양으로 낮밤을 나눈다. `earth-hero`와 `high-orbit` 각각 대기 off/on을 실제 렌더했다.

초기 극지 높이 gain .012가 너무 부풀어 보여 .002로 줄였고, 약한 대기광은 밀도6→24 / scale height .0013→.002 Earth radius로 보정했다. 첫4장과 manifest는 `assets/source/a-high-orbit-look-20261007/initial`에 보존했다. 최종4장은 독립 원형/가까운 원형 외관 시험이며 D090의 기존 high camera 재현은 아니다.

**한계/판정 TUNE:** 극지 돌출은 packed map에 근거한 제한적 조형 proxy이며 실제 Greenland 얼음 DEM이 아니다. 대기는 단색 지수 밀도 산란이며 spectral Rayleigh/Mie·Bruneton 해법이 아니다. 도시 불빛은 읽히나 목표의 푸른 수평선 광량/분포, 바다의 강한 반사 hotspot, 얼음 재질은 추가 보완이 필요하다. 구름 없는 광학 진단이며 구름 제거 대안을 최종 선택한 것이 아니다. Moto 수준이나 목업 수준 도달로 판정하지 않는다.

## 5. 실제 파일 검증과 다음 순서

- 지형 PNG6 + 지구 PNG4 모두1600×900, manifest SHA256 검증.
- Blender 원본18.7MB 저장 후 다시 열어407,676 vertices / 406,400 quads / packed texture2장 / camera 존재 확인.
- 지도·고도·원본 scene registry 등록. 원본 링크/해상도/기하 gain/카메라/빛/초기 실패 보존.
- 앱 브라우저의 로컬 gallery 접근은 앞선 URL 정책 차단 이후 재시도/우회하지 않았다. 파일과 PNG 직접 검토만 했으며 브라우저PASS로 부르지 않는다.
- 기본 웹 source를 수정하지 않아 새 전체 웹 build/스크롤/목표PC성능 검증은 이번 범위에서 하지 않았다.

다음 제작은 **①1× 지역 지형을 전이 카메라에 연결 → ②global/high·지역 texture/geometry의 거리 인계 → ③승인된 VDB 구름을 같은 태양·receiver에 배치 → ④같은 서고 진입까지 연속 전이 검증** 순서다. 높은 시점의 대기광/반사 개선은② 안의 별도 품질 항목으로 유지한다. 완성 전이를 만들고 사용자 제작 피드백2를 진행한다. 지금은 부분 자산 시험이므로 사용자 제작 피드백은1/2 그대로다. 두 번째 전체 제작 실패시 D080의 구름 없는 전이/AI 영상 대안 비교가 발동한다. A-P3·Story·B/C 작업은 별도 후속으로 유지한다.
