# Joint range of motion (ROM) and comfort ranges used by the pose validator

Degrees, from neutral anatomical position (standing, arms at the sides, palms facing the body = forearm neutral).
`limit` = normal active ROM (FAIL beyond). `comfort` = where a relaxed / held pose normally sits (WARN beyond).

| joint | motion | limit | comfort | note |
|---|---|---|---|---|
| shoulder | flexion (arm forward/up) | 180 | 0–120 | |
| shoulder | extension (arm back) | 50 | 0–35 | |
| shoulder | abduction | 180 | 0–100 | |
| shoulder | horizontal adduction (across chest) | 130 | 0–100 | |
| shoulder | internal / external rotation | 70 / 90 | ±60 | measured with the elbow bent |
| elbow | flexion | 145 | 15–125 | ADL need ≈ 124° |
| elbow | hyperextension | 5 | 0 | |
| elbow | out-of-plane (carrying/varus) | 20 | 15 | hinge |
| elbow | hinge twist (humerus vs ulna) | 15 | 8 | rig artefact if larger |
| forearm | pronation / supination | 80 / 80 | ±60 | hand relative to elbow |
| wrist | flexion / extension | 70 / 70 | 50 / 45 | ADL ≈ 24° flex, 40° ext |
| wrist | radial / ulnar deviation | 20 / 35 | 15 / 25 | |
| hip | flexion | 125 | 0–110 | 100 knee straight, 120–125 knee bent |
| hip | extension | 30 | 15 | |
| hip | abduction / adduction | 45 / 30 | 35 / 20 | |
| hip | internal / external rotation | 40 / 55 | 30 / 45 | floor sitting with a folded leg needs ≈ 45–55 external |
| knee | flexion | 150 | 0–140 | deep squat / folded leg reaches 145–150 |
| knee | hyperextension | 5 | 0 | |
| knee | out-of-plane (varus/valgus) | 15 | 10 | hinge |
| ankle | dorsiflexion / plantarflexion | 30 / 50 | 20 / 40 | |
| ankle | inversion / eversion | 35 / 20 | 25 / 15 | |
| cervical | flexion / extension | 60 / 70 | 45 / 50 | head vs chest |
| cervical | lateral flexion / rotation | 45 / 80 | 30 / 60 | |
| trunk | flexion / extension | 80 / 30 | 50 / 20 | chest vs pelvis (thoraco-lumbar) |
| trunk | rotation / lateral flexion | 35 / 30 | 25 / 20 | |
| fingers | MCP / PIP / DIP flexion | 90 / 110 / 80 | 70 / 90 / 60 | hyperextension ≤ 20 |

## Posture-specific norms (override the general table for that posture only)

| posture | joint | mean | range | source |
|---|---|---|---|---|
| cross-legged / folded floor leg | hip flexion | 87.7 | 60.2–105.6 | BMC Musculoskelet Disord 2021, 3D motion analysis of ten Asian sitting positions (n = 48) |
| cross-legged / folded floor leg | hip abduction | 28.9 | 9.9–45.7 | same |
| cross-legged / folded floor leg | hip external rotation | 62.0 | 37.6–81.7 | same |

Validator use: `override={'hip.L rotation external': (82, 70, 'cross-legged norm'), 'hip.L abduction': (46, 35, …)}`.

## Collision and contact

- Body parts as capsules round the ORG bones (radius from the 1.666 m body): head .095, chest .13, pelvis .13, upper arm .045, forearm .037, hand .028, thigh .07, shin .05, foot .04.
- Non-adjacent capsules may touch (a forearm resting on a knee, a foot under the other shin) but penetration deeper than 45 % of the summed radii is FAIL, 25 % WARN.
- Floor: no vertex below −15 mm (FAIL below −25 mm). Seat: buttock contact within ±15 mm of the seat height.
- Scene: body vertices inside scene objects (chair, stool, ladder, shelves, desk): WARN over 10 mm, FAIL over 25 mm. Upholstered seats (the leather armchair) FAIL over 60 mm — a seated thigh sinks 3–6 cm into a cushion; list such objects explicitly (`SOFT` in build_archive), never loosen hard objects.
- Contacts named in the pose spec: distance from the body part to its target ≤ 30 mm (WARN to 60 mm, FAIL beyond).

## Sources

- AAOS normal joint motion (as tabulated by the U.S. Social Security / workers' comp guides): https://www.enlyte.com/insights/article/adjuster/understanding-normal-range-motion-joint-functionality
- Luttgens & Hamilton 1997, via WikEM "Range of motion by joint": https://wikem.org/wiki/Joint_ROM_(Table)
- Functional ROM in nine everyday tasks (inertial sensors): https://pubmed.ncbi.nlm.nih.gov/30875600/
- Functional ROM for seated ADL tasks (2025): https://pmc.ncbi.nlm.nih.gov/articles/PMC12425972/
- Idea only (not copied): MIT skill "blender-motion-state-inspection" (ground contact, twist separated from swing): https://claudeskills.info/ko/skills/affaan-m/ecc/blender-motion-state-inspection/

- Cross-legged sitting kinematics: https://pmc.ncbi.nlm.nih.gov/articles/PMC8276444/

## §4 Reference-pose search terms

- "sitting on floor one knee up arm resting on knee pose reference", "floor sitting one leg folded pose reference"
- "ladder climbing pose reference hand over hand", "sitting armchair hands on thighs reference", "typing posture side view"
- 3D posers that show any angle: PoseMyArt (https://posemy.art/blog/sitting-pose-reference-guide/), JustSketchMe, DesignDoll. Record the URL and what it shows; do not copy images.
