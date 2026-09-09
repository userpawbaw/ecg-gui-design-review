# 팀 설명·디버깅 가이드

2026-09-09 · Signal Studio 최종 검토 프로토타입 v1.0. 이 문서는 UI를 처음 보는 팀원과 화면을 수정할 개발자가 함께 사용한다. 각 요소의 역할, 변경될 값, 오류 증상, 첫 확인 위치까지 설명한다. 파이프라인 내부 알고리즘의 수학적 유도는 원본 프로젝트 문서가 정본이다.

## 1. 팀에 먼저 설명할 내용

이 프로그램은 **같은 입력으로 여러 denoising 결과를 비교하는 연구용 GUI 프로토타입**이다. 이름이 붙은 파형은 원본 GitHub의 실제 저장 출력이다. 현재 화면에서 모델을 새로 실행하지 않는다. 계측 화면은 실제 장치와 연결되지 않았으며 Replay의 예외 구간만 UI 시뮬레이션이다.

먼저 입력·FE·M04·M08의 같은 축을 보여주고 방법을 클릭한다. 아래 확대에서 입력 대비 변화와 참조 대비 차이를 함께 확인한다. 수치가 좋아도 α와 strict SNR을 확인해야 진폭 보정의 영향을 설명할 수 있다. 이어서 전체 근거를 열어 이 장면과 전체 실험의 범위가 다름을 설명한다.

| 60초 시연 순서 | 조작 | 설명할 핵심 |
|---|---|---|
| 0–15초 | 실험실에서 기본 조건과 4행 확인 | “입력과 공통 FE를 기준으로 두 방법을 같은 시간·mV축에서 비교합니다.” |
| 15–30초 | M04 hover→클릭→M08 클릭 | “hover는 탐색, 클릭은 고정입니다. 입력은 유지됩니다.” |
| 30–45초 | 시작 3초·길이 1.2초, dual/residual 확인 | “줄어든 성분에 ECG가 섞였는지도 봅니다. 실제 annotation 없는 구간에 병명을 붙이지 않습니다.” |
| 45–60초 | 전체 근거 이동→실험실 복귀 | “EXP-A 전체 집계와 EXP-G 장면은 다른 범위이며 복귀하면 같은 조건이 남습니다.” |

긴 설명에는 시연 가이드의 mixed 0 dB, PLI 20 dB, L1/L6 20 dB를 사용한다. 각 조건이 다른 record를 선택할 수 있다는 안내를 생략하지 않는다. 이 경로는 데모 진행안이며 60초 이해도 테스트를 통과했다는 뜻은 아니다.

## 2. 파일과 실행 방법

| 파일 | 담당 역할 | 수정 시 확인할 것 |
|---|---|---|
| `prototype/index.html` | 작업 공간, native controls, dialog, 의미 있는 label | ID와 이벤트 대상, 출처·범위 문구 |
| `prototype/style.css` | 배치, 색, 버튼 상태, 반응형, 모션 축소 | 화면 폭·배율·contrast·focus 실기 검수 |
| `prototype/app.js` | 상태, 선택 이벤트, SVG, 해설, Replay, JSON | 아래 component 계약과 DOM 회귀 검사 |
| `prototype/core.js` | int16 복호화, 평균 제거 지표, 표본 구간 | known-input 및 원본 지표 검산 |
| `data/bank.js` | S2 동결본: 일부 장면+EXP-A 표+출처 | 독립안 보존을 위해 덮어쓰지 않음 |
| `data/extension.js` | 나머지 실제 파형을 병합해 98장면 완성 | 임의 output 합성 금지, pinned bank hash |
| `scripts/build-single-file.cjs` | 단일 오프라인 HTML 생성 | 수정 후 반드시 재빌드 |
| `tests/`와 `verification/` | 자동 검사와 실행 결과 | PASS의 범위와 NV 구분 |
| `independent/` | 비교 전 동결한 독립안 | 수정 금지; 최종 UI는 prototype/ |

일반 확인: 저장소 전체를 받은 뒤 `prototype/index.html`을 브라우저로 연다. `data/`가 함께 있어야 한다. 하나의 파일만 전달하려면 Node 24 이상에서 `npm run build` 후 `dist/ecg-signal-studio.html`을 전달한다. 이 HTML 실행에는 Node나 인터넷이 필요하지 않다.

개발 검사:

