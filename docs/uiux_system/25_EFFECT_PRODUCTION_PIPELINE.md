# 25. 연출 제작 파이프라인 (계약)

상태: **채택 — 2026-09-26 사용자 결정** (P1 = D-027, P5 = D-028, P6 = D-029). 이 문서는 21–24번과 체크리스트 §12를 하나의 작업 순서로 묶는 계약이다.
연결: F-010, F-015, F-016, F-017, D-017, D-018, D-019, D-020–D-026, CASE-006, `handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md` §7(원 제안).

## 1. 적용 범위 (P1)

| 구역 | 적용 |
|---|---|
| **HIGH** (Attract/Intro, idle, 모드 전환, narrative reveal) | 필수. WebGL 허용 |
| **MEDIUM** (결과 요약, metric reveal, method 설명, navigation) | 필수. WebGL은 D 기록으로 근거를 남길 때 허용, 기본은 DOM/Canvas 2D/SVG(F-014: WebGL 없이도 wow 가능) |
| LOW · 단순 polish · 동결된 구현 | 제외(기존 체크리스트만) |
| 레퍼런스 재현·학습 spike | 필수(학습 단계 입력 정책 D-025) |

**D-016 개정**: D-016("Attract는 Canvas 2D") 은 `feat/attract-vnext-recovered-20260924` 브랜치에만 있다. 이 파이프라인은 HIGH 구역에서 WebGL을 허용하는 것으로 그 제한을 대체한다. 그 브랜치를 이어 작업할 때 D-016에 "D-027로 대체" 표시를 남긴다.

데이터 계약은 어떤 단계에서도 우선한다: ECG 파형·수치·Reference/Difference는 canonical 데이터에서 코드로 그린다. 이미지·영상·생성물의 파형은 데이터가 아니다(AGENTS.md).

## 2. 작업 순서

```text
S1 레퍼런스 효과 카드 (21번, D-017 촬영 규칙)          ── 무엇을 재현하나, 입력 모델, 수치, 수용 기준
S2 경로 선택                                          ── 실시간 3D / Blender 사전 렌더·베이크 / AI 영상(22번 V0) / DOM·SVG
S3 재료: 에셋 조사(24번) · 외부 컴포넌트 검토(23번 C1–C3)
S4 구현 — 스택 기준(§3), 통합 구조(§4), 셰이더·후처리 검토(체크리스트 §12)
S5 충실도 게이트(§6) — 통과 전에는 사용자에게 "완성"으로 보이지 않는다
S6 사용자 확인 — 게이트가 남긴 GAP만 질문 + 실제 브라우저 체감
S7 기록 — REF 카드 재현 상태, verification/, F/D/O/R, registry
```

## 3. 스택 기준

| 층 | 기준 | 비고 |
|---|---|---|
| 3D | three.js (vanilla, 현재 0.186) + 공식 addon(GLTFLoader, EffectComposer, …) | r3f/drei 미사용(D-028) |
| 모션·스크롤 | GSAP 3.15(ScrollTrigger, DrawSVG, MotionPath 무료) + Lenis 1.3 | 한 페이지에 Lenis 하나(§4) |
| 사전 제작 | Blender `bpy`(헤드리스), gltf-transform, ffmpeg, Pillow·numpy·OpenCV | bpy 때문에 시스템 numpy 1.26 고정. torch 등은 별도 가상환경 |
| AI 영상 | 22번 파이프라인(입고 QA, 스크롤 플레이어) | D-023 |
| 에셋 | `assets/registry.json` + `fetch.mjs`(sha256 고정) + `explore.mjs` | D-020, D-022 |
| 추가 후보 | KTX2(`toktx`), pmndrs postprocessing, Theatre.js | **문제가 측정된 뒤** 도입(ATTIC §5) |
| 빌드 | Vite 7, TypeScript | 제품 v2.2.1과 같음 |

## 4. React 통합 구조 (P5 — D-028)

**vanilla 엔진 모듈 + React 마운트.** 3D·스크롤 연출은 프레임워크 없는 엔진 모듈로 만들고, React(v2.2.1, React 19)는 그 엔진을 붙이고 상태만 전달한다.

```ts
// engine 모듈 (프레임워크 없음)
export function createStage(canvas: HTMLCanvasElement, opts: StageOptions): Stage;
interface Stage {
  setState(s: Partial<StageState>): void;   // 모드·선택·언어 등 느린 상태 (React → 엔진)
  setProgress(p: number): void;             // 스크롤·시간 진행률 0..1 (앱 셸의 Lenis/ticker → 엔진)
  setData(d: CanonicalFrame): void;         // canonical 데이터 (파형은 엔진이 코드로 그린다)
  on(ev: StageEvent, fn: (e) => void): () => void;   // 엔진 → React (hover, 전환 완료 등)
  resize(w: number, h: number, dpr: number): void;
  dispose(): void;                          // 텍스처·지오메트리·렌더 타깃 해제
}
// React 쪽: <StageMount> 하나가 ref로 canvas를 만들고 useEffect에서 createStage/dispose.
```

