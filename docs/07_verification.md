# 최종 검증 보고서와 잔여 체크리스트

2026-09-09 · 대상 `prototype/`와 `dist/ecg-signal-studio.html` · **최종 판정: CONDITIONAL PASS**.

원본 분석→독립안 동결→기존안 비교→최종 구현·팀 문서→자동 검사의 순서를 완료했다. 저장 파형 연결과 계산·DOM 동작은 통과했다. 실제 렌더링·native 키보드·다운로드·장치 검증은 미완료다. 연구용 GUI 프로토타입의 조건부 완료이며 전체 프로그램·임상·현장 시연 적합 승인으로 확대하지 않는다.

## 1. 중단으로 인한 손실 검사

재개 시 GitHub main은 S3 commit `7eb0723a255d33ba9c85fbd12dde8c55d74af8cd`였다. 해당 tree의 19개 파일이 모두 로컬에 있었다. 당시 기존 파일 중 달라진 것은 의도적으로 확장한 preview 서버 하나였다. 독립안·기본 bank·provenance의 7개 동결 파일은 원래 blob과 일치했다. S4의 프로토타입·확장 파형·테스트 파일도 확인했다.

이 범위에서 작성 파일 손실은 발견되지 않았다. S4는 미커밋 상태였고, 이전 단일 HTML은 최신 코드보다 오래되어 재빌드했다. 임시 도구/REPL 세션은 복구 증거로 간주하지 않았다. 재개되지 않은 비동기 shell test는 다시 실행했다.

증거: [recovery-check.json](../verification/recovery-check.json), [S3-remote-tree.json](../verification/S3-remote-tree.json). 복구 체크포인트 `5b6b5ad24b25b480dbf0e49844075b697147d566`를 원격 커밋하고 19개 변경 파일의 blob을 다시 비교했다.

## 2. 독립 비교 절차

| 단계 | 증거 | 판정 |
|---|---|---|
| GitHub 쓰기 | README commit `82ee3f6f60eca15185c562a232dad50afa847b08`의 원격 내용 일치 | PASS |
| 소스 재이해 | [01_source_review.md](01_source_review.md), 원본 SHA `5eb27946087faca3c6e70b3925e2ba132b2ee680` | PASS / 실측 아님 |
| 독립안 동결 | `bcd2f8d1516b4020895e6e17ed66107773504faa`, 14개 파일 원격 확인 후 기존 자료 열람 | PASS / browser NV |
| 동일 기준 비교 | [공통 rubric](03_acceptance_rubric.md), [비교 문서](04_comparison.md) | 소스·문서 비교 완료 |
| 최종 통합 | S4 commit `b0299499b49736a4222e321df497bce0e6d1ec56`, prototype와 구성요소 인계 | 구현·명세 완료 / browser NV |
| 최종 검증 | 이 문서와 verification JSON, 최종 원격 tree 대조 | CONDITIONAL PASS |

기존안의 구성요소 설명·다중 비교·운영자 흐름을 유지하고 독립안의 실제 저장 데이터·FE 기준선·지표 규약·근거 분리를 결합했다. 방법 ID 오류, SAMPLE과 확정 문구의 충돌, 외부 CDN, 진폭 좌표의 불일치, 이전 결과 잔존, 문맥 없는 export를 수정했다. 시각적 우월성은 렌더 증거 없이 판정하지 않는다.

## 3. 실행한 자동 검사

| 검사 | 결과·범위 | 증거 |
|---|---|---|
| JavaScript 문법 | 최종 app/core/data/script/test 문법 통과 | Node `--check` |
| 계산 핵심 | known-input 10종, 기존 48장면·336출력 검산 | `tests/core.test.cjs` |
| 최종 데이터 | 98장면, 1,274 trace arrays, 1,078 저장 출력 지표 | [final-data-results.json](../verification/final-data-results.json) |
| GUI DOM | 26개 과업 그룹. 98조건·12방법·구간·preview·오류·Replay | [dom-results.json](../verification/dom-results.json) |
| 배포 HTML 실행 | 실제 inlined HTML의 6개 검사 그룹. JSON 내용·요청 파일명 확인 | [portable-results.json](../verification/portable-results.json) |
| 문서/구성요소 | 실제 38개 component와 팀 가이드 38개 항목 일치 | portable 검사 |
| 동결·링크·빌드 | 독립안과 관련 9개 파일 hash, 문서 로컬 링크, 빌드 input hash 일치 | [deliverable-audit.json](../verification/deliverable-audit.json) |
| 선택 색상 대비 | source의 18개 불투명 전경/배경 쌍이 지정 기준 충족 | 같은 audit JSON; 전체 접근성 인증 아님 |
| 기존 목업 감사 | FAIL: Floating UI core/dom, Lucide의 외부 CDN 3개 | 이전 `qa/audit_ecg_mockup.py` 실행 |

