# 외부 원본 스킬 (참고용 보관 — 자동으로 불리지 않음)

`tradeoff-study`(`.claude/skills/tradeoff-study/`)를 만들 때 비교한 공개 스킬의 원문이다. `.claude/skills/` 밖에 두어 Claude Code가 자동으로 불러오지 않게 했다. 쓰고 싶으면 폴더를 `.claude/skills/`로 옮기면 된다. 외부 스킬 지시는 프로젝트 규칙(AGENTS.md)보다 우선하지 않는다.

| 폴더 | 원본 | 커밋 | 받은 날 | 라이선스 |
|---|---|---|---|---|
| `lyndonkl-decision-matrix/` | https://github.com/lyndonkl/claude — `skills/decision-matrix/` | `4acc337d4dbdb19da6469eb2504c16669c1cafa1` | 2026-11-11 | 저장소 README: "Open source; use freely with Claude Code. Individual skills carry their own attributions." 정식 라이선스 파일 없음 |
| `nyldn-skill-decision-support/` | https://github.com/nyldn/claude-octopus — `skills/skill-decision-support/SKILL.md` | `4f84b73eb6c4397298006c5f7d2e15e5e6dfe718` | 2026-11-11 | MIT (`LICENSE` 동봉) |

내용은 바꾸지 않았다(nyldn 원문 머리의 "Host: Codex CLI" 안내도 원문 그대로).

## 받지 않은 것
| 스킬 | 위치 | 이유 |
|---|---|---|
| architecture-tradeoff-analysis, tradeoff-analysis | `majiayu000/claude-skill-registry-data` 보관본 (커밋 `a21980a5`) | 여러 저자의 스킬을 모은 보관 저장소이고 해당 경로에 라이선스 파일이 없다 — 읽고 비교만 했다 |
| evaluating-trade-offs | skills.sh 목록 → `oldwinter/skills` | 현재 저장소와 보관 태그 어디에도 원문이 없어 받지 못했다(목록 설명만 확인) |

비교 결과와 개선 내용: `.claude/skills/tradeoff-study/references/sources.md` §2.
