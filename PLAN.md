## 2026-10-18 KST — B3 재렌더·광원 밸런스 후속(D-141/D-144)

- Poly Haven B3 16종 복구: 파일 MD5 84/84 통과, registry SHA 15/16. `vintage_wooden_drawer_01`은 재게시 SHA 차이를 기록.
- B3 선택값·기준값을 같은 2개 카메라에서 각각 1280×720/64 samples로 재렌더. 그늘진 칸 아랫면 0.0935→0.0375(−59.9%), 선반 윗면 0.2675→0.2649(−1.0%). 사다리 penumbra 1.8–2.3px, 잎 13.2px.
- B3 렌더에 보이는 PC/CRT/ECG 6 mesh는 각 8 vertex/6 polygon/bevel modifier 없음. `prop-geometry-audit.py` exit1 6/6; 3mm bevel fixture PASS. 기존 기기 Q2 FAIL, 새 기기 Q1/Q4 미확인.
- D-144 same EXR mix: key 0.5/0.35/0.25. 0.35는 0.5보다 어둡고 절충 후보, 0.25는 더 어두워짐. 아직 기본값 선택·프로덕션 반영 안 함. 시트와 상세 수치는 `verification/r1-archive-b3-rerender-20261018/README.md`.
- Blender Manual, MIT GitHub skill 2곳, Polycount 위키 조사로 D-143 skill을 보강. records/playbook/encoding/portability 점검 통과 예정 후 업데이트. Story/r8/D-084 보호.

## 2026-10-18 KST — 자체 소품 제작 관문 → 서고 빛 재설계

- D-143/CASE-008: 자체 제작 스킬과 Q0–Q5 검수 문서화. 완료; 새 소품의 실제 합격은 확인 안 함. `verification/r1-prop-craft-gate-20261018/README.md`.
- D-141 실제 B3 시안: 2카메라×아랫면 1.0/0.35 정지 렌더 완료. 그늘 아랫면 선형 휘도 −59.9%, 선반 윗면 −1.0%. 사다리 1.8–2.3px, 먼 잎 13.2px. `verification/r1-archive-b3-rerender-20261018/README.md`.
- D-143 자체 소품 스킬/Q0–Q5 및 기하 검사기 완료. 초기 PC/CRT/ECG 6개는 수정 없는 상자라 Q2 FAIL. 새 소품 자체 제작/최종 Q1/Q4 미실행.
- D-144 광원 그룹 key 후보 0.5/0.35/0.25의 2시점 혼합 비교 완료. 0.35는 중간 후보, 기본 0.5 유지. 다음은 선택 시안에 대한 사용자 시각 확인. 확인 전 key 0.5와 B3 선택값만 후보 상태로 유지하며, L2 사람·해치 연출 및 웹 굽기는 별도 미완료 범위로 둔다. Story 소유 파일·r8/D-084 보존.

# Review plan

## 2026-10-18 KST — 최초 브랜치 에셋 감사(F-108)

- 사용자 PH ash **원본** 선호·자체 paint 긍정 반응을 기록했다. 실제 서고 교체 승인으로 확대하지 않았다.
- `claude/r1-autopilot-recommended` HEAD bf16509와 최초 빌더 62f0ef8 확인: 초기 PC/CRT/키보드/ECG 출력 기기는 PH 모델이 아닌 베벨 없는 자체 상자·단색이다. 책상은 PH painted_wooden_table, 벽은 painted_plaster_wall, 바닥은 herringbone_parquet, 서가는 ash_veneer, 사다리는 walnut_veneer다.
- 10/14 “구식 게임” 피드백에 따른 자체 상세 workstation 교체(7ba8908)를 찾았다. 실제 GLB 557,820 bytes/95 meshes/9 materials/images 0. 후속 기본 Story는 컴퓨터를 뺀 자체 소품 세트이며 legacyDesk=1만 이전 workstation을 연다.
- 원본 브랜치 archive.glb와 현재 빛 브랜치 Git blob 동일 확인. 기존 웹 1K WebP 분석은 이 바이너리에 해당하지만 옛 Cycles PNG의 원인으로 일반화하지 않는다. 기존 책상 PNG를 열어 단순 기기·마모된 주변 표면을 확인했다.
- 감사: `verification/r1-original-branch-assets-20261018/README.md` + asset-evidence.json. 실제 최초 피드백 프레임·프린터 지칭·원인별 기여율은 확인 안 함. 구현/Story/기본값/신규 렌더 변경 없음. 다음은 선호 재질과 실제 소품 품질을 구분해 적용 범위를 정하는 일이다.

## 2026-10-18 KST — 외부 접속 복구·실제 재질 비교(D-142/F-107)

- 공식 원본 다운로드 성공: PH 2종·ambientCG 4종·CGBookcase 2종, 2K PNG 8팩/361,430,072 bytes. PH 6맵 MD5 일치, 전체 SHA-256·CC0 근거·test-only 등록. 이전 CONNECT 403은 당시 이력이고 현재 전체 차단이 아니다.
- 보호된 서고/Story와 분리한 자체 베벨 벤치 11조건×정면/사선 = 최종 22장. CGBookcase DirectX normal을 확인해 G 반전 후 두 장 재렌더, 최초 두 장은 기각했다.
- PH 벽·ambientCG Plaster006의 얼룩은 2K 원본에도 있다. PH ash는 균일한 미세 결로 공급처 전체 저품질 판정은 기각. 우선 권장: 자체 깨끗한 도장면 + 약한 목재 결. 후보별 KEEP/TUNE/REJECT는 verification README에 적었으며 사용자 최종 채택은 미확정이다.
- RGB8 기준 PH 벽: 같은 2K WebP q75/q90 PSNR 34.28/40.89 dB; 무손실 1K 축소만으로 2K 대비 31.62 dB. PH 원본은 16-bit이며 이 수치는 16→8-bit 손실을 포함하지 않는다. 실제 서고 기여율로 일반화하지 않는다.
- `verification/r1-archive-material-review-20261018/README.md`에 비교 시트·수치·라이선스/상용 후보·확인 안 함을 기록. 재현 스크립트 `scripts/blender/material-bench.py`. D 번호는 원격 31브랜치 D 최대141/F 최대106 확인 뒤 사용했다. J-003 T5/P-006 잠정 갱신.
- 완료: B3 전체 원본 16종 복구·선택 조합 아랫면 전후 렌더. **남음**: L2 사람·해치 조율, 재질 실제 서고 적용·베이크·웹 확인. r8·D-084·Story 기본값은 변경하지 않았다.

## 2026-10-18 KST — 텍스처 원인·대체 조달처 분석(F-106)

- 실제 기존 웹 GLB를 검사: 50장 모두 WebP, 49장 1024²/1장 512². 2k 이름의 나무 맵도 실제 1K이며 패키징 상한이 1024다. 알베도 3종의 변색·마모와 웹 셰이더의 PBR 채널 미사용을 확인했다. 원인별 기여를 분리한 렌더는 확인 안 함이다.
- 현재 WaterBottle 저/고품질 파일은 1K/2K라 기존 “q90 개선” 관찰을 압축 품질만의 효과로 단정하지 않도록 이력에 주석을 추가했다. 기존 웹 GLB와 최신 r8/B2 정지 렌더는 구분한다.
- ambientCG·CGBookcase·Substance 3D Assets·Poliigon·BlenderKit·Fab을 용도·스타일·라이선스 기준으로 분석했다. 공식 페이지 8건은 모두 프록시 403이므로 현재 상품·샘플·약관 비교가 완료됐다고 하지 않는다. 우선 방향은 자체 단순 소품 + 깨끗한 저대비 재질의 개별 비교다.
- 문서: `docs/uiux_system/rounds/R1/ANALYSIS-R1-ARCHIVE-MATERIAL-SOURCING-20261018.md`, 실제 메타데이터/미확인 범위: `verification/r1-archive-material-forensics-20261018/README.md`. 에셋·코드·기본값은 변경하지 않았다.

## 2026-10-18 KST — 서고 소품·텍스처 방침 재확인

- 관련 지침을 찾았다: 10월 16일 검토안 §5의 자체 매개변수 키트 주력·Poly Haven 보조, 단색 + 낮은 대비 결·노이즈 텍스처 제외, §7.2의 사용자 진행 확인. 현재 사용자 회고 전체와 일치하는 과거 발화 원문은 찾지 못했으므로 원문을 새로 만들지 않았다.
- AGENTS·24번 §1.1·25번 S3·인수인계·P-006에 기존 예외를 연결했다. D-030의 과거 외부 조달 우선은 서고 후속 승인보다 앞세우지 않는다. 새 모델·재질·기본값 변경은 없다.
- **차단 범위 정정**: Poly Haven 원본 16종 복구는 기존 B3 장면의 동일 조건 재현을 위한 것이다. 자체 키트 주력 방침을 취소하거나 신규 제작 전체의 필수 의존성으로 취급하지 않는다. 신규 재질은 모델과 분리해 직접 제작·고품질 후보 조사를 진행할 수 있으며, 채택 전 실제 화면 품질을 비교한다.
- 근거·기존 수치·코드 확인·확인 안 함: `verification/r1-archive-asset-policy-audit-20261018/README.md`. 신규 대체 텍스처 비교·소품 제작·렌더는 이번 문서 확인의 완료 범위가 아니다.

