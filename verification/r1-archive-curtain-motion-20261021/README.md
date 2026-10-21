# 강한 햇빛·큰 일렁임 구현 — D-152 (2026-10-21)

사용자 “구현 진행해줘”에 따른 독립 light-study 변경이다. 원본 GLB·baked preview·Story·r8/D-084·기존기본값은 보존한다. 기존 조사 문서는 `docs/uiux_system/rounds/R1/PLAN-R1-ARCHIVE-CURTAIN-MOTION-20261021.md`.

## 사용

`light-study.html?view=curtain`은 통로 정면, 방위0°/고도35°/해각지름0.53°에서 큰 일렁임을 재생한다. 동작 줄이기 환경에서는 정지한다.

- **기존 커튼**: 원래 HG g0.5·sigmaT.012/m·sigmaS.008/m, 새 cloud/density field 제외.
- **강한 햇빛**: HG g0.15·sigmaT.032/m·sigmaS.024/m·gain1.8, 현재시간의 커튼을 정지.
- **큰 일렁임**: 같은 field/설정으로 시간 재생. 햇빛색을 유지한 공간밀도띠의 domain warp이며 자체발광 오로라·curl 유체해법은 아니다.
- **커튼·흐름 조절**: 방향편차/공기농도/커튼밝기/속도계수/일렁임폭/구름대비. 흐름정지는 현재무늬를 유지한다. 공유링크는 field시간/새설정도 보관한다. 옛version1링크는 누락값을기존default로 복원한다.

큰 밀도띠의 계수는 .04+2.3×ridge⁴, 기본sway.75·flowSpeed.16·cloudContrast.55·cloudScale1.2. flowSpeed는 warp의 시간속도계수이며 유체입자의 실측m/s가 아니다. 화면UV가 아니라 world/light-space에서 평가한다. 높은고도의basis전환에서무늬가뛰지않도록새field는85°까지연속인축을쓴다.

## 측정값과 판정

Chromium/SwiftShader640×480, 정지0.5/48steps, strength1, 동일광원/동일camera/시간0의 A/B. 값은 **raw volume R 평균**으로, 전체화면 최종명도·미감점수가 아니다. 세시점의절대평균은 서로다른경로길이/물체가림을포함하므로시점끼리 직접비교하지않는다.

| 시점 | 기존 | 강한 햇빛 | 같은시점 A/B 비 |
|---|---:|---:|---:|
| 광원 반대쪽 | .01419 | .13593 | 9.58× |
| 옆 | .04038 | .05804 | 1.44× |
| 광원쪽 | .05035 | .07351 | 1.46× |

시간8의 같은정면 ROI(화면비율 x.28~.58/y.31~.76)의 luminance p10/p90 대비 `(p90-p10)/(p90+p10)`는 기존.5494 → 새.4733(약86.2% 유지), 흰색클리핑0%. ROI는 책장+기둥/그림자를포함하며 전시전체미감기준이아니다. 시각검수상 밝은띠가추가됐지만 책장대비 감소는 남는다. 사용자가 농도/밝기를 더 높이면 대비가 더 낮아질수있다.

- 흐름0~22초/2초간격12장 모두buffer hash다름, 같은8초 재생성 hash일치. 시간변화로geometry light depth 재렌더0회. 정지/재생의 무늬좌표는 동일하다.
- 실제 freeze체크: 0이아닌마지막시간 유지, 재렌더hash동일. clock suspend/hidden-style gap 후 점프없음. 새range/키보드·공유/복원·reset·옛링크·reduced-motion 검수.
- closed 천창에서 새효과radiance 최대0, open/alpha양수. 실제 물체 위치에서shadow를평가하므로밀도warp로가림좌표를굽히지않는다.
- surface/volume cloud uniforms는 같은객체. volume을끈채바닥직사에cloud시간0/20 변화가실제HDR에나타나고depth는재사용됨.75/76/77/85°field축연속성추가확인.

## 근거·실패와 보완

- `qa-result.json`: 최종gain1.8의3시점/12시간점/정지/링크/clock/reduced-motion/광학/공유uniform검사. 첫surface probe는동일hash로시간변화를검출하지못해실패했다. 이파일을전체PASS로소급표시하지않는다.
- `integration-result.json`: 실제직사바닥을바라보고cloudScale3으로변화를검사한수정probe PASS, optical/field축연속/공유uniform 재검사 PASS. 테스트대상을보이는직사면으로고쳤으며hash변화·depth재사용기준은유지했다. 최종광학/동기화관문은두기록을함께본다.
- `regression/qa-result.json`: 기존모드 optical·12고정/방위/회전·range/reset/share·출력parity·cache·quality·viewport/reduced-motion PASS. 이검사는새모드이미지품질PASS가아니다.
- `image-metrics.json`/`tuning-notes.json`: 초기gain2.4 정지후보의책장대비저하를발견해gain1.8과공통시간field로보완한기록.초기측정은탐색값이며최종관문이아니다.
- `frames/`, 3시점A/B, `flow-preview.webp`: 마지막것은2초간격12장으로조립한24초프리뷰이며실측FPS영상이아니다.

## 셰이더·후처리 / 충실도

PBR/노멀/거칠기/톤매핑/노출/PCSS/geometry는기존대로. 새surface효과는direct sun의cloud감쇠만, 매질은단일산란+투과율+HG+domainwarp+작은결. 정적rawdepth를재사용한다. 기존MSAA4와depth-aware저해상도필터/업샘플 유지, 별도bloom/DOF/temporal축적/발광ribbon은이번구현에필요하지않아넣지않음. `fidelity.md`의KEEP/TUNE/GAP참조.

## 확인 안 함

사용자의미감·구름/오로라와동등한완성도,실제Edge/GPU/FPS·모바일·터치·장기soak,실제OS숨김/bfcache복귀의장기운영,물리다중산란/CFD·실제curl속도장·자체발광오로라,Cycles/near-key일치. 강한빛에서책장대비저하가완전히없어진것은아니다. 모든각도/위치에서동일가독성을보장하지않는다.

## 재현

stage script로임시site를만들고 기존 `verification/r1-archive-volumetric-20261019/bench.html`만임시site로복사해serve한뒤 `scripts/assets/verify-archive-curtain.py`를실행한다. 검수fixture/README/JSON은public allowlist에없다. 기존회귀는 `npm run verify:archive-volume`과환경변수 ARCHIVE_VOLUME_RESULTS를쓴다.

첫probe실패의원인이camera단독인지cloud패턴범위/좌표의영향인지분리검증하지않았다.수정probe는카메라와cloudScale을함께바꿔실제직사면의시간변화를검출했다.
