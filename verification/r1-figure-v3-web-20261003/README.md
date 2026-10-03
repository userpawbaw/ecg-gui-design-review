# 브리프 2 — 사람 v3 · 3전극 · 흐르는 점선 웹 연결 (2026-10-03)

브리프: `docs/uiux_system/handoffs/IMPL_BRIEF_FIGURE_V3_WEB_2026-10-03.md` · 작업 브랜치 `claude/r1-autopilot-impl-3d1b78`(기준 `origin/claude/r1-autopilot-recommended` 0783c45)
§−1 판단: 브리프 1 세션은 시작되지 않음(사용자 확인) → 이 세션이 **A단계(브리프 1 T1–T9)** 를 먼저 하고 B·C단계로 이어감.

환경: Windows 11 로컬, 빌드본(`node scripts/serve-v2.cjs`, :4173), Playwright 1.63 Chromium 헤드리스 + **SwiftShader(CPU 래스터)**. 프레임 시간은 참고용이며 전시 PC GPU 수치가 아니다.
캡처: `cap.mjs`(브리프의 `capture.mjs`와 같은 경로 — `window.__intro`로 p·t 고정, Windows 경로·로딩 시간·콘솔 오류·프레임 시간 추가, `HIDEUI=1`은 WebGL 층만, `TUNE`은 조정값 주입). 수치: `stats.py`(다락방 보고 §3 방법: 평균 밝기, p5/p50/p95, 채도, 난색 R−B). 시트: `sheet.py`.
A단계 캡처는 **옛 서고 에셋(벽 콘센트 배치)** 과 v2 사람(H3b)으로 찍었다 — 브리프 2 §3 A단계 허용. 다시 굽기는 B1에서 한 번.

## 요약

| 단계 | 판정 |
|---|---|
| A (브리프 1 T1–T9) | T1·T2·T3·T4·T8·T9 PASS, T5·T6 CONDITIONAL(아래), T7 기록 — 커밋 98cba13 |
| B1 서고 다시 굽기 | PASS |
| B2 rig 내보내기 | PASS |
| C1–C6 | C1·C3·C4·C5 PASS, C2 CONDITIONAL(정지 렌더와 남은 차이 표), C6 PASS(조건 메모) |

## A단계 — 브리프 1 T1–T9

