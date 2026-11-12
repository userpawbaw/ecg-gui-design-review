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

시작할 때 점검하는 것
  - PyTorch: 없으면 설치를 묻습니다. 설치돼 있는데 불러오지 못하면 이유를 보여 줍니다.
  - Visual C++ 런타임(PyTorch에 필요): python 폴더에 함께 들어 있습니다. 없으면 Microsoft 설치 프로그램을 받아 설치할지 묻습니다(관리자 확인 창).
  - 폴더 경로 길이: 너무 깊은 폴더에 풀면 PyTorch 설치가 실패하므로 짧은 경로(예: C:\SignalStudio)에 풀라고 알려 줍니다.
  - 보드 드라이버: 보드(CH340 · FTDI · CP210x · Arduino)가 꽂혀 있는데 드라이버 문제로 포트가 안 보이면 칩 이름과 드라이버 주소를 알려 줍니다.

문제가 있을 때
  - 오류가 나면 창이 바로 닫히지 않고 메시지를 보여 준 뒤 Enter 를 기다립니다. 실행 기록은 logs 폴더(SignalStudio-날짜-시각.log)에 남습니다.
  - 다른 Signal Studio 또는 npm run bridge:replay 가 켜져 있어 포트(4173 · 8764 · 8765)가 쓰이고 있으면 빈 포트로 바꿔 켭니다.
    같이 켜 두면 CPU 를 두 배로 쓰므로, 가능하면 먼저 켠 쪽을 닫습니다.
  - Windows 보호(SmartScreen) 경고: 「추가 정보」 → 「실행」 (서명되지 않은 실행 파일).
  - 원본 브리지 저장소의 커밋은 SOURCE_COMMIT.txt 에 적혀 있습니다.
