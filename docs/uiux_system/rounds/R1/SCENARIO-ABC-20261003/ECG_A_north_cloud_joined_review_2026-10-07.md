# A 북반구 지형·VDB 구름·서고 통합 후보

2026-10-07 · D-098 / F-065 / CASE-007 · 사용자 묶음 제작 승인

## 범위와 현재 판단

사용자: “완료되면 검토 없이 구름 단계까지 쭉 진행해줘. 같이 리뷰할게.”
지형 잔여 경계 정합 → 실제 VDB 접근·진입 → 가림 → 같은 서고를 하나의 실제 스크롤 후보로 제작했다. **제작/불러오기/정역 입력 PASS, 시각 충실도 TUNE**. 완전 무경계·목업 수준·최종 채택을 선언하지 않는다. 사용자 전체 구름 제작 피드백1/2 유지, 다음 묶음 리뷰가 2차 후보다. D080 실패 조건은 아직 판정하지 않음. A-P3/Story/BC는 별도.

## 1. 지형 경계 — 조명 법선을 실제 높이 변형과 정합

- 바깥 좌표는 정확한 sphere에서 출발하고, parentAmount와 경계 가중치에 따라 지역 tangent+DEM으로 연속 이동. 종전 높이의 두 번 edge attenuation을 제거.
- 실제 변형 P = sphere + parentAmount×terrainDelta − detailAmount×4×regionWeight. 같은 식의 U/V 방향 기울기에서 cross(V,U)를 계산한다. 구면 접촉의 법선은 analytic radial로 환원.
- CPU에서 geometry.computeVertexNormals를 매 변화마다 호출한 초기 시험은 .15에서32.6ms/최대37.5ms를 기록해 미채택. 이 시험은 north-cloud-joined-cpu-trial에 보존했다. 최종은 미리 산출한 기울기를 GPU에서 평가하며 per-frame CPU geometry 갱신0. FPS 개선 수치로 바꾸어 주장하지 않는다.
- 실제 DEM1.5×/근접64tile LOD/48MiB cache/near precision/전역 구름 shell 보존. 광역 parent의 추가 derivative 속성은 22float×66049 = 5,812,312 bytes이며 regional cache 밖의 별도 GPU 비용이다. CPU 준비 배열도 추가된다.
- .15/.18 표본에서 이전의 선명한 사각 명암을 관찰하지 않았지만 전체 각도에서 잔여 경계 소멸은 미확정. 외곽 bump, 지도 source 차이, 수평선 tessellation이 별도 GAP.

## 2. 구름 — 실제 승인 에셋과 빛 처리

D085/D093 실제 확보·시험된 JangaFX CloudPack의06(넓은 군집)/01(왼쪽 통로)/10(오른쪽 높은 옆면)을 사용. 원본 SHA와 배치는 verification/a-north-cloud-path-20261007/manifest.json에 고정. D083/084의 업계 자료→실제 에셋→광학 기준 제작을 적용한다.

- 공식 배포: https://jangafx.com/software/embergen/download/free-vdb-animations
- 기존 공식 광학 기준: https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_for_maya_volume_am_Rendering_a_Cloud_html
- 상세 source/광학 연구: ECG_A_cloud_vdb_optical_trial_2026-10-06.md, ECG_INTRO_STORY_PRODUCTION_RESEARCH_BASELINE_2026-10-06.md.

실제 Blender4.5.3/Cycles/RTX3070 OptiX, 동일1.5× terrain receiver와 같은 태양방향(-.67,.70,.28 native axes). density .8/anisotropy .45/volume bounces6/step1/24samples/denoise/AgX. Bloom으로 조형을 구조하지 않았다. 실제 밀도에 따른 흰 면·음영·투과·지표 그림자를 한 장면에서 렌더한다. cloud06 폭18km/base4.2km,01 폭12km/base3.8km,10 폭10km/base4km. 조형용 스케일이며 실제 대기 측량 수치가 아님.

40장960×540 PNG를 원본 보존, WebP quality92 약3,082,334bytes. 현재 웹은 **오프라인 물리 VDB 경로 베이크**다. AI 생성 영상·실시간 VDB·자유 카메라가 아니다. first web p=.280의 camera를 native(x,-z,y)로 맞추고 verticalFOV47도 일치시켰다. 초기 horizontal FOV7장은 rejected-horizontal-fov에 보존해 미채택.

## 3. 연속 구도와 스크롤 사양

