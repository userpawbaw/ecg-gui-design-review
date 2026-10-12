# Disney 동일 원본의 샘플·광학 깊이 비교 — D134

## 권장안과 통과 기준
같은 source에서 fixed sampling32/128, scattering ceiling64/128을 각각 분리해 비교한다. 노이즈 제거 전후를 같은 경로 샘플에서 보존한다. 밝은 윗면과 골의 대비, 작은 윤곽, 표면의 자연스러운 결을 함께 본다. 노이즈 감소를 새로운 원본 디테일로 판단하지 않는다. 이번 시험으로 실제 북유럽 씬의 품질이나 움직임 통과를 선언하지 않는다.

## 실제 조건
- Disney quarter VDB, 원본 해시는 manifest 참조. source 자체 변경 없음.
- Cycles4.5.3 LTS / OptiX GPU, 1024×554, seed7, stepRate.35.
- FOV27°, display exposure+1EV, density4, HG.877, white albedo1.
- 원형 XML 좌표를 유지하고 Blender import X90° 자동 회전 복원.
- 고정 샘플: adaptive sampling OFF. D133 adaptive96은 참고이며 이번32/128 쌍에 끼워 수렴을 주장하지 않는다.
- 새 native3장, 같은 렌더의 noisy pass3장. noisy pass를 새 독립 렌더로 세지 않는다.
- 상한은 실제 모든 경로의 산란 횟수와 다르다. 128의 상한 증량은 재산란/밝기 진단이며 WebGL 권장 설정이 아니다.

## 근거와 접근 한계
- Disney 제공 README/XML과 원본 획득/CRC/hash는 D133 보고서와 acquisition.json에 보존.
- 공식 Blender 검색 결과의 sampling 설명: adaptive sampling은 노이즈가 낮은 부분을 일찍 종료한다. 그래서 원인 비교에서 두 후보 모두 OFF로 고정.
- 공식 검색 결과의 volume 설명: 산란 상한은 single/multiple scattering에 관계한다. 픽셀 표본수와 별개로 비교.
- 공식 매뉴얼 본문은 web402 / 직접HTTP403으로 접근 실패. 검색 발췌를 읽은 범위를 명시하며 본문 전체 검토로 기록하지 않는다.
- https://docs.blender.org/manual/en/4.4/render/cycles/render_settings/sampling.html
- https://docs.blender.org/UATEST/manual/en/dev/render/materials/components/volume.html
- https://developer.blender.org/docs/release_notes/5.0/cycles/ 검색 결과에 null-scattering 변경이 확인되나 이번4.5환경에 적용하거나 버전 비교하지 않았다. 후보 가능성만 유지.

## 출처와 사용 단계
Copyright2017 Disney Enterprises Inc, CC BY-SA3.0 / 모델 reference Kevin Udy. 직접 렌더한 결과와 제작사 제공 beauty를 구별한다. 이번은 내부 시안이며 출품 전환 시 사용/대체방식 재검토. ZIP/VDB/원형beauty/personal media는 업로드 제외. 사용자 승인된 동일 branch에 코드/직접 렌더/기록만 업로드.

## 남은 검증
공식 Hyperion/Mitsuba 원형 reproduction, 무한 깊이/Russian roulette 수렴, 광학 단위/스펙트럼 equivalence, 사진섬유결, geographic patch, 동일 footprint 거리별 인계, TAA 움직임/역스크롤/성능/VRAM/목표PC는 미검증. 그림자 보류/서고KEEP/실패2/2 유지.

## 실행 결과와 판정
D134: 동일 Disneyquarter source에서 fixed32→128 samples는 작은 골·윤곽 보존을 조금 개선했으나 사진섬유결 확보는 미달. fixed128의 b64→128은 더 밝고 부드러운 면을 만들었으며 깊이 상한이 아직 결과에 영향을 준다. 따라서 광학 수렴 완료로 선언할 수 없다. noisy pass의 점들은 여전히 노이즈가 많고 source detail로 세지 않는다. native3장+같은 경로 noisy3장, 실제 web 미변경/TUNE.

| fixed samples | total/volume 상한 | render+compositor 시간 |
|---|---|---|
| 32 | 64 | 61.71초 |
| 128 | 64 | 238.49초 |
| 128 | 128 | 402.16초 |

원본을 눈으로 확인한 정지 비교: 32에서는 몇몇 작은 골이 뭉치고128은 일부를 보존한다. 128bounce는 같은128samples에서 윗면과 그늘을 밝게 만들어 전체 면이 부드럽다. 목표 reference의 섬유처럼 찢어지는 결은 아직 부족하며, 더 하얗다는 이유로 texture 통과라고 판정하지 않는다.

표시 RGB 평균절대차이는 sampling쌍 .007779, depth쌍 .046774. 동일 AgX/+1EV와 배경 합성 전체 frame 진단값이다. 선형 radiance 수렴, 구조 유사도 또는 미감 점수가 아니다. 64→128이 아직 평균 표시와 명암을 바꾸므로 완전 광학수렴 증거가 없다. 단일seed/유한samples 비교이며 독립 반복 표본의 신뢰구간 미측정.

판정: **정지 진단 PASS / 사진결 TUNE / 사용자 채택 전 / 실시간 미검증**.

### 다음 단계
샘플·depth 수치를 계속 증량해 사진결을 해결한다고 가정하지 않는다. 현재 b128 결과를 채택 전 후보로 유지하고, 같은 source를 실제 궤도 화면의 구름 크기와 빛 방향에 맞춘 소형 국소 atlas로 시험한다. 확대 주변의 명암/결/footprint와 거리별 인계는 따로 검토하며, 근접 사진결·완전 광학수렴은 TUNE로 남긴다.

패키징 Python311에는 Pillow가 없어 첫 실행 실패했고 시스템 python alias도 실행 불가했다. 기존 공식 bundled Python으로 재실행하여 해결. 렌더파일 손실/재렌더는 없었다. packaging/runtime dependency를 분리 기록한다.
