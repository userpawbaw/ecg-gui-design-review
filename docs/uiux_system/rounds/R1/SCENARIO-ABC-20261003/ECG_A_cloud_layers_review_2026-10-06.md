# A-P2 두꺼운·얇은 구름 실제 제작 시험 — 2026-10-06

연결: D-074 / F-045 / O-010 / CASE-007. 시작 기준 08468ef824bd52a394c718c6d1bb046aed42683e.

## 1. 결과와 현재 화면

**기술 동작 PASS / 목표 시각 품질 FAIL / 후보 TUNE / 기본 채택 REJECT.**

- [기존 기본 화면](http://127.0.0.1:4198/): 이전 v1 cloud/camera 경로 유지. 기존 A-P2 자체의 TUNE는 해소됐다고 하지 않는다.
- [새 다층 구름 시험](http://127.0.0.1:4198/?cloudModel=layers): 조형 density·thick/thin·광학/그림자·카메라 수정 후보. 완성된 제품이나 목표 목업 수준의 결과가 아니다.
- [이전 연구](ECG_A_cloud_layers_research_2026-10-06.md): 설계 제안과 실제 적용의 차이를 아래에서 구분.

사용자 요청은 두꺼운 구름의 불투명한 중심/양감/아래 그림자와 얇은 구름의 투과/솜털이다. 단순 층 추가보다 형태·빛·단위·카메라를 함께 바꾸는 시험을 진행했다. 내부 미완 배경의 평가를 사용자에게 요구하지 않았다. 승인된 서고 빛/소품(D-068), ECG 저장 데이터와 비교 패널은 변경하지 않았다.

## 2. 실제 제작된 자산과 렌더러

### 자산

`prepare-cloud-layers.py`가 직접 만든 합성 자산이다. Blender 제작, 실제 기상 자료, Nubis 에셋이 아니다.

| 자산 | 구성 | 크기/역할 |
|---|---|---|
| billow-density.r8 | 비대칭 타원체8개를 합친 낮은 바닥·높은 융기·군집 틈 | 128³ R8, 2MiB, 국소 조형 밀도 |
| shape-erosion.rgba8 | value/Worley macro, 미세 Worley, 중간 Worley, flow value | 64³ RGBA8, 1MiB, 형태/침식/방향성 역할 분리 |

각 raw 파일의 생성 script·bytes·SHA256·CC0와 test-only 상태를 assets/registry.json 및 자산 manifest에 기록했다. Perlin-like는 value noise이며 실제 gradient Perlin이라 주장하지 않는다. 생성 hash2건 확인 PASS. sphere geometry에 흰 재질을 씌운 GLB가 아니라 실제 3D texture를 raymarch한다.

### 광역/국소 밀도와 단위

- radius1=6360km. 광역 thick 고도 약1.4–8.8km, thin 약7.6–11.1km. REMA 표시 지형5x 위로 global층의 기준 고도를 이동한다. 이는 실제 기상 고도 검증이 아니다.
- thick은 NASA coverage·중간 조형·가변 윗면·침식·높이 profile을 갖는다. thin은 별도의 늘어진 좌표/flow field와 낮은 밀도를 쓴다. 단순 동일 이미지 alpha복제가 아니다.
- 국소 군집 범위 약50.88×10.176×50.88km. 정해진 radial/tangent 좌표에 고정되고 같은 앵커를 사용한다. 광역→국소 footprint/mix는 연속이지만 **형태 동일성이나 완성된 다중 LOD 시스템은 미달**이다.
- 새 카메라는 로그 고도 하강→국소 접근. Earth near를 고도에 따라 .000003–.02로 조절하고 far12를 사용한다. 기본 v1 camera는 기존값을 유지한다. archive는 near.025/far40/Y-up 복구.

### 빛·그림자·후처리

- view72 samples + secondary light6 samples; optical depth로 front-to-back radiance/투과 적분.
- HG 두 lobe, 제한된 다중산란 근사, 하늘광·지표 반사광·태양광을 구분. 국소 모양과 광역 밀도를 같은 태양 방향으로 검사.
- 지표 shader의 8tap sun raymarch가 같은 밀도를 사용한다. 이전 coverage-offset 그림자는 새 후보에서 제거한다. **sun-space Beer shadow map/bake는 미구현**이며 비용 개선 후보다.
- 실제 Earth+terrain geometry의 별도 depth target으로 구름을 지표 뒤에 그리지 않도록 한다. half-res HDR와 투과 차이를 이용한 5tap 공간 재구성.
- 시간 jitter/누적 없음. **STBN, reprojection, history rejection, Cycles 기준 렌더는 미구현.** 거리별 청색 tint는 예술적 근사이며 cloud가 물리 대기 LUT에 정확히 통합된 것은 아니다.
- 최고 cloud 가림에서 편집용 균일 산란색으로 컷을 봉합한다. 이 순간을 구름 형태/양감 증거로 사용하지 않는다.

## 3. initial + 세 차례 자체 보완

`25_EFFECT_PRODUCTION_PIPELINE.md` §6 G6을 적용했다. 이 후보에서 추가 스타일 반복을 자동으로 계속하지 않는다. 이전 trial/실패 프레임을 덮지 않았다.

| 회차 | 바꾼 것 | 프레임 판정 |
|---|---|---|
| initial | 조형128³/독립noise/thick-thin/scene-depth/지표 그림자 | 큰 흰 막·동심 alias, 지구가 어두움. FAIL |
| 깊이 기능 복구 | 너무 작은 고정 near를 adaptive로 변경, RT texture 실제 연결, ground shader program key 구분 | 동심 artifact 감소. 여전히 과도한 coverage와 평면성. 품질 회차와 별도 |
| tune1 | 가변 top·coverage/침식, extinction/산란 정리, 구형 offset shadow 제거 | 지표/바다를 볼 틈이 생김. 먼 cloud는 유용하나 근접 조형 부족 |
| tune2 | log 하강, 진입 pitch, 국소 군집 위치 | 실제 군집에 접근하나 중심이 매끈한 덩어리로 보임 |
| tune3 | 중간/미세 침식·짧은 light sampling·하늘광/다중산란 대비·시야각 | 실루엣과 일부 하부 음영 변화. 목업의 솜 같은 다중 융기/양감 미달 |
| 최종 기능 복구 | 완전 가림 컷의 검은 빈틈 제거; 실패 후보 opt-in 분리 | 접합 동작 PASS. 이는 품질 향상 확정이 아님 |

각 중간 회차의 프레임과 state는 보존했으나 중간 TS 파일 전체의 별도 snapshot은 없다. 최종 소스 hash는 cloud-layers-review-metrics.json에 보존한다.

## 4. 사용자 요구별 대조

| 요구 | 확인된 것 | 남은 GAP / 판정 |
|---|---|---|
| thick 불투명·부피 | 3D density와 광학적 core, 위치별 윗면/실루엣 | 내부 큰 평활 영역, 융기/솜털 부족. **TUNE** |
| 아래 그림자 | 동일 field sunmarch의 on/off 차이 확인 | 자가 음영 대비·지표의 일관된 투영/분리감 미달. 실제 raymarch 존재가 양감 PASS는 아님 |
| thin 투과·솜털 | 별도 field, 얇은 띠 아래의 바다 보임 | 강한 thick 앞에서는 thin 기여가 희박. 섬세한 섬유 texture 미달 |
| 궤도 시차/수평선 | 고도 하강과 청색 horizon, 국소 접근 | 근접 cloud가 너무 일찍 큰 화면 영역을 차지하고 고급 구도/연속성 미달 |
| 빛/후처리 | bloom-off/그림자off 진단 | bloom을 끄는 것으로 조형 부족이 해결되지 않음 |
| 기존 서고 유지 | 같은 시각/프레임/무grain whole7–11 비교 | 3장 RGB차0, 2장 최대1RGB/mean<1e-6. **KEEP 유지** |
| 부드러움/성능 | 오류 없는 정역 경로와 GPU timing | 무녹화 GPU p95 40.03ms. 기본 채택 **REJECT** |

그림자off p0 전체 mean RGB차3.94/최대111/2RGB 초과픽셀21.36%. 이는 그림자 코드의 출력 기여 확인이며 실제 물리 그림자 정확도·목업 충실도 검증이 아니다. 근접 thin on/off는 mean0.02065RGB로 작아, 층을 분리한 것만으로 사용자 요청한 풍부한 층감을 달성했다고 보지 않는다.

## 5. 실제 검증과 증거

verification/a-arrival-20261006 아래:

- cloud-layers-initial / depth-fixed / tune1–3: 실패와 보완 과정.
- cloud-layers-verified: 최종 전이/전체/접합31frame, errors0.
- cloud-layers-final-diagnostics: 22frame, thick-only/thin-only/그림자off/bloomoff/구름off, errors0.
- cloud-layers-runtime: 17frame, R경계3건 sample/heart onset, scroll정지 재생, native scroll, reduced motion PASS/errors0. 저장 S022·250Hz·mixed0dB·2.5초/shared clock 유지.
- cloud-layers-states: off/idle12/reduced2 등38frame + reverse8sec/decoded12, errors0.
- cloud-layers-motion: forward8sec/decoded12 + 같은 무녹화 경로 timing.
- cloud-layers-default-retained: 기본v1/서고7frame, errors0. 기본 p0는 이전 planet-verified와 RGB 완전 동일.
- cloud-layers-fresh: 재시작한 Chromium3frame/errors0. RTX3070 ANGLE/D3D11 확인. 콘솔은 기존 PCFSoftShadowMap→PCF fallback 경고만 있음. 이전 세션 누적 RTclone warning을 새 렌더 오류라 하지 않는다.
- cloud-layers-review-metrics.json: 최종 source/asset hashes, 서고와 effect RGB차.

최종 Vite build PASS(55modules, main JS1.022MB), 신규 패키지 없음. large chunk 경고는 유지. records/diff 검증은 종료 checkpoint에서 기록한다.

로컬 Chromium1920×1080 DPR1 RTX3070 **무녹화 GPU83queries p50 33.01/p95 40.03ms**. 이전9.23/18.49ms와 비용 회귀. RAF p50 100.4/p95 101.1ms이며 이번 자동 브라우저의 scheduling/pacing 원인은 분리 검증하지 않았다. 이를 목표 PC의 실제10fps 증거로 확대하지 않는다. 녹화 GPU24.82/33.90ms는 부하/샘플 분포가 다르므로 채택 수치로 쓰지 않는다. 목표PC·600sec·장시간·전체 파형 DOM 포함 영상 검증은 미실행. 영상은3D canvas만 포함한다.

[목업/이전/시험 나란히 비교](../../../../../../../outputs/A_cloud_layers_review/reference-before-trial.jpg)는 저장소 밖의 비교 자료다. 링크가 다른 checkout에서 깨질 수 있으며 파일 절대경로는 현재 채팅에서 제공한다. 생성 목업은 실제 renderer 성공의 증거가 아니다.

## 6. 다음 후보 제안 — 구현 아직 미실행

현재 renderer를 다시 임계값만 바꾸는 대신 **국소 구름의 조형/빛 기준부터 새로 고정하는 후보**를 권장한다. 현재 후보와 기본 장면을 보존한다. G6 이후의 새 후보 선택은 사용자 판단 단계다.

1. Blender에서 넓은 하나의 shelf 대신 큰군집/작은tower/별도 얇은 띠를 제작. 평평한 하부와 비대칭 둥근 융기를 나누며, 실제 굴곡이 카메라에 보이는 **측면3/4 시점**을 사용한다.
2. 대표 프레임6장: 광역 아래 구름/궤도 위→옆면/큰 군집 상단·그림자/틈 진입/불투명core 직전/짧은 가림컷. 고도·태양·카메라를 먼저 잠근다. Cycles의 동일 조건 기준 렌더와 bloom-off를 내부 비교한다.
3. 조형 밀도+광학 깊이/light bake를 내보내고 browser volume과 비교. 얇은 층은 고층 별도 field와 stretched mask로 만든다. 무광 불투명GLB 덩어리로 대체하지 않는다.
4. 광역은 low-cost coverage/profile, 근접은 조형 asset. 지표 Beer shadow map/light-space cache와 실제 길이 기반 empty-space skipping/적응 step으로 비용을 줄인다. 현재 수치로 새로운 p95 목표 달성을 약속하지 않는다.
5. 근접 양감이 기준 렌더와 맞은 뒤 temporal reconstruction과 전체 역스크롤/GPU를 비교한다. archive/파형 clock regression을 마지막에 확인하고 사용자에게 전체 완성 장면을 제시한다.

A-P3 처리→출력/의자 인계, Story의 전원·호흡·근육, B/C는 기존 독립 계획으로 남아 있다. 이번 구름 시험의 결과와 섞어 완료 처리하지 않는다.

종료 게이트: records160 PASS / build PASS / diff-check PASS. 원격 저장은 commit/push 후 HEAD/readback으로 별도 확인.
