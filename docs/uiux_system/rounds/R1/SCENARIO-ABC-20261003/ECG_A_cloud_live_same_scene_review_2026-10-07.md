# A 실제 VDB 구름 · 동일 지형 실시간 시험

2026-10-07 · D100 / F067 / O016 / CASE007 · 단독 cloud06 후보 TUNE

## 이번 작업 범위와 결과

사용자 D099 다음 packet 진행 승인, 작업 중 "계속 진행하자" 확인. 전체 RGB plate를 제거하고 기존 northern WebGL terrain, 1.5× DEM, global/macro/parent/regional LOD, 태양 방향, 기존 서고를 유지했다. 구름이 있는 지점으로 실제 카메라가 이동하고 구름 내부 가림을 지나 서고로 연결한다. D098의 기존 카메라 정착을 해제했다. 기존 실패 feedback2/2는 지우지 않고 D080 구름 없는/AI 영상 비교는 아직 미실행으로 보존한다. 이번 단독 실시간 경로는 사용자 최종 채택이 아니다.

## 실제 밀도와 JS 변환의 차이

- JangaFX cloud06 source SHA256 `3c416cd2ca163e5bbc87911975806312d65b1e39a9ef83f2cd74f152efeadbee` 유지.
- 제작자 JS `openvdb@0.3.0`는 실제 파일 topology는 읽으나 `readBuffers(){}`가 비어 있고 leaf `getValue()`가 activeMask 0/1을 반환한다. 두 index sample 평균 출력 unique=3(0/.5/1). 이 출력은 **실제 밀도 변환 실패 / REJECT**, served production asset에서 제거하고 `verification/a-vdb-live-20261007/rejected-js-mask/`에 보존했다. JS worldBounds도 원본 native transform을 정확히 반영하지 못했다.
- 작업 폴더에 격리된 conda-forge OpenVDB13.0.0/Python3.12.15/NumPy2.5.3 환경을 설치. source grid `density`에 native `copyToArray` 수행: activeCount4,987,187 / nonzero .00200081–.65917969. 단순 mask가 아니라 실제 연속 값이다.
- index bounds (47,117,11)–(356,571,163), native world bounds (-160.5,-202.5,-100.5)–(148.5,251.5,51.5). native axis X,Z,-Y를 WebGL east/up/south로 옮기고 source translation을 local bank에 재중심화했다. 원본 지리적 구름 위치를 측정·복원한 것은 아니다.
- 128×64×192 scalar volume, 4% empty padding, trilinear resampling, half float. 결과 .0–.60634917 / nonzero344,804. source density를 반영하지만 전체 native voxel 해상도와 같지는 않다.
- fixed sun (-.66428,.27761,-.69402), 64×32×96 cache, 80×.55km actual density integral. density3,145,728 + light393,216 = **3,538,944 bytes(3.375MiB)**. 화면 이미지나 terrain bake를 포함하지 않는다.
- isolated environment의 패키지 version/build/URL/hash는 `environment-lock.json`; runtime에는 native OpenVDB 설치가 필요 없다. 현재 변환 script는 `.tools/vdb-native` 환경에 의존, 로컬 일반 Python 재실행을 지원한다고 주장하지 않는다.

## 같은 장면에서의 구성

cloud06 하나의 bounds km: (-9.7826,3.8137,-18.3583)–(9.7826,13.4701,10.3583). p별 visibility spawn이 없으며 먼 거리에서도 같은 위치의 구름을 렌더한다. 얇은 global shell은 기존 상태를 유지하고 p.175–.235 사이 감소한다. 국소 구름은 실제 거리와 투영 크기로 접근한다. 전체 기상 군집이나 global shell과 실제 동일 weather field를 만든 단계는 아니다.

| p | camera km | 보는 장면 |
|---|---|---|
| .235 | (55,100,150) | 승인 지역을 향해 하강, 작은 국소 cloud가 이미 보임 |
| .265 | (35,45,70) | 같은 지형·같은 cloud |
| .290 | (18,14,25) | cloud 앞·옆면 확대, terrain 그대로 |
| .319 | (10,9,16) | 같은 bank 옆면/음영 강조 |
| .345 | (3,7.5,8) | 실제 밀도 안으로 진입 |
| .365 | (0,7,1) | 실제 내부 가림 |
| .370–.445 | 내부 cloud camera 고정 / 서고 camera 별도 | volume 투과·scatter fade로 서고 공개 |
| .550 | 기존 서고 pose | 사용자 KEEP 조명/소품 유지 |

원형→지역 .0–.290 기본 경로는 기존 키프레임 유지, .278 camera freeze 삭제. 이후 cloud 경로만 추가. 각 segment smoothstep 및 정역 위치 평가. 서고 경로는 기존 시간 재매핑 유지. archive 직접 QA jump에도 내부 cover camera를 명시해 직전 프레임에 의존하지 않는다.

## 빛·후처리 검토

