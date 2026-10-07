# A-P2 북반구 지구→상세 지형 연결 후보

2026-10-07 · D-093 / F-061 / O-014 / CASE-007

## 1. 이번 작업

`?terrain=north`에서 **원형 지구→궤도 수평선→북유럽 확대→1.5× 지역 지형→구름 가림→기존 서고→심장·파형**을 이어가는 별도 후보를 구현했다. 기본 지구 경로를 새 후보로 채택한 상태는 아니다. 지역 지형 디테일 KEEP/1.5× 시험 승인과 신규 연결 품질 TUNE를 분리한다.

[실제 후보](http://127.0.0.1:4198/?terrain=north&reviewCapture=1&reviewRound=north-handoff) · [캡처와 native 기준 렌더](../../../../../verification/a-north-handoff-20261007/gallery.html)

## 2. 좌표·카메라·품질 인계

전체를 km 좌표로 다룬다. 지역 원점61.63N/8.4E의 east/up/south tangent basis로 지구 mesh를 회전하고 지구 중심을(0,-6371,0)에 놓았다. 승인된 지역 mesh도 같은 좌표계에 있다. 지역에서 다른 scene으로 바꾸는 순간 카메라를 새로 설정하는 방법을 피했다. 지형 곡률은 기존 근사식이며 정확한 ellipsoid/GIS 카메라 시뮬레이션은 아니다.

| 구간 p | 화면·카메라(local km) | 상세 수준 |
|---|---|---|
| 0 | (2100,19000,2900), 지구 중심 쪽 | 공개4K day/night/packed map, 별과 극지·대륙 |
| .10 | (950,3700,1400) | 곡면/수평선과 낮밤, 대기 edge |
| .18 | (220,820,650), 지역 원점 쪽 | 북유럽 parent 지도, 아직 지역 geometry 표시하지 않음 |
| .235 | (55,100,150) | 지역 geometry와 broad map, 타일별SSE |
| .265 | (35,45,70) | 1.5× 상세 산악 지형, 근접 지도 refinement |
| .294 | .29–.319 사이 | 능선 접근/가림 진입 |
| .319–.40 | 구름이 화면을 가리고 서고를 드러냄 | 아래 VDB bake bridge; 이 부분은 live volume이 아님 |
| .55 이후 | 기존 서고 카메라·사다리·심장·혼합 파형 | 기존 승인 구조·빛·데이터/박동 흐름 |

원형 지구의 밝은 면/어두운 면 도시 불빛은 Moto 공개 지도에서 번안했다. 원작 shader를 그대로 실행한 것은 아니다. 표면은 MeshPhysicalMaterial specularIntensity .16 / roughness 최소 .32 / bump .6km로 과한 반사/윤곽 부풀림을 완화한다. **극지 실제 ice DEM/기하 relief 추가는 이번에 하지 않았다.**

## 3. 확대 중 지도 패치 개선

처음에는 좁은 고품질 지형이 흐린 global 지도 안에서 사각형으로 도드라졌다. 다음을 실제 적용했다.

- EOX2023 북유럽 parent 범위0–16E/56–68N, zoom7 원본60타일 추가 확보/URL·hash pin.
- 렌더용 지도를1262×2048로 제한. latitude/longitude 샘플은 대략650–700m 수준으로, 기존73m broad / 18m near와 구분. native10m 지도로 부르지 않는다.
- global→parent→broad→near의 UV 좌표 연결과 테두리 혼합. 지역 geometry는p>.215부터 표시한다.
- 지역 바깥 가장자리에서 global map/구름 색상을 혼합하고 alphaHash로단절을 완화. 기존64tile/4LOD/1.2px SSE/geometry48MiB예산은 유지한다.

새 parent는 화면 전체가 필요로 하는 중간 detail을 제공한다. 지구 전체에32m 지형을 생성하지 않는다. 다만 자료 시기/광학·곡률/normal 차이가 있어 모든 경계의 매끄러움을 보증하지 않는다. 이동 중 edge/alias/popping은 TUNE.

## 4. 대기광 보완과 한계

유리형 표면 shell을 추가하지 않고, 반경6371–6400km 사이 고도 밀도를24단계로 적분하는 post pass를 구현했다. 고도7.5km scale/density .013, 태양방향 구면가림으로 밝은 수평선과 어두운 면을 나눈다. surface 위 산란은.20 / sky-limb1.6으로 나누어 표면 전체를 파랗게 덮는 느낌을 줄였다.

이것은 **단순 단색/고도 기반 광학 근사**다. spectral Rayleigh/Mie·Bruneton 완전해법/terrain depth에 정합된 atmospheric transport가 아니다. 표면/높은시점 가림·하이라이트·edge 광량/AA는 해당 구도에서 보완한다. 기본 경로의 기존Takram LUT 구현을 바꾼 것은 아니다.

참고한 실제 기능: [Three.js MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)의specularIntensity/roughness와비용, [Three.js volume 예제](https://threejs.org/examples/webgl_volume_perlin.html)의볼륨표현가능성. 예제의noise를승인된VDB로사용했다고주장하지않는다. 이번nativeVDB는아래실제조달자산을사용한다.

## 5. 승인 VDB와 실제 지형 receiver — 웹과 구분

실제 JangaFX cloud06을 **1.5× Blender 지형 장면에 직접 import**했다. width18km/base4.2km/density.8/anisotropy.45/volume bounces6, 원본과 같은 태양·지표 재질·Nishita fill. RTX3070OptiX/48samples/1280×720으로 접근/옆면/안쪽3장을 렌더했다. sourceSHA와camera/장치/초기로그는manifest에 보존한다.

**native:** 실제 density로구름부피·지표가림/그림자를계산. **현재웹:** 안쪽으로진입한3번째렌더만가림용bake로사용하여지역→서고의camera전환을감춘다. 이안쪽화면은거의회색으로가려진화면이며품질있는구름외곽을보여주는장면이아니다. 지역웹공간에서승인VDB를실시간3D로통과하거나같은native그림자를보여주는구현은아직없다. AI영상대안이나구름제거대안을선택한것도아니다.

첫기준렌더뒤작업이느려native재개시OptiX장치설정을명시적으로복원하고관련process만중지/재실행했다. 처음완료된접근PNG/로그는source/initial에보존했다. 최초실행의실제장치상태는manifest에없으므로CPU로확정해서기록하지않는다. 최종3장은OptiX활성장치와실제완료를확인한다.

## 6. 자체 피드백·검증 범위

- KEEP 후보: 같은 좌표의 연속 확대, 중간 parent 지도와 지역1.5×세부, 실제 VDB가 지형 위에 놓인 native 양감·가림 기준.
- TUNE: 확대경계 색상/normal/alphaHash, 해양 반사와수평선 광량, 구름 진입때문에회색으로급격히가려지는템포/실제volume 부재, 연속경로alias/움직임.
- 승인 서고와 body/heart/waveform 데이터 흐름은 보존. 새 후보의출품·최종채택아님. 사용자전체제작피드백1/2 유지.
- 브라우저캡처는fixed-pose구도선택/저장검증. 실제스크롤/정역영상/targetPC600초/장시간성능완료로대체하지않는다. 수치정보는manifest/WORKLOG 최종검증체크포인트를읽는다.

## 7. 다음 작업 순서

1. 현재9구도 사이 전이 연속 캡처로land/texture 경계·노출·shimmer 보완.
2. 승인VDB의국소density/광학cache 또는경로bake연속sequence를비교해웹지역장면에구름외곽·가림·receiver를적용. 지금cover한장만있는상태와분리한다.
3. 구름→고창→기존서고의가림템포/광학을연속검증하고실제스크롤왕복/목표PC성능을점검.
4. 완성된전이후보에서사용자제작피드백2. 실패면D080의구름없는전이/AI영상두대안을비교한다. 이후A-P3·Story·B/C의각후속계획으로넘어간다.

최종 체크포인트: 실제IAB9구도 모두ready/region오류0/로딩0,cloud-pass복구후p.319실제가림확인·재저장. native3/hash와원본VDB핀,64module build,records200/CASE/diff/Python syntax PASS. 기존서고p.55 baseline도캡처했으나브라우저별viewport가달라동일pixel비교는 NOT VERIFIED(archive-comparison.json). 구조/빛source 유지와별도. 초기콘솔resize오류04:47:28후최종새error없음,초기missingbake경고보존. 움직임/targetPC/600초 미검증.
