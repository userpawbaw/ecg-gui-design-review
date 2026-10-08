# D107 · 원본 구름 파라미터 검토와 보완 시작

사용자: TAA가 훨씬 낫다. 구름 양/시간대 및 다른 설정을 검토하고 완료 후 보완으로 이어간다.

## 1. 근거와 유지 범위

- 2026-10-08 live Basic의 DOM form 값 및 pinned commit `b012ad06d858fc035d88aacfd73f092f93c994e4`의 `useCloudsControls.ts`, CloudLayers/CloudsMaterial/GLSL 대조. 새 helper 사본: verification/a-takram-parameters-20261008/useCloudsControls.ts.
- 원본 페이지: https://takram-design-engineering.github.io/three-geospatial/?path=/story/clouds-clouds--basic
- 고정 source: https://github.com/takram-design-engineering/three-geospatial/blob/b012ad06d858fc035d88aacfd73f092f93c994e4/storybook/src/clouds/helpers/useCloudsControls.ts
- 원본 live: coverage .30, repeat100, high, resolutionScale1, temporalUpscale ON, shafts/detail/turbulence/haze ON. 사용자 참고 이미지는 .42/54다. helper 초기 UI의 0값/false는 실제 effect를 읽기 전 placeholder이며 기본 광학값으로 사용하지 않는다.
- 북유럽은 날짜 기반 시간이 아닌 고정 sun vector(-.67,.28,-.70 정규화); 태양 고도 약16.1°, 방위는 이 lab 좌표에서43.75°. 원본 local time09:00/위경도30°/35°/고도300m와 다른 조건. 원본 시간만 복사하면 북유럽 역광이 같아지지 않는다.
- 사용자 선호는 **high/fullres50% + TAA 유지**. cloud buffer640×360/표시1280×720, full display-resolution이라고 부르지 않는다. exponent1.6/전체 구름 후보 최종 채택은 아직 TUNE. terrain1.5×/서고KEEP, main/globe/Story/BC는 별도.

## 2. 무엇을 조절할 가치가 있는가

| 순서 | 파라미터와 현재/원본 기준 | 조절 의도 및 다음 시험 범위 | 비용·주의 |
|---|---|---|---|
| 1 | coverage .42 / 원본 .30 | .32/.42/.50 실제 대조. .42 기준 유지, 필요시 .36–.42 | 화면 점유율42%라는 뜻 아님. 많아지면 공극·지형 빛 감소/경로 비용 변화 |
| 1 | localWeatherRepeat54 / 원본100; offset0 | repeat는 군집 공간 주파수, offset은 같은 field의 위치. X .12 실제 대조 | repeat를 무작위성/양으로 혼동하지 않음. offset은 모양/양을 다시 만들지 않고 화면 틈 배치 변경 |
| 1 | sun elevation16.1°/azimuth43.75° | 고도30° 및 방위-30° 단독 대조. 다음15–30°와 카메라 안의 태양/빛 통로 정합 | 그림자 위치·구름 rim·지형 밝기 모두 바뀜. 시간 라벨 대신 방향 계약으로 저장 |
| 1 | hazeExponent .001, density3e-5 | 감쇠 .00035 단독 및 방위-30° 조합 시험 | 고도 연무의 예술적 번안이며 실제 기상 시뮬레이션 아님. 지나치면 지형/대비 지워짐 |
| 2 | lower layers8km/8.25km, 두께650/1200m, density .2 | 층 두께 ±20%, density .15/.2/.25를 별개로 대조 | 두께는 양감·수직 실루엣, density는 투과/그림자. 겹친 층은 sheet처럼 보일 수 있음 |
| 2 | shapeRepeat .0003, detailRepeat .006, detailAmount1 | 큰 덩어리와 erosion 분리. detailAmount .7–1 | detail 과다/높은 반복은 다시 자글거림. 필요시만 변경 |
| 2 | turbulenceRepeat20/displacement350 | 외곽 균질성이 남을 때 displacement200–350 | 무작위 좌표 재생성이 아니라 실제 noise 변형. animation과 별개 |
| 3 | skyLight1/groundBounce1, scattering1/absorption0 | 구름 하부만 지나치게 검으면 skylight1–1.3; 흰 face는 노출보다 optical 대비 확인 | clouds.skyLight는 지형 전체 fill light와 동일하지 않음. 전체 exposure10 증가부터 시작하지 않음 |
| 3 | anisotropy .7/-.2/mix .5, powder .8/exponent150 | 구도 확정 뒤 rim/전후방산란; 마지막 미세 조절 | sun 방향과 강하게 결합. rim이 강해도 내부 양감 개선 증거는 아님 |
| 조건부 | shadow3cascade/512, maxFar100km | aliasing이나 빔 위치 손실이 남을 때만1024/maxFar 재검토 | shadow GPU/메모리 증가; ray max200km와 별개 |
| 마지막 | high500iteration, 8multiscatter, minStep50m, sun2/ground3 | undersampling이 확인된 경우에만 step/iteration/ultra | high→ultra는 렌더 비용 증가. 구도/광학 문제가 자동 해결되지는 않음 |

