# A-P2 구름 에셋과 빛 처리 재조사

2026-10-06 · RESEARCH · D-082 · CASE-007

## 요청과 결론

사용자: “구름 에셋이 있는지부터 확인해봐. 퀄리티가 너무 낮네… 목업 수준의 빛 처리가 가능한 방식이 따로 있는지도 확인”.

외부 볼륨 에셋은 있다. 현재 자체 생성 밀도의 반복 튜닝보다 **외부 VDB를 오프라인 볼륨 렌더러로 조명해 기준 결과를 만들고, 같은 에셋의 웹 표현을 비교하는 방식**을 추천한다. 구매·다운로드·새 렌더링은 이번 연구에서 실행하지 않았다. 동일 목업 품질이나 웹 실시간 비용은 아직 입증되지 않았다.

## 1. 로컬 에셋 감사 [코드]

| 현재 자료 | 실체 | 판정 |
|---|---|---|
| prototype/v2/src/story/intro/assets/earth_clouds.jpg | 지구 구름의 2D 텍스처 | 원거리 분포 입력; 근접 입체 에셋 아님 |
| a-climb/assets/cloud-layers | 생성 스크립트의 밀도·형태/침식 노이즈 | 프로젝트 자체 procedural 시험, 외부 고품질 VDB 아님 |
| a-climb/assets/cloud-sculpt/cloud-sculpt.blend | 공유 밀도 atlas를 읽는 Blender volume bound | 실제 VDB 수입/모델링된 구름 표면이라는 뜻 아님 |
| a-climb/assets/cloud-photo | 사진을 참고한 128³ synthetic density, 고정 태양 광학 깊이와 지표 그림자 | 사진의 3D 복원 아님; 외부 제작 에셋 아님 |

a-climb/assets 재귀 검사에서 .vdb 0개; repo rg 파일 목록에서도 .vdb/.nvdb/cloud GLB 매치 없음. 이 범위는 현재 프로젝트 자료이며 사용자 PC 전체에 VDB가 없다는 뜻은 아니다.

photo 밀도는 타원 덩어리와 다중 스케일 value noise로 생성된다(prepare-cloud-photo.py). 8×4×8km 범위/128³이면 축별 voxel 간격은 대략 63/31/63m이다. 화면 샘플을 늘려도 원본에 없는 작은 조형은 생기지 않는다. 다만 낮은 해상도 하나를 모든 질감 문제의 확정 원인으로 삼지는 않는다.

## 2. 실제 확보 가능한 후보 [문헌]

