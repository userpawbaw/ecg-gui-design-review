# D110 · 사용자 영상 피드백: 자글거림·그림자·북유럽 구름 인계

## 1. 관찰과 판정의 경계

[대화] 사용자: 빛 커튼 분위기는 좋음. 하강 자글거림과 머리 위 구름만 반영하는 듯한 지형 그림자 문제. 광역 북유럽에서 구름의 등장과 하강 연결을 질문.

[영상 프레임 관찰] 사용자 파일 `C:/Users/J1/Videos/Captures/ChatGPT 2026-10-08 18-28-58.mp4`를 읽었다. ffmpeg: 길이23.65초/H264/1776×824. 3초 간격으로8프레임 추출해 시간대별 화면을 대조했다. 추출물은 사용자 녹화 분석 자료이며 구현 native capture/AI mockup과 다르다. 원본 영상의 압축과 축소 정지 프레임으로 시간 잡음의 원인을 확정하지 않는다.

영상 UI: ultra, 구름 해상도100%, temporal upscale OFF, SMAA OFF, coverage.43/repeat54, wind OFF. 카메라 진행에 따라 능선의 밝은 영역이 크게 바뀐다. 따라서 D108 high50% 기준과 동일 조건으로 비교하지 않는다. 단순 해상도 부족만으로 설명할 수 없으며 ultra100%로도 사용자가 보고한 문제는 남는다.

빛 커튼 분위기는 사용자 긍정 요소로 유지. 구름 전체 채택/품질 PASS로 확대하지 않는다.

## 2. 자글거림의 후보와 분리 시험

| 후보 | 근거 | 분리 시험 |
|---|---|---|
| 볼륨 stochastic raymarch temporal noise | Takram 제작자 issue40: 큰 step과 stochastic offset의 noise, denoiser/SVS 검토. full-buffer TAA도 움직임 중 새 픽셀/history 거부에서 잔여 잡음 가능 | 같은 짧은 카메라 경로/정착구도, cloud100/high/고정wind로 clouds minStep/perspectiveStep/detail 한 변수 대조 |
| cloud-shadow temporal/cascade instability | 실제 BSM은 shadow.temporalPass/temporalJitter 별도. cloud-buffer TAA와 별개 | groundShadow만OFF, beam ON 유지. 이후 shadow temporalJitter/temporalPass 각각 단독 대조 |
| 능선·얇은 구름의 subpixel alias | 영상 SMAA OFF. 외곽 alias와 볼륨 내부noise는 다름 | 동일크기 SMAA ON/OFF. ON을 만능 해결로 해석하지 않음 |
| 압축/브라우저 frame 변동 | 사용자 영상은H264, 재생/스크롤 중 화면 | 원본 해상도 renderer PNG와 연속 동일경로 비교. 성능·화질 별도 기록 |

TAA 사용 자체를 되돌리지 않는다. 모든 jitter를 끄면 stochastic grain 대신 banding/계단/structured sampling이 드러날 수 있다. ultra만 올리는 접근도 우선하지 않는다.

## 3. 그림자가 카메라를 따라가는 느낌

[소스 확정] sun은 고정 방향이고 머리 위에 둔 point light가 아니다. pinned CloudsEffect.update에서 camera/sun에 맞춰 shadowMaps를 갱신한다. local wrapper는 shadow.maxFar=100km. 실제 CascadedShadowMaps는 camera frustum을 practical splits로 분할하고 각 cascade를 light-space texel grid로 snap한다. 기본 margin=0/fade=true, 해당 구현 splitLambda=.5. README의 일부 기본값 표와 소스 차이가 있으므로 실행값을 다음 캡처에 기록해야 한다.

[가능성, 미확정] 카메라가 움직이며 shadow coverage/경계/해상도 또는 재투영 history가 바뀌거나, 시야 밖 태양 쪽 구름 caster가 충분히 포함되지 않아 밝기 변화가 과장될 수 있다. 영상만으로 실제 자연스러운 서로 다른 구름 그림자와 구현 오류를 완전히 분리할 수 없다.

첫 대조: cloud look과sun 고정, groundShadow OFF/ON → shadow.margin(구름 고도와 수광지형을 포함하는 여유) 및 maxFar/farScale/cascade split를 한 변수씩 비교 → 필요 시 shadow resolution/temporal 축. 그림자의 위치는 같은 world-space 지형 점을 기준으로 확인한다. 카메라를 움직여도 지형 점의 조도가 같은 정적날씨/광원 조건에서 불연속으로 바뀌지 않아야 한다. 화면좌표가 같은 픽셀을 비교하는 방법은 카메라 이동 때문에 부적절하다.

기울어진 태양에서는 머리 위 구름과 그 바로 아래 지형이 항상 짝이 아니다. 예시 고도차2km/태양15°라면 평지 단순근사에서 수평 그림자 이동 약7.5km. 정확한 relief/곡률은 별도. 따라서 단순한 수직投射 shadow를 만드는 수정도 피한다.

## 4. 추천 구름 인계: 같은 구름군을 거리별로 표현

핵심은 스크롤에 따라 새 두꺼운 구름을 생성하는 것이 아니라, 처음부터 있는 구름군을 점차 자세히 보여주는 것. 아래는 설계 제안이며 구현/채택 완료가 아니다. 구름 실제 높이·기상 재현을 목표로 확정하는 값과 연출용 카메라 경로를 구분한다.

