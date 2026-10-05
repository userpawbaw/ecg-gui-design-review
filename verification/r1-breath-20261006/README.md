# R1 숨 — 깊은 숨 셰이프 키를 가슴 둘레 측정값에 맞춤 (D-052) — 2026-10-06

만들기: `python scripts/assets/breath-v3.py`. 출력은 `assets/source/blender-human-base-meshes/breath_deep_v3.npz`(정점별 변위, 휴지 자세 기준), `breath_girth.json`, `side_overlay.png`.

## 기준값
- 깊은 숨의 가슴 둘레 변화(줄자, 최대 들숨 − 최대 날숨, 건강한 성인)
  - 위가슴(4번째 갈비 사이): 약 5.5 cm
  - 아래가슴(칼돌기): 약 6.4 cm
  - 일반 범위는 4–7 cm이고, 나이가 들면 줄고 남성이 약 20 % 큼
  - 출처: [Chest expansion reference values](https://www.researchgate.net/publication/301712251_Chest_Expansion_and_Modified_Schober_Measurement_Values_in_a_Healthy_Adult_Population), [Reliability of chest wall expansion measurement](https://www.sciencedirect.com/science/article/abs/pii/S0161475416300860), [Reference range of chest expansion](https://ijop.net/index.php/mlu/article/download/2062/1822/3961)
- 배꼽 높이 +3.0 cm는 `[추정]`입니다(가슴·배 혼합 호흡). 줄자 정상값을 찾지 못했습니다.

## 결과

| 높이 | 날숨 둘레 | 지금 `breath` 키(조용한 숨) | 새 `breath_deep` 키 | 목표 |
|---|---|---|---|---|
| 위가슴 0.75 H | 101.3 cm | +1.47 cm | +5.50 cm | 5.5 |
| 아래가슴 0.69 H | 85.8 cm | +1.45 cm | +6.40 cm | 6.4 |
| 배꼽 0.60 H | 76.7 cm | +0.52 cm | +3.00 cm | 3.0 (추정) |

둘레는 줄자처럼 단면의 볼록 껍질 둘레로 쟀습니다. 팔은 제외했습니다(|x| < 0.175 m). 정점이 가장 많이 움직인 거리는 20.5 mm입니다(가슴 앞).

## 모양
- 몸통 축에서 바깥으로 수평으로 밉니다. 앞쪽이 주로 움직이고, 등은 앞의 0.35배입니다(벽에 기댄 자세는 등이 막힘). 위가슴은 6 mm 들립니다. 팔 쪽과 목·골반 쪽으로 갈수록 부드럽게 줄어듭니다.
- 첫 시도에서는 세 구간을 따로 부풀려 옆 윤곽이 물결쳤습니다. 지금은 높이에 따라 매끈한 하나의 진폭 곡선(PCHIP)을 씁니다.
- `side_overlay.png`: 파랑 = 날숨, 빨강 = 깊은 들숨(오른쪽에서 본 직교 투영, 앞은 화면 오른쪽).

## 남은 것 / 확인할 것
- 뼈 움직임은 아직 넣지 않았습니다: 흉추 펴짐 3–5°, 어깨 1–2 cm 올라감. 셰이프 키는 Armature보다 먼저 적용되므로, 기댄 자세에서 방향이 맞는지 포즈 상태로 다시 확인해야 합니다.
- 기존 `breath` 키(조용한 숨)는 그대로 둡니다. 깊은 숨 키는 아직 glb에 넣지 않았습니다(브리프 3에서 자세 glb에 키로 추가).
- 속도: 브리프 §8.4는 "10초에 약 3회"(분당 18회)입니다. 이는 조용한 숨의 빠르기라서, 깊은 숨을 이 속도로 하면 과호흡처럼 보입니다. 깊은 숨이면 분당 약 6회(10초에 1회)가 자연스럽습니다. 들숨:날숨 시간 비는 약 1:1.5–2입니다.
