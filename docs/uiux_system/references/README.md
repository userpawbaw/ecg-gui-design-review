# 레퍼런스 효과 기록 색인

규칙: [`../21_REFERENCE_EFFECT_RECORDS.md`](../21_REFERENCE_EFFECT_RECORDS.md) — 레퍼런스의 특징적 효과를 우리 시스템에서 재현하는 데 필요한 정보를 강제한다. `npm run records:check`가 필수 절과 효과 카드 필드를 검사한다.

## 레퍼런스

| ID | 사이트 | 효과 카드 | 상태 |
|---|---|---|---|
| [REF-001](REF-001_MOTO_CARD.md) | moto-card.com | EFX-001-01 ~ 08 (역광 지구, match cut, 원통 갤러리, 금속 카드 반사, 곡면 숫자 벽, clip reveal, 타이포 끊김 사례, 히어로 반복 영상) | 녹화 + 소스 + 라이브 측정 |

## 레시피 색인

두 개 이상의 레퍼런스에서 반복되면 여기서 공통 레시피로 승격한다. 현재는 모두 단일 사례 후보다.

| ID | 이름 | 사례 |
|---|---|---|
| RCP-01 | 지연 추종 위치 매핑 (`scrub: 1` + Lenis) | REF-001 |
| RCP-02 | 충격-감쇠 회전 (base ≠ 0) | REF-001 |
| RCP-03 | 형태 연속 match cut | REF-001 |
| RCP-04 | DOM 레이아웃 + WebGL 그리기 하이브리드 | REF-001 |
| RCP-05 | counter-translate reveal | REF-001 |
| RCP-06 | 인트로 1회 + 뒷부분 반복 영상 | REF-001 |
| RCP-07 | 동적 평면 반사 | REF-001 |
