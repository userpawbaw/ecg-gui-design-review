> 후속 정식 지침: [21번 UI 수정 워크플로우 v1.0](21_ui_refinement_workflow_final.md). 아래는 2026-09-13 논의 초안 원문이며, 실제 운영에는 21번을 적용한다.

# ECG GUI UI refinement workflow — 시각 피드백·모델 운용 기록

작성: 2026-09-13  
상태: **논의 기록 / 차후 Astra High 기반 정식 UI 설계·수정 지침 작성용 입력 문서**

이 문서는 ECG Signal Studio의 UI를 반복적으로 수정하는 과정에서 발견한 비효율과, 앞으로의 UI 피드백·수정 작업을 더 정확하고 저비용으로 운영하기 위한 개선 방향을 기록한다.

이 문서 자체는 최종 UI 설계 매뉴얼이 아니다. 현재까지의 문제 인식과 운영 아이디어를 보존하고, 이후 Work에서 Astra High를 사용해 기존 `docs`의 UI 설계 원칙과 결합하여 정식 지침으로 발전시키는 것을 목적으로 한다.

---

## 1. 문제 상황

현재까지 UI 개선은 주로 다음 방식으로 진행했다.

1. 구현된 화면을 사용자가 확인한다.
2. 수정할 부분을 자연어로 길게 설명한다.
3. AI가 설명을 해석해 UI를 수정한다.
4. 결과 화면을 다시 확인한다.
5. 위치·크기·강조·정렬 등을 다시 말로 설명한다.
6. 이 과정을 반복한다.

이 방식은 초기 설계 단계에서는 유효했지만, 전체 구조가 이미 잡힌 뒤 세부 refinement 단계로 들어오면서 다음 문제가 커졌다.

- 화면의 정확한 위치를 말로 설명하는 비용이 크다.
- 사용자와 AI가 같은 요소를 지칭하고 있는지 확인하기 어렵다.
- 한 부분만 수정하려 했는데 AI가 주변 요소까지 재설계할 수 있다.
- 이미 결정된 디자인 원칙을 매 수정마다 다시 추론하게 되면 불필요한 reasoning 사용량이 증가한다.
- 작은 UI 조정에도 높은 추론 수준을 계속 사용하는 것은 비용 대비 효과가 낮다.
- 긴 컨텍스트 안에서 반복적으로 “어디를 어떻게 바꿀지” 설명하는 것이 실제 설계 판단보다 더 많은 대화량을 차지한다.

따라서 앞으로는 **설계 판단과 실제 UI 수정 작업을 분리하고, 세부 수정에는 시각적 지시를 적극적으로 사용**하는 방향을 검토한다.

---

## 2. 핵심 운영 원칙

향후 UI 수정 작업의 기본 구조는 다음으로 제안한다.

> **고추론 모델로 방향을 결정하고, 시각적으로 수정 위치를 명확히 지정한 뒤, 낮거나 중간 수준의 추론으로 실제 수정과 검증을 반복한다. 일정 횟수의 수정 후 다시 고추론 모델로 전체 일관성을 검토한다.**

즉 다음 세 역할을 분리한다.

### A. Design supervisor

전체 정보 구조, 사용 흐름, 강조 우선순위, 화면 간 일관성, Expo 목적과의 적합성을 검토한다.

주요 작업:

- 화면 전체의 정보 hierarchy 평가
- ECG denoising 연구 메시지와 화면 구조의 정합성 검토
- 새로운 화면·패널이 필요한지 판단
- 기존 설계 규칙의 충돌 여부 검토
- 여러 번의 국소 수정 후 전체 디자인 consistency 재점검

이 역할은 Astra High처럼 높은 추론 수준을 우선 고려한다.

### B. UI refinement executor

이미 결정된 설계 방향 안에서 실제 화면 요소를 수정한다.

주요 작업:

- panel width/height 조정
- spacing 변경
- typography 크기 조절
- 정렬 수정
- 버튼·control 위치 변경
- 특정 waveform 영역 확대
- 카드·배지·label의 크기와 배치 조정
- 지정된 범위의 HTML/CSS/JS 수정

