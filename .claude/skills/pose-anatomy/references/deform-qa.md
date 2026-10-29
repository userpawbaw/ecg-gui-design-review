# Skin deformation QA and motion-retarget fidelity — manual and checklist

Origin: user 2026-10-08, after a retargeted Mixamo `Sitting_Idle` pose:
> "앉은 자세는 옆에서 볼 때 엉덩이가 찌그러지는 거나 어깨쪽 팔 피부가 무릎과 닿으며 기괴하게 늘어나는 지점을 수정해줘. 이 문제를 네가 잘 못 잡네. 관련 업계 사이트(maya, unity 등등)의 제작 가이드, 포럼 등에서 관련 업계인 수준의 제작 스킬을 확보하고, 이런 문제를 자체적으로 검출할 수 있는 기준이나 체크리스트/메뉴얼을 만들어봐."

The user then found the actual root cause before the AI did:
> "내가 준 자세와 시트는 분명 팔꿈치와 무릎 끝이 닿는 자세라서 어깨에서부터 팔꿈치까지 각도가 자연스럽게 내려오는데, 네가 만든 자세는 겨드랑이와 세운 무릎 부분이 맞닿게 되어 있어서…"

**Lesson:** the AI spent hours tuning skin metrics and weight edits on a pose that was wrong. The skin damage came from the
skeleton landing in the wrong place. So this manual starts with **pose fidelity (§1)** and only then checks the **skin (§2–4)**.

Tools:
- `scripts/assets/retarget-mixamo-v3.py` — retarget; `FIX={"diag":1}` prints the fidelity table; `FIX={"ik":…}` applies contact goals.
- `scripts/assets/deform-check-v3.py` — skin QA: heatmaps, close-ups, `ON_REST=1` map.
- `scripts/assets/pose-check-v3.py` — joint ROM and capsule collisions.

---

## 1. Retarget fidelity — run this FIRST

A copied rotation keeps joint **angles**, not **positions or contacts**. Two skeletons differ in segment lengths and in where
each segment starts, so the same angles can put a hand, an elbow or a shoulder 10–20 cm away from the source.

### 1.1 Measure (before looking at the skin)
`FIX='{"diag":1}'` prints, relative to the pelvis, each key joint of the source (scaled by height) next to ours, and the
per-segment direction error.

| Check | Pass |
|---|---|
| Pelvis, knees, ankles vs source | ≤ 3 cm |
| Neck base, shoulder joints vs source | ≤ 3 cm |
| Elbow / wrist vs source | ≤ 5 cm, or the contact it serves holds (1.2) |
| Every source contact (what touches what) reproduced | gap 0–2 cm, penetration ≤ 5 mm (capsules) |
| Side-by-side render vs the source mesh, same 4 cameras | silhouettes match to the eye |

### 1.2 Write down the contacts of the source pose
Read the source pose (sheet or the source mesh rendered from 4 sides) and list what rests on what. For `Sitting_Idle`:
- left elbow on the top of the left knee;
- right hand on the right shin;
- buttocks and the right leg on the floor.

Each contact becomes an **IK goal**. The goal is the source contact point expressed in the touched limb's hip–knee–ankle
frame, scaled by the height ratio. Because our limbs are thicker, the goal is pushed out along that offset (`gap`, ×1.0–1.8)
until the capsules clear (≤ 5 mm).

The rest of the skeleton is moved only as much as the reach needs. Each adjustment is penalised; this run chose a 10°
shoulder shrug and a 2° lean. Large leans or foot slides change the pose: if the solver needs them, the trunk or clavicle
mapping above is wrong. Fix that first.

### 1.3 Rig-specific traps found 2026-10-08 (Rigify ↔ Mixamo)

