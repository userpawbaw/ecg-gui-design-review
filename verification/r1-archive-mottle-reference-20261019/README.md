# 서고 공개 미리보기 얼룩 진단 — 2026-10-19

## 목적과 조건

사용자가 공개 Pages 화면에서 선반·벽·바닥의 얼룩 무늬를 지적했다. 이 확인은 조명 bake와 표면 albedo를 분리하기 위한 진단이며, 공개 사이트나 Story 에셋을 수정하지 않았다.

- Blender 4.5.3 / Cycles CPU, D-145/B3 선택값, 기존 Poly Haven 에셋, `TEX_KEEP=0.15`, 1280×720 정면 시점(2.0m, 수직 FOV 32°)으로 저비용 기준 still을 재생성했다. 이 캡처는 bake·웹 GLB와 다른 조합이지만 같은 B3 builder/light recipe의 재질 외관 확인용이다: [`reference-p3-z20.png`](reference-p3-z20.png). 32 samples, 2분 56초.
- 공개 GLB를 로컬에서 동일한 Three.js shader/camera로 열어 아래 1280×720 비교를 만들었다. 기하·카메라·baked lightmap은 고정하고 재질 입력만 바꿨다.

## 비교

| 캡처 | 바꾼 항목 | 관찰 |
|---|---|---|
| [현재 재질 + baked light](comparison/current.png) | 변경 없음 | 목재·석고·마루의 색상 무늬와 bake 명암이 함께 보인다. |
| [중성 albedo + 같은 baked light](comparison/flat-albedo.png) | diffuse map과 base color를 흰색으로 중성화 | 얼룩 무늬가 크게 사라지고 조명 분포/그림자는 남는다. 색까지 중성화했으므로 미술 결과물로 승인한 캡처는 아니다. |
| [현재 albedo + shell lightmap 제외](comparison/no-lightmap.png) | shell lightmap을 상수 조명으로 대체 | 목재/마루 표면 무늬가 남고, 공간의 베이크 명암과 그림자는 사라진다. |

## 판단

공개 셰이더는 diffuse `source.map` × 재질 색 × baked light를 곱한다. B3 builder는 ash 목재와 벽 텍스처를 `TEX_KEEP=0.15`로 대부분 평탄화하지만 15%를 남기고, 바닥 마루는 텍스처를 40% 남긴다. 실제 A/B에서 같은 baked light를 두고 diffuse albedo만 중성화했을 때 얼룩이 크게 줄었고, lightmap을 제외해도 albedo 패턴은 유지됐다. **따라서 화면에서 보인 얼룩의 주원인은 bake 실패보다 유지된 diffuse 재질 텍스처**다. 바닥의 반복 결은 herringbone parquet albedo에서 오며, 선반/기둥의 불규칙한 결은 ash/walnut veneer 계열 albedo에서 온다. Baked light는 그 표면 위에 별도의 밝기·그림자를 더한다.

추가로 공개 lightmap은 2048² lossless bake를 WebP q92로 변환했고 원본 PNG는 현재 검수 경로에 남아 있지 않다. 따라서 q92의 기여도와 128-sample bake noise 기여도는 이번 A/B에서 분리 측정하지 않았다. 브라우저 status의 `1 lightmaps`와 HTTP 200은 로드/적용 증거이지 깨끗한 외관의 증거가 아니다.

## 다음 선택지 및 확인 안 함

- 서고 검수용 material 방향은 diffuse 텍스처를 제거하고 자체 색상/약한 저주파 grain을 쓰는 쪽이 유력하다. 마루 무늬를 남길지, 목재를 얼마나 평탄화할지는 시각 방향 선택이므로 사용자 승인 전에는 공개 미리보기 재질을 바꾸지 않는다. 채택 시 먼저 선택을 D 기록하고 같은 캡처·지표로 다시 확인한다.
- 정확한 텍스처 기여율, 여러 UV 섬의별 비교, lossless PNG 대 WebP q92, 128 대 고샘플 bake noise, 실기기/GPU에서의 최종 외관은 확인 안 함이다.
- Story-owned files/assets/defaults, r8 및 D-084 값, 공개 Pages artifact는 변경하지 않았다.
