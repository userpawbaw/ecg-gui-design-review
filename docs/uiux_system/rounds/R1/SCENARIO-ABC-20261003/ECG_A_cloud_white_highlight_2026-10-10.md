# D126 · 구름의 밝은 면을 흰색으로 분리

2026-10-10 / CASE-007 / 사용자: 구름 윗면이 회색이고, 빛받는 부분이 눈처럼 하얗게 보이길 원함.

현재 mass proxy의 fill/key/self-occlusion은 존재하지만 전체 radiance에 .065를 곱한다. 태양 고도가 낮아 facing도 작아져 밝은 면도 회색으로 제한된다. 전체 노출이나 환경광을 올리면 그늘·지도까지 밝아지므로 직접광 radiance만 독립 증량한다. 동일 camera/shape/opacity/sun/map에서 현재/흰 윗면/강한 흰 윗면 3후보를 .1584/.235 구도에서 비교한다. 그늘 유지·흰날림으로 세부형상 소실 금지. 시연용 height-field 광학 근사이며 실제volume 산란 구현은 아님. 원경 지도 잔여gap/그림자보류/서고KEEP/2회실패 유지.


## 결과와 선택

massLayer는 직접광만 별도 radiance 계수로 분리했다. fill/night/haze 기존 .065 유지, key*facing*transmission의 계수는 기존 .065, 중간 .5325, 강한1.0. 직접광 반사근사이지 실제 multiple scattering 아니다. shape/alpha/광원/지도/태양각·구면보정은 유지. 기본 기존 contrast에서도 같은 계산식을 유지한다. thin layer는 바꾸지 않았다.

2구도×3후보 6 실제 캡처/JSON, camera/sun/placement/height 조건동일 assert PASS. 중간 white는 윗면이 눈처럼 밝아지고 어두운 골이 남아 추천 TUNE. 강한 white-strong은 일부 밝은 덩어리의 세부대비가 줄어 추천하지 않으나 비교용 보존. 새로운 texture/pass/ray-step 없음. 일부 추가 scalar 연산이라 큰리소스증가를예상하지않지만이번장시간성능측정은미실시. 지도 잔여gap/near인계/실제volume/그림자보류 상태 유지.

초기 강한 후보의 camelcase 저장이 strict lowercase 검사에서 실패→white-strong으로 수정후6캡처전체재저장. 최종 브라우저 error log 빈배열 확인. Vite83module PASS, recordcheck 별도. 사용자 채택 미완이며 기존 광학 설정을 자동 승격하지 않는다.

비교 verification/a-cloud-white-20261010/gallery.html, manifest.json. 픽셀 밝기 통계는 직접 밝아진 픽셀 표본이고 물리휘도/구름 segmentation이 아니다. 최종 사용자는 지도 눈과 구름 밝은면의 균형/밝은면 표면결/그늘을 리뷰하면 된다.