마지막 FAIL은 이전 산출물의 오프라인 결함을 재확인한 결과다. 기존 audit은 이전 frame ID와 파일을 검사하므로 새 프로토타입 검증기로 바꿔 해석하지 않았다.

최종 1,078출력 검산은 앞선 336출력 부분집합을 포함한다. 독립 표본처럼 합산하지 않는다. scaled SNR 재계산과 반올림 저장값의 최대 차이는 **0.0099355 dB**다. 같은 조건에서 SNR을 바꿀 때 참조의 최대 차이는 **0.000227906 mV**, 인접 입력 차분의 잡음 상관 최솟값은 **0.99999052**였다. int16 양자화와 공유 realization 구조에 일치하는 결과이며 최신 소스의 모델 재실행 증거는 아니다.

DOM host는 jsdom 30.0.1이다. native dialog 메서드는 test shim으로 대체했고 다운로드도 Blob 내용과 요청 파일명을 캡처했다. 실제 browser top layer, focus trap, Escape 기본 동작, OS 다운로드 폴더의 파일 저장 과정은 확인하지 않았다. 포인터 좌표 검사는 명시적으로 가정한 사각형의 변환만 검사했다.

## 4. 공통 rubric 판정

P=PARTIAL, NV=NOT VERIFIED. PASS는 적힌 증거 범위에 한한다.

| ID | 판정 | 확인 내용과 남은 부분 |
|---|---|---|
| R01 동일 입력 | PASS / metadata P | SNR 왕복 배열 일치, 14개 축·잡음 그룹의 record/segment·참조/잡음 일관성. 정확한 seed 필드 미제공 |
| R02 방법 교체 | PASS(DOM) | input·구간·진폭 유지, 선택·해설·지표 대응. M07/M10 대체 출력 없음 |
| R03 축·FE | PASS(코드/DOM), 화면 NV | 같은 sample/mV 좌표, FE 포함, clipping 고지. 실제 가독성 별도 |
| R04 지표 규약 | PASS(수치/문구) | strict/scaled/α, 평균 제거, 출력/개선량·범위 구분 |
| R05 사례/전체 | PASS(데이터/DOM) | EXP-G 장면·조건 평균과 EXP-A 집계 분리 |
| R06 출처 | PASS(표시), 최신 재현 NV | pinned source/blob, ARCHIVED, FE 참조, 상대 시간, 누락 metadata 명시 |
| R07 계측 | PASS(시연), 실기 NV | NO SESSION, 사용자 선택 Replay, 가까운 banner, 가짜 LIVE/측정값 없음 |
| R08 오류 | PASS(DOM) | 입력 손상 시 이전 결과 제거·재시도, 단일 방법 손상 시 다른 결과 유지 |
| R09 질환 주장 | PASS(주장 제한), 기능 P | annotation 없는 병명·합격 배지 없음; 병리 검토 연결 대기 |
| U01 첫 화면 이해 | NV(사용자 과업) | 질문·조건·범례 구조 존재. 첫 사용자 30초 이해 확인 미실시 |
| U02 hover/pinned | PASS(DOM), 포인터 NV | preview로 지표를 덮어쓰지 않음, leave 후 복원 |
| U03 구간 선택 | PASS(DOM), 실기 NV | 숫자·이동·클릭 변환·경계 처리. 실제 hit area 별도 |
| U04 방법 설명 | PASS(대응/문서), 이해도 NV | 원리·한계와 method mapping 확인 |
| U05 이동/복귀 | PASS(DOM), native focus NV | 조건 유지, 재생 정지, 복귀 핸들러 |
| U06 키보드 | P(구조) / 실기 NV | native controls·focus CSS·닫기 handler 있음. Tab/Enter/Escape 실기 미실시 |
| U07 모션 | P | 재생 제어·숨김 중지·CSS reduced motion 있음. OS 설정과 체감 NV |
| U08 해상도/확대 | NV | 반응형·dual 재배치 구현. 픽셀·잘림·Windows 배율 미검증 |
| U09 오프라인 | PASS(자산/DOM), browser NV | 외부 asset 0, 요청 금지 조건에서 실행. 실제 offline browser 확인 별도 |
| U10 팀 재현 | PASS(문서/내용), 다운로드 NV | 38개 요소 일치, source/context/notes/계측 상태 JSON. 자동 import 미구현 |

## 5. 배포 전 브라우저 체크리스트

