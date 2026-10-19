# 서고 빛과 공간: 레퍼런스 수준 재현과 wow 포인트 — 조사와 시도안

작성 2026-10-16(2026-10-16 수정: 4.3 후처리 절 추가, B6·§7 표현 바로잡음 — 사용자 질문 "후처리는 안쓴다는거야?") · 서고 빛 세션(`claude/archive-light-r7-ag2rja`) · 범위: 서고(다락방) 빛·공간의 정지 렌더와 웹 반영 · 분류: RESEARCH

사용자 요청 `[대화]`: "레퍼런스와 비슷한 빛과 공간 구현에 wow포인트를 만드는 것과 관련된 제작노트, 포럼 등에서 개선 방안, 새로운 기법 등을 탐색해서 네 자체적 분석을 포함해 시도할 방안을 정리한 보고서를 작성해봐."

근거 표시: `[출처]` 외부 문서·포럼, `[런타임]` 이 세션의 측정, `[코드]` 저장소 코드, `[추론]` 내 분석. 외부 출처는 포럼·판매처 문서가 섞여 있어, 우리 장면에서 다시 확인하기 전에는 사실로 쓰지 않는다.

---

## 0. 요약

1. **새 발견(F-043)**: r7에서 가장 어두운 곳을 채우는 빛의 **절반은 "강조만" 하려던 해의 되튐**이다. 해의 되튐만 막아도 어둠이 2.4스톱 내려가고 웅덩이는 0.14스톱만 준다 `[런타임]`. 그동안 노출 하나로 맞바꾸던 "그늘 깊이 대 웅덩이 밝기"를 따로 조절할 수 있다.
2. **조정 속도**: Cycles 광원 그룹으로 한 번 렌더하면 광원별 세기는 다시 렌더하지 않고 몇 초 만에 다시 섞을 수 있다 `[출처]`. 지금까지는 후보 하나에 17분이 걸렸다.
3. **웹과 정지 렌더가 다른 톤 곡선을 쓴다**: 정지 렌더는 AgX Punchy, 웹은 ACES(노출 1.16)다 `[코드]`. three.js core에는 AgX와 Neutral만 있고 Punchy는 없다 `[런타임]`. 이대로 구우면 r7에서 맞춘 숫자가 웹에서 그대로 나오지 않는다. 확정 전에 정해야 한다.
4. **wow 후보(우선순위)**:
   - W1: 해치가 열리며 빛 웅덩이가 자라는 "빛이 들어오는 순간". 광원 그룹별로 구운 라이트맵을 스크롤로 섞는다.
   - W2: 빛줄기 안에서만 반짝이는 먼지. 웹(r2 서고)에 이미 있다. 할 일은 r7의 해치 주광(가까운 스폿)에 맞게 옮기는 것이다.
   - W3: 오르는 사람의 그림자가 책장 위를 지나가는 것. 주광 라이트맵에만 실시간 그림자를 곱한다.
   - W4: 카메라가 내려가며 웅덩이 경계를 통과하는 것.

   W1과 W3은 같은 굽기 구조(광원 그룹별 라이트맵) 위에서 함께 된다.
5. **다음 시도 순서**: S1 광원 그룹 조정 도구 → S2 해 되튐 1회 + 해·주광 다시 올리기 → S3 웅덩이 경계를 사다리 손 높이로 → S4 웹 톤 곡선과 굽기 방식 결정(D) → S5 W2(기존 빛줄기·먼지를 r7 주광으로 이식)·W1·W3 웹 시제품. §6에 단계별 판정 기준을 적었다.

---

후속: 레퍼런스의 원근·시점·배치·빛 구역 분석은 `ANALYSIS-R1-REF002-SPACE-LIGHT-20261016.md`(F-044). S1 결과는 `verification/r1-archive-art-r8-lightgroups-20261016/`.

## 1. 지금 위치

| 지표(파스텔 a1 / a2) | r7 (D-081) | REF-002 | 차이 |
|---|---|---|---|
| L* 5/25/50/75/95 | 4 17 25 57 77 / 4 17 26 62 78 | 2–4 15–18 25–33 52–62 81–97 | **밝은 끝(L*95)이 낮다** |
| plain_range | 51 / 54 | 57–69 | 약간 부족 |
| sharpC(사람 가림) | 15.8 / 15.9 | 20–22 | **선명 경계의 대비가 약하다** |
| 진한 색 | 6.2 / 5.2 % | 3.6 % | 따뜻한 주광에 책이 진해짐 |
| 방 단위 밝은 비율 | 43 / 46 % | 48 % | 근접 |

