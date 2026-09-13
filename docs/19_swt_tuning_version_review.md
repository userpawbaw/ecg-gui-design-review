# SWT 최종 튜닝 이력 재검토 — v2.2.1 후속 감사

2026-09-13. 질문: GUI가 원본 저장소의 후속 SWT threshold 튜닝을 누락했는가? M03(DWT)보다 M04(SWT)가 약하게 보이는 원인은 무엇인가?

## 판정

**튜닝 이력·적용값 대조 PASS / 독립 환자 holdout 설명 FAIL / SWT의 보편적 우위 주장은 성립하지 않음.**

1. 별도의 SWT 튜닝과 참조 수정 후 재실행 이력이 실제로 있다. 현재 GUI는 그 이후의 축별 `best.json`을 사용하고 있다.
2. 조회한 4개 브랜치에서 더 새로운 다른 튜닝 산출물을 찾지 못했다. 원본 파일이 동일하다는 사실은 그 설정이 최적이라는 증명이 아니다.
3. M03/M04는 threshold 방식·sigma 출처·k까지 달라 변환만의 공정한 ablation이 아니다. 원본 최종 보고서도 이를 인정한다.
4. 추가 감사에서 튜닝/holdout이 서로 다른 환자 기록을 선택하지 않는 코드 경로를 재현했다. 기존 튜닝의 환자 일반화 검증 설명은 정정해야 한다.

이전 보고서의 “M04 실행과 저장 출력이 재현된다”는 판정은 유지한다. 그러나 그 사실만으로 튜닝의 검증 설계까지 적절하다고 결론 낼 수 없다. 이번 문서는 그 부족한 부분을 보완한다. GUI 코드·파형·원본 연구 저장소는 이번에 수정하지 않았다.

## 1. 조사 범위와 최종본 식별

GUI 생성 소스는 `5eb27946087faca3c6e70b3925e2ba132b2ee680`이다. 이번 원본 주 작업 브랜치의 조회 시점 HEAD는 `97b2a00bb2e1f0f20ec181f7e1e96a73ce947ce5`다.

| 원본 브랜치 | 확인한 HEAD | SWT 산출물 |
|---|---|---|
| claude/ecg-denoising-dsp-dl-comparison-b5wjvj | 97b2a00 | D0/D1 best.json 모두 GUI 값과 동일 |
| claude/bold-sagan-7j27yq | 7a9dc5e | 위와 동일 blob |
| claude/adoring-einstein-opbvaj | 615f934 | 위와 동일 blob; tune 스크립트 차이는 CLI 도움말 |
| waveform-generate-only | fe24b36 | 튜닝 설명 문서는 같지만 results 튜닝 산출물이 추적되지 않음 |

주 브랜치의 README·전체 docs·관련 코드·튜닝 결과 등 56개 파일을 내려받아 Git blob hash와 대조했다. `ecgdn/data/sources.py`, 별도 브랜치 tune 스크립트, 기록된 튜닝 시점 `f2f752b`의 선택 코드도 추가 확인했다. 상세 목록은 `verification/swt-source-version-ledger.json`이다. 로컬 PC의 미커밋 결과나 비공개 별도 저장소는 이번 확인 범위에 없다.

`results/d1/tune_swt/best.json`의 주 브랜치 이력에는 `f7092b8`(2026-08-26)의 최초 추적 추가가 있다. 이 커밋은 새 튜닝 실행이 아니라 `.gitignore` 때문에 누락됐던 산출물을 저장소에 추가한 작업이다. 산출물 manifest의 실행 git은 `f2f752b`다. 두 날짜/커밋의 의미를 혼동하지 않는다.

## 2. 문서에서 확인한 실제 개선 순서

