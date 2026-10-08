# D105 충실도 게이트

| 게이트 | 상태 | 근거 / 한계 |
|---|---|---|
| G1 source 수치 | CONDITIONAL | .42/54, 원본650/1200m 두께, SMAA/maxFar100km 반영. north altitude8km는 번안, 원본 위치/구도 동일 아님. |
| G2 재료 | PASS scoped | 기존 D103 pinned weather/noise/LUT, 새 helper hash. 내부 검토 D084. 출품 전 별도 검토. |
| G3 최소6장 대조 | PARTIAL | north six native diagnostic frames. 외부 source와 6장 모두 동일 구도 나란히 비교는 미완. |
| G4 룩 수치 | PARTIAL | coverage/층/빛 ON/OFF와 GPU metadata 보존. 원본과 맞춘 전체 luminance/chroma 비교 미완. |
| G5 상태 | PARTIAL | cloud/shaft OFF, fullres/upscale와 six fixed pose. continuous motion, reduced-motion/main idle, GPU 회복/targetPC 미검증. |
| G6 자체수정 | CONDITIONAL | source 계약/OFF 수정 → 레이어/광학 시험 → context 대응/lazy/저부하 진단. 정상 GPU의 완전 재검증은 남음. |

종합: 기능 CONDITIONAL / 품질 TUNE. 저부하 software still을 최종 quality/성능 승인으로 사용하지 않는다. GPU 실패2쌍은 명시 REJECT 증거로 분리했다.
