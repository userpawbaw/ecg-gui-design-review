/* D-188 실험실 심박: 불러온 구간 전체를 인과 검출기로 한 번 돌려(입력 + 표시 기법 투표) 0.1 s마다의 표시 상태를 만들어 두고,
 * 재생 시각에 맞춰 보여 준다. 시각 t의 상태는 t 이전 표본만으로 정해진다(실시간과 같은 규칙). 심장은 인정된 박동의 R 시각에 뛴다
 * (스윕이 R을 그리는 순간 — 확정은 R 뒤 약 0.45 s 안이라 화면 지연 안에 든다). Reference 는 쓰지 않는다. */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createHeartRate, type HrReason} from './heartRate';
import {HeartBadge} from './HeartBadge';
import type {Transport} from '../engine';
type Traces = Record<string, Float32Array | undefined>;
export function LabHeart({traces, fs, offset, shown, transport, playing, time}: {traces: Traces, fs: number, offset: number, shown: string[], transport: Transport, playing: boolean, time: number}) {
  const tl = useMemo(() => {
    const names = ['input', ...shown.filter(id => traces[id] && id !== 'input')], L = traces.input?.length ?? 0, hr = createHeartRate(fs, names), step = Math.round(fs / 10);
    const states: {bpm: number | null, reason: HrReason}[] = [];
    for (let i = 0; i < L; i++) { const v: Record<string, number> = {}; for (const n of names) v[n] = traces[n]![i]; hr.push(i, v); if (i % step === 0) { const w = hr.view(); states.push({bpm: w.bpm, reason: w.reason}); } }
    return {states, beats: hr.view().beats.map(b => (b + offset) / fs), step};
  }, [traces, fs, offset, shown.join(',')]);
  const [st, setSt] = useState<{bpm: number | null, reason: HrReason}>({bpm: null, reason: 'learning'}), [beat, setBeat] = useState(0), last = useRef(-1);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const t = transport.time, k = Math.floor((t * fs - offset) / tl.step), s = tl.states[Math.max(0, Math.min(tl.states.length - 1, k))] ?? {bpm: null, reason: 'learning' as HrReason};
      setSt(o => o.bpm === s.bpm && o.reason === s.reason ? o : s);
      if (t < last.current - .05) last.current = t - .001;                       // 되감기 · 처음으로
      if (playing && tl.beats.some(b => b > last.current && b <= t)) setBeat(x => x + 1);
      last.current = t;
      if (playing) raf = requestAnimationFrame(tick);
    };
    last.current = transport.time; tick();
    return () => cancelAnimationFrame(raf);
  }, [tl, playing, transport, playing ? 0 : time]);   // 멈춰 있을 때는 탐색 · 처음으로에 따라
  return <HeartBadge bpm={st.bpm} reason={st.reason} beat={beat} compact/>;
}
