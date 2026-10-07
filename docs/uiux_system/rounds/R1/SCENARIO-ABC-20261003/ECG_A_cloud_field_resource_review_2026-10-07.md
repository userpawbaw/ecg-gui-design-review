# A 구름 군집·거리별 표현·리소스 검토

2026-10-07 · D101 / CASE007 · RESEARCH, 추천값 잠정·새 구현 없음

## 요청과 사진 해석
사용자가 두 항공사진을 제공하며 레퍼런스만큼 구름을 분포시키는 수량·리소스·성능 제한을 질문했다. 사진의 구도/분포를 분석한 것이며 촬영 고도·렌즈·실제 구름 개수·바람 속도를 측정한 자료는 아니다. 지금 cloud06 단독 후보는 TUNE이며 이 요청을 전체 채택으로 처리하지 않는다.

첫 사진: 넓은 지표가 군집 사이로 드러남, 작고 큰 구름의 크기 분포, 지표의 분리된 그림자, 멀어질수록 작고 푸르게 흐려지는 구름. 두 번째: 전경 아래에서 잘리는 큰 덩어리, 중경의 연결된 띠, 원경의 작고 흐릿한 군집, 밝은 윗면과 어두운 하부. 배치·거리·그림자가 중요하며 큰 cloud06 하나를 그대로 100번 겹치는 방식은 부적합.

## 제안 구성 — 실제 수량·고도 측정값이 아닌 art 시작값

| 층 | 화면 안 군집 시작값 | 표현 | 조정 기준 |
|---|---:|---|---|
| 근경/통과 | 3–6 | 실제 VDB, 동시에 고품질 2–4군집 | 120px 이상 또는 경로에 접촉; 실제 내부·옆면·그림자 |
| 중경 | 12–24 | 낮은 해상도 VDB/깊이 있는 impostor | 30–120px, camera 회전·시차 필요량으로 선택 |
| 원경 | 40–80 | 작은 impostor/coverage field | 30px 미만, 거리 안개·그림자 footprint |

합계 약55–110군집. 군집 내부 여러 봉우리는 개별 객체로 세지 않는다. 목표 화면 coverage(지표가 보이는 화면 부분 기준) 첫 사진35–50%, 둘째50–65%에서 시작한다. 사진 정밀 segmentation 결과가 아닌 육안 설계 범위이며 화면에 실제 배치 후 튜닝한다. horizon 전경 sky와 지표 부분을 혼동하지 않는다.

현재 source bank 전체 extent 약19.6×28.7km / 높이9.7km는 단독 통과 시험 규모다. 이 크기를 반복하면 구름벽이 된다. 일부를 균일축소하거나 여러 실제 VDB source를 서로 다른 크기로 배치하고 통과군집만 크게 둔다. terrain 높이1.5×를 고려해 하단을 산 위로 배치한다. 고도/레이어 두께는 geometry 비관통과 화면 silhouette를 함께 보고 결정하며 사진에서 실제 km를 단정하지 않는다.

“떠다님”은 사진과 같은 광역 분포와 시간 이동을 구분한다. 첫 packet은 camera 시차+whole-bank 느린 translation(화면상 약0.5–2px/s의 후보)으로 충분히 시험 가능. fluid simulation이나 밀도 자체의 매프레임 재생성이 필요하지 않다. 정지사진에서 실제 바람 속도/움직임을 입증할 수 없다.

## 업계 원자료

