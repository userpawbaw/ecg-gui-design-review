# 구름 재질 연결 시험 계획 — D136

## 추천 먼저
Disney source는 보존하되 기존 위성 구름의 큰 실루엣/분포/기본 조명을 유지한 채 국소 미세굴곡 재료로 사용한다. 첫 저비용 시험은 동일 위성 footprint의 조명에 제한된 signed detail을 넣는 방식. 기존 독립RGBA군집 overlay는 대조 후보로 남긴다. 사용자 최신평가: “다른 구름과 질감이 너무 달라서 어색한 감이 있네. 자연스럽게 녹이는 아이디어가 필요하겠어.” D135 미채택/TUNE 유지.

## 실제 증거와 진단
D135 runtime/disney-on-p2350.png 재열람. 주변층은 길게 퍼지고 부드러운데 두 군집은 압축된 작은 알갱이/독립 실루엣과 회색 면으로 읽힘. 코드에서도 기존 위성층은 태양 방향의 height-field 명암을 계산하고 tone pass 이전에, Disney는 완성 AgX RGBA를 tone pass 이후 합성한다. 이중tone은 피했으나 서로 다른 셰이딩 응답이 남는다. 원인을 source 해상도 하나로 확정하지 않는다. 거리안개/blur만으로 맞추면 사용자 요구인 선명한 국소결을 잃을 가능성.

## 업계 자료 읽은 범위
[문헌] Epic Volumetric Cloud Material 본문: Cloud Layout의global pattern/global mask와높이profile을별도로두고,Cloud Shape의별도noise1/2/3로기본형태파쇄·왜곡·추가detail을제어한다. Cloud albedo/occlusion/density와multiscatter도분리. 이 원칙을우리의기존footprint+국소detail공통조명설계에번안한다. Epic의구현이Disney RGBA와위성height-field를직접혼합한다는주장은아니다.
https://dev.epicgames.com/documentation/unreal-engine/volumetric-cloud-material-in-unreal-engine?lang=en-US
Guerrilla Nubis2017은검색초록범위만확인: regional authoring와atmosphere integration/transition이제작화의별도문제.2015발표PDF원문접근timeout으로본문전체읽음주장금지.
https://www.guerrilla-games.com/read/nubis-authoring-real-time-volumetric-cloudscapes-with-the-decima-engine

## 세 후보와 차례
| 후보 | 구체적인 변경 | 장점 | 한계 / 다음으로 넘어갈 조건 |
|---|---|---|---|
| A 공통 형태·조명에 detail 추가, 추천 | 같은 지리UV/세계좌표와위성coverage를마스크로사용. 두꺼운부분내부에만Disney고주파재료추가. 기존큰흰면/골/태양방향을유지하고원경mip로detail억제 | 독립군집의스티커감과색차이를동시에줄일수있는저비용시험 | baked luminance고주파는실제density/normal이아님. 실제pixel노이즈/압축결이포함될수있고광원변경에정확한재조명불가 |
| B 중간 결·경계 연결 | 바깥은기존softsheet,중간은저대비·중간크기굴곡,안쪽만선명. sharedcoverage와signeddistance/저주파envelope로경계falloff. 일정물리폭에서여러pixel에걸쳐연결 | 선명한중심을유지하면서재질이바뀌는띠를줄임 | 동일silhouette/위치가정합되지않으면fade만으로다른구름이비쳐이중상이남음 |
| C 공통 density로 근경까지 확장 | Disney density를같은weather/coverage로잘라높이/밀도/광원공유. 동일region의volume과farproxy를연결 | 실제깊이와광원대응을맞출가능성높음 | source좌표/공통topology/volumebudget재검증필요. A/B보다작업·성능비용큼;이번미실행 |

## 첫 구현 시험의 세부
1. D135와같은 .18/.21/.235 구도를동결,기존층기준과독립atlas대조보존.
2. alpha안쪽Disney밝기에서저주파를분리해signedresidual추출. 투명배경/실루엣경계는잔차에서제외해윤곽edge를detail로오인하지않음. 이값은조명용연출detail이며물리density/normal아님.
3. 기존두꺼운위성coverage내부의같은세계좌표에만detail혼합. 마스크값이coverage밖에서0. 조명기본색과태양방향은기존shader의응답사용. 잔차의기존bakedlight기여가강하면공통height/normal기반C로진단전환.
4. A와B를순서대로대조. 전역선명도증량제외;core 세기낮음/중간 후보만. 초기5~15%는시험가설범위이며확정값아님.
5. 원경은표시pixelfootprint의mip/저주파표현. 확대때최소수pixel에서읽히는detail대역만증가. threshold단계생성없이연속가중치.
6. 동일mask 안에서약한가림만먼저검토; 지면그림자보류는재개안함.

## 통과 기준
- ON/OFF에서두군집의새독립실루엣이나별개덩어리가눈에띄지않고기존구름의일부가더자세해진것처럼보임.
- 선명한core의흰부분/골대비는유지. 중간·가장자리의detail스케일/명도변화가갑자기끊기지않음.
- 기존지도/위성구름footprint·카메라·DEM1.5를유지;새지도나구름개체의pop없음.
- 정역scroll에서화면에 고정되는grain/모아레/자글거림/ghost검토. 같은world위치/일관된mip,서로다른footprintcrossfade로봉합하지않음.
- GPU같은1280×720/고정옵션에서대조.실측전정확한성능비용약속금지.12MiBatlas예산과전체VRAM은구별.
- 사용자미감판정별도. 바닥alpha/고도압축실패를지우지않고D135/F100/O026연결.

## 실행 / 승인 상태
이번은 사용자 feedback 분석과후속시험계획. A/B/C는미실행, 효과미검증. 기존구도에서의낯선질감판정은TUNE;다음A저비용시험부터. source출처/내부시안범위,서고KEEP/그림자보류/실패2/2및주intro미채택유지.
