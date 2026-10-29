# 원본고정 다락방 — 자체 제작 복제 (D-159)

사용자 “복제까지 계속 진행”에 따라 D-158의 **원본자료 분석 재생** 다음으로 실제 자체 모델/재질/UV/빛 굽기/웹 장면을 제작한다. 원본 파일을 옮긴 사이트 미러가 아니다. 레퍼런스: https://leoparpeix.com/ . 원본 카메라/배치 측정은 이전 [역설계](../r1-reference-attic-reverse-20261030/README.md), 제작 결정은 D-159.

현재 새 4K 베이크 계산 중. 자체 모델·clay/재질 정지 렌더는 완료했고 웹·공개 검증은 남았다. 아래는 검증된 범위와 남은 검사이며 최종 결과로 간주하지 않는다.

측정 단위 1을 1m로 취급한 제작 가정이며 실제 건축 실측값은 아니다.

## 제작과 출처 경계

- `kit-spec.json`: 분류한 347개 치수/자세, 자체 고정 palette. 책 199, 판재 122, 문/서랍 10, knob 10, 그림 3, 받침 2, 박스 1. 원본 718개 연결 조각을 718개 소품으로 해석하지 않는다.
- `scripts/blender/build_reference_attic_clone.py`: 새 cube/bevel/inset/book/flower/arch 기하, 새 UV, 자체 목재·직접 그린 herringbone, 별도 Cycles 조명. 제작 입력은 kit-spec뿐이며 원본 GLB/KTX/번들을 열지 않는다. 중간 blend·무손실 atlas는 `/tmp/ecg-authored-attic`에 둔다.
- 원본 베이크의 색에는 직접광/간접광이 섞였다. 최초 색계열 probe는 책을 rust에 편향시켜 **기각**했다. 최종은 선반 영역별 자체 색상 배분(seed159); 원본 albedo 복원/픽셀 전송을 주장하지 않는다.
- 그림은 새로 만든 꽃/화분 도형, 꽃 조형물은 새 타원체·곡선·다각면이다. 원본 그림/모델/UV/텍스처/코드/새 원본 캡처는 저장소·Pages에 넣지 않는다. Story/r8/D-084/기존 preview/light-study는 유지한다.

## Q0–Q5 검수

| 관문 | 현재 결과·증거 | 제한 |
|---|---|---|
| Q0 출처 | 자체 builder/고정 palette/측정 치수 구분 | 원본 Blender 재질/조명 rig 확인 안 함 |
| Q1 비례 | 수정 clay 정면/3/4/상층에서 사다리·선반·서랍·꽃·창 구성 시각 확인 | 원본 artwork/꽃 표면을 그대로 복원하지 않음 |
| Q2 기하 | `geometry-audit.json` 선택한 6개 부재 MECHANICAL_PASS. 판재3mm/책1–1.5mm bevel, 문 인셋8–20mm | 모든 부재의 manifold/UV 겹침 전수 확인 안 함; 잎은 의도적 열린 면 |
| Q3 재질 | 먼지/마모 없는 저대비 결, 자체 herringbone/책 색 배분 | 새 bake/압축/색공간 검수 대기 |
| Q4 실제 화면 | 1280×720 Cycles/clay | 웹12프레임 대기; 사용자 미감 확인 안 함 |
| Q5 통합/성능 | Story/default 불변 범위, 별도 페이지 설계 | 공개 배포/실제 GPU FPS 확인 안 함 |

첫 clay는 사다리 OBB 계산이 틀려 부재가 넓은 판으로 보였고 창 Boolean/닫힌 곡선도 실패했다. `clay-initial-fail.jpg`를 남겼다. 면 방향과 최소체적 직교 치수 측정, 컷터 법선, polyline 창틀로 수정해 두 번째 clay에서 확인했다. 최초 재질 렌더는 대비가 낮아 기각; 하층 key를 추가하고 팔레트·겹친 창살/그림틀을 보정했다. 첫 audit 호출의 책 이름 `-0` 누락은 검수 명령 오류로 정정했고 최종 `-1 pages`를 검사했다.

## 확인 안 함 / 원본과의 차이

원본 조명 rig/true albedo, 전체 라이브 사이트 compositor·cloud·dust·텍스트·포인터 완전 일치, 픽셀 동등성, 실제 Windows Edge/GPU/터치/FPS, 사용자 미감, Story 통합은 확인 안 함. 상층 clerestory 세부, 잎 곡면/돌 세분화, 일부 정체 불명 소품·끝단은 단순화/생략했다. 이 결과는 동일 카메라와 주요 공간·소품 구성을 새로 만든 복제 시안이다. 사용자 확인 전 최종 미감 합격으로 간주하지 않는다.

## 재현

환경: bpy 4.5.3 LTS, CPU 5 threads. 클라우드에서 builder `--stage clay`, 시각 검수 후 `--stage finish`, 검수 후 `--stage bake`. 새 PNG atlas를 WebP로 패키징한 뒤 `scripts/assets/stage-archive-web-preview.py`로 명시한 파일만 stage한다. 브라우저 재검수 도구는 `scripts/assets/verify-reference-attic-clone.py`이며 로컬/공개 URL을 받는다. 사용자 Windows 실행 지시는 이 문서에 제공하지 않는다.
