# Director A · DUAL-ATTRACT-001

상태: **FROZEN** · 2026-09-19 · 독립 reference-grounded pass, 6 concepts.

의도: 관람객이 3초 안에 같은 ECG 구간의 잡음 입력과 처리 출력을 비교하고 저장 자료 재생임을 이해하게 한다. 이 보고서는 승인·선정이 아니라 여섯 개의 서로 다른 실험 가설이다.

## 기준과 불변조건

기준 commit ecb5e7c63279035ee5eac866237731987e3e6c7e. Attract는 확장 Lab viewer를 사용하지만 controls·method rail·조건 drawer·metrics·timeline을 CSS로 숨긴다. ‘버튼이 너무 많다’는 현재 화면 진단은 하지 않는다. 문제 가설은 큰 비교 viewer가 방문객에게 어떤 관찰을 시작해야 하는지 충분한 전시 언어로 제안하지 못한다는 것이다. 실제 관람객 검증은 아직 없다.

startAttract는 10초 loopRange, span=10, Sweep, speed=1, 비교/잔차 해제, panel=false를 설정한다. endAttract는 같은 transport 시각을 유지한다. 실제 장치 없음. 입력/출력/회색 Reference, s·mV·출처, 동일 시간·진폭 축을 보존한다. Difference는 Output − Reference이며 ‘제거한 잡음’으로 부르지 않는다. Sweep 눈금은 위치이며 실제 절대시각으로 둔갑시키지 않는다. 장식 신호·가상 중간 계산·성능 숫자·live 주장·파형 perspective를 만들지 않는다.

## 여섯 방향 비교

| ID | 이름 | 주된 변화 축 | 3초 인상 | 참고 | 시안 비용 추정 |
|---|---|---|---|---|---|
| A01 | 두 줄의 전시물 | 정보 구조 | 같은 순간을 두 번 본다 | 01,05 | 낮음 0.5–1일 |
| A02 | 10초 관측창 | 맥락·공간 | 큰 기록에서 이 구간을 본다 | 02,01 | 중간 1–2일 |
| A03 | 읽는 순서가 있는 무대 | 시간·설명 | 입력과 결과의 관계를 읽는다 | 03,04 | 중간 1–2일 |
| A04 | 질문 포스터 | 타이포·거리 | 어떤 굴곡이 남았을까 | 05,03 | 낮음 0.5–1일 |
| A05 | 같은 시각, 내 차례 | 참여·인계 | 보는 자리에서 조작하는 자리로 | 04,01 | 중간 1–2일 |
| A06 | 회색 기준의 갤러리 | 관찰·기준 | 매끈함보다 기준과의 관계를 본다 | 01,03,05 | 중간 1–2일 |

비용은 기존 plot 재사용, 디자이너/프론트 개발자 1명의 가벼운 시안 범위 추정이다. production QA·관람객 테스트는 제외한다. 여섯 안 모두 ECG evidence L0이며 reference evidence와 혼동하지 않는다.

## A01 · 두 줄의 전시물

Goal experience: 조작판보다 정렬된 두 실험 표본을 만난다.

What to watch: REF-A01 상단 Interactive의 정렬된 이미지 경계; REF-A05 제목 다음 비교 조건. Borrowed principles: 대응 위치의 지속성과 짧은 비교 규약.

ECG translation: 가로로 긴 기존 두 줄 plot을 거의 전면에 놓고 좌측 여백에 ‘입력 / 선택 방법 출력’을 큰 활자로 쌓는다. 각 행은 완전히 같은 폭과 눈금. 제목은 짧게 ‘같은 ECG, 두 모습’. 하단 고정 캡션에 REPLAY·10초 반복·방법·Reference 출처. CTA는 캡션 옆 한 곳. 기존 녹색/주황의 의미를 유지하되 행 레이블과 위치로도 구분한다.

Expected 3-second impression: ‘위와 아래가 같은 시간이다.’ Implementation hint: plot 좌표를 바꾸지 않고 외곽 레이블·여백만 재구성. Risk: 그래프를 크게 만든 것에 그칠 수 있음; 큰 레이블이 화면을 잠식할 수 있음. Prototype cost: 낮음, 0.5–1일. Evidence: L0, reference 01 E3/05 E2. 자유: 외곽 공간·타이포. 모방 거리 3–4.

