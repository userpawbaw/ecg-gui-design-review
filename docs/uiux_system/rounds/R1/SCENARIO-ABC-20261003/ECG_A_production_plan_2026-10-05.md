2026-10-06 최신 구름 다층 조사(D-073/F-044): [구름 제작·빛·후처리 연구](ECG_A_cloud_layers_research_2026-10-06.md). 사용자 thick 양감/불투명/하부그림자 + thin 투과/솜털 목표 반영. 단위·bank 최소밀도/평준화 문제, 광역↔국소 shape/optics/LOD와 temporal/shadow 설계. Takram cloud의 space planned/composer비호환을 확인해 전체경로 자동채택 제외. 조사 완료/새자산·runtime 미변경. 다음 L0대표군집/단위→L1광학/그림자→L2orbit·후보비교→L3후처리→L4동일서고접합. A-P2TUNE/서고KEEP/후속독립 유지.

2026-10-06 최신 A-P2 실제 시험(D-072/F-043/O-009): [대기·남극 지형·밀도 구름 검토](ECG_A_planet_render_trial_2026-10-06.md). LUT/ECEF→blue horizon, REMA display mesh, world density/내부 lightmarch와 half-res 합성 적용. 기술 검증과 목업 충실도는 분리: **전체 TUNE, 근접 구름/얼음 미세 반사/역광 GAP**. 서고 유지(3장 RGB차0/2장 극미량1 RGB 차이)/KEEP. initial+3 품질 수정 종료; 다음 해당 GAP 사용자 검토→국소 cloud asset/bake 또는 renderer 새 후보 결정. A-P3/Story/BC는 보류. 아래 연구-only 상태는 과거 체크포인트다.

2026-10-06 최신 A-P2 재조사(F-042/D-071): [구름·얼음·수평선 구현 연구](ECG_A_planet_quality_research_2026-10-06.md). 사용자 입체감/얼음 빛 반응 부족·유리막 지적 반영. 고해상도 색상 교체만으로 해결하지 않고 density cloud/Antarctic geometry·재질/대기 scattering을 분리해 재제작한다. 다음 Q1 원인off 비교·별도 atmosphere 경로 시험→Q2 얼음→Q3 cloud→통합품질피드백. 이번 연구만 완료/새 구현 미실행; 서고 KEEP/A-P3·BC보류.

2026-10-06 A-P2 빛/후처리 실제 보완(D-070/F-041): [최종 검토](ECG_A_lighting_review_2026-10-06.md). 따뜻한 태양/가림 flare·PBR roughness·얼음 relief·구름 산란 구현, 기술 QA/build PASS, 시각 TUNE. 서고 KEEP 유지. 다음 해당 전이의 사용자 피드백(얼음/구름/specular·GPU 비용) 후 A-P3.

2026-10-06 최신 A-P2 피드백(F-040/D-070): flare/얼음 relief/구름 디테일 보완에 동의, 빛이 없는 듯한 시각 품질 TUNE. [보완 계획](ECG_A_arrival_feedback_2026-10-06.md)을 먼저 읽는다. 다음 A-P2 광원·재질→역광/후처리→구름/고창 접합 완성→사용자 피드백, 이후 A-P3. D-068 서고 빛·소품 KEEP 유지. 이번은 문서 갱신이며 새 렌더/QA는 수행하지 않았다.

# A 우선 제작 계획
2026-10-05 · D-065 · 사용자: “제작 순서는 A부터.”

## 2026-10-06 최신 — 구름 실제 후보 시험

[다층 구름 제작·검토](ECG_A_cloud_layers_review_2026-10-06.md)(D-074/F-045/O-010)를 먼저 읽는다. 기술PASS/시각FAIL/TUNE, GPU비용 회귀로 기본채택REJECT. 기본v1 유지·cloudModel=layers 실험 보존. initial+3 품질보완 종료. 다음 국소조형/기준렌더+bake·Beer shadow/적응sampling 새후보 사용자판단; 승인서고KEEP/A-P3·Story·BC독립 유지.

## 1. 확정 범위
2026-10-06 A-P2 제작 갱신: [실제 전이 검토](ECG_A_arrival_review_2026-10-06.md)(D-069/F-039). 지구/역광/구름/동일서고앞쪽고창→A-P1 연결완료, 기본프리뷰전체. 기술검증PASS/새전이품질TUNE, 다음A-P2시각피드백후A-P3. 기존서고KEEP유지.
2026-10-06 최신 피드백(D-068): 사용자가 AA 개선과 서고의 전체 빛 렌더·내부 소품 충실도에 만족하고 현행 유지 진행을 요청했다. **환경 룩/소품은 KEEP**으로 잠근다. 기존 서고/카트 재질 디테일 TUNE를 계속 선행 게이트로 삼지 않는다. 다음 제작 단위는 **A-P2 지구→궤도→구름→같은 서고 진입**이다. A-P1의 높은 중간 카메라/접촉·receiver의 내부 검증 한계는 보존하되, 새 진입 경로와 연결하는 시점에 국소 점검한다. 이번 피드백을 모든 카메라/전체Story/목표PC 최종 승인으로 확대하지 않는다.

