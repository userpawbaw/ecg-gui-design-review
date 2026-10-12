# Disney 국소 구름 atlas 궤도 시험 — D135

## 권장안과 통과 기준
기존 위성 분포는 유지하고 확대 목표 근처 두 군집에만 원본 VDB에서 직접 렌더한 fixed-light atlas를 추가한다. 원경/중간/지역 확대 p.18/.21/.235에서 같은 지형·카메라·광원·전처리의 OFF/ON 대조. 고정 footprint, 불투명 사각 배경 없음, 카메라에 따른 새 군집 pop 없음, 명암/형태가 orbit scale에서 읽히는지 검토. 무늬 반복/각도혼합 ghost/평면감은 TUNE로 남긴다.

## 실제 제작과 한계
- Disneyquarter source,45/32/20도 orthographic 관찰각 native3장.
- Cycles4.5.3 / OptiX, max96adaptive / OIDN, total/volume 상한128, step.35, density4, HG.877/albedo1.
- 태양 방향은 north lab curtain15도/azimuth0에 대응하는 source Y-up towardLight (0,.258819,-.965926). radiance는 번안된 RGB이며 실제 atmosphere 스펙트럼/밝기와 동일물리단위 검증 아님.
- 원본 단위를 실제 km라고 주장하지 않음. runtime 군집 scale/centre는 연출 배치.
- 1024×768 RGBA3장, native해시를 그대로 복사. nominalRGBA8+mipmap12MiB는 단순 계산으로 GPU 전체 VRAM 실측 아님.
- diffuse floor의 카메라 visibility를 끄되 간접광 참여는 유지. 최초 바닥 포함 native3장/rejected-floor 보존 O026. film_transparent만으로 receiver가 사라지지 않는다.
- 런타임은 camera-facing billboard impostor이며 실제3D volume 아니다. angle crossfade는 premultiplied 색으로 혼합; 3각도와 선형/mipmap filter. cloud 실루엣/중심을 정확한 깊이로 복원하지 않는다.
- 고정light RGBA의AgX를다시tone하지않도록 tone mapping 이후 합성. sRGB→linear decode. 원경 haze opacity는 연출근사, 물리대기산란 재현 아님.
- camera azimuth가 bake의0도와 다르므로 시점별 실제sun-self-occlusion 재계산이 아니다. 확대 경로의 좁은 범위 시험.
- p.245~.285에서 연속 fade 제거. 기존nearvolume과 동일cloud의3D 인계라고 주장하지 않음. 근접 통과/groundshadow는 보류 및 별도gate.
- opt-in disneyAtlas=1로lab만수정; 주 도입부는 미채택.

## 출처와 사용 단계
Copyright2017 Disney Enterprises Inc, CC BY-SA3.0 / 원형사진 Kevin Udy. 내부시안용. 출품전환시사용/대체재검토. SourceZIP/VDB/제작사beauty/개인첨부 업로드제외. 직접native/runtimecode/기록은사용자가승인한기존branch범위.

## 검증 범위
alpha외곽0/원본·native·runtime hash/Pythoncompile통과. Vite build는sandboxrealpathEPERM후호스트재실행PASS. build가shader/runtime/미감PASS를뜻하지않으므로실제브라우저8구도와정역스크롤검토증거를추가한다. 이전서고KEEP/그림자보류/실패2/2유지.

## 적용 결과 / F100
첫별개join의푸른탑은높이.28압축과중립주변광의결합튜닝으로완화. 최종source의밝은작은굴곡과그늘이실제지역확대의두군집에서읽히지만,회색면/독립덩어리감과주변위성층에대한정합은남는다. **사용자검토전TUNE**,사진reference급미세결완료/최종채택주장금지.

- native최종3장,기각floor3/tower3;최종runtime8,기각towerRuntime8.
- 고도압축·주변광·footprint규모를함께튜닝했으므로각변수의단독원인분리대조는아니다. cloudgrid원본hash는유지.
- 이결과는실제opt-inlabcode가GPU로합성한화면. 정지mockup이나합성편집이미지가아니다. 그러나runtime3Dvolume은아니며고정빛impostor와좁은카메라경로의시험이다.
- 실제휠하강/상승입력을CUA에서보냈고진행슬라이더방향전환/휠상태를확인. wheel-forward/reverse.png보존. 전체연속영상의자글거림·ghost·인계품질은끝까지프레임별분석하지않았다.

### GPU 진단 / 현재 로컬 브라우저1280×720
| p | atlas | composer p50 | 유효 표본 |
|---|---|---|---|
| 0.18 | off | 4.38 ms | 24 |
| 0.18 | on | 5.27 ms | 24 |
| 0.21 | off | 5.32 ms | 24 |
| 0.21 | on | 5.23 ms | 24 |
| 0.235 | off | 4.99 ms | 24 |
| 0.235 | on | 5.22 ms | 24 |
짧은24표본의동일구도OFF/ON진단만이다. 표본편차가있어정확한passoverhead/FPS제한을확정하지않는다. bakedtexture명목12MiB와총VRAM은구별. source원본render시간은native/manifest.json의seconds;runtime프레임예산과구별.

### 다음 단계 / 통과 조건
우선새구름두군집의위치·규모·주변흰층색정합을사용자가검토. 유지시고정footprint를위성분포에연결하고대조구도에서독립스티커감이줄어드는지확인. near로통과시키는3D깊이/같은cloud인계는별도trial;atlasfade만으로전환완료선언금지. source보고서의사진결gap및그림자보류/서고KEEP/실패2/2유지.
