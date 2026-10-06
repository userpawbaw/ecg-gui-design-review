# Moto 지구 에셋·빛 표현과 북반구 확대 경로 검토

2026-10-07 · D-087 / F-055 / REF-001 · 현재 소스+실제 Edge 확인

## 결론과 사용자 피드백

사용자는 moto-card 극지 질감/어두운대륙의도시불빛을참조하고북반구확대를검토요청. 남반구를칠레/아프리카/호주만제작하려는비용절감의도로선택했는지질문. **기존 기록에는 그런지역제작최적화 근거가없다.** 지구남극을보이는시안과REMA선정이있지만확대목표와회전정합이부족했다(D086). 의도를사후에만들지않는다.

권장: **Moto의 극지/밤면/역광 조합을 지구 전체 외관에 참고하고, 북반구의육지로확대하는경로를우선시험.** 원형지구의polaraccent와실제확대목적지는분리한다. 북극권을보여준다고반드시극점으로내려가지않는다. 최종북유럽지역/구도·경로는실제대표프레임검토전확정하지않음.

## Moto 실제 확인: 고밀도 완성 지형 모델이 핵심이 아님

[현재 사이트](https://www.moto-card.com/)의활성EarthScene과실제window.__earth 조회. 과거 REF001과대조. HTML안에 주석처리된Earth OLD7도있으므로활성module만근거로사용. sourcehash/원본URL/스크린샷은 verification/moto-earth-audit-20261007/audit.json. 원본HTML은 assets/source/ gitignore 보존.

- geometry: SphereGeometry(1,64,64). **displacement geometry/고도tile이 아닌 bump 기반 normal**. 북극의흰영역전체가실제입체빙하메시라는근거없음.
- day/night/bump **모두4096×2048**; 로드된image크기로확인. assets의세URL은audit.json. original DCC file/GLB/질감제작방법·원본지리데이터출처는미확인.
- 낮색상, night색상, packed bump를사용. shader b채널구름mask/g재질/r표면요철, bumpMap(max(height,cloud))로 normal을변화. whitecloud/color혼합과roughness .25–.35.
- 야간: 표면normal·sun 방향dot의smoothstep(-.25,.5)로 **night*.95와낮PBR출력을최종혼합**. 밤에만도시불빛이읽히고낮으로갈수록사라짐.
- inverse Fresnel/rim, day/twilight색, back-side대기구로극지윗테두리빛을강조. SUN(.26,1.39,-3)강도6,ACES노출1.16,anisotropy8. 북극흰부분과어두운면contrast가구도에서유효.
- 원작효과는지구를**축소**하며다음카드로넘어간다. 해당외관의성공이우리궤도/지표근접확대성공을보증하지않는다. same4K도근접지역자료필요.

실제두캡처에서흰극지/상단rim/밤대륙불빛직접확인. 두번째는시간/회전·스크롤이모두진행된장면이므로pixel차이를특정효과의실측으로쓰지않음. source/브라우저형상확인은목표 GPU 성능아님. 초기agent-browser소켓권한오류는승인된실행환경으로해결했고검사전용session종료.

## 우리 구현과 핵심 차이

| 항목 | Moto | 현재 A | 개선할 것 |
|---|---|---|---|
| daymap | 4K | 4K | 전체색상만교체해확대문제가해결되지는않음 |
| nightmap | 4K / 강도.95 최종색혼합 | 2K / emissive*.12·별도nightmask | city자산/해상도와day-night부드러운혼합,노출상호작용비교. 수치8배밝기라는단정금지 |
| 지형 | 64×64/bump | globe384×192,남극REMA고정patch | 메시는이미더많음. 지표자료·regionaltile과근접정합우선 |
| 빛 | 밤면이큰고정역광,상단rim | orbit/강한낮태양/별도산란 | outerglobe는밤불빛과극지rim을살리고orbit은surface광학과이어짐 |
| camera | rotation+shrink/card | rotation+zoom/구름하강 | 육지를기준으로target/camera/planet회전을함께계산 |

Moto공개텍스처/효과를내부시안후보로사용가능(D084). 다음sample에서원본조합과우리조합을같은camera로비교. 원작의구름mask를우리VDB와중복밝게합성하지않고,근접은승인된VDB조형을유지. 출처를제작자공개파일과우리가가공한파일로구별.

## 반구·지역 비교 [설계 추론]

| 경로 | 얻는 화면 | 리스크/작업 |
|---|---|---|
| 북반구 북유럽육지 — 우선 | 극지흰accent,유럽/북미야간불빛,육지+해안·산지에서구름하강 | 북극해·북대서양으로빠지지않도록목적지육지고정. 북극권이면ArcticDEM,남쪽이면해당지역DEM/imagery |
| 남반구 칠레/남미 — 대안 | 남극흰accent+안데스/해안대비 | 바다와남극사이에서targetdrift,칠레의좁은육지footprint조건. 장면이주로바다면저비용이어도이야기정보감소 |
| 남반구 남아프리카/호주 — 대안 | 큰육지목적지/형태차이 | 남극과한구도에서공존여부/야간밝기밀도. 자료몇곳만만든다고자동품질이득아님 |

북반구가항상제작비가작거나바다가없다는뜻은아니다. **land anchor**를고정하는게핵심. 고정경로/확대지역만상세화하는비용최적화는어느반구에도가능하다. 북극점의해빙표현과그린란드육상빙상은다른자료이며[ArcticDEM](https://www.pgc.umn.edu/data/arcticdem/)은해빙질감전체를제공하는것이아님.

## 다음 프레임/작업 packet

1. 외관 같은조건비교: 기존NASA day/night vs Moto의공개day/night/packedmap. 밤면city/rim/ice/bloomoff와역광별대표프레임. 자산URL·hash·조건고정후별도spike,현재webdefault즉시교체안함.
2. 북유럽육지경로1안과남미육지경로1안. 첫지구/회전중간/높은궤도/낮은궤도/구름입구 **5구도씩** camera/target/광원동일비교. globe/회전은geoanchor에종속,최종육지의screenfootprint가반구간변하지않도록검증. 얼음accent가카메라추적anchor를대신하지않음.
3. 우선북반구의선정지역crop/고도·normal/roughness를D086거리인계로연결. 허용screen오차/텍셀을기준으로LOD전환,역스크롤/idle시간회전에서도목적지drift방지. 남극REMA는기존반구대안자료로보존.
4. 승인구름형태+광학보정/가까운군집/먼coverage+서고인계까지묶은완성후보검토. 사용자제작피드백1/2 유지. 이번은reference/route검토이지2차제작실패아님.

현재: source/live검토와북반구우선추천완료,원작텍스처실제다운로드/재사용renderer/경로교체/지역DEM제작은미실행. 서고KEEP·구름형태KEEP·A-P3/Story/BC독립.