| 단계 | 근거 | 의미 |
|---|---|---|
| 초기 임계값 교정 | `20_findings.md` F-5, `05_swt_tuning.md` | level별 MAD가 ECG 계수를 잡음으로 크게 추정하는 문제를 확인하고 sigma 출처·threshold 방식·k를 탐색 |
| D1 재탐색과 참조 수정 | `20_findings.md` F-12 | raw MIT-BIH를 정답으로 쓰던 문제를 발견하고 `FE(raw)` 참조로 변경 후 재실행 |
| 축별 적용 확정 | `21_decisions.md` D-9 | D0/D1의 다른 최적점을 각각 `M04/M04np/B01`에 자동 주입 |
| 산출물 기록 보완 | `22_incidents.md` O-10/O-13 | 재실행 덮어쓰기와 Git 추적 누락 문제를 보완; 소비자는 최상단 best.json을 계속 읽음 |
| 최종 해석 제한 | `91_report.md` §4.6 | M03은 변환 방식만 다른 대조군이 아니며, 동일 임계 규칙의 DWT 비교는 아직 없음 |

D1 F-12의 수치 변화는 tune −0.49 → +12.47dB, 문서상 holdout −0.55 → +12.58dB다. **원본 참조 정의 수정에 따른 변화**이며, GUI에서 최근 threshold 파일을 바꿔 얻은 변화가 아니다. GUI는 이미 `FE(raw)` 참조를 사용한다.

D0 문서의 +14.86dB, D1 문서의 +11.28dB는 **튜닝한 SWT와 교과서 설정의 SWT** 사이 차이다. M03 DWT와 비교한 이득이 아니다. 코드의 baseline도 `SWTDenoiser`다.

## 3. 최종 튜닝과 실제 실행 설정

공통 wavelet=sym4, level=5, approximation A5 유지. k는 detail D1→D5 순서이며 데이터축 이름 D0/D1과는 다른 뜻이다.

| 실행 대상 | sigma 출처 | threshold | k(D1→D5) | QRS 보호 |
|---|---|---|---|---|
| D0 M04 | D2 | garrote | 2.5, 2.0, 0.6, 0.4, 0.3 | 사용 |
| D1 M04 | D1 | hard | 0.6, 0.2, 0.1, 0.3, 0.3 | 미사용 |
| M03, 두 데이터축 공통 | D2 | soft | 2.5, 2.0, 0.6, 0.4, 0.3 | 미사용 |

확인한 적용 경로:

- `run_exp.load_swt_tuning(tag)`가 `results/{tag}/tune_swt/best.json`을 읽는다.
- `SWT_TUNED = {M04, M04np, B01}`에만 주입한다. M03은 포함되지 않는다.
- M03 등록 팩토리는 `SWTCfg(mode="soft", protect_qrs=False)`이므로 나머지는 기본값이다.
- 실제 팩토리를 실행해 config를 확인했고 GUI 98개 조건 metadata의 SWT 설정이 최신 best.json과 모두 같았다.
- Wavelet 구현 blob 자체도 조회한 네 브랜치에서 같았다.

따라서 현재 그림에서 M03이 더 매끄럽다고 해서 최신 SWT 누락 또는 변환의 열등함으로 곧바로 해석할 수 없다. DWT 쪽의 더 큰 k와 soft shrinkage가 더 강한 평활화를 만드는 조건이 있을 수 있으며, ECG 작은 성분 보존과 잔류 잡음의 절충을 함께 봐야 한다.

## 4. 원본 결과에도 DWT가 높은 조건이 있다

`docs/90_results_d1.md` EXP-B의 기존 저장 집계, scaled SNR improvement(dB):

| 잡음 | M03 DWT | M04 SWT |
|---|---:|---:|
| 근육 잡음·합성 | **8.77** | 4.29 |
| 임펄스 | **3.69** | 3.56 |
| 기저선 변동·합성 | 14.54 | **23.92** |
| 혼합 | 8.52 | **10.41** |

EXP-A 전체 집계에서는 scaled 개선이 M03 10.41, M04 13.12dB이고 strict 개선도 9.99 대 12.24dB다. 반면 평균 RMSE는 M03 0.0899, M04 0.1150mV로 DWT가 낮다. CSV와 문서가 일치했다. 로그/정규화 지표의 평균과 원 단위 오차의 평균은 조건별 가중 효과가 달라 순서가 항상 같지 않다. 이 수치들은 이번에 재실행한 전체 실험 결과가 아니라 원본 저장 집계다.

