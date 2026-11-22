# D-189 심질환 파형 탭 확인 (2026-11-21)
`tab_check.cjs <app> <tag>`: 실험실 → 심질환 파형 탭 → 11질환을 차례로 눌러 기록 번호 · 주석 시각 확인 → 실험실로 돌아가 원래 장면 확인.
결과: normal 100 · sbr 232 · apc 222(심방 조기 박동 5.0 · 5.7 · 7.8 · 9.5 s) · afib 219 · afl 222 · pvc 233(1.0 · 3.4 · 7.6 · 8.8 s) · bigeminy 200 · vt 200(심실 빈맥 구간 1.2–3.4 s) · lbbb 111 · rbbb 212 · avb2 231. 실험실 복귀 후 장면 그대로, 페이지 오류 없음. 화면: `t_pvc.png` · `t_afib.png` · `t_lbbb.png`.
자료 생성: `cd <원본 저장소>; python3 ../ecg-gui-design-review/scripts/disease/build_disease_bank.py ../ecg-gui-design-review/data/disease` → `node scripts/prepare-v2.cjs`가 `prototype/v2/public/disease`로 복사(실행 명령 `npm run story`도 없으면 복사).

## 2026-11-22 60 s
`find60.py`(60 s 후보 수 · 기록별), `tab_check.cjs`(t60_*), `seek60.cjs`(45 s 탐색 · 재생): 11질환 모두 60 s, 심방 조기 박동 3개(17.5 · 23.3 · 50.9 s, 기록 100), 심실 조기 박동 11개(기록 228), 이단맥 41개, 심실 빈맥 구간 27.1–29.3 s. 오류 없음.
