# O — UI/UX Incidents

형식은 `../10_RECORD_KEEPING.md`를 따른다.  
판별 질문: **"같은 일이 또 나면 다시 시간을 잃는가?"**

---

## O-001. repository-wide execution lock이 stale 상태로 남아 관계없는 작업까지 막았다

| | |
|---|---|
| 시점 | 2026-09-16 `[대화]` `[커밋]` |
| 잃은 것 | UI/UX 문서 업로드 지연, 세션 간 병렬 작업 차단 |
| 재발 방지 | global mutex 폐기, resource-scoped conflict policy로 교체 |

### 증상
Work 사용량 제한으로 중단된 뒤 `execution_lock.active=true`가 남아 있었고, 실제 실행이 없는데도 Chat에서 UI/UX 시스템 문서를 GitHub에 반영하지 못했다. `[대화]`

### 원인
동시 실행 문제를 **세션/기기 존재 여부**로 모델링하고, 저장소 전체를 하나의 mutex로 잠갔다. 그러나 실제 충돌 위험은 같은 파일·같은 generated output·같은 release/deployment·같은 long-running job 등 **resource 단위**였다. `[추론]`

### 조치
`execution_lock`을 폐기하고 `WORK_STATE`를 상태/체크포인트 기록으로 되돌렸다. `WORK_RESUME_POLICY.md` v1.2와 `docs/23_concurrency_and_resume_policy_revision.md`에서 resource-scoped conflict만 조정하도록 변경했다. `[커밋]`

### 재발 방지와 자동화 상태
- 다른 세션이 있다는 이유만으로 관계없는 docs/UI/code 작업을 막지 않는다.
- 시작/재개 시 remote SHA와 관련 파일을 확인한다.
- 실제 충돌 resource만 `active_jobs` 등 advisory state로 표시할 수 있다.
- force push로 다른 변경을 덮지 않는다.

자동 검사는 아니지만 `AGENTS.md`, `WORK_RESUME_POLICY.md`, `00_UIUX_MASTER.md`의 상위 운영 규칙으로 승급됐다. `[커밋]`

## O-002. OpenCV를 설치하다 시스템 numpy가 2.x로 올라가 Blender(bpy)가 깨졌다

| | |
|---|---|
| 시점 | 2026-09-26, AI 영상 입고 QA 도구 준비 중 `[런타임]` |
| 잃은 것 | 되돌리기 1회, 이후 모든 Blender 베이크·렌더 스크립트가 깨질 위험 |
| 재발 방지 | 시스템 파이썬은 numpy 1.26 고정 + OpenCV 4.10(호환판). torch·transformers 같은 ML 의존성은 별도 가상환경 |

### 증상
`pip install opencv-python-headless`가 최신 OpenCV와 함께 numpy 2.4.6을 설치했고, pip가 "bpy 4.5.3 requires numpy<2.0" 경고를 냈다 `[런타임]`.

### 원인
bpy·OpenCV·torch가 같은 시스템 파이썬을 공유하는데 버전 고정이 없었다 `[추론]`.

### 조치
`numpy>=1.26,<2.0`과 `opencv-python-headless==4.10.0.84`로 되돌리고 `import bpy`를 확인했다. 깊이 추정(torch 2.14 CPU, transformers 5.17, torchvision)은 scratchpad 가상환경에 따로 설치했다 `[런타임]`.

### 재발 방지와 자동화 상태
- 시스템 파이썬에 패키지를 더할 때는 `import bpy`를 바로 확인한다.
- 무거운 ML 의존성은 가상환경에서만. `25` §3 스택 기준에 명시. 자동 검사는 없음.

## O-003. 사용자가 로컬에서 AI 영상 플레이어를 열자 `loading frames 0%`에서 멈췄다

| | |
|---|---|
| 시점 | 2026-09-26, 사용자 로컬 확인 "loading frame 0%에서 바뀌지 않네. readme도 없는데" `[대화]` |
| 잃은 것 | 사용자 검증 시도 1회, 신뢰 |
| 재발 방지 | 생성 데이터에 의존하는 spike는 준비 명령·README·누락 시 화면 안내를 갖추고, 깨끗한 클론 기준으로 확인한다 |