## 3. 고도 연무의 중요한 차이

원본 `approximateHaze`는 `remapClamped(coverage,.2,.4) * hazeDensityScale * exp(-cameraHeight*hazeExponent)`를 쓰고 density<1e-7이면 해당 haze 근사를 생략한다. .42에서는 modulation1이다. 7km 기본값은 약2.74e-8, .00035에서는 약2.59e-6이다. 따라서 **기본 연무 근사의 고도 적합성은 실제로 다르다**. 이것이 모든 빛 커튼 부족의 유일 원인이라는 판단은 하지 않는다. AerialPerspective의 다른 산란 및 cloud shadowLength 경로는 별개다.

## 4. 보완 첫 시험 결과

동일 p.365/지형/카메라/high50/fullresTAA/exponent1.6/바람OFF. 9개 native PNG+JSON: baseline, coverage32/50, haze350, elevation30, offset12, azimuth-30, azimuth-30+haze350 ON/OFF.

- .32: 공극/지형 노출 증가, 구름이 드문 느낌. .50: 구름 천장과 지형 암부 심화. .42는 기준으로 적절하나 전체 경로 최적값 미확정.
- 고도30°와 방위-30°는 지형 밝기 및 음영 방향을 개선할 여지가 보임. 구름 face/도입부 기존 역광과 이어지는 방향은 다음 연속 검증 필요.
- offset .12는 구름군 위치와 그림자를 크게 바꿈. 총량을 늘리지 않고 빛 통로를 설계하는 유효 조절점.
- haze .00035는 거리의 연무를 늘렸지만 **목표의 분명한 커튼 광선은 아직 불충분**. ON/OFF도 극적인 차이는 아님. 해당 조합 최종채택 보류/TUNE.
- GPU값은 임의 정지 시점 rolling sample, full composer이며 정식120sample 동일시간 벤치마크 아님. native metadata에 보존하되 성능 우열 수치로 사용하지 않는다.
- 프레임 저장 처음 실패: 추가 suffix가 server80자 제한 초과. compact shot ID로 수정 후 실제 저장/응답UI 확인. 과거 captures 미덮어쓰기. console warn/error0, context 정상. 중단 원인/장기 안정성/targetPC 증거 아님.

## 5. 다음 보완의 순서와 완료 기준

1. 분포: .42/54 기준, offset과 layer thickness로 near cloud 1–2개와 명확한 빈 창 배치. 한 변수 대조 후 확정.
2. 빛: 카메라·태양·빈 창을 같은 화면에 맞춰 구름 아래 shadowLength 커튼이 나타나는 구도 확보. sky 방향/수광 지형/연무 거리 함께 점검. 현재 p.365 단독 시험이 약했으므로 원본 Basic300m 대비와 중간 하강 구도를 우선 사용.
3. 지형: 태양 고도/방위 조절 후 남는 암부에 대해 terrain normal/albedo/sun/sky 항목을 분리. cloud skylight만으로 지형 fill을 대체하지 않는다.
4. 정해진 후보를 기존6구도 및 실제 정역스크롤로 검증(TAA 잔상·팝·시간 축적). 동일 품질을 충족하면 GPU benchmark, 이후 globe 인계. 원형 우주 구름에 이 near cloud 설정을 전역 적용하지 않는다.

이번 완료 범위: **파라미터 조사 완료 / 보완 컨트롤과 단독 시험 시작 / 품질 TUNE**. 모든 보완·연속 도입부 통합 완료로 해석하지 않는다.
