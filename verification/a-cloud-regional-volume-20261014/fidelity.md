# 지역 확대의 세부 구름 에셋 — D138

## 결과 먼저

D137의 명암 잔차 대신, 실제 Disney VDB 밀도를 작은 3D 에셋으로 변환해 확대 경로 주변 두 군집에 배치했다. 밝은 윗면과 작은 골, 높이 차이가 이전 얕은 구름층보다 분명히 나타난다. 그러나 기존 층 자체의 매끈함과 새 군집의 재질 연결, 사진 reference 수준의 세밀한 결은 TUNE이다. 사용자 채택과 전체 도입부 통합은 아직 하지 않았다.

## 사용자 반례와 선택

사용자는 “p0.2100부터 그 이상 부분이 어색”하고 선명한 세부 구름 에셋이 확대되며 자연스럽게 나타나길 요청했다. D137은 원래의 높이/윤곽을 바꾸지 않으므로 이 요구를 해결할 수 없다. 고정빛 RGBA atlas는 D135에서 재질 이질성 반례가 있었다. 이번에는 실제 밀도를 재조명하는 국소 볼륨을 선택했다.

[문헌] Epic 공식 material은 큰 분포, 고도 profile, noise shape를 분리하며 Noise_Bias로 침식/팽창을 제어한다. 이를 참고해 투명 sprite를 켜는 대신 coarse→fine 밀도/높이를 연속 변형하는 별도 방식을 시험했다. Epic/Nubis 알고리즘을 재현했다고 주장하지 않는다.

## 실제 구현과 좌표

- 원본: Disney quarter VDB, source hash 279efd7566f4f8f3d05a1cb4529b7e903d64a6b4e91c2edce5824b9b5c9f722a.
- 원본 active bounds의 498×338×613 scalar density를 삼선형 재표본화해 192×96×192 두 벌 생성. fine은 원본 밀도, coarse는 Gaussian sigma3 voxel 밀도. 양수99.5 percentile 정규화와 sqrt R8 encoding; shader에서 red² 복호화. 빛이 구워진 이미지가 아니다.
- 고정 local world 중심: (-14,11.2,-9)km, (22,10.5,-36)km. 첫 footprint52×46km, 두 번째36×40km를90도 회전. 같은 모델 반복과 크기 연출은 남은 제한이다. 실제 북유럽 기상자료도 아니며 source 단위를 실제 km라고 주장하지 않는다.
- p.19→.25 smoothstep으로 첫 높이3.6→8.4km, 두 번째3.0→6.5km와 평활→세부 밀도 인계. 첫 군집 하단은 초기9.4km, 최종7km로 기존 구름층 높이와 겹치도록 구성했다. p.21에서 개체 생성/opacity 스위치를 켜지 않는다. opacity 자체는 적분된 extinction에서 나온다.
- 픽셀 footprint가280→1600m이면 세부 밀도를 평활 밀도로 전환한다. 고정 경로에서 progress가 형태 인계를, 실제 카메라 거리가 세부 필터링을 담당한다. 자유 카메라 전체에 대한 일반 LOD system은 아니다.
- ray-box 교차가 없는 픽셀은 즉시 반환. 실제 밀도를192회까지 적분하고 태양 방향6회 밀도 가림과 밀도 gradient로 밝은 면/골을 계산한다. 임의 extinction .0017/m, RGB fill/direct/multiscatter 근사이며 물리적 광학 수렴은 아니다.
- 기존 orbital pass 안에서 같은 태양 방향으로 tone mapping 전에 합성. billboard 회전이나 baked atlas 조명 이질성은 없다. 기존 얕은 층과의 형태/재질 연결은 아직 완전하지 않다. 지형 depth/그림자/근접 구름 통과는 이번 범위 밖이다.
- 추가 데이터6.75MiB는 두 R8의 명목 texture storage다. 전체 VRAM 실측이 아니다. opt-in regionalVolume=1, lab 범위 .18–.29. 기본 main Intro는 그대로다.

## 실패·보완 보존

첫72단계 계산판16장을 first-72-step에 보존했다. p.29의 표면 줄무늬를 발견해192단계로 올린 동일 source 대조를 수행했다. static 근접 줄무늬는 줄었지만 전체 움직임의 잔여 banding/aliasing 제거를 보장하지 않는다. 결과를 source 고유 결로 오인하지 않는다.

