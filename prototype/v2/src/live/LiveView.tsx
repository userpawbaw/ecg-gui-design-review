/* 실시간 측정 B안 (D-157) — 브리지 스트림을 이 앱이 직접 받아 그리는 화면.
 * 데이터: 같은 출처 프록시 `bridge/…` → 원본 저장소 scripts/serial_bridge.py --serve (SSE /stream, GET·POST /fe).
 * 브리지는 CORS 헤더를 보내지 않으므로 다른 출처에서 직접 열면 브라우저가 막는다(`?bridge=`로 직접 붙는 것은 브리지가
 * CORS를 낼 때만 된다). 계약: 성능 수치·Reference·차이 없음, 앱은 기록하지 않음, 출처를 지어내지 않음(스트림에는
 * 실보드/재생 구별이 없다 — `stat.src`가 오면 그것을 쓴다). */
import React, {useEffect, useRef, useState} from 'react';
import {LiveStream, LABEL, RAW_COLOR} from './liveStream';
import {drawSplit, drawOverlay, type View} from './livePlot';
import {drawSplitFx, drawOverlayFx} from './livePlotFx';
import {WAVE} from '../waveMode';
const FX = WAVE !== 'prev';
import * as AX from './liveAxis';
import {StateChip, StatePanel} from '../Glyph';

