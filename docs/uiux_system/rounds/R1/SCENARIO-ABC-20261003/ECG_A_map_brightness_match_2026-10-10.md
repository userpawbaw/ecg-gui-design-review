# D122 · 지도–3D 지형 명도 대조

사용자: 지도 쪽 명도를 낮춰 3D 지역과 맞추는 방식 제안. 2026-10-10 / CASE-007 / D118·D119·D121 후속.

## 구현 전 갈림길

- 3D 전체 증광: slope/sky occlusion 명암까지 평탄해질 위험; 이후 대조 가능.
- 화면 전체 노출 감소: 3D와 지도 모두 변하므로 차이를 해결하지 못함; 제외.
- **지도 기여만 선형 gain 적용**: 선택. 지형 원색/광원/구름 유지, globe의 지도와 parent의 global fallback에 같은 gain 적용. 기존 source blend를 통해 넓고 연속적으로 이어지게 하고 스크롤 진입 때 부드럽게 적용.

## 계약·통과 기준

gain1/.8/.65 비교. .15/.165/.18 세 구도에서 같은 camera/sun/cloud/DEM 유지; .165에서는 구름OFF도 대조하여 가림을 개선으로 오인하지 않는다. 실제3D normal/geometry/height1.5 유지. 새 어두운 사각 테두리/무채색/과도한 바다암부가 생기면 TUNE. 지도 albedo 보정이므로 대기 산란/법선/깊이 차이에서 오는 seam은 남을 수 있다. 구름 quality/near shadow 보류/서고KEEP/2회실패 및 fallback 결정 보존. 실제 자동8초 이동 확인; 장시간·실PC 품질 승인과 분리.


## 결과
12 실제 대조캡처와 8초 자동영상. 지도gain 작동 확인; cloudON 경계개선 제한 TUNE. 후보80% 임시값/사용자KEEP 미확정. 원색선형gain≠화면명도비율. 전체seam/대기/법선 정합은 미완. verification/a-map-gain-20261010/manifest.json.
