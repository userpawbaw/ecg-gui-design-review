# S1. 프로젝트 재이해 — GUI보다 먼저 확인한 것

기준일: 2026-09-08. 원본 `userpawbaw/ECG_denoising_method_comparision`, SHA `5eb27946087faca3c6e70b3925e2ba132b2ee680`. 코드 실행·하드웨어 실측 없이 확인한 내용은 **소스 검사**이며, 원저자의 측정값은 **저장된 결과**로 구분한다.

## 1. 실제로 증명하려는 가치

목표는 ECG 형태를 보존하며 취득 잡음을 줄이는 방법을 같은 조건으로 비교하는 것이다. 모든 조건에서 가장 매끈한 파형 하나를 고르는 프로그램으로 설계하면 연구 질문을 잃는다. 연구가 반복해서 보여준 것은 입력 SNR, 잡음 성격, 데이터축, 참조 정의, 앞단 필터, 손실 함수에 따라 결론이 달라진다는 사실이다.

GUI의 주 질문은 **“이 조건에서 무엇이 줄고 무엇이 변했는가?”**다. 이어서 **“이 한 구간의 결과가 전체 기록에서도 성립하는가?”**, 계측에서는 **“지금 어느 출처의 신호를 어느 지연으로 보고 있는가?”**에 답해야 한다.

