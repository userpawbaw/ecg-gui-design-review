# BETA-R1 — Beta 1차 스틸 프롬프트 (ChatGPT 이미지 생성용)

작성 2026-09-27 · branch `claude/optimistic-goldberg-jnzpni` · Beta 트랙(별도 에이전트)
상태: **프롬프트 단계(생성 전)**. 이미지는 사용자가 ChatGPT로 생성한다(D-037, `BETA-R1-TOOL-TEST.md` §8).
INDEPENDENCE: **clean context** — 허용 파일만 읽음(`19`, `20` §2·§3·§7·§8, R1 Step1 패킷, REF 효과 기록, `11` §1D, baseline 스크린샷, `methods.json`, `archive.json` 저장 지표, `BETA-R1-TOOL-TEST.md`, `BETA-R1-test-02-chatgpt.webp`). Alpha 산출물은 보지 않았다.

> **생성 이미지의 픽셀·글자·파형·숫자는 canonical 자료가 아니다.** 실제 화면은 저장 출력으로 파형을 그리고, 문구·수치는 아래 §2의 저장값과 `methods.json` 문구로 교체한다(패킷 §1.1-3, `19` B5).

---

## 1. 스틸 구성 (7장 / 예산 9장)

| ID | 파일 | 장면 | 한 줄 | 브리프 · 레퍼런스 |
|---|---|---|---|---|
| — | `BETA-R1-test-02-chatgpt.webp` | Attract | **채택된 Attract 후보(원본 유지)**. S01은 이것의 결함 ①–⑤를 고친 개정판 | B1 |
| S01 | `BETA-R1-S01.png` | Attract · 대기(focus) | test-02 개정: 단위·눈금·팔레트·Reference 겹침·전원 간섭 잡음 모양 수정 | B1 · REF-001 역광 호→sweep match cut, REF-003 소나(칩에만) |
| S02 | `BETA-R1-S02.png` | Attract · 첫 3초(arrival) | 어둠 속 호의 빛만 있고 선은 아직 잡음뿐 — sweep이 막 떨어져 첫 박동이 드러나는 순간 | B1 · REF-001 역광·빛 몰기 |
| S03 | `BETA-R1-S03.png` | Story · 박자 1 | 합성 기록 D0 S038 · 20 dB · **Powerline** → 1위 M04 (19.4 dB) | B3+B4+B5 · REF-004 조건 선택→답 앞으로 회전, REF-005 성분 쌓기, REF-003 지나온 경로, REF-006 같은 표시점 재배열 |
| S04 | `BETA-R1-S04.png` | Story · 박자 2 | 같은 기록·같은 10초 · **Baseline wander** → 1위 M_FE (23.2 dB) — 표시점들이 재배열됨 | 위와 같음 |
| S05 | `BETA-R1-S05.png` | Story · 박자 3 | 같은 기록 · **Muscle** → 1위 M06L6 (9.9 dB) + 결론 한 줄 | 위와 같음 |
| S06 | `BETA-R1-S06.png` | Lab 전환 · 중간 키프레임 | Story의 파형 행이 **같은 선·같은 시각** 그대로 남고 Lab plot 틀이 그 주위에 조립됨. 역광 bloom은 0으로 | B5 · REF-001 match cut, REF-002 카메라 접근 |
| S07 | `BETA-R1-S07.png` | Lab 도착 | Lab 첫 화면: 입력/출력(+Reference 겹침) 두 행, 같은 시각의 sweep 커서, "잡음을 바꿔 보세요" | B5 (Lab 재배치는 2라운드라 최소 변경) |

- 쓰지 않은 브리프: **B2 Walk into the trace** — 공간 도입이 3초 목표(신호 발견)를 늦출 위험(패킷 REF-002 Risk)이 있고, 역광 호 도입(B1)과 역할이 겹친다. 2장 여유 예산은 사용자 피드백 후 보강용으로 남긴다.
- Story 세 장은 **같은 레이아웃에서 조건만 바뀐 키프레임**이다. 세 장을 넘겨 보면 REF-006의 "같은 점들이 사라지지 않고 재배열" 효과가 정지 이미지로도 보이게 설계했다.

## 2. 이미지에 쓰는 수치 (저장값만)

출처: `prototype/v2/public/archive.json` `scenes[id].storedMetrics[*].snr_imp` (D0 S038, 20 dB, 저장된 10초 한 구간). Oracle B01 제외 순위. 표시 문구는 1위 값만, 소수 1자리(패킷 F-025 값과 같음).

| 장면 id | 1위 (표시) | 저장 순위(B01 제외) | B01(oracle) |
|---|---|---|---|
| `d0-pli-20` | **M04 · 19.4 dB** | M04, M_FE, M06L6, M08, M03, M09, M06, M01, M05, M02 | 23.86 |
| `d0-bw_synth-20` | **M_FE · 23.2 dB** | M_FE, M04, M03, M06L6, M08, M09, M06, M01, M05, M02 | 23.2 |
| `d0-ma_synth-20` | **M06L6 · 9.9 dB** | M06L6, M08, M04, M09, M06, M01, M03, M05, M_FE, M02 | 9.5 |

- 이미지에는 1위 값 하나만 숫자로 쓴다. 나머지 방법은 **숫자 없는 표시점 + 코드명**으로 저장 순위대로 놓는다(순위는 이미지 안에서 정확할 필요는 없음 — 실제 UI는 이 표에서 그린다).
- Oracle B01은 순위 줄에 넣지 않고 "reference-required baseline"으로 따로 흐리게 둔다(§1.1-6). S04에서 M_FE와 B01이 같은 값(23.2)이고, S05에서는 M06L6(9.91)이 B01(9.5)보다 높다 — 이미지 문구로 해석하지 않는다.
- M06L6는 EXP-G 보조 실험이다(`methods.json` limit) → S05에 작은 주석.
- 방법 이름: M04 "Adaptive SWT", M_FE "Common front-end", M06L6 "Residual U-Net · L6" (`methods.json` name의 영문 표기).

