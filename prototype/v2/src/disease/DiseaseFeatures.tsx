/* D-191 질환 특징 비교: 위 = 같은 기록의 정상 박동, 아래 = 질환 박동(원파형, 잡음 없음). 특징을 하나씩 글자와 두 파형 부위에 함께 강조하고
 * 0.6 s 페이드로 교차한다(자동 4.5 s, 누르면 그 특징). 부위는 features.ts 가 주석 R과 원파형에서 계산한다(QRS 폭은 추정). 지금은 심실 조기 수축만. */
import React, {useEffect, useMemo, useState} from 'react';
import {decode} from '../engine';
import {beatGeo, pickPvc, pickNormal, type Beat} from './features';
type File = {fs: number, n: number, disease: string, record: string, beats: Beat[], scenes: {traces: Record<string, string>, scale: number}[]};
type Feat = {id: string, title: string, note: string};
const PVC_FEATS: Feat[] = [
  {id: 'early', title: '예상보다 일찍 온다', note: '앞 박동에서 정상 R–R만큼 지난 자리(점선)보다 먼저 나타난다'},
  {id: 'wide', title: 'QRS가 넓다(0.12 s 이상)', note: '빠른 전도로(히스–푸르킨예) 대신 심실 근육을 따라 천천히 흥분이 퍼진다'},
  {id: 'shape', title: 'QRS 모양이 다르다', note: '흥분이 시작되는 자리와 경로가 달라 모양이 바뀐다'},
  {id: 'nop', title: '앞에 P파가 없다', note: '심방에서 시작한 박동이 아니다 — P파가 있어야 할 자리가 비어 있다'},
  {id: 'tinv', title: 'T파가 QRS와 반대 방향', note: '재분극도 거꾸로 진행해 T파가 QRS 주 방향과 반대로 선다'},
  {id: 'pause', title: '뒤에 긴 휴지(보상 휴지)', note: '앞 정상 박동부터 다음 정상 박동까지가 정상 R–R의 두 배 가까이'},
];
export const FEATURE_DISEASES = new Set(['pvc']);
const VW = 1000, VH = 190, PADL = 8;
export function DiseaseFeatures({file}: {file: File}) {
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const g = useMemo(() => {
    if (file.disease !== 'pvc') return null;
    const s = file.scenes[0], x = decode(s.traces.clean, s.scale, file.n), fs = file.fs, pv = pickPvc(file.beats, fs);
    const nm = pickNormal(file.beats.filter(b => b.i < (pv?.prev ?? 0) - fs || b.i > (pv?.next ?? 0) + fs), fs) ?? pickNormal(file.beats, fs);
    if (!pv || !nm) return null;
    const L = (pv.next - pv.prev) / fs + .9, d0 = pv.prev - Math.round(.45 * fs), n0 = nm.a - Math.round(.45 * fs), N = Math.round(L * fs);
    const seg = (a: number) => Array.from({length: N}, (_, k) => x[Math.min(x.length - 1, Math.max(0, a + k))]);
    const dv = seg(d0), nv = seg(n0), med = (v: number[]) => [...v].sort((p, q) => p - q)[v.length >> 1], bd = med(dv), bn = med(nv);
    const amp = Math.max(...dv.map(v => Math.abs(v - bd)), ...nv.map(v => Math.abs(v - bn))) * 1.12;
    const X = (k: number) => PADL + k / N * (VW - PADL * 2), Y = (v: number, b: number) => VH * .52 - (v - b) / amp * VH * .44;
    const path = (v: number[], b: number, a = 0, z = v.length) => v.slice(a, z).map((y, k) => `${k ? 'L' : 'M'}${X(a + k).toFixed(1)},${Y(y, b).toFixed(1)}`).join('');
    const geo = (r: number) => beatGeo(x, r, fs);
    return {fs, N, X, Y, dv, nv, bd, bn, path, rr: pv.rr, pause: pv.pause,
      d: {start: d0, prev: geo(pv.prev), v: geo(pv.v), next: geo(pv.next)}, n: {start: n0, a: geo(nm.a), b: geo(nm.b), c: geo(nm.c)}};
  }, [file]);
  const [k, setK] = useState(0), [play, setPlay] = useState(true);
  useEffect(() => { setK(0); }, [file.disease]);
  useEffect(() => { if (!play || !g) return; const id = setInterval(() => setK(v => (v + 1) % PVC_FEATS.length), reduced ? 6000 : 4500); return () => clearInterval(id); }, [play, g, reduced]);
  if (!g) return null;
  const cur = PVC_FEATS[k].id, on = (id: string) => 'df-hl' + (cur === id ? ' on' : ''), dx = (i: number, s: number) => g.X(i - s);
  const {d, n} = g, fs = g.fs, ln = (id: string, x1: number, y1: number, x2: number, y2: number, dash = false) => <line className={on(id)} x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dash ? '6 5' : undefined}/>;
  const band = (id: string, a: number, b: number, s: number, cls = '') => <rect className={on(id) + ' band ' + cls} x={dx(a, s)} y={8} width={Math.max(2, dx(b, s) - dx(a, s))} height={VH - 16} rx={6}/>;
  const label = (id: string, x: number, y: number, t: string, anchor: 'start' | 'middle' | 'end' = 'middle') => <text className={on(id)} x={x} y={y} textAnchor={anchor}>{t}</text>;
  const bracket = (id: string, a: number, b: number, s: number, y: number, t: string) => <g className={on(id)}><path d={`M${dx(a, s)},${y + 6}V${y}H${dx(b, s)}V${y + 6}`} fill="none"/><text x={(dx(a, s) + dx(b, s)) / 2} y={y - 6} textAnchor="middle">{t}</text></g>;
  const arrow = (id: string, x: number, y0: number, sign: number, t: string) => { const y1 = y0 - sign * 34; return <g className={on(id)}><path d={`M${x},${y0}V${y1}M${x - 6},${y1 + sign * 9}L${x},${y1}L${x + 6},${y1 + sign * 9}`} fill="none"/><text x={x + 9} y={(y0 + y1) / 2 + 4}>{t}</text></g>; };
  const thick = (id: string, v: number[], b: number, a: number, z: number, s: number) => <path className={on(id) + ' thick'} d={g.path(v, b, a - s, z - s)} fill="none"/>;
  const yQ = (geo: {r: number}, v: number[], b: number, s: number) => g.Y(v[geo.r - s], b);
  const expected = d.prev.r + Math.round(g.rr * fs), early = (expected - d.v.r) / fs;
  const strip = (which: 'n' | 'd') => {
    const s = which === 'n' ? n.start : d.start, v = which === 'n' ? g.nv : g.dv, b = which === 'n' ? g.bn : g.bd;
    const main = which === 'n' ? n.b : d.v;   // 비교할 박동: 정상 줄은 두 번째 정상 박동, 질환 줄은 조기 박동
    return <svg className={'df-strip ' + which} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" role="img" aria-label={which === 'n' ? '정상 박동 세 개' : '정상 · 심실 조기 · 정상 박동'}>
      {/* 강조 아래층(띠) */}
      {band('nop', main.p[0], main.p[1], s, which === 'd' ? 'missing' : '')}
      {which === 'd' && band('pause', d.v.r, d.next.r, s, 'soft')}
      {band('shape', main.on, main.off, s, 'soft')}
      <path className="trace" d={g.path(v, b)} fill="none"/>
      {/* 강조 위층 */}
      {thick('shape', v, b, main.on, main.off + 1, s)}
      {bracket('wide', main.on, main.off, s, 20, `${((main.off - main.on) / fs).toFixed(2)} s(추정)`)}
      {label('nop', (dx(main.p[0], s) + dx(main.p[1], s)) / 2, VH - 14, which === 'd' ? 'P파 자리 — 없음' : 'P파')}
      {arrow('tinv', dx(Math.round((main.on + main.off) / 2), s), VH * .52, main.qrsSign, main.qrsSign > 0 ? 'QRS ↑' : 'QRS ↓')}
      {arrow('tinv', dx(Math.round((main.t[0] + main.t[1]) / 2), s), VH * .52, main.tSign, main.tSign > 0 ? 'T ↑' : 'T ↓')}
      {which === 'd' ? <>{ln('early', dx(expected, s), 10, dx(expected, s), VH - 10, true)}{label('early', dx(expected, s) + 6, 30, '정상이면 여기', 'start')}
          <path className={on('early') + ' arrowline'} d={`M${dx(expected, s)},${VH * .2}H${dx(d.v.r, s) + 8}M${dx(d.v.r, s) + 16},${VH * .2 - 6}L${dx(d.v.r, s) + 8},${VH * .2}L${dx(d.v.r, s) + 16},${VH * .2 + 6}`} fill="none"/>
          {label('early', (dx(expected, s) + dx(d.v.r, s)) / 2, VH * .2 - 8, `${early.toFixed(2)} s 일찍`)}
          {bracket('pause', d.prev.r, d.next.r, s, VH - 34, `앞 → 다음 정상 박동 ${(g.pause).toFixed(2)} × R–R`)}</>
        : <>{ln('early', dx(n.b.r, s), 10, dx(n.b.r, s), VH - 10, true)}{label('early', dx(n.b.r, s) + 6, 30, `다음 박동(R–R ${g.rr.toFixed(2)} s)`, 'start')}
          {bracket('pause', n.a.r, n.c.r, s, VH - 34, '두 R–R')}</>}
      <circle className={on('shape') + ' ring'} cx={dx(main.r, s)} cy={yQ(main, v, b, s)} r={14}/>
    </svg>;
  };
  return <section className={'disease-features' + (reduced ? ' reduced' : '')} aria-label="정상 박동과 비교한 특징">
    <div className="df-head"><span className="eyebrow">FEATURE · 정상과 비교</span><h3>심실 조기 수축은 정상 박동과 무엇이 다른가</h3>
      <div className="df-ctl"><button onClick={() => setK(v => (v + PVC_FEATS.length - 1) % PVC_FEATS.length)} aria-label="이전 특징">◀</button>
        <button onClick={() => setPlay(p => !p)} aria-pressed={!play}>{play ? 'Ⅱ 멈춤' : '▶ 자동'}</button>
        <button onClick={() => setK(v => (v + 1) % PVC_FEATS.length)} aria-label="다음 특징">▶</button></div></div>
    <div className="df-body">
      <ol className="df-list">{PVC_FEATS.map((f, i) => <li key={f.id} className={i === k ? 'on' : ''}><button onClick={() => { setK(i); setPlay(false); }}><b>{f.title}</b><small>{f.note}</small></button></li>)}</ol>
      <div className="df-strips">
        <div className="df-row"><span className="df-tag n">정상 박동 · 같은 기록 {file.record}</span>{strip('n')}</div>
        <div className="df-row"><span className="df-tag d">심실 조기 수축</span>{strip('d')}</div>
        <p className="df-foot">원파형(잡음 없음) · 두 줄은 같은 시간 · 같은 mV 축, 앞 정상 박동의 R을 같은 자리에 맞춤 · R = 전문의 주석, QRS 폭 · P · T 자리는 파형에서 계산한 추정 · 교육용</p>
      </div>
    </div>
  </section>;
}
