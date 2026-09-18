# Tool / Skill / Plugin Routing

목적: 매 작업마다 모든 도구를 쓰지 않고, **필요한 capability만 최소한으로 로드**한다.

## 1. 현재 확인된 기본 상태 (2026-09-18 review)

### 설치/연결 확인
- GitHub — 저장소 source of truth, 코드/문서 작업
- Product Design — product direction, flow audit, live URL/screenshot prototype
- Figma — design implementation, design-system rule/Code Connect 계열
- Creative Production — concept/mood/visual direction 발산
- Flourish — editable interactive data storytelling
- Context7 — 최신 라이브러리 문서·예제 grounding
- TinyFish — live browser workflow
- Vercel — preview deployment

### 조건부 핵심 외부 generator
- **Superdesign — 기존 codebase 기반 concrete UI draft/branch generator. Work/Codex/Claude Code 등 shell 환경에서 조건부 핵심 생성기로 채택; standard Chat에서는 실행하지 않음.** Reference/Art Direction의 상위 2~4개 후보를 같은 baseline에서 실제 시안으로 비교할 때 사용한다.

### 공개 후보 / 필요 시 연결
- Mobbin — 상용 UI/UX 레퍼런스 연구; product UX reality check에 특히 유용
- 21st.dev MCP 계열 — creative component/pattern reference 후보. 도입 전 capability gap audit
- MotionDesign/Awwwards 계열 — attract/transition 발상용 후보. 플러그인 자체 capability는 채택 전 재검증

### 외부/로컬 도구
- design-taste (`arez-xd/ux-ui-design-taste`)
- UI UX Pro Max (`nextlevelbuilder/ui-ux-pro-max-skill`)
- project-local `reference-mining` — 실제 reference의 특정 장면을 visual-intent proxy로 사용
- Motion AI Kit — 사용 가능한 Codex/Claude 환경에서 specialist tooling
- Playwright — **이미 프로젝트에 설치됨** (`npm run qa`, `qa:headed`)
- Storybook — 현재 미확정. capability gap이 실제로 있을 때만 도입

## 2. Task Router

| Task | 먼저 읽을 문서 | Skill/Plugin 후보 |
|---|---|---|
| 화면이 밋밋함 / 창의 개선 | 01 Creative, 04 Validation | expo-ui-art-director, Creative Production, Product Design |
| **새 creative direction / 디자인적 놀라움 / Awwwards·reference 기반 발상** | 01 Creative, **13 Reference Mining**, 04 Validation | **reference-mining → expo-ui-art-director → 필요 시 Superdesign → validator**, Creative Production, 필요 시 웹/Mobbin |
| **같은 baseline에서 2~4개의 실제 UI 시안을 비교** | 01 Creative, **14 Superdesign**, 04 Validation | **superdesign-routing → external Superdesign → user alignment → validator** |
| Attract/Intro | 01 Creative, 03 Motion, docs/13, 필요 시 14 | reference-mining을 먼저 검토, art-director, Superdesign(시안 비교가 필요할 때), Product Design, Figma |
| Replay↔Live transition | 03 Motion, 04 Validation | 중요한 새 visual direction이면 reference-mining, motion-review, Context7, Playwright |
| 데이터 관계/스토리 | 02 Data, 04 Validation | Flourish, Product Design; story 표현이 새롭고 visual intent 공유가 필요하면 reference-mining |
| 기존 UI polish | docs/21, docs/22, 04 Validation | design-taste, ui-ux-pro-max |
| 컴포넌트/디자인 시스템 | docs/15, 01/04 | Figma, design-taste |
| 최신 Motion/React API | 03 Motion | Context7/공식 문서 |
| 구현/코드 변경 | docs/21 + change contract | GitHub, Codex/Claude/Work 필요 시 |
| 실제 브라우저 검증 | 04 Validation | existing Playwright, TinyFish/Work |
| 배포 preview | 06 Handoff | Vercel 필요 시 |
| 상용 레퍼런스 | 01 Creative, 13 Reference Mining | Mobbin 또는 웹 연구; direct URL + viewing instruction 필수 |

## 3. Reference Mining 자동 라우팅

### 자동 실행
다음 요청은 `docs/uiux_system/13_REFERENCE_GROUNDED_CREATIVE_MINING.md`와 `reference-mining` skill을 자동 포함한다.

- `레퍼런스 마이닝`, `reference mining`
- `Awwwards/Godly 같은 느낌`, `실제 우수작을 참고`, `이런 느낌의 사례`
- Attract/Intro/Transition/Result Reveal을 **처음부터 새로 설계**하면서 독창성·놀라움을 요구
- 기존 dashboard 관습을 벗어난 새로운 visual direction 요구

### 먼저 제안
중요한 CREATIVE 설계인데 visual direction이 추상적인 텍스트만 있고, 여러 mockup을 만들기 전에 reference로 느낌을 맞추는 편이 싸고 빠른 경우에는 한 줄로 reference mining을 제안한다.

### 자동 생략
spacing/label/색상 미세조정, 이미 reference/direction이 freeze된 구현, 사용자가 바로 구현하라고 한 단순 polish에는 넣지 않는다.

## 4. Progressive Loading

모든 작업에서:

1. `00_UIUX_MASTER.md`
2. 작업 분류
3. 관련 문서 1~3개
4. 필요한 Skill/Plugin만 선택
5. significant CREATIVE 작업이면 §3 trigger를 확인하고 필요한 경우 `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`를 추가
6. 상위 2~4개 방향을 **실제 화면으로 비교해야 판단이 쉬워지는 경우** `14_SUPERDESIGN_GENERATION_LAYER.md`와 `superdesign-routing`을 추가한다. 이 단계는 생성기이며 validation/implementation을 자동 승인하지 않는다

모든 skill/reference/plugin을 한 번에 로드하지 않는다.

## 5. Tool Failover

- Plugin/Skill을 사용할 수 없으면 역할 자체를 포기하지 않는다.
- Superdesign 사용 불가/standard Chat → Reference Mining + art-director 결과로 Work/Codex/Claude/web app용 handoff packet을 만들거나 Figma/React light prototype으로 대체
- Creative Production 사용 불가 → art-director skill + 웹 레퍼런스
- `reference-mining` skill을 직접 invoke할 수 없는 환경 → `13_REFERENCE_GROUNDED_CREATIVE_MINING.md`를 읽고 동일 절차 수행
- Flourish 사용 불가 → 동일 data-story 질문을 먼저 설계하고 정적 mock/코드 후보 생성
- Context7 사용 불가 → 공식 최신 문서를 웹에서 직접 확인
- TinyFish 사용 불가 → Work cloud browser/사용자 screenshot/video/Playwright 결과
- Motion AI Kit 없음 → `03_MOTION_AND_POLISH` + design-taste motion refs + Context7 + Playwright

## 6. 자동 도입 금지

새 외부 Skill/MCP/Plugin은 다음 없이 자동 설치하지 않는다.

- capability gap
- 기존 기능과 중복도
- 출처/유지보수
- 실행 script/권한/network access
- context/tool complexity 비용
- project-local로 시험할 가치

자세한 기준: `07_EXTERNAL_SKILLS_PROVENANCE.md`.
