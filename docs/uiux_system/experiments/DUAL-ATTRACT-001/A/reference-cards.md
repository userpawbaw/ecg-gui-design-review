# Director A · Reference cards

조사일 2026-09-19. **E1 = 실제 원문 텍스트 확인, E2 = 화면 정지 이미지 확인, E3 = 직접 인터랙션 관찰. 이번 채택 자료는 모두 E1이며 E2/E3가 아니다.** 아래 ‘기억할 순간’은 사용자가 확인할 목표 장면과 그 경험 원리의 해석이다. 직접 모션을 보았다는 주장이 아니다. 각 ECG 제안은 별도로 L0(미구현 가설)이다.

## REF-A01 · 정렬이 비교를 만든다

- Source / URL: Knight Lab, [JuxtaposeJS](https://juxtapose.knightlab.com/).
- Target scene: 상단 Interactive 설명과 Examples, 두 프레임 경계.
- Viewing instruction: 상단 Interactive를 읽고 Examples의 Berlin을 연 뒤 경계 핸들을 좌우로 움직여 같은 위치의 요소를 비교한다. 외부 예제가 열리지 않으면 본 페이지 Tips & tricks의 같은 크기·정렬 조건만 확인한다. 예제 동작은 이번 조사에서 미검증.
- Unforgettable moment: 서로 다른 이미지가 같은 좌표 위에서 바뀌는 순간.
- Mechanism / Why: 좌표를 유지하면 비교 때 시선 이동과 기억 부담이 줄어든다는 디자인 가설. 원문은 같은 크기와 주요 요소 정렬을 명시한다.
- Expected feeling: ‘어디가 달라졌는지 내가 찾는다.’
- ECG translation: 시간·mV가 같은 두 줄에 고정 기준선을 공유하고 선택 영역의 외곽만 강조한다. 실제 파형 위 wipe로 결과를 합성하지 않는다.
- Do NOT copy: 사진의 before/after 서사, 반쪽 입력+반쪽 출력으로 이어진 단일 가짜 ECG.
- Creative Freedom Zone: 두 패널의 배치, 바깥 프레임, 공유 눈금 안내.
- Imitation Distance: 3.
- Risk: 동일 시각과 ‘이전/이후’ 혼동. ‘동일 구간·입력/출력’ 명시.
- Minimal prototype: 기존 두 줄 plot과 프레임 강조만 붙인 1화면. E1.

## REF-A02 · 크고 작은 맥락의 연속

- Source / URL: NASA, [Eyes 안내](https://science.nasa.gov/eyes/), [Eyes Solar System](https://eyes.nasa.gov/apps/solar-system/).
- Target scene: 안내 페이지의 ‘5 cool things’와 ‘Pluto First Pic’, Solar System 진입.
- Viewing instruction: 안내에서 Pluto First Pic의 View in Eyes on the Solar System을 연다. 사건의 대상과 시간 맥락을 함께 찾는다. 3D camera 동작·정확한 로딩 시간은 직접 확인이 필요하다.
- Unforgettable moment: 큰 전체 안의 한 사건을 특정해 들어간다는 의도.
- Mechanism / Why: 공간·시간 맥락을 잃지 않은 대상 집중. 원문은 과거/미래 시각 탐색과 임무별 탐색을 설명한다.
- Expected feeling: ‘지금 보는 10초는 더 큰 기록의 일부다.’
- ECG translation: 상단에 실제 전체 기록 길이와 현재 반복 구간을 표기하고 두 줄 ECG를 주요 전시물로 놓는다. CTA는 동일 장면·시각을 인계한다.
- Do NOT copy: 우주, 행성, 별, 실시간 통신 표기, 3D 파형.
- Creative Freedom Zone: 파형 밖 공간, 출처 캡션, 전체→부분의 안내 도형.
- Imitation Distance: 4.
- Risk: 전체 기록을 모두 재생한 것처럼 보일 수 있다. 10초 선택 구간임을 상시 표시.
- Minimal prototype: 2D 구간 지도 + 본 plot, camera 없이. E1; 앱 실행 관찰 없음.

## REF-A03 · 설명과 그림이 같은 대상을 가리킨다

- Source / URL: Bartosz Ciechanowski, [Sound](https://ciechanow.ski/sound/).
- Target scene: Making Sounds의 세 키와 대응 plot, 이어지는 waveform addition 설명.
- Viewing instruction: 페이지에서 ‘Making Sounds’를 찾고 ‘three plots’ 문단 바로 아래 예제를 본다. 키를 하나, 두 개 순서로 눌러 대응을 확인한다. 이번 조사에서는 설명 텍스트만 확인했고 소리 재생과 상호작용은 미검증.
- Unforgettable moment: 개별 요인과 합성 결과를 한 번에 연결하는 구성.
- Mechanism / Why: 분리된 표현 사이 대응을 눈으로 추적하도록 한다.
- Expected feeling: ‘아래 선은 위 입력에 방법을 적용한 결과다.’
- ECG translation: 입력·선택 방법·출력의 설명을 파형 밖에 연결한다. 실제 중간 계산이나 분해 결과가 없으므로 처리 내부를 애니메이션으로 발명하지 않는다.
- Do NOT copy: 합성기, 음성, 회전 원, 파형 덧셈을 ECG 제거 과정이라고 주장하는 연출.
- Creative Freedom Zone: 레이블 강조 순서와 설명 위치만.
- Imitation Distance: 4.
- Risk: 지나치게 교육용 도식이 될 수 있고 자동 단계가 알고리즘 실행처럼 보일 수 있다.
- Minimal prototype: 움직이지 않는 plot에 세 단계 캡션만 교체. E1.

## REF-A04 · 관람에서 행동으로

- Source / URL: Nicky Case, [Neurotic Neurons](https://ncase.me/neurons/).
- Target scene: 상단 interactive explanation와 첫 참여 요청. 페이지 하단의 제작자 포맷 설명.
- Viewing instruction: 상단 내장 콘텐츠를 시작해 첫 상호작용 요청까지만 본다. 페이지 본문에서 ‘interactive format’ 문단을 함께 읽는다. 내장 게임의 실제 단계나 클릭 수는 이번 조사에서 확인하지 않았다.
- Unforgettable moment: 설명을 받던 사람이 행동을 하는 사람이 되는 지점(관찰할 목표).
- Mechanism / Why: 작은 참여로 탐구 역할을 부여한다는 해석. 제작자는 게임과 animated explainer의 혼합이라고 설명한다.
- Expected feeling: ‘내가 비교해 볼 차례다.’
- ECG translation: ‘같은 시각을 직접 비교하세요’ 단일 CTA와 동일 장면 인계. 퀴즈의 정답/오답이나 성능 승자를 강요하지 않는다.
- Do NOT copy: 신경 캐릭터, 정신건강 설명, 게임식 보상.
- Creative Freedom Zone: CTA 문구·공간·주변 최소 피드백.
- Imitation Distance: 4.
- Risk: CTA 클릭 시각에 재생이 재시작되면 약속이 깨진다. 동일 transport 유지 필요.
- Minimal prototype: CTA와 인계 상태만 확인하는 2상태. E1.

## REF-A05 · 질문이 전시물의 제목이 된다

- Source / URL: Matt Daniels / The Pudding, [The Largest Vocabulary in Hip Hop](https://pudding.cool/2017/02/vocabulary/).
- Target scene: 첫 제목·첫 비교 설명·첫 차트·Notes/sources.
- Viewing instruction: 첫 화면에서 제목을 읽고 바로 아래 비교 기준(first 35,000 lyrics)을 찾은 다음 차트와 Notes/sources까지만 본다. 아래 순위 서사는 이번 ECG 방향과 관련 없다.
- Unforgettable moment: 하나의 비교 질문이 제목과 데이터 그림을 묶는다.
- Mechanism / Why: 큰 편집 제목과 명시한 비교 조건의 결합. 페이지 텍스트는 동일 표본 길이를 설명한다.
- Expected feeling: ‘무엇을 봐야 하는지 바로 알겠다.’
- ECG translation: ‘어떤 굴곡이 남았을까요?’처럼 관찰 질문 하나, 그 아래 동일축 두 plot. 조건·REPLAY·출처를 캡션으로 상시 유지.
- Do NOT copy: 순위, 래퍼 이미지, 승패, 특정 방법이 최고라는 암시.
- Creative Freedom Zone: 타이포 스케일·여백·읽는 순서.
- Imitation Distance: 4.
- Risk: 제목이 plot 면적을 빼앗음. 전시 화면에서 plot 최소 가독 영역 확인 필요.
- Minimal prototype: 정적 편집 구성 한 장. E1; 실제 폰트·화면 비율은 미확인.

## 보류 자료

- [Chrome Music Lab Spectrogram](https://musiclab.chromeexperiments.com/Spectrogram/): 원문 접근은 되었으나 브라우저 미지원 안내 및 템플릿 문자열이 반환됨. 스펙트로그램 화면을 봤다고 주장하지 않음. ECG를 주파수로 바꾸는 은유가 time/mV 비교를 흐릴 수 있어 채택하지 않음.
- Annual Reviews DOI 10.1146/annurev-statistics-031017-100307: 열기에서 Internal Error. 내용 근거로 쓰지 않음.
- 첫 검색 묶음에서 무관한 검색 결과가 다수 반환되어 채택하지 않고 직접 원문 URL 열기로 전환.

## 시각 확인 후 증거 업데이트 (동결 전)

위 초안 작성 뒤 control-browser skill을 읽고 실제 cloud browser에서 두 자료를 추가 확인했다. 따라서 첫 문단의 ‘모두 E1’은 조사 초기 상태이며 최종 등급은 **01=E3, 05=E2, 02/03/04=E1**이다.

- REF-A01: https://juxtapose.knightlab.com/ 최종 URL 확인. Overview의 Interactive/GIF 항공 사진이 렌더링됨. 한 번 scroll이 protocol timeout을 반환했지만 다음 screenshot에서 이동한 화면이 확인됨. Interactive 왼쪽 흰 세로 핸들을 x414에서 x536 방향으로 직접 drag하여 경계가 오른쪽으로 이동하고 같은 항공 사진 좌표의 두 상태가 드러남을 screenshot 전후 확인했다. 이것은 E3. 최종 viewing instruction은 **Overview에서 조금 내려 왼쪽 Interactive 항공 사진의 흰 경계 핸들을 움직이기**이며 외부 Berlin 예제로 갈 필요 없다. GIF는 전후 screenshot에서 상태 변화는 보았으나 속도/주기를 측정하지 않았다.
- REF-A05: https://pudding.cool/2017/02/vocabulary/ 최종 URL 확인. 첫 screenshot은 loading 상태였다. 다음 screenshot에서 흰 배경의 중앙 큰 3단 제목, 얇은 구분선, 하단 회색 설명 영역과 동일 표본 길이 설명을 직접 확인했다. E2는 첫 제목/도입부에 한정하며 차트 전체·애니메이션은 미확인이다. 최종 viewing instruction은 **첫 제목과 바로 아래 회색 비교 설명 영역까지**이다.
- screenshot은 도구 응답으로 직접 관찰했으며 별도 이미지 파일로 저장하지 않았다. 재현 가능한 URL과 조작 로그를 남긴다. 다른 세 reference의 설명은 여전히 텍스트 원문 기반 해석이다.
