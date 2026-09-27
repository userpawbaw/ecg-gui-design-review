# R1 Step 1 — 공통 창작 패킷 + 레퍼런스 팩

작성: 2026-09-27 · branch `claude/optimistic-goldberg-jnzpni` · 분석: Claude Code
규약: `20_ALPHA_BETA_OPERATING_PROTOCOL.md` §2·§3 Step 1, `13_REFERENCE_GROUNDED_CREATIVE_MINING.md` §5–§10, `17_REFERENCE_SOURCE_REGISTRY.md` §5·§7, `11_CHECKLISTS.md` §1·§1C·§1D
관련 결정: D-033(두 라운드), D-034(Beta A/B는 비교 입력), D-035(UI-02만), D-027/D-028/D-029(제작 파이프라인), **D-036(이 팩의 구성)**

**상태: FROZEN (2026-09-27).** 사용자 답(§7.1): 입력 장치 = 마우스 휠 + 클릭, 중심 스토리 = S1, REF-006의 객체 연속 재배열을 핵심으로 지목 → 효과 기록 `references/REF-006_R2D3_VISUAL_INTRO_ML.md`로 승격. Beta는 별도 에이전트에서 실행. 이 문서 이후 Alpha와 Beta는 **이 문서만** 공통 입력으로 받는다(§6).

---

## 1. 공통 창작 패킷 (Alpha·Beta 동일 입력)

| 필드 | 값 |
|---|---|
| Round ID | `R1` — 카드 ID는 `ALPHA-R1-001`, `BETA-R1-001`, `AB-R1-001` |
| Target scene | **Attract(무인 대기) → Story(연구 핵심 한 가지) → Lab 진입 전환.** Lab·Compare 재배치는 2라운드(D-033) |
| Baseline | v2.2.1 = `prototype/v2` (main `cfef430` 계열, 이 branch 포함). 재생 자료 원천은 릴리스 `archive-v2.2.1-recovery` ZIP(D-033 Q4) |
| Current screenshot | `verification/redesign-baseline-20260925/v221-attract-1920x1080.png`, `v221-lab-1920.png`, `v221-lab-1366x768.png`, `v221-large-1920x1080.png` (headless L3) |
| Creative Freedom Zone | Attract·Story 배경·전환 = **HIGH**(WebGL 허용, D-027) · Story 안의 수치·설명 = **MEDIUM** · 파형·시간축·단위·Reference·Difference = **LOW**(변경 금지) |
| 3-second goal | 어두운 화면에서 잡음에 묻힌 선 하나가 심장 박동으로 드러나는 순간을 보고, "잡음 속 심장 신호를 꺼내는 비교 전시"라는 것을 안다 |
| 15-second goal | **같은 ECG라도 잡음 종류가 바뀌면 가장 잘 맞는 방법이 바뀐다**는 것을 한 번의 장면 전환으로 본다(§2 S1) |
| ↳ 정정 2026-09-27 (F-025) | "같은 ECG"는 **합성 기록 D0 S038**에서만 성립한다(D1 시연 장면은 잡음마다 다른 기록). 핵심 장면은 D0 S038 · 20 dB(pli → M04, bw → M_FE, ma → M06L6)로 보이고 "합성"을 표기, D1은 기록 번호를 붙여 보조로 쓴다. 동결 후 정정이라 원문을 지우지 않고 이 줄을 더했다 |
| Next user action | 클릭하면(또는 휠 스크롤을 이어 가면) 방금 본 **같은 신호·같은 시각** 그대로 Lab에 들어가 잡음 하나를 직접 바꿔 본다(same-time handoff, D-034 재사용 자산) |
| Creative Intent | 관람객이 잡음 속 심장 신호를 **발견**하고, "잡음이 무엇이냐에 따라 답이 달라진다"는 연구의 핵심을 한 번의 여정으로 **겪은 뒤**, 끊김 없이 실험실로 들어가게 한다 |
| Research story/content | §2의 S1–S5(저장소 안 검증 자료에서 추출, 범위 표기 포함) |
| Hard data/state constraints | §1.1 |
| Reference Pack IDs | REF-001, REF-002, REF-003, REF-004, REF-005, REF-006 (§3) |
| Reference Source Families | A Creative/Experimental(REF-001·002·004) · B Curated Web/Art Direction(REF-003) · F Scientific/Explain-by-interaction(REF-005) · G Data Storytelling(REF-006) |
| Fidelity target | Alpha `STRONG_ADAPTATION`(HIGH 라운드 기본, `18` §fidelity) · Beta stills `NEAR_FINAL`(CASE-005·DUAL-ATTRACT-001의 사용자 기준 "제품 후보처럼 완성돼 보일 것") |
| Output budget | Alpha: 발산 5–8 아이디어 → 1차 카드 1개(장면 3개: Attract·Story·전환). Beta: concept brief 4–6 → stills 최대 9장(장면당 3) → 번역 카드 1개. Hybrid는 교차 검토 후 최대 1개 |

