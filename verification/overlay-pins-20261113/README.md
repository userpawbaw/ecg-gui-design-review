# 겹치기 범례 고정 · 클릭 돌기 · 실험실 겹치기 (2026-11-13, D-185)
- `live_pins.cjs`: 실시간 겹치기에서 범례 단추 2개 고정 → `live_1_pin2.png`(SWT · 칼만 강조, 공통 전처리 흐림), 하나 해제 → `live_2_pin1.png`, 모두 해제 → `live_3_none.png`.
- `lab_overlay.cjs`: 실험실 기법 3개 + 중첩 → `lab2_0_overlay.png`, 고정 2개 → `lab2_1_pin2.png`, 멈춘 상태 파형 위 마우스 → `lab2_2_hover.png`, 시트 `lab_sheet.png`.
- `click_cycle.cjs`: 겹친 자리에서 올리기 → 클릭 ×3(`data-focus`): 실험실 M04 → M06 → M08 → M04, 실시간 칼만 → SWT → 공통 전처리 → 입력. 경사면 지점은 옆으로 3 px만 가도 모든 선이 24 px 밖이라(`?ovdbg=1` 거리 기록) 붙잡기 확인은 평탄한 곳에서.