REF-002에서 사용자가 wow로 짚은 것은 셋이다(REF-002 §6).
- **EFX-002-01**: 구운 빛의 방 + 포인터 시선 회전 + 공기 중 먼지 2,000개.
- **EFX-002-02**: 스크롤로 카메라가 내려가며 다가가기.
- **EFX-002-03**: 같은 집 안의 책장 구역으로 하강하면서 사다리와 책장의 겹침이 바뀌는 것.

세 가지 모두 "빛이 좋은 정지 장면" 위에서 **카메라와 공기가 움직이는 것**이다. 빛 자체가 바뀌는 연출은 REF에 없다 `[코드]`. 우리가 레퍼런스를 넘어설 여지가 여기 있다 `[추론]`.

---

## 2. 조사한 것과 방법

- 질문: (a) 정지 렌더에서 그늘 깊이·웅덩이 밝기·선명 경계 대비를 서로 덜 엮이게 조절하는 법, (b) 구운 빛 장면을 웹에서 같은 톤으로 재현하는 법, (c) 구운 빛 장면에 움직임과 놀라움을 더하는 법.
- 찾은 곳: Blender 공식 문서·개발 문서, Blender Artists, three.js 포럼, pmndrs 계열 라이브러리 문서, 촬영 조명 글(네거티브 필), 굽기 튜토리얼, Unity·PlayCanvas·Babylon 포럼(라이트맵 섞기·굽기와 실시간 그림자 섞기).
- 못 찾은 것: Awwwards·Codrops에서 "구운 빛 방의 빛 연출" 제작 노트는 찾지 못했다. Igloo Inc 사례는 유체·볼륨 내보내기 이야기이고 빛 굽기는 다루지 않는다 `[출처]`. Bruno Simon의 "My Room in 3D"는 빛 세기를 조절하는 구운 방으로 소개되지만 저장소 첫 화면에 방법 설명이 없어 확인하지 못했다.
- 우리 장면에서 직접 잰 것: §3의 광원 그룹 측정(두 렌더).

---

## 3. 자체 측정: 그늘을 채우는 빛은 어디서 오나 (F-043)

도구:
- `scripts/blender/archive_light_groups.py`: 저장한 .blend를 열고 주광, 해, 하늘(world)을 각각 광원 그룹에 넣는다. a1 장면을 그룹마다 패스 하나씩 담은 멀티레이어 EXR로 렌더한다.
- `scripts/assets/light-group-shares.py`: 구역별로 각 그룹이 선형 휘도에서 차지하는 몫을 잰다.

| 조건 | 어두운 20 %: 주광 / 해 / 하늘 / 기타 | 어두운 20 % 중앙 | 그늘 구역 중앙 | 웅덩이 중앙 | 밝은 20 % / 어두운 20 % |
|---|---|---|---|---|---|
| r7 그대로 | 34 / **50** / 11 / 5 % | 0.0144 | 0.0388 | 0.943 | 4.0스톱 |
| 해 최대 되튐 0 | 39 / 0 / 47 / 15 % | **0.0028** | 0.0215 | 0.853 | **4.9스톱** |

읽기 `[추론]`:
- D-061에서 일부러 낸 **바닥 빛 조각**(해가 바닥에 닿는 구멍)이 되튀어 그늘 전체를 채운다. D-081에서 줄인 하늘빛은 어둠의 11 %뿐이었다.
- 해의 되튐을 막으면 어둠이 크게 깊어진다. 그래서 그만큼 **주광과 해 직접광을 다시 올릴 여유**가 생긴다.
  - 해 직접광을 올리면 L*95 강조와 경계 대비 sharpC가 오른다.
  - 주광을 올리면 웅덩이 안 변화 폭 plain_range가 오른다.
  - 그래도 그늘이 들뜨지 않는다.
- 되튐 0은 너무 세다(어둠 −2.4스톱이면 L*5가 레퍼런스 2–4 아래로 내려갈 것이다). D-061이 노린 아래에서 올라오는 부드러운 반사도 없어진다. 되튐 1회가 다음 후보다.
- 한계: 한 장면, 사람 없음, 96 샘플, 톤 매핑 전 선형 값이다. L* 지표는 S2에서 다시 잰다.

