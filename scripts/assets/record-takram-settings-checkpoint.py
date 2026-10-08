"""Append D105 checkpoint and annotate disproved D104 evidence without erasure."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[2]
report='docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_A_takram_settings_and_light_shafts_review_2026-10-08.md'

def append_once(p, marker, text):
    path=root/p
    if marker not in path.read_text(encoding='utf-8'):
        with path.open('a',encoding='utf-8') as f: f.write('\n\n'+text.rstrip()+'\n')

correction='''## D105 evidence correction — 2026-10-08

O019/F071: D104 north cloud OFF used an unsupported Effect.enabled property; the cloud remained in the pass. The old image/JSON is preserved but **invalid as cloud OFF or incremental performance evidence**. Basic raw/temporal OFF means **full-resolution TAA with 4×4 temporal upscale disabled**, not accumulation disabled. See ECG_A_takram_settings_and_light_shafts_review_2026-10-08.md. D105 now removes the cloud from the pass and verifies actual attachment and aerial links. D104 performance counts remain historical; no subtraction budget is supported.
'''
append_once('docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_A_takram_cloud_reproduction_review_2026-10-08.md', '## D105 evidence correction', correction)
p=root/'verification/a-takram-lab-20261008/manifest.json'
d=json.loads(p.read_text(encoding='utf-8'))
d['d105Correction']={'date':'2026-10-08','report':report,
 'invalidCloudOff':'north300-300-taa-off: unsupported Effect.enabled; cloud actually rendered. PNG/JSON unchanged.',
 'rawMeaning':'Full-resolution TAA; temporalUpscale false. Not raw/no-TAA.',
 'historicalMetrics':'No valid cloud OFF budget or incremental GPU cost inference'}
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=root/'verification/a-takram-lab-20261008/gallery.html'
t=p.read_text(encoding='utf-8')
marker='D105 정정'
if marker not in t:
 t=t.replace('<h1>', '<aside style="padding:20px;border:2px solid #ecb574"><strong>D105 정정</strong>: 이전 구름 OFF는 실제로 cloud를 제외하지 않아 무효입니다. raw는 full-resolution TAA입니다. 원본 파일은 보존합니다. <a href="../a-takram-audit-20261008/gallery.html">새 진단 / 설정 비교</a></aside><h1>',1)
 p.write_text(t,encoding='utf-8')

append_once('PLAN.md','## 2026-10-08 D105 checkpoint',f'''## 2026-10-08 D105 checkpoint

- 완료: 원본 UI/helper 대조 .42/54, layer650/1200m, SMAA/maxFar100km, 실제 source light-shafts ON/OFF, cloud OFF wiring 수정. source Basic에서 지형 초기화를 생략.
- 기록: F071/D105/O019–020/REF015 EFX01502/CASE007; 최신 보고서 {report}.
- CONDITIONAL: GPU Context Lost 후 Microsoft Basic Render Driver 확인. software low six fixed north pose는 진단, high near-field 및 전체 움직임 hardware 재검증이 남음.
- TUNE: north 빔 가시성/국소 군집/temporal grain. 최신 층8km, 초기 RTX p.300 층5km와 구분.
- 다음: hardware renderer 회복 확인 → latest north6구도 high + weather54/100/정착된 exponent 대조 → beam/terrain lighting/ghosting 튜닝 → globe 연속 인계. 품질 승인/기본 화면 통합 미완.
- 기존 terrain1.5×/서고KEEP, capture6파일 보존, A-P3/Story/BC/D080 별도 유지.
''')
append_once('WORKLOG.md','## 2026-10-08 · D105',f'''## 2026-10-08 · D105 원본 설정 / 빛 커튼 / 진단 정정

사용자 참고54/.42 및 커튼 광선 요청. 원본 live UI와 pinned helper/installed shader를 대조했다. 두께650/1200m·SMAA·shadow100km 반영, latest north layer8km로 카메라 아래 구도 조정. 지원되지 않는 Effect.enabled를 제거하고 native OFF cloudPassAttached=false 확인; D104 OFF 무효 정정. temporal OFF는 fullresTAA다.

RTX source Basic high/fullres75% shaft ON/OFF 및 north.300 초기5km native 저장. Context Lost 흰 프레임2쌍은 rejected-context 보존. 이후 Microsoft Basic Render Driver/timer unavailable 확인. 저부하 source OFF와 north6고정 구도, high software 정지 화면은 성능 증거에서 분리. main 교체/품질 채택 미완. terrain/서고KEEP 및 사용자 capture6파일 미변경. 최신 보고서 {report}.

원격 사전 확인: main cfef4300e241134a7b4caf1d781766a4931a99db, 작업 branch f9b656ef4c4c629a0190f12dcafe88195197a27d. D104 local82c06e0는 이전 GitHub push 서버오류로 미푸시 상태였다. 최종 build/records/remote 결과는 후속 checkpoint에 남긴다.
''')
append_once('docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_WORK_INDEX.md','### 현재 설정/빛 커튼 후보 — D105',f'''### 현재 설정/빛 커튼 후보 — D105

[ECG_A_takram_settings_and_light_shafts_review_2026-10-08.md](ECG_A_takram_settings_and_light_shafts_review_2026-10-08.md) → REF015 EFX01502 / F071 / O019–020 / verification/a-takram-audit-20261008/gallery.html.

D104는 원형 chain 초기 시험 이력이다. D105가 설정·ON/OFF 판정의 최신 기준. 이전 cloudOFF 무효, raw=fullresTAA 정정. 최신 north6구도는 software 진단이며 high 품질/연속 경로/hardware 안정성 검증이 남는다. source Basic의 빛 띠 기여와 north의 부족한 강도를 구별. 현재 main/globe 미교체, terrain1.5× 및 archiveKEEP 유지.
''')

p=root/'WORK_STATE.json'; d=json.loads(p.read_text(encoding='utf-8'))
d['updated_at']='2026-10-08'
d['north_cloud_takram_2026_10_08'].update({
 'status':'D105_FUNCTIONAL_CONDITIONAL_VISUAL_TUNE_HARDWARE_RECHECK_PENDING',
 'decision':'D105','review':report,'gallery':'verification/a-takram-audit-20261008/gallery.html',
 'preview':'http://127.0.0.1:4198/cloud-lab.html?pose=basic300&scale=.5&upscale=1',
 'historicalD104Off':'invalid; unsupported Effect.enabled; retained and annotated',
 'currentRenderer':'Microsoft Basic Render Driver after GPU context loss; no GPU timer',
 'northCloudBaseMetres':8000,'northHighFieldLighting':'TUNE; pale faces/dark terrain/shaft visibility',
 'next':'Confirm RTX hardware recovery, recheck latest north six poses high + weather54/100, shafts/temporal/terrain lighting, then continuous globe handoff',
 'mainReplaced':False,
 'limits':['Source Basic shaft contribution verified; not pixel-identical reference',
           'D104 cloud OFF invalid; temporal OFF is fullres TAA',
           'Two lost-context white frames rejected, root cause unconfirmed',
           'Software low diagnostic six stills and high software still do not prove GPU performance or motion quality',
           'No final cloud recipe adoption or continuous globe-to-archive integration']})
d['next_action']='A D105: hardware renderer recovery → latest north6 high/same-view distribution and shaft/temporal tests → tune before globe integration. Read ECG_WORK_INDEX latest D105; Story/BC separate.'
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('D105 checkpoint recorded; no user captures edited')
