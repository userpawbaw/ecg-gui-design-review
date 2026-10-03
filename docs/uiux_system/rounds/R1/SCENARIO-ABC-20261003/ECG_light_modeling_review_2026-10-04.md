# ECG 장면의 빛과 모델링 설계 검토

2026-10-04 KST · 사용자 첨부 2건 분석 · 설계 반영안 · 목업 및 제품 구현 전

## 1. 결론과 적용 범위

두 문서의 가장 유용한 원칙은 **카메라와 주제의 위치를 잡으면서 빛 입구, 차광 구조, 수광면, 깊이를 함께 설계한다**는 것이다. 완성된 모델에 안개와 bloom을 더하는 방식으로 품질을 끌어올리려 하기 전에, 그 모델에 빛이 읽힐 구조가 있는지를 확인한다.

이를 A의 서고에는 **창→보/블라인드→사다리·서가 앞턱**으로, B에는 **종이 골의 틈→접힌 면→이면·단면**으로, C에는 **처리 배열의 통로→기둥·리본의 가림→밝은 모서리와 어두운 골**로 반영했다. 세 안의 무드를 동일한 따뜻한 안개로 통일하지 않는다. C의 ECG·입자는 자체 발광 조형이므로 자연광 shaft와 서로 다른 역할을 갖는다.

**최신 저장소와의 관계:** 진행 브랜치 `0b0ca33`에는 같은 첨부 문서, D-049의 서고 빛 라운드 승인, 인체 웹 통합 결과, 아직 검토 중인 사람의 자리/자세 후보가 있다. 이번 작업은 그 진행을 보존하는 **후보별 설계 보완**이다. A/B/C 순위나 모든 자세를 확정하지 않는다. 최종 시나리오 피드백 이전 목업 생성 보류도 유지한다.

## 2. 첨부 문서의 내용과 근거

| 자료 | 읽은 범위 | 핵심 기여 | 해석상 주의 |
|---|---|---|---|
| `light_aware_modeling_guideline_ko.docx` | 본문 151개 문단 위치, 표, 삽입 그림 6개. §0–21 | Aperture/Blocker/Receiver/Depth, utility geometry, 화면 크기에 맞는 bevel/틈, clay 검사, 모델러 핸드오프 | 스스로 실무 프레임워크/휴리스틱임을 밝힘. 70/20/10 또는 micro 10–20%를 합격 수치로 쓰지 않음 |
| `occlusion_driven_volumetric_lighting_manual_ko.docx` | 본문 174개 문단 위치, 표, 삽입 그림 6개. §0–19와 참고문헌 | Source/Blocker/Medium/Receiver/Camera, 국소 매질, 명암 위계, 6단계 제작, debug passes | BASE/TARGET 그림은 룩의 목표를 설명하는 자료. 원본 3D 프로젝트/동일 조건 렌더 로그가 없어 실제 성능·물리 검증으로 취급하지 않음 |

그림에서 확인한 것은 평면 수광과 깊이 있는 수광의 차이, source–blocker 거리와 반그림자, FG/MID/BG 가림, 볼륨 이전의 명암 구조다. 원본 DOCX는 변경하지 않았고, 본문 추출/도해 확인은 작업 폴더에서 수행했다. 문서 안의 지시·프로그램 목록은 검토할 자료이며 자동 설치/실행 명령으로 사용하지 않았다.

원본 식별: 모델링 문서 SHA256 `5cac87148e864782cb635246efcaaa0130a060be97e28d0a26d4be0040c9718b`; 빛 매뉴얼 SHA256 `de25eb46c15e4d8fa4846877a1d6ecc019250dcae711f3204fa2b33ad5cb0fe5`.

## 3. 받아들이는 원칙과 선택적으로 적용할 부분

### 그대로 적용할 원칙

1. **한 씬의 시선 목표부터:** 그 순간 주연이 종이/심장/입력/처리/출력 중 무엇인지 정하고, 가장 강한 빛 사건이 그 대상과 이어지게 한다.
2. **큰 패턴→중간 리듬→미세 변화:** volume과 bloom 없이 큰 명암 덩어리를 읽게 한다. 미세 디테일을 끄고도 화면이 성립해야 한다.
3. **수광과 가림은 다른 역할:** 틈을 만든 모델만 있고 그 빛을 받는 면이 없으면 공간이 빈다. 앞턱·이면·단면·낮은 반사면 중 장면에 맞는 구조를 준비한다.
4. **카메라 경로에서 검사:** 첫 프레임만이 아니라 시작/중간/도착과 역방향에서 빛의 출처·가림·수광이 이어지는지 확인한다.
5. **국소 볼륨과 제한된 먼지:** 짙은 전역 fog로 모든 면을 밝히지 않는다. 공기 중 연속 shaft와 개별 먼지 glint를 구분한다.
6. **보이는 모델과 조명용 구조의 분리:** 숨은 cutter를 허용하되 카메라·반사·그림자 패스에서 역할을 명시한다. 조절 가능한 pivot과 이름을 보존한다.