### 1.1 Hard data/state constraints (LOW 구역 계약 — 레퍼런스가 덮어쓰지 못함)

1. 입력·출력은 **같은 절대 sample index·같은 시각·같은 ±mV 축**. 행마다 scale을 다르게 하지 않는다.
2. Reference = 공통 FE 적용 기준 신호(D1 원기록 기반, D0 합성). "임상 정답"이라고 쓰지 않는다. Difference = Output − Reference.
3. 파형은 canonical 저장 출력에서만 그린다. **AI 영상·이미지·셰이더가 그린 파형, 두 방법 사이 중간 파형 morph, 존재하지 않는 방법 출력은 금지**(`13` §13 critical fail). 영상 경로(`22`)의 영상에는 파형·숫자를 넣지 않고 코드로 겹친다.
4. `REPLAY / ARCHIVED REPLAY / GENERATED REPLAY` 구분과 "실제 장치 세션 없음" 고지를 유지한다. 실시간 계측처럼 보이는 연출(가짜 BPM, "처리 중" 시점 연출)은 금지(D-016에서 이미 기각).
5. Story 수치는 **범위를 함께 쓴다**: 장면 단위 = "저장된 10초 한 구간", 집계 = "EXP-A · D1 · TEST 22 records · 혼합 잡음 −5…20 dB". 두 범위를 한 문장에 섞지 않는다.
6. Oracle(B01·B02)은 "참조가 있어야 쓸 수 있는 비교 기준"으로만 표기한다. n.s.를 동등으로 읽지 않는다. QRS 폭 차이는 해상도 한계(p95 ≈ 28 ms) 아래에서 우열 색을 주지 않는다.
7. 실행 환경: 오프라인 Windows 전시 PC, **입력 = 마우스 휠 + 클릭**(터치·키보드 전용 경로는 설계 대상 아님, 키보드 접근은 유지), 1920×1080 우선, reduced-motion에서 구조가 성립, 10분 soak, 한 페이지에 Lenis 하나, 프레임 값은 React state로 흐르지 않는다(D-028). 성능 예산은 P2(전시 PC) 전까지 잠정(`25` §5).
8. 글꼴은 현재 시스템 글꼴 기준(D-035, 교체 보류). UI-02 sweep 선단 발광은 승인 범위 안에서만(docs/22 §4).
9. 레퍼런스 사이트의 에셋·코드·로고·문구를 복사하지 않는다. 모방 거리 기본 3–4(`13` §9).

---

## 2. 연구 스토리 소재 (검증 자료에서만)

출처: `prototype/v2/public/archive.json`(원본 `userpawbaw/ECG_denoising_method_comparision` @ `5eb2794`, `demo/demo_bank.js` blob `4a94d1b` — dataset hash 불일치로 **ARCHIVED** 상태, `docs/01_source_review.md` §4), `prototype/v2/src/methods.json`. 이 문서에서 새로 계산한 값은 저장된 지표를 정렬만 한 것이다 `[코드]`.

