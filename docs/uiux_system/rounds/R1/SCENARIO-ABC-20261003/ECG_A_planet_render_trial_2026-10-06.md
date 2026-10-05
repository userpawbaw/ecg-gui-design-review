# A-P2 대기·남극 지형·밀도 구름 통합 시험

2026-10-06 · D-071 후속 시험 / D-072·F-043·O-009 · CASE-007

## 1. 판정과 공개 범위

**기술 연결은 검증했으나, 목업 품질 도달은 FAIL / 전체 후보 TUNE.** 새 표현 구조가 생긴 것과 원하는 시각 완성도를 충족한 것은 구별한다. 기본 [4198](http://127.0.0.1:4198/)은 새 시험, `?planet=legacy`는 이전 렌더 비교용이다. 제품 배포나 전체 채택이 아니다.

| 파트 | 실제 변경 | 자체 판정 / 남은 차이 |
|---|---|---|
| 대기·궤도 | additive Fresnel 구면 제거, Takram/Bruneton LUT sky+aerial perspective, radius1→6360km 좌표 변환, 지표 기준 camera up, 낮은 접선 시야 | 파란 수평선 방향 KEEP 후보. 목업의 넓은 청색 층·따뜻한 역광·풍부한 지표 구도는 TUNE. sky radiance RGB(1.1,2.2,5.0)는 연출값이며 물리 정확성 주장이 아니다. |
| 남극 | REMA 실제 고도 격자, 남위60도 이하 별도99,009정점 cap, 표시 높이5배, dielectric roughness/반사 분리 | 사진 bump 이상의 실제 높이는 있음. 목업처럼 정교한 얼음 미세 반사·실루엣은 GAP. cloud-off에서는 cap 경계 흔적과 극점 부근 음영/표면 결함도 남는다. 극점 미측정 구간은 표시용 ring 평균 약2666.6m로 보간; source grid는 수정하지 않음. |
| 구름 | alpha 구면 제거, NASA coverage+64³ synthetic density, world ray, bounded shell/진입 bank, 56 view×5 light march, Beer 감쇠/HG 근사, 절반 가로·세로 해상도 합성 | 궤도 시차/자기 그림자 경로는 있음. 원거리 알갱이/림 샘플링, 근접의 균일 안개 같은 모습은 GAP. 목업의 조형적인 fluffy cloud에는 못 미침. |
| 유리막 | ocean specular 기여22%로 억제, 독립 alpha shell 제거 | 과한 넓은 highlight 감소. 구형 물체 전체의 광택 인상은 여전히 비교 필요. no-specular 진단이 지각적 원인 전체를 증명하지는 않음. |
| 구름→서고 | 가까운 world-space bank에서 전체 가림 후 같은 고창으로 연결 | p.32 가림 확인. 밝고 풍부한 구름 틈 속 건축 reveal은 GAP. 현행은 여전히 가림편집이며 실제 지리적 연속 이동이 아님. |
| 서고 | 승인된 방·소품·빛·camera 경로 재사용 | 비교5프레임 중3장은 RGB차0,2장은 극미량1/255 차이. 사용자 D-068 KEEP 유지. |

심장/R 피크의 독립 시간축, 저장 mixed0dB replay 및 ECG sweep는 유지한다. A-P3 출력 처리·의자인계, A-P4 Story, B/C는 이 시험과 섞지 않는다.

## 2. 자산과 구현 경로

1. `@takram/three-atmosphere@0.19.1` + `postprocessing@6.39.5`의 실제 Three0.186.1 호환을 확인. 6.39.1은 peer 범위를 벗어나 제외; force 설치 없음. 기존 Three composer에 bridge를 추가하고 atmosphere sunlight/skylight는 꺼 surface PBR 중복 조명을 피했다.
2. 3 EXR LUT와 REMA1km 원본87,506,317B 획득. source/processed hash를 registry에 고정. MIT를 기존 asset 허용 목록에 명시 추가하고 원문 notice 보존. 실제 licences/credits는 `prototype/spikes/a-climb/assets/planet-v2/NOTICE.md`.
3. REMA EPSG3031을 WGS84 polar stereographic 수식으로 equirectangular cap2048×512에 bilinear resampling. 원본 최대4487.39m, 유효 격자 비율57.05%(바다와 미측정 포함). 파생 gzip2,069,044B, 3D noise262,144B. 표시 과장/극점 infill은 mesh에서만 수행하며 GIS 검증 도구로 취급하지 않는다.
4. 같은 sun direction을 surface/LUT/cloud에 전달. 구름의 표면 그림자는 기존 coverage offset 근사이고, cloud 내부는 lightmarch다. 지형 cast/receive flag만으로 실제 태양 shadow-map 구현이 완료됐다고 주장하지 않는다.
5. 구름은 반해상도 radiance/transmittance를 계산한 후 원본 scene color와 합성한다. 지표·서고 전체를 저해상도로 줄이지 않는다. 서고 구간에서는 cloud/atmosphere pass를 비활성화하고 camera up을 기존 Y축으로 복귀한다.

Snow014는 두 차례 connect timeout으로 미획득/제외. 이번 구현을 외부 snow PBR 적용 결과라고 부르지 않는다. 라이브러리 설치 시 기존 Vite/esbuild 의존 취약점2개가 표시됐으며, 이 범위에서 자동 업그레이드하지 않았다. 로컬 loopback preview 검증이며 배포 승인은 별도다.

## 3. 자기 검토와 수정 이력

`25_IMPLEMENTATION_PIPELINE.md` §6 G6의 **initial+최대3회 품질 수정**을 적용한다. 남은 시각 GAP를 숨기고 자동으로 추가 스타일 라운드를 반복하지 않는다.

| 회차 | 확인한 문제 | 변경 / 증거 |
|---|---|---|
| Q1 내부 분리 시험 | 낮은 orbit에서 태양 방향·수평선 정렬 부적절 | `q1-atmosphere`:31장. LUT 작동 확인용이며 최종 품질 증거가 아님 |
| initial | 과도한 구름 높이/덩어리·카메라 기울기 | `planet-initial`:31장. thick shell은 REJECT |
| tune1 | 구름층을 얇게 했지만 림 줄무늬·약한 청색 | `planet-tune1`:31장. 지표 기준 up/층 두께 수정 |
| tune2 | cap 전체가 밝아지는 원형 경계, half-res 합성 오류 | `planet-tune2` FAIL / `planet-tune2-fixed` 기능복구. sky radiance/국소 ice, 반해상도 구현. ShaderPass API/RT clone 결함 수정은 새 디자인 후보가 아님 |
| tune3 | 얼음 mask·서고에 남는 cloud, 완전 가림 부족 | `planet-final` / `planet-final-join`. ice height mask, pass 종료, world bank |
| 결함 복구 | cap 경계 재질 불일치·극점 data gap ring, 과거 콘솔 오류 오염 | globe와 공통 roughness/shadow/specular, 극점 표시 보간, QA session 초기화. `planet-verified`가 최종. 품질 방향의 4번째 수정으로 확장하지 않음 |

최종 후속 권장: **근접 구름의 국소 고품질 에셋/빛 bake 또는 검증된 별도 cloud renderer 후보를 비교**한다. 광역 shell에 sample/밝기만 더하는 것보다 덩어리 외곽·빈 공간·광원 가림을 통제할 수 있어야 한다. orbit에서는 해상도/LOD와 조명 구도, 남극에서는 국소 normal/roughness/detail patch가 별도 보완 항목이다. 새 후보 라운드는 해당 GAP에 대한 사용자 피드백 뒤 결정한다. 이 결과만으로 A-P3를 통과시키지 않는다.

## 4. 검증 증거

- 전체/진입/접합31프레임: `verification/a-arrival-20261006/planet-verified/review.json`.
- 동일 model 내 atmosphere/specular/cloud/bloom off30프레임: `planet-diagnostics-final/review.json`. 이전 legacy와 새 모델은 camera가 다르므로 전체 pixel fidelity 비교 대상이 아니다.
- 38 최종 효과off/idle12/reduced2 상태와8초 역방향/12 decoded: `planet-final-states/review.json`.
- runtime17캡처,3 R boundaries, 정지 replay/native scroll/reduced motion: `planet-runtime-final/runtime_review.json`.
- 로컬 RTX3070 Chromium1920×1080 DPR1: 8초 전체 경로 GPU p50 **9.23ms**, p95 **18.49ms**,490queries / RAF p95 **16.8ms**. 이전22.57ms보다 p95 감소, p50은8.02→9.23으로 증가. `planet-motion-final/motion.json`. 이전 cap복구 전 시험은9.22/17.36ms로 보존한다. 전시PC·600초 검증 미실행.
- 8초3D canvas VP9와12 decoded frame: `planet-motion-final/`. DOM/ECG를 포함한 영상이 아니므로 파형 동기화는 runtime 별도 증거.
- 최종 진단에서 legacy p0 specular-off는 전체 평균RGB차5.25, 새 후보1.02. 광택 기여 감소의 증거이며 사람의 유리막 지각 측정이 아니다. 최종 숫자는 `planet-look-metrics.json`을 우선한다.
- 서고5 frame 중3장 byte RGB 동일/2장 최대1 RGB 차이·파생 자산5hash 일치. 기준은 기존 `lighting-final3`이며 source 자체 고품질을 자동 판정하지 않는다.
- 개념 목업/이전/새 결과 비교 이미지: 저장소 밖 `outputs/A_planet_review/reference-before-after.jpg`. 직접 캡처한 레퍼런스 사이트가 아니라 기존 개념 이미지다. G4 p5/p50/p95·채도·난색 결과는 `planet-look-metrics.json`; 다른 camera 구성의 설명용 수치다.
- 겹친 QA browser 두 실행은 `planet-diagnostics`/`planet-runtime`에 INVALID 표시. 단독 재실행 결과만 확정 증거. 실패 캡처/개념 대비 GAP는 보존.

Build/records/diff 결과는 WORKLOG의 최종 checkpoint를 따른다. 기술 PASS를 시각 품질 PASS로 확대하지 않는다.
