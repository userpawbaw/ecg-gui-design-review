# 도입부·Story 장면별 제작 조사 기준 v1

2026-10-06 · D-083 / R-035 / CASE-007 · RESEARCH

**현재 기준 문서.** 제작 규칙은 `25_EFFECT_PRODUCTION_PIPELINE.md` §9, 조달 규칙은 `24_ASSET_RESEARCH_STAGE.md` §6. 이 문서는 그 규칙을 A의 실제 장면에 적용한 조사 결과와 다음 시험을 담는다. A부터 제작하며 B/C 제작 재개를 의미하지 않는다.

## 1. 사용자 결정과 범위

“제작 전에 관련 업계 포럼/자료가 있는지부터 탐색… 제작 규칙으로 승격… 구름 뿐 아니라 적용할 수 있는 모든 장면별 필요 요소… 기준 문서로 삼아 단계를 이어가자.” [대화]

신규 제작의 순서는 **장면 명세 → 요소별 공식·제작자·업계 사례 조사 → 외부 에셋/기술 후보 비교 → 작은 기준 렌더 → 구현 → 동일 구도 비교 → 피드백**이다. 자료 조사와 후보 선정까지의 기준은 이번에 작성했다. 파일 조달·실제 렌더·목표 PC 확인은 이후 단계다.

현재 고정값: `ECG_A_climb_locked_sequence_2026-10-05.md`의 A0–A7, 같은 서고/고창/사다리/카트, 도입부 오르기 정지 자세+idle, 등→측면→가슴, 검은 불투명 몸·심실형 amber 심장, Story 인접 의자 bay. Story S01–S10의 원인·유입·입력·처리·출력 구도 유지. 과거 T05 의자 도입부/다른 건축 목업은 현행 구조를 덮어쓰지 않는다.

서고 빛·소품 KEEP. 새 자료 때문에 기존 KEEP를 전면 재제작하지 않고 새 전이·자세·Story에 영향을 주는 부분만 검토한다. 구름 사용자 제작 피드백은 **1/2** 유지. 이번 조사와 규칙 채택을 두 번째 렌더 피드백으로 세지 않는다.

### 탐색 범위 보완 — D-084

현재는 내부 검토용 시안으로 고정한다(24번의 현재 이용 단계 정책). §9 후보는 무료/CC0 위주로 제한된 최종 목록이 아니다. 접근 가능한 모든 품질 후보를 추가하고 상용/출품 조건 때문에 탐색 단계에서 제외하지 않는다. 출처·알려진 이용 조건·시안 사용·출품 전 대체/확인 필요 여부를 함께 남긴다. 이 범위는 사용자에게 다시 묻지 않고 이어간다.

## 2. 증거 수준과 조사 충분성

이번 자료는 2026-10-06 공개 공식 문서/저자·제작자 자료/포럼 원문 및 repo 코드 감사다. 포럼 검색 결과만 확보한 경우, 전체 원문 실패, 최신 공식 문서와 현재 설치 버전 차이를 명시한다. 외부 demo를 실제 GPU에서 실행/연속 녹화했다는 뜻은 아니다.

- `[문헌]`: 제공 기능·제작 원리. `[포럼-제작자]`: 해당 효과 제작자의 설명, 직업적 전문성 보증 아님. `[포럼-사례]`: 특정 환경의 문제/해결. `[검색만]`: 후보 발견, 세부 근거로 사용하지 않음.
- `[코드]`: 현재 source/package/NOTICE에서 확인. `[추론:번안]`: 우리 장면의 구현 설계이며 원본 기능이나 실측 값으로 표시하지 않음.
- **RESEARCH_READY**: 원리·범위·후보·제약·기준 시험·남은 질문이 정리됨. **TEST_PENDING**: 획득/렌더/기능 시험 전. **KEEP_REUSE**: 기존 승인 영역. 어느 상태도 신규 시각 품질 PASS가 아니다.
- 링크 숫자만으로 조사 완료 판정하지 않는다. 요소의 형태·빛·시간축·성능·호환성 질문을 답할 수 있어야 한다. 관련 포럼을 못 찾거나 차단된 경우 공식 자료로 진행 가능한 범위와 미확인을 남긴다.

## 3. 근거 목록과 적용 범위

### 물리·환경·조명

