# REF-014 지구·궤도·근접 cloud 제작 비교

2026-10-06 · 기술/제작 reference mining. 상세 번안과12장 제안은 [분석 보고서](../rounds/R1/SCENARIO-ABC-20261003/ECG_A_orbit_cloud_reference_plan_2026-10-06.md).

## 1. 레퍼런스 개요

- [Epic Volumetric Cloud](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine): 지표↔우주 전환 대상, raymarch/빛/재구성.
- [Nubis³ 제작자](https://www.guerrilla-games.com/read/nubis-cubed) / [발표 PDF](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20%28Advances%202023%29.pdf): 가까운 voxel cloud 제작·내부 통과.
- [Takram README](https://github.com/takram-design-engineering/three-geospatial/blob/main/packages/clouds/README.md): 웹 cloud의 레이어·빛·시간 재구성.
- [SpaceEngine manual](https://spaceengine.org/manual/making-addons/creating-a-planet/) / [2010 개발 기록](https://spaceengine.org/news/blog100327/): 먼 구면 cloud 표현과 근접 한계의 역사 사례.

## 2. 입력 증거

공식 문서/발표 및 Nubis PDF70/71/144/145쪽 시각 점검 [문헌]. 71쪽은 조형 입력과 엔진 결과의 나란한 비교,145쪽은 밝은 융기·어두운 홈·흩어진 하부의 결과를 확인했다. 게임·엔진 live 실행, interactive demo 입력판별/연속 영상은 미실행. 모든 사례가 orbit-to-surface에 같은 품질로 성공했다는 근거가 아니다. NASA 사진은 report의 shape/light 참고이며 기술 stack 증거가 아니다.

## 3. 기술 스택과 전역 설정

Epic: Unreal volume material+cloud+sky atmosphere. Nubis: Houdini Atlas/Decima voxel sampling/cache. Takram: Three.js/postprocessing 별도composer. SpaceEngine: 문서의 spherical layers/diffuse/bump. 버전별 실제 renderer 실행/성능·자산 경로는 미확인. 현재 프로젝트는 Three0.186.1/three-atmosphere0.19.1/examples composer/custom volume이며 compatibility를 별도 검토한다.

## 4. 디자인 토큰

외부원본의 정량 camera/노출/RGB값은 미측정. 우리후보16:9/1920×1080/same world sun/H1-H3/T1 identity는 report에서 제안, 아직승인값이아니다.

## 5. 장면·전환 지도

| reference에서 고른 범위 | 우리 목표 | 카드 |
|---|---|---|
| Epic ground/altitude/space 설명 | J2–J6 빛·대기·재구성 | EFX-014-01 |
| Nubis PDF70/85/144/151/163 | J4–J6 조형/미세층/빈틈 | EFX-014-02 |
| Takram Rendering path/Limitations | C2–C4 웹품질·빛합성 | EFX-014-03 |
| SpaceEngine layers/역사적근접실패 | J0–J4 거리LOD 인계 | EFX-014-04 |
| NASA cloud-only / Guerrilla PDF74 / Skybolt coverage hull / 사용자 사진3장 | D113 원경 얇은층·국소 양감·같은 위치 인계 | EFX-014-05 |

## 6. 효과 카드

### EFX-014-01 Epic 고도별 cloud의 빛·대기 관계

**선정 이유**: 우리orbit→하강에직접관계있는ground-to-space대상 [문헌].
**지각**: 두꺼운밝은core/어두운홈/지표shadow와고도별대기깊이가함께읽히는목표 [추론:번안].
**입력 모델**: 원본camera 이동; 우리 스크롤 위치+시간. web wheel UI는미확인.
**판별 근거**: 공식문서에고도별view/지표↔우주대상명시. 실제입력easing미측정 [문헌].
**구현 메커니즘**: volume raymarch+multiple scattering+sky occlusion, secondarymarch/BSM역할분리. 우리에서는renderer층별기여를분리검증.
**파라미터**: 원본정량sun/camera/asset수치미확인. 우리후보96view/1lightlookup [코드], 새품질값아님.
**타임라인**: 원본초·스크롤길이미확인. 우리J2→J6카메라연속제안.
**에셋**: volumetric density/material, atmospheric LUT; 개별원본파일해상도/용량미확인.
**성능 기법**: tracing/reconstruction모드와shadow범위를조절 [문헌]. 우리hardware검증미실행.
**접근성·폴백**: 우리reducedmotion 정지구도/포인터축소와staticfallback 계획. 외부demo지원미확인.
**근거**: 공식Epic문서 [문헌], 우리번안 [추론].
**재현 요구사항**: 상. samecamera/sun/receiver/깊이합성; UE엔진설치·이식은이번범위아님.
**수용 기준**: 같은구도direct/sky/shadowoff로기여분리, horizon glass감소/층깊이확인;품질최종사용자검토.
**ECG 번안**: 큰세계→같은서고의scalejourney. 실제환자위치나ECG성능을표현하지않음.
**재현 상태**: none — 외부엔진재현미실행. 기존custom시험은별도D075/TUNE.

### EFX-014-02 Nubis 큰조형과세부 sampling 분리

**선정 이유**: 둥근blob/평활면을줄이고다가갈수있는cloud가필요 [대화].
**지각**: 근접/내부에서도빈틈과양감이유지되는목표;원본전체space지원추정금지.
**입력 모델**: 원본camera이동/시간; 우리 스크롤 위치. 원본control미실행.
**판별 근거**: voxelmodeling/sampling/light/raymarch제작자발표 [문헌].
**구현 메커니즘**: 큰조형profile/detailtype를나누고누적밀도로빛을cache;SDF/거리step으로샘플배치.
**파라미터**: PDF85쪽모델링field512×512×64,144쪽ambientfield256×256×32 [문헌]. 이는우리권장메모리/해상도값아님.
**타임라인**: 원본render초/스크롤길이미확인. J4윗면→J5틈→J6진입번안.
**에셋**: Houdini Atlas voxel제작/편집자료. 우리CC0raw와새VDB/sculpt후보의조달은분리.
**성능 기법**: cache/SDF/adaptive sampling. 발표수치를browser성능으로복사하지않음.
**접근성·폴백**: 우리정지keyframefallback;원본web접근성미확인.
**근거**: PDF70/85/144/151/163 [문헌]. 조형을우리세계에적용하는것은 [추론].
**재현 요구사항**: 상. 같은envelope의billow/wispdetail/skyocclusion을생성하고renderer에연결.
**수용 기준**: 동일구도envelope만/미세층추가비교,가까이와역경로에서identity보존.
**ECG 번안**: 서고로들어가는가림구름,파형/데이터panel변형없음.
**재현 상태**: none — Nubis이식아님. D075구현은profile/detail분리가미완.

### EFX-014-03 Takram 웹cloud의층별기여와재구성

**선정 이유**: 우리Three.js환경의빛/대기buffer통합근거가필요.
**지각**: 낮은밀도thin과불투명thick사이깊이/투과차,움직여도섬세한edge가남는목표 [추론].
**입력 모델**: 시간/camera변화;우리 스크롤 위치/포인터. Storybooklive미실행.
**판별 근거**: officialREADMERenderingpath+knownissues [문헌].
**구현 메커니즘**: shadow→shadowresolve→cloud→cloudresolve→aerialperspective. space/global은예정으로명시되어이번전이전체해법으로확정하지않음.
**파라미터**: 최대4층/temporal1/16texel [문헌]. 우리framebudget와동등하다는뜻아님.
**타임라인**: 원본inputcurve미확인. J3–J6 camera에서T1기여/ghosting비교계획.
**에셋**: weather/shape/detail/turbulence/STBN. 원본asset사용·설치미실행.
**성능 기법**: BSM/TAAU; sparse/disocclusion/mean-depth아티팩트주의 [문헌].
**접근성·폴백**: 우리static씬기준으로정지/reducedmotion검증. 원본지원미확인.
**근거**: 공식README [문헌],우리integration방식 [추론].
**재현 요구사항**: 상. examplescomposer와비호환,bufferadapter/좌표/태양통합별도검증.
**수용 기준**: thin뒤지표보임/역경로새지표잔상없음/층별mean-depth가림오류확인.
**ECG 번안**: 도입부대기전이범위,ECGsharedclock/비교panel과독립.
**재현 상태**: none — 설치/실행/호환성proof없음.

### EFX-014-04 SpaceEngine의먼구면표현과근접volume인계

**선정 이유**: orbit의좋은화면과근접조형을구분하며같은cloud인계설계.
**지각**: 전체지구에서는광역패턴,가까워지면부피로읽히는목표 [추론].
**입력 모델**: 원본camera이동;우리 스크롤 위치. UI실행미확인.
**판별 근거**: 매뉴얼sphericallayers/2010개발기록 [문헌]. 최신모든경로구현을단정하지않음.
**구현 메커니즘**: 문서의구면height/diffuse/bump층. far→volume은2010제안과우리번안이며최신재현성공증거아님.
**파라미터**: 현재매뉴얼상최대10cloudlayers,Height/Velocity단위km/kmsec [문헌]. 우리층수추천아님.
**타임라인**: 원본미확인. 우리handoff p.28far5.31%/.29far0 [코드];연속시야기준LOD제안.
**에셋**: 구면map과근접volume는용도별준비. 기존NASAcoverage는3D날씨데이터아님.
**성능 기법**: far표현으로광역유지,근접군집만volume;새GPUcost미확인.
**접근성·폴백**: 우리fallback같은coverage/keyframe,원본지원미확인.
**근거**: 매뉴얼/역사blog [문헌];같은앵커LOD구성 [추론].
**재현 요구사항**: 중~상. far/local좌표/실루엣/opticaldepth continuity를연결.
**수용 기준**: 인계전후같은군집위치·크기·밝기유지,빈하늘pop없음.
**ECG 번안**: orbitaljourney→고정서고. 지구와인체사이scale인과보조.
**재현 상태**: none — source렌더미실행/기술원리참고.

## 7. 에셋 목록과 조달 경로

공식자료URL은§1. 외부게임asset/code를repo로복사하지않았다. PDF48,948,215bytes는로컬ignored연구폴더에서만확인;sha256/sourceURL은verification/a-cloud-reference-20261006/sources.json. 새구름source조달은registry/출처pin을먼저남긴다. 목업프롬프트는별도생성시기록.

## 8. 성능·접근성·폴백

이번모든외부사례실행비용/targetPC/600sec미검증. 저해상도blur로목표detail을없애기전fullres고정구도기준을확보한다. motion/GPU는독립검증. 원본성능표를프로젝트실측으로쓰지않는다.

## 9. 레시피 후보

권장: globalcoverage+anchoredheroenvelope+runtimebillow/wispdetail+direct/skydepth+정합goldrender. 전체Nubis/UE이식또는단일128³raw확대만으로해결하는안은근거부족. 구체순서는분석보고서§6.

## 10. 열린 질문

새목업의samecloud continuity,실제고품질goldscene,같은좌표far/local인계,skyocclusion/대기합성방식,목표GPU와motion검증. 이번reference조사는목업/asset/runtime채택이아니다.

### EFX-014-05 궤도 위성형 구름과 국소 입체의 같은 위치 인계
**선정 이유**: 사용자 궤도사진3장과 타원분포 부정 평가, 국소양감·같은방향shadow 요구.
**지각**: 넓게찢긴얇은층 사이 일부두꺼운군집만 명암·그림자로떠보이고 확대시같은군집옆면이보임.
**입력 모델**: 스크롤 위치 / 카메라 거리 / 시야각. 시간wind는초기OFF후별도.
**판별 근거**: 사용자정지이미지는움직임증거아님. D112camera/GLSL은코드확인. 아래hybrid는설계후보.
**구현 메커니즘**: NASAcloud-only형태seed→지리coverage/tau/topheight→구면thin/reliefproxy + 같은ECEFnearvolume. premultipliedradiance/transmittance 인계, separatephysicallayers는depth합성. 지면point→sunray→cloudshell교차로shadow.
**파라미터**: 기존p.18/.235/.300/.365/.387/.410비교구도. proxy2px미만/2–8px전환/8px이상volume는실측전설계값. 기존sun15°에서height8km의평면shadow거리약29.9km는검산이며구면에는ray교차필요.
**타임라인**: fixedC/tau/H; scroll로두께성장없음. 인계범위는실제projectedsize/거리/각도대조후결정, 미확정.
**에셋**: NASAcloud-only2048×1024및고해상도crop후보, 현재earth_clouds/local_weather파일우선확인. alpha/height/opticaldepth는서로다른자료. 원본사진luminance를density로직접사용하지않음.
**성능 기법**: mip/crop/filteredtau/원경2.5D, 국소volume. 4096×2048RGBA8+mips약42.7MiB는자료예산, wholeGPU비용아님. GPU개선실측없음.
**접근성·폴백**: 정지review부터. 제품reduced-motion연결미완. D080cloud-free/AI영상대안보존.
**근거**: [이미지][코드][문헌][추론]. NASA https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/77558l ; 제작 https://science.nasa.gov/blogs/earth-matters/2011/10/06/crafting-the-blue-marble/ ; Guerrilla2015공식PDF49/74쪽 https://d3d3g8mu99pzk9.cloudfront.net/AndrewSchneider/The-Real-time-Volumetric-Cloudscapes-of-Horizon-Zero-Dawn.pdf ; Epic공식 https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine ; Skybolt작성자코드 https://github.com/Prograda/Skybolt/blob/master/Assets/Core/Shaders/Clouds.h ; 개발자직접설명 https://discourse.threejs.org/t/how-to-cast-shadows-from-an-outer-sphere-to-an-inner-sphere/53732 . 단일동일기술을전부사용한다는주장아님.
**재현 요구사항**: 기존Three/WebGL2/AGX/Takram유지, farproxyshader+UVbake/opticalcalibration필요. 난이도중상; 새엔진이식없음.
**수용 기준**: 타원윤곽없음/thin-thick차이/같은sun명암과shadow/같은군집확대/역scrollnoise·잔상사용자review. 자동alpha수치만으로PASS안함.
**ECG 번안**: 지구→사람측정공간도입. 비교panel파형/단위/데이터계약미변경.
**재현 상태**: none — 연구·추천설계만, D112전volume시험과별도. D113/F079 상세 ECG_A_orbital_cloud_hybrid_research_2026-10-08.md.
