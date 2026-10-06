# A-P2 구름 제작·빛·후처리 재조사

2026-10-06 · 사용자 두꺼운/얇은 구름 혼합 피드백 · D-073/F-044 · CASE-007

**이번은 자료·코드 조사와 다음 시험 설계다. 새 에셋 생성·패키지 설치·renderer 수정은 하지 않았다.** 기존 4198과 승인 서고 KEEP를 유지한다. 이전 자체수정 라운드는 D-072에서 종료했고, 이번 피드백으로 다음 구름 라운드의 목표가 구체화됐다.

## 1. 해석: 층 수보다 각 층의 역할을 분리한다

사용자가 원하는 대비는 다음과 같다.

| 시각 역할 | 형태 제작 | 빛과 투과 | 화면에서 읽혀야 할 것 |
|---|---|---|---|
| 두꺼운 주 구름 | 크기가 다른 둥근 융기·불규칙 군집, 넓은 하부, 큰 빈 공간. 작은 noise로 전체를 채우지 않음 | 중심은 불투명에 가깝고 가장자리는 부드러움. 내부 self-shadow, 아래/옆 구름과 지표에 투영 그림자. 밝은 윗면과 어두운 하부 | 덩어리의 높이·양감·군집 사이 거리 |
| 얇은 보조 구름 | 넓게 늘어진 섬유·찢긴 띠·솜털 가장자리. 두꺼운 구름을 낮은 opacity로 복제하지 않음 | 아래 지표와 주 구름이 비침. 낮은 optical thickness, 약한 그림자, 태양 방향에서 제한된 밝은 가장자리 | 투명한 얇은 층이 두꺼운 층과 다른 높이에 존재함 |
| 진입 구름 | 주 구름 중 특정 군집을 가까이서 통과. 전경·중경 덩어리와 통로를 직접 배치 | 윗면/측면/하부의 빛 대비, 통과 중 투과 거리 변화 | 멀리 보였던 구름을 실제로 지나감. 서고 전환 직전에만 완전 가림 |

‘얇음’은 여기서 시각·광학 역할이다. 모든 얇은 구름을 실제 권운으로 분류하거나 기상 데이터를 재현한다고 주장하지 않는다. 추천 출발 구성은 **낮은 주 볼륨층 + 상부의 성긴 덩어리층 + 높은 얇은 섬유층**이다. 위아래 전 층을 빽빽하게 채우는 것은 피한다.

## 2. 현재 구현에서 먼저 고칠 원인 — 코드로 확인

현재 `planet-clouds.ts`/`prepare-planet-v2.py`:

1. 64³ value FBM 하나를 두 주파수로 재사용한다. 큰 형태/작은 erosion/방향성 얇은 질감의 역할이 분리되지 않았다. 이 구성만 늘리면 알갱이 또는 같은 무늬의 반복이 되기 쉽다[추론].
2. 진입 bank는 `(.4 + noise*.6)`이므로 외곽 mask 안에서 양의 밀도가 지속된다. 큰 빈 공간이 사라지고 광학적으로 두꺼운 안개가 될 수 있다[코드·추론]. shell과 bank를 `max`로 합쳐 bank가 형태를 지배한다.
3. coverage를 진행률에 따라 .86으로 평준화한다. 원래 군집과 빈 공간을 보존하기보다 화면을 채운다. `seal`도 마지막에 transmittance를 강제로0으로 만든다. 전환 가림과 실제 구름의 조형을 따로 설계해야 한다.
4. 지구 radius1→6360km 기준에서 shell thickness .0055는 약35km, bank radius .08은 약509km다. 기존은 연출 스케일이지만, 저궤도 카메라가 통과할 구름으로는 매우 넓다. **세계 단위·고도·폭을 먼저 재정의**한다. 숫자 자체가 모든 평면감의 단독 원인이라는 실험 증거는 아직 없다.
5. 단일 HG g=.45, 고정 ambient RGB, 단순5 light samples를 사용한다. cloud 내부 self-shadow는 있으나 다중산란/방향별 skylight는 부족하고, 지표 그림자는 coverage offset 근사다. 하부를 검게 칠하는 것과 실제 빛의 가림은 다르다.
6. 반해상도 결과를 bilinear 확대하며 temporal reconstruction이 없다. MSAA는 이 screen-space volume의 입자를 해결하지 못한다. 현재 main은 ground에 대기 패스를 적용한 뒤 custom cloud를 합성하므로 cloud 자체의 거리별 대기 처리가 별도 필요하다.

