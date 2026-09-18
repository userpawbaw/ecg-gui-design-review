# Creative Direction — Expo UI Art Direction

상위 기준: `00_UIUX_MASTER.md`  
목적: **현재 ECG GUI를 새로 갈아엎지 않고, Expo 맥락에서 더 인상적이고 기억에 남게 만드는 창의적 후보를 체계적으로 발산한다.**

## 1. 기본 태도

Creative 단계에서는 먼저 "안전한 평균"으로 수렴하지 않는다. 다음 질문을 적극적으로 던진다.

- 이 화면은 꼭 일반적인 dashboard처럼 보여야 하는가?
- 관람객이 3초 안에 어디를 봐야 하는가?
- 연구 결과가 중요한데 단순 숫자/표로만 남아 있지 않은가?
- Stored replay → Arduino live 전환을 단순 탭 전환이 아니라 의미 있는 context switch로 느끼게 할 수 없는가?
- ECG의 시간성, 리듬, trace를 브랜드 언어로 활용할 수 없는가?

## 2. 창의 발상 카테고리

1. **Attract / Intro** — 멀리서도 ECG임을 인지하고 noisy→denoised 의미를 느끼게 한다.
2. **Mode Transition** — Replay/Live, Explore/Inspect, Lab/Acquisition 전환을 짧은 장면 전환으로 표현한다.
3. **Data Reveal** — 중요한 metric이나 결과가 단순 등장하는 대신 순차적 reveal로 연구 스토리를 만든다.
4. **Spatial Hierarchy** — 항상 3단 세로·동일 크기 카드라는 관습을 재검토한다.
5. **Microinteraction** — hover, selected, pin, replay, pause, apply 등의 상태를 짧고 안정적으로 느끼게 한다.
6. **Brand Motif** — sweep, grid, trace, pulse, sample window 같은 ECG 고유 어휘를 장식이 아니라 반복되는 시각 언어로 사용한다.

## 3. Awwwards/High-motion 스타일 사용 규칙

Awwwards식 접근을 금지하지 않는다. 다만 **스타일 복사보다 사고방식**을 차용한다.

적극 활용:
- attract/intro
- idle screen
- Replay↔Live context switch
- narrative/result reveal
- section transition

절제:
- waveform 읽기 중 과도한 parallax/morph
- 실제 존재하지 않는 중간 파형 생성
- metric의 의미를 3D perspective로 왜곡
- 지속적으로 움직여 시선을 빼앗는 배경

## 4. 후보 발산 규칙

Creative 요청에서는 기본적으로 5개 이상 아이디어를 만든다. 서로 다른 축을 사용한다.

- 구조 변화형
- motion/reveal형
- typography/scale형
- depth/spatial형
- data-story형

각 후보에는 다음을 붙인다.

- 목적
- Creative Freedom Zone
- 기대되는 관람객 반응
- 구현 난이도
- 데이터/UX 위험
- validator가 반드시 확인해야 할 항목

## 5. 대표 예시

### Replay → Live 전환
단순 fade 대신:
- stored waveform의 시간축이 짧게 압축
- grid/state label이 live context로 재구성
- LIVE indicator가 짧게 활성화
- sweep head가 실제 재생 시작 지점에서 진입

의미: "저장 결과 보기"에서 "실제 측정 맥락"으로 바뀌었다는 것을 시각적으로 전달한다.

### Metric reveal
3D 블록 높이로 서로 다른 단위의 수치를 비교하지 않는다. 대신 card 자체의 depth/rise/reveal을 사용해 **중요성**을 강조하고, 수치 의미는 텍스트/축/단위로 정확하게 유지한다.

## 6. 생성기로 구체화하는 시점

Creative divergence의 모든 후보를 바로 mockup하지 않는다.

다음 조건이면 상위 2~4개를 `14_SUPERDESIGN_GENERATION_LAYER.md`의 Visual Draft Generator로 넘긴다.

- reference/text 설명만으로 실제 visual difference를 판단하기 어렵다.
- 같은 baseline에서 둘 이상의 방향을 side-by-side 비교할 가치가 있다.
- significant CREATIVE 작업이며 단순 polish가 아니다.

Reference Mining이 있었다면 Reference ID와 experience principle을 전달하고, 원본 사이트의 appearance를 복제하라고 지시하지 않는다. Evidence/Data 화면은 visualization grammar가 미정이면 먼저 Flourish/Data Storyteller에서 관계를 확정한다.

Superdesign draft는 **후보를 더 잘 보기 위한 시안**이지 승인된 설계나 production code가 아니다.

## 7. 검증으로 넘기는 시점

Creative 단계에서 후보를 제거하는 이유는 "낯설다"가 아니라 다음이어야 한다.

- 데이터 왜곡 가능성
- 핵심 task 방해
- 과도한 인지 부하
- 접근성/성능 위험
- 프로젝트 정체성과 불일치

단순히 클래식하지 않다는 이유로 제거하지 않는다.