```sh
npm ci
npm test
npm run build
node tests/portable.test.cjs
```

`npm ci`는 개발용 jsdom 설치에 네트워크를 사용한다. 제품 HTML의 실행 의존성과 다르다. 선택적으로 `npm run preview`를 실행해 출력된 로컬 주소를 사용한다. 이 작업 환경에서는 로컬 URL 접근 정책 때문에 실제 브라우저 렌더를 확인하지 못했다. 위 명령의 DOM 검사가 픽셀 검수를 대신하지 않는다.

## 3. 구성요소 번호 읽기

최종 실행 DOM은 38개 `data-component`를 가진다. `G-`는 전역, `LAB-`는 실험실, `EVD-`는 전체 근거, `ACQ-`는 계측, `OPS-`는 보조 창/알림이다. 개발자 도구에서 `[data-component="LAB-14"]`로 찾을 수 있다. 디버그 번호는 일반 화면에 크게 노출하지 않는다.

**방법 ID M04/M10과 구성요소 ID LAB-04/LAB-10은 다른 이름 공간이다.** 또한 이전 명세의 M10은 Compare 프레임 ID였다. 버그 보고에는 최종 구성요소 번호와 방법 ID를 각각 적는다. 독립 동결안의 일부 LAB/ACQ 번호 역할은 최종에서 재배정했으므로 이 문서를 따른다.

아래 함수명은 모두 별도 표기가 없으면 `prototype/app.js`에 있다.

## 4. 전역 요소

| ID · 실제 대상 | 역할·설계 이유 | 조작·상태 계약 | 오류 시 첫 확인 |
|---|---|---|---|
| G-01 · `#workspace-nav` | 질문에 따라 실험실/전체 근거/계측으로 이동 | 실험실 조건 유지, 커서 정지, 선택 `aria-pressed` 갱신 | `showWorkspace()`; 해당 section의 hidden 값, 중복 재생 여부 |
| G-02 · `#provenance-open` | 지금 보고 있는 자료의 출처·범위 확인 | workspace에 맞는 OPS-02 내용. 실험실은 archive·장면, 전체 근거는 EXP-A, 계측은 미연결 | `openProvenance()` 분기; 다른 화면의 문구가 남는지 |
| G-03 · `#export-open` | 버그 재현에 필요한 조건과 메모 저장 | OPS-01 열기, 재생 정지. 입력/참조 오류 중 비활성 | `snapshot()`, `openExport()`; scope와 선택 표본 |
| G-04 · `#data-error` | 잘못된 결과를 정상 화면에서 분리 | 입력/참조 실패 시 이전 파형·지표·record 제거, alert와 재시도 | `currentScene()`, `renderAll()` catch; bank 파일 존재·크기·encoding |

헤더 출처 badge는 실험실/전체 근거에서 ARCHIVE, 계측에서 NO SESSION이다. 작은 폭에서 badge가 숨겨져도 각 화면의 출처 줄·범위 안내·NO DEVICE 문구는 남도록 설계했다. 실제 배율 가독성은 수동 확인한다.

## 5. 실험실 구성요소

