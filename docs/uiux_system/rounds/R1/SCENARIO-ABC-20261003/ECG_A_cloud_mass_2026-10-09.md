# D121 · 확대 구름의 높이와 광학 보완

2026-10-09 / IMPLEMENTATION·RESEARCH / CASE-007 / D120 후속.

사용자: “네 말대로 좀 납작하게 보이긴 하네. 보완 진행해줘.”

## 구현 전 선택

1. 법선 gain만 증가: 실제 높이/시차가 없고 거친 각인 질감을 만들므로 제외.
2. 전역 고밀도 volume: 기존 위성 분포를 잃거나 비용/노이즈가 증가할 위험; 가까운 Takram 인계는 후속으로 유지.
3. 같은 footprint의 높이 표면과 광원 가림: 우선 대조. 위성 luminance를 연출용 height에 매핑하여 높은 군집/낮은 가장자리, 안정된 픽셀 footprint 필터와 같은 태양의 내부 가림을 적용.

이는 실제 높이 데이터나 완전한 participating-medium/multiple-scattering volume가 아니다. 높이 표면은 궤도/지역 확대 구도용이며 구름 내부 통과는 별도 Takram 단계로 남긴다.

## 기준 자료와 번역

- Takram 저자 README https://github.com/takram-design-engineering/three-geospatial/blob/main/packages/clouds/README.md : shape/weather 분리, 고도/높이, cloud resolve를 통한 시간 업스케일, 광학 chain. 현재 설치판은 기존 pinned version 유지.
- Guerrilla SIGGRAPH2015 https://advances.realtimerendering.com/s2015/The%20Real-time%20Volumetric%20Cloudscapes%20of%20Horizon%20-%20Zero%20Dawn%20-%20ARTR.pdf : Beer extinction/광선방향 샘플. 이번에는 height-field 내부 가림에 한정한 근사로 번역; 원본 전체 volume 구현이라고 하지 않는다.

## 변경 계약과 통과 기준

D120 near source centre와 .07 양, DEM1.5, sun/camera 유지. 기존 proxy/높이 표면을 p.18/.235에서 대조한다. 같은 구름 위치가 유지되고 구멍과 지형 읽힘을 보존해야 한다. 고주파 돌/플라스틱 질감, 단단한 경계, flicker, GPU 급증이면 TUNE/되돌림. 실제 8초 이동도 확인하고 짧은 표본을 전체 성능 보장으로 쓰지 않는다. near 지형 그림자 보류·S1 seam·서고 KEEP·기존2/2 및 fallback 결정을 유지한다.


## 결과
4대조캡처와 자동8초영상: verification/a-cloud-mass-20261009/manifest.json. 첫 trial은 작은 군집까지 부풀어 보여 높이threshold .48-coverage/.94, alpha 기존동일로 보정. 양감·명암은 늘었으나 매끈한 둥근 표면 TUNE; 실제 volume/내부통과/ground shadow/전체 연결 미완. Vite82 modules PASS, shader error 없음. 짧은 GPU 표본/자동경로만 검증.