### 증상
플레이어가 로딩 화면에서 오류 표시 없이 0 %에 머물렀다 `[대화]`.

### 원인
플레이어가 읽는 `public/clips/`는 `.gitignore` 대상이었고, 대역 영상 원본(다락방·지구 렌더, 깊이 맵)은 AI의 scratchpad에만 있었다 `[코드]`. 매니페스트 요청이 실패하면 예외만 나고 화면은 초기 문구(0 %)에 그대로 남았다 `[코드]`. AI의 모든 시험은 원본이 있는 컨테이너에서만 돌았다 — "내 환경에서 PASS"가 "받은 사람도 실행 가능"을 뜻하지 않았다 `[추론]`.

### 조치
대역 원본을 재압축해 `prototype/spikes/video-scrub/standins/`(5.3 MB)로 커밋, `npm run clips` 한 번으로 시험 영상 5개 생성, 매니페스트·프레임이 없으면 이유와 명령을 화면에 표시, README(준비·URL별 확인 항목)를 추가했다. `public/clips/`를 지운 상태에서 `npm run clips` → 개발 서버에서 없는 클립 안내·pan·attic·globe 로딩을 확인했다 `[테스트]`.

### 재발 방지와 자동화 상태
- spike를 "사용자가 확인할 수 있다"고 보고하기 전에: README, 준비 명령, 누락 안내, 커밋된 원본만으로 재생성되는지(깨끗한 상태) 확인.
- 자동 검사 없음 — 체크리스트 §9(커밋 전)에 항목 추가.

## O-004. 한국어 Windows에서 파이썬 도구가 UTF-8 JSON을 cp949로 읽다가 멈췄다 — 반복되던 오류

| | |
|---|---|
| 시점 | 2026-09-27, 사용자 로컬 `npm run clips` 실행 `[대화]` |
| 잃은 것 | 사용자 확인 시도 1회. 사용자 말: "cp 949 에러는 항상 생기는 오류인데, 매번 강제로 utf-8로 읽도록 수정해야 하니 번거롭네" |
| 재발 방지 | `tests/encoding.test.cjs`(npm test 포함, `npm run encoding:check`) + 스크립트 실행 시 `PYTHONUTF8=1` |

### 증상
`check_video.py` 23번 줄 `json.load(open(a.brief))`에서 `UnicodeDecodeError: 'cp949' codec can't decode byte 0xe2` — 브리프 JSON의 UTF-8 문자(×, — 등) `[대화]`.

### 원인
파이썬은 `open()`에 encoding이 없으면 OS 로캘 인코딩을 쓴다. 한국어 Windows는 cp949, AI가 시험하는 Linux 컨테이너는 UTF-8이라 AI 쪽 시험에서는 한 번도 드러나지 않았다 `[추론]`. 저장소 파이썬 18개 파일에 인코딩 없는 텍스트 파일 접근이 30곳 있었다 `[코드]`.

### 조치
30곳 모두 `encoding='utf-8'` 추가(바이너리 `rb`·`Image.open`·`urlopen` 제외). 모든 파일 `py_compile` 통과. 정적 검사 테스트를 만들어 수정 전 `check_video.py`로 되돌리면 23·117·149·150번 줄 4곳을 잡는 것을 확인했다 `[테스트]`. Windows 실기 재실행은 사용자 확인 대기.

### 재발 방지와 자동화 상태
- **자동화됨**: `npm test`가 모든 추적 파이썬 파일의 `open`/`read_text`/`write_text`에 인코딩이 있는지 검사(검사기 자체 시험 7개 포함).
- Node에서 파이썬을 부를 때는 `PYTHONUTF8=1`을 넘긴다(두 번째 방어).
- 체크리스트 §9에 "Windows(cp949) 사용자" 항목.

