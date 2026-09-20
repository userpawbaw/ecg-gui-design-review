# DUAL-ATTRACT-001 — A/B Cross Review

작성 기준: 2026-09-20  
상태: **CROSS_REVIEW_COMPLETE / USER_VISUAL_ALIGNMENT_PENDING / IMPLEMENTATION_NOT_AUTHORIZED**  
기준 baseline: `ecb5e7c63279035ee5eac866237731987e3e6c7e`  
대상: `prototype/v2` Attract / HIGH Creative Freedom Zone

## 1. 목적과 비교 원칙

Director A와 B의 first pass가 모두 동결된 뒤 처음으로 결과를 함께 비교한다.

이번 비교의 목적은 "A와 B 중 어느 Director가 더 낫나"를 고르는 것이 아니다.

- A는 **명시적 외부 reference → viewing instruction → principle → ECG translation**으로 방향을 만든다.
- B는 **Superdesign-native search/synthesis → Direction Card → actual draft**로 방향을 만든다.

B가 실제 draft를 갖는다는 이유로 A보다 높은 디자인 품질이 증명된 것으로 보지 않는다. A의 live/reference evidence와 B의 rendered draft evidence는 서로 다른 종류다.

공통 hard constraints:
- waveform geometry 불변
- 동일 time/mV 축
- Input / selected Output / Reference 의미 불변
- REPLAY/stored source truth 유지
- 없는 live device, metric, diagnosis, 성능 우월성 발명 금지
- perspective/morph로 signal meaning 왜곡 금지

## 2. B rendered visual double-check

2026-09-20 Chat에서 B01/B02 Superdesign preview를 실제 browser automation으로 다시 열어 desktop rendered composition을 관찰했다.

### B01 — Signal Orbit

관찰:
- left metadata / right dominant plot의 2-column layout
- 우측 plot container가 화면의 주 시각물
- 동일 축의 Input/Output stacked plots
- dark grid에서 mV/time tick contrast가 충분히 보임
- 하단 green CTA가 강하게 보임
- stored 10 s / no actual device wording이 명시적
- radial/orbit 계열 reveal hook은 source/class에서 보이지만 static capture만으로 timing 품질은 확정하지 않음

주요 risk:
- radial atmosphere가 scientific exhibit보다 generic cinematic hero로 기울 수 있음
- legend/metadata가 약간 verbose
- arrival effect는 reduced-motion과 실제 timing QA 필요

### B02 — Exhibition Grid

관찰:
- left 3/12 metadata rail + right 9/12 waveform stage
- bright editorial/exhibition layout
- right plot가 여전히 dominant
- shared time 0–10 s가 명시적
- full-width teal CTA가 B01보다 구조적으로 더 강함
- Stored Loop / Real Device Session 구분이 명료
- plot/legend 주변 정보가 B01보다 더 dense

주요 risk:
- large editorial type / rail density가 plot 면적을 침범할 수 있음
- landing/exhibition-poster 문법이 application continuity를 약화할 수 있음
- custom cursor/interaction hint는 실제 usability를 별도 확인해야 함

이 관찰은 rendered desktop preview의 visual check이며 target-PC L4 검증이 아니다.

## 3. Candidate별 Cross Review

### A01 — 두 줄의 전시물

**판정: TUNE / FALLBACK**

강점:
- 동일 시각 비교를 가장 직접적으로 보존
- 구현 위험이 낮고 plot readability가 높음
- Juxtapose의 aligned-comparison principle이 ECG task와 잘 맞음

약점:
- 현재 v2.2.1에서 visual identity가 충분히 달라졌다고 느끼기 어려울 수 있음
- "확대된 좋은 dashboard" 수준에 머물 위험

용도:
- 다른 후보가 과도할 때의 안전한 fallback
- 모든 후보의 aligned-comparison guardrail

### A02 — 10초 관측창

**판정: DEFER — Attract primary보다 Inspect/Evidence 보조에 더 적합**

강점:
- 현재 10초가 전체 record의 일부라는 과학적 맥락
- overview→detail 개념이 연구 UI와 잘 맞음

