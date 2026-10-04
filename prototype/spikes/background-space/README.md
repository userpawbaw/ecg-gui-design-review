# B3/B5/B6 배경 공간 프리비즈

저장소 루트 Windows VS Code 터미널:

```text
npm run spike -- background-space
```

첫 실행에서 Three 0.186.1 의존성을 설치하고 브라우저를 엽니다. 주소 http://127.0.0.1:4196 . Node/npm과 첫 설치 네트워크가 필요합니다. 실제 인체·심장 GLB/H5 표면이 기본. 인체 select에서 이전 clay와 비교, 그림자 checkbox로 off/on 비교합니다.

배경 끔/구조선/혼합: geometry와 camera를 고정한 비교. 카메라 슬라이더 p와 박동 시간 t는 독립. 정지/포인터 시차 끔으로 비교 조건 고정. reduced-motion에서 시차 비활성. B6 디지털 뒤층은 기존 작은 접힘 뒤에 위치합니다.

어두운 opaque occluder + depthTest edges, rough PBR 종이/곡률/결정적 texture, ACES+SRGB, spotlight/PCF shadow. bloom/볼륨/DOF는 제외. H5는 기존 셰이더의 표현이며 uSunOn=0: 실제 방 shadow-map 수광/굴절/SSS는 미연결. 장비는 자체 geometry 보완 모델. 전체TUNE/전시PC 성능 미검증. 제품 소스/비교 패널 변경 없음.

## 실제 자산 출처와 재생성

서버는 `prototype/v2/src/story/intro/assets/body.glb`, `heart.glb`, `figure.json`을 직접 제공합니다. `/h5.js`는 같은 경로의 `figure.ts`에서 H5 shader 원문을 추출하므로 별도 로컬 다운로드/생성파일 없이 실행됩니다. source가 누락되면 오류를 표시합니다. 셰이더 glow색/반경/opacity만 spike에서 번안. source 원본 변경 없음.

인체: Blender Studio Human Base Meshes, faceless 가공, CC0. Heart model: HuBMAP Human Reference Atlas 3D reference organ (heart, male), CC BY 4.0, created using Visible Human Male data, provided by National Library of Medicine. Modified. registry와 verification/b-actual-assets-20261004/asset-provenance.json에 원본경로/처리해시. Three MIT, package-lock 고정. 종이/장비 geometry/texture는 자체제작.

이전 “H5 자산이 없다”는 판단은 검색 누락으로 F-034에서 철회. 이전 캡처는 clay 시험 그대로 보존합니다.
