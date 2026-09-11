"""Static design boards, not application rendering or waveform evidence."""
from pathlib import Path
from html import escape
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/wireframes'
OUT.mkdir(exist_ok=True)
BG='#10171d'; PANEL='#1b252e'; LINE='#465660'; TEXT='#e7edf0'; MUTED='#aab9c3'; ACCENT='#7bd8c5'
records=[]

class Board:
    def __init__(self,id,title,w=1920,h=1080):
        self.id=id; self.title=title; self.w=w; self.h=h; self.regions=[]
        self.im=Image.new('RGB',(w,h),BG); self.draw=ImageDraw.Draw(self.im)
        self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img"><title>{escape(id+" — "+title)}</title><desc>Static spatial wireframe. Rectangles reserve waveform space; no signal or performance data is shown.</desc><rect width="{w}" height="{h}" fill="{BG}"/>']
    def text(self,x,y,s,size=22,fill=TEXT):
        font=ImageFont.truetype('DejaVuSans.ttf',size)
        width=font.getlength(s)
        assert x+width <= self.w-8,(self.id,s,x+width)
        self.draw.text((x,y),s,font=font,fill=fill)
        self.svg.append(f'<text x="{x}" y="{y+size}" font-family="DejaVu Sans,Arial,sans-serif" font-size="{size}" fill="{fill}">{escape(s)}</text>')
    def box(self,id,x,y,w,h,label,sub='',fill=PANEL):
        assert x>=0 and y>=0 and x+w<=self.w and y+h<=self.h,(self.id,id)
        for value,size in [(label,22),(sub,18)]:
            assert ImageFont.truetype('DejaVuSans.ttf',size).getlength(value)<=w-32,(self.id,id,'text exceeds region',value)
        self.regions.append(dict(id=id,x=x,y=y,w=w,h=h))
        self.draw.rectangle((x,y,x+w,y+h),fill=fill,outline=LINE,width=1)
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{fill}" stroke="{LINE}"/>')
        self.text(x+16,y+10,label,22)
        if sub:self.text(x+16,y+44,sub,18,MUTED)
    def plot(self,id,x,y,w,h,label,sub='Same sample range / shared mV scale'):
        self.box(id,x,y,w,h,label)
        self.text(x+w-220,y+12,f'Plot {int(w-64)} x {h-48}',18,MUTED)
        gx,gy,gw,gh=x+48,y+36,w-64,h-48
        self.regions[-1]['plotHeight']=gh
        self.regions[-1]['plotWidth']=gw
        for i in range(1,9):
            xx=gx+gw*i/9
            self.draw.line((xx,gy,xx,gy+gh),fill='#293640')
            self.svg.append(f'<path d="M{xx} {gy}v{gh}" stroke="#293640"/>')
        self.draw.line((gx,gy+gh/2,gx+gw,gy+gh/2),fill=LINE)
        self.svg.append(f'<path d="M{gx} {gy+gh/2}h{gw}" stroke="{LINE}"/>')
        self.text(gx+16,gy+gh/2+16,'Waveform space reserved',22,MUTED)
        self.text(gx+16,gy+gh/2+48,sub,18,MUTED)
    def header(self,mode='REPLAY / SWEEP / 1x',condition='D1 / MITDB 111 / muscle noise / 0 dB'):
        self.text(32,24,'ECG Signal Studio',30)
        self.text(450,30,mode,22,ACCENT)
        self.text(self.w-360,30,'Design board / no real data',19,MUTED)
        self.box('condition',32,88,self.w-64,48,condition)
    def timeline(self,y=848,h=60):
        self.box('timeline',32,y,self.w-64,h,'00:00      Timeline: total 10:00 / current viewport [5 s] / playhead      10:00')
        if h>=56:self.text(48,y+35,'Scenario A / B / C markers: positions pending input/reference selection',17,MUTED)
    def controls(self,y=996):
        self.box('transport',32,y,self.w-64,60,'Pause    Sweep / Scroll    1x    View 2.5 / 5 / 10 s    Fix current interval    Evidence    Exit presentation')
    def side(self,title='Selected method / M08',lines=None):
        self.box('detail',1512,160,376,672,title)
        for i,t in enumerate(lines or ['Wavelet U-Net','Quick explanation','Purpose in comparison','Reference 35 / 55 / 75%','Pin current method','Details / limitations','Local / Session / Experiment']):
            self.text(1528,220+i*60,t,20,MUTED)
    def save(self):
        self.svg.append('</svg>');(OUT/f'{self.id}.svg').write_text('\n'.join(self.svg))
        self.im.save(OUT/f'{self.id}.png')
        plots=[r for r in self.regions if 'plotHeight'in r]
        records.append(dict(id=self.id,title=self.title,width=self.w,height=self.h,regions=self.regions,plotAreaFraction=round(sum(r['plotWidth']*r['plotHeight'] for r in plots)/(self.w*self.h),4)))

