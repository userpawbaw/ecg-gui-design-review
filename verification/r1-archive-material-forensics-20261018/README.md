# 서고 텍스처 원인 분석 — 2026-10-18

판정: **파일·소스 분석 PASS / 원인별 시각 기여·신규 조달 샘플은 확인 안 함**. F-106.

상세 분석: `docs/uiux_system/rounds/R1/ANALYSIS-R1-ARCHIVE-MATERIAL-SOURCING-20261018.md`(저장소 루트 기준).

## 실제 확인 방법·값

- GLB의 JSON/BIN chunk를 직접 읽고 embedded image의 bufferView를 Pillow로 열어 형식·픽셀 크기·SHA-256을 확인했다. 이름이나 manifest 크기를 이미지 해상도로 대신하지 않았다.
- `archive.glb`: 9,853,368 bytes, embedded image 50장 = **1024² WebP 49장 + 512² WebP 1장**. 노멀 연결 재질 17개, roughness/metallic 연결 재질 17개.
- ash_veneer_nor_gl_2k, ash_veneer_diff_2k, ash_veneer_arm_2k, walnut_veneer_diff_2k도 실제 크기는 1024²다. package-archive.py의 1024 상한과 일치한다.
- 포함 painted_plaster_wall, painted_wooden_table, vintage_wooden_drawer_01의 알베도를 저장소 밖 임시 경로에서 직접 열어 변색·마모 무늬를 확인했다. 추출 이미지는 커밋하지 않았다. 최초 다운로드 원본과의 차이는 확인 안 함이다.
- archive.ts는 baseColor와 lightmap/vertex-light를 사용하고 원본 normal/roughness/metallic을 실시간 재현하지 않는다. 원래 노멀의 영향이 bake에 일부 포함됐을 가능성과 완전 bake의 품질 잠재력은 별개다.
- 기본/고품질 WaterBottle: **91,092 / 683,088 bytes**, embedded image 각 4장 = **1024² / 2048²**. 같은 해상도의 압축 품질 단독 비교가 아니다.

재현 가능한 파일 식별값과 이미지 메타데이터: [artifact-inspection.json](artifact-inspection.json). 추출·픽셀 크기 확인은 이번 실행 결과다. 실제 패키징·셰이더 소스는 읽기만 했다.

## 배포 산출물과 최신 정지 렌더의 경계

검사 대상은 기존 웹 `prototype/v2/src/story/intro/assets/archive/archive.glb`다. manifest의 sun energy는 11이고, 최신 r8/B2의 33 및 V1 카메라와 다르다. 웹 가공의 1K·PBR 생략 문제를 최근 Blender B2 JPG의 원인으로 확대하지 않는다. 최근 정지 렌더의 r6 flatten 처리는 별도의 소스 근거다.

과거 UV 면적/OIDN 얼룩 사례는 다락방 9월 감사에서 찾았다. 이 기록은 파이프라인 원인 후보를 설명하지만 현재 물체의 원인별 기여를 재측정한 결과는 아니다.

## 외부 조사

Poly Haven 라이선스 페이지, ambientCG 사이트/라이선스, CGBookcase, Poliigon, BlenderKit, Substance 3D Assets, Fab 등 **8개 HTTPS 요청이 모두 CONNECT 403**으로 실패했다. [vendor-access.json](vendor-access.json)에 요청 URL·관측 오류를 남겼다. 상품을 실제 검색/다운로드해 서로 비교했다고 주장하지 않는다.

원격 F 번호 조사: 31개 브랜치 중 최댓값 F-105 확인 뒤 F-106을 작성했다. [f-number-inventory.json](f-number-inventory.json)의 두 404 기록 경로는 앞선 D 조사에서 같은 SHA의 Git tree에 파일이 없음을 확인한 과거 브랜치다.

## 확인 안 함

- 새 Poly Haven 원본과 현재 포함 맵의 원본 대비 오차·원인별 열화율.
- 동일 해상도·카메라·맵의 압축 단독 비교, 화면 texel/pixel, 실제 web/Blender PBR 전후 렌더.
- 대체 조달처의 현재 상품·가격·해상도·개별 라이선스 및 공개 Git 배포 적합성, 샘플 품질 순위.
- 새 재질·소품 제작, shader 교체, 기본값 변경. 이번 분석에서는 원본 에셋·Story 소유 파일·r8/D-084를 바꾸지 않았다.

## 기록 검사

- `npm run records:check`: 150 F/D/O/R 기록 및 CASE/dialogue/provenance/entrypoint 검사 PASS(exit 0).
- `npm run playbook:check`: 카드 6개·여정 3개 PASS(exit 0).
- `git diff --check`: PASS(exit 0). 읽기 전용 파일 분석과 문서 갱신이므로 앱 빌드·렌더 검사는 새로 실행하지 않았다.