## 검증 범위

- final actual 1280×720, p.18/.20/.21/.22/.235/.25/.27/.29 × OFF/ON=16장. 각 쌍 camera 동일, ready=true/contextLost=false, 192step metadata와 크기 확인.
- 자체 canvas8초 p.18→.2898→.18 영상, trace482개. 로컬 생성본이며 Git 업로드하지 않는다. 영상의 모든 frame에 대한 미감/잔여 shimmering 판정은 사용자 리뷰 대기.
- 실제 화면 휠 down/up2회, p.21 복귀 settled=true. 정역 후 camera는 기준 snapshot과 일치. 표시 픽셀 평균 절대차이 .02312/255로 작은 AA/dither 차이가 남는다. 이 값은 자연스러움 점수가 아니다.
- RTX3070/ANGLE, 1280×720, 각 후보30 GPU timer 표본. OFF p50 약1.82–3.77ms, ON 약3.47–4.87ms. 같은 구도 차이 약.77–2.04ms이나 짧은 순차 표본이므로 정확한 비용/FPS/target PC 보장으로 사용하지 않는다. 인코딩 비용은 이 비교에 포함하지 않았다.
- host Vite build PASS. browser shader errors 없음. static gallery 이미지/영상 로드 검증은 validation.json에 기록한다. 구조 checker는 별도이며 미감 채택 증거가 아니다.

## 검토할 항목과 다음 통과 기준

1. p.20→.22 정역: 군집이 갑자기 생기거나 화면 위치를 따라 움직이지 않는다. 밀도/높이 인계가 ‘성장 연출’처럼 과하게 보이면 고도 고정 + 거리 필터 중심으로 수정한다.
2. p.235/.25: 밝은 윗면, 어두운 골, 작은 결이 주변 얕은 층과 자연스럽게 연결된다. 새 구름만 다른 물체로 읽히면 군집 footprint/밀도 가장자리와 기존층 교체 마스크를 조정한다.
3. p.27/.29: source voxel 확대/줄무늬/윤곽 계단이 눈에 띄지 않는다. 이 구간의 native 밀도 결이 부족하면 군집의 필요한 subregion 해상도를 올린다. 전지구 데이터 증량은 하지 않는다.
4. shader 정상과 정역 입력은 기술 확인이다. 사용자 미감 채택 후에만 본 도입부에 통합한다. 근접 통과·빛 커튼 연결은 별도 단계이며 지금 완성했다고 표시하지 않는다.

지형1.5× 유지, 지형 그림자 보류, 서고 KEEP, 기존 제작 실패2/2 및 구름 제거/AI영상 fallback 보존.

## 출처

- [Epic Volumetric Cloud Material](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-material-in-unreal-engine): 본문 확인, layout/profile/noise와 dilation/erosion. 저자 방식 응용/완전 재현 아님.
- [Guerrilla Nubis, Evolved](https://www.guerrilla-games.com/read/nubis-evolved): 발표 제작자/출처 확인. 이번 구현 성능이나 원본 재현 근거로 쓰지 않는다.
- [Disney Clouds](https://www.disneyanimation.com/resources/clouds/), [공식 license](https://media.disneyanimation.com/uploads/production/data_set_asset/6/asset/License_Cloud.pdf). Copyright2017 Disney Enterprises Inc, CC BY-SA3.0, Kevin Udy photo reference. 내부 시안 사용 범위, 출품 전 별도 검토.

## 재현 / 산출물

scripts/assets/prepare-disney-volume.py → 두 R8와 manifest. cloud-regional-volume.ts → 실제 밀도 shader. 실행 페이지 regionalVolume=1의 ‘16구도 저장’ → native captures. scripts/assets/package-cloud-regional-volume.py → 정지 비교 페이지. 영상은 페이지의 ‘8초 지역 확대 정역 영상 저장’으로 로컬 생성한다. VDB/ZIP/개인 첨부/영상 바이너리는 업로드 제외. 패키지 스크립트 재실행은 browser validation 보충값을 덮어쓸 수 있으므로 재검증해야 한다.
