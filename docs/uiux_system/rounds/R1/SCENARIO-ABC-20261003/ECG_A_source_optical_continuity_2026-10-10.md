# D125 · 지도 source 접합과 대기 좌표 보정 대조

2026-10-10 / F-089 후속 / CASE-007 / 구현 전 계획.

초기 globe source 경계와 .135–.18 광학 인계를 분리한다. 새 source 후보는 globe/parent가 같은 shader 함수·UV·feather·source를 사용하고, 패치 가장자리에서만 낮은 주파수 색을 주변 지도에 정합하면서 고해상도 결을 유지한다. 고해상도 기여를 geometry reveal에 연결하지 않는다. 기존 옵션 유지, opt-in 비교.

대기는 Takram 자동 geometric correction ON/OFF를 같은 구도에서 먼저 대조한다. 실제 surface 대신 보정된 구면 위치/법선으로 섞는 공식 source가 현재 구형 globe+WGS84 anchor와 상호작용할 수 있다. 확정 진단은 캡처 후 기록. 근경 구름/그림자/서고 연결은 이번 변경 범위 아님.

검증: .1025/.1348/.15/.1584/.18 고정 프레임, cloud OFF source 대조, optics 자동/실제 surface 대조, 최종 cloud ON 정역 영상. 원경 고해상도/후반 화면 보존, 새로운 사각 경계·veil pop·noise면 TUNE/되돌림. 자동PASS는 품질승인 아님.


## 구현과 판단 변경

첫 edge-only 평균색 정합은 개선 폭이 작았고(region LOD에는 원색이 남아) 후보를 그대로 채택하지 않았다. first 13프레임/second 16프레임을 별도 보존했다. 최종은 globe/parent/regional LOD까지 동일 source 함수와 광역/지역 UV·feather .24를 공유한다. macro/region/near mip6 저주파 RGB에 대해 global mip1 기준의 .45–2.2 비율을 적용하고 원본 고주파 결을 보존한다. 이는 사진 원색 보존이 아니라 시연용 색 정합이며 극단적 비율은 제한했다. main/기존 URL에서는 sourceMatch OFF.

Takram three-atmosphere 0.19.1 공식 패키지의 AerialPerspectiveEffect.ts 및 shaders/aerialPerspectiveEffect.frag/vert를 읽었다. 자동 correctGeometricError는 투영 크기에 따른 위치·법선 구면 혼합과 geometry altitudeCorrection 감쇠를 함께 한다. 같은 source/camera/sun에서 이 보정을 끄면 .1025–.15의 균일한 푸른 veil이 없어지고 .1584 부근 급변이 개선된다. 따라서 현 구성의 veil 문제는 이 보정 경로와 연관 있음이 독립 대조로 확인됐다. 라이브러리 일반 결함·물리적 지구 정합 완료로 확대하지 않는다. WGS84 anchor/구형 지구 혼합은 남아 있다. 대기 sun/sky/scattering 자체는 ON 유지. near 그림자 보류 그대로.

## 실제 검증과 남은 gap

- final 16 clear + 3 cloud fixed + 2 real-wheel settled = 21 native PNG/JSON. source pair camera/sun 동일 assert PASS, ready/contextLost/render1280×720 확인.
- 실제 renderer 8초 정역 WebM, trace 482표본, 3fps 24프레임 접촉시트 확인. 전방 wheel p.1663, 역방향 p.1393 모두 settled true. 영상에서 기존 일괄 veil 전환은 보이지 않음. 모든 순간 flicker의 정량 보증은 아님.
- source 접합은 개선되지만 원경 고해상도 패치와 낮은 해상도 주변의 품질 차이는 남아 TUNE. 전체 사각 경계 제거/사용자 KEEP는 아직 아니다. .235 근경 LOD 직사각 명도 차이는 공유합성 적용 후 줄어들었다.
- GPU composer 짧은 표본은 약 4–7ms 부근이며 캡처/녹화 영향을 받는다. 전체프레임·장시간·목표PC gate가 아니다. 추가 texture 조회 때문에 실제 비용은 기존보다 늘 수 있다.
- Vite 83 modules build PASS. 빌드가 GLSL 유효성을 보장하지 않는 사고 O024: regional shader 변수 coherent가 예약어여서 실제 WebGL 컴파일 실패→sharedColour로 수정→최종 native 재캡처/정역 영상/LOD 화면 확인. 과거 console error 기록은 남지만 최종 수정 후 같은 오류의 새 기록은 관찰하지 않았다.
- 실패 candidate 캡처를 final 품질 증거로 사용하지 않는다. 최종에는 shader 수정 후 모든 대조를 다시 저장했다.

검토 페이지 verification/a-source-optical-20261010/gallery.html, manifest.json. 현재 단계는 후보 구현/검증 완료·TUNE. 다음: 사용자 경계/색감/정역 모션 리뷰를 반영해 S1 잔여 접합 정리, 이후 같은 footprint의 near volume 연결. 지형1.5×/기존shadow보류/서고KEEP/구름실패2/2 및 fallback 보존.