b=Board('W1','Presentation / Replay');b.header()
b.plot('input',32,160,1856,328,'Noisy input + gray Reference')
b.plot('output',32,504,1856,328,'Selected output / M08 + gray Reference')
b.timeline();b.box('methods',32,924,1856,56,'Methods    Front-end    Classical    Wavelet    Deep learning    Hybrid    All methods    Pin selected')
b.controls();b.save()

b=Board('W2','Inspect / Reference');b.header('INSPECT / interval fixed','Fixed range 02:14.000 - 02:19.000 / D1 / MITDB 111 / muscle noise / 0 dB')
b.plot('input',32,160,1456,328,'Noisy input + Reference');b.plot('output',32,504,1456,328,'Selected output / M08 + Reference');b.side()
b.timeline();b.box('inspect-tools',32,924,1856,56,'Reference 35 / 55 / 75%    Pin current method    Reference difference    Local metrics    Same fixed interval')
b.controls();b.save()

b=Board('W3','Inspect / Difference Lens');b.header('INSPECT / interval fixed')
b.plot('input',32,160,1456,328,'Noisy input + Reference');b.plot('output',32,504,1456,328,'Selected output / M08 + Reference');b.side()
b.box('difference',32,844,1456,80,'')
b.text(80,868,'Difference trace space / zero line / 64 px inner height',20,MUTED)
b.regions[-1].update(plotHeight=64,plotWidth=1392)
b.box('difference-tools',1512,844,376,80,'Output - Reference','Display gain x1 / x3 / x5')
b.timeline(940,52);b.box('transport',32,1008,1856,48,'Resume replay    Method selector    Pin    Reference opacity    Local metrics    Close details');b.save()

b=Board('W4','Pin / three rows');b.header('REPLAY / SWEEP / 1x','Same input / time / scale / pinned M04 stays fixed when selected method changes')
for id,y,label in [('input',160,'Noisy input + Reference'),('output',420,'Selected output / M08 + Reference'),('pinned',680,'Pinned comparison / M04 + Reference')]:b.plot(id,32,y,1856,248,label)
b.timeline(944,48);b.box('transport',32,1008,1856,48,'Pause    Sweep / Scroll    1x    Method selector    Remove pin    Fix interval    Evidence');b.save()

b=Board('W5','Attract / same-scene handoff');b.header('REPLAY / single-scene loop','Same ECG, different noise removal results')
b.plot('input',32,160,1856,352,'ECG with noise');b.plot('output',32,528,1856,352,'Same interval, processed output')
b.box('handoff',480,932,960,72,'Compare it yourself','Touch or click to continue from this scene and time')
b.text(32,1034,'REPLAY / stored scene / Attract loop 8-12 s / no automatic method or noise changes',20,MUTED);b.save()

b=Board('W6','Scenario launcher');b.header('REPLAY / paused for selection','Presentation scenes / record context retained until selection completes')
for i,(t,lines) in enumerate([('A / Strong noise',['Purpose: see input/output change','Input/reference selection only']),('B / DSP comparison',['Purpose: compare method families','No guaranteed DSP winner']),('C / Low noise',['Purpose: inspect preservation','No guaranteed overprocessing'])]):
    x=80+i*596;b.box('scenario-'+str(i),x,244,568,420,t)
    for k,t in enumerate(lines):b.text(x+16,324+k*46,t,20,MUTED)
    b.text(x+16,468,'Timestamp: not selected',22)
    b.box('start-'+str(i),x+16,568,536,60,'Start scene (pending verification)')
