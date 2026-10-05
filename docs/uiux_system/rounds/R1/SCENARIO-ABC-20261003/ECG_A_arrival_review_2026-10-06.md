# A-P2 지구→궤도→구름→고정 서고 실제 제작

2026-10-06 · D-069 · 구현/짧은 runtime PASS, **새 전이 전체 TUNE / 사용자 시각 확인 전**. A-P1의 서고 빛·소품 KEEP은 유지한다.

## 1. 제작한 장면

| 전체 p | 화면과 구도 | 연결 |
|---|---|---|
| 0–.10 | 지구를 우하단 크게 잘라 배치, 좌측 ‘심전도 잡음 제거’. 남미/남극 방향을 향함. 대륙 texture·지형 displacement/bump, 독립 구름 shell, 대기 rim | 아직 사람을 투시하지 않음. 느린 idle 회전, marker는 연출상 목적지이며 실제 측정 위치 아님 |
| .10–.25 | 카메라4D 아닌 실제3D 접근/각도·roll 변화, 태양이 후면으로 이동하며 역광·지평선 강조. 작은 목적지 고리가 사라짐 | REF-001의 역광/회전 원리를 A의 거리 축소 흐름에 적용 |
| .25–.32 | 가까운 procedural cloud가 화면을 채움 | .315–.335에서 완전 가림. .32에서 planet scene→archive scene 편집 |
| .32–.42 | 구름이 걷히며 동일 archive의 앞쪽 높은 창으로 접근 | 외부 벽/천장/창은 같은 GLB. 새 서고/별도 방을 생성하지 않음 |
| .42–.46 | x=-3.6, y=4.575, z=3.58의 고창 빈 쪽을 통과. central mullion을 피하는 offset | Blender WIN centre=-3.8m → Web z=+3.8m. 창 높이3.45–4.7m. 밖의 밝기는 낮추고 통과 뒤 내부 bake/exposure 회복 |
| .46–.55 | 창 안쪽→앞 통로→기존 A-P1 시작 카메라(0,3.3,4.6) | 초기 시도에서 발생한 뒤쪽창 진입/큰 방향반전을 앞쪽창 경로로 보완 |
| .55–1 | 기존 사다리 발견→등→측면→심장/혼합 ECG | roomP=(p-.55)/.45로 이전 A-P1 경로 유지. 처리/출력 A-P3는 아직 추가하지 않음 |

단일 물리 좌표계에서 지구 표면부터 건물까지 내려오는 GIS 줌이 아니다. 구름이 완전히 가리는 동안 거리 단위를 편집하는 Powers-of-Ten식 시각 연결이다. 지형 높이도 연출용 과장이다.

## 2. 자산·컴포넌트 검토

- 색상: NASA July2004 Blue Marble 원본5400×2700→4096×2048 WebP, 약1.026MB.
- 높이: NASA/GEBCO 5400×2700→4096×2048 grayscale lossless WebP, 약.891MB. 실제원본은0–6400m 범위를 설명하지만 runtime displacement는 sphere radius의.032로 과장한다.
- Night/cloud: 기존 registry의 NASA Black Marble/combined clouds2048 재사용. cloud shell반지름1.044가 terrain최대1.032보다 커서 terrain과 교차하지 않게 보완.
- 로컬manifest와 assets/registry에 source/변환hash·크기·출처 고정. fetch.mjs가 이미지 변환물을 source복사로 덮지 않도록 processed=null, generated에변환파일명/hash기록. 변환은 prepare-a-earth.py의 별도재현 경로. 기존해시가 있으면 source불일치에실패한다.
- explore.mjs texture 검색은 catalog에서16x16-africa만 반환하여 부적합. NASA는 공식페이지의직접파일링크로 추가조사/선택했다. 자동탐색으로NASA까지찾았다고주장하지않음. 로그파일의2026-10-05는UTC기준, 이보고서는KST6일.
- C1: 주효과 실시간 WebGL/기존 Three r186. C2: 기존globe 그대로/고해상도지형globe/AI영상 비교(D069). C3: 고정창/카메라/scroll역재생 때문에 vanilla Three 선택. 외부 UI 라이브러리/코드/모델 추가 없음. REF-001 사이트 원본 코드를 복사하지 않음.

