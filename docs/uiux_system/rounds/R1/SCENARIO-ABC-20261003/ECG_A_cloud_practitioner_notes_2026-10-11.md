# 구름 제작자 구현 노트 재탐색 · D129

2026-10-11 · RESEARCH · F094/D129 · 실시간 구현/새 렌더 미실행. D128 원본 샘플 TUNE를 유지한다.

## 권장안을 먼저

**위성 지도는 넓은 날씨 분포를 맡기고, 확대 대상 몇 군집은 큰 형태·작은 돌기와 골·섬유 결을 나눠 제작한다.** 별도 고해상도 VDB를 구하거나 기존 VDB의 밀도에 세부 침식/변형을 추가하는 두 방식부터 대조한다. 하강은 같은 밀도 원본을 사용하고 거리별 세부 수준을 바꾼다. 단순 높이표면의 normal을 더 키우는 것을 사진 같은 텍스처 확보로 취급하지 않는다.

이는 아래 자료를 현행 Three/WebGL2에 번안한 **후속 시험 권장**이다. 외부 엔진의 품질·속도를 재현했거나 사용자가 채택했다는 뜻이 아니다.

## 1. 이번 조사와 이전 조사 구분

- 기존: Horizon 2015의 base/detail erosion, Nubis³ 모델링/누적 밀도/빛 cache/SDF, Disney VDB, Arnold Cloud, Epic cloud, Takram 광학 합성. D083 이후 기록을 찾아 중복 확인했다.
- 새로 구체화: Nubis³ PDF **92–119쪽**의 billow/wisp 혼합과 거리 mip, 제작자의 공개 팩 설명, SideFX 최신 Billowy/Wispy 세부 제어, 2013 공식 포럼 직원의 카메라별 해상도 배분 답변, Frostbite 구현 학위논문 §4.5.2/§5.5.2/§6.1.
- 학위논문은 Frostbite 팀 안에서 수행한 구현 연구이며 정식 제품 전체의 배포 사양으로 일반화하지 않는다. SideFX 튜토리얼 저자는 Cristhian Diaz, 페이지 표기는 3D Artist Intern; 공식 호스팅 튜토리얼과 제품 매뉴얼의 증거 수준을 구별한다.
- Arnold 포럼 본문은 bot 확인으로 읽지 못했다. 답변을 읽은 것으로 기록하지 않는다. EA 2016 PDF는 web 도구 용량 제한으로 본문 미확인. 제작자/학회 목록까지만 확인하여 아래 결론의 근거에서 제외했다.

## 2. 실제로 읽은 자료와 가져올 디테일

### A. Nubis³ — 작은 결을 저장만 하지 않고 렌더 때 만든다

