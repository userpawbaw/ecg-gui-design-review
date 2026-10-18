# 독립 재질 벤치의 검증 범위

- G1: 해당 없음 — 레퍼런스 효과 이식이 아니라 D-142의 원본/재질 비교. 보호된 효과 상수는 변경하지 않았다.
- G2: PASS(벤치 범위) — 외부 8팩 CC0/test-only, 공식 URL·SHA·PH MD5 기록. 2K 입력, 패널 정면 기준 약 5.4 texel/pixel(1m UV 2048 texels / 640px÷1.7m). 실제 서고·아틀라스·웹 용량 예산은 확인 안 함.
- G3: 해당 없음 — 사이트 원본을 복제하지 않고 자체 시험대의 11조건×2시점을 비교. KEEP/TUNE/REJECT와 확인 안 함은 README. 움직이는 효과의 6/12프레임 검증을 대체하지 않는다.
- G4: 제한적 PASS — 동일 패널 ROI의 고주파 편차와 원본 맵 대비·요인 분리 PSNR 기록. 레퍼런스 최종 장면과 톤 일치 확인 안 함.
- G5: PASS(정지 두 시점 범위) — front/oblique 22장. 웹·스크롤·동작·reduced-motion 확인 안 함.
- G6: CGBookcase normal 방향 검토 1회 보정, 두 시점 재렌더. 최초 두 장은 기각하고 SHA를 normal-correction.json에 기록. 나머지 20장 SHA 보존.

전체 서고 출시 판정: NOT VERIFIED. 독립 시험대 렌더·맵 측정은 PASS. 최종 미감은 사용자 확인 전이며 권장 카드도 잠정이다.
