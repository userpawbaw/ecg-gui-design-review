# A 지구 자산·반구 경로 실제 렌더 비교
2026-10-07 · D088/F056 · 내부 시안용 · 원본 목업/웹 구현과 구별

## 실제로 만든 것
Moto 공개 day/night/packed bump 세 장을 실제 다운로드했다. 4096×2048, 각각 byte/hash/URL은 verification/a-earth-routes-20261007/acquisition.json. 라이선스 출처는 미확인으로 그대로 기록하고 D084 내부 시안 정책으로 test-only 등록했다. 자동 fetch 허용 목록을 변경하거나 CC0라고 재분류하지 않았다.

북유럽 노르웨이 내륙(64.1°N,12.4°E), 안데스 내륙(38°S,71°W) 각각 원형 지구/접근/높은 궤도/낮은 궤도/구름 입구 5장. 원형 지구는 기존 day/night 조합도 같은 카메라·재질·광원에서 2장 추가. 총 12장 PNG 1280×720. Cycles4.5.3/OptiX,48samples,denoise,AgX exposure0,bloom off. 실행 renderer와 이미지 hash/dimensions 실제 검증. 입력 source와 출력 manifest를 고정했다.

원작 shader 자체 재현은 아니다. Blender PBR/bump와 normal·sun dot의 smoothstep 야간혼합으로 번역했으며, Moto blue채널의 base whitecloud blend 및 원작 Fresnel 색층 전체는 미적용. 기존 map도 이 번역 재질을 공유하여 **텍스처 비교**에 한정한다. 현재 A runtime vs 수정 runtime 비교라고 부르지 않는다. 밤 출력 .95와 원작/현재값의 밝기 배수 비교도 하지 않는다. 별/타이틀/flare는 이번 자산·경로 시험에 포함하지 않았다.

## 직접 본 결과
| 부분 | 결과 | 판정 |
|---|---|---|
| 원형 북반구 | 그린란드 흰 면, 유럽 도시 불빛과 육지 분포가 한 프레임에 읽힌다 | 외관 우선후보 TUNE |
| 원형 남반구 | 남미와 밤 불빛은 보이지만 이번 동일 상대각에서 남극 강조가 작고 바다 비중이 높다 | 대안 보존 TUNE. 다른 지구 회전/남아프리카·호주까지 일반화하지 않음 |
| 확대 지표 | 두 후보 모두 점상 city map와 색 텍셀이 확대되어 뭉개진다. bump만으로 지형을 복원하지 못함 | 근접 완성도 REJECT / 지역 imagery·DEM 필요 |
| 최종 경로 | 궤도부터는 카메라 위치를 목적지 주위의 구면으로 이동하고 target은 목적지에 고정. center ray 좌표를 manifest에 검증 | 정합 계산 PASS, 프레임 사이 연속 애니메이션 미검증 |
| 구름 입구 | 승인 VDB01/06을 실제 지역 스케일로 배치. 외부광 fill/밀도·크기·화면 점유율이 아직 불충분, 작은 어두운 군집처럼 보임 | 신규 광학/배치 TUNE. 기존 승인 모양을 다시 실패로 취급하지 않음 |
| 대기 | 반사 유리 BSDF 없는 transparent/emission rim 진단. 낮 궤도 blue edge는 보임 | 실제 대기 scattering/목업 충실도 미검증 |

근접 뭉개짐은 **새 지구 에셋을 그대로 확대하면 남는 문제**임을 실제 이미지로 확인했다. 북반구 채택만으로 해결되는 문제가 아니다. 북반구 우선 추천은 초기 프레임의 극지·도시·육지 조합에 관한 판단이다.

## 내부 수정과 보존
첫 topdown-v1은 수직에 가까운 카메라여서 지평선이 안 보였다. horizon-v2는 target을 서쪽으로 옮겨 지평선을 얻었지만 노르웨이 대신 북대서양으로 이탈했다. 최종은 camera를 이동하고 land target을 고정했다. 두 이전안 contact/manifest는 별도 verification 폴더, 원본 PNG는 assets/source/earth-route-rejected-*에 보존. 이번은 대표 프레임 기술 시험으로, 사용자 제작 피드백1/2를 소진하지 않는다.

카메라 roll이 지역 간 서로 다르게 보이고, 가까운 view에 도시불빛이 과도하게 점으로 남는 것도 실제 캡처에서 확인했다. 최종 제작은 지역 수직축을 camera-up 기준으로 삼고, 전체 지구의 야간 연출에서 낮 궤도 지형광으로 연속 전환해야 한다. 이번 시험의 고정 태양 상대각과 일괄 sky fill 전환을 그대로 스크롤 애니메이션에 적용하면 안 된다.

## 다음 제작 단위
1. 북유럽을 **우선 제작 시험**으로 사용하고 남미 비교자료는 보존. 반구 최종 승인과 구별한다.
2. 노르웨이 목표 주변 latitude61–67/longitude6–20을 임시 조사 범위로 하되 실제 camera footprint와 지형/해안 구도로 crop 확정. NASA full-resolution 지역색상 또는 Sentinel-2, ArcticDEM 해당 tile 가용성/연도/고도기준 확인 후 원본 imagery·DEM을 확보. 파일이 없는 상태에서 해상도/지형을 구현완료로 기록하지 않는다.
3. globe→regional patch 거리 인계. UV/지리 기준/높이/normal 정합, camera-up roll, 밤면→새벽/낮 광원 변화, 확대 중 city emissive 소거를 함께 제작.
4. 승인 VDB군집을 지표 km스케일/광학두께에 맞춰 재배치. 가까운 cloud 통로와 먼 coverage를 분리. shadow/sky fill/산란을 지역 지형·같은 서고 진입까지 연결.
5. 완성된 전체 인계 후보로 사용자 제작 피드백2. 두번째 실패 시 구름 없는 도입부와 AI 영상 도입부를 각각 제작·비교한다.

## 검증 범위
PASS: 실제 자산 확보·hash/size, 12PNG 렌더·hash/dimensions, explicit longitude/latitude UV, camera center-ray 계산, 갤러리·이전안 보존.
CONDITIONAL: 북반구 원형 외관 우선후보. TUNE/REJECT: 근접 지표·cloud optical/구도, 전체 목업 품질.
NOT VERIFIED: 지역 DEM/고해상도 imagery, 원작 pixel 일치, 웹 성능/스크롤/역스크롤/LOD, 전체 서고 접합. 웹 기본 구현과 승인 서고는 수정하지 않았다.
