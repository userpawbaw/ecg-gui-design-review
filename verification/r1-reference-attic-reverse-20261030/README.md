# leoparpeix 다락방 역설계 — 2026-10-30 / D-158

요청: “레퍼런스 사이트 자체를 역설계 … 다락방 풍경 그대로.”

**완료한 범위는 현재 원본의 재수집·구조/카메라/베이크 분석·독립 원본자료 재생 검증이다. 자체 모델·텍스처를 새로 만든 제작본이나 공개 복제 사이트가 완성된 것은 아니다.**

원본 GLB/KTX2/번들/새 분석 캡처는 `/tmp/leopar-reverse-20261030/`에만 있다. 이 폴더의 Git 산출물은 수치·hash·명세뿐이며 원본 asset/소스/캡처를 포함하지 않는다. 기존 Story/원본서고/bake/default/r8/D-084와 Pages는 변경하지 않는다.

## 현재 사이트 접근과 근거

- 일반 HTTP 클라이언트는 사이트측 Cloudflare1010/403. 환경정책은 unrestricted/enforced/current였다. 일반 Chromium 방문과 실제 asset 요청은200. 클라이언트 경로 차이를 관찰했으며 정확한 서버 차단 규칙은 분리 검증하지 않았다. 프록시/TLS전역검증을 끄거나 challenge를 우회하지 않았다.
- 사용자도 실제 브라우저에서 다락방이 정상적으로 열린다고 확인했다.
- 현재 번들명 `index-djk_Apyr.js`, 모델 `scene_v9.glb`는 과거 분석과 같다. 과거 원문hash를 모두 보유한 것은 아니므로 파일명만으로 과거와 byte동일하다고 단정하지 않는다.
- `source-probe.json`은 현재 URL/HTTP/bytes/SHA256, `inspection.json`/`inspection-4096.json`은 실제 GLB/KTX2 metadata다. 수집도구를2048모드로 재실행해 모델과7장 수집을 다시 검증했다.

## 정확히 확인한 수치

| 항목 | 현재 원본에서 읽은 값 |
|---|---|
| GLB | 141,924bytes, Draco,13mesh /22,796triangles |
| 전송 vertex attributes | POSITION/TEXCOORD_0. 모든 primitive에 NORMAL/TANGENT 없음. 웹에서는 최종색을 unlit로 표시 |
| 카메라 | 세로FOV22.8951919564°, near.1/far1000, 대략−X방향, glTF Y-up |
| 기본 카메라 위치 | (14.756398201,2.310757160,0) |
| 다락방 카메라 높이 | −.439242840 → −3.189242840, 하강2.75unit. X/Z고정·수평유지 |
| 정규화 경로 | worldY=2.310757160−2.75−2.75×progress, progress0~1 |
| 포인터 | yaw±.75°/pitch±.2°, 지수추종rate2/s. 소스에서확인, 분석viewer의포인터재생은구현안함 |
| 텍스처 | 장면에쓰이는7장. 관찰1280화면에서는2048variant 합1,795,115bytes.4096variant도200으로확보, 합6,337,444bytes |
| 원본필터 | Linear, mipmap생성안함, LinearSRGB표기. TexBibli/Props/Walls는5texel max-cross. TexFloor는desktop hashblur radius3 |

물리미터 여부를 현장실측한 것은 아니다. 값은 원본glTF단위/프로젝션이다. 현재 sourcemodel에는 원본 Blender/Cycles 조명 rig·베이크 전 재질이 없다.

## 원본 장면의 구성

상층은 아치창 작업실, 큰 꽃 조형물, 작업대, 접사다리, 받침대/기하 조각으로 이뤄진다. 상층바닥의 해치/열린뚜껑을 통해 사다리가 하층의 단일책장벽으로 이어진다. 하층에는 돌출상부장·선반·인셋도어/서랍·작은그림/조각·성긴책묶음, 바닥의먼창그림자가 있다.

`layout-components.json`은 vertex위치5소수자리용접/삼각형연결성으로나눈718조각의bbox/중심/치수/tri수다. vertex/index/UV/texture원문은없다. 원본의semantic object수로해석하면안된다. 맞닿은부품은합쳐지거나면으로분리될수있다. 합계tri22,796 일치검사PASS.

## 재생 검증과 한계

독립viewer는 기존Three0.186의Draco/KTX2디코더와직접작성한unlit sampler/카메라제어로만들었다. 원본사이트 shader/controller코드를복사하지않았다. 4096원본자료에서13mesh/7map매칭,progress입력,1280×720하강12프레임,같은progress=.5복귀의PNG동일hash,카메라X/Z/FOV고정·Y경로 검사PASS. JS오류/실패요청0. `replay-result.json`/`frame-metrics.json`.

분석용캡처는scratch의 `verified/attic-midpoint.png`, `upper.png`, `overview.png`, `descent-00..11.png`에만 있다. 새 원본캡처를verification/에복사하지않았다. app의파일보기열기요청은queued였으므로사용자화면에열렸다는보장은하지않는다.

분석viewer는원본geometry/베이크/카메라의독립재생이며 웹사이트전체compositor/DOM·cloud/dust·포인터보간·TexFloor hashblur를재현하지않았다. 실제사이트현재canvas와의픽셀동일성검사를하지않았으므로“완전동일한복제사이트”PASS가아니다. 첫live방문은HTTP/asset수신을확인했지만canvas의완전한장면표시는그실행에서확인못했다. 원본장면을읽은별도viewer의재생은확인했다.

## 재구성 기준과 후속 제작 범위

`reconstruction-contract.json`을원본고정명세로쓴다. 원본의씬계층·카메라·부품배치/깊이를먼저맞춘후직접제작한모델/재질로같은빛을굽고unlit로표시하는순서다. 제작화면은같은12progress에서비교한다. 현재light-study의선택값/효과를원본의물리파라미터로간주하지않는다.

자체모델·새베이크/UV/텍스처·원본그림/조각의자체제작대체·웹공개물제작·동일프레임이미지차이검수는아직하지않았다. 원본이미지의최종색에서정확한베이크전광원·GI·roughness를유일하게복원할수있다고주장하지않는다.

## 확인 안 함

원본 Blender제작파일/정확한light rig·베이크전albedo/roughness, 원본의전체postprocessing pixel parity,실제GPU/FPS/모바일/장기운영,포인터/구름/먼지runtime완전재현,718조각의semantic분류,자체제작재구성본의완성도/원본과의오차/사용자미감.

## 도구와 경계

- `scripts/assets/collect-reference-attic.py`: 정상browser로현재공개자료를scratch에수집.해상도2048/4096선택.첫partybundle·scene·7bake만보존.원본파일의repo내수집경로는거절.
- `scripts/assets/inspect-reference-attic.py`: GLB/KTX2수치보고서와독립viewer를scratch에생성.원본vertex/UV를보고서에내보내지않음.
- `scripts/assets/verify-reference-attic.py`: decoder/mapping/12camera프레임/입력/반복/연결성검수.원본기반캡처경로가repo안이면거절.
- `repository-boundary-check.json`: 수집/분석도구가repo안asset경로를거절함을실행확인.
- 현재Pages stage allowlist는수정하지않았으며이원본자료/분석viewer를공개배포하지않았다.
