# 흐린 원경층과 선명한 국소 구름 텍스처 분리 · D128

**에셋 품질 시험 / TUNE / web 적용 전.** 사용자가 지적한 것은 단순 조명 부족이 아니라 원본 결 부족이다. D127의 조명용 굴곡 개선을 텍스처 목표 달성으로 취급하지 않는다.

## 추천 방향

1. 기존 위성층: 광역 불규칙 분포·흐린 원경·얇은 띠 유지.
2. 국소 선명층: 실제 고해상도 cloud volume 원본에서 만든 texture를 확대 경로 주변 몇 군집에만 사용. **small cloud 하나를 대륙 크기로 확대하지 않는다.** 여러 실제 크기의 구름을 국소 weather patch로 묶는 방향.
3. 하강/통과: texture sheet의 한계가 드러나기 전에 같은 원본 density의 국소 volume로 인계. 갑작스러운 생성/별개지형 교체 금지.

이번에는 **원본 에셋의 결을 확인하는 투명2K 단일 구름 샘플**부터 만든다. 지구의 같은 구도에 적용한 완료 화면은 아니며 이 샘플에 적용 크기·LOD·shadow를 검증했다는 의미가 없다.

## 확인한 원인과 한계

현재 globe cloud 원본8192×4096, geographic scale2. 적도에서 수평1texel 약2.45km, 북유럽61.63°에서 동서 약1.16km; 남북 약2.44km. 단순 구면 길이 추산이며 실제 cloud 고도/카메라 투영 표본수와는 별도다. 전체8K라는 숫자가 국소 솜털 결을 보장하지 않는다. `cloud-orbital.ts`의 명시 mip scale2450m 및 fine/broad gradient가 사용하는 자료도 같다. 원본에 없는 미세 결은 sharpening/밝기/normal 증폭으로 복원되지 않는다.

일부의 강한 명암은 고해상도 density와 굴곡·빛 전달이 함께 만들어야 한다. 검은 골을 색으로 그려 넣기만 하면 실제 태양 방향과 다를 수 있다. 사진cutout/beauty bake는 이미 빛이 포함된 방식이라 반드시 고정 sun/view 조건과 사용 범위를 명시한다.

## 에셋 및 제작 방식 비교

| 후보 | 현재 확인한 자료 | 적합성 / 한계 | 이번 상태 |
|---|---|---|---|
| 현재8K 위성구름 | 로컬R8원본/해상도/placement 확인 | 넓은 분포에 적합, kilometre texel로 국소 섬유결 부족 | 원경층 유지 기준 |
| JangaFX Cloud Pack | 공식페이지104MB/10 variations, 로컬10VDB·acquisition hash | 원본 volumetric 골·가장자리 결, web변환·조명 비용 별도 | 01/06 투명2K 샘플 제작 |
| JangaFX 50 Clouds Volume1 | 공식 preset marketplace | editable source preset, 무료cloudpack과 다름; 구매/시험실행/원본확보 없음 | considered only |
| Multi-view impostor texture | SideFX 공식 upper hemisphere/atlas/basecolor/normal workflow | 원경 비용 절약 가능, 실제volume용depth/빛atlas는 별도제작 필요; 현재RGBAprobe는 relightable normal atlas 아님 | 방식 참고 |
| 3D detail texture | Epic 공식 Layout와Noise1/2/3분리 | macro분포 유지+detail breakup, Three기존shader에 코드이식 필요; UE에셋그대로사용한것아님 | considered only |
| 실사 사진 alpha | 사용자 사진 및 공개자료 | 실제 섬유결 장점, 배경·지형·원근·고정빛 분리 어렵고 인계상한 존재 | 이번 첫샘플 미시험 |

### 공식 자료

