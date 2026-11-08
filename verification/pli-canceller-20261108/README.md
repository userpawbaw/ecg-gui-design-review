# 실시간 측정 — 원본 전원선 고조파 추적 제거기 연결 확인 (D-162, 2026-11-08)

- 원본 저장소 `claude/pli-harmonic-canceller`(a493212: D-52 제거기 7e6406f + D-53 보드 1000 Hz).
- 재생 브리지: `npm run bridge:replay -- --signal mitdb:100 --noise pli --snr 0 --pli canceller|notch`(MIT-BIH 100 + 합성 전원 간섭 0 dB, 입력은 저장 · 합성 신호이고 처리는 실제 브리지 경로). 보드 표본율 기본 1000 Hz로 흘리고 250 Hz로 내린다.
- 앱: `node scripts/serve-v2.cjs`(4173) 빌드, `?route=lab&bg=0` → 실시간 측정, 1600 × 1000, 브리지 시작 약 17 s 뒤.

| 파일 | 내용 |
|---|---|
| 01_mitdb100_pli0dB_canceller_top_notch_bottom | 위 두 칸 = `--pli canceller`(기본), 아래 두 칸 = `--pli notch`. 공통 전처리 출력에서 노치 쪽에만 잔물결이 남는다 `[캡처]` |
| 02_live_full_canceller · 02_live_full_notch | 같은 두 실행의 화면 전체(입력 · 공통 전처리 · SWT · 칼만) |

화면 이름표 「공통 전처리(0.5–100 Hz, 전원선 잡음 제거)」는 두 방식에 같다. 브리지가 어느 방식인지 스트림에 싣지 않기 때문이다(D-162).
이 화면 비교는 눈으로 본 것이다. 잔류 크기 수치는 원본 D-52(합성 시험: 잔류 ECG p-p의 1.5–2.3배 → 0.06–0.09배)를 따르고 여기서 다시 재지 않았다.