1. Epic 공식 Volumetric Cloud Component: https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine . 3D texture raymarch와 근사 산란, 낮은 trace resolution 재구성, conservative density empty-space skip, Beer shadow maps와 비싼 secondary light tracing을 구분. 비싼 cinematic 설정은 게임용 설정과 분리. UE5.8 설명은 현재 WebGL 코드에 복사 적용하는 기능이 아니라 설계 근거.
2. Guerrilla 제작자 Nubis, Evolved: https://www.guerrilla-games.com/read/nubis-evolved . 기존 skybox를 넘어 내부에서 접근·통과하는 clouds 개발 사례. 과거 HZD의 PS4 under2ms 설명은 그 엔진/플랫폼 사례이며 현재 브라우저 수치가 아니다.
3. Guerrilla 제작자 HZD cloudscapes: https://www.guerrilla-games.com/read/the-real-time-volumetric-cloudscapes-of-horizon-zero-dawn . 다양한 구름형태·lighting·광역 skies의 실시간 접근 근거. 발표의2ms 목표를 우리 성능 보장으로 인용하지 않는다.

## 메모리 계산 — 현재 코드/파일에서 확인

현재 R16F density128×64×192 =3MiB, sun cache64×32×96 =.375MiB. 한 source **3.375MiB GPU scalar + 약3.375MiB CPU 배열**, 다운로드3,538,944bytes(HTTP압축 제외). 현재 volume 화면 target .6×각 축, steps96far/160near. optical cache는고정sun이며rawVDB 전체를runtime에서읽지않는다.

| 구성 | scalar GPU 메모리 | 의미 |
|---|---:|---|
| source1개,100번 공유 배치 | 3.375MiB | texture 공유 시만; frame cost100배가 안 된다는 뜻 아님 |
| source3개,55–110군집 공유 | 10.125MiB | source수로 texture 비용 결정 |
| 위3개를 XYZ모두2배해상도 | 81MiB | 각 texture voxel8배, CPU배열도별도 |

군집 transform/bounds100개는 몇KiB 수준이지만 cache·driver·구조별 overhead는 별도. 메모리 mip/압축/반복구조를 명시하지 않고 개수×source bytes로 계산하면 잘못된다.

권장 hybrid 예산 계산: scalar10.125 + far2048²RGBA8 atlas(mip포함)21.33 + coverage512²RGBA8(무mip)1 + occupancy64³R8 .25 + shadow1024²R16F2 +1080물리frame .6 targets 약11.39 =**약46.1MiB GPU**. 추가 atlas/temporal/history/cache/driver 여유를 포함해 **45–80MiB를 잠정 cloud 예산**으로 둔다. 실제allocation 실측이 아니며 기존 terrain·archive·post memory는 미포함. CPU decoded/source arrays도 별도; 전체RAM/VRAM이 이 값으로 끝나지 않는다. 높은 scalar해상도3개(81MiB)까지 쓰면 같은 atlas/targets 포함 약117MiB부터 시작하며120–180MiB 후보예산이 된다. WebP download size와 GPU RGBA memory는 다른 값.

## GPU 비용이 커지는 조건

구름군집 수만으로 FPS를 예측할 수 없다. 실제 비용은 물리pixel수 × 구름/box가 덮는 비율 × 평균 ray step × sample당 texture/조명 연산 × 겹침, 별도로 depth/합성/그림자 비용으로 본다. occupancy가없으면 density0도texture조회는실행된다. 현재코드는 density가비어있을때lighting은skip하지만 **공간을큰step으로건너뛰는 occupancy skip은없다**. 현재 각 pixel box구간을96/160번 나누기때문에 box를수백km로확대하면 sampling간격이길어져작은구름을놓친다. step만늘리면비용이증가한다.

현재는 cloud pass마다 scene을동일camera로한번더그려depth를얻는다. cloud100개마다 current createCloudLive를만들면 fullscene redraw100회·RT100세트·pass100개가되어불리하다. **volume개수 증가 전에 scene depth1회+공통group compositor로 바꾸어야 한다.** 공간 bin별candidate/occupancy와ray segment정렬, overlappingdensity 합성, raytransmittance 조기종료가필요. VDB texture를GPUinstancing한다고현재fullscreenraymarch의pixel비용이자동해결되는것은아니다.

1080 물리 framebuffer 기준(no DPR multiplier):

