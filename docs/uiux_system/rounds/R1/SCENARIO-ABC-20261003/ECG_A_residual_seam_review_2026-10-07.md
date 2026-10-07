# 희미한 지형 경계 추가 검토 — 2026-10-07

D-097 / CASE-007. 기존 D096 baseline 유지, 범프 정합 실험 미채택. 사용자 “이정도도 만족”은 현재 실용 품질의 긍정 판정; 완전 무경계 승인으로 확대하지 않음.

## 사용자 피드백과 판단 수정
첨부 확대 화면에서 경계가 약하게 남는다. 이전 D096의 “사각 경계 소멸” 관찰과 채팅 단정은 제한된 고정 구도에서의 판단이었으며 전체 구간 소멸 주장을 철회한다. D096은 큰 사각 명도 차이를 줄였고 약한 잔여 seam은 TUNE이다.

## 추가 실험
globe는 외곽 packed bump .6을 사용, parent에는 bump 없음. 같은 packed texture clone에 repeat16/360,12/180과 offset.5,146/180을 적용하고 bumpScale.6·edge .12 attenuation을 맞춤. 공식 Three Texture 변환 및 현재 설치된 Three0.186.1 bumpmap_pars_fragment/normal_fragment_maps source 확인.
- https://threejs.org/docs/pages/Texture.html
- https://threejs.org/docs/pages/MeshPhysicalMaterial.html
실제 IAB .15/.18 PNG 비교: 평균 RGB absolute difference(0–255) .0132/.0078, 채널차>2인 픽셀비율 .0006/.0003. 아주 작은 화면 변화이며 seam 감소량/사람 지각 효과를 측정한 수치는 아님.
따라서 이 변경만으로 잔여 경계 해결 불가, 효과에 비해 샘플링 복잡도를 늘릴 이유 부족. runtime 코드는 실험 전 HEAD a732228의 terrain-parent.ts로 복구. 구름/조명/near/기존지형은 최종 미변경.

## 왜 남을 수 있는가
[코드/추론] 광역 parent는 일부 정확 구면→tangent 근사로 좌표를 보간하고, 높이 morph와 normal은 별도로 보간한다. globe는 구체의 보간 normal/bump, parent는 다른 tessellation/DEM normal을 사용. 색상도 Moto global과 EOX 지역 source가 다름. 이 복합 차이 중 어느 항목이 첨부 경계의 주원인인지는 이번 작은 범프 시험으로 확정하지 못했다.

## 완전 제거에 가까운 후속 방법
1. 경계 띠의 실제 위치·법선을 같은 구면+높이 함수에서 산출, morph 순간의 법선도 실제 변형과 일치시킴.
2. 지도 두 source의 저주파 색/명도 정합 후 경계 넓은 띠의 재질/높이/normal을 동일 가중치로 연결. 마스크 모양만 바꾸면 경계가 이동할 수 있음.
3. 그래도 보이면 globe와 local terrain을 하나의 adaptive surface/LOD 구조로 통합. 사각 patch 교체를 제거하지만 범위가 커지고 검증 비용도 큼.
구름량/블러/노출로 숨기거나 점투명도 alphaHash 복귀는 추천하지 않음. 현재 만족 후보로 다음 단계 진행 가능하며, 후속1–2는 별도 지형 품질 polish 항목으로 보존한다. 여기서 완전 제거 불가능이라고 단정하지 않는다.

## 증거와 한계
verification/a-cloud-sculpt-20261006/native-captures/north-border-bump: .15/.18 실험 PNG/JSON. build65 PASS는 실험 코드 빌드; 최종runtime 복구는 이미 검증된 baseline 그대로다. 실험 전체 motion/GPU 효과 미검증. 근접 실험은 시점 선택했으나 새 저장·정착 검증 전이라 이번 증거로 주장하지 않음. 전체 cloud feedback1/2 유지.
