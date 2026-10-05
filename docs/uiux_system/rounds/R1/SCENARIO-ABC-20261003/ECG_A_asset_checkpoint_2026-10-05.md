# A-P1 오르기 실제 자산 체크포인트
2026-10-05 · D-065 · **내부 자산 검증 / 전체 A-P1 미완**

## 제작한 것
- 기존 pinned body.glb에서 측정 골격/자동 가중치/두 관절 해석 해법으로 오르기 pose 생성.
- body_climb.glb: 52,782 vertices / 105,560 polygons / 약2.06MB. 불투명 검정 재질, 얼굴 디테일 없음, breath morph 유지.
- electrodes_climb.glb: 3전극 foam/snap 6개 mesh, 약35KB. 실제 posed skin raycast anchor.
- manifest.json: 서고 root/회전, 손발 단 높이, chest 변환에 따른 심장 위치, 전극 p/n, source SHA256.
- 기존 body/seated/heart/archive 파일은 그대로 보존. heart는 기존 GLB를 재사용하며 이번에 새 심장 모델을 만들지는 않았다.

## 내부 검증과 수정
12 PNG: orbit 0/20/40/60/75/90° 6장 + 양발/양손 및 손 측면 6장.
검증 자료: verification/a-climb-20261005/contact_review.json과 internal_contact_sheet.jpg.
1. 처음 낮은 발 목표가 limb reach를 초과해 pelvis 높이를 조정했다.
2. QA importer의 quaternion 모드에서 Euler z 값이 적용되지 않는 점을 수정하고 다시 렌더했다. 실제 asset geometry 문제와 구별한다.
3. 발바닥이 단에 겹친 모습 확인 후 ankle/sole offset을 조정했다. 마지막 근접값: 발2.14mm, 오른손5.48mm, 왼손7.29mm. 관절 target residual은 약0.0003mm 이하.
거리 체크는 표면에 가깝다는 뜻이며, 확실한 쥐기/발 전체 지지/비관통의 증거가 아니다.

## KEEP / TUNE / 미검증
KEEP: 후면에서 사다리 pose가 읽힘, 한쪽 무릎을 굽힌 대비, 기존 featureless head 유지, 전극을 피부 표면에 맞추는 anchor.
TUNE: 손가락이 단을 완전히 감싸는 형태, palm/sole 면의 비관통과 지지, 사다리/팔이 측면에서 가슴을 가리는 정도. orbit75°는 고정 품질 보증값이 아니며 실제 heart 카메라에서 조정한다.
미검증: 검정 body+심장 강조의 실제 렌더, 전체 서고 bake/sun-depth/volume/bloom, 배선·카트, ECG/heartbeat, runtime 성능과 목표 PC.

## 실행 환경과 재현
프로젝트 .tools/python311에 공식 Python3.11.9 embedded + bpy4.5.3 및 numpy1.26.4 구성. 시스템 Python을 변경하지 않았다. .tools는 gitignored.
bpy4.5.3은 Python3.11 전용([공식 패키지 정보](https://pypi.org/project/bpy/4.5.3/)). 처음 bundled3.12 설치 시도 실패 후 이 경로로 해결.
로컬 환경이 준비되어 있으면:
```
npm run model:a -- --verify
```
다른 PC는 Python3.11+bpy4.5.3 경로를 A_MODEL_PY로 준비해야 한다. runtime 파일 자체는 저장소에 배포하지 않는다.

## 다음 작업
손가락 grip/접촉 보완 → 검정몸·심장·전극·짧은 lead의 통합 → 고정 서고 조명/depth/volume → 카메라·ECG → 내부 on/off 및 정지 replay 검증.
이번 clay 자료로 사용자에게 품질 판정을 요청하지 않는다. 전체 A-P1 자산·재질·빛·후처리를 갖춘 장면이 피드백 결과물이다.

