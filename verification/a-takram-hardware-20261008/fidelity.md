# D106 충실도 게이트

| 게이트 | 상태 | 근거 |
|---|---|---|
| G1 | CONDITIONAL | REF015 source 값, D1058km 번안 유지. exponent1.6은 새 검토 옵션. |
| G2 | PASS scoped | 기존 pinned 자산, native/meta 해시. 내부 검토 D084. |
| G3 | PARTIAL | 같은 six camera를 upscale/fullres/대비1.6 세 조건으로 대조. 외부 레퍼런스의 같은6frame 대응은 미완. |
| G4 | PARTIAL | 해상도/품질/밀도/층/광학 상태 대조. reference luminance/chroma의 정량 정합은 미완. |
| G5 | PARTIAL | source→north six poses, temporal/weather/contrast/shaft OFF. continuous scroll, targetPC, reduced-motion/main 통합은 미검증. |
| G6 | CONDITIONAL | 장치 점검→시간 재구성 분리→대비 후보 전체6구도 재검증. 추가 자체 shader 수정은 하지 않음. |

RTX 및 native 저장 기능 PASS, quality TUNE. 새 시험 중 context loss/warn/error 미관찰은 원래 컴퓨터 중단 원인 해결이나 장기 안정성 보장이 아니다.