| ID | 스토리 한 줄 | 근거 | 범위·주의 |
|---|---|---|---|
| **S1** | **잡음이 바뀌면 1등이 바뀐다.** D1 전원 간섭(pli)에서는 고전 웨이블릿 M04 Adaptive SWT가 0–25 dB 모든 장면에서 SNR 개선 1위, 임펄스 잡음에서는 딥러닝 M06L6가 −5–25 dB 모든 장면에서 1위, 약한 기저선 변동(bw_synth 20–25 dB)에서는 공통 Front-end(M_FE)만으로 1위 — 추가 처리가 보태는 것이 없다 | archive `scenes[].storedMetrics.snr_imp`, oracle(B*) 제외 | **장면마다 저장된 10초 한 구간**의 값. 일반 법칙이 아니라 "이 자료에서 보인 것". M06L6는 EXP-G 보조 실험(학습 실행이 다름) |
| **S2** | 전체 실험 평균에서는 딥러닝이 앞서지만 차이는 생각보다 좁다: M08 Wavelet U-Net 14.66 dB, M06 14.37, M09 14.21 / 고전 M04 13.12, M01 13.03 / 공통 FE 12.11 | archive `evidence`(EXP-A, `results/d1/report/table_main.csv`) scaled SNR 개선 평균 | EXP-A · D1 · TEST n=22 · 혼합 잡음 −5…20 dB. 표준편차 3–6 dB. 유의성 검정은 이 자료에 없음 → "차이가 좁다" 이상 주장 금지 |
| **S3** | **숫자 하나가 전부를 말하지 않는다.** 아무것도 하지 않은 M00도 배율 보정 SNR로는 +2.56 dB가 나온다(보정 없는 값은 0.0). Bandpass+Notch M01은 SNR 개선 13.03 dB로 중위권이지만 스펙트럼 거리(PSD log-distance)는 22.79 dB로 최하위 | 같은 evidence 표 `snr_imp_scaled`, `snr_imp_strict`, `psd_logdist` | 지표 정의는 methods.json·S1 소스 검토 §3. "M01이 나쁘다"가 아니라 "지표마다 순위가 다르다"만 |
| S4 | 참조가 있어야 쓸 수 있는 oracle(B01 17.93 dB)은 실제 방법들의 위에 있다 — 실제 장치에는 참조가 없다 | evidence 표 B01 | "보편적 상한"이라고 쓰지 않는다(S1 소스 검토 §3-3) |
| S5 | 학습 범위 밖에서는 보장이 없다(딥러닝 한계 문구) | methods.json M06 `limit` | 설명 문구 수준. 수치 근거 없음 |

**S1 정정 (F-025)**: 위 S1의 D1 세 장면은 기록이 서로 다르다(pli 219, impulse 123, bw 202). 같은 기록에서의 근거는 D0 S038 · 20 dB — pli → M04 19.4 dB, bw → M_FE 23.2 dB, ma → M06L6 9.9 dB(합성 ECG).

**권장 중심 스토리: S1**(15초 목표와 직결, 파형을 hero로 둔 채 조건만 바꾸면 보인다). S2·S3는 Story 끝이나 Lab 진입 직전의 "한 줄 근거"로. 최종 선택은 Alpha/Beta가 각자 하되 이 표 밖의 주장은 쓰지 않는다.

---

## 3. Reference Pack

### 3.1 구성과 균형

| Family | 레퍼런스 | 역할 |
|---|---|---|
| A Creative/Experimental | REF-001 moto-card, REF-002 leoparpeix, REF-004 seasats | wow 장면·공간감·표시 연출 (Attract, 전환) |
| B Curated Web/Art Direction | REF-003 white-desert | 편집 타이포 + DOM만으로 만든 장면성 (Story 문장·경로) |
| F Scientific/Explain-by-interaction | **REF-005** ciechanow.ski "Sound" | 파형을 성분으로 **쪼개고 더해 보는** 설명 (Story 핵심) |
| G Data Storytelling | **REF-006** R2D3 "A Visual Introduction to Machine Learning" | 스크롤마다 한 가지 통찰, 같은 점들이 재배열되며 결론을 만드는 흐름 (Story 구조) |

- 4 family, 6 레퍼런스, 도메인 중복 없음.
- **A family가 3/6(50 %)** — 기준(`17` §7 "한 family로 채우지 않기")의 경계다. 예외 근거: REF-001–004는 사용자가 직접 골라 녹화·지목한 레퍼런스이고 효과 카드와 재현 spike가 이미 있다(`17` §7 예외 "사용자가 명시적으로 집중 요청"). 쏠림은 Story를 F·G로 채워 상쇄한다(D-036).

### 3.2 레퍼런스 카드

REF-001–004는 효과 기록(`references/REF-*.md`)이 canonical이다. 여기서는 R1에서 **어디를 보고 무엇을 가져오는지**만 적는다. REF-005·006은 이번에 새로 고른 것이라 `13` §7 카드 전체를 적는다(효과 재현 대상이 되면 `21` 규칙으로 효과 기록을 만든다).

