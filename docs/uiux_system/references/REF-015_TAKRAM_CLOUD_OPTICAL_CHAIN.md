# REF-015 · Takram 완성 cloud optical chain

## 1. 레퍼런스 개요
[공식 source](https://github.com/takram-design-engineering/three-geospatial/tree/b012ad06d858fc035d88aacfd73f092f93c994e4/packages/clouds), [실제 Basic](https://takram-design-engineering.github.io/three-geospatial/?path=/story/clouds-clouds--basic). 자체 cloud shader 개선보다 구현된 빛·구름·대기·후처리를 함께 차용하는 후보.

## 2. 입력 증거
D103 외부 browser screenshot과 pinned source/실제 texture. D104 독립 WebGL 기준6구도 및 누적OFF/구름OFF 실제 PNG/JSON. 생성 목업 아님. Basic pixel-identical 재현 아님.

## 3. 기술 스택과 전역 설정
clouds0.7.6/atmosphere0.19.1/effects0.6.4, Three0.186.1, postprocessing6.39.5. HalfFloat targets/LUT, AGX exposure10, renderer DPR1/MSAA0. Vanilla에 NormalPass와 BSM/Aerial 연결. Basic 원본 SMAA와 차이 있음.

## 4. 디자인 토큰
source coverage.4, cloud layers750/650,1000/1200,7500/500m. Basic coverage.3. north5000/1200,5700/1800,9500/500m. 측정/시험값이며 최종 승인 토큰 아님.

## 5. 장면·전환 지도
source500→source3500→Basic3500 원형 관찰 → EFX-015-01. 같은 north p.265→.300→.345는 같은地形camera의 독립 후보. globe/서고 연속 구현 미완.

### D105 장면·전환 지도 보완

| 구도 / 입력 | 효과 | 근거 / 상태 |
|---|---|---|
| Basic300, .42/54, 구름 아래 시야 | EFX-015-02 | RTX 고정 native ON/OFF에서 빛 띠 기여 확인. 원본과 pixel-identical 아님. |
| north .265→.300→.345→.365 진행 slider | EFX-015-01 / EFX-015-02 | 동일 지형1.5×. latest6구도는 software low25% 진단, 고품질/연속 움직임 미승인. |


## 6. 효과 카드
### EFX-015-01 · Cloud optical composition
**선정 이유**: 부피·그림자·대기·sunsky가 묶인 공개 renderer.
**지각**: 밝은 융기, 어두운 틈, 원경 연무, 구름이 가리는 지형.
**입력 모델**: 포인터 / 스크롤 위치 — OrbitControls 또는 north 진행 slider; wind checkbox. ECG timing 미연결.
**판별 근거**: 공식shader/code와 실제ON/OFF 캡처.
**구현 메커니즘**: weather/3D noise raymarch→BSM→temporal upscale→Aerial albedo Lambert→AGX/lens/dither.
**파라미터**: 버전·coverage·layers·노출 위 항목 및 runtime code.
**타임라인**: scroll timeline이 아닌 독립 fixed pose/slider 시험.
**에셋**: 실제 weather/shape/detail/STBN/4 LUT, d104-runtime-pins.json.
**성능 기법**: library quality preset/temporal reconstruction; 비용 composer scope 구분.
**접근성·폴백**: wind 기본OFF, cloud/temporal OFF 비교; 제품 reduced-motion 연결은 미완.
**근거**: D103 source manifest / D104 report/native caps [코드] [브라우저].
**재현 요구사항**: WebGL2/depth/normal/meter ECEF/albedo-radiance 계약.
**수용 기준**: 같은地形고정구도 유지, compile error0, grain/과노출/transition 사용자판정.
**ECG 번안**: signal 도입부 전 지구하강; comparison panel untouched.
**재현 상태**: spike — functional PASS, visual TUNE; main 미교체.

### EFX-015-02 · 구름 틈을 지나는 빛 커튼

**선정 이유**: 사용자 지목 — 구름 사이를 통과한 빛 광선의 커튼 같은 모습.
**지각**: 구름 아래 연무에 부드러운 밝고 어두운 띠가 생겨 구름의 공중 높이와 빈 공간을 보여준다.
**입력 모델**: 포인터 / 스크롤 위치 — 원형 OrbitControls, north slider; 빛 커튼 checkbox는 진단 제어.
**판별 근거**: 사용자 참고 이미지, original Basic UI, cloud shadowLength 및 Aerial shader source, native lightShafts ON/OFF.
**구현 메커니즘**: Cloud raymarch/BSM의 shadowLength를 AerialPerspective 산란에 전달. 투명한 cone mesh나 bloom만으로 흉내 낸 효과가 아니다.
**파라미터**: coverage.42/weatherRepeat54, original thickness650/1200m, shadow.maxFar100000m, lightShafts true. Basic300 위도35/경도30/2026-01-02T07Z. north는 고정 태양 및8km cloud base의 별도 번안.
**타임라인**: 현 단계 fixed camera 정지 진단. 원본 Basic의 연속 camera/scroll 제품 연결 미완.
**에셋**: 기존 pinned weather/shape/detail/STBN 및4 LUT. helper source와 사용자 이미지 해시는 D105 manifest 참조.
**성능 기법**: cloud resolutionScale/quality preset, 4×4 temporal upscale. fullres도 TAA이며 software timer unavailable; targetPC 예산으로 사용하지 않음.
**접근성·폴백**: wind 기본OFF, 빛 커튼 OFF 비교. 제품 reduced-motion 연결은 미완; D080 cloud-free/AI-video 대안은 보존된 미실행 선택지.
**근거**: [대화] [코드] [캡처] D105 report / manifest. 원본 Basic 빛 띠와 실제 north 번안의 가시성 부족을 구별한다.
**재현 요구사항**: WebGL2/depth/normal/ECEF metres, source albedo 입력, shadowLength 실제 연결, 구름 아래 카메라 및 적절한 태양/빈 cloud 창.
**수용 기준**: source ON/OFF 빛 띠 기여, north 같은 지형에서 빔 가시성, 새 shimmer/ghosting 없음, 정상 hardware high six-pose/연속 camera 검증. 마지막 조건 미완.
**ECG 번안**: 도입부에서 서고로 내려가기 전 공중 공간 깊이. 이후 신호 처리 빛 연출 후보는 별도; comparison panel 의미는 변경하지 않음.
**재현 상태**: spike — source 기여 확인, north 시각 TUNE, hardware 안정성 CONDITIONAL. main 미교체.

## 7. 에셋 목록과 조달 경로
assets/research/cloud-reference-20261008/manifest.json + d104-runtime-pins.json. 공식npm/source/MIT provenance. 내부시안 D084 조건; 실제출품시 대체/조건 재검토.

## 8. 성능·접근성·폴백
RTX3070 1080p composer p50 약3.61–5.11ms/p95 최대7.54ms; cloud 전용 비용/FPS 아님. 이전80field 리소스 초기화는 남아메모리추가. targetPC/mobile/연속camera/ghosting 미검증. D080대안 보존.

## 9. 레시피 후보
RCP 승격 미실행. 완성 chain 원형→단위/normal/depth/albedo 정합→동일구도 비교→quality 승인 뒤 연속인계.

## 10. 열린 질문
미세grain/밝은cloud face, northLambert vsPBR질감, normal morphborder, 정지 temporal vsmotionghosting, globalspace authorTODO. 보고서 ECG_A_takram_cloud_reproduction_review_2026-10-08.md 참조.

## D105 정정과 추가 효과 분석 — 2026-10-08

D104의 cloud OFF는 Effect에 지원되지 않는 enabled를 설정해서 무효였다. 과거 PNG/JSON은 보존하며 OFF 성능/기여 근거에서 제외한다. “시간 누적 OFF/raw”는 full-resolution TAA이며 4×4 temporal upscale OFF를 의미한다. 현재 source Basic SMAA와 maxFar100km를 추가했고, 원본650/1200m 층 두께로 복귀했다. latest north altitude8000/8250/14750m는 camera7–7.5km 아래 구도를 위한 번안 수치다. 기존 north5km 초기 캡처와 섞지 않는다.

## D106 하드웨어 재검증 — 2026-10-08
RTX3070 회복 확인 후 같은 latest north6구도를 upscale50%/fullres50%/fullres50% 대비1.6 세 조건으로 재캡처. fullres의 반복 입자 감소와 대비1.6의 밀도·빈 공간 변화를 구분했다. fullres50%는1280×720 화면에서 cloud640×360이고 TAA는 계속 사용한다. 그림자/커튼은 단순 blur나 bloom으로 대체하지 않았다. 원래 시스템 중단 원인과 강렬한 커튼 가시성/암부/연속camera 품질은 미완이며 EFX01502 상태는 spike/TUNE을 유지한다. 최신 ECG_A_takram_hardware_recheck_2026-10-08.md / native26쌍 / F072/D106/O020 후속이 근거.

## 2026-10-08 D107 파라미터 검토 / 보완 시작
사용자 fullresTAA선호·추가설정검토와이후보완승인. originallive/pinnedhelper/GLSL대조, 양.42/54기준유지·고정sun/고도연무번안이필요함. high50/TAA같은p.3659native, cloud양/offset/sun/haze단독대조. 커튼빛불충분/TUNE, terrain밝기튜닝여지. 컨트롤추가·sourcehelper보존·capture80자제한오류compactID수정. 다음aperture/layer/중간하강beam정합→terrain광학→6구도motion→globe. main/Story/BC/사용자6capture보존. report docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_A_takram_parameter_review_2026-10-08.md; gallery verification/a-takram-parameters-20261008/gallery.html.
