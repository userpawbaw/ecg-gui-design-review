# A-P1 AA fidelity gate

2026-10-06 · AA KEEP / 전체 A-P1 TUNE

- G1: 새 미술 방향 없음. 승인 A-P1 구도/자산/빛 유지. 기술 근거는 설치 Three.js r186 소스와 공식 문헌, ECG_A_antialiasing_research.
- G2: 신규 3D/texture 자산 없음. SMAAPass는 현재 설치 MIT Three.js addon. hash/registry는 기존 A-P1 유지.
- G3: AA4후보 각12 동일p 정지프레임과4jitter프레임, 4이동영상. 기준/MSAA 각12 디코딩프레임 +최종12. 경계 확대 직접 검토, MSAA KEEP/hybrid 제외/SMAA fallback.
- G4: 룩 전체 변경 아님. volume jitter std48/64/96와 local GPU query 측정. ROI 진단을 전역 품질 점수로 해석하지 않음.
- G5: volume/bloom/grain/jitter/step 분리, final17/R/native-scroll/stationary/reduced PASS. pointer microfollow의 기존 코드는 유지했지만 별도 체감 재승인 없음.
- G6: 비교→step/grain→최종 검증의3묶음. 잔여 volume shimmer/material/cart/camera/receiver TUNE. 목표PC/600초/Edge 미검증.

원본 baseline 파일 보존. PNG는 실제 브라우저 screenshot, JPG video-*는 저장 WebM을 브라우저에서 디코딩한 frame. WebM은3D canvas captureStream30fps/VP9이며 DOM/ECG는 포함하지 않는다. 프레임 시간/GPU시간은 녹화 없는별도8초 경로와 분리. 참고검증 PC=RTX3070,1920x1080,DPR1.

상세: docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_A_antialiasing_review_2026-10-06.md.