| # | 판정 | 근거 | 메모 |
|---|---|---|---|
| T1 불러오기 | PASS | `frames/A2-arch.json` | 준비까지 1.3–2.2 s(로컬 서버). 서고 에셋 합계 10.3 MB(archive.glb 9.8 + light_shell.webp 0.5) + v2 사람 2.3 MB. 콘솔 오류 1건 = `replay/manifest.json` 404 — 실험실(Lab) 재생 청크 자료가 이 PC에 없음(모델 추론 생성물, 저장소 밖). 도입부와 무관, `?look=v2`에서도 같음 |
| T2 카메라 경로 | PASS | `A_intro12_sheet.jpg`, `T3_stills_vs_web.jpg` | `?shot=s1…s4`로 정지 렌더와 같은 카메라를 찍어 구도 일치 확인(통로 소실점, 서가 끝면 시차, 사다리 위 사람). 12장에서 급한 꺾임·벽 관통 없음 |
| T3 밝기·색 | PASS(조건 메모) | 아래 수치 표, `T3_round0_before.jpg`, `T3_stills_vs_web.jpg` | 0회차 웹은 평균 밝기 절반·그늘 뭉갬·과포화. 원인 ① 정지 렌더의 균일 안개(그늘을 들어 올림)가 웹에 없음 ② ACES가 주황을 포화. 방 셰이더에 `uSat`, 빛줄기 패스에 방 공기 안개 `uHaze/uHazeCol`(정지 렌더 부피 흉내)을 넣고 `uExposure`와 함께 3회 조정. **3회차 뒤 T4 버그(빛줄기 0)를 고쳐 빛이 더해졌으므로 재측정 1회 추가**(4회차) — 규칙 3회를 넘긴 이유 명시 |
| T4 빛줄기·먼지 | PASS(버그 수정) | `T4_shafts_fixed.jpg`, `A_intro12_sheet.jpg` p .41–.53 | **버그: `renderSunDepth()`가 한 번도 호출되지 않아** 해 깊이 지도가 비어 빛줄기·먼지·고리 햇빛 반응이 모두 0이었음(밀도를 바꿔도 수치 동일로 발견). 서고를 장면에 넣은 직후 한 번 그리도록 수정 → 블라인드 살 모양 갈래 빛이 통로를 가로지름. 최종 `uDensity .05`, `uIntensity 1.8` |
| T5 사람 | CONDITIONAL | `A_intro12_sheet.jpg` p .49–.62 | 스캔 등장·고리 팔다리 감김·거리 밀도·심장 박동 정상. 단 버그 수정 후 햇빛 갈래 안 고리(`1+1.6*lit`)가 가산 혼합으로 하얗게 타고 무릎에 밝은 덩어리. H3b 몸은 C1·C2에서 v3 + H5로 교체되므로 그쪽에서 처리 |
| T6 전환 | CONDITIONAL | `A_transitions_sheet.jpg` | 서고→심장(p .64–.73 서고 12 %로 어두워짐)→파형 무대 정상. **p ≈ .245–.255 지구가 사라지고 서고가 들어오기 전 짧게 거의 검은 화면** — SPACE §3의 .22–.28(지붕 고창 통과)은 P3 하강 구간이라 이번에 만들지 않음(범위 밖, RETURN 참고). 번쩍임 없음. 파형 무대 코드 미변경(G1) |
| T7 성능 | 기록 | 아래 | SwiftShader 1600×900, p .45/.53: 빛줄기 켬 1.10/1.01 s, 빛줄기 끔 0.49/0.45 s → 48단계 레이마칭이 프레임의 약 55 %. 먼지 2,600개 영향 ≈ 0. 실제 GPU 수치 아님 |
| T8 테스트 | PASS(조건 메모) | 실행 로그(아래) | 기본값 archive 상태에서 `intro.spec` 3 + `story.spec` 2 = 5 통과, 루트 `npm test` 통과, v2 단위 18/18(`chunks.test.ts`는 위 replay 자료가 없어 실행 불가 — 도입부와 무관한 환경 공백), `tsc --noEmit` 통과 |
| T9 기본값 | PASS | `IntroShell.tsx`, `introStage.ts` | 기본값 archive, `?look=v2`(격자)·`?look=v1` 유지 |

### T3 수치 (0–255, 1600×900 → 640×360 축소 후)

| 장면 | 정지 렌더 평균 · p5/p50/p95 · 채도 · 난색 | 웹 0회차 | 웹 3회차(빛줄기 버그 상태) | **웹 최종(빛줄기 수정 후)** |
|---|---|---|---|---|
| s1_top | 77.4 · 45/71/121 · .637 · 71.1 | 35.5 · 2/26/101 · .852 · 60.9 | 78.8 · 34/69/138 · .617 · 70.6 | **80.6 · 31/64/147 · .634 · 72.9** |
| s2_beams | 73.7 · 40/66/120 · .556 · 56.6 | 34.5 · 1/20/102 · .780 · 49.8 | 78.5 · 32/68/140 · .569 · 62.4 | **73.6 · 24/66/139 · .591 · 61.2** |
| s3_aisle | 66.6 · 32/62/115 · .571 · 52.2 | 29.6 · 1/17/86 · .758 · 42.7 | 74.7 · 26/63/160 · .577 · 59.4 | **89.0 · 29/81/180 · .590 · 69.1** |
| s4_person | 58.4 · 28/49/113 · .582 · 43.7 | 22.9 · 0/10/82 · .756 · 29.9 | 46.4 · 19/34/110 · .594 · 39.7 | **69.4 · 23/60/169 · .606 · 54.8** |

조정값: 0회차 `uExposure 1.0`, 안개 없음 → 1회차 1.7 / 채도 .8 / 안개 .07(과보정) → 2회차 1.35 / .85 / .03 → 3회차 1.45 / .72 / .03 → **최종 1.3 / .72 / .018, 빛줄기 세기 1.8**.
s3·s4가 정지 렌더보다 밝은 것은 웹의 실제 빛줄기가 통로·사람을 비추기 때문(정지 렌더는 빛줄기 대신 균일 안개라 README 자체 검토에서 "갈래 약함"으로 판정됨). s1·s2는 ±5 이내. 그늘 p5는 정지 렌더보다 여전히 낮음(웹이 더 대비가 큼).