---

## 4. 조사 결과: 기법별 정리

### 4.1 정지 렌더(Blender Cycles)에서 빛을 떼어 조절하기

| # | 기법 | 내용 | 우리에게 | 근거 |
|---|---|---|---|---|
| A1 | **광원 그룹(Light Groups)** | Blender 3.2부터 광원마다 그룹을 정해 그룹별 패스로 저장한다. 컴포지터에서 곱해 다시 섞으면 다시 렌더하지 않고 세기를 바꿀 수 있다. | 이미 써서 §3을 쟀다. 세기 조정 탐색을 17분 렌더에서 몇 초 재조합으로 바꾼다. 방향·위치·반지름은 다시 렌더해야 한다. | `[출처]` garagefarm, Poliigon, RebusFarm 튜토리얼 · `[런타임]` |
| A2 | **광원별 최대 되튐(Light › Max Bounces)** | Cycles 광원 설정으로, 그 광원의 빛이 되튈 수 있는 횟수를 제한한다. | F-043의 처방. 해는 직접광 강조와 되튐 1회만 쓴다. API `light.cycles.max_bounces`. | `[런타임]` bpy 4.5.3에서 속성 확인, 렌더로 효과 측정 |
| A3 | **빛 연결·그림자 연결(Light/Shadow Linking)** | Blender 4.0부터 광원마다 비출 물체(receiver)와 그림자를 만들 물체(blocker)를 정한다. 공식 설명은 "창작을 위해 물리 법칙을 깨는" 기능이다. 그림자 연결은 광선이 늘어 렌더가 느려질 수 있다. | 해 강조를 정한 표면(액자, 석고 조각, 서랍장 윗면)에만 닿게 하면 L*95를 올려도 다른 곳이 밝아지지 않는다. 다만 개발 문서는 직접광 샘플링만 설명한다. 연결이 간접광까지 막는지는 확인하지 못했으니 직접 재야 한다. | `[출처]` Blender 매뉴얼·개발 문서, Creative Bloq |
| A4 | **네거티브 필** | 촬영에서 그늘 쪽에 검은 판(플래그)을 대 반사광을 빼서 대비를 키운다. 판을 가까이 둘수록 진해진다. | Cycles에서는 바닥 빛 조각 주변을 "확산 광선에는 검게 보이는" 재질로 바꾼다(Light Path의 Is Diffuse Ray로 섞기). 물체의 확산 광선 가시성을 끄면 빛이 그 물체를 통과해 새는 문제가 보고돼 있어 쓰지 않는다. | `[출처]` Neil Oseman, No Film School, Blender Artists, Blender 이슈 #43117 |
| A5 | **고보(gobo) 투영** | 스폿 광원에 이미지 텍스처를 꽂아 창살·나뭇잎 그림자를 만든다. 경계를 선명하게 하려면 광원을 멀리 두고 blend와 soft size를 줄인다. | 선명 경계 대비(sharpC)를 올리는 손쉬운 방법이다. 하지만 REF는 "웅덩이 하나"이고, 무늬를 늘리면 r4·r5에서 실패한 "흩어진 조각"으로 돌아간다(F-040). 해치 테두리 하나의 경계만 다듬는 데 제한해서 쓴다. | `[출처]` Greyscale Gorilla, Superhive 애드온 문서 |
| A6 | **AgX 룩** | Blender의 AgX Punchy 룩은 AgX Base 위에 CDL power 1.35를 적용한 것이다. 커뮤니티에서는 AgX Log 위에 대비 룩을 직접 만들기도 한다. | 정지 렌더의 톤 곡선을 웹에서 똑같이 만드는 근거가 된다(4.2 B2). | `[출처]` Blender AgX 설정(EaryChow/AgX), Blender Artists |

### 4.2 웹(three.js)에서 같은 톤과 빛을 재현하기

