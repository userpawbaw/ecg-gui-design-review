# 실시간 측정 탭 A (D-151) — 2026-10-20

| 파일 | 상태 | 확인한 것 |
|---|---|---|
| `01_bridge_connected.png` | 원본 저장소 브리지 `--replay synth --methods M_FE,M04,M05S --serve` (127.0.0.1:8765) | `● 연결됨`, iframe 1개(`live.html?embed=1`), 배지 `LIVE · 외부 브리지`, 바닥글 `실측 표시 · 외부 브리지 세션 · 이 앱은 기록하지 않음`, 출처 `sourceMode: LIVE_BRIDGE_EMBED`, 페이지 오류 0 |
| `02_bridge_down.png` | `?bridge=127.0.0.1:9` (빈 포트) | `○ 브리지 없음`, iframe 0개, 실행 명령 안내 |

- 실험실로 돌아가면 배지 `GENERATED REPLAY`, 바닥글 `저장 출력 재생 · 실제 장치 세션 없음`, 어두운 서고 배경이 돌아온다.
- 파형은 합성 재생(`--replay synth`)이다. 실보드 측정이 아니며 성능 수치가 아니다.
- 확인 안 함: 실제 AD8232 + Uno 보드, 전시 PC의 교차 출처, 실제 GPU. SwiftShader 헤드리스 캡처.
- 남은 점: 바닥글 왼쪽 상태 줄은 실험실의 마지막 재생 상태 문장을 그대로 보인다(공지용 `role=status`라 그대로 둠).
