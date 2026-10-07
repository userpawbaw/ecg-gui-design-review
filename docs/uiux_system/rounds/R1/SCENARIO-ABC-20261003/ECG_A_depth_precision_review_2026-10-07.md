# A 지구·구름 깊이 간섭 조사와 보정 — 2026-10-07

D-095 / F-063 / CASE-007. 사용자 원형 지구부터 스크롤 자글거림 추가 지적 반영. 상태 TUNE.

## 이름과 구분
- Z-fighting(깊이 충돌): 비슷한 깊이의 두 표면이 점·줄·삼각형으로 번갈아 보임. 카메라 이동에 따라 패턴 변화.
- Temporal aliasing / shimmering: 픽셀보다 작은 질감·반사가 이동하며 반짝임. mipmap/재질 전처리/TAA로 줄일 수 있음.
- 현재 강한 점·줄 패턴은 near/far 과도한 범위로 인한 Z-fighting을 우선 원인으로 판단. 남은 미세 shimmer 전체가 같은 원인이라고 단정하지 않음.

## 실제 코드 원인
원형 카메라 y19000km인데 near=max(.05,y*.00002)=.38km, far65000km. 일반 perspective depth를 쓰며 logarithmicDepthBuffer 없음. 구름 shell은 반경6381km, 지표6371km. 24bit depth의 대략적인 거리 분해능 z²/(near*2^24)은 z19000km에서 약57km 수준(거리·depth format에 따른 설명용 근사). 따라서 10km 층간 거리도 안전하지 않음.

## 적용
- near=max(.05,y*.08): 원형1520km, 수평선296km. 가까운 지형 단계에도 비례 감소, 서고는 기존 .025–40 범위를 따로 사용.
- 임시 globe UV discard 및 parent/cloud depthTest 우회는 검토 후 철회. 일반 깊이 검사 유지. parent1/region group2/cloud3 순서 명시, cloud depthWrite=false.
- EOX z8 228tile 실제 조달, macro2526×4096/2319845bytes, p.045–.10 지도 선행 보간. 전 지구 고해상도 변경 아님.
- 기존 packed cloud mask를10km 별도 얇은층으로 적용, p.175–.235 fade. 부피 VDB가 아니며 동일 cloud가 surface에 일부 남은 중복·사각 지도/조명 경계는 TUNE.
- 검토 select 방향키가 전역 scroll unlock을 호출하는 충돌 수정.

## 공식 근거와 대안
- [Three Cameras](https://threejs.org/manual/pages/cameras.html): near/far 정밀도와 Z-fighting, logarithmicDepthBuffer 대안.
- [Three WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html): logarithmic depth와 성능 tradeoff. 현재 renderer 전체 logdepth 변경은 deferred; custom shader/chunk와 후처리 호환 검증이 필요.
- [Three Texture](https://threejs.org/docs/pages/Texture.html), [Textures](https://threejs.org/manual/pages/textures.html): mipmaps/minFilter/anisotropy. 이미 기본 trilinear mipmap+anisotropy 사용. 이것만으로 깊이 충돌 해결 불가.
- [NVIDIA Adaptive TAA](https://research.nvidia.com/sites/default/files/pubs/2018-08_Adaptive-Temporal-Antialiasing/adaptive-temporal-antialiasing-preprint.pdf): material/shader/geometry aliasing에 filtering/LOD/TAA. TAA는 잔여 shimmer에 후속 비교, ghosting/움직임 검증 필요.
- [EOX Maps](https://maps.eox.at/): Sentinel composite tile service, 개별 URL/hash는 asset metadata.

## 검증 범위
실제 IAB 고정 시점/프레임 PNG·state를 사용. 최초 depth 우회 전·후 일부 시험은 overwrite되었으며 최종 캡처와 구분. near 조정 후 광역 줄/점 패턴 감소 확인. 최종 증거는 verification/a-cloud-sculpt-20261006/native-captures/north-surface. build 및 records 검사 결과는 WORKLOG에 기록.
연속 동영상/모든 스크롤 지점의 shimmer 소멸/GPU·target PC·600초 미검증. 근접 LOD는 고정 시점 진입 직후 아직 morph 중일 수 있어 최종 detailReveal 확인이 필요. 전체 구름 제작2차 피드백으로 자동 계산하지 않음(1/2 유지).

## 다음
사용자 원형→수평선→광역 시작 움직임 확인. residual shimmer면 cloud only/specular only/bloom only 분리하고 threshold fwidth/filtered mask·specular prefilter·TAA 비교. 지도 사각 조명 경계/구름량은 별도 TUNE. 승인 근접1.5×/서고 보존, live VDB/Story/BC 분리.
