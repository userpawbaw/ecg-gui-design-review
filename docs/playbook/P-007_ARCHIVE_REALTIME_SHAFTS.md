# P-007. 서고에서 조명 방향을 바꾸며 빛줄기를 볼 때 — 광원 깊이와 시점 깊이로 공간을 적분하고, 결은 그 다음에 더한다

| | |
|---|---|
| 상태 | 잠정 |
| 언제 읽나 | 자유 카메라에서 천창 빛의 경로를 보이거나, 방위/고도 슬라이더에 볼륨 조명을 연결할 때 |
| 도달 수준 | 닫힌 천창의 산란0, 열린 천창/알파 구멍 통과, 고정12프레임 동일, 각도·시점12프레임 검수. 사용자 미감·물리 GPU 확인 대기. `verification/r1-archive-volumetric-20261019/README.md` |
| 근거 여정 | J-003 T8 |
| 강제 장치 | `scripts/assets/verify-archive-volume.mjs` — 실제 staged artifact의 depth/입력/프레임/캐시 검사 |
| 갱신 | 2026-10-19 |

## 권장 방법

1. 광원을 올리기 전에 천창 열림/닫힘/alpha cutout bench를 돌린다. 실제 GLB의 원래 개구부와 외부 caster도 ray/depth로 확인한다. 새 검증은 `npm run verify:archive-volume`으로 재현한다.
2. 비교 sampler를 쓰는 Three0.186 PCF shadow texture를 일반 sampler2D에 바로 물리지 않는다. 이 구현은 raw light-depth RT를 따로 두고 표면광과 동일한 방향/투영 범위를 공유했다.
3. camera ray를 room box·표면 깊이로 자른 뒤 단일 산란과 투과율을 함께 적분한다. 균일 농도에서 가림이 먼저 맞아야 world-space 결 noise를 켠다.
4. 광원 변경은 depth dirty, 카메라 변경은 재사용한다. 조작 중 각 축0.25/16steps, 정지0.5/48steps, 높음0.75/64steps를 비교하며 실제 GPU 시간을 따로 잰다.
5. 선형 HDR 합성 뒤 출력 변환은 한 번만 한다. effect off와 direct PBR을 비교하고 빛줄기와 material 얼룩을 혼동하지 않는다. 12장 각도/시점 캡처와 실제 이미지 변화를 검사한다.

## 도달한 품질

헤드리스 Chromium154/SwiftShader에서 외부 광원이 화면 밖인 bench도 통과했고, 실제 서고의 천창에서 갈라지는 빛 커튼을 옆 시점으로 확인했다(J-003 T8). 그림자깊이를 카메라 이동마다 다시 그리지 않는다. GPU 메모리 확인은 synthetic bench 5회 재생성의 texture 수 유지 범위다. 실제 PC의 FPS/장기 누수/원본 Cycles 품질로 확대하지 않는다.

## 틀린 길이라는 신호

- source mesh가 화면 밖이면 사라지는 GodRaysEffect 사례를 shadow-raymarch GodraysPass의 제약으로 옮기고 있다(J-003 T8).
- slider DOM 숫자만 바뀐 것을 통과로 쓰거나, 닫힌 천창에서도 빛 커튼이 그대로 보인다(J-003 T8).
- 사다리·잎 가림 누락을 grain/강도를 높여 숨기거나, 화면에 고정된 noise가 결처럼 보인다(J-003 T8).

## 적용 범위와 재검토 조건

D-147 독립 PBR study의 방향광·정적 GLB에 해당한다. 원본 B3의 near key SpotLight를 옮기면 cone/perspective depth/falloff와 광원 메타데이터가 추가로 필요하다. 실제 GPU에서 응답/그림자 경계가 기준에 못 미치면 D-148 계획의 C4 비교 또는 깊이/품질모드를 재검토한다. Story/baked 기준과 r8/D-084를 새 탐색값으로 바꾸지 않는다.

## 남은 한계

원본 간접광·key 스폿 주광·Cycles 동일 품질, 실제 사용자 Edge/GPU·모바일 속도, 장기 soak는 확인 안 함이다. 현재 미세 결은 정지 world-space 매질 근사이며 구름의 유체 시뮬레이션이 아니다. 기본 225°/35°에서는 천창 beam이 거의 없어 별도 ‘빛결 옆에서 보기’ 프리셋으로 확인한다.

### T9 후속 관찰 — 잠정
사용자 피드백으로 옆 시점 통과만으로 책장 방향의 가독성을 보장하지 않음을 확인했다. D-149는 통로 천창 3개와 반대/정면 관찰 시점을 추가한다. 천장 절단은 개구부 중심뿐 아니라 바깥 solid 위치도 ray 검증한다. 산란 계수/phase는 유지하므로 정면 역산란의 약함과 사용자 미감 미확인은 남는다. `verification/r1-archive-aisle-apertures-20261019/README.md`.

### T10 후속 관찰 — 잠정
D-150/J-003 T10은 고정PCF/이진depth로 반그림자가 약했던 문제를 유한태양 각지름과 가림-받음 거리로 분리했다. 창을 키우는 것과 해의 각크기는 별개다. 0.53°bench에서0.15m가림은subpixel,3m가림은5px로 관측했다. rawdepth를 거리로 복원하는surfacePCSS와4tapvolume근사를 도입하되, offset15mm 접촉부손실/얇은caster/성능을 무검증의 일반규약으로 확대하지 않는다. `verification/r1-archive-window-penumbra-20261020/README.md`.

### T11 조사 — 구현 전 가설
D-152/J-003 T11에서 HG g.5 위상항의 최대시점비27과 frozen기본/3.33mm/s noise이동을 확인했다. 광원밖시점 가독성과 큰흐름은 강도만 높이는 문제로 합치지 않는다. 넓은위상 후보/광학두께·beamgain과 공통cloudmask·공간밀도흐름을 분리해 비교하도록 설계했다. 새이미지/3시점/시간프레임/성능 개선은 미검증이므로 검증된 권장값으로 승격하지 않는다. `verification/r1-archive-curtain-design-20261021/README.md`.
