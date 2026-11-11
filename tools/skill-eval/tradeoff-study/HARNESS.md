# Eval harness contract

Each case is a folder:

```
<case>/
  prompt.md      # the user's message, verbatim (Korean, as a real user would type). No hints about what is being tested.
  files/         # copied into the run's working directory (may be empty). Only python3 stdlib and node 22 are available. No numpy, no network installs.
  hidden/        # NEVER copied to the run. The executor must not be able to see it.
    rubric.json  # {"type": "exec"|"judgment"|"mixed", "assertions": ["...", ...], "notes": "..."}  assertions are judged by an LLM grader from the final answer + transcript + work dir
    check.py     # optional. `python3 check.py <workdir> <baseline_files_dir>` prints ONE JSON object:
                 #   {"metrics": {...numbers...}, "assertions": [{"text": "...", "passed": true|false, "evidence": "..."}]}
                 #   Must be deterministic enough to re-run; timing checks use best-of-N and generous ratios.
    reference/   # optional reference solution(s) proving the case is solvable and showing the expected level
    answer.md    # what a strong result looks like and why; common wrong paths; which evidence grade (theoretical optimum / measured good solution / expert recommendation)
  case.json      # {"name": "...", "category": "...", "summary": "one line"}
```

Runs: `python3 run_case.py <case_dir> <none|old|new> <out_dir>` creates `<out_dir>/work` (copy of files/), installs the skill under
`work/.claude/skills/` when the config has one, then runs headless `claude -p` (model claude-fable-5-2) inside `work/` with
tools Read/Edit/Write/Glob/Grep/Skill and Bash limited to python3, node, ls, cat, time, wc, head, tail, grep, find, diff, mkdir, cp.
The run is non-interactive: there is no user to answer. Every config receives the same one-line suffix after the prompt:
"(비대화형 실행입니다. 저에게 물어볼 것이 있으면 답변에 질문으로 적어 주세요.)"
Saved: `transcript.jsonl`, `final.md` (last assistant message), `timing.json`, `skill_used.txt`.

Grading: `python3 grade_exec.py <case_dir> <out_dir>` runs hidden/check.py; LLM graders judge rubric.json assertions and write `grading.json`
(`expectations: [{text, passed, evidence}]`).