| 장면 | 구도·보이는 구름 | 전이와 의미 |
|---|---|---|
| 북유럽 광역 | 북유럽 해안선·설산이 먼저 읽히고, 비대칭 넓은 구름띠가 지도 일부를 가린다. 선택한 구름군은 화면 우상단/진행방향에 이미 존재. 작은 솜뭉치를 대륙 전체에 균일 반복하지 않음 | 밉/저주파 coverage로 표현한 원경층. 실제 footprint가 있는 cloud mask와 부드러운 그림자. 전면 안개막과 구분 |
| 지역 확대 | 같은 구름띠 내부의 큰 덩어리가 분리되어 보임. 목표 능선 앞쪽에는 빈 창, 그 뒤에 카메라가 통과할 구름 가장자리 | 원경 mask와 같은 world 좌표/coverage를 근경volume의weather로 사용. local volume을 미리 준비, footprint 위치를 유지하며 깊이/명암 기여를 점진적으로 인계 |
| 구름 접근 | 카메라가 하강하며 위쪽 밝은면→옆면→아래쪽그림자를 순서대로 본다. 전경 한두 덩어리는 크고 먼 구름은 대기 원근 속에 단순하게 | thickness를 갑자기 늘리지 않음. 같은 고정구름에 카메라가 접근하며 parallax가 증가. 입체 표현의 기여만 거리별 변화 |
| 통과·서고 가림 | 먼저 같은지형·구름 아래 커튼빛을 짧게 보여주고, 이미 근경에 있던 구름 가장자리로 비스듬히 진입해 화면을 가림 | 빈 창을 지나 아래로만 직진하면 완전 가림이 안 됨. 카메라 경로/구름 배치를 함께 설계. 가림 최대 구간에서 서고 scene 교체, 밝은 회백색→따뜻한 암부로 연결 |

원경/근경 인계는 스크롤값만으로 딱 켜지지 않게 한다. cloud feature의 화면 크기·거리·카메라 높이를 근거로 구간을 결정한다. 이중 구름 밝기/그림자가 누적되지 않게 optical depth/coverage 역할을 나눠야 한다. 기존2D mask에 무관한 새 weather54를 붙이면 footprint가 바뀌므로 이번 방식의 목표를 충족하지 못한다. 표의 위치는 첫6구도에서 조정할 제안이다.

## 5. 다른 두 안의 용도

- 광역 얕은층 + 별도 두꺼운 전환 구름: 제작이 빠르고 가림 연출에 유리. 다만 그 덩어리를 광역 화면부터 작게 보여주고 접근해야 연결성이 생긴다. 두께가 스크롤에 따라 성장하거나 갑자기 소환되는 형태는 피한다.
- 얕은 구름층만: 원경은 충분히 가능. 전체 하강까지 얕은 안개로 대체하면 가까운 부피감과 커튼빛의 입체 관계가 약해지므로 원경 담당/성능fallback에 적합하다.

우선안: 원경 구름띠 + 같은 위치의 근경volume + 계획된 edge 통과. 사용자 북유럽 레퍼런스가 있으면 coverage/구름띠의 방향/표면 노출 비율/태양·카메라 위치의 목표로 사용한다. 새 이미지가 없어도 기존 공식자료로 진행 가능하며, 사용자에게 재료 준비를 필수 작업으로 돌리지 않는다.

## 6. 진행 순서와 판정

1. **하강 결함**: 현재 빛 커튼룩/terrain1.5× 유지, 자글거림과 그림자 분리시험. 같은카메라 정역 경로+정착 native+가능한 연속 증거, GPU비용 함께 기록.
2. **원경 인계 설계**: 북유럽 광역/지역/접근/구름측면/통과/서고가림의 최소6구도. mask↔volume 위치연속을 우선 검증.
3. **동일renderer후보통합**: metre/kilometre·ECEF·albedo/normal/depth·tone mapping 경계와 archiveKEEP 복원.
4. **리뷰**: 양감/질감/불연속/그림자고정/정역TAA/GPU를 각기 판정. 입력PASS만으로품질KEEP를선언하지않음.

이번 단위는 영상 검토·원인 후보·설계 추천이며 renderer 수정은 하지 않았다. 사용자의 분위기 긍정과 추가 피드백은 F076/D110에 기록. 기존 거절/KEEP/피드백 횟수를 보존한다.

## 자료

- pinned Takram README: https://github.com/takram-design-engineering/three-geospatial/blob/b012ad06d858fc035d88aacfd73f092f93c994e4/packages/clouds/README.md
- 제작자 noise 논의 issue40: https://github.com/takram-design-engineering/three-geospatial/issues/40 (해결 완료가 아닌 개선 제안)
- 원거리 globe/shadow artifact issue50: https://github.com/takram-design-engineering/three-geospatial/issues/50 (유사 사례, 현재 wrapper 동일 원인 증명 아님)
- 실행 pinned source: node_modules/@takram/three-clouds/src/{CloudsEffect,CascadedShadowMaps,qualityPresets}.ts 및 연구본 README. 향후 wrapper 캡처에 실제 shadow/march 값을 추가해야 한다.