[제작자 발표 목록](https://www.schneidervfx.com/) · [SIGGRAPH 2023 PDF](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20%28Advances%202023%29.pdf) · [공개 팩에 관한 제작자 설명](https://www.linkedin.com/feed/update/urn:li:activity:7094817215366971392/)

보유 공식 PDF 208쪽에서 82/85/92–119/144/151/163/174/205쪽을 텍스트로 재독했다. 이번에는 이미지 비교를 새로 수행하지 않았다.

- 82/85: 큰 형태 profile, detail type, density scale을 분리한다.
- 92–108: 층진 wisps와 billows를 밀도/타입에 따라 혼합한다. 94쪽은 저·고주파 Curly-Alligator/Alligator noise 채널을 설명한다. Worley만이 유일한 답은 아니다.
- 96: 거리로 noise mip를 정한다. 118: 합성 noise로 profile을 침식하고 density scale 적용; 가까운 밀도 조정으로 undersampling도 완화한다.
- 151/163: 빛 방향 누적 밀도 cache와 SDF/adaptive step으로 비용을 줄인다. 174의 근거리 저해상도 패스는 별도 절충이며, 가까우면 모든 품질을 무조건 올린다는 규칙이 아니다.
- 공개 팩은 NVDF/TGA/VDB/노이즈 생성 자료다. 제작자는 **저해상도 입력을 런타임에서 세밀하게 만드는 예제**라고 명시한다. 이번에 팩 다운로드/이식은 하지 않았다.

**우리 번안:** 위성 footprint를 큰 경계로 고정하고 확대 군집만 조형 profile과 작은 밀도 결을 확보한다. 발표의 비용·압축 포맷은 Decima 사례이며 WebGL 성능 예산으로 복사하지 않는다.

### B. SideFX Billowy — 둥근 덩어리에 작은 돌기·틈을 만드는 단계

[Cloud Billowy Noise 공식 노드](https://www.sidefx.com/docs/houdini/nodes/sop/cloudbillowynoise.html) · [Cloud modeling 학습 챕터](https://www.sidefx.com/docs/houdini/model/cloud.html)

Billowy는 큰 적운형 조형, Wispy는 가는 결을 맡는다. Billowy의 Worley Blend/Element Size Scale/Erosion은 각각 혼합·결 크기·가장자리 침식 제어다. 마스크로 일부만 변형할 수 있고 반복마다 amplitude/element size를 줄이는 제어가 있다. 너무 큰 amplitude는 비현실적인 모양을 만들 수 있다. 학습 챕터는 Shape Replicate→Billowy→Wispy→Clip으로 작은 형태와 평평한 하부를 단계적으로 만든다.

**우리 번안:** 새 구름을 균일 산포하지 말고 기존 두꺼운 군집 내부에 크기가 다른 돌기/골을 넣는다. RGB sharpening 대신 density/형태를 바꾸는 시험이다. Houdini 노드 값을 Cycles나 GLSL에 그대로 대입하지 않는다.

### C. SideFX Wispy — 끝부분의 솜털을 따로 만든다

[Cloud Wispy Noise 공식 노드](https://www.sidefx.com/docs/houdini/nodes/sop/cloudwispynoise.html)

Billowy 뒤에 연결하고 surface SDF/밀도/마스크로 효과 범위를 제한할 수 있다. wind를 표면 거리별로 달리해 외곽을 더 끌어낼 수 있다. 큰 substeps는 미세 결을 매끈하게 하고, 너무 강한 wind는 결을 망가뜨린다. octaves도 출력 해상도 한계 이후에는 결을 더 만들지 못한다.

**우리 번안:** 속의 두꺼운 덩어리를 유지하며 가장자리와 낮은 밀도 부분에만 찢긴 섬유 결을 추가한다. 전 구름에 같은 고주파를 넣어 자글거리는 형태는 배제한다. denoise가 결을 지웠다는 가설은 아직 미확정이며 OFF/ON 대조가 필요하다.

### D. SideFX 제작 튜토리얼 — 두 번째 층은 듬성듬성 높게

[Procedurally Generate Large Cloudscapes · Cristhian Diaz · 2023-12-08](https://www.sidefx.com/tutorials/procedurally-generate-large-cloudscapes/)

작은 영역의 조형을 먼저 만든 후 확장한다. 기본 cloud field와 별개로 coverage를 줄인 두 번째 field를 두고 thickness/vertical extrusion을 키워 높은 일부 구름을 만든 다음 VDB Combine으로 합친다. 태양과 하늘광 균형을 별도로 다루고 volume sampling/산란 깊이 비용을 강조한다.

**우리 번안:** 사용자 제안인 '추가 층'은 가능성 있는 방향이다. 같은 평평한 흰 층을 중복하는 대신 기존 확대 경로에 소수의 높은 군집만 둔다. 튜토리얼의 Coverage 0.4, 1024 samples, volume limit 40–60은 해당 Houdini 장면의 예시이며 현행 값으로 채택하지 않는다.

### E. 공식 포럼 — 카메라에 필요한 부분만 해상도를 배분

[cleaning up a cloud scape render · SideFX 포럼 · 2013-08-22 직원 old_school 답변](https://www.sidefx.com/forum/topic/29345/)

질문은 확대했을 때 픽셀 같은 경계와 흐린 cloud였다. 직원 답변은 높은 원본 해상도를 보존하고 카메라 frustum에 맞춰 hero/foreground/midground/background/상층 wispy 볼륨으로 나눠 해상도를 배분하는 방식이다. Gaussian 필터는 aliasing을 줄이지만 detail을 잃고, 낮은 원본 해상도를 더 촘촘히 샘플링한다고 원래 없던 결이 생기는 것은 아니라고 설명한다.

**우리 번안:** 스크롤 시점마다 새 구름을 만드는 대신 같은 공간의 표현을 바꾼다. 확대 대상은 높은 품질, 배경은 필터된 낮은 품질. 2013 Mantra의 필터 수치와 메모리 사용 권고는 현행 WebGL 설정으로 옮기지 않는다. 이번 읽기는 검색 서비스가 반환한 직원 답변 본문이며 직접 open은 cache miss였다.

### F. Frostbite 구현 연구 — 경계 결·빛·시간 재구성의 분업

[Rurik Högfeldt, Convincing Cloud Rendering · 2016 · 원문 PDF](https://odr.chalmers.se/bitstreams/c8634b02-1b52-40c7-a75c-d8c7a9594c2c/download)

Frostbite 감독자 Hillaire/Einarsson 및 팀에서 수행한 학위 구현. §4.5.2는 shape와 detail texture를 구별하고 낮은 밀도 외곽에 더 강한 침식을 적용한다. §5.5.2는 각 view sample에서 태양 방향으로 추가 샘플을 뻗어 자기/다른 구름의 가림을 계산한다. §6.1은 jitter만 넣는 것이 아니라 이전 카메라로 재투영한 이력을 혼합하고 화면 밖 새 픽셀에는 현재 프레임과 추가 샘플을 사용한다.

**우리 번안:** 필요한 빛/그늘의 결은 같은 density를 광원 방향에서도 읽어 만들어야 한다. 정역 스크롤에서 새 노출 영역과 history가 어긋나는지 별도 확인한다. 이 논문의 4 light steps/5% blend/반해상도는 비교 가능한 예시, Takram이나 우리의 새 기본값은 아니다.

### G. Arnold/Epic — 디테일과 하얀 양감의 원인을 구별

[Arnold Volumes 공식 매뉴얼](https://help.autodesk.com/cloudhelp/ENU/AR-Core/files/ac-shapes/arnold_user_guide_ac_shapes_ac_volumes_html.html): step이 최소 feature보다 크면 aliasing/banding이 생긴다. light volume samples와 AA도 noise에 관여한다. volume_direct/indirect/opacity를 분리해 원인을 점검할 수 있다. VDB mip는 문서상 CPU 한정이다.

[Epic Volumetric Clouds · UE4.27 명시](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-clouds?application_version=4.27): 다중 산란 근사는 두껍고도 밝은 구름에 중요하다. secondary raymarch shadow와 Beer shadow map은 정확도/비용 역할이 다르다. 하늘 AO와 산란 기여를 구별한다.

**우리 번안:** 형태 결이 없는 문제와 밝은 면이 회색인 문제를 분리한다. 세부 density 없이 산란만 조절하면 부드러운 면의 밝기만 변한다. 반대로 단일 산란을 과장해 골을 검게 만들면 연기/돌처럼 보일 수 있다. 지면 그림자 추가 튜닝은 사용자 보류를 유지한다.

## 3. 현행 구현과의 차이 [코드 확인 / 해석]

`prototype/spikes/a-climb/cloud-orbital.ts`는 위성 밝기를 7–9.4km 높이로 변환한 2.5D 표면이며 실제 3D density가 아니다. filteredDensity는 kilometre texel과 명시 mip를 읽는다. D127 lightingHeight도 같은 지도 fine/broad 차이이므로 새로운 외곽 섬유·구멍·여러 깊이에 걸친 밀도를 만들지 않는다.

D128 2K PNG는 원본 VDB를 렌더한 고정 view/light beauty다. 2K 이미지 해상도와 VDB 내부 결 해상도는 다르다. 원본의 큰 lobe만 보이면 PNG를 4K로 바꾸는 것만으로 해결되지 않을 수 있다. 부족의 정확한 비중(원본/step/denoise/조명)은 아직 대조하지 않았다.

## 4. 에셋 확보·번안·새 제작의 선택

| 경로 | 장점 | 이번 확인 상태 / 먼저 할 시험 |
|---|---|---|
| JangaFX 보유 VDB 번안 | 조달/변환 경로 이미 있음 | 원본 유지, density의 중간 결과 외곽 섬유를 마스크로 추가한 대조 |
| Disney 고해상도 VDB | 공식 source·여러 해상도·기준 render/scene | 기존 조사 재확인; 새 다운로드/렌더 없음. 일부 낮은 LOD부터 품질·메모리 확인 |
| Nubis 공개 NVDF/noise | 저해상도 큰 형태+실시간 세부 생성의 참고 입력 | 제작자 제공 형식 확인; 팩 링크 해석 실패, 미확보. 완성 고품질 에셋으로 분류 금지 |
| Houdini 신규 조형 | Billowy/Wispy/국소 높은 군집 제어에 적합 | Houdini 실행 미검증. 기존 VDB 번안 실패시 툴 확보·소형 조형 비교 |
| 사진/beauty atlas | 높은 원경 디테일을 낮은 비용으로 표현 가능 | 고정 조명/시점과 가까운 측면·통과 한계. 단독 전구간 채택 미권장 |

[Disney 공식 데이터](https://www.disneyanimation.com/resources/clouds/)와 [공식 README](https://media.disneyanimation.com/uploads/production/data_set_asset/1/asset/Cloud_Readme.pdf): 3GB ZIP, full/half/quarter/eighth/sixteenth density VDB 및 Hyperion/Mitsuba 기준 결과. 기존에 찾았던 후보를 신규 발견으로 표기하지 않는다. 내부시안 접근 가능 자료 활용 기준 유지, 실제 출품 전환시 재검토.

## 5. 다음 시험 순서와 통과 기준 [우리 제안 / 미실행]

1. **흐릿함 원인 분리**: 동일 VDB/태양/카메라의 100% crop에서 denoise OFF/ON, 작은 step/기존 step을 비교. sampling 변경은 결 보존/계단/비용을 함께 기록한다. 보이는 해상도 이상 octaves 증량 금지.
2. **실제 결 대조**: 최대 3후보 — 기존 density, 중간 크기 billowy 침식, 외곽 wispy를 더한 density. 큰 envelope/빈틈/질량을 고정한다. 표면에 검은 골 색을 그린 것과 구별.
3. **빛 분리**: direct/sky 또는 indirect/opacity 기여를 가능한 출력으로 분리. 밝은 lobe·부드러운 어두운 골·얇은 외곽을 함께 보여야 통과. 하얀 면이 날아가거나 내부가 검은 연기처럼 되면 TUNE/REJECT.
4. **국소 패치**: 기존 위성 군집 경계 안에 몇 개의 작은 실체를 불규칙 배치한다. 조명과 optical thickness는 실제 길이에 맞춘다. 겹침 alpha가 두 번 쌓여 날씨 분포가 바뀌지 않는지 확인.
5. **동일 공간 LOD**: 원형 지구에서는 광역층, 북유럽 확대에서는 세부 군집, 하강에서는 같은 원본 volume. projected feature 크기에 따라 detail/mip를 연속 조절하고 선명층 도입과 기존층 제거를 함께 시험한다. 단순 알파 페이드만으로 identity 보존을 보장하지 않는다.
6. **운동/비용**: p.1584/.18/.20/.215/.2278/.235, 정방향/역방향/정착 대조. popping·타원 패치·납작한 면·자글거림·history 잔상을 각각 확인. GPU 전체 frame/메모리는 실제 측정 전 unknown. 3D texture를 사용할 경우 shader/필터/업로드/압축 지원을 새로 검증한다.

통과는 레퍼런스에서 보이는 큰 날씨 띠와 작은 선명 군집이 함께 읽히고, 같은 위치에서 확대·하강하며 결이 자연스럽게 늘어나는 것. 연구 결론만으로 품질 통과를 선언하지 않는다. S1 지도 경계/near 인계/서고 연결 미완, 그림자 보류, 서고 KEEP, 구름 실패2/2 및 fallback 이력은 유지한다.
