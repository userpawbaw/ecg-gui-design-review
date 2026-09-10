# ECG Signal Studio — Expo·GUI v2.2 Ideation Framework

작성: 2026-09-11  
상태: **아이디어 검토본 / v2.1 구현 기준선 유지 / 코드 미수정**

이 문서는 `12_expo_gui_plan_v2_1_final.md`를 기준선으로 유지한 채, **UI/UX 설계 전문가**와 **Expo 발표·시연 기획자**의 시각에서 시각 완성도와 전달력을 높일 아이디어를 검토한다. v2.2는 기능 추가 자체가 목적이 아니라, 이미 확정된 기능이 더 잘 보이고 더 쉽게 조작되며 더 짧은 시간 안에 의미를 전달하도록 다듬는 단계다.

---

## 1. v2.2의 판단 기준

v2.2에서 새 아이디어를 채택하려면 다음 질문을 통과해야 한다.

1. 처음 보는 사람이 설명 없이도 다음 행동을 예측할 수 있는가?
2. 파형이 여전히 화면의 주인공인가?
3. 같은 시간·같은 데이터 비교라는 연구적 정합성을 해치지 않는가?
4. 시각적 효과가 denoising 결과를 실제보다 좋아 보이게 만들지 않는가?
5. 발표자의 손동작과 말의 순서를 줄여주는가?
6. 1 m 거리와 짧은 체류시간에서도 핵심이 보이는가?
7. 터치/키보드/마우스 어느 경로에서도 핵심 기능에 접근 가능한가?
8. loading/error/미지원 상태에서도 완성된 제품처럼 보이는가?

---

# Part A. UI/UX 설계 전문가 관점

## 2. 시선 계층: 조건 → 파형 → 방법 → 근거

현재 UI의 가장 중요한 refinement는 정보의 양을 늘리는 것이 아니라 **시선 이동 순서를 고정하는 것**이다.

권장 우선순위:

- 1순위: waveform
- 2순위: 현재 조건과 현재 method
- 3순위: 재생/비교 조작
- 4순위: method explanation
- 5순위: metric/provenance

### 제안

- Signal Inspector에서 waveform 영역을 viewport의 약 65–72% 수준까지 확보하는 것을 시각 목표로 둔다.
- 상단 condition label은 한 줄 요약으로 압축한다. 예: `D1 · Muscle artifact · −5 dB · 02:14.200`.
- 기능이 많아져도 모든 제어를 동일한 버튼 스타일로 만들지 않는다. Primary action, mode switch, secondary detail을 명확히 계층화한다.
- metric card는 waveform보다 높은 대비를 갖지 않도록 한다.

### 검수 질문

화면을 2초만 보고 눈을 돌렸을 때 기억나는 것이 파형인가, 버튼인가? 버튼이 더 기억난다면 밀도가 과하다.

---

## 3. Typography와 거리 가독성

Expo에서는 노트북 앞 사용자와 1 m 거리 관람객이 동시에 존재한다.

### 초기 목표

- 주요 화면 제목: 24–30 px
- 현재 condition/method: 16–20 px
- 핵심 metric: 20–24 px
- 주요 control: 14–16 px
- 부가 metadata: 11–13 px

작은 글씨를 전부 키우기보다 **Expo mode에서 보이지 않아도 되는 metadata를 접는 것**을 우선한다.

Method ID `M08` 같은 정보는 연구자에게는 중요하지만 관람객에게는 `Wavelet U-Net`보다 우선하지 않는다. 따라서 Inspector compact mode에서는 사람이 읽는 이름을 우선하고 ID는 secondary text로 둔다.

---

## 4. Condition control ergonomics

현재 axis/noise/SNR 선택은 정확하지만 Expo에서는 탐색 비용을 더 줄일 수 있다.

### Noise

`Recommended` 영역을 두어 3개 정도의 대표 조건을 chip으로 빠르게 선택하게 한다.

예:

- Mixed
- Muscle artifact
- Power-line

전체 7종은 `All noise types`에서 펼친다.

### SNR

수치 자체는 유지한다. 보조 의미만 추가한다.

예:

- −5 dB · Severe
- 5 dB · Moderate
- 15 dB · Mild

단, `Severe/Mild`는 프로젝트 내부 설명용이며 임상 severity처럼 보이지 않게 한다.

SNR 선택 시 waveform이 준비되기 전에 숫자/label만 먼저 바뀌어 옛 파형과 새 조건이 섞여 보이지 않도록 **atomic state swap**을 유지한다.

---

## 5. Method Explorer refinement

