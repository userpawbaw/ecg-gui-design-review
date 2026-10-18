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

### 1.1 서고·다락방의 기존 승인 예외 — 자체 키트 주력, 외부 에셋은 참고·보조

2026-10-18 재확인. 근거는 `rounds/R1/REVIEW-R1-ARCHIVE-SHADOW-ASSET-20261016.md` §5와 §7.2의 사용자 진행 확인이다. 서고에서는 과거 D-030의 **외부 조달 우선**을 기계적으로 적용하지 않는다.

- **형태**: 베벨·얕은 단차·실제 치수를 가진 자체 매개변수 키트를 주력으로 한다. Poly Haven은 참고·보조 후보이며 출처나 CC0만으로 품질 채택하지 않는다. 기존 Story 소품·사람은 해당 소유 범위를 조율한다.
- **재질**: 단색 + 낮은 대비의 고운 결, 책은 단색과 개체별 명도 변화가 기준이다. 해당 검토안은 노이즈 텍스처를 쓰지 않도록 정했다. 얼룩·먼지·마모를 자동으로 추가해 디테일이나 오래된 서고 분위기를 대신하지 않는다. 결이 필요한 재질은 모델과 분리해 직접 만들거나 고품질 텍스처 후보를 따로 조사·비교한다(조사·라이선스·등록 절차는 이 문서의 기존 흐름을 적용).
- **화면 품질 판정**: 실제 카메라 거리에서 흐림·반복·오염 무늬·색 대비를 확인한다. 문제가 있으면 원본 알베도/노멀/거칠기, 텍셀·UV, 베이크, 압축을 구분해 보고한다. 해상도 숫자나 공급처 이름만으로 원인·합격을 판단하지 않는다. 저장소의 과거 WebP 압축 블록 사례도 원본 에셋 자체의 품질과 구별한다.
- **과거 재현과 신규 제작 구분**: r8/D-084의 원본 복구는 같은 조건을 다시 재기 위한 것이다. 그 의존성 16종이 신규 제작의 필수 채택 목록은 아니다. 기존 버전은 보호하고, 새 자체 키트·재질을 넣으면 별도 시안과 D 기록에서 비교한다. 원본 접근 차단 때문에 자체 제작의 조사·설계까지 전부 막혔다고 판단하지 않는다.

지침·소스·기존 캡처를 대조한 근거와 확인 안 한 범위: `../../verification/r1-archive-asset-policy-audit-20261018/README.md`(경로는 저장소 루트의 `verification/`을 가리킨다). Poly Haven 전체가 저품질이라는 전면 판정이나 사용 금지 규칙은 아니다.

실제 배포 GLB의 해상도·알베도·셰이더 채널 분석 및 대체 조달처별 용도·라이선스/접근 한계는 `rounds/R1/ANALYSIS-R1-ARCHIVE-MATERIAL-SOURCING-20261018.md`(F-106)를 본다. 새 조달처의 상품을 직접 비교한 품질 순위와 후보 목록을 구분한다.

## 2. 조달처 (2026-09-26 이 컨테이너에서 확인)

| 조달처 | 종류 | 라이선스 | 접근 | 탐색 | 자동 받기 |
|---|---|---|---|---|---|
| Poly Haven | 모델·재질·HDRI | CC0 | API | O | O `polyhaven` |
| **ambientCG** | 재질·HDRI(모델은 사실상 없음) | CC0 | API | O | O `ambientcg` |
| **Openverse** | 사진 | 항목별(CC0·PD·BY·BY-SA·BY-NC·BY-NC-SA로 제한) | API | O | O `openverse`(받을 때마다 라이선스 재확인) |
| Kenney | 로우폴리 모델·스프라이트 | CC0 | 사이트 | O | O `page` — 에셋 페이지의 팩 zip (furniture-kit 5.1 MB) |
| Quaternius | 로우폴리 모델 | CC0 | 사이트 | O(팩 이름) | O `gdrive` — 공개 드라이브 폴더 목록 → 파일 받기(Bathroom_Bathtub.fbx) |
| Three D Scans | 조각상 스캔 | 저작권 제한 없음(사이트 표기, 항목 확인) | 사이트 | O | O `page` — 항목 페이지의 OBJ zip (3.6 MB) |
| OpenGameArt | 모델·스프라이트·텍스처 | 항목별 혼재(GPL 전용 불가) | 사이트 | O | O `page` — 항목 페이지 파일 링크(bench2.blend) |
| Mixkit | 영상 | Mixkit License | 사이트 | O | O `url` — `…/<id>-<360·720·1080>.mp4` (1080p 35.7 MB) |
| NASA | 위성영상·지도 | 공공 | 일부 | 주제별 수동 | `url` |
| **Sketchfab** | 모델 | 항목별(Standard·Editorial 불가) | 검색 공개, **받기는 토큰** | O | `sketchfab` — `SKETCHFAB_API_TOKEN` |
| **Pexels** | 사진·영상 | Pexels License | **검색부터 키 필요** | 키 있을 때 | `pexels` — `PEXELS_API_KEY` |
| Unsplash | 사진 | Unsplash License | 키 필요 | 미포함(요청 없음) | — |
| 차단 | Poly Pizza, Smithsonian 3D, Behance, Landbook, Lapa Ninja | — | 403 | — | — |

### 2.1 API가 없는 다섯 곳도 받을 수 있다 (2026-09-26 확인)

처음 표의 "수동"은 **받는 코드를 아직 안 만들었다**는 뜻이었지, 막혀 있다는 뜻이 아니었다. 다섯 곳 모두 로그인·브라우저 자동화(Playwright) 없이 일반 HTTP 요청으로 받아진다: 항목 페이지 HTML에서 파일 링크를 찾거나(`page`), 공개 구글 드라이브 폴더 목록을 읽거나(`gdrive`), 규칙적인 파일 주소를 쓴다(`url`). 다섯 항목을 registry에 `test-only`로 등록해 받기 → sha256 고정 → 재검증까지 통과했고, 받은 파일의 형식도 확인했다(FBX 7400, Blender 2.49 .blend, OBJ zip, mp4) `[테스트]`. 한계: 사이트 구조가 바뀌면 링크 패턴이 깨진다 — 해시 고정이 조용한 변경을 잡고, 받기 실패는 오류로 멈춘다.

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

사이트 긁기(Kenney·Quaternius·Three D Scans·OpenGameArt·Mixkit)는 검색과 받기 모두 사이트 구조가 바뀌면 깨진다 — 결과가 0이면 `error`/`no-match`를 구별해 본다. Sketchfab·Pexels 받기 경로는 토큰이 없어 실제 다운로드는 미시험(요청 형식은 공개 API 문서 기준).