## A02 · 10초 관측창

Goal experience: 현재 구간이 기록 전체의 일부라는 공간적 맥락을 느낀다.

What to watch: REF-A02의 임무/시각으로 사건에 진입하는 구조, REF-A01 정렬 원칙. Borrowed principles: 전체 속 부분의 위치 + 좌표 연속성.

ECG translation: 화면 가장자리에 실제 전체 duration의 얇은 지도와 실제 loopRange 구간 브래킷을 둔다. 가운데 두 줄 plot은 평면 창. 데이터가 없으면 지도 길이를 추정하지 않고 숨긴다. ‘전체 기록 중 이 10초 · 저장 출력 재생’을 표시한다. 전체→부분 이동은 외곽 브래킷에만 짧게 적용하며 그래프 확대·원근·변형은 없다.

Expected 3-second impression: ‘여기 작은 구간을 함께 보고 있다.’ Implementation hint: transport.duration/loopRange에서 읽는 2D 위치 도형; 현재 숨겨진 timeline을 그대로 노출하는 것이 아니라 전시용 비조작 캡션으로 재구성. Risk: 현재 기록과 전체 실험 혼동, 지도 폭이 짧은 기록에서 정보가 없음. Prototype cost: 중간, 1–2일. Evidence: L0, reference 02 E1. 자유: 맥락 지도·외곽 전환. 모방 거리 4.

## A03 · 읽는 순서가 있는 무대

Goal experience: 파형의 관계를 설명 세 박자로 읽는다.

What to watch: REF-A03 Making Sounds 대응 plot 설명, REF-A04 game/explainer 전환. Borrowed principles: 대상은 유지하고 주의 초점만 옮기기.

ECG translation: 입력·출력 두 줄은 처음부터 끝까지 보인다. 10초 반복 중 외곽 캡션만 0–3초 ‘잡음이 섞인 입력’, 3–6초 ‘선택 방법의 저장 출력’, 6–10초 ‘같은 기준과 비교해보세요’로 교체한다. 상시 REPLAY와 출처는 교체하지 않는다. 단계는 설명 순서이지 실제 계산 단계가 아님을 명시한다.

Expected 3-second impression: ‘어느 줄을 볼지 알겠다.’ Implementation hint: loopRange의 상대시각으로 caption 선택, reduced-motion에서는 세 문장을 함께 정적으로 표시. Risk: 중간에 들어온 방문객이 마지막 문장만 볼 수 있음; 실시간 처리 오해. Prototype cost: 중간, 1–2일. Evidence: L0, reference 03/04 E1. 자유: 안내 문장의 순서·불투명도; 파형 alpha는 수정하지 않음. 모방 거리 4.

## A04 · 질문 포스터

Goal experience: 멀리서 읽는 하나의 질문이 가까이서 보는 관찰로 이어진다.

What to watch: REF-A05 첫 제목의 큰 스케일과 아래 비교 기준, REF-A03 설명-그림 인접성. Borrowed principles: 편집 위계와 관찰 과제의 명료화.

ECG translation: 왼쪽 25%에 ‘어떤 굴곡이 / 남았을까요?’를 크게 배치하고 오른쪽 75%에 동일폭의 입력/출력 두 줄. 제목 아래 ‘회색 Reference와 나란히 보세요.’ 작은 설명. 가로가 좁으면 제목을 위로 옮긴다. 왼쪽 질문은 평가 결론이 아니며 결과가 더 좋다는 보장은 없다.

Expected 3-second impression: ‘작은 굴곡을 비교하는 전시다.’ Implementation hint: 정적 레이아웃 1장으로 거리 가독성 먼저 확인. Risk: 제목 면적 때문에 plot 라벨·mV가 작아질 수 있음. Prototype cost: 낮음, 0.5–1일. Evidence: L0, reference 05 E2/03 E1. 자유: 타이포·여백·헤드라인. 모방 거리 4.

