# disease-zoom-20261125 — D-194 특징별 표시 구간 · 확대 애니메이션

- `init_vals.cjs`, `init_vals2.cjs` — 질환 탭 초기 표시 구간 · 진폭(직접 진입, 질환 전환, 실험실 10 s · 0.5 mV에서 들어오고 돌아가기).
- `focus_fraction.ts` → `focus_fraction.txt` — 특징별 초점이 화면에서 차지하는 비율(5 s) + 구간 규칙 후보.
- `spot_px.py` — 멈춤 캡처의 밝은 초점 폭(픽셀) — 계산과 대조.
- `zoom_shots.cjs <url> <disease> [opts]` — 투어 재생 중 단계 · 구간 변화 기록, 각 멈춤과 확대 중간 캡처(`<id>_hold*.png`, `<id>_zoom_*.png`).
- 헤드리스 소프트웨어 렌더(프레임 수치 무의미).
