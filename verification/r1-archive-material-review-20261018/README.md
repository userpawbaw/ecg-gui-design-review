# 서고 재질 원본·동일 조건 비교 — 2026-10-18

분류 RESEARCH / 독립 재질 벤치. D-142를 구현 전에 기록했다. **서고 최종 장면의 채택·웹 적용 검증이 아니다.** r8/D-084와 Story 파일은 변경하지 않았다.

## 이번에 실제로 한 검토

- Poly Haven `ash_veneer`, `painted_plaster_wall`; ambientCG `Wood051`, `Plaster006`, `Wood095`, `Paint004`; CGBookcase `Wood01`, `Wood05`의 공식 2K PNG 원본을 받았다. 모두 CC0 표기를 확인하고 registry에 test-only로 추가했다.
- PH 6개 PNG는 API의 MD5와 일치한다. ambientCG/CGBookcase ZIP은 HTTPS 공식 다운로드와 ZIP CRC 확인 뒤 SHA-256을 고정했다. 공급처가 서명한 SHA로 인증했다는 뜻은 아니다.
- 다운로드 URL·용량·SHA-256·개별 PNG SHA·출처·저자·라이선스 근거는 [sources.json](sources.json). 원본은 ignored `assets/source/material-review/`에만 둔다. 레퍼런스 사이트 에셋·코드는 사용하지 않았다.
- [source-albedos.jpg](source-albedos.jpg): 원본 색상 맵 8종. [wood-comparison.jpg](wood-comparison.jpg) / [wall-comparison.jpg](wall-comparison.jpg): 자체 제작 시험대의 정면·사선 비교. 패널 → 선반 → 구의 반응을 같은 행에서 본다. 시트는 열람용 축소 JPEG이며 압축 수치는 이 JPEG로 측정하지 않는다.

## 비교 조건과 재현

`scripts/blender/material-bench.py`의 11조건 × 2시점. 공통 패널 1.15×1.2 m, 깊이 8 cm, 선반 40 cm, 베벨 3 mm/3 segments. 면의 주축 UV는 1회/m로 통일하고 구는 기본 구면 UV를 쓴다. 공급처의 권장 물리 반복 크기로 각각 맞춘 결과는 아니다. 항목별 원래 색도 그대로 유지하므로 공급처 간 밝기 순위를 품질 순위로 쓰지 않는다.

- bpy 4.5.3, Cycles CPU 4 threads, 640², 48 samples, seed 142, denoise ON.
- 중성 월드 0.35, 면광원 350 W/직경 0.9 m, 동일 위치. 정사영 카메라 두 위치와 화면 폭 1.7 m 고정.
- AgX / Medium High Contrast / exposure 0. 기존 서고 r8의 조명·톤 재현이 아니다.
- sRGB Base Color, Non-Color GL normal·roughness. PH flat15는 색상 85% 단색 혼합 + normal strength .15, roughness는 유지한다. 기존 코드의 색상 밝힘/채도 조정까지 복제하지는 않았다.
- 자체 목재는 낮은 대비의 방향성 절차 결 + roughness .75, 자체 도장면은 단색 + roughness .75. 사진 기반 PBR과 동등한 실사 재질이라는 주장은 안 한다.
- displacement·AO 곱셈·굴절·SSS·금속·볼륨·먼지·bloom·DOF·추가 grain은 제외했다. 표면 선택·정상 맵·빛 반응을 분리하려는 시험이다. 웹 비용은 측정하지 않았다.

환경에 bpy 4.5.3과 Pillow/numpy가 준비된 뒤 저장소의 Windows 호환 래퍼로 실행한다. `--fetch`는 고정 SHA와 다른 파일을 거부하며 신규 버전으로 조용히 교체하지 않는다.

```text
npm run py -- scripts/blender/material-bench.py --fetch --render --report
```

이번 클라우드에서는 준비된 `/workspace/.ecg-cloud/bpyenv/bin/python`을 사용했다. PNG 원본과 run.json은 ignored 출력에 보존하고, [render-run.json](render-run.json)에 각 렌더 SHA와 조건을 기록한다. [map-metrics.json](map-metrics.json)은 입력 맵·해상도/압축 요인 분리, [render-metrics.json](render-metrics.json)은 정면 패널 고정 ROI의 명암·고주파 편차다.

## 판정 범위 / 확인 안 함

