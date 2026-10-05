# A-P1 실제 장면 · 내부 검증
2026-10-05 · D-066 / F-037 / R-034 / CASE-007 · **전체 TUNE / 제품 채택 아님**

## 1. 실제 구현 범위
- 별도 prototype/spikes/a-climb. 현재 http://127.0.0.1:4198/; 기존 B 4196 실험과 제품 Intro 경로를 교체하지 않았다.
- 고정 archive.glb/manifest/light_shell의 원본 geometry 및 bake 재사용. 서고 하강/사다리 발견→등→통로 접근→뒤쪽 공간 측면→심장+mixed 입력.
- 새 body_climb: 검정 불투명 몸, 손바닥 정렬/마디 curl, 단 침투 정점의 표면 보정. 3전극과 짧은 lead, ECG 카트 socket(-1.29,.88,-3.9m) 연결.
- anatomical heart.glb를 새 chest 변환에 부착. 뒤에서는 숨기고 측면부터 강조한다. 심장이 밝은 덩어리가 되던 초기 조명을 낮추고 Fresnel emission으로 외형을 남겼다.
- warm bake/직접광, figure 포함 sun-depth, 48-step volume, dust, ACES, bloom, grade/vignette/grain. 몸의 얇은 amber rim은 연출용 Fresnel이며 물리 조명 재현 주장과 구별한다.
- Pretendard 본문, 한 줄 강조/mono metadata/하단 rule. pointer와 scroll smoothing, 시간 clock과 scroll p 분리.
- 파형: 저장된 d0-mixed-0 / S022 / 250Hz / 0dB. 원본 clean으로 R 검출, 원본 input으로 sweep. output M08은 저장된 ranking에서 선택해 로드만 했고 이 A-P1에서는 출력/성능을 전시하지 않는다.
- 기존 createSweep의 2.5초 창/0.12초 gap/0.3초 erase fade/0.2초 head glow 재사용. 영상/가짜 그래프가 아니다. scene source record가 기존 AWGN Intro의 S038과 다름을 명시한다.

## 2. 검증과 발견
| 검증 | 결과 | 증거·한계 |
|---|---|---|
| asset build/pose | PASS 및 TUNE | 새 GLB, skin site, source hash. 실제 오르는 동작을 추가한 것은 아님 |
| 단과 접촉 | 정점 검사 PASS | 이전근접2–10mm만으로는 단내부 정점171/168/456/588개가 남음. 보정 후 4부위 모두0. 면 관통/발 전체지지는 별도 |
| 연속카메라 | 12프레임 검토 | 첫사진은 서가 안, 중간측면경로도 서가에 충돌. 통로/뒤쪽 공간 경로로 고침. 중간에 높은 구도가 생겨 시나리오와 비교 TUNE |
| runtime | PASS | 12연속+volume-off/bloom-off/clay3+reduced/native-scroll2 =17캡처 |
| R 경계 | PASS | 3 R의 직전/해당 sample/80ms뒤 heartScale 및 beatAge. 단일t/sweep sample grid. 물리적 심장운동/환자측정 증거 아님 |
| 정지 scroll | PASS | p=.95 고정, 2.2초 뒤 t/sample 변화. native scrollTop도 p/camera에 반영 |
| reduced motion | PASS | 몸 idle와 심장 scale/포인터 추종 억제; 필수 파형 재생은 유지 |
| errors/build | PASS | normal/reduced browser errors0, Vite production build 성공 |
| 목표 PC/GPU/600초 | 미검증 | renderer CPU 제출시간을 GPU frame시간으로 해석하지 않음 |

증거: verification/a-scene-20261005/runtime_review.json, sequence-00~11.png, no-volume.png/no-bloom.png/clay.png/reduced-motion.png/native-scroll.png.
접촉: verification/a-climb-20261005/contact_review.json과 12회 clay 렌더.