## 3. 이번 프롬프트에 반영한 test-02 결함 수정

| # | 결함 | 결정 |
|---|---|---|
| ① | `mV`가 시간축 끝에 붙음 | `mV`는 **세로축 위쪽 왼편**에만. 시간축에는 `s` 라벨만 |
| ② | 선택 칩·소나에 입력 전용 주황 사용 | UI 크롬(칩·소나·경로·버튼·축)은 **무채색(흰색·회색 계열)**. 청록은 출력과 "출력의 방법(1위 표시)"에만, 주황은 입력 파형에만 |
| ③ | "10 s" 눈금이 축 끝이 아님 | 시간축 = 0–10 s, 1 s 간격 11개 눈금, **"0 s"는 왼쪽 끝, "10 s"는 오른쪽 끝 눈금 바로 아래** |
| ④ | Reference가 출력 아래 별도 행 | **결정: 겹침(overlay).** Reference는 출력과 같은 행·같은 ±mV 축에서 청록 선 **바로 뒤**에 얇은 회색 선으로 겹친다(v2.2.1 baseline과 같은 방식). 별도 행 금지 |
| ⑤ | "Powerline"인데 잡음이 광대역처럼 보임 | 조건별 잡음 모양을 명시: Powerline = 일정한 진폭의 촘촘하고 **규칙적인** 가는 물결, Baseline wander = 기저선이 **느리고 크게** 출렁임, Muscle = 불규칙한 **터지는** 고주파 떨림 |

---

## 4. 사용자 실행 방법 (ChatGPT)

1. **한 채팅에서 순서대로** 실행하는 것을 권한다(S01 → S07). 같은 채팅이면 앞 이미지의 스타일이 이어져 일관성이 좋아진다. 다만 한 채팅이 길어져 스타일이 흐트러지면 새 채팅을 열고 다시 시작한다.
2. 첫 메시지에 `BETA-R1-test-02-chatgpt.webp`를 **첨부**하고 "Use the attached image only as a style reference (lighting, typography, spacing). Do not copy its layout errors." 한 줄을 프롬프트 앞에 붙인다. 이후 프롬프트에는 첨부 없이 붙여 넣으면 된다.
3. §6의 각 코드 블록은 STYLE BLOCK이 이미 합쳐진 **완결 프롬프트**다. 코드 블록 하나를 통째로 붙여 넣으면 된다. 16:9로 나오지 않으면 "Make it 16:9 landscape, 1920x1080." 한 줄로 재요청.
4. 스틸당 **최대 2회 재생성**까지만. 그래도 문구가 틀리면 그대로 저장하고 틀린 곳을 메모로 알려 주면 된다(글자는 어차피 canonical이 아니다).
5. 저장 위치: `docs/uiux_system/rounds/R1/beta/` 에 표의 파일명으로(`.png` 또는 받은 형식 그대로 `.webp`).

---

## 5. STYLE BLOCK (모든 프롬프트에 그대로 들어감)

```text
STYLE BLOCK — ECG Signal Studio, R1 exhibit screens (keep identical across all images)
Format: one single 16:9 landscape image, 1920x1080, a finished product screenshot of a high-end interactive museum exhibit about ECG denoising research. Stored replay only, never a live patient monitor. Awwwards-level art direction, not a generic futuristic medical dashboard.
Background: near-black (#080808 to deep blue-black #0b1016), subtle film grain, very generous negative space.
Signature light: a huge dark planet-like horizon disc low in the frame, lit only from behind so a thin cool silver-white rim of light forms an arc; where needed its light becomes a single thin vertical silver-white sweep line. The light never touches or distorts the waveforms.
Waveforms: perfectly flat 2D line plots facing the viewer, no perspective, no tilt, no bending, no 3D. Thin crisp lines. The waveform is always the most important object.
Reserved colors (strict): amber #ffbc79 ONLY for the noisy input waveform; mint-teal #67e7c3 ONLY for the cleaned output waveform and for the single winning method mark that produced it; neutral grey #c4c6c7 ONLY for the Reference line, which is always drawn as a thin grey line directly behind the teal output on the same row and same axis (overlaid, never a separate row). Everything else (chips, sonar rings, paths, buttons, axes, text) is neutral white/grey. No other saturated color anywhere.
Axes: amplitude unit "mV" only at the top of the vertical axis on the left. Time axis 0–10 s with 11 evenly spaced ticks; "0 s" exactly under the left end tick and "10 s" exactly under the right end tick. Input and output rows share the same time positions and the same mV scale.
Noise look by condition: Powerline = a fine, perfectly regular, constant-amplitude ripple riding on the trace; Baseline wander = the baseline slowly rising and falling in large smooth waves; Muscle = irregular bursty high-frequency fuzz. The same heartbeats (P, sharp narrow QRS, rounded T, about one beat per 0.8 s) stay visible through the noise at the same positions as in the clean output.
Typography: large, tight, confident neo-grotesk headline; small calm uppercase micro-labels with generous letter spacing; very little text; render every quoted text exactly and add no other text.
UI chrome: pill-shaped chips and buttons with thin neutral outlines; selected chip = filled light grey with dark text; sonar = two thin neutral silver-white concentric outline rings.
Negative: no hospital bedside monitor, no BPM or heart-rate numbers, no vital signs, no diagnosis text, no hologram heart, no human body, no dashboard data cards, no random neon or cyberpunk, no glowing grid floor, no planet texture or continents, no logos, no dense unreadable microcopy, no progress bars implying live processing, no "recording" dot at the end of a waveform.
Fidelity: crisp vector-sharp UI, consistent spacing and component language across the series, credible hierarchy.
```

---

## 6. 스틸별 프롬프트 (각각 그대로 붙여 넣기)

### S01 · Attract (focus) — `BETA-R1-S01.png`