약점:
- 첫 3초에 새 정보축을 하나 더 추가
- record duration이 짧거나 전체 길이의 의미가 약할 때 정보 이득이 낮음
- Attract보다 Lab/Evidence/Inspect에서 더 유용할 가능성

결론:
- 아이디어 폐기 아님
- 이번 Attract vNext의 primary direction에서는 제외

### A03 — 읽는 순서가 있는 무대

**판정: REJECT for current Attract / principle may be reused later**

강점:
- 설명의 attention sequencing이 명확
- waveform을 건드리지 않고 narration만 움직임

약점:
- 전시 관람객은 0초에 입장한다는 보장이 없음
- 0–3 / 3–6 / 6–10초 순서가 설명 단계 또는 processing stage로 오해될 가능성
- reduced-motion에서 결국 static copy로 돌아가면 핵심 차별성이 약함

결론:
- 이번 Attract 후보에서는 제외
- Evidence narrative나 guided demo에는 재사용 가능

### A04 — 질문 포스터

**판정: KEEP**

강점:
- 멀리서도 무엇을 관찰할지 즉시 제시
- "성능 좋음"을 주장하지 않고 visitor task를 만든다
- 구현 비용이 낮고 visual identity 변화가 명확
- editorial exhibit language가 Expo 맥락과 잘 맞음

위험:
- 좌측 25% headline이 plot를 잠식할 수 있음
- 질문 문구가 너무 설명적/교육용이면 premium feeling이 약해질 수 있음

필수 Tune:
- 1920×1080에서 plot minimum width/axis readability 보장
- 질문은 1개, 보조 문장은 1개 이하
- 결과 우월성 암시 금지

### A05 — 같은 시각, 내 차례

**판정: KEEP as interaction principle / visual shell 필요**

강점:
- Attract→Lab handoff를 실제 user journey로 바꿈
- endAttract의 same-time continuity와 직접 연결
- "구경"에서 "내가 조작"으로 전환하는 Expo interaction 가치가 큼

약점:
- standalone visual direction이라기보다 interaction/handoff rule에 가까움
- 현재 any-pointer/key 종료 동작과 CTA가 충돌할 수 있음

결론:
- 단독 visual variant보다 B02 또는 다른 shell과 결합 가치가 큼

### A06 — 회색 기준의 갤러리

**판정: KEEP as semantic rule / standalone variant는 TUNE**

강점:
- "더 매끈한 선 = 더 좋음"이라는 잘못된 인상을 줄임
- Reference의 의미를 관람 task의 중심으로 끌어옴
- data integrity 관점에서 매우 강한 아이디어

약점:
- standalone visual identity 변화는 제한적
- Reference가 절대 임상 정답처럼 보일 위험

결론:
- shortlist 후보 전체에 적용할 **semantic tune principle**로 승격
- 공통 FE 처리 출처를 함께 노출

### B01 — Signal Orbit

**판정: KEEP / TUNE**

강점:
- 현재 후보 중 가장 강한 cinematic/high-impact 방향
- 실제 rendered preview에서 plot가 여전히 dominant
- dark stage가 기존 palette와 연결되기 쉬움
- metadata와 plot hierarchy가 명확

위험:
- radial glow/reveal이 generic portfolio hero로 보일 수 있음
- effect timing이 길면 3초 이해를 방해
- B05를 reject한 이유와 가까운 "cinematic surface 과잉"이 재발할 수 있음

필수 Tune:
- orbit/radial motif는 plot 밖에서만
- first useful frame < 1 s 목표
- reduced-motion에서 visual hierarchy가 그대로 남아야 함
- CTA copy를 더 짧게 검토

### B02 — Exhibition Grid

**판정: KEEP / TUNE**

강점:
- 실제 rendered preview에서 public/exhibition feeling이 가장 명확
- bright editorial grid가 B01과 충분히 다른 hypothesis
- full-width CTA와 metadata rail이 관람→행동 구조에 적합
- same-axis/data truth 보존

위험:
- dense metadata가 plot attention과 경쟁
- bright art direction이 현재 전체 app과 context switch를 크게 만들 수 있음
- landing-page marketing 문법으로 흐를 위험