| # | 기법 | 내용 | 우리에게 | 근거 |
|---|---|---|---|---|
| B1 | **최종 색 굽기 vs 조도 굽기** | REF는 모든 재질이 조명 없는 텍스처이고, 빛까지 든 최종 색을 KTX2 4096 텍스처에 구웠다. 우리는 반사율을 뺀 조도만 sqrt로 굽고 웹에서 반사율을 곱한다. | 최종 색 굽기는 톤 곡선까지 텍스처에 넣을 수 있어 정지 렌더와 가장 가깝다. 대신 빛을 웹에서 바꿀 수 없어 W1·W3이 막힌다. 조도 굽기를 유지하고 톤 곡선을 웹에서 맞추기를 권한다. | `[코드]` REF-002 §6, `build_archive.py` bake 절 |
| B2 | **AgX 톤 매핑** | three.js에 `AgXToneMapping`(6)과 `NeutralToneMapping`(7)이 있다. 포럼 요약에는 Punchy 변형이 추가됐다고 나왔지만, 0.180·0.186(프로젝트 버전) `constants.js`에는 없다. three.js의 AgX는 Blender와 "매우 가깝지만 같지는 않다". | 지금 웹은 `ACESFilmicToneMapping`, 노출 1.16이다. AgX에 power 1.35를 더하는 커스텀 톤 매핑(셰이더 청크 교체)을 만들고, 같은 EXR을 Blender와 웹에 넣어 L* 지표로 맞춘다. | `[런타임]` constants.js · `[출처]` three.js 포럼 #60609 · `[코드]` introStage.ts:53 |
| B3 | **라이트맵 여러 장 섞기** | 같은 UV에 낮·밤 같은 라이트맵 두 장을 굽고, 셰이더에서 `mix`나 가중합으로 섞는다. Unity 쪽에는 상용 도구(Magic Lightmap Switcher)도 있다. | 광원 그룹별로 구우면(주광 / 해 / 하늘) 런타임에 가중치를 바꿀 수 있다. W1 "빛이 들어오는 순간"의 재료다. 텍스처 메모리는 그룹 수만큼 늘어난다. | `[출처]` Unity 포럼, gamedev, three.js 포럼 |
| B4 | **굽기 + 실시간 그림자** | PlayCanvas·Babylon 포럼은 같은 광원을 굽고 또 실시간으로 비추면 빛이 두 번 더해진다고 경고한다. 흔한 우회법은 그림자만 받는 평면(ShadowMaterial)을 곱해 얹는 것이다. | 주광을 따로 구웠다면 정확한 식이 가능하다. `빛 = 반사율 × (하늘 + 해 + 주광 × 실시간 가시도)`이므로 오르는 사람 그림자가 주광 몫만 지운다. 그림자가 이중으로 진해지는 문제가 구조적으로 사라진다. | `[출처]` PlayCanvas·Babylon·three.js 포럼 · `[추론]` |
| B5 | **빛줄기·먼지** | 화면 공간 갓레이(three-good-godrays: 점·방향광만 지원하고 그림자 설정이 필요하다), WebGPU 볼륨 빛, froxel 볼륨 안개가 있다. 먼지는 매질이 있어야 보인다. | **이미 구현돼 있다**(r2 서고 웹, `archive.ts`). 해 깊이 지도에 대한 광선 행진으로 빛줄기를 만들고(블라인드·책장·사다리가 빛줄기를 자른다), 먼지는 빛줄기 안에서만 반짝이며, 사람의 고리도 빛줄기가 지나는 곳에서 빛난다. r7로 바꾸려면 빛이 평행한 해가 아니라 해치 밖 1.6 m의 스폿이므로, 깊이 지도를 원근 투영으로 바꾸고 원뿔 감쇠를 넣어야 한다. 외부 갓레이·볼륨 안개 라이브러리는 필요 없다. | `[코드]` `prototype/v2/src/story/intro/archive.ts` 1–5, 87–136행 · `[출처]` three.js 포럼, three-good-godrays README |
| B6 | **화면 공간 AO·GI(N8AO, realism-effects)** | 후처리로 모서리 그늘(AO)과 되튐 빛(GI)을 화면 공간에서 근사한다. | 실시간 조명 장면에서는 퀄리티를 올리지만, 서고는 둘 다 Blender에서 정확히 계산해 구웠다. 얹으면 같은 효과가 두 번 들어가 모서리가 다시 어두워지고, 맞춘 L*5·sharpC가 흐트러지며, 카메라가 움직일 때 가장자리가 번쩍일 수 있다. **구운 면에는 쓰지 않고**, 굽지 않은 움직이는 사람 주변의 접촉 그림자에만 검토한다(우선순위 낮음). 후처리 전체를 빼는 것이 아니다 — 4.3. | `[출처]` N8AO·realism-effects 문서 · `[추론]` |

---

### 4.3 후처리: 쓰는 것과 쓰지 않는 것