#### REF-001 moto-card.com — 역광 지구 · match cut
- Nature / Family / Granularity / Evidence: LIVE_WEBSITE / A / scene / 녹화 + 소스 + 라이브 측정
- Viewing instruction: 첫 화면 역광 지구가 스크롤에 맞춰 회전·축소·페이드하는 구간, 그리고 **지구 윤곽의 빛줄기가 카드 모서리로 이어지는 match cut**(EFX-001-02·03)만. 뒤쪽 원통 갤러리·숫자 벽은 R1과 무관
- Unforgettable moment: 형태(빛의 호)가 장면을 넘어 다음 대상의 윤곽으로 이어진다
- Experience principle: **형태 연속으로 장면을 잇는다(RCP-03)** · 한 대상에 빛(역광)을 몰아 존재감을 만든다
- ECG translation: Attract의 "빛나는 선"이 Story의 파형 행으로, Story의 파형이 Lab plot의 같은 선으로 이어지는 match cut. 선의 **모양과 시각은 저장 파형 그대로**(바뀌는 것은 카메라·프레임뿐)
- Do NOT copy: 지구·카드·금속 재질·Neue Montreal 조합, 회전 수치 그대로
- Zone / Imitation distance / Risk: HIGH / 3 / 역광 bloom이 파형 판독을 해치면 LOW 구역 침범 → Lab 진입 전 bloom 0

#### REF-002 leoparpeix.com — 공간 속을 걷는 카메라 · 포인터 시선
- Nature / Family / Granularity / Evidence: LIVE_WEBSITE / A / scene / 녹화(HUD) + 소스 + 라이브 측정
- Viewing instruction: 사용자 녹화 **17–20 s**(마우스 좌우 = 고개 돌림), **22–26 s**(스크롤 = 카메라 하강·접근). EFX-002-01·02·03. 드래그 갤러리·벌 커서는 R1과 무관
- Unforgettable moment: 화면이 아니라 **공간 안에 서 있다**는 느낌, 스크롤이 곧 걸음
- Experience principle: 카메라 3단 계층(기준/포인터/스크롤, RCP-11) · 스크롤 → 카메라 선형 이동(RCP-10)
- ECG translation: 전시 공간·장치(모니터·계측기)를 지나 **신호 안으로 들어가는** 도입. 다락방 spike(`prototype/spikes/attic`, look=both F-024)와 AI 영상 경로(`22`)가 이미 제작 경로로 검증됨
- Do NOT copy: 집·방 구성, 베이크 텍스처, Avantt/Monument Grotesk
- Zone / Imitation distance / Risk: HIGH / 3 / 공간 연출이 길어져 3초 목표(신호 발견)가 늦어질 위험 — 첫 3초 안에 파형이 보여야 함

#### REF-003 white-desert.com — 밀려오는 구름 · 스크롤로 그려지는 경로 · 소나
- Nature / Family / Granularity / Evidence: LIVE_WEBSITE / B / scene·section / 녹화(HUD) + 소스 + 라이브 측정 · **WebGL 없음**
- Viewing instruction: 녹화 **약 3 s** 두 겹 구름 덮기(EFX-003-01), **38 s–1:00** 스크롤로 그려지는 경로와 지나온 구간의 청록 표시(EFX-003-02), **약 52 s** 멈춰도 퍼지는 소나 링(EFX-003-03). 문장 마스크(EFX-003-05)도 Story 문장에 해당
- Unforgettable moment: 멈춰 있어도 "탐지 중"처럼 살아 있는 표시점
- Experience principle: 위치는 스크롤·데이터로, 생동감은 독립 시간 루프로 분리(RCP-17) · 지나온 경로를 다른 색으로 남김(RCP-16)
- ECG translation: Story에서 **조건 축(잡음 종류·SNR)을 따라가는 경로**, 지나온 조건은 표시가 남고 현재 조건에 소나 같은 표시점. 파형 자체에는 링·맥동을 얹지 않는다(가짜 실시간 금지)
- Do NOT copy: 남극 지도·Oswald+Cardinal 조합·청록 #6AF0FF 그대로
- Zone / Imitation distance / Risk: HIGH/MEDIUM / 3 / 소나 맥동이 "실시간 심박 표시"로 읽힐 위험 → 조건 표시에만 사용

