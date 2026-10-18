# 근거와 범위 (2026-10-18)

- 프로젝트 현장 기록: `docs/uiux_system/rounds/R1/REVIEW-R1-ARCHIVE-SHADOW-ASSET-20261016.md` §5·§7 (베벨, 단차, 화면 각도), `verification/r1-original-branch-assets-20261018/README.md` (초기 장비 구조), `verification/r1-archive-material-review-20261018/README.md` (동일 조건 재질 벤치). 이 문서의 mm/px 목표값은 프로젝트 시안 값이다.
- Blender Manual, [Bevel Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/bevel.html): 폭·세그먼트·한계·법선 처리. 2026-10-18 HTTP 200 확인.
- Blender Manual, [Weighted Normal Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/normals/weighted_normal.html): 큰 평면의 법선 보정. 2026-10-18 HTTP 200 확인.
- Blender Manual, [UV Unwrapping](https://docs.blender.org/manual/en/latest/modeling/meshes/uv/unwrapping/introduction.html): UV와 텍스처 대응. 2026-10-18 HTTP 200 확인.
- Blender Manual, [Cycles Baking](https://docs.blender.org/manual/en/latest/render/cycles/baking.html): 베이크 입력/출력 채널. 2026-10-18 HTTP 200 확인.

공식 문서는 기술 사용법 근거이며 서고용 수치나 미적 합격을 보증하지 않는다. 외부 페이지 내용/에셋/코드를 복제하지 않았다.

## 외부에서 쓰이는 방식 조사

GitHub 별점은 사용량의 **간접 지표**이며 실제 설치·업계 채택률 증거는 아니다. 아래 커밋을 기준으로 문서를 읽었다. 라이선스 표시는 저장소 GitHub API/스킬 전면의 값이다. 글·코드를 복제하지 않고 적용 지점만 요약했다.

| 출처·확인 | 관찰한 방법 | 이 프로젝트 적용·제외 |
|---|---|---|
| [EL4CTEO/blender-skills, hard-surface](https://github.com/EL4CTEO/blender-skills/blob/71d031dab8bc6729504d11a78cbe91945401045f/skills/blender-hardsurface-modeling/SKILL.md), [asset-QA](https://github.com/EL4CTEO/blender-skills/blob/71d031dab8bc6729504d11a78cbe91945401045f/skills/blender-asset-qa/SKILL.md). 2026-10-18 별점 66, MIT, 커밋 71d031d | 실물 크기 blockout→1차/2차/3차 형태; mid-poly/high→low/subdivision 분기; scale 적용; bevel·weighted normal; 자동 수치 점검 후 다각도 육안 확인 | 제작 순서와 Q1–Q5의 이중 검수에 반영. 제공 스크립트·Blender 5.2 API·기본 QA 임계값은 4.5.3과 서고 구조에서 검증 전이라 가져오지 않음 |
| [scenario-labs/skills hard-surface](https://github.com/scenario-labs/skills/blob/ccc6c5c623a4f96423df0d157b8ef174f14edfd8/skills/dcc/blender/scenario-blender-hard-surface/SKILL.md). 2026-10-18 저장소 별점 1,043, MIT, 커밋 ccc6c5c | 컷→미세 베벨→법선, 실루엣/매트캡·컷 클로즈업, 얇은 벽이 다른 베벨까지 축소시키는 실패 모드; 평면/곡면에 따른 제작 경로 분기 | 컷 실패 진단과 Q2 시각 검토에 반영. 별점은 저장소 전체 수치이며 해당 스킬 사용량은 확인 안 함. Scenario 연결/5.2 toolkit/자동 설치·요금 흐름은 도입하지 않음 |
| [Polycount 업계 위키: Normal Map Modeling §Using Bevels](http://wiki.polycount.com/wiki/Normal_Map_Modeling#Using_Bevels), [Texture Baking §Triangulation·Cages·Reset Transforms](http://wiki.polycount.com/wiki/Texture_Baking). 2026-10-18 HTTP 200, 본문 확인 | 베벨은 실루엣/광택을 돕지만 길고 얇은 삼각형·정점 비용 증가. hard edge/UV seam과 bake용 cage·삼각화·transform 정리 필요 | 모든 모서리 베벨 강제 대신 최종 픽셀과 비용 비교. high→low 경로에서만 bake 세부 항목 의무화 |

한계: Polycount 위키는 여러 커뮤니티 기여를 모은 자료이며 특정 스레드의 합의 투표가 아니다. Blender 5.2 스킬의 정확한 API/스크립트 동작을 현재 bpy 4.5.3에서 실행 검증하지 않았다. Reddit 검색은 403으로 본문을 확인하지 못해 근거로 쓰지 않았다. ArtStation Learning 목록 접속 200은 개별 강의 검토가 아니므로 방법 근거에 넣지 않았다.
