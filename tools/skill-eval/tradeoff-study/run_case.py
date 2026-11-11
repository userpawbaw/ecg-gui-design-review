#!/usr/bin/env python3
"""Run one eval case headlessly in an isolated directory outside the repo's instruction files."""
import json, os, shutil, subprocess, sys, time, pathlib
case, config, out = pathlib.Path(sys.argv[1]).resolve(), sys.argv[2], pathlib.Path(sys.argv[3]).resolve()
here = pathlib.Path(__file__).resolve().parent
SKILLS = {"none": None, "old": here / "skill-snapshot-v1", "new": here / "candidate"}
SKILL_NAME = {"old": "tradeoff-study", "new": None}
MODEL = os.environ.get("EVAL_MODEL", "claude-fable-5-2")
SUFFIX = "\n\n(비대화형 실행입니다. 저에게 물어볼 것이 있으면 답변에 질문으로 적어 주세요.)"
# the work dir must not sit under the repository (AGENTS.md would leak the skill's method into every config)
root = pathlib.Path(os.environ.get("EVAL_WORK_ROOT", "/tmp/claude-0/-home-user-ecg-gui-design-review/2b86e017-71c3-50ca-a7b4-2d88262370fe/scratchpad/skill-eval-work"))
work = root / (out.parent.parent.name + "_" + out.parent.name + "_" + out.name + "_" + str(int(time.time())))
if out.exists(): shutil.rmtree(out)
out.mkdir(parents=True); work.mkdir(parents=True)
if (case / "files").exists(): shutil.copytree(case / "files", work, dirs_exist_ok=True)
src = SKILLS[config]
if src:
    name = SKILL_NAME.get(config) or [l.split(":", 1)[1].strip() for l in (src / "SKILL.md").read_text(encoding="utf-8").splitlines() if l.startswith("name:")][0]
    shutil.copytree(src, work / ".claude" / "skills" / name)
prompt = (case / "prompt.md").read_text(encoding="utf-8").strip() + SUFFIX
tools = "Read,Edit,Write,Glob,Grep,Skill," + ",".join(f"Bash({c}:*)" for c in
        ["python3", "node", "ls", "cat", "time", "wc", "head", "tail", "grep", "find", "diff", "mkdir", "cp"])
t0 = time.time()
p = subprocess.run(["claude", "-p", prompt, "--model", MODEL, "--output-format", "stream-json", "--verbose",
                    "--permission-mode", "acceptEdits", "--allowedTools", tools],
                   cwd=work, capture_output=True, text=True, timeout=int(os.environ.get("EVAL_TIMEOUT", "1500")))
dur = time.time() - t0
(out / "transcript.jsonl").write_text(p.stdout, encoding="utf-8")
final, res, skill_used, reads = "", {}, [], []
for line in p.stdout.splitlines():
    try: ev = json.loads(line)
    except Exception: continue
    if ev.get("type") == "assistant":
        for b in ev.get("message", {}).get("content", []):
            if b.get("type") == "text" and b["text"].strip(): final = b["text"]
            if b.get("type") == "tool_use":
                if b["name"] == "Skill": skill_used.append(json.dumps(b.get("input"), ensure_ascii=False))
                if b["name"] == "Read" and ".claude/skills" in str(b.get("input", {}).get("file_path", "")): reads.append(b["input"]["file_path"].split(".claude/skills/")[1])
    if ev.get("type") == "result": res = ev
if res.get("result"): final = res["result"]
if p.returncode != 0 or "hit your" in final[:80]:
    (out / "FAILED.txt").write_text(final or p.stderr[-500:], encoding="utf-8"); print(json.dumps({"case": case.name, "config": config, "FAILED": final[:80]})); sys.exit(2)
(out / "final.md").write_text(final, encoding="utf-8")
u = res.get("usage", {})
(out / "timing.json").write_text(json.dumps({"total_tokens": sum(u.get(k, 0) for k in ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens")),
    "output_tokens": u.get("output_tokens"), "duration_ms": int(dur * 1000), "total_duration_seconds": round(dur, 1),
    "cost_usd": res.get("total_cost_usd"), "num_turns": res.get("num_turns"), "model": MODEL, "exit": p.returncode}, indent=1), encoding="utf-8")
(out / "skill_used.txt").write_text("\n".join(skill_used + ["read:" + r for r in reads]) or "(skill not invoked)", encoding="utf-8")
shutil.copytree(work, out / "work", dirs_exist_ok=True, ignore=shutil.ignore_patterns(".claude", "__pycache__", "node_modules"))
print(json.dumps({"case": case.name, "config": config, "sec": round(dur), "cost": res.get("total_cost_usd"), "skill": bool(skill_used or reads), "exit": p.returncode}))