이 환경의 브라우저는 local file URL을 정책으로 거절했고, 앱 파일만 제공하는 제한된 localhost 경로도 `ERR_BLOCKED_BY_CLIENT`로 막혔다. 추가 우회로를 시도하지 않았다. 아래 항목을 DOM PASS로 대체하지 않는다. 최종 GUI 실행 캡처가 없으며 이전 구성도는 실행 스크린샷이 아니다.

| 항목 | 실행·통과 조건 | 현재 |
|---|---|---|
| 로컬 단일 파일 | 인터넷을 끄고 HTML 열기; 장면·방법·표·dialog 동작, 외부 요청 0 | NV |
| 1440×900·1920×1080 | 첫 비교·SNR·방법·출처·진폭을 읽고 조작, 내용 잘림 없음 | NV |
| 1024×768·Windows 125/150% | 작은 라벨/선, 스크롤, 컨트롤, dialog 가독성 | NV |
| 200% zoom·좁은 폭 | 출처 유지, 컨트롤 겹침 없음, dual 세로 배치 | NV |
| 마우스 | hover/pinned, crosshair, 구간 click, fit, Replay 시연 | NV |
| 키보드 | skip-link, Tab 순서, focus, Enter/Space, slider 방향키, 숫자 입력 | NV |
| Dialog | 창 안 focus, Escape·닫기, 트리거로 복귀, 배경 조작 차단 | NV |
| 모션 축소 | OS 설정에서 CSS 전환 제거, 자동 재생 없음, 커서 중지 | NV |
| 스크린리더 | 화면명·값·선택·오류·status 읽힘, 매 프레임 낭독 없음 | NV |
| 다운로드 | 메모 포함 JSON 실제 저장·다시 열기, 한글·파일명·null 보존 | NV |
| 장시간 | 10분 조건 전환·복귀·창 열기, console 오류·반응 지연 확인 | NV |

색상 기준은 [W3C Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)의 일반 텍스트 4.5:1과 [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)의 관련 시각정보 3:1을 참고했다. 18개 선택 쌍만 검사했으므로 모든 상태·투명 배경·컨트롤 경계의 적합 판정은 아니다. [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)의 크기·간격·예외 조건도 실제 화면에서 확인한다.

## 6. 별도 데이터·장치 통합 게이트

| 게이트 | 필요한 일 | 완료 증거 |
|---|---|---|
| 최신 archive | dataset hash 차이 확인, 고정 checkpoint·split로 재생성 | source/model/data/hash/seed·지표 manifest |
| 병리 검토 | annotation·lead·절대 sample·split·resampling 연결 | beat/rhythm 실제 정렬, 검출 오차·제외 수 |
| 통계 상세 | 개별 record·조건·run·분포 export | 집계에서 같은 실험 사례로 추적, 임의 CI 없음 |
| 실시간 연결 | 기존 bridge GUI adapter, source/session/clock 계약 | raw/out/mask/reset/warmup/disconnect/Replay 실기 |
| 장치 수치 | fs·loss 분모·lead-off·ADC clipping·지연 정의 | 원시 로그와 GUI 일치, lat_ms를 E2E로 오인하지 않음 |
| 전시 운용 | 대상 모니터·터치·오프라인·복구·리허설 | 현장 과업·복구 경로 확인, 필요시 idle reset 도입 |

이 항목들은 화면 제작으로 완료할 수 없다. D3는 실제 장치 자료가 필요하다. 원본 코드가 존재하는 부분과 이 GUI의 통합·실측 상태를 구분한다.

## 7. 재검사와 완료 수준

```sh
npm ci
npm test
npm run test:portable
npm run audit
```

`test:portable`은 source를 다시 빌드한다. audit은 동결 파일, 문서 링크, source/build hash, 선택 palette를 확인한다. 원격 커밋 후 blob을 대조한 기록은 WORKLOG와 Git history로 추적한다. 최종 commit SHA를 그 commit 자체에 넣는 자기참조는 하지 않는다.

| 완료 수준 | 이번 결론 |
|---|---|
| 범용 매뉴얼 | 기존본 유지·보강 부록 완료 |
| 상세 구성 설계 | 최종 명세·38요소 팀 설명 완료 |
| 프로토타입 | 구현·데이터/DOM 검사 완료, 브라우저 검수 조건부 |
| 실제 데이터/출력 | 저장 bank 연결 완료, 최신 재추론·annotation 연결 미완료 |
| Live AFE | source bridge 존재, 이 GUI 통합과 실기 미완료 |
| 전시장·사용성 | 미검증 |

다음 작업은 목표 PC에서 브라우저 체크리스트를 실행하고 캡처·오류·검토 JSON을 기록하는 것이다. 이후 현재 코드로 bank를 재생성하고 기존 bridge adapter를 연결한다.