- 독립 시험대는 재질 선택 검토다. 실제 서고 카메라·베이크·웹 결과의 원인별 기여율, 최종 texel/pixel, r8/B2 원본 전체와 최신 결과 비교는 **확인 안 함**.
- 해상도 비교는 동일 2K 원본의 1K 축소·재확대이며 실제 별도 4K 원본은 **확인 안 함**. 압축은 같은 크기의 lossless PNG / WebP q75 / q90으로 분리했다. 기존 GLB 인코더 설정·과거 압축 손실의 역복원은 **확인 안 함**.
- 실사 PBR 후보와 자체 단순 재질의 현실감 동등성, 최종 타일 크기·반복 노출, 움직이는 카메라·다른 HDRI·GPU/전시 PC는 **확인 안 함**.
- 상용 후보는 아래 공식 페이지/약관 검토까지만 했다. 결제·로그인·유료 원본 다운로드·같은 벤치 비교는 **확인 안 함**.
- B3 선택 조합의 아랫면 전후 렌더, L2 사람 접촉·해치 연출, 웹 굽기는 **확인 안 함**. 인터넷 전체 차단을 현재 미실행 사유로 쓰지 않는다.

## 외부 접속과 다른 조달처 — 현재 확인

공식 응답 기록은 [site-access.json](site-access.json). 이전 forensics의 403은 당시 기록으로 보존한다. 현재 작업에 필요한 PH/ambientCG/CGBookcase 원본은 내려받았다. 초기 일부 CDN 403 뒤 앱 식별 User-Agent로 재요청에 성공했지만, User-Agent만이 원인이었다고 단정하지 않는다. CG 다운로드 URL은 공식 다운로드 페이지가 부르는 URL을 따라갔다. 프록시·TLS·해시 검증을 끄지 않았다. 탐색 도구의 Node fetch는 이 환경의 프록시를 사용하도록 `--use-env-proxy`로 실행했다. 과거 무관한 Pexels/Sketchfab 로그인 요청은 이번 CC0 재질 조사에 필요하지 않다.

