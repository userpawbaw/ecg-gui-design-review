/* D-185 겹치기 범례 단추(실시간 · 실험실 공통, 2026-11-13 사용자): 마우스를 올리면 그 기법을 미리 강조, 누르면 강조 고정(여럿 가능 · 다시 누르면 해제).
 * 한 줄에 최대 3개 — 4개 이상이면 두 줄로 쌓는다(그래프를 가리지 않게 단추는 그래프 위 띠에 둔다).
 * D-186 안내(2026-11-13 사용자 권장안 승인): 중첩에 들어올 때(이 단추 띠가 처음 그려질 때) 그래프 위에 두 줄 안내가 약 3 s 나타났다 사라지고,
 * hint 가 있으면 단추 왼쪽에 짧은 상시 안내를 둔다(처음 쓰는 관람자가 3 s 안내를 놓쳐도 남도록). */
import React from 'react';
export type ChipItem = {id: string, label: string, color: string, note?: string};
export const OV_TIP = ['파형 위에 마우스를 놓으면 강조됩니다', '겹치는 파형을 클릭하면 강조 파형이 바뀝니다'];
export function OverlayChips({items, pinned, onToggle, onHover, hint}: {items: ChipItem[], pinned: string[], onToggle: (id: string) => void, onHover: (id: string | null) => void, hint?: string}) {
  if (!items.length) return null;
  return <div className="ov-head">{hint && <p className="ov-hint">{hint}</p>}
    <p className="ov-tip" role="status" aria-live="polite">{OV_TIP.map(t => <span key={t}>{t}</span>)}</p>
    <div className="ov-chips" role="group" aria-label="겹치기 강조(누르면 고정)" style={{['--cols' as string]: Math.min(3, items.length)} as React.CSSProperties}
    onMouseLeave={() => onHover(null)}>
    {items.map(it => { const on = pinned.includes(it.id);
      return <button key={it.id} type="button" className={'ov-chip' + (on ? ' on' : '')} aria-pressed={on} data-series={it.id} style={{['--c' as string]: it.color} as React.CSSProperties}
        title={on ? '강조 고정 해제' : '눌러서 강조 고정'} onMouseEnter={() => onHover(it.id)} onFocus={() => onHover(it.id)} onBlur={() => onHover(null)} onClick={() => onToggle(it.id)}>
        <i aria-hidden="true"/><span>{it.label}</span>{it.note && <small>{it.note}</small>}{on && <b aria-hidden="true">고정</b>}</button>; })}
  </div></div>;
}
