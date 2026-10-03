# attic-fork — REF-002 포크 연습 (D-047)

연습 빌드. **원본 에셋(`public/_original/`)은 gitignore된 로컬 전용이고 커밋·배포 금지.** 이 폴더의 코드만 저장소에 있다.

```
npm run spike -- attic-fork
```

URL: `?p=0..2` 스크롤 위치 고정(0–1 헤더 갤러리 방, 1–2 책상 → 책장 하강) · `?t=0..1` 낮(0) → 밤(1) · `?cycle=20` 낮/밤 자동 순환(초) · `?hud=0`.
휠로 p를 움직이고, 포인터로 시선이 ±0.75°/±0.2° 돈다(원본 EFX-002-01·02·03 구조).

원본 반입(로컬): `public/_original/assets/{models,textures,basis}` — 방법은 `docs/uiux_system/rounds/R1/IDEA-R1-SPACE-FORK.md` §6.
