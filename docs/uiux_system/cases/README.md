# UI/UX Methodology CASE Index

CASE 문서는 F/D/O/R 운영 기록을 복사하는 파일이 아니라, 사용자가 나중에 다시 읽어도 **왜 이런 시스템이 생겼는지**를 따라갈 수 있게 여러 사건과 대화를 묶은 해설 계층이다.

## 현재 CASE

- `CASE-001_UIUX_AI_ORCHESTRATION.md` — Creative proposer / Validator / data-story / tool-routing 구조가 만들어진 논의 과정
- `CASE-001_SUMMARY_EN.md` — CASE-001 영문 one-page
- `CASE-002_REFERENCE_GROUNDED_CREATIVE_MINING.md` — text-only creative proposal과 모든 mockup 사이의 visual-intent 공유 문제를 reference mining으로 해결한 과정
- `CASE-002_TRANSCRIPT_EXCERPTS.md` — CASE-002의 핵심 사용자/AI 대화 발췌

## 작성 원칙

1. `배경 → 문제 제기 → AI 응답 → 사용자 반론/재정의 → 판단 변화 → 구축 결과`의 순서를 보존한다.
2. 중요한 발화의 원문이 있으면 짧게 인용한다. 없으면 `[재구성]` 또는 `기록 없음`을 쓴다.
3. 사용자의 기여와 AI의 기여를 분리한다.
4. 관련 F/D/O/R과 commit을 연결한다.
5. 모든 대화 전문을 저장하는 것이 목적은 아니다. 판단을 바꾼 turning point를 보존한다.
6. CASE가 길어질 때는 `CASE-*_TRANSCRIPT_EXCERPTS.md`를 별도 부록으로 둔다.

자동 검사는 `scripts/check-uiux-records.cjs`, 사람 기준은 `../10_RECORD_KEEPING.md`와 `../11_CHECKLISTS.md`를 따른다.
