# ward-dashboard (backend excerpt)

- `python3 make_db.py` 로 샘플 DB(`ward.db`)를 만든 뒤 `python3 server.py` 로 한 병동 조회 시간을 본다.
- 병동 화면은 간호사 스테이션 모니터에서 5초마다 `get_dashboard`를 다시 부른다.
- 운영 요구(임상 안전팀 합의):
  - **미확인 알람(open_alerts)은 발생 후 다음 화면 갱신(5초)에 반드시 나타나야 한다.** 알람 지연은 사고로 분류한다.
  - 활력 징후(hr, spo2)는 장비가 7초마다 올린다.
- DB는 SQLite 파일 하나. 스키마 변경(인덱스 추가 포함)은 `open_db`에서 `create ... if not exists`로 하면 배포 때 자동 적용된다.