후처리 전체를 빼지 않는다. 지금 웹 도입부도 블룸(UnrealBloomPass), 비네트·필름 그레인, 빛줄기·먼지 셰이더 패스, 출력 패스(톤 매핑·색 공간)를 쓴다 `[코드]` (`introStage.ts`, `space.ts`, `archive.ts`). 기준은 하나다: **구운 빛에 이미 들어 있는 것을 다시 계산하는 후처리는 빼고, 구운 텍스처가 할 수 없는 것(톤 곡선, 화면 출력 품질, 렌즈 느낌)은 쓴다** `[추론]`.

레퍼런스 수준 퀄리티에 도움이 되는 순서:

| 순서 | 후처리 | 왜 | 확인 방법 |
|---|---|---|---|
| P1 | **톤 매핑 일치(AgX + Punchy)** | 정지 렌더와 웹의 톤을 같게 한다. 이것이 맞지 않으면 다른 조정이 모두 어긋난다(4.2 B2). | 같은 EXR을 Blender·웹에 넣어 L* 5/50/95 ±3 |
| P2 | **어두운 그라데이션 디더링** | 8비트 화면에서 깊은 그늘의 부드러운 변화가 계단처럼 끊기기 쉽다. r7·S2로 그늘이 깊어질수록 더 필요하다. 지금 그레인이 일부 이 역할을 하지만 따로 확인해야 한다. | 그늘 구역 확대 캡처에서 띠가 보이지 않음 |
| P3 | **강조 부위만 노린 블룸** | 해 강조가 살짝 번지면 실제보다 밝게 읽힌다. 레퍼런스보다 낮은 L*95를 시각적으로 보완한다. 기준값을 높게 두어 화면 전체가 뿌옇지 않게 한다. | 블룸 전후 그늘 L*5 변화 ≤ 1 |
| P4 | **색 보정 LUT** | "그늘은 중성, 빛은 따뜻하게"라는 레퍼런스 색 관계(F-040: 빛 b* 18, 그늘 b* 6)를 맞춘다. | 그늘·빛 구역 b* 측정 |
| P5 | **안티앨리어싱(SMAA)** | 책등과 선반 모서리가 많아 계단이 눈에 띈다. 컴포저를 쓰면 캔버스 안티앨리어싱이 후처리 체인에 닿지 않는다(2026-10-12 기록). | 정지 화면 확대 비교 |

쓰지 않거나 미루는 것: 구운 면 위의 SSAO·SSGI(B6), 외부 화면 공간 갓레이(B5, 이미 있는 빛줄기로 충분).

## 5. wow 포인트 후보 (내 분석)

판단 기준: (1) REF가 하지 않은 것, (2) 서고 이야기(오르는 사람, 빛으로 올라감)와 맞는 것, (3) 지금 구조로 비용이 적당한 것, (4) 데이터 계약을 해치지 않는 것.