| ID / 자료 | 확인한 내용 | 우리 적용 / 제한 |
|---|---|---|
| P01 [NASA Earth with Clouds](https://science.nasa.gov/resource/earth-with-clouds-3d-model/) | 지구 glTF 모델 배포, 페이지에 18.05MB 표기 [문헌] | 원거리 자산 비교 후보; 포함 구름이 근접 volume이라는 근거 없음 |
| P02 [NASA Blue Marble Clouds](https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/77558l) | 관측을 합성한 광역 구름 지도 [문헌] | 우주 시점 분포/색 기준. 서로 다른 날짜 합성·2D coverage, 근접 조형은 별도 |
| P03 [PGC REMA](https://www.pgc.umn.edu/data/rema/) | 남극 고도 자료/버전·인용·제품 문서 [문헌] | 현재 파생고도 mesh의 입력 확인. 고도는 얼음 roughness/specular texture가 아님 |
| P04 [Epic Sky Atmosphere](https://dev.epicgames.com/documentation/unreal-engine/sky-atmosphere-component-in-unreal-engine) | ground-to-space/산란/공기 원근 [문헌] | 파란 horizon과 햇빛 방향 설계. Unreal 설정을 Three uniform에 그대로 복사하지 않음 |
| P05 [JangaFX 무료 VDB](https://jangafx.com/software/embergen/download/free-vdb-animations) / [Disney cloud](https://disneyanimation.com/resources/clouds/) | 실제 density 자산, 전자는 무료10종104MB; 후자는 해상도별VDB/공식 렌더/scene [문헌] | 자세한 감사 D082 문서. 조달/같은구도 시험 전, 세계 전체 weather 대체 아님 |
| P06 [Autodesk Rendering a Cloud](https://help.autodesk.com/cloudhelp/ENU/AR-Maya/files/am-Arnold_for_Maya_User_Guide/tutorials/am-Volume_Tutorials/arnold_for_maya_volume_am_Rendering_a_Cloud_html.html) / [Volumes](https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-shapes/arnold_user_guide_ac_shapes_ac_volumes_html.html) | VDB step/산란/빛/정밀도와 비용 [문헌] | offline volume 기준. 예제 비보존 scatter hack·Arnold 숫자를 Cycles/WebGL에 일반화하지 않음 |
| P07 [Nubis Evolved](https://www.guerrilla-games.com/read/nubis-evolved) | 근접/내부 통과 cloud가 별도 제작·렌더 비용 문제 [문헌:제작자] | 필요한 구역에만 volume, detail/큰조형 분리. 엔진 FPS는 웹 성능 증거 아님 |
| P08 [Epic Volumetric Fog](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine) | 국소 density·수광·temporal reprojection, 빠른 빛의 trail [문헌] | 고창 shaft는 안정 조명, heart pulse는 별도 층. 현재 custom pass가 동일 reprojection을 쓴다는 뜻 아님 |
| P09 [Poly Haven FAQ](https://docs.polyhaven.com/en/faq) | CC0 재질/모델/HDRI 자료 [문헌] | 종이·목재·장비/실내 반사 환경 후보. HDRI가 고창 차광/접촉 shadow를 자동 해결하지 않음 |
| P10 [Three MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) / [Color Management](https://threejs.org/manual/pages/color-management.html) / [OutputPass](https://threejs.org/docs/pages/OutputPass.html) | PBR 기능·비용, color/noncolor texture, linear 합성과 출력 변환 [문헌] | 얼음/바닥/장비/종이의 역할 분리. clearcoat/transmission을 모든 자산에 적용하지 않음 |

### 자세·심장·데이터

| ID / 자료 | 확인한 내용 | 우리 적용 / 제한 |
|---|---|---|
| P11 [Adobe Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) | humanoid neutral pose·단위/구조 전제, rig/animation 제공 [문헌] | clean rigged body 후보; 특정 사다리·호흡·쥠 clip의 존재/적합성은 미확인. 통째 가져온 pose도 접촉 보정 필요 |
| P12 [Autodesk HumanIK pinning](https://help.autodesk.com/cloudhelp/2022/ENU/Maya-CharacterAnimation/files/GUID-6EB8580A-0344-42F1-A722-4FDFD5BFA70C.htm) / [Three CCDIKSolver](https://threejs.org/docs/pages/CCDIKSolver.html) | effectors translation/rotation 고정 및 IK chain [문헌] | 사다리 손·발 world contact anchor, 의자 좌면/발 지지, 호흡 중 접촉 유지. 다른 rig를 자동 변환해주는 호환 보증 아님 |
| P13 [NIH 3D Heart Library](https://3d.nih.gov/collections/heart-library?tab=about) | MRI 기반 심장 라이브러리, 선천성질환 중심 [문헌] | 심실/중격 구조 참고. 특정 파일의 정상 해부·라이선스·웹polycount 미확정; 환자 병변 형태를 일반 심장으로 그대로 사용하지 않음 |
| P14 [PhysioNet NSTDB](https://physionet.org/content/nstdb/1.0.0/) | bw=baseline, ma=muscle, em=electrode motion 구분 [문헌] | BW/EMG source와 metadata 확인. em을 EMG로 오인 금지. 녹음에는 우리 인물의 호흡/주먹 이벤트가 대응되어 있다는 증거 없음 |
| P15 [Analog Devices ECG design](https://www.analog.com/en/resources/technical-articles/mitigation-strategies-for-ecg-design-challenges.html) | AC mains/environment/electrode coupling·common-mode와 차동 변환 [문헌] | 장비→공간→측정 경로 PLI 연출의 의미. 사람에게 전원 케이블이 직접 꽂히거나 컴퓨터가 유일한 원인이라는 연출은 피함 |
| P16 [PhysioNet ECGSYN](https://archive.physionet.org/physiotools/ecgsyn/) | 형태/RR 등을 설정하는 합성 신호 도구 [문헌] | 샘플/이벤트 기반 시연 기준 후보. 실제 기록 신호·프로젝트 성능을 대체하지 않음 |
| P17 [PyWavelets SWT](https://pywavelets.readthedocs.io/en/latest/ref/swt-stationary-wavelet-transform.html) | 명칭 Stationary Wavelet Transform, 비다운샘플링 변환 [문헌] | Static 표기 교정 필요. repo methods.json M04는 Adaptive SWT; 최선 방법 표시는 해당조건 실제 ranking에서 가져옴 |

### 웹 표현·전환·글자·검증

| ID / 자료 | 확인한 내용 | 우리 적용 / 제한 |
|---|---|---|
| P18 [Line2](https://threejs.org/docs/pages/Line2.html) / [Points](https://threejs.org/docs/pages/Points.html) / [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) | 굵은 선·point cloud·반복 mesh 표현 [문헌] | ECG core/glow/입자 분리, 원인 arc/배경 구조. API만으로 좋은 디자인/잡음제거 계산이 되는 것은 아님 |
| P19 [TubeGeometry](https://threejs.org/docs/pages/TubeGeometry.html) / [Curve](https://threejs.org/docs/pages/Curve.html) / [CatmullRomCurve3](https://threejs.org/docs/pages/CatmullRomCurve3.html) | 경로 기반 형상과 곡선 위치 [문헌] | 배선·camera 위치 경로. lookAt/up/충돌·시선 고정은 별도 설계 |
| P20 [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html) / [AnimationAction](https://threejs.org/docs/pages/AnimationAction.html) | setTime/update와 clip blend [문헌] | breathing/grip animation을 데이터 clock으로 평가, 임의 independent timer 금지 |
| P21 [Lenis README](https://github.com/darkroomengineering/lenis) / [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) | wheel/touch eventsTarget, scrub/progress/update [문헌] | 하나의 scroll 진행률→camera/transition; heartbeat clock은 계속 재생. 최신README는 현재 Lenis1.3.17과 설치 source 대조 필요 |
| P22 [Three Texture](https://threejs.org/docs/pages/Texture.html) / [LOD](https://threejs.org/docs/pages/LOD.html) | 필터·mipmap, 거리별 객체 전환과 hysteresis [문헌] | 종이격자/책등 minification 및 far/near 필요 detail. LOD가 our crossfade/mask를 자동 작성하지 않음 |
| P23 [SMAAPass](https://threejs.org/docs/pages/SMAAPass.html) / [UnrealBloomPass](https://threejs.org/docs/pages/UnrealBloomPass.html) | 후처리 API [문헌] | 현재 MSAA/SMAA/HDR target 감사와 연결. WebGL renderer antialias 설정 하나로 전체 composer AA를 보장하지 않음 |
| P24 [Pretendard 제작자](https://github.com/orioncactus/pretendard) / [W3C motion preference](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) | 글꼴 굵기/웹 제공, motion 감소 예시 [문헌] | 한글 DOM 제목·label와 공간 layer, reduced-motion 구조. 글꼴을 바꾸기만 하면 레이아웃 문제가 해결되는 것은 아님 |

## 4. 업계 포럼에서 추가 확인한 실패 사례

| 사례 | 확인과 신뢰 범위 | 반영 |
|---|---|---|
| [Three cloud 제작자](https://discourse.threejs.org/t/volumetric-clouds-game-ready/86598) | 원문: mask/noise·depth prepass·occlusion godray·합성 경로. 저자가 AI로 탐구한 amateur라고 명시 [포럼-제작자] | 구현 분해 참고. 사이트가 Three 공식 포럼이라는 이유로 전문가/production-ready 품질을 승인하지 않음. 원리는 P06/P07·source와 대조 |
| [Bloom/AA banding](https://discourse.threejs.org/t/bloom-and-anti-aliasing-banding/22399) | 2021 특정 composer/target precision 사례, 그림·코드·수정 논의 [포럼-사례] | banding/AA/bloom 각각 분리. 당시 target 교체 코드를 현재0.186에 그대로 넣지 않고 installed addon 감사 |
| [Colorverse 제작자](https://discourse.threejs.org/t/colorverse-website-particles-morphing-on-scroll-with-custom-shader/43847) | 제작자가 custom shader와 scroll morph 효과 소개 [포럼-제작자] | waveform→cell/particle→output의 대응 구조 후보. 원본 live motion/GLSL source·성능 미측정; P18 기반 우리 확장으로 명시 |
| [HumanIK custom pin](https://forums.autodesk.com/t5/maya-animation-and-rigging-forum/how-to-make-pinned-controller-like-in-human-ik/td-p/11737830) | 검색에서 발견, 원문429 접근 실패 [검색만] | 구체적인 해결법 확정에 사용하지 않음. P12 공식 pin 자료로 조치 설계 |
| [camera wheel curve 사례](https://discourse.threejs.org/t/move-camera-back-and-forth-on-wheel-event-along-catmullromcurve3-help/22915) | 검색 후보, 전체 재현 미확인 [검색만] | 실제 wheel 정역 테스트의 조사 후보. P19/P21 공식 API + O012 현재실패증거 우선 |

공식 사이트도 오래된 문서/다른 엔진/예제용 hack일 수 있다. **매체 이름이 아닌 저자·원문·버전·재현 범위**를 기준으로 채택한다. 전문 포럼의 타인 추측이나 AI 답변은 원리 증거로 승격하지 않는다.

## 5. 모든 현행 장면의 요소·조사·제작 기준

각 행은 하나의 제작 묶음이다. 공통 요소는 중복 제작하지 않고 아래 §6 묶음과 소스 ID를 재사용한다.

| 장면 / 요소 | 근거·현재 상태 | 다음 제작 기준과 시험 |
|---|---|---|
| A0 지구/별/남극/제목 | P01–P04/P10/P22/P24 + REF014, RESEARCH_READY/TEST_PENDING | far 지구 구도 고정. NASA model vs 현재sphere+REMA 비교, 색·normal/roughness 분리. relief·반사·구름off로 기여 확인. 제목 앞 공간 유지; 별은 depth 장식이며 지리증거 아님 |
| A1 궤도/대기rim/태양/locator | P03/P04/P10/P19, RESEARCH_READY/TEST_PENDING | 대기 optical 경로와 지평선 곡률로 파란 rim, 얇은 유리 구체와 구별. 태양 가림 전후/ice specular/flareoff. locator는 은유 목적지, 실제 환자주소 주장 금지 |
| A2 구름/하강/서고 지붕 | P05–P07/P19/P22 + D081/D082, RESEARCH_READY/TEST_PENDING | 외부VDB offline 골드→웹. far 분포/selected mid/near 실제통로. 태양·윤곽·구름틈·지붕 footprint 정합. 3높이+측면, shadowoff/bloomoff, 실제정역wheel |
| A3 고창/창틀/보/서가/사다리 발견 | P08–P10/P19/P22 + D068, KEEP_REUSE/접합TEST_PENDING | 내부 구조에서 지붕/외벽 설계. aperture→blocker→volume→receiver 고정. 보의 가림 안 컷/거리압축은 표현 기법. 새구간만 빛연속/서가관통 검사 |
| A4 사다리/검은body/손발/전극·lead | P11/P12/P19 + D063/F037, RESEARCH_READY/국소TEST_PENDING | 2손2발 앵커, 무릎 방향·손가락 grip·발바닥 지지. body+ladder+lead가 포함된 등/옆/접촉근접 컷. 점거리와 표면비관통 구별. idle 중 손발 고정 |
| A5 열린측면/심실heart/암전 | P12/P13/P19/P20/P23, RESEARCH_READY/TEST_PENDING | opaque body 유지, chest window만 심장. 팔·사다리 가림과 rear 투시 금지. 따뜻한 주광→국소심장 강조 시 창/shaft/수광 함께 조정. 혈관망/플라스틱 몸 추가 금지 |
| A6 혼합입력/격자/네온sweep/제목 | P14/P16/P18/P20–P24 + 현재waveUi/beatPhase, RESEARCH_READY/TEST_PENDING | stored ECG/endpoints, 2.5초 표시창은 설계목표; 0dB 실제 적용값을 metadata로 확인. 심장과R 동일 sample clock. 밝은 head→정상 core, 소거국소fade. 격자·글자 화면속도/깊이 분리. 정지/loop경계/가변RAF 검사 |
| A7 sample membrane/분해·정렬/clean 출력 | P17/P18/P20/P21 + REF009/기존A명세, RESEARCH_READY/TEST_PENDING | 입력→처리영역→출력 인과 고정. 표본ID 기반 cell/particle/재조립 후보2개 비교. Intro/Story는 형태왜곡·3D·분해 허용; 비교패널 진입 전 정확한저장출력로 정착. 투명도만 바꾼 효과보다 사건이 읽혀야 함 |
| Intro→Story 의자 bay 컷 | P12/P19/P21 + D063/D068, RESEARCH_READY/TEST_PENDING | 같은 서가기둥 가림 컷, 고창·재질·방향 유지. ladder에서 chair로 긴실시간동작 추가 안함. 전후camera/인물scale·beat clock·캐시로드 연결 |
| S01 PLI 원인환경/의자/컴퓨터·모니터/배선/상태표시 | P09/P11/P12/P15/P19/P24, RESEARCH_READY/TEST_PENDING | 좌사람·우장비·플러그와전선 한화면. silhouette와lead는신호, AC전선은장비전원으로 분리. 초반상태표시는3종중PLI활성, 내부M코드숨김. 자세·카트·모니터 후보의 실제 camera silhouette 비교 |
| S02 socket 근접/AC 표식 | P15/P19/P24, RESEARCH_READY/TEST_PENDING | 같은socket 위치를 tracking해 확대. icon은DOM/plane후보, plug insert/전선연결확인. 전원접속 구조를 보여주되 감전·인체직결로 오해되지않음 |
| S03 장비 물결→유입→PLI 입력 | P15/P18/P20/P21, RESEARCH_READY/TEST_PENDING | 2–3 느린물결은60Hz 전자파 속도 실측이 아닌 설명연출. ring/pulse발생원 장비→측정경로 강조→파형. 60Hz waveform은실제selectedsample에서, 시각파동frequency와분리. 60Hz빛깜박임 금지 |
| S04 모니터 처리/PLI clean/대표방법 | P17/P18/P20/P21 + repo ranking/methods, RESEARCH_READY/TEST_PENDING | monitor에단계별표본정렬+처리막, 또는progress 대안비교. progress는실제연산시간claim없음. 방법명 Adaptive SWT 등 실제winner 표시; 조건/SNR/metric확인 후. PLI 무조건SWT라는고정문구 금지 |
| S05 들숨/가슴·어깨/떠오르는baseline | P12/P14/P20, RESEARCH_READY/TEST_PENDING | seated pelvis/feet고정, 작은chest morph+clavicle. BW envelope와연출breathphase 대응 제안. 잡음최대값을흡기정점이라고자동해석하지않음. 실측호흡기록이없으면 설명동작으로표시 |
| S06 날숨/같은구도/하강baseline | P12/P14/P20, RESEARCH_READY/TEST_PENDING | 같은인물·카메라·그리드 유지, 손/전극접촉과lead 따라감. 들숨/날숨2endpoint와중간프레임 비교. 임의sin breath와저장BW를별도timer로재생하지않음 |
| S07 BW 처리/기준면 안정/방법 인계 | P14/P17/P18/P20, RESEARCH_READY/TEST_PENDING | 저주파guide가sample막에서분리·평면화되며cyan출력정착. spectral계산을실행하지않으면그림은설명은유. 정확한출력·R·조건별method유지 |
| S08 open hand/팔·가슴 동일화면 | P11/P12/P19/P20, RESEARCH_READY/TEST_PENDING | fingers bone 또는pose morph. relaxed fingers silhouette·손목·의자접촉; 팔과가슴·graph를모두가리지않는카메라. 가까운손질감은검은형태/작은rim 유지 |
| S09 grip/국소burst/유입 | P12/P14/P18/P20, RESEARCH_READY/TEST_PENDING | stored muscle noise envelope로burst event table 만든뒤gripclip을같은clock평가. ma/em구분, 실제주먹행동측정claim안함. 손가락자기관통/손바닥두께/후방가림·짧은burstmiss 검사 |
| S10 release/clean/비교패널 연결 | P17/P18/P20/P21/P24, RESEARCH_READY/TEST_PENDING | noise원cue약화→정확clean→flat graph/비교하기. intro spectacle layer종료,원인·처리·출력의읽힘유지. 비교패널은 waveform/time/unit/Reference/Difference계약엄격복원 |

## 6. 공통 요소 제작 묶음의 구체 기준

### E1 지구·얼음·대기
P01/P02는 먼표현, P03는높이, P10는재질/반사, P04는대기. 하나의사진/GLB로 네문제를한꺼번에해결했다고판정하지않는다. 현재REMA5x표시고도와1kmderived의한계는이전D072보고서유지. 얼음microdetail은다른재질입력으로시험. 바다specular와얼음highlight가동일플라스틱으로보이면roughness/normal/환경부터분리. 공간전체/높은궤도/낮은궤도3anchor비교.

### E2 환경·조명·후처리
고창차광·국소공기·바닥/책등수광과실내간접광을함께구성. P08의국소fog원리를참고하되방전체density로공간을채우지않는다. shadowoff/volumeoff/bloomoff의같은카메라를비교한다. shadow나roughness가없는clay는내부진단용. 현재approved서고룩은보존기준이며새Storycamera로추가사물의접촉/수광만갱신. amber/cyan와배경bluegray위계는이전빛문서참조; 이미지밝기10–20%는측정된광원강도상수아님.

### E3 인체·자세·심장
필요장면에맞는rig와topology를먼저선택. 외부pose를맞출때hand/foot/pelvis anchor를고정하고후처리로접촉실패를감추지않는다. heartshape는두심실이읽히는정도로단순화; MRI라이브러리의병변/내부복잡도를원치않는실사화로가져오지않는다. R 이벤트에맞춘heart시각beat는사용자연출계약이며실제기계수축위상을측정했다는뜻아님. 호흡/쥠clip과배선deformation도같은시간입력을사용하되각기다른phase/envelope.

### E4 파형·처리·독립 wow 아이디어
wave core/넓고약한glow/head age mask/erase edge fade/grid/background/text는독립층으로검토. noisy amber의전체명도를cyan정상부와비슷하게정리하고head만짧게강조. 고정증가값/decay초는대표렌더와실제R가독성으로결정.

각장면실제결과를검토할때추가아이디어를함께제시한다. 이번조사에서검토할후보 [추론:번안]:
- A7: **sample→cell→line 재정렬** vs **잡음성분이깊이방향으로벌어지고clean면이앞으로정착**. 둘다입력·처리·출력경로읽힘과시간동기화유지. 실제algorithm과동일계산이라는표현금지.
- PLI: 느린공간ring이lead주변에닿을때graph의간섭층이활성화; monitor처리cell과같은sample stream으로결과인계.
- BW: 떠다니는기준면자체가고정rail에정렬되며출력plane으로정착. 3D입력의구도변화는허용하고정확비교구간에서평면복원.
- EMG: envelope구간만작은입자burst가흩어졌다가처리영역에서흡수/재조립; 주먹동작은같은event table에연결.

이들은새확정시나리오아님. 다음해당장면구현/캡처에서2가지후보를검토하고피드백으로고른다. spectral분리/particle동작의과장허용이최선기법·실제성능값조작허용은아니다.

### E5 글자·카메라·성능
제목은심전도잡음제거, 부제/상태/label/method/tick는글자계층으로설계. P24 font기능과REF011–013 기존공간/타이포관찰을연결; 그냥폰트이름으로트렌디함판정안함. text DOM은읽히는평면을유지하되배경/장비/graph와등장·이동속도차를검토. method 전체명칭·조건은canonicalmetadata.

camera position곡선과orientation을분리, 보간중lookAt이camera를통과하지않는지검토. p=scroll/camera, t=signal replay; stopped p에도t 계속진행. O012 실제wheel회귀기준재사용. DPR/framebuffer·render target·HDR/색변환·bloom·AA감사후통합한다. 공식latest페이지는현재three0.186.1/Lenis1.3.17/postprocessing6.39.5/atmosphere0.19.1과대조. UE성능과다른GPU성능을우리값으로기록하지않음.

## 7. 단계별 읽기와 다음 작업

| 작업 | 시작할 최소 문서 | 완료 증거 |
|---|---|---|
| 어떤씬이든새제작 | 25§9 → 이문서의해당씬/E묶음 → 현행scene명세 | 요소별근거/후보/제약/시험이붙은작업packet |
| 지금구름/지구 | 이문서E1/A0–A2 → D082감사 → D081거리계획/REF014 | 외부VDB metadata/hash,같은camera/sun offline기준,far↔near후보 |
| A-P3 파형·처리 | A6/A7/E4 → climb locked → 데이터·clock현재코드 | 처리후보2안,정지/경계Rsync,실제정역wheel·품질captures |
| Story PLI | S01–S04/E2/E3/E4 → Story10명세(최신구조교정) → methods/ranking | 완성장비·전선·socket/원인·유입·입출력,method조건검증 |
| Story BW | S05–S07/E3/E4 → selected bw metadata/phase설계 | 같은pose/camera흡·날숨/clip/clock/envelope대응/오프셋검증 |
| Story EMG | S08–S10/E3/E4 → ma/em판별/event table | open/grip/release+burst,접촉/관통/시간 검증 |
| 최종연결 | E5 → 기존lighting/AA/실제wheel증거 | 전이앞중뒤+정지/역방향/resize/reduced/실GPU;비교계약회복 |

순서: **기준 문서 확립(이번) → 무료VDB/지구대표광학시험 → A-P2 수정후사용자피드백2 → 성공시A-P3 → PLI → BW → EMG → 비교패널접합**. 각장면의에셋/조명/전환아이디어보완과자체검토는그장면단계안에서진행한다. 실패판정후구름제거/AI영상두대안은기존D080조건유지. Story관련연구를마쳤다는이유로구름후보피드백전에Story런타임을먼저교체하지않는다.

## 8. 남은 미확인과 재조사 조건

- 실제다운로드파일의voxel/detail/라이선스/크기, 현재툴import성공과samecamera beauty. 무료VDB미달시Disney/상용비교.
- 특정Mixamo ladder/breath/grip clip 존재와현행인체호환. 기존pose가충분하면유지하고새clip을필수로강제하지않는다.
- 정상심장모델의구체item/파일·단순화필요성. 현재심실형에문제가없으면교체하지않음.
- NSTDB와우리bank의BW/EMG record/time/fs/scale/condition, 호흡·grip연출phase/threshold. projectsource/dataset선택을원문자료로자동대체하지않음.
- 상호작용조명cache,space↔orbit/cloudpass호환,frame cost/메모리·targetPC. installedsource/version pin이후검증.
- 개별새효과의live경험을copy/reproduce하려면21규칙의EFX카드/입력캡처를추가. 이번technical조사만으로원본wow재현PASS선언하지않음.

재조사발동: asset/type/version/camera크기/태양방향변경,특정질감반복실패,포럼과공식source불일치,새사용자피드백. 기존실패캡처와수정이력은남긴다. 체크리스트PASS가전체미학검증을대체하지않는다.

## 9. 완성 에셋·프리셋·효과 후보 — 직접 제작 전에 비교

최신 사용자 보완: “기존 고퀄리티 에셋이나 후처리, 효과 등이 있으면 그것도 찾도록 해줘.” [대화]

기존 자료의 원리만 학습하는 것으로 끝내지 않는다. **완성 자산, 재질/HDRI, 리그/클립, 조명·렌더 프리셋, 후처리 라이브러리, 효과 구현체**를 함께 찾는다. 아래는 조사 후보이며 신규 품질 KEEP가 아니다. 제공자의 고품질 표기는 우리 카메라에서 확인한 결과와 구별한다. 기존 승인 자산을 대체할 의무도 없다.

| 후보 / 출처 | 적용 장면과 가져올 것 | 수정·호환성 및 다음 시험 | 현재 판단 |
|---|---|---|---|
| Q01 [JangaFX 무료 VDB](https://jangafx.com/software/embergen/download/free-vdb-animations) | A1–A2: 완성 구름 밀도 10개, CC0 패키지 | 원본 형태를 offline volume으로 조명하고 우주/궤도/근접 3구도 비교. VDB→웹 데이터 또는 베이크 변환 필요 | 우선 시험, 파일 취득/렌더 전 |
| Q02 [Disney Clouds](https://disneyanimation.com/resources/clouds/) | A1–A2: 구름 VDB와 Hyperion 기준 이미지·Mitsuba 장면 | 여러 해상도와 원본의 조형/산란 비교. 큰 용량과 renderer 차이; 목표 태양/구도 기준을 따로 만든다 | Q01 부족 시 비교 후보 |
| Q03 [CloudScapes 판매자 문서](https://superhivemarket.com/products/cloudscapes/docs) | A2: Blender용 완성 구름·제작 도구/프리셋 | PRO/LITE 및 Cycles/Eevee 지원 범위, 버전·가격·라이선스 확인 후 비교. 웹 glTF용 완성 volume은 아님 | 상용 후보, 구매·파일 미확인 |
| Q04 [NASA Earth glTF](https://science.nasa.gov/resource/earth-with-clouds-3d-model/) / P01–P03 | A0: 기존 완성 지구, 궤도에서는 REMA/재질 보완 | 현재 NASA 기반 자산을 감사하고 원거리 텍스처를 유지할지 비교. 완성 구름 이미지가 근접 부피를 보장하지 않는다 | 기존 자산 우선 재사용 |
| Q05 [Poly Haven Shelf 01](https://polyhaven.com/a/Shelf_01), [책 세트](https://polyhaven.com/a/decorative_book_set_01) | A3–Story: CC0 서가/책 모델·PBR 재질, glTF 등 | Shelf는 낡은 도장 스타일. 기존 따뜻한 서고와 톤 비교; 책 표지와 ECG 기록물은 따로 맞춘다 | 서고 KEEP, 보완용 후보 |
| Q06 [Poly Haven Classic Laptop](https://polyhaven.com/a/classic_laptop) | S01–S04: CC0 장비, 약 14K triangle, glTF/PBR | 복고 외형의 적합성, monitor 면 실제 파형 교체, 스케일·배선/AC 어댑터·콘센트 추가. 모델의 화면 그림을 실제 데이터로 쓰지 않는다 | PLI 장비 우선 시험 후보 |
| Q07 [Poly Haven 장비 목록](https://polyhaven.com/models/tools-equipment), [ambientCG Paper001](https://ambientcg.com/view?id=Paper001) | A4 사다리, A6/Story 기록지 재질 | 사다리는 목록 발견 수준: 개별 파일·크기·발판 확인 필요. 종이는 현재 기록지의 섬유/roughness 확대 비교 | 기존 사다리 유지, 보완 후보 |
| Q08 [Mixamo](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html), [NIH Heart Library](https://3d.nih.gov/collections/heart-library?tab=about) | A4–A5/Story: 리그·동작, 심장 조형 | 중립 인체 입력/손발 접촉 보정. 특정 ladder/breath/grip 클립 존재 미확인. NIH는 환자/질환 모델도 있어 정상 심장 item·개별 조건 확인 필요 | 라이브러리 확인, 개별 선정 전 |
| Q09 [Sketchfab ECG Monitor](https://sketchfab.com/3d-models/ecg-monitor-47e72cd57f45414aa82e41342b299b5b) | Story: 모니터 완성 모델 대안 | 검색상 약 14.6K triangle·CC BY, 공포게임용 스타일. 원문 403: 현재 파일·이용 조건·다운로드 미검증 | 검색 후보만, 채택 근거 아님 |
| Q10 [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing), [GodRaysEffect API](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/GodRaysEffect.js~GodRaysEffect.html) | A3 고창광, A5 심장, A6/Story graph: God Rays/선택 Bloom/DOF | 현재 dependency 6.39.5와 source 대조. Three examples composer에 같은 pass를 바로 꽂는 구조가 아니다. glow 선택/색변환/AA/가림/광원 화면 밖 시험 | 설치 후보가 있어도 통합·시각 시험 전 |
| Q11 [Takram three-geospatial clouds](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/clouds) | A2: CloudsEffect·quality preset·태양/하늘광·구름 그림자 | README에서 space view/global coverage는 planned. 전체 A0→A2 경로 자동 대체 불가. 별도 cloud 구간에서 composer/좌표/현재 버전 시험 | 국소 후보, 전체 경로 채택 제외 |
| Q12 [Three addon API](https://threejs.org/docs/), [Colorverse 제작자 사례](https://discourse.threejs.org/t/colorverse-website-particles-morphing-on-scroll-with-custom-shader/43847), [webgl-noise](https://github.com/ashima/webgl-noise) | A6–A7/Story: Line2/Points/InstancedMesh/Tube, 입자 morph, noise shader | API는 준비된 도구, 사례는 기법 근거. 사례의 배포 소스·현재 환경 미검증. noise 함수만 바꿔도 좋은 구름 조형/조명이 생기는 것은 아니다 | 기법 공급원, 완성 연출과 구별 |

### 가져오기 / 수정해서 사용 / 직접 제작 선택

- **그대로 사용**: 형상·재질과 목표 구도가 맞고 데이터/clock과 독립인 배경 소품. 원본 manifest, 조건, 크기와 hash를 남긴다.
- **수정해서 사용**: VDB의 조형 + 프로젝트 조명, 장비 모델 + 실제 monitor 화면/배선, 리그 + 접촉 보정, 후처리 + 선택 mask/색변환처럼 핵심 품질을 유지하면서 의미를 맞춘다.
- **직접 제작**: 실제 ECG 재생·R sync·입력→처리→출력 연결, 동일 archive의 전이 경로, 자료로 확보되지 않는 동작/효과. 외부 도구를 쓰더라도 프로젝트 로직은 연결해야 한다.
- **해당 없음/보류**: 원본 효과가 의미와 다르거나 지원되지 않는 구간/버전. 기존 Ripple≠소나 판단을 이름이 비슷하다는 이유로 뒤집지 않는다.

God Rays는 실제 volume 산란의 대체품으로 자동 분류하지 않는다. [제작자 답변](https://github.com/pmndrs/postprocessing/discussions/435)은 당시 light source를 screen에서 blur하는 방식의 화면 밖 제약을 설명한다. 현행 설치 구현을 확인하고 광원이 화면 밖으로 나가는 A 카메라에서 별도 시험한다. Bloom은 선택된 심장/신호/빛에만, DOF는 파형·제목 가독성을 해치지 않는 구간에만 검토한다.

### 작업 packet에 남길 최소 비교표

장면/필요 요소 → 완성 자산·효과 후보/원문 → 직접 제작 대비 이득 → 수정량 → 형식/버전/라이선스/크기 → 현재 renderer 호환 → 동일 구도 시험 → KEEP/TUNE/REJECT → 남은 질문.

파일 확인 전에는 예상치를 실측으로 적지 않는다. 결제·다운로드·렌더는 아직 수행하지 않았다. 에셋 인증이 필요한 후보만 24번 절차로 처리하며, 공개 후보 조사 전체를 로그인 대기로 멈추지 않는다. 무료 후보 기준 렌더가 충분하면 상용 탐색을 더 늘리지 않는다.
