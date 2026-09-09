# 기존안 · 독립안 비교와 최종 결정

비교 시작: 2026-09-09. 독립안 동결 커밋: `bcd2f8d1516b4020895e6e17ed66107773504faa`.
이 커밋의 원격 tree와 14개 파일 blob hash를 확인한 뒤 기존 자료를 열었다. 먼저 보이는 대화는 지울 수 없지만 이전 파일 재열람과 설계 수정의 순서는 지켰다.

## 1. 비교 대상과 증거 범위

| 버전 | 확인 자료 | 성격 |
|---|---|---|
| A · 이전 Option B | `ecg-gui-complete-mockup.html`(223,347 bytes), 팀 가이드 v1.0, 검증 체크리스트, 범용 매뉴얼 DOCX, Compare/Benchmark 구성도 PNG | 대화에서 만든 5개 주 화면, 16개 대표 상태의 고해상도 목업. sample 파형/수치 |
| B · 이번 독립안 | 동결 커밋의 `independent/`, docs/02, docs/03 | 원본 저장 출력에 연결한 실험실·전체 근거·계측, 48 조건 |
| C · 원본 저장소 GUI | pinned SHA의 `demo/index.html`, `demo/live.html`, `demo/mockup_expo.html`, docs/31 | 실제 저장 파형 player, SSE live client, 별도 합성 설명용 expo 목업 |

소스·데이터·문서 검토는 수행했다. 이전 구성도 2장은 직접 확인했으나 실행 캡처가 아닌 SPEC WIREFRAME임을 유지한다. 클라우드 브라우저의 file/localhost 제한으로 이 단계에서 실제 렌더링과 포인터 조작 검사는 완료하지 못했다. 따라서 “어느 화면이 눈으로 더 아름답다”는 우열은 판정하지 않는다.

## 2. 기존안이 더 잘한 부분

| 장점 | 확인한 근거 | 최종안 반영 |
|---|---|---|
| 설명 가능한 구성요소 | 팀 가이드 G01–G06, C01–C10, M01–M10, P/B/L/D 별 역할·이유·고장 증상 | 최종 component ID와 디버깅 계약 유지. ID는 제품 화면의 주인공으로 표시하지 않음 |
| 사용 상황별 동선 | 관람객 30–60초, 심사위원 3–5분, 운영자 Diagnostics | 실험실 위에 명시적인 짧은 안내 동선 추가 |
| 다중 비교와 고정/미리보기 | Compare 최대 4방법, shared crosshair, pinned Inspector, Focus band | 입력·FE·비교 방법·선택 방법의 최대 4행, 미리보기와 선택 분리 |
| 병리 형태와 리듬 구분 | Pathology의 한 박동 vs 12초 AFIB rhythm, OOD 분리 | 현재 데이터에서 구간 형태 비교 유지. annotation 연결 전 질환 프리셋은 사용 불가 이유·연결 계약으로 보존 |
| 운영자 진단 모델 | PORT→FRAME→DECODE→BUFFER→RENDER와 이벤트 로그 | 계측의 진단 상세 및 재현 기록에 수용. 미측정 숫자는 대시 |
| 실패/예외를 설명한 인계 | SAME CONTEXT, STALE, partial failure, replay, source banner 계약 | 최종 오류 처리·회귀 테스트·인계표로 구체화 |

범용 GUI 매뉴얼의 핵심 논리는 유효하다. 특히 “추가”를 기존 화면의 결함 보충뿐 아니라 질문·근거·시간·오류 모델의 분리 필요로 판단하는 기준을 유지한다.

## 3. 기존안에서 고쳐야 할 부분

### P0 · 실제 프로젝트와 다른 방법 이름

| ID | 이전 목업의 `methods` | 원본 코드/설계 기준 |
|---|---|---|
| M05 | Savitzky–Golay | Sameni EKF/EKS |
| M06 | Sameni Kalman | Residual 1D U-Net |
| M09 | 1D U-Net | CNN + Transformer |
| M10 | SWT-CNN hybrid | Dilated ResNet(다운샘플링 없는 dilated residual CNN); Wavelet-subband U-Net은 M08 |
| M02 | UI component ID로도 사용 | 실제 방법에서는 Savitzky–Golay |

방법 ID와 component ID가 같은 짧은 기호를 쓰는 점도 디버깅 혼동을 만든다. 최종은 `LAB-xx`, `EVD-xx`, `ACQ-xx`와 실제 `Mxx`를 구별한다. 실제 registry는 이미 있으므로 “registry 전체를 새로 구현”하는 것이 아니라 GUI adapter와 DL checkpoint metadata를 연결해야 한다.