b.box('return',80,724,1760,64,'Return to previous scene and exact time    /    Personal bookmarks are separate from curated scenarios')
b.text(80,856,'Open from one Scenario button. No permanent three-card panel over the waveforms.',22,MUTED);b.save()

for suffix,state,detail in [('P','Preparing new condition','Pending: power-line noise / 5 dB. Current scene remains muscle noise / 0 dB.'),('E','New condition failed','Current scene retained. Retry the request or cancel and keep the current scene.'),('M','Requested output unavailable','Requested M09 is missing. Do not replace it with M08 or label old output as M09.')]:
    b=Board('W7-'+suffix,'Loading / error / missing');b.header('REPLAY / PAUSED / last valid scene','CURRENT: D1 / MITDB 111 / muscle noise / 0 dB / selected M08')
    b.plot('input',32,160,1856,328,'CURRENT noisy input + Reference');b.plot('output',32,504,1856,328,'CURRENT M08 output + Reference')
    b.box('pending',32,848,1856,112,state,detail)
    b.text(48,922,'Retry / Cancel request / Choose another method     |     Waveform + label + legend + metric commit together',20,MUTED)
    b.box('transport',32,996,1856,60,'Current scene controls retained / automatic resume only after valid atomic commit and prior playing state');b.save()

b=Board('W8','Compact 1366 x 768',1366,768)
b.text(24,18,'ECG Signal Studio',26);b.text(350,22,'REPLAY / SWEEP / 1x',22,ACCENT);b.text(1010,22,'Design board / no real data',19,MUTED)
b.box('condition',24,72,1318,44,'MITDB 111 / muscle noise / 0 dB    Conditions...    Methods: M08...    Pin    Evidence')
b.plot('input',24,128,1318,252,'Noisy input + Reference');b.plot('output',24,392,1318,252,'Selected output / M08 + Reference')
b.box('timeline',24,656,1318,40,'00:00       [viewport 5 s / playhead / scenario markers]       10:00')
b.box('transport',24,708,1318,44,'Pause    Sweep / Scroll    1x    Fix interval    Reference...    More...    Exit');b.save()

b=Board('W9','Touch visitor / no hover');b.header('REPLAY / touch path','One visitor choice: which noise?  Other settings stay available in More.')
b.plot('input',32,160,1856,328,'Noisy input + Reference');b.plot('output',32,504,1856,328,'Selected output + Reference')
b.timeline();
for i,t in enumerate(['Muscle movement','Power-line noise','Transient noise','More noises']):b.box('noise-'+str(i),32+i*468,924,452,56,t)
b.box('transport',32,996,1856,60,'Pause    Fix interval    Methods... [tap selects]    Pin selected [persistent comparison]    Evidence');b.save()

b=Board('W10','Evidence / Q&A');b.header('INSPECT / interval fixed')
b.plot('input',32,160,1216,328,'Noisy input + Reference');b.plot('output',32,504,1216,328,'Selected output / M08 + Reference')
b.box('evidence',1272,160,616,672,'Local | Session | Experiment')
for i,t in enumerate(['Local: fixed range 02:14-02:19','Session: this record / full 600 s','Experiment: separate aggregate population','Values: pending verified evidence','Metric definition: strict / scaled','Provenance: source / processing / model','Reference definition and limitations','Return restores exact scene + interval']):b.text(1290,230+i*58,t,20,MUTED)
b.timeline();b.box('scope',32,924,1856,56,'Scope and data coverage remain visible. No invented score. Unavailable evidence shows a reason.')
b.controls();b.save()

