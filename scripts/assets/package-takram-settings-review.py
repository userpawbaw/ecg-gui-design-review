"""D105 evidence index. Reads original PNGs; never alters image pixels or old pins."""
from pathlib import Path
import hashlib, html, json

root = Path(__file__).resolve().parents[2]
out = root / 'verification/a-takram-audit-20261008'
caps = root / 'verification/a-cloud-sculpt-20261006/native-captures/takram-audit'
report = 'docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_A_takram_settings_and_light_shafts_review_2026-10-08.md'
source = 'b012ad06d858fc035d88aacfd73f092f93c994e4'

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p, text): (root / p).write_text(text, encoding='utf-8')
def append_once(p, marker, text):
    path = root / p
    if marker not in path.read_text(encoding='utf-8'):
        with path.open('a', encoding='utf-8') as f: f.write('\n\n' + text + '\n')

# A lost-context white frame was saved before the guard existed. Preserve, reject.
failed = caps / 'north300-300-ref54-r100-c42-s75-fullres-cloud-shafts-smaa.json'
if failed.exists() and json.loads(failed.read_text(encoding='utf-8'))['renderer'] is None:
    target = out / 'rejected-context'
    target.mkdir(exist_ok=True)
    for p in [failed, failed.with_suffix('.png')]:
        dest = target / p.name
        if dest.exists(): raise RuntimeError('Refusing to overwrite rejected evidence')
        p.rename(dest)

rows = []
for p in sorted(caps.glob('*.json')):
    data = json.loads(p.read_text(encoding='utf-8')); s = data['state']; png = p.with_suffix('.png')
    renderer = data['renderer'] or 'unknown'
    software = 'Microsoft Basic Render Driver' in renderer
    group = 'Software diagnostic' if software else 'RTX still trial'
    if p.stem == 'basic3500-upscale-cloud-noaa': group = 'Pre-settings diagnostic'
    if '-e16-' in p.stem: group = 'Unsettled contrast trial; not adopted'
    if '-s25-' in p.stem and '-qlow-' not in p.stem: group = 'Pre-preset wiring diagnostic'
    rows.append(dict(file=p.relative_to(root).as_posix(), png=png.relative_to(root).as_posix(),
                     sha256=digest(p), pngSha256=digest(png), state=s, renderer=renderer, group=group))
rejected = [dict(file=p.relative_to(root).as_posix(), sha256=digest(p),
                 pngSha256=digest(p.with_suffix('.png')), reason='White lost-context frame; metadata renderer null; GPU times stale, invalid')
            for p in sorted((out/'rejected-context').glob('*.json'))]
helper = out / 'useCloudsControls.ts'
manifest = dict(decision='D105', sourceCommit=source, status='FUNCTIONAL_CONDITIONAL_VISUAL_TUNE',
                sourceHelper=dict(file=helper.relative_to(root).as_posix(), sha256=digest(helper),
                  url=f'https://raw.githubusercontent.com/takram-design-engineering/three-geospatial/{source}/storybook/src/clouds/helpers/useCloudsControls.ts'),
                userScreenshot=dict(file='verification/a-takram-audit-20261008/user-reference.png',
                                    sha256=digest(out/'user-reference.png'), evidence='user supplied; not our implementation'),
                runtimeFiles={p:digest(root/p) for p in ['prototype/spikes/a-climb/cloud-lab.ts','prototype/spikes/a-climb/cloud-lab.html','prototype/spikes/a-climb/package-lock.json']},
                captures=rows, rejected=rejected,
                limits=['No main globe integration or final adoption', 'Near-field latest 8km cloud base needs RTX recheck',
                        'Software diagnostic times are not GPU performance evidence', 'Original D104 cloud OFF invalid; raw means full-resolution TAA',
                        'Six native north stills are not matched six-frame external comparison or continuous-motion proof'])
