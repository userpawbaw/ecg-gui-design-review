# A-P2 지구·궤도·하강: 추가 목업의 효용과 구현 GAP 분석

2026-10-06 · RESEARCH / 기존 A 시나리오 보완 · F-047 / D-076 / REF-014 / CASE-007

## 1. 결론

**추가 목업은 권장한다.** 현재는 전경 지구의 풍부한 질감은 정해져 있지만, 같은 구름이 궤도와 근접 시점에서 어떤 덩어리·층·틈으로 읽혀야 하는지가 부족하다. 제작자는 원하는 화면의 정답을 추정하면서 밀도·카메라·조명을 동시에 바꾸게 된다.

추천 산출물은 **연속 장면 8장 + 구름 상세 기준 4장**, 총12장이다. 이미 마음에 든 기존 그림은 그대로 연결해 쓰고 새로 그려야 하는 장면만 보완한다. 숫자를 채우기 위한 전면 재생성은 필요 없다. 아직 이미지 생성·새 renderer 구현을 시작한 것은 아니다.

이미지에는 눈으로 보이는 결과를 고정하고, 별도 씬 명세에는 camera/광원/군집 identity/레이어 높이/노출을 기록한다. 생성 이미지로 물리적 일관성이나 실제 자산 품질을 증명하지 않는다. 목표 화면과 구현 가능한 같은 씬 기준 렌더를 함께 사용하는 계획이다.

## 2. 확인한 실제 자료와 증거 범위

- 구현 기준 HEAD: `919a63d461b6f7a2ff20553745bc1d0143650606`. `arrival.ts`, `planet-cloud-sculpt.ts`, `planet-clouds-v1.ts`, `prepare-cloud-sculpt.py`, `render-cloud-sculpt.py` 직접 점검 [코드].
- 실제16개 software browser 정지 캡처와 metrics, Cycles final-reference manifest 점검. 새 live GPU/영상/성능 검증은 이번 연구에서 수행하지 않았다.
- 기존 `outputs/images/A0_globe_v1.png`와 사용자가 제공한 `ChatGPT 이미지 2026년 10월 6일 오전 02_03_02.png`를 직접 확인했다. 목업은 구현 목표이며 측정된 지구 사진이 아니다.
- 제작자 기술자료의 설명과 실제 코드 분석을 구분한다. 아래 외부 사례의 게임/엔진을 이번에 설치·실행하거나 native 프레임을 녹화하지 않았다. 근거는 [문헌], PDF 관련 시각자료 확인이다.
- 재현 가능한 정적 분석: `scripts/assets/analyze-cloud-reference.py` → `verification/a-cloud-reference-20261006/source-audit.json`. renderer는 수정하지 않는다.

## 3. 목업과 실제의 GAP은 어디서 생기는가

