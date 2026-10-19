# 통로 천창 추가 — D-149 (2026-10-19)

독립 light-study에 실제 천장 개구부 3개를 추가한다. 원본 GLB, bake 페이지, Story/default/r8/D-084는 변경하지 않는다.

## 배치와 사용
- world Y-up m: x[-0.35,1.45], z[0.1,0.85], [-0.8,0], [-2.25,-1.45]. 총4.23m². slab y약5.0~5.15m, 단면12개. 기존 hatch/사다리/보 보존.
- `?view=aisle`: 방위0°/고도35°, 통로 반대편에서 책장과 광선 관찰. “책장 정면 보기”로 같은 광원의 앞쪽 관찰 가능. 기존225°/35° 기본과 기존preset 유지.
- “통로 천창 3개 추가”를 끄면 원래 geometry로 돌아간다. 표면/표면 shadow/raw volume depth 모두 동기화한다. 공유 링크에 추가 상태 저장, 구형 링크도 허용한다.

## 측정·관찰
- Chromium/SwiftShader960×640, settled0.5/48steps. 산란/phase/노출/결 동일한 A/B. `qa-result.json`, [추가 전](before.png), [추가 후](after.png), [책장 정면](bookshelf-front.png).
- 각 천창 중심의 y5.45 아래0.4m ray: 닫힘 각1 hit → 열림 각0 hit. 바깥 solid(-2,-2)은 유지. plaster600→1312 triangles, 별도 단면24 triangles.
- 통로 역방향 raw volume R 평균0.027588→0.041705(+51.2%), 최대0.320557→0.421875. 화면 전체 선형 산란 측정이며 미감 점수가 아니다. 방위/시점의 영향을 없앤 수치가 아니다.
- 정면 책장에도 채광은 늘지만 역산란 광선은 약하다. 모든 방위/시점에서 동일 가독성을 보장하지 않는다.
- 절단 경계와 일치하는 정점의 재분류 오류가 solid 천장을 유실시킴을 ray 검사에서 발견해 수정했다. 이전 실패를 통과로 해석하지 않는다.
- 추가 geometry의 direct-vs-HDR 출력 비교 평균RGB오차1.276/255가 기존 ≤1 관문을 넘었다(최대70, MSAA edge 포함). 신규 형상에 대한 출력 동등성은 미통과로 남긴다. 기존 roof regression은 천창을 끈 상태로 별도 수행한다.

## 재현
저장소 staging script로 정적 site를 만든 후 `scripts/assets/verify-archive-aisle.py --url <study URL?view=aisle>` 실행. 전후 capture/ray/volume과 책장 정면 capture를 기록한다. 기존 광학/슬라이더 regression은 `npm run verify:archive-volume`.

## 회귀 검사
기존 roof로 실행한 regression/qa-result.json: optical·슬라이더·공유/복원·출력 parity·12프레임/방위/회전·cache·품질·viewport/reduced-motion PASS. 새 구멍은 별도 qa-result.json의 actual geometry A/B 검사 PASS. 기록/플레이북 검사 PASS.

## 확인 안 함
사용자 미감 승인, 실제 사용자 Edge/GPU의 FPS·터치·모바일·장기 soak, Cycles/near-key 품질 일치, 모든 방위의 책장 밝기. 이번 변경은 산란계수 증폭이나 최종 bake 교체가 아니다.

## 공개 배포
- runtime source `21fd8b9e100e0c91ce95828c4ae04424cb0d76bb`, main dispatch39299691498 success. [새 보기](https://userpawbaw.github.io/ecg-gui-design-review/light-study.html?view=aisle&v=21fd8b9).
- 첫 run39299555862는 짧은 SHA를 branch로 해석한 checkout 실패. 전체40자리 SHA로 재요청해 해결했다. 이후 dispatcher에는 전체 SHA를 사용한다.
- public-result.json / public-preview.png에 공개20files hash·HTTP·browser 입력·bake 왕복 결과를 기록한다.
