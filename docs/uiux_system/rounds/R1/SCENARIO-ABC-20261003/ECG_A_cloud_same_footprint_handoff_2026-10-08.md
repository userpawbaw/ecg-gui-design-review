# A · 북유럽–구름 동일 기상장 연결 후보

2026-10-08 · D112 / CASE-007 · 제작 전 기준 → 실제 증거는 아래 결과에 추가

## 범위와 기준

그림자 추가 튜닝은 사용자 요청으로 보류한다. 지형1.5×와 커튼 조명, full-buffer TAA를 유지한다. cloud alpha.05는 D111 비교 후보이지 기본 채택이 아니다. 첫 구현은 별도 원경mask를 붙이지 않고 Takram 하나의 기상장/volume과 원래 거리별 mip 처리로 원경부터 접근까지 시험한다. 같은 globeUV/repeat54/offset0,0/coverage.42/exponent1.6을 유지하며 높이·두께·밀도가 scroll에 따라 성장하지 않는다. 바람 OFF 기준.

공식 자료: https://github.com/takram-design-engineering/three-geospatial/blob/b012ad06d858fc035d88aacfd73f092f93c994e4/packages/clouds/README.md

소스 근거: clouds.glsl getGlobeUv/sampleWeather/textureLod, clouds.frag getRayNearFar/getMipLevel/cameraHeight. 실제 거리별 샘플링 기능이 있으므로 mask 전환을 먼저 추가하지 않는다. source cube-sphere UV와 이 장면의 ECEF anchor를 함께 유지한다. source의 반복 seam/TODO는 여전히 품질 검토 대상이다.

## 6개 기준 구도

좌표는 북유럽 anchor(61.63N,8.4E)의 east/up/south, 단위 km. 화면 비율과 배치는 카메라 결과로 검토할 목표이며 고정 픽셀 산출값이 아니다.

| 구도 / p | 카메라 → 주시점 | 화면·빛·전이 |
|---|---|---|
| 1 광역 / .18 | (220,820,650) → (0,0,0) | 북유럽 해안·대륙과 곡면이 전체 화면에 읽힌다. 구름은 지형 위 얇은 넓은 분포, 멀리서 솜 덩어리 확대를 하지 않는다. 왼쪽 태양 방향, 지형 암부를 유지. 지구 재질에 인쇄된 기존 구름과 외부shell은 이 후보에서 제외한다. |
| 2 지역 / .235 | (55,100,150) → (0,1.8,0) | 목표 능선은 중앙 아래, 같은 구름군의 분리된 밝은면은 위/뒤로 읽힌다. 산맥1.5×와 parent 지형을 그대로 확대. 새 지형을 교체하지 않는다. |
| 3 접근 / .300 | (15.52,11.4,22.21) → (0,3.1,-.31) | 능선 아래, 구름 위·측면이 전경/중경에 분리되고 하늘 공간이 줄어든다. 먼 구름은 원래 mip/대기 원근, 가까운 구름은 같은 밀도장 세부 형태. |
| 4 커튼 / .365 | (0,7,1) → (0,7,-4) | 낮은 시야로 같은 구름층 아래를 본다. 하늘 밝은 구멍과 태양 방향의 광선이 지형으로 떨어지는 장면. 기존 사용자 긍정 분위기를 기준으로 확인. |
| 5 edge / .387 | (6,8.15,-1) → (12,8.4,-4) | 커튼을 본 뒤 고개와 경로를 비스듬히 올려 이미 존재한 구름 가장자리로 들어간다. 구름을 새로 띄우지 않는다. 측면이 점차 프레임을 채움. |
| 6 가림 / .410 | (12,8.2,-4) → (15,8.15,-6) | 고정 높이8–9.69km층의 R채널 응집 지점 내부에서 근경 가림을 시험. 완전 가림의 native 증거가 있어야 서고 컷 허용. 아직 가림이 부족하면 camera/같은 기상장 배치를 조정하며 별도 가짜 안개를 덧씌우지 않는다. |

구간 내 position/look은 smoothstep으로 이어지고 정역 입력이 같은 경로를 따른다. 구간 경계의 속도 정지가 심하면 후속 경로 접선 보간을 검토한다. 6구도의 기술 검증은 실제 연속 영상과 실제wheel을 구분한다.

## 서고 연결 조건

이번 단위는 구름 인계/가림 후보까지이다. 기존 archive KEEP 재질·조명·소품을 다른 광학으로 덮지 않는다. 서고 연결은 cloud-only resolved alpha 32×18 정착 표본과 실제 영상의 빈 구멍/지형 노출을 확인한 뒤 진행한다. 95% opacity 표본 비율98%는 보수적인 내부 gate이며 이것만으로 전체pixel 가림/시각 품질을 증명하지 않는다. 가림 확인 전에 scene cut을 강제하지 않는다. 이후 동일 WebGLRenderer에서 단위·tone mapping 경계를 명시한 후보로 연결한다.

## 검증 기준