- 보여야 할 것: test-02 구도 유지 + §3 결함 ①–⑤ 수정. 한 행 파형, sweep 왼쪽 주황 입력(전원 간섭 잡음), 오른쪽 청록 출력 + 바로 뒤 회색 Reference 겹침.
- 레퍼런스: REF-001 역광 호 → sweep match cut(EFX-001-02·03), REF-003 소나(EFX-003-03)를 선택 칩에만.

```text
STYLE BLOCK — ECG Signal Studio, R1 exhibit screens (keep identical across all images)
Format: one single 16:9 landscape image, 1920x1080, a finished product screenshot of a high-end interactive museum exhibit about ECG denoising research. Stored replay only, never a live patient monitor. Awwwards-level art direction, not a generic futuristic medical dashboard.
Background: near-black (#080808 to deep blue-black #0b1016), subtle film grain, very generous negative space.
Signature light: a huge dark planet-like horizon disc low in the frame, lit only from behind so a thin cool silver-white rim of light forms an arc; where needed its light becomes a single thin vertical silver-white sweep line. The light never touches or distorts the waveforms.
Waveforms: perfectly flat 2D line plots facing the viewer, no perspective, no tilt, no bending, no 3D. Thin crisp lines. The waveform is always the most important object.
Reserved colors (strict): amber #ffbc79 ONLY for the noisy input waveform; mint-teal #67e7c3 ONLY for the cleaned output waveform and for the single winning method mark that produced it; neutral grey #c4c6c7 ONLY for the Reference line, which is always drawn as a thin grey line directly behind the teal output on the same row and same axis (overlaid, never a separate row). Everything else (chips, sonar rings, paths, buttons, axes, text) is neutral white/grey. No other saturated color anywhere.
Axes: amplitude unit "mV" only at the top of the vertical axis on the left. Time axis 0–10 s with 11 evenly spaced ticks; "0 s" exactly under the left end tick and "10 s" exactly under the right end tick. Input and output rows share the same time positions and the same mV scale.
Noise look by condition: Powerline = a fine, perfectly regular, constant-amplitude ripple riding on the trace; Baseline wander = the baseline slowly rising and falling in large smooth waves; Muscle = irregular bursty high-frequency fuzz. The same heartbeats (P, sharp narrow QRS, rounded T, about one beat per 0.8 s) stay visible through the noise at the same positions as in the clean output.
Typography: large, tight, confident neo-grotesk headline; small calm uppercase micro-labels with generous letter spacing; very little text; render every quoted text exactly and add no other text.
UI chrome: pill-shaped chips and buttons with thin neutral outlines; selected chip = filled light grey with dark text; sonar = two thin neutral silver-white concentric outline rings.
Negative: no hospital bedside monitor, no BPM or heart-rate numbers, no vital signs, no diagnosis text, no hologram heart, no human body, no dashboard data cards, no random neon or cyberpunk, no glowing grid floor, no planet texture or continents, no logos, no dense unreadable microcopy, no progress bars implying live processing, no "recording" dot at the end of a waveform.
Fidelity: crisp vector-sharp UI, consistent spacing and component language across the series, credible hierarchy.

SCENE S01 — Attract screen, idle focus state.
One single waveform row across the middle of the screen (about 80% width), with the backlit horizon arc below it; the arc's rim light rises into one vertical sweep line that crosses the row at its horizontal center. Left of the sweep line: the amber noisy input, with the Powerline noise look (fine regular ripple) and the heartbeats clearly visible through it. Right of the sweep line: the same heartbeats continue as the clean teal output, with the thin grey Reference line directly behind it on the same row (overlaid, almost coincident). One shared time axis below the row (0 s … 10 s, 11 ticks, labels only at both ends), "mV" at the top-left of the row.
Top-left: headline "Signal, out of noise"; below it small text "Stored replay · synthetic record".
Top-right: three pill chips "Powerline", "Baseline wander", "Muscle"; "Powerline" is selected (filled light grey, dark text) with two thin neutral silver-white sonar rings around its left edge.
Bottom-center: a light-grey pill button with a thin mouse-wheel icon and the text "Scroll or click to enter".
Bottom-left: tiny letter-spaced caption "REPLAY — no live device session".
No other text.
```

### S02 · Attract (arrival, 첫 3초) — `BETA-R1-S02.png`

- 보여야 할 것: 3초 목표 "어두운 화면에서 잡음에 묻힌 선 하나가 심장 박동으로 드러나는 순간". 역광 호가 막 밝아지고, sweep 선이 왼쪽 가장자리 근처에 막 떨어짐. 선 대부분은 아직 주황 잡음, sweep 오른쪽이 아니라 **sweep이 지나간 왼쪽 좁은 구간만** 청록.
- 주의: sweep은 "처리 중" 연출이 아니라 저장 재생의 드러냄이다 → 진행률·퍼센트·"processing" 문구 금지.
- 레퍼런스: REF-001 역광 지구 도입(빛 몰기), match cut의 시작점.

