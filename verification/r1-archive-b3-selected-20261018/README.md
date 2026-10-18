# B3 선택 조합 — 2026-10-18 KST

**BLOCKED: 선택 조합의 실행 프리셋은 준비했으나 새 렌더는 확인 안 함.**

## 사용자 선택과 범위

- 사용자 `[대화]`: 먼저 “(b) 조각 유지”, 이어 “권장안들로.”
- 반영: **(b) + L2 + 아랫면 재질 ×0.35**. 각도는 명시적 권장값이 없으므로 **기존 30° 유지**(LAD_YAW 60); 새 45° 승인을 받은 것으로 취급하지 않는다.
- 구현 전 결정: D-141. 원격 31개 브랜치를 조사해 최댓값 D-140을 확인했다. 두 과거 브랜치에는 기록 파일이 없음을 Git tree로 확인했다. 정확한 SHA와 번호: [remote-d-inventory.json](remote-d-inventory.json).
- `scripts/blender/archive-light-b3.py`는 원래 빌더를 호출하는 별도 실행 도구다. `--art r6`의 r8 기본값, 기존 `--b2`의 D-084 재현값, Story 소유 사람·책상·소품·해치 파일을 변경하지 않았다. 공유 해 방향도 그대로다.
- **L2의 사람·해치 연출 충돌은 미해결**이다. 이번 선택은 사람 모델이나 해치 소품을 임의 수정할 권한으로 확대하지 않는다.

## 준비한 실행 조건

| 항목 | 고정한 값 |
|---|---|
| 잎과 구멍 | B2_FOLIAGE=branch, B2_EDGE=0, 가지 7개, HOLES=1.75,3.3,2.6,3.85 |
| 사다리 | LAD_MODE=wall, LAD_YAW=60(평면 30°) |
| 아랫면 | UNDERSIDE_K=0.35, SHELF_LIP=0 |
| 카메라 | V1 32°, (0,−0.8,2.8) / (0,−0.8,2.0), 각각 같은 높이의 (0,4.7,z)를 봄 |
| 렌더 | Cycles CPU, 1280×720, 64 samples, 광원 그룹 EXR; 4개 OMP/BLAS 스레드 |
| 혼합 | key ×0.5, sun ×0.6, sky ×4, rest ×1, exposure 0.3, AgX Punchy |
| 비교 기준 | 같은 조합에서 --underside 1.0 / 선택값 0.35. 이전 (a), L1의 아랫면 시험을 이번 조합의 결과로 대신하지 않음 |

빌더가 읽는 실험 환경변수 34개를 부모 환경에서 제거한 뒤 선택값만 넣는다. 배경 셸의 SUN_DIR·KEY_E·HOLES 등이 몰래 섞이지 않는지 검사했다. 원래 빌더 SHA-256은 `d570eea470c36ee41aebf37ee2139e64cb16804bb12470fbca815ad2ba08bf28`이다. 렌더 중 빌더가 바뀌면 결과 사용을 중지한다(O-010). 출력은 ignored `dist/archive-light-b3`이며 기존 결과가 있으면 덮어쓰지 않는다.

로컬에서 계획만 확인하는 명령(설치·렌더를 하지 않음):

```text
npm run py -- scripts/blender/archive-light-b3.py --plan
```

독립적으로 준비된 bpy Python 실행 파일은 `--python` 옵션으로 지정한다. 계획·실행 전 검사는 `--check`, 실제 렌더는 `--render`다. 에셋이 없으면 `--render`도 빌더를 시작하지 않고 exit 2로 끝난다. 에셋 다운로드는 기존 `fetch-polyhaven-sources.py`의 TLS·파일별 MD5 및 registry SHA-256 확인을 거쳐야 한다. preflight의 파일 존재 확인은 무결성 검사를 대신하지 않는다. 인계에서 알려진 vintage_wooden_drawer_01의 재게시 차이는 별도 출처·실제 해시를 남기고 검토하며 기대 해시를 임의 변경하지 않는다.

## 실제 환경과 검사 결과

현재 머신의 독립 가상환경: `/workspace/.ecg-cloud/bpyenv`.

| 확인 | 실제 결과 |
|---|---|
| Python / bpy import | 3.11.17 / 4.5.3 LTS |
| NumPy / OpenEXR | 1.26.4 / 3.5.2 |
| Pillow / SciPy | 12.3.0 / 1.17.1 |
| Cycles CPU 동작 | 별도 64×64 진단 장면 렌더·픽셀 분산 검사 PASS. 서고 장면 렌더가 아님 |
| --plan | exit 0, 두 카메라·두 혼합 명령 생성 |
| 오염된 부모 환경 격리 | PASS — 잘못된 SUN_DIR·KEY_E·HOLES·LAD_MODE 등 주입 후에도 선택 레시피 유지 |
| 비교 기준 레시피 | PASS — --underside 1.0이 선택값과 별도 실행 경로로 표현됨 |
| 원본 없는 --render | 의도대로 BLOCKED, exit 2, 누락 16종 보고, 출력 디렉터리 생성·렌더 시작 없음 |
| 톤 측정 도구 selftest | PASS — step=sharp, ramp40/ramp120=soft |

