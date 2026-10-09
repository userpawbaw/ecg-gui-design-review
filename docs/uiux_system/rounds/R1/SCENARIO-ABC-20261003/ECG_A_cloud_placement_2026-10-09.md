# D120 — 확대 목표 지형 근처에 기존 구름군 배치

사용자 피드백: 구름이 좀 더 확대되는 곳 근처에 있으면 좋겠음. 구름 양과 독립적으로 source UV 배치만 조절한다. D119 양 후보/기본 source/지형/태양/카메라를 보존, 현행과 접근 지형 근처 고정 배치 2개를 .18/.235 같은 구도로 대조한다.

global R8 원본에서 기존 anchor(.64,.78) 가까이 국소13×13 평균 density .58~.82인 군집을 검색한 seed centre(.671875,.8330078125)를 후보로 사용한다. 이는 물리 density 측정이나 현재 북유럽 날씨가 아니라 같은 원본 내 연출 배치다. 원본/crop은 그대로이며 새 구름/층/volume 생성 없음. 양은 동일 .07로 비교하고 위치는 스크롤에 따라 생성/이동하지 않는다.

통과: 확대 대상 근처 구름이 읽히며 산맥과 빈 공간을 전부 덮지 않는다. 광역과 확대의 geographic anchor는 동일하고 footprint 점프가 없다. 아직 orbital 2.5D proxy라 실제 Takram 근경 인계·커튼·지면 그림자는 별도 gate. S1 최종 seam/near shadow 보류 유지. 새 구름 밴드가 원경에 나타나는 변화는 연출 후보이며 사용자 최종 채택 전이다.


## 실제 결과
4캡처/manifest verification/a-cloud-placement-20261009/manifest.json. 1280×720 camera/sun/source/coverage 조건 대조 PASS. 실제 광역 산맥 주변 및 확대 능선 위/옆에 구름 표시. 위치는 개선 후보이나 근경 납작한 질감 TUNE. volume/실시간 정역 품질/전체 지형 seam은 미완. renderer 오류 관찰 없음, Vite82 modules PASS. 성능은 단기 compositor GPU 표본이며 전체 FPS/장치 보장 아님.
