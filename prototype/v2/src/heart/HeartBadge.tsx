/* D-188 심박 카드: 작은 3D 심장 + 최근 bpm(박동마다 갱신). 숫자가 믿을 만하지 않으면 「--」와 이유. beat 가 바뀔 때마다 한 번 뛴다. */
import React, {useEffect, useRef} from 'react';
import {REASON_TEXT, type HrReason} from './heartRate';
export function HeartBadge({bpm, reason, beat, compact}: {bpm: number | null, reason: HrReason, beat: number, compact?: boolean}) {
  // 마운트마다 새 캔버스(개발 모드에서 효과가 두 번 돌 때 한 캔버스에 렌더러 둘이 붙어 먼저 것을 정리하면 나중 것도 지워졌다 — 실험실 화면에서 발견)
  const box = useRef<HTMLSpanElement>(null), h = useRef<{beat(): void, setDim(on: boolean): void, dispose(): void} | null>(null), off = useRef(bpm === null); off.current = bpm === null;
  useEffect(() => { let alive = true, mine: {dispose(): void} | null = null; const c = document.createElement('canvas'); c.className = 'hr-heart'; box.current?.appendChild(c);
    import('./heart3d').then(m => m.mountHeart(c)).then(x => { if (alive) { mine = x; h.current = x; x.setDim(off.current); } else x.dispose(); }).catch(() => {});
    return () => { alive = false; mine?.dispose(); if (h.current === mine) h.current = null; c.remove(); }; }, []);
  useEffect(() => { if (beat > 0 && bpm !== null) h.current?.beat(); }, [beat]);
  useEffect(() => { h.current?.setDim(bpm === null); }, [bpm === null]);
  const label = bpm === null ? (reason ? REASON_TEXT[reason] : '측정 중') : '최근 4박';
  return <div className={'hr-badge' + (compact ? ' compact' : '') + (bpm === null ? ' off' : '')} data-beat={beat} role="group" aria-label={bpm === null ? `심박수 표시 없음: ${label}` : `심박수 ${bpm} bpm`}>
    <span ref={box} className="hr-heart-box" aria-hidden="true"/>
    <div className="hr-text"><b aria-live="off">{bpm === null ? '--' : bpm}<small>bpm</small></b><span>{label}</span></div>
  </div>;
}