```text
STYLE BLOCK — ECG Signal Studio, R1 exhibit screens (keep identical across all images)
Format: one single 16:9 landscape image, 1920x1080, a finished product screenshot of a high-end interactive museum exhibit about ECG denoising research. Stored replay only, never a live patient monitor. Awwwards-level art direction, not a generic futuristic medical dashboard.
Background: near-black (#080808 to deep blue-black #0b1016), subtle film grain, very generous negative space.
Signature light: a huge dark planet-like horizon disc low in the frame, lit only from behind so a thin cool silver-white rim of light forms an arc; where needed its light becomes a single thin vertical silver-white sweep line. The light never touches or distorts the waveforms.
Waveforms: perfectly flat 2D line plots facing the viewer, no perspective, no tilt, no bending, no 3D. Thin crisp lines. The waveform is always the most important object.
Reserved colors (strict): amber #ffbc79 ONLY for the noisy input waveform; mint-teal #67e7c3 ONLY for the cleaned output waveform and for the single winning method mark that produced it; neutral grey #c4c6c7 ONLY for the Reference line, which is always drawn as a thin grey line directly behind the teal output on the same row and same axis (overlaid, never a separate row). Everything else (chips, sonar rings, paths, buttons, axes, text) is neutral white/grey. No other saturated color anywhere.
Axes: amplitude unit "mV" only at the top of the vertical axis on the left. Time axis 0–10 s with 11 evenly spaced ticks; "0 s" exactly under the left end tick and "10 s" exactly under the right end tick. Input and output rows share the same time positions and the same mV scale.
Noise look by condition: Powerline = a fine, perfectly regular, constant-amplitude ripple riding on the trace; Baseline wander = the baseline slowly rising and falling in large smooth waves; Muscle = irregular bursty high-frequency fuzz. The same heartbeats (P, sharp narrow QRS, rounded T, about one beat per 0.8 s) stay visible through the noise at the same positions as in the clean output.
Typography: large, tight, confident neo-grotesk headline; small calm uppercase micro-labels with generous letter spacing; very little text; render every quoted text exactly and add no other text.
UI chrome: pill-shaped chips and buttons with thin neutral outlines; selected chip = filled light grey with dark text; sonar = two thin neutral silver-white concentric outline rings.
Negative: no hospital bedside monitor, no BPM or heart-rate numbers, no vital signs, no diagnosis text, no hologram heart, no human body, no dashboard data cards, no random neon or cyberpunk, no glowing grid floor, no planet texture or continents, no logos, no dense unreadable microcopy, no progress bars implying live processing, no "recording" dot at the end of a waveform.
Fidelity: crisp vector-sharp UI, consistent spacing and component language across the series, credible hierarchy.

SCENE S02 — Attract screen, the first three seconds (arrival keyframe). The screen is darker and emptier than the idle state.
The backlit horizon arc is just beginning to glow (thin, faint silver rim, brightest at its top). One waveform row spans the middle of the screen (about 80% width). Almost the whole row is the amber noisy input with the Powerline noise look; the heartbeats are only faintly visible through the noise. A single thin vertical silver-white sweep line has just dropped from the arc's light and stands at about 15% from the left edge of the row; only the short part of the row to the LEFT of the sweep line (already swept) is shown as the clean teal output with the thin grey Reference line directly behind it; everything to the right of the sweep line is still amber noisy input. Same time axis as the series (0 s … 10 s, 11 ticks, labels at both ends), "mV" at the top-left of the row, both very dim.
Top-left: headline "Signal, out of noise" at low opacity, as if fading in.
No chips, no button, no other text yet except bottom-left tiny letter-spaced caption "REPLAY — no live device session".
Mood: quiet, dark, one line of light about to reveal a heartbeat.
```

### S03 · Story 박자 1 — Powerline → M04 — `BETA-R1-S03.png`

- 보여야 할 것: 같은 합성 기록의 조건 선택 → 그 조건의 1위 방법이 앞으로. 레이아웃은 S03–S05 동일(조건만 바뀜).
  - 왼쪽 세로 **조건 경로**(REF-003): 3개 정거장, 현재 = 소나 링, 지나온 구간 = 굵은 흰색, 남은 구간 = 가늘고 흐림.
  - 가운데 **파형 두 행 + 잡음 띠**(REF-005): 위 = "Noise" 얇은 띠(입력 − Reference, 흐린 주황), 가운데 = 입력(주황), 아래 = 출력(청록) + Reference(회색) 겹침. 모든 행 같은 시간축·같은 mV 축.
  - 오른쪽 **방법 표시점 열**(REF-006 + REF-004): 10개 방법 코드가 작은 점으로 세로 순위 배열, 1위만 청록 + 숫자. Oracle은 맨 아래 따로 흐린 속빈 점.
- 레퍼런스: REF-004 필터 누르면 세계가 돌아 최대 군집 앞으로(→ 1위 방법 앞으로 정렬), REF-005 성분 쌓기, REF-003 지나온 경로 + 소나, REF-006 같은 표시점 재배열.

