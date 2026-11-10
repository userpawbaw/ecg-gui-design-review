# 발표 자료용 — 실시간 측정 화면을 재생 브리지로 띄워 캡처하기

보드 없이 「실시간 측정」 탭을 실제 처리 화면처럼 띄워 스크린샷을 찍는 방법이다(2026-11-08 사용자 요청).
화면에 나오는 파형은 원본 저장소 브리지의 **재생 모드**가 만든다. 모의 보드가 실제 보드와 같은 선 규격으로 신호를 흘리고, 실제 처리 경로(공통 전처리 + 선택한 기법)가 그 신호를 처리해 보낸다. 출력 파형은 진짜 처리 결과이고, 입력은 저장 · 합성 신호다(실측 아님). 입력 신호(합성 심전도 · MIT-BIH 기록)와 잡음 종류 · SNR을 고를 수 있다(§4.1).

예시 화면: `verification/demo-bridge-20261108/`(3840 × 2160).

## 1. 필요한 것

| 무엇 | 어디 | 비고 |
|---|---|---|
| 이 저장소 | `userpawbaw/ecg-gui-design-review`, 브랜치 `claude/optimistic-goldberg-jnzpni` | 앱 화면. `npm run story`로 연다 |
| 원본 저장소 | `userpawbaw/ECG_denoising_method_comparision`, 브랜치 **`claude/pli-harmonic-canceller`** | 브리지 `scripts/serial_bridge.py`와 처리 코드(`ecgdn/`). 전원선 잡음을 고조파 추적 제거기(칼만 + PLL)로 뺀다(원본 D-52, 이 앱 D-162). 기본 브랜치에는 M05S(스트리밍 칼만)가 없어 기본 명령이 멈춘다 |
| Node.js 22 이상 | — | `npm run doctor`로 확인 |
| Python 3 | — | `npm run doctor`가 찾는다(py → python → python3) |

**두 저장소를 같은 폴더 안에 나란히 둔다**(예: `C:\Users\…\Documents\GitHub\ecg-gui-design-review`와 `…\GitHub\ECG_denoising_method_comparision`). 다른 곳에 두었다면 환경 변수 `ECG_SOURCE`에 원본 저장소 폴더 경로를 넣는다.

## 2. 처음 한 번만

이 저장소 폴더의 터미널에서:

```
npm run doctor
npm run bridge:setup
```

`bridge:setup`은 재생 모드에 필요한 Python 패키지(numpy · scipy · PyWavelets · PyYAML · pandas · matplotlib · wfdb)를 설치한다. torch는 기본 기법(M_FE · M04 · M05S)에 필요 없다.

원본 저장소 브랜치 맞추기(원본 저장소 폴더에서, 한 줄씩):

```
git fetch origin
git switch claude/pli-harmonic-canceller
```

## 3. 띄우기 — 터미널 두 개

| 터미널 | 이 저장소 폴더에서 | 하는 일 |
|---|---|---|
| ① | `npm run bridge:replay` | 재생 브리지를 `127.0.0.1:8765`에 띄운다. 「-> http://127.0.0.1:8765/live.html」이 나오면 준비 완료(처음 약 4 s 데움) |
| ② | `npm run story` | 앱을 Edge로 연다(`http://127.0.0.1:5173/`) |

앱에서 오른쪽 위 **「실험실로 이동」**(또는 주소 `http://127.0.0.1:5173/?route=lab`) → 위쪽 **「실시간 측정」** 탭. 상태 칩이 「연결됨」이 되고 몇 초 뒤 파형이 차오른다. 끝낼 때는 두 터미널에서 `Ctrl+C`.

## 4. 캡처 요령

- **5 s 이상 기다린 뒤** 찍는다(표시 구간 5 s가 다 차야 화면 전체에 파형이 있다). 전원선 제거기는 시작 뒤 약 3 s 동안 주파수를 잡는 중이라 그동안은 입력을 그대로 낸다(원본 D-52) — 전원 간섭 장면은 10 s쯤 기다린다.
- 전체 화면: Edge에서 `F11`. 더 큰 해상도가 필요하면 `Ctrl` + `+`로 확대한 뒤 찍거나, 고해상도 모니터에서 찍는다.
- 화면 조작(모두 화면 안 버튼):
  - 표시 방식 「분리」(기법마다 한 칸) / 「중첩」(한 칸에 겹침)
  - 갱신 방식 「스크롤」 / 「스윕」
  - 공통 전처리(인과 · 블록 영위상 · 중앙값) — 바꾸면 화면이 한 번 비워졌다가 다시 찬다
  - 범례 칩을 눌러 기법을 켜고 끈다
  - 「진단 정보」를 펼치면 프레임 오류 · RTF 등이 보인다
