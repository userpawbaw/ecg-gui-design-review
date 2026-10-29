/* 실시간 측정 B안 (D-157) — 브리지 스트림을 이 앱이 직접 받아 그리는 화면.
 * 데이터: 같은 출처 프록시 `bridge/…` → 원본 저장소 scripts/serial_bridge.py --serve (SSE /stream, GET·POST /fe).
 * 브리지는 CORS 헤더를 보내지 않으므로 다른 출처에서 직접 열면 브라우저가 막는다(`?bridge=`로 직접 붙는 것은 브리지가
 * CORS를 낼 때만 된다). 계약: 성능 수치·Reference·차이 없음, 앱은 기록하지 않음, 출처를 지어내지 않음(스트림에는
 * 실보드/재생 구별이 없다 — `stat.src`가 오면 그것을 쓴다). */
import React, {useEffect, useRef, useState} from 'react';
import {LiveStream, LABEL, RAW_COLOR} from './liveStream';
import {drawSplit, drawOverlay, type View} from './livePlot';
import * as AX from './liveAxis';

/** 연결 안 됨 — 글 대신 그림 하나와 짧은 말(사용자 2026-10-29 "간결하고 AI티 나지 않게"). 실행 방법은 docs/LOCAL_WINDOWS.md. */
export function LiveOffline({checking = false}: {checking?: boolean}) {
  return <div className="live-offline" role="status">
    <svg viewBox="0 0 160 64" width="210" height="84" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path className="trace" d="M4 36h22l5-10 6 22 6-30 5 18h20"/>
      <path className="cut" d="M74 36h8" strokeDasharray="2 5"/>
      <path d="M92 28h10a8 8 0 0 1 0 16H92z"/><path d="M84 32h8M84 40h8"/>
      <path d="M110 36h18a10 10 0 0 0 10-10V14"/><path d="M138 14h10M138 14v-6"/>
    </svg>
    <b>{checking ? '찾는 중' : '연결되지 않음'}</b>
    <small><i/>다시 찾는 중</small>
  </div>;
}

type FeModes = Record<string, {label: string, note?: string}>;
type Conn = 'checking' | 'on' | 'retry' | 'down' | 'lost';
const WINDOWS = [2.5, 5, 10];

