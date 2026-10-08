# A 궤도 구름 — 위성 분포 원경 proxy 시험

D114 / F080 / CASE-007 · 2026-10-08 시작, 2026-10-09 KST 캡처 완료

## 1. 이번 승인과 범위
사용자 “음 한번 진행해보자.”에 따라 D113 추천 순서의 첫 gate를 실제 구현했다. 북유럽 광역 p.18과 지역 확대 p.235에서 위성 형태 분포/국소 명암을 비교한다. 근경 커튼·서고까지 전체 성공이나 최종 채택을 의미하지 않는다. 기존 근경 그림자 조사 보류는 유지한다.

## 2. 결과와 자체 피드백
**TUNE.** D112의 세 타원 envelope는 새 후보에서 사용하지 않는다. 위성 사진 기반의 끊어진 띠·군집과 여백이 나타난다. 그러나 2K 원본을 확대하면 부드럽게 뭉개진 얼룩이 되고, 국소 명암 차이도 약하다. 사용자가 요구한 궤도 사진의 선명한 군집·낮은 부피·같은 방향의 그림자 수준에는 아직 미달이다. 이번 시험을 고품질 구름 완성으로 보고하지 않는다.

첫 직접 지리 좌표 투영은 북유럽을 넓은 밝은 층으로 덮었다. 과한 radiance와 후처리 노출을 낮추고 얇은 층의 기여를 줄였다. 이후 위성 전선의 다른 부분을 고정 재배치하여 빈 공간과 군집을 선택했다. 첫 native 4장은 takram-orbital-20261008에 보존한다. 이 재배치는 **연출용 형태 차용**이며 실제 북유럽 날씨가 아니다. 초기 실패는 기록에서 지우지 않는다.

## 3. 자료와 제작법
- NASA cloud_combined_2048.jpg, 2048×1024, 829367bytes. registry nasa-clouds-2048 원본 복구 후 SHA256 daddaad84d7a33bbbc86cdda3f591099f57cee8607b7bcf3b67eb7e4f7a1c793 대조 PASS.
- 원본 URL: https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg
- 추적 가능한 바이트 동일 복사: assets/research/cloud-reference-20261008/nasa-cloud-only-2048.jpg + .provenance.json.
- 기존 Visible Earth 페이지는 현재 일반 Earth Observatory 페이지로 redirect. 연구 보고서의 고해상도 제공 설명은 과거 페이지/검색 자료 기준이다. 현재 고해상도 파일은 확보하지 않았다. 한 번 추정한 21600 TIFF URL은404였으므로 획득했다고 표시하지 않는다.
- 고정 source transform: geographic UV anchor(.523333333,.842388889), source centre(.64,.78), scale2. 스크롤에 따라 분포가 재생성되지 않는다.
- 반경6371km 로컬 지구 구면, 두 cloud proxy 높이8.5km/12.5km, 지역 좌표→ECEF 회전 기반 UV. Takram WGS84 대기와 로컬 구면 모델 차이는 보존된 근사이며 장거리 정밀 정합 증거가 아니다.
- 얇은층 alpha 상한.06, 두꺼운 선택군집.94. finite difference 경사 명암, mipmap/linear/anisotropy8. 실제 고도·밀도·다중 산란을 복원한 것이 아니다. Lambert 계열 법선 명암만으로 근경 구름을 완성할 수 없다.
- terrain albedo → Takram aerial perspective → 별도 orbital proxy radiance 합성 → AGX → SMAA → dither. 구름 radiance는 기존 terrain 광학 후 합성해 이중 Lambert 조명을 피한다.
- opt-in orbital=1에서만 별도효과. 기존 handoff/기본main/ECG/서고/Story는 채택/교체하지 않았다. 궤도 후보의 구름은 두 높이의2.5D 표현이며 근접 통과 가능한3Dvolume가 아니다.

## 4. 동일 구도와 검증
| 구도 | 카메라 km | target km | 비교 |
|---|---|---|---|
| 북유럽 광역 p.18 | (220,820,650) | (0,0,0) | 이전 D112 / 위성 평면 / 위성 국소 명암 |
| 지역 확대 p.235 | (55,100,150) | (0,1.8,0) | 동일 세 후보 |

동일 DEM1.5×, 고정 태양 고도15°/방위0° 조건. 새 native4PNG/JSON, 실제wheel 정방향 p.2136/역방향 p.1968 정착2PNG/JSON. RTX3070,942×672, contextLost=false, cloudPassAttached=false, runtime error 로그없음. 단순 proxy 경로에는 Takram volume TAA를 적용하지 않으며 SMAA는 켜져 있다.

새 고정 프레임 composer GPU query p50 약3.76–5.33ms, p95 약7.28–10.48ms. **FPS/장시간 안정성/전체 통합 비용 보장이 아니다.** 기존 cloudy renderer, 사용하지 않는 연구 자원 로딩까지 포함한 lab 구조를 최종 성능 최적화로 취급하지 않는다.

검토 페이지: verification/a-orbital-cloud-20261009/gallery.html
증거 manifest: verification/a-orbital-cloud-20261009/manifest.json
최종 native: verification/a-cloud-sculpt-20261006/native-captures/takram-orbital-final-20261009/

## 5. 다음 진행 순서 — 분리 유지
1. **원경 분포 gate:** 이번 실제 두 구도를 사용자와 검토. 타원 제거 성공을 질감 완성으로 확대하지 않는다.
2. **자료/질감 보완:** 접근 가능한 고해상도 cloud-only 또는 더 상세한 지역 coverage 자료/에셋 확보를 먼저 한다. 같은 자료의 필요한 crop만 GPU에 올리며, 2K를 단순 업스케일한 것을 새 디테일로 표시하지 않는다.
3. **국소 광학 gate:** 두꺼운 군집에 optical thickness/top height/같은 태양 방향의 local shadow를 비교한다. 이번 shader는 그 완성본이 아니다. 기존 near shadow 결함 추가 튜닝 보류와 구별한다.
4. **인계 gate:** 채택된 C/tau/H와 근경 Takramvolume를 같은 footprint로 정합해 정역스크롤 밝기/형태/갑작스러운 등장 검토.
5. **서고 gate:** 가림 검증 이후 승인된 서고 구도 연결. 이번에는 B/C·Story·파형을 수정하지 않는다.

자동검증 PASS는 사용자 룩 KEEP를 대신하지 않는다. 전체구름제작의 기존피드백2/2 실패 및 fallback 조건(D080/D082)은 과거상태로 보존하며, 이번 내부시험을 새 사용자피드백으로 세지 않는다.

검증 마감: spike Vite build81 modules PASS, records:check248 PASS, diff --check PASS. 갤러리6/6 실제이미지942×672 로딩확인,검토탭유지. 자산 원본 hash 일치와 런타임 저장/휠입력 증거는 품질KEEP/near인계완료를 의미하지 않는다.