## 2026-10-18 KST — B3 권장 조합 선택·실행 준비(D-141)

- 사용자 "권장안들로."를 반영: 기존 선택 (b) + 권장 L2 + 아랫면 ×0.35. 각도는 권장값이 없어 기존 30°를 유지한다. 다른 원격 브랜치의 D-140까지 확인하고 D-141을 구현 전에 작성했다.
- 기존 빌더·r8·D-084·Story 소유 파일은 그대로 두고 `scripts/blender/archive-light-b3.py`로 선택 조합과 아랫면 1.0 비교 기준을 분리했다. **L2의 사람·해치 연출 충돌은 미해결**이며 임의로 사람·해치 소품을 바꾸지 않는다.
- 완료: Python 3.11.17/bpy 4.5.3 등 지정 패키지, Cycles CPU 진단 렌더, 실행 레시피 격리·원본 누락 관문, 기존 JPG 재측정, J-003/P-006(잠정). 근거: `verification/r1-archive-b3-selected-20261018/README.md`.
- **BLOCKED**: Poly Haven API의 프록시 403. 두 도메인의 네트워크 초안과 Python 설치/재개 지침은 저장했지만 아직 런타임에 적용하지 않았다. 환경 설정 변경 적용 뒤 원본 16종·해시 복구 → 동일 조합의 아랫면 전후 렌더·측정 → 자세·충돌 확인과 사람/해치 연출 조율을 진행한다. 새 서고 렌더·웹 이식 완료로 처리하지 않는다.

## 2026-10-18 KST — 서고 빛 인수인계 재개

- `claude/archive-light-r7-ag2rja`의 `6b00daf`를 체크아웃하고 지정 문서 5개를 순서대로 확인했다. 근거: `verification/r1-archive-light-takeover-20261018/README.md`.
- **형태 (b) 조각 유지 선택**(이번 사용자 답변). **나머지 선택 대기 유지**: L1/L2, 30°/45°, 아랫면 ×0.35. r8·D-084 재현값과 Story 소유 파일·소품은 바꾸지 않는다.
- 환경은 아직 Blender 재현 준비 전이다(Python 3.12.14 / 시스템 Blender 4.3.2, bpy 및 Poly Haven 원본 없음). 다음은 선택 확인 → 인계 버전 환경·원본 복구 → 구현 전 원격 D 번호 확인 및 기록 → 선택 범위 검증. 새 렌더·웹 이식은 확인 안 함.

Updated: 2026-09-15 (KST)

## Current Work control

Generation 6 closeout 2026-09-15 18:01 KST: regenerated `ecg-signal-studio-v2.2.1.zip` from current UI plus verified replay. Independent ZIP CRC/content checks pass; 1,960 chunks are present and the embedded verification matches. QA run from the extracted package's own server/config passes 2 non-soak tests with the 10-minute test skipped. The updated package is preserved for user download. Target-PC headed/Hangul/OS-scale/touch and 10-minute soak remain R4; generation 6 is released.

Generation 6 progress 2026-09-15 17:56 KST: all four user-provided assets passed ZIP CRC. The v2.2 archive's `VERIFICATION.json` is byte-identical to the tracked 98×600-second report, and all 1,960 replay chunk hashes pass; replay data was recovered without inference. Chrome 153 headless non-soak QA now passes 2 tests with 1 soak test intentionally skipped. One QA assertion was corrected to open the approved collapsed advanced settings before counting its two switches. Target-PC headed/Hangul/10-minute soak remain open; package regeneration is next.

Automation recovery 2026-09-15 17:42 KST: generation 5's owning conversation explicitly ended and no managed download/browser/server/test child remained. Generation 6 claims the user-provided Releases from remote main 6d60b1a. Verify downloads and archive provenance before reuse, then run approved browser QA only if the supplied Linux x64 Chromium starts. Preserve current UI source and do not regenerate ECG data.

Manual check 2026-09-15: retry Chromium installation at the user's explicit request. Preserve verified UI source; no data regeneration or repeated build. Generation 4 claim 4f6bdf1 was remotely verified. Official Chromium download timed out after 30000 ms; subsequent retry cancelled (exit 130), no installer child remains. Browser not installed; no tests/build/data regeneration. Generation 4 released as blocked.

Automation retry 2026-09-15 11:41 KST: generation-3 owner `automation-ecg-browser-20260915T024128Z-e697169f` was remotely verified at `84d1795`. The Chromium installation was retried once with a 120-second connection timeout, but every download was either a truncated 0 MiB response or HTTP 502; installer exit 1. No preview server or Playwright test started. Source/data/package remained unchanged and generation 3 is released. Resume R4 only with a browser-capable runner or target-PC evidence.

Automation resume 2026-09-15 05:38 KST: generation-2 owner `automation-ecg-ui-20260914T203857Z-982efb68` acquired the shared lock at `077e0b1`. UI-01/03/04 source implementation is remotely verified at `632fcbc`; 12 relevant engine/scale tests, 14 updated DOM/Canvas-command checks and TypeScript/Vite build PASS. Playwright Chromium installation ended with repeated CDN timeouts and no system browser exists, so pixels/native behavior remain NOT VERIFIED. The full chunk test and package regeneration were not run because gitignored 10-minute `public/replay` artifacts are absent; no inference or data regeneration was attempted. The prior release ZIP is therefore stale for this UI change. UI-02 and the additional recommendation shortlist remain out of implementation scope. Generation 2 is released by the final evidence commit with all child commands ended.

Latest request: record uncommitted UI/UX discussions and use GitHub-shared on/off execution ownership. D1 policy/start claim COMPLETE (d7ae76f, remote ownership read back); D2 docs/22 and existing automation alignment COMPLETE; D3 documentation remote verification COMPLETE (8ed1f42), own lock released by this closeout commit. Documentation/control request complete; UI-01/03/04 remain approved pending implementation. WORK_RESUME_POLICY.md v1.1 §3 supersedes mandatory cross-host manual inspection for a valid released lock.

Approved pending: UI-01 large-comparison button contrast; UI-03 compact basic display controls always visible; UI-04 semantic toggles/switches and grouped gain controls. These have NOT been implemented or browser-verified. UI-02 glow and the additional ten candidates are recorded recommendations only. Lack of runtime/build/render tools is separate from execution ownership. R4/R5 gates remain open.

Prior P1/P2/P3 policy/schedule/workflow documentation completed at 44fd7fd1 and closeout 6974aa7; this does not complete the new UI requests.

User approved the concrete wireframe review in chat on 2026-09-12 ("응"). The five proposed layout decisions are accepted. R1a/R1b and R2 implementation have since completed; R3/R5 handoff is prepared and R4 remains unverified; the earlier wireframe approval gate below is satisfied. Actual browser/hardware gates remain independent.

## SWT final-tuning audit — 2026-09-13

- COMPLETE: four source branches and final docs checked; current best.json matches all 98 GUI scenes. See docs/19_swt_tuning_version_review.md.
- CONFIRMED: M03/M04 differ in shrinkage and parameter settings; they do not isolate decimation.
- DEFECT FOUND: D1 tune and holdout select the same first four TRAIN records; only noise seeds change. Independent-patient holdout claim FAIL. No TEST contamination path found in this check.
- Follow-up research work: correct explicit record/patient split and generated prose, run controlled comparisons and retuning, then version affected replay outputs. Not executed by this audit; preserve current release.
- GUI/AFE/browser/font/loss-tab work remains as below. Do not claim this audit fixes the original research protocol.

## v2.2.1 user-feedback revision — 2026-09-12

1. M04/M_FE source and release audit: COMPLETE. 98 long + 98 archive scenes checked; 14 long scenes reproduced. No output replacement or retraining. See docs/18_swt_audit_and_ui_revision.md.
2. Moving Difference + physical left y ticks: COMPLETE. 13 tests + DOM/Canvas command regressions + TypeScript/Vite build pass; packaged release CRC pass. Actual browser pixels remain NV.
3. Font change: DISCUSSION ONLY; current font retained. Recommended local Pretendard and role-based weights.
4. Loss evolution view / lab and analysis integration: DEFERRED by user until this revision is complete.
5. R4 actual browser/monitor testing remains NOT VERIFIED. PC runner prepared; no local-browser bypass.

## Current execution checkpoint — 2026-09-12

- R1 implementation: COMPLETE / CONDITIONAL PASS. Main checkpoint ad6a920 and subsequent chunk/Expo refinements; actual rendering NV.
- R2 data: COMPLETE. 98×600s, 1,274 trace arrays, 1,078 verified method metrics, 1,960 byte-identical 30s chunks. No retraining. One damaged local condition was regenerated.
- R3 offline application/data package and PC QA runner: PREPARED. See verification/v2-package.json and docs/17_v2_team_handoff.md.
- R4 actual browser/monitor/keyboard/touch/10-minute soak: NOT VERIFIED. Local browser access is blocked in this environment; run the provided target-PC evidence bundle. No browser workaround was used.
- R5 team handoff: PREPARED, final closeout pending R4 evidence. Source/data/state tests are not a visual or exhibit-device pass.