#### REF-004 seasats.com — 전략 지도 같은 지구본 · 필터로 회전
- Nature / Family / Granularity / Evidence: LIVE_WEBSITE / A / section / 녹화 + 소스(지구 렌더는 헤드리스 미마운트)
- Viewing instruction: 녹화 전체(29 s) — **필터(All/Commercial/…)를 누르면 지구가 가장 큰 군집으로 돌아가는 순간**(EFX-004-04), 느리게 도는 시계 눈금 링(EFX-004-02), hover 사진 카드(EFX-004-03)
- Unforgettable moment: 버튼 하나에 **세계 전체가 돌아 답을 보여 준다**
- Experience principle: 필터 → 최대 군집으로 시점 이동(RCP-22) · 단일색 표시층(RCP-20)
- ECG translation: Story에서 "잡음 종류" 선택이 장면 전체를 돌려 **그 조건의 1위 방법(S1)** 앞에 세운다. hover 카드 = 방법 한 줄 원리·한계(methods.json 문구 그대로)
- Do NOT copy: 지구본·배 아이콘·Season/Supply Mono·홀로그램 텍스처
- Zone / Imitation distance / Risk: HIGH/MEDIUM / 3 / 지구 같은 3D 은유가 ECG와 무관한 장식이 될 위험(ECG Identity 기준)

#### REF-005 ciechanow.ski "Sound" — 파형을 쪼개고 더해 보는 설명 (신규)
- Source / URL: Bartosz Ciechanowski, https://ciechanow.ski/sound/ (2022-10-18)
- Nature / Family / Granularity / Evidence: LIVE_WEBSITE(interactive article) / F / section·component / **L1 — 본문과 데모 구성을 텍스트로 확인(2026-09-27 WebFetch). 인터랙션을 브라우저로 조작해 보지는 않음** `[문헌]`
- Target: Story 장면
- Viewing instruction: 글 전체가 아니라 두 곳만. ① **"Making Sounds"** 절에서 여러 파형을 **더하면 복잡한 파형이 되는** 데모 ② **"Masses and Springs"** 절에서 슬라이더로 성분(normal mode) 크기를 바꾸면 전체 움직임이 바뀌는 데모. 스크롤하며 읽는 흐름보다 **슬라이더 하나에 파형이 바로 반응하는 방식**을 보세요
- Unforgettable moment: 복잡한 파형이 몇 개의 단순한 성분의 합이라는 것을 손으로 확인하는 순간
- Mechanism: 성분별 슬라이더 → 합성 파형 즉시 재계산 → 성분과 합을 같은 축에 나란히
- Why it works: 설명을 읽기 전에 손이 먼저 원리를 겪는다(explain-by-interaction)
- Expected feeling: "아, 잡음도 종류별 성분이구나"
- ECG translation: Story에서 **입력 = Reference + 잡음 성분**을 같은 축에 쌓아 보여 주고, 잡음 종류를 바꾸면 성분 행이 바뀐다. **단, 성분 파형은 저장된 자료에서만**: Input − Reference(실제 차이)로 보이며, 임의 합성 사인파로 "잡음"을 그리지 않는다. 슬라이더 연속 조절 대신 저장된 조건(7 SNR × 7 잡음)만 선택 가능
- Do NOT copy: 일러스트 스타일, 3D 공기 입자, 키보드 신시사이저, 문구
- Zone / Imitation distance / Risk: MEDIUM / 4 / 교육용 기사 톤이 전시 wow를 약하게 만들 위험 → 구조만 가져오고 art direction은 A family에서
- Minimal prototype: 저장 장면 하나로 Input · Reference · (Input − Reference) 세 행을 같은 ±mV 축에 쌓고, 잡음 종류 버튼 3개로 전환

