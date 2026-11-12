Signal Studio - 심전도 잡음 제거 시연 (Windows 배포 패키지)

실행
  1. 압축을 푼 폴더 안의 SignalStudio.exe 를 더블클릭합니다.
     (web, python, source 폴더가 exe 옆에 그대로 있어야 합니다. Python 을 따로 설치할 필요는 없습니다.)
  2. 처음 실행하면 PyTorch 설치 여부를 묻습니다.
     - 딥러닝 기법(M06, M06L6, M08, M09)을 쓰려면 Y (CPU 판, 약 200 MB 내려받기, 인터넷 필요)
     - 고전 기법(M_FE ~ M05S)만 쓰면 n
  3. 신호원을 고릅니다.
       [Enter]       재생 신호 — D1(MIT-BIH 기록 100 + NSTDB 혼합 잡음 0 dB, 10분 반복). 보드 없이 시연할 때.
       [1], [2] …    연결된 보드(시리얼 포트 목록, 예: COM3 — USB-SERIAL CH340). 번호 대신 COM3 처럼 이름을 쳐도 됩니다.
     보드가 목록에 없으면 USB 케이블과 드라이버(CH340 등)를 확인하고 다시 켭니다.
  4. 브리지와 화면이 켜지고 Edge 창이 열립니다. 「실시간 측정」 탭 위쪽에 신호원(저장 신호 재생 / 보드 입력)이 표시됩니다.
     기법을 고르고 「적용」을 누르면 같은 신호원으로 브리지만 다시 띄웁니다.
  5. 끝낼 때는 검은 창(콘솔)을 닫습니다. 신호원을 바꾸려면 닫고 다시 켭니다.

옵션 (명령 프롬프트에서 SignalStudio.exe 뒤에)
  --port COM3            묻지 않고 그 보드(시리얼 포트)로
  --replay               묻지 않고 재생 신호로
  --synth                이전 재생 신호(합성 심전도 · 합성 잡음 8 dB)
  --methods M_FE,M04,M05S  처음 띄울 기법
  --kiosk                Edge 전체 화면(전시용)
  --no-browser           창을 열지 않음 (주소: http://127.0.0.1:4173/)
  --install-torch        묻지 않고 PyTorch 설치
  --no-torch             PyTorch 를 묻지 않음
  --selftest             자체 시험 후 종료

문제가 있을 때
  - 「포트 사용 불가」: 이미 켜진 Signal Studio 또는 npm run bridge:replay 를 닫고 다시 실행합니다.
  - Windows 보호(SmartScreen) 경고: 「추가 정보」 → 「실행」 (서명되지 않은 실행 파일).
  - 원본 브리지 저장소의 커밋은 SOURCE_COMMIT.txt 에 적혀 있습니다.
