# 지역 확대 구름의 연결감 보완 — D139

## 결과 먼저
D138은 사용자가 ‘약간 어색’하다고 평가했다. 진행 승인을 최종 채택으로 해석하지 않고 TUNE로 유지한다. 이번 후보는 확대 중 부풀어 오르는 높이 변화를 제거하고 기존 위성층과 하단 밀도를 연결했다. static에서 위로 솟은 덩어리감은 줄지만, 기존의 흐린 층과 새 source의 결 차이는 여전히 남는다. 사진 reference 수준 달성이나 전체 도입부 완성으로 승격하지 않는다.

## 바꾼 항목
- 같은 Disney fine/coarse R8, 태양,광량,192ray/6light sampling,world XZ 유지. 새 데이터 다운로드/추가 없음. 명목6.75MiB 그대로.
- 첫 군집 중심 높이11.2→10.6km, 높이3.6→8.4km 성장 대신5.6km 고정(하단7.8km/상단13.4km). 두 번째 중심10.5→10.2km,3→6.5km 성장 대신4.4km 고정(하단8km/상단12.4km).
- normalized source y.12–.62의 하단 밀도에만 기존 satellite coverage의 smoothstep(.22,.62) 지지값 적용. 윗면 세부 밀도는 유지. 구름층을 넓은 사각형/타원으로 지우거나 전체 sprite opacity fade를 넣지 않는다.
- 거리 footprint280–1600m의 fine/coarse 필터와 p.19–.25 밀도 인계 유지. 이번에는 높이 성장이 없다.
- legacy / joined / 기존 구름층만 선택 가능. regional-join reviewRound만 joined가 초기값. 기존 D138 reviewRound는 legacy 초기값과16구도 OFF/ON 저장 경로를 유지한다. 주 Intro 기본값은 바꾸지 않았다.
- 높이/중심/하단 지지 분포를 함께 바꾼 practical tuning 대조다. 한 변수의 인과를 분리 증명하는 실험은 아니다.

## 검증 범위와 한계
- actual1280×720, .20/.21/.235/.25/.27/.29 × legacy/joined=12장. 동일p camera,ready/context,variant metadata 확인. 전체 source/빛을 교체한 대조가 아니다.
- GPU composer 각30표본 RTX3070/ANGLE. legacy p50 2.06–4.18ms, joined2.75–5.14ms. 짧은순차표본, 다른PC/FPS/정확한비용/VRAM보장 아님. 하단 밀도 지지 분포의 추가 texture 조회가 있으며 성능최종gate는 별도다.
- 새8초 canvas 정역 영상 p.18→약.29→.18. 생성/trace와 연속 미감 검증을 구별한다. 영상은 로컬만 유지, 업로드 제외.
- 호스트 build PASS. 최종 browser 확인 범위는 validation.json. 사용자 최종 시각 판정은 대기한다. 구름 통과/지형 그림자/서고 연결의 검증이 아니다.

## 수정한 튜닝 목록과 통과 기준
1. **재질 연결**: p.21→.25에서 새 군집만 다른 물체처럼 보이지 않고 윗면의 밝은 결과 골을 유지한다. 이번 고정 높이/하단 연결은 후보이며 완전 해결이라고 표시하지 않는다. source가 여전히 독립된 은행 모양으로 읽히면 중간 크기의 밀도/footprint 연결을 보완한다.
2. **필요한 근접 해상도**: p.27→.29의 선명한 군집에 실제 voxel 확대/흐림이 남는지 확인한다. 필요할 때만 해당 source subregion을 더 촘촘히 변환한다. 전지구 source 증량은 하지 않는다.
3. **이동 안정성**: 정역 중 개체 생성점·크기 펌핑·표면 줄무늬·자글거림이 눈에 띄지 않는다. 고정 높이가 납작하면 고정값을 조정하며 p에 따른 성장으로 되돌리지 않는다.
4. 위 조건의 사용자 시각 확인 뒤 near 통과/커튼빛 연결 단계로 진행한다. 기술 PASS는 최종 채택이 아니다.

지형1.5×/그림자 보류/서고KEEP/실패2/2/fallback/주intro미채택 유지. source attribution은 D138과 동일: Copyright2017 Disney Enterprises Inc,CC BY-SA3.0,Kevin Udy photo reference.

## 근거와 재현
D138/F103 및 기존 Epic cloud layout/profile/shape 분리 조사에 연결한 국소 튜닝이다. 새 업계 renderer 재현이나 새 source 확보로 표시하지 않는다.

cloud-lab.html의 regionalVolume=1&reviewRound=regional-join-20261016 → 상단 이전/보완 선택,12구도 저장. scripts/assets/package-cloud-regional-join.py → static gallery. 영상은8초 정역 버튼으로 별도 로컬 생성한다. 보고서·runtime-manifest·원본 실패들은 유지한다.
