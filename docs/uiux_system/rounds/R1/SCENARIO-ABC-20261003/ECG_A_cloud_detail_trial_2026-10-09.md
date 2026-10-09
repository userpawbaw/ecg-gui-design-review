# D116 · 원경 구름 지역 해상도 대조 — 구현 전 결정

2026-10-09 / CASE-007 / D114·F080 후속 / 사용자 진행 승인

## 갈림길과 선택
새 volume 노이즈로 부족한 결을 덮는 방식 대신 접근 가능한8K cloud-only와 같은원본의2K대조를 사용한다. Solar System Scope 공식목록의8K 링크 확인, 직접shell403/브라우저download시간초과 후 Siqister/files 공개미러의 고정commit2ed70f6955b88070080e21067568c233a50856ec에서11619184bytes 파일확보. 공식응답크기와같고NASA2K와큰패턴일치관찰. 공식파일과암호학적동일성은미검증이며미러획득자료로표기한다.

## 제작 계약
같은DEM1.5×/태양/카메라/고정sourcePlacement. 원본8192×4096에서필요crop만R8지역texture로적재하고별도동일원본2Kglobal을fallback으로사용. 얇은/두꺼운기여·광량·법선gain은D114기준유지하여새자료기여를분리한다. trueheight/density재현이아닌연출proxy임을유지한다. 지형은새지형으로교체하지않는다.

## 검증과 되돌림
두고정구도×2K/8K지역비교,실제wheel정역/지역경계/자글거림을확인. 실루엣·빛이수정됐다고기존raymarch문제를해결했다고표시하지않는다. 자료가실제로더상세하지않거나새moire/patch경계가나면TUNE. 기존near그림자추가튜닝보류/서고·Story최종채택전상태유지. 첫gate는자료·해상도,광학/near인계는후속. D115 경험지식DB는별도작업이며해당미커밋내용을이번commit에포함하지않는다.

## 구현 결과 / 자체 판정
**TUNE.** 작은 군집·갈라진 가장자리 결은 늘었으나 납작한 리본 표현과 약한 부피 명암은 남는다. 이번 데이터 교체를 볼륨 구름 완성이라고 하지 않는다. 2K 대조는 기존NASA파일과의비교가아니라같은8K원본의Lanczos축소이다.

4native: p.18/.235 × global2K/region8K,1280×720,RTX3070. 카메라·sun·sourcePlacement·renderSize동일성을metadata로확인했다. GPUcontextLost=false/새runtimeerror없음. 8초 자동camera확대복귀영상 .18→.235→.18/456trace 저장·ffmpeg2초프레임decode 성공; 실제wheel영상아님. 이전D114942×672와현재1280×720성능은직접비교하지않는다.

구름 자료는R8로CPU배열검증 후GPU업로드,2048×1024global +4096×1536crop,LinearMipmapLinear/anisotropy8. cropUV(.375,.5625,.5,.375),경계5%smoothstep으로global fallback과섞는다. 고해상도전체RGBA/mips약170.7MiB 대신약10.7MiB **구름texture만**의계산예산. 전체GPU메모리/총로드비용실측아님. 현재lab에는이전연구자원로딩도남아있다.

고정4프레임GPUcomposer p50 약4.17–7.23ms/p95약7.50–9.35ms. 두자료는같은shader·resident texture라 차이를원본별필수비용이라고해석하지않는다. 새자글거림완전해결/장시간/타깃PC다양환경증거없음.

원본sha c792eca228989d36ebb45d3ea6ff1198be5e21a25d70d2fbcb2124ffd14ba7f5. 공식사이트/미러commit/파생과sha는assets/research/orbital-cloud-20261009/provenance.json. 비교verification/a-cloud-detail-20261009/gallery.html,manifest.json. 새영상은actualrendererpixels이고AI생성영상이아니다.

## 다음 단계
자료해상도gate는실제획득·대조까지수행. 다음은두꺼운군집의높이/tau자료와국소산란/그림자기여를별도대조하고,그후채택된분포를nearTakramvolume와정합한다. 이번volume통과/서고연결미구현,main/Story미교체. 사용자룩KEEP미확정,near그림자추가튜닝보류유지. 과거구름제작2/2실패/fallback결정은그대로보존하며이번내부시험은새사용자피드백횟수로세지않는다.

최종검증: Vite81 modules PASS / diffcheck PASS / 격리된 HEAD+이번D116/F081/O023 기록snapshot251 PASS. 별도D115미커밋기록과경험DB는검사·commit범위에서제외하고보존. 브라우저사진4/4 1280×720,영상readyState4/errornull/7.971초로확인·탭유지. 정착/8초증거로자글거림완전해결·전체구름룩채택을주장하지않는다.


## D117 다음 순서 갱신
사용자 지형 사각 경계 TUNE 추가. 다음 실행 순서는 S0 원인 분리→S1 지형 접합→구름 광학·동일 footprint 전이이다. [세부 작업·통과 기준](ECG_A_surface_cloud_next_gate_2026-10-09.md)을 먼저 따른다. 이번은 계획/페이지 복구이며 새 rendering 수정은 미착수.
