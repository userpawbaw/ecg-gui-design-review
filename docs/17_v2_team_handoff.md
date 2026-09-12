# ECG Signal Studio v2.2 — 팀 실행·디버깅 안내

2026-09-12. 구현과 자동 데이터/상태 검증을 완료한 검수용 빌드다. 실제 브라우저 렌더링·전시장 사용성·AFE 검증 완료를 뜻하지 않는다.

## 실행

실행 ZIP을 전체 압축 해제하고 Node.js 24 이상이 설치된 Windows에서 `START_WINDOWS.cmd`를 실행한다. `http://127.0.0.1:4173`을 연다. Node는 최초 설치가 필요하고, 설치 후 앱 실행은 인터넷이 필요 없는 구조다. 서버 콘솔에서 Ctrl+C로 종료한다. ZIP 안의 `app/index.html`을 직접 더블클릭하면 청크 fetch/해시 검증이 동작하지 않을 수 있으므로 로컬 서버를 사용한다.

저장소에서 개발할 경우:

```sh
node scripts/prepare-v2.cjs
cd prototype/v2
npm ci
npm run dev
```

Git에는 대용량 생성 자료를 넣지 않았다. 실행 ZIP의 `app/replay`를 `prototype/v2/public/replay`에 복사하면 10분 자료를 개발 서버에서도 사용한다. 추론 원본 JSON을 다시 생성할 때는 `scripts/fetch-inference-source.py`, `scripts/build-long-replay.py`, `scripts/package-long-replay.py`를 사용한다. 소스 SHA와 체크포인트·설정·해시를 확인하지 않고 기존 파일 존재 여부만으로 혼합 재개하지 않는다. 재학습은 필요하지 않다.

## 각 영역을 설명하는 방법

| 영역 | 사용자에게 전달할 내용 | 디버깅 확인점 |
|---|---|---|
| 조건 선택 | D0 합성 ECG / D1 MITDB 111, noise preset, 주입 SNR 선택 | 선택 요청과 실제 표시 장면의 조건을 구별 |
| 입력·출력 | 같은 source sample/time, 같은 mV 범위 | 파형을 각자 autoscale하거나 시간 이동시키지 않음 |
| Reference | FE 처리 기준 신호를 회색으로 표시 | raw와 Reference 정의 구분; opacity는 평가값에 영향 없음 |
| Sweep | 이전 주기를 짧은 지우기 경계로 갱신 | wrap 접점 가짜 직선, 미래 샘플, 전체 잔상 여부 |
| Scroll | 오른쪽 최신 표본, 왼쪽 과거 | 30초 경계에서도 sample index 연속성 |
| Pause / 구간 고정 | 정지된 Sweep과 연속 고정 구간은 다름 | 고정 후 방법 변경에도 구간 유지 |
| 방법 rail | 대표군부터 선택, 전체 방법 펼침 | hover/focus는 점선 후보이고 클릭 선택·지표 변경과 별개 |
| Pin | 현재 방법을 세 번째 비교 대상으로 유지 | 클릭으로 selected를 바꿔도 pinned 불변 |
| Reference와 차이 | Output−Reference, ×1/3/5는 표시 확대 | Input−Output residual과 혼동 금지 |
| 근거 | Local / Session / Experiment의 서로 다른 범위 | 600초 Session을 캐시된 일부 구간으로 계산하지 않음 |
| 출처 | record·fs·시작·seed·checkpoint·원본 SHA | GUI 애니메이션을 실제 LIVE로 표시하지 않음 |
| 시연 장면 | 고정 조건의 10–20초 구간 A/B/C | 출력 우세를 보고 위치 선정하지 않았음; 우세 보장 안 함 |
| Attract | 현재 장면의 명시적인 10초 반복 | 600초 데이터와 구분; 인계 시 같은 시각 유지 |
| 무인 운영 | opt-in 180초 + 10초 취소 안내 | 발표 창/메모 존재 시 reset 억제, 자료/메모 삭제 없음 |
| 오류 안내 | 마지막 유효 파형과 라벨을 유지 | 새 라벨 + 이전 출력 혼합 금지; 재시도/취소 가능 |
| 이전 상세 분석·계측 | S5 기능을 별도 작업 공간으로 보존 | 새 화면과 선택 동기화되지 않음; 실제 장치 미연결 |

## 자료 범위

98조건 = 2 axis × 기존 7 noise presets × 7 SNR. 조건마다 600초/150,000samples/250Hz. D1은 MITDB 111 MLII, D0는 합성 TEST S022다. 잡음은 기존 소스의 **합성 preset**이며 NSTDB 실측 잡음 조합을 새로 생성한 결과가 아니다. 여러 질환 레코드/annotation 확대는 이번 자료 범위에 없다.

