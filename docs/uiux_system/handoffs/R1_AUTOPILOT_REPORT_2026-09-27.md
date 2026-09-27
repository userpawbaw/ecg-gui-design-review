# R1 자동 진행 결과 보고 — 사용자 복귀 후 검토용

작성: 2026-09-27 · branch **`claude/r1-autopilot-recommended`** · 복귀 지점 `claude/optimistic-goldberg-jnzpni` `1570dd4`
성격: 사용자 부재 중 "내 결정이 있어야 하는 부분은 모두 권장안으로" 진행한 결과. **사용자 확인 전**이다. 증거는 모두 헤드리스(SwiftShader) `L3`이며 전시 PC(`L4`)는 아니다.

## 1. 한눈에

| 단계 (`20`) | 결과 | 문서 |
|---|---|---|
| 3 Beta 1차 | 동결 — 스틸 7장 KEEP 4 · TUNE 3, 이미지 속 숫자 전부 저장값 일치, Gap 17개 | `rounds/R1/beta/BETA-R1-001.md` |
| 4 교차 검토 | Alpha × Beta 공통 평가, 새 발견 F-026(20 dB에서 잡음·방법 차이가 거의 안 보임) | `rounds/R1/AB-R1-001_CROSS_REVIEW.md` |
| 5 사용자 시각 정렬 | **AI 대리 판단**(사용자 기존 발화 근거) | 같은 문서 §5 |
| 6 Hybrid | HYB-R1-001 = Beta 장면 세계·3박자 + Alpha "전체 실험" 박자 | 같은 문서 §7 |
| 7 Validator | KEEP/TUNE/REJECT 표 | 같은 문서 §8 |
| 8 결정·변경 계약 | D-038(자동 채택), 수용 기준 9개 | `rounds/R1/CHANGE_CONTRACT_R1.md` |
| 9 구현 | `prototype/v2/src/story/*` + `main.tsx` 진입 | §3 |
| 10 검증 | 게이트 G1–G6, e2e, 단위 테스트 | §4 |
| 자동 결정 | AP-01 ~ AP-17 | `rounds/R1/AUTOPILOT_DECISIONS.md` |

## 2. 직접 보는 법

```bash
git fetch origin claude/r1-autopilot-recommended && git checkout claude/r1-autopilot-recommended
node scripts/prepare-v2.cjs          # public/archive.json (gitignore) 생성 — 주의: methods.json을 덮어쓴다(R-a), 끝나면 git checkout prototype/v2/src/methods.json
cd prototype/v2 && npm install && npm run dev
```

| URL (`http://127.0.0.1:5173/` 뒤) | 볼 것 |
|---|---|
| (없음) | Attract — 역광 호, 전원 간섭 0 dB 입력이 sweep 뒤에서 M04 출력으로 드러남 |
| 휠 한 번씩 | 1 전원 간섭 → 2 기저선 변동 → 3 근육 잡음(20 dB, 같은 합성 기록) → 4 49장면 1등 격자 → 5 EXP-A 평균 막대 → 6 Lab |
| `?step=3` | 해당 단계로 바로 |
| `?reduced=1` | 움직임 줄이기 |
| `?route=lab` | 기존 v2.2.1 Lab부터 |
| 어느 단계든 "클릭해 직접 바꿔 보기 →" / 오른쪽 위 "바로 실험실 →" | 같은 장면·같은 0–10 s 창으로 Lab |

키보드 ←/→·PageUp/PageDown도 한 단계씩. 무입력 180 s면 Attract로.

## 3. 구현 요약

| 파일 | 역할 |
|---|---|
| `src/story/storyData.ts` | archive.json 저장값에서 박자 순위·1등, D1 49장면 격자, EXP-A 막대 계산(단위 테스트 3개) |
| `src/story/horizon.ts` | 역광 호 WebGL(원시 WebGL, 사각형 1장, 필요할 때만 그림). 실패 시 CSS |
| `src/story/signalStage.ts` | Canvas 2D 파형 무대. 입력 − Reference 띠(고정 ±0.15 mV 물리 눈금), 입력·출력(같은 ±1.2 mV), 조건 전환은 순차 페이드 |
| `src/story/StoryShell.tsx` | React는 단계·퇴장 상태만, 프레임 값은 GSAP ticker(D-028). 휠 제스처 1회 = 1단계, 방법 점 DOM 노드 유지(RCP-24), Lab 착지 |
| `src/story/copy.ts`, `story.css` | 한국어 문구(AP-14), Beta 측정 토큰 |
| `src/main.tsx` | 시작 화면 = Story(AP-12), Lab 진입 = 기존 `restore()` + 큰 비교 창, 무인 복귀 대상 교체 |
| 의존성 | gsap 3.15, lenis 1.3(설치만 — 사용 안 함, AP-13) |