### 코드 변경 (A단계)
- `introStage.ts`: `arch.renderSunDepth(renderer)` 호출(버그 수정), 기본값 archive, 확인용 `?shot=<manifest 샷>`(카메라를 정지 렌더 샷으로 고정, 서고 완전 표시 — 검증용), 엔진 반환에 `arch`(캡처 조정용).
- `archive.ts`: 방 셰이더 `uSat`, 빛줄기 패스 방 공기 안개 `uHaze/uHazeCol`, 노출·빛줄기 세기 조정.
- `IntroShell.tsx`: 기본값 archive, `?shot=`, `__intro.arch`.

## B단계 — 에셋

도구(사용자 허가 2026-10-03): Python 3.11.9(`py install 3.11`) + 저장소 밖 가상환경에 PyPI `bpy==4.5.3`·`imageio-ffmpeg`, Poly Haven CC0 원본 15종을 registry 기준으로 내려받아 **sha256 15/15 일치**(assets/source/, 저장소 밖). `scripts/assets/fetch.mjs`는 Windows에서 앞 단계(`npx` spawn, shell 없음)로 멈춰 쓰지 않았고, 같은 Poly Haven 분기를 스크래치 스크립트로 해당 slug만 실행(파일별 md5 = API, 원본 sha256 = registry).

| # | 판정 | 근거 | 메모 |
|---|---|---|---|
| B1 다시 굽기 | PASS | `assets/archive/*`, manifest | `build_archive.py --bake … --size 2048 --bsamples 128 --fig v3`(이 PC CPU 약 5분: shell 224 s, books 20 s, decor 48 s) → `package-archive.py` → 복사. **합계 10.38 MB**(glb 9.84 + webp 0.54) ≤ 12 MB. manifest `figure.location` x 0.5499 → **0.6299**(사다리 가운데), 심장·`heart_q`·`hand_r` v3 값, 샷 s6 갱신·**s7_chest 추가**. counts·room·sun·lm_scale 불변. **`--bake`의 RIG_PREFIX 삭제 실행 검증**: v3 장면의 rig 19개(El_ 12, Lead_ 3, LeadYoke, TrunkCable, CommCable, **PowerCable**)가 삭제되고 glb 노드는 `Archive_shell/decor/books` 3개뿐. **`--fig v3`가 방을 바꾸지 않음**: v2/v3로 장면만 만든 덤프(굽기 없음)에서 사람·rig 외 객체 이름·종류·정점 수·최소 좌표가 **완전히 같음**(차이 0건). 벽 콘센트 대신 바닥 멀티탭·벽 코드가 방에 구워짐 |
| B2 rig 내보내기 | PASS | `assets/rig_v3.glb`(66 KB) | `build_archive.py --fig v3 --export-rig DIR` 추가(형태 코드는 그대로: 정지 렌더의 `PowerNoise` 경로 = `PowerLine`, RA 고리 = 같은 점열, 몸속 경로 `Sig_`는 내보낼 때도 생성). 23객체 = 전극 부품 12(폼·젤·스냅·클립 ×3) + `LeadYoke` + `Lead_RA/LA/LL` + `TrunkCable` + `CommCable` + `PowerLine` + `Sig_RA/LA/LL` + `RA_noise_ring`. 재질 없음(웹이 이름으로 교체), extras `length`. meshopt: `npx @gltf-transform/cli@4 meshopt rig.glb rig.opt.glb`(175 → 66 KB). UV u(길이 m) 보존 확인(리드 u16_norm, 긴 선 f32). u = 0이 신호 출발점(심장·전극·묶음·카트·멀티탭) |

## C단계 — 웹