| 후보 | 공식 자료에서 확인한 내용 | 우리 용도 / 제한 |
|---|---|---|
| [JangaFX Cloud Pack](https://jangafx.com/software/embergen/download/free-vdb-animations) | VDB 10 variations, 104MB, EmberGen preset 포함, 무료 CC0 | 가장 먼저 비교할 작은 무료 후보군. 근접에서 보이는 구름 2–3개 선별; 전지구 weather coverage를 대체하는 자료는 아님 |
| [Disney Cloud Data Set](https://disneyanimation.com/resources/clouds/) | 상세 volumetric cloud density, 공식 README에 3GB zip, full/half/quarter/eighth/sixteenth VDB 및 Hyperion EXR/PNG와 Mitsuba scene/render | 조형과 빛의 기준 비교에 특히 유용. 전체 globe cloud map이나 완성된 궤도 장면은 아님; 별도 license 문서 제공 |
| [Bproduction CloudScapes V2](https://superhivemarket.com/products/cloudscapes/docs) | 제작자 판매 문서, PRO/LITE 구성 구분, Cycles/Eevee 지원, 상용 에셋 | 구름 종류별 선택이 필요할 때 후보. 이번 조사에서 결제/다운로드하지 않음. 외부 요약의 개수·가격을 품질 증거로 사용하지 않음 |

위는 배포 페이지와 README/제작자 문서 확인이다. 아직 파일 내용, 카메라별 외관, 실제 load/render 성공, 웹 성능을 확인한 결과가 아니다. 무료 후보부터 실제 렌더 비교한 다음 상용 필요성을 판단한다.

## 3. 현재 빛 처리의 한계 [코드 → 추론]

planet-cloud-photo.ts는 144 view samples와 고정 태양 optical-depth lookup을 사용한다. direct=exp(-tau), multiple=exp(-tau*.23)*.20+exp(-tau*.055)*.06, 높이별 sky/bounce 색, 두 phase lobe를 합친 근사식이다. **다중 산란을 전혀 쓰지 않는 것은 아니지만**, 실제 여러 경로를 추적하는 volume path tracing과 같지 않다. 태양 방향 변경 시 cache 재생성이 필요하다고 NOTICE가 명시한다.

따라서 에셋만 바꾸고 동일 근사식을 사용하면 깊은 암부·밝은 내부·역광 변화가 목표와 다를 수 있다. 반대로 기존 큰 덩어리에 bloom만 늘려도 구름다운 층/틈/그늘은 생성되지 않는다. 밀도 조형과 빛 전달을 각각 비교해야 한다.

## 4. 목업의 빛에 접근하는 세 경로

### L1. VDB + 오프라인 볼륨 렌더: 품질 기준 제작 (추천 첫 시험)

[Autodesk Arnold의 Disney cloud 공식 튜토리얼](https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/tutorials/am-Volume_Tutorials/arnold_for_maya_volume_am_Rendering_a_Cloud_html.html)은 physical sky/skydome, volume depth, anisotropy, 간접 볼륨 샘플을 다룬다. 구름 내부의 반복 산란이 밝기와 외관에 중요함을 설명한다. 그 예제의 높은 scatter 값은 문서 자체가 hack이라고 명시하므로 우리 기본값으로 복사하지 않는다. Arnold의 depth 수치를 Cycles 설정에 그대로 대입하지 않는다.

[Disney Deep Scattering 연구](https://la.disneyresearch.com/publication/deep-scattering/)는 silver lining과 내부의 흰빛이 어려운 빛 전달 문제임을 설명한다. 연구 네트워크의 배포·이식을 이번 구현안으로 약속하는 것은 아니다.

우리 시험 설계 [추론]: 실제 VDB를 Blender/Cycles 또는 동등한 volume renderer에 수입, 정해진 sun 방향/sky 환경/구름 스케일/receiver/camera로 기준 프레임을 만든다. Cycles의 세부 버전별 공식 문서는 이번 web 접근 실패로 수치 설정을 확정하지 않았다. 낮은 비스듬한 햇빛이 밝은 윗면과 음영 홈을 만들게 하고, 하강 옆면에 역광이 읽히도록 카메라와 태양의 관계를 먼저 고정한다.

### L2. 같은 VDB를 웹 볼륨용 데이터로 변환

밀도 brick/3D texture, 필요하면 고정 조명 irradiance/optical-depth cache로 변환하고 raymarch한다. VDB 다운로드가 현재 custom shader에 즉시 plug-and-play 되는 것은 아니다. 볼륨 좌표·단위·필터·cache encoding·그림자·대기 합성부터 변환이 필요하다. 고해상도 데이터를 무조건 단일 큰 3D texture로 올리는 것은 비용이 크므로, 보이는 부분/거리별 해상도와 빈 영역 건너뛰기를 검토한다.

[Nubis Evolved 제작자 설명](https://www.guerrilla-games.com/read/nubis-evolved)은 근접과 통과 구름을 별도 모델링/렌더링 문제로 다룬다. 게임의 성능을 우리 Three.js shader/PC 성능 보증으로 사용하지 않는다. 웹 시험은 오프라인 기준과 같은 카메라·태양에서 먼저 비교한다.

### L3. 오프라인 결과를 카메라 경로용 이미지/레이어/영상으로 사용

빛 품질을 유지하기 쉽지만 새 시점의 정확한 시차·가림은 제한된다. 단일 이미지에 임의 회전이나 구름 내부 통과를 허용하지 않는다. 짧은 구간의 depth layer 또는 충분히 촘촘한 카메라 프레임으로 제한하고 스크롤 역방향/seek/loading을 검토한다. 일반 3D 사전 렌더 영상과 사용자가 조건부 요청한 **AI 생성 영상 fallback은 다른 방식**이다.

## 5. 제작 순서와 판단 기준 [제안]

1. JangaFX 무료 팩 확보/압축해제/파일 metadata·hash·사용조건 기록. 굵은 적운/구름 군집 후보 2–3개 선별. 얇은 고층 구름은 별도 표현.
2. **원거리 텍스처, 낮은 궤도 윗면, 하강 옆면** 세 카메라 고정. 화면 내 구름 크기와 햇빛 방향 동일하게 비교.
3. 동일 VDB에서 direct/sky/다중 산란 기여를 분리한 오프라인 기준 렌더. bloom off에서도 큰 양감·암부·밀도 차이가 보여야 한다. 역광은 volume 내부 전달로 먼저 확인하고 후처리는 작은 마무리로 제한.
4. 오프라인 결과가 목표에 못 미치면 asset/조명부터 바꾸고 웹 이식을 시작하지 않는다. Disney 공식 rendered EXR/scene은 서로 다른 renderer 결과 차이의 비교 기준으로 활용.
5. 통과 구간의 필요 영역만 웹 변환. 원거리 구름과 footprint/통로/그림자/태양을 맞춰 거리별 표현 연결. 후처리는 linear HDR 합성→노출/톤매핑 정리→bloom/AA 순서를 실제 composer에서 확인.
6. 외관: 반복 구형 돌기·격자·유리막 여부, 밝은 내부와 깊은 홈, 얇은 층의 투과, shadow/rim, 구간 교체의 밝기·윤곽 점프. 동작: 실제 wheel 정역방향과 정지. 비용: 동일 GPU/해상도/frame 시간. 렌더 성공과 시각 품질을 별개 판정.

이번은 연구다. 새 사용자 제작 피드백을 추가로 계수하지 않는다(1/2 유지). 이전 실패 후보, 서고 KEEP, ECG clock, A-P3/Story/B/C 구분 유지. 다음 구현은 외부 에셋 조명 기준을 먼저 만들고, 사용자 2차 피드백을 받을 새 후보까지 연결한다. 두 번째 제작 피드백 후 실패할 때만 기존 구름 제거/AI 영상 두 fallback 비교 조건을 적용한다.
