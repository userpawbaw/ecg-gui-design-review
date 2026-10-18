# 최초 Story 브랜치의 컴퓨터·출력 기기·배경 에셋 추적

분류 RESEARCH / 읽기 전용 감사. F-108. 대상 `claude/r1-autopilot-recommended`, 확인한 불변 HEAD **bf16509ee7fe493404becef0b9a9b42a55a069b1**. 최초 서고 빌더 `62f0ef805deeaf768a31dfb309af6cc217749529`(2026-10-01)도 함께 확인했다. 브랜치 이름만으로 모든 시기의 화면을 같은 버전으로 취급하지 않는다.

사용자 최신 반응 `[대화]`: “ph ash가 제일 괜찮은 것 같고”, 권장 paint도 “나쁘지 않다”. PH ash **원본 조건** 선호로 기록한다. 이를 기존 flat15 조건의 선호나 실제 서고 기본값 교체 승인으로 바꾸지 않는다.

## 핵심 확인

**초기 컴퓨터와 ECG 출력 기기는 PH 모델이 아니었다.** 코드로 만든 베벨 없는 상자와 단색 재질이다. 배경·책상·주변 소품에 PH 재질/모델이 섞여 있었다. 이번 벤치에서 PH ash가 깨끗하다는 사실과 초기 기기의 낮은 형태 완성도는 모순되지 않는다.

아래는 registry 목록만이 아니라 실제 생성 호출과 GLB 재질을 대조한 결과다. [asset-evidence.json](asset-evidence.json)에 읽은 파일의 SHA·Git blob·원본 경로, 실제 모델 호출, 재질 데이터, 번호 확인 근거를 남겼다.

