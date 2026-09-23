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

### Alpha / Beta 기본 creative tracks (2026-09-23~)
- **Alpha**: reference-grounded + implementation-aware. 실제 component/state/motion/implementation blueprint까지.
- **Beta**: reference-grounded + image-first. Chat image generation으로 scene still을 만들고 component/interaction/motion translation을 반드시 붙인다.
- 공통 계약: `18_ALPHA_IMPLEMENTATION_AWARE_TRACK.md`, `19_BETA_IMAGE_CONCEPT_TRACK.md`, `20_ALPHA_BETA_OPERATING_PROTOCOL.md`.

### Superdesign 두 모드 — 기본 자동 경로 중지
- NATIVE_DIRECTOR / CONCRETIZER의 과거 계약은 14/16번에 보존한다.
- 첫 DUAL-ATTRACT 실사용에서 generated draft의 reference fidelity / near-final completeness가 사용자 기대에 미달했다.
- 별도 재검증과 사용자 승인 없이는 새 creative round에 자동 투입하지 않는다.

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
| 기존 방향 안의 가벼운 창의 개선 / non-significant polish | 01 Creative, 04 Validation | expo-ui-art-director, Creative Production, Product Design; **새 significant direction이면 아래 16 Dual 행으로 승격** |
| **새 creative direction / 디자인적 놀라움 / reference 기반 발상** | 01 Creative, **18 Alpha**, **19 Beta**, **20 AB Protocol**, 13 Reference Mining, **17 Source Registry**, 04 Validation | HIGH: Alpha+Beta 권장 → cross-review → validator. MEDIUM: Alpha 우선, Beta 필요성 판단. LOW: creative track 생략 |
| **같은 baseline에서 visual direction을 저비용 비교** | 18/19/20, 13/17, 04 Validation | Alpha 설계 + Beta image still 비교. 구현 후보는 이후 Work/Codex에서 actual UI prototype |
| Attract/Intro | 01 Creative, 03 Motion, 13/17, **18/19/20** | HIGH 신규는 Alpha+Beta 기본; image still은 Chat, actual UI prototype은 Work/Codex |
| Replay↔Live transition | 03 Motion, 13/17, 18/19/20, 04 Validation | HIGH 신규는 Alpha+Beta; 이후 motion-review/Context7/Playwright |
| 데이터 관계/스토리 | 02 Data, 04 Validation | Flourish, Product Design; story 표현이 새롭고 visual intent 공유가 필요하면 reference-mining |
| 기존 UI polish | docs/21, docs/22, 04 Validation | design-taste, ui-ux-pro-max |
| 컴포넌트/디자인 시스템 | docs/15, 01/04 | Figma, design-taste |
| 최신 Motion/React API | 03 Motion | Context7/공식 문서 |
| 구현/코드 변경 | docs/21 + change contract | GitHub, Codex/Claude/Work 필요 시 |
| 실제 브라우저 검증 | 04 Validation | existing Playwright, TinyFish/Work |
| 배포 preview | 06 Handoff | Vercel 필요 시 |
| 외부 레퍼런스 / UI 컴포넌트 inspiration | 01 Creative, 13 Reference Mining, **17 Source Registry** | task router로 Creative/Curated/Product/Scientific/Data Story source를 선택; direct URL + viewing instruction + provenance 필수 |

## 3. Reference Mining 자동 라우팅

### 자동 실행
20번으로 target/zone과 Alpha/Beta 필요성을 먼저 판정한다. 아래 reference mining은 두 track의 공통 source layer다.

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
5. significant CREATIVE 작업이면 `20_ALPHA_BETA_OPERATING_PROTOCOL.md`로 HIGH/MEDIUM/LOW를 판정하고 `13_REFERENCE_GROUNDED_CREATIVE_MINING.md` + `17_REFERENCE_SOURCE_REGISTRY.md`를 공통 source layer로 추가한다.
6. Alpha는 `18`로 implementation-aware design을, Beta는 `19`로 reference-grounded image still + translation을 만든다. 두 결과는 freeze 뒤 비교한다. Superdesign은 별도 재검증 요청이 있을 때만 14/16번으로 호출한다.

모든 skill/reference/plugin을 한 번에 로드하지 않는다.

## 5. Tool Failover

- Plugin/Skill을 사용할 수 없으면 역할 자체를 포기하지 않는다.
- image generation을 사용할 수 없는 환경 → Beta Image Concept Packet과 prompt/translation spec을 만들어 Chat으로 handoff한다.
- Alpha 구현 환경이 없으면 설계/Change Contract까지만 수행하고 Work/Codex로 handoff한다.
- Superdesign은 현재 기본 failover가 아니다. 별도 재검증 요청에서만 사용한다.
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

## 7. 명시 trigger와 자동 activation

`새 디자인 라운드 시작해줘` → zone/task 분류. HIGH 신규 significant CREATIVE → Alpha+Beta 권장, MEDIUM → Alpha 우선/Beta 가치 판단, LOW 또는 polish/frozen 구현 → creative track 생략.
`Alpha안으로 [scene] 설계해줘` → Alpha. `Beta안으로 [scene] 진행해줘` → Beta. `Alpha/Beta 라운드로 [scene] 진행해줘` → 두 track first pass 후 cross-review. `Alpha/Beta 결과 비교해줘` → 20번 공통 평가. 기존 Dual/Superdesign trigger는 역사/명시적 재검증 요청에서만 사용한다.

실행 entrypoint는 특정 skill loader가 아니라 `20_ALPHA_BETA_OPERATING_PROTOCOL.md`의 workflow contract다. Chat/Work/Codex/Claude Code는 같은 문서를 읽어 동일 trigger 의미를 따른다. 이 자동 선택은 account-wide hook 보장이 아니다.
