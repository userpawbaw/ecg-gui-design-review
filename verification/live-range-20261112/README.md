# 실시간 탭 표시 범위 자동 — 위아래 따로 (D-178, 2026-11-12)

- `shot.cjs <out.png>`: 실험실 → 「실시간 측정」, 14 s 뒤 `.live-native` 스크린샷(스크롤 · 분리, 자동 범위).
- 브리지: `ECG_SOURCE=<원본 저장소> npm run bridge:replay -- --methods M_FE,M04,M05S`(합성 신호 재생).
- `before.png`: `git show HEAD:prototype/v2/src/live/liveStream.ts`로 잠시 바꿔 찍음(되돌림, `git diff` 확인). `after.png`: 수정 후. `cmp.png`: 나란히.
- 결과: 이전 입력 0.8–3.8 · 출력 −1.5–1.5 mV(아래 절반 빔) → 수정 후 입력 2.0–3.2 · 출력 −0.3–0.9 mV, 파형이 칸 높이 대부분을 채움. 출력 칸들은 같은 배율 · 같은 중심.
- 두 사진은 찍은 시점(재생 위치)이 달라 파형 자체는 다른 구간이다.
- 단위 시험: `tests/live-axis.test.ts` 「D-178 위아래 따로」.