v2.1의 3단계 정보 계층을 실제 시각 패턴으로 구체화한다.

### Compact card

- readable name
- family badge
- one-line purpose

예:

`Wavelet U-Net`  `HYBRID`
`Wavelet subband를 입력으로 사용하는 학습 기반 방법`

### Selected detail

세 문장 구조를 권장한다.

1. **How it works** — 원리
2. **Why it is here** — 이번 비교에서의 역할
3. **Watch for** — 왜곡/한계

사용자에게 가장 먼저 필요한 것은 논문식 설명이 아니라 “이 방법을 왜 넣었나”이므로 `Why it is here`를 빠르게 읽을 수 있게 한다.

### Hover intent

단순 mouseenter 즉시 preview보다 다음 규칙을 검토한다.

- pointer entry 후 약 100–150 ms intent delay
- pointer가 카드 내부에서 안정적으로 머물 때 preview
- 빠르게 목록을 통과하면 점선이 연쇄적으로 번쩍이지 않음
- keyboard focus는 즉시 preview 가능

---

## 6. Timeline을 '전체 세션 지도'로 만든다

600초 데이터에서는 timeline이 단순한 재생 scrubber가 아니라 **현재 위치·북마크·고정 구간의 관계를 보여주는 지도**가 된다.

### 제안 구조

- 전체 10분을 한 줄로 표시
- 현재 2.5/5/10초 window를 작은 viewport block으로 표시
- 현재 playhead는 별도 thin marker
- 발표 bookmark는 이름 없는 작은 marker + hover/focus label
- Inspect 고정 시 viewport block에 고정 상태 표시

Timeline drag 중에는 waveform을 매 pointer event마다 무리하게 재로딩하기보다 preview time label을 먼저 보여주고 적절한 rate로 redraw한다.

### 중요 원칙

Bookmark는 '좋은 결과' 표시가 아니다. 발표 진행용 위치 marker다. 색을 success green으로 만들지 않는다.

---

## 7. Explore ↔ Inspect 전환의 인지성

두 상태가 기능적으로만 다르고 시각적으로 똑같으면 사용자가 자신이 어디 있는지 모른다.

### 권장

Explore:
`REPLAY · SWEEP · 1×`

Inspect:
`INSPECT · 02:14.000–02:19.000 · FROZEN RANGE`

레이아웃을 크게 뒤집지 않고 상단 status rail, timeline 상태, transport enable/disable 정도로 구분한다.

Inspect 진입 시 모든 제어가 멈춘 것처럼 회색이 되면 안 된다. method hover/click, Reference strength, Difference Lens 등 Inspect용 조작은 오히려 활성 상태가 명확해야 한다.

---

## 8. Difference Lens refinement

Difference Lens는 기술적으로 좋은 기능이지만 처음 보는 관람객에게는 의미가 어렵다.

### 권장 표현

제목:
`Difference from Reference`

보조 문구:
`0에 가까울수록 현재 출력이 Reference와 비슷합니다.`

### 시각 규칙

- zero baseline은 확실하게 표시
- residual waveform은 main ECG보다 얇고 낮은 대비
- ×3/×5 display gain은 작은 badge로 상시 노출
- threshold를 넘는 부분을 자동으로 '오류'라고 판정하지 않음

### 추가 아이디어

`Difference hotspot marker`를 시험할 수 있다. 일정 residual magnitude 이상의 local peak 위치에 작은 중립 marker를 찍어 사용자가 main waveform의 해당 지점을 찾기 쉽게 한다. 단, threshold는 진단/합격 판정이 아니라 navigation aid로만 사용한다.

---

## 9. 2행 ↔ 3행 전환

Pinned comparison으로 세 번째 행이 생길 때 화면 전체가 갑자기 압축되면 사용자 경험이 나빠진다.

### 두 안

**안 A — Adaptive row height**  
세 행 모두 줄이되 최소 plot height를 보장한다.

**안 B — Comparison drawer**  
기본 두 행의 높이를 유지하고 pinned comparison을 아래 drawer처럼 추가하여 필요하면 scroll한다.

### v2.2 권고 후보

1920×1080에서는 A, 1366×768 이하에서는 B로 반응형 전환하는 방식을 우선 검토한다.

행 추가 animation은 height morph를 길게 하지 않고 약 160–200 ms 범위에서 공간 관계만 알려준다.

---

## 10. Loading / empty / stale / error state

Expo 완성도는 정상 상태보다 실패 상태에서 더 쉽게 무너진다.

### 상태 계약

