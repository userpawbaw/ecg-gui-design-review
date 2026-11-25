# intro-video-20261125 — D-195 도입부 3D 장면을 영상으로

- `share.cjs` → `share.txt` — 파형 단계 프레임 시간 분담(3D만 끔 / 파형만 끔, 소프트웨어 렌더 상대값). 결론: 비용은 거의 전부 3D 장면.
- `render_frames.cjs <url> <out> <first|descent|heart|probe>` — 엔진을 멈추고 진행값 · 시계 · 박동 위상을 고정해 1920×1080 프레임 렌더(`?introlive=1&perf=fluid`, DOM 숨김, 감쇠 값 예열). 고정 빌드(`vite build` + `vite preview`)에서 돌린다 — 개발 서버는 코드를 고치면 페이지를 새로 고쳐 렌더가 끊긴다.
- `live_ref.cjs` — 같은 진행값의 실시간 화면(프레임 렌더와 대조).
- `make_assets.py <frames> <data/intro-video>` — 첫 화면 반복(교차 페이드) · 하강 영상(H.264 CRF 21) · 심장 박동 프레임(쉬는 화면과 다른 영역만 WebP) · manifest.
- `video_flow.cjs` — 영상 경로 흐름 확인(첫 화면 → 클릭 → 하강 → 파형 단계 · 박동 프레임 · 휠 겹침 · fps).