| 화면에서 보이는 차이 | 현재 구현에서 확인한 사실 | 원인 해석·신뢰도 | 다음 분리 확인 |
|---|---|---|---|
| 목업은 행성부터 여러 규모의 구름이 이어지는데 실제 하강은 넓은 빈 하늘 뒤 작은 군집 | global opacity가 p.28에서5.31%, p.283에서0.047%, p.29에서0. 이때 camera altitude 약20.13/15.77/10.01km. 국소 군집은4×2×4km 한 상자 | **인계 구간/분포 부족은 직접 코드 근거.** 단순 질감 변경으로 장면이 채워지지 않음 | 광역을 끄지 않은 경로와 동일 군집 coverage에 맞춘 LOD 인계를 비교 |
| 목업 구름은 띠·얇은 섬유·소용돌이·불규칙 군집, 실제는 둥근 뭉치 | 171개 타원체를 max로 합성, 대부분 디테일을128³R8에 bake. thick은 runtime에서 그 밀도를 바로 읽음 | 큰 구조가 둥근 primitive의 합집합으로 남는 것은 확인. 자연스러운 분지/찢긴 경계가 부족한 시각적 기여 비율은 미측정 | coarse envelope만 있는 렌더와 envelope+runtime detail을 비교 |
| 외곽이 솜털처럼 잘게 갈라지지 않고 흐림 | 4km/128 ≈31.25m, 높이2km/128 ≈15.63m. 새 작은 bubble의 physical 반경은 가로약90–190m/세로약45–95m. 표본 격자 정의에서는 extent/(N-1) 차이도 존재 | 세부 구조가 몇 voxel 규모에 제한됨. **128³ 자체가 항상 낮은 품질이라는 뜻은 아님.** 반복 noise용128³과4km 전체 조형용128³는 다른 용도 | geometry profile/미세 density를 분리하고 sampling footprint에 맞춰 LOD |
| 흰 윗면·어두운 홈·부드러운 하부의 깊이 대비가 약함 | sun 방향 optical-depth cache는 있으나 sky는 높이별 RGB, bounce는 높이 함수. 주변 구름에 가려진 sky irradiance를 적분하지 않음 | 자가 그림자 존재와 주변광 차폐는 다름. 높이만 같은 두 지점의 하늘광은 같게 처리되어 내부 틈 대비가 약할 가능성 [추론] | 직접광만/sky만/sky occlusion on-off와 정확한 기준 렌더 대조 |
| 가까운 cloud가 천·솜 같은 입체감보다 흐린 물체로 읽힘 | half-res raymarch+5tap 공간 업스케일, temporal accumulation 없음. depth/pass 및 bloom 결과 확인 | 조형·density 필터·화면 재구성이 함께 영향. 하나의 AA 옵션 탓으로 확정 불가 | **동일 density/빛**으로 full-res 기준→half-res 비교, detail 재료 변경과 분리 |
| 따뜻한 역광과 청색 수평선이 분리되고 가까운 구름은 따로 놓인 느낌 | 대기는 LUT 경로, cloud는 자체 색/거리 haze. global cloud는 planet inverse 좌표의 NASA coverage, local bank는 고정 world box | 대기·구름의 radiance/transmittance와 좌표/coverage 연결이 충분히 공유되지 않음. 단순 bloom으로 봉합 불가 | 같은 광원과 cloud 실제 깊이를 사용한 대기 합성·지리 앵커 확인 |
| Cycles 자료와 browser 사이 차이가 커 어디를 맞춰야 할지 어려움 | Cycles camera는 별도6개 구도, receiver는 평면, browser는 Earth 곡면. atlas는 X/Y nearest, browser trilinear. 최종 Cycles640×360/16samples+denoise | **기준 렌더 자체가 비교 조건에 맞지 않았다.** 이를 browser 구현이 원본에 미달한 정도의 계측으로 쓰지 않음 | 동일 camera/receiver/태양/노출·color management 변환 명세로 gold render |

원인별 품질 저하의 백분율은 측정하지 않았다. 위 표의 코드 사실과 지각 원인 가설을 구분한다. software renderer로 나온 실제 화면의 미달은 기록할 수 있지만 그것으로 GPU 성능을 추정하지 않는다.

### 배제·유보한 가설

현재 light-depth bake는24×.09km=2.16km만 적분한다. 상자 전체를 빠져나가기까지 항상 충분하다는 일반 보장은 없다. 그러나 이번 실제 R8 밀도에서16³격자 중밀도>.02인339지점을 같은 .09km step으로7.2km까지 확장했을 때 **추가 optical depth와 투과 차이가 모두0**이었다. 따라서 이 표본에서는 bake 경로 부족을 주원인으로 볼 근거가 없다. 전수 검증·float 원본/bake 양자화 비교·렌더 radiance 검증은 아니다. 길이를 무조건 늘리기보다 조형·주변광·인계부터 조사한다.

## 4. 유사 결과물은 어떻게 제작하는가

### 4.1 Unreal Engine — 지표↔비행↔우주를 직접 다루는 사례

[Epic Volumetric Cloud](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine)의 ground-to-space 대상/고도별 예시 및 cinematic quality 비교를 본다. 3D volume raymarch와 다중산란 근사, 주변광 차폐, 지표 기여를 조합한다. self-shadow용 secondary march와 먼 지표 그림자용 Beer shadow map의 역할·정확도/비용이 다르며 reconstruction 모드도 분리한다 [문헌].

