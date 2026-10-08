# Mixamo 동작 → v3 Rigify 리그 리타깃 시험 (2026-10-08)

사용자 지시(REVIEW-R1-WEB-20261008 §3-1): 도입부 사람을 story와 같은 모델로, 사다리 오르는 자세로 나타났다 사라진 뒤 사다리 오른쪽 바닥에 무릎을 안고 앉음. 사다리 오르기는 멈춘 한 자세(나타나고 사라지는 효과만), 필요하면 사다리 쪽을 고침. story는 의자 자세 그대로.
원본: 사용자가 준 Mixamo `Climbing_Ladder.fbx`(24프레임), `Sitting_Idle.fbx`(327프레임) — 저장소에 넣지 않음(Adobe 약관상 원본 재배포 불가).
만들기: `python scripts/assets/retarget-mixamo-v3.py <fbx> <frame> <out> [floor|free]`.

## 방법
뼈마다(부모부터) Mixamo 뼈의 월드 회전 변화(포즈 · 기본⁻¹)를, 우리 뼈를 Mixamo 기본(T자) 방향으로 먼저 돌린 틀에 적용 → 뼈 방향을 Mixamo 포즈 방향에 맞추는 보정. 팔·다리 FK, 척추는 FK 세 마디에 나눔, 손가락 포함 52 조절점. 엉덩이 이동은 키 비율(0.933). 바닥 자세는 가장 낮은 피부 점을 바닥에.

## 결과 (`retarget_sheet.jpg`, 점토 정지)
| 자세 | 관문 | 판단 |
|---|---|---|
| 사다리 오르기 1프레임 | FAIL 0, WARN 4(팔꿈치 비틀림, 손가락 MCP 과신전 −10°) | 그대로 쓸 만함 |
| 바닥에 앉기 1프레임 | FAIL 3: 왼 엉덩관절 굽힘 148°(한계 125), 왼 어깨 안쪽 돌림 −111°(한계 70), 오른 엉덩관절 바깥 돌림 90°(한계 55) | 모션캡처의 실제 자세 값이라 우리 검증기 한계(보수적)를 넘는 것. 무릎을 끌어안은 자세의 특성. 피부: 왼쪽 옆구리·엉덩이 바닥 쪽에 접힘이 조금 남음 |

## 고친 결함
- 등 피부가 갈라짐: 척추 굽힘을 가슴 조절점 하나에 몰아 넣음 → FK 척추 세 마디에 나눔 + 피부 접힘 완화(Corrective Smooth, 다른 자세 렌더와 같은 설정).
- 기본 자세 차이(Mixamo T자, 우리 A자): 우리 뼈를 T자 방향으로 먼저 돌린 뒤 회전 변화를 적용.

## 남은 일
1. 바닥 자세 FAIL 3을 모션캡처 예외로 받을지, 몸을 조금 뒤로 기울여 엉덩관절 굽힘을 줄일지(사용자 판단).
2. 사다리: Mixamo 동작의 손·발 높이에서 가로대 간격을 재 우리 서고 사다리와 비교 → 사다리 간격을 고치거나 손발을 가로대에 붙임.
3. 서고 배치(사다리 위 / 사다리 오른쪽 바닥), H5 고리 속성 넣어 웹 glb 내보내기, 심장 크기 조정(story에도 반영), 도입부 카메라·나타나기/사라지기 연출.

## 2026-10-08 (later) — direct route: our mesh on a Mixamo skeleton (`scripts/assets/mixamo-rig-v3.py`)
Run in parallel with the user's Mixamo auto-rig upload (user: "계획은 병렬로 시행해줘"). Result `direct_mixamo_skeleton_sheet.jpg`
(4 views + buttock side, buttock back, chest close-ups), settings `WEIGHTS=auto ARMLEAK=0 MORPH=1 CS=1 BUTT=0 IRON=1 FLAT=0.035`.

| Step | What changed | Effect |
|---|---|---|
| Same skeleton | Mixamo names/hierarchy; trunk and clavicles at the Y Bot's relative positions on our trunk | Back curve, head tilt and arm root follow the source (user review: hunch / turtle neck / dropped shoulder) |
| MORPH=1 | Elbow at the Y Bot's upper-arm/forearm split of our arm length (mesh follows) | Left elbow–knee joint distance 11.8 cm vs source 11.0 cm (was 16.8 cm) |
| Bone-heat weights | Fresh Blender automatic weights on the Mixamo skeleton instead of our Rigify DEF weights summed | Armpit webbing, back flaps and belly tears gone |
| IRON | Taubin smoothing only around flipped triangles | Chest/belly specks: 678 → 5 flipped triangles (75 after the floor pass) |
| FLAT | 3.5 cm soft floor contact | Buttock bottom flattened on the floor instead of pointed |

Fidelity (cm, joints vs scaled source, pelvis-relative): knee 2.3, ankle 2.4, chest 3.4, neck 2.6, head 1.3, shoulder joints 3.7–3.9,
elbows 4.3–4.6, wrists 4.7–4.8.

deform-check (8 FAIL) — what is left:
- strain clusters in the rest-fold zones (perineum 268 cm², left/right armpit 180/63 cm²): smooth in the close-ups (deform-qa.md §2 blind spot);
- leg-leg intersections of the folded right leg (calf in hamstring, 64–67 cm²) and the right hand on the shin (contact): hidden from the
  intro cameras, left as game rigs leave them (user: Y Bot reads natural because it does not squash overlaps);
- thigh into lower belly at the groin fold (27–41 cm²).
Not yet checked: the user's auto-rigged file (pending), the ladder pose on this rig, web export.
