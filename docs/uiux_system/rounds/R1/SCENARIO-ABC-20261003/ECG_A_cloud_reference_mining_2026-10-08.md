# A 구름·지구 레퍼런스 재탐색 및 차용 후보

2026-10-08 · D103 / F069 / CASE007. D102 80군집: 사용자 품질 불만족/TUNE. 이번은 원문·화면·소스·실제 파일 조달 조사이며 production renderer 변경/새 후보 채택은 아니다.

## 1. 사용자 피드백과 이번 갈림길

80군집의 개수·GPU 수치로 시각 완성도를 판단할 수 없다. 현재 VDB 조형은 보존하되 단독 밀도를 늘리고 배치·조명 상수를 계속 자체 튜닝하는 접근을 멈춰 비교 가능한 완성 renderer와 에셋을 조사했다. 사용자가 제시한 AI 설명은 검증 대상이며 확인된 구현 사실로 그대로 옮기지 않았다. D084 내부 시안 이용 범위 유지, 이용 범위를 다시 묻지 않았다.

Product Design index의 탐색/제작 구분과 기존 D083 reference mining 규칙을 참조했다. 현재 제품 재설계·새 목업 생성보다 원문과 실제 화면/코드/조달 가능한 자산을 먼저 고정한다.

## 2. 직접 확인한 사이트별 카드

