# 빛 커튼 가독성·일렁임 조사 (2026-10-21)

D-152 / `docs/uiux_system/rounds/R1/PLAN-R1-ARCHIVE-CURTAIN-MOTION-20261021.md`.
**조사와 추천 설계만 완료했다. 새 runtime/시각효과 구현·렌더·배포 없음.** 기존 공개 페이지와 Story/GLB/default는 보존한다.

## 확인한 값

현행 bdf963a source의 HG g=.5는 같은 경로의 위상항이6 / .536656 / .222222(광원쪽/측면/반대), 최대비27배다. 대안 g=.15의 최대비는약2.4766배. 이것은 **수식 계산**이며 장면의 밝기측정이 아니다. 가림·경로길이·톤매핑이 다른 실제시점의 대비를 대신하지 않는다.

현재 sigmaT=.012/m에서 균질5m/10m 투과율94.18%/88.69%. 후보 .025/m의10m투과율77.88%, .045/m은63.76%. 실제장면의fade/noise를 제외한 계산이다.

현재 frozen=true, grain=.15이므로 이론density배율 .85~1.15, 움직임은noise축 .01unit/s÷3unit/m=약3.33mm/s. 큰밀도띠의변형/회전/구름mask가아니라단일축의느린이동이다.

`analytic-metrics.json`에 계산값, `source-probe.json`에HTTP/원문hash, `remote-number-check.json`에원격번호근거. D-151은Story브랜치사용중이라D-152를사용했다. PBRT공식source2파일과Bridson2007논문은HTTP200로읽었고/tmp에만보관한다. PBRT book/Unreal문서403은읽지않음으로표시했다.

## 추천과 이유

넓은시점산란/광학두께를먼저비교하고,표면과volume이공유하는느린cloudmask와world-space큰밀도흐름을추가한다. 햇빛은직선으로두고밝은밀도띠가일렁이게한다. 강도/bloom만으로해결하면각도편차가남고장면대비가낮아질수있다. emissive오로라는별도시안후보이며햇빛으로속여합치지않는다.

## 확인 안 함

새방식의실제이미지·미감·3시점가독성·책장대비·시간축12프레임·GPU/FPS·숨김/정지복원·CloudMask표면동기화·closed천창가림·모바일·Cycles일치. g/밀도/flow후보는채택값이아니다. 추천설계가실시간품질·성능개선의실행증거는아니다.
