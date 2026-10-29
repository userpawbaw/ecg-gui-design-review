# 원본고정 다락방 — 자체 제작 복제 (D-159)

사용자 “복제까지 계속 진행”에 따라 D-158의 원본자료 분석 다음으로 **자체 모델·재질·UV·Cycles 베이크·웹 장면을 제작했다**. 레퍼런스: https://leoparpeix.com/ . 원본 자료 분석은 [D-158 검증](../r1-reference-attic-reverse-20261030/README.md).

**판정: 구현/공개 기능 PASS, 시각 충실도 CONDITIONAL.** Pages 배포와 공개 패키지/브라우저 검증을 완료했다. 원본과 같은 주요 구도/공간/하강 경로의 자체 복제이며, 픽셀 동일성이나 최종 미감 합격을 주장하지 않는다.

[공개 복제 장면](https://userpawbaw.github.io/ecg-gui-design-review/reference-clone.html?v=c4b69c8) · [공개 웹 캡처](https://userpawbaw.github.io/ecg-gui-design-review/clone/web/preview.png?v=c4b69c8)

## 결과와 조작

- 별도 페이지: `reference-clone.html`. 기존 `preview.html`·`light-study.html`은 유지한다.
- 작업실/서고 버튼, 하강 슬라이더·휠, 정면 ±45.8°의 회전·확대 검토, 초기화. 광원은 새로 구운 고정 조명이다.
- 자체 웹 캡처: [서고](web/attic-midpoint.png), [작업실](web/upper.png), [조작 화면](web/preview.png), [390×844](web/mobile.png). 정지 Cycles: [서고](render-attic.png), [작업실](render-upper.png).
- 원본과의 12프레임 비교 이미지는 `/tmp/ecg-authored-attic/reference-vs-own-*.jpg`에만 둔다. 저장소에는 차이 수치 `image-comparison.json`만 기록한다.

## 제작과 출처 경계

측정 단위 1을 1m로 취급한 제작 가정이며 실제 건축 실측은 아니다.

- `kit-spec.json`: 분류한 **347개** 치수/자세. 책199, 판재122, 문/서랍10, knob10, 그림3, 받침2, 박스1. 원본718개 연결 조각을718개 소품으로 해석하지 않는다.
- `build_reference_attic_clone.py`: 새 cube/bevel/inset/book/flower/arch 기하, 새 UV, 자체 저대비 목재·직접 그린 herringbone, 별도 Cycles 조명. 입력은 kit-spec뿐이며 원본 GLB/KTX/번들을 열지 않는다. 중간 blend·무손실 atlas는 `/tmp/ecg-authored-attic`에 둔다.
- 원본 baked 색 probe는 조명/재질 분리가 안 되어 rust에 편향됐으므로 기각했다. 최종 책색은 선반별 자체 palette 배분(seed159)이며 원본 albedo 복원/픽셀 전송이 아니다.
- 그림은 새 꽃/화분 도형, 꽃은 새 타원체·곡선·다각면이다. 원본 그림/모델/UV/텍스처/코드/새 원본 캡처는 저장소·Pages에 넣지 않는다.
- `asset-boundary-result.json`: scratch 원본/원본 캡처66파일과 stage33파일의 exact hash 중복0. 이는 정확한 파일 복사 제외 검사이며 일반적인 IP 판정은 아니다.
- `protected-sources.json`: Story·기존 GLB/프리뷰·builder 등7개 파일 불변. `existing-preview-regression.json`: 새 stage에서 이전23파일 전부 바이트 동일. 기존 r8/D-084/defaults 유지.

## 측정값

Blender **4.5.3 LTS**, CPU5threads, COMBINED32samples, AgX / Medium High Contrast. 정지 렌더64samples+OIDN, clay24samples. 새 베이크 총 **1561.65s = 26.03분**.

| 그룹 | 실제 bake 시간 | 4K lossless WebP bytes |
|---|---:|---:|
| library | 599.01s | 2,424,122 |
| books | 181.46s | 909,452 |
| studio | 311.34s | 3,966,742 |
| floor | 468.34s | 4,248,356 |

- 4096² ×4장, WebP 합계 **11,548,672bytes**. PNG RGB8과 디코딩 RGB8 전 픽셀 일치4/4. float HDR→표시 RGB8 양자화까지 무손실이라는 뜻은 아니다(`packaging-result.json`).
- GLB **8,807,548→5,124,664bytes (−41.82%)**. 기존 lockfile의 meshoptimizer0.22/MIT 재사용. 양자화/단순화/인덱스 회전 없이16개 buffer view의 디코딩 바이트 동일. 같은 shader 상태의 압축 전후 PNG도 동일(`mesh-compression-result.json`).
- 실제 브라우저: **4meshes / 130,176triangles / 4draw calls**. 원본22,796triangles보다 많다. 원본 성능 동등성은 확인 안 함.
- 전체 stage33파일 **32.91MB**는 기존 프리뷰/런타임도 포함한다. 새 GLB+atlas는 **16,673,336bytes**이며 모든 stage파일이 새 페이지 로딩에 사용되는 것은 아니다.
- FOV22.8951919564°, 하강2.75, p=0..1의12지점. 같은 위치 재방문 PNG 동일. 포인터/휠/슬라이더/회전/초기화/reduced-motion/390×844 통과. Chromium 154.0.8037.57/SwiftShader, 1280×720. 요청/JS오류0 (`web/browser-result.json`).

## Q0–Q5

| 관문 | 판정·실제 증거 | 제한 |
|---|---|---|
| Q0 출처 | PASS — 자체 builder/측정/고정 palette/새 bake 분리, stage 경계 검사 | 원본 Blender 재질/조명 rig 확인 안 함 |
| Q1 비례 | CONDITIONAL — 수정 clay 정면/3/4시점/상층 및 같은 카메라12프레임 시각 비교 | artwork·곡면·세부 끝단은 단순화 |
| Q2 기하 | 선택6부재 MECHANICAL_PASS — geometry-audit.json. 판재3mm/책1–1.5mm bevel, 문 인셋8–20mm | 전체 manifold/UV 겹침/접지 전수 확인 안 함. 잎은 의도적 열린 면 |
| Q3 재질·UV | lossless PASS / 외관 CONDITIONAL — 새4K, 먼지·마모 없는 낮은 대비, 경계 sampler A/B | 일부 미세 경계/저해상도 UV면 차이가 남음 |
| Q4 실제 화면 | 기능 PASS / 미감 CONDITIONAL — 실제 웹12프레임, Cycles와 비교 | 모든 소품1–2px highlight/사용자 미감 확인 안 함 |
| Q5 통합·성능 | 보호/기존패키지 PASS — 7파일·23stage파일 불변,4draw calls | 실제 Windows Edge/GPU/터치/FPS·Story 통합 확인 안 함 |

책장 거리8.516m/1280×720의 정면 투영은 약4.79mm/px이므로3mm bevel은약0.63px이다. 1–2px highlight 목표를 전체 소품에서 달성했다고 주장하지 않는다. `kit-parameter-check.json`은 측정 파라미터의 AABB 비교일 뿐 실제 기하/미감 오차 검증이 아니다. 원형 좌판을 상자로 가정하거나 사다리 끝단의 홈을 닫힌 beam으로 바꾸면 차이가 커진다.

## 웹 차이 진단과 수정

첫 웹 캡처의 검은 경계는 무손실 변환에서도 나타났다. 자체5tap max 경계 sampler를0/1/1.5/2texel로 비교했다. 서고의 Cycles 대비 PSNR25.87→27.73dB로 가장 나은1texel을 고르고 floor는 일반 linear/mipmap을 유지했다. 원본 분석에서 확인한 경계 샘플링 원리를 새 코드로 구현했으며 원본 shader는 복사하지 않았다. `sampling-comparison.json`, `sampling-before.png`.

최종 studio는 열린 잎 면을 표시하도록 DoubleSide를 적용했다. 최종 표시와 정지 Cycles의 RGB8 차이:

| 시점 | MAE (/255) | PSNR |
|---|---:|---:|
| 작업실 | 2.705 | 28.62dB |
| 서고 | 4.159 | 27.70dB |

이 수치는 지각적 충실도 점수/전체 원본 사이트 동등성이 아니다. `image-comparison.json`의 원본 분석 replay와의12쌍 차이는 조명·palette·그림·단순화 차이까지 포함한다.

## 최초 실패와 정정

1. 첫 clay 사다리 OBB가 넓은 판이 되고 창 Boolean/닫힌 곡선 실패 → 최소체적 직교 치수·컷터 법선·polyline으로 수정. `clay-initial-fail.jpg` 보존.
2. 첫 material 대비 부족/rust 편향 → 원본색 probe 기각, 자체 palette/하층 key 보정. 정지 시각 수정3회 범위로 종료.
3. 최초 audit 책 이름 `-0` 누락 → 실제 `-1 pages`로 정정한 최종6개 검사.
4. 로컬 HTTP서버 log pipe 종료로 EMPTY_RESPONSE → file log의 분리 서버로 재시작. 커밋 오류가 아니었다.
5. Playwright range의 `.8` malformed value → `0.8`; resize 직후 old inline canvas폭 노출 → renderer.setSize(...,false)로 CSS가 크기를 소유하고 aspect 완료 대기. 최종 기능 PASS.
6. 열린 잎의 FrontSide culling → studio DoubleSide. 원본 하강끝의 sky 배경도 자체 viewer에 반영. 기술 수정 뒤 같은 검수 재실행.

## 확인 안 함 / 남은 차이

원본 조명 rig/true albedo, 전체 live site compositor·cloud·dust·텍스트·포인터 완전 일치, 픽셀 동등성, 실제 Windows Edge/GPU/터치/FPS, 사용자 미감, Story 통합은 확인 안 함.

원본 대비 사다리 명도와 광분포·그림·꽃/잎 곡면·돌 세분화·목재 표면이 다르다. 상층 clerestory·일부 미상 소품/끝단 홈은 단순화/생략했다. 바닥은 자체 패턴/두께·전면 범위로 원본과 차이가 있다. 회전은 정면 검토용이며 원본 경로 밖의 전체 실내/후면을 완성한 자유 동선이 아니다. 이를 최종 원본 동일 미감 합격으로 승격하지 않는다.

## 재현

클라우드: builder --stage clay → 시각 검수 → --stage finish → 시각 검수 → --stage bake. `compress-reference-attic-clone.mjs`로 자체 GLB를 lossless meshopt 처리하고 `package-reference-attic-clone.py`로 atlas를 패키징한다. `stage-archive-web-preview.py`는 명시한33파일만 복사한다. `verify-reference-attic-clone.py`는 local/public URL을 받아 같은12위치와 조작을 검사한다. 원본 파일 없이 kit-spec으로 다시 제작할 수 있다. 사용자 Windows 실행 지시는 이 문서에 제공하지 않는다.

## 공개 배포 기록

- 소스 `c4b69c82c6c248c9728eaf480bcdf566cccfc9d1`, main workflow_dispatch [40927081950](https://github.com/userpawbaw/ecg-gui-design-review/actions/runs/40927081950) success. feature push의 skipped run은 별개다. main은 workflow 실행 기준이며 공개 자산 소스 SHA는 위 값이다.
- `remote-source-check.json`: 작업 시작5cb0ac4 이후 변경58파일의 원격 내용/로컬 바이트 일치.
- `public-package-result.json`: 공개33파일 HTTP200/전부SHA일치. 금지 원본/문서 경로6개404. 표준 TLS검증을 유지했다.
- `public-browser-result.json`: 공개 URL Chromium/SwiftShader에서 실제4mesh/4K4장/130176tri/4calls,12하강·위치재방문·입력·reset·reduced-motion·390×844 PASS. JS/실패요청/실패응답0, 원본사이트 에셋 요청0.
- 공개 확인 캡처: [실제 공개 화면](public-preview.png), [공개 모바일 크기](public-mobile.png). Pages의 빠른 캡처 링크는 배포 패키지의 로컬 웹 캡처다.
- 공개 로딩은 이 headless 검사에서 7.11s. 실제 PC/GPU 성능으로 일반화하지 않는다. 로컬/공개12쌍 중 PNG/RGB동일4쌍, 나머지는 RGB8 MAE최대 0.000756/255의 미세 차이가 있었다. 이 차이의 원인은 분리 확인 안 함. 모든 공개자산은 바이트일치하며 픽셀완전동일성은 주장하지 않는다.