export function LiveView({base, help}: {base: string, help: React.ReactNode}) {
  const S = useRef<LiveStream>(new LiveStream(5)).current;
  const reduced = useRef(matchMedia('(prefers-reduced-motion: reduce)').matches).current;
  const [view, setView] = useState<View>({mode: 'split', play: 'scroll', amp: 0, eraseFrac: AX.ERASE_FRAC, softEdge: true, glowOn: !reduced});
  const viewRef = useRef(view); viewRef.current = view;
  const [conn, setConn] = useState<Conn>('checking');
  const [fe, setFe] = useState<{modes: FeModes, current: string | null}>({modes: {}, current: null});
  const [layout, setLayout] = useState(0), [, setTick] = useState(0);
  const [note, setNote] = useState<string>(''), [winS, setWinS] = useState(5), [ampText, setAmpText] = useState('0');
  const canvases = useRef(new Map<string, HTMLCanvasElement>()), overlay = useRef<HTMLCanvasElement | null>(null);
  const dirty = useRef(true), lastLayout = useRef(0), notesSeen = useRef(0);

  // 브리지 찾기 → SSE. 못 찾으면 5 s 마다 다시(A안과 같은 규칙).
  useEffect(() => {
    let alive = true, es: EventSource | null = null, timer = 0;
    const url = (p: string) => base.replace(/\/$/, '') + p;
    const probe = async () => {
      try {
        const r = await fetch(url('/fe'), {cache: 'no-store'}); if (!r.ok) throw new Error(String(r.status));
        const d = await r.json(); if (!alive) return;
        setFe({modes: d.modes ?? {}, current: d.current ?? null}); S.feMode = d.current ?? null; open();
      } catch { if (!alive) return; setConn('down'); timer = window.setTimeout(probe, 5000); }
    };
    const open = () => {
      es = new EventSource(url('/stream'));
      es.onopen = () => alive && setConn('on');
      es.onerror = () => alive && setConn(c => c === 'lost' ? c : 'retry');
      es.onmessage = ev => { if (S.ingest(ev.data)) dirty.current = true; };
    };
    setConn('checking'); probe();
    return () => { alive = false; clearTimeout(timer); es?.close(); };
  }, [base]);

  // 낮은 빈도 상태(통계·알림·칸 구성)만 React 로 — 4 Hz.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (S.layoutVersion !== lastLayout.current) { lastLayout.current = S.layoutVersion; setLayout(S.layoutVersion); }
      if (S.notes.length > notesSeen.current) {
        const n = S.notes[S.notes.length - 1]; notesSeen.current = S.notes.length; setNote(n.text);
        if (n.kind === 'link') setConn('lost'); else window.setTimeout(() => setNote(t => t === n.text ? '' : t), 6000);
      }
      if (S.feMode !== fe.current && S.feMode) setFe(f => ({...f, current: S.feMode}));
      setTick(t => t + 1);
    }, 250);
    return () => clearInterval(id);
  }, [fe.current]);

  // 그리기 — 보이는 끝(vh)이 움직일 때, 그리고 멈춘 스윕의 잔광이 사그라드는 0.3~0.7 s 동안만(D-45).
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now(), vh = S.reveal.at(now);
      if (vh !== S.vh) { S.vh = vh; dirty.current = true; }
      const since = now - S.lastData, v = viewRef.current;
      const fading = v.play === 'sweep' && v.glowOn && since > 300 && since < 700;
      if (!dirty.current && !fading) return;
      dirty.current = false;
      if (v.mode === 'overlay') { if (overlay.current) drawOverlay(S, v, overlay.current); }
      else drawSplit(S, v, canvases.current);
    };
    raf = requestAnimationFrame(frame);
    const onResize = () => { dirty.current = true; }; addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', onResize); };
  }, []);
  useEffect(() => { dirty.current = true; }, [view, layout, winS]);

  const switchFe = (id: string) => {
    if (id === fe.current) return;
    fetch(base.replace(/\/$/, '') + '/fe', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mode: id})})
      .catch(() => setNote('브리지에 못 보냈다'));
  };
  const toggle = (n: string) => { S.hidden.has(n) ? S.hidden.delete(n) : S.hidden.add(n); setLayout(l => l + 1); };
  const setAmp = (raw: string) => {
    setAmpText(raw); let v = Number(raw);
    const next = Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : 0;
    if (next === 0 && view.amp > 0) S.gain.reset();
    setView(o => ({...o, amp: next}));
  };

  const st = S.stat, names = S.names(), shown = names.filter(n => !S.hidden.has(n));
  const connected = conn === 'on' || conn === 'retry' || conn === 'lost';
  if (!connected && !names.length) return conn === 'checking' ? <LiveOffline checking/> : <>{help}</>;
  const src = st.src === 'serial' ? '실보드' : st.src === 'replay' ? '재생 · 실측 아님' : '브리지 출력';
  const srcTip = '출처는 브리지 실행 방식을 따릅니다 — 보드면 실측, --replay면 합성. 성능 수치는 띄우지 않고, 받은 신호는 기록하지 않습니다.';
  const fmt = (v: number | undefined, d = 0) => v == null || !Number.isFinite(v) ? '—' : v.toFixed(d);
  return <div className="live-native">
    <div className="live-status" role="status">
      <span className={'live-conn ' + conn}>{conn === 'on' ? '● 연결됨' : conn === 'retry' ? '○ 끊김 — 다시 붙는 중' : conn === 'lost' ? '○ 선 끊김' : '○ 확인 중'}</span>
      <span className="live-src" title={srcTip}>{src}</span>
      {note && <span className="live-note">{note}</span>}
    </div>
    <div className="live-stats">
      {[['지연', fmt(st.lat_ms) + ' ms'], ['경과', fmt(st.elapsed, 1) + ' s'], ['손실', fmt(st.lost) + ' 샘플'], ['lead-off', fmt(st.leadoff) + ' 샘플'],
        ['프레임 깨짐', fmt(st.bad) + ' B'], ['재동기', fmt(st.resync)], ['처리 밀림', fmt(st.qdrop) + ' 블록', (st.qdrop ?? 0) > 0],
        ['처리 여유 (RTF)', fmt(st.rtf, 2) + ((st.rtf ?? 0) > .9 ? ' ⚠ 못 따라간다' : ''), (st.rtf ?? 0) > .9],
        ['도착 간격 (최대)', fmt(st.gap_ms) + ' ms' + ((st.gap_ms ?? 0) > 200 ? ' ⚠ 선이 뭉쳐 온다' : ''), (st.gap_ms ?? 0) > 200]].map(([k, v, bad]) =>
        <div key={k as string} className={bad ? 'bad' : ''}><small>{k}</small><b>{v as string}</b></div>)}
    </div>
    <div className="live-tools" role="group" aria-label="실시간 표시 도구">
      <span className="seg-group"><small>표시</small>
        {(['split', 'overlay'] as const).map(m => <button key={m} aria-pressed={view.mode === m} onClick={() => setView(o => ({...o, mode: m}))}>{m === 'split' ? '분리' : '겹치기'}</button>)}</span>
      <span className="seg-group"><small>재생</small>
        {(['scroll', 'sweep'] as const).map(p => <button key={p} aria-pressed={view.play === p} onClick={() => setView(o => ({...o, play: p}))}>{p === 'scroll' ? '스크롤' : '스윕'}</button>)}</span>
      {Object.keys(fe.modes).length > 0 && <span className="seg-group"><small>front-end</small>
        {Object.entries(fe.modes).map(([id, m]) => <button key={id} title={m.note} aria-pressed={id === fe.current} onClick={() => switchFe(id)}>{m.label}</button>)}</span>}
      <label>표시 길이<select value={winS} onChange={e => { const w = Number(e.target.value); S.setWindow(w); setWinS(w); }}>
        {WINDOWS.map(w => <option key={w} value={w}>{w}초</option>)}</select></label>
      <label>표시 범위 ±mV<input type="number" min={0} step={0.05} value={ampText} onChange={e => setAmp(e.target.value)} aria-label="표시 범위 ±mV (0 = 자동)"/><small>0 = 자동</small></label>
      <details className="live-more"><summary>추가 표시 설정</summary>
        <label><input type="checkbox" checked={view.softEdge} onChange={e => setView(o => ({...o, softEdge: e.target.checked}))}/> 경계 부드럽게</label>
        <label><input type="checkbox" checked={view.glowOn} onChange={e => setView(o => ({...o, glowOn: e.target.checked}))}/> 선단 밝기</label>
        <span className="seg-group"><small>지우기 영역</small>{AX.ERASE_CHOICES.map(f => <button key={f} aria-pressed={view.eraseFrac === f} onClick={() => setView(o => ({...o, eraseFrac: f}))}>{Math.round(f * 100)}%</button>)}</span>
      </details>
    </div>
    <div className="live-legend">{names.map(n => <button key={n} aria-pressed={!S.hidden.has(n)} onClick={() => toggle(n)} style={{color: n === 'raw' ? (view.mode === 'overlay' ? '#8fa3ad' : RAW_COLOR) : S.color(n)}}>
      <i/>{n === 'raw' ? '입력 · front-end 이전' : `${n} · ${LABEL[n] ?? ''}`}</button>)}</div>
    {!names.length && <p className="subtle">신호를 기다리는 중</p>}
    {view.mode === 'overlay'
      ? <div className="live-row"><div className="live-lab"><b>겹쳐 보기 — 모든 방법이 같은 축·같은 이득, 불투명도 85 %</b><span>입력은 옅은 회색 — 전극 DC만 뺐고 이득은 같다</span></div>
          <canvas ref={el => { overlay.current = el; }} className="live-canvas tall" data-mode={view.play}/></div>
      : shown.map(n => <div key={n} className="live-row"><div className="live-lab"><b style={{color: S.color(n)}}>{n === 'raw' ? LABEL.raw : LABEL[n] ?? n}</b><span>{n}</span></div>
          <canvas ref={el => { if (el) canvases.current.set(n, el); else canvases.current.delete(n); }} className="live-canvas" data-series={n} data-mode={view.play}/></div>)}
  </div>;
}
