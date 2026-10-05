# A-P1 AA 비교·적용 결과

2026-10-05 착수 / 2026-10-06 완료 · D-067 · F-038 · **AA 보완 KEEP / 전체 A-P1 TUNE**

## 1. 적용

a-climb 별도 프리뷰 기본값을 MSAA4로 변경했다. HDR HalfFloat composer target에 실제 지원 sample 범위 내 4를 요청하고 depth resolve를 유지한다. samples가 전혀 지원되지 않는 경우 SMAA로 fallback한다. 이 fallback 조건을 실제 미지원 장치에서 검증한 것은 아니다.

volume은 48→96step, grade grain은 기존 강도의35%로 변경했다. frame jitter는 유지한다. 단순 고정 jitter로 전환하면 정지 상태의 frame noise는 없어도 시점 이동 중 패턴/띠가 남을 수 있으므로 채택하지 않았다. temporal history, blur, DOF는 추가하지 않았다.

ECG Canvas2D/DOM은 AA 필터를 통과시키지 않는다. 저장된 파형·시간축·박동 시계는 그대로다. product route와 공유 archive/grade shader 기본 동작도 그대로이며, 이 보완은 a-climb 내부 설정이다.

## 2. 비교 결과

동일 1920×1080 / DPR1 / render ratio1 / p0~1의12프레임 / t2.4 / frame12 / 48step / grain off 조건으로 none, MSAA4, SMAA, hybrid를 비교했다. 각 후보의 8초 3D canvas 카메라 경로 영상도 저장했다. 동영상은 DOM/ECG overlay를 포함하지 않는다.

| 후보 | 직접 확대 검토 | 판정 |
|---|---|---|
| none | 인체 팔·사다리·책장 대각선에 뚜렷한 픽셀 단계 | 기준선 |
| MSAA4 | 팔 안쪽/사다리 경계가 부드러워지고 가는 형상 유지 | 기본 KEEP |
| SMAA | 이 어둡고 낮은 대비 장면에서는 일부 경계에 톱니가 남음 | 지원 fallback/비교용 |
| hybrid | MSAA 단독에 비해 추가 이득이 뚜렷하지 않음 | 기본에서 제외 |

aa-edges-zoom.png는 nearest 확대이므로 새로운 smoothing으로 차이를 숨기지 않는다. aa-contact-sheet.jpg는 화면 구도 대조용 축소본이지 픽셀 경계 판정용이 아니다. baseline/MSAA 이동 영상을 브라우저에서 디코딩해 각각12장 검토했다. 경로/빛 가림은 유지되지만 이 검토는 관람객의 체감 승인이나 모든 프레임의 shimmer 제거 증거가 아니다.

## 3. 빛 샘플링 진단

고정 p=.35, t=2.4, grain off, frame0~3, RGB/255의 평균 표준편차를 ROI [200,150,1600,800]에서 계산했다.

| ray march | 평균 frame 표준편차 |
|---|---:|
| 48 | .00520454 |
| 64 | .00397404 |
| 96 | .00281507 |

96step은 이 조건에서48 대비 약45.9% 감소했다. **이 수치는 움직이는 영상 전체의 품질 점수나 모든 노이즈 감소율이 아니다.** 시간 변화 density/dust는 t를 고정해 배제한 진단이다. volume 자체의 잔여 shimmer는 TUNE로 남는다. grain도 낮췄으므로 최종 영상 차이는 AA 단독 효과와 분리해서 읽는다.

## 4. 성능

실제 브라우저 보고: ANGLE / NVIDIA GeForce RTX3070 / Direct3D11. RGBA16F 지원 sample [8,4,2,1], 이번 MSAA는4. 헤드리스 Chromium에서 같은8초 경로를 녹화 없이 재생해 GPU timer query의 유효 결과503개를 수집했다. 값은 composer 작업의 GPU시간이며 전체 앱의 모든 비용은 아니다.

| 후보 /48step | GPU p50 | GPU p95 | RAF p95 |
|---|---:|---:|---:|
| none | 5.67ms | 8.65ms | 16.8ms |
| MSAA4 | 8.08ms | 9.54ms | 16.8ms |
| SMAA | 7.55ms | 9.71ms | 16.8ms |
| hybrid | 8.50ms | 9.56ms | 16.7ms |
| **최종 MSAA4/96step/grain35%** | **8.63ms** | **9.84ms** | **16.8ms** |

최종도 이 장치의 짧은 경로에서는 프레임 간격을 유지했다. 순차1회 측정으로 후보 간 작은 차이에 통계적 우열을 주장하지 않는다. 전시PC/Edge/600초/여러 해상도 성능은 미검증. 녹화 포함 측정과 녹화 없는 측정은 motion.json에서 분리했다. 기존 CPU 제출시간을 GPU시간으로 바꾸어 해석하지 않았다.

## 5. 최종 검증과 한계

- 최종17캡처 /3 R경계 / 정지 재생 / native scroll / reduced-motion / browser errors0 PASS.
- 최종8초 영상 및 디코딩12프레임 저장. Vite build PASS(37modules). JS 약800kB, gzip233kB, chunk advisory는 남음.
- AA 후보64캡처 +진단7 +추가step진단8 +최종17 =96 browser screenshots. 디코딩36프레임 /3D canvas 영상5개 별도.
- 얇은 형상 손실, 명백한 가림 누락/밝은 halo는 이번 캡처에서 발견하지 못했다. depth resolve의 전기종 보장이나 완벽한 삼각형 충돌 검증으로 확대하지 않는다.
- texture/detail 품질, receiver shadow, 높은 중간 카메라, cart 품질은 여전히 A-P1 후속. B/C 및 A-P2는 보류 유지.
- 자기 보완3묶음: AA 단독4후보 → volume step/grain 분리 및 비용 → 최종 설정 전체 재검증. 추가 실험 무한 반복 대신 남은 GAP 기록.

증거: verification/a-aa-20261005/comparison.json, jitter-metrics.json, motion.json, video-review.json, final/runtime_review.json, final/motion.json, final/video-review.json. 같은 폴더의 PNG/JPG/WebM.

## 6. 재현

저장소 루트:
```
npm run spike -- a-climb
```
기본 http://127.0.0.1:4198/ 는 최종 설정. 원래 기준선은 ?aa=none&steps=48&grain=1, AA단독 비교는 ?aa=msaa 또는 ?aa=smaa 또는 ?aa=hybrid에 동일 steps/grain을 붙인다. grain=0은 그레인만 끈다. scale은1~1.5 진단 인자이며 기본1이다.

spike 폴더의 npm run qa:aa / npm run qa:aa:motion은 후보 비교. npm run qa는 최종runtime검증. A_BROWSER_BIN/A_PREVIEW_URL, A_QA_DIR(최종 runtime 출력), A_AA_FINAL=1(최종96step 영상) 지원. 먼저 agent-browser 세션을 사용 가능한 설치 브라우저로 열어야 한다. QA 스크립트가 모든PC의 Chromium 경로를 설치/자동 발견한다고 주장하지 않는다.