- 같은 날씨, 태양, 층 고도/두께/밀도, 지형 유지: 6PNG+JSON 비교.
- 원경과 근경이 이중cloud로 겹치지 않음: embeddedCloud OFF와 source volume 하나.
- 구도6 cloud-only alpha와 실제 화면으로 가림 평가.
- 실제 canvas 정역 영상, 입력·GPU·context 상태 기록. 영상 encoding 비용은 고정구도 GPU 비용과 구분.
- 기본 main/Story/B/C 변경 없음, 기존 사용자capture 보존.


## 제작 중 수정 이력

초기 후보에서는 별 배경 점과 parent 지형에 인쇄된 cloud가 함께 남았다. 별과 parent/earth embeddedCloud는 이 후보에서 OFF. 기본 main은 기존값을 유지한다. 원경에서는 source 초기 ray step이 약10km까지 커져 얇은층을 건너뛸 가능성을 source 식으로 확인했으며 perspectiveStepScale은 카메라 고도100–600km에서1.01→1.0002로 연속 조정한다. 미세 shape erosion은 45–200km 고도 구간에서1→0으로 줄여 subpixel 형태를 원경에 그대로 투사하지 않도록 한다. 기상장·위치·coverage·고도·두께·밀도는 유지한다. 이 거리별 표현 번안은 원본 그대로가 아니며 성능/실제 룩은 아래 최종 결과로 판단한다.

초기6개 PNG/JSON: takram-handoff-20261008. 중간6개: takram-handoff-refined-20261008. 마지막 code/pose 후보는 takram-handoff-final-20261008에 별도로 저장하며 실패·수정 이력을 덮어쓰지 않는다. 중간 가림은 opaqueFraction.804로 전체 가림 미달, 카메라 고도를 R채널의 두꺼운 내부 쪽8.2km로 낮춰 다시 시험한다. source PNG의 RG값+globeUV CPU 분석은 배치 근거이며 3D 밀도 검증을 대신하지 않는다.


## 최종 후보와 이력 정정

- 최신 기상장: macro repeat9 × source 세부 샘플6배 = fine repeat54. 주 구름띠+두 보조 띠에 원본RG 세부를 곱한2048² weatherRT. 모든 시점에서 같은 텍스처이며 관측된 실제 기상이 아니다.
- 원경 shapeAmount 제거는 흰막을 만들 가능성이 확인되어 철회. shapeAmount1 유지, 45–200km 구간 shapeDetailAmount만1→0으로 줄인다.
- 원경 hazeDensity 감쇠 단독은 veil 해결이 아니었음. 후보에서는 먼 연무0/근경3e-5 연속, 별도 대기산란 유지. 그림자 추가 파라미터 변경 없음.
- 32×18 probe는 원본 cloud+haze 합성 overlay의 alpha. 앞선 cloud-only라는 명칭은 지형과 인위적 추가 안개가 없다는 뜻으로만 사용했고, 원본 sparse haze 포함 사실을 정정한다.
- 최신6구도는 takram-handoff-shape-20261008. 이전7개 후보를 혼동하지 않는다. source hash는 실제 latest 촬영 코드 기준으로 gallery manifest에 저장한다.
- 기본 main, 기존 서고 lighting/assets/Story/B/C는 변경하지 않았다. 이 단위의실제구현은 연속 구름인계/가림후보까지이며 archive scene 교체는 미실행.


## 최종 실제 증거 / 판정
최신6구도+완료24초actualCanvasWebM, display942×672/high50%/full-bufferTAA. ffmpeg 전구간decode 오류없이 통과. native 영상은 자동정역경로이고 실제wheel입력 증거와구분한다.
| p | overlay 평균alpha / 불투명표본 비율 | GPU p50 / p95 ms |
|---|---|---|
| 0.18 | 0.046 / 0.2% | 5.21 / 8.99 |
| 0.235 | 0.054 / 0.0% | 8.52 / 11.13 |
| 0.3 | 0.552 / 32.6% | 8.85 / 10.19 |
| 0.365 | 0.536 / 24.8% | 7.07 / 9.15 |
| 0.387 | 0.508 / 18.9% | 8.62 / 9.75 |
| 0.41 | 0.999 / 100.0% | 6.05 / 7.48 |

각120query 정착composer범위이며 targetPC/전체장기성능 PASS가 아니다. 녹화encoding GPU값 제외.

- 연결/가림 기술 범위 PASS: same weatherRT+ECEF/같은DEM/고정층+sun, 갑작스러운 별도cloud spawn/지형RGB교체 없음. 마지막95%불투명표본100%, 전체pixel/움직임가림확정과구분.
- 원경품질 TUNE: 구름띠가읽히지만띠내작은덩어리의점질감이남음. 광역지도/지역수평선광학도후속튜닝. '목업수준충족'으로판정하지않는다.
- 근경커튼/동일지형 유지, 최종룩/기상장/alpha.05사용자채택은미완.
- 실제wheel수정후 p.2136→target.2136 정착JSON확인. 역방향은 .18복귀를브라우저에서확인하며영상과별도증거.
- 기록/최종80module빌드PASS. 초기parent ReferenceError수정 후최종6프레임/영상 ready/context정상.
- 다음: 원경 동일weather footprint를 읽는 mip/저주파 coverage proxy와 근경volume 인계 후보 보완. 이미 가림구간 확보했지만 원경정합/실제전이후 기존archive KEEP 연결을별도진행. 그림자튜닝은사용자재개요청까지보류.