```text
STYLE BLOCK — ECG Signal Studio, R1 exhibit screens (keep identical across all images)
Format: one single 16:9 landscape image, 1920x1080, a finished product screenshot of a high-end interactive museum exhibit about ECG denoising research. Stored replay only, never a live patient monitor. Awwwards-level art direction, not a generic futuristic medical dashboard.
Background: near-black (#080808 to deep blue-black #0b1016), subtle film grain, very generous negative space.
Signature light: a huge dark planet-like horizon disc low in the frame, lit only from behind so a thin cool silver-white rim of light forms an arc; where needed its light becomes a single thin vertical silver-white sweep line. The light never touches or distorts the waveforms.
Waveforms: perfectly flat 2D line plots facing the viewer, no perspective, no tilt, no bending, no 3D. Thin crisp lines. The waveform is always the most important object.
Reserved colors (strict): amber #ffbc79 ONLY for the noisy input waveform; mint-teal #67e7c3 ONLY for the cleaned output waveform and for the single winning method mark that produced it; neutral grey #c4c6c7 ONLY for the Reference line, which is always drawn as a thin grey line directly behind the teal output on the same row and same axis (overlaid, never a separate row). Everything else (chips, sonar rings, paths, buttons, axes, text) is neutral white/grey. No other saturated color anywhere.
Axes: amplitude unit "mV" only at the top of the vertical axis on the left. Time axis 0–10 s with 11 evenly spaced ticks; "0 s" exactly under the left end tick and "10 s" exactly under the right end tick. Input and output rows share the same time positions and the same mV scale.
Noise look by condition: Powerline = a fine, perfectly regular, constant-amplitude ripple riding on the trace; Baseline wander = the baseline slowly rising and falling in large smooth waves; Muscle = irregular bursty high-frequency fuzz. The same heartbeats (P, sharp narrow QRS, rounded T, about one beat per 0.8 s) stay visible through the noise at the same positions as in the clean output.
Typography: large, tight, confident neo-grotesk headline; small calm uppercase micro-labels with generous letter spacing; very little text; render every quoted text exactly and add no other text.
UI chrome: pill-shaped chips and buttons with thin neutral outlines; selected chip = filled light grey with dark text; sonar = two thin neutral silver-white concentric outline rings.
Negative: no hospital bedside monitor, no BPM or heart-rate numbers, no vital signs, no diagnosis text, no hologram heart, no human body, no dashboard data cards, no random neon or cyberpunk, no glowing grid floor, no planet texture or continents, no logos, no dense unreadable microcopy, no progress bars implying live processing, no "recording" dot at the end of a waveform.
Fidelity: crisp vector-sharp UI, consistent spacing and component language across the series, credible hierarchy.

SCENE S03 — Story screen, beat 1 of 3. Same layout will be reused for beats 2 and 3; only the condition changes.
Top-left small header: "Same synthetic ECG · record D0 S038 · 20 dB · stored 10-second segment".
Headline (large, left-aligned under the header): "Change the noise, the best method changes."
LEFT column (narrow): a vertical condition path with three stations labeled top to bottom "Powerline", "Baseline wander", "Muscle". The current station "Powerline" has two thin neutral silver-white sonar rings; the path below it is thin and faint (not yet visited).
CENTER (the hero, about 60% of the width): three stacked rows sharing one time axis (0 s … 10 s, 11 ticks, labels at both ends) and one mV scale ("mV" at top-left):
  row 1, very thin, labeled "Noise": a faint low-opacity amber strip showing only the Powerline ripple (fine, regular, constant amplitude);
  row 2, labeled "Input": the amber noisy ECG (heartbeats plus the fine regular Powerline ripple);
  row 3, labeled "Output · M04 Adaptive SWT": the clean teal ECG with the thin grey Reference line directly behind it (overlaid), heartbeats at exactly the same horizontal positions as in row 2.
RIGHT column: a vertical ranked column of ten small method marks (dots with short code labels), top to bottom "M04", "M_FE", "M06L6", "M08", "M03", "M09", "M06", "M01", "M05", "M02". Only the top mark "M04" is teal and larger, with the text "SNR improvement 19.4 dB" next to it; all other marks are small neutral grey dots with no numbers. Below the column, separated by a gap, one hollow faint grey mark labeled "B01 · oracle, needs reference".
Bottom-center: a small neutral pill with a mouse-wheel icon "Scroll for next noise".
Bottom-left tiny letter-spaced caption: "REPLAY — no live device session".
No other text, no other numbers.
```

### S04 · Story 박자 2 — Baseline wander → M_FE — `BETA-R1-S04.png`

```text
STYLE BLOCK — ECG Signal Studio, R1 exhibit screens (keep identical across all images)
Format: one single 16:9 landscape image, 1920x1080, a finished product screenshot of a high-end interactive museum exhibit about ECG denoising research. Stored replay only, never a live patient monitor. Awwwards-level art direction, not a generic futuristic medical dashboard.
Background: near-black (#080808 to deep blue-black #0b1016), subtle film grain, very generous negative space.
Signature light: a huge dark planet-like horizon disc low in the frame, lit only from behind so a thin cool silver-white rim of light forms an arc; where needed its light becomes a single thin vertical silver-white sweep line. The light never touches or distorts the waveforms.
Waveforms: perfectly flat 2D line plots facing the viewer, no perspective, no tilt, no bending, no 3D. Thin crisp lines. The waveform is always the most important object.
Reserved colors (strict): amber #ffbc79 ONLY for the noisy input waveform; mint-teal #67e7c3 ONLY for the cleaned output waveform and for the single winning method mark that produced it; neutral grey #c4c6c7 ONLY for the Reference line, which is always drawn as a thin grey line directly behind the teal output on the same row and same axis (overlaid, never a separate row). Everything else (chips, sonar rings, paths, buttons, axes, text) is neutral white/grey. No other saturated color anywhere.
Axes: amplitude unit "mV" only at the top of the vertical axis on the left. Time axis 0–10 s with 11 evenly spaced ticks; "0 s" exactly under the left end tick and "10 s" exactly under the right end tick. Input and output rows share the same time positions and the same mV scale.
Noise look by condition: Powerline = a fine, perfectly regular, constant-amplitude ripple riding on the trace; Baseline wander = the baseline slowly rising and falling in large smooth waves; Muscle = irregular bursty high-frequency fuzz. The same heartbeats (P, sharp narrow QRS, rounded T, about one beat per 0.8 s) stay visible through the noise at the same positions as in the clean output.
Typography: large, tight, confident neo-grotesk headline; small calm uppercase micro-labels with generous letter spacing; very little text; render every quoted text exactly and add no other text.
UI chrome: pill-shaped chips and buttons with thin neutral outlines; selected chip = filled light grey with dark text; sonar = two thin neutral silver-white concentric outline rings.
Negative: no hospital bedside monitor, no BPM or heart-rate numbers, no vital signs, no diagnosis text, no hologram heart, no human body, no dashboard data cards, no random neon or cyberpunk, no glowing grid floor, no planet texture or continents, no logos, no dense unreadable microcopy, no progress bars implying live processing, no "recording" dot at the end of a waveform.
Fidelity: crisp vector-sharp UI, consistent spacing and component language across the series, credible hierarchy.

SCENE S04 — Story screen, beat 2 of 3. Exactly the same layout, header and headline as beat 1; only the condition and the ranking change.
Top-left small header: "Same synthetic ECG · record D0 S038 · 20 dB · stored 10-second segment".
Headline: "Change the noise, the best method changes."
LEFT column: vertical condition path "Powerline", "Baseline wander", "Muscle". The segment from "Powerline" to "Baseline wander" is now drawn thick solid white (visited); the current station "Baseline wander" has two thin neutral silver-white sonar rings; the path below it is thin and faint.
CENTER: the same three stacked rows on one time axis (0 s … 10 s, 11 ticks, labels at both ends) and one mV scale ("mV" at top-left):
  row 1 "Noise": a faint low-opacity amber strip showing only a slow, large, smooth rise-and-fall of the baseline;
  row 2 "Input": the amber ECG whose baseline slowly rises and falls in large smooth waves, heartbeats clearly visible on top;
  row 3 "Output · M_FE Common front-end": the clean teal ECG with the thin grey Reference line directly behind it (overlaid), identical heartbeat positions.
RIGHT column: the same ten method marks, re-ordered top to bottom "M_FE", "M04", "M03", "M06L6", "M08", "M09", "M06", "M01", "M05", "M02". Only "M_FE" is teal and larger with the text "SNR improvement 23.2 dB"; all others small neutral grey dots without numbers. Faint thin curved motion trails show that the marks moved from their previous positions (the marks are the same objects, re-arranged, none disappeared). Below, separated: hollow faint grey mark "B01 · oracle, needs reference".
Bottom-center pill with mouse-wheel icon: "Scroll for next noise".
Bottom-left tiny caption: "REPLAY — no live device session".
No other text, no other numbers.
```