The following wireframe-review section is historical context; approval is satisfied and must not be requested again. Next work is target-PC evidence and resulting layout/interaction fixes, not a repeated wireframe approval or repeated inference run.

## Goal

Produce a source-grounded independent GUI design, compare it fairly with the earlier GUI, and deliver a verified synthesis prototype plus team handoff. Model identity is not evidence of quality.

## Stages and observable completion

| Stage | Status | Completion evidence |
|---|---|---|
| S0 GitHub write check | PASS | README commit 82ee3f6f60eca15185c562a232dad50afa847b08; remote content equality verified |
| S1 source-project understanding | PASS | docs/01_source_review.md; immutable source SHA, inspected contracts/results and archive freshness boundary |
| S2 independent design freeze | PASS with QA limitation | Freeze bcd2f8d1516b4020895e6e17ed66107773504faa remotely verified; 336 metrics pass. Browser visual checks remain unverified |
| S3 prior-artifact comparison | COMPLETE / render NV | docs/04_comparison.md: prior mockup, team/manual docs and source GUI code compared; rendered behavior not claimed |
| S4 final synthesis | COMPLETE / browser NV | prototype/ + docs/05_final_spec.md, docs/06_team_guide.md, docs/08_manual_addendum.md; all prior frames/hotspots reconciled |
| S5 final verification | COMPLETE / CONDITIONAL PASS | 1,078 output metrics, 26 DOM groups, 6 portable groups, 38 components, 9 frozen files and 18 selected palette pairs verified. Actual browser/hardware gates remain NOT VERIFIED |
| R0-v2.1 functional planning | COMPLETE | docs/12_expo_gui_plan_v2_1_final.md; playback, Inspector, Difference Lens, 600 s data, chunk architecture, stack baseline |
| R0-v2.2 Expo/UI refinement | COMPLETE | docs/13_expo_gui_plan_v2_2_final.md; message hierarchy, Attention→Choose→Compare→Inspect→Prove, presentation behavior, scenario rules, failure states, wireframe handoff |
| Recovery checkpoint | PASS / implementation PARTIAL | recovery/v2-interrupted-20260911 at f8b6300: 52/98 scenes, 9 engine tests, build and one-condition reproduction verified; docs/14_resume_audit.md |
| W1–W10 wireframe preparation | COMPLETE / APPROVED 2026-09-12 | docs/15_wireframe_review.md + docs/wireframes/index.html; 12 static boards including three W7 failure variants. Static geometry is not browser QA |

## Source boundary

- Source: userpawbaw/ECG_denoising_method_comparision
- Branch at discovery: claude/ecg-denoising-dsp-dl-comparison-b5wjvj
- Pinned SHA: 5eb27946087faca3c6e70b3925e2ba132b2ee680
- Source demo HTML and docs/30–34 GUI plans were deferred until S3, as were previous local GUI deliverables.
- Earlier conversation contents cannot be erased. Independence means deferred reinspection, explicit design reasons and a prior freeze commit.

## Current design baseline

Use both planning documents together:

- `docs/12_expo_gui_plan_v2_1_final.md` — **function/data/technical architecture baseline**.
- `docs/13_expo_gui_plan_v2_2_final.md` — **Expo story/information hierarchy/presentation behavior baseline**.

Key frozen principles include:

- Sweep + Scroll + Pause with short erase-edge fade.
- Same-time comparison across method changes.
- Large two-row Signal Inspector with gray Reference overlay.
- Hover = temporary preview, Click = selected method, Pin = persistent A/B comparison.
- Difference Lens as an expert reveal rather than default clutter.
- 98 conditions × 600 s target, no retraining, no 10 s looping as fake long data.
- Local / Session / Experiment metric scope separation.
- Chunked data loading rather than scaling the current monolithic bank.js approach.
- React/TypeScript/Vite recommended with a framework-independent Canvas playback engine; preserve the existing visual identity and CSS token logic.
- Expo story: **Attention → Choose → Compare → Inspect → Prove**.
- One primary visitor choice per demonstration.
- Three scenario roles are defined before output-driven timestamp selection; final segments must follow predeclared input/reference selection rules to reduce cherry-picking risk.
- Presentation Mode is Signal-Inspector-centered.
- REPLAY and verified LIVE must remain visibly distinct.
- Loading/error transitions retain the last valid scene and atomically swap waveform + labels + legend + metrics.
- Avoid winner badges, automatic best/worst regions, waveform morphing, long persistence trails, and visual effects that could distort scientific interpretation.

## Historical resume note — superseded, not an active approval gate

**Historical phase: wireframe review, concrete boards ready.** Read docs/15_wireframe_review.md and docs/wireframes/index.html. Review the bottom method rail, contextual sidebar, preserved two-row height with Difference Lens, compact three-row scrolling and metric reveal timing. Do not start further GUI implementation, dependency migration, 600 s inference, or Playwright QA-runner changes until these wireframe decisions are reviewed.

The earlier v2 work was already started after user authorization and interrupted before the newer planning documents were discovered. It is preserved on recovery/v2-interrupted-20260911, not merged into this baseline. This distinction corrects the apparent conflict between old local work and the newer wireframe-first plan. Browser execution remains NOT VERIFIED.

Wireframe work should resolve at least the following states:

- W1 — 1920×1080 Presentation / Replay, two-row Signal Inspector.
- W2 — Inspect / Reference state.
- W3 — Inspect + Difference Lens.
- W4 — Pin comparison / three-row state.
- W5 — Attract state and handoff.
- W6 — Scenario launcher/bookmarks.
- W7 — Loading / missing output / error and retry.
- W8 — 1366×768 compact layout.
- W9 — Touch visitor path with no required hover.
- W10 — Evidence/Q&A path from Local → Session → Experiment and provenance.

Primary wireframe questions: waveform area ratio; condition-vs-method control priority; timeline location; Method Explorer sidebar vs lower rail; Difference Lens expansion behavior; three-row minimum height; scenario button visibility; metric placement; touch preview replacement; Attract information density; 1 m readability; and error-state coexistence with the last valid waveform.

After wireframe approval, continue with:

- R1a stack/behavior parity and minimal browser harness.
- R1b playback / Signal Inspector / comparison interactions.
- R2 full-grid 600 s data generation and verification.
- R3 offline packaging, scenario bookmarks, Expo options and target-PC evidence bundle.
- R4 actual browser review and visual/performance/accessibility tuning.
- R5 handoff, operation guide, validation matrix and final status log.

Retraining remains excluded. Use existing checkpoints and processing methods when long-form outputs need regeneration.

## Remaining gates, not hidden implementation claims

Target-PC execution handoff: `docs/09_target_pc_check.md` gives Q01–Q10 actions, expected results and a report template. Preparation is COMPLETE; actual browser execution remains NOT VERIFIED. Continue visual/interaction review from the user's captures and review JSON. Do not repeat completed automated tests without a relevant code change.

- Target desktop browser rendering, native keyboard/dialog/download, zoom/scaling, screen reader and offline opening: NOT VERIFIED because local browser navigation is blocked in this environment.
- Current-source/checkpoint archive regeneration, exact metadata and pathology annotation: PENDING.
- Actual AFE adapter/source-session contract, hardware and exhibit testing: PENDING.
- Optional attract/idle reset and expanded distribution/annotation screens still require their operational/data requirements and later implementation checks.


## 2026-09-15 — generation 7 package recovery

Latest user requested resumption and supplied the correct v2.2.1 archive. GitHub reports 340775483 bytes, SHA256 9070d4aacea61d2476473fbdf18e4df7de5621867e82d0425ca22ee0fa1e98ed. Read-only inspection found generation-6 ZIP missing app/archive.json and app/legacy even though current source uses them. Recover original static assets without data generation, add a packaging completeness gate, verify affected routes and regenerate the package. Preserve prior verified UI/replay. Generation 7 starts from main 3c40e031 with a single parent and force=false.


## Generation 8 — recover unpersisted package repair

Generation 7 command results in the owning conversation show original v2.2.1 SHA256/CRC PASS, seven archive/legacy files restored, build PASS and extracted-package Chromium QA 3 PASS. Its ZIP was 340780943 bytes, SHA256 5ec5d47e288c4b54c8ff2edfad2c27249d08d0129ff67e73344cc596d94506bf. Both Library replacement attempts ended transfer_failed. All owned child commands had terminal exit results. Before the final commit, workspace maintenance removed the checkout and ZIP; main remains b500207 (start only). Those historical results are not proof of a currently available deliverable. Reconstruct the small packaging/test fix from the preserved conversation, then recover assets from the original Release and rebuild. No model training or data regeneration. Generation-6 ZIP 31d17dfa… lacks archive/legacy and must not be distributed as complete.


## Generation 8 recovery checkpoint