| target/steps | 전체box step 상한 | 현재 대비 |
|---|---:|---:|
| .6축/160 |119.44M|1.00|
| .5축/96 |49.77M|.417|
| .35축/64 |16.26M|.136|

모든pixel이box와교차하고earlyout없다는산술상한이며GPU실측/texturebandwidth가아니다. density+light최대2조회이지만빈sample은light를안읽는다. 낮은설정만으로reference질감보장없음; 재구성/경계/역스크롤안정성을검증해야한다. 3840×2160은1080물리frame의pixel4배. 1920×1080 CSS에DPR1.5는물리pixel2.25배. 같은품질의 GPU ms도정확히같은비율이라고단정하지않는다.

## 성능 제한폭 — 목표와 실측 구분

RX/RTX등GPU모델·브라우저·viewport·지형LOD·열상태·화면coverage가없이는 “FPS몇%감소”를확정할수없다. 현재RTX3070브라우저실행확인만있고GPUtimer/지속replay측정없음. 추천제작gate: 1080물리frame에서cloud/depth/composite/그림자추가비용median2–4ms, p95≤6ms를**도전목표**로시험한다. 달성예측이아니다. 60fps전체frame budget16.67ms 안에terrain/archive/AA도들어가야한다.

계산예시(실측아님): baseline10ms에4ms추가→100fps에서71fps, baseline16.67ms에4ms추가→60fps에서48fps. cloud4ms가고정이라도기존frame에따라제한폭이다르다. nearcloud에서광선이일찍불투명해지면빈원경층보다cheap할수도있으며“가까우면항상더느리다”도아니다.

## 권장 구현/검증 packet — 검토 제안, 이번 turn 미구현

1. reference1느낌의 넓은coverage40%/source3/near4・mid16・far60(약80군집)을 **초기 art 구성**으로 시험. 군집size/height/띠/간격을variation, 반복패턴검사. 가까운cloud만actualVDB/source원형KEEP.
2. one shared depth+cloud compositor와spatialoccupancy부터설계. near160step/.6target 유지, mid낮은res, faractualVDB에서같은sun으로만든cloud-onlyimpostor. 전체terrainRGB plate복귀금지. 거리별representation의opticalmass/silhouette/worldposition을맞추고전환수십frame검사.
3. transformtranslation/uniformscale sharing가능. **회전하면고정sun의localdirection이바뀌므로cache그대로회전하면빛이틀림.** sun방향별cache bake/몇방향quantize하거나rotation을제한한다. uniformscale이면worldpathlength에맞게cacheopticaldepth도scale. 비균일scale은별도광학검증필요. 풍속translation은shadow도같이이동. 밀도변형·태양시간변화는cache유효성문제.
4. 같은camera·sameprogress·settleddetailReveal1에서cloudOFF/near4/mid추가/far추가4구성. density+lighting/depth/composite/shadow 각GPU시간을EXT_disjoint_timer_query_webgl2 지원시비동기로측정; disjoint값버리고없으면CPUtime을GPUtime이라고부르지않음.
5. 1080물리/더높은물리해상도·전후scroll·내부·역진입·정지·reducedmotion 확인. 평균/median/p95·drawcalls/RT/CPUdecoded/GPU추정bytes·pass단계별기여기록. 튜닝순서 far가벼움→중첩/빈공간skip→shareddepth→target/resampling→steps, 가까운조형품질을먼저깎지않음.

## 판단
reference같은광역분포는가능한설계방향. **55–110군집을모두최고품질volume으로그릴필요는없다.** 약80군집hybrid/45–80MiB cloud GPU잠정예산부터가현실적인시작안. 실제GPU ms/품질은위packet으로측정해야하며이번에는새군집생성/renderer변경/성능benchmark를수행하지않았다. 단독candidate사용자KEEP나fullcloudfeedback횟수변경없음. A-P3/Story/BC·D080대안비교는별도.
