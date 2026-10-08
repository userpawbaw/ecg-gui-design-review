# D109 · 실제 휠 검증과 전체 인계의 구현 계약

## 1. 이번 재개 범위

사용자 계속 진행 승인. D108 커튼빛 후보와 실제 여섯 구도/ON-OFF/자동 정역 증거는 원격 834a35d4e26c28ff4ce75cbce2bb09ec3f07a37a에서 content readback 확인했다. 이어 cloud-lab의 실제 wheel 입력 → 목표 진행도 → 시간 기반 카메라 감쇠 → 같은 DEM 1.5× → 원본 Takram 광학 → PNG/JSON 저장 응답을 검증했다.

TAA 유지. D108 후보 sun15°/az0°/hazeExponent.00018/layer1.2/coverage.42/repeat54/contrast1.6/high50% 그대로. cloud-buffer640×360/display1280×720. 기본 main/서고/Story/BC는 교체하지 않았다. 사용자 수정 native 6파일도 보존.

## 2. 실제 구현

- 패널 밖 북유럽 화면의 wheel delta를 픽셀로 정규화하고 진행 목표에 .000025/pixel로 반영, .235–.365 범위로 제한.
- 카메라는 시간 상수 .16초의 지수 감쇠로 목표를 따라간다. reduced-motion이면 즉시 목표 반영하는 코드 경로; 해당 환경 실제 검증은 미실행.
- 패널 안은 설정 스크롤을 유지. Ctrl+wheel은 가로채지 않는다.
- 캡처에 input.source/wheelCount/lastWheelPixels/target/current/settled 포함.
- range step .0001 때문에 목표 바로 전 값에서 정착하지 못하는 것을 발견, .00011 이내이면 목표에 맞추도록 수정. 수정 전 두 쌍은 takram-wheel-20261008에 별도 보존.

## 3. 실제 검증

최종 native 10쌍은 verification/a-cloud-sculpt-20261006/native-captures/takram-wheel-final-20261008. manifest/hash/gallery는 verification/a-takram-wheel-20261008. 자동 진행 재생이 아닌 CUA browser scroll 입력이며 연속 영상은 아니다.

| 항목 | 관찰 | 판정 |
|---|---|---|
| 정방향 | Home=.235 이후 wheel4회: .271→.307→.343→.365 | 입력/정착 PASS |
| 역방향 | wheel4회: .329→.293→.257→.235 | 입력/정착 PASS |
| 하한 반복 | 추가 up 입력 후 .235 유지 | PASS |
| 패널 | scrollTop240→0, 카메라 .235 유지 | PASS |
| 렌더러 | RTX3070, native10쌍 ready/contextLostfalse/real wheelCount1–9 | 범위 PASS |
| 브라우저 | warn/error 조회 [] | 해당 탭 범위 PASS |
| 빌드 | 최종 Vite79modules exit0. Windows sandbox realpath EPERM은 동일 build escalation으로 해결 | PASS |
| 성능 | 캡처별 GPU query16–39개, p50 약5.37–39.10ms/p95 약20.93–67.03ms로 크게 변동 | 안정 성능 PASS 미부여 |
| 화면 | .343/.365 커튼빛·같은 능선 확인. .235 먼 구름은 작은 반복 얼룩처럼 보임 | 시각 TUNE |

D108의 정착된 fixed120queries와 이번 짧은 이동 후 query를 같은 조건의 성능 비교로 사용하지 않는다. 일시적 시간 상승의 원인은 미확정이다. GPU 컨텍스트 중단은 이번 native에서 발생하지 않았지만 장기 안정성은 증명되지 않았다.

## 4. 전체 인계에 적용할 구체적인 계약

### 지구/광역 → 지역 구름 (.18–.28)

기존 원형 지구·지도 품질 KEEP를 유지한다. 기존 camera path와 같은 northern DEM을 사용한다. lab의 근경 weather54를 원형 지구부터 그대로 투사하지 않는다. p.235 시험이 그 방식의 먼 반복 질감과 비용 문제를 보여준다. 전역 thin shell과 근경 volume의 담당 거리를 분리하고, screen coverage/밀도 전이를 연속으로 제어해야 한다. library shader의 density/opacity 동작을 확인한 뒤 작은 6구도 시험으로 이음새를 확인한다. 두 개의 산란/그림자 레이어가 중복되지 않게 한다.

### 지역 → 하강 (.265–.365)

kilometre scene를 metre optics로 변환하는 경계는 한 곳으로 모은다. northToECEF는 회전+이동만, DEM mesh/camera는 ×1000. normal/depth/albedo를 원본 aerial pass에 공급한다. 이미 PBR 조명된 RGB에 aerial sunLight를 다시 더하지 않는다. cloud TAA는 동일 camera history를 유지하고 품질 교체 때 camera jump로 초기화하지 않는다.

### 하강 → 서고 (.365–.445)

동일 지형이 먼저 가려지고, 가림 최대 구간에서 scene을 교체하며 서고의 따뜻한 조명·volume/Bloom KEEP를 복원한다. 새 구름이 화면에 갑자기 나타나는 전환을 피한다. 구름 안쪽 시야를 이어갈 실제 camera/coverage를 설계한 뒤 최소6구도와 reverse wheel에서 검토한다. 기존 laboratory .365는 구름 아래 빛 커튼 구도이며, 이를 구름 내부 가림 완료로 오해하지 않는다.

### 렌더/성능 경계

main의 three/addons composer와 lab의 postprocessing composer는 pass 타입/톤매핑이 다르다. iframe 두 renderer를 상시 실행해 덮는 우회는 채택하지 않는다. 같은 renderer에서 선택적으로 실행되는 광학 모듈로 추출하고 archive pass와 자원을 명시적으로 해제/재활성화하는 방식을 우선 검토한다. distant LOD, render scale, lazy initialization, 준비 완료 전 기존 화면 유지가 함께 필요하다.

## 5. 완료와 다음 작업

이번 단계 완료: 실제 wheel 기능·양방향 정착·패널 분리·native10쌍·최종 build. D108 커튼빛의 시각 채택은 TUNE 유지.

다음: 먼 구름의 거리별 표현과 렌더 범위를 먼저 보완 → 단일 renderer 광학 모듈 → 기존 globe/DEM에서 하강 및 서고 가림까지 후보 통합 → 실제 정역 wheel와 정착된 GPU 같은 조건 재검증. B/C/Story/A-P3의 나머지 및 D080 대안은 별도 상태 유지.
