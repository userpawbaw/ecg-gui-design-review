# A-P1 시점 전환 앨리어싱 조사

2026-10-05 · RESEARCH / 기존 품질 보완 · 상태: 코드 원인 후보 확인, 비교 실험 계획. **AA 구현·동영상 개선 검증은 아직 하지 않음.**

## 1. 사용자 관찰과 코드 증거

[대화] 사용자: “시점이 바뀔 때 계단 현상이 좀 심하네.” 시점 이동 품질을 A-P1의 다음 우선순위로 둔다. 기존 구도/서고/오르기 자세는 유지한다.

[코드] 현재 a-climb은 Three.js 0.186.1, WebGLRenderer antialias:true이나 EffectComposer의 HalfFloat WebGLRenderTarget에 samples를 지정하지 않는다. 설치된 RenderTarget 기본값은 0이다. 즉 기본 캔버스 AA 설정만으로 오프스크린 장면의 geometry 경계를 다중 샘플링하지 않는다. 이것은 개선할 명확한 설정 공백이며, 사용자가 본 모든 현상의 유일한 원인이라고 단정하지 않는다.

[코드] main.ts resize의 pixelRatio는 min(devicePixelRatio,1.5). DPR1 모니터에서 내부 해상도는 1배다. 1.5는 상한이지 항상 1.5배로 그린다는 뜻이 아니다.

[코드] archive.ts volume은 48회 ray march. j=ign(gl_FragCoord.xy+uFrame*5.588)로 시작점을 매 프레임 변경하고, 시간에 따른 밀도 noise도 사용한다. history accumulation/재투영 없이 프레임별 분산이 남을 수 있다. 빛줄기의 자글거림은 윤곽 AA와 별개로 검사해야 한다.

[코드] space.ts grade는 OutputPass 뒤에서 시간 변화 grain을 더한다. 파형은 별도 Canvas2D이고 문자는 DOM이다. Three.js AA를 넣어도 이 두 레이어가 자동으로 필터링되지 않는다.

[추론] 카메라 이동 중 보이는 현상은 다음처럼 분류해야 한다. 아직 부위별 동영상 분리 검증은 안 했다.

| 보이는 위치/증상 | 우선 검사 | 맞는 개선 |
|---|---|---|
| 사다리·인체·책장 외곽의 톱니/얇은 배선 끊김 | geometry 픽셀 경계 | MSAA / SMAA, 필요 시 내부 해상도 |
| 빛줄기 내부의 소금 같은 흔들림 | frame jitter / ray-march 수 / light-depth step | volume 샘플링과 필터 별도 보완 |
| 비스듬한 책등·바닥 무늬의 모아레 | mipmap / minFilter / anisotropy / 텍셀 밀도 | 재질별 texture filtering |
| 암부 전체의 작은 밝기 변화 | grade grain | 진단 때 grain off, 연출량 재조정 |
| 겹친 표면만 번쩍임 | z-fighting / depth precision | geometry/depth 문제 수정; AA로 숨기지 않음 |

## 2. 방법 비교

| 방법 | 이번 장면의 역할 | 비용/제한 | 권장 상태 |
|---|---|---|---|
| 렌더 타깃 MSAA 4x | geometry 경계와 가는 배선 | 샘플/resolve 메모리 비용. volume shader 내부 noise는 해결 못함 | 첫 단독 후보 |
| SMAAPass | 후처리 이미지에서 감지된 경계 | edges/weights/blend의 추가 작업. 시간축 안정성 자체를 보장하지 않음 | 첫 단독 후보 |
| MSAA 4x + SMAA | geometry + 후처리 경계 | 둘 다 쓰는 이득이 비용보다 큰지 확인 필요 | 단독 후보가 부족할 때만 |
| FXAA | 저비용 후처리 대안 | 얇은 선/세부가 부드러워질 가능성 | 성능 대체 후보 |
| 내부 해상도 1.25/1.5배 | subpixel detail을 더 많이 샘플링 | DPR1 기준 픽셀 작업량 약1.56/2.25배; 기존 높은 DPR와 중복 확대 금지 | AA 후 잔여 문제에 선택 적용 |
| Three TAARenderPass | 정지 장면 누적 | 공식 구현은 재투영 없는 TAA. 움직이는 카메라·먼지·심장에 맞는 motion-compensated TAA가 아님 | 실시간 기본안 제외 |
| SSAARenderPass | 고품질 정지 비교 이미지 | jitter sample마다 장면 재렌더; volume/bloom 비용도 검토 필요 | 오프라인 기준용 선택 |

MSAA 8x/TAA/전면 supersampling부터 시작하지 않는다. 먼저 결과를 비교해 필요한 만큼 선택한다. SMAA/FXAA의 상대 선명도·프레임 비용은 이 장면의 실험 전에는 확정하지 않는다.

## 3. 구현 순서와 버전 주의점

### AA-0: 원인 분리 및 기준 영상

같은 창 크기·DPR·브라우저·카메라 경로·t 시작값·프레임 간격으로 baseline을 기록한다. 실제 DPR/렌더 타깃 크기/GL renderer/지원 sample 수도 저장한다. geometry ROI(사다리 단·몸 측면·lead), material ROI(책등·바닥), volume ROI(고창 빛)를 따로 비교한다.

volume off, grain off, bloom off를 각각 분리한다. baseline 정지 프레임뿐 아니라 rear→side 연속 이동·마우스 작은 회전·스크롤 정지 이후를 기록한다. frame jitter가 원인인지 보려면 p와 t를 고정하고 frame만 증가하는 조건도 필요하다. 이미 저장된 12정지 캡처는 이동 중 shimmer 검증을 대체하지 못한다.