규칙:
1. **매 프레임 값은 React state로 흐르지 않는다.** 진행률·포인터·시간은 엔진 안(또는 ref)에서만. React 재렌더는 느린 상태 변경에만.
2. **Lenis·gsap.ticker는 앱 셸에 하나.** 엔진은 진행률을 받는다(여러 엔진이 각자 Lenis를 만들지 않는다).
3. 엔진은 **render gate**(화면에 보일 때만 렌더), `dispose`, reduced-motion·시간 구동(Attract)·스크롤 세 입력 경로를 갖는다(원 제안 6).
4. React UI 층(버튼·필터·카드)은 23번 C1–C4 검토를 거쳐 외부 컴포넌트를 쓸 수 있다.

## 5. 성능 예산 — 임시값 (P2 미정)

전시 PC 사양(P2)이 정해질 때까지 아래를 **임시 상한**으로 쓰고, 넘으면 D 기록으로 사유를 남긴다 `[추론]`. P2가 정해지면 실측으로 교체한다.

| 항목 | 임시 상한 | 현재 관측 |
|---|---|---|
| 목표 프레임 | 60 fps (전시 PC 실측) | 헤드리스 SwiftShader만 — 실측 없음 |
| 구간당 초기 전송(압축) | 16 MB | 다락방 15.4 MB, REF-003 페이지 JS gzip 57 KB(이미지·영상 별도, 미합산), 영상 48장 3.0 MB |
| 디코딩 프레임 메모리(영상·연속 이미지) | 300 MB | 720p 창 73장 ≈ 270 MB (F-018) |
| 전체 화면 후처리 패스 | 4 | 다락방: 빛줄기·bloom·grade·SMAA |
| draw call | 300 | 미측정 |

## 6. 충실도 게이트 (P6 — D-029)

구현 결과를 사용자에게 보이기 **전에** AI가 통과시킨다. 결과는 `verification/<작업>-<날짜>/fidelity.md`로 남긴다.

| # | 항목 | 언제 | 통과 기준 |
|---|---|---|---|
| G1 | **수치 계약** — 효과 카드 파라미터를 코드 상수로 옮기고 출처 주석(REF-ID·EFX-ID) | 항상 | 카드의 모든 수치가 코드에 있거나 "미확인 — 이유" |
| G2 | **재료 스펙** — 해상도(화면 대비 텍셀 ≥ 1:1), 알파, 용량(§5), 라이선스·registry | 항상 | registry 항목·해시 고정·허용 라이선스 |
| G3 | **나란히 캡처** — 레퍼런스 같은 진행 비율 프레임과 효과 구간당 **최소 6장, 권장 12장**(D-019). 비교 이미지는 저장소 밖 | 항상 | 차이를 KEEP / TUNE / GAP 표로 |
| G4 | **자동 수치 비교** — 밝기 분위(p5·p50·p95)·채도·난색을 레퍼런스와 비교(F-016) | 룩(색·빛)을 맞추는 작업 | 목표 대비 차이 기록, 크게 벗어나면 TUNE |
| G5 | **상태 전수 캡처** — 모든 각도·필터·스크롤 구간·hover·정지 상태(시간축 12장)·reduced-motion | 항상 | 상태 목록의 모든 항목에 캡처 |
| G6 | **AI 자기 수정 한도** — TUNE을 줄이는 수정은 **최대 3회**(AI 영상 피드백 3회와 같은 수) | 항상 | 3회 뒤 남은 GAP만 사용자에게 질문, 회차별 변화 기록 |

수정할 때마다 G3·G5를 다시 전부 캡처한다(수정 하나가 다른 결함을 드러낸다 — F-017). 게이트는 **헤드리스 캡처 기준**이라 실제 GPU 성능·스크롤 체감은 S6에서 사용자 확인으로 남는다.

## 7. 원 제안(감사 문서 §7)과의 대응

| 원 제안 | 현재 |
|---|---|
| 1 Motion Spec 분해 | 21번 효과 카드(타임라인·파라미터 필드), D-017 촬영 규칙 |
| 2 Effect Recipe 카드 | `references/README.md` 레시피 색인(RCP-NN) |
| 3 Asset Registry | `assets/registry.json`, `fetch.mjs`, `sources.json`, `explore.mjs`, 24번 |
| 4 Stack Baseline | §3, D-016 개정(§1) |
| 5 Performance Budget | §5 임시값 — P2 대기 |
| 6 Input Translation | §4 규칙 3, spike의 키오스크 자동 시선·reduced-motion |
| 7 Motion QA | §6 충실도 게이트 |
| (추가) | 셰이더·후처리 검토(체크리스트 §12), 외부 컴포넌트 검토(23번), AI 영상 경로(22번) |