A를 첫 실제 제작 후보로 확정한다. B/C의 순서는 미정이며, B/C 필수 TUNE와 비교는 A 제작 착수의 선행 게이트에서 제외한다. 전체 후보의 최종 채택·제품 통합과 구별한다.
A의 오르기 자세, 등→측면→심장 구도, 같은 서고의 Story 의자는 D-063을 따른다.

## 2. 제작과 피드백 단위
| 단계 | 제작할 결과 | 내부 검증 | 사용자 피드백 |
|---|---|---|---|
| A-P1 | 사다리 발견 포함 A4–A6: 고정 서고·오르기 몸·심장·전극·카트·혼합 ECG와 조명/후처리 | 손/발 접촉, 후면→측면 가시성, 광원→차광→산란→수광, bloom-off, 정지 스크롤에서 박동/R 동기화 | 환경과 주요/보조 자산의 재질·빛이 갖춰진 연속 장면으로 구도/품질/속도 평가 |
| A-P2 | 지구→궤도→구름→동일 서고 고창의 A0–A3 | 서고 구조와 고창 진입점 고정, 카메라 연속성, 해상도/효과 밀도 | 전이의 개연성과 wow 수준 |
| A-P3 | 혼합 입력→처리→출력 A7, 기둥 가림→같은 서고 의자 인계 | 처리 의미, 입력/출력 색·깊이·타이밍, 동일 방 앵커 | 단순 교차 투명도를 넘어서는 전환의 보는 맛 |
| A-P4 | Story PLI→BW→EMG: 각 원인·유입·입력·처리·출력 | 장비/전원 간섭, 호흡/BW, 손 쥠/EMG 인과; 장면 정지 중 재생 | 각 노이즈별 한 단위씩 구도·인과·스펙터클 피드백 |

첫 묶음부터 모든 것을 동시에 공개하지 않는다. clay와 부분 자산 캡처는 내부 검증 자료다. 제작 중 장면에 맞는 파형/전환 신규 아이디어를 함께 제안하며, 모든 작업 종료 뒤로 미루지 않는다.
A-P3의 표본막 깊이·빛 역할 인계는 제안 상태이며, A-P1 실제 화면을 보고 채택/수정한다.

## 3. 현재 실제 자산 감사
- archive/archive.glb, manifest.json, light_shell.webp: 존재. 기존 고정 서고를 재사용하는 출발점. 서고 코드의 lightmap/vertex-light 복호화와 sun-depth 산란을 함께 유지해야 하며 단순 GLB 로드만으로 같은 빛을 보장하지 않는다.
- body.glb: 존재. 기본 featureless 인체, 오르기 자세의 완성 자산이 아니다.
- body_seated_v3.glb: 존재. 사다리에 앉은 기존 자세. Story 의자에도 접촉 재검증 없이 그대로 채택하지 않는다.
- heart.glb: 존재. 기존 해부학 외형 모델을 검은 몸의 가슴 강조에 사용한다.
- rig_v3.glb: JSON 청크 실제 조사에서 skins 없음. LeadYoke·전극·Lead·TrunkCable 등의 accessory mesh이며 인체 armature가 아니다.
- 제작 스크립트 build-figure-v3.py는 실제로 source mesh에서 armature를 만들지만 seated export 시 제거한다. 새 climb pose는 해당 과정의 재사용/별도 export가 필요하다.
- 현재 bundled Python에서 bpy import 실패(ModuleNotFoundError). 이는 로컬 실행 환경의 부재이며 에셋 부재나 구현 불가능의 증거가 아니다. 다음 자산 작업은 Blender/bpy 실행 경로를 준비한 뒤 진행한다.

## 4. A-P1 세부 제작 순서
1. 기존 사다리 중심 x=.55m, 폭 .48m, 각14°, 단 간격 .29m와 서고 구조를 잠근다. Blender z-up과 Web y-up 변환을 한 경계에서 처리한다.
2. 기존 인체 source/registry를 확인하고 새 오르기 pose를 만든다. 손바닥 접촉·발바닥 단 접촉·몸/사다리 비관통 검증을 기록한다. 처음에는 static pose+작은 idle로 시작한다.
3. chest 변환에 heart·3전극·짧은 lead를 맞춘다. body는 불투명 검정, 얼굴 디테일·줄무늬 없음. 심장은 심실 외형을 읽히게 한다.
4. 고정 archive의 bake, 고창 차광체, 동적 인체의 shadow/depth, volume receiver를 함께 구성한다. 사다리와 인체가 volume을 실제 가리는지 내부 검사한다.
5. 후면→측면→가슴 카메라와 환경 dimming을 연결한다. 심장/파형이 강조되어도 최소한의 공간 앵커를 남긴다.
6. 단일 재생 clock에서 R 이벤트·박동·sweep를 구동한다. scroll p는 카메라/장면 변화만 제어한다. 2.5초 창·head 잔광·erase 국소 fade를 구현한다.
7. on/off와 전중후 캡처, 오류/프레임 시간 점검 후 사용자 품질 피드백을 요청한다. 이 단계 전에는 미완 배경의 품질 판정을 요청하지 않는다.