[Epic Sky Atmosphere](https://dev.epicgames.com/documentation/en-us/unreal-engine/sky-atmosphere-component-in-unreal-engine)의 Planetary Atmospheres Viewed from Space는 planet radius/atmosphere height와 행성 시점의 per-pixel transmittance를 설명한다. **space atmosphere 지원과 cloud의 모든 근접 품질이 자동으로 같다는 뜻은 아니다** [문헌].

**우리에게 적용할 해석:** 광역 분포/국소 조형/빛/재구성을 각각 설계하고, 대기광과 구름을 같은 태양·좌표·깊이로 연결한다. Three.js로 엔진을 이식해야 한다는 결론은 아니다. 외부 고품질 엔진은 원하는 구도와 광학 관계를 확인하는 독립 기준 렌더 도구 후보다. GPU 설치/실행·성능 검증은 미실행.

### 4.2 Guerrilla Nubis³ — 구름에 접근하고 내부를 통과하는 조형 기준

[제작자 소개](https://www.guerrilla-games.com/read/nubis-cubed)와 [SIGGRAPH2023 발표 PDF](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20%28Advances%202023%29.pdf) 실제 페이지를 분석했다. PDF viewer **70쪽**은 Houdini Atlas의 simulation/voxel 편집, **85쪽**은 profile/detail-type/density-scale 분리, **144쪽**은 주변광 방향의 누적 밀도, **151쪽**은 light cache, **163쪽**은 SDF/거리별 step을 보여준다 [문헌].

이 결과의 매력은 굴곡이 있는 겉면뿐 아니라 같은 군집을 가까이/안쪽에서 봐도 빈 공간과 빛의 관계가 살아 있다는 점이다. **Horizon의 근접·비행 cloud 제작 사례이며 전지구 coverage/궤도 지원의 증거는 아니다.** 큰 조형을 저장한 뒤 sampling 단계에서 디테일을 구성하는 방식이 이번 raw density 하나에 모든 디테일을 굳힌 방식과 다르다.

**우리 번안:** 고품질 VDB/sculpt/procedural envelope를 large structure로 사용하고 detail-type을 dense billow와 sparse wisp로 분리. 주변광 차폐 cache와 conservative SDF/empty skipping은 후속 후보. 발표의 ms 수치를 WebGL/RTX3070 예산으로 복사하지 않는다. 단순 파일해상도 확대가 핵심은 아니다.

### 4.3 Takram three-clouds — 웹에서 빛·재구성까지 묶는 사례

[공식 README](https://github.com/takram-design-engineering/three-geospatial/blob/main/packages/clouds/README.md)의 Configuring cloud layers, Rendering path, Limitations를 확인했다. BSM→shadow temporal resolve→cloud radiance/transmittance→cloud temporal resolve→aerial perspective로 합성하며 shape/detail/turbulence/STBN을 분리한다. 문서에는 space views/global coverage가 예정 기능이고, sparse-cloud ghosting·겹친 구름의 mean-depth 오차·Three examples composer 비호환도 명시되어 있다 [문헌, 2026-10-06 열람].

**우리 번안:** 근접 웹 renderer 구조/디테일·대기 합성의 참고로 사용한다. 이미 atmosphere를 쓴다는 이유로 전체 cloud 라이브러리를 즉시 승자로 채택하지 않는다. orbit→local 좌표와 composer 통합 검증이 먼저다.

### 4.4 SpaceEngine — 먼 행성 시점이 좋아도 근접 재료가 별개인 사례

[행성 제작 매뉴얼](https://spaceengine.org/manual/making-addons/creating-a-planet/)은 구면 layer별 height/velocity/coverage와 diffuse/bump map을 설명한다 [문헌]. [Clouds 개발 블로그](https://spaceengine.org/news/blog100327/)는 **2010년의 역사 자료**로, 당시 spherical layer의 근접 교차/투명 문제와 먼 bump 표현→가까운 volume 전환 아이디어를 기록했다. 이를 최신 버전의 전체 cloud 구현 방식으로 확대하지 않는다.

**우리 번안:** 먼 지구를 충분히 풍부하게 보이게 하는 저렴한 표현과 근접 volume을 분리하는 것은 타당하다. 단, 두 표현이 같은 구름의 위치/윤곽/높이/밝기를 공유해야 한다. unrelated volume을 fade-in하는 것만으로 인계가 완성되지 않는다.

### 4.5 실제 사진으로 형태와 빛의 관계도 대조

[NASA Cloud Streets Near Antarctica](https://science.nasa.gov/earth/earth-observatory/cloud-streets-near-antarctica-92768/)는 남극 주변의 길게 반복되는 구름 분포를, [NASA Crepuscular Rays and Cumulonimbus Clouds](https://science.nasa.gov/earth/earth-observatory/crepuscular-rays-and-cumulonimbus-clouds-153537/)는 기울어진 관측·낮은 태양에서의 높이/음영/틈을 설명한다 [문헌]. 이 자료는 morphology/light의 현실 기준이고 renderer의 기술 스택 증거가 아니다. 후자의 높은 대류운을 남극 모든 지점에 넣어야 한다는 뜻도 아니다.

## 5. 어떤 추가 목업이 실제로 필요한가 — 연속8 + 상세4

**공통 고정:**16:9/1920×1080, 같은 지구 orientation/서고 도착 지역/태양 world 방향, same hero-cloud ID H1, 주변군집 H2/H3, thin layer T1. 구름들은 같은 장소의 확대이며 새 장면마다 다른 구름으로 교체하지 않는다. 좌표는 화면 정규화(x%,y%), 아래 고도는 **초기 설계 후보값**이며 승인·물리 계측값이 아니다. 정확한 camera export로 크기/고도를 정합시킨다. 시간은 0–1 scroll beat에 대응하고 날씨 변화는 고정한다.

| ID/구간 | 화면 구도·고도 후보 | 반드시 보일 디테일 / 전이 | 구현에서 판단할 항목 |
|---|---|---|---|
| J0 지구 전체 | sphere중심(68,57), 화면높이60–75%, 전체 윤곽 유지. 우주에 충분한 여백 | 대륙/남극과 광역 띠·얇은 구름, 왼쪽 제목공간. 해당 지점은 환자 실측 위치로 표시하지 않음 | 글로벌 coverage가 도안처럼 평면으로 붙지 않는가 |
| J1 지구 전경→궤도 | 기존 마음에 든 hero구도 활용, 지구가 우하단으로 잘림. 같은 해안과 H1포함한 넓은 구역 | 빛받는 cloud와 남극 얼음의 재질 차이. 큰띠/작은patch/바다공백 혼재 | 기존 무드를 유지하며 확대 목적지가 읽히는가 |
| J2 낮은 궤도 | 고도150–400km 후보, 곡선horizon y18–28%, 하단에넓은cloud 분포. 태양project좌표기록 | 얇은 청색 limb, 전경/후경cloud 높이차. 지구를 덮는 glass surface 금지 | cloud가 아직 작은 상황에서도 층과 분포로 행성 규모가 읽히는가 |
| J3 하강 시작 | 20–40km 후보, down-oblique 30–50°, H1(55,62), 주변군집이프레임을연결 | H1만 고립시키지 않으며 광역같은패턴 확대. 구름사이바다/ice는남겨둠 | p.27–.29 인계의 빈 하늘·pop 해결 기준 |
| J4 구름 윗면 | 7–12km 후보, H1윗면하단50–70%, H2뒤/T1위층 | 크고작은 비대칭융기/안장/찢어진edge; 아래지표그림자 일부와밝은윗면분리 | 큰솜덩어리가아닌계층적형태, 투과차 |
| J5 옆면·틈 | 4–7km 후보, camera H1높이에가깝게. H1왼앞/H2오른뒤/빈틈중앙 | sidewall높이, 윗면highlight→중간neutral→하부cool shadow; 얇은wisps가틈통과 | 앞뒤시차/높이/sky occlusion로양감읽힘 |
| J6 내부 진입 | 기존진입방향연장, H1이좌우전경으로화면70–90%차지 | 가장자리미세분해/중심불투명. 뒤cloud가앞density에가려짐, gap이점차닫힘 | 실제 volume진입 후짧은가림으로읽히는가; 보드평면fade와구분 |
| J7 가림→고창 | 기존서고도착구조/고창위치고정. cloud는바깥에잔류 | 짧은완전가림후같은도착공간노출. 글자나새건축을추가하지않음 | 승인된서고구조/빛을보존하며지루한긴흰화면을피함 |

J0/J1의 cloud detail은 거리에 맞게 작아야 한다. globe전체에서 거대한 개별 솜방울을 보이게 하려고 근접 스케일을 늘리지 않는다. spectacle를 위한 고도/relief 과장은 가능하되 명세에서 분리하고 LOD 중 튀지 않는지 확인한다.

| 상세 ID | 같은 cloud/구도의 변화 | 제작 기준으로 쓸 내용 |
|---|---|---|
| C1 형태 sheet | H1과H2의 top/side/underside를 같은태양과scale로 분리관찰 | 큰융기/작은융기/낮은base/찢어진외곽, 지나치게구형인형태의금지예. 생성이미지로정확한orthographic mesh를증명하지않고geometry명세를보조 |
| C2 thick-thin 겹침 | J5카메라에서 T1이 H1앞·뒤를지나는관계. 아래바다가보이는범위표시 | core불투명/edge부분투과/얇은층투과, 서로다른방향성/밀도texture |
| C3 빛·그림자 | J5같은카메라의 완성광학목표, 별도실제gold render에서direct/sky/ambient차폐를분리 | self shadow와 지표cast shadow를다른색annotate. 그림자의sun 반대방향·위치·부드러움과양감. bloom을끄고형태확인 |
| C4 경계 closeup | J6의edge를고해상도로확대, 맞은편하늘/후경cloud동시에포함 | 다중규모 침식·늘어진솜털·작은덩어리의clear/soft경계혼합. 단순blur/noise덮기와구분 |

**첫 제작 묶음 제안:** J2/J3/J5 + C1/C2를 먼저 구체화해 규모/군집/질감을 비교한다. 만족한 cloud identity와태양을 anchor로 나머지 연결프레임을 만들고 12장 package에서 연속성을 다시 확인한다. 이는 일부 미완씬을 최종완성 평가해달라는 요청이 아니라, 목업 목표를 고정하기 위한 검토 단위다.

## 6. 이미지와 구현을 연결하는 방식

1. **실제 source pack:** NASA 분포/사진 morphology + Nubis/Epic 기술 + 기존A 무드의 용도를 구분한다. 좋은화면/제작근거/우리설계추론을 한컬럼에섞지 않는다.
2. **목표 still pack:** 위12장중기존승인화면은 재사용. reference image를 편집해 같은대륙/군집/태양/색을보존. 장면간동일성실패는 prompt를늘려변명하지않고 재검토한다.
3. **같은 world scene의 gold render:** Blender 기존환경 또는선택한엔진에서 same camera/receiver/태양/단위. shape profile+runtime detail 같은구조를offline에도사용. 1080p이상/수렴확인/denoise 전후검토, 아카이브카메라는기존고정. 낮은해상도미리보기로새최종reference를대체하지 않는다.
4. **원인분리 browser pass:** 같은구도에서 silhouette/밀도→직접광→주변광차폐→지표shadow→대기합성→fullres→halfres 순으로 비교. 변경은 하나씩. 새실행후source hash/입력/render조건기록.
5. **시점에 따른표현인계:** far/global coverage와 local envelope를 동일앵커로연결. optical thickness/실루엣/밝기/구름높이가 인계전후보존되는지 검사. 화면점유율과거리/샘플오차로 LOD를정하고 scroll상수만으로cloud전부끄지 않는다.
6. **마지막에 실제motion/성능:** 정지fullres기준으로형태와빛을맞춘뒤 temporal정역재투영/AA/GPUbudget을별도검증. 광원고정cache도density·detail이달라지면rebake/재설계 필요. CPU/소프트웨어capture를GPU성능근거로쓰지 않는다.

### 완료·채택 기준

- 무드: 승인A따뜻한태양/청색horizon/무게감유지.
- 형태: 같은군집에big/medium/fine scale, core/edge/빈틈구분. 전체가동일구형noise로보이지않음.
- 빛: self shadow와cast shadow가sun/높이와일치. sky occlusion이홈을살리며black paint처럼고정되지않음.
- 연속성: J2→J6에서같은군집과높이관계유지, 빈배경pop/가림뒤교체를최종스크롤영상에서점검.
- 정지·motion·targetGPU는독립결과. 목업PASS/assetPASS/runtimePASS를서로대체하지 않음.

추가목업은 **미정인목표를구체화**하고 gold render는 **실제로만들수있는빛/조형의기준**을준다. 둘을 함께 준비하는것이 이번목업Gap에대한 권장방식이다. 큰renderer코드확장/라이브러리교체/새날씨시뮬레이션은 이번연구에서착수하지않았다. A-P3/Story/B/C범위는유지한다.

종료 검증: records165 PASS / 정적 분석 script 실행·pycompile PASS / diff-check PASS. 이번은 연구·제안 문서이며 Vite 새 build/실행 품질 향상 검증은 대상 아님. 원격은 commit/push 후 내용 readback으로 확인.