7. 카메라 near=.025도 지구 구간에서는 약159km다. orbit 낮은 고도에서 지표가 이 거리보다 가까워질 수 있어 불투명 geometry가 잘리는 위험이 있다[코드·추론]. sphere raymarch는 별도로 계산하므로 두 경로의 가림이 어긋날 수 있다. 실제 scene depth로 지형 가림을 검사하고 Earth의 adaptive near/far와 서고의 기존 near/far를 분리하는 시험을 L0에 포함한다. 깊이 정밀도/MSAA depth resolve도 함께 점검한다. 현재 화면 결함의 기여율은 아직 분리 측정하지 않았다.

얼음 표시5배는 최대 높이를 약22.4km로 만든다. 구름을 새로 수km 고도로 설정하면 얼음과 교차할 수 있다. globe display scale/지형 기준 높이/구름 하한을 함께 점검해야 하며, 이번 조사에서 얼음을 임의 변경하지 않는다.

## 3. 확인한 제작·렌더링 자료

### 3.1 Nubis: 멀리 보는 cloudscape와 가까이 통과하는 cloud의 차이

Guerrilla의 [Nubis Evolved(2022)](https://www.guerrilla-games.com/read/nubis-evolved)는 구름 안으로 들어가는 환경과 VFX의 비용·시간축 문제를 설명한다. [Nubis³(2023)](https://www.guerrilla-games.com/read/nubis-cubed)는 voxel 모델링, 유체 기반 형태, SDF를 통한 빈 공간 건너뛰기와 light sampling을 다룬다[제작자 설명 확인]. 이를 웹에서 그대로 복제하거나 같은 성능을 보장할 수는 없다.

**우리 적용 제안:** 광역 패턴은 NASA coverage로 연결하되, 카메라가 가까이 갈 군집은 아티스트가 모양·틈을 제어한 별도 density asset으로 만든다. 완전한 유체 시뮬레이션은 첫 시험의 필수 조건이 아니다. 단순 군집 형태를 volume으로 만든 뒤 필요한 위치만 erosion으로 보완한다. SDF는 우선 외곽/빈 공간 skip용 보조 데이터이고, density와 같은 값이라고 가정하지 않는다.

### 3.2 두꺼운데 밝게 보이는 구름: 산란과 그림자를 같이 처리

[Epic 공식 Volumetric Cloud 문서](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine)는 다중산란 근사, secondary lightmarch와 Beer shadow map의 품질/비용 차이, 구름 하부로 오는 지표 빛을 설명한다[문헌]. 불투명해 보이는 중심도 표면 재질로 바꾸는 것이 아니라 높은 optical depth로 만든다. 얇은 층도 수평선의 긴 광경로에서는 덜 투명해질 수 있어, 시점과 무관한 고정 alpha를 쓰지 않는다. 구름의 밝은 양감은 흡수·검정색 증가만으로 만들 수 없다.

**우리 적용 제안:** orbit 근접은 내부 lightmarch를 유지하고, 지표/아래층 투영에는 sun-space optical-depth map을 시험한다. 태양광·차가운 하늘광·약한 지표 반사광을 분리한다. 제한된 다중산란 근사를 on/off 비교하되, 고정 ambient를 올려 그림자를 지우는 방향으로 보정하지 않는다. 태양 뒤쪽 밝은 가장자리는 입사 방향과 optical depth로 제한해 전체 외곽 네온선을 피한다.

### 3.3 Blender는 형태 제작·품질 기준 렌더에 사용

[Mesh to Volume 공식 설명](https://docs.blender.org/manual/en/5.0/modeling/modifiers/generate/mesh_to_volume.html)은 mesh를 density grid로 바꾸고 voxel 크기를 제어하는 방법을 설명한다. [Principled Volume 설명](https://docs.blender.org/manual/en/4.4/render/shader_nodes/shader/volume_principled.html)은 density와 scattering anisotropy를 제공한다[공식 검색 인덱스 본문 확인; 직접 open은 오류]. 설치된 Blender/bpy와 버전별 API는 실제 제작 때 재확인한다.

**제작 제안:** 큰/중간 타원체 군집 또는 sculpted mesh → volume bounds/밀도화 → 중심/외곽 density profile → 주변 erosion. 낮은 평평한 바닥·비대칭 융기를 의도적으로 만든다. 얇은 층은 따로 늘어진 mask와 미세 방향성 field를 제작한다. Cycles의 같은 태양/카메라 렌더를 내부 품질 기준으로 삼는다.

Blender volume 재질을 GLB로 내보내면 브라우저에서 그대로 재현된다고 가정하지 않는다. volume은 VDB 또는 raw density/SDF로 보존하고, WebGL에서는 전용 3D texture renderer로 처리한다. 128³ R8 raw는2MiB, R16F는4MiB다(압축 전, mip/SDF/추가 채널 제외). 먼저 작은 군집으로 실제 메모리·upload·frame 비용을 측정한다.

### 3.4 Takram의 다층·그림자 API는 유용하지만 행성 전경은 별도 검증

[공식 cloud README(고정 SHA b012ad06)](https://github.com/takram-design-engineering/three-geospatial/blob/b012ad06d858fc035d88aacfd73f092f93c994e4/packages/clouds/README.md)는 최대4층, 층별 density/profile/shadow, Beer shadow와 temporal filtering을 제공한다. 하지만 **global coverage/space views는 예정 기능**, Three examples composer 직접 호환도 안 된다고 명시한다. sparse cloud ghosting/겹친 구름의 평균 depth 오차도 기록돼 있다[문헌].

따라서 기존 atmosphere 설치만으로 cloud까지 행성→궤도를 해결한다고 보지 않는다. ‘지표/근접 renderer 비교 후보’로 제한한다. 도입하면 Clouds/AerialPerspective buffer 통합과 ECEF/좌표 변환을 별도 시험한다. 공식 pass 순서를 이름만 보고 기존 composer에 복사하지 않는다.

### 3.5 후처리는 잔광보다 재구성 품질이 먼저

[NVIDIA STBN 연구](https://research.nvidia.com/publication/2022-07_spatiotemporal-blue-noise-masks)는 volume의 샘플링과 시간축 필터링 안정성에 관련된다[문헌]. noise texture만 바꿔 temporal stability가 자동 해결되지는 않는다.

**우리 적용 제안:** ray step에 STBN → camera/volume motion을 반영한 reprojection → depth·transmittance·새로 드러난 영역에 따른 history rejection → edge-aware upscale 순으로 시험한다. 얇은 솜털과 진입/역스크롤은 ghosting에 민감하므로 무누적 full-res 기준과 비교한다. 노출은 고정, bloom-off에서 양감·그림자가 살아야 한다. bloom은 태양/강한 산란 highlight에만 제한한다. 입자를 감추는 강한 blur·grain·샤프닝은 수용하지 않는다.

## 4. 화면 거리마다 제작을 나눈다 — 제안이며 실제 판정 미정

| 구간 | 배치·구도 | 표현·LOD |
|---|---|---|
| 행성 전경 | 지구 우하단, 남극/바다를 보존. 넓은 구름 띠 사이에 지표와 바다가 명확히 보임. 일부 군집 윗면과 하부 그림자로 높이를 읽음 | 광역 weather 분류+낮은 비용의 spherical cloud층. 화면에 투영되는 픽셀보다 작은 디테일은 필터링. global local-renderer 지원 별도 검증 |
| 궤도 근접 | 수평선 상단 약1/3, 전경 큰 군집 하단/측면, 그 뒤 성긴 중간 군집, 높은 얇은 띠. 저각도 태양은 좌측. 카메라 이동에 따라 층별 시차 | 동일 군집의 3D density를 보여줌. 자가·층간 그림자, 지표 투영, 대기 거리감. 양감을 읽을 측면/그림자를 확보하고 흰 평면을 화면 전체에 깔지 않음 |
| 구름 진입→서고 | 전경 덩어리는 카메라 옆을 지나고 중경의 틈에서 다음 구조가 드러남. 완전 가림은 짧은 편집 구간에만 존재 | 특정 국소 volume을 통과. 광역 fog bank로 교체하지 않음. 지리적 연속성이 아니라 가림편집인 점 유지. 승인된 서고의 위치·구조·빛을 변경하지 않음 |

**추천 경로:** 같은 군집의 낮은 해상도 광역 표현과 높은 해상도 국소 volume을 공유하는 혼합 방식. 먼→가까운 LOD는 같은 world anchor·sun·weather mask를 사용하고 opacity 합계/optical depth가 튀지 않게 인계한다. 사전 렌더 2D 카드/flipbook은 먼 곳 대안으로 남기지만, orbit/진입의 카메라 회전·역스크롤 때문에 근접 주 자산으로 먼저 채택하지 않는다. 조명 bake는 density/sun-transmittance 등 보조 데이터로 우선 사용하고 색상 전체를 특정 카메라에 고정하지 않는다.

## 5. 다음 제작 라운드: 내부 시험→완성된 장면 검토

1. **L0 단위·대표 군집:** 같은 카메라/태양 아래 주 구름1군집+얇은 층1개를 만든다. world km↔scene scale, Earth near/far·지형 depth 가림·얼음 교차를 먼저 검사. 큰 융기/바닥/빈 공간/외곽을 제어한다. 이 중간 자료는 사용자 완성도 평가용으로 내놓지 않는다.
2. **L1 광학·그림자:** 중심/외곽을 분리하고 optical thickness를 조정한다. 제안 기준 τ≥3이면 중심 투과≤5%, 얇은 층 τ .1–.8이면 약90–45% 투과(선택한 시선의 연출 출발값). 상부/측면/하부, 구름 아래 지표/아래층 그림자를 sun on/off와 shadow on/off로 검증한다.
3. **L2 궤도 거리/원근:** 군집 확대 시 실제 높이·앞뒤 간격이 유지되는지 확인. 렌더 후보(기존 경로 보강/별도 cloud renderer/국소 density+bake)를 같은 형상·구도로 비교한 뒤 선택한다.
4. **L3 AA·후처리:** full-res 무누적 기준→half-res/reconstruction을 비교. camera idle/정·역스크롤/얇은 층/새로 드러난 지표/극점·수평선에서 잔상·입자·반복 검사. GPU 비용은 atmosphere/구름 그림자/재구성 포함 전체로 측정.
5. **L4 같은 서고 접합:** 실제 군집 통과와 짧은 완전 가림→기존 고창/서고 인계. 빛·에셋·후처리가 갖춰진 전체 경로에서만 사용자 품질 피드백 요청. A-P3/Story/B/C는 독립 후속.

내부 기준: thick 중심이 비치지 않아도 덩어리 경계가 읽힐 것; thin 뒤 지표가 살아 있고 같은 cotton-noise 복제로 보이지 않을 것; 하부 그림자가 단순 검은 띠가 아닐 것; 두 층이 만나도 탁한 흰 안개가 되지 않을 것; 실제 입사 방향에서만 highlight가 강해질 것; bloom-off/idle에서도 질감이 유지될 것. 광학 합성은 `T=exp(-∫σt·density ds)`를 기준으로 front-to-back radiance/투과를 적분하며, 여러 알파 영상을 단순 가산하지 않는다.

이번 조사로 품질 향상·성능·새 cloud library 채택을 확정하지 않는다. 종전 G6 종료 결과를 보존하고, 구현 때는 새 scoped cloud 후보로 initial+최대3 품질 수정과 결함 복구를 구분해 기록한다.