| 상태 | 기존 파형 | 사용자 메시지 | 권장 동작 |
|---|---|---|---|
| next chunk loading | 유지 | 작은 loading indicator | 재생 가능 범위 내 계속 진행 |
| method preview loading | selected 유지 | `Preview loading…` | 후보만 나중에 등장 |
| selected method loading | 이전 결과를 새 방법처럼 보이지 않음 | skeleton/명확한 pending | ready 후 atomic swap |
| method output unavailable | reference/noisy 유지 | `Stored output unavailable` | 다른 방법 선택 가능 |
| chunk failure | 마지막 검증된 frame 유지 | retry + condition info | silent fallback 금지 |
| stale response | 표시하지 않음 | 보통 메시지 불필요 | request id로 폐기 |

에러 메시지는 개발자 stack trace 대신 record/condition/time과 다음 행동을 알려준다.

---

# Part B. Expo 발표·시연 기획자 관점

## 11. 3초 / 15초 / 60초 기억 구조

관람객의 체류시간에 따라 화면이 전달하는 메시지가 달라야 한다.

### 3초

`잡음이 있는 ECG가 처리 후 훨씬 읽기 쉬워지는 장면`

설명 없이 noisy/output 두 행과 움직임만으로 이해되어야 한다.

### 15초

`같은 ECG라도 잡음과 처리 방법에 따라 결과가 달라진다.`

noise/SNR 또는 method를 한 번 바꾸는 체험을 제공한다.

### 60초

`우리는 화면 한 장이 아니라 Reference, 10분 session, 전체 experiment까지 구분해 평가했다.`

Inspect + Difference + evidence로 연구 깊이를 보여준다.

---

## 12. 대표 시나리오 3개

대표 북마크는 숫자 조합이 아니라 **이야기 이름**을 사용한다.

### Scene A — 잡음이 심한 상황

목적: denoising 효과가 시각적으로 즉시 보이는 장면.

후보: mixed 또는 muscle artifact의 낮은 SNR.

### Scene B — 단순 DSP도 강한 상황

목적: 프로젝트가 DL 홍보 데모가 아니라 비교 연구라는 점을 보여줌.

후보: PLI 등 classical method가 강한 조건.

### Scene C — 처리할수록 손해가 생길 수 있는 상황

목적: 입력이 비교적 깨끗하면 추가 denoising이 morphology를 건드릴 수 있다는 점을 보여줌.

후보는 600초 결과 생성 후 선정한다. Scene 선정 기준은 수치를 본 뒤 바꾸지 않도록 먼저 기록한다.

---

## 13. 관람객에게 맡길 조작은 하나씩

Expo에서 모든 control을 설명하지 않는다.

권장 참여 방식:

- 첫 관람객: `잡음 세기를 한번 바꿔보세요.`
- 두 번째 상호작용: `이번엔 방법 하나를 골라보세요.`

한 번의 조작 직후 화면 변화가 1초 안에 이해되어야 한다.

`이 버튼은 Sweep이고 이것은 Scroll이고...` 식 기능 설명부터 시작하지 않는다. 기능명은 관람객이 궁금해한 뒤 설명한다.

---

## 14. 발표 북마크를 Scenario Launcher로

내부 상태는 axis/record/noise/SNR/time/method/window를 저장하지만 발표자에게는 아래처럼 보인다.

- `01 · 심한 잡음에서 복원`
- `02 · 고전 필터가 강한 경우`
- `03 · 깨끗한 입력의 trade-off`

클릭하면 해당 장면으로 이동한 뒤 상단에 `Prepared demo scene`을 잠깐 표시한다. 실제 생방송이나 무작위 샘플처럼 표현하지 않는다.

---

## 15. Attract Mode

단순 무한 Sweep 대신 짧은 narrative cycle을 검토한다.

초기 아이디어: 약 10–12초.

- 0–4초: noisy + selected output Sweep
- 4–8초: condition label을 강조하며 같은 장면 유지
- 8–10초: `Same ECG · Different denoising methods` 같은 짧은 설명
- 이후 restart

파형 자체를 cross-morph하지 않는다. 조건 전환 시 실제 waveform은 명확한 cut/atomic swap으로 바꾼다.

사람이 조작하면 Attract는 즉시 종료한다.

---

## 16. Beat Focus 후보

이전 프로젝트에서 강점이 있었던 한 박동 확대 아이디어를 Inspector 내부 기능으로 재도입할 수 있다.

### 목적

P/QRS/T morphology를 크게 보여주어 denoising이 작은 형상을 얼마나 유지했는지 설명한다.

### 구현 전제

