# attic-fork — REF-002 포크 연습 (D-047)

연습 빌드. **원본 에셋(`public/_original/`)은 gitignore된 로컬 전용이고 커밋·배포 금지.** 이 폴더의 코드만 저장소에 있다.

```
npm run spike -- attic-fork
```

URL: `?story=1`(밤에서 시작, 책이 열리면 새벽) · 휠로 p=0→3 · `?p=0..3` 고정(0–1 갤러리 방, 1–1.5 책장 하강, 1.5–2 책 꺼냄, 2–2.5 표지 열림, 2.5–3 페이지 월드) · `?tod=0..1` 낮 0 · 황혼 .25 · 밤 .5 · 새벽 .75 · `?cycle=24` 낮/밤 자동 순환(초) · `?clock=초` 박동 시계 고정 · `?ha=0..1.5` · `?lamps=0` · `?hud=0`.
휠로 p를 움직이고, 포인터로 시선이 ±0.75°/±0.2° 돈다(원본 EFX-002-01·02·03 구조).

원본 반입(로컬): `public/_original/assets/{models,textures,basis}` — 방법은 `docs/uiux_system/rounds/R1/IDEA-R1-SPACE-FORK.md` §6.

에셋: `public/assets/heart.glb` = HuBMAP Human Reference Atlas 심장(남), CC BY 4.0, Visible Human Male 기반, 변형본(출처 표기 필요). `public/ecg-s038.json`은 `node scripts/extract-ecg.mjs`로 `prototype/v2/public/archive.json`에서 뽑은 저장값(D0 S038 `d0-awgn-0`).

성능 확인: URL에 `?perf=1`(화면에 프레임 시간), 콘솔에서 `__bench(p,40)`(프레임을 연달아 그려 GPU 완료까지 잰 평균 ms). 비용 분리 플래그 `?noecg` `?noshadow` `?nopw` `?nomain`. 매 프레임 캔버스 재그리기는 금지(F-034) — 파형은 `src/trace.ts`의 GPU 선, 종이는 한 번만 그린 정적 텍스처.
