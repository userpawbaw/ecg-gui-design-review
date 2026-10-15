# 구름의 업계 방식 적용 감사와 산란·고도 안개 시험 — D140

## 판단 먼저
현재가 최선이라고 볼 근거가 없다. 좋은 원본 밀도 에셋을 가져왔지만, 현재 orbital 경로에는 Takram의 구름 광학·대기 결합·시간 누적이 그대로 적용되지 않는다. 별도 높이장과 두 국소 밀도 군집을 합성하므로 재질·두께·광학 응답이 다른 상태다. D139은 높이 성장과 하단 접합을 보완했으나 사용자에게 여전히 어색했다. 이번에는 현재판 / 안개 추가 / 산란 조명+안개를 동일 구도로 비교한다. 결과는 TUNE이며 주 Intro 채택이 아니다.

## 실제 구현 감사 [코드]
| 항목 | D139에서 확인한 구현 | 이번 조치 / 남은 gap |
|---|---|---|
| 원본 밀도 | Disney quarter VDB를192×96×192 R8 두 벌로 재표본화 | 같은6.75MiB 재사용; 원본 전체 해상도 아님, true volume mip/면적 평균 미적용 |
| 광학 적분 | 192view steps, extinction, transmittance 합성 | 유지; sample 수렴·물리 단위 검증 아님 |
| 직접광 | gradient normal과 Lambert 유사 facing, 고정6×650m 광선 | scatter 후보는 box 출구까지6개 가변 구간의 optical depth |
| 산란 | sky fill와 지수 근사 위주 | dualHG 위상함수와3octave 근사 시험; 에너지 보존 물리 renderer 아님 |
| 대기 | terrain에 Takram AerialPerspective, custom cloud는 거리색 혼합 | 구름 대표거리/지형 depth로 종료하는6.5–14.5km 안개 추가. Bruneton LUT의 실제 cloud coupling 미구현 |
| 공통 medium | 위성 높이장 + 독립 VDB 두 box, 중심 거리 정렬 | 여전히 별개. 겹친 density의 단일 적분/공통광학은 후속 구조작업 |
| 시간 안정성 | orbital=true일 때 Takram CloudsEffect 제외, TAA false | 이번도 SMAA. 재투영·motion vector·depth rejection 미구현 |
| 지형 그림자 | 기존 후보 유지 | 사용자 보류 유지 |

근거 파일: cloud-lab.ts의 setCloudEnabled/opticalPass.configure, state.temporalAntialiasing, cloud-orbital.ts, cloud-regional-volume.ts. UI의 hazeDensityScale 값을 바꿔도 비활성 CloudsEffect에는 효과가 없다. `Takram 사용`이라는 이름과 실제 활성 pass를 구별한다.