| # | 장면 | 왜 놀라운가 | 어떻게 | 비용 | 위험 |
|---|---|---|---|---|---|
| **W1** | **빛이 들어오는 순간**: 스크롤 초반에 서고가 그늘 구역처럼 어둡다. 해치 쪽 주광 웅덩이가 자라고, 마지막에 해 강조가 "탁" 들어온다. | REF는 빛이 처음부터 고정이다. 빛이 이야기(사람이 빛 쪽으로 오른다)를 따라 변하는 건 정지 사진으로 볼 수 없는 경험이다. | B3: 광원 그룹별 라이트맵 3장(하늘·주광·해)을 가중치로 섞는다. 가중치는 스크롤 위치의 함수로 둔다(EFX-002-02처럼 위치 함수라 되돌리면 복원된다). | 중: 굽기 3회, 텍스처 3배 | 텍스처 메모리. 그룹마다 굽기 소음이 따로 생긴다(디노이즈를 그룹별로 해야 한다). |
| **W2** | **빛줄기 안의 먼지와 빛줄기**(r7 주광으로 이식): 그늘 구역의 먼지는 안 보이고, 해치 빛줄기를 지날 때만 반짝인다. | REF 먼지는 화면 전체에 고르게 있다. 빛 안에서만 보이면 빛의 부피가 보인다(틴들 효과). r2 웹에서 이미 만든 효과라 위험이 낮다. | B5: 기존 해 깊이 지도(평행 투영)를 해치 주광 위치의 원근 깊이 지도로 바꾸고 원뿔 감쇠를 넣는다. | 하–중 | 해치가 화면 위쪽 밖이라 빛줄기의 시작이 안 보일 수 있다. 밀도와 밝기는 사용자 확인으로 정한다. |
| **W3** | **오르는 사람의 그림자**: 사람이 사다리를 오르면 그 그림자가 책장과 서랍장 위를 지나간다. | 구운 장면은 보통 움직이는 물체가 그림자를 만들지 못한다. 그림자가 있으면 사람이 그 공간에 "있다". | B4: 주광 위치에 그림자 전용 스폿을 두고, 셰이더에서 주광 라이트맵에만 그림자 가시도를 곱한다. | 중 | 사람이 유리 재질이라 그림자가 너무 진하면 어색하다. 투과율만큼 옅게 한다. |
| W4 | **웅덩이 경계 통과**: 카메라가 내려가며 그늘에서 빛 웅덩이 속으로 들어간다. | EFX-002-03의 하강에 "빛 경계를 넘는 순간"을 더한다. | 카메라 경로와 웅덩이 경계(S3)를 함께 설계한다. 새 기술은 필요 없다. | 하(코드), 중(설계) | r7에서 경계가 사다리 왼쪽으로 옮겨 갔다. S3에서 정한다. |
| W5 | (보류) 심박에 맞춰 빛이 숨쉬기 | 심전도 전시와 이어진다. | 실제 저장 R 피크로만 구동해야 한다(데이터 계약). | 중 | 서고는 심전도가 나오기 전의 도입부다. 가짜 박동으로 보일 위험이 커서 권하지 않는다. 다시 꺼내려면 D 기록이 먼저다. |

권장: W1 + W2 + W3을 한 묶음으로 한다. W1과 W3은 **광원 그룹별 조도 굽기**(B1 유지 + B3)라는 같은 바탕을 쓰고, 이 바탕은 정지 렌더 조정 도구(A1)와도 같은 구조다. W2는 이미 있는 효과를 r7 주광에 맞게 옮기는 일이라 가장 먼저 할 수 있다 `[추론]`.

---

## 6. 시도 계획

| 단계 | 할 일 | 판정 기준 | 비용(이 클라우드) |
|---|---|---|---|
| S1 | 광원 그룹 EXR(a1·a2, 1280×720, 디노이즈 패스 포함)을 한 번 렌더한다. 그룹 가중치를 바꿔 다시 섞은 뒤 AgX Punchy를 적용하고 `frame-tone-stats.py`로 잰다. 톤 적용은 bpy 색 관리로 저장하는 방식이다. | 같은 가중치(1,1,1)로 섞은 결과가 직접 렌더한 r7과 L* 지표 ±1 안에 든다. | 렌더 2장 약 40분, 이후 후보당 몇 초 |
| S2 | 해 최대 되튐 1(그리고 0)로 다시 렌더한다. S1 도구로 해 직접광과 주광 가중치를 다시 고른다. 필요하면 A3(해를 강조 표면에만 연결), A4(바닥 조각 네거티브 필)를 더한다. | L*5 2–4를 유지하면서 L*95 ≥ 81, sharpC(사람 가림) ≥ 18, plain_range ≥ 57. | 렌더 2–3회 |
| S3 | 웅덩이 경계를 사다리 손 높이로 되돌린다(`KEY_DIR`). r6b에서 고른 "그늘에서 빛으로 오르는" 자리다. | 시트에서 경계가 손 높이 사다리를 지난다. S2 지표가 유지된다. | 렌더 2–3회 |
| S4 | **웹 결정(D 기록 먼저)**: (a) 최종 색 굽기(REF 방식, 빛 고정) / (b) 광원 그룹별 조도 굽기 + 커스텀 AgX Punchy 톤 매핑(권장). 같은 EXR을 Blender와 웹에 넣어 L* 지표를 맞춘다. 후처리 P1–P5(4.3)를 같은 단계에서 맞춘다. | 웹 캡처와 정지 렌더의 L* 5/50/95가 ±3 안. | 굽기 3회(그룹당 128 샘플) + 셰이더 작업 |
| S5 | W2(먼지) → W1(빛이 들어오는 순간) → W3(사람 그림자) 순서로 웹 시제품을 만든다. 효과 제작 파이프라인(`25`)의 G1–G6 관문을 거친다. | 사용자 Edge 확인. reduced-motion에서 W1은 마지막 상태로, W2는 정지로 둔다. | 시제품마다 반나절 안팎 |