근거: [NASA Blue Marble](https://visibleearth.nasa.gov/images/74092), [NASA Topography](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/), 기존 REF-001 효과카드. 지금 reference 사이트를 새로 직접촬영했다고 주장하지 않는다.

## 3. 빛/후처리

- 지구: PBR map/displacement/bump, directional+ambient, 야간 emission, 별도cloud shell, additive atmosphere. ocean특화roughness/specularmap와물리적인cloud shadow는이번에없음. 재질과대기층은있으나완전한행성물리렌더는아님.
- 구름: 24sample procedural3D density 적분과색/투과 합성. 실제weather 데이터나지구cloud이미지의연속기상관측이라고표시하지않음.
- archive: geometry/텍스처/bake/소품고정. 외부만uExposure.35→1.3, volume은창안부터, 내부에서는기존AA4/96step/grain35% 그대로.
- grade는p.32–.48에서blue→warm을부드럽게전환. scene cut에서cloud색이갑자기바뀌던초기jump를보완.
- SSS/굴절/DOF/motionblur불필요. 기존MSAA4와SMAA fallback유지. 새scene cloudpass한개추가. texture디코딩일부추가메모리/초기전송은별도주의대상이며전체전송16MB상한준수를측정한것은아님.

## 4. 검증과 자체 피드백

증거: verification/a-arrival-20261006.

- 초기31→경로보완31→마지막grade/hero보완 묶음의두캡처세트각31. 모든실패/중간본보존, 최종은final-hero. 자기보완은초기룩/외부진입/최종grade·hero의3묶음이다.
- 최종runtime17캡처/3R경계/정지재생/native scroll/reduced/browser errors0 PASS. 사람·심장·신호값은기존데이터시계를사용한다.
- 전체8초3D canvas VP9영상 및디코딩12프레임. 영상에는DOM/ECG overlay가없으며 endpoint파형은whole/final-runtime캡처에서검토한다.
- RTX3070/Chromium/1920×1080/DPR1, 녹화없는8초동일경로, GPU유효query504개: p50 8.03ms/p95 10.34ms, RAF p95 16.8ms. 전시PC/Edge/600초미검증. GPU시간은composer구간이다.
- Vite build PASS(38modules). 기술PASS는wow/사용자채택판정아님.
- 직접비교: 승인T01/T02·L01을다시보고runtime과대조. 큰지구/남미·남극방향/역광/창진입/고정공간은연결됐다. T01의강한따뜻한태양flare·뚜렷한얼음relief, 구름해상도/질감은**GAP**. 같은fidelity에도달했다고주장하지않는다.
- 앞쪽창으로바꿔초기의바닥위급격한방향반전은줄었음. 기존A-P1중간높은각도는유지되어후속구도TUNE로보존한다. 전체triangle/camera충돌의수학적무충돌을보장하지않음.

## 5. 다음 피드백/제작

이번에는 실제 A-P2 전이 전체를확인한다: 지구의임팩트/역광, 구름에서창으로이어지는속도·개연성, 서고진입의시야. 이미KEEP된내부소품재승인은요청하지않는다. A-P2피드백후A-P3의처리막/출력및의자인계로진행한다. B/C후속보류유지.

해당씬의새아이디어(미채택): 구름의밝은가장자리가창빛방향과맞아떨어지는match cut을강화하거나, 구름이걷힐때ECG기록물의격자가잠깐공간깊이를드러내게할수있다. 후자는실제입력→처리→출력의미가등장하는A-P3에서기기격자→공간그래프로연결해검토한다. waveform/transition구상을전체제작끝으로미루지않는다.

## 6. 실행

```
npm run spike -- a-climb
```
기본4198은이제전체지구→서고장면. ?stage=room은이전A-P1만재현한다. ?stage=full은전체를명시. 기존aa/steps/grain/scale/reduced진단인자유지. npm run qa:arrival은31캡처, 기존npm run qa는기본전체장면runtime검증이다.

## 7. 사용자 피드백 반영

2026-10-06 최신 A-P2 피드백(F-040/D-070): flare/얼음 relief/구름 디테일 보완에 동의, 빛이 없는 듯한 시각 품질 TUNE. [보완 계획](ECG_A_arrival_feedback_2026-10-06.md)을 먼저 읽는다. 다음 A-P2 광원·재질→역광/후처리→구름/고창 접합 완성→사용자 피드백, 이후 A-P3. D-068 서고 빛·소품 KEEP 유지. 이번은 문서 갱신이며 새 렌더/QA는 수행하지 않았다.
