# D111 · 하강 noise/그림자 분리시험

## 범위와 판정

D110의 다음 순서를 사용자가 진행 승인했다. 초기 여덟 설정을 비교한 뒤 구름 TAA 단독 후보를 추가했다. 최종 결과는 **아홉 설정 × 세 구도의 정착 PNG/JSON 27쌍과 실제 렌더 이동 영상 네 개**다. GPU·입력·저장 흐름은 이번 범위에서 검증했지만, **이동 자글거림과 카메라 의존 그림자의 해결은 미확정/TUNE**이다. 새 설정을 기본 화면에 채택하지 않았다.

기존지형1.5×/sun15°방위0°/커튼빛/haze.00018/layer1.2/.42/54/contrast1.6/full-bufferTAA/SMAA유지. 이번정상viewport는942×672, cloudScale.5의명목buffer471×336. 이전1280×720/D110사용자ultra100영상과성능·화질을직접비교하지않는다. main/globe/Story/BC/서고KEEP와사용자6capture/영상추출자료보존.

## 구현과 source

lab의분리select로shadow링크/깊이margin/far/jitter/temporalPass/resolvealpha/marchstep을단독변경. shadowMaps.margin와resolveMaterial.uniforms는pinned공개객체에접근하는번안시험이며라이브러리shader는변경하지않음. 장기API호환보장은아님.

metadata에actualshadowAlpha/minStep/perspectiveStep/cascadeCount/mapSize/splitLambda등을추가. 실행값은3cascade/512²/splitLambda.6. D110의constructor-default .5를실제값으로해석하면안됨.

실제renderer.canvas.captureStream(30)/MediaRecorder VP8로8초 .265→.365→.265경로녹화. nominalpath trace와완료상태를WebM옆JSON에기록. native영상이며AI생성아님, 실제wheel녹화와도구별. 녹화encoding부하가포함된GPU값은성능근거로사용하지않는다. local-onlyPOST는origin/loopback/경로/크기/WebMsignature검증유지.

## 비교 결과

| 설정 | 변경 | 이번 관찰·판정 |
|---|---|---|
| 기준 | 기존high50% | 커튼빛/능선기준. 움직임결함해결미확정 |
| 지형그림자OFF | aerial.shadow링크해제, beam은유지 | 지형밝기확연증가, 그림자기여분리성공. 해결책채택아님 |
| 깊이여유20km | shadowMaps.margin20000 | 정착구도에서큰개선차이확인못함 |
| jitterOFF | shadow.temporalJitterfalse | 정착사진차이작음, motion해결증거아님 |
| 촘촘march | minStep50→10/perspective1.01→1.003 | 정착·이동대표프레임의개선이분명하지않음. 비용증가하여미채택 |
| 범위200km | maxFar100000→200000 | 정착구도큰개선차이확인못함 |
| 빠른이력 | shadowresolvealpha.01→.1 | 정착차이작음. 별도8초영상에비교후보로보존, 해결확정/채택아님 |
| 시간누적OFF | shadow.temporalPassfalse | 그림자시간필터제거대조, 전체TAA는유지. 정착차이작음, 만능해결아님 |
| 구름 현재 반영5% | clouds resolve alpha .1→.05, 그림자 alpha .01 유지 | 누적을 강화한 추가 후보. 잡음과 이동 잔상을 함께 비교하도록 정착3구도/8초영상을 별도 저장. 개선 확정/채택 전 |

정지 사진이 비슷하다는 것은 카메라 의존 오류가 없다는 증거가 아니다. 네 영상은 같은 카메라 경로의 연속 렌더 결과다. 녹화 압축과 프레임 속도 차이는 있을 수 있다. 대표 프레임의 형태와 빛 연결을 확인했지만, 시간 잡음의 정량적 개선이나 같은 지형 지점의 조도 불변을 증명하지는 않았다. 지형 지점 추적과 움직임 중 잡음 분리가 남아 있다.

## 성능과 검증

같은viewport/renderer의정착구도마다GPUcomposer60query. camera정방향으로3구도순차측정이며통계적우열/장기성능검증아님.

| 설정 | p.300 p50 | p.345 p50 | p.365 p50 |
|---|---:|---:|---:|
| 기준 | 8.15ms | 8.26ms | 7.79ms |
| 촘촘march | 11.42ms | 11.47ms | 10.06ms |
| 빠른이력 | 8.33ms | 8.33ms | 7.94ms |

- 정착24쌍ready/cloudPassAttached true/contextLostfalse, RTX3070. 명목buffer471×336/display942×672.
- WebM3개EBMLsignature·완료trace8000ms·최종ready/context정상. ffmpeg로decode하여8개대표프레임씩추출, 기준영상duration8.01초확인.
- 최종Vite79modulesbuildPASS. localserver가중단돼4198재개. 마지막gallery/nativevideo UI확인이런타임저장검증과함께필요.
- capture도중camelCase shadowOff/jitterOff가endpointlowercase조건에거부됨. 초기round12쌍은partial로보존. lowercase shotID와저장실패throw로수정하고새finalround24쌍검증. O021.
- manifesthash는packaging시점코드. fixed24쌍은영상UI추가전촬영, 광학코드·설정은동일. 이구별을manifest에명시.

## 다음 순서

1. 현재후보를baseline으로보존. 비용상승만명확한march는자동채택하지않는다.
2. 동일world지형점조도추적과cloud-only/groundshadow-only움직임분리, 필요시근경cloud버퍼의공간필터/시간필터를source근거로추가검토. 단순screen전체blur나기본ultra상향을해결로삼지않음.
3. D110 same-footprint원경mask/근경volume의6구도설계는이결함검토와구별해진행. 남은noise/그림자를고친것으로가정한전체main통합은아직하지않는다.

이번 단위는 분리 시험과 검토 가능한 실제 영상 제작까지 완료했다. 전체 도입부 품질이나 자글거림의 해결 완료를 뜻하지 않는다. 갤러리에서 첫 번째 기준 영상과 두 번째 구름5% 후보 영상을 먼저 비교한다.