S1–S3는 정지 렌더라 지금 바로 할 수 있다. S4는 웹 반영 방향을 바꾸는 갈림길이라 사용자 결정이 필요하다.

---

## 7. 쓰지 않거나 미루는 것

- **물체의 확산 광선 가시성 끄기**(네거티브 필 대용): 빛이 물체를 통과해 새는 문제가 보고돼 있다 `[출처]`. 재질의 Light Path 방식을 쓴다.
- **고보로 창살·나뭇잎 무늬**: REF의 "웅덩이 하나" 원칙과 충돌한다. r4·r5에서 실패한 흩어진 조각이다(F-040).
- **화면 공간 갓레이·볼륨 안개 라이브러리**: 광원이 화면 밖이면 사라지거나(three-good-godrays) 무겁다. 이미 있는 깊이 지도 광선 행진 빛줄기 + 먼지(W2)를 r7 주광에 맞춰 쓴다.
- **구운 면 위의 SSAO·SSGI**: 구운 장면에 같은 효과가 두 번 더해진다. 후처리 전체가 아니라 이 두 가지만 뺀다(4.3). 움직이는 사람 주변 접촉 그림자는 예외로 검토한다.
- **심박 동기 빛(W5)**: §5의 이유.

## 8. 출처

외부 문서는 2026-10-16에 검색했다. 판매처 문서와 포럼은 주장으로만 다뤘다.