Recovered original Release ZIP (340775483 bytes, SHA256 9070d4aacea61d2476473fbdf18e4df7de5621867e82d0425ca22ee0fa1e98ed), ZIP CRC PASS. Restored 1968 files covering replay plus archive/legacy. npm ci and TypeScript/Vite build exit 0. Reconstructed archive/evidence/legacy browser regression and packaging completeness guard. New package verification and persistence are next; prior generation-7 output is not available after workspace pruning. No data regeneration.


## 2026-09-18 — Dual Director 기록 우선 단계

- 기준 main `08ffec3`; primary context: docs/uiux_system/handoffs/DUAL_CREATIVE_DIRECTOR_IMPLEMENTATION_2026-09-18.md.
- CASE-003은 이미 generator 도입 사례여서 보존하고 Dual evolution은 CASE-004로 추가.
- COMPLETE locally: CASE-004/발췌, CASE-001 발췌, F-007/D-010/R-009, D-011/R-010, D/R CASE 연결 규칙과 checker/CI 회귀 검사.
- PASS: records:check (29 records), 16 isolated checker fixtures, full root npm test (core/final data/DOM/records). UI 렌더링 또는 Dual 실행 검증이 아님.
- COMPLETE: branch → PR #9 → commit `105fc0f` CI run `35338498909` success (기록 검사와 회귀 검사). closeout 후 최신 head 결과는 PR checks에서 확인. PR 미병합.
- AWAITING USER after records closeout: 16번 canonical contract, dual-director skill, Superdesign dual-mode 및 activation routing. 이번 단계에서 구현/생성하지 않는다.
- 기존 target-PC/AFE/release 회복 등 별도 미완료 항목은 그대로 유지한다.

## 2026-09-18 — 기록 단계 독립 재검증

- handoff §11 및 사용자 6개 검증 항목을 직접 대조했다. 상세: docs/uiux_system/handoffs/RECORDS_STAGE_VERIFICATION_2026-09-18.md.
- placeholder 우회 수정, 26개 fixture, 전체 npm test와 diff 검사 PASS. 원문/재구성 구분 및 현재 확보된 기록 요구 문답 보강.
- 최종 head CI 확인 후 보고하고 종료. merge 및 Dual 실행 시스템 구현은 하지 않는다.

## 2026-09-19 — Dual 실행 계약 구현

- 사용자 승인으로 16번/skills/두 모드/activation/handoff를 구현했다. 기록 단계 PR #9 head를 기반으로 후속 branch에서 작업한다.
- 문서/skill/tabletop/records 및 전체 npm test PASS. 자세한 검증: docs/uiux_system/handoffs/DUAL_RUNTIME_VERIFICATION_2026-09-19.md.
- 원격 PR/CI 확인 후 보고. 실제 시안 생성·UI 수정·main merge는 수행하지 않는다.

2026-09-19 closeout: PR #10 (stacked on #9), implementation f1da0d32113d6e7b166dc48e9e550f8701045f0a, CI run 35423470904 records-check and fixture steps success. Contract/skill implementation complete; no merge or live generation. Final checkpoint head CI is checked before the chat report.

## 2026-09-25 — UI/UX 재설계 기준선 분석

- [x] 20 remote branch 비교: canonical UI/UX 시스템 = `main` `cfef430` (Alpha/Beta 17~20 + CASE-005 포함). `experiment/dual-attract-20260919`는 파일 수가 많지만 실험 원자료이며 최신 계약 누락. `feat/attract-vnext-recovered-20260924`는 main+1 Beta A/B prototype(PR 없음, winner 미선정).
- [x] v2.2.1 분석: build PASS, 단위 테스트 12/12, headless 1920/1366 캡처 → `docs/uiux_system/handoffs/REDESIGN_BASELINE_ANALYSIS_2026-09-25.md`, `verification/redesign-baseline-20260925/`.
- [x] 사용자 결정 Q1~Q4 — 2026-09-26: Q1 전체·두 라운드(D-033), Q2 비교 입력만(D-034), Q3 UI-02만(D-035), Q4 릴리스 ZIP 확인(사용자 조치 불필요). 다음: 1라운드 Alpha/Beta Step 1 Intent/Reference Freeze.

## 2026-09-25 — 레퍼런스 연출 제작 파이프라인 점검

