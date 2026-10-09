# D123 · 지도 디테일 역행 수정 / 구름 조명 독립 보완

2026-10-10 / CASE-007 / D119·D122 후속. 사용자: 멀리 고화질인데 다가갈 때 흐려지고 사각형은 사라짐, 이후 자연스러운 지형 전환 유지 요청. 구름 양감 명암 부족·조명 적용 여부 질문.

## 구현 전 판단

### T 지형
parentColorHandoff 켜짐에서 colorPhase=parentAmount. parent geometry reveal .135-.19 동안 높이와 해상도 blend가 같이 움직여, 이미 높은 해상도를 쓰던 globe 위에 낮은 source 기여를 되살린다. 전후 actual 대조 필요. 선택: 높이 reveal 유지, 색은 높은 자료 유지; globe/parent 같은 .22 feather와 같은 region source 사용. 변경 불가: camera/DEM1.5/자연스러운 후반 geometry 전환. 원색gain.8 고정하여 D122 명도 변수와 분리. 경계가 부각되면 TUNE.

### L 구름
현재는 OrbitalCloudEffect height-field + 태양방향 법선/4점 자기 가림이며 Takram 원형 cloud volume는 orbital에서 미부착. 환경 채움 .25/.28/.33와 direct .73/.70/.65가 그림자를 밝게 유지한다. 동일 분포/높이/광원에 낮은 채움/강한 직접광/가림 대비 후보를 비교. 새 Bloom·태양회전·높이변경으로 명암 개선을 위장하지 않는다. 완전한 multiple scattering/진짜 기상 volume 아님.

## 검증
T .15/.165/.18 × 이전/디테일유지 6캡처; L .235 × 기존/대비 2캡처. T에서구름조명기존 고정, L에서detailhold 고정. 전체 source/camera/sun/DEM/양gain 동일assert. 8초 실제자동render 경로. blur역행/새명확한사각경계/깜박임/경계색 오차는TUNE; L은흰날림/회색돌/과암부면되돌림. 사용자긍정 후반전환 유지, shadow보류/서고KEEP/2회실패·fallback 보존.

## 첫 trial 반례와 수정
고해상도 색까지 완전 유지한 첫trial은 dark 사각형을 더 드러내 REJECT. captures detail-light-first-20261010 보존. 기존 colorPhase 인계/feather는 유지하고, 고해상도 source의 luminance/4-mip 저주파 비율만 사라지는 detail 기여에 보충한다. 전체colour/평균명도와 고주파 detail을 분리; source ratio .6–1.7 제한. 위 구현 전 full hold 선택은 이 반례로 대체됨.


## 최종 결과
T6/L2 실제캡처+8초자동영상. highcolour fullhold 첫trial REJECT→평균colour 인계유지/detailratio 보충으로 수정. 지도는부분detail보존/TUNE, 구름대비도제한적/TUNE. geometry·camera·광원방향미변경. Vite82 modules PASS/renderer오류관찰없음. verification/a-detail-light-20261010/manifest.json.
