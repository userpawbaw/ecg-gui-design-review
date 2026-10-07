# A 구름·기존 지형 동일 공간 렌더 검토

2026-10-07 · F066 / D099 / CASE007 · 연구/계획, 새 실시간 구현 미완

## 사용자 피드백과 판단

“구름이 갑자기 툭 튀어나오고 … 이전에 없던 지형 … 으로 바뀌어서 별로네.”
“이전 형태에서 같이 만들긴 어려워? 미리 렌더링한 것만 사용 가능한거야?”

D098의 전체화면 plate 교체 후보는 사용자 REJECT. VDB source 형상의 기존 만족은 유지하고 합성/등장/지형 연속성 실패를 기록한다. 구름 제작 피드백2/2의 현재 통합 후보 실패로 기록하며 D080 구름 없는/AI영상 대안 비교는 미실행·계획 보존. 최신 요청은 같은 기존 지형에서 구성 가능한지 검토하는 방향이다. 실시간 경로로 변경하는 구현을 완료했다고 주장하지 않는다.

## 현재 코드가 입증하는 것

arrival-north.ts는 .278부터 web camera를정착하고 cloud-path.ts 전체 RGB plate를 .278–.284에 교차한다. plate에는 별도 Cycles terrain receiver/AgX sky가 들어있다. 같은1.5DEM source·cameraFOV를 사용해도 mesh구성/LOD/normal/light/material/post 차이로 실제 web 표면과 같지 않다. 짧은 인계 구간과 단일 frame0→path가 갑작스러운 출현을 만들 수 있다. 이번 문제는 단순fade길이 튜닝으로 책임을다하지 못한다.

planet-cloud-photo.ts에 sampler3D 밀도·광학 깊이 cache·scene depth 제한·144step raymarch·ground shadow가 이미 있다. 이전 synthetic density품질실패는 이 렌더방식의 불가능성을 증명하지 않는다. 이 코드는 오래된 normalizedEarth 좌표계라 현재km NorthernArrival에 그대로붙일 수 없음.

## 추가 원자료 확인

- OpenVDB 공식 Python https://www.openvdb.org/documentation/doxygen/python.html : copyToArray/copyFromArray로 밀도grid↔NumPy dense array. 설치된로컬Python의binding/압축포맷지원은 미확인.
- Three 공식 3D texture volume 예제 https://threejs.org/examples/webgl_texture3d.html : WebGL volume rendering 경로 존재. 구름 다중산란품질보장 아님.
- 제작자 JS VDB 구현 https://github.com/mjurczyk/openvdb : VDBLoader/FogVolume, resolution/steps, directional/point lighting 관련 기능 제공. 실제JangaFX grid압축·version 및r186호환검증 필요; officialASF라이브러리와 구분. 채택/설치 미실행.

## 권장 다음 packet

1. **한 개 cloud06 원본 변환부터**. 원본hash·gridtransform·density범위·bbox 고정. 실제VDB→dense3D texture/brick 변환을 확인. spherical toy구름을 새로 만드는 방식 제외.
2. **같은 WebGL 지형에 하나만 배치**. 지구·macro·parent·regionalLOD·태양·camera를고정, km좌표로 cloudbox 부착. orbit부터 실제거리에따라 작은실루엣이보이고 접근하며 커지게. cloud도입 때문에 지형교체/갑자기spawn하지 않음.
3. **빛 계산 분리**. 형상은실제density/투과·두꺼운core·얇은edge는raymarch. 고정sun을사용하므로태양까지의 opticaldepth/그림자cache를 사전계산 가능. 이 cache는화면베이크가아님; viewer는현재 camera/scene depth에맞춰 구름을실시간으로그린다. Raymarch lighting은 Cycles6bounce와동등하지 않으므로 동일카메라 gold와 비교.
4. **거리·비용 관리**. 먼 구름은 낮은해상도/낮은step, 필요한국소만고밀도. farShell→regionalvolume을 같은coverage/좌표로연속인계. 빈공간 skipping/화면해상도/scene-depth clip, shadow와skyfill을따로 확인. 이전 z-fighting/alphaHash 재발 금지.
5. **짧은동일공간 시험**. 지형위치/shape 유지, orbit→접근→inside 정역 최소6+frame. 누적숫자·광학기여·실GPU메모리/frametime→사용자리뷰. 단독실시간 renderer의 품질검증 전 전체 passage를 다시 제작하지 않음.

## 대안과 범위

실시간품질/비용이 목표미달이면 transparent cloud layer+depth/shadow bake 합성을 검토할 수 있으나 camera별시차/정렬한계가 있다. whole RGB terrain plate교체 재채택은 권장하지 않음. D080 두대안과 별도로 latest같은공간 검토 결과를기록. 아직VDB실시간 변환/실행증거 없음, 확인된것은 source/API/기존shader구조다.