| ID · 대상 | 무엇을 보여주기 위해 존재하는가 | 입력→출력·유지 규칙 | 고장 증상 / 첫 확인 |
|---|---|---|---|
| LAB-01 · `#axis` | 합성 D0와 공개 ECG 기반 D1의 근거 구별 | 축만 바꾸고 잡음·SNR·방법 유지. record는 새 축에 맞게 갱신 | 축은 D0인데 MIT-BIH 문구가 남음 / `changeScene()`, `renderAll()` |
| LAB-02 · `#noise` | 같은 알고리즘도 잡음에 따라 다름 | 7조건의 실제 scene 조회. record 변경을 숨기지 않음 | 잡음 변경 후 이전 결과 / `noiseNames`, `currentScene()` 조회 키 |
| LAB-03 · `.snr-control` | 노이즈 크기를 직접 바꾸는 핵심 입력 | 슬라이더/7개 버튼 동기화, 같은 axis/noise에서 record·segment 유지 | 칩과 슬라이더 불일치 또는 가짜 연속값 / `state.snr`, `changeScene()` |
| LAB-04 · `.source-note` | 작은 badge에 담겨야 할 입력 정체성 | record, TEST/D0, FE 참조, nominal SNR, 250Hz·상대 시간·archived | 좁은 화면에서 record 불명 / `#context-label`, source-note CSS |
| LAB-05 · `.signal-column .signal-panel` | 입력→공통 FE→비교→선택의 한 묶음 | 최대 4행, 범례·진폭·커서·하단 clipping 안내 포함 | 순서/단위 불명 / panel HTML와 `renderGraph()` |
| LAB-06 · `#comparison` | 고정 선택 외 후보 하나를 함께 비교 | 선택 지표를 바꾸지 않고 추가 행만 변경. none/중복은 행 생략 | 선택 지표까지 바뀜 / `state.comparison`, rows 구성 |
| LAB-07 · `#waveform` | 전체 10초에서 차이를 발견하고 상세로 이동 | 모든 행 공유 축; click으로 구간 이동, hover로 같은 시각 값·crosshair | 시간 불일치 / SVG viewBox, `pathFor()`, `getBoundingClientRect()` 변환 |
| LAB-08 · `.selection-controls` | 작고 드래그하기 어려운 영역의 대안 | 시작 숫자, ±0.5초, 0.6/1.2/3초. `[first,last)` 표본으로 clamp | 끝에서 빈 그래프/NaN / `core.selection()`, `moveSelection()` |
| LAB-09 · `#amplitude` | 진폭 보존을 공정하게 비교 | 모든 행·상세에 같은 ±mV. fit도 공통 범위. 값 자체는 미변경 | 행마다 진폭이 비슷해 보임 / 자동 정규화가 추가됐는지, `pathFor()` |
| LAB-10 · `#play` | 저장 자료 시간의 흐름을 보여줌 | 사용자 시작, 1× 10초 단회 커서. 이동·숨김 시 정지 | 화면 밖에서 계속 재생 / `setPlaying()`, `tick()`, visibilitychange |
| LAB-11 · `.method-panel` | 여러 방법의 원리와 결과를 직접 탐색 | 7개 기본+5개 추가. hover/focus preview, click pin; M07/M10 비활성 이유 | 이름과 모델 불일치 / methods 사전, 원본 registry, export 지원 목록 |
| LAB-12 · `#method-detail` | 선택 방법이 왜 다른 결과를 내는지 설명 | principle·limit. 미리보기인지 고정인지 명시. preview는 지표 불변 | 설명과 선택/지표 다름 / `preview`, `state.method`, `renderMethodDetail()` |
| LAB-13 · `.metrics-strip` | 파형 인상을 보정 규약과 함께 검산 | 전체 10초 출력 strict/scaled, α, CC. method null이면 대시 | 너무 좋은 scaled만 보임 / `renderMetrics()`, `core.metrics()`, 평균 제거 규약 |
| LAB-14 · `#detail-waveform` | 같은 구간에서 형태·제거 성분 확인 | dual/참조 overlay/residual, 같은 시간·진폭. 실제 배열만 사용 | 시간·진폭이 main과 다름 / `renderFocus()`, selection·clipPath·amplitude |
| LAB-15 · `.focus-reading` | 현재 확대 구간 해석과 수치 범위 | 선택 방법명, RMSE·CC, annotation 부재. 손상 출력이면 설명/수치 제거 | 이전 방법의 RMSE 잔존 / `renderFocus()`의 실패 분기 |
| LAB-16 · `#presentation` | 발표 때 파형에 공간 집중 | 방법 목록 숨김/전폭; 조건 유지. 분석 보기 복귀 버튼은 남김 | 나갔다 돌아오니 다른 조건 / presentation CSS만 바꾸는지 |
| LAB-17 · `.guided-tour` | 첫 관람객의 선택 부담 완화 | mixed0 M08/M04, PLI20 M06/M04, mixed20 M06L6/M06 적용 | L6가 선택됐는데 목록 닫힘 / `applyRecipe()`, more-methods.open |
| LAB-18 · `#contribution` | 공통 FE의 이득을 방법 성과와 분리 | strict 입력 대비 개선, FE 대비 추가 차이. 음수도 그대로 표시 | 모든 방법이 개선처럼 보임 / strict와 scaled 혼합·절댓값 처리 여부 |
| LAB-19 · `.scene-evidence` | 눈앞의 사례와 같은 조건 평균의 차이 | EXP-G 현재 scaled 개선과 원본 평균; 분포·CI·n 미제공 표시 | EXP-A 수치가 끼어듦 / `scene.ref_mean`, ref_exp |
| LAB-20 · `.annotation-contract` | 병리 검토 의도와 아직 없는 근거를 보존 | beat/rhythm 연결 필드·필요 조건 안내. 임의 병명/합격 배지 없음 | record만 보고 PVC라 표시 / annotation·절대 sample·split 증거 확인 |