- [JangaFX Free VDB — Cloud Pack](https://jangafx.com/software/embergen/download/free-vdb-animations): 현재 공식 목록10 variations. 로컬 `verification/a-cloud-vdb-20261006/acquisition.json` 및 원본SHA 대조. 공개자료/시안용 사용단계 유지.
- [SideFX Labs Impostor Baker](https://www.sidefx.com/docs/houdini/nodes/sop/labs--impostor_baker-1.0.html): upper hemisphere·capture frames·resolution·basecolor/normal 출력. 이전 `Labs Impostor Texture`는 deprecated이므로 현재도구와 구별. 실제 Houdini를 설치하거나 실행한 것은 아님.
- [Epic Volumetric Cloud Material](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-material-in-unreal-engine): layout과 shape/detail noise 조절 분리. Noise3는 세부 breakup을 추가. 추가 noise가 현재 사진품질을 자동 보장한다는 근거는 아님.
- [JangaFX 50 Clouds Volume1](https://jangafx.com/marketplace/presets/50-clouds-volume-1): editable preset 후보; 신규원본도입은 미실행.

## 이번 샘플 규격

`scripts/assets/render-cloud-texture-probes.py`: cloud01/06, camera elevation65°와06의35°, ortho scale10, 동일sun15°/energy6/sky.08. Cycles96samples/6volume bounces/step.35/OptiX/denoising/AgX, 투명RGBA2048². alpha로 깔끔한edge를 보존하며 arbitrary blur/sharpen/postBloom 없이 originalvolume 자체를 렌더한다. 원본측정날씨아님; normalized asset preview. density/normal/depth 별도atlas는 이번에 생성하지 않았다.

## 화면 적용 세부 작업과 통과 기준

1. **에셋 결 gate**: 같은샘플을 전체크기/100%crop으로 평가. 작은 lobes·찢긴 edge·얇은부분이 보여야 하고, denoiser가이를지우면 samples/step/원본부터대조. 큰양감만좋은것은통과아님.
2. **국소 패치**: 60–100km weather patch에 작은 여러원본을 불규칙배치, 회전·크기variation/큰빈틈유지. target weather footprint 안 일부에만밀도. 단일 구름을그폭으로늘리는것금지. 배치는 아직제작전규격.
3. **광학정합**: 현재sun15/방위0 기준beauty/multipleviews를맞추고 opaque프레임RGB의tone mapping/alpha색공간정합. atlas고정빛이태양이동을지원한다는주장금지. dynamiclight필요시 density/light basis로분리.
4. **6구도**: p.1584/.18/.20/.215/.2278/.235 기존/선명층같은camera대조, texture도입부opacity가아닌거리별projectedfootprint에기여를연속조절. 새구름popping/동그란patch윤곽/중복흰색누적없음.
5. **정역/GPU**: subpixelmip와premultipliedalpha, viewframe교체의ghosting검토. 정착PASS를motionPASS로확대하지않는다.
6. **near인계**: 동일cloud원본volume와지형을유지. sheet옆면이납작해지는구간전에density렌더로연결. shadow추가튜닝은사용자보류유지/서고KEEP.

## 비용 계산과 미측정

2K RGBA8 한장 GPU원본16MiB, 완전mip chain 명목21.33MiB. 세장을동시에상주시 약64MiB(드라이버/RT/압축제외). PNG파일용량≠GPU메모리. 이것은계산예산이며 이번offline샘플의실시간GPU성능측정이아니다. BC7/ASTC/Basis압축·residentview수제한은후속비교후채택. 원경전체volume추가보다몇군집atlas가저렴할가능성은있지만실제추가frame시간은미측정.

## 범위

이번새원본시험은실제cloud-lab코드를변경하지않는다. 사용자텍스처피드백을직접반영한asset-leveltrial이며, 완성된지구구름/공식reference품질달성/사용자피드백횟수reset으로취급하지않는다. 후속은sample결과→국소패치적용6구도/정역motion이며, 기존S1지도경계·near통합·서고연결미완과구름실패2/2/fallback보존.

## 최종 원본 시험 관찰

3장 native2048²/alpha0–255 검증. cloud01/06의 작은 lobes와 골은 현재위성층보다읽히지만, 가장자리grain/중간면denoise와짙은그늘이남아TUNE다. 사진의섬유결품질을완전히확보했다는결론은아니다.65°/35°는같은06원본관찰각도샘플이며검증된impostorframeinterpolation은아직없다. sourcehash와offline시간은manifest에보존. live코드변경·신규runtime성능검증없음.
