# Reference Repro — REF-003·REF-004 재현 spike

제품 UI가 아니다. 효과 카드(REF-003 white-desert, REF-004 seasats)의 수치와 외부 CC0·공공 도메인 재료, 공개 라이브러리로
레퍼런스 수준을 재현해 보는 연습 페이지다. 모든 문구·관측선·지명 카드는 **데모**. 레퍼런스 에셋·코드는 쓰지 않았다.

- `ref003.html` — 고정 hero(Blender 렌더 설경 영상) + 두 겹 볼륨 구름(0.9 / 0.55 px/px) + 제목 흐림, 문장 마스크, 안개 판 전환, NASA 위성 지도 위 경로 그리기(DrawSVG) + 표시점(MotionPath) + 소나 링
- `ref004.html` — vanilla three.js 지구: globe / glow / mark 렌더 타깃 + 합성 셰이더(흰 표시층, 윤곽선), 인스턴스 눈금 링, 점선 항적, hover 조리개 사진 카드, 필터 → 최대 군집 회전, 드래그 관성. `?manual=1`은 캡처용 수동 시계

```bash
npm install && npm run build && npm run preview     # http://127.0.0.1:4191/
npm run qa                                          # 헤드리스 캡처 + results.json
python3 scripts/prepare_assets.py --renders <Blender 렌더 폴더>   # 재료 다시 만들기(선택)
```

재료·판정·기술 스택 점검: `docs/uiux_system/handoffs/REFERENCE_REPRO_AND_QUALITY_GAP_2026-09-25.md`.
Credits: NASA Earth Observatory Blue Marble NG (public domain); Poly Haven horn-koppe_snow and preview images (CC0);
fonts Oswald, Instrument Serif, Inter Tight, Instrument Sans, IBM Plex Mono (OFL).