## 6. 전체 근거 구성요소

| ID · 대상 | 역할·설계 이유 | 상태·해석 계약 | 오류 시 첫 확인 |
|---|---|---|---|
| EVD-01 · `#evidence .page-heading` | 실험·집계 단위를 먼저 읽게 함 | D1/EXP-A/L1/TEST22/mixed/−5…20dB 고정 | 실험실 SNR25/L6가 헤더에 들어감 / HTML 범위·sourcePath |
| EVD-02 · `#evidence-bars` | 방법 간 평균 차이를 빠르게 비교 | 16행, 공통0–20dB 길이, 실제 mean; M00/FE 포함, oracle 별도 문구 | 순위·방법명·막대 왜곡 / `renderEvidence()`, evidence.rows |
| EVD-03 · `#evidence-table` | 정확한 값과 집계 크기 확인 | method/n/mean/std/median, 원본 CSV값. std는 CI가 아님 | n=18·가짜 CI가 등장 / `results/d1/report/table_main.csv`와 대조 |
| EVD-04 · `#evidence .notice` | EXP-G와 EXP-A를 같은 run으로 오인 방지 | 화면 진입 후 계속 보이는 범위 안내 | scene 대비 차이를 동일 run 검정처럼 계산 / 연결 설계 수정 |
| EVD-05 · `.reading-panel` | 지표 해석에서 빠지기 쉬운 3가지 | FE 기여, 배율 보정, D1 QRS floor. 우승·장치 적합 자동 판정 없음 | floor 이하이면 자동 PASS / metric·reference·검출 조건부터 확인 |

전체 근거에 M07/M10이 있지만 실험실에서 비활성인 것은 모순이 아니다. 집계표에 해당 방법 결과가 있는 것과 장면별 파형이 export된 것은 다른 조건이다.

## 7. 계측·운영 구성요소

| ID · 대상 | 역할·설계 이유 | 입력→출력·상태 계약 | 오류 시 첫 확인 |
|---|---|---|---|
| ACQ-01 · `.acquisition-empty` | 실제 장치 미연결의 분명한 시작점 | NO DEVICE SESSION, 수신 파형 없음; 상태 설명만 변경 | 빈 상태에서 LIVE·심박수 등장 / 소스 타입과 fixture 혼합 |
| ACQ-02 · `#acquisition-scenario` | 예외 상태 GUI를 개발 중 검토 | 5개 명시적 UI 시연. 이벤트를 실제 계측값으로 기록하지 않음 | 선택만 했는데 fake 연결 성공 / `renderAcquisition()` |
| ACQ-03 · `.device-stats` | 모름·미측정·참조 없음의 구별 | 유실/알고리즘 지연 대시, E2E 미측정, SNR 참조 없음 | unknown이0·정상으로 표시 / null 처리·분모·지연 정의 |
| ACQ-04 · `#diagnostics-open` | 운영자가 원인 분석을 시작 | 진단 창을 열고 원래 계측 상태는 유지 | 상태 reset/파형 대체 / `openDiagnostics()`·close handler |
| ACQ-05 · `#diagnostics` | 오류 위치를 단계별로 좁힘 | PORT/FRAME/DECODE/BUFFER/RENDER 미확인과 필요한 증거 | COM5·CRC OK 등 고정값 / rows가 실제 실측처럼 바뀌었는지 |
| ACQ-06 · `.replay-preview` | 저장 자료로 gap/warmup 표현 점검 | 버튼 후만 표시, REPLAY banner, 4–5초 invalid fixture, 이전 출력 숨김 | 자동 Replay/유실 선 연결/옛 출력 유지 / `renderReplay()`·mask·state |
| OPS-01 · `#export-dialog` | 팀 간 버그 재현 자료 | JSON 미리보기·메모·다운로드. 실제 실험 run export가 아님 | 저장 메모 누락/Infinity 손실 / `serializeSnapshot()`, Blob 내용 |
| OPS-02 · `#provenance` | 현재 범위·출처·누락 필드 해설 | lab/evidence/acquisition별 내용, 닫기 focus 복귀 | 다른 화면의 source 표기 / `openProvenance()` 분기 |
| OPS-03 · `#status` | 조작이 접수됐는지 짧게 피드백 | polite status,4.2초; 최대50건 메모리 log, JSON에 최근15건 | 매 프레임 낭독/성공 추론 / `announce()` 호출 위치 |