### S05 · Story 박자 3 — Muscle → M06L6 — `BETA-R1-S05.png`

- 추가: 결론 한 줄 + 다음 행동(Lab 진입) 신호. M06L6 보조 실험 주석.

```text
STYLE BLOCK — ECG Signal Studio, R1 exhibit screens (keep identical across all images)
Format: one single 16:9 landscape image, 1920x1080, a finished product screenshot of a high-end interactive museum exhibit about ECG denoising research. Stored replay only, never a live patient monitor. Awwwards-level art direction, not a generic futuristic medical dashboard.
Background: near-black (#080808 to deep blue-black #0b1016), subtle film grain, very generous negative space.
Signature light: a huge dark planet-like horizon disc low in the frame, lit only from behind so a thin cool silver-white rim of light forms an arc; where needed its light becomes a single thin vertical silver-white sweep line. The light never touches or distorts the waveforms.
Waveforms: perfectly flat 2D line plots facing the viewer, no perspective, no tilt, no bending, no 3D. Thin crisp lines. The waveform is always the most important object.
Reserved colors (strict): amber #ffbc79 ONLY for the noisy input waveform; mint-teal #67e7c3 ONLY for the cleaned output waveform and for the single winning method mark that produced it; neutral grey #c4c6c7 ONLY for the Reference line, which is always drawn as a thin grey line directly behind the teal output on the same row and same axis (overlaid, never a separate row). Everything else (chips, sonar rings, paths, buttons, axes, text) is neutral white/grey. No other saturated color anywhere.
Axes: amplitude unit "mV" only at the top of the vertical axis on the left. Time axis 0–10 s with 11 evenly spaced ticks; "0 s" exactly under the left end tick and "10 s" exactly under the right end tick. Input and output rows share the same time positions and the same mV scale.
Noise look by condition: Powerline = a fine, perfectly regular, constant-amplitude ripple riding on the trace; Baseline wander = the baseline slowly rising and falling in large smooth waves; Muscle = irregular bursty high-frequency fuzz. The same heartbeats (P, sharp narrow QRS, rounded T, about one beat per 0.8 s) stay visible through the noise at the same positions as in the clean output.
Typography: large, tight, confident neo-grotesk headline; small calm uppercase micro-labels with generous letter spacing; very little text; render every quoted text exactly and add no other text.
UI chrome: pill-shaped chips and buttons with thin neutral outlines; selected chip = filled light grey with dark text; sonar = two thin neutral silver-white concentric outline rings.
Negative: no hospital bedside monitor, no BPM or heart-rate numbers, no vital signs, no diagnosis text, no hologram heart, no human body, no dashboard data cards, no random neon or cyberpunk, no glowing grid floor, no planet texture or continents, no logos, no dense unreadable microcopy, no progress bars implying live processing, no "recording" dot at the end of a waveform.
Fidelity: crisp vector-sharp UI, consistent spacing and component language across the series, credible hierarchy.

SCENE S05 — Story screen, beat 3 of 3 (last beat). Exactly the same layout as beats 1 and 2.
Top-left small header: "Same synthetic ECG · record D0 S038 · 20 dB · stored 10-second segment".
Headline: "Change the noise, the best method changes."
LEFT column: vertical condition path "Powerline", "Baseline wander", "Muscle"; the whole path from "Powerline" to "Muscle" is now thick solid white (all visited); the current station "Muscle" has two thin neutral silver-white sonar rings.
CENTER: the same three stacked rows on one time axis (0 s … 10 s, 11 ticks, labels at both ends) and one mV scale ("mV" at top-left):
  row 1 "Noise": a faint low-opacity amber strip showing irregular bursty high-frequency fuzz;
  row 2 "Input": the amber ECG with irregular bursts of fine fuzz, heartbeats visible through it;
  row 3 "Output · M06L6 Residual U-Net · L6": the clean teal ECG with the thin grey Reference line directly behind it (overlaid), identical heartbeat positions.
RIGHT column: the same ten marks re-ordered top to bottom "M06L6", "M08", "M04", "M09", "M06", "M01", "M03", "M05", "M_FE", "M02". Only "M06L6" is teal and larger with the text "SNR improvement 9.9 dB" and a tiny note under it "auxiliary experiment"; all others small neutral grey dots without numbers; faint curved trails from previous positions. Below, separated: hollow faint grey mark "B01 · oracle, needs reference".
Below the three rows, one calm line of text: "Three noises, three different winners — on this one stored segment."
Bottom-center: a light-grey pill button with a mouse-wheel icon: "Click to try it yourself".
Bottom-left tiny caption: "REPLAY — no live device session".
No other text, no other numbers.
```

