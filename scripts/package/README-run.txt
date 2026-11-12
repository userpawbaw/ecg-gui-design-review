Signal Studio - 심전도 잡음 제거 시연 (Windows 배포 패키지)

실행
  1. 압축을 푼 폴더 안의 SignalStudio.exe 를 더블클릭합니다.
     (web, python, source 폴더가 exe 옆에 그대로 있어야 합니다. Python 을 따로 설치할 필요는 없습니다.)
  2. 처음 실행하면 PyTorch 설치 여부를 묻습니다.
     - 딥러닝 기법(M06, M06L6, M08, M09)을 쓰려면 Y (CPU 판, 약 200 MB 내려받기, 인터넷 필요)
     - 고전 기법(M_FE ~ M05S)만 쓰면 n
  3. 브리지(합성 신호 재생)와 화면이 켜지고 Edge 창이 열립니다. 「실시간 측정」 탭에서 기법을 고르고 「적용」을 누르면
     브리지만 다시 띄웁니다.
  4. 끝낼 때는 검은 창(콘솔)을 닫습니다.

옵션 (명령 프롬프트에서 SignalStudio.exe 뒤에)
  --port COM3            합성 신호 대신 보드(시리얼 포트)
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
