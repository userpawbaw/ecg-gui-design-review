# v2.2 구현 및 실행 기록

2026-09-12 사용자 와이어프레임 승인 후 R1부터 재개했다. 복구 브랜치 f8b6300을 기반으로 하되 최신 main 문서를 유지했다. 세션 시작 시 이전 파일 상태로 돌아가 있던 문서 등을 GitHub blob 해시로 검증·복원했다(38 restored / 22 intact).

## R1 구현 체크포인트

- React/TypeScript/Vite, Tailwind 및 선택 shadcn 구성요소 기반 구현을 main으로 가져온다. S5와 independent는 보존한다.
- 공통 시계의 Sweep/Scroll/Pause, 같은 구간 고정, 대형 비교, 회색 Reference, hover/focus 후보, 클릭 선택 및 Pin을 제공한다.
- 기본 방법 rail과 요청 시 sidebar, Reference 차이 별도 strip 및 display gain, Local/Session/Experiment 근거 공개를 구현했다.
- 새 자료 요청 중 마지막 유효 파형·라벨·지표를 보존한다. 취소 및 실패 재시도 경로를 추가했다. 자료 없는 선택/고정 방법을 다른 출력으로 대체하지 않는다.
- 테스트: 엔진 9개 PASS, DOM 상태 검사 6개 PASS. TypeScript/Vite build PASS. DOM 검사는 Canvas context를 제공하지 않으므로 픽셀·native dialog·터치·브라우저 성능의 증거가 아니다.
- 아직 실제 CSS 화면 크기/배율/1m 가독성 및 native 동작은 NOT VERIFIED. 30초 청크 로딩, 전 조건 자료, Expo 시나리오/Attract는 후속 단계다.

## R2 재개 전 자료 무결성

이전 52조건의 저장 해시와 재대조했을 때 51조건이 일치했다. `d1-mixed-15.json`은 해시 불일치 및 JSONDecodeError로 신뢰할 수 없어 `dist/recovery-20260912/`로 격리했다. 손상 원인은 확정하지 않았다. 손상 조건 1개와 미완성 46개를 재생성한다. 기존 체크포인트를 사용하며 재학습하지 않는다. 이전 52조건 PASS를 이번 세션 전체 유효 자료 수로 그대로 인용하지 않는다.

## 다음 단계

R2: 총 98조건×600초 완성, 자료/지표 검사, 30초 청크 및 manifest 생성. R3: 오프라인 패키지와 운영 기능. R4: 실제 PC 브라우저 증거. R5: 팀 안내·검증 상태 갱신. 완료 단계와 외부 환경 때문에 미검증인 항목을 분리한다.