- 3D 서고 배경 없이 파형만: 주소 뒤에 `&bg=0`(예: `http://127.0.0.1:5173/?route=lab&bg=0`).
- 다른 장면을 만들고 싶을 때는 브리지 옵션을 `--` 뒤에 붙인다(터미널 ①을 `Ctrl+C`로 끄고 다시):

| 보이고 싶은 것 | 명령 |
|---|---|
| 기법 고르기 | `npm run bridge:replay -- --methods M_FE,M04` |
| 전극 분리(회색 구간) | `npm run bridge:replay -- --leadoff-every 8` (8 s마다) |
| 샘플 손실 | `npm run bridge:replay -- --drop 0.01` (1 %) |
| 처음 공통 전처리 | `npm run bridge:replay -- --fe causal` (`causal` · `zerophase` · `median`) |
| 전원선 처리 비교(고조파 추적 제거기 ↔ 고정 노치) | `npm run bridge:replay -- --signal mitdb:100 --noise pli --snr 0 --pli notch` (기본은 `--pli canceller`) |

딥러닝 기법(M06 등)은 torch와 학습 체크포인트가 필요하다. 이 안내에서는 확인하지 않았다.

### 4.1 입력 신호 · 잡음 · SNR 고르기

원본 브리지의 기본 재생(`--replay synth`)은 「합성 심전도 + 무작위 혼합 잡음 8 dB, 120 s」 하나로 고정돼 있다. 아래 옵션을 붙이면 이 저장소의 `scripts/local/replay_signal.py`가 원본 저장소의 자료 · 잡음 · 혼합 코드로 신호 파일(`.cache/replay/*.csv`)을 만들고, 브리지를 `--replay csv`로 띄운다(원본 저장소는 고치지 않는다).

```
npm run bridge:replay -- --signal mitdb:100 --noise ma --snr 5
```

| 옵션 | 값 | 기본 |
|---|---|---|
| `--signal` | `synth`(원본 합성 심전도) · `mitdb:<기록>`(MIT-BIH, MLII 유도, 250 Hz로 리샘플). 기록 48개: 100–109 · 111–119 · 121–124 · 200–203 · 205 · 207–210 · 212–215 · 217 · 219–223 · 228 · 230–234 | `synth` |
| `--noise` | `none`(잡음 없음) · `mixed`(1~3종 무작위 혼합, 원본 기본과 같음) · 합성 `pli`(전원 간섭) · `bw_synth`(기저선 변동) · `ma_synth`(근육) · `em_synth`(전극 움직임) · `awgn`(백색) · `impulse` · **실제 NSTDB 기록** `bw` · `ma` · `em` | `mixed` |
| `--snr` | 입력 SNR [dB] | `8` |
| `--start` · `--sec` | MIT-BIH 기록에서 시작 시각 · 길이 [s]. 끝까지 가면 처음으로 되돌아간다 | `0` · `120` |
| `--seed` | 잡음 뽑기 씨앗(같은 값이면 같은 화면) | `7` |

- 실험실 탭과 맞추려면 같은 기록 · 잡음 · SNR을 고른다(예: 「D1 · 근육 잡음 · 5 dB」 ↔ `--signal mitdb:<기록> --noise ma --snr 5`). 잡음 구간을 뽑는 위치(씨앗)는 실험실 저장 자료와 다르다.
- 원본 브리지 옵션과 함께 쓸 수 있다: `npm run bridge:replay -- --signal mitdb:208 --noise em --snr 0 --leadoff-every 10`.
- 신호 진폭은 상대값이다. 브리지가 모의 보드 ADC 범위(10 bit, 중앙 512)에 맞춰 다시 늘이고 줄인다. 화면의 mV 눈금은 브리지 증폭 설정(`--gain` 1100, `--vref` 5 V)으로 환산한 값이다.
- 예시: `verification/demo-bridge-20261108/live_sweep_mitdb100_ma5dB_3840x2160.jpg`(MIT-BIH 100 + NSTDB 근육 잡음 5 dB).

## 5. 슬라이드에 넣을 때