| 전역 p | 화면·움직임 | 접합 의도 |
|---|---|---|
| .15–.235 | 광역 지도→실제 지형, 근접 footprint만 LOD 정교화 | 검은 사각 조명 경계 완화 |
| .274 | 능선 접근, 실제 WebGL DEM | 승인 근접 품질 보존 |
| .278–.284 | 카메라를 p=.280 pose에 정착, 같은 camera의 plate0로 교차 | 실제 구름 등장에 앞서 렌더 경로 인계 |
| .284–.320 | 군집 위로 접근, 큰 밝은 면/홈, 아래 지형·그림자 함께 보임 | 솜뭉치의 조형과 고도 분리 |
| .320–.345 | 카메라가 낮아지고 구름 옆면이 커짐 | 공중 통로에서 입체감 노출 |
| .345–.365 | 밀도가 높은 어깨로 들어가 지형이 점점 가림 | 서고로 넘어가는 가림 확보 |
| .365–.385 | inside plate39 유지, .37에서 실제 scene 교체 | scene 변경 프레임 노출 방지 |
| .385–.445 | 내부 구름이 걷히며 서고 외벽→상부 입구 접근 | 흐린 회색에서 따뜻한 실내로 이동 |
| .445–.55 | 기존 portal→aisle→s2_beams를 시간만 재매핑 | 같은 서고 구조/조명/사다리 유지 |

이웃 두 프레임을 선형 보간, aspect cover crop, 모든40장 준비 후 활성화. native sRGB plate를 OutputPass 뒤에 배치해 double tone mapping 방지. 인접 프레임 crossfade는 optical-flow 재구성이 아니므로 큰 이동에서 ghosting 가능. 22번 V0는 고정 카메라 구름 passage에 적합; 자유 시차·심장/파형은 실제3D/코드에 남긴다. 정지 중 cloud path는 정지하고 기존 심장 shared clock/서고 먼지의 시간 층은 유지. baked clouds의 자체 대류 애니메이션은 추가하지 않음.

## 4. 검증 증거와 비용

verification/a-north-cloud-path-20261007/gallery.html → native12구도 sheet/contact.jpg → manifest40원본+40웹 SHA → browser-manifest.json 및 실제 IAB PNG/JSON. 최종GPU법선 후보 .0/.10/.15/.18/.235/.274/.280/.300/.320/.345/.365/.410/.445/.550 총14고정구도. 정착된 능선과 실제 입력 추가 캡처는 최종 manifest로 확인.

브라우저는 실제 RTX3070 D3D11 렌더러를 보고했고 source/runtime오류0. 별도 전시PC 측정 증거가 아니다. PageDown/PageUp/Arrow와 실제 wheel 정역 경로도 확인. 구름 loaded40/fault null, 지형 coarse64/errors[]. PNG/JSON의 detailReveal이1에 도달하지 않은 중간 frame은 완전 정착된 detail 증거로 취급하지 않는다.

RGBA decode 상한82,944,000bytes(79.1MiB), 모두 GPU 업로드하면 texture82,944,000bytes 추가; 단순합158.2MiB, 브라우저 자체 사본/driver/압축source/cache는 별도. mipmap없음, linear filtering. nativeBake 비용과 WebGL frame budget을 구분. build66modules PASS. records check 결과는 최종 WORKLOG 참고.

## 5. 자체 피드백과 다음 판단

| 대상 | 판단 | 이유/후속 |
|---|---|---|
| 먼 지구/기존 자글거림 | 사용자 KEEP 보존 | depth 정책과 shell 변경 없음 |
| 약한 지도 경계 | TUNE | actual derivative 정합으로 선명한 사각 대비 완화; 전각도 소멸 미확정 |
| 근접 능선 | 기존 사용자 KEEP | 1.5× source/LOD 유지; 광역 수평선의 계단은 별도 |
| 구름 형태·빛 | TUNE/묶음 리뷰 | 승인 source 조형/실제 산란을 웹에서 관찰, 합성 noise의 예전 실패와 구분 |
| web→plate | TUNE | camera/FOV 정합, AgX vs WebGL 색/sky/geometry 표현 차이는 교차구간에 남음 |
| 프레임 밀도 | TUNE | 40native neighborblend; 1920 기준 <=3px/frame gate 및 연속영상 ghosting 미검증 |
| 서고 | 기존 KEEP 보존 | interior asset/lighting 유지, p=.55 같은 pose |

사용자 묶음 피드백에서1) 지형 경계2) 구름 양감/흰면/그림자3) plate색과 템포4) 서고 가림 해소를 함께 판단한다. 2차 실패 시 구름 없는 도입부와 AI영상 도입부 두 대안을 제작·비교한다. 지금은 그 판정을 대신하지 않는다. 하드웨어 frame-budget/모바일/전체연속영상/600초/장시간은 미검증.