- Blender 빛·그림자 연결: [Blender Manual — Light Linking](https://docs.blender.org/manual/en/4.5/render/lights/light_linking.html), [Blender Developer Docs — Cycles Light Linking](https://developer.blender.org/docs/features/cycles/light_linking/), [Blender Wiki](https://wiki.blender.org/features/cycles/light_linking/), [Creative Bloq — Light Linking tutorial](https://creativebloq.com/3d/mastering-the-influence-of-lights-in-blender)
- 광원 그룹: [GarageFarm — Blender Light Groups](https://garagefarm.net/blog/blender-light-groups), [Poliigon — Light Groups in 4 steps](https://blog.poliigon.com/blog/4-simple-steps-to-set-up-light-groups-in-blender), [RebusFarm — Light Groups workflow](https://rebusfarm.net/blog/blender-light-groups-a-step-by-step-workflow), [Blender Artists — Light groups for feature-film compositing](https://blenderartists.org/t/upgrading-cycles-light-groups-for-feature-film-compositing/1648523)
- 네거티브 필: [Neil Oseman — What is Negative Fill](https://neiloseman.com/what-is-negative-fill-and-how-do-you-use-it), [No Film School — Using Flags to Add Contrast](https://nofilmschool.com/2014/02/the-art-of-shaping-light-guide-to-using-flags-add-contrast-to-scene), [DIYPhotography — Negative fill](https://www.diyphotography.net/how-to-use-negative-fill-to-create-more-dramatic-shots/)
- 확산 광선 가시성: [Blender Artists — background colour bounce](https://blenderartists.org/t/how-do-i-stop-a-background-casting-its-color-onto-objects/1330141), [Blender Artists — disabling shadows](https://blenderartists.org/t/disabling-of-shadows-no-longer-works-what-am-i-missing-5-2/1652740), [Blender issue #43117](https://projects.blender.org/blender/blender/issues/43117), [Blender Manual — Object visibility](https://docs.blender.org/manual/en/4.1/render/cycles/object_settings/object_data.html)
- 고보: [Greyscale Gorilla — Gobos in Blender](https://help.greyscalegorilla.com/en/articles/12771313-how-to-use-gobos-in-blender), [Superhive — Gobo Light Pro docs](https://superhivemarket.com/products/gobo-light-pro--one-click-gobo-spotlights-65-built-in-patterns/docs)
- AgX: [EaryChow/AgX](https://github.com/EaryChow/AgX), [three.js forum — Is AgX implemented correctly?](https://discourse.threejs.org/t/is-agx-tonemapping-implemented-correctly/60609), [three.js PR #27413 (AgX gamut)](https://github.com/mrdoob/three.js/pull/27413), [pixls.us — Filmic vs AgX](https://discuss.pixls.us/t/compare-and-contrast-filmic-rgb-vs-agx/53147/2), [Blender Artists — Thinsoldier punchy looks](https://blenderartists.org/t/thinsoldiers-sketchbook-2024-2026/1516511)
- 굽기와 웹: [svilenkovic — how to bake lighting for web](https://svilenkovic.com/3d/how-to-bake-lighting-for-web), [three.js forum — batch lightmap baker](https://discourse.threejs.org/t/made-a-blender-script-for-batch-baking-lightmaps-to-optimize-models-for-threejs/82346), [Blender Artists — lightmap baking](https://blenderartists.org/t/blender-cycles-lightmap-baking/1169571), [Gigazine — My Room in 3D](https://gigazine.net/gsc_news/en/20210913-my-room-in-3d)
- 라이트맵 섞기: [three.js forum — making lights look natural together](https://discourse.threejs.org/t/how-can-i-make-these-light-look-more-nature-together/51842), [Unity — blending 2 lightmaps](https://discussions.unity.com/t/blending-2-lightmap-with-slider-needs-help/8026), [Unity — Magic Lightmap Switcher](https://discussions.unity.com/t/magic-lightmap-switcher-storing-switching-and-blending-lightmaps-in-real-time/807890)
- 굽기 + 실시간 그림자: [PlayCanvas forum](https://forum.playcanvas.com/t/can-baked-lightmaps-work-alongside-real-time-shadows/2892), [Babylon.js forum](https://forum.babylonjs.com/t/how-to-best-mix-baked-and-realtime-shadows/51056), [three.js forum — principle of shadow rendering](https://discourse.threejs.org/t/what-is-the-principle-of-threejs-shadow-rendering/42056)
- 빛줄기·먼지·후처리: [three-good-godrays README](https://cdn.jsdelivr.net/npm/three-good-godrays@0.12.0/README.md), [three.js forum — godrays for a cave scene](https://discourse.threejs.org/t/help-with-persistent-volumetric-light-god-rays-light-shafts-sunbeam-sunburst-for-underground-cave-scene/79085), [three.js forum — volumetric lighting in WebGPU](https://discourse.threejs.org/t/volumetric-lighting-in-webgpu/87959), [N8AO](https://github.com/N8python/n8ao)
- 사례(빛 굽기 정보 없음): [Awwwards — Igloo Inc case study](https://awwwards.com/igloo-inc-case-study.html)
- 저장소 내부: REF-002 §6(EFX-002-01~03), F-040, D-061, D-062, D-081, F-043, `verification/r1-archive-art-r7-20261015/`

## 9. 사용자에게 물을 것

1. S1–S3(정지 렌더: 광원 그룹 도구 → 해 되튐 조정 → 웅덩이 경계 복귀)을 바로 진행할지.
2. wow 묶음 W1(빛이 들어오는 순간) + W2(빛줄기 먼지) + W3(사람 그림자)이 방향으로 맞는지, 빼거나 더할 것이 있는지.
3. 웹 굽기 방식(S4): 권장은 광원 그룹별 조도 굽기 + 커스텀 AgX Punchy. REF처럼 최종 색 굽기를 고르면 W1·W3은 할 수 없다.


## 2026-10-19 재조사 정정 — 화면 밖 광원과 라이브러리 구분 (D-148)

원래 §5/§6에서 “three-good-godrays는 광원이 화면 밖이면 사라짐”이라고 쓴 판단은 철회한다. 당시 연결한 cave 포럼의 사례는 **pmndrs GodRaysEffect**의 source mesh가 화면 밖으로 나가는 경우다. **three-good-godrays GodraysPass**의 실제 v0.12.1 source는 방향광/점광의 shadow map을 따라 world-space 구간을 적분한다. 광원 mesh가 화면에 있어야 한다는 결론을 이 패키지에 적용하지 않는다. 원문은 판단 이력으로 남긴다.

기존 archive.ts에도 독립 광원depth + raymarch + noise/HG/먼지가 있다는 관찰은 유지한다. 이를 현행 자유시점·슬라이더 study에 옮기려면 depth dirty 갱신, room clip, alpha/caster·linear 합성·저해상도 업샘플링을 검수해야 한다. [후속 설계](PLAN-R1-ARCHIVE-VOLUMETRIC-20261019.md), [REF-016](../../references/REF-016_SHADOW_MARCHED_SUN_SHAFTS.md), [검증 범위](../../../../verification/r1-archive-volumetric-plan-20261019/README.md)를 따른다. 이번 정정은 외부 패키지 도입/현재 장면 시각·성능 PASS 선언이 아니다.