## 3. 목업 비교와 남은 TUNE
L04/L05를 직접 다시 보고 비교했다. 생성 목업의 박동/파형은 실데이터 검증 기준이 아니며 분위기/구도 목표다.
- KEEP: 불투명 검정 body+림, 심실 외형, 어둡게 남는 서고, 실제 replay, 사다리/전극/카트의 같은 공간.
- TUNE: L04의 따뜻한 틈 빛/세밀한 라벨·종이·목재 표현, 카트·지지 자산의 완성도, 중간에 높은 구도를 거치는 현재 카메라, 일부 산란/무늬 aliasing.
- 기존 서고와 생성 목업의 건축 구도가 동일하다고 주장하지 않는다. 이번 연속 장면 자체는 하나의 고정 geometry다.
- L05와 마지막 프레임의 전역 선형 평균 휘도는 약 .0121/.0132. 평균 밝기가 가까워도 재질·구도·광원 품질 합격은 아니다(look_comparison.json).
- 몸 Fresnel은 아트 디렉션; 실제 aperture/blocker volume과 혼동하지 않는다. figure가 receiver에 만드는 접촉 그림자는 bake만으로 충분한지 추가 점검한다.

## 4. shader/post/fidelity 게이트
- PBR: opaque body/heart와 baked room 사용. body SSS·굴절은 검정 실루엣에 불필요. 접촉은 vertex 수정과 shadow; 전체 triangle collision 미검증.
- Atmosphere: sun-depth volume/dust 넣음; bloom-off와 volume-off 자료. 모션 blur/DOF는 파형·문자 선명도와 비용 때문에 이번 단계 제외.
- clay 캡처는 인체만 회색으로 바꾸는 자산 검토다. 전체 서고의 clay/광원 분리 검증을 마쳤다고 주장하지 않는다.
- Grade: ACES exposure1.12, warm grade, vignette/grain. 몸 rim이 volume 차광에 따라 사라지는 물리 모델인 것은 아님.
- G1: 기존 archive/REF-002 계열 pipeline와 승인된 L04/L05 번안. 새로운 직접관찰 레퍼런스와 동일 fidelity 주장 없음.
- G2: 기존 registry 모델+새 test-only GLB/hash; source geometry 고정. 전체 텍셀1:1/카트세부 완성은 TUNE.
- G3: 12프레임 직접 시각 검토, L04/L05 대조, 중간카메라 문제를 발견. 기술 QA PASS는 시각 PASS가 아니다.
- G4: 전역 휘도 수치와 눈 검토. 서로 다른 camera/geometry라 설명용 수치이며 합격 게이트 아님.
- G5: 전중후/빛off/clay/정지재생/native scroll/reduced. 터치/목표 PC는 미검증.
- G6: 실제 장면 자체 수정 세 묶음(진입·심장 / 림·텍스트·접촉 / 경로 충돌) 후 남은 품질 GAP 보존. geometry 접촉 작업은 별도 내부 자산 단계.

## 5. 재현과 다음
저장소 루트에서:
```
npm run spike -- a-climb
```
포트4198을 사용하며 중복 실행이면 기존 서버를 사용한다. QA는 spike의 npm run qa; CLI 경로가 다르면 A_BROWSER_BIN, URL이 다르면 A_PREVIEW_URL 지정.
준비 데이터는 data/bank.js+extension.js에서 매번 추출; original waveform을 새로 합성/필터링하지 않는다.
Windows sandbox realpath/esbuild 제한으로 로컬 build는 승인된 실행 경로에서 수행. Edge가 DevTools endpoint 없이 종료되어 설치된 Chromium1243으로 검증했다.

**다음은 A-P1 품질 보완**: 서고 재질/종이/카트 상세, figure receiver 그림자, 과도한 높은 중간 구도/산란 aliasing. 이 GAP가 있는 동안 A-P2와 사용자 최종 품질 판정으로 넘어가지 않는다.
별도 파형 제안: 기존 그래프 경계가 기기 화면의 격자에서 공간으로 확장되는 연출, R 때 heart→lead→sweep head로 한 번 전달되는 빛. 아직 채택/구현하지 않았으며 현재 camera/light 완성 후 장면 단위로 검토한다.

