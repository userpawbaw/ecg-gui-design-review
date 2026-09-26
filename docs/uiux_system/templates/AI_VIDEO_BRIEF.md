# AI 영상 브리프 템플릿 (VB-NNN)

`22_AI_VIDEO_SCROLL_PIPELINE.md` V2 단계 산출물. 사람이 읽는 부분(이 파일)과 기계가 검사하는 부분(`tools/video-qa/briefs/VB-NNN.json`)을 **같은 내용으로** 함께 만든다. 예시: `tools/video-qa/briefs/TEST-stand-in-pan.json`.

## 1. 한 줄 목적

> 예: "스크롤하면 카메라가 다락방 천창 아래로 천천히 내려가, 마지막 장면이 책장 위 모니터 정면에서 멈춘다(다음 섹션 UI와 match cut)."

## 2. 레퍼런스에서 가져올 것 / 가져오지 않을 것 / 입력 자료

| 가져올 것(원칙) | 출처 카드 | 가져오지 않을 것 |
|---|---|---|
| 예: 카메라가 한 방향으로 느리게 하강, 빛줄기 속 먼지 | REF-002 EFX-002-03 | 레퍼런스 화면·로고·구도 그대로 복제 |

**입력 자료 — 단계별 정책(`22` §11, D-025)**

| 단계 | 넣는 것 | 넣지 않는 것 |
|---|---|---|
| 재현 학습(REF 재현) | 우리 키프레임·블록아웃 렌더 | 레퍼런스 영상·캡처(정답지) |
| 적용(ECG·다른 프로젝트) | **우리 재현 결과 영상·스틸**(구도·카메라·속도 참고), 우리 사진·CC0 사진 | 레퍼런스 영상(비공개 탐색 시안에만 `derivative-draft`로 허용, 배포 금지). 레퍼런스 캡처는 스타일 참고 입력으로만, 첫 프레임 입력 금지 |

## 3. 구도 고정 — 키프레임과 가이드

| 항목 | 값 |
|---|---|
| 첫 프레임 이미지 | `keyframes/VB-NNN-first.png` (Blender/three 블록아웃 렌더, 또는 합성 스틸) |
| 마지막 프레임 이미지 | `keyframes/VB-NNN-last.png` — 다음 섹션 첫 화면과 이어져야 함 |
| 가이드 영상(선택) | Blender 회색 블록아웃 카메라 이동 렌더 → video-to-video 구조 가이드 |
| 카메라 이동 | 한 문장: "dolly down 1.5 m, constant speed, no rotation" |
| 렌즈·높이 | 예: 35 mm, 시작 눈높이 1.6 m |

## 4. 기술 사양 (JSON `acceptance`와 같은 값)

| 항목 | 요청 | 이유 |
|---|---|---|
| 해상도 | 1920×1080 이상 (전시 4K면 업스케일 계획) | 선명도 검사 |
| 화면비 | 16:9 + **overscan 여백 6 % 이상**(주 피사체 둘레를 비워 두고 더 넓게) | 마우스 시선(작은 회전)은 이 여백을 옮겨 만든다 — 진짜 회전과 오차 4.6/255(`22` §5.2). 세로 화면 크롭 여유 |
| fps · 길이 | 24 fps 이상 · 8–12 s | 스크롤 길이 대비 프레임 수(1 px당 1프레임 이하) |
| 단일 테이크 | 컷·장면 전환 금지 | scrub 중 점프 |
| 속도 | 일정 속도(ease-in/out 금지) | 불균일하면 remap으로 보정 가능하나 중복 프레임이 생김 |
| 노출·조명 | 고정(깜빡임 금지) | 밝기 flicker 검사 |
| 모션 블러 | 최소 | 멈췄을 때 흐린 프레임이 보임 |
| 코드로 얹을 요소 | 먼지·입자·흔들리는 빛을 **영상에 넣지 않기**(정지 생명감 층을 쓸 때) | 영상에 구워진 요소는 스크롤을 멈추면 같이 멈춘다(`22` §10) |
| 반복 (`idle=play`를 쓸 때만) | 끝 프레임이 첫 프레임 직전 모습 — 완전 반복, 회전·흐름처럼 위치가 없는 움직임 | 카메라 경로 영상에는 쓰지 않는다 |
| 세로 화면 | 중앙 9:16 안에 주요 피사체 | 모바일·세로 키오스크 |

## 5. 금지 요소

글자·로고·가짜 UI, ECG 파형·숫자(데이터 계약 — 파형은 코드로 canonical 데이터에서 그린다), 사람 얼굴, 레퍼런스 고유 브랜딩. 장면 안 모니터는 **빈 화면**(나중에 코드로 오버레이).

## 6. 생성 도구 프롬프트 골격 (영문 — 대부분 도구가 영어에 더 정확)

```
Single continuous shot, no cuts. [scene in one sentence].
Camera: [move] at constant speed, no rotation, no shake, [lens] lens.
Start exactly on the provided first frame; end exactly on the provided last frame.
[Application stage only] Follow the camera path, framing and pace of the provided reference video (our own render); change only [theme / materials / objects].
Leave empty margin around the subject (about 6 % on every side). [If a live particle layer will be added:] no dust, particles or flickering light.
Lighting: [fixed light description], constant exposure, no flicker.
Sharp focus throughout, minimal motion blur.
No text, no logos, no UI, no people. Screens in the scene are blank.
[aspect] with extra margin around the subject. [duration] seconds, [fps] fps.
```

## 7. 생성 기록 (사용자가 채움 — registry 출처로 들어감)

| 항목 | 값 |
|---|---|
| 도구·모델·버전 | |
| 요금제·약관(상업/비상업, 소유권) | |
| 프롬프트 원문 | |
| 입력 이미지·가이드 영상 | |
| seed·설정 | |
| 생성 횟수·선택 이유 | |

## 8. 사람 확인 항목 (자동 검사가 못 보는 것)

형태가 녹아내리는 물체(AI morphing), 글자·로고 생성, 금지 요소, 레퍼런스 분위기(빛·색·속도감) — `sheet.jpg` 12장으로 확인.
