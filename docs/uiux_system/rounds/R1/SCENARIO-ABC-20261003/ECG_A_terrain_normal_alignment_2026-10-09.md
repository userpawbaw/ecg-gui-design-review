# D118 · 지형 색/깊이/법선 패스 정합

2026-10-09 / D117 S0→S1 / CASE-007. 사용자 진행 승인.

## 구현 전 갈림길

구름으로 가림, 경계 fade 확대, 실제 렌더 패스 계약 수정 중 세 번째부터 대조한다. postprocessing 6.39.5 NormalPass는 MeshNormalMaterial 공통 override로 기존 지형 onBeforeCompile을 버린다. 부모 geometry는 sphere로 저장하고 vertex shader에서 morph하며, 지역 geometry도 coarseHeight로 morph한다. 색/깊이와 법선 pass의 표면이 달라지는 코드 기여는 확인했지만 현재 경계의 유일 원인은 미확정이다.

Basic albedo 변환 시 polygonOffset 누락도 확인했다. legacy / offset만 / morph normal+offset 후보를 동일 camera/sun/DEM에서 대조한다. 색-only 진단은 태양·하늘 조명을 끄고 별도 label로 저장한다. 뷰 범위 .18/.20/.22/.235, cloud ON/OFF를 구별한다. main renderer와 승인 서고는 변경하지 않는다.

## 공식 자료와 설치 코드

- [Three Material](https://threejs.org/docs/pages/Material.html): polygonOffset은 깊이 우선순위이며 밝기 튜닝이 아니다.
- [Three MeshNormalMaterial](https://threejs.org/docs/pages/MeshNormalMaterial.html): 표면 법선을 색으로 표시한다.
- [postprocessing NormalPass 원본](https://github.com/pmndrs/postprocessing/blob/v6.39.5/src/passes/NormalPass.js): 설치 코드 build/index.js의 shared override 대조.
- Takram atmosphere 0.19.1 설치 shared.js: normalBuffer를 조명에 사용. shader vertex morph 계약은 패키지 기본 normal override가 자동 복제하지 않는다.

검증 결과와 남은 gap은 실제 시험 뒤 추가한다. 기술 PASS를 외형 KEEP로 확대하지 않는다. 기존 near 그림자 보류 유지.


## 실제 결과 / gate 판정

첫 4구도28정착은 보존한 뒤 광역 출현 .15/.165를 추가해 6구도42정착을 저장했다. legacy/offset/matched×cloud ON/OFF36 + 조명OFF6. 같은 camera/sun/source/renderSize/reveal 조건 assert, 모든 ready/context/terrain errors 검사 통과. RTX3070,1280×720. 실휠 정방향 p.198, 역방향 p.162 정착2 추가. 자동camera8초 영상은 별도이며 실제 휠 영상 아니다.

**TUNE / S1 전체 미통과.** normal 정합으로 확대 구간 조명 기여는 바뀌지만 지도 해상도·색 전환의 경계감이 남는다. p.18/.20/.22/.235 cloudOFF RGB 평균 차이 약.30/.74/2.51/2.99(0–255 척도)는 차이 존재 증거이지 품질 점수 아니다. polygonOffset 단독과 복합을 분리했다. 최초 flatShading undefined 경고3개는 false fallback으로 보완; renderer shader error는 관찰되지 않았다.

초기 .10→.18 진단 경로를 확장하면서 기존 handoffCamera와 원래 camera 사이 p.18 FOV switch가 남는다. 영상은 전체 motion PASS가 아니다. 같은 분포의 near 연결이나 서고는 진행하지 않았다. 다음 S1잔여: normal/depth 표면 표시 대조→지도 저주파 색·선명도 경계 및 FOV 연속 정합→정역 gate 재검증. S2 구름 광학은 이 지형 gate 이후다.

갤러리 verification/a-terrain-normal-20261009/gallery.html, manifest와 native json. 최초28 자료는 verification/a-cloud-sculpt-20261006/native-captures/terrain-seam-20261009에 보존. 처음42와실제휠은 wide 폴더에 보존. 8K assets와 DEM1.5× 유지. 기본 main PBR/승인 서고/Story 변경 없음.
