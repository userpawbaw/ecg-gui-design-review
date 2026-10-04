# B3/B5/B6 배경 공간 프리비즈

저장소 루트 Windows VS Code 터미널:

```text
npm run spike -- background-space
```

첫 실행에서 Three 0.186.1 의존성을 설치하고 브라우저를 엽니다. 주소 http://127.0.0.1:4196 . Node/npm과 첫 설치 네트워크가 필요합니다. Three MIT; 외부 에셋/레퍼런스 복제 없음. procedural clay는 H5 에셋 완성도를 대체하지 않습니다.

배경 끔/구조선/혼합: geometry와 camera를 고정한 비교. 카메라 슬라이더 p와 박동 시간 t는 독립. 정지/포인터 시차 끔으로 비교 조건 고정. reduced-motion에서 시차 비활성. B6 디지털 뒤층은 기존 작은 접힘 뒤에 위치합니다.

어두운 opaque occluder + depthTest edges, rough PBR 재질, ACES+SRGB. 실시간 그림자/bloom/볼륨/DOF는 제외. 수광 patch는 분위기 근사로 물리적 차폐광 검증이 아닙니다. 비교 패널/제품 story 코드는 변경하지 않았습니다. 최종 카메라, 종이 물성, 실제 H5, 그림자/성능/전시PC는 후속 TUNE입니다.
