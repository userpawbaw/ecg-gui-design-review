---
name: tradeoff-study
description: Use whenever something has to become faster, lighter, cheaper or smoother, or you must choose between ways of building it — performance or memory complaints, "optimize this", 최적화, 느려, 버벅, 무거워, 메모리, 튜닝, 성능, 트레이드오프, "어떤 방식이 나을까", quality-versus-cost choices, parameter tuning. Use it also when the user prescribes a specific optimization (add a cache, parallelize, pre-render, downsample), because the prescription needs checking before it is built. Not for plain bug fixes, creative direction, or carrying out a method that is already decided.
---

# Finding the best way for this context

A good result here is the change that reaches the goal while giving up nothing anyone needs in this situation, and it is found by measuring. The usual ways this goes wrong: speeding up the wrong place, breaking something that mattered, announcing a gain that was never re-measured, and building machinery nobody needed. The steps below exist to prevent those four.

Write to the user in their language.

## 1. Size it first

Find out what hurts, who feels it, and what number would make it fine. The target usually follows from context: a refresh interval, a batch window, a frame budget, a memory limit, how often the thing runs. If the current state is cheap to measure, measure it now.

- If it already meets the need, say so with the number, make at most a trivial fix, and ask what the user is actually seeing. That is a complete answer, and it should be short. A large speedup ratio on something that was never a problem is not a win.
- Picking the faster of two equally simple idioms needs none of this.
- Otherwise continue. Let reversibility set the depth: a local change you can undo goes straight into the loop in step 5. A choice that is hard to undo (data format, architecture, asset pipeline, public interface) gets compared on paper with estimates first, and the user agrees before you build.

## 2. Learn what must not change, and what may

Read what the project says before choosing a method: README, docs, contracts, tests, comments near the code. Constraints are often written there and not in the request.

- **Hard constraints** are correctness, data contracts, freshness, safety and anything the user has fixed. They filter options. They are never traded for speed, however large the gain.
- **Slack** is what the consumer of the result cannot perceive or does not need here: resolution beyond the pixels, freshness beyond the refresh, precision beyond the sensor, work that is covered or off screen, input ranges that never occur. Slack is where a loss costs nothing, so it is where the best options come from. It needs evidence: a document, a measurement, the user's words. "Nobody will notice" about perceived quality is a hypothesis; the user confirms it.
- **Build the guard** before changing anything: save the current output or run the tests, so you can show that what matters stayed the same. "Same" is defined by the constraint, exact or within the stated tolerance.

## 3. Diagnose before you change

Measure a baseline and find where the time or memory actually goes (profiler, timers, counting calls, query plans). State the top contributor and how much there is to gain if it cost nothing. Check the workload too: how often it runs, on how much data, and what production scale does to it. Growth with data size is the most common cause.

Treat a cause or fix named by the user as a hypothesis and test it against this evidence. When the evidence disagrees, neither obey silently nor ignore silently: say what you found, fix what actually causes the problem, and say what you did not do and why. When the requested fix would break a hard constraint, leave that part unbuilt and raise the conflict.

## 4. Choose the cheapest thing that reaches the target

Try options in this order, because the earlier ones remove work and the later ones add machinery with side effects (a cache costs freshness, parallelism costs complexity):

1. do not do it at all
2. do it once (hoist, precompute, index)
3. do less of it: only what the consumer needs, which is the slack from step 2
4. lower the cost per item with a better algorithm or data structure
5. do it later or while idle
6. do it in parallel or on more hardware

Before a cache, fast path, flag or thread pool, ask whether the per-item work can simply disappear.

For each candidate note the expected gain from the diagnosis, what it gives up, and where that loss lands. A loss inside the slack is free. A loss that touches something needed is real.

- A free option that reaches the target: do it.
- Only options with a real loss reach the target: that trade-off belongs to the user. Show the two best with numbers, recommend one, and let them decide.

When the obvious options fall short, or the problem is rendering, UI or data volume, read `references/levers.md`. For tuning parameters read `references/tuning.md`.

## 5. Loop: change, measure the same way, check the guard

- Change one thing, then run the same command on the same input several times. `python3 scripts/bench.py -- <command>` reports median and spread, and `--compare` tells you whether two results differ by more than their noise. A difference inside the run-to-run spread is not an improvement. Details for browsers, JIT warm-up and GPUs are in `references/measurement.md`.
- Check the guard, and check it once on input you did not tune on (another size or shape). The change must be right for every valid input, with nothing special-cased for the benchmark.
- If it is slower or no better, revert and go back to the diagnosis. After a successful fix, profile again, because the bottleneck moves.
- Continue until one of these is true, and say which: the target is met (stop there, do not overshoot); the largest remaining contributor is small against the whole; the next step needs the user's decision; three attempts have failed and the diagnosis needs rethinking. A first measurable gain is not a reason to stop while the target is unmet and a known contributor remains.

## 6. What needs the user and what does not

Do these without asking: reading, measuring, profiling, writing benchmark scripts, reversible experiments in the working copy, and fixes that keep the output identical.

Bring these to the user, after investigating and before the change, as a question they can answer with the numbers you observed: a target you cannot derive when it changes the choice; any option with a real loss; dropping or weakening a requirement; a change that is expensive or hard to undo; confirmation of perceived quality; a requested approach you did not follow.

If nobody can answer right now, do what is safe, state the assumption you made, and put the question in the report.

When the user pushes back or suggests a method, test it as a candidate like any other. Adopt it when the evidence supports it and explain with numbers when it does not. The goal and the final approval are theirs.

## 7. Report

The reader has not seen your tool calls. Lead with the outcome, and scale the length to the task: three to six lines for a small one. Whatever the length, include:

- what was actually slow or heavy, and the evidence
- what you changed or recommend, and why it is the cheapest route to the target
- before and after numbers, how they were measured, and which numbers are estimates
- what was given up and why it does not matter here, or that it is a real loss awaiting a decision
- what would flip the decision
- anything requested that you did not do, and why
- what is not verified and needs the user's eyes or the target machine
- open questions

## Project notes

If the repository keeps decision records or past experiment notes, search them for the technique before proposing it; an option already tried and rejected there needs new evidence to come back. For the ECG GUI project see `references/project-ecg.md`. Worked examples, including failures, are in `references/examples.md`.