write('verification/a-takram-audit-20261008/manifest.json', json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

cards = []
def display_order(r):
    s=r['state']
    if r['group']=='RTX still trial': return (0, s['mode']!='basic300', not s.get('lightShafts'))
    if s['quality']=='high' and r['group']=='Software diagnostic': return (1, r['file'])
    return (2, r['file'])
for r in sorted(rows,key=display_order):
    s=r['state']; href='../'+Path(r['png']).relative_to('verification').as_posix()
    label=html.escape(Path(r['png']).stem)
    cards.append(f'<section><h2>{label}</h2><p>{html.escape(r["group"])} · {html.escape(r["renderer"])}</p><a href="{href}"><img loading="lazy" src="{href}"></a><p>quality {s["quality"]}, coverage {s.get("coverage")}, repeat {s.get("localWeatherRepeat")}, layer base {s["layers"][0]["altitude"]}m; performance/quality approval separate.</p></section>')
write('verification/a-takram-audit-20261008/gallery.html', '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>D105 · 구름 설정과 빛 커튼</title><style>body{background:#101820;color:#e2edf4;font:16px system-ui;margin:24px;line-height:1.6}img{width:100%;max-width:1280px}section{margin:40px 0;border-top:1px solid #526274}a{color:#9fe6ff}h2{font-size:18px;overflow-wrap:anywhere}.notice{max-width:1100px;padding:20px;background:#263448}</style><h1>D105 · 구름 설정 / 빛 커튼 검토</h1><div class="notice">실제 렌더 캡처입니다. 기본 화면 통합과 품질 채택은 아직 TUNE입니다. RTX 원본 구도: high / full-resolution TAA / 75%. 최신 북유럽 6구도: 소프트웨어 렌더 / low / 25% 진단용이므로 고품질 결과로 평가하지 않습니다. 하단 고품질 소프트웨어 정지 캡처도 성능 증거는 아닙니다. 실패한 흰 화면 2장은 정상 결과에서 제외했습니다.</div><p><a href="http://127.0.0.1:4198/cloud-lab.html?pose=basic300&scale=.5&upscale=1">실시간 비교</a> · <a href="../../'+report+'">상세 보고서</a> · <a href="manifest.json">캡처 조건과 해시</a></p>'+''.join(cards)+'</html>')

rtx = [r for r in rows if r['group']=='RTX still trial']
metrics = '\n'.join(f'| {Path(r["file"]).stem} | {r["state"]["gpu"].get("p50")} | {r["state"]["gpu"].get("p95")} |' for r in rtx)
write(report, f'''# A · Takram 설정 대조와 빛 커튼 검토 — 2026-10-08

상태: **D105 / 기능 CONDITIONAL · 시각 TUNE · 기본 화면 미통합**. 실제 PNG/JSON {len(rows)}쌍, context 실패 {len(rejected)}쌍 분리. 생성 목업이 아니다.

## 1. 사용자 피드백과 이번 작업 범위

[대화] “원본 사이트는 좀 더 랜덤하면서도 국소적으로 응집되는 느낌”, “구름 사이를 통과한 빛 광선이 커튼처럼”. 제공 이미지의 coverage 0.42, localWeatherRepeat 54를 기준으로 원본 Basic UI, pinned helper와 설치된 라이브러리를 대조했다. 자산은 D103의 실제 weather/shape/detail/STBN/LUT를 계속 사용한다. 지형 지도와 DEM 1.5×, 서고 KEEP는 유지한다.

## 2. 원본 대조에서 확인한 차이

| 항목 | 확인한 근거 | 후보 조치 / 한계 |
|---|---|---|
| 구름 분포 | Basic 기본값 coverage .30 / weatherRepeat 100; 사용자 참고화면 .42 / 54 | 참고값 .42 / 54를 독립 프리셋으로 적용. 같은 weather map의 반복 간격을 넓힌다. 100/54≈1.85는 weather map의 공간 주기 비율이며, 모든 3D 세부 형태가 1.85배가 된다는 의미가 아니다. |
| 국소 응집 | original local_weather.png와 weatherExponent=1, shape/detail noise | 원본 자산 유지. 선택 제어 weatherExponent 1.6은 저부하 탐색만 했으며 정착되지 않은 TAA 프레임, 채택 아님. 폭넓은 군집/빈 공간 확보가 충분하다고 결론 내리지 않는다. |
| 두꺼운 층 | 원본 altitude750/1000m, thickness650/1200m | 이전 북유럽 두께1200/1800m 대신 원본 두께 복귀. 초기 시험5km/5.25km, 최신8km/8.25km로 이동. camera가7–7.5km까지 내려오므로 latest layer 아래를 바라볼 조건을 만들었다. 지형을 바꾼 것이 아니다. |
| 얇은 층 | 원본7500m/500m, 낮은 densityScale .003 | 상대 고도차 유지한 최신14750m/500m; 얇은 층 디테일은 원본 조건 유지. 모든 고도에 동일한 구름 표면을 확대하지 않는다. |
| 빛 커튼 | CloudsEffect.lightShafts → shadowLength → AerialPerspective 산란 | actual ON/OFF 저장. source Basic300에서는 희미한 밝고 어두운 띠가 보인다. 북유럽 최신 저부하 구도에서는 커튼의 강도가 목표에 못 미치므로 TUNE. wiring true가 눈에 보이는 wow 효과의 완성을 뜻하지 않는다. |
| 그림자 범위 | Basic shadow-maxFar=1e5 | 후보 maxFar100km로 제한. 넓은 기본 camera far에 의존하지 않게 한다. |
| AA | Basic SMAA, 기존 Vanilla 후보에는 없음 | 원본 Basic SMAA 추가. 볼륨 샘플 부족 자체를 SMAA가 모두 해결하는 것은 아니다. |
| 시간 재구성 | CloudsPass.setSize, cloudsResolve.frag | “시간 누적 OFF” 표기를 **4×4 시간 업스케일 OFF**로 정정. OFF도 full-resolution TAA는 동작한다. 진짜 raw/no-TAA가 아니다. |
| 구름 OFF | CloudsEffect는 Effect이며 enabled 속성이 없다 | EffectPass의 효과 목록에서 제외하고 recompile, aerial overlay/shadow/shadowLength를 해제. 현재 native OFF에서 cloudPassAttached=false 확인. |

## 3. 자글거림 원인과 적용 범위

[코드] temporalUpscale ON은 양 축 1/4, 즉 current cloud pass 1/16 샘플을 temporal resolve로 복원한다. OFF는 같은 resolutionScale에서 전체 cloud 해상도 TAA다. source [Issue40](https://github.com/takram-design-engineering/three-geospatial/issues/40)는 큰 raymarch step과 stochastic offset의 noise, denoiser 가능성을 설명하지만 아직 Open 제안이다. denoiser가 구현된 해결책이라고 기록하지 않는다.

원본 Basic3500에서도 미세 grain이 관찰됐다. 사용자 지적을 원본 탓으로 돌리는 것이 아니라, 같은 자료/광학 조건에서도 남는 샘플링 문제와 우리 구현 차이를 분리한다. high/fullres 정지 캡처가 upscale보다 매끈하지만 비용이 크다. 움직일 때 ghosting과 사선/띠무늬가 없어졌다는 검증은 아직 없다. [공식 README](https://github.com/takram-design-engineering/three-geospatial/blob/{source}/packages/clouds/README.md)의 temporal ghosting 및 global-space 제한도 유지한다.

## 4. 실제 검증 결과

- RTX3070: Basic300 high/fullres75% 빛 커튼 ON/OFF, north p.300 high/fullres75% 초기5km 층 native 캡처. source Basic에서 띠 광선 기여가 확인되지만 사진/목업 수준의 완성을 선언하지 않는다.
- context failure: 2026-10-08 03:02:09.354 UTC에 Context Lost 기록. north repeat100 대조와 north345의 흰 화면은 rejected-context에 보존. 둘 다 renderer null이므로 이전 GPU query 숫자가 남아도 해당 프레임 성능 증거로 사용하지 않는다. repeat54 vs100의 완성된 동등 시각 대조는 미완.
- 이후 native 메타데이터의 renderer는 Microsoft Basic Render Driver였다. GPU timer도 unavailable. 정상 이미지가 복구됐지만 하드웨어 GPU 복구는 확인되지 않았다. 원인(메모리/드라이버/브라우저 watchdog)은 미확정이다.
- code 대응: lost context 때 루프/정상 저장 중단, source Basic 시험에서는 지형 lazy 초기화로 불필요한 리소스 준비 생략, 25% 진단 옵션 추가, quality preset 뒤 shaft/temporal/scale 제어를 다시 적용한다.
- software low25%: 구름 ON/OFF 실제 저장, latest north8km 층 .265/.285/.300/.320/.345/.365 여섯 고정 구도 저장. 이는 **기능/구도 진단**이며 near-field 고품질, 전체 움직임, 실제 GPU 안정성 증거가 아니다. north 빛 커튼 OFF 대조도 진단으로 분류.
- software high50% north.365 정지 프레임도 저장했다. 낮은 진단 프리셋보다 선명하지만 upscale의 입자/점선 무늬가 남고 빔 가시성도 부족하다. high 표기만으로 시각 PASS나 하드웨어 성능을 주장하지 않는다.
- build: cloudLab 포함 Vite76modules PASS. records 검사 결과는 WORKLOG 최종 checkpoint 참조. shader/driver의 모든 동작을 build가 검증하지는 않는다.

### RTX 정지 캡처의 composer query (ms)

| 캡처 | p50 | p95 |
|---|---:|---:|
{metrics}

전체 composer.render 범위이며 cloud 단독 비용, CPU/프레임 총시간, FPS, targetPC 보장이 아니다. sequential ad hoc 지표이고 ON/OFF 숫자를 빼서 증분 budget으로 사용하지 않는다. software 캡처의 성능 수치는 없다.

## 5. 화면 품질 대조 / 남은 수정

| 부분 | 판단 | 다음 기준 |
|---|---|---|
| 원본 하늘 구름의 뭉친 경계와 빈 공간 | 개선 후보 / TUNE | 같은 시야각과 날씨 위상에서 repeat54/100 정착된 프레임을 비교 |
| 원본 하늘 아래 빛 띠 | 원형 기여 확인 / TUNE | 화면 중앙과 측면에 빔의 밝기 차이, 가장자리/구름 밀도와 인과 확인 |
| 북유럽 p.300 | 기존 지형 유지 / TUNE | 원본 albedo→Lambert와 기존 PBR 차이를 포함해 암부 및 구름 face 노출 조정 |
| 북유럽 p.345–.365 | low 진단에서는 구름 아래 구도 성립, 빔 부족 / TUNE | hardware 복구 후 high/fullres와 upscale 비교; 태양 방향·빈 구름 창·shadow 안정성 순서로 조정 |
| 전 구간 자글거림 | 미해결 GAP | 최소6개 동일 구도 정착+이동 대조. 날씨 배치와 raymarch/temporal 문제를 별도로 판단 |
| main globe→cloud 연결 | 미착수 | above 품질/안정성 확인 후 연결. 기존 화면을 먼저 교체하지 않음 |

## 6. 다음 작업 순서

1. 브라우저 하드웨어 renderer가 RTX로 돌아온 것을 native 메타데이터로 확인한다. 응답이 돌아왔다는 것만으로 복구라 하지 않는다.
2. latest8km 층과 실제 DEM 같은 six poses를 high에서 재캡처, repeat54/100 및 정착된 exponent1/1.6 분리 시험. 부족하면 weather macro 군집의 큰 스케일을 조정하되 새 증거를 남긴다.
3. north final 구도에서 빛 커튼의 ON/OFF 가시성, temporal grain/ghosting, terrain normals/노출을 확인. 빔 강도를 단순 bloom으로 대체하지 않는다.
4. 통과한 레시피로 기존 globe/지형의 연속 경로에 연결하고, scroll 역방향·정지·재진입을 검증한다.

기존 archive와 terrain KEEP / 사용자 capture6파일 보존 / D080 cloud-free·AI-video fallback 미실행 / old combined2회 실패 이력 / A-P3·Story·BC 별도대기. 현재 이 후보의 품질 승인이나 main 통합을 완료했다고 기록하지 않는다.

## 7. 근거와 재개 경로

- REF-015 EFX-015-02, F071 / D105 / O019–020 / CASE007.
- verification/a-takram-audit-20261008/manifest.json / gallery.html / fidelity.md.
- native capture는 verification/a-cloud-sculpt-20261006/native-captures/takram-audit; 각 JSON이 당시 층/품질/renderer/광학 옵션의 기준이다. 같은 날짜라도 층5km·8km와 GPU/소프트웨어 캡처를 섞지 않는다.
- source useCloudsControls.ts 및 사용자 참고 이미지에 해시/증거 유형을 기록했다. assets는 기존 D103/D104 pin을 갱신하지 않는다.

## 8. shader / post 점검 (§12)

| 요소 | 적용 / 제외 / 한계 |
|---|---|
| 재질 | source albedo + Aerial Lambert. 기존 main PBR는 유지. candidate의 원래 specular/roughness는 이 chain에서 유지되지 않는 한계. |
| 조명/그림자 | sun/sky + cloud BSM + shadowLength, maxFar100km. 추가 AO/bake는 넣지 않음. |
| 대기 | source LUT/하늘/연무/광선 적용. 장식 cone/dust는 넣지 않음. |
| 색보정 | AGX exposure10 + LensFlare + Dithering. 별도 미술 LUT/bloom은 넣지 않음. |
| 선명도 | Basic SMAA 추가, cloud quality/scale/temporal 선택. DOF 없음, 의도적 grain 없음; 보이는 입자감은 남은 artifact. |
| 성능 | composer GPU query 또는 unavailable 기록. cloud OFF 및 shaft OFF 진단 제공. source 원형은 terrain 초기화 생략. 움직임/실기예산 미검증. |
''')

write('verification/a-takram-audit-20261008/fidelity.md', '''# D105 충실도 게이트

| 게이트 | 상태 | 근거 / 한계 |
|---|---|---|
| G1 source 수치 | CONDITIONAL | .42/54, 원본650/1200m 두께, SMAA/maxFar100km 반영. north altitude8km는 번안, 원본 위치/구도 동일 아님. |
| G2 재료 | PASS scoped | 기존 D103 pinned weather/noise/LUT, 새 helper hash. 내부 검토 D084. 출품 전 별도 검토. |
| G3 최소6장 대조 | PARTIAL | north six native diagnostic frames. 외부 source와 6장 모두 동일 구도 나란히 비교는 미완. |
| G4 룩 수치 | PARTIAL | coverage/층/빛 ON/OFF와 GPU metadata 보존. 원본과 맞춘 전체 luminance/chroma 비교 미완. |
| G5 상태 | PARTIAL | cloud/shaft OFF, fullres/upscale와 six fixed pose. continuous motion, reduced-motion/main idle, GPU 회복/targetPC 미검증. |
| G6 자체수정 | CONDITIONAL | source 계약/OFF 수정 → 레이어/광학 시험 → context 대응/lazy/저부하 진단. 정상 GPU의 완전 재검증은 남음. |

종합: 기능 CONDITIONAL / 품질 TUNE. 저부하 software still을 최종 quality/성능 승인으로 사용하지 않는다. GPU 실패2쌍은 명시 REJECT 증거로 분리했다.
''')
print(json.dumps({'captures':len(rows),'rejected':len(rejected),'status':'TUNE'}, ensure_ascii=False))