#### REF-006 R2D3 "A Visual Introduction to Machine Learning" — 스크롤마다 한 통찰, 같은 점들의 재배열 (신규)
- Source / URL: Stephanie Yee · Tony Chu, https://r2d3.us/visual-intro-to-machine-learning-part-1/
- Nature / Family / Granularity / Evidence: LIVE_WEBSITE(scrollytelling) / G / flow / **효과 기록으로 승격** — 소스 + 헤드리스 측정(`references/REF-006_R2D3_VISUAL_INTRO_ML.md`, EFX-006-01~05). 사용자 지목: "같은 점이 사라지지 않고 모양만 바꿔 재배열되는 시각화 아이디어가 놀랍네. 애니메이션의 완성도도 높고." `[대화]`
- Target: Story 구조 → Lab 진입
- Viewing instruction: 처음부터 끝까지 스크롤하되 **점들이 사라지지 않고 계속 같은 점으로 남아** 축 → 산점도 → 히스토그램 → 나무 갈래로 재배열되는 것, 그리고 마지막에 **학습 자료에서 100 %였던 나무를 새 자료에 적용하면 틀리는(overfitting)** 반전만 보세요. 도시·집값 내용은 무관
- Unforgettable moment: 같은 점들이 모양을 바꿔 가며 하나의 결론을 쌓다가, 마지막에 그 결론의 한계를 스스로 보여 준다
- Mechanism: 스크롤 단계마다 하나의 통찰, 데이터 객체는 연속(object constancy), 끝에 반례
- Why it works: 관람객이 "같은 것"을 계속 추적하므로 설명 없이 인과를 따라간다
- Expected feeling: "조건이 바뀌니 답이 바뀌는구나 — 그리고 만능은 없구나"
- ECG translation: Story 3–4 박자: ① 한 장면의 파형(같은 10초) ② 잡음 종류를 바꾸면 1위 방법이 바뀜(S1) ③ 전체 실험 평균에서는 차이가 좁다(S2) ④ 반전: 숫자 하나가 전부가 아니다(S3) 또는 학습 범위 밖 보장 없음(S5). **파형은 재배열하지 않는다** — 재배열되는 것은 방법·조건 표시(점·라벨·순위)뿐
- Do NOT copy: 색(초록/파랑), 결정 나무 그래픽, 문구
- Zone / Imitation distance / Risk: MEDIUM / 4 / 스크롤 스토리 길이가 전시 관람 시간(60초 과제, `01_source_review` §5)을 넘을 위험 → 박자 4개 이하

### 3.3 검토했으나 넣지 않은 것

| 후보 | 이유 |
|---|---|
| NASA Eyes (F) | `17` §9 위험 "3D 표면 복제" — 우주 스케일 은유가 ECG와 멀다. 스케일 전환 원리는 REF-002·004로 충분 |
| Chrome Music Lab Spectrogram (F) | 주파수 관점 설명 후보였으나 이번에 접근·동작을 확인하지 않았다. 확인 없이 카드로 쓰지 않는다(`17` §8) |
| The Pudding 기사 (G) | 이번 Story 구조(같은 객체의 재배열 + 반전)에 맞는 특정 기사를 확인하지 못했다. REF-006으로 대체 |
| 새 Awwwards/Godly 탐색 | A family가 이미 50 %라 추가하지 않음. 사용자가 새 wow 레퍼런스를 원하면 A 대신 교체 |
| 복구 branch Beta A/B | 레퍼런스가 아니라 비교 입력(D-034). **Beta 1차 프롬프트에 넣지 않는다**(§6) |

---

## 4. 쓸 수 있는 제작 경로 (결정이 아니라 선택지)

| 경로 | 상태 | 맞는 곳 |
|---|---|---|
| 실시간 3D(three.js, vanilla + React 마운트) | 다락방 spike: 스크롤 하강 + look=both 포인터(F-024) | 공간 도입, 포인터 반응이 필요한 곳 |
| AI 영상 → 스크롤(`22`, D-023 확정) | 플레이어·입고 QA·깊이 시차 검증. **첫 실제 AI 영상은 아직 없음** | 고정 카메라 경로, 사진 같은 질감이 필요한 도입 |
| DOM/SVG/Canvas 2D + GSAP | REF-003 재현 spike(WebGL 없음) | Story 문장·경로·표시점, MEDIUM 구역 |
| 기존 코드 자산 | CompareLens(같은 sample index), same-time handoff, RAF 측정(D-034) | Story → Lab 전환 |

모든 경로는 `25` 게이트 G1–G6를 통과해야 사용자에게 보인다.

---

## 5. 교차 확인 (`11` §1·§1C·§1D)