## 8. 데이터와 지표 계약

장면 키는 `axis + cond + snr`이며 `scene.id`로 캐시한다. `traces`의 각 배열은 little-endian signed int16 base64, `mV = q × scene.scale`, 2,500표본이다. `fs=250`, 표시 길이10초다. 전체20초 처리의 양끝5초 guard를 제외했다. 화면0초는 저장 배열의 시작이며 record 절대 시각이 아니다.

```text
scene: id, axis, cond, snr, record, seg, scale, ref_exp,
       selection, traces, storedMetrics, ref_mean
trace keys: clean, input, M_FE, M01, M02, M03, M04, M05,
            B01, M06, M06L6, M08, M09
M00: input 배열을 그대로 사용
```

읽기 순서는 bank.js→extension.js→core.js→app.js다. extension은 같은 ID의 누락 trace를 병합한다. 임의 필터나 sin파로 method trace를 메워서는 안 된다. 부분 실패는 해당 method만 unavailable이고 input/reference 실패는 장면 전체 실패다.

| 숫자·표시 | 정확한 의미 | 잘못된 해석 |
|---|---|---|
| nominal 주입 SNR | 원본 혼합 조건 | 현재10초·FE 참조 기준 입력 SNR과 항상 동일 |
| strict 출력 SNR | 평균 제거 후 진폭 보정 없는 출력 대비 reference | DC 오차까지 포함한 지표 |
| scaled 출력 SNR | 최적 α를 곱한 출력의 오차 | 화면 파형도 자동 보정됨, 또는 임상 형태 합격 |
| α | reference에 맞추는 최소제곱 출력 배율 | 정확한 R 진폭 오차율 |
| RMSE/CC | 선택 구간의 평균 제거 후 오차·상관 | 전체 실험 성능, annotation 정확도 |
| TEST | pinned 프로젝트 split 기준 record 소속 | export에 없는 모든 checkpoint의 unseen 검증 완료 |
| ARCHIVED | 원본 저장 출력, builder hash 일치·dataset hash 불일치 | 최신 소스로 재생성/새 inference 완료 |
| 범위 밖 표본 | 현재 ±mV viewport에서 잘리는 표시 표본 | ADC clipping 횟수·장치 이상 실측 |
| `—`, null | 자료 없음·계산 불가 | 0, 정상, 실패 횟수 없음 |

정확한 noise seed, lead, annotation, checkpoint hash, runId, record 절대 시작 시각은 이 export에 없다. source Git SHA와 bank blob hash는 있어도 그것만으로 누락한 실험 metadata를 대신할 수 없다.

## 9. 검토 JSON으로 문제 전달하기

문제가 보인 상태에서 “검토 기록”을 열고 구성요소 ID, 기대 동작, 실제 동작을 메모한다. JSON은 source commit/blob, 장면·method·비교 후보·시간·진폭·현재 작업 공간, 계측 시연 상태와 Replay 열림 여부, 국소 지표, 최근 알림을 담는다. 누락한 source 필드는 null, 무한 수치는 문자열로 보존한다.

현재 파일을 자동으로 다시 불러오는 import 기능은 없다. JSON은 팀원이 같은 컨트롤을 맞추는 수동 재현 기록이다. source가 실제 장치 미연결임을 유지하며, 계측 화면에서 내보내도 남아 있는 실험실 지표는 “retained laboratory context” 범위로 구분한다. 메모·이벤트는 브라우저 새로고침 전까지만 메모리에 남는다.

버그 보고 양식:

```text
제목: LAB-14 / M04 선택 후 확대 구간이 주 파형과 다름
버전: Git commit 또는 portable-build.json의 SHA-256
환경: OS, 브라우저 버전, 화면 해상도, 배율, 브라우저 zoom
현재 조건: JSON 첨부
재현 순서: 시작 상태부터 최소한의 클릭/입력
기대: 같은 3.00–4.20초, 같은 ±2mV
실제: 보인 현상, 오류 메시지, 가능하면 화면 캡처
영향: 출처/수치 오류(P0), 주요 과업 차단(P1), 가독성(P2)
확인 단계: 데이터 / 계산 / 상태 / 렌더 / 장치
```