### AA-1: MSAA와 SMAA 단독 A/B

- MSAA: composer의 custom WebGLRenderTarget에 samples:4 설정. HalfFloat 포맷의 실제 지원 sample 수와 framebuffer 오류를 확인한다. volume이 depthTexture를 읽으므로 resolveDepthBuffer:true를 유지한다. composer의 두 ping-pong 타깃과 resize 후 depth/색상/가림이 정상인지 확인한다. samples=4 요청을 실제 GPU 지원4로 간주하지 않는다.
- SMAA: **현재 설치된 r186의 SMAAPass는 linear-sRGB 입력이므로 OutputPass 앞에 넣는다.** 이전 버전의 온라인 예제를 그대로 붙여 OutputPass 뒤에 두지 않는다. 현재 체인은 RenderPass→volume→bloom→SMAA→OutputPass→grade를 후보로 한다. LUT 이미지 준비 이후 비교하고 composer setSize가 pass 해상도를 갱신하는지 확인한다.
- FXAA를 비교할 경우 display-space 입력에 맞춰 OutputPass 뒤, grain을 넣기 전에 둔다. 최종 색/grade 결과와 경계 선명도를 함께 확인한다.
- AA 삽입으로 read/write swap 수가 달라져도 volume이 당 프레임 RenderPass의 depthTexture를 읽는지 검증한다. 잘못된 depth 재사용은 밝은 halo/가림 누락을 만들 수 있다.
- DOM/ECG Canvas2D는 그대로 분리한다. 파형이 실제로 계단져 보이면 그 레이어의 DPR/좌표/선 두께를 별도 조사한다.

### AA-2: 잔여 shimmer를 발생 지점에서 수정

volume은 jitter 고정/변경 및 48/64/96step을 진단 비교한다. jitter를 없애는 것은 banding으로 바뀔 수 있으므로 최종 해결로 곧바로 채택하지 않는다. 필요하면 volume만 별도 버퍼로 분리해 depth-aware 공간 필터를 시험한다. geometry 밖으로 빛이 새는 blur는 REJECT. 시간 누적을 도입할 때에는 카메라 cut/스크롤 점프/resize의 history reset 및 moving dust/heart의 ghosting까지 설계해야 한다.

책등/바닥 텍스처는 mipmap/LinearMipmapLinearFilter 여부부터 확인하고 anisotropy를 해당 map에만 4/8 범위와 장치 상한 내에서 비교한다. 저해상도 bake/무늬 자체의 디테일 부족을 AA 합격으로 처리하지 않는다. procedural line에는 필요 시 fwidth/smoothstep을 적용하되 실제 현재 shader의 해당 경계를 먼저 찾는다.

### AA-3: 채택과 성능

두 단독 후보를 먼저 비교한 뒤 필요할 때만 조합/내부 해상도 확대를 시험한다. 절대 DPR상한만 올려 DPR1에서 아무 변화가 없는 실험을 피한다. 최종 기준은 톱니 감소 + 이동 중 안정성 + lead/heart detail 보존 + volume 차광 유지다. 블러·강한 bloom·DOF로 계단을 감추는 것은 대안이 아니다.

동일 경로 영상 및 최소12프레임, baseline/candidate 동일 위치 확대 크롭을 보존한다. 파형·심장 R 동기화/정지 재생/reduced-motion을 다시 확인한다. 프레임 시간 p50/p95와 long-frame, 가능하면 EXT_disjoint_timer_query_webgl2의 disjoint 유효 GPU 시간도 기록한다. 기존 cpuRenderMsMean은 GPU 시간으로 해석하지 않는다. 실제 전시 PC 검증 전 성능 최종합격은 보류한다.

## 4. 현재 결론과 작업 범위

**추천: AA-0→MSAA4/SMAA 단독 비교→volume/texture 잔여 문제 보완→필요한 조합만 채택.** A-P1 품질 보완의 첫 작업으로 우선한다. 최종 AA 방식은 미확정이며 이 조사에서는 렌더러/에셋/실데이터를 변경하지 않았다. A-P2 및 B/C 후속은 기존 보류 상태를 유지한다.

## 5. 근거

프로젝트 코드: prototype/spikes/a-climb/main.ts, prototype/v2/src/story/intro/archive.ts, space.ts. 설치된 Three.js 0.186.1의 RenderTarget.js / EffectComposer.js / SMAAPass.js / FXAAPass.js / TAARenderPass.js를 직접 대조했다.

공식 자료(2026-10-05 조회):
- [Post-processing](https://threejs.org/manual/pages/post-processing.html): scene→render target→pass 구조.
- [RenderTarget](https://threejs.org/docs/pages/RenderTarget.html): samples 기본0, depth resolve.
- [SMAAPass](https://threejs.org/docs/pages/SMAAPass.html): linear-sRGB, OutputPass 앞.
- [TAARenderPass](https://threejs.org/docs/pages/TAARenderPass.html): 정지 누적/재투영 미지원.
- [Texture](https://threejs.org/docs/pages/Texture.html): mipmap/minFilter와 anisotropy.
- [SMAA 예제](https://threejs.org/examples/webgl_postprocessing_smaa.html), [FXAA 예제](https://threejs.org/examples/webgl_postprocessing_fxaa.html): 후속 비교 출발점; 예제페이지의 실행 품질을 이번 조사에서 직접 관찰했다고 주장하지 않음.
