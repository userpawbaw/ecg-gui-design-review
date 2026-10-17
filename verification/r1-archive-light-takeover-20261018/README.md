# 서고 빛·그림자 인수인계 확인 — 2026-10-18 KST

판정: **CONDITIONAL — 인수인계 확인, 형태 (b) 선택, 나머지 3항목 대기. 새 렌더 결과가 아니다.**

## 기준과 읽은 자료

- 브랜치: `claude/archive-light-r7-ag2rja`, 인수 시 HEAD `6b00daf09b937602d13dd5f88f3b2355c6405297`(원격과 일치).
- 사용자 지시 순서대로 `AGENTS.md` → `docs/uiux_system/handoffs/HANDOFF_ARCHIVE_LIGHT_2026-10-17.md` → `docs/uiux_system/rounds/R1/REVIEW-R1-ARCHIVE-SHADOW-ASSET-20261016.md` §7 → `verification/r1-archive-b2-variants-20261017/README.md` → `docs/uiux_system/records/D_DECISIONS.md` D-081~D-085를 확인했다.
- 재개 정책·상태·계획과 F-043~F-047, UI/UX Master, 플레이북 진입점 및 P-005도 확인했다. 이번 범위는 baseline 확인이며 설계 변경·새 방향 구현이 아니다.

## 실제 환경 확인

| 항목 | 현재 확인 결과 |
|---|---|
| 기본 Python | 3.12.14 |
| `python3.11` | 실행 파일 찾지 못함 |
| 기본 Python의 `bpy` | import 대상 없음 |
| 시스템 Blender | 4.3.2 — 인계된 4.5.3과 다름 |
| `assets/source/` | 없음 — Poly Haven 원본 복구 필요 |
| 기존 B2 변형 JPG | 파일명 규칙에 맞는 16장, 총 2,304,472 bytes; 새 렌더·시각 재검수 증거는 아님 |

환경 재현 계획: 독립된 Python 3.11 가상환경에 인계된 `bpy==4.5.3` 및 관련 버전을 준비하고, 저장소의 Poly Haven 받기 스크립트로 CC0 원본을 ignored `assets/source/`에 복구한 뒤 파일별 API 해시를 확인한다. 새 다운로드 전에는 인수인계 §4.2의 허가 조건을 확인한다. 다른 버전으로 렌더한 결과를 동일 재현으로 취급하지 않는다. 레퍼런스 사이트 코드·에셋은 받거나 커밋하지 않았다.

## 인계받은 측정값 — 이번 세션 재측정 확인 안 함

출처: `verification/r1-archive-b2-variants-20261017/README.md`(1280×720, 64 samples, V1 두 높이).

- L1 사다리 그림자: 6.0~6.7 px; L2: 2.0~2.4 px.
- 아랫면 재질 ×0.35: 아랫면/윗면 밝기 비 0.60 → 0.27.
- 변형 범위: plain_range 41.8~48.1, sharpC 15.9~16.8.

위 값은 이전 세션의 기록이며 이번 환경에서 재현하거나 재측정하지 않았다.

## 선택 대기와 보호 범위

1. **(b) 조각 유지 선택** — 사용자 답변 `[대화]`: "(b) 조각 유지". (a)는 이번 선택에서 제외한다.
2. 사다리 L1 / L2(기존 권장). L2는 해치에 오르지 않아 사람·해치 연출과 충돌할 수 있다.
3. 30° / 45°.
4. 칸 아랫면 재질 ×0.35 채택 여부(기존 권장).

네 질문을 사용자에게 다시 제시했고 형태 (b)에 대한 답만 받았다. 나머지 답을 가정하거나 기본 선택을 승인으로 취급하지 않는다. r8, D-084 재현값, Story 세션 소유 파일·사람·소품은 그대로다. 새 D 번호를 만들지 않았다. 결정이 갈리는 다음 구현 전에 다른 원격 브랜치의 번호까지 확인하고 D를 먼저 기록한다.

## 확인 안 함 / 다음 행동

- 확인 안 함: bpy 4.5.3 설치·실행, Poly Haven 원본 다운로드·해시 검증, 새 Blender 렌더, EXR 재혼합, 그림자·톤 재측정, 옮긴 사다리의 자세·접촉·충돌, 웹 굽기·톤매핑·카메라 이식·움직임.
- 기록 전용 변경이므로 앱 전체 테스트·렌더 검사를 반복하지 않았다. `npm run records:check`: 148 F/D/O/R 기록과 CASE/dialogue/provenance/entrypoint 검사 PASS(exit 0). `git diff --check`: PASS(exit 0).
- 사용자 선택 후 해당 변형만 환경 재현·검증한다. L2를 고르면 사람·해치 연출을 먼저 협의하며 Story 소유 자원을 임의 수정하지 않는다.