| Trap | Symptom | Fix |
|---|---|---|
| Spines cut at different heights (our chest bone 0.19 m vs 0.115 m; our neck 0.05 m vs 0.10 m) | Per-segment rotations or directions put the chest 12–14 cm and the shoulder 20 cm forward → armpit on the knee | Match **pelvis** (`torso`) and **chest** (`chest` control) orientations only |
| Rigify `basic_spine`: `spine_fk.001/.002` are not a serial chain (each hangs off an MCH copying 50 % of hips/chest) | Rotations on them all landed in one joint (42.8°) → crease across the chest | Drive the `chest` control. The DEF spine then bends evenly (32° + 32°) |
| `tweak_spine.*` move ORG bones only, not DEF | ORG measured "even" while the skin still kinked; shoulders shifted off the skin | Measure DEF bones for skin questions. Never "fix" ORG with tweaks |
| Clavicle pivots differ (Mixamo at the spine, ours at the sternum) | Same clavicle rotation → shoulder joint 8–10 cm forward | Place the clavicle by **position**: shoulder joint relative to the neck base, as in the source |
| Arm proportions (in height units: our upper arm ×1.25, forearm ×0.82 of Mixamo's) | Elbow passes the knee | IK goal (1.2). Separately check the elbow joint against the mesh: the narrowest point between the biceps and the forearm bulge |

---

## 2. Skin metrics (`deform-check-v3.py`)

Posed mesh vs rest mesh, same topology, per triangle.

| Metric | Definition | Catches |
|---|---|---|
| strain s1 / s2 | Singular values of the triangle's 2D deformation gradient, log-averaged over a ≈ 2 cm patch (6 area-weighted passes) | Stretched sheets (webbing), collapse |
| crease | Dihedral angle across an edge opened ≥ 60° more than at rest | Tears, pinches, crumples, belly folds |
| intersect | Posed triangles crossing triangles that were ≥ 4 cm apart at rest (BVH overlap) | Limb through limb (knee in flank, calf in thigh) |
| floor | Skin below z = 0 | Sinking into the floor |

Bad triangles are grouped into connected **clusters** and graded by posed **area**. One sliver is mesh noise; a few cm² is
visible at screen size. Each cluster names its body regions (the DEF bone with the largest weight) and, for an
intersection, what it went into.

### Thresholds — calibrated on the accepted story chair pose (0 FAIL)

| | WARN | FAIL | Source / reason |
|---|---|---|---|
| s1 (stretch), body | patch s1 ≥ 2.0 marks a triangle | | Measured skin strain at joints is ≈ 25–30 % tensile and ≈ −50 % compressive (MIT elbow / knee DIC). 2.0 leaves margin for mesh resolution. Hands use 2.6 |
| s2 (squash), body | patch s2 ≤ 0.4 marks a triangle | | Same sources |
| strain cluster area | 15 cm² | 60 cm² | Accepted chair pose: largest groin cluster 30 cm² |
| crease cluster area | 8 cm² | 25 cm² | Accepted chair pose: 5 cm² |
| intersect cluster area | 8 cm² | 20 cm² | Accepted chair pose: hand-on-thigh contact 6 cm² |
| floor | 5 mm | 15 mm | |

### Known blind spots — check by eye
- **Rest-fold zones inflate strain.** In the A-pose rest, the armpit and the perineum/gluteal cleft are folded skin, so any
  limb spread reads as 4–9× "stretch". Big strain clusters there are expected. Judge them with the close-up render: a
  smooth web is OK; a sheet with a sharp edge or flap is a defect.
- **Micro crumples (speckles).** Many tiny flipped triangles in a compressed fold (buttock–thigh junction, belly in deep
  trunk flexion) each stay below the cluster area limit. They show as dark/white specks in clay. A per-radius count of
  flipped triangles is the planned metric; until then, look for specks in the close-ups.
- **Neighbour gate.** Skin within 4 cm at rest is never counted as intersecting, so a fold that passes through itself is
  invisible to `intersect`. Use `crease` and the close-ups.

- **Intended contacts count as intersections.** The elbow resting on the knee, a hand on the shin, and a tightly folded leg
  all show as FAIL. On 2026-10-08 the Mixamo auto-rig, which looked clearly better, scored worse (10 FAIL) than our
  direct rig (8 FAIL). So `deform-check` **locates** problems; it does not **rank** candidates. Rank by the close-ups.
  Planned: a contact allow-list taken from §1.2, and strain measured relative to the rest-fold zones.

### Outputs and views
- 6 heatmaps from the figure's own sides: front, back, right, left, 3/4, top.
- Close-ups of every non-hand FAIL cluster, looked at from outside the body.
- `ON_REST=1`: the findings painted on the rest mesh, to answer "which skin is this?". This is how the arm weight leak into
  the back was found.

---

## 3. Failure taxonomy → cause → fix (industry practice)

| Failure | Typical cause | Fix, cheapest first |
|---|---|---|
| Limb through limb (knee into flank, arm into knee) | Retarget proportions; pose not re-solved | §1: contact IK. Never fix it with skin edits |
| Armpit webbing / flap | Upper-arm weights leak deep into the back and flank (automatic heat weights); arm elevated far past the rest A-pose | Limit arm weights to a radius around the arm axis. Weight the armpit "partially to clavicle, mostly to spine" (Polycount). Let the shoulder take part of the elevation. Corrective shape |
| Buttock crumple / pinch in deep hip flexion | `DEF-pelvis` (Rigify) does not follow the thigh; sharp pelvis/thigh weight boundary | Saddle-shaped pelvis weights and blur the thigh/pelvis boundary (Blender Artists). Corrective shape key ("sit groin fix") driven by hip flexion. Helper bone at half the hip rotation |
| Belly / chest crumple in trunk flexion | Compression on the inside of the bend | Spread the bend over all spine joints (§1.3). Local Delta-Mush-style relax (`mush`). Corrective shape |
| Candy-wrapper twist | Twist taken by one joint | Twist bones / share twist (Unity `upperArmTwist` 0.5). Keep hip/shoulder rotation inside ROM (`pose-check`) |
| Soft-tissue contact (calf on thigh, thigh on belly) | No collision deformer | Collide deformer (Maya Muscle multiCollide / iCollide idea). Or open the joint slightly. The first `resolve_contacts` attempt made it worse: kept but unused |
| Floor sinking | Lowest point not at z = 0; no contact flattening | Lower to the floor. Flatten contact if visible |

Delta Mush / Corrective Smooth evens out strain but does **not** remove self-intersection (CESCG paper).

---

## 4. Checklist (every retargeted or hand-made pose)

1. [ ] Source contacts written as a list (1.2).
2. [ ] `diag` table within the §1.1 limits; side-by-side render with the source from 4 sides.
3. [ ] `pose-check` ROM: FAILs explained (folded floor sitting legitimately needs hip external rotation) or fixed.
4. [ ] `deform-check`: no FAIL outside the rest-fold zones. Every FAIL cluster's close-up looked at.
5. [ ] Clay close-ups of the joints that carry the pose (here: elbow on knee, armpit, buttock–thigh junction, belly). No
   specks, flaps or sharp sheets.
6. [ ] The user's own viewing angle (for the intro: the profile and 3/4) checked last, against the source.

## Sources
- Skin strain at joints: MIT elbow DIC (<https://iafastro.directory/iac/archive/browse/IAC-14/D3/P/24934/>); flexed-limb
  skin strain (<https://www.media.mit.edu/publications/low-cost-methodology-for-skin-strain-measurement-of-a-flexed-biological-limb>).
- Rigify sitting / pelvis deformation: <https://blenderartists.org/t/rigify-sit-on-ground-pose-weird-leg-deformation/1461972>,
  <https://blenderartists.org/t/problem-with-a-pelvis-rig/698257>.
- Shoulder / armpit weighting, helper bones: <https://polycount.com/discussion/118989/shoulder-rigging>.
- Corrective shape keys: Blender manual (Shape Keys → corrective). Pose space deformation: Autodesk Maya docs.
- Twist sharing: Unity `HumanDescription.upperArmTwist`.
- Delta Mush limits: CESCG "Improving Delta Mush Based Character Animation".
- IK goals in retargeting: Unreal IK Retargeter (IK Goals), Maya HumanIK effectors — the same idea as §1.2.

## 5. Rigging route (2026-10-08)
Compared on the same mesh and pose: Mixamo auto-rig vs our Rigify fit vs our own Mixamo-named skeleton with Blender
bone-heat weights.
- Mixamo's joint placement and weights won by eye. Mixamo puts the elbow at a 50/50 shoulder→wrist split; our Rigify fit
  had it ≈ 5 cm low.
- Mixamo is a cloud service built on a template skeleton fitted with machine learning; its patent describes
  diffusion-based weights (<https://patents.google.com/patent/US11170558>). It has no API; uploads are manual.
- To carry Mixamo-quality weights to edited meshes (clothes, electrodes, a remeshed body): use robust skin-weight transfer
  with inpainting (Epic, SIGGRAPH Asia 2023, <https://github.com/rin-23/RobustSkinWeightsTransferCode>).
- Learned auto-rigging, if a new body must be rigged without Mixamo: UniRig (SIGGRAPH 2025, MIT code; checkpoint and data
  licences separate, GPU needed), <https://github.com/VAST-AI-Research/UniRig>.
- Geodesic voxel binding (Dionne & de Lasa 2013) is Maya's robust bind, not available in Blender.

