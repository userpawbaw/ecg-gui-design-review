# D119 — 색 인계·FOV 보완과 구름 양 후보

## 범위와 근거
사용자의 구름 증량 확인 후 진행 승인. D117/D118 S1 잔여는 유지하며 S2의 양 파라미터만 별도 시험한다. S1 전체 통과 또는 국소 구름 양감 완료를 주장하지 않는다. source: cloud-orbital.ts shader, cloud-lab.ts composer mounting, terrain-parent.ts parent morph/color contracts, arrival-north.ts & cloud-handoff.ts keyframes.

## 변경과 검토 기준
- 기존 parent 색은 geometry 등장 진행률과 별개로 즉시 macro/broad에 바뀐다. matched opt-in만 색 혼합을 parentAmount에 연결하고 외곽 혼합 폭 .12→.22를 대조한다. 기본 main PBR은 기존값 유지. 최종 해상도·색 차이 완전 제거는 별도 남은 gate다.
- p<.18 진단 camera FOV36/near altitude*.025를 .18 handoff와 맞춘다. 위치/target의 .18 keyframe은 두 경로 동일. 전체 정역 움직임은 영상으로 별도 확인한다.
- 원경 구름의 coverageBoost 0/.07/.14는 밀도 표시 threshold의 offset이다. 실제 구름 점유율 퍼센트나 물리 밀도가 아니다. 두 spherical layers/같은 source UV·해상도·광량·고도 유지. 원본 바깥 군집 추가나 실제 volume 생성이 아니다.
- 두 구도 .18/.235, 세 양 후보. 카메라/태양/DEM/텍스처 배치를 고정하고 GPU compositor sample·ready/error·실제 캡처 확인. 변화는 군집 주변 결 확장으로 읽히며 빈틈이 남아야 한다. 흰 막/균일 분포/새 aliasing이면 TUNE.
- 기존 근경 그림자 조사 보류, 구름 실패 횟수·fallback, 승인 서고 보존.


## 결과
verification/a-cloud-amount-20261009/gallery.html 및 manifest. 6구름 양 +4초기 색 인계 캡처 동일 조건 assert PASS, ready/context/terrain errors 검사 PASS. GPU는 각 60/80개 단기 composer 표본으로 범위 변동이 있으며 속도 증가/감소 인과 판단에는 부족하다. 8초 영상은 자동 카메라 .10→.235→.10, 실제 휠 영상 아니다. 시각 TUNE: 군집 주변 결 확장과 초기 색 인계 완화 관찰; 큰 근경 volume/전체 seam 제거 미완. 최종 Vite82 modules build PASS.
