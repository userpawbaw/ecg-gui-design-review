# 23. 외부 UI 컴포넌트 검토 단계와 후보 목록

상태: **단계 채택, 후보 대부분 미사용** (D-024). 목록의 라이브러리는 다음 레퍼런스 재현 구현 때 실제로 써 본 뒤 결정한다.
연결: D-021(외부 컴포넌트 = 기법 공급원), D-019(12장 대조), `handoffs/REF003_ROUTE_FIX_COMPONENTS_ASSETS_2026-09-26.md` §3–4.

## 1. 출처

사용자가 다른 AI와 나눈 대화로 모은 목록(2026-09-26 `[대화]`)을 이 컨테이너에서 직접 확인했다. 대화 속 설명은 검증 전 주장으로 다루고, 아래 표는 확인한 사실만 적는다.

## 2. 코드까지 가져올 수 있는 곳 (2026-09-26 확인 `[런타임]`)

| 라이브러리 | 접근 | 코드 확보 경로 | 라이선스(확인) | 스택 | 사용 이력 | 메모 |
|---|---|---|---|---|---|---|
| Magic UI | 200 | shadcn registry JSON (`/r/<name>.json`) | MIT | React + Tailwind + motion | **REF-003 B에서 사용** — Ripple이 소나 의미와 달라 FAIL | 연출용 컴포넌트가 많음 |
| Aceternity UI | 200 | registry JSON | 최종 결과물 사용 허용, **소스 재배포 금지** | React + Tailwind + motion | 기법만 참고(Tracing Beam) | 저장소에 코드 사본 두지 않음 |
| shadcn/ui | 200 | registry `index.json` + CLI | MIT | React + Tailwind + Radix/Base UI | 미사용 | 범용 UI(버튼·탭·다이얼로그)의 기준점 |
| Origin UI → **coss.com/ui** | 200 (originui.com → coss.com/ui로 이동) | registry | **AGPL-3.0** (저장소 루트, 별도 UI 라이선스 파일 없음) | React + Tailwind + Base UI | 미사용 | ⚠ 대화 속 "무료"는 맞지만 **코드를 복사하면 AGPL 의무**(파생물 공개). 복사 전 사용자 확인 필수 |
| HyperUI | 200 | 사이트·GitHub의 HTML 조각 | MIT | **HTML + Tailwind** (프레임워크 없음) | 미사용 | vanilla 스택에 바로 맞음 |
| Flowbite | 200 | npm `flowbite` 4.0.2 | MIT (Pro 블록은 유료) | Tailwind + vanilla JS | 미사용 | vanilla 친화 |
| daisyUI | 200 | npm `daisyui` 5.7.46 | MIT | Tailwind 플러그인(CSS만) | 미사용 | 테마·토큰 방식 |
| Material UI | 200 | npm `@mui/material` 9.4.0 | MIT (MUI X Pro/Premium은 유료 라이선스) | React + Emotion | 미사용 | Material 외형이 강해 레퍼런스 연출과 거리 |
| Mantine | 200 | npm `@mantine/core` 9.6.2 | MIT | React | 미사용 | 범용 앱 UI |
| React Bits | 200 | 사이트·registry | MIT + **Commons Clause**(재판매·재배포 금지) | React | 미사용 | 연출 컴포넌트 많음 |

## 3. 영감 위주 (코드 없음)

| 사이트 | 이 컨테이너 접근 | 비고 |
|---|---|---|
| Behance | **403** | 작품 이미지 |
| Dribbble | 202(봇 확인 화면) — 사실상 불가 | 샷 이미지 |
| Mobbin | 200, 내용은 **로그인 필요** | 앱 화면 캡처 모음 |
| Landbook | **403** | 랜딩 페이지 캡처 |
| Lapa Ninja | **403** | 랜딩 페이지 캡처 |
| SaaS Landing Page | 200 | 랜딩 페이지 캡처 |
| UI Garage | 200 (uigarage.net → www) | UI 패턴 캡처 |

영감 사이트는 레퍼런스 마이닝(13번, 17번 registry)의 입력이지 컴포넌트 공급원이 아니다. 접근되는 곳도 이미지·레이아웃만 참고한다.

## 4. 검토 단계 — 구현 전 (C1–C3) → 구현 후 (C4)

레퍼런스 재현이나 제품 UI 구현에서 **효과·컴포넌트마다** 한 번씩 거친다.

| 단계 | 하는 일 | 산출물 |
|---|---|---|
| C1 분류 | 효과를 **레퍼런스 고유 연출**(소나, follow 경로, 카메라 하강)과 **범용 UI**(버튼, 필터 탭, 카드, 툴팁, 다이얼로그)로 나눈다 | 효과 카드 옆 한 줄 |
| C2 후보 찾기 | 위 표에서 후보를 찾고, 각 후보를 셋 중 하나로 분류: **그대로 사용** / **코드 참조 변형**(구조·기법만 가져와 우리 스택으로 다시 씀) / **해당 없음** | 후보 표(라이브러리·컴포넌트·라이선스·스택 맞음 여부) |
| C3 품질 예측 | 직접 제작 vs 사용 vs 참조 변형을 아래 기준으로 예측하고, **비교할 가치가 있는 것만** C4로 보낸다 | 예측 표 + 선택 이유 |
| C4 실제 비교 | 같은 데이터·같은 화면으로 두 변형을 만들어 D-019 12장 대조 + 비용 측정 → KEEP / TUNE / REJECT | verification/ + D 기록 |

### C3 예측 기준

| 기준 | 질문 |
|---|---|
| 의미 일치 | 컴포넌트의 동작이 레퍼런스 효과와 같은 의미인가(예: Ripple ≠ 소나) |
| 도메인 로직 | 어려운 부분(예: follow 매핑)이 컴포넌트에 있는가, 결국 손으로 쓰는가 |
| 스택 비용 | vanilla 엔진에 React·Tailwind·motion을 새로 들이는가(P5 결정과 연결) |
| 수정 비용 | 하드코딩 값·구조를 얼마나 고쳐야 하는가 |
| 라이선스 | MIT / 재배포 금지 / Commons Clause / **AGPL**(복사 시 의무) |
| 접근성·상태 | 키보드·포커스·reduced-motion·터치가 이미 되어 있는가(범용 UI에서 외부 컴포넌트의 가장 큰 이득) |

### 이번 증거에서 나온 예측 경향 (D-021)

- **레퍼런스 고유 연출** → 직접 제작이 기본. 외부 컴포넌트는 기법 공급원(`pathLength`, 그라디언트 빔). C4는 기법이 결정적일 때만.
- **범용 UI** → 외부 컴포넌트(특히 접근성이 갖춰진 shadcn/ui, HyperUI·Flowbite 같은 vanilla 친화 조각)가 이길 **가능성이 있다** — 아직 증거 없음. 다음 레퍼런스 구현에서 C4로 확인한다.

## 5. 다음 시험 계획

다음 레퍼런스 재현에서 범용 UI 하나 이상(예: REF-004의 All/Commercial/Defense 필터 버튼, hover 사진 카드)을 골라 C1–C4를 처음부터 끝까지 수행한다. 후보: HyperUI 또는 Flowbite(vanilla, MIT) 1개, shadcn/ui(React, MIT) 1개, 직접 제작 1개. coss ui(AGPL)는 사용자 확인 전에는 코드를 복사하지 않고 구조만 참고한다.
