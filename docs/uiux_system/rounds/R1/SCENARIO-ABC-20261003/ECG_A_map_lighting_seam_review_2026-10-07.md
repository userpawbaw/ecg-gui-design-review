# A 지도 조명 경계 정합 — 2026-10-07

D-096 / F-064 / CASE-007. 수정 후보 TUNE / 사용자 최종 확인 대기.

## 사용자 판정
“이전의 구름 문제와 지형의 자글거림 문제는 아예 해결되었어.” [대화] 해당 문제는 사용자 KEEP/해결 처리. 남은 요청은 지도 영역의 어두운 사각 경계다. 전체 구름 제작 피드백2를 자동 완료 처리하지 않는다.

## 원인·변경
경계에 인위적 명도 상수를 더하기 전에 shading contract를 정합했다.
1. globe의 macro edge 폭 .12, parent .18 → .12 통일. 두 표면 모두 macro/broad 가중치로 cloud tint를 억제하고 남은 global cloud .60 적용(parent 기존 .15 제거).
2. 광역 parent는 높이0→DEM morph 중에도 완성 DEM normal을 사용하던 문제. sphereNormal 속성 추가하고 parentAmount×edge와 함께 구면→지형 법선 연속 보간. 경계는 구면 normal로 복귀.
3. parent Standard roughness.87과 globe Physical roughnessMap/specular.16 차이. parent도 Physical/specular.16, global packed G의 roughness clamp.32–.95로 일치.
4. globe의 flat map 구간 packed bump를 macro footprint 안에서 부드럽게 줄여 실제 높이 지형 normal과 중복하지 않게 함. 외곽 bump는 유지.
태양 밝기·구름 shell·near/far·높이1.5×·region LOD 데이터는 그대로다. parent material 광학은 변경되므로 주변 coarse 지형 반사는 검토 대상이다. parent night emission 정합은 이번 낮 구도 범위 밖이며 야간 경로 재설계 시 재검토.

## 실제 검증
IAB에서 p.10 수평선/.15 광역 시작/.18 북유럽/.294 능선 native PNG+JSON 저장. 광역 시작의 기존 직선 사각 명도 경계가 사라진 것을 관찰; 북유럽 확대에서도 같은 면으로 이어짐. 능선 detailReveal=1/coarseReady64/heightGain1.5/terrain errors[] 확인. console error0, build65modules PASS. records 결과는 WORKLOG.
증거: verification/a-cloud-sculpt-20261006/native-captures/north-seam/manifest.json.
이전 비교: verification/a-cloud-sculpt-20261006/native-captures/north-surface/north-0-15.png.
새 비교: verification/a-cloud-sculpt-20261006/native-captures/north-seam/north-0-15.png.
연속 전체영상/GPU timing/targetPC/600초 미검증. 원래 남아 있던 근접 원거리 horizon geometry 품질은 이번 어두운 사각 지도 경계와 별도이다.

## 다음
사용자가 실제 스크롤에서 경계 확인 → 해당 수정 KEEP/TUNE → 승인 VDB 지역 광학·구름 통과/같은서고 연결 이어감. A-P3/Story/BC는 단계 분리 유지.