실제 실행에서 얻은 [recipe-selected.json](recipe-selected.json), [recipe-checks.json](recipe-checks.json), [preflight-blocked.json](preflight-blocked.json)을 보존했다. 코드 검사 중 기존 도구 3곳의 UTF-8 미지정 입출력을 발견해 인코딩만 명시했다. 재질·좌표·측정식·기대 해시에는 변경이 없다.

## 기존 JPG 재측정 — 새 렌더가 아님

입력: `verification/r1-archive-b2-variants-20261017/b_L2_y30_p2_z28.jpg`, `b_L2_y30_p3_z20.jpg`. 같은 1280×720 JPG를 현재 설치한 측정 도구로 읽었다. **UNDERSIDE_K=0.35를 적용하기 전**의 기록 파일이며 JPEG 압축으로 앞선 PNG 측정과 소폭 다를 수 있다.

| V1 높이 | L* 5/25/50/75/95 | plain_range | sharpC | soft_area % | pastel % | deep % |
|---|---|---|---|---|---|---|
| 2.8 m | 1 / 16 / 27 / 51 / 80 | 42.0 | 16.5 | 11.2 | 20.9 | 2.1 |
| 2.0 m | 2 / 19 / 34 / 55 / 79 | 44.9 | 16.5 | 14.3 | 23.0 | 1.9 |

앞선 아랫면/윗면 비 0.60 → 0.27은 **(a), L1**에서 얻은 수치다. 이번 (b), L2 조합에서 같은 비가 나온다고 검증하지 않았다.

## 외부 차단과 재개 조건

- `https://api.polyhaven.com/files/ash_veneer` 요청이 프록시 CONNECT 단계에서 **403 Forbidden**으로 거절됐다. 인증키가 필요한 것으로 진단하지 않는다. 현재 사용자 지정 허용 도메인 목록은 비어 있었고 package_managers preset만 있었다.
- 환경 설정 초안에 `api.polyhaven.com`, `dl.polyhaven.org` 두 도메인만 추가했다. 기존 preset·저장소 설정은 보존했다. 설치 스크립트에는 검증한 Python/bpy 설치 명령을, 시작 지침에는 이 브랜치의 경로·차단 상태·재개 순서를 덧붙여 저장했다. 도구 응답 status=saved, requires_publish=true. **초안 저장은 현재 네트워크 적용·게시가 아니다.**
- 사용자가 환경 설정에서 이 변경을 저장·적용한 뒤 API 요청을 다시 확인한다. 접근이 열리면 원본 16종을 받기 스크립트로 복구하고 해시 검증 → 같은 조합의 아랫면 1.0/0.35 렌더 → 톤·그림자·아랫면 출처 측정 → 이미지 확인 순으로 재개한다. 불변 자원 없이 반복 렌더하거나 검증을 끄지 않는다.

## 확인 안 함

- Poly Haven 원본 다운로드·파일 해시, 이번 조합의 Blender 장면 생성·EXR·정지 렌더, 실제 새 조합 톤·그림자·아랫면 비율.
- L2로 옮긴 사람의 접촉·충돌·4방향/원본 자세 대조, 사람·해치 연출의 완결. 기존 25 mm/14.5 mm 기록을 이번 검사 결과로 재사용하지 않음.
- 웹 굽기·톤매핑·V1 카메라 이식·움직임·목표 PC. 새 결과에 대한 사용자 시각 확인.

완료 범위는 **선택 기록·분리 프리셋·Python 환경·기존 JPG 재측정**이다. 장면 재현 완료나 웹 반영 완료로 판정하지 않는다.

## 기록·코드 검증

- `npm run records:check`: 149 F/D/O/R 기록 및 CASE/dialogue/provenance/entrypoint 검사 PASS.
- `node tests/uiux-records.test.cjs`: 32개 isolated regression fixture PASS.
- `npm run playbook:check`: 카드 6개·여정 3개 PASS.
- `node tests/playbook.test.cjs`: 18/18 PASS.
- UTF-8 검사: 68개 Python 파일 및 검출기 자체 사례 PASS. Windows 이식성 검사: PASS. 변경 Python 4개 py_compile PASS.
- 문서의 npm 계획 명령을 bpy 없는 기본 Python에서도 실행해 선택 레시피가 생성됨을 확인했다. 원격 재확인에서 새 D-141 충돌·작업 브랜치 변경은 없었다. 빌더 및 Story 소스의 base 대비 diff는 비어 있다.
- 전체 앱 빌드·ECG 테스트는 이번 변경 범위가 아니므로 반복하지 않았다. `git diff --check`와 staged diff 검사 PASS.