| # | 판정 | 근거 | 메모 |
|---|---|---|---|
| C1 사람 v3 | PASS | `C6_intro12_sheet.jpg`, `C2_stills_vs_web.jpg` | archive 분기만 `body_seated_v3.glb` + manifest(v3 굽기) 배치·심장 위치/회전. 스캔 높이를 v3 메시 경계로. `?look=v2`는 그대로(`C6_noise_grip_v2.jpg` 아래 줄) |
| C2 H5 셰이더 | CONDITIONAL | `C2_stills_vs_web.jpg`(왼쪽 정지 렌더, 오른쪽 웹) | `figure.ts` `h5Material`: 깊이 선행 패스 + 일반 알파 혼합(가장 가까운 면만), 불투명도 중앙 .7 → 가장자리 .95(fresnel), 하늘 채움 + 햇빛 깊이 지도 안에서만 햇빛, `aSlice` 고리 + H3c 거리 밀도, 가장자리 밝음, 심장 빛(알파로 나눠 혼합 뒤에도 남는 발광), 몸속 파란 경로는 몸 선행 패스 전에 그려 면 너머로 보임. 아래 비교 표 |
| C3 형태 키 | PASS | `C3_grip_g0_g1_diff.jpg`, `C6_noise_grip_v2.jpg`(grip) | 셰이더가 `morphtarget_vertex`로 읽음(선행 패스도 같은 영향 배열). `figure.setBreath/setGrip(0–1)`. 도입부 숨 = `.35·(½−½cos 2πt/4)`(4 s, 박동과 무관), 쥠 0, 감소 동작(reduced)에서는 숨 0. `?grip=1`: grip=1 대 0 차이 맵이 **손가락 끝에만** 나타남(메시의 쥠 형태 키 자체가 작은 변화 — 정지 렌더 `check/v3_hand_out*.png`와 같은 정도). 숨: t = 3 s 영향값 0.175 = 식과 일치 |
| C4 흐르는 점선 | PASS | `C2_stills_vs_web.jpg`, `C6_noise_grip_v2.jpg` | 새 모듈 `signalRig.ts`. u(m) 기준 점선이 u 증가 방향(신호 방향)으로 흐름, 묶음별 주기·듀티 = 정지 렌더 값. 상태 규칙: clean = 몸속·리드·트렁크 파랑, 통신 보라, 전원선 무색 / noise = 리드·트렁크·전원선 빨강, 몸속 파랑 유지, 통신 보라 유지, RA 둘레 빨간 고리. API `rig.setSignal({sig,lead,trunk,comm,power})`, `?signal=clean|noise|off`. 블룸: 발광 ≈1.15배(보라 1.8, 몸속 1.5, 고리 3)로 낮춰 **파랑이 흰빛으로 뜨지 않음**(첫 시도 2.2배에서 흰빛 확인 후 수정) |
| C5 도입부 기본 | PASS | `C6_intro12_sheet.jpg` p .53–.62 | 기본 clean, 점선 흐름은 p .47–.56에 서서히 켜짐, 속도 0.6 주기/s(리드 약 2.7 cm/s). 도입부에 노이즈 연출 없음. 전극·리드·묶음·트렁크·몸속 경로는 몸 스캔과 함께 드러남(사람이 없을 때 트렁크가 허공에 매달려 보이던 문제 수정) |
| C6 성능·검증 | PASS(조건 메모) | `frames/C6-*.json`, 아래 | 테스트: `tsc` 통과, `intro.spec` 3 + `story.spec` 2 = 5 통과(기본값 archive), v2 단위 18/18(`chunks.test.ts`는 replay 자료 없음 — A단계와 같음), 루트 `npm test` 통과. 파형 무대 `sweep.ts`·`waveUi.ts`·`beats.ts` diff 없음(G1) — `intro.spec`의 R 피크·심장 박동 동기 30/30 통과 |

### 정지 렌더(Blender Cycles) 대 웹