이 역할은 Astra Low 또는 Medium 수준으로 충분한지 우선 검토한다.

### C. Verification reviewer

수정 이후 기능 및 시각적 회귀를 확인한다.

주요 작업:

- 변경 대상 이외 영역이 불필요하게 변하지 않았는지 확인
- 기존 interaction 유지 여부 확인
- waveform, selector, playback 등의 기능 회귀 확인
- layout overflow, clipping, overlap 확인
- 변경 전/후 screenshot 비교

필요한 범위에 따라 Low~Medium을 기본으로 사용하고, 여러 변경이 누적된 시점에 High 검토를 추가한다.

---

## 3. 텍스트 설명보다 시각적 annotation을 우선한다

세부 UI 수정 단계에서는 긴 자연어 설명만 사용하는 방식보다 **현재 화면의 screenshot에 수정 위치를 직접 표시**하는 방식을 기본 후보로 둔다.

권장 방식:

1. 현재 UI 화면을 screenshot으로 캡처한다.
2. 수정 대상에 `①`, `②`, `③` 또는 사각형·화살표 등으로 표시한다.
3. 각 표시마다 원하는 변경을 짧게 작성한다.
4. 이번 수정에서 변경하면 안 되는 영역도 함께 명시한다.
5. AI는 표시된 범위 중심으로 수정하고 기능 회귀를 확인한다.

예시:

```text
첨부 이미지는 현재 화면이다.
빨간색 ①~④만 이번 수정 대상이다.

① Method panel 폭을 약 20% 축소
② 확보된 폭만큼 ECG waveform 영역 확대
③ header와 graph 사이 vertical spacing 축소
④ 버튼 크기는 유지하고 우측 정렬

이번 수정에서는 다음은 변경하지 않는다.
- 전체 색상 체계
- typography family
- 다른 탭의 layout
- waveform rendering logic

수정 후 기존 interaction과 responsive layout이 유지되는지 확인한다.
```

이 방식의 목적은 AI에게 디자인을 새로 생각하게 하는 것이 아니라, **사용자가 이미 발견한 문제를 오해 없이 전달하는 것**이다.

---

## 4. 수정 요청에는 항상 변경 범위를 함께 적는다

시각적 annotation만으로도 AI가 주변 영역을 함께 수정할 수 있으므로, 각 요청에는 최소한 다음 세 가지를 포함하는 것을 권장한다.

### 변경 대상

어느 요소를 어떻게 바꿀지 명시한다.

### 변경 금지 영역

이번 iteration에서 건드리지 않을 요소를 명시한다.

예:

- color system 변경 금지
- 다른 탭 변경 금지
- chart data mapping 변경 금지
- animation timing 변경 금지

### 유지 조건

기존 기능 중 반드시 보존해야 할 동작을 명시한다.

예:

- method selector 선택 상태 유지
- 같은 source/time range 유지
- waveform shared scale 유지
- keyboard interaction 유지
- playback 상태 전환 유지

이 구조는 국소 수정이 전체 설계를 흔드는 것을 방지하기 위한 guardrail로 사용한다.

---

## 5. 모델·추론 수준 운용 가설

현재 논의 기준으로는 모든 UI 작업을 Astra High로 고정하는 방식보다, 작업 성격에 따라 reasoning 수준을 분리하는 것이 더 효율적일 가능성이 높다.

초기 운영안은 다음과 같다.

| 작업 성격 | 우선 고려 수준 |
|---|---|
| 단순 spacing, 정렬, 크기, 문구 수정 | Astra Low |
| 화면 하나의 layout refinement | Astra Low~Medium |
| 여러 component가 연동되는 수정 | Astra Medium |
| 새로운 탭·정보 구조·interaction 설계 | Astra Medium~High |
| 전체 UI/UX 비판 검토 | Astra High |
| 기존 설계 원칙과 현재 구현의 충돌 분석 | Astra High |
| 여러 차례 국소 수정 후 전체 consistency audit | Astra High |

핵심은 **High reasoning을 실제 설계 판단에 집중시키고, 이미 결정된 내용을 구현하는 반복 작업에는 필요한 만큼만 reasoning을 사용하는 것**이다.

현재 프로젝트에 적용할 후보 운영 방식:

> **Astra High로 방향 결정 → Astra Low/Medium으로 여러 번 수정·검증 → Astra High로 전체 리뷰**

Astra High를 매 iteration에 사용하는 방식은 기본값으로 두지 않는다.

---

## 6. 모델 전환과 context 비용에 대한 주의

“모델을 바꿀 때마다 전체 context를 다시 로딩하므로 모델을 고정하는 것이 반드시 더 효율적이다”라는 주장은 현재 이 문서에서 확정 사실로 취급하지 않는다.

차후 정식 지침을 만들 때 다음을 별도로 검증한다.

- 모델 변경 자체가 Work 사용량에 어떤 영향을 주는가.
- 긴 대화·많은 파일·높은 reasoning 수준 중 실제 비용에 가장 큰 영향을 주는 요소는 무엇인가.
- 같은 Astra에서 reasoning 수준만 변경하는 방식이 실제로 가장 효율적인가.
- UI 수정처럼 반복 작업이 많은 경우 context 관리 전략을 별도로 둘 필요가 있는가.

검증 전까지의 운영상 판단은 다음 정도로 제한한다.

> 모델을 고정하는 이유를 “context 재로딩 방지”라고 단정하지 않는다. 대신 동일한 설계 기준을 유지하면서 reasoning 수준만 필요한 만큼 조절하는 방식은 실험할 가치가 있다.

---

## 7. visual editor / click-to-edit 방식의 활용

Claude Design처럼 실제 UI 화면을 보여주고 특정 요소를 직접 선택하거나 클릭하여 수정 지시를 주는 방식은 세부 refinement 단계에서 높은 효율을 기대할 수 있다.

특히 다음 작업에 적합하다.

- spacing
- card size
- panel width
- alignment
- typography
- button placement
- visual hierarchy
- component emphasis

자연어만 사용할 때 발생하는 “어느 요소를 말하는가”라는 ambiguity를 크게 줄일 수 있기 때문이다.

다만 이 프로젝트에서는 visual editor가 전체 구현 도구를 대체하는 것으로 보지 않는다.

ECG Signal Studio에는 다음과 같은 실제 application logic가 존재한다.

- waveform rendering
- sweep / scroll playback
- source/time synchronization
- noise/SNR/method state
- denoising result selection
- reference overlay
- metric/evidence 연결
- data loading
- performance와 실제 실행 환경

따라서 visual editor는 **시각적 refinement layer**, Work/Codex/실제 코드 작업은 **application implementation layer**로 분리하는 방식을 우선 검토한다.

---

## 8. 도구별 역할 분리 후보

향후 workflow는 다음과 같이 역할을 나눌 수 있다.

### Visual editor 또는 annotated screenshot

사용 목적:

- “어디를 바꿀지” 전달
- 빠른 visual iteration
- alignment/spacing/size 검토

### Work — Astra Low/Medium

사용 목적:

- 지정된 범위 코드 수정
- HTML/CSS/JS 구현
- 실행 및 회귀 검사
- screenshot 생성

### Work — Astra High

사용 목적:

- 디자인 전략 재검토
- 기존 `docs`와 실제 화면의 불일치 분석
- 여러 iteration 누적으로 생긴 local optimization 탐지
- 차후 정식 UI 설계·수정 매뉴얼 작성

즉 시각적 수정 도구와 Work를 경쟁 관계로 두지 않고, **선택/표시는 시각 도구, 구현/검증은 코드 작업, 전체 판단은 고추론 리뷰**로 역할을 나눈다.

---

## 9. 권장 refinement cycle

현재 논의를 기반으로 한 임시 cycle은 다음과 같다.

### Step 1 — 문제 발견

현재 화면에서 사용자가 불편하거나 어색한 지점을 확인한다.

### Step 2 — 시각 표시

screenshot에 번호·박스·화살표 등으로 수정 대상과 범위를 표시한다.

### Step 3 — local edit

Low/Medium reasoning으로 표시된 부분만 수정한다.

### Step 4 — regression check

변경하지 않기로 한 영역과 기존 interaction이 유지되는지 확인한다.

### Step 5 — visual compare

