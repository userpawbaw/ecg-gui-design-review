# B 실제 에셋 시험 — BG-B-03

2026-10-04 · D-059 / F-034 / CASE-007 · 실제GLB 장면, 최종 채택은 별도

[실제/임시 인체·그림자 비교](ECG_B_actual_assets_comparison_2026-10-04.png)

## 구현

기존 `body.glb`(Blender Studio base mesh, faceless 가공/CC0), `heart.glb`(HuBMAP HRA, CC BY4.0)을 직접 로드. 제품 `figure.ts`의 H5 vertex/fragment 원문을 서버가 추출해 재사용한다. 제품 원본은 수정하지 않았다. standing geometry에 slice가 없으면 높이축 링으로 대체하므로 seated v3의 bone-axis 링과 동일한 결과를 주장하지 않는다.

H5의 depth prepass/얇은 중심·밝은 윤곽을 유지. spike의 amber 심장 glow, 확대 구도에 맞는 투과 반경, opacity .8로 조정. uSunOn=0이므로 **인체 H5 표면의 실제 방 shadow-map 수광은 아직 미연결**. 인체 외형과 심장의 실제 geometry를 판단할 수 있으나 굴절/SSS의 물리 렌더가 아니다.

종이는 plane의 곡률, 양면 rough PBR, 반복 가능 종이 입자/격자 texture로 변경. 실제 spotlight+PCF shadow로 종이/벽/바닥의 수광과 차광을 시험. 최초 shadow acne를 normalBias .015/.02와 paper light11로 수정. bloom/볼륨/DOF/거울 바닥 없음. cart는 steel 재질/버튼을 보완한 자체 geometry이며 외부 완성 장비 asset으로 교체했다고 주장하지 않는다.

B3 전신, B5/B6 더 큰 인체+심장/오른쪽 종이. 파형은 앞쪽 z=.39에 두어 접힘 면이 선을 잘라먹던 문제를 해결. 심장 beat와 파형 R은 같은 t 예시이며 **실제 ECG 데이터/0dB/DSP 결과는 아니다**.

## 앞 단계 판단 정정

“에셋이 없다”는 판단은 잘못된 파일 검색 범위에서 나왔다. 실제 `prototype/v2/src/story/intro/assets/body.glb`, `heart.glb`가 이미 tracked 상태였다. 최초 임시 시험 자체를 실제 H5 평가로 바꾸지 않고, 부재 주장을 F-034에서 철회한다. 에셋이 없다고 보고하기 전에 registry의 processed 경로와 현재 소스 URL을 직접 확인하도록 보완.

## 검증

브라우저 Edge/agent-browser:39장 각1280×720. 씬별 p0/.2/.4/.6/.8/1 18장, 배경3모드9장, clay3장, 그림자off3장, B5 시간루프6장. 실제 asset 로드 상태와 p/t/camera/shadow를 `verification/b-actual-assets-20261004/states.json`에 저장. 브라우저 오류0. 원본 해시/출처는 `asset-provenance.json`. 실제 asset의 렌더 통계 32–136 calls, 241,974–454,094 rendered triangles(멀티패스 포함). FPS/전시PC 합격값이 아니다.

3차까지 자기 수정:1 그림자 acne/장비 수광,2 확대 구도/amber,3 심장 투과와 파형 가림. 이후 전체 구간 캡처. 같은 p/t의 actual/clay는 인체 차이만 비교하며 과거 버전 전체를 픽셀 그대로 재현한 대조가 아니다.

## 자체 판정과 후속 항목

| 부분 | 좋아진 점 | 남은 TUNE |
|---|---|---|
| 인체 | 실제 손/몸 윤곽, faceless 머리와 가슴 속 heart가 읽힘 | 링의 간격/명도, 흰 플라스틱 인상 여부는 사용자 판단 필요. H5 sun-depth 미연결 |
| B3 | 실제 인체를 중심으로 종이 곡률/뒤 거리 확인 가능 | 전경 종이가 아직 넓음. 이면을 얇게 밝히는 방향으로 수정 후보 |
| B5 | 이전 전신보다 가슴/심장 비중 증가. 파형 앞층 가림 해결 | 심장 더 단순한 윤곽 표현 여부, 종이와 선의 명도 대비/전극·lead 위치 정밀 정렬 |
| B6 | 곡면 종이와 뒤 격자/그림자 분리 | 이면보다 직사각 틈으로 읽힐 위험. 고정 축의 folding silhouette를 더 보여줄 필요 |
| 배경/장비 | shadow off/on 실제 비교, cart steel receiver | 완성 장비 asset/baked contact/배경 국소 밝기 TUNE. 추가 소품은 보류 |

완료: 실제 인체·심장 연결 및 재질/조명 시험. **전체TUNE**, 제품 story 통합/최종 후보 채택 아님. 다음은 이 actual 장면의 인체·종이·빛 인상 피드백을 해당 파트에 반영. 스캔은 기본 공간이 정리된 뒤 별도. A/C 목업·검토 트랙 유지.

결과 기반 제안: B3는 종이 전면을 더 밝히기보다 곡률 이면만 짧게 드러내기. B5는 beat 때 body 전체 발광 대신 심장과 전극 주변 작은 전달 사건에 집중. B6는 격자 전체 점등보다 접힘 끝에서 짧은 입력 조각을 등록. 이번 범위를 넘어 새로 구현한 사건은 아니다.

## 실행

저장소 루트에서 `npm run spike -- background-space` . 이미 실행 중이면 http://127.0.0.1:4196 새로고침. 실제GLB/H5가 기본이며 인체 select에서 임시모형, 그림자 checkbox로 같은 구도 비교 가능.

Heart credits: HuBMAP Human Reference Atlas 3D reference organ (heart, male), CC BY4.0, Visible Human Male/National Library of Medicine. Modified. 본문/프리뷰에 표기.