## 5. 후속 후보 보존
B: backside/틈 진입·세 면·접힘 표현, 특히 B02의 회전 구도 보완.
C: C04 작은 타일 규격, C08 사각 타일과 의자 자세 연속성 보완.
각 후보 기록은 별도로 유지하고 A의 구도/효과를 강제로 이식하지 않는다. B background-space 실험은 보류 상태 유지.

## 6. 이번 체크포인트
완료: A 우선 제작 결정, 자산 내부 감사, 제작/검증/피드백 단위 고정.
미완: 새 climb 모델, 실제 장면의 재질·빛·후처리, runtime와 목표 PC 품질 검증.
이번 작업은 실행 완료나 사용자 품질 판정을 의미하지 않는다.

### 제작 착수 후 갱신
[오르기 자산 체크포인트](ECG_A_asset_checkpoint_2026-10-05.md): body_climb/electrodes_climb 실제 GLB, breath/heart anchor/skin site 생성. Blender4.5.3 실행 경로 준비 및 내부12렌더 완료. 모델은 손가락 grip·전체 비관통·runtime 가시성 TUNE이며 A-P1 완료는 아니다. 다음은 접촉 보완/심장·배선 통합/고정 서고 조명·후처리.

[실제 scene 체크포인트](ECG_A_scene_review_2026-10-05.md): grip 방향/curl 및 단 표면 보정, 정점 침투0. 고정 서고와 anatomy heart/3전극/카트배선/volume/bloom/grade/저장 mixed 입력 연결. 내부17runtime 캡처/3R경계/정지·native-scroll/reduced 검증 PASS. **A-P1 전체 품질 TUNE**: 서고 재질/카트/중간 높은camera/receiver·aliasing 보완 뒤 품질 피드백. A-P2나 제품 경로 교체로 넘어가지 않는다.


### A-P2 현재 체크포인트 — 조형/bake
[최신 검토](ECG_A_cloud_sculpt_review_2026-10-06.md). G6 종료/부분기능PASS/목업품질FAIL·TUNE. 사용자승인새후보 제작 완료이나 품질채택/GPU·영상 검증은 미완. 다음 camera/receiver정합 고품질 조형기준과 하드웨어QA. A-P3·Story·BC보류.

### 추가 목업 계획 타당성 검토
[구체 명세/구현 GAP](ECG_A_orbit_cloud_reference_plan_2026-10-06.md): 연속8+상세4 추천,samecloud/태양/camera단위 정합. 이미지생성이나새후보를착수한것은아니다. 먼저기존목업의부족한중간/측면/아랫면을채우고goldscene으로기준을만든뒤실행원인분리. D075/G6종료와미검증GPU/영상은그대로남는다.

### 목업 첫5종 제작 체크포인트
[첫 묶음 검토](ECG_A_cloud_mockup_review_2026-10-06.md). 8생성/3보완/선택5종. 다음은목표조형·빛·구도피드백으로anchor확정후남은7장계획연결, goldscene. 실제asset이나renderer채택이아님.

### 2026-10-06 질감 수정 순서
D078/F049: 구도·양감 사용자KEEP. J5v5 질감후보 검토 먼저, 이후 다른4종/남은7목업/gold 순서. 상세 ECG_A_cloud_texture_review_2026-10-06.md. 실제renderer 변경은 이번 단계 범위 밖.

### 2026-10-06 첨부 실사진 기준 목업 질감 재수정 — D-079/F-050
실사진을 직접 texture reference 입력으로 사용, J5v6→v7(초기1+자체수정1) 보존. v7 넓은음영/부드러운면/얇은띠 개선, 잔여패턴TUNE/사용자확정대기. 순서: 목업확정→실제제작→사용자제작피드백1차→수정→사용자제작피드백2차. 현재제작0/피드백0, 이번목업/AI자체수정과별도계수. 갤러리사진/v5/v7비교, 정확요청manifest보존. renderer/서고/Story/BC미변경.

### 2026-10-06 실제 구름 제작 및 실패 대안 — D-080
사용자 제작 승인. J5v7/첨부사진 기준 cloudModel=photo 후보제작, 새128³density/fixed-sun cache/광역인계/광학 검증. 사용자피드백0/2(내부수정별도). 제작→피드백1차→수정→2차. 2차후실패면①구름제거전이②AI생성구름영상전이를모두제작하고동일조건퀄리티비교후높은퀄리티로변경. 실패판정은현재미발생;대안조건부,AI영상생성도구/결과미확보. 서고KEEP/A-P3/Story/BC별도.
