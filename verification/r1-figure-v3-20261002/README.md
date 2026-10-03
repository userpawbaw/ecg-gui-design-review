# R1 사람 v3 + ECG 전극·선 (D-048, 2026-10-02)

Blender Cycles 정지 렌더(웹 화면 아님). 점선은 Story 상태 미리보기이며 파형·수치가 아니다.

| 파일 | 내용 |
|---|---|
| `lineup_sheet.jpg` | 원본 후보 A realistic(**사용자 확정 2026-10-03**) · B Blender stylized(AI 추천, 보류) · C Quaternius(CC0) · D Mannequiny(CC BY 4.0) — 위: 점토, 아래: H5 |
| `check/sheet_A.jpg` | **A 원본** v3 점토 확인(달걀 머리·앉은 자세·전극·쉼/쥠 손) |
| `check/sheet.jpg`, `check/hands.jpg` | (B 원본, 이전) v3 점토 확인: 달걀 머리, 앉은 자세, 전극 위치, 옆대 쥠(위 쉼 / 아래 쥠) |
| `v3_archive_sheet.jpg` | 서고 안: s4·s5 정상(파랑) vs 노이즈(빨강), s7 가슴(정상), s6 쥔 손(노이즈) |

만들기: `python scripts/assets/build-figure-v3.py` → `python scripts/blender/build_archive.py --preview <DIR> --fig v3 --look h5 --signal clean|noise --shots s4_person,s5_crane,s6_grip,s7_chest`

## 자체 검토
| 항목 | 판정 | 메모 |
|---|---|---|
| 얼굴 없는 달걀 머리 | PASS | 눈·코·입·귀 없음 |
| 옆대를 쥔 손(F-030) | PASS | 손가락이 옆대를 실제로 감쌈, 쉼↔쥠 형태 키. s6에서 주먹으로 읽힘 |
| 전극 10개 | PASS | V1–V6, RA·LA 손목 안쪽, RL·LL 발목 안쪽. 가슴 전극은 심장 빛을 받아 분홍빛 |
| 파랑·빨강 구분 | PASS | 리드선·트렁크가 정상 파랑 → 노이즈 빨강, 몸속 파랑 경로는 유지, RA 둘레 빨간 고리 |
| 보라 통신선 | CONDITIONAL | 카트→컴퓨터가 짧고 책상 아래라 s5에서 거의 안 보임 |
| 빨강 전원선(콘센트→컴퓨터) | CONDITIONAL | 책상 뒤에 가려 s5에서 안 보임 — 노이즈 원인이 화면에 없음 |
| 리드선 묶음 위치 | CONDITIONAL | 무릎 위 묶음이 사타구니 근처라 선이 그쪽으로 모임 — 허리 옆이나 허벅지 옆 대안 |
| 웹 | 미착수 | v3 메시·전극·선 내보내기, H5 셰이더, 흐르는 점선 셰이더 |

## 갱신 2026-10-03 — 원본 A, 배치 수정 1–3
`v3_archive_sheet.jpg`를 A 원본·수정 배치로 다시 렌더. 수정: 1 콘센트 → 바닥 멀티탭(카트 오른쪽), 전원선이 트렁크 옆을 지나 책상으로 · 2 보라 통신선 책상 위 · 3 리드선 묶음 오른쪽 허리. 위 표의 세 CONDITIONAL은 다시 렌더로 확인.

## 갱신 2026-10-03 — 3전극
10전극이 난잡하다는 사용자 판단으로 3전극(RA·LA 쇄골 아래, LL 왼쪽 아랫배)으로 바꾸고 `archive/`·`v3_archive_sheet.jpg`를 다시 렌더.
