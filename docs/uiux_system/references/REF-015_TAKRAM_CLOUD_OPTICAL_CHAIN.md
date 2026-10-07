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

## 7. 에셋 목록과 조달 경로
assets/research/cloud-reference-20261008/manifest.json + d104-runtime-pins.json. 공식npm/source/MIT provenance. 내부시안 D084 조건; 실제출품시 대체/조건 재검토.

## 8. 성능·접근성·폴백
RTX3070 1080p composer p50 약3.61–5.11ms/p95 최대7.54ms; cloud 전용 비용/FPS 아님. 이전80field 리소스 초기화는 남아메모리추가. targetPC/mobile/연속camera/ghosting 미검증. D080대안 보존.

## 9. 레시피 후보
RCP 승격 미실행. 완성 chain 원형→단위/normal/depth/albedo 정합→동일구도 비교→quality 승인 뒤 연속인계.

## 10. 열린 질문
미세grain/밝은cloud face, northLambert vsPBR질감, normal morphborder, 정지 temporal vsmotionghosting, globalspace authorTODO. 보고서 ECG_A_takram_cloud_reproduction_review_2026-10-08.md 참조.
