# D-188 심박 표시 — 검출 · 걸러내기 실측 (2026-11-19)
- `eval_archive.mts <archive.json>`: 실험실 98장면(d0 · d1 × 4잡음 × −5…25 dB, 10 s). Reference = 깨끗한 신호의 R(`beats.ts detectR`). 투표 조합에서 150 bpm 초과 표시 0, 최대 오차 5–7 bpm, 칼만만 −5 dB 18.7 → 투표 6.0. 심방세동(MIT-BIH 219)에서 남던 22 bpm 오차는 「길어진 간격이면 바로 --」로 6 이하.
- `eval_stream.mts <rec.json>`: 실시간 재생(d1 혼합 0 dB, 70 s, `../overlay-zones-20261113/record.cjs`로 녹화). 투표 없는 검출기도 이 신호에서는 69–81 bpm(가짜 피크 없음). 걸러낸 표시 72–77, 96 %. 스트레스: 움직임 잡음 61 %(문턱 갱신 상한 전 20 %) 엉뚱한 값 없음, 전극 떨어짐 → 연결 불량, 평탄 → 신호 없음.
- `ui_check.cjs <app> <tag>`: 실시간 38 s 분당 72번 뜀 · 70–80 bpm, 실험실 70–71 bpm. `ui_live_stats_*.png`, `ui_lab_transport.png`.
