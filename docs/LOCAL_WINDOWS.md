# Windows에서 로컬 실행하기 (VS Code 터미널)

대상: Windows + VS Code + Edge, Python 3.14(cp949 로캘). 2026-09-28 정리(O-005).

**원칙: 터미널에는 `npm run …` 한 줄만 친다.** `&&`, `python3`, 경로 이동, UTF-8 설정, 의존성 설치, 자료 준비는 `scripts/local/run.mjs`가 대신 한다. 명령을 치기 싫으면 VS Code에서 `Ctrl+Shift+P` → **Tasks: Run Task** → 아래 작업 이름을 고르면 된다(`.vscode/tasks.json`, Windows에서는 cmd.exe로 실행).

## 1. 처음 한 번

| 순서 | 명령 | 하는 일 |
|---|---|---|
| 1 | Node **22 이상**(권장 24 LTS) 설치 — https://nodejs.org | |
| 2 | `npm run doctor` | Node·npm·Python·OpenCV·브라우저·줄바꿈·코드 페이지 점검, 고칠 방법 출력 |
| 3 | `npm run browsers` | 브라우저 테스트용 Chromium 설치(테스트를 돌릴 때만). `ref:capture`는 Edge가 있으면 Edge를 쓴다(`doctor`가 확인) |
| 4 | `npm run py:setup` | 영상 도구용 numpy·OpenCV 설치(`tools/video-qa/requirements-local.txt`, 영상 도구를 쓸 때만) |

## 2. 자주 쓰는 명령

| 명령 | VS Code 작업 이름 | 결과 |
|---|---|---|
| `npm run story` | ② R1 Story 실행 | 자료 준비(처음만) → 의존성 설치(처음만) → http://127.0.0.1:5173/ 을 Edge로 엶. 끝낼 때 `Ctrl+C` |
| `npm run story:check` | ③ R1 Story 검사 | 빌드 + 단위 테스트 + 브라우저 테스트. 600초 replay 자료가 없으면 chunk 테스트 1개와 10분 soak는 원래 실패/건너뜀 |
| `npm test` | 저장소 전체 테스트 | 기록·인코딩·Windows 호환성 검사 |
| `npm run spike -- video-scrub` | video-scrub spike 실행 | 의존성·클립 준비 후 실행. `attic`, `ref-repro`, `lab-corner`, `scroll-globe`도 같은 방식 |
| `npm run py -- tools/video-qa/check_video.py <영상> --brief <json>` | — | 맞는 Python(py → python → python3)을 찾아 UTF-8로 실행 |
| `npm run ref:capture -- <url>` 또는 `-- story` | — | 레퍼런스 사이트/우리 앱을 **Edge 창을 띄워** 같은 휠 대본으로 캡처: A층(가상 시계 16 ms 프레임 PNG) + B층(실시간 성능 추적) + 자산·라이브러리 목록. 결과는 `%USERPROFILE%ecg-captures<host>-<날짜-시각>`(저장소 밖). 옵션·읽는 법: `tools/reference-capture/README.md` |
| `npm run ref:sheet -- <폴더>` / `-- <레퍼런스 폴더> <story 폴더>` | — | 구간별 12장 시트 / 같은 구간 나란히 비교 시트 |
| `npm run ref:capture -- selftest` | — | 도구 자체 시험(정답이 알려진 페이지로 가상 시계·CSS 보정·결정성 확인) |

Story 주소 옵션: `?route=lab`(Lab부터), `?step=3`(단계 바로 가기), `?reduced=1`(움직임 줄이기).

## 3. 자주 나는 오류와 원인

| 증상 | 원인 | 이 저장소의 처리 / 할 일 |
|---|---|---|
| `'&&' 토큰은 이 버전에서 올바른 문 구분 기호가 아닙니다` | Windows PowerShell 5.1은 `&&`를 모른다 | 문서의 명령을 `npm run …` 한 줄로 바꿨다. 직접 칠 때는 줄을 나누거나 `;`를 쓴다(단 `;`는 앞 명령이 실패해도 계속 실행) |
| `이 시스템에서 스크립트를 실행할 수 없으므로 …npm.ps1…` | PowerShell 실행 정책 | 한 번만: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. 또는 VS Code 작업(cmd.exe로 실행)을 쓴다 |
| `UnicodeDecodeError: 'cp949' codec …` | Python이 Windows 기본 인코딩(cp949)으로 파일을 읽음 | 모든 Python 파일에 `encoding='utf-8'`(O-004, `npm test`가 검사) + `npm run py`와 VS Code 터미널이 `PYTHONUTF8=1`을 켠다 |
| `python3`를 찾을 수 없음 / Microsoft Store가 열림 | Windows에는 `python3`가 없거나 스토어 안내용 가짜 실행 파일 | npm 스크립트에서 `python3`를 없애고 `run.mjs py`로 `py -3` → `python` 순서로 찾는다 |
| `pip install`이 numpy 빌드에서 실패 | 클라우드용 `numpy 1.26` 고정(Blender 전용)은 Python 3.14 휠이 없다 | 로컬은 `npm run py:setup`(numpy ≥ 2.1, OpenCV ≥ 4.12) |
| `Executable doesn't exist at …chrome-headless-shell…` | 설치된 Playwright 버전이 다른 브라우저 빌드를 기대 | `npm run browsers`. `doctor`가 Playwright가 기대하는 빌드를 직접 확인한다 |
| `/opt/pw-browsers/…` 경로 오류 | 클라우드 컨테이너 전용 경로 | 모든 캡처 스크립트가 `PW_EXECUTABLE` → (Linux만) 컨테이너 경로 → Playwright 기본 순서로 찾는다 |
| 방법 설명(M04 SWT)이 옛 문구로 돌아감 | `prepare-v2`가 `methods.json`을 다시 썼음(R-a) | 이제 기존 파일을 유지한다. 다시 만들 때만 `npm run v2:prepare -- --methods` |
| 한글이 `???`·깨진 글자로 보임 | 터미널 코드 페이지 cp949 | Node·Python 출력은 UTF-8로 나오게 했다. 그래도 깨지면 VS Code 터미널을 **PowerShell 7** 또는 **Command Prompt**로 바꾸거나 `chcp 65001` |

## 4. 줄바꿈 (CRLF)

Git for Windows는 기본으로 체크아웃할 때 LF를 CRLF로 바꾼다(`core.autocrlf=true`). `.gitattributes`가 이제 작업 폴더도 LF로 고정한다. 이 설정이 생기기 전에 받은 폴더라면 한 번만:

```
git add --renormalize .
git checkout -- .
```

(기록 검사는 CRLF에서도 통과하도록 줄바꿈을 정규화한다 — `npm test`의 호환성 검사가 CRLF 사본으로 확인한다.)

## 5. 새 스크립트를 만들 때 (개발 규칙)

- npm 스크립트에 `python3`, `VAR=값 명령`, `rm`/`cp`/`mv`, 작은따옴표, `$VAR`를 쓰지 않는다 — `tests/portability.test.cjs`가 막는다.
- Python 호출은 `node <상대경로>/scripts/local/run.mjs py <스크립트>`.
- Playwright 실행 파일 경로를 고정하지 않는다: `process.env.PW_EXECUTABLE || (process.platform === 'linux' ? '<컨테이너 경로>' : undefined)`.
- 텍스트 파일은 항상 UTF-8로 읽고 쓴다(`encoding='utf-8'`, Node는 `'utf8'`).
- 사용자에게 줄 실행 안내는 이 문서의 `npm run …` 형식으로 쓴다.
