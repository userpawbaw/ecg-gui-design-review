# D-152 실행 fidelity

- KEEP: 원본GLB/Story/baked/r8/D-084/default,표면PBR·노출·빛색·geometry가림·PCSS.기존모드회귀PASS.
- TUNE1: 새field의띠사이빈틈을넓혀확산안개대신명암띠를강조(.04+2.3×ridge⁴).
- TUNE2: ROI대비저하를보고gain2.4→1.8,정지/재생density시간일치.최종3시점/12시간점다시검사.
- G1: D-152 / REF-016 EFX-016-03,공통field uniforms/단위/clamp/clock.
- G2: 프로젝트자체GLSL만추가,외부원문/에셋반입없음.기존asset/허용runtime유지.
- G3: 광원쪽/옆/반대A/B각2장과시간12장검수.새구름/오로라영상과같은프레임직접대조는없어reference동등품질GAP.
- G4: ROI p10/p90/대비와clipping측정.최종새모드대비약86.2%유지,사용자미감미확인.
- G5: 모드·12시간·freeze/복원·legacy링크·reduced-motion·광학bench.기존회귀는12방위/회전/반응형포함.새모든방위/모바일/실GPU GAP.
- G6: 2TUNE,remainingGAP를README와분리.첫surfaceprobe의실패는유지하고실제직사면probe로수정검증.
- 운동은domain warp이지curl유체나광선휘어짐/자체발광aurora가아니다.