근거: [종합 보고서 §1·§5·§7](https://github.com/userpawbaw/ECG_denoising_method_comparision/blob/5eb27946087faca3c6e70b3925e2ba132b2ee680/docs/91_report.md).

## 2. 현재 사실과 GUI 영향

| 확인한 사실 | 소스 | GUI에서의 결정 |
|---|---|---|
| 처리 fs=250 Hz; MIT 원본 360 Hz; 기본 win=1024/hop=512 | ecgdn/config.py, data/mitdb.py | 원본 fs와 처리 fs를 구분. 360 Hz를 모든 화면에 복사하지 않는다 |
| D0=합성, D1=MIT-BIH+잡음; D2=장비 잡음 적응, D3=실측 평가 대기 | report §4.3·7.1 | D0/D1/D3와 저장/수신/재생은 다른 축. D1을 현재 장비 LIVE로 표현하지 않는다 |
| D1 참조 x=FE(x_raw), y=x_raw+n | data/dataset.py build_eval_set | 참조를 “대역제한 참조”로 표시. 원본 임상 clean이라는 표현을 쓰지 않는다 |
| 주 평가 60 s, 양끝 5 s 제외; 시연 은행은 20 s 중 중앙 10 s | config.py, build_demo_bank.py | 화면에 보이는 길이, 국소 평가 길이, 원래 집계 길이를 별도 표기 |
| 신호 지표 strict/scaled/α* 동시 계산 | eval/signal_metrics.py | 기본 수치는 보정 없는 값, 보정값과 α*를 함께 해설. 화면 파형은 자동으로 보정하지 않는다 |
| M_FE가 명시적 기준선; M00 identity도 별도 의미 | configs/exp_a.yaml | 입력·FE·선택 기법·참조로 기여를 분리. 전체 파이프라인 이득과 FE 대비 추가 이득을 혼동하지 않는다 |
| 실제 registry가 있고 DL은 체크포인트 경로로 생성 | registry.py, methods/dl_wrapper.py, build_demo_bank.py | “레지스트리를 새로 만들자”가 아니라 정규화한 GUI 카탈로그 어댑터를 만든다 |
| SNR마다 잡음 seed에 SNR을 넣지 않고 크기만 바꿈 | data/dataset.py | SNR 변경 시 같은 record/segment/noise realization 고정. 잡음 종류 변경으로 record가 달라지면 알린다 |
| TEST=22 records, TRAIN/VAL/PACED 별도 | data/splits.py | 소속은 실제 split 조회. TEST는 모델 버전과 함께 검증할 주장이지 장식 badge가 아니다 |
| D1 QRS 폭 floor p95≈28.072 ms | results/d1/metric_floor/floor.csv | 작은 QRS 폭 차이에 성공/실패색을 주지 않는다. 원시 수치와 분해능 제한을 함께 보여준다 |
| 실시간 StreamProcessor·SerialSource·SSE bridge 존재 | realtime/stream.py, scripts/serial_bridge.py | 실제 구현이 모두 미착수라는 기존 가정을 재사용하지 않는다. UI 연결과 현장 시험은 별도 |
| FE 인과/블록 영위상/중앙값 구현; FE 한 번만 적용 | realtime/frontend_modes.py | 표시 모드와 처리 FE 선택을 분리. FE 변경은 새 세션/워밍업, 이전 출력 무효화 |
| bridge `/stream`은 i,n,fs,raw,ok,out,stat를 보냄 | serial_bridge.py payload | 어댑터는 절대 샘플 인덱스와 유효 mask를 보존. 누락은 선으로 연결하지 않는다 |
| payload에 명시적 sourceMode/sessionId/device timestamp/board denominator 없음 | 같은 payload | SSE가 수신돼도 LIVE라 단정할 수 없다. 분모 없이 누락률을 만들지 않는다. 계약 확장 필요 |
| lat_ms는 처리 지연 예산이며 완전한 화면 E2E 실측이 아님 | serial_bridge.py, stream.py | “연산 ms”, “알고리즘 대기”, “표시 지연”을 합쳐 근거 없이 한 숫자로 쓰지 않는다 |

## 3. 재검토에서 추가로 발견한 표현 위험

1. **지표 이름은 값의 성질을 보장하지 않는다.** α*는 잔차 잡음에도 영향을 받는 최소제곱 보정계수다. “1보다 작으니 R 진폭이 정확히 몇 % 커졌다”로 일반화하지 않는다. 보고서 §5.8.3의 `gain_bias=0.848` 해설은 앞의 정의와도 부호가 맞지 않는다. 원파형과 R 진폭 측정을 따로 본다.
2. **scaled SNR은 자동으로 더 공정한 단일 점수가 아니다.** M00도 보정만으로 점수가 오른다. strict·scaled·α*와 baseline을 같이 읽어야 한다.
3. **잡음 없음 실험은 모든 입력에 적용되는 수학적 상한이 아니다.** 비선형/입력 적응 방법의 EXP-C를 보편적 성능 천장으로 설명하지 않는다. 또한 oracle bound는 정한 방법군·제약 안에서의 참조이며, 다른 방법군이 넘으면 무조건 오류라는 설명은 부적절하다.
4. **명목 주입 SNR과 평가 참조 기준 입력 SNR은 다를 수 있다.** D1은 noise를 x_raw에 맞춰 섞지만 평가 분모는 FE(x_raw)다. 국소 10초 지표도 전체 60초 값과 다르다.
5. **n.s.를 동등성으로 읽지 않는다.** p값·효과크기·표본단위·검정 baseline이 필요하다. D1 전체 평균 한 개로 방법 추천을 고정하지 않는다.
6. **문서·표·코드 시점이 다르다.** README의 test 개수, 보고서 초기 “D0만 수행” 문구, 은행 M_FE 설명의 0.5–40 Hz는 현재 규격/후반 결과와 일치하지 않는다. 개별 항목의 정본을 구분한다.

## 4. 확보한 실제 자료와 신뢰성 경계

- 저장 시연 은행: `demo/demo_bank.js`, 8,650,784 bytes, Git blob `4a94d1b79db95b8cb8afa5e8f944955d756c5db6`. 다운로드 후 Git blob 해시 일치 확인.
- 98 장면, D0/D1, 7 잡음 조건×7 SNR(-5…25 dB), 장면당 250 Hz×10 s. 파형은 공통 scale의 little-endian int16 base64다.
- 은행에 실제 저장된 FE/DSP/DL 출력을 사용한다. UI 편의를 위해 모델 출력을 보간·합성하거나 방법명을 붙인 가짜 필터로 대체하지 않는다.
- 생성 manifest의 builder 해시 `a12e8f2a90259c77`는 현재 소스와 일치한다.
- dataset 해시는 manifest `d5d0883966a22890`, 현재 `3855d8b22fbc7695`로 불일치한다. **ARCHIVED / 재생성 확인 필요**로 표시한다. 수치가 틀렸다는 판정도, 최신 코드 재현에 성공했다는 판정도 하지 않는다.
- 기존 은행의 seed/lead/annotation/checkpoint별 content hash/집계 CI는 완전하지 않다. 없는 필드를 그럴듯한 값으로 채우지 않는다. record ID만으로 특정 병리 이벤트를 해당 구간에 붙이지 않는다.
- UI 국소 지표는 복호화된 저장 파형에서 계산하고 “양자화된 10초 저장 파형 재계산”을 명시한다. 원본 저장 지표·집계 평균은 별도 범위로 표시한다.
- 실제 D3 하드웨어, 전체 모델 실행, 통계 재실행: NOT VERIFIED.

## 5. 독립 설계의 입력 요구사항

| 사용자 과제 | 완료를 관찰하는 방법 |
|---|---|
| 관람객 60초 | 잡음/SNR 한 가지를 바꿔 효과와 손상 가능성을 말할 수 있음 |
| 발표자 5분 | 한 방법 선택→원리·한계→같은 구간 확대→전체 결과 범위·참조를 설명 |
| 개발자 디버그 | case/source/run/method/metric scope를 보고 불일치 위치를 좁힘 |
| 계측 운영 | 입력 출처와 수신 상태를 구분하고 누락/끊김을 인식해 명시적으로 복구 |

화면 수·탭 이름은 여기서 고정하지 않는다. 다음 단계에서 작업 전환 비용과 정보의 동시 관찰 필요성으로 결정한다.

## 6. 확인 범위

README, 전체 경로 목록, docs/01_design, docs/91_report의 연구/지표/실험/한계 절; config, registry, data(sources/splits/mixer/mitdb/dataset), methods(base/dl_wrapper), eval(signal_metrics/engine), realtime(stream/frontend_modes), serial_bridge, build_demo_bank, test_demo_bank, exp_a, demo_bank와 그 manifest, D1 result tables/floor, stream_latency를 검사했다. 화면 HTML과 GUI 설계 docs/30–34는 아직 읽지 않았다.

S1 판정: **PASS(소스 이해)**. 실제 실행/하드웨어 완성 판정이 아님. 다음: 독립 설계안과 검증 rubric 및 상호작용 시안 동결.

