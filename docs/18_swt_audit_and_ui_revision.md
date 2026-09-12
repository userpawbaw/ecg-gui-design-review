# v2.2.1 — SWT 데이터 점검과 GUI 수정 내역

2026-09-12. 대상: 배포 v2.2의 98조건 연속 재생 자료와 기존 10초 archive. 연구 소스는 `5eb27946087faca3c6e70b3925e2ba132b2ee680`으로 고정했다. 기존 출력 수치·모델·학습은 변경하지 않았다.

## 1. M04와 M_FE가 비슷한 이유와 판정

**저장 출력 오연결이나 threshold 미실행 증거는 발견되지 않았다. 다만 SWT의 추가 효과가 작은 조건은 실제로 존재한다. 구현 재현성과 잡음 제거 성능의 타당성은 별도 판정이다.**

- 배포 ZIP SHA-256을 확인해 복원하고, 98조건의 1,960개 청크 hash와 M04/M_FE 전 구간을 확인했다. 완전히 동일한 조건은 0개다.
- D0/D1 × 7잡음, 입력 SNR −5dB의 14조건에서 원 입력을 같은 seed로 재생성했다. 입력 hash 일치 후 FE/SWT를 다시 실행했고, 28개 출력 모두 배포본과 half-quantization-step 이내에서 일치했다. 나머지 SNR 조건은 저장 데이터 비교이며 이번에 소스 재실행한 범위가 아니다.
- 기존 10초 archive 98조건도 M04와 M_FE가 완전히 같은 조건은 0개다. 이 archive는 이번 소스 재실행 대상이 아니다.
- hard threshold의 알려진 입력/출력 대조가 통과했고, k=0 대조군에서는 M04가 M_FE로 복원되었다(최대 오차 약 3.34×10⁻¹²mV).
- 각 대역에서 threshold 이하 계수 비율 및 제거 성분 에너지를 확인했다. 상세 수치는 `verification/swt-replay-audit.json`, 재현 스크립트는 `scripts/audit-swt-replay.py`다.

M_FE는 공통 0.5–100Hz 전처리와 조건부 notch 결과다. M04는 동일한 전처리 **다음에** SWT를 적용한다. 따라서 두 출력을 비교하면 SWT의 추가 기여를 볼 수 있다. 회색 Reference는 `FE(raw ECG)`이며 원기록 자체 또는 임상적으로 완벽한 clean으로 해석하지 않는다.

### 실제 저장 출력의 적용 설정

| 설정 | D0 합성 ECG | D1 실제 ECG |
|---|---|---|
| wavelet / level | sym4 / 5 | sym4 / 5 |
| threshold | garrote | hard |
| σ 추정 | D2 계수의 MAD | D1 계수의 MAD |
| k, D1→D5 순서 | 2.5, 2.0, 0.6, 0.4, 0.3 | 0.6, 0.2, 0.1, 0.3, 0.3 |
| QRS 보호 | 사용 | 미사용 |
| approximation A5 처리 | 유지 | 유지 |

`λj = kj × σ × √(2 ln N)`를 적용한다. 저장 config의 k는 D1→D5, PyWavelets detail 배열은 D5→D1이므로 소스에서 역순 정렬한다. 이 경로도 확인했다. D1 hard threshold는 임계값보다 큰 계수를 그대로 두고 작은 계수를 0으로 만든다. 큰 burst/impulse가 임계값 위에 있으면 대부분 남는다. 예를 들어 D1 임펄스 −5dB는 D1 계수 약 96.6%를 0으로 만들지만 해당 대역 제거 성분 에너지는 원 계수 에너지의 약 0.38%뿐이다. 많은 계수를 처리했다는 사실만으로 큰 잡음 제거 효과가 생기지는 않는다.

기저선·전극 움직임 조건은 고주파 sigma가 약 0.005mV이고 A5도 유지한다. 이 조건에서 FE 이후 SWT 변화는 작다. 근육 잡음에서도 낮은 대역별 k와 hard 방식이 큰 계수 대부분을 유지한다. 이는 해당 조건에서의 효과 제한을 설명하며, 모든 입력에서 SWT가 무효라는 뜻은 아니다.

