"""D106: index native evidence without rewriting historical D105 assets/captures."""
from pathlib import Path
import json, hashlib, html

root=Path(__file__).resolve().parents[2]
folder=root/'verification/a-cloud-sculpt-20261006/native-captures/takram-hardware-20261008'
out=root/'verification/a-takram-hardware-20261008';out.mkdir(exist_ok=True)
report='docs/uiux_system/rounds/R1/SCENARIO-ABC-20261003/ECG_A_takram_hardware_recheck_2026-10-08.md'
preview='http://127.0.0.1:4198/cloud-lab.html?pose=north300&quality=high&scale=.5&cluster=1.6&reviewRound=takram-hardware-20261008'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,t):(root/p).write_text(t.rstrip()+'\n',encoding='utf-8')
rows=[]
for p in sorted(folder.glob('*.json')):
 d=json.loads(p.read_text(encoding='utf-8'));png=p.with_suffix('.png');s=d['state']
 assert png.exists() and 'NVIDIA GeForce RTX 3070' in d['renderer'] and not s['contextLost'],p
 rows.append({'file':p.relative_to(root).as_posix(),'png':png.relative_to(root).as_posix(),'sha256':sha(p),'pngSha256':sha(png),'renderer':d['renderer'],'state':s})
clouds=[r for r in rows if 'mode' in r['state']]
def six(exp,temporal):
 return [r for r in clouds if r['state']['mode'].startswith('north') and r['state']['resolutionScale']==.5 and r['state']['temporalUpscale']==temporal and r['state']['localWeatherRepeat']==[54,54] and r['state']['layers'][0]['weatherExponent']==exp and r['state']['lightShafts']]
baseline=six(1,False);upscale=six(1,True);candidate=six(1.6,False)
assert [len(x) for x in [baseline,upscale,candidate]]==[6,6,6]
assert all(r['state']['ready'] and r['state']['cloudPassAttached'] for r in clouds)
manifest={'decision':'D106','sourceBaseCommit':'8d20f37a5c2c45aa49746437f399ae5d60732f3a','status':'RTX_RECOVERED_SCOPED_RUNTIME_PASS_VISUAL_TUNE','preview':preview,'captures':rows,
 'hashBasis':'SHA256 of original working-tree bytes. JSON/text hashes can differ after Git line-ending conversion; PNG bytes are not transformed.',
 'runtimeFiles':{p:sha(root/p) for p in ['prototype/spikes/a-climb/cloud-lab.ts','prototype/spikes/a-climb/gpu-check.html','prototype/spikes/a-climb/vite.config.mjs']},
 'evidenceVersions':'Source rendering unchanged during captures; final patch adds URL cluster initialization and separate capture round. Manual captured UI state is authoritative over initial URL.',
 'limits':['Device recovery and this bounded trial do not prove original system-freeze root cause repaired','Full-resolution TAA at scale .5 means 640x360 cloud buffers for 1280x720 display','No matched six-frame external reference video, no target-PC/full replay or continuous scroll proof','Beam intensity, sparse cloud look and terrain lighting require user quality review','No main integration or final adoption']}
