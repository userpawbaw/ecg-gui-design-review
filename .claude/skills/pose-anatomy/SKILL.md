---
name: pose-anatomy
description: Pose a rigged human figure (Blender / Rigify, the R1 archive figure) so it reads as natural — joint range-of-motion limits, comfortable resting ranges, self- and object-collision, contacts, balance, and a reference-pose search before posing. Use whenever a figure pose is created or changed, or a render shows a bent/twisted limb, and run the pose validator (scripts/assets/pose-check-v3.py) before showing any render.
---

# Pose anatomy — natural human poses with a feedback loop

Origin: user 2026-10-05 — "관절이나 발목 위치 이런 부분에 대해 자체 피드백 루프가 없는 것 같아 … 어디까지 꺾일 수 있는지, 일반적인 자세는 무엇인지 … 다른 객체와 충돌, 관절 가동 범위 등을 검토할 수 있어야 하고, 참고할 만한 자세를 인터넷에서 검색해서 레퍼런스로 삼는 작업도 좋아 보여."
Searched 2026-10-05: existing public skills cover rigging basics (joint types, hierarchy) or motion-clip inspection (ground contact, foot sliding, twist), but none gives numeric ROM limits plus static-pose plausibility for a posed still. This skill fills that gap. Numbers: `references/rom.md` (sources there).

## Procedure (every pose)

1. **Reference first.** Before posing, find 2–4 photo or 3D-poser references of the exact pose (search terms in `references/rom.md` §4). Record URLs + what each shows in the pose's verification README. Never copy reference images into the repo. If the user supplied reference images, they are the target; web references only fill in what they do not show (a hidden side, the hand).
2. **Write the pose as intent, not angles.** List contacts (what rests on what: "right forearm across the right knee top", "left hand on the left ankle", "buttocks on the floor", "back against the shelf"), the support (what carries the weight), and the gaze. These become `contacts` in the validator spec.
3. **Check reach before solving.** For every contact a limb must reach, compare the distance from the limb root (shoulder / hip) to the target with the limb length. Too short → change the torso (lean, sit lower/higher), not the target. Too long → the limb will be straight; move the torso closer. (A twisted arm in the 2026-10-04 floor pose came from moving the wrist target to fit a reach that was really a torso problem.)
4. **Solve with IK + pole + explicit end orientation.** Pole = the direction the elbow / knee should point (elbow: down-back-out; knee: forward-up). Hand orientation must keep the wrist within ±70° flexion/extension and ±85° pronation from neutral (palm facing the body = neutral).
5. **Run the validator** (`pose-check-v3.py`, wired into `build-figure-v3.py`): ROM per joint graded OK / WARN / FAIL, elbow and knee bend plane and hinge twist, self-collision between body capsules, floor / seat / scene penetration, contacts, balance. Any FAIL blocks export. WARN is allowed only when the pose genuinely needs it (folded floor sitting needs hip external rotation) and the README says why.
6. **Look at it from 4 sides** (front, back-3/4, both profiles) in clay before any lit render; compare side by side with the reference. The user judges from the 3/4 view — check that view especially.
7. **Scene check.** In the archive, run the figure-vs-scene collision (`build_archive.py` prints `figure collisions`) — chair, stool, ladder, shelves, desk, floor.

## Motions (fist, breath, any keyframed sequence) — added 2026-10-06 (D-052, R-021)

1. **Measure a real one first.** Prefer the user's own video of the motion → MediaPipe landmarks (`scripts/assets/handcap/`)
   over guessed curves; keep the raw video out of the repo. Use the view with the least self-occlusion (palm side for a fist).
2. **Ends from anatomy, path from measurement.** End poses from `references/rom.md`; per-joint timing curves from the
   measurement (joints do not move together).
3. **Gate every frame** (≥ 21 per direction) with the validator plus part-vs-part capsules (radii from the mesh cross-section);
   if a straight interpolation collides, search a detour offset, do not loosen the limit.
4. **Self-test at the extremes**: the selftest must hold a valid end-range case (fist) and an invalid one just past it.
   If a measured value jumps between neighbouring frames, suspect the measurement formula before the pose (R-021).

## Natural-pose heuristics (beyond the hard limits)

- A relaxed joint sits at 30–60 % of its range, rarely at an end. Two joints at the end of range in one limb read as strain.
- Elbows bend in the plane of the arm; a forearm never wraps sideways around something. Hinge twist > 15° = wrong.
- A hand resting or hanging: wrist flexed 20–50°, fingers curled 20–45° (MCP < PIP), thumb beside the index.
- Hands that rest on something touch it — 0–2 cm, not floating and not sunk.
- Feet: a flat foot shares the floor plane; a foot on a rung has the ball (not the arch or toes) on it.
- Head follows the gaze target; neck flexion + head flexion share the bend (≈ 40/60).
- Asymmetry reads natural; mirrored arms and legs read as a mannequin display.
- Weight: seated, the pelvis carries it; standing, the centre of mass projects inside the feet (plus any wall / hand support).