수정 전/후 screenshot을 비교하고 추가 refinement가 필요한지 결정한다.

### Step 6 — 반복

작은 변경은 같은 방식으로 여러 번 반복한다.

### Step 7 — global audit

여러 local edit가 누적되면 Astra High로 전체 화면 및 설계 원칙을 다시 검토한다.

검토 질문 예:

- 국소적으로 좋아졌지만 전체 hierarchy가 깨진 곳은 없는가?
- 같은 기능을 가진 component의 visual language가 달라지지 않았는가?
- Expo에서 강조해야 할 ECG waveform보다 control이 더 강해지지 않았는가?
- 기존 `05`, `08`, `12`, `13`, `15` 등의 설계 원칙과 충돌하지 않는가?
- 사용자가 실제로 수행해야 하는 핵심 interaction이 더 명확해졌는가?

---

## 10. 변경 기록 형식 제안

세부 UI 변경은 대화에만 남기지 않고 간단한 변경 이력을 유지하는 방안을 검토한다.

예:

```text
UI-027
화면: Real-time / Signal Inspector
대상: Method panel
변경: width 280px → 220px
이유: waveform visual priority 증가
유지 조건: selector 기능·method state 유지
검증: overflow 없음 / interaction 유지
상태: accepted
```

이 기록은 모든 pixel 변경을 문서화하기 위한 것이 아니다.

다음에 해당하는 변경을 우선 기록한다.

- 화면 hierarchy를 바꾼 변경
- 여러 component에 영향을 주는 변경
- 이후 다시 되돌릴 가능성이 있는 결정
- 사용자 피드백에 의해 방향이 바뀐 변경
- 기존 설계 문서와 다른 선택을 한 변경

이렇게 하면 이후 AI가 긴 채팅 기록 대신 **현재 승인된 UI decision의 맥락**을 빠르게 이해할 수 있다.

---

## 11. 정식 지침으로 발전시킬 때의 과제

차후 Astra High 작업에서는 이 문서를 그대로 규칙으로 확정하지 말고, 기존 저장소 문서와 현재 구현을 함께 검토하여 정식 지침으로 재구성한다.

특히 다음을 수행한다.

1. `08_manual_addendum.md`의 재사용 GUI 원칙과 통합한다.
2. `13_expo_gui_plan_v2_2_final.md`의 전시 경험·정보 hierarchy와 연결한다.
3. `15_wireframe_review.md` 및 실제 구현 화면에서 refinement가 필요한 유형을 분류한다.
4. visual annotation 요청 템플릿을 표준화한다.
5. 변경 금지 범위와 유지 조건의 표준 필드를 정한다.
6. Astra Low/Medium/High 선택 기준을 실제 사례로 검증한다.
7. local edit 이후 global audit를 언제 수행할지 trigger를 정한다.
8. UI 변경 로그를 별도 문서로 유지할지 `WORKLOG.md`와 통합할지 결정한다.
9. visual editor를 사용할 경우 코드 기준선과 동기화하는 절차를 정의한다.
10. 모델 변경/context 비용에 관한 불확실한 가정은 공식 정보와 실제 Work 사용 경험으로 검증한 뒤 반영한다.

---

## 12. 현재 임시 결론

현재 단계에서의 작업 방향은 다음으로 요약한다.

> **초기 설계처럼 모든 것을 말로 설명하고 매번 높은 추론으로 재설계하는 단계는 지나갔다. 앞으로는 화면에 직접 수정 범위를 표시하고, 작은 변경은 낮거나 중간 수준의 추론으로 빠르게 반복하며, 중요한 설계 판단과 누적 변경의 전체 검토에만 높은 추론을 집중하는 방향을 우선 검토한다.**

또한 click-to-edit/visual editor 방식은 이 프로젝트의 전체 구현을 대체하기보다, **사용자가 원하는 시각적 변경 위치를 정확히 전달하는 인터페이스**로 활용하는 것이 적절하다.

이 문서는 이후 Work에서 Astra High에 입력하여, 프로젝트 전체의 UI 설계 원칙·작업 절차·검증 규칙을 포함하는 정식 refinement guideline으로 발전시키기 위한 기록으로 보존한다.
