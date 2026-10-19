# 서고 빛 커튼 — 조사·설계 검증 범위

판정: **조사·설계 완료 / 새 효과 런타임·미감·성능 확인 안 함**. 2026-10-19, branch `claude/archive-light-r7-ag2rja`, source baseline `fe402dc48b1c2308f301d93513ac6f9c341c2a11`.

- [구현 설계](../../docs/uiux_system/rounds/R1/PLAN-R1-ARCHIVE-VOLUMETRIC-20261019.md)
- [REF-016 효과 카드](../../docs/uiux_system/references/REF-016_SHADOW_MARCHED_SUN_SHAFTS.md)
- [D-148](../../docs/uiux_system/records/D_DECISIONS.md)

## 확인한 값·근거

| 항목 | 값 | 확인 종류 |
|---|---|---|
| 외부 HTTP 요청 | 11/11 HTTP200 | README·shader·LICENSE·package·공식데모·NVIDIA·Epic·forum JSON 메타데이터; 렌더 검증 아님 |
| upstream source SHA | `70ad1c41c78796637064b3bb9246be08e81ee777`, v0.12.1 | Git/source 고정 |
| three-good-godrays peer Three | ≥0.125 ≤0.182 | npm metadata/원문 package.json |
| postprocessing 6.39.5 peer Three | ≥0.168 <0.187 | npm metadata |
| 프로젝트 Three | 0.186.0 | installed package + lockfile |
| 기존 Story 볼륨 | 48 steps / max9 m / g0.55 / density0.05 / raw depth2048² | archive.ts의 상수; 현행 study 런타임 측정치가 아님 |
| upstream 기본 | resolutionScale0.5 / 60 steps / depth-aware upsample4 또는16 taps | index.ts·compositor.frag |
| remote 번호 조회 | 32 ref, D-148/REF-016 충돌 없음 | 명시 heads wildcard fetch 후 SHA별 canonical 기록 조회 |

`source-probe.json`에는 URL·응답 크기·sha256만 있다. 외부 원문은 `/tmp`에서 읽었고 repo에는 에셋·코드·스크린샷을 복사하지 않았다. HTTP body bytes는 장면 전체 전송량이 아니다.

remote 기본 fetch refspec이 main만 포함하고 있어 `git fetch --all`만으로 다른 tracking branch가 최신화되지 않았음을 확인했다. 이번에는 heads wildcard refspec을 명시했고 `ls-remote`로 사용자 branch HEAD도 대조했다. [번호 근거](remote-number-check.json)는 그 후의 snapshot이다. 타 브랜치 REF-011~015 사용을 발견해 REF-016을 선택했다.

## 성능 산술 — 실측 아님

1280×720/DPR1에서 full-res48단계 최대44,236,800 lookup 대비, 각 축0.25·16단계는921,600, 각 축0.5·48단계는11,059,200 lookup이다. 광원깊이 렌더·noise·공간필터·합성의 비용은 이 계산에 빠져 있다. lookup 비율을 FPS 개선율로 해석하지 않는다.

설계의 목표(실측 전): 실제 GPU/Edge에서 조작 중 p95 frame≤33.3 ms·입력→변경 frame≤100 ms, 기존 프로젝트 최종60 fps 목표 유지. 이에 맞는 품질모드·측정 방법은 계획 §7에 있다.

## 수정한 판단

- offscreen source mesh 문제는 pmndrs GodRaysEffect 사례다. three-good-godrays GodraysPass는 shadow-map raymarch로 방향광/점광을 지원한다. 이전 채팅과 2026-10-16 보고서의 혼동은 D-148/addendum에 남겼다.
- 기존 Story 코드에도 볼륨빛·noise·먼지가 있다. 이를 무시한 신규 엔진/외부 패키지 도입 대신 격리 study 적응 계획을 택했다.
- 현재 study의 방향광 한 개와 B3 bake의 near key SpotLight+sun은 같지 않다. 동등품질/조명일치로 보고하지 않는다.

## 확인 안 함

- 새 볼륨 효과 구현, 실제 B3 GLB에서 개구부·cutout·외부 caster가 만드는 깊이 검수, 모든 카메라의 빛줄기 외관.
- 공식 데모/외부 패키지 렌더 실행·전체 네트워크 비용·0.186 실제 호환성. peer 범위 차이는 동작 불가의 증명이 아니다.
- GPU/Edge/모바일 FPS·입력→실제 프레임 시간·메모리 누수·depth resolve·시간안정성.
- Cycles4.5.3와 같은 카메라/광원/매질의 렌더 비교. 새 render/bake는 실행하지 않았다.
- 현재 D-147 Pages job `39281362397`는 조회 당시 queued. 이번 설계 작업에서 새 배포를 요청하지 않았다. 공개 볼륨 페이지가 존재한다고 주장하지 않는다.

## 이번 단계 검사

- 문서·REF/D 기록 구조와 링크: 커밋 전 `npm run records:check`, `npm run playbook:check`, `git diff --check` 및 상대 링크/JSON 검사 수행.
- 검사 결과는 WORKLOG에 기록한다. 여기서 말하는 PASS는 문서/source audit 범위이며 시각·런타임 PASS가 아니다.
