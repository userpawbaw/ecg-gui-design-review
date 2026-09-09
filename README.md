# ECG Signal Studio · GUI Design Review

ECG denoising 프로젝트를 원본 소스에서 다시 이해하고, 독립 설계안을 먼저 동결한 뒤 기존 GUI와 비교해 만든 연구용 프로토타입입니다.

**현재 결과: 최종 GUI·상세 명세·팀 설명·자동 검증 완료, 실제 브라우저와 AFE 검수는 조건부입니다.** 이름이 붙은 파형은 원본 프로젝트의 실제 저장 출력입니다. 이 화면에서 새 추론이나 실제 장치 측정을 실행하지 않습니다.

## 실행

저장소 전체를 다운로드한 뒤 [prototype/index.html](prototype/index.html)을 데스크톱 브라우저로 여세요. CSS/JS와 data 폴더가 함께 있어야 합니다. GitHub의 파일 페이지는 앱 실행 화면이 아닙니다.

단일 파일은 Node 24 이상에서 생성합니다.

```sh
npm run build
```

생성된 `dist/ecg-signal-studio.html`은 브라우저에서 바로 열 수 있는 오프라인 파일입니다. 외부 CDN·폰트·서버·Node 실행 의존성이 없습니다. 실제 브라우저 검수 상태는 아래 보고서에 구분합니다.

## 볼 수 있는 것

- **실험실:** D0/D1 × 7잡음 × 7SNR의 98장면, 12방법, 입력/FE/두 후보 공유축, hover 미리보기와 클릭 고정, 구간 비교·제거 성분, strict/scaled/α/CC.
- **전체 근거:** EXP-A D1 L1의 22 records 집계, 16개 방법·변형·oracle 행, mean/std/median/n. EXP-G 현재 장면과 범위를 분리합니다.
- **계측:** 장치 미연결, 진단 단계, 명시적 Replay. gap·warmup·FE reset은 UI 시연이며 실측값을 만들지 않습니다.
- **검토 기록:** source/blob, 선택 조건, 계측 시연 상태, 메모를 JSON으로 내보냅니다. 실제 실험 재실행 또는 자동 import 기능은 아닙니다.

## 문서

| 읽을 목적 | 문서 |
|---|---|
| 최종 화면 구성과 기능 범위 | [05_final_spec.md](docs/05_final_spec.md) |
| 팀 설명·38개 요소·디버깅·연동 | [06_team_guide.md](docs/06_team_guide.md) |
| 검사 결과·제약·배포 전 체크리스트 | [07_verification.md](docs/07_verification.md) |
| 지금 PC에서 할 조작·캡처·결과 기록 | [09_target_pc_check.md](docs/09_target_pc_check.md) |
| 기존안/독립안의 장단점과 채택 이유 | [04_comparison.md](docs/04_comparison.md) |
| 다른 프로젝트에 가져갈 규칙 | [08_manual_addendum.md](docs/08_manual_addendum.md) |
| 원본 목적·실제 계약 | [01_source_review.md](docs/01_source_review.md) |
| 비교 전 동결 설계·공통 기준 | [02_independent_design.md](docs/02_independent_design.md), [03_acceptance_rubric.md](docs/03_acceptance_rubric.md) |
| 중단 후 재개·단계별 증거 | [PLAN.md](PLAN.md), [WORKLOG.md](WORKLOG.md) |

## 검증 재현

Node 24 이상과 개발 의존성 jsdom 30.0.1을 사용합니다. 의존성은 HTML 자체 실행에는 필요하지 않습니다.

```sh
npm ci
npm test
npm run test:portable
npm run audit
```

1,078개 저장 출력 지표, 26개 DOM 과업 그룹, 배포 HTML의 6개 그룹을 검사했습니다. 팀 가이드의 38개 요소가 실제 DOM과 일치합니다. DOM host의 dialog/download shim은 렌더·focus·OS 다운로드를 증명하지 않습니다. 정확한 hash와 미검증 항목은 [portable-build.json](verification/portable-build.json)과 [검증 보고서](docs/07_verification.md)에 있습니다.

## 출처와 보존

원본: [userpawbaw/ECG_denoising_method_comparision](https://github.com/userpawbaw/ECG_denoising_method_comparision/tree/5eb27946087faca3c6e70b3925e2ba132b2ee680).

- 고정 source SHA: `5eb27946087faca3c6e70b3925e2ba132b2ee680`
- 파형 원본 blob: `4a94d1b79db95b8cb8afa5e8f944955d756c5db6`
- 독립안 동결: `bcd2f8d1516b4020895e6e17ed66107773504faa`. 원격 파일 검증 후 기존안을 열었습니다.
- `independent/`, `data/bank.js`, `data/provenance.json`은 보존합니다. 최종 수정은 `prototype/`, 확장은 `data/extension.js`에 있습니다.
- builder hash는 일치하지만 dataset hash가 달라 **ARCHIVED / 현재 코드 재현 확인 필요**로 표시합니다. 정확한 seed·lead·annotation·checkpoint 등 누락 metadata를 추정하지 않습니다.
- 원본 연구 코드와 데이터의 권리·이용 조건은 원본 저장소와 제공자의 조건을 따릅니다. 이 저장소는 원본 데이터에 새 라이선스를 부여하지 않습니다.

## 남은 통합

목표 PC의 브라우저·배율·키보드·스크린리더 검수, 최신 코드 bank 재생성, 병리 annotation·분포 export, 기존 bridge 어댑터·source/session 확장, 실제 AFE·전시장 시험이 남아 있습니다. 이전 16개 프레임과 10개 동선의 유지·통합·대기 사유는 최종 명세에서 추적합니다.

각 단계는 목표·산출물·검사·판정·다음 행동을 Markdown과 원격 검증 커밋으로 남깁니다. 이는 저장소의 작업 규칙이며 사용량 제한 중에도 계속 실행되는 서비스는 아닙니다.
