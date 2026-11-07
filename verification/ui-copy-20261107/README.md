# 화면 글 교정 · 상태 그림 (D-160, 2026-11-07)

`prototype/v2` 빌드를 `node scripts/serve-v2.cjs`(4173)로 띄워 Playwright 1600×1000으로 캡처했다.

| 파일 | 내용 |
|---|---|
| 01_lab_heading_before_after | 실험실 위쪽. 위 = 이전(표어형 제목, ARCHIVED REPLAY 배지), 아래 = 교정(명사구 제목, 저장 신호 재생 칩) |
| 02_intro_notice_before_after | 도입부 하단. 위 = 「… 실제 장치 연결 없음」 글줄, 아래 = 저장 신호 재생 칩 |
| 03_live_status_after_mockbridge | 실시간 측정 연결 상태. **시험용 가짜 브리지**(측정값 아님)로 RTF 0.94 · 처리 누락 2 · 수신 간격 260 ms를 보내 경고 칩 두 개와 「진단 정보」를 펼친 모습 |
| 04_glyph_set | 상태 그림 11종 · 칩 · 큰 상태 표시 |
| 05_live_no_bridge_after | 브리지 연결 없음 상태 |
| 06_lab_method_panel_after | 기법 설명 패널(methods.json 학술 문체) |
| 08_noise_scene_after | 잡음 장면 하단 출처 칩 |

확인: `npx tsc --noEmit` · `npm run build` 통과. 브라우저 시험 live · intro · story · story-noise · expo: 11 통과, 2 생략(10분 재생 내구 시험 등, 기존과 같음).