write('verification/a-takram-hardware-20261008/manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))

def image_tag(r):
 src='../'+Path(r['png']).relative_to('verification').as_posix()
 return f'<a href="{src}"><img loading="lazy" src="{src}" alt="actual native renderer capture"></a>'
cards=[]
for a,b,c in zip(sorted(upscale,key=lambda r:r['state']['p']),sorted(baseline,key=lambda r:r['state']['p']),sorted(candidate,key=lambda r:r['state']['p'])):
 cards.append(f'<section><h2>하강 {c["state"]["p"]:.3f}</h2><div class="pair"><article><h3>기존 4×4 업스케일 · 대비1</h3>{image_tag(a)}</article><article><h3>전체 해상도 TAA · 대비1</h3>{image_tag(b)}</article><article><h3>검토 후보 · 전체 해상도 TAA / 대비1.6</h3>{image_tag(c)}</article></div></section>')
other=[r for r in clouds if r not in upscale+baseline+candidate]
cards.extend(f'<section><h2>{html.escape(Path(r["file"]).stem)}</h2>{image_tag(r)}<p>실제 상태/renderer/GPU query: manifest.json</p></section>' for r in other)
write('verification/a-takram-hardware-20261008/gallery.html','<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>D106 · GPU 회복 후 구름 재검토</title><style>body{font:16px system-ui;line-height:1.7;background:#101820;color:#e2edf4;margin:24px}h3{font-size:15px}a{color:#9fe6ff}img{width:100%}article{min-width:0}.pair{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}section{margin:40px 0;border-top:1px solid #526274}.notice{padding:20px;background:#263448}@media(max-width:1000px){.pair{grid-template-columns:1fr}}</style><h1>D106 · RTX 회복 후 같은 지형 재검토</h1><p class="notice">모두 실제 RTX3070 렌더입니다. 같은 고정 카메라/DEM1.5×에서 시간 업스케일과 응집 대비를 비교했습니다. 세 번째 열은 검토 후보이며 최종 채택은 TUNE입니다. fullres50%는 1280×720 화면에서 구름640×360 렌더를 뜻합니다. 빛 커튼의 강도와 지형 암부, 연속 움직임 검증은 남았습니다.</p><p><a href="'+preview+'">검토 후보 실시간 열기</a> · <a href="../../'+report+'">상세 보고서</a> · <a href="manifest.json">설정/성능/해시</a></p>'+''.join(cards)+'</html>')

table='\n'.join(f'| {r["state"]["p"]:.3f} | {r["state"]["gpu"]["p50"]:.2f} / {r["state"]["gpu"]["p95"]:.2f} | {b["state"]["gpu"]["p50"]:.2f} / {b["state"]["gpu"]["p95"]:.2f} |' for r,b in zip(sorted(candidate,key=lambda r:r['state']['p']),sorted(baseline,key=lambda r:r['state']['p'])))
write(report,f'''# A · GPU 회복과 Takram 구름 재검증 — 2026-10-08

**D106 / RTX 회복 확인 · 범위 내 runtime PASS · 시각 TUNE**. native {len(rows)}쌍 중 장치 진단1쌍/구름{len(clouds)}쌍. D105 및 사용자 수정6capture를 덮어쓰지 않았다.

## 1. 재개와 검증 순서

[대화] 사용자가 컴퓨터 중단 후 복구를 요청했고, 갤러리 새로고침을 완료한 뒤 진행을 승인했다. 정상 갤러리 연결 확인 → 64×64 WebGL2 장치 확인 → source low25% → source high50% → north high50% upscale6구도 → 낮은 부하 fullres25% 대조 → fullres50%6구도 → 응집 대비1.6의 같은6구도 순서로 진행했다.

장치와 모든 native JSON에서 NVIDIA GeForce RTX3070, contextLost=false, GPU timer 사용 가능을 확인했다. 실제 저장 버튼→localhost POST→PNG/JSON→저장 완료 UI를 확인했다. console error/warn0. 이번 시험에서는 이전 context loss가 재발하지 않았으나 컴퓨터 전체 중단의 원인은 아직 미확정이다. 장치 회복이 원인 해결/장기 안정성 검증은 아니다.

## 2. 같은 화면에서 확인한 품질 차이

| 대조 | 결과 | 채택 상태 |
|---|---|---|
| 동일 high/scale25%, upscale ON vs fullres TAA | .365의 점선/입자 무늬가 fullres에서 줄었다. 25% 자체의 부드러운 저해상도 질감도 있으므로 미세 디테일을 유지하며 완전히 해결됐다고 하지 않는다. | 진단 근거 |
| 동일 high/scale50%, 여섯 고정 카메라 | fullres에서 반복적인 점선 패턴이 크게 줄고 구름의 부드러운 양감이 더 잘 보인다. | 검토 후보 / TUNE |
| repeat54 vs100, coverage .42 고정 | .365 동일 구도 대조 저장. weather 주기/배치가 바뀌며 반복값만으로 모든 국소 응집을 해결하지는 못한다. | 참고54 유지 |
| weatherExponent1 vs1.6 | 기존 weather map의 약한 밀도가 줄어 큰 빈 공간과 남은 덩어리의 대비가 커진다. 구름 총량/크기도 함께 줄며, 지형의 구름 그림자가 덜 덮여 더 밝게 보인다. 새 asset이나 진짜 cloud simulation으로 바뀐 것은 아니다. | 1.6 검토 옵션, 기본 원형은1 유지 |
| 빛 커튼 ON/OFF | .365의 대비1과1.6 각각 native 저장. 연결 기능은 정상이나 목표 참고 이미지 같은 강렬한 커튼은 여전히 부족하다. | TUNE |

원형의 random weather/shape/detail 자산은 D103/D104 그대로다. 반복된 자체 VDB 군집을 더 추가하지 않았다. 기존 terrain 지도·DEM1.5× 및 source camera는 유지하며, D104부터 분리된 albedo→Lambert 광학 후보를 시험했다. main PBR와 서고는 변경하지 않았다.

## 3. 검토용 레시피와 해상도 의미

- source: clouds0.7.6 / atmosphere0.19.1 / geospatial-effects0.6.4.
- north lower layer8000/8250m, thickness650/1200m; 얇은 layer14750/500m.
- coverage .42, localWeatherRepeat54, weatherExponent1.6 **검토 옵션**.
- quality high, resolutionScale .5, temporalUpscale=false, full-resolution TAA는 계속 사용.
- fullres는 선택된 cloud resolution 기준이다. 1280×720 화면/scale .5이면 cloud buffers640×360이며 실제 화면 전체를 fullres로 렌더했다는 뜻이 아니다.
- source Basic SMAA, shadow maxFar100km, lightShafts ON, wind OFF, AGX exposure10.

복구 원형의 기본 exponent1은 유지했다. URL cluster=1.6으로 검토 옵션을 재현할 수 있다. PNG의 UI 설정이 초기 URL 파라미터보다 실제 캡처의 기준이다. 추가 fullscreen cap/드라이버 설정 변경은 하지 않았다.

## 4. GPU 비용 — composer query ms (p50 / p95)

| 진행 | fullres50% / 대비1.6 | fullres50% / 대비1 |
|---|---:|---:|
{table}

각 fixed pose120query. scene render/post 전체 composer 범위이며 구름 단독/CPU/전체FPS/목표 전시PC 보장이 아니다. 정지 순차 시험이므로 값을 빼서 옵션의 순수 증분 비용으로 계산하지 않는다. 새 fullres recipe의 전체 구간 측정과 GPU 재발 여부를 확인했지만 continuous scroll/역방향 ghosting/4K/mobile/600초 replay는 별도 미검증이다.

## 5. 자체 검토와 다음 수정 지점

1. **완료**: 현재 RTX 회복, source/같은 north 지형 재실행, 시간 업스케일·분포·대비·빛 OFF 대조와 native 저장 경로 확인.
2. **검토 후보**: high/fullres50%/참고54/대비1.6. 빈 공간과 남는 구름 덩어리의 대비가 나아지고 입자 패턴이 줄었다. 사진/목업 수준을 완전히 충족했다고 승인하지 않는다.
3. **남은 빛 문제**: source Basic300의 커튼빛과 달리 north 카메라는 약7–7.5km이며 고정 태양/연무/구름 아래 시야가 다르다. 이 조건 차이는 약한 커튼의 가능한 원인 [추론]이며 단정하지 않는다. 다음 최소 시험은 구름의 빈 창→태양/카메라 정렬→광선이 보일 연무/수광 거리 순서다. bloom만 늘리지 않는다.
4. **남은 지형/질감 문제**: 일부 암부가 강하고 구름 가장자리의 미세 노이즈/원경 평탄함은 남는다. 기존 PBR와 Lambert 후보의 차이를 유지하며 source normal/depth와 tone/노출을 같은 구도로 튜닝해야 한다.
5. **이후 인계**: 이 후보의 사용자 품질 피드백 후 globe→cloud의 연속 카메라에 연결. 아직 main/globe 통합, 최종 recipe 채택, A-P3/Story/BC 실행을 완료한 것은 아니다. 기존 D080 두 대안 미실행/old combined2회 실패 이력은 유지한다.

## 6. 증거와 보존 경계

- verification/a-takram-hardware-20261008/gallery.html / manifest.json / fidelity.md.
- native folder: verification/a-cloud-sculpt-20261006/native-captures/takram-hardware-20261008.
- D105 source 자산/pin 및 native17쌍/실패2쌍은 역사적 증거로 유지. 현재 source 파일 해시가 D105와 달라진 것은 round/URL 옵션을 추가한 D106 변경이며 손실로 오인하지 않는다.
- 비교의6구도는 .265/.285/.300/.320/.345/.365. world/state/층/renderer/quality/실제 GPU query가 각 JSON에 있다. 이미지 변환이나 AI 생성 없음.

build 및 records 최종 결과는 WORKLOG checkpoint 참조. 이 문서는 scoped runtime 결과와 사용자 품질 판정을 분리한다.
''')
write('verification/a-takram-hardware-20261008/fidelity.md','''# D106 충실도 게이트

| 게이트 | 상태 | 근거 |
|---|---|---|
| G1 | CONDITIONAL | REF015 source 값, D1058km 번안 유지. exponent1.6은 새 검토 옵션. |
| G2 | PASS scoped | 기존 pinned 자산, native/meta 해시. 내부 검토 D084. |
| G3 | PARTIAL | 같은 six camera를 upscale/fullres/대비1.6 세 조건으로 대조. 외부 레퍼런스의 같은6frame 대응은 미완. |
| G4 | PARTIAL | 해상도/품질/밀도/층/광학 상태 대조. reference luminance/chroma의 정량 정합은 미완. |
| G5 | PARTIAL | source→north six poses, temporal/weather/contrast/shaft OFF. continuous scroll, targetPC, reduced-motion/main 통합은 미검증. |
| G6 | CONDITIONAL | 장치 점검→시간 재구성 분리→대비 후보 전체6구도 재검증. 추가 자체 shader 수정은 하지 않음. |

RTX 및 native 저장 기능 PASS, quality TUNE. 새 시험 중 context loss/warn/error 미관찰은 원래 컴퓨터 중단 원인 해결이나 장기 안정성 보장이 아니다.
''')
print(json.dumps({'nativePairs':len(rows),'cloudPairs':len(clouds),'sixPoseSets':3,'status':'TUNE'},ensure_ascii=False))