### 사용자가 기본 화면에서 비교하기 쉬운 수치

D1 / MITDB 111 / **입력 SNR +10dB / 전체 600초**. 아래 RMS는 `M04 − M_FE`의 크기이며 Reference에 대한 오차나 성능 지표 자체가 아니다. 마지막 열은 `strict SNR(M04) − strict SNR(M_FE)`다. 원 실험의 전체 TEST 집계와 다르다.

| 잡음 preset | 두 출력 차이 RMS, mV | M04의 추가 strict SNR, dB |
|---|---:|---:|
| mixed | 0.02738 | +1.463 |
| impulse | 0.00307 | −0.001 |
| PLI | 0.00673 | +5.841 |
| baseline wander · 합성 | 0.00276 | −0.476 |
| muscle artifact · 합성 | 0.01445 | +0.311 |
| electrode motion · 합성 | 0.00276 | −0.030 |
| AWGN | 0.03824 | +2.790 |

시각적 차이가 작아도 PLI처럼 추가 SNR 이득이 있을 수 있고, 반대로 작은 변형이 Reference 오차를 늘릴 수도 있다. ±2mV로 표시하면 수 μV 차이는 선 굵기 아래에 가려지기 쉽다. 이번 `Reference와 차이`는 `M04−M_FE`가 아니라 **선택 출력−Reference**이므로 두 기능을 혼동하지 않는다. M_FE를 Pin하고 M04를 선택하면 본 파형 두 방법을 직접 비교할 수 있다.

D1에서 sigma를 D2로만 바꾼 진단 계산도 시행했다. −5dB 조건의 추가 strict SNR 변화는 AWGN +0.743dB, mixed +0.334dB였지만 PLI −0.068dB, baseline −0.010dB 등 악화 조건도 있었다. 따라서 이것을 검증된 수정값으로 채택하지 않았다.

후속 알고리즘 개선은 별도 실험으로 다룬다. D1 hard/garrote·bandwise sigma·k와 형태 보존을 validation 분할에서 비교하고, 확정한 설정을 untouched TEST에서 평가해야 한다. 현재 전시 TEST 레코드의 모양을 보고 임계값을 조정하면 공정한 검증을 해친다. 또한 이번 610초 일괄 처리의 전역 MAD와 log(N)은 원래 짧은 평가 구간의 값과 달라질 수 있다. 시간창 변경 효과도 분리해 확인한 뒤 새 버전으로 98조건을 생성해야 한다. 이 보고서는 610초 처리의 최적성까지 입증하지 않는다.

## 2. 이번 GUI 수정

| 항목 | v2.2.1 동작 | 검증 |
|---|---|---|
| Reference와 차이 켜기 | 재생/정지/표시 모드를 유지하며 행만 추가 | DOM 및 Canvas 명령 검사 |
| Sweep / Scroll | 입력·출력·차이가 동일 transport와 sample mapping 사용 | 공유 엔진 및 프레임 명령 변화 확인 |
| 일시정지·재개 / 구간 고정 | 차이 표시 선택 유지 | 상태 전환 검사 |
| 일반/큰 비교 창 | 같은 Plot와 controls 사용 | 소스 공유 확인; PC runner에 두 크기 케이스 추가 |
| y축 | 각 행 왼쪽 5개 수치, 좌상단 `[mV]`; 우측 ±문구 제거 | 눈금값·좌표 명령 검사 |
| 차이 ×3/×5 | 확대 표시되지만 축은 실제 mV; 예: ±2mV/×5 → ±0.4mV | 범위/라벨 테스트 |
| 차이 행 공간 | 아래 시간 눈금이 캔버스 안에 남도록 144px 확보, 기존 파형 높이 유지 | 텍스트 앵커 경계 검사 |
| 범위 맞춤 | 입력·Reference·선택·Pin 출력과 확대된 차이를 모두 포함 | 코드 확인 및 회귀 검사 |
| M04 설명 | 장면 metadata에서 실제 threshold·sigma·k·QRS 보호 표시 | 데이터 출처와 설정 대응 |

