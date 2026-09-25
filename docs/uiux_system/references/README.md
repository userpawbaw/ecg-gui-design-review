# 레퍼런스 효과 기록 색인

규칙: [`../21_REFERENCE_EFFECT_RECORDS.md`](../21_REFERENCE_EFFECT_RECORDS.md) — 레퍼런스의 특징적 효과를 우리 시스템에서 재현하는 데 필요한 정보를 강제한다. `npm run records:check`가 필수 절과 효과 카드 필드를 검사한다.

## 레퍼런스

| ID | 사이트 | 효과 카드 | 상태 |
|---|---|---|---|
| [REF-001](REF-001_MOTO_CARD.md) | moto-card.com | EFX-001-01 ~ 08 (역광 지구, match cut, 원통 갤러리, 금속 카드 반사, 곡면 숫자 벽, clip reveal, 타이포 끊김 사례, 히어로 반복 영상) | 녹화 + 소스 + 라이브 측정 |
| [REF-002](REF-002_LEOPARPEIX.md) | leoparpeix.com | EFX-002-01 ~ 07 (베이크 조명 3D 방 + 포인터 시선, 스크롤 카메라 하강·접근, 같은 집 속 다락방 섹션, 관성·스냅 드래그 갤러리, 틀 안 이미지 시차, GPU 유체 왜곡, 3D 벌 동반자) | 녹화(HUD) + 소스 + 라이브 측정 |

## 레시피 색인

두 개 이상의 레퍼런스에서 반복되면 여기서 공통 레시피로 승격한다.

### 공통 레시피 (2개 이상 레퍼런스)

| ID | 이름 | 핵심 | 사례 |
|---|---|---|---|
| RCP-08 | 프레임률 독립 지수 보간 | `x = lerp(x, target, 1 − exp(−k·dt))` / `v *= k^(60·dt)` — "부드럽게 따라옴·감속"의 공통 도구 | REF-001 EFX-001-04, REF-002 EFX-002-01·04 |
| RCP-01 | Lenis 관성 스크롤을 단일 시간축으로 | `gsap.ticker`로 Lenis 구동 + `lagSmoothing(0)`, 3D·DOM이 같은 스크롤 값을 읽음 | REF-001(Lenis duration 1.6 + scrub 1), REF-002(Lenis lerp 0.085 + 카메라 직접 매핑) |

### 단일 사례 후보

| ID | 이름 | 사례 |
|---|---|---|
| RCP-01 | 지연 추종 위치 매핑 (`scrub: 1` + Lenis) | REF-001 |
| RCP-02 | 충격-감쇠 회전 (base ≠ 0) | REF-001 |
| RCP-03 | 형태 연속 match cut | REF-001 |
| RCP-04 | DOM 레이아웃 + WebGL 그리기 하이브리드 | REF-001 |
| RCP-05 | counter-translate reveal | REF-001 |
| RCP-06 | 인트로 1회 + 뒷부분 반복 영상 | REF-001 |
| RCP-07 | 동적 평면 반사 | REF-001 |
| RCP-09 | 베이크 조명 3D 장면 | REF-002 |
| RCP-10 | 스크롤 → 카메라 선형 이동(다중 구간) | REF-002 |
| RCP-11 | 카메라 3단 계층(기준/포인터/스크롤) | REF-002 |
| RCP-12 | 관성·스냅 드래그 루프 | REF-002 |
| RCP-13 | 틀 안 이미지 시차 | REF-002 |
| RCP-14 | 저해상도 GPU 유체 → 화면 왜곡 | REF-002 |