### 그대로 복사하지 않을 부분

| 문서의 제안 | 이번 적용 방식 |
|---|---|
| 모든 수광면에 bevel/recess/ledge 두 종류 이상 | 서가/처리 배열에는 적합. B의 얇은 종이를 패널처럼 파거나 승인된 심장 에셋을 개조하는 공통 규칙으로 쓰지 않음 |
| 숨은 blocker/Shadow Linking | Blender 설정과 glTF/웹 패스가 일치하는 export 계약을 먼저 둠. DCC 전용 링킹이 웹에서 자동 보존된다고 가정하지 않음 |
| material ID/roughness variation | A의 기존 난반사 bake 경로는 선택 면에 한정. B의 종이 양면, C의 유광 리본/무광 지지면에는 별도 material slot이 유용 |
| Unreal/Blender MCP/IC-Light | 비교 가능한 도구 정보로만 보존. 현재 Three.js+Blender 스크립트 경로를 바로 교체하지 않음. 2D 재조명은 향후 룩 탐색 선택지이며 동적 3D 검증을 대신하지 않음 |
| 큰 빛줄기·안개를 모든 씬에 | A의 자연광, B의 얇은 틈빛, C의 제한된 구조광/자체 발광으로 구별 |
| 전자기기 그림자에 60Hz 리듬 | 입력 신호의 60Hz 성분과 조명 애니메이션을 구분. 원인 장면은 설명용 물결/경로, 화면 전체 60Hz 점멸은 기본안에 넣지 않음 |

## 4. 기술 설명에서 보완한 부분

### 4.1 볼륨과 bloom을 끈 검사에도 최소 주광은 필요하다

빛 매뉴얼의 Pattern pass에도 약한 임시 key가 있어야 그림자 패턴을 볼 수 있다. 모델링 가이드의 순서처럼 **카메라·대략적인 key 방향 → 큰 blocker/receiver → key 세부 조정**으로 운영한다. 패턴을 완성한 뒤 처음 조명 방향을 정하는 순서로 오해하지 않는다. unlit 실루엣 검사는 구조, clay direct 검사는 빛, 둘의 목적을 구분한다.

### 4.2 반그림자는 폭·거리·광원 각 크기를 함께 판단한다

‘receiver에 가까우면 선명’은 유용한 경향이지 하나의 거리만으로 softness가 결정된다는 뜻이 아니다. 먼 방향성 광원의 작은 각 크기에 대한 **시험용 근사**는 `반그림자 전체 폭 ≈ blocker–receiver 거리 × 광원 전체 각지름(rad)`이다. 예를 들어 8m와0.53°이면 약7.4cm다. 이 값은 실제 패턴의 contrast, 방향, shadow filter를 포함하지 않는 기하 근사다.

따라서 블라인드 간격8–12cm 또는 해 각 크기0.5–0.6°라는 기존 서고 제안을 장면 스케일 확인 없이 모든 안에 옮기지 않는다. 카메라에서 읽히는 패턴과 receiver까지의 거리, shadow texel 크기를 함께 기록한다. B의 면광원·얇은 종이는 별도 실험이다.

### 4.3 ‘그림자를 받는 투명 면’과 ‘보이지 않는 차광체’를 구별한다