### P0 · sample 표시와 성공 문구의 충돌

이전 목업은 `SAMPLE DATA/STREAM/AGGREGATE`를 표시하며 팀 가이드도 이를 정직하게 설명한다. 이 자체는 잘한 점이다. 그러나 동시에 다음 문구가 남는다.

- footer: `Same input verified`, `Pipeline v0.9.0`.
- 수동 생성한 pathology 파형 옆 “기준 오차 안에서 유지”, “Spike retention 97.2%”.
- benchmark의 formula-generated 결과·CI와 `TEST/UNSEEN`, `18 records`, `540 windows`.
- diagnostics의 고정 COM5·CRC OK·clock drift·end-to-end 수치.

sample badge가 모든 확정 문구를 무효화해 주지는 않는다. 최종은 실제 저장 출력·계산 가능한 값만 쓰고, 없는 정보는 없다고 표시한다. 합성 fixture가 필요하면 가장 가까운 상태 영역에 시뮬레이션임을 표시한다.

### P1 · 검증 판정이 구현 증거보다 강함

기존 체크리스트는 16/16 프레임, 10/10 hotspot, 접근성 구조 PASS를 준다. 이는 구조 인벤토리로는 유용하지만 label·selector·CSS가 있다는 사실은 실제 키보드·focus·동작 통과 증거가 아니다. 최종은 구조, 계산, DOM 행동, 브라우저 렌더, 실기 검증을 별개 열로 기록한다.

### P1 · 오프라인 요구 미충족

이전 배포본은 Floating UI 2개와 Lucide 1개를 외부 CDN에 의존한다. 기존 팀 가이드가 이미 KNOWN ISSUE로 적었으므로 새로 발견한 문제처럼 주장하지 않는다. 최종에는 외부 asset 요청 없이 실행되는 로컬 JS·CSS·SVG를 사용한다.

### P1 · 사용 가능 데이터와 완성 프레임의 불일치

병리 annotation·benchmark CI·Live 복구 화면이 있다는 이유로 그 기능을 실험에 바로 적용할 수는 없다. 360Hz 예시와 현재 처리 250Hz, fake absolute timestamp/seed/version도 실제 계약으로 교체해야 한다. 원본 360Hz와 처리 250Hz는 둘 다 맞지만 역할이 다르다.

## 4. 독립안이 더 잘한 부분과 부족한 부분

| 항목 | 독립안 강점 | 독립안 약점·최종 수정 |
|---|---|---|
| 실제 근거 | source SHA·bank blob 검증, 실제 336 출력 지표 검산 | 48조건·7방법만 골라 25dB, impulse, L1/L6 비교를 빠뜨림 → 원본 export 전체로 확장 |
| 지표 | strict/scaled/α를 함께 표시, EXP-A와 EXP-G 분리 | EXP-G의 현재 장면 vs 조건 평균이 출처 문장에만 있음 → 가까운 상세 표로 제공 |
| 정보 계층 | 입력·FE·선택 출력을 하나의 흐름으로 배치 | FE 외 고전/DL 두 후보를 동시에 고정하기 어려움 → 비교 후보 한 행 추가 |
| 구간 focus | 동일 배열·같은 축·숫자/버튼으로 이동 | 입력 대비와 참조 대비를 따로 기억해야 함 → 좌/우 동시 비교 보기 추가 |
| 정직한 계측 | 미연결·unknown·no reference를 기본으로 함 | 빈 상태 중심이라 개발자가 state transition을 점검하기 부족 → 진단 상세·frame 계약 보강 |
| 반응형 | 세로 재배치와 native controls | 950px 아래 record summary를 숨기며 record가 다른 곳에 충분히 보이지 않음 → source note에 항상 남김 |
| 렌더 규약 | 행별 자동 정규화 없음 | 경계 padding과 ±mV grid 위치의 정의를 일치시켜야 함 → 좌표 식 수정 |
| 오류 복구 | 데이터 오류 메시지와 metric 대시 | 실패 직전 focus 설명이 남을 수 있고 재시도 버튼 없음 → 결과 영역 비우기·복구 버튼·부분 실패 분리 |
| 완성도 | 독립안 작성 후 동결 절차 준수 | 실제 브라우저 렌더 미검증 → 최종 보고서에서도 유보, 동작 테스트로 대체했다고 주장하지 않음 |

## 5. 원본 저장소 GUI에서 추가로 가져올 것과 주의할 것