JS 번들 334.8 → 429.3 kB(gzip 108 → 145 kB).

## 4. 검증

| 검사 | 결과 |
|---|---|
| `tsc --noEmit`, `npm run build` | PASS |
| v2 단위 테스트 | 15 PASS / 1 FAIL — 실패는 600초 chunk 테스트(자료 없음, 기존과 동일) |
| 루트 `npm test`(records 81 · fixture 32 · encoding) | PASS |
| e2e 기존 `expo.spec.ts` | 3 PASS, 1 SKIP(10분 soak — replay 자료 없음, 기존과 동일). 시작 화면 변경으로 `goto('/?route=lab')`로 바꿈 |
| e2e 새 `story.spec.ts` | 2 PASS — 휠 한 제스처 = 한 단계, 점 10개 유지, 1등 표기 19.45 dB / M_FE / M06L6, 격자 클론 42 + 원본 7 = 49칸, 막대 11개, 되돌리기, Lab 도착 장면(S038 · 근육 · 20 dB · M06L6 · inspect), pageerror 0, reduced-motion |
| Playwright 실행 | 설치된 `@playwright/test`가 없는 헤드리스 셸 빌드를 찾아서, `PW_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`로 실행(`playwright.config.ts`가 이 변수를 받게 함) |

### 충실도 게이트 (`25` §6)

| 게이트 | 결과 |
|---|---|
| G1 수치 계약 | 모든 수치는 `storyData.ts`가 저장값에서 계산, 레퍼런스 수치는 출처 주석(REF-001·003·006, RCP-17·24·25). 소나 2 s/0.2 s는 REF-003 EFX-003-03 |
| G2 재료 | 비트맵·영상·3D·글꼴 추가 없음(생성 이미지는 어떤 픽셀도 제품에 들어가지 않음) |
| G3 나란히 | `verification/r1-autopilot-20260927/beta-still-vs-implementation.jpg`(Beta 스틸 S01·S03·S05·S07 ↔ 구현). 전환 5개 × 12장(`seq-*`), 느린 재생 3개 × 12장(`slow-*`) |
| G4 수치 비교 | 역광 호 최대 밝기 구현 255 / 스틸 255 |
| G5 상태 전수 | 단계 0–5 + Lab + reduced 0·2 (`states/`) |
| G6 자기 수정 3회 | ① GSAP lag smoothing 끔, 단계 4–5 제목·범례 겹침, "20 DB" 대문자(G-09), 숨김 표 노출, 휠 잠금 350 ms ② 격자 축 라벨 위치, 클론 라벨 ③ 역광 호 밝기 |

### 남은 GAP (사용자 확인 필요)

| # | GAP | 원인 / 판단 |
|---|---|---|
| 1 | 한글 제목이 가늘게 보임 | 헤드리스 컨테이너에 한글 굵은 글꼴이 없음. 전시 PC(맑은 고딕 Bold)에서 확인 필요(글꼴 교체는 D-035로 보류) |
| 2 | Attract 좌우가 스틸 S01과 반대(왼쪽 청록) | AP-11 — sweep이 지나간 쪽이 출력. 스틸 구도가 좋으면 반대로 바꿀 수 있음 |
| 3 | Lab 도착 화면이 밝은 v2.2.1 창 | 2라운드 범위. 어두운 Story에서 밝은 Lab으로 바뀌는 것이 거슬리는지 |
| 4 | 전원 간섭 60 Hz가 전체 창에서 촘촘한 띠로만 보임 | G-02 시간 확대 렌즈 보류 |
| 5 | 1등 출력이 바뀌어도 파형 모양 차이가 거의 없음 | F-026 — 사실 그대로. 메시지는 순위·수치가 맡음 |
| 6 | 실제 GPU 프레임률·휠 체감 | 헤드리스 불가. 사용자 로컬 실행으로 |
| 7 | Lab 범례의 D0 Reference 문구가 provenance와 다름 | AP-17 — Story만 고침, Lab은 2라운드 |

## 5. 복귀 후 검토 순서 (권장)

1. 로컬에서 §2로 한 번 끝까지 보기(휠 체감 포함).
2. `AUTOPILOT_DECISIONS.md`의 AP 표에서 동의하지 않는 줄 표시 — 대부분 한 파일 한 줄 수정으로 되돌릴 수 있다.
3. AB-R1-001 §5(AI 대리 정렬)를 사용자 판단으로 덮어쓰기.
4. 방향 자체(역광 호 세계, Hybrid 구성)가 틀렸다면 → 복귀 지점 `1570dd4`에서 Step 4부터 사용자 결정으로 재시작.