Reference/Input와 처리 11개 채널(M_FE, M01–M05, B01, M06, M06L6, M08, M09), 총 13채널이다. UI의 M00은 input 별칭이다. B01은 Reference를 사용하는 oracle 비교군이며 실제 장치 적용 후보와 구분한다. M07/M10은 현재 GUI 지원 목록에 없으며 자동으로 다른 모델로 대체하지 않는다.

610초를 처리한 뒤 앞뒤 5초 guard를 제외했다. 30초 chunk는 처리 완료 자료를 나눈 저장 단위이지 필터/모델 상태 reset 지점이 아니다. 같은 axis의 모든 조건에서 원 ECG hash가 같음을 확인했다. 98조건에 대해 1,078개 처리 출력 지표를 검증했고 SNR 차이 허용값 0.05dB 이내였다. 자세한 tolerance 및 파일 hash는 `verification/v2-long-data.json`에 있다.

일부 원본 D1 체크포인트에는 명시적인 data_win 설정이 없어 원본 wrapper의 1024 fallback을 사용한다. 표시 metadata의 data_win은 실제 적용값이며 체크포인트가 명시했다는 뜻은 아니다. 실제 추론 시간을 재생 지연 또는 LIVE latency라고 해석하지 않는다.

## PC 자동 검수

ZIP의 `qa` 폴더에서 최초 한 번:

```sh
npm install
npx playwright install chromium
npm test
```

Playwright는 개발용 선택 의존성이며 평상시 앱 실행에는 필요 없다. 이 명령은 **사용자 PC 브라우저**를 실행한다. 이 작업 환경에서 이미 실행된 것으로 보고하지 않는다. 눈으로 과정을 보고 싶으면 `npm run test:headed`를 쓴다. 실제 10분 재생 테스트는 PowerShell에서 `$env:ECG_SOAK="1"` 설정 후 `npm test`다. 빠른 자동 검수와 10분 실시간 검수는 별개다.

결과 폴더 `test-results`와 `playwright-report`에는 screenshot/video/trace/결과 JSON이 남는다. 공유할 우선 자료는 큰 창 Sweep·Scroll·Pin·Difference 화면, 1366×768 화면, `review.json`, 실패 trace다. 화면에 안 보이는 요소를 억지로 클릭하는 테스트 통과를 사용성 PASS로 취급하지 않는다.

## 현재 한계와 다음 판정

- native dialog 포커스·Escape·다운로드·키보드 및 실제 터치: NOT VERIFIED.
- 화면 공간 도면을 CSS로 옮겼지만 1080p/768p의 실제 overflow·OS 배율·1m 가독성·60fps: NOT VERIFIED. 큰 창은 내용이 넘치면 스크롤을 허용한다. “발표 중 스크롤 없음” 목표는 PC 검수 후 조정한다.
- Attract/idle의 긴 실제 운영 및 브라우저 background throttling: NOT VERIFIED. 청크/시계 단위 테스트를 실제 10분 soak 완료로 대체하지 않는다.
- 새 자료 요청은 우선 Pause하고, 성공 시 직전 재생 의도가 유지된 경우에만 자동 재개한다. 대기 중 구간 고정/탐색/정지 의도가 있으면 자동 재개를 취소한다. 실제 요청 경합·브라우저 동작은 PC에서 추가 확인한다.
- timeline에는 현재 viewport, 현재 조건에 해당하는 시연 구간 marker, 같은 조건의 개인 북마크가 표시된다. marker가 밀집한 경우 실제 PC에서 겹침을 확인해야 한다. 자유 드래그 범위 브러시는 제공하지 않는다.
- strict/scaled 지표 정의는 유지하며 대형 Inspector의 상세 정보량과 작은 화면 3행 조작성은 후속 사용자 피드백으로 다듬는다.
- 실제 AFE 연결과 병리 보존 검증은 별도 통합 단계다.

전체 판정은 **구현·데이터 통합 CONDITIONAL PASS / 실제 브라우저·전시 검수 대기**다. 최종 완료를 위해 남은 순서는 위 UI 디테일 보완 → PC 결과 확인·수정 → 팀 문서 최종 갱신이다.

## 데이터 출처 표기

MIT-BIH Arrhythmia Database v1.0.0, George Moody / Roger Mark, PhysioNet: https://physionet.org/content/mitdb/1.0.0/ , DOI https://doi.org/10.13026/C2F305 . 파일 라이선스: Open Data Commons Attribution License v1.0 (https://physionet.org/content/mitdb/view-license/1.0.0/).

Moody GB, Mark RG. The impact of the MIT-BIH Arrhythmia Database. IEEE Engineering in Medicine and Biology 20(3):45–50, 2001. PhysioNet 표준 인용: Pollard et al., PhysioNet as a global platform for biomedical research, Nature Health, 2026, https://doi.org/10.1038/s44360-026-00096-z . D1 자료는 원 기록을 resample·전처리하고 합성 잡음을 섞은 파생 자료다.
