# AI 영상 브리프 템플릿 (VB-NNN)

`22_AI_VIDEO_SCROLL_PIPELINE.md` V2 단계 산출물. 사람이 읽는 부분(이 파일)과 기계가 검사하는 부분(`tools/video-qa/briefs/VB-NNN.json`)을 **같은 내용으로** 함께 만든다. 예시: `tools/video-qa/briefs/TEST-stand-in-pan.json`.

## 1. 한 줄 목적

> 예: "스크롤하면 카메라가 다락방 천창 아래로 천천히 내려가, 마지막 장면이 책장 위 모니터 정면에서 멈춘다(다음 섹션 UI와 match cut)."

## 2. 레퍼런스에서 가져올 것 / 가져오지 않을 것

| 가져올 것(원칙) | 출처 카드 | 가져오지 않을 것 |
|---|---|---|
| 예: 카메라가 한 방향으로 느리게 하강, 빛줄기 속 먼지 | REF-002 EFX-002-03 | 레퍼런스 화면·로고·구도 그대로 복제 |

레퍼런스 영상·캡처를 **생성 도구에 입력으로 넣지 않는다.** 원칙을 글로 쓰고, 구도는 우리가 만든 키프레임으로 준다(저작권, AGENTS.md "Never copy reference sites' assets").

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
| 화면비 | 16:9 + **overscan 여백 6 % 이상**(더 넓게 생성 후 크롭) | 마우스 시선 이동·세로 화면 크롭 여유 |
| fps · 길이 | 24 fps 이상 · 8–12 s | 스크롤 길이 대비 프레임 수(1 px당 1프레임 이하) |
| 단일 테이크 | 컷·장면 전환 금지 | scrub 중 점프 |
| 속도 | 일정 속도(ease-in/out 금지) | 불균일하면 remap으로 보정 가능하나 중복 프레임이 생김 |
| 노출·조명 | 고정(깜빡임 금지) | 밝기 flicker 검사 |
| 모션 블러 | 최소 | 멈췄을 때 흐린 프레임이 보임 |
| 세로 화면 | 중앙 9:16 안에 주요 피사체 | 모바일·세로 키오스크 |

## 5. 금지 요소

글자·로고·가짜 UI, ECG 파형·숫자(데이터 계약 — 파형은 코드로 canonical 데이터에서 그린다), 사람 얼굴, 레퍼런스 고유 브랜딩. 장면 안 모니터는 **빈 화면**(나중에 코드로 오버레이).

## 6. 생성 도구 프롬프트 골격 (영문 — 대부분 도구가 영어에 더 정확)

```
Single continuous shot, no cuts. [scene in one sentence].
Camera: [move] at constant speed, no rotation, no shake, [lens] lens.
Start exactly on the provided first frame; end exactly on the provided last frame.
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