| 조달처 / 실제 항목 | 이번 확인 | 이번 결론 |
|---|---|---|
| [Poly Haven ash](https://polyhaven.com/a/ash_veneer), [도장 벽](https://polyhaven.com/a/painted_plaster_wall) | 실제 2K 색·노멀·roughness PNG, 공식 MD5 | ash는 세밀한 균일 결이고 도장 벽은 원본 색상 자체에 변색이 있다. 사이트 전체의 품질 문제로 묶지 않는다 |
| [ambientCG Wood095](https://ambientcg.com/view?id=Wood095), [Paint004](https://ambientcg.com/view?id=Paint004) | 실제 2K PNG PBR, [현행 CC0](https://docs.ambientcg.com/license/) | 무료 1차 비교 후보. Wood051/Plaster006처럼 강한 결·얼룩 후보도 있으므로 개별 검사 필요 |
| [CGBookcase Wood05](https://www.cgbookcase.com/textures/wood-05) | 개별 페이지 CC0·procedural 표기, 실제 2K PNG 4채널 | 밝은 목재 대안이지만 원본 정상 강도의 표면이 거칠다. Wood01은 마모/옹이 대비가 커 목표에서 제외 |
| [Poliigon Ash Wood Board Light Beige 4186](https://www.poliigon.com/texture/ash-wood-board-texture-light-beige/4186) | 상품 페이지 200. photoscan, 2.5×2.5 m, 1/2/4/8K·8K 32 px/cm 표기. [공식 사용 약관](https://help.poliigon.com/en/articles/8749749-asset-use-licensing) 200 | 밝고 차분한 목재의 다음 상용 후보. 원본/라이선스 밖 공유·재배포 금지; 공개 Git에 재질 파일을 넣는 경로로 쓰지 않는다. 무구매·원본 품질 미검증 |
| [Adobe Substance 3D Assets](https://substance3d.adobe.com/assets/allassets?category=Materials) | 공식 SPA 응답 200 | 매개변수로 결·마모를 줄이는 후보이나 이번 응답은 앱 셸이다. 개별 상품·노출 파라미터·구독/공개 배포 권리 확인 안 함 |
| [BlenderKit → Blendkit](https://www.blenderkit.com/docs/licenses/) | 공식 리디렉션·라이선스 페이지 200. RF/CC0 혼재 | 복잡한 소품 보조 후보. 사이트 무료 표기를 CC0 승인으로 쓰지 않는다. 개별 모델 다운로드·기하 품질 확인 안 함 |
| [Fab](https://www.fab.com/), [EULA](https://www.fab.com/eula) | 카탈로그·EULA URL 응답 200 | 개별 상품·약관 본문 적용 검토·다운로드 확인 안 함. 현재 서고 재질 대안의 우선 추천으로 승급하지 않는다 |

상용 공급처의 큰 해상도나 상품 설명은 직접 렌더한 결과와 같은 등급의 근거가 아니다. 현 단계 권장 경로는 **자체 깨끗한 재질 → 검증된 무료 후보 보조 → 무료 결과로 부족한 특정 표면만 상용 검토**다.

### 맵 방향 확인

CGBookcase의 [공식 Blender 안내](https://www.cgbookcase.com/learn/how-to-use-pbr-textures-in-blender)는 Normal 맵이 **DirectX**라고 명시한다(200 응답). 최종 벤치는 CGBookcase만 G를 `1-G`로 반전하고 PH/ambientCG GL 맵은 그대로 사용한다. 처음 CGBookcase 두 장은 방향 변환이 빠져 기각했고, 동일 시험대에서 두 시점을 다시 렌더했다. 그 최초 이미지로 품질을 판정하지 않는다. 자체 단색 기준은 노멀 맵이 없다.

## 실물 판정 — 이 벤치에서의 권장, 사용자 채택 전

[핵심 네 조건 비교](selected-comparison.jpg): 위 왼쪽 PH 벽 원본 / 오른쪽 자체 도장면, 아래 왼쪽 PH ash 원본 / 오른쪽 기존 .15 혼합 방식. 두 자체/혼합 조건의 평탄함은 의도한 표현 기준이며 실사 목재의 미세 요철을 재현했다는 뜻은 아니다.

| 조건 | 판정 | 이유 / 다음 확인 |
|---|---|---|
| PH ash 원본 | KEEP, 보조 후보 | 균일한 미세 결. 원본이 저해상도 먼지라는 해석을 뒷받침하지 않는다. 목표 화면에서 결·반복 크기 확인 필요 |
| PH ash flat15 | KEEP, 기존 방식 비교 기준 | 결이 줄고 광원의 넓은 변화가 잘 읽힌다. 현재 장면의 같은 값 재현·승인으로 취급하지 않는다 |
| 자체 wood | KEEP, 양식 기준 | 가장 깨끗하지만 목재 결이 거의 안 보여 도장 목재처럼 보인다. 실사 목재가 필요하면 결을 다시 설계해야 함 |
| ambientCG Wood095 | TUNE | 얼룩보다 큰 목리·따뜻한 색감이 눈에 띈다. 현재 파스텔 표면에 쓰려면 색·물리 반복 크기를 검토해야 함(수정 후 결과는 미검증) |
| CGBookcase Wood05 | TUNE | DirectX 정상 변환 후에도 PH ash보다 표면 결이 강하다. 노멀/반복 크기 조절을 별도 시험할 후보이며 자동 상위 품질로 보지 않는다 |
| ambientCG Wood051 / CGBookcase Wood01 | REJECT, 이번 목표 | 각각 강한 결/진한 반사, 마모·옹이 무늬. Wood01은 원본 검수 단계에서 제외하여 벤치 렌더 없음 |
| 자체 paint | KEEP, 우선 권장 | 깨끗한 따뜻한 도장면 기준. 넓은 조명 변화와 베벨을 방해하는 먼지 무늬 없음 |
| PH wall flat15 | KEEP, 기존 방식 비교 기준 | 원본 얼룩이 크게 약해짐. 자체 단색과 가까워질수록 외부 색상 맵의 이점은 작아짐 |
| ambientCG Paint004 | TUNE | albedo는 매우 균일하지만 실제 벤치에서는 붓질 같은 노멀과 청록색이 보인다. 색·노멀 강도 변경 결과는 미검증 |
| PH wall 원본 / ambientCG Plaster006 | REJECT, 이번 목표 | 원본 색상의 변색/얼룩과 벤치의 거친 반응이 깨끗한 서고 목표에 맞지 않는다. 스캔 기술 품질 자체의 기각은 아님 |

현재 권장은 **자체 단색 도장면을 주력으로 하고 목재는 PH ash의 약한 결을 보조로 쓰는 경로**다. 다른 공급처의 4K/8K를 사는 것을 우선 해법으로 삼지 않는다. 기존 r8·D-084·Story의 실제 재질은 교체하지 않았다.

## 측정값

입력 색상 맵은 모두 2048². PH 두 색상 맵은 PNG IHDR상 **16-bit**, 나머지 여섯은 8-bit다. bpy는 원본을 읽는다. 아래 맵 대비·PSNR은 Pillow에서 읽은 **RGB8 기준**으로, PH의 16→8-bit 양자화 손실은 포함하지 않는다. PNG lossless는 이 RGB8 기준에서의 무손실이다. 원본의 전체 비트 정밀도까지 무손실이라고 주장하지 않는다.

픽셀값은 0–255다. 입력 p95−p5는 전체 albedo 명암 폭이고 렌더 고주파 σ는 동일 정면 패널 ROI `(220,140)-(490,280)`의 Gray − GaussianBlur(radius 4) 편차다. 서로 다른 색상·노멀·조명 반응이 섞이므로 절대 품질 점수가 아니다. 노이즈/양자화 하한도 포함한다.

| 벤치 조건 | 고주파 σ |
|---|---:|
| ph_ash | 1.90 |
| ph_ash_flat15 | 0.53 |
| acg_wood095 | 2.21 |
| own_wood | 0.54 |
| acg_wood051_negative | 8.92 |
| ph_wall | 1.57 |
| ph_wall_flat15 | 0.53 |
| acg_paint004 | 1.34 |
| own_paint | 0.52 |
| acg_plaster006_negative | 4.08 |
| cgb_wood05 | 3.17 |

입력 albedo p95−p5: ash_veneer 30, painted_plaster_wall 31, Wood051 26, Plaster006 27, Wood095 26, Paint004 6, Wood01 70, Wood05 24.

동일 PH 벽 RGB8 기준 요인 분리(PSNR이 높을수록 이 원본과 가깝다):

| 크기 / 인코딩 | bytes | 같은 크기의 입력 대비 PSNR | 2K 기준 대비 PSNR |
|---|---:|---:|---:|
| 2048 / lossless PNG | 7,992,248 | ∞ | ∞ |
| 2048 / 75 | 544,858 | 34.28 dB | 34.28 dB |
| 2048 / 90 | 1,243,996 | 40.89 dB | 40.89 dB |
| 1024 / lossless PNG | 1,830,116 | ∞ | 31.62 dB |
| 1024 / 75 | 67,794 | 34.83 dB | 29.81 dB |
| 1024 / 90 | 234,334 | 40.87 dB | 31.12 dB |

2K q75→q90은 같은 해상도에서 34.28→40.89 dB로 인코딩 손실이 줄었다. 반면 무손실 1K로만 줄여도 2K 기준 31.62 dB다. 해상도 감소와 압축을 함께 바꾼 비교로는 각각의 영향을 분리할 수 없다. 이 수치는 최신 서고 최종 화면의 손실 기여율이 아니며, 얼룩을 제거한 효과도 아니다.

원본 다운로드 총 361,430,072 bytes(중복 없는 6개 PH 맵 + 6개 ZIP). 최종 렌더 22/22, CG normal 보정용 재렌더 2장 별도. 사용자 미감 확인·실제 서고 적용은 확인 안 함.


## 검증 결과

PASS — 공식 원본 핀 40파일, 최종 22장 고유 variant/view·PNG 640²·SHA 일치, CG 방향 수정 두 장의 SHA 변경, 원래 서고 빌더·웹 파일 불변을 확인했다. 세부는 [validation.json](validation.json). 스크립트의 `--fetch` 재실행과 핀 검증도 종료 0이다.

기록 검사 152항목 PASS, 플레이북 6카드/3여정 PASS, Python 인코딩 68파일·검출기 self-test 7/7 PASS, Windows portability 검사 PASS, diff whitespace PASS. 플레이북 최초 검사는 새 절 이름·노드 전이/근거 표기 3건으로 실패했고 정해진 형식으로 수정 후 재검사 PASS했다. 앱 코드 변경이 없어 앱 빌드/브라우저 테스트는 이번 비교 검증에 포함하지 않았다. 실제 렌더를 실행했으며 문법 검사만으로 렌더 성공을 주장하지 않는다.