화면 위쪽 출처 칩은 「브리지 출력」으로 나온다(브리지가 보드인지 재생인지 알려 주지 않기 때문). 캡처 아래 출처 줄에는 입력이 저장 · 합성 신호임을 적는다. 예: **「MIT-BIH 100 + NSTDB 근육 잡음 5 dB 재생 · 실제 처리 경로」**, 기본 재생이면 **「합성 신호 재생(serial_bridge.py --replay synth) · 실제 처리 경로」**. 이 프로젝트는 합성 입력을 실측으로 표기하지 않는다(`AGENTS.md`). 화면 자체에는 방어 문구를 넣지 않는다(D-160).

## 6. 문제 해결

| 증상 | 원인 · 해결 |
|---|---|
| `[문제] 원본 저장소(…)를 찾지 못함` | 두 저장소가 같은 폴더에 없다. 나란히 clone 하거나 `ECG_SOURCE`에 원본 폴더 경로 |
| `[확인] 원본 저장소 브랜치가 …` 뒤 `KeyError: unknown method 'M05S'` | 원본 저장소가 기본 브랜치다. §2의 `git switch claude/pli-harmonic-canceller` |
| `포트 8765 를 열 수 없다 (… Address already in use)` | 앞서 띄운 브리지가 아직 돈다. 그 터미널에서 `Ctrl+C` 후 다시 |
| `ModuleNotFoundError: No module named …` | `npm run bridge:setup`을 다시. 그래도 같으면 그 모듈 이름을 `npm run py -- -m pip install <이름>` |
| 앱의 상태가 「브리지 연결 없음」에서 안 바뀜 | 터미널 ①에 「-> http://127.0.0.1:8765/live.html」이 떴는지 확인. 포트 8765를 다른 프로그램이 쓰면 `npm run bridge:replay -- --http-port 8766` 하고, 앱을 띄우기 전에 환경 변수 `ECG_BRIDGE=http://127.0.0.1:8766` |
| `MIT-BIH 기록 … 없음` · `알 수 없는 잡음 …` | 메시지에 쓸 수 있는 기록 · 잡음 목록이 나온다. 그중에서 고른다 |
| `Missing script: "dev"` · `Could not read package.json` | 이 저장소 **루트 폴더**에서 `npm run …`을 친다(`docs/LOCAL_WINDOWS.md`) |

## 7. 쓰지 말 것

`verification/wave-fx-20261108/mock-bridge.cjs`는 그리기 연산량 측정용 가짜 브리지다. 기법 출력을 입력에서 계산하지 않고 **지어낸 값**(합성 파형 × 0.97 등)으로 보낸다. 발표 화면에 쓰지 않는다.

## 8. 관련 파일

| 파일 | 역할 |
|---|---|
| `scripts/local/run.mjs` (`bridge:setup` · `bridge:replay`) | 원본 저장소를 찾아 맞는 Python으로 브리지를 띄운다 |
| `scripts/local/replay_signal.py` | 신호 · 잡음 · SNR 옵션으로 재생 신호 CSV를 만든다(원본 `ecgdn.data`의 `mitdb` · `nstdb` · `noise` · `mixer`) |
| 원본 `data/raw/mitdb` · `data/raw/nstdb` | MIT-BIH 48 기록 · NSTDB 잡음 기록(원본 저장소에 들어 있음) |
| `prototype/v2/vite.config.ts` | 앱의 `/bridge/…` 요청을 `127.0.0.1:8765`(또는 `ECG_BRIDGE`)로 이어 준다 |
| `prototype/v2/src/live/` | 실시간 측정 화면(스트림 수신 · 축 · 그리기) |
| 원본 `scripts/serial_bridge.py` | 브리지(재생 모드 · SSE `/stream` · 공통 전처리 전환 `/fe`) |
| 원본 `requirements.txt` | 전체 패키지 목록(딥러닝 포함) |

## 실시간 탭 기법 선택 (2026-11-10)

- 실시간 측정 탭 오른쪽 「기법 선택」에서 브리지가 보내는 기법 중 **최대 3개**를 파형으로 표시한다. 브리지가 보내지 않는 기법은 흐리게 보이고 고를 수 없다.
- 브리지가 계산하는 기법은 **시작할 때** 정해진다(원본 `serial_bridge.py --methods`). `npm run bridge:replay`의 기본값은 `M_FE,M02,M03,M04,M05S`(고전 기법 5개)다.
- 딥러닝 기법을 넣으려면 torch가 설치된 Python에서 `npm run bridge:replay -- --methods M_FE,M04,M05S,M06,M08` 처럼 준다(체크포인트 축 기본 d1). 딥러닝은 CPU를 많이 쓰므로 표시는 3개로 두는 편이 좋다.
- `M_FE`와 `M01`은 같은 출력이다(공통 전처리가 곧 필터).