5분 디버깅 순서는 **조건 확인→source/trace 길이 확인→core 값 확인→state/DOM 확인→실제 화면 확인**이다. 지표가 틀렸는데 먼저 CSS를 고치거나, 화면 gap을 선으로 메워 수신 실패를 감추지 않는다.

## 10. 실제 파이프라인 연결 시의 계약

원본에는 [Serial bridge](https://github.com/userpawbaw/ECG_denoising_method_comparision/blob/5eb27946087faca3c6e70b3925e2ba132b2ee680/scripts/serial_bridge.py)와 [StreamProcessor](https://github.com/userpawbaw/ECG_denoising_method_comparision/blob/5eb27946087faca3c6e70b3925e2ba132b2ee680/ecgdn/realtime/stream.py)가 있다. 이를 모두 새로 작성하는 작업으로 범위를 늘리지 않는다. GUI adapter에서 출처·정렬·수명·오류 규칙을 보존한다.

기존 frame은 `i,n,fs,raw,ok,out,stat`이며 stat에는 `lost,leadoff,bad,resync,qdrop,sse_drop,lat_ms,fe,rtf`가 있다. 다음은 **통합 전에 확정할 요구 계약**이며 현재 bridge가 모두 제공한다는 뜻은 아니다.

| 경계 | 필요한 정보·규칙 | 통합 완료 증거 |
|---|---|---|
| 출처·세션 | sourceMode(LIVE/REPLAY), sessionId, device identity | 실제 장치와 재생 입력이 명확히 구별되고 이전 session frame 폐기 |
| 시계 | 장치/호스트 clock 종류, sample index origin, fs | raw/out/reference alignment와 gap이 sample 기준 일치 |
| frame | i,n,배열 길이,finite,ok mask,순서·중복 검사 | invalid span에 선을 잇지 않음; 부분 오류가 현재 UI에 표시 |
| FE 변경 | mode metadata,latency 정의,reset boundary | 이전 버퍼/출력을 비우고 warmup 완료 후 새 output 표시 |
| 유실 | 종류·카운트·분모·측정 구간 | board loss/qdrop/SSE drop을 중복 합산하지 않음; 분모 없으면 비율 없음 |
| 지연 | 알고리즘/FE 대기,compute,transport,render를 구별 | bridge lat_ms를 E2E 실측으로 표시하지 않음 |
| inference | runId,context hash,method/checkpoint,상태 이벤트 | 늦게 도착한 이전 run은 버림; cancel/error/partial 상태 재현 |
| annotation | record,lead,원본 fs,절대 sample index,symbol/interval,split | resampling 후 정렬 확인; PVC beat와 AFIB rhythm을 적절한 길이로 표시 |
| 통계 상세 | experiment/run,record,condition,metric definition,분포·제외 수 | EXP-A 집계→같은 실험 사례로 실제 drill-down 가능 |

bridge 연동 후 상태 경로는 연결→검증→워밍업→수신이며 gap/lead-off/reset/disconnect는 각각 별도 원인으로 기록한다. 재생 자료가 필요하면 사용자가 명시적으로 선택하고 source banner가 바뀌어야 한다. 실제 연결 버튼의 동작은 아직 이 프로토타입에 구현하지 않았다.

## 11. 수정 후 완료 판정

1. 수정한 component와 영향을 받는 source/state/metric을 기록한다.
2. 관련 수치·DOM 검사를 실행한다. 변경 목적과 상관없는 검사를 계속 늘리지 않는다.
3. HTML을 다시 빌드하고 portable 검사로 배포 파일도 같은 동작을 하는지 확인한다.
4. 시각 수정은 실제 브라우저에서 확인한다. 실행하지 못한 환경은 NV로 남긴다.
5. PLAN/WORKLOG에 목표·변경·증거·판정·남은 일·다음 행동을 적고 커밋한다.

현재 자동 검사 통과는 GUI 로직과 저장 자료 연결의 증거다. 제품 전체 승인에는 실제 브라우저·장치·현재 코드 재생성·행사장 조건 검증이 추가로 필요하다. 상세 체크리스트는 [07_verification.md](07_verification.md)를 사용한다.
