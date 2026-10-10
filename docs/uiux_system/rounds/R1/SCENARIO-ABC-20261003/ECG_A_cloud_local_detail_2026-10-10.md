# 확대 주변 구름의 국소 명암 · D127 / F092

상태: **부분 개선 / TUNE / 사용자 채택 전**. 마지막 첨부 화면 p.235에 대응하는 실제 렌더 비교. 구름 윗면 흰색(D126)은 검토 기준으로 사용했으며 전체 룩 채택으로 해석하지 않는다.

## 권장 시험 결과부터

큰 위성 구름 분포와 기존 높이·불투명도를 유지하고, 확대 목표 주변 약90–330km 범위에서 조명용 굴곡만 연속적으로 추가한다. 중간 후보를 우선 검토한다. 강한 후보는 일부 능선이 더 선명하지만 바늘 같은 결·딱딱한 그늘 위험이 남아 있다. 최종 9장과 확대 동일 영역 crop, 실제 renderer에서 녹화한 8초 정역 영상을 비교 페이지에 모았다.

- [비교 페이지](../../../../../verification/a-cloud-relief-20261010/gallery.html)
- [근거 metadata](../../../../../verification/a-cloud-relief-20261010/manifest.json)
- 실제: `cloud-lab.html?cloudDetail=1&orbital=1&handoff=1&terrainSeam=1&pose=north300&recipe=curtain&reviewRound=cloud-relief-20261010`
- 패널의 **확대 주변 구름**에서 기존/국소/강한 후보를 전환. **카메라 진행 .235**가 첨부 마지막 화면에 대응한다.

## 사용자 이미지 해석

처음 세 장: 넓은 얇은 띠와 빈 바다가 있고, 작은 일부 군집에서만 밝은 윗면·빛 반대쪽의 어두운 옆면·같은 방향의 그림자가 두드러진다. 마지막 두 장: 현재 화면의 조밀한 흰 구름은 큰 높이 변화는 있지만 작은 윗면 결이 완만해서 확대 시 둥근 덩어리처럼 보인다. 사진의 명암을 그대로 색으로 복사하면 카메라/태양이 바뀔 때 맞지 않으므로 같은 광원으로 gradient와 자기 가림을 계산한다. 지형에 드리우는 구름 그림자는 사용자가 보류한 별도 작업이다.

## 자료와 번안 범위

[NVIDIA GPU Gems39 — Volume Rendering Techniques](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques), §39.4 데이터 gradient 및 §39.5 local illumination/volumetric shadow. gradient가 조명 단서를 추가하고 해상도/샘플링이 결과에 영향을 준다는 원리를 참고했다. 현재 구현은 **2.5D height-field의 조명 근사**다. 공식 문서의 완전한 volume 산란/다중 산란 또는 실제 구름 높이 재현이 아니다. 새 에셋·추가 volume층은 이번 최종 후보에 없다.

## 왜 밝기만으로 부족했나

기존 `smoothstep(.48-coverageBoost,.94,d)`가 조밀한 윗면에서 포화하고, normal은 최소3km 양옆을 평균한다. D126 직접광 증량은 회색 윗면을 밝힐 수 있지만 존재하지 않는 높이 차이를 복원하지 못한다. 이 코드 구조는 디테일 약화 기여 근거이며 전체 사진 품질 gap의 단일 원인으로 확정하지 않는다.

## 세 시험 / 기각 이력 보존

1. **첫 시험 9장: 높이 자체에 detail 추가**. 실루엣/교차 높이 최대10.8km, normal 증폭. 그늘은 뚜렷하지만 뾰족한 지형 같은 모양이 되어 기각. `cloud-relief-first-20261010` 보존.
2. **두 번째 9장: 실루엣 유지/좁은 focus/약한 조명 detail**. 자연스러움은 개선했지만 마지막 화면의 세부 명암 차이가 작아 최종추천 제외. `cloud-relief-second-20261010` 보존.
3. **최종 9장: 실루엣 유지/넓은 연속 focus/중간·강한 조명 detail**. p.1584/.18/.235 × 강도0/1/2. 확대 중심 일부의 그늘과 윗면 분리 개선. 실사 사진의 부드러운 섬유 결 및 완전한 부피 산란까지 도달한 것은 아니다. 중간 추천 TUNE.

## 최종 구현

- 기존 opacity, source placement, 높이7–9.4km, ray intersection10회 유지.
- 조명용 높이: `7000 + 2200*broad + strength*3800*(fine-broad)`; broad는 최소7km, fine 최소1.8km로 필터. 위성 밝기로 만든 **예술적 조명용 높이**이며 측정 높이가 아니다.
- geographic 목표[8.4°,61.63°] 주변: 90km 안 기여 유지→330km 밖0. 화면이나 카메라에 붙는 마스크 아님. 경계 opacity·분포 변화 없음.
- normal의 표본 간격 최소3km→국소1.8km, pixel footprint를 하한으로 유지. 조명용 gradient 2.4배.
- 국소 sunlight 가림은900m 간격6회. 기존4회보다 세부 음영이 가까운 구조를 반영한다. 지면 그림자 기능을 추가한 것이 아니다.
- direct radiance는 D126 중간white; fill/night/haze 및 지도 노출 유지.
- 추가 texture/렌더 pass/volume 없음. gradient와 self-occlusion의 texture 조회 연산은 증가한다. 짧은 GPU composer 표본은 manifest; 전체 frame/목표 PC 예산 보장은 아니다.

## 검증과 한계

83module build PASS, 브라우저 shader error 없음. 9final native1280×720, 각 구도 camera/sun/sourceMatch/opticalCorrection/placement 동일 assert PASS. 8초 자동 정역 .10→.235→.10 영상은 별도 저장하며 실제 휠 입력 증거와 구별한다. 영상 keyframe 표본은 갑작스러운 군집 생성 없이 같은 분포의 확대를 확인하는 범위이며, 모든 프레임의 미세 shimmering 해결 증거는 아니다. 원경/지도 경계 잔여·사용자 채택·근경 volume 통과·서고 연결은 미완이다.

## 다음 작업과 통과 기준

1. p.235 중심 군집: 흰 능선과 어두운 골이 읽히면서 딱딱한 지형 결로 보이지 않는지 사용자 리뷰.
2. p.1584→.235 및 역방향: 고정 geography의 detail이 확대되어야 하며 마스크 윤곽/새 구름 생성/점 자글거림이 없어야 함.
3. 부족하면 별도 고품질 volume층을 **동일 footprint**로 제한하여 비교. 추가층은 검토만 했으며 구현했다고 기록하지 않는다.
4. 국소 품질/기존 S1 source 접합 검토 후 동일 footprint near volume 인계와 서고 가림 진행. 기존 near shadow 보류, 서고 KEEP, 과거 실패2/2 및 no-cloud/AI영상 fallback 유지.
