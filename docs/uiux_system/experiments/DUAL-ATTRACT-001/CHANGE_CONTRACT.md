# Attract vNext — Change Contract

작성 기준: 2026-09-20  
대상: `prototype/v2` Attract  
기준 release: **v2.2.1**  
상태: **IMPLEMENTATION AUTHORIZED FOR PROTOTYPES ONLY**

## 1. 변경 목적

v2.2.1의 data/interaction contract를 유지하면서, Expo Attract 화면의:
- 3초 first impression
- 관찰 task 명료성
- 작품/전시물 같은 visual identity
- Attract→Lab handoff

를 세 가지 독립 variant로 비교한다.

## 2. 허용 범위

변경 가능:
- Attract outer layout
- typography / headline / metadata hierarchy
- non-data background / frame / radial treatment
- CTA
- Attract-only transition/reveal
- Attract→Lab controls reveal
- Reference 설명 위치/위계

공유 component/state를 수정해야 하면 variant 밖의 Lab/Evidence에 회귀가 없는지 별도 검증한다.

## 3. 변경 금지

- waveform sample/value/geometry 조작
- time mapping 변경
- mV scale 의미 변경
- Input / selected Output / Reference source 변경
- Difference 의미 변경
- method result 변경
- 없는 metric/진단/성능 우월성 추가
- replay를 live처럼 표현
- perspective/morph로 waveform 자체를 왜곡
- v2.2.1 release asset overwrite

## 4. Variant 구조

권장:
```text
baseline
question-poster
signal-orbit
exhibition-handoff
```

가능하면 query/dev flag 또는 small variant config로 같은 runtime을 공유한다.

예:
```text
?attractVariant=baseline
?attractVariant=question
?attractVariant=orbit
?attractVariant=exhibition
```

실제 route/flag 방식은 현재 source 구조를 본 뒤 가장 작은 변경으로 선택한다.

세 화면을 별도 앱 복사본으로 만드는 것은 피한다.

## 5. Acceptance Criteria

### 공통
- baseline과 동일 waveform data
- 1920×1080에서 axis/unit/labels readable
- REPLAY/stored source 명확
- Reference semantics 명확
- console error 없음
- keyboard path 유지
- reduced-motion 동작

### V1 Question Poster
- headline이 plot을 압도하지 않음
- 3초 내 관찰 질문 이해 가능
- 결과 우월성 암시 없음

### V2 Signal Orbit
- first useful frame < 1 s 목표
- radial effect가 waveform 위로 올라오지 않음
- reduced-motion에서도 composition 성립
- cinematic treatment가 generic hero로 흐르지 않음

### V3 Exhibition Handoff
- CTA 전/후 transport time 유지
- selected method 유지
- no auto seek
- no replay restart
- Lab controls 등장 시 canvas 의미 불변
- bright Attract→Lab transition이 과도한 flash/discontinuity를 만들지 않음

## 6. Evidence Level 목표

구현 직후:
- L1 SOURCE
- L2 STATIC
- L3 INTERACTIVE

최종 선택 전:
- L4 TARGET PC

## 7. Rollback

- Attract variant flag를 baseline으로 되돌릴 수 있어야 함
- shared state/data contract 변경은 최소화
- prototype branch를 main에 바로 병합하지 않음
- final selection 전 release v2.2.1은 그대로 보존