| 화면 요소 | 실제 에셋/재질 | 확인 근거 |
|---|---|---|
| 컴퓨터 본체·CRT·키보드(초기) | 자체 `PC_Case`, `CRT_Body`, `CRT_Back`, `CRT_Screen`, `Keyboard`. `beige_plastic` #d8cfba / roughness .5, `crt_glass` #12201c / roughness .15 | build_archive.py 443–450행. `box()`는 cube 크기·UV만 만들고 베벨을 추가하지 않음(141행). GLB에도 두 단색 재질 확인; baseColorTexture 없음 |
| 프린터처럼 보이는 출력 기기 후보 | 자체 `ECG_Device` 40×30×12 cm + `ECG_PaperOut` 20×18 cm + 철제 카트. 기기 본체는 같은 beige_plastic. 종이는 자체 ECG 격자 재질 | 455–461행. 별도 PH printer 모델 호출은 이 빌더에 없음. 사용자가 말한 프린터가 정확히 이 물체인지는 확인 안 함 |
| 책상 | PH [painted_wooden_table](https://polyhaven.com/a/painted_wooden_table), 1K glTF | 441행 `place()`와 실제 GLB 재질. PH ash를 바른 자체 책상이 아님 |
| 의자/스툴·탁상 조명·바인더 | PH wooden_stool_01 / desk_lamp_arm_01 / binder_notebook, 1K glTF | 442, 451–452행. 이후 chair/Story 교체물과 구분 |
| 서가 | 자체 기하 + PH [ash_veneer](https://polyhaven.com/a/ash_veneer) 2K | M_WOOD, Stack/BackShelf 생성 호출. 이번 벤치와 같은 자산 종류이지만 옛 glTF 패키지와 현재 PNG의 픽셀 동일성은 별도 미검증 |
| 사다리 | 자체 기하 + PH [walnut_veneer](https://polyhaven.com/a/walnut_veneer) 2K | M_DARK와 LadderStile/LadderRung. registry에 wooden_ladder가 있다는 이유로 그 외부 모델을 썼다고 하지 않음 |
| 벽·천장 | PH [painted_plaster_wall](https://polyhaven.com/a/painted_plaster_wall) 1K | M_WALL, BackWall/WallR/Ceiling. 원본 무늬가 있는 도장 벽이며 이번 자체 paint와 다른 입력 |
| 바닥 | PH [herringbone_parquet](https://polyhaven.com/a/herringbone_parquet) 1K, UV 3m 반복 | M_FLOOR / Floor. 큰 패턴·마모·광택의 영향은 ash 목재 판정과 별개 |
| 장식·보관 소품 | PH cardboard_box_01, wooden_crate_01, vintage_suitcase, drawer_cabinet, vintage_wooden_drawer_01, power_box_01, hanging_industrial_lamp | 실제 place 호출 11개 고유 모델에 포함. 1K glTF 사용. 빈티지·도장 마모가 있는 모델과 깨끗한 ash를 일괄 평가하지 않음 |
| 책·보관 상자·바인더 다수, 보·창틀 등 | 자체 반복 기하·단색 재질 | 모든 배경이 외부 스캔인 것은 아님. 바인더 대량 배치와 외부 binder_notebook 소품은 별개 |

불변 소스: [해당 HEAD의 서고 빌더](https://github.com/userpawbaw/ecg-gui-design-review/blob/bf16509ee7fe493404becef0b9a9b42a55a069b1/scripts/blender/build_archive.py#L423). 최초 10월 1일 빌더에도 동일 PC/ECG 상자 생성이 있었다.

## 당시 피드백과 후속 교체 이력

1. **10월 1일 초기 제작**: `62f0ef8`에 단순 PC/CRT/ECG 상자가 이미 있다. [기존 Cycles 정지 렌더](../r1-rigify-20261004/archive2/d4_desk_r2_clean.png)를 실제 열어 상자형 CRT·출력 기기와 마모된 책상·스툴을 확인했다. 이 PNG에 웹 WebP 압축을 원인으로 적용하지 않는다.
2. **10월 14일 사용자 지적과 상세 모델**: [7ba8908](https://github.com/userpawbaw/ecg-gui-design-review/commit/7ba8908cbe993b2d52a3cf64362a5c92deb1a0e9). `workstation-v1.py` 첫 주석이 사용자 “컴퓨터쪽 에셋들은 퀄리티가 왜 이렇게 낮지? … 구식 게임의 에셋같은 퀄리티”를 명시한다. 드라이브·통풍구·키캡·곡면 CRT·기기 노브/출력 슬롯을 만든 **자체 제작** 교체물이다. 외부 고품질 PH 컴퓨터로 교체한 것이 아니다.
3. **10월 16일 소품 세트로 변경**: `desk-corner-set.py`에 사용자 “컴퓨터는 빼고 소품으로 바꿔줘”가 기록돼 있다. 자체 베벨 책상·서랍장·액자·석고 소품과 절차 목재를 최종 색×빛으로 굽는다. 확인한 HEAD의 기본 Story는 이 경로다.
4. **현재 그 브랜치의 비교 경로**: `noise/noiseStage.ts` 60행의 `legacyDesk=1`이 10/14 workstation을 여는 조건이다. 기본은 desk_corner 세트이고 C방은 별도 경로다. HEAD에서 발견된 파일을 사용자가 처음 지적한 화면의 에셋으로 소급하지 않는다.

workstation 파일 실측: **557,820 bytes / 95 meshes / 9 materials / images 0**. 자체 단색 PBR 기하다. 마모된 외부 색상 텍스처를 이 기기에 적용했다는 증거는 없다. 확인한 HEAD는 WS_ecg 계열을 별도로 숨기는 코드도 있으므로 파일에 있다는 이유로 전부 화면에 보인다고 단정하지 않는다.

## 왜 이번 시험대와 달라 보이는가

| 차이 | 확인된 범위 | 해석의 한계 |
|---|---|---|
| 기하 완성도 | 초기 PC/기기는 베벨·개별 키·제어부가 없는 상자. 이번 시험대는 3mm 베벨/3 segments | 직접 확인한 차이. 예쁜 ash 재질을 상자에 적용하는 것만으로 기기 형태가 완성되지는 않음 |
| 입력 표면 | 옛 책상은 painted_wooden_table, 벽은 painted_plaster_wall, 바닥은 parquet. 이번 핵심 비교는 ash 및 자체 paint | 서로 다른 표면. old PC의 질감을 PH ash 원본 품질로 설명하면 잘못된 귀속 |
| 조명·톤·카메라 | 이번은 중성 월드·단일 면광원·AgX·exposure 0·정사영 두 시점. 옛 PNG는 전체 방의 난색 광원·반사·원근. 옛 웹은 별도 노출/채도·안개 | 같은 조건 비교가 아니므로 차이를 텍스처 하나로 단정하지 않음 |
| 표현 경로 | 옛 웹은 albedo×baked light; shell lightmap 2048, books/decor 정점 색 조명. 이번은 원본 normal/roughness 포함 Cycles | 원래 PBR 반응·빛의 공간 밀도가 다름. 베이크 자체가 저품질이라는 뜻은 아님 |
| 웹 배포 | 기존 archive.glb 9,853,368 bytes, 47 materials, 50 images. 패키징 상한 1024/WebP | 2K 파일명만으로 배포 2K라 볼 수 없음. 이 차이는 웹에 적용되며 옛 Cycles PNG의 직접 원인은 아님 |

**중요한 동일성 확인**: 최초 브랜치 HEAD의 archive.glb Git blob은 `90634d184e630f2dca9bc47871eecb9129dc0514`이며 현재 빛 브랜치의 파일과 동일하다. 따라서 F-106에서 검사한 50장(49×1024², 1×512²)·웹 GLB 분석은 이 브랜치에 실제 커밋된 같은 바이너리에 해당한다. 최신 r8/B2 Blender 스틸까지 같은 결과라는 의미는 아니다.

## 판정·확인 안 함

- PASS — 원격 HEAD와 최초 빌더/10월 14일 교체 이력, 실제 생성 호출, 동일 archive Git blob, 47재질과 컴퓨터 단색 재질, 후속 workstation 0이미지·95메시 확인. 원격 31 refs 재확인; 바뀐 원본 브랜치의 F 최대43도 새로 읽고 F-108을 사용했다(현재 빛 브랜치 최대107).
- 확인 안 함 — 사용자가 처음 본 정확한 커밋·URL·렌더 옵션/프레임, “프린터” 물체의 지칭 확정, 과거 downloaded glTF 원본의 현행 PNG와 픽셀 동일성, 각 장치의 유효 lightmap texel 수, 베이크/압축/노멀/광원별 기여율.
- 확인 안 함 — 과거 모든 버전 재렌더·웹 재현, 개선 모델의 최종 품질, 실제 장면의 PH ash 원본/자체 paint 적용 전후. 새 렌더나 코드 교체를 실행하지 않았다.
- 결론: **기기에는 형태 제작 문제, 주변에는 다른 표면 선택, 웹에는 별도 베이크·포장 경로가 겹쳐 있었다.** PH ash의 이번 결과가 좋다는 관찰과 양립한다. 각 원인의 비율까지 확정한 통제 실험은 아니다.