### S06 · Lab 전환 (중간 키프레임) — `BETA-R1-S06.png`

- 보여야 할 것: Story의 입력·출력 행이 **같은 모양·같은 시각**으로 제자리에 남은 채 커지고, 그 둘레에 Lab plot 틀(격자·축 눈금·패널 테두리)이 조립되는 중. 역광 호는 아래로 내려가며 거의 꺼짐(Lab 진입 전 bloom 0, REF-001 Risk). 방법 표시점·조건 경로는 흐려지며 빠짐. 이것은 한 장면 안의 카메라·프레임 변화이지 파형 변형이 아니다.
- 레퍼런스: REF-001 match cut(형태 연속으로 장면 잇기), REF-002 스크롤 = 카메라 접근.

```text
STYLE BLOCK — ECG Signal Studio, R1 exhibit screens (keep identical across all images)
Format: one single 16:9 landscape image, 1920x1080, a finished product screenshot of a high-end interactive museum exhibit about ECG denoising research. Stored replay only, never a live patient monitor. Awwwards-level art direction, not a generic futuristic medical dashboard.
Background: near-black (#080808 to deep blue-black #0b1016), subtle film grain, very generous negative space.
Signature light: a huge dark planet-like horizon disc low in the frame, lit only from behind so a thin cool silver-white rim of light forms an arc; where needed its light becomes a single thin vertical silver-white sweep line. The light never touches or distorts the waveforms.
Waveforms: perfectly flat 2D line plots facing the viewer, no perspective, no tilt, no bending, no 3D. Thin crisp lines. The waveform is always the most important object.
Reserved colors (strict): amber #ffbc79 ONLY for the noisy input waveform; mint-teal #67e7c3 ONLY for the cleaned output waveform and for the single winning method mark that produced it; neutral grey #c4c6c7 ONLY for the Reference line, which is always drawn as a thin grey line directly behind the teal output on the same row and same axis (overlaid, never a separate row). Everything else (chips, sonar rings, paths, buttons, axes, text) is neutral white/grey. No other saturated color anywhere.
Axes: amplitude unit "mV" only at the top of the vertical axis on the left. Time axis 0–10 s with 11 evenly spaced ticks; "0 s" exactly under the left end tick and "10 s" exactly under the right end tick. Input and output rows share the same time positions and the same mV scale.
Noise look by condition: Powerline = a fine, perfectly regular, constant-amplitude ripple riding on the trace; Baseline wander = the baseline slowly rising and falling in large smooth waves; Muscle = irregular bursty high-frequency fuzz. The same heartbeats (P, sharp narrow QRS, rounded T, about one beat per 0.8 s) stay visible through the noise at the same positions as in the clean output.
Typography: large, tight, confident neo-grotesk headline; small calm uppercase micro-labels with generous letter spacing; very little text; render every quoted text exactly and add no other text.
UI chrome: pill-shaped chips and buttons with thin neutral outlines; selected chip = filled light grey with dark text; sonar = two thin neutral silver-white concentric outline rings.
Negative: no hospital bedside monitor, no BPM or heart-rate numbers, no vital signs, no diagnosis text, no hologram heart, no human body, no dashboard data cards, no random neon or cyberpunk, no glowing grid floor, no planet texture or continents, no logos, no dense unreadable microcopy, no progress bars implying live processing, no "recording" dot at the end of a waveform.
Fidelity: crisp vector-sharp UI, consistent spacing and component language across the series, credible hierarchy.

SCENE S06 — Transition keyframe from the Story screen into the Lab (halfway through a smooth camera push-in).
The two waveform rows from the Story screen keep exactly the same shapes and the same time positions, now larger and centered: upper row the amber noisy input with bursty Muscle fuzz, lower row the clean teal output with the thin grey Reference line directly behind it (overlaid). A thin vertical silver-white sweep line crosses both rows at about 40% from the left, at the same time position in both rows.
Around the rows, a precise lab plot frame is assembling: a faint dark-blue panel with rounded corners fading in, thin horizontal and vertical grid lines drawing in from the edges, mV tick labels "-2.0", "-1.0", "0", "1.0", "2.0" appearing on the left of each row with "mV" at the top-left, and a time axis 0 s … 10 s with labels at both ends under each row.
The backlit horizon arc is sinking out of the bottom of the frame and nearly extinguished, only a faint rim left. The condition path and the method marks from the Story screen are fading out at the far left and far right edges, blurred and dim.
Top-left small text fading in: "Lab · same signal, same moment".
No other text, no numbers besides the axis tick labels.
```

### S07 · Lab 도착 — `BETA-R1-S07.png`

- 보여야 할 것: 전환이 끝난 Lab 첫 프레임. v2.2.1 Lab의 구조(입력 행 / 출력 행 + Reference 겹침, 같은 ±mV 축, sweep 커서)는 유지하고 시리즈의 어두운 스타일만 입힌다 — **Lab 재배치는 2라운드(D-033)라 새 레이아웃을 제안하지 않는다.** 방금 본 Muscle 조건·M06L6가 선택된 채로 도착, 잡음 칩이 "직접 바꿔 보기" 조작으로 전면에.
- 레퍼런스: REF-004 필터 칩(선택하면 장면이 그 답으로 이동) — Lab에서는 칩을 누르면 같은 시각을 유지한 채 조건만 바뀜.