필수 Tune:
- left rail 정보량 30–40% 감축 후보
- heading/CTA를 연구 관찰 언어로 유지
- Lab 진입 시 style continuity 설계 필요

### B03 — Archive Scan

**판정: REJECT 유지**

이유:
- B02와 같은 exhibition/technical territory
- monospace density/scan effects가 추가 정보보다 noise를 더함

### B04 — Signal Corridor

**판정: REJECT 유지**

이유:
- perspective/Z motion이 time/amplitude alignment를 오해시킬 hard risk
- 첫 이해를 늦춤

### B05 — Noir Pulse Reveal

**판정: REJECT 유지**

이유:
- B01과 dark cinematic 영역 중복
- data-specific grounding이 약하고 generic portfolio hero risk가 더 큼

## 4. Cross-Director 관찰

### 독립 수렴

A04와 B02는 서로 독립적으로 **editorial/exhibition typography + dominant data object** 쪽으로 접근했다.

이것은 contamination 증거가 아니라 현재 기록상 독립 context에서 발생한 수렴이다.

해석:
- Expo Attract에서 "dashboard chrome을 줄이고 하나의 관찰 과제를 크게 제시"하는 방향은 A와 B 모두에서 반복됨
- 이 공통점은 다음 prototype에서 검증할 가치가 높음

### 상보성

A05는 visual shell이 약하지만 interaction handoff가 강하다.
B02는 visual shell/CTA structure가 강하지만 handoff 의미는 A05만큼 명시적이지 않다.

따라서 **A05 × B02**는 실제 상보성이 있다.

A06은 별도 Hybrid보다 모든 후보의 semantic rule로 적용하는 편이 효율적이다.

## 5. Validator Shortlist — user alignment 전의 provisional set

아래 세 방향은 서로 다른 가설을 유지하기 때문에 prototype 비용을 쓸 가치가 있다.

### S1 — A04 Question Poster

가설:
> 가장 단순한 editorial question만으로도 v2.2.1의 dashboard 느낌을 줄이고 관람 task를 명확히 할 수 있다.

Origin: pure A  
Cost: low  
Strength: distance readability / clarity / low implementation risk

### S2 — B01 Signal Orbit (tuned)

가설:
> plot 중심의 dark cinematic stage가 데이터 truth를 유지하면서 가장 강한 first impression을 만든다.

Origin: pure B  
Cost: medium  
Strength: visual impact / plot prominence / current palette continuity

### H1 — B02 Exhibition Grid × A05 Same-scene Handoff

가설:
> exhibition-poster composition과 same-time CTA handoff를 결합하면 "보기 좋은 전시"와 "직접 만지는 경험"을 동시에 만들 수 있다.

Origin: cross-director Hybrid proposal  
Cost: medium  
Strength: public-facing hierarchy / CTA / interaction continuity

**H1은 아직 생성·구현하지 않았다.**

공통 semantic tune:
- A06의 "회색 Reference가 비교 기준" 설명을 S1/S2/H1 모두에서 검토
- 단 Reference를 절대 정답처럼 표현하지 않고 common-FE source를 함께 표시

## 6. 왜 이 세 개인가

A/B 각각 하나를 억지로 남긴 것이 아니다.

- S1은 **가장 낮은 구현 비용으로 가장 큰 information-hierarchy 변화**를 시험한다.
- S2는 **가장 강한 cinematic hypothesis**를 시험한다.
- H1은 **가장 강한 visual shell과 interaction handoff의 상보성**을 시험한다.

세 후보는 구현 전에 사용자의 visual alignment를 받아야 한다.

## 7. 다음 gate

아직 implementation 승인 아님.

다음:
1. 사용자에게 S1 reference intent, S2 actual preview, H1 구성 설명을 함께 제시
2. 후보별 "살릴 것 / 거슬리는 것 / 반드시 버릴 것" 수집
3. 필요 시 H1을 lightweight mockup/Concretizer로 1회만 생성
4. 최종 2~3 shortlist freeze
5. D + Change Contract
6. 그 뒤에만 v2.2.1 non-destructive variant 구현