- [x] 원인 진단 G1~G6(Canvas 2D 상한, 에셋 계층 없음, timeline 엔진 없음, 정지 이미지 분석, 전시 입력 번안 부재, motion QA 부재) → F-010.
- [x] 에셋 형식(glTF .glb/KTX2/HDR/2:1 텍스처/영상/Lottie/woff2), 제작 도구(Blender 권장, Unity는 HTML 연출용 비권장), 조달처·라이선스 정리.
- [x] `prototype/spikes/scroll-globe`: three 0.186.1 + GSAP 3.15 ScrollTrigger + Lenis 1.3.26 build PASS, headless WebGL2 스크롤/autoplay/reduced-motion 상태 동기 PASS. 실제 GPU 성능·미감·텍스처 라이선스 미검증.
- [x] 사용자 결정 P1~P5 — 2026-09-26 완료: P1 채택(D-027), P3 외부 에셋 우선, P4 녹화·도메인 허용, P5 vanilla + React 마운트(D-028), P6 게이트(D-029). **P2(전시 PC)만 남음** → 재설계 Q1~Q4.
- 2026-09-25 후속: P1 레퍼런스 2~3개 추가 분석 후 결정, P2 구현 시 결정, P3 외부 에셋 우선(조달처 §12), P5 설명 완료(vanilla 엔진 + React hybrid 권장, 미확정). moto 녹화 분해 → F-011. 이 세션은 도메인 허용 뒤에도 CONNECT 거부됨.
- 2026-09-25 후속2: moto 파트별 정량 분석(지구 회전=기본+속도 비례 r=0.96, 카드 감쇠 약 0.7 s, 타이포=문턱 트윈+reflow 점프) §14. 촬영 규칙 초안과 scroll HUD `tools/reference-capture/` — 사용자 합의 대기. 앞으로 영상 분석은 화면별·전환 효과별로 기록.
- 2026-09-25 후속3: 네트워크 점검(기본값 환경, google.com까지 403) + 대안(capture-site.mjs, 로컬 세션, HAR). 에셋 1)~4) 시험 완료: `assets/registry.json` + `scripts/assets/fetch.mjs` + spike `asset-test.html`(HDRI + glTF + 감쇠 회전). 병목 B1~B6 §17. 촬영 규칙 순서 합의 → D-017.
- 2026-09-25 후속4: 네트워크 허용 적용 확인(awwwards 제외). moto 소스 분석 §18(three r181 WebGPU/TSL + Lenis 1.3.18 + GSAP 3.15; 지구=위치 연동 scrub 1, 원통 갤러리=충격+감쇠, 타이포=줄 단위 scrub true) → F-012. 비영리 학술 → NC 허용. Poly Haven API 소스 추가·md5 검증, HDRI 교체(B6 해소), WebP q90 변형으로 반사 얼룩 해소(B5 비교).
- 2026-09-25 후속5: 기록 목적 확정(효과 재현 정보 강제) → 21_REFERENCE_EFFECT_RECORDS.md + records:check 확장(REF 절·효과 카드 15필드·입력 모델·재현 상태·지도 연결) + 회귀 fixture 6개. REF-001 moto-card 작성(EFX 8개, 라이브 측정·소스 보강). D-018, CASE-006. 다음: 컨텍스트 압축 후 REF-002.
- 2026-09-25 REF-002 leoparpeix.com: 녹화(HUD)+소스+라이브 측정으로 효과 카드 7개. 사용자 가설(부분 로딩) → 실시간 3D 카메라 회전으로 정정. RCP-08·RCP-01을 공통 레시피로 승격. 다음: REF-003.
- 2026-09-25 연구실 코너 시험: AI 단독 headless bpy 4.5.3 + Poly Haven CC0 7종으로 아이소메트릭 방 → Cycles 8방위 bake(약 12.6분) → gltf-transform → `prototype/spikes/lab-corner`. 360° 빛 드래그 3모드(A bake 블렌드 / B 실시간 / C 실시간 직접광+bake 간접광) 모두 headless QA PASS, 권장 C. 품질 격차(UV·bake 해상도·아트 디렉션) 9개 → audit §20, F-013. 다음: REF-003.
- 2026-09-25 연구실 코너 C v2: 하늘빛/반사광 베이크 분리(반구광 보정 제거), OIDN, 소품 UV 7.6→32 %, 잎 프로브, 마루·회벽 PBR, 창밖 배경, 후처리, 방위 다이얼. audit §21. 남은 것: 실제 GPU fps, 135° 흰 삼각형 반사, 아트 디렉션. 다음: REF-003 white-desert, REF-004 seasats(사용자 녹화 수신).
- 2026-09-25 REF-003 white-desert.com: 녹화(HUD)+소스(Next.js·GSAP 3.13·Lenis 1.3.15)+라이브 측정. EFX 5개(두 겹 구름 덮기, 스크롤 경로 그리기+표시점, 소나 링, 안개 판 전환, 문장 마스크). WebGL 없음 → F-014. 다음: REF-004 seasats.
- 2026-09-25 REF-004 seasats.com: 녹화 + 소스(three r180 + r3f + GSAP 3.15) + 라이브 측정. EFX 6개(합성 셰이더 홀로그램 지구, 시계 눈금 링, hover 원형 사진 카드, 필터 → 최대 군집 회전, 드래그 관성, 스크롤 연속 이미지 끊김 사례). RCP-12·RCP-17 공통 승격. P1 판단 재료(레퍼런스 4개) 확보 — 사용자 결정 대기.
- 2026-09-25 레퍼런스 재현 + 품질 격차: REF-003·004를 외부 재료(Poly Haven HDRI·사진, NASA Blue Marble, Blender 볼륨 구름·hero 영상)와 GSAP 플러그인·Lenis·vanilla three로 재현(`prototype/spikes/ref-repro`), 연구실 코너 v3(스크롤 시점 하강 → 모니터 match cut). 품질 격차 층 분해 F-015 + 충실도 게이트 제안(P6). 문서 `handoffs/REFERENCE_REPRO_AND_QUALITY_GAP_2026-09-25.md`. 다음: 파이프라인 결정 P1·P5·P6.
- 2026-09-25 REF-002 다락방 책장 재구성(`prototype/spikes/attic`): 책 478권 + CC0 소품 17종 + 생성 판화, 완전 베이크(조명 이미지 3장 + 소품 정점 색상), 브라우저 볼류메트릭 빛줄기·빛 속 먼지·bloom·AgX·수치 기반 색보정·SMAA, 섹션 창 카메라 하강 + 포인터 시선. F-016. 추가 기술 3종 득실 판단(측정 후 도입). 문서 `handoffs/ATTIC_BOOKSHELF_STUDY_2026-09-25.md`. 다음: 파이프라인 결정.
- 2026-09-26 REF-003 경로 12장 대조(사용자 지적): 결함 3개(지난/남은 경로 대비, 표시기 화면 이탈, dash 분할) 수정. 외부 컴포넌트 조합 변형 B와 A/B 비교 → 컴포넌트는 기법 공급원(D-021). 에셋 조달처 조사 + ambientCG·Openverse 자동 받기(D-020). 규칙: 3D 셰이더·후처리 상시 검토 + 효과 구간 최소 6장(권장 12장) 대조(D-019, 체크리스트 §12, 21번 §8, F-017). 문서 `handoffs/REF003_ROUTE_FIX_COMPONENTS_ASSETS_2026-09-26.md`. 다음: 파이프라인 결정 P1·P5·P6.
- 2026-09-26 제작 경로 확장: ① 에셋 조사 단계(`24`) — 조달처 12곳 탐색 스크립트, Sketchfab·Pexels는 후보가 있을 때 로그인 요청(D-022). ② AI 영상 → 스크롤 파이프라인(`22`, 시험 단계) — 브리프 템플릿, 입고 QA, 스크롤 플레이어, 대역 클립 자체 시험(D-023, F-018). ③ 외부 UI 컴포넌트 검토 단계 C1–C4와 후보 목록(`23`, D-024; coss.com/ui = AGPL). 사용자 대기: Sketchfab·Pexels 토큰, 실제 AI 영상 시험. 다음: 파이프라인 결정 P1·P5·P6.
- 2026-09-26 AI 영상 절차 정리 + 2차 자체 시험: 시선 — REF-002형 작은 회전은 여백 이동이 진짜 회전과 오차 4.6/255로 거의 정확(첫 판 "한계" 판단 정정, F-019), 변형 영상 섞기는 잔상. 정지 생명감 — 카메라 경로는 영상 위 시간 층, 반복 영상만 "멈춰도 재생 + 스크롤 가속"(F-020, D-026). 입력 정책 — 학습 단계 레퍼런스 금지, 적용 단계 우리 재현 결과 입력(D-025). 깊이 추정 — 상관 0.905지만 프레임 떨림. API 없는 5곳도 스크립트 받기 확인. 다음: 사용자 파이프라인 확정 → P1·P5·P6.
- 2026-09-26 **파이프라인 결정 완료**: AI 영상 파이프라인 확정(D-023). P1 = HIGH·MEDIUM 전체 채택, HIGH에서 WebGL 허용(D-027, D-016 개정). P5 = vanilla 엔진 + React 마운트(D-028). P6 = 충실도 게이트 G1–G6, 자기 수정 3회(D-029). 계약 `docs/uiux_system/25_EFFECT_PRODUCTION_PIPELINE.md`, 체크리스트 §13, AGENTS.md 절 추가. 남은 것: P2 전시 PC(성능 예산 임시값), 재설계 Q1–Q4.
- 2026-09-26 기록 감사: 세션 원문 사용자 발언 19건 대 저장소 기록 대조(`handoffs/RECORD_AUDIT_2026-09-26.md`). 보완: D-030(P3 외부 우선), D-031(등록부·NC 라이선스), D-032(조명 C 모드), O-002(numpy/bpy), O-003(로컬 0 % 정지), R-014, R-015, AGENTS 한국어 중간 메시지, 25번 연결·§8. video-scrub 로컬 실행 수정(standins 커밋, `npm run clips`, 누락 안내, README). 다음: 재설계 Q1–Q4.
- 2026-09-26 재설계 질문 결정: Q1 전체 경험·두 라운드(1R Attract·Story·전환 / 2R Lab·Compare), Q2 Beta A/B 비교 입력만(데이터 안전 장치는 재사용), Q3 UI-02만 승인(글꼴·Loss 뷰 보류 유지), Q4 GitHub 릴리스 ZIP 이미 존재·받기 확인. D-033–D-035, docs/22 §7, 기준선 분석 §7.1. 다음: **1라운드 Step 1 — Common Creative Packet + Reference Pack freeze**.
- 2026-09-27 AI 영상 플레이어 사용자 피드백 반영: 끊김(프레임 밀도 — 대역 240프레임, 입고 QA 밀도 검사, 보간 도구, 멈춤 시 가까운 프레임으로 붙기), 깊이 계단(셰이더 반복 읽기, 경계 보정 기각). F-021, F-022. 다음: 1라운드 Step 1.
- 2026-09-27 다락방 포인터 기본값 `look=both`(사용자 결정, F-024). 압축 전 이어받기 메모: WORK_STATE `resume_notes_2026_09_27`(다음 단계 입력 문서, 사용자 환경, 대기 항목, 의도적으로 저장소 밖에 둔 것). **다음: 1라운드 Step 1 — Common Creative Packet + Reference Pack freeze.**
- 2026-09-27 **1라운드 Step 1 제안 동결**: 공통 창작 패킷(3초·15초 목표, 계약 9항, 산출 예산) + 검증 자료 스토리 S1–S5(중심 S1 "잡음이 바뀌면 1등이 바뀐다") + Reference Pack 6개·4 family(REF-001–004 + 신규 REF-005 ciechanow.ski "Sound", REF-006 R2D3). `docs/uiux_system/rounds/R1/R1_STEP1_PACKET_AND_REFERENCE_PACK.md`, D-036. **사용자 대기: 입력 장치, 중심 스토리 동의, REF-005·006 확인** → FROZEN → Step 2 ALPHA-R1-001.
- 2026-09-27 **Step 1 FROZEN**: 사용자 답 — 입력 = 마우스 휠 + 클릭, S1 중심, REF-006 객체 연속 재배열 지목 → 효과 기록 REF-006(EFX-006-01~05, 소스 + 헤드리스 로컬 사본 측정), RCP-24~27, R-016(확보 방식은 렌더 층으로). Beta는 별도 에이전트. 다음: Step 2 ALPHA-R1-001.
- 2026-09-27 **Step 2 ALPHA-R1-001 동결**: "한 줄의 신호, 바뀌는 1등" — Attract(잡음 속 발굴 sweep) → Story 4박자(성분 쌓기 / 방법 토큰 순위 재배열 / D1 49장면 1등 격자 → EXP-A 평균 막대 / 지표 재정렬) → 파형 match cut으로 Lab. 발산 8개(I8 원근 파형 기각, I6 실험실 하강 보류). F-025: D1 시연 장면은 잡음마다 기록이 달라 "같은 ECG"는 D0 S038로만 성립 → 패킷 정정 표시. 다음: Step 3 BETA-R1-001(별도 에이전트, 이미지 생성 도구 1장 시험 선행).
- 2026-09-27 Beta 스틸 S01–S07 수신(사용자 ChatGPT 생성). **이 커밋이 사용자 직접 검토 재시작 지점** — 이후 단계(Beta 분해·교차 검토·정렬·결정·구현)는 사용자 부재로 `claude/r1-autopilot-recommended` 브랜치에서 권장안 자동 진행. 그 결과를 쓸 수 없으면 여기서 Step 3 분해부터 사용자 결정으로 다시 시작.
- 2026-09-27 **[자동 진행 branch `claude/r1-autopilot-recommended`] R1 Step 3–10 완료(사용자 확인 전)**: BETA-R1-001 동결 → AB-R1-001 교차 검토(AI 대리 정렬) → HYB-R1-001(D-038) → 구현 `prototype/v2/src/story/` → 게이트 G1–G6(자기 수정 3회), e2e 5 PASS. 자동 결정 AP-01~17. F-026. 보고서 `docs/uiux_system/handoffs/R1_AUTOPILOT_REPORT_2026-09-27.md`. **다음: 사용자 검토 — AP 표 피드백 또는 복귀 지점 `1570dd4`에서 재시작.**
- 2026-09-29 **사용자 검토 → 도입부 재구상**: 제목·행성·스크롤 wow·sweep 잔광 부족(F-027). 사용자 구상(역광 지구 → 사람·심장 윤곽 → 가슴 확대 → 박동 동기 네온 sweep, 잡음 → 깨끗 투명도 교차). 화면 구상 단계를 공동 구상 세션으로 변경(`20` Step 5A, D-039, R-017). 보드 `docs/uiux_system/rounds/R1/IDEA-R1-INTRO.md` 라운드 1(B0–B9 선택지) 제시. **다음: 사용자 반응 → 라운드 2 구체화 → 보드 동결 → D·변경 계약 → 구현.** 뒤 단계(조건·격자·막대)는 검토 전.
- 2026-09-29 라운드 1 ★ 추천안 전부 사용자 채택. **작업 예정(도입부 구현 완료 후)**: 사용자가 정리 중인 도입부 이후 Story 화면(1–5단계·Lab 진입) 피드백 반영 — WORK_STATE `R1-NEXT-SCREENS`.
- 2026-10-01 **도입부 품질 검토**: AI·사용자 목록 합침(IDEA-R1-INTRO §7, Q1–Q15, 최우선 사람 형태). 테마 선택지 TH1–TH4 사용자 반응 대기. Story 흐름 v2 검토(IDEA-R1-NOISE §6, S1–S9). **다음: 테마 결정(필요 시 레퍼런스 탐색) → 도입부 재설계 → Story 라운드 1.**
- 2026-10-01 **통합 계획** `docs/uiux_system/rounds/R1/PLAN-R1-INTRO-STORY-V2.md`: 사용자 요구 U1–U19·AI 피드백 A1–A13 추적표. 첫 시도(e4db982)는 셰이더만 바꿔 사람 재제작 요구 미반영(O-007, R-018). **다음: P0 한글 자간 → P1 사람·심장 에셋 재제작(Blender Studio CC0 메시, 눈·입 없는 머리, 손·리그, NIH 심장) → P2 공간(다락방 기법) → P3 지구·하강 → P4 글·연결 → P5 Story.**
- 2026-09-29 잡음별 장면 흐름 기록(F-028, `rounds/R1/IDEA-R1-NOISE.md`): 전원 간섭 → 기저선 변동 → 근육 잡음을 도입부 문법으로 반복(심장 중앙 → 사람 축소 → 상태 표시기 → 원인 오브젝트·물결 → 재확대 → 잡음 입력 → "최선 기법: …" → 깨끗). 기법 설명형 전개 기각. 스택 점검·선택지 라운드는 도입부 구현 후. 이어서 D-040: 잡음 −5 dB 고정, −5 dB 1등이 모두 딥러닝이라 기법 표시 제외(Lab에 남음). 확인 사항: 도입부 장면 S022(74 bpm) ↔ 잡음 장면 S038(100 bpm) 박동 속도 차이 — 도입부 라운드 2에서 결정.
- 2026-09-29 **R1 도입부 구현(D-041)**: S038 통일, 장면 `d0-awgn--5`(백색 잡음 −5 dB, 1등 저장 출력 M06). `prototype/v2/src/story/intro/`(three.js 지구·REF-001 수치 재현, MakeHuman CC0 몸 + 직접 만든 심장, 지구 윤곽 → 사람 외곽선 모핑, 가슴으로 카메라, R 동기 박동, 빛 고리 → 네온 sweep, 잡음 → 저장 출력 초점 교차). 동기화 e2e(R 30개, 0프레임 오차) PASS, 기존 e2e 5 PASS, 단위 18/19(기존 chunk). 검증 `verification/r1-intro-20260929/`. **다음: 사용자 로컬 확인(`npm run story`) → 도입부 피드백 → 잡음별 장면(IDEA-R1-NOISE).**
- 2026-09-30 **사용자 로컬 확인 → 파형 파트 피드백(F-029)**: R 동기 OK. 반영: 0 dB(`d0-awgn-0`, 1등 M06), 잡음 파형 밝기를 출력 수준으로(D-042). 레퍼런스 분석: REF-003 EFX-003-06(세 층 시차, 측정·코드 모형), 신규 REF-007 hauntedbouldercity.com, REF-008 Searching for Birds, REF-009 Igloo Inc, REF-010 Bright Biotech. 공동 구상 보드 `rounds/R1/IDEA-R1-WAVE.md`(격자·전환·라벨·층 시차 선택지). **다음: 사용자 반응 → 파형 파트 구현 → 그 뒤 지구→사람→심장 부분 피드백.**
- 2026-09-30 **파형 파트 구현(D-043)**: G3 심전도 용지 격자(정사각 칸, 번짐 마스크, 머리 뒤 격자 잔광), T2 R 피크마다 4분의 1 전환 + 라벨 인계 + 저장 수치(SNR 0 → 12.44 dB · cc 0.971, 기호만 뒤섞임), L1 두 층 라벨(Pretendard + IBM Plex Mono, OFL 번들), L2 R 주석, P1 층 시차(라벨 0.85 · 파형 1.45). 상시 규칙 D-044(글 요소는 항상 레퍼런스로 설계·제안). REF-008 EFX-008-03(격자 비교 기준). 보드 라운드 2(도입부 다른 글 요소) 제시. e2e 3+5 PASS. **다음: 사용자 로컬 확인 → T3 판단·라운드 2 반응 → 지구→사람→심장 피드백.**
- 2026-09-30 파형 연출 탐색을 사용자 참여 별도 Claude Code 세션으로 분리: 브리프 `docs/uiux_system/handoffs/EXPLORE_BRIEF_WAVE_DISPLAY_2026-09-30.md`(REF-011–019 대역, EXPLORE-WAVE-DISPLAY.md, 기록은 초안만). 결과는 사용자 요청 시 이 세션이 병합.
- 2026-09-28 Windows 로컬 실행 정비(O-005): `npm run doctor / story / story:check / spike -- <이름> / py -- … / py:setup / browsers / v2:prepare`, VS Code 작업(cmd.exe), `docs/LOCAL_WINDOWS.md`, `tests/portability.test.cjs`(npm test). `prepare-v2`가 `methods.json`을 더는 덮어쓰지 않음(R-a 해소). Windows 실기 확인은 사용자 대기.
- 2026-10-08 **도입부 피드백 반영(REVIEW-R1-WEB-20261008)**: 심각 I-4(모델 통일: Mixamo 자동 리깅된 story 메시), I-5(사다리 등장 → 위에서부터 사라짐 → 사다리 오른쪽 바닥 앉기 + 전극 → 가슴 → 심장 → 파형), I-6(심장 ×0.68, Story에도), I-7·I-8(D-055 스크롤 연동 교차) 구현·캡처 확인(`verification/r1-intro2-autorig-20261008/`). **남은 것: 사용자 로컬 확인(Edge 실시간), 디테일 I-1(지구 극지방 음영), 그다음 Story 피드백 라운드. Story를 자동 리깅으로 옮길지(주먹·숨)는 Story 피드백 때 결정.**
- 2026-10-09 I-1 지구 극지방 음영 반영(`verification/r1-globe-relief-20261009/`, 사용자 Edge 확인 대기). **경험 플레이북(D-057, CASE-007)**: `docs/playbook/` — 설계 규칙(방법론 조사 + 사용자 틀 검토), 권장 카드 P-001~P-005, 여정 J-001(사람 모델 → 자동 리깅, 노드 15) · J-002(역광 지구), 검사기 `npm run playbook:check`(자체 테스트 18), AGENTS.md 상시 규칙. 자동 리깅 결정 D-056 사후 기록, R-023. **다음: 사용자의 도입부 일괄 피드백 대기. 정리 대기 주제(서고 빛·스크롤 영상 등)는 해당 작업이 결론에 닿을 때 여정으로.**
- 2026-10-09 **도입부 사용자 확인 반영**: (1) 지구 v2 — 1월 Blue Marble·GEBCO 고도·Black Marble 2016 8k·구름 축소·해 높임·지구 구간 bloom 축소(`verification/r1-globe-relief-20261009/` v2, J-002 T5). (2) 사람 고리 찌그러짐 = 고리 값 버그(F-037) → `slice-field-v3.py`, 도입부 두 자세 재내보내기 + Story glb 고리 속성 교체(`verification/r1-ring-field-20261009/`, J-001 T16). (3) **검토만**: 다락방 레퍼런스 미술 분석 `rounds/R1/REVIEW-R1-ARCHIVE-ART-20261009.md`(F-038, 측정 `frame-tone-stats.py`) — 수정 포인트 6개 중 사용자 선택 대기(AI 권장: 받는 면·국소 안개·파스텔 재질을 정지 렌더 한 컷으로 먼저). 사용자 Edge 확인 대기.
- 2026-10-09 **서고 미술 1차 시험(D-058, 정지 렌더)**: `build_archive.py --art r3 --palette archive|pastel` — 천장 해치 + 옆 사다리(오르는 사람과 같은 강체 이동, 손발 맞춤 유지) + 해치 햇빛 + 국소 안개 + 크림색 빛. 빛 색·진한 중간톤은 레퍼런스 범위, 밝기는 파스텔만 근접, 직사광·파스텔 비율은 미달(세트 드레싱 영역). `verification/r1-archive-art-r3-20261009/`. **사용자 선택 대기: 파스텔/갈색, 다음 시험(제안 4) 여부.** 웹 반영은 선택 뒤.
- 2026-10-09 **서고 미술 2차 시험(D-059, 정지 렌더)**: 사용자 "다락문 하나에 갇힐 필요 없다, 빛 구멍 추가, 은은한 그림자·반그림자" → `--art r4`: 같은 해 방향으로 천창 둘 + 지붕널 틈 셋, 해 원반 2°, 하늘빛 2.4, r2 창 다시 열기. 직사광 5.8 → 10.6–14.9 %, 파스텔 L*50 32–35(레퍼런스 범위). `verification/r1-archive-art-r4-20261009/`. **사용자 확인 대기: 빛 구멍 구성, 파스텔/갈색, 제안 4 여부.**
- 2026-10-09 **서고 세트 드레싱 시험(D-060, 정지 렌더)**: `--dress` — 천창 조각 자리 서랍장, 해치·지붕널 띠 자리 빈칸(크림 뒷면)·액자·석고 조각·눕힌 책, 나머지 칸 12 % 성기게. 파스텔 면 6.4–7.3 → 10.8–11.5 %, 빈칸·서랍장에 단계적 그늘과 넓은 반그림자. `verification/r1-archive-art-dress-20261009/`. **사용자 확인 대기: 드레싱 유지 여부, 펜던트 그림자, 파스텔/갈색.**
- 2026-10-09 **번지는 그늘 시험(D-061) + 경계 폭 지표(F-039)**: `frame-tone-stats.py`에 경계 폭·대비·무늬 없는 면 빛 변화 폭(plain_range) 추가. 되튐 12회는 효과 없음, 바닥 빛 조각이 가장 큼, 어둠은 하늘빛 낮춤 + AgX Punchy. `--art r5`: 파스텔 명도 분포가 레퍼런스와 겹침, plain_range 50–52(레퍼런스 57–69). 갈색 r5는 어둠 잘림. `verification/r1-archive-art-r5-20261009/`. **사용자 확인 대기.**
- 2026-10-09 **레퍼런스 빛 해부(F-040, 분석만)**: 원본 에셋 재접근 불가(사이트 402, 아카이브 네트워크 차단). 정지 프레임 스톱 지도로 그늘 구역 / 빛 웅덩이 하나(거리 감쇠) / 직사광 강조의 3층 배치 확인. 우리 r5는 같은 대비량을 흩어진 조각으로 씀. `verification/r1-archive-ref-light-anatomy-20261009/`. **다음 시험 r6(해치 면광원 + 그늘 구역 + 해는 강조만) 사용자 확인 대기.**
- 2026-10-09 **서고 빛 r6(D-062, 정지 렌더)**: 해치 밖 가까운 작은 스폿 주광 + 해 0.5° 강조 + 왼쪽 그늘 구역 + 단색에 가까운 재질. 방 단위 배치(그늘 구역 + 빛 웅덩이 하나)가 레퍼런스와 같아짐, 경계 폭 1.0 px, 잔무늬 1.7, 파스텔 23–27 %. 남은 것: 어둠 들뜸, 전체 1스톱 밝음, 사람이 웅덩이 안. `verification/r1-archive-art-r6-20261009/`. **사용자 확인 대기.**
- 2026-10-10 **r6 조정(D-062)**: 노출 −0.75스톱, 하늘빛 0.5, 주광 색 연하게, 해 22, 바닥 반사율 낮춤, 주광을 돌려 빛 경계가 사람 손 높이를 지나게 함(사람 위치 AI 선택). 명도 분포·진한 색이 레퍼런스와 겹침. 잃은 것: plain_range 30–32, 파스텔 18–20 %. 갈색판 이 노출에서 사용 불가. `verification/r1-archive-art-r6b-20261010/`. **사용자 확인 대기.**
- 2026-10-10 **서고 빛 조정을 별도 세션으로 분리**(사용자: "조정은 다른 채팅에서, 여기선 story부터"). 인수인계: `docs/uiux_system/handoffs/HANDOFF_ARCHIVE_LIGHT_2026-10-10.md`. 측정 보조 도구 `scripts/assets/light-structure-maps.py`, `tone-sheet.py`를 저장소에 넣음. `WORK_STATE.json` active_jobs에 서고 빛 자원 범위 기록. **이 세션 다음: Story 개선.**
- 2026-10-11 **Story 피드백 라운드 시작**: 사용자 녹화(10/8) 피드백 12항목 + AI 추가 6항목을 체크리스트로(`docs/uiux_system/rounds/R1/REVIEW-R1-STORY-20261011.md`): 심장 뚫림, 카메라 몸 관통·물체 가림, 멀티탭 디테일, 60 Hz 아이콘(계획 누락), 구 껍질 방사(8분음표 4+5 ×2), 파형 UX(박동 1회 → 스크롤 교차·되돌림, 다음 버튼, 겹쳐 보기), 기저선 몸 가독성, 근육 장면 숨 약화. 자체 점검 체계(자동 검사 ①②③⑥⑦ + 절차 ④⑤⑧⑨) 계획 포함.
- 2026-10-12 **Story 피드백 라운드 구현·검증**: S-01~S-09·S-11·S-12, A-01~A-04·A-06 완료. 파형 UX(D-063: 자동 1회 → 되돌릴 수 있는 스크롤 교차, 다음·겹쳐 보기 버튼), 구 껍질(8분음표 4+5 ×2), 교류 60 Hz 말풍선, CEE 7/3 멀티탭, 카메라 경로 재계획, 숨 약화. 자동 점검에 ④ 전경 침범 추가(F-041: 자동 0건인데 캡처에서 옛 멀티탭·등갓·서가 단면이 보임). `verification/r1-story-feedback-20261011/`. **사용자 확인 대기**: S-10 가독성 후보(기본 3 = 윤곽선 + 덜 투명), 근육 끝 크레인의 서가 옆판 틀, 약한 숨 크기. **남음**: 사인 빛 점(보류), S-10 몸 마스크 측정, A-05 키보드 브라우저 테스트.
- 2026-10-12 **Story 2차 확인 반영**: 근육 구도 B 기본값(K-06), 숨 ×0.5(S-12), 심장 가슴 창(S-13, D-064), 주먹·빨간 표시를 저장 근육 잡음에 동기(S-14, `fistDrive.ts`, 원인 O-011: 장면 `HOLD`가 주먹 `HOLD`를 가림), 자체 점검 ⑪ 동작-신호 동기(0.534 ≥ 0.4). 영상 `verification/r1-story-feedback-20261011/10`·`11`·`16`. 사용자: "40초는 다음에 하고, 지금은 이대로 진행". **다음 라운드 대기**: Story 저장 신호 10초 → 40초(600초 replay 자료에서 구간, 로컬 생성 필요), 사인 빛 점(보류), S-10 몸 마스크 측정, A-05 키보드 테스트, 끝 크레인 서가 틀(확인됨: 크레인 자체는 이해).
- 2026-10-12 **Story 3차 피드백**: 기저선 몸 어둡게 + 심장 → 카메라 직선 창(S-15), 600초 replay가 있으면 앞 40초 사용(S-16, D-065, 실제 자료 확인은 사용자 PC), 후처리 MSAA 4×(S-17), 스크롤 Lenis lerp 0.1(S-18, D-065가 D-063 계단 대체). **사용자 확인 대기**.
- 2026-10-13 **10분 자료 복구 + 기록 통일(D-066)**: 릴리스 archive-v2.2.1-recovery에서 replay 자료만 복구(해시 1,960/1,960). 도입부·Story 모두 S022 앞 40초(없으면 S038 10초). 도입부 브라우저 테스트 4/4, Story 1/1. **로컬 PC에도 같은 자료를 `prototype/v2/public/replay/`에 풀어야 함.**
- 2026-10-15 **서고 빛 r7(D-081, 정지 렌더, 별도 세션)**: 사용자 "1a, 2a"(한 번 더 조정, 파스텔). 주광을 해치 쪽으로 당김(1.6 m, 세기 3500) + 하늘빛 0.3 + 바닥 #86705a. 파스텔 a1/a2: L*5 4 유지, plain_range 32/30 → 51/54(레퍼런스 57–69), 파스텔 23/26 %, 방 단위 밝은 비율 43/46 %. 사람을 가린 sharpC 15.8/15.9(레퍼런스 20–22; 사람 무늬 몫은 2–3). plain_range는 렌더 해상도에 따라 달라 1280×720끼리만 비교. 바뀐 것: 웅덩이 경계가 사다리 손 높이에서 가운데 칸으로 이동(사람이 빛 안). `verification/r1-archive-art-r7-20261015/`. **사용자 확인 대기: r7 확정 여부(확정되면 웹 굽기 + 플레이북 J-003). 미완: sharpC 차이, 진한 색 5–6 %, L*95 77–78.**
- 2026-10-16 **서고 빛·공간 wow 조사 보고서**: `docs/uiux_system/rounds/R1/RESEARCH-R1-ARCHIVE-LIGHT-WOW-20261016.md`. 제작 노트·포럼 조사(광원 그룹, 광원별 최대 되튐, 빛·그림자 연결, 네거티브 필, AgX 웹 재현, 라이트맵 섞기, 굽기 + 실시간 그림자) + 자체 측정 F-043(어둠의 절반은 해 되튐; 되튐을 막으면 어둠 −2.4스톱, 웅덩이 −0.14스톱). 웹 톤 곡선 불일치 발견(정지 AgX Punchy, 웹 ACES; three.js에 Punchy 없음). wow 후보 W1 빛이 들어오는 순간 · W2 빛줄기 먼지(기존 효과를 r7 주광으로 이식) · W3 사람 그림자. r7 기록 번호를 D-067 → D-081로 옮김(Story 세션과 겹침). **사용자 결정 대기: S1–S3 진행, wow 묶음 방향, 웹 굽기 방식(S4).**
- 2026-10-16 **S1 광원 그룹 조정 도구 완료 + 레퍼런스 공간·시점·빛 분석**: `LIGHTGROUPS=1`(그룹별 디노이즈 패스) + `light-group-mix.py`·`light-group-sweep.py`. 검증: 가중치 1 혼합 = 직접 렌더(지표 동일), 주광 ×1.2·해 ×0.5 혼합 = 실제 렌더(지표 소수점까지 동일, 픽셀 평균 차 0.84) → 세기 조정은 렌더 없이 몇 초. 분석 `docs/uiux_system/rounds/R1/ANALYSIS-R1-REF002-SPACE-LIGHT-20261016.md` + F-044(레퍼런스 시점 볼거리 = 수평 카메라 평행 이동, 우리 a1은 기울인 광각) + 시점 실험 `verification/r1-archive-viewpoint-20261016/`. **진행 중: S2(해 되튐 1회). 사용자 자료 요청: 레퍼런스 녹화(77–105 s)로 화각·층 깊이 측정(V0).**
- 2026-10-16 **S2 서고 빛 r8(D-082)**: 해 되튐 1회 + 주광 4550 + 해 33(광원 그룹 탐색 108조합 → 실제 렌더로 확인, 예측과 L* ±1). a1/a2: L* 4 17 27 61 80 / 4 18 27 65 79, plain_range 55.8/58.6(레퍼런스 57–69), 진한 색 4.9/4.8 %, 밝은 비율 44/48 %. sharpC는 세기로 안 움직임(사람 가림 16.0/16.3). `verification/r1-archive-art-r8-lightgroups-20261016/`. **사용자 확인 대기: r8.**
- 2026-10-16 **S3 웅덩이 경계 위치(조건부)**: 주광 방향 x 0.65면 경계가 사다리 손 높이에 오지만, 지금 a1/a2 구도에서는 웅덩이가 좁아져 plain_range 40/36(r8 56/59). 주광 ×1.3으로 되찾으면 L*5 7. 기본값은 r8(x 0.45) 유지. **사용자 결정 대기: 경계 위치 vs 웅덩이 변화 폭, 또는 카메라 구도(V1)와 함께 다시 정하기.**
- 2026-10-16 **V0 레퍼런스 녹화 측정 + V1 카메라 시안 시작(D-083)**: 사용자 "권장안대로 진행" + 녹화. 측정: 세로 화각 약 32°(25–39°), 벽까지 약 5.8 m, 화면에 벽 3.4 m, 하강 2.75 m = 스크롤 약 3화면, 사다리는 벽과 같은 깊이(시차 작음), 시점 변화는 가로면 노출(1 m 하강에 선반 아랫면 약 15 px). 분석 §9, `scripts/assets/ref-scroll-shift.py`. V1: 수평 카메라 32°, y −0.8, x 0(x 0.45는 가까운 서가가 화면 1/4을 덮어 옮김), 높이 3.6/2.8/2.0/1.2 m × 주광 방향 0.45/0.65 렌더 중.
- 2026-10-16 **V1 결과(D-083)**: 레퍼런스 측정값 구도(수평, 32°, x 0, y −0.8)에서 r8 빛 그대로 높이 2.8/2.0 m가 레퍼런스 범위(plain_range 58.5/61.0, L*5 2). 경계를 손 높이로(x 0.65)는 모든 높이에서 plain_range −14~−23 → **S3는 r8 유지로 정리.** `verification/r1-archive-viewpoint-20261016/v1_*.jpg`. **사용자 확인 대기: 웹 도입부 카메라로 옮길지.** 다음 요청: 레퍼런스 사이트 실물 분석 → 그림자 다양성·소품·광원 구조 검토안.
- 2026-10-16 **레퍼런스 실물 분석 + 그림자·소품·광원 검토안(F-045)**: 사이트 재접속, glb·구운 KTX2를 세션 임시 폴더에서 분석(저장소에는 'analysis only' 시트만). 카메라 실제 22.9°·8.5 m(V0 추정 32°/5.8 m 대체), 단순 형태(약 2.2만 면) + 작은 베벨 + 구운 최종 색, 해치(뚜껑) 빛 + 화면 밖 먼 창의 부드러운 그림자. 깨끗한 재구성으로 레퍼런스 목표 재설정(L*95 74–80, plain_range 45–54, sharpC 17–19). 검토안 `docs/uiux_system/rounds/R1/REVIEW-R1-ARCHIVE-SHADOW-ASSET-20261016.md`(B0 측정 → B1 점토 시험대 → B2 광원 구조 → B3 가림-받음 재배치 → B4 소품 키트 → B5 재질·굽기 → B6 카메라 → B7 확인). **사용자 결정 대기: 단계 진행·소품 조달·카메라·Story 소품 조율.**
- 2026-10-16 **B0 완료(F-046)**: 사용자 "권장안대로 B0부터". 그림자 선명도·그늘 층위 도구 `scripts/blender/shadow-sharpness-map.py`. 우리: 먼 가림(해치 가장자리·사다리)이 주광 아래에서 흐림(경계 반그림자 p90 32 px), 그늘이 아래에서 채워져 선반 아랫면 L* 11(레퍼런스 0). 레퍼런스 칸 깊이 약 0.5 m(우리 0.27).
- 2026-10-16 **B1 조건부(F-047)**: 점토 시험대 `scripts/blender/shadow-bench-b1.py`. 해 하나 + 가림 거리만으로 선명(사다리·조각 0.2–0.5 px)과 모양 있는 부드러움(창틀 10–12 px, 5 m)이 함께 나옴. 깊은 칸은 그늘 층위를 키우지만 비스듬한 빛을 막음 → 구역별 칸 깊이. 선반 아랫면 어둠은 미재현(바닥 반사가 주원인).
- 2026-10-17 **B2 광원 구조 시험(D-084, 조건부)**: `--b2` = 책상 구석과 같은 해(−0.42, 0.40, −0.81) + 뒤 오른쪽 천창 + 해치 뚜껑 + 화면 밖 잎(굽기 전용), 바닥 빛 조각 제거. 후보: L* 1 15–17 26–31 49–55 82, plain_range 45, sharpC 16.3–16.7, 잎 그림자 15 px(7.6 m), 해 경계 선명 62 %. 잃은 것: plain_range·진한 색·파스텔 하락, 해 조각이 흩어질 위험, 해치 빛이 왼쪽 아래. 기록 번호를 D-081부터로 옮김(Story와 충돌). `verification/r1-archive-b2-light-structure-20261017/`. **사용자 확인 대기(B7 지점).**
- 2026-10-17 **B2 변형 16장(D-085, 조건부)**: 가지·잎 모양 잎 그림자, (a) 웅덩이 하나 / (b) 조각 유지 × 사다리 L1(해치 뒤 모서리) / L2(벽 레일에 기댐) × 30°/45° × 카메라 2.8/2.0 m. L2만 사다리 그림자가 선명(2.0–2.4 px). 칸 아랫면 빛은 주로 주광 스폿이 튄 빛이고, 해치 빛은 바로 아래 칸이 해를 받을 때만 영향을 준다. 아랫면 재질 ×0.35로 아랫면/윗면 0.60 → 0.27, 앞턱은 기각. `verification/r1-archive-b2-variants-20261017/`. **사용자 선택 대기.**
- 2026-10-17 **다른 AI로 인수인계**(사용량 문제, 사용자 결정): `docs/uiux_system/handoffs/HANDOFF_ARCHIVE_LIGHT_2026-10-17.md`(상태, 대기 질문 4개, B3–B7, 환경 재현, 함정, 초기 지침 §6). 브랜치 `claude/archive-light-r7-ag2rja` 유지. 에셋 받기 스크립트 `scripts/assets/fetch-polyhaven-sources.py` 추가.