GUI의 단일 레코드 600초 Session은 위 TEST record 집계와 다르다. 저장 Session strict 수치만 비교하면 D1 49조건 중 18조건에서 SWT가 DWT보다 낮다. 이는 단순 수치 부호 집계이며 유의성 검정이나 보편적인 승률이 아니다.

## 5. 새로 확인한 문제: 환자 holdout이 분리되지 않는다

문서는 “TRAIN 안에서 다른 기록을 holdout으로 쓴다”고 설명한다. 하지만 실제 코드 경로는 다음과 같다.

1. tune seeds `[0,1,2,3]`, holdout seeds `[4,5,6,7]`로 각각 `build_cases`를 호출한다.
2. MITDB 분기는 seed의 값이 아니라 **개수**만 `real_clean_segments(len(seeds), ...)`에 전달한다. 두 번 모두 n=4다.
3. `real_clean_segments`는 매번 `MITDB_SPLIT['train'][:4]`와 기본 offset=0을 선택한다.
4. 따라서 두 세트 모두 `101,106,108,109`의 같은 시간 구간이다. seed는 그 뒤 잡음 생성에만 영향을 준다.

기록 로더만 결정론적인 가짜 데이터로 대체하고 **실제 선택 함수와 잡음 생성 경로**를 실행했다. 두 세트 각각 84조건에서 기록 목록과 원신호 구간이 같고 잡음 실현만 달라짐을 확인했다. 이는 선택 로직 검사이며 실제 4개 환자 파형의 성능 재실행은 아니다. manifest 시점 `f2f752b`와 현재 코드의 관련 함수 AST도 같았다.

그러므로 다음처럼 판정을 나눠야 한다.

- **튜닝은 수행됐다:** 맞다. D1 manifest는 source=mitdb, dur=90s, SNR=[5,10,15]다.
- **새 잡음 seed로 검증했다:** 맞다.
- **다른 환자 기록으로 검증했다:** 현 코드 경로로는 아니다.
- **TEST 기록이 튜닝에 들어갔다:** 이번 검사에서 그런 경로를 발견한 것은 아니다. 문제는 TRAIN 내부 tune/holdout의 중복이다.
- **12.58 > 12.47이므로 환자 일반화/과적합 문제가 없다:** 이 근거만으로 주장할 수 없다.

`05_swt_tuning_d1.md`에는 “합성 ECG seed”, “MIT-BIH 확보 후 재실행” 문구도 남아 있다. 이는 생성 템플릿이 source에 따라 바뀌지 않아서 생긴 문서 오류다. D1 튜닝 자체가 없었다는 증거로 삼으면 안 된다.

## 6. SWT가 반드시 DWT보다 좋은가?

아니다. DWT도 적절한 필터쌍과 경계 규약 아래 모든 계수를 보존하면 원 신호를 재구성할 수 있다. 데시메이션이 있다는 이유만으로 전체 표현의 정보를 무조건 버린 것은 아니다.

SWT의 장점은 중복 표현을 사용해 시간 이동에 따른 계수/처리 결과의 변화를 다루기 좋다는 것이다. 이 장점은 threshold 후 오차가 모든 신호·잡음에서 항상 더 작다는 보장을 주지 않는다. 잡음 추정, shrinkage, 경계, QRS 보호와 지표에 따라 결과는 달라진다. 현재 M03/M04에는 이 중 여러 차이가 동시에 있다.

