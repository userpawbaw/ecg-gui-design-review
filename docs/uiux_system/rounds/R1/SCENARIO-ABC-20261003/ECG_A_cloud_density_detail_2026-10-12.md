# 작은 구름 형태·외곽 결 시험 · D131

2026-10-12 · 실제 VDB 밀도 변형 / asset-level TUNE. 북유럽 web renderer는 변경하지 않는다.

## 권장과 이번 범위

큰 VDB 조형을 유지한 채 낮은 밀도 영역을 조금 재배치한 후보를 비교한다. **선명한 섬유 결 목표를 달성했다고 선언하지 않는다.** 이번 목적은 작은 형태를 추가하는 실제 밀도 변경 경로를 확보하고 기존/돌기·골/방향성 결을 동일뷰에서 비교하는 것이다. 흰 면의 광학 표현·더 선명한 원본·거리에 따른 identity는 별도 남은 항목이다.

## 시도와 변경 이력

1. `preview/`: shader noise로 낮은 밀도 외곽을 침식(.022, mask d/.18). 일부 얇은 부분이 감소하지만 세부형태 효과가 약함. 384²/최대16 samples. 기각/보존.
2. `preview-round2/`: 저밀도 mask d/.30, noise contrast .36–.64, gain .2–2.0 및 anisotropic noise. 같은 큰 형태에 밀도값만 바꾸는 것으로는 preview에서 세부 효과가 충분하지 않음. 기각/보존. 이 낮은해상도 preview로 native에서의 모든 차이를 부정하지는 않는다.
3. `preview-round3/` 및 최종: **원본 density를 변위된 좌표에서 다시 읽는 native VDB**를 만든다. 세부 field deformation을 렌더에서 직접 사용. 이미지/RGB sharpen이나 검은 골 색을 그리는 방식이 아니다. 추가 자체 튜닝 라운드는 이 단계에서 종료한다.

## 실제 제작 방식

`scripts/assets/prepare-cloud-density-detail.py`: native OpenVDB13 + NumPy. cloud06의 source grid를 읽고 seed615의 3D value-noise 변위로 원본을 trilinear 재표본화한다.

- 원본 active bounds `(47,117,11)→(356,571,163)`, 310×455×153. grid voxel1은 source 좌표 단위이며 실제1m라는 주장은 하지 않는다.
- 중간 결: 14voxel noise cell, 최대 축별5voxel 변위. source density가 .22 이상이면 core 보호.
- 방향성 결: cell `[24,8,6]`, 축별 amplitude `[4,2,2]` 추가. Houdini의 curl/wispy node 그대로 구현한 것은 아니다.
- original density/.018 support로 큰 빈틈과 분포를 유지. 원본 범위 밖에 새 솜털을 생성하는 방식은 이번에 지원하지 않는다.
- 밀도 합 비율은 billow **.99567**, billow-wisp **.99279**. 거의 같은 총량이라는 진단 수치이며 개별 광학두께/완전히 같은 윤곽/품질 보장은 아니다.
- 변환/원본파일/SHA를 보존. 새 VDB는 원본과 다른 파생에셋이며 preparedDensity SHA로 구별한다.

## 잘못 일반화하지 않은 점

원본 좌표 크기와 normalize 길이7의 차이로 opacity가 감소했는지도 점검했다. 실제 Blender volume render space의 factory readback은 **OBJECT**다. [공식 volume 도입 설명](https://developer.blender.org/docs/release_notes/2.83/volumes/)은 object/world density space를 구별한다. 따라서 '축소했으니 밀도를 약65배 올려야 한다'는 가정을 채택하지 않았고 그런 trial도 실행하지 않았다. source index 단위와 실제 cloud kilometre도 혼동하지 않는다.

OpenVDB Python Transform에는 `.copy()`가 없어 첫 변환 실행이 중단되었다. 원본 transform을 새 grid에 설정하고 원본을 변경하지 않는 방식으로 수정 후 두 출력이 완료되었다. 원본 grid와 달리 새 density source를 생성했다는 기록을 유지한다.

## 동일 구도 렌더

`render-cloud-texture-probes.py --density-audit --density-fields`: cloud06 / camera65° / 태양15° energy6 / sky.08 / max96 / adaptive=true .01 / OIDN / step.35 / volume bounces6 / seed7 / 1024² ortho5 / AgX RGBA8. 새 candidate도 **원본 bbox를 기준으로 scale/center를 고정**한다. 파생 grid의 bounds 변화 때문에 구도가 움직이지 않게 한다.

baseline은 D130 step.35 ON 이미지와 SHA를 그대로 재사용. modified 두 후보만 새 렌더한다. 실제 재렌더baseline이라고 표기하지 않는다. 전체구름2K가 아닌 close crop이며 같은 normalized 물리 크기다.

[검토 페이지](../../../../../verification/a-cloud-density-20261012/gallery.html) · `density/manifest.json` 조형/원본 해시 · `manifest.json` 실제 native 렌더 및 시간.

## 판정 기준과 남은 작업

native의 동일 crop에서 작은 돌기/골/찢긴 외곽이 읽혀야 한다. 불규칙한 모양이 늘어도 점 noise·돌 같은 면·흰날림이면 TUNE/REJECT. 사진의 부드럽고 선명한 섬유와 원경 대륙 규모의 얇은 띠는 별도로 요구한다. 국소에셋을 만들었다는 이유로 기존위성층을 전부교체하지 않는다.

이번 실제 web/GPU frame time/LOD·motion/하강 인계 증거 없음. 그림자보류·서고KEEP·실패2/2/fallback을 유지. 다음은 이 source 후보의 결을 검토한 뒤, 필요하면 더 선명한 별도 소스와 광학표현을 비교하고 그 후 같은 footprint의 국소층에 적용한다.

## 최종 관찰과 검증 범위

새 native 두 장은 약151/156초. 기존 baseline은 D130 파일 그대로다. 작은 윤곽·골은 달라지지만 선명한 섬유 결의 개선은 제한적이며 두 native 후보의 차이도 작아 **TUNE / web 적용 비추천**이다. 낮은 해상도에서는 작은 변화가 더 가려지므로 preview만으로 확정한 결과가 아니다. 큰 회색 면과 밝은 alpha 가장자리 입자가 남는다. 이번 warp를 더 과장하는 것보다 별도 원본 결과 optical scattering을 대조할 필요가 있다.

OpenVDB13의 출력 file version225를 Blender에서 읽을 때 supported≤224 경고가 나타났다. 별도 실제 load check는 `is_loaded=True`, `error_message=''`, density/FLOAT, spaceOBJECT. 렌더가 진행되고 비교 이미지가 나온 것은 확인했지만 경고 없는 호환성으로 표기하지 않는다. 추후 web용 변환에서는 원본 numeric grid와 경고 없는 포맷 지원을 별도로 검사한다.

파생 VDB는 로컬 작업 에셋이며 이번 작은 기록 패킷에서는 준비 스크립트·원본/파생 hash·manifest·렌더 결과를 보존한다. `.vdb` 바이너리를 Git에 포함하지 않았다면 다시 생성하려면 보유 원본과 native OpenVDB runtime이 필요하다. 실시간 압축/업로드 예산은 미측정이다.
