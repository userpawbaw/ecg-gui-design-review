# accounting-export
- 매일 02:00 cron: `python3 nightly_export.py` → `export.csv`를 회계팀 공유 폴더로 복사.
- 하루 주문 약 2,000건(최근 1년 최대 2,600건). 샘플: `python3 make_data.py`.
- 회계팀은 아침 9시에 파일을 연다.
