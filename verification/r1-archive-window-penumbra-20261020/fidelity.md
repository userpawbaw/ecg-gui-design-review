# D-150 fidelity / KEEP·TUNE·GAP

- KEEP: 기존 PBR/노출/산란/phase/보호된 Story·GLB. 원래0° PCF 및 roof/window default로 회귀 검사.
- TUNE 1: 큰 창·직선/원형/대각/유기 실루엣과 finite-disc 원리 구현.
- TUNE 2: 표면 자체그림자 줄무늬를 raw-depth15mm offset으로 보정.
- TUNE 3: clay 검수에서 떠 있던 brace와 ring의 연결을 보완. 이후6방위·clay·거리profile 재검사.
- G1: REF-016 EFX-016-02 / D-150. 각지름·거리·정사영depth span 코드화.
- G2: 자체geometry/단색PBR, 새외부파일 없음. 기존GLB/hash 보존.
- G3/G4 GAP: 레퍼런스 새동일6프레임/명도·채도 직접 대조는 하지 않음. 기존 리뷰 §2의 빛 원리/§5소품 규칙을 번안한 독립 비교안이며 사이트와 동등한 완성도 주장 안 함.
- G5: 실제 장면6방위·5A/B·roof/window4조합·입력/restore, 고정소품clay3뷰, 거리bench3각지름. 기존 regression은0°에서12고정/방위/회전·reduced-motion 포함.
- G6:3TUNE 이내. 사용자 미감·물리GPU/Cycles는 확인 안 함. soft volume4tap은 surface PCSS보다 거친 근사.
