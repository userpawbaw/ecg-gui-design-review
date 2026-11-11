# 근거 — 이 작업을 업계에서는 뭐라고 부르나, 기존 스킬과 무엇이 다른가

조사일 2026-11-11. 웹 검색 요약과 공개 저장소 원문을 읽었다. 논문·핸드북 본문을 직접 다 읽지는 않았다. 아래 "읽은 범위" 칸에 구분해 두었다.

## 1. 이름 — 하나의 이름은 없고, 다섯 전통이 한 부분씩 다룬다

| 전통 | 이름 | 이 스킬에 가져온 것 | 읽은 범위 |
|---|---|---|---|
| 시스템 공학 | **Trade study / Analysis of Alternatives(AoA)** — NASA·DoD·FHWA 시스템 공학 지침 | 기준은 후보를 보기 **전에** 정한다(편향 방지), 기준별 평가를 합친 뒤 **민감도 분석**으로 검증, 작은 입력 변화로 답이 뒤집히면 다시 연다 | 검색 요약: [FHWA SE 가이드](https://ops.fhwa.dot.gov/seits/sections/section3/3_4_5.html), [AcqNotes trade study](https://acqnotes.com/acqnote/careerfields/trade-study), [METU 강의](https://ocw.metu.edu.tr/pluginfile.php/408/mod_resource/content/0/lecture12.pdf) |
| 소프트웨어 아키텍처 | **ATAM**(SEI, Kazman 외) | 품질 속성 **효용 트리**(추상 목표 → 구체 시나리오 + 중요도·난이도), **민감점**(한 품질을 크게 바꾸는 결정)과 **트레이드오프점**(두 품질을 반대로 바꾸는 결정), 위험/비위험 | 검색 요약: [Clemson ATAM 개요](https://people.computing.clemson.edu/~johnmc/courses/cpsc875/ATAM_files/v3_outline_expanded.htm), [Bass 교재 12장](https://people.ece.ubc.ca/matei/EECE417/BASS/ch12lev1sec1.html) |
| 제조·구매 | **가치 공학 / 가치 분석**(L. D. Miles, GE 1940년대), FAST 기능 분석 | "모든 비용은 기능을 위한 것" — 무엇을 만드는지가 아니라 **무슨 기능을 하는지**로 다시 보고, 기능에 기여하지 않는 비용을 없앤다 → 1단계 "목표 기능" | 검색 요약: [Miles(위키백과)](https://en.wikipedia.org/wiki/Lawrence_D._Miles), [Wixson, FAST](https://edisciplinas.usp.br/pluginfile.php/4160664/mod_resource/content/1/%5BWixson%201987%5D%20Function%20Analyis%20and%20Decomposition%20using%20FAST.pdf) |
| 하드웨어·컴퓨팅 | **근사 컴퓨팅(Approximate Computing)** — Mittal 2016 서베이, Leon 외 2023 서베이 | "정확도"를 설계 축으로 추가하고, **오류를 견디는 부분에서만** 정확도를 내줘 성능·전력을 얻는다 → 3단계 "여유 지도"의 정밀도 축 | 검색 요약: [Leon 외 Part I](https://arxiv.org/abs/2307.11124), [Part II](https://arxiv.org/abs/2307.11128) |
| 그래픽스 | **지각 기반 최적화 / LOD / 포비티드 렌더링** | 균일한 품질 대신 **지각 모델이 예산을 배분**: 시선 밖·주변부는 공격적으로 단순화하되 실루엣·상호작용 단서는 지킨다, 공간 해상도 대신 **갱신 빈도**를 낮추는 대안(Refresh Rate Modulation) → 레버 L2·L4 | 검색 요약: [Disney Research 포비티드 평가](https://la.disneyresearch.com/wp-content/uploads/User-Metric-and-Computational-Evaluation-of-Foveated-Rendering-Methods-Paper.pdf), [EG 2023 시선 기반 LOD](https://diglib.eg.org/bitstream/handle/10.2312/sr20231130/119-130.pdf), [SciTePress 2014](https://www.scitepress.org/Papers/2014/46911/46911.pdf) |
| 최적화 이론 | **설계 공간 탐색(DSE) / 파레토 최적** | 하나의 점수 대신 **지배 관계**로 후보를 줄이고, 가능한 해가 없으면 제약을 정해진 폭만큼 풀어 다시 찾는다 → 7단계 | 검색 요약: [Pimentel, DSE 방법론](https://staff.fnwi.uva.nl/a.d.pimentel/artemis/DSE-HBoCA-Springer.pdf) |
| 결정 기록 | **ADR(Nygard 2011) / MADR 4.0** | "결정 동인"(제약·힘)과 "검토한 선택지와 장단점"을 기록 — 이 프로젝트의 D 기록이 이미 같은 구조 | 검색 요약: [MADR](https://adr.github.io/madr) |
| 게임 개발 | **프레임 예산** | 예산은 상호작용 구간에서만 엄격하고 비상호작용 구간(메뉴·로딩)은 넘어도 된다, 한 프레임이라도 넘으면 끊김 → 동시 부하 지도, 최악 프레임 기준 | 검색 요약: [Unity 프로파일링 모범 사례](https://unity.com/how-to/best-practices-for-profiling-game-performance) |

사용자가 말한 "제약과 최적화 여지를 같이 분석해 손해가 중요하지 않은 트레이드오프를 골라 품질과 성능 모두 최선"에 가장 가까운 한 문장 이름은 **"제약 기반 트레이드오프 분석(constraint-driven trade study)"**이다. 그 안에서 "손해가 중요하지 않은 곳"을 찾는 부분이 근사 컴퓨팅의 **오류 허용(error resilience)**, 그래픽스의 **지각 예산**에 해당한다. 기존 문헌은 이 "여유"를 체계적으로 표로 만드는 단계를 따로 이름 붙이지 않았다. 이 스킬은 그것을 **여유 지도(slack map)**라고 부른다.

### 문헌에서 가져온 주의점
- 가중치는 임의성이 있다 → 민감도 분석 필수(METU 강의).
- 기준을 후보보다 먼저 정한다(FHWA).
- 가중합은 하드 제약 위반을 다른 점수로 상쇄할 수 있다 → 하드 필터 먼저, 가중치는 동점 처리에만(Method 3 "must-have 먼저 거르기", lyndonkl decision-matrix와 같은 생각).
- 지각 모델은 "첫 근사"일 뿐이다 → 여유 지도는 재야 하고, 최종은 사람 눈 확인.

## 2. 기존 스킬 조사

검색 대상: 사용자 claude.ai 스킬(검색 결과 0건), 이 저장소 `.claude/skills/`(8개 — 겹치는 것은 `project-capability-audit`의 도구 도입 평가뿐), 공개 SKILL.md 레지스트리.

| 스킬 | 출처 | 받은 것 | 라이선스 | 핵심 |
|---|---|---|---|---|
| decision-matrix | `lyndonkl/claude` `skills/decision-matrix` | 원문 전체 → `third_party/skills/lyndonkl-decision-matrix/` | README "Open source; use freely" (정식 라이선스 파일 없음) | 가중 기준 행렬, 가중치 정하는 네 방법, must-have 먼저 거르기, 민감도(근소차·지배 기준·가중치 교환·점수 ±1) |
| skill-decision-support | `nyldn/claude-octopus` | 원문 → `third_party/skills/nyldn-skill-decision-support/` | MIT | 현상 유지를 항상 기준선으로, 기준·가중치는 점수 전에 고정, 2–4안(보수·중도·혁신·최소), 되돌리기 쉬움, 시나리오 스트레스 테스트 |
| architecture-tradeoff-analysis | `majiayu000/claude-skill-registry`(데이터 저장소 보관본) | 읽기만, 저장 안 함 | 보관 저장소에 라이선스 파일 없음(404) | 각 안마다 얻는 것과 **잃는 것**을 반드시 쌍으로, 남는 결과(감수할 손해) 명시, 우선순위 높은 동인 기준 |
| tradeoff-analysis | 같은 레지스트리 | 읽기만, 저장 안 함 | 위와 같음 | 아키텍처 예시(CAP, 캐시, 구매 vs 개발) 중심 템플릿 |
| evaluating-trade-offs | `oldwinter/skills`(skills.sh 목록) | 원문 못 받음 — 현재 저장소와 보관 태그 어디에도 없음 | 저장소는 MIT | 목록 설명: 총비용·기회비용, 자릿수 범위 + 확신도, 사전 부검, 되돌리기 쉬움, 매몰비용 중단 규칙 |

### 기존 스킬의 공통 한계 — 사용자 요구와의 차이
1. **선택지가 주어진다고 가정한다.** 모두 "후보를 나열하고 점수를 매긴다"에서 시작한다. 사용자가 원한 것은 "다른 선택지, 트릭이 있을지"를 **찾아내는 것**이다 → 레버 카탈로그(L1–L12)와 조합 후보.
2. **여유를 구조적으로 찾지 않는다.** 장단점은 적지만 "그 단점이 이 환경에서 보이는가"를 재는 단계가 없다 → 여유 지도와 손해-여유 대응(무료/싸다/실손).
3. **품질·성능이 각각 한 칸이다.** 사용자는 "품질과 성능 모두 각기 여러 기준"을 요구했다 → 4단계 축 분리 + 문턱값.
4. **측정이 없다.** 점수는 사람이 매긴다 → 순위를 가르는 수치부터 측정, 증거 태그.
5. **자동 발동·정기 보고가 아니다.** 대부분 사용자가 부를 때만(`disable-model-invocation`) 돈다 → 규모별 자동 발동 + 고정 보고 양식 + D 기록 연결.
6. **과거 검증을 찾지 않는다.** 이 프로젝트는 F/D/O/R에 시험 결과가 쌓여 있다(예: 깊이 시차 F-022/F-023) → 2단계 "이전 검증".

### 기존 스킬에서 그대로 가져온 것
- 현상 유지를 항상 후보에 넣기(nyldn).
- 기준·가중치를 점수 전에 고정하고, 나중에 바꾸면 모든 후보를 다시 매기기(nyldn).
- must-have로 먼저 거르기, 근소차·가중치 교환 민감도(lyndonkl).
- 얻는 것/잃는 것 쌍, 남는 손해 명시(majiayu000 보관본).
- 되돌리기 쉬움을 비용 기준에 넣기(nyldn, oldwinter 목록 설명).