/** 연결 안 됨 — 글 대신 그림 하나와 짧은 말(사용자 2026-10-29 "간결하고 AI티 나지 않게"; D-160에서 공통 상태 그림으로). 실행 방법은 docs/LOCAL_WINDOWS.md. */
export function LiveOffline({checking = false}: {checking?: boolean}) {
  return checking
    ? <StatePanel className="live-offline" kind="loading" tone="idle" label="브리지 확인 중"/>
    : <StatePanel className="live-offline" kind="unplugged" tone="idle" label="브리지 연결 없음" note="자동 재시도 중"/>;
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
      if (v.mode === 'overlay') { if (overlay.current) (FX ? drawOverlayFx : drawOverlay)(S, v, overlay.current); }
      else (FX ? drawSplitFx : drawSplit)(S, v, canvases.current);
    };
    raf = requestAnimationFrame(frame);
    const onResize = () => { dirty.current = true; }; addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', onResize); };
  }, []);
  useEffect(() => { dirty.current = true; }, [view, layout, winS]);

  const switchFe = (id: string) => {
    if (id === fe.current) return;
    fetch(base.replace(/\/$/, '') + '/fe', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mode: id})})
      .catch(() => setNote('브리지 전송 실패'));
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
  const overload = (st.rtf ?? 0) > .9 || (st.qdrop ?? 0) > 0, jitter = (st.gap_ms ?? 0) > 200;
  if (!connected && !names.length) return conn === 'checking' ? <LiveOffline checking/> : <>{help}</>;
  const src = st.src === 'serial' ? <StateChip kind="live" tone="ok" label="보드 입력"/> : st.src === 'replay' ? <StateChip kind="stored" tone="stored" label="저장 신호 재생" note="--replay"/> : <StateChip kind="live" tone="idle" label="브리지 출력"/>;
  const fmt = (v: number | undefined, d = 0) => v == null || !Number.isFinite(v) ? '—' : v.toFixed(d);
  return <div className="live-native">
    <div className="live-status" role="status">
      <span className={'live-conn ' + conn}>{conn === 'on' ? <StateChip kind="linked" tone="ok" label="연결됨"/> : conn === 'retry' ? <StateChip kind="retry" tone="warn" label="연결 끊김" note="재연결 중"/>
        : conn === 'lost' ? <StateChip kind="cut" tone="err" label="보드 연결 끊김"/> : <StateChip kind="loading" tone="idle" label="확인 중"/>}</span>
      <span className="live-src">{src}</span>
      {overload && <StateChip kind="overload" tone="warn" label="실시간 처리 한계 초과" title="실시간 계수(RTF) 0.9 초과 또는 처리 누락 블록 발생"/>}
      {jitter && <StateChip kind="jitter" tone="warn" label="수신 간격 불규칙" title="최근 2 s 최대 수신 간격 200 ms 초과"/>}
      {note && <span className="live-note">{note}</span>}
    </div>
    <div className="live-stats">
      {[['처리 지연', fmt(st.lat_ms) + ' ms'], ['경과 시간', fmt(st.elapsed, 1) + ' s'], ['샘플 손실', fmt(st.lost) + ' 샘플', (st.lost ?? 0) > 0], ['전극 분리(lead-off)', fmt(st.leadoff) + ' 샘플', (st.leadoff ?? 0) > 0]].map(([k, v, bad]) =>
        <div key={k as string} className={bad ? 'bad' : ''}><small>{k}</small><b>{v as string}</b></div>)}
      <details className="live-diag"><summary>진단 정보</summary><div>
        {[['프레임 오류', fmt(st.bad) + ' B'], ['재동기화', fmt(st.resync)], ['처리 누락 블록', fmt(st.qdrop), (st.qdrop ?? 0) > 0],
          ['실시간 계수(RTF)', fmt(st.rtf, 2), (st.rtf ?? 0) > .9], ['최대 수신 간격(2 s)', fmt(st.gap_ms) + ' ms', (st.gap_ms ?? 0) > 200]].map(([k, v, bad]) =>
          <div key={k as string} className={bad ? 'bad' : ''}><small>{k}</small><b>{v as string}</b></div>)}
      </div></details>
    </div>
    <div className="live-tools" role="group" aria-label="실시간 표시 도구">
      <span className="seg-group"><small>표시 방식</small>
        {(['split', 'overlay'] as const).map(m => <button key={m} aria-pressed={view.mode === m} onClick={() => setView(o => ({...o, mode: m}))}>{m === 'split' ? '분리' : '중첩'}</button>)}</span>
      <span className="seg-group"><small>갱신 방식</small>
        {(['scroll', 'sweep'] as const).map(p => <button key={p} aria-pressed={view.play === p} onClick={() => setView(o => ({...o, play: p}))}>{p === 'scroll' ? '스크롤' : '스윕'}</button>)}</span>
      {Object.keys(fe.modes).length > 0 && <span className="seg-group"><small>공통 전처리</small>
        {Object.entries(fe.modes).map(([id, m]) => <button key={id} title={m.note} aria-pressed={id === fe.current} onClick={() => switchFe(id)}>{m.label}</button>)}</span>}
      <label>표시 구간<select value={winS} onChange={e => { const w = Number(e.target.value); S.setWindow(w); setWinS(w); }}>
        {WINDOWS.map(w => <option key={w} value={w}>{w} s</option>)}</select></label>
      <label>표시 범위 ±mV<input type="number" min={0} step={0.05} value={ampText} onChange={e => setAmp(e.target.value)} aria-label="표시 범위 ±mV (0: 자동)" title="0: 자동(표시 중인 모든 신호가 들어가도록 진폭 범위를 조정)"/><small>0: 자동</small></label>
      <details className="live-more"><summary>추가 표시 설정</summary>
        <label><input type="checkbox" checked={view.softEdge} onChange={e => setView(o => ({...o, softEdge: e.target.checked}))}/> 갱신 경계 완화</label>
        <label><input type="checkbox" checked={view.glowOn} onChange={e => setView(o => ({...o, glowOn: e.target.checked}))}/> 최신 구간 강조</label>
        <span className="seg-group"><small>소거 구간 비율</small>{AX.ERASE_CHOICES.map(f => <button key={f} aria-pressed={view.eraseFrac === f} onClick={() => setView(o => ({...o, eraseFrac: f}))}>{Math.round(f * 100)}%</button>)}</span>
      </details>
    </div>
    <div className="live-legend">{names.map(n => <button key={n} aria-pressed={!S.hidden.has(n)} onClick={() => toggle(n)} style={{color: n === 'raw' ? (view.mode === 'overlay' ? '#8fa3ad' : RAW_COLOR) : S.color(n)}}>
      <i/>{LABEL[n] ?? n}</button>)}</div>
    {!names.length && <p className="subtle">신호 수신 대기</p>}
    {view.mode === 'overlay'
      ? <div className="live-row"><div className="live-lab"><b>중첩 표시: 모든 기법에 동일 축 · 동일 이득(불투명도 85 %)</b><span>입력 신호(옅은 회색): 전극 직류 성분만 제거, 동일 이득</span></div>
          <canvas ref={el => { overlay.current = el; }} className="live-canvas tall" data-mode={view.play}/></div>
      : shown.map(n => <div key={n} className="live-row"><div className="live-lab"><b style={{color: S.color(n)}}>{n === 'raw' ? LABEL.raw : LABEL[n] ?? n}</b></div>
          <canvas ref={el => { if (el) canvases.current.set(n, el); else canvases.current.delete(n); }} className="live-canvas" data-series={n} data-mode={view.play}/></div>)}
  </div>;
}