## 업계 자료와 대응 [문헌]
1. [Takram 공식 clouds 문서](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/clouds): fog layer, phase function, multiple scattering, haze와 시간 재구성은 서로 연결된 기능이다. 현재 main 문서와 로컬0.7.6 package source를 구별해 확인했다. 로컬 build/shared.js에 phase/scattering/haze 및 aerial perspective 연결이 있으나 현재 orbital pass는 이를 실행하지 않는다.
2. [Skybolt 제작자 Matthew Reid의 planetwide cloud 제작 노트](https://prograda.com/2021/07/28/rendering-planetwide-volumetric-clouds-in-skybolt/): planet scale coverage와 volume detail을 구별하고, 빛 투과와 산란을 적분하며 weighted cloud distance를 대기 합성에 쓴다. 이번 depth 대표값과 산란 근사는 이 원리를 참고했지만 완전 재현은 아니다.
3. [Epic 공식 Volumetric Cloud 문서](https://dev.epicgames.com/documentation/unreal-engine/volumetric-cloud-component-in-unreal-engine?lang=en-US): 다중산란 근사는 두꺼운 구름의 밝기, 대기 관점 처리는 구름과 배경의 결합에 영향을 준다. temporal reconstruction과 조명 품질도 별도 요소다. Unreal 수치를 Takram/custom shader에 그대로 복사하지 않았다.
4. Nubis Evolved2022 공식 PDF는 이번 본문 열기가 실패했다. 검색 발췌만으로 추가 구현이 확인되었다고 표시하지 않는다. 이전 조사 이력은 유지한다.

## 이번 후보의 구체적 변경
- legacy: D139 joined 밀도/기존 조명, 추가 안개 없음. depth-cap은 세 후보에 공통으로 적용하므로 이전 D139 PNG와 완전 비트 동일 대조는 아니다.
- haze: legacy + 고도6.5–14.5km의 고정 world 안개.16적분, 고도profile과25km coarse satellite 분포로 밀도 변화. 공칭8e-6/m, optical depth 상한.55는 미감 조정값이다. 실제 기상 고도·농도를 재현한 값이 아니다.
- scatter: haze + dualHG 전방/후방 혼합,3octave (.5 계열 감쇠), 밀도 군집 출구까지6구간광학깊이. normal-facing 표면광 제거. RGB광량은 기존 exposure에 맞춘 근사다.
- 안개는 opaque ground depth / shell거리 / 국소 volume의 alpha가중 평균거리까지만 계산한다. 구름 premultiplied alpha를 풀어 안개를 적용한 후 다시 합성한다. 전체화면 blur나 스크롤 opacity fade가 아니다.
- 기존 custom 거리색 근사는 남아 있다. terrain의 기존 대기 효과 위에 얇은 별도 layer를 더한 시험이며, 물리적으로 통합된 atmosphere/volume transport가 아니다.
- Disney source, 높이/중심/XZ, 태양, 카메라, 지형1.5× 유지. 주 Intro 기본값 변경 없음. cloud-optics reviewRound에만 새 비교 UI와 초기 scatter 후보 적용.

## 통과 기준과 다음 순서
1. p.21–.29에서 별개 덩어리 경계가 줄고 밝은 윗면·작은 골이 동시에 유지되어야 한다. 안개가 단지 흐림으로 숨기면 약화/기각한다.
2. .18/.21/.235/.25/.27/.29 ×3 동일 camera/ready/context/size metadata와 실제 이미지를 비교한다. 전체 cloud traversal 또는 서고 연결 검증으로 확대 해석하지 않는다.
3. 정역 중 안개 출현점·밝기 펌핑·지형을 뚫는 구름이 보이지 않아야 한다. 시간 재투영이 없는 현 구조의 한계는 별도 유지한다.
4. 접합이 여전히 어색하면 광학 값을 반복 증량하기보다, 위성층과 VDB를 공통 density/light 통합 경로에 넣는 작업을 우선한다. 근접 해상도는 실제 필요한 subregion만 보완한다.
5. 안개 후보의 사용자 시각 판정 후 채택 여부 결정. 지형 그림자 보류/서고KEEP/실패2/2와 no-cloud·AI영상 대안 보존.

## 재현·권리·검증 한계
실행 화면의 ‘산란·안개’ 선택과18구도 저장. package-cloud-optics.py가 metadata 조건을 검사하고 gallery를 만든다. GPU 수치는 같은 PC의 짧은 순차 샘플이며 전체 FPS/정확한 overhead/전시PC 성능 증명이 아니다. VDB 원본·개인 첨부·영상 업로드 제외. Disney2017 CC BY-SA3.0 / Kevin Udy photo reference; D138 ATTRIBUTION과 변환 이력 유지.

## 실행 결과 [캡처][코드]
actual1280×720의6위치×3후보=18장이 준비되었고 같은p camera,ready/context,size 조건을 검사했다. .235에서 안개는 원경 대비를 누그러뜨리고 .29 scatter는 국소 군집의 밝은 윗면을 유지하면서 골의 음영을 바꾼다. 그러나 기존 높이장의 매끈하고 늘어난 면과 국소 source의 작은 골은 여전히 다른 재질처럼 보인다. 안개만으로 접합 해결·사진결 달성을 선언할 수 없다. 다음 우선순위는 공통 밀도·조명 합성 경로다. 새 source 확보보다 현재 optical chain의 불일치가 먼저 확인되었다.

정지 비교에는 TAA가 없고 상태가 결정적이므로 각모드3frame 준비+3frame 대기 후 저장했다. background 탭의 frame 진행 지연으로 처음60frame 방식 일부 저장 후 동일 값으로 재시작했으며 최종18장 모두 ready였다. GPU는3frame 수준의 극소 표본과 동시에 열린 lab의 영향이 있으므로 비용 비교 판정에서 제외한다. D139의30표본과 직접 비교하지 않는다. 영상/trace와 사용자 연속 동작 품질은 구별해 기록한다.

정역 영상은 로컬 생성되었으나 background 진행 제한으로 trace가 9개뿐이다 (p 범위0.18–0.2886). 따라서 출현점·깜빡임 없는 연속운동 통과 증거로 사용하지 않는다. 사용자가 실행 화면에서 확인할 수 있으며 영상은 진단용/로컬만 보존한다.