`demo/index.html`은 원본 배열과 같은 축, 장면 선정 이유, 구간 값/축 평균, 7단계 SNR, 여러 방법, Sweep/Scroll/Freeze를 이미 구현한다. `demo/live.html`은 EventSource, ring buffer, ok mask, FE metadata 요청, reset 처리 등을 구현한다. 이 두 파일을 단순 정적 mockup과 같은 미구현 상태로 분류하면 안 된다.

수용:

- 7단계(−5…25dB), 실제 전체 방법 export, L1/L6 보조 비교.
- FE가 충분한 조건과 방법 간 차이가 작은 조건도 관찰하는 안내.
- 조건 평균·왜 이 장면인지에 대한 설명.
- frame index·mask·FE reset을 UI 데이터 계약의 기준으로 삼음.

수정:

- `mockup_expo.html`은 실제 mean dB에서 noise attenuation을 역산한 합성 예시다. 실제 방법 output 재현이 아니므로 최종 파형으로 재사용하지 않는다.
- 같은 record가 유지되는 것은 **같은 axis/condition 안에서 SNR을 바꿀 때**다. noise를 바꾸면 선정 record도 달라지므로 “잡음만 바뀌었다/같은 박동”이라고 말하지 않는다.
- floor p95는 해당 metric·reference·검출 절차의 오차 기준이다. 임의의 평균 차이에 고정 ±FLOOR 띠를 붙여 “동등/구분 불가”라고 판정하지 않는다.
- source live의 `/stream` 접속만으로 LIVE/REPLAY source를 확정하지 않는다. session/source envelope가 필요하다.
- `lat_ms`를 end-to-end latency라고 부르지 않는다.
- archive notes의 FE 40Hz·oracle 전체 방법 상한 등 오래된 설명을 재사용하지 않는다.

## 6. 공통 rubric의 비교 결과

P=부분 충족, NV=실제 동작 미검증. 단순 총점으로 상쇄하지 않는다.

| 기준 | A 이전 목업 | B 독립안 동결 | 최종 판단 |
|---|---|---|---|
| R01 동일 입력·SNR | SAMPLE, 실제 동일 run NV | source 구조·배열/record 검사 PASS, 브라우저 NV | 같은 조건 내 SNR 불변 테스트 확대 |
| R02 ID·선택·설명 | FAIL: ID mapping 불일치 | 코드 대응 PASS, UI 실기 NV | 실제 method mapping·DOM 동작 검사 |
| R03 공정한 축·FE | FE 비교 기준 누락, SAMPLE | FE 포함, 좌표 padding 수정 필요 | 통일 축·clipping·FE 유지 |
| R04 보정 SNR | ΔSNR 의미 부족 | strict/scaled/α 포함 | 의미 유지·local vs aggregate 구분 |
| R05 전체 근거 | 별도 화면 강점, 수치 SAMPLE | 실제 EXP-A, EXP-G 분리 | 두 범위를 선택적으로 제공 |
| R06 출처 | 문서 우수, UI 고정 예시 많음 | archive/missing 명시 | source summary·export 추가 |
| R07/08 실시간·오류 | 풍부한 상태, 값 SAMPLE | honest empty, recovery 부족 | 상태 시뮬레이션·검증 계약 |
| R09 병리 보존 | UI 구상 좋음, synthetic success 문구 | 미제공 annotation과 floor 명시 | 기능 축소 사유·연결 기준 유지 |
| U01/04 설명력 | 팀 문서 우수 | method 설명 연결 | 역할·증상·수정 위치까지 인계 |
| U02/03 선택 | 풍부한 hover/drag, 실기 NV | 숫자/버튼 대안, 실기 NV | DOM 회귀 + 브라우저 NV 구분 |
| U05/06/07/08 | 구조 있음, 실기 NV | 구조 있음, 실기 NV | 검증 범위 분리 |
| U09 오프라인 | FAIL: 외부 CDN | 외부 의존 없음, browser NV | 요청 금지 DOM 실행 테스트 |
| U10 팀 재현 | template와 설명 우수 | export 미구현 | 현재 조건 JSON export 추가 |

## 7. 최종 제작으로 넘기는 결정

독립안의 3 작업 공간과 실제 데이터·수치 규약을 기반으로, 기존안의 다중 비교·짧은 시연 동선·요소별 디버깅 설명을 결합한다. 기존 16개 frame을 숫자만 맞춰 복제하지 않는다. 다음 문서에서 각 frame의 유지/통합/대기 이유를 한 줄씩 추적한다.

우선순위: 정확한 ID와 데이터 → 같은 조건의 다중 비교 → 국소/전체 근거 → 오류/재현 → 모션·시각 점검. 새 method output·annotation·실측을 이 작업 중 임의 생성하지 않는다.
