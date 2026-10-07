# A · Takram cloud 원형 및 동일 북유럽 지형 재현 검토

2026-10-08 · D104 / F070 / O018 / CASE-007. 사용자 “응”으로 D103 독립 renderer 재현 승인.

## 결과와 판정

**실제 실행 PASS / 시각 품질 TUNE / 기본 경로 채택 미실행.** 자체 80군집을 늘리는 대신 확보한 Takram 완성 광학 chain을 별도 `cloud-lab.html`에 연결했다. 기준 6구도와 시간 누적 OFF, 구름 OFF actual canvas PNG/JSON을 보존했다. 원형 화면도 미세한 입자감과 밝은 cloud face가 남으며 북유럽에서는 더 도드라진다. 사진/목업 수준 달성으로 판정하지 않는다.

## 조달·원본과 변경 경계

- source pin b012ad06d858fc035d88aacfd73f092f93c994e4, clouds0.7.6 / atmosphere0.19.1 / geospatial-effects0.6.4 / Three0.186.1 / postprocessing6.39.5.
- 실제 default weather, shape128³ R8, detail32³, turbulence, STBN128×128×64와 transmittance/irradiance/scattering/higher-order LUT. D103 manifest는 당시 조달47파일의 기록으로 유지하고 새 higher-order 8MiB와 runtime hash는 d104-runtime-pins.json에 분리.
- author Vanilla의 Render → Normal → Clouds+AerialPerspective → LensFlare+AGX+Dithering을 사용. depth/BSM cloud shadow/sky irradiance/temporal overlay를 연결했다. shader 자체 미술 상수 재작성은 하지 않았다.
- 원형 lat67/lon0, 500·3500m, 2000-06-01T10Z. cloud 관찰을 위해 시선을 조정하고 torus probe를 동쪽1500m로 옮겼다. 첫 camera-inside-probe 캡처는 rejected-first로 보존.
- Basic 비교 lat35/lon30/3500m, author helper의 Jan2 현재연도 9시 local→07UTC 조건. 공식 Basic R3F/SMAA와 이 Vanilla/half-float binary LUT 경로는 다르다. pixel-identical clone으로 표기하지 않는다. 각 capture metadata의 sourceDate와 sourceLocation에 실제 구도별 조건을 기록했다.

## 같은 지형 연결

기존 createNorthernArrival의 지형·지도·DEM1.5×·localCamera p=.265/.300/.345 사용. 기존 scene km→metre1000× 후 north61.63/8.4의 WGS84 ECEF 회전·이동으로 광학 좌표를 정합. source terrain RGB plate를 교체하지 않았다. 기존 cloud/shadow/atmosphere는 후보에서 비활성화한다. 초기화 시 기존 field 리소스는 여전히 로드되어 메모리에서 사라졌다고 주장할 수 없다.

북유럽 cloud layers: 5000m/1200m,5700m/1800m,9500m/500m; coverage .4. 기존 지형 높이와 겹침을 피하기 위한 시험값, 최종 cloud height 아님. default procedural weather이며 JangaFX VDB 사용이라고 부르지 않는다. WGS84와 기존6371km sphere 차이, altitude correction, border normal 정합은 남은 점검이다.

## 조명 입력 수정 및 한계

AerialPerspective의 sun/sky light가 켜지면 입력을 albedo로 보고 Lambert diffuse를 계산한다. 이미 조명된 MeshStandard radiance를 넣은 첫 시험은 이중 조명으로 REJECT, rejected-double-light에 보존했다. 후보에서는 map/color 및 원래 onBeforeCompile의 geometry/color handoff를 유지한 MeshBasic albedo를 사용한다. **기존 기본 PBR material은 그대로지만 후보의 optical lighting은 Lambert이며 specular/roughness가 동일하게 보존되는 것은 아니다.** NormalPass override가 custom morph 전체를 따르지 않을 수 있어 border/움직임 별도 검증이 필요하다.

## 실제 검증

1920×1080, ANGLE RTX3070, high, temporal ON, wind OFF. 각 기준 구도 60RAF warm 후120 valid GPU queries. 전체 composer GPU p50/p95 ms:

| 구도 | p50 | p95 |
|---|---:|---:|
| Vanilla500 |3.61|4.14|
| Vanilla3500 |4.20|4.87|
| Basic3500 |4.91|5.41|
| 북유럽.265 |3.88|6.33|
| 북유럽.300 |4.36|6.66|
| 북유럽.345 |5.11|7.54|

쿼리는 composer.render만 감싼다. CPU terrain update/texture transfer/총 frame/FPS/구름만의 증분비용/targetPC proof가 아니다. OFF 대조는 기능 기여와 시각 대조이며 paired budget 실험 아님. temporal OFF Basic과 north cloud OFF 별도저장. 슬라이더 .300↔.3001 UI 입력 확인, browser error0. 연속 하강 영상/역방향 ghosting/긴 replay/모바일/targetPC 미검증.

## 다음 작업과 유지할 경계

1. 사용자가 원형 vs 동일 지형 후보를 보고 cloud shape/질감/노출 피드백.
2. 품질 우선순위에 맞춰 temporal 재구성·AA·노출·cloud edge를 작은 동일 구도 시험으로 조정. OFF/ON만으로 grain 원인을 확정하지 않는다.
3. 품질을 확보한 뒤 기존 globe→orbit→cloud 연결; 현재 Takram global-space cloud는 author TODO이므로 원형 지구에 무조건 적용하지 않는다.

기존 terrain detail 및 archive KEEP, D102 품질 불만족/TUNE 유지. whole RGB cloud plate feedback2/2 실패 이력 유지, D080 cloud-free/AI-video 대안 미실행. A-P3/Story/BC 별도대기.

## 근거 경로

- REF-015_TAKRAM_CLOUD_OPTICAL_CHAIN.md
- verification/a-takram-lab-20261008/gallery.html / manifest.json
- verification/a-cloud-sculpt-20261006/native-captures/takram-lab/*.png,*.json
- prototype/spikes/a-climb/cloud-lab.ts, cloud-lab.html / d104-runtime-pins.json

### 시간 재구성 대조 발견
Basic3500 시간 누적 OFF actual 정지캡처는 ON보다 미세 입자감이 눈에 띄게 적었다. 같은 high/1080p 정지구도의 ad hoc 300query composer p50/p95는 OFF29.26/32.12ms, 기준ON4.91/5.41ms. 화면과 비용 차이가 커 temporal 저해상도 재구성 경로를 다음 조사 우선순위로 둔다. 정확한 artifact 원인은 추가분리가 필요하고 OFF 전체해상도를 기본 채택하지 않았다. north300 cloudOFF4.67/5.70ms는 순차측정/조명패스포함이므로 cloud증분budget으로빼지않는다.

### 최종 검사
Vite cloud-lab 포함76modules build PASS. records224 PASS. browsererror0, 8actual PNG/JSON. 자동검사는사진수준품질/연속하강/targetPC 검증이아니다.