| 레퍼런스 / 근거 | 끌리는 실제 화면 요소 | 기술 근거 / 차용할 것 | 이번 구름 문제와의 적합성 |
|---|---|---|---|
| [Populous](https://populous.com/explore), Awwwards 원문 제작자 Locomotive; 실제 Start experience 및 Climate Pledge Arena 선택 | 어두운 지구·야간 도시·가는 청색 대기 가장자리·눈/구름 흰 면이 함께 보인다. 선택하면 목적 지역 방향으로 지구가 회전하고 project card가 나타남 | 현장 화면 및 공개 DOM, WebGL 태그 확인. 실제 source asset/renderer 내부는 미조달. 화면 연출을 차용하되 기술 스택은 단정하지 않음 | 우주 지구의 시선 유도·밤낮 대비 기준. **도시 3D 지형까지 연속 내려가는 줌인은 이 탐색에서 확인하지 못했다.** 저고도 구름을 그대로 해결하는 근거는 아님 |
| [Discovery Builders](https://discoverybuildersllc.com/), [Outpost/Awwwards 카드](https://www.awwwards.com/inspiration/webgl-globe-discovery-builders) | Lands of Discovery 타이포/여백·목적지 선택 UI. 원문 map/globe/immersive 분류 확인 | live 해당 구역까지 스크롤했으나 이번 세션에서 지구가 그려지지 않음. 공개 renderer asset 조달 미완 | 과거 카드 존재와 현재 구름 품질 검증을 구분. 이 후보를 고품질 구름 증거로 사용하지 않음 |
| [Google Earth](https://earth.google.com/web/), [공식 기능](https://mapsplatform.google.com/maps-products/earth/capabilities/) | 실제 앱 로딩·새 기능 모달 확인. 지형·사진 tile 시스템은 공식 자료 근거 | 표면 확대용 이미지·3D 데이터 계층의 기준. 이번 세션은 구름을 통과하는 장면까지 검증하지 않음. 별도 Google tile 파일 수집/키 발급 없음 | 지형 품질/LOD 기준. CGI volume cloud 에셋 공급원으로 간주하지 않음 |
| [mapped.earth](https://mapped.earth/earth) | 실제 globe에 고밀도 청색 wind glyph/흐름과 데이터 선택 UI. relief보다 wind 표현이 강하게 보이는 현재 default | 화면과 ETOPO/ERA5 등 출처 표시 확인. shader/원본 파일 조달 없음 | 데이터 방향·흐름 가시화 아이디어는 유효. 사진 같은 구름 볼륨/하강 renderer 기준은 아님. AI 설명의 낮은 채도 영화적 무드는 일반화하지 않음 |
| [Three 공식 Earth](https://threejs.org/examples/webgpu_tsl_earth.html) | 야간 도시, 태양 방향에 따른 낮/밤, blue rim, 구름 패턴·범프 | **실제 pinned source+3개4096 texture 조달.** cloud는 packed texture B채널을 지구 color/roughness/bump에 사용. 대기는 Fresnel 기반 색 혼합 및 구형 외곽, 완전한 물리 산란이라고 부르지 않음 | 우주 shot용 완성 조합을 차용 가능. 별도 volume cloud layer가 없어 근접 비행용으로 확대하면 부적합 |
| [Takram Clouds Basic](https://takram-design-engineering.github.io/three-geospatial/?path=/story/clouds-clouds--basic) / 제작자 공개 code | 300m 기본 화면→UI altitude3500m로 실제 변경. 두꺼운 저층 bank의 그늘, 넓은 구름 틈, 얇은 고층 streak, 멀리 흐려지는 layer가 같은 화면에 공존 | `CloudsEffect`+`AerialPerspectiveEffect`, weather/shape/detail/turbulence/STBN, 대기 LUT, BSM, temporal resolve. **Vanilla 예제·shader·npm package·실제 default texture 조달** | **저고도/구름 접근의 1순위 차용 후보.** 라이브 데모의 temporal grain도 보이므로 사진 동등성 PASS가 아님. 제작자 문서에 우주 global cloud 지원 TODO/temporal ghosting 한계가 있음 |
| [Jeantimex Geospatial](https://github.com/jeantimex/geospatial) | 제작자가 Takram vanilla 기반 Clouds/Atmosphere/tiles demo를 공개 | 원문 code 구조/README 근거, 이번 실제 실행/조달 안 함 | Takram vanilla 대안 참고. Google tile key가 필요한 데모와 cloud-only 구현을 혼동하지 않음 |

Populous/Mapped/Discovery 시각 판단은 IAB 실제 관찰, Three/Takram 구현 판단은 공식/제작자 소스를 추가 대조했다. 자료 scraping timeout과 실제 browser 접근 성공도 구분했다. Google 접근 캡처는 구름 품질 증거가 아니다.

## 3. 확보한 파일 — 검색 결과에서 끝내지 않음

`assets/research/cloud-reference-20261008/manifest.json`에 원본 URL/version/commit/SHA256/bytes/조건/조달 상태를 고정한다. 후보 source 일부만 내려받아도 실행 가능한 완성 설치를 했다고 기록하지 않는다.

- Takram `@takram/three-clouds@0.7.6` 공식 npm tarball **2,582,174bytes**. 현재 설치한 atmosphere0.19.1/geospatial0.9.1과 같은 dependency version. Three≥.170/postprocessing≥6.36.7 조건도 현재 .186.1/6.39.5 범위에 맞음. API 동작·composer 호환 실제 통합 미검증, 앱 dependency는 변경 안 함.
- Takram pinned source README/constants/CloudsEffect/CloudsMaterial/CloudLayers/Vanilla/shader 묶음과 MIT LICENSE 확보. WebGPU cloud는 진행 중으로 기재돼 있어 첫 시험은 기존 WebGL2+vanilla 경로가 적합.
- 실제 Git LFS media 파일 확보: weather PNG679,653bytes; shape128³ R8 **2,097,152**; detail32³ R8 **32,768**; turbulence PNG49,691; STBN128×128×64 **1,048,576**. LFS pointer130bytes를 실제 asset으로 오인하지 않았다.
- 대기 기본 LUT bin: scattering8,388,608bytes / transmittance131,072 / irradiance8,192. 기존 앱에도 다른 Takram EXR optical assets가 있으므로 무작정 중복 업로드하지 않고 후보 API/정밀도와 비교한다. 파일 크기는 VRAM/성능 측정과 다르다.
- Three pinned Earth source와 day/night/packed4096 JPG 확보. 텍스처 제작자는 **Solar System Scope**로 공식 예제가 명시. NASA Blue Marble 기반이라는 것과 NASA 원본 그대로인 것은 다르다. texture는 CC BY4.0/Three source MIT 구분.
- 기존 북반구 runtime은 이미 조달한 **Moto Card day/night/bump WebP**를 사용한다(`assets/source/moto-reference-20261007/`, day314,824/night185,610/bump565,976bytes). Three4096은 비교·shader 연구 자산이지 기존 Moto 에셋보다 고품질인 신규 업그레이드로 판정하지 않는다. globe 재질·rim 비교 때도 기존 Moto 자산부터 유지한다.
- Solar System Scope 공개 8k cloud 다운로드도 확인했으나 실제 HTTP403. **8k 파일 조달 실패**, 4k 공식 예제 파일로 현재 조달 범위를 한정. HTML 에러를 이미지로 저장하지 않음. 광고 레퍼런스/Google 지형 asset은 파일 수집 성공으로 표시하지 않는다.

현재 에셋들은 `test-only/research`, 내부 시안 D084. 최종 출품 전 조건/표기/대체 확인을 남긴다. 정상 공개 다운로드만 사용했으며 새 인증/결제는 수행하지 않았다.

## 4. 현재 후보와의 gap — 코드와 화면 대조

1. **날씨의 구조:** D102는 VDB3종80개를 독립 상자에 배치했다. 실제 사진은 넓은 저층 deck/끊긴 bank/얇은 고층이 섞인다. 단독 bank 개수를 늘려도 같은 격리된 솜 덩어리 인상을 반복할 수 있다. Takram weather texture+높이별 layer가 더 적절한 비교 대상이다.
2. **빛:** D102는 고정 sun optical cache+휴리스틱 multi(.30/.10)+sky fill+거리 haze. 새 후보는 태양/하늘 irradiance LUT, powder, multiple-scattering approximation, cloud/지표 BSM을 함께 처리한다. source shape만 바꾸기보다 **완성 광학 시스템 자체를 가져오는 방향**을 시험한다. 현재 흰 덩어리의 원인이 하나라고 확정하진 않음.
3. **미세 질감:** D102 native volume128×64×192를 줄이는 LOD와60% target은 가까운 edge를 약화시킬 수 있다. Takram은 macro weather/shape/detail erosion을 분리하고 temporal reconstruction을 사용한다. temporal off/on을 같이 비교해야 사용자가 해결했다고 한 자글거림을 재도입하지 않는다.
4. **지구 전체와 저고도:** 공식 Three는 좋은 globe shot, Takram은 좋은 근접 cloudscape 후보다. 둘 다 모든 거리에서 같은 품질로 자동 전환되는 에셋이 아니다. 단계를 나누되 태양·geographic anchor·camera scale·깊이·weather coverage를 정합해야 한다.
5. **지형:** 높이1.5×와 근접 DEM KEEP는 유지한다. 구름 시스템 교체로 지도/terrain RGB를 다시 통째로 바꾸지 않는다. 넓은 뷰의 직선 horizon은 별도 geometry coverage/대기 작업이며 구름으로 전부 감추는 것이 품질 검증을 대신하지 않는다.

Takram noise-field는 제작자 시스템의 원래 입력이다. 이를 **실제 JangaFX VDB 밀도라고 부르지 않는다.** D100 scalar fidelity와 다른 새 후보 경로로 표시하고, 필요시 VDB hero 결합은 별도 호환/광학 시험 이후 판단한다.

## 5. 추천 시험 순서와 구도

### 시험 1 — 완성 원형부터 유지
별도 candidate 페이지에서 Takram **Vanilla 전체 optical chain**을 먼저 실행한다. default assets/layer/AgX/태양을 그대로 두고 source demo와 같은 camera300m·3500m에서 결과가 재현되는지 확인한다. 아직 자체 terrain·VDB·미술 상수를 섞지 않는다. screenshot/실제 wheel·GPU 범위/temporal on-off/inside 전이 확인. 완성 renderer를 일부 빼서 낮은 품질로 만든 뒤 source를 탓하는 오류를 예방한다.

### 시험 2 — 동일 북유럽 terrain 위 적용
기존 km scene↔meter ECEF 변환과 north61.63/8.4 anchor·지구 중심·WGS84/렌더 radius 오차를 명시. 기존 normal/depth·DEM1.5× 유지, 새 compositor depth와normalbuffer를 연결한다. cloud layer 바닥은 **화면 DEM 최고점과 여유 높이 기준**으로 정해 default750m를 맹목적으로 넣지 않는다. p.265 높은 하강(지형55–65%/멀고얇은구름), p.300 bank접근(중근경40–60%/지형틈), p.345 내부직전(nearbank60–80%/남은지형가림) 세 구도를 먼저 비교한다. 이 수치는 art 시험범위이며 기상 측정값 아님.

### 시험 3 — globe→하강 연결
우주 shot은 기존 Moto texture를 유지하고 Three의 완성 composition을 shader 비교 기준으로 차용해 rim·야간도시·구름pattern을 정리한다. 신규Solar texture는 실제 동등구도 비교에서 유리함이 확인될 때만 교체 후보로 검토한다. regional weather texture를 같은 지리 위치로 맞추고 macro coverage→volume coverage를 겹친다. screen pixel/noise/detail/밝기 기준으로 전환 범위를 조절한다. global support TODO가 있으므로 Takram을 우주부터 무조건 켜지 않는다. **cloud-only** 합성과 같은 terrain 유지. VDB hero를 다시 섞을지/새 weather renderer만 쓸지는 실제 결과로 결정한다.

### 시험 4 — 재평가
원본 demo/동일구도 candidate/현재D102를 같은 크기·노출조건으로 놓고 layer/은행형태·밝은면세부·아랫면그늘·거리 haze·실제camera통과·자글거림·GPU를 각각 KEEP/TUNE/REJECT. generated still과 source demo screenshot을 우리 구현으로 제시하지 않는다. 사용자 품질 평가 전 winner 미확정. 이전combined2/2실패와 D080 두 대안 미실행은 보존한다.

## 6. 이번 완료와 미완

완료: 5개 제시 레퍼런스 URL 확인/화면 또는 공식 원문 검토, Takram 추가 직접 데모300/3500m 관찰, shader/API 비교, 실제 texture/LUT/package 다운로드·pin, 사용자 불만족 기록. 런타임 D102 코드는 유지. 새 Takram cloud candidate 설치/렌더 통합·source 원형 재현·성능·통합 winner는 다음 제작 단계다. 보고서/기록 구조 검사와 원격 저장은 시각 채택과 분리한다.

증거 화면: `verification/a-cloud-reference-20261008/`의 Takram300/3500m·Populous·Three·Discovery영역·Google접근. Google/Discovery 파일명은 접근/구역 관찰 의미이며 해당 cloud 성능·품질 PASS 증거 아님.
