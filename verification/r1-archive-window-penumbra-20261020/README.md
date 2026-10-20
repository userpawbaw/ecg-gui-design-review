# 왼쪽 큰 창·다양한 가림·반그림자 — D-150

2026-10-20. 사용자 요청의 “왼쪽 창문”을 서고 왼쪽 벽 뒤쪽의 높은 창으로 해석한 독립 비교안이다. 위치 재확인 질문은 미응답이므로 이 가정은 확정 선택이 아니다. 기존 GLB·baked 페이지·Story 소유 소품·r8/D-084 및 기본 방위225°/고도35°를 유지한다.

## 적용
- 왼쪽 벽의 뒤쪽 높은 창 둘과 사이 벽/기존 블라인드 일부를 묶어 nominal 폭2.65m×높이2.19m(5.8035m²)의 큰 창으로 만든다. world box x[-3.90,-3.34], y[2.65,4.84], z[-4.70,-2.05]. 실제 frame을 뺀 유효 통과면적은 별도 측정하지 않았다.
- 세로·가로 창틀, 원형 철제 장식과 연결봉, 프레임에 닿는 대각 버팀대, 창밖 곡선 가지와 잎9개. 직접 만든 geometry/단색 PBR만 추가하며 외부 코드/에셋은 반입하지 않는다.
- `?view=window` / “큰 창·그림자 보기”: 방위300°/고도25°/태양 각지름0.53°. “그림자 받는 책장 보기”는 같은 광원의 관찰 시점만 바꾼다. 왼쪽 큰 창/그림자 소품 스위치는 독립, 기존 천장 스위치와도 독립이다. 새 상태는 설정 링크에 저장된다.

## 반그림자가 약했던 이유와 해결
기존 웹은 유한 크기 없는 DirectionalLight와 고정 PCF, volume은1회 binary depth였다. `shadow.radius`만 키우는 고정 blur는 먼 가림만 더 흐려지는 접촉 경화를 재현하지 않는다. 창 크기를 늘려도 직사 태양의 각크기는 바뀌지 않는다. 실물 해의 각지름은 약0.53°이고, 전이 폭≈가림-받음 거리×각지름(rad)이다.

새 surface 모드는 PCSS 원리의 blocker16회 search+32회 disk filtering. orthographic depth 차를 실제 거리로 바꾸고 반경=거리×tan(각지름/2)를 적용한다. “해 크기” 0°는 기존PCF 경로, 0.53°는 실제 태양 근사, 1~1.5°는 부드러움 비교용 과장값이다. 표면 raw depth 자체그림자 줄무늬를 막는15mm depth offset은 광원 크기와 다른 보정이며 접촉 그림자 손실 가능성이 남는다. volume은 중앙 blocker 거리와4회 disk 비교의 근사로 surface의16+32 PCSS와 같은 정확도가 아니다.

## 측정값
헤드리스 Chromium/SwiftShader. 거리 시험대는1024×512, 동일0.5m폭 blocker를 receiver 위0.15m와3m에 배치, raw HDR R의 그림자→밝음10–90%에 속하는 오른쪽 경계 픽셀 수를 잰다. 바닥4m/1024px, 3.90625mm/px. 화면 픽셀화·depth해상도·sample오차가 포함된다.

| 태양 각지름 | 0.15m 가림 | 3m 가림 |
|---|---:|---:|
| 0° (기존 PCF) | 1px | 1px |
| 0.53° | 0px (subpixel) | 5px |
| 1.5° | 1px | 13px |

`qa-result.json`에 raw profile과 검사 결과. 실제 장면960×640에서 원래창/큰창/물체추가/0°/0.53°/1.5° 동일 시점 비교, 방위270/285/300/315/330/345 여섯 장. 태양 각지름 입력·키보드·reset/restore, window/roof 네 조합 ray·바깥 solid 보존 검사. 기존 regression/qa-result.json은 원래roof/window/0°로 광학·12고정/방위/회전·캐시·출력 변환·반응형을 회귀 검사했다.

## 소품 관문 (project-local self-authored-3d-props)
설계 치수이며 제조사 실측품이 아니다. 원형철물 지름0.76m/두께36mm, leaf 길이0.44m, 가지반지름16mm, 판재 bevel3mm/2segments. 굽기나 외부texture 없이 mid-poly로 실루엣을 만든다. 회색모형 검수는 최초 shader smoke 이후 수행했으므로 “clay 선행 완료”라고 소급 기록하지 않는다. 검수에서 떠 있던 대각재/고리 연결을 발견해 끝점과 연결봉을 보완했다.

| 관문 | 증거·판정 |
|---|---|
| Q0 소유/출처 | PASS — 독립 study 전용 자체geometry. 기존 reference는 리뷰 §2·§5의 원리만 참고 |
| Q1 비례/실루엣 | CONDITIONAL — clay 정면/측면/3⁄4에서 격자·고리·잎의 세 silhouette 확인. 설계치수이며 사용자 미감 미확인 |
| Q2 엣지/기하 | CONDITIONAL — 판재3mm/2segment bevel, 링/가지 실제tube, 잎은 의도된 양면 열린surface. geometry audit zero-area0·scale1; 얇은 철물/잎은 별도bevel 예외. 프레임 모서리의 조립 겹침은 의도된 접합 |
| Q3 재질/UV | PASS(범위한정) — 단색 PBR, 새texture/bake/압축 없음. 원래맵은 변경하지 않음 |
| Q4 실제화면 | CONDITIONAL — 960×640/고정camera·6방위, receiver별 가림 관찰. 3mm bevel의1–2px highlight 목표는 현 구도에서 확인 안 함 |
| Q5 장면/성능 | CONDITIONAL — 프레임 접합/링연결 보완, 원래Story소품 보존. 최종kit 20meshes/1578triangles/3단색materials,새texture0(qa-result.json). 물리GPU 예산·FPS·장기누수 확인 안 함 |

## 확인 안 함
사용자의 창 위치/미감 확정, 실제 Edge/GPU/FPS·모바일·터치·soak, Cycles/원본near key/간접광 일치, 모든 각도의 그림자 가독성, 여러 blocker/얇은caster에서 PCSS오차 한계,15mm bias의 모든 접촉부 영향. shader 산란값/phase/노출은 바꾸지 않았다. 이 비교안을 원본 장면 최종승인으로 해석하지 않는다.

## 조사와 재현
NVIDIA2008 PCSS paper·Three0.186 source/API: source-probe.json와 REF-016 EFX-016-02. 원문 PDF는/tmp에만 있다. 공식 Blender URL 접근은 실패해 이 조사에서 읽었다고 주장하지 않는다.
Cloud에서 stage script로 정적 package를 만들고 이 폴더 bench.html을 임시site의 penumbra-bench.html로 복사해 serve한 뒤 scripts/assets/verify-archive-window.py 실행. bench/검수파일은 public 배포 allowlist에 포함하지 않는다.
