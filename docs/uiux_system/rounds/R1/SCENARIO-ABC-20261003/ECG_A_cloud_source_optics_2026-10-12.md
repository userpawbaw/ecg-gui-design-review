# 구름 원본·광학두께 분리 비교 · D132

2026-10-12 · RESEARCH / IMPLEMENTATION · 오프라인 국소 에셋 시험. 실제 북유럽 씬 채택과 별도.

## 이번 권장 방향

사진 같은 결은 원본 공간 디테일과 빛의 전달을 함께 확인해야 한다. D131의 작은 warp를 반복하기보다 **기존06/별도08 × 밀도1/4**를 같은 조건에서 대조한다. 08에서 산란방향 .35/0도 독립 비교한다. density4는 실험값이며 실제 미터 단위로 환산한 물리 밀도나 최종 권장값이 아니다.

## 조사와 선별

- [JangaFX 공식 Free VDB](https://jangafx.com/software/embergen/download/free-vdb-animations): Cloud Pack 10 variations / 104MB 목록을 다시 확인. 로컬 확보 원본10개를 사용했다. 신규 고해상도 팩을 확보한 것은 아니다. 원래 조달/ZIP SHA는 `verification/a-cloud-vdb-20261006/acquisition.json`.
- [Blender Principled Volume 공식 설명 검색 결과](https://docs.blender.org/manual/id/4.4/render/shader_nodes/shader/volume_principled.html): density와 산란방향 anisotropy 역할 확인. 직접 open은402로 실패, 검색에서 반환된 공식본문으로만 역할을 확인했다. 이번 실제 실행버전4.5.3과 설명4.4의 차이를 남긴다. `.35→0`은 산란방향 대조이며 새로운 미세 density 형상 생성이 아니다.
- [Disney Cloud Data Set 공식 Readme](https://media.disneyanimation.com/uploads/production/data_set_asset/1/asset/Cloud_Readme.pdf):3GB 원본/1⁄2·1⁄4·1⁄8·1⁄16 VDB와 Hyperion/Mitsuba 예제 및 렌더 포함. 다음 신규 source 후보. 이번 다운로드/로드/재현은 하지 않았다. 공식 beauty 렌더가 우리의 실시간 결과라는 뜻도 아니다.

보유10종 조사:384²/최대32samples/ortho10, 동일camera65°, sun15°/energy6/sky.08/step.35/seed7/OIDN. 08은 갈라진 외곽·여러 덩어리의 연결이 비교 후보로 적합해 선택. 조사에서는10종 모두 넓고 매끈한 면도 보여, 08이 사진섬유결을 이미 만족한다는 판단은 하지 않았다. 다른 원본의 normalized 형상이 달라 source 비교를 해상도 하나의 변화로 해석하지 않는다.

## 제작 및 비교 계약

`scripts/assets/render-cloud-source-optics.py --survey` → 보유10종 조사.
`scripts/assets/render-cloud-source-optics.py --source cloud_08` → 새 native4장.
`scripts/assets/package-cloud-source-optics.py` → baseline 재사용/해시/크기검사/crop/검토페이지.

| 비교 | 원본 | density | g | 변화 |
|---|---|---:|---:|---|
| 기존 | 06 | 1 | .35 | D130 실제파일 재사용 |
| 광학두께 | 06 | 4 | .35 | 같은 grid/같은빛, 밀도만 증량 |
| 별도 원본 | 08 | 1 | .35 | source 형상만 교체 |
| 별도 원본+두께 | 08 | 4 | .35 | 08 내부에서 밀도만 증량 |
| 산란방향 | 08 | 4 | 0 | 밀도4 유지, g만 변경 |

native1024²/ortho5/camera65°/태양15°·energy6·angle.53°/sky.08/volume bounces6/step.35/seed7/OIDN/AgX/RGBA8. 최대96samples, adaptive=true/threshold.01로 픽셀마다 정확히96sample이라는 뜻이 아니다. source별longest bbox extent를7로 정규화하고 중심을 맞춤; 서로 다른 source의 카메라 픽셀 좌표가 같은 형상 위치를 의미하지 않는다. 같은06 또는08 내부 비교에서만 동일crop의 국소형태를 직접 비교한다. OBJECT volume space를 기록하며 D131에서 기각한65배보정 가정을 되살리지 않는다.

## 셰이더·후처리 검토

- 재질: 기존 white Principled Volume, emission/blackbody추가없음. density 및g만 해당조건에서변경.
- 조명: sun/sky 고정, 내부 volume 그림자와 multiple bounces. 지형 cloud shadow는 이번 시험 대상아님/사용자보류 유지.
- 대기: 독립 구름만 렌더. planetary veil/빛커튼/안개/먼지 없음.
- 색: AgX 고정, RGB sharpen/LUT/노출증량 없음.
- 선명도: OIDN와sampling고정. bloom/DOF/grain 없음. PNG의 partial-alphaedge grain은 별도남은품질항목.
- 비용: manifest의 offline seconds는 실제 정지asset시간. live frame시간/VRAM/LOD비용으로 환산하지 않는다. GPU kernel이 보고하는 memory도 전체runtimeVRAM예산이 아니다.

## 통과 기준과 후속

1. 같은 source에서 밝은 능선과 어두운 골이 더 읽히되 거친돌/흰날림/알파입자 증가가 없어야 한다.
2. 미세한 찢긴 외곽·섬유결이 1:1crop에 실제 있어야 한다. 단순 명암증가는texture gate통과가 아니다.
3. source/opacity/산란 조건을 분리하고 실패대안을 보존한다.
4. 결 gate를 통과한 후에만 위성footprint 안의 일부 군집으로 적용하고6구도/정역motion/near동일source인계를 검토한다.

현재web코드 변경없음. 지도seam/S1잔여,near인계,서고연결미완. 그림자보류/서고KEEP/과거실패2/2와fallback유지. 이번asset시험을새로운사용자피드백라운드통과로세지않는다.

## 결과와 판정

새 native4장과D130 재사용baseline1장, survey10장 완료. 모든native1024²/source·image SHA 확인. 같은06/08 내부에서 density1→4는 작고 둥근 능선과 어두운 골을 더 드러낸다. 따라서 이전의 흐릿한 면이 원본만의 문제라는 단정은 배제한다. 다만 강한광학두께는그늘을깊게하고일부단단한돌같은형태를강조하므로 **4배 그대로채택은보류**한다.

08 density4에서g.35→0은밝은면을조금더드러내지만여전히가는섬유결을새로만들지는못한다.08 원본교체만으로는06보다선명한결이확보되었다고할수없다. **TUNE: 명암가독성부분개선 / 사진결gate미달 / 실제web적용보류**. 기존팩내다른변형이나sampling증량반복보다Disney같은별도고해상도source와공식example 조건재현을다음진단으로권장한다. 특정source를확보/로드하기전품질을보장하지않는다.

[검토 페이지](../../../../../verification/a-cloud-source-optics-20261012/gallery.html) · `manifest.json` 실제렌더시간/조건 · `validation.json` alpha>.9 픽셀의displayRGB명도분위. 이명도수치는선형radiance나결품질점수가아니며density변화시opaque mask도달라지므로그자체로인과효과를정량확정하지않는다. 실제1:1crop을함께검토했다. source광학vs형상차이의영향을이번다섯조건밖까지일반화하지않는다.

PASS: native완료/크기/SHA/조건기록. CONDITIONAL: 제한된정지asset명암개선/TUNE. NOT VERIFIED: browser스크롤,실시간frame/VRAM,지리적patch/near인계,사용자채택. 본비교에서cloudsource를키우거나viewatlas프레임을섞는동작은없다.
