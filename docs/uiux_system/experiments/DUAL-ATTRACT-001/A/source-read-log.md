# Source / read log · Director A

2026-09-19, scoped root: /workspace/scratch/0e43c96d5b81/dual-attract-runtime/A.

## 로컬

읽음: COMMON.md, role-contract.md, input-manifest.json; baseline/src/main.tsx, style.css, Plot.tsx, plot-scale.ts, engine.ts, data.ts, package.json. 첫 큰 결합 출력은 일부 truncated였으므로 startAttract/endAttract/Reference/Difference 부분 rg 검색과 Plot/engine/data 재읽기로 핵심 사실을 확인했다. methods.json 등 나머지 파일은 존재·해시 확인만 했으며 내용 의미를 검토했다고 주장하지 않는다.

baseline 근거: main.tsx startAttract/endAttract/content/plot 및 style.css .attract selector. Plot.tsx는 input/output/Reference와 residual 정의, engine.ts는 transport/visiblePoints, data.ts는 provenance와 자료 로딩을 확인하는 데 사용했다. package는 데이터 없는 source snapshot임을 판단하는 보조 정보다.

금지 범위: main repository, sibling B, 이전 대화/CASE/history를 읽지 않음. B와 통신 없음. 생산 파일 변경 없음. Superdesign 실행 없음.

## 웹

실제 검색: Exploratorium exhibit, NASA Eyes, Pudding music, Knight Lab Juxtapose를 query로 묶어 검색. 상당수 무관한 결과 반환. 관련 Knight Lab 공식 소개만 발견했고 나머지는 알려진 직접 URL의 원문 열기로 전환했다.

원문 열기 및 채택:
1. https://juxtapose.knightlab.com/ — 성공. Interactive/GIF/Tips 설명. browser에서 동일 URL 확인 및 실제 drag.
2. https://eyes.nasa.gov/ — https://science.nasa.gov/eyes/ 로 redirect. 성공. mission/time 설명. app 렌더링 없음.
3. https://ciechanow.ski/sound/ — 성공. Making Sounds와 대응 plot 설명. 텍스트만.
4. https://ncase.me/neurons/ — 성공. 제작자 interactive format 설명. 내장 게임 미실행.
5. https://pudding.cool/2017/02/vocabulary/ — 성공. 제목/동일표본 설명. browser 첫 loading 후 렌더링 screenshot 확인.

보류: musiclab.chromeexperiments.com/Spectrogram/는 텍스트 미지원/템플릿 응답. annualreviews.org DOI URL은 Internal Error. 사용하지 않음.

웹 자료 인용은 reference-cards.md의 직접 Markdown 링크로 제공한다. 긴 원문 복제·이미지 재배포 없음. 카드의 원리/느낌/ECG 번역은 Director A의 추론이다.

## Browser

control-browser SKILL.md 전체 읽음. /root/.codex/skills/browser/scripts/browser-client.mjs를 지정 Node JS tool로 import, cloud cdp 획득. documentation 최초 전체 출력에 truncation 표기가 있어 해당 중간 부분을 추가 읽음. 새로운 A 전용 탭 두 개만 생성하고 참조 사이트 탐색. 기존 탭 열람 없음.

Juxtapose scroll에 Input.synthesizeScrollGesture timeout 1회. 즉시 반복하지 않고 screenshot으로 상태 확인했으며 실제 scroll이 적용되어 있음. 화면 근거로 핸들 drag 후 screenshot 확인. Pudding은 첫 loading 화면 후 다시 screenshot으로 렌더링 확인. 도구 네트워크/타임아웃을 bot block으로 오분류하지 않음.

## 검증의 경계

Reference 01 E3, 05 E2; 나머지 E1. ECG proposals 모두 L0. Browser로 ECG 구현 실행 안 함. prototype·performance·관람객 이해도 검증 안 함. 제작 승인 안 함. Sources는 동결일 시점이며 URL 콘텐츠 변경 가능.
