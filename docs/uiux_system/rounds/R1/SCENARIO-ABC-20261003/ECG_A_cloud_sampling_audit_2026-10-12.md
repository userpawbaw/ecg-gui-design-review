# 동일 구름의 sampling / denoise 대조 · D130

2026-10-12 · F095/D130 · 첫 단계 asset 진단. 현재 북유럽 web 화면은 변경하지 않는다.

## 권장

이번 진단에서는 **기존 step .35 + denoise ON을 후속 조형 비교의 기준**으로 유지한다. 작은 step/denoise OFF만으로 사진처럼 가는 섬유 결을 확보했다고 판단하지 않는다. 다음은 동일 큰 형태 안에서 작은 billow/wisp density결을 실제로 만드는 시험이다. 원본이나 조명이 흐릿함에 기여하는 정확한 비중은 아직 미확정이다.

## 통제 조건

- 실제 JangaFX cloud06 VDB, 동일 source SHA / density1 / anisotropy.35 / 색(.98,.99,1).
- Cycles4.5.3 LTS, OptiX GPU, volume bounces6, 태양15°/energy6, sky.08, camera65°.
- 동일 seed7, PNG RGBA8 / AgX / film transparent. normalized 큰 축7.
- 1024² / ortho5 중심 구도: D128의2048²/ortho10과 pixel scale은 같지만 전체 cloud footprint는 다르다. 이전 full 샘플과 동일구도 before/after로 간주하지 않는다.
- `.35/.175` step rate × denoise OFF/ON 네 조건. 광원/형태/노출/색은 고정.
- **96은 최대 sample 수**다. 동일 설치본 factory readback은 adaptive=true/threshold≈.01, denoiser OPENIMAGEDENOISE. 픽셀별 고정96 또는 동일 noisy buffer를 두 출력으로 필터한 시험이라고 주장하지 않는다. 별도 `factory-settings.json`과 로그를 보존한다.
- `scripts/assets/render-cloud-texture-probes.py --sampling-audit`로 실행. 최종 script는 adaptive/denoiser를 manifest에도 기록하도록 보완했지만 이번 실행 시작 이후 보완이라 실제 기록에는 별도 factory readback을 사용한다.

## 관찰 [native 정지 이미지]

1. OFF에는 밝은 면과 어두운 면 모두 입자 노이즈가 많이 남는다. 이 점을 미세 구름결로 채택하지 않는다.
2. ON은 입자를 크게 줄이고 큰 돌기/골을 유지한다. 일부 작은 결이 더 매끈해지는 모습은 있으나 넓은 면의 softness는 OFF에도 남는다. 따라서 denoise만이 원인이라는 해석은 지지하지 않는다.
3. 간격을 절반으로 줄인 OFF에서도 큰 외곽과 돌기 구조의 변화는 작다. 비슷한 부드러운 면이 유지되며 사진같은 가는 섬유는 충분히 드러나지 않는다. 원본 density결 보완/다른 source 대조가 필요하다.
4. 작은 step이 모든 뷰에서 필요 없다는 결론은 아니다. 더 작은 신규 density feature를 만들면 최소 feature에 맞춰 재검토해야 한다.
5. 투명 경계의 입자/흰 테두리와 고정빛의 회색 면도 TUNE. 현재 지형 조명/지도 경계/실시간 TAA 문제의 원인을 이 offline 시험으로 확정하지 않는다.

## 증거와 보는 방법

[4조건 비교 페이지](../../../../../verification/a-cloud-sampling-20261012/gallery.html). 위: step.35, 아래:.175. 왼쪽:OFF, 오른쪽:ON. 동일 위치384² crop은 확대 보간 없이 표시한다. 이미지 클릭 시 native1024² 파일을 연다. `manifest.json`은 source/image SHA 및 실제 렌더 시간, `validation.json`은 파일/크기/hash 검사다.

렌더 시간은 아래 실행 완료 표로 기록하며 **웹 frame time/VRAM/전시 PC 성능은 미측정**이다. OFF/ON 영상이나 스크롤 proof도 없다.

## 다음 단계와 기준

큰 envelope/빈틈/동일 source 규모를 유지하며 기존 density / 작은 billowy 침식 / 낮은 밀도 외곽의 wispy결 3후보를 비교한다. 밝은 윗면의 작은 돌기와 골, 끊어진 외곽이 보이고 입자 noise나 단단한 돌 형태를 강화하지 않아야 통과. 소스 결이 통과한 다음 실제 확대 경로의 국소 patch와 같은 공간 LOD에 연결한다.

이번은 첫 sampling 진단 완료이며 새 density제작/실제web통합 완료가 아니다. near그림자 사용자보류/서고KEEP/구름실패2/2/fallback을 유지한다.

## 공식 설정 설명

[Blender Cycles Sampling](https://docs.blender.org/manual/en/4.2/render/cycles/render_settings/sampling.html): adaptive sampling은 노이즈가 낮은 영역의 샘플을 줄인다. 이 자료는 설정 의미 확인용 4.2 LTS 문서이며 실제 실행본은4.5.3 LTS readback이다. 모든 픽셀이96개라는 오해를 피한다. 세부 결 목표의 시각 판단은 위 native 이미지에 근거한다.

## 실행 완료 시간

| step rate | denoise | offline 초 |
|---|---|---|
| 0.35 | OFF | 158.46 |
| 0.35 | ON | 165.01 |
| 0.175 | OFF | 301.52 |
| 0.175 | ON | 306.0 |