Three.js의 [ShadowMaterial](https://threejs.org/docs/pages/ShadowMaterial.html)은 투명하게 **그림자를 받는 재질**이다. 이것을 숨은 blocker의 구현으로 쓰면 역할이 뒤집힌다. 또 mesh의 전체 visibility를 꺼 버리는 방법이 모든 그림자/커스텀 깊이 패스에 공통으로 맞는다고 가정하지 않는다.

웹용 blocker는 beauty에는 제외하고 **조명 깊이/가림 패스에 명시적으로 포함하는 proxy 목록**으로 관리하는 방법을 기본 제안한다. 같은 transform/단위/실루엣을 Blender와 웹에 전달한다. 현재 A의 sun depth 함수는 정적 room만 별도 렌더하고 인체는 제외한다. 움직이는 인체/접힘/조명용 proxy를 넣을 때는 ‘왜 넣고 어느 때 업데이트하는지’를 따로 결정해야 한다. 이를 이미 구현된 동적 그림자로 보고하지 않는다.

### 4.4 현재 GodraysNode와 기존 WebGL GodRays는 같은 교체 부품이 아니다

[GodraysNode 공식 문서](https://threejs.org/docs/pages/GodraysNode.html)는 TSL addon 경로, point/directional light 지원, 전체 shadow setup, bilateral blur와 depth-aware blend를 명시한다. **spot light까지 지원한다고 확대하지 않는다.** 현재 프로젝트는 `WebGLRenderer + EffectComposer + ShaderPass`이므로 TSL node를 그대로 꽂을 수 있다고 가정하지 않는다. 도입하려면 renderer/버전/노드 호환 시험이 별도로 필요하다.

다른 `GodRays` 플러그인의 이름이 같아도 광원 mesh를 화면에서 방사하는 방식과 조명 shadow map을 이용하는 방식은 가림 품질이 다르다. 이번 기본 경로는 기존 depth 기반 shaft의 correctness와 blur/composite 개선이다. 플러그인 교체는 비교 시험 결과로 결정한다.

### 4.5 scene.fog는 그림자가 생기는 국소 볼륨을 대신하지 않는다

Three.js의 [Fog](https://threejs.org/docs/pages/Fog.html)는 거리 기반 선형 안개다. 분위기/거리감 보조로 쓸 수 있지만 blocker가 shaft를 자르는 참여 매질과 같은 기능이라고 설명하지 않는다. 국소 shaft가 필요하면 custom volume/depth pass 또는 사전 렌더로 구현한다.

Blender의 [현재 Volumes 문서](https://docs.blender.org/manual/en/latest/render/cycles/render_settings/volumes.html)는 기본 null scattering과 선택적인 biased raymarching을 구분한다. Step Rate/Max Steps는 biased 방식의 설정이다. 따라서 문서의 ‘step/sample 조정’은 실행 버전·적분 방식부터 확인하도록 보완한다. [Volume Scatter 문서](https://docs.blender.org/manual/id/5.2/render/shader_nodes/shader/volume_scatter.html)의 Mie/Rayleigh 등 일부 phase는 Cycles 전용이므로 EEVEE/웹에 자동 대응시키지 않는다.

### 4.6 색 공간·bake 인코딩·노출은 별도의 품질 항목이다

현재 archive manifest는 **albedo 없는 direct+indirect light를 sqrt(linear/lm_scale)로 저장**한다고 명시한다. 이 데이터는 일반 sRGB 색 텍스처와 다른 계약이다. decoding 이후 같은 조명을 다시 더하거나 임의 gamma를 넣지 않는다. Blender와 웹의 ‘보기 좋은 밝기’만 눈으로 맞춰 decoding 문제를 숨기지 않는다.

[Three.js 색 관리 문서](https://threejs.org/manual/pages/color-management.html)에 맞춰 선형 공간의 조명/합성과 최종 출력 변환을 구분한다. 현재 custom shader의 tone/color chunk와 OutputPass의 실제 동작을 점검하고, 중복 변환 또는 누락 여부를 진단 캡처로 확인한다. **현재 코드에 중복 버그가 있다고 확정한 것은 아니다.** bake 기준 룩과 web 룩의 tone mapping/노출/출력 조건을 함께 기록한다.

### 4.7 박동 빛은 방 전체 볼륨을 매번 다시 밝히지 않는다

심장·R 헤드·입자 결합의 빠른 국소 발광과 서고의 느린 자연광을 분리한다. [Epic의 Volumetric Fog 문서](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine)는 시간 재투영에서 빠른 광원 변화가 잔상을 만들 수 있음을 설명한다. 웹에서도 시간 누적을 선택할 경우 비슷한 실패를 **시험할 위험**으로 둔다. 동일 알고리즘이 이미 사용 중이라고 단정하지 않는다.

기본 제안은 주광/볼륨은 안정적으로, 박동은 선택한 emissive 면과 국소 bloom으로. 시간 누적을 쓸 때는 disocclusion과 스크롤 역방향에서 history를 무효화한다. 자체 발광 mesh가 주변을 비추는 조명이 자동 생성되는 것도 아니므로 필요한 제한된 보조광/합성을 명시한다.

## 5. 추가로 발전시킨 설계 장치

### L-ADD1 씬마다 빛의 경로를 한 줄로 기록

`광원 → 입구 → 큰 차광 → 중간 차광 → 공기 구간 → 수광면 → 카메라`를 씬 카드에 넣는다. 어느 물체가 앞을 가리는지와 어느 면에 밝은 패치가 남는지 둘 다 적는다. 자연광/실내 설치 조명/자체 발광/설명용 glow를 구분한다. 그림에 보이는 햇빛을 H5가 내는 빛과 섞지 않는다.

### L-ADD2 패스별 가시성 표

| 역할 | Beauty | Light depth / shadow | Volume 경계 | Reflection / bake | 업데이트 |
|---|---|---|---|---|---|
| SET/RCV 일반 면 | 보임 | 의미 있는 면만 포함 | 해당 없음 | 목적에 맞게 | 정적은 고정 |
| BLK 조절용 cutter | 숨김 | 포함 | 별도 | 원치 않는 반사/GI 노출 검사 | transform 변경 때 |
| H5/심장 | 보임 | 씬별 선택, 기본 자동 편입 안 함 | 별도 | 선택 | 형태/박동과 분리 판정 |
| B 접힘 면 | 보임 | 틈빛이 바뀌므로 필요시 갱신 | 접힘 공간 별도 | 종이 양면 검사 | 접힘 p가 바뀔 때 |
| C 신호 입자 | 보임 | 모든 입자를 그림자로 넣지 않음 | ambient dust와 분리 | 선택 | 단일 신호 시간 t |

### L-ADD3 같은 데이터 시계와 다른 조명 시계를 연결

환경 key는 world 기준, 종이/배열의 가림은 씬 진행 p, 심장·파형·입자 사건은 신호 시간 t를 따른다. p가 멈춰도 t는 계속된다. 광선이 카메라에 붙은 UI처럼 움직이지 않게 하고, 고정된 빛이 인체의 변형을 자동 따라간다고 가정하지 않는다.

### L-ADD4 화면 크기로 자산을 검수

1920×1080에서 key edge/종이 이면/심장 고리/전극/선의 projected width를 적는다. 1·2·4px 수준의 시험 프레임으로 aliasing과 과장 정도를 비교하고 실제 선택값을 기록한다. 모든 bevel에 같은 cm를 적용하지 않는다. shadow map의 씬 폭/해상도와 hero UV의 texel 할당도 함께 적는다.

### L-ADD5 판독 구간과 스펙터클 구간의 빛 예산

현재 A의 승인된 파형 보호 규칙은 유지한다. A/B/C의 파형 관찰 위치에서는 제목·R 헤드·심장을 우선하고, 뒤쪽 패턴과 volumetric peak를 낮춘다. B6/C3–5 같은 **변형·전환 씬**은 빛이 신호를 가로지르거나 입자에 반응할 수 있다. 이를 금지하는 새 공통 규칙은 만들지 않는다. 비교 패널 인계 후에는 연출광·왜곡·입자 합성을 종료한다.

## 6. 검증과 피드백 순서

1. **설계 지금:** 후보별 카메라/빛 역할/구조/상태 기록. A의 자리 후보는 보류 상태를 표시, B/C는 독자 확장의 목표 프레임을 상세화.
2. **최종 시나리오 피드백 이후 목업:** 같은 구도에서 빛의 큰 사건과 어둠의 기준점 확인. 생성 이미지가 실제 shadow 구현 증거가 되지는 않음.
3. **제작 초기:** 한 씬을 unlit → clay direct → clay GI → 국소 volume → receiver/material → beauty 순으로 비교. 각 단계는 원인 분리용 출력이며 완성 장면 선택과 별개.
4. **카메라/시간:** 씬 p의 6–12프레임, 정지 p에서 박동 2–3회, 포인터·역스크롤·재진입. 움직이는 blocker가 있으면 light depth가 업데이트되는지 확인.
5. **효과가 실제 켜지는가:** 동일 상태에서 강도0과 기본값을 비교. 원본/현재기준/수정후를 구별. R-019의 기존 검증을 재사용.
6. **사용자 피드백 뒤 새 연출:** 실제 캡처의 빈 면/약한 가림/과한 빛에서 나온 아이디어2–3개를 해당 안에 제안. 만족한 sweep·R 동기·명도는 유지 조건.
7. **결함에서 검사 확장:** fog washout, light leak, history trail, shadow swimming, hidden blocker 노출, 간접광 중복, 전환 종료 후 잔광 등 새 실패를 VAL-L 항목으로 추가.

자동 체크는 이름/계약/배열 연결을 확인하고, 시각 품질은 해당 프레임과 영상에서 판단한다. **지금 완료한 것은 자료 분석과 설계 반영이며, 실제 빛 라운드 렌더·모션·목표 PC 검증은 아직 수행하지 않았다.**

## 7. 연결 산출물과 다음 단계

- [장면별 빛·모델링 수정 명세](ECG_ABC_lighting_scene_spec_2026-10-04.md): A/B/C 각 프레임의 빛 경로와 독자 연출.
- [파트별 계획](ECG_ABC_feedback_plan_2026-10-03.md): LIGHT/SYS/A/B/C 작업의 상태와 다음 단계.

이번 권장안은 기존 문서의 핵심을 더 작은 구현 계약으로 옮기는 것이다. A의 현재 서고 빛 라운드와 후보 전체 시나리오 선택을 한 승인으로 묶지 않는다.