```text
STYLE BLOCK — ECG Signal Studio, R1 exhibit screens (keep identical across all images)
Format: one single 16:9 landscape image, 1920x1080, a finished product screenshot of a high-end interactive museum exhibit about ECG denoising research. Stored replay only, never a live patient monitor. Awwwards-level art direction, not a generic futuristic medical dashboard.
Background: near-black (#080808 to deep blue-black #0b1016), subtle film grain, very generous negative space.
Signature light: a huge dark planet-like horizon disc low in the frame, lit only from behind so a thin cool silver-white rim of light forms an arc; where needed its light becomes a single thin vertical silver-white sweep line. The light never touches or distorts the waveforms.
Waveforms: perfectly flat 2D line plots facing the viewer, no perspective, no tilt, no bending, no 3D. Thin crisp lines. The waveform is always the most important object.
Reserved colors (strict): amber #ffbc79 ONLY for the noisy input waveform; mint-teal #67e7c3 ONLY for the cleaned output waveform and for the single winning method mark that produced it; neutral grey #c4c6c7 ONLY for the Reference line, which is always drawn as a thin grey line directly behind the teal output on the same row and same axis (overlaid, never a separate row). Everything else (chips, sonar rings, paths, buttons, axes, text) is neutral white/grey. No other saturated color anywhere.
Axes: amplitude unit "mV" only at the top of the vertical axis on the left. Time axis 0–10 s with 11 evenly spaced ticks; "0 s" exactly under the left end tick and "10 s" exactly under the right end tick. Input and output rows share the same time positions and the same mV scale.
Noise look by condition: Powerline = a fine, perfectly regular, constant-amplitude ripple riding on the trace; Baseline wander = the baseline slowly rising and falling in large smooth waves; Muscle = irregular bursty high-frequency fuzz. The same heartbeats (P, sharp narrow QRS, rounded T, about one beat per 0.8 s) stay visible through the noise at the same positions as in the clean output.
Typography: large, tight, confident neo-grotesk headline; small calm uppercase micro-labels with generous letter spacing; very little text; render every quoted text exactly and add no other text.
UI chrome: pill-shaped chips and buttons with thin neutral outlines; selected chip = filled light grey with dark text; sonar = two thin neutral silver-white concentric outline rings.
Negative: no hospital bedside monitor, no BPM or heart-rate numbers, no vital signs, no diagnosis text, no hologram heart, no human body, no dashboard data cards, no random neon or cyberpunk, no glowing grid floor, no planet texture or continents, no logos, no dense unreadable microcopy, no progress bars implying live processing, no "recording" dot at the end of a waveform.
Fidelity: crisp vector-sharp UI, consistent spacing and component language across the series, credible hierarchy.

SCENE S07 — Lab screen, first frame right after arriving from the Story (the transition has just finished). A calm, precise comparison instrument, same dark style as the rest of the series, no backlit arc any more (fully off).
Top-left: title "Same ECG, different denoising" and small subtitle "Synthetic record D0 S038 · Muscle · 20 dB · 250 Hz · REPLAY".
Top-right: three pill chips "Powerline", "Baseline wander", "Muscle"; "Muscle" is selected (filled light grey, dark text); a small neutral hint label next to them: "Try another noise".
Main area: one large dark-blue rounded panel with two stacked plot rows sharing the same time axis (0 s … 10 s, 11 ticks, labels at both ends) and the same mV scale (ticks "-2.0", "-1.0", "0", "1.0", "2.0", "mV" at the top-left of each row), faint grid:
  upper row labeled "Input · noisy": the amber ECG with irregular bursty Muscle fuzz;
  lower row labeled "Output · M06L6": the clean teal ECG with the thin grey Reference line directly behind it (overlaid).
One thin vertical silver-white sweep cursor crosses both rows at the same time position, about 40% from the left.
Legend under the panel, small: a grey dash "Reference · common front-end applied", an amber dash "Input", a teal dash "M06L6 output".
Bottom-center: a light pill "Method: M06L6 · change method" with a small chevron.
Bottom-left tiny caption: "REPLAY — no live device session".
No other text, no numbers besides the axis tick labels, "20 dB" and "250 Hz".
```

---

## 7. 생성 후 Beta가 할 일 (참고)

사용자가 S01–S07을 저장하면 Beta 에이전트가 `20` §7 Beta Round Card(`BETA-R1-001.md`)로 Visual Breakdown · Component Translation · Interaction Translation · Motion Storyboard(S02→S01, S03→S04→S05, S05→S06→S07) · Image-to-Implementation Gap · Implementation Translation · Validation Plan을 작성한다. 생성 이미지의 문구·순위·파형은 §2 표와 저장 출력으로 교체한다.

## 8. 미결 사항 (사용자 확인 필요)

1. **Story의 "Noise" 띠(입력 − Reference)** 를 넣을지. REF-005의 핵심(성분 쌓기)을 살리지만, Difference(= 출력 − Reference) 계약과 헷갈릴 수 있다. 이미지에서 거슬리면 빼고 2행으로 간다.
2. **Story 헤드라인 문구** "Change the noise, the best method changes." — 제품 문구가 아니라 이미지용 임시 문구. 한국어 화면이 기본이면 실제 UI에서 교체한다(글꼴 D-035 기준).
3. **1위 값만 숫자로 표시**하고 나머지는 숫자 없는 표시점으로 두는 결정에 동의하는지(한 장면 값이라 순위를 크게 보이면 일반 법칙으로 읽힐 위험, 패킷 S1 범위 주의).
4. Attract 잡음 강도: 이미지의 Attract는 극적으로 강한 잡음이지만 Story는 20 dB(약한 잡음)다. 실제 Attract 장면을 D0 S038 pli의 더 낮은 SNR(예: 0 dB)로 둘지는 구현 단계 결정 — 이미지에는 dB를 쓰지 않았다.

### 8.1 사용자 답 (2026-09-27)

> "Noise 띠는 넣어줘, 나머지는 그대로 진행할게" `[대화]`

- Q1 Noise 띠(입력 − Reference): **포함** — S03–S05 프롬프트 그대로. 실제 UI에서는 행 이름을 "Noise"가 아니라 "입력 − Reference"로 표기하고 Difference(출력 − Reference)와 구분한다(패킷 §1.1의 계약).
- Q2 영어 임시 문구, Q3 1위 값만 숫자, Q4 Attract SNR은 구현 단계 결정: **제안 그대로**.