## A05 · 같은 시각, 내 차례

Goal experience: 구경하던 비교를 자신이 이어받는다.

What to watch: REF-A04 첫 참여 전환(직접 확인 필요), REF-A01 핸들에 의해 비교 주도권을 갖는 장면. Borrowed principles: 작은 행동으로 관찰자 역할을 바꿈 + 대상 지속.

ECG translation: 두 줄 그래프 아래 하나의 넓은 CTA ‘이 장면에서 직접 비교’. CTA 주변 비데이터 프레임만 아주 미세하게 강조한다. 클릭하면 같은 시각·기법·축·장면에서 Lab controls가 나타난다. 파형을 이동시키거나 새 장면으로 seek하지 않는다. Attract 전체 pointer/key가 종료를 호출하는 현재 동작과 충돌하지 않도록 CTA 중심 표현은 가능하되 전체 입력 동작을 기능적으로 재설계하려면 별도 검토가 필요하다.

Expected 3-second impression: ‘바로 내가 바꿔볼 수 있다.’ Implementation hint: endAttract 재사용, 인계 직전/직후 state tuple 검사. Risk: 일반적인 CTA 개선에 머무름; UI 등장에 따른 canvas resize가 시각적 점프를 줄 수 있음. Prototype cost: 중간, 1–2일. Evidence: L0, reference 04 E1/01 E3. 자유: CTA·외곽 강조·controls 등장 순서. 모방 거리 3–4.

## A06 · 회색 기준의 갤러리

Goal experience: 매끈해 보이는 정도 대신 기준 파형과의 관계를 탐색한다.

What to watch: REF-A01 같은 위치 대조, REF-A03 여러 plot의 대응, REF-A05 비교 기준의 공개. Borrowed principles: 비교의 ‘자’를 먼저 알려주기.

ECG translation: 파형 두 줄은 그대로 두고 상단에 큰 회색 선 키와 ‘회색 선이 비교 기준입니다’를 배치한다. 입력과 출력 양쪽에 Reference가 있다는 점을 외곽의 동일한 회색 캡션으로 연결한다. ‘같아 보이나요? 다른 부분도 살펴보세요’로 관찰을 유도한다. 특정 오차 지점을 자동 탐지해 표시하지 않는다. Difference는 Attract 기본에서 켜지 않으며 이후 Lab에서 정확한 의미로 접근한다.

Expected 3-second impression: ‘좋아 보이는 선이 아니라 기준과 비교하는구나.’ Implementation hint: 기존 legend의 의미를 전시 타이틀에 끌어올림; Reference alpha·진폭·raw data 불변. Risk: 회색 기준을 임상적 절대 정답으로 오해할 수 있어 공통 FE 처리 출처를 함께 둔다. Prototype cost: 중간, 1–2일. Evidence: L0, reference 01 E3/03 E1/05 E2. 자유: legend 위계·외곽 문구. 모방 거리 4.

## 남은 검증과 한계

baseline source는 읽었으나 실제 archive/replay 데이터가 패킷에 없으므로 파형 runtime을 실행하거나 화면 높이 적합성을 검증하지 않았다. 3초 이해도는 목표이며 측정 결과가 아니다. 모든 안은 키보드 접근·reduced-motion·색상 외 구분·REPLAY 상시 표기·동일시각 인계를 prototype에서 확인해야 한다. 실제 관람 거리와 전시 해상도는 미제공이다. ref의 영상처럼 보이는 것만으로 과학적 정확성을 보장하지 않는다.

Rejected directions: 파형이 잡음을 벗으며 morph하는 연출, 3D ECG 터널, 실시간 심장 장치처럼 보이는 pulse/장식 수치, 숨겨진 rail을 단순 제거하는 안. 데이터 의미와 현재 기준을 어기거나 창의적 차이가 부족해 후보에 넣지 않았다.

이 단계에서 shortlist·승자·KEEP/TUNE/REJECT 검증 판정을 내리지 않는다. 독립 pass를 동결하며 다음 정렬·cross-review는 orchestrator의 작업이다.