- **넣음**: 실제 density, Beer–Lambert 투과, fixed-sun 광학 cache, HG-like forward/back phase, 고도별 blue sky fill, approximate multiple-scattering lobes, distance haze, terrain direct diffuse/specular cloud shadow.
- **정확하지 않음**: native Cycles6bounce와 동일 다중산란이 아니다. extinction12/km는 look tuning 계수. 실제 날씨/의학 데이터도 아니다.
- **depth**: 현재 scene을 동일 camera로 다시 그려 실제 parent GPU morph와 regional geometry depth를 사용한다. 초기 MeshDepth override 시험은 morph를 반영하지 못해 미채택. terrain 바꾸기/가짜 구름 조형으로 가리지 않는다.
- **AA/선명도**: volume target60% render resolution, alpha-aware spatial 5tap upsample, 기존 MSAA/SMAA·bloom·OutputPass·grade 유지. random per-frame jitter/alphaHash 없음. temporal accumulation/연속 shimmer 완전 제거 증거는 없음.
- **출력 순서**: volume은 linear HDR에서 bloom/OutputPass 이전 합성. 이전 sRGB RGB plate pass 이후 합성 제거. 톤매핑을 두 번 하지 않는다.
- **지형 shadow map**: 같은 .300 view의 OFF 대조로 큰 삼각 음영이 사라짐. regional shadow geometry/frustum 정합 결함의 세부 원인은 아직 확정하지 않았다. 이번 trial은 terrain shadow map 기본 OFF, 경사 normal lighting·cloud optical shadow 유지. `terrainShadow=1`로 기존 결함 대조 가능. cloud shadow `cloudShadow=0`, volume `cloud=0` 분리 진단. 서고 sun/shadow 설정은 바꾸지 않는다.
- **성능**: scalar texture3.375MiB CPU source buffer + GPU scalar texture3.375MiB. volume/depth RT 별도. 캡처599×404에서 volume RGBA16F약1.94MB, depth texture·color 약1.94MB 등 별도 비용이며 GPU allocation 실측 아님. 기존40 plate의 GPU/decoded 79.1MiB씩 보유 경로는 더 이상 northern path에서 불러오지 않는다. 96far/160near steps, .002transmittance early-out/empty-density skip, .6volume target. scene 두 번 draw 비용 존재, FPS/GPU timer/전시PC/장시간 성능 미검증.

## 실제 검증과 충실도 상태

13 final fixed pose native canvas PNG/JSON: .0/.10/.18/.235/.274/.280/.300/.320/.345/.365/.410/.445/.550. RTX3070 ANGLE D3D11 실제 브라우저. final state terrain errors[]/cloud ready true, scalar source hash 포함. capture detailReveal를 개별 manifest에 기록; 초기 region morph 중 캡처를 정착된 최종 geometry 증거로 확대하지 않는다.

실제 wheel forward/reverse는 별도 `north-vdb-live-motion-final`로 기록. 연속 동영상/프레임별 jump bound/모든 환경 성능을 통과했다고 주장하지 않는다. source→render/브라우저 기능 확인과 시각 최종 승인은 구분한다.

| 기준 | 판정 | 남은 것 |
|---|---|---|
| 실제 density 형상 사용 | PASS | native scalar export·metadata 확인 |
| 기존 terrain 보존 | PASS(구성·13구도) | 전체 continuous video 미검증 |
| cloud 작은 silhouette→접근→내부 | TUNE | 미세 질감/반투명 edge/광량 사용자 확인 |
| terrain shadow artifact | OFF대조 개선 | 올바른 regional shadow map은 후속 작업 |
| cloud cast shadow | contribution 비교 | 정밀 native 광학 일치/GPU 미검증 |
| 서고 동일 assets/pose | 유지 | cover 해제 템포·색 정합 TUNE |
| full Intro weather/adoption | 미완 | 단독 cloud packet이며 사용자 KEEP 전 아님 |

G1/G2: D100 constants·source hash·registry 핀 완료. G3: 단계 13frame/contact 및 source VDB 조형기준 사용; 동일nativecamera/태양의 정량광학 일치 시험은 미완. G4: native reference와 밝기 수치 일치 미검증. G5: fixed/actual 정역 wheel·effects OFF 대조, reduced-motion/mobile/targetPC 미검증. G6: 내부 검증은 합성uniform 복구→실제 geometry depth→terrain shadow 분리/cover camera 고정의 세 묶음, 최종 후보 사용자 review 전 TUNE.

## 연구 자료와 현재 적용

공식 OpenVDB `copyToArray` https://www.openvdb.org/documentation/doxygen/python.html · 실제 Windows native 실행 확인. 공식 feedstock https://github.com/conda-forge/openvdb-feedstock · 격리 패키지 조달. 공식 Three volume example https://threejs.org/examples/webgl_texture3d.html · 렌더 경로의 근거, 구름품질 보증 아님. 제작자 https://github.com/mjurczyk/openvdb · npm0.3.0 local code 실제 검사 후 scalar export 미채택. Arnold 광학 기준과 D085 source asset 기록 유지.

## 다음 리뷰·단계

이번 화면에서 **등장 연속성, 기존 지형 유지, 구름 표면·음영, 내부→서고 가림**을 함께 리뷰. 현재 미세 질감은 native 해상도보다 낮고 단독 cloud 배치여서 자연스러운 군집/얇은층 확대는 이 packet 검토 후 진행. A-P3/Story/BC는 계속 별도. D080 fallback 두 후보 비교는 미실행 보존, 성공/실패 또는 최종 winner를 임의로 확정하지 않는다.

최종검사: build66modules PASS / records215 PASS. effectsOFF 초기 .300 detailReveal .5/.575의 비교수치는철회하고 둘다1인 정착캡처로갱신. cloudShadowOFF RGB절대차평균 6.0903/255, 2이상변화픽셀비율 0.2381. opticalshadow기여만확인하며native광학정확성증거아님. terrainShadowOFF 최초대조는detailReveal .65로일부geometry변경영향도있어shadowmap이유일한원인이라고확정하지않음; 기본OFF의triangularartifact개선은후속정착화면에서도관찰. 현재작업branch원격동일/main cfef430, 다른claude변경은inflow-preview-v3.py라이번자원과겹치지않음.
