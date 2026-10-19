# D-148 fidelity / 구현 범위

최종 미감 판정은 CONDITIONAL. 기술·광학 동작 PASS, 실제 GPU·Cycles/사용자 검토는 확인 안 함.

| 관문 | 결과 | 근거·한계 |
|---|---|---|
| G1 입력 대응 | PASS | 계획의 light/view depth, room clip, sigma_t/sigma_s, HG, noise, sliders, cache가 study 모듈에 연결됨. 방향광 범위이며 key spot은 후속 |
| G2 재료 | PASS(기존 재사용) | GLB/텍스처 원본 유지, 기존 registry 입력. procedural noise와 공식 Three addon. 외부 demo 원문 코드/에셋은 저장 안 함 |
| G3 프레임 비교 | CONDITIONAL | fixed12 hash동일·sweep12/orbit12·3camera 캡처, on/off 비교. 외부 기술 demo와의 동일 카메라 미감 비교는 안 함 |
| G4 밝기/색 | CONDITIONAL | 닫힌 구멍의 산란0, 각도별 radiance와 off/direct RGB mean0.953/255. on/off 이미지 지표를 함께 보관. Cycles tone 동일성은 안 함 |
| G5 상태 | PASS(자동화 범위) | 범위·키보드·reset/share·on/off·freeze·품질·모바일 viewport·reduced-motion·자원 재생성·카메라 캐시. 실제 터치/물리 GPU는 미검증 |
| G6 수정 한도 | PASS | 광학계수는 계획 시작값 사용. 별도 view4곳 비교에서 beam을 볼 옆 시점을 선택. 결함 회피용 광원/모델 변경 없음. 남은 GAP은 key/간접광·GPU/미감 |

## 셰이더·후처리 §12 대조

- 재질: GLTFLoader PBR map/normal/roughness 유지; bake용 color만 끔.
- 조명: DirectionalLight+고정 fill 유지, surface/raw depth 동기. source 밖 caster 포함.
- 대기: local room single scattering+transmittance+world noise. 전역 haze/bloom/film grain/입자는 이번 범위에서 제외.
- 출력: linear HalfFloat HDR, MSAA4 scene/depth, depth-aware filter/upsample, ACES/exposure/sRGB OutputPass1회.
- 성능: 3개 preset RT재사용, raw depth dirty cache, freeze/hidden 절전. Software readback wall time과 실제 GPU/FPS는 구분.

## KEEP / TUNE / GAP

- KEEP: 화면 밖 source·실제 창/잎 가림·옆 시점의 빛결, 설정 링크, 동기 방향.
- TUNE 후보: 실제 GPU/사용자 화면에서 beam 강도/결과 해상도 대비를 보고 조절. 현재값의 최종 미감 승인은 없음.
- GAP: B3 key SpotLight와 간접광/최종 tone, 진짜 구름 유체/다중산란, 실제 GPU frame/input 지연. study를 Cycles 동등품질이라고 하지 않음.