(OUT/'geometry.json').write_text(json.dumps(records,indent=2)+'\n')
notes={
'W1':('기본 발표 화면','2행 내부 높이 각각 280px. 기본은 하단 방법 rail; 파형 폭을 우선 확보합니다. Session 수치는 근거를 펼칠 때 한 개만 노출합니다.'),
'W2':('정밀 비교·Reference','고정 구간을 유지하고 오른쪽 설명 패널을 엽니다. 회색 Reference는 모든 행에서 같은 세기·축을 씁니다.'),
'W3':('Reference와 차이','기본 파형 높이 280px를 유지합니다. 하단 방법 rail을 오른쪽 선택기로 합치고 별도 80px Lens를 확보합니다. 내부 trace는 64px입니다.'),
'W4':('Pin 3행 비교','각 plot 내부 200px를 확보합니다. 고정 방법은 선택·hover로 바뀌지 않습니다. 3행과 Difference Lens를 함께 요구하면 별도 상세 영역을 펼칩니다.'),
'W5':('Attract와 인계','8–12초 대표 장면 반복임을 표시합니다. 첫 의미 있는 클릭/터치로 방금 보던 장면·시각에서 체험을 이어갑니다.'),
'W6':('시나리오 선택','A/B/C는 설명 목적이며 승자 보장이 아닙니다. 실제 timestamp는 입력·Reference 규칙을 먼저 고정한 뒤 선정합니다.'),
'W7-P':('새 조건 준비 중','CURRENT는 이전 유효 데이터의 라벨입니다. 요청한 새 조건은 별도 pending 안내에만 나타납니다.'),
'W7-E':('로딩 실패·재시도','현재 유효 파형을 남깁니다. Retry는 새 요청 ID로 실행하며 늦게 도착한 이전 응답은 폐기합니다.'),
'W7-M':('방법 출력 누락','M09 요청 실패 시 기존 M08을 M09로 표시하지 않습니다. 다른 방법 자동 대체도 하지 않습니다.'),
'W8':('1366×768','각 plot 내부 204px. 조건·방법은 펼침 선택기로 줄입니다. 3행을 요청하면 파형 내부 영역에 세로 스크롤을 허용해 행당 180px 이상을 보존합니다. 발표 기본은 같은 구간의 2행 A/B 전환입니다.'),
'W9':('터치 체험','기본 선택은 noise 하나입니다. 탭으로 방법 선택 후 Pin으로 지속 비교합니다. 필수 동작에 hover가 필요하지 않습니다.'),
'W10':('근거·질의 응답','Local → Session → Experiment의 모집단·구간·정의를 각각 표시합니다. Experiment를 현재 600초 성능처럼 보이게 하지 않습니다.')}
parts=['<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ECG v2.2 Wireframe Review</title><style>body{margin:0;background:#10171d;color:#e7edf0;font:16px/1.7 system-ui,sans-serif}main{max-width:1600px;margin:auto;padding:24px}h1{font-size:28px}nav{display:flex;gap:8px;flex-wrap:wrap}a{color:#7bd8c5}nav a{padding:8px 14px;border:1px solid #465660;border-radius:4px}section{margin:36px 0 56px}img{display:block;width:100%;height:auto;border:1px solid #465660}p{max-width:1000px}.badge{color:#aab9c3}a:focus-visible{outline:3px solid #7bd8c5;outline-offset:3px}</style><main><h1>ECG v2.2 — 화면 배치 검토</h1><p>W1–W10 설계 보드입니다. 격자 영역은 파형 공간 예약이며 실제 ECG·기법 결과·성능 수치를 그린 화면이 아닙니다. 화면 내부 문구는 배치 검토용 영문 약식이며 최종 제품은 기획서의 한국어 문구를 적용합니다. 실제 GUI 구현이나 브라우저 검수 완료를 뜻하지 않습니다.</p><p><a href="../15_wireframe_review.md">설계 결정·크기 기준·검수 내역</a> · <a href="../14_resume_audit.md">중단 작업 복구 기록</a></p><nav>']
for r in records:parts.append(f'<a href="#{r["id"]}">{r["id"]}</a>')
parts.append('</nav>')
for r in records:
    id=r['id'];title,desc=notes[id]
    parts.append(f'<section id="{id}"><h2>{id} · {title}</h2><p>{desc}</p><p class="badge">{r["width"]} × {r["height"]} 기준 · 실제 plot 영역 {r["plotAreaFraction"]*100:.1f}% · <a href="{id}.svg">벡터 원본</a></p><img src="{id}.png" width="{r["width"]}" height="{r["height"]}" loading="lazy" alt="{escape(title)} 공간 배치. {escape(desc)}"></section>')
parts.append('</main></html>');(OUT/'index.html').write_text('\n'.join(parts))
print(json.dumps({'boards':len(records),'svg':len(list(OUT.glob('*.svg'))),'png':len(list(OUT.glob('*.png'))),'bounds':'PASS'},indent=2))
