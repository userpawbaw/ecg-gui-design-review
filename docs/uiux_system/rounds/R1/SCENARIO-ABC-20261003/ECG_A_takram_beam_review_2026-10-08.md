# D108 · 고도 연무와 구름 빈 창의 커튼빛 보완

## 1. 변경 계약

사용자 D107 이후 진행 승인. 대상: 같은 northern DEM1.5×/camera의 별도 cloud-lab. TAA high50%/SMAA/원본 noise·weather·LUT·pinned clouds0.7.6/atmosphere0.19.1 유지. cloudBuffer640×360/display1280×720. 새 CSS beam/Bloom 추가나 library shader 수정 없이 source shadowLength/고도 연무의 파라미터를 번안했다. main/globe/서고/Story/BC 및 사용자 capture6파일은 미변경.

## 2. 후보와 단독 대조

| 요소 | 이전 기준 | 이번 검토 후보 | 이유 |
|---|---|---|---|
| coverage/repeat/exponent | .42/54/1.6 | 동일 | 양을 늘리면 암부/천장 문제, 현재 군집 유지 |
| weatherOffset | 0/0 | 0/0 유지 | .12/.10도 시험했으나 태양을 큰 덩어리가 가리고 빛 통로가 좁아짐 |
| 태양 고도/방위 | 약16.1°/43.75° | 15°/0° | 카메라 시야 안에서 태양·구름·빛 통로의 관계를 볼 수 있도록 이동. 실제 현지 시간 label 아님 |
| hazeExponent/densityScale | .001/3e-5 | .00018/3e-5 | 고도7km에서 근사가 남도록 감쇠 변경; .0001은 광선이 강하지만 지형이 많이 묻힘 |
| 하부 두 층 thickness | 650/1200m | 780/1440m | 두께1.2배의 rim·양감 후보. 바닥8km/8.25km는 동일 |
| densityScale | .2/.2 | .2/.2 유지 | .8배도 대조했으나 선택을 바꿀 만큼 명확한 개선은 확인 못함 |
| ground cloud shadow | ON | ON | OFF 대조에서 지형이 밝아짐. 물리적 가림은 유지하고 연무/광학 균형을 검토 |

약7km에서 haze density: 기본2.74e-8, .0001은1.49e-5, .00018은8.51e-6. 이 수치는 source 식을 적용한 설명용 산술이며 실제 픽셀 밝기/기상 측정치가 아니다.

## 3. 실제 증거와 판정

- native24 PNG+JSON: 같은6구도 이전/후보12쌍, 추가 광학 대조6장, 정역 진행값 재생 직후6장. gallery/manifest: verification/a-takram-beam-20261008/.
- p.345/.365: 태양 아래로 구름의 가림 경계에 대응하는 밝고 어두운 광선 띠가 생김. shaftsOFF에서는 커튼 무늬가 사라지고 연무만 남는다. **광선 경로 기여 확인 PASS scoped**.
- p.300: 군집의 위치를 유지하면서 두께 변경. 밝은 cloud face의 미세 질감/near softness 및 먼 구름 반복감은 여전히 TUNE. "레퍼런스와 동등" 판정은 하지 않는다.
- .00018이 .0001보다 지형 디테일을 보존하면서 광선이 남는 후보. 역광 지형의 암부는 여전히 존재한다. ground shadowOFF를 최종 룩으로 채택하지 않았다.
- 정방향/역방향 p.285/.300/.345는 동일 분포를 유지하는 캡처를 확인. 자동 진행값을 연속 변경한 약6.4초 왕복 재생이며 실제 마우스 휠/main 연결/영상 증거와 구별한다. 캡처에서 두드러진 대형 잔상이나 구름교체는 확인되지 않았지만 모든 순간/장시간 ghosting 부재를 증명하지 않는다.
- RTX3070, 모든native contextLost=false/ready=true, 최종 console warn/error0. UI→renderer→localhost POST→PNG/JSON→저장완료 응답 및 replay완료 확인. 원래 시스템 중단 원인/targetPC/장기 안정성은 미검증.
- early 단독 시험 뒤 recipe/replay UI를 추가했으며 최종 6구도/재생은 최종코드로 실행. manifest의 sourceAtPackaging SHA는 포장 당시 코드값이고 early 캡처 당시 byte 동일성 증거가 아니다. 이 한계를 명시한다.

## 4. GPU 관측 범위

각 fixed구도120query, high50/fullresTAA, 순차 실행, whole composer. CPU/full frame/FPS/cloud 추가 비용/다른 하드웨어 성능으로 확대하지 않는다.

| p | 이전 p50/p95 ms | 후보 p50/p95 ms |
|---|---|---|
| .265 | 8.57/10.00 | 8.72/9.61 |
| .285 | 9.20/9.74 | 9.18/9.78 |
| .300 | 9.15/9.82 | 9.08/9.65 |
| .320 | 9.25/9.72 | 9.21/9.77 |
| .345 | 8.57/9.36 | 8.67/9.53 |
| .365 | 8.33/9.23 | 8.40/9.26 |

이 범위에서 큰 비용 상승은 관찰되지 않았지만 동일 시간 동시 A/B가 아니므로 성능 개선/차액 확정은 하지 않는다. 단독 대조/움직임 프레임의 rolling GPU값은 별도이며 이 표와 섞지 않는다.

## 5. 유지·보완·다음

- 유지: TAA, 원본 source 자산·광학, 같은 지형·카메라, coverage.42/54, 자연스러운 shadow 연결.
- 이번 제시: 커튼빛 후보(15°/0°/.00018/두께1.2). 품질 **TUNE**, 전체 main 채택 전.
- 보완: near cloud bright face 세부/먼 반복감, 역광 암부와 연무의 주관적 균형. 선호 확인 뒤 조절 범위를 작게 고정한다.
- 다음: 이 룩의 사용자 리뷰 → 선택된 값의 globe/지역/하강 연속 인계(near-cloud 설정을 우주 전체에 전역 적용하지 않음) → 실제 휠 및 서고 가림 연결 검증. A-P3/Story/BC/D080 별도.

`recipe=curtain`으로 직접 재현 가능. 이전 기준과 후보 dropdown, 카메라 slider, 정역 이동 검증 버튼이 있으며 기록용 captureRound는 기존 폴더와 분리했다. 실시간 링크는 gallery에 연결한다.

## 6. 충실도 게이트

G1 source값/번안값 구별 CONDITIONAL; G2 pinned 자산/메타 해시 PASS scoped; G3 같은6구도 이전/후보 PASS scoped, 외부레퍼런스 동일6구도 대응 PARTIAL; G4 외부룩 luminance/chroma 정량정합 미완; G5 fixed+정역6프레임 PARTIAL(실제wheel/main/targetPC/reduced-motion/full replay 미검증); G6 이번 광학 단독대조와 후보 재검증 완료, 추가 자체shader 수정 없음. 기술QA와 최종시각채택을 구별한다.
