# B_BLOCKED — DUAL-ATTRACT-001 Director B

- Frozen at: 2026-09-20T00:39:34Z
- Mode: `NATIVE_DIRECTOR`
- Target: `prototype/v2` Attract screen
- Status: blocked before prompt discovery and generation
- Production UI edits: none
- Director A inspection: none

## Outcome

The official Superdesign CLI ran, but the session was unauthenticated. The required login command created an auth session and then failed after its 30-second request timeout without emitting an authorization URL or device code. The official Superdesign skill says to stop when login itself fails; therefore no prompt-library search, model listing, project creation, component creation, draft generation, or iteration was attempted.

No alternate tool was used to fabricate a visual draft. No project ID, canvas URL, draft ID, preview URL, model, prompt slug, price, or cost is claimed.

## Verified CLI facts

- Invocation prefix: `npx --yes @superdesign/cli@latest`
- Exact CLI version reported: `superdesign v0.14.0`
- Preflight exit code: `0`
- Authentication status reported: `not authenticated`
- Login invocation: `npx --yes @superdesign/cli@latest login`
- Login exit code: `3`
- Login terminal result: `Login failed` / `timeout of 30000ms exceeded`
- Authorization URL/device code: none emitted
- Telemetry notice reported by CLI: `SuperDesign collects anonymous CLI usage; set DO_NOT_TRACK=1 to disable`
- Telemetry transmission was expressly authorized in `AUTHORIZATION.md`; `DO_NOT_TRACK` was not set for these invocations.

## Verified counts

| Item | Count |
|---|---:|
| Bare preflight calls | 1 |
| Login calls | 1 |
| Prompt-library searches | 0 |
| Prompt bodies fetched | 0 |
| Models listed | 0 |
| Projects created | 0 |
| Baseline reproduction generation calls | 0 |
| Branch iteration generation calls | 0 |
| Total Superdesign generation calls | 0 |
| Direction Cards | 0 |
| Cheap prefilter decisions | 0 |

The Direction Card and prefilter stages were not reached because Native direction ideation must retain actual prompt-search provenance, and the CLI workflow was required to stop at failed authentication. Inventing a prompt source, model, or card provenance would violate the role contract.

## Baseline and init verification

All 14 baseline files matched `input-manifest.json` exactly. The six required manual init files were created under `baseline/.superdesign/init/`, confirmed nonempty, and reread before the preflight:

- `components.md`
- `layouts.md`
- `routes.md`
- `theme.md`
- `pages.md`
- `extractable-components.md`

The source context establishes that Attract is an expanded large viewer with a 10-second `REPLAY` loop, 10-second sweep span, speed 1, hidden controls/method rail, and a CTA that returns to direct comparison at the same scene/time. The preservation constraints remain: waveform geometry, shared time and axis, physical mV units, Input/Reference/selected Output/Difference semantics, source labels, and no invented metrics or live-device claims.

## Skill-caused actions

The official Superdesign skill required and caused these actions in order:

1. Read `SKILL.md`, `references/INIT.md`, and `references/SUPERDESIGN.md` fully before CLI use.
2. Build and read all six repository init files before any design command.
3. Start with the bare CLI command as the preflight.
4. Run `login` after the preflight reported unauthenticated.
5. Stop after login failed; do not retry, search, list models, create a project, or spend generation credits.

## Unknown / unverified

- Exact telemetry payload: unknown; authorization covered this uncertainty.
- Authentication session identifier: not exposed in captured output.
- Cause of login timeout beyond the CLI-reported 30-second timeout: unknown.
- Available prompt library, chosen prompt, model catalog, chosen model: unverified because commands were not permitted after login failure.
- Pricing, quote, or credit cost: unavailable; no pricing command or generation was reached.
- Project/canvas/draft/preview identifiers or URLs: none exist from this run.
- Draft visual fidelity and design diversity: untested.

## Recovery packet

Resume only in this same isolated B workspace. Re-run the required bare preflight. If it still reports unauthenticated, run the vendor login in an environment where its auth request can complete; if an authorization URL/code appears, relay it to the human immediately and wait. After successful auth, continue with actual prompt search, prompt selection, `list-models`, 4–6 Direction Cards, cheap prefilter, one baseline reproduction generation, and at most one branch iteration. Do not add a third generation call and do not reuse a project or resume state that might contain another director's ideas.
