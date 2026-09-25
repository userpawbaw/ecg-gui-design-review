# Scroll Globe — technology spike

제품 UI가 아니다. moto-card.com류 "스크롤 → 3D 지구 회전 + 문구/버튼 전환" 연출을 이 저장소 환경에서
three.js + GSAP ScrollTrigger + Lenis로 재현할 수 있는지 확인하는 독립 spike다.
점검 결과: `docs/uiux_system/handoffs/EFFECT_PRODUCTION_PIPELINE_AUDIT_2026-09-25.md`.

```bash
npm install
npm run assets   # spike 전용 지구 텍스처 (라이선스 미기재 → gitignore, 제품 사용 금지)
npm run build && npm run preview   # http://127.0.0.1:4180/  (?autoplay=1 = 전시 시간 구동)
CHROMIUM=/opt/pw-browsers/chromium npm run qa   # 스크롤 위치별 캡처 + 상태값 → qa-output/
```

한 개의 GSAP master timeline(progress 0..1)이 WebGL layer와 DOM layer를 동시에 구동하고,
입력 driver(스크롤 / 시간 / reduced-motion)만 교체한다.
