# revenue-report
매일 새벽 배치로 `python3 report.py`를 실행해 `report.json`을 만든다. 입력은 `events.csv`, `users.csv` (`python3 make_data.py`로 샘플 생성).
배치 서버는 8코어. 운영 데이터는 샘플의 약 20배.