Attract 진입은 기존 간결한 전시 설정대로 차이 행을 끈다. Local 수치 분석의 구간 고정 조건은 그대로다. 이번 요청은 차이 **파형**의 연속 재생이며, Local 통계의 이동 계산을 추가한 것이 아니다.

## 3. 글꼴 논의안 — 이번 배포에는 미적용

추천은 **로컬 Pretendard + 본문 400/500 + 버튼 600 + 주요 선택·제목 700**이다. 굵게 만들기는 시각적 강조를 바꾸고, 글꼴 교체는 글자 형태와 한글/영문 조화를 바꾸므로 함께 적용할 수 있다. 모든 글씨를 700으로 만들면 설명과 조작의 강약이 약해진다.

| 선택 | 예상 변화 | 적용 영향 |
|---|---|---|
| 현재 글꼴 + 버튼만 600/700 | 허전한 버튼을 빠르게 강조 | 비교적 작지만 글자 폭/줄바꿈 확인 필요; OS별 사용 가능한 굵기 차이 |
| Pretendard + 역할별 굵기 | 한글·영문 UI 인상을 통일 | 버튼·패널·Canvas·이전 iframe까지 범위 결정 및 글꼴 로딩 후 배치 검수 필요 |

현재 CSS는 Malgun Gothic/Noto Sans KR/system-ui 순서이고, Canvas 텍스트는 별도 system-ui다. `font-family` 한 곳만 바꾸면 파형 축까지 자동으로 통일되지는 않는다. 이전 상세 분석·계측도 iframe의 독립 문서이므로 부모 CSS를 상속하지 않는다.

폰트 파일을 넣는 방식은 가능하다. WOFF2를 로컬에 포함하고 `@font-face`와 폰트 토큰으로 연결한다. 가변 폰트라면 실제 weight 범위를 선언하고, 고정 폰트라면 필요한 굵기별 파일을 제공한다. 파일만 덮어쓰는 것보다는 manifest/설정에 family와 weight를 함께 지정해야 한다. 한글·Δ·σ·−·μ 등의 glyph와 숫자 폭도 확인한다. 공식 Pretendard는 SIL Open Font License로 제공되므로 배포 시 해당 license를 함께 포함한다.

주의할 부분은 데이터 계산이 아니라 **텍스트 폭·행 높이·줄바꿈·대체 글꼴에서 전환될 때의 배치 변화**다. 폰트를 미리 로드하고 `document.fonts.ready` 이후 Canvas를 다시 그리며 gutter 폭을 재계산한다. 일반/큰 창, 1920×1080/1366×768, OS 125%·150% 배율을 실제 브라우저에서 비교한다. 파일이 없을 때 fallback도 유지한다. 현재 `font-synthesis:none` 설정이 있으므로 없는 굵기를 임의 합성한다고 가정하면 안 된다.

공식 자료:
- Pretendard: https://github.com/orioncactus/pretendard/blob/main/packages/pretendard/README.md
- Font loading API: https://developer.mozilla.org/en-US/docs/Web/API/Document/fonts
- SWT coefficient convention: https://pywavelets.readthedocs.io/en/latest/ref/swt-stationary-wavelet-transform.html

## 4. 검증 범위와 남은 작업

- 데이터 hash/소스 재현: PASS, 위 명시한 범위.
- 엔진·청크·축 단위 검사: 13 PASS. DOM/Canvas 명령 회귀 검사: PASS. TypeScript/Vite 빌드: PASS.
- 실제 브라우저 픽셀·native dialog·실제 10분 재생·전시장 가독성: NOT VERIFIED. 이 환경의 기존 localhost 브라우저 차단을 우회하지 않았다. 테스트의 Canvas는 명령 기록용 대역이며 스크린샷 검수가 아니다.
- PC 자동 검수에 일반/큰 창의 재생 중 Difference, Sweep/Scroll 전환, ×5 축 스크린샷 수집을 추가했다. 숫자의 실제 가독성 판정은 그 결과가 필요하다.
- 다음 논의: 글꼴 범위·굵기 선택. 이후 요청하신 Loss 발전 비교 및 상세 분석·계측/실험실 통합을 별도 설계한다. 이번 수정에서 큰 탭 구조는 변경하지 않았다.