- annotation이 있으면 selected beat index를 활용
- annotation이 없으면 `Selected window`로 표현
- 검증 없이 Normal/PVC/AFIB 같은 임상 라벨을 자동 부여하지 않음

### 화면

main Inspector의 현재 고정 구간 아래 또는 side panel에서 0.8–1.2초 확대.

Reference / selected / optional comparison을 동일 축으로 overlay한다.

Beat Focus는 v2.2에서 **채택 후보**로 두고, Difference Lens와 정보가 중복되는지 mockup에서 비교한다.

---

## 17. 발표 멘트와 UI를 연결한다

대표 45–60초 스크립트 구조를 UI 상태와 1:1로 연결한다.

| 발표 내용 | UI 행동 |
|---|---|
| `회색이 기준 파형이고 위는 잡음이 섞인 입력입니다.` | Reference legend 강조 |
| `같은 시간에서 처리 결과를 비교합니다.` | selected output 행 강조 |
| `잡음 세기를 바꿔보겠습니다.` | SNR 변경, time 유지 |
| `방법만 바꾸면 같은 박동에서 결과만 달라집니다.` | method hover/click |
| `눈으로 비슷하면 차이를 확대해 볼 수 있습니다.` | Inspect + Difference Lens |
| `이 장면만 좋은지 전체 10분도 확인합니다.` | Session metric 표시 |
| `그리고 전체 테스트 기록에서도 따로 집계했습니다.` | Evidence workspace 이동 |

UI는 발표자가 이 순서를 잊지 않게 해야 한다. 별도 presenter notes가 없어도 scenario title과 next-step hint로 진행 가능하게 만드는 방안을 검토한다.

---

## 18. 실측 AFE와 Replay의 연결

실측 화면과 benchmark replay가 너무 다른 앱처럼 보이지 않도록 visual language는 공유한다.

공유:

- waveform grid
- typography
- transport 위치
- method name style

명확히 구분:

- LIVE / REPLAY badge
- Reference 존재 여부
- metric scope
- causal/offline method 가능 여부

실측에는 ground truth가 없으므로 Reference/ΔSNR을 그대로 보여주지 않는다. 대신 device/source status와 latency 같은 실제 관측 가능한 정보만 표시한다.

---

# Part C. v2.2 우선순위 후보

## 19. 높은 우선순위

v2.1 구현 전에 wireframe 수준에서 먼저 확정할 가치가 큰 항목:

- Signal Inspector의 실제 1920×1080 정보 밀도
- condition control의 quick presets
- Method Explorer compact/detail hierarchy
- timeline + bookmark 표시 방식
- Explore/Inspect visual state
- Difference Lens 설명 방식
- loading/error states
- Scenario Launcher 3개

## 20. 중간 우선순위

구현 prototype을 본 뒤 결정할 항목:

- 2행/3행 responsive transition
- residual hotspot markers
- Beat Focus
- Attract narrative cycle
- presentation next-step hint

## 21. 보류

명확한 이득이 확인될 때만 검토:

- 별도 OS window
- 다중 모니터 presenter mode
- sound/beep
- 게임화 score
- AI winner animation
- 자동 pathology recognition
- 복잡한 dark/light theme 선택

---

## 22. v2.2 다음 산출물 제안

다음 회의에서 아이디어를 바로 코드로 옮기지 않고 **화면 수준으로 검증**한다.

권장 산출물은 다음 네 장이다.

1. `Signal Inspector — Explore / 1920×1080`
2. `Signal Inspector — Inspect + Difference Lens`
3. `Signal Inspector — 3-row pinned comparison`
4. `Attract / Scenario Launcher`

각 화면마다 다음을 적는다.

- 사용자의 첫 시선
- primary action
- 숨긴 정보
- 발표자가 말할 한 문장
- 1 m 거리에서 읽혀야 하는 요소
- 상태 전환 전/후

이 네 장을 비교한 뒤 v2.2 FINAL에서 수치·배치·interaction을 확정하고 구현으로 넘어간다.

---

## 23. 현재 판단

v2.1의 기능 범위는 충분하다. v2.2의 가장 큰 품질 향상 가능성은 **새 기능 추가가 아니라 정보 밀도·상태 표현·timeline·method explanation·실패 상태·발표 시나리오를 하나의 일관된 경험으로 묶는 것**에 있다.

따라서 다음 단계에서는 코드보다 먼저 네 가지 화면 wireframe을 확정하고, UI/UX 전문가 관점과 Expo 기획 관점에서 각각 비판한 뒤 하나의 최종 구조로 합치는 것을 권장한다.