| 장면 | 같은 점 | 차이 |
|---|---|---|
| s4 사람 정상/노이즈 | 구도, v3 자세·사다리 가운데, 3전극·짧은 리드 → 오른쪽 허리 묶음, 트렁크 점선 색 전환, RA 빨간 고리(노이즈) | 웹은 실제 빛줄기가 사람을 가로질러 왼쪽이 더 밝음. 심장 빛은 정지 렌더(발광 6, 진한 분홍 덩어리)보다 약하고 넓게 퍼짐 — 블룸에서 흰빛으로 뜨지 않게 일부러 낮춤 |
| s5 크레인 정상/노이즈 | 바닥 멀티탭, 책상 위 보라 통신선, 노이즈 시 빨간 전원선·트렁크 | 보라 통신선이 정지 렌더보다 어둡고 가늘게 읽힘(보라는 휘도가 낮음). 정지 렌더의 컴퓨터 뒤 보라 발광 흉내는 없음 |
| s7 가슴 | 몸속 파란 경로 3개가 면 너머로 보임, 전극 3개, 리드 파랑 | 정지 렌더는 거친 투과로 뒤가 거의 안 비침; 웹은 알파 흉내라 뒤 서가가 은은히 비침. 팔–몸통 틈(가슴 오른쪽 검은 점)은 둘 다 있음 |
| s6 쥔 손(노이즈) | 손가락이 옆대를 감쌈, 묶음·빨간 리드·트렁크 | 정지 렌더처럼 손이 "주먹"으로 강하게 읽히지는 않음(웹은 면이 반투명 + 햇빛 갈래). RA는 이 구도 밖(정지 렌더와 같음, P5 구도 문제) |

수치(같은 구도): s4 정상 평균 60.8 → 웹 64.6, 채도 .561 → .622 / s7 90.3 → 78.6 / s5 노이즈 64.3 → 53.3(`stats.py`).

### 성능 (SwiftShader 1600×900, 참고용 — 실제 GPU 아님)
p .57/.62: 전체 0.87/0.88 s · rig 숨김 0.86/0.91 · H5 몸 숨김 0.85/0.83 · 빛줄기 끔 0.40/0.42 → rig·H5 몸 비용은 측정 잡음 수준, 빛줄기 레이마칭이 약 53 %. 불러오기: rig 66 KB 추가, v3 몸 2.3 MB(v2 몸 2.3 MB 대신).

### 남은 문제
1. p ≈ .245–.255 지구 → 서고 사이 짧은 검은 화면(T6) — P3 하강 구간 자리. RETURN 1.
2. 사람에게 가까이 갈 때(p .62–.67) 팔–몸통 틈이 가슴 위 검은 점으로 보임 — 메시 형상(수정 금지 범위). RETURN 2.
3. 쥔 손이 웹 H5에서 주먹으로 약하게 읽힘 — 형태 키 변화량이 작음(메시), Story 구도(s6에 RA 미포함)와 함께 P5에서. RETURN 3.
4. 빛줄기 패스가 프레임의 절반 — 전시 PC(P2) 예산이 정해지면 반해상도 레이마칭 검토(다락방 보고 §4 메모).
5. `chunks.test.ts`·`replay/manifest.json` 404: 이 PC에 실험실 재생 자료가 없어 실행 불가(도입부 무관).

### 코드 변경 (B·C단계)
- `scripts/blender/build_archive.py`: `--export-rig DIR` 추가만(방·사람·선 형태 불변).
- `assets/archive/*` 다시 굽기 결과, `assets/rig_v3.glb` 새 파일.
- `figure.ts`: `h5Material`(H5 + morph), 깊이 선행 패스, `setBreath/setGrip/setBodyOpacity`, look `'h5'`.
- `signalRig.ts`(새): 흐르는 점선 셰이더, 상태·색 규칙, `setSignal/setFlow/setFade/setPerson`.
- `introStage.ts`: archive 분기에서 v3 몸(형태 키 이름 포함)·H5·rig 연결, 숨·흐름, `?signal`·`?grip`, 엔진 반환에 `rig`·`figure`. `IntroShell.tsx`: 쿼리 `signal`·`grip`, `__intro.rig/figure`.

다시 만들기: `python scripts/blender/build_archive.py --bake prototype/v2/public/intro-archive --size 2048 --bsamples 128 --fig v3` → `python scripts/assets/package-archive.py prototype/v2/public/intro-archive` / rig: `python scripts/blender/build_archive.py --fig v3 --export-rig prototype/v2/public/intro-rig` → `npx @gltf-transform/cli@4 meshopt rig.glb rig.opt.glb` → `assets/rig_v3.glb`.
