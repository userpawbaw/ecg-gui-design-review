# 24. 에셋 조사 단계와 로그인 요청

상태: **채택** (D-022, D-020을 확장). 모든 3D·재질·사진·영상 에셋 조달은 이 단계에서 시작한다.
연결: `assets/sources.json`(조달처 목록), `scripts/assets/explore.mjs`(탐색), `scripts/assets/fetch.mjs`(받기·고정), `assets/auth-requests.json`(로그인 요청), `assets/research/`(탐색 기록).

## 현재 이용 단계 고정 — D-084 / 2026-10-06

**내부 검토용 시안.** 사용자: “지금은 시안용(내부 검토용)이라 접근가능한 모든 자료를 가져다가 작업하면 돼. 실제 출품용으로 전환시 대체방식을 재검토할거야.”

- 새 설계의 시작에 이용 목적/공개·출품 여부를 한 번 확인하고 고정한다. 이 프로젝트는 이미 내부 시안으로 답변되었으므로 같은 저작권 범위 질문을 에셋마다 반복하지 않는다.
- 현재 탐색은 CC0/허용 라이선스만으로 제한하지 않는다. 접근 가능한 완성 에셋·유료 상품의 공개 자료·레퍼런스·코드·프리셋·후처리·효과를 품질/적합성 기준으로 폭넓게 비교한다. 상용 여부는 후보 제외 사유가 아니라 비용/접근 조건 기록 항목이다.
- 사용할 파일/코드는 출처·제작자·원본 URL·알려진 이용 조건·변형 내역·시안 용도·출품 전 대체/확인 필요 상태를 남긴다. 내부 시안 채택을 출품/재배포 승인으로 기록하지 않는다.
- 실제 출품 단계로 바뀔 때 해당 목록을 검토하고 구매/허가·출처표기·대체 에셋·자체 제작 등 필요한 경로를 결정한다. 지금 후보 탐색을 그때의 조건으로 미리 좁히지 않는다.
- 접근 조건은 유지한다. 공개 페이지/사용자가 제공한 파일/정상 접근 가능한 자료를 활용하며, 인증이나 결제가 필요한 파일은 해당 경로에서 처리한다. 접근 가능한 홍보 이미지와 실제 소스 파일 획득은 구별한다.
- 기존 허용 목록 기반 자동 탐색/받기 도구가 후보를 제외하면 전체 조사 결과에서 삭제하지 않는다. 수동 후보/원문 링크로 기록하고 실제 조달 단계에 시안 범위와 파일 조건을 명시한다. licence 값을 다른 이름으로 바꾸어 자동 검사를 통과시키지 않는다.

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

## 6. 장면별 제작 조사와 완성 에셋·효과 우선 탐색 — D-083

새 Intro/Story 요소를 직접 만들기 전에 공식 제작 자료, 제작자 사례, 관련 업계 포럼과 함께 **완성 모델·PBR/HDRI·VDB·리그/클립·조명 프리셋·렌더 장면·후처리·효과 패키지**를 조사한다. 기술 튜토리얼만 찾아 자체 제작으로 바로 넘어가지 않는다.

후보마다 그대로 사용 / 수정해서 사용 / 직접 제작 / 해당 없음으로 분류하고 형태·빛·움직임·목표 구도·호환성·수정량을 비교한다. 제품 홍보, 검색 결과, 실제 원문, 설치 소스, 실제 렌더 증거는 구별한다. 개별 파일의 출처·조건·버전·크기·hash는 기존 registry/fetch 절차로 고정한다. 플랫폼 라이선스를 모든 개별 파일 조건으로 대체하지 않는다.

실제 조달 후 작은 동일 구도 시험을 먼저 한다. 다운로드 가능함이 품질 KEEP를 뜻하지 않으며, 새 후보 발견만으로 기존 KEEP를 교체하지 않는다. 인증이 필요한 후보만 기존 로그인 절차를 적용한다.

A 작업의 현재 적용 결과: [장면별 기준 문서](rounds/R1/SCENARIO-ABC-20261003/ECG_INTRO_STORY_PRODUCTION_RESEARCH_BASELINE_2026-10-06.md) §5 요소표·§9 완성 후보. 파이프라인 25 §9와 연결한다.