- [x] 00/01 확인, 구역 HIGH/MEDIUM/LOW 지정(§1)
- [x] 2–4 family(4개), 3–8 레퍼런스(6개), 모두 viewing instruction 있음
- [x] macro art direction(REF-001·002·004) vs 구조·컴포넌트(REF-003·005·006) 구분
- [x] fidelity 목표 지정(§1)
- [x] 모방 거리 3–4, Do NOT copy 명시
- [x] Beta용 금지 요소(파형·숫자·가짜 실시간)를 §1.1에 명시
- [x] REF-006 사용자 확인·지목 → 효과 기록. REF-005는 사용자 의견 없음(유지, L1)
- [x] 입력 장치 = 마우스 휠 + 클릭(§7.1)

---

## 6. Alpha/Beta 독립 규칙 (이 라운드)

- 두 트랙 모두 **이 문서(§1–§4)만** 받는다. Alpha 결과(장면 구성·컴포넌트·모션 답)는 Beta 1차가 동결될 때까지 Beta 입력에 넣지 않는다.
- 복구 branch Beta A/B 화면은 교차 검토(Step 4)에서만 비교 입력으로 쓴다(D-034).
- 같은 대화에서 역할을 바꿔 실행하는 경우(Claude Code 단일 세션) 독립성은 **완전하지 않다**. Beta는 별도 에이전트(새 컨텍스트)에 이 문서만 주어 실행하고, 그렇지 못하면 결과에 `INDEPENDENCE_PARTIAL`을 표기한다.
- Beta 이미지 생성 도구: 이 환경에서 쓸 수 있는 이미지 생성기(예: Canva generate-image)는 **아직 품질 검증 전**이다. Step 3 전에 한 장 시험 후 쓰거나, Chat 환경으로 handoff한다(`20` §8).

---

## 7. 동결 전에 사용자에게 필요한 것

- **Q1 입력 장치**: 전시 PC에서 관람객은 무엇으로 조작하나? (a) 마우스 휠 + 클릭 (b) 터치 스크린 (c) 버튼/조작 없음 → 자동 진행 + 터치 한 번. 스크롤 기반 레퍼런스(REF-002·003·006)의 번역 방식이 달라진다. 모르면 (a)+(b) 둘 다 성립하도록 설계한다.
- **Q2 중심 스토리**: §2 S1(잡음이 바뀌면 1등이 바뀐다)을 중심으로 두는 것에 동의하나?
- **Q3 새 레퍼런스 확인**: REF-005 "Sound"의 두 데모, REF-006 R2D3의 재배열 + 반전을 직접 보고 "살릴 것 / 거슬리는 것"이 있으면 알려 주기. 교체를 원하면 이 단계에서.

### 7.1 사용자 답 (2026-09-27)

> "1번 (a)만, S1 동의, 레퍼런스 006에서 네가 말했듯 같은 점이 사라지지 않고 모양만 바꿔 재배열되는 시각화 아이디어가 놀랍네. 애니메이션의 완성도도 높고. 실제 브라우저에서 캡쳐해서 참조하는게 나을까? 아니면 내가 영상으로 찍어 줄까. beta안은 별도 에이전트에서 실행되어야 한다는 의견에 동의해." `[대화]`

- Q1 → (a) 마우스 휠 + 클릭. 스크롤 기반 레퍼런스(REF-002·003·006)를 그대로 번역할 수 있다.
- Q2 → S1 중심.
- Q3 → REF-006의 객체 연속 재배열이 핵심. 캡처 방식: R2D3는 DOM/SVG/Canvas 2D라 헤드리스가 실제와 같은 화면을 그리므로 AI가 소스 + 헤드리스 측정으로 확보했다(사용자 녹화는 실제 휠 부드러움 확인이 필요할 때만). 결과 = REF-006 효과 기록.
- Beta → 별도 에이전트(새 컨텍스트)에 이 문서만 전달.

## 8. 단계 판정

- 수행: 20/13/17/18/11 규약 확인, REDESIGN_BASELINE §6·§7.1 반영, archive.json 저장 지표 정렬로 S1–S5 추출, REF-005·006 존재·구성 확인(WebFetch), 계약 §1.1 정리.
- 판정: **PASS** — 사용자 답 반영 후 FROZEN(§7.1). REF-006 효과 기록 추가.
- 미검증: REF-005·006의 실제 인터랙션(브라우저 조작 안 함), S1–S2의 600초 replay 자료 기준 재확인(ZIP 미적용), 전시 PC 입력 장치.
- 다음: §7 답 → FROZEN 표기 → Step 2 `ALPHA-R1-001`.