공식 배경: [PyWavelets SWT](https://pywavelets.readthedocs.io/en/latest/ref/swt-stationary-wavelet-transform.html), [DWT 역변환](https://pywavelets.readthedocs.io/en/latest/ref/idwt-inverse-discrete-wavelet-transform.html). 위의 현재 프로젝트 판단은 저장소 코드·수치 대조에 근거한다.

## 7. 필요한 후속 수정 순서

1. 원본 연구 저장소에서 tune/holdout의 **명시적 record 목록**을 받도록 수정하고 record 및 환자 수준 중복을 검사한다. 레코드 ID가 다른 경우에도 같은 환자의 다른 기록인지 확인한다. 목록·시간구간·raw/noise hash를 manifest에 남긴다.
2. 문서 생성기를 source에 맞게 고친다. 기존 holdout 결과는 “동일 기록·새 잡음 seed 검증”으로 정정한다. 이전 값과 보고서를 별도 버전으로 보존한다.
3. 비교 목적을 두 실험으로 분리한다. 변환 효과는 같은 FE/시간창/wavelet/threshold 규칙과 통계 규약으로 맞춘 DWT/SWT ablation으로, 각 방법의 최선은 같은 탐색 예산·목적 지표로 각각 튜닝해 평가한다. 변환별 계수 수가 다르므로 같은 k만으로 실제 임계값이 같아졌다고 간주하지 않는다.
4. 현재 목표인 시각적 형태 보존을 고려해 scaled만 아니라 strict·RMSE·P/QRS/T 변형도 함께 검토한다. 튜닝 범위는 5/10/15dB였고 GUI는 −5~25dB이므로 범위 밖 조건을 구분한다.
5. 원래 90초 튜닝 창과 GUI 610초 처리의 MAD/log(N) 차이를 분리 검증한다. 학습·검증에서 확정한 새 설정을 TEST에 한 번 적용하고 영향을 받는 저장 출력을 새 버전으로 생성한다.

이 후속 알고리즘 수정·재튜닝·데이터 교체는 이번 **문서/버전 감사**에서 실행하지 않았다. 기존 GUI 결과를 임의로 SWT가 우세하도록 바꾸지 않는다.

## 근거 파일과 재현

- `verification/swt-source-version-ledger.json`: 브랜치 HEAD, 파일 blob, best.json 이력.
- `verification/swt-tuning-version-audit.json`: 팩토리 설정, 98개 metadata 대조, 선택 경로 검사, Session 수치 비교.
- `scripts/check-swt-tuning-provenance.py`: 검사 스크립트. 동일 workspace의 `inference-source`(기존 pinned 소스)와 `swt-version-source`(이번 ledger의 원본 파일)를 사용한다. `historical-selection.json`의 tune/sources는 원본 `f2f752b`에서 가져온 두 파일이다. 필요 의존성은 기존 추론 환경과 같다.

원본 파일은 아래 고정 SHA 경로에서 확인할 수 있다.

- [D0 튜닝 문서](https://github.com/userpawbaw/ECG_denoising_method_comparision/blob/97b2a00bb2e1f0f20ec181f7e1e96a73ce947ce5/docs/05_swt_tuning.md)
- [D1 튜닝 문서](https://github.com/userpawbaw/ECG_denoising_method_comparision/blob/97b2a00bb2e1f0f20ec181f7e1e96a73ce947ce5/docs/05_swt_tuning_d1.md)
- [최종 결정 D-9](https://github.com/userpawbaw/ECG_denoising_method_comparision/blob/97b2a00bb2e1f0f20ec181f7e1e96a73ce947ce5/docs/21_decisions.md)
- [최종 보고서 §4.6](https://github.com/userpawbaw/ECG_denoising_method_comparision/blob/97b2a00bb2e1f0f20ec181f7e1e96a73ce947ce5/docs/91_report.md)
- [D1 결과](https://github.com/userpawbaw/ECG_denoising_method_comparision/blob/97b2a00bb2e1f0f20ec181f7e1e96a73ce947ce5/docs/90_results_d1.md)
- [튜닝 스크립트](https://github.com/userpawbaw/ECG_denoising_method_comparision/blob/97b2a00bb2e1f0f20ec181f7e1e96a73ce947ce5/scripts/tune_swt.py)
- [기록 선택 함수](https://github.com/userpawbaw/ECG_denoising_method_comparision/blob/97b2a00bb2e1f0f20ec181f7e1e96a73ce947ce5/ecgdn/data/sources.py)

현재 작업 완료 수준: 감사·기록 COMPLETE. UI v2.2.1 구현/데이터 단계는 유지. 실제 브라우저/AFE 검수, 글꼴 논의, Loss 비교·탭 통합은 이전 계획대로 남아 있다.
