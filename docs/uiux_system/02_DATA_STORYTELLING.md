# Data Storytelling Guide

목적: ECG denoising 프로젝트의 핵심 데이터를 **정확성을 유지하면서 짧은 Expo 시간 안에 이해 가능한 이야기**로 바꾼다.

## 1. 핵심 원칙

데이터를 디자인으로 강조하되, 디자인이 데이터의 의미를 대신하지 않는다.

- 각 metric의 단위·스케일을 보존한다.
- 3D perspective, 면적, 높이로 정량 비교를 암시할 경우 실제 encoding 의미를 명시한다.
- 서로 다른 단위의 metric을 같은 물리적 높이로 비교하지 않는다.
- Local / Session / Experiment의 범위를 섞지 않는다.
- 대표 장면 하나를 전체 성능으로 일반화하지 않는다.

## 2. Expo 스토리 구조

기본 연구 스토리는 다음 순서를 우선한다.

1. 우리가 측정/준비한 ECG
2. 현실적인 noise가 섞이면 무엇이 어려워지는가
3. 여러 denoising 방법을 같은 조건에서 적용
4. waveform이 어떻게 달라지는가
5. 숫자로 얼마나/어떻게 달라지는가
6. 조건에 따라 우위가 달라지고 과처리 trade-off가 있음을 설명
7. 실제 Arduino/AFE 맥락으로 연결

## 3. 데이터 시각화 질문

새 차트를 고르기 전에 다음을 답한다.

- 관람객이 5~10초 안에 알아야 할 **한 문장 insight**는 무엇인가?
- 비교 대상은 방법, noise, SNR, 시간, metric 중 무엇인가?
- 관계는 rank, trade-off, before/after, distribution, trend 중 무엇인가?
- 숫자 자체가 중요한가, 변화량이 중요한가?
- 이 시각화가 waveform보다 앞에 나와야 하는가, 뒤에 나와야 하는가?

## 4. Flourish 사용 위치

Flourish는 최종 ECG 앱을 대신하지 않는다. 다음에 사용한다.

- 같은 데이터에 대한 여러 visualization 후보 탐색
- "어떤 story를 말하고 싶은가"를 기준으로 template 비교
- interactive filtering/reveal 아이디어 실험
- 표·숫자 중심 결과를 다른 관계형 표현으로 재해석

Flourish 결과를 채택할 때:
- 원본 데이터와 계산을 별도로 검증한다.
- 앱에 그대로 embed할지, 동일 구조를 React/Canvas로 재구현할지 결정한다.
- 장식 animation이 실제 값의 의미를 바꾸지 않는지 검사한다.

## 5. 권장 탐색 예

- Method × ΔSNR/RMSE/PRD/QRS-F1 → trade-off view
- Noise/SNR 변화에 따른 method 순위 → slope/rank change
- Noisy → Denoised → Reference → synchronized reveal
- Local → Session → Experiment → progressive evidence ladder
- Classical/Wavelet/DL/Hybrid → small multiples + 대표 metric

## 6. 시각화 채택 기준

`KEEP`:
- insight를 더 빨리 이해시킴
- 정확한 비교 가능
- 범위/단위가 명확

`TUNE`:
- 이야기 효과는 좋으나 장식이 강함
- 축/legend/단위가 부족
- animation 없이도 의미가 유지되어야 함

`REJECT`:
- perspective/면적/높이로 값을 과장
- 다른 단위를 동일 스케일처럼 보이게 함
- 특정 방법이 좋아 보이도록 시각적으로 편향
- 대표 scene을 전체 실험처럼 인식시킴
