# 24. 에셋 조사 단계와 로그인 요청

상태: **채택** (D-022, D-020을 확장). 모든 3D·재질·사진·영상 에셋 조달은 이 단계에서 시작한다.
연결: `assets/sources.json`(조달처 목록), `scripts/assets/explore.mjs`(탐색), `scripts/assets/fetch.mjs`(받기·고정), `assets/auth-requests.json`(로그인 요청), `assets/research/`(탐색 기록).

## 1. 흐름

```text
필요한 에셋 정의(종류·용도·해상도)
  → node scripts/assets/explore.mjs "<검색어>" --kind=<model|material|hdri|photo|video|sprite|texture>
      모든 해당 조달처를 순서대로 검색 → assets/research/<날짜>-<종류>-<검색어>.json
      계정 조달처에 후보가 있거나 키 없이 검색할 수 없으면 → assets/auth-requests.json + "LOGIN REQUEST" 출력
  → 후보 비교(라이선스·크기·품질·스타일) → registry 항목 추가(test-only)
  → node scripts/assets/fetch.mjs --pin --only=<id>  (라이선스 허용 목록, 해시 고정)
  → 사용 후 status approved
```

## 2. 조달처 (2026-09-26 이 컨테이너에서 확인)

| 조달처 | 종류 | 라이선스 | 접근 | 탐색 | 자동 받기 |
|---|---|---|---|---|---|
| Poly Haven | 모델·재질·HDRI | CC0 | API | O | O `polyhaven` |
| **ambientCG** | 재질·HDRI(모델은 사실상 없음) | CC0 | API | O | O `ambientcg` |
| **Openverse** | 사진 | 항목별(CC0·PD·BY·BY-SA·BY-NC·BY-NC-SA로 제한) | API | O | O `openverse`(받을 때마다 라이선스 재확인) |
| Kenney | 로우폴리 모델·스프라이트 | CC0 | 사이트 | O | 팩 zip 직접 링크 → `url` |
| Quaternius | 로우폴리 모델 | CC0 | 사이트 | O(팩 이름) | 수동(Google Drive/itch) |
| Three D Scans | 조각상 스캔 | 저작권 제한 없음(사이트 표기, 항목 확인) | 사이트 | O | 수동 |
| OpenGameArt | 모델·스프라이트·텍스처 | 항목별 혼재(GPL 전용 불가) | 사이트 | O | 수동 |
| Mixkit | 영상 | Mixkit License | 사이트 | O | 미리보기 mp4 → `url` |
| NASA | 위성영상·지도 | 공공 | 일부 | 주제별 수동 | `url` |
| **Sketchfab** | 모델 | 항목별(Standard·Editorial 불가) | 검색 공개, **받기는 토큰** | O | `sketchfab` — `SKETCHFAB_API_TOKEN` |
| **Pexels** | 사진·영상 | Pexels License | **검색부터 키 필요** | 키 있을 때 | `pexels` — `PEXELS_API_KEY` |
| Unsplash | 사진 | Unsplash License | 키 필요 | 미포함(요청 없음) | — |
| 차단 | Poly Pizza, Smithsonian 3D, Behance, Landbook, Lapa Ninja | — | 403 | — | — |

## 3. 로그인 요청 규칙

1. 탐색에서 Sketchfab 후보가 나오거나(받기에 토큰 필요) Pexels를 검색해야 하는데 키가 없으면, `explore.mjs`가 요청을 `assets/auth-requests.json`에 쌓고 화면에 `LOGIN REQUEST`를 출력한다.
2. AI는 그 요청을 사용자에게 전달한다: **어느 사이트에 계정을 만들고, 어떤 환경 변수 이름으로, 어디에 넣을지**(클라우드 환경 설정 → Edit → 환경 변수; 새 세션부터 적용). 후보 목록(제목·라이선스·링크)을 함께 보여 줘서 로그인할 가치가 있는지 사용자가 판단하게 한다.
3. **토큰·비밀번호를 채팅에 붙여 넣으라고 하지 않는다.** 저장소에도 넣지 않는다.
4. 토큰이 없는 동안은 토큰이 필요 없는 조달처로 계속 진행한다. `fetch.mjs`는 토큰이 없으면 `LOGIN REQUIRED`로 멈춘다.
5. 토큰이 들어온 세션에서 같은 검색을 다시 돌리면 해당 요청은 더 이상 출력되지 않는다. 받은 뒤 요청의 `status`를 `resolved`로 바꾼다.

사용할 환경 변수: `SKETCHFAB_API_TOKEN`(sketchfab.com → Settings → Password & API), `PEXELS_API_KEY`(pexels.com/api, 로그인 후 발급).

## 4. 시험 (2026-09-26 `[테스트]`)

| 검색 | 결과 |
|---|---|
| model "bookshelf" | Poly Haven 4, OpenGameArt 3, Sketchfab 4(CC-BY 3, CC-BY-NC 1) → 로그인 요청 생성 |
| model "furniture" | Poly Haven 4, Kenney 1(furniture-kit), Quaternius 2, OpenGameArt 4, Sketchfab 4, ambientCG 0 |
| material "wood" | Poly Haven 3, ambientCG 3 |
| photo "clouds" | Openverse 3, Pexels → 키 필요 요청 |
| video "clouds" | Mixkit 3, Pexels → 키 필요 요청 |
| `fetch.mjs` Sketchfab 항목, 토큰 없음 | `LOGIN REQUIRED — ask the user to add SKETCHFAB_API_TOKEN …`로 정지 |

첫 구현에서 고친 것: Kenney 검색 주소(`?q=`)가 검색어를 무시해 무관한 팩을 돌려줌 → `?search=`. ambientCG API가 `type`을 무시해 모델 검색에 목재 재질이 섞임 → `dataType`으로 직접 거름(ambientCG에는 3D 모델이 사실상 없다 — 재질·HDRI용).

## 5. 한계

사이트 긁기(Kenney·Quaternius·Three D Scans·OpenGameArt·Mixkit)는 사이트 구조가 바뀌면 깨진다 — 결과가 0이면 `error`/`no-match`를 구별해 본다. Sketchfab·Pexels 받기 경로는 토큰이 없어 실제 다운로드는 미시험(요청 형식은 공개 API 문서 기준).
