# 실시간 신호원 고르기 · 재생 신호 D1 혼합 0 dB (D-179, 2026-11-12)

- `d1_replay.png`: `npm run bridge:replay`(기본 = D1 기록 100 + 혼합 잡음 0 dB, seed 13) → 실시간 탭. 상태 줄 「저장 신호 재생 · d1 · 기록 100 · 혼합 잡음 0 dB」, 위아래 따로 맞춘 범위(D-178).
- 실행 파일(리눅스, `--root` 패키지 흉내 · `ECG_PYTHON=python3`):
  - `--selftest --no-torch`: 신호원 재생 — d1 · 기록 100, PASS web · 10분 자료(가짜 manifest) · bridge running · **signal source** · /fe · stream 37 frames.
  - 대화형(`script`로 TTY): 메뉴 「[Enter] 재생 … / [1] 보드 /dev/ttyS0」, `x` → 안내 후 다시 묻기, `/dev/pts/0`(원본 `fake_arduino.py --source d1` 가상 보드) → 「브리지 준비됨」, `/status` = `{"kind":"board","label":"보드 /dev/pts/0"}`, `/bridge/stream`에 raw · M_FE · M04 · M05S.
- Windows에서 실제 COM 포트 목록 · 보드 연결은 사용자 PC 확인이 필요하다(러너에는 시리얼 장치가 없다).
- 혼합 구성(기록 100 길이, seed 0–24)을 나열해 seed 13을 골랐다 — D-179.
