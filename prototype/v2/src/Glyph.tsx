import {useId} from 'react';

/**
 * 상태 그림 — 글로 늘어놓던 상태·출처 설명을 「그림 + 상태 명사구 + 짧은 설명」으로 줄인다(D-160).
 * 그리기 규칙(조사: Lucide 아이콘 설계 원칙, 듀오톤 아이콘 색 지침 — D-160 근거 표):
 *  - 32 격자, 획 1.75 · 둥근 끝 · 둥근 이음, 테두리 여백 2 이상, 요소 간격 2 이상.
 *  - 주층(획)만으로 뜻이 읽혀야 한다. 보조층은 같은 색의 방사 그라데이션(.34 → .06)으로 몸체에만 깔아
 *    빛이 왼쪽 위에서 오는 양감을 준다. 강조점 하나만 밝은 보색(--g-accent).
 *  - 색은 상태 계열 5종(ok · warn · err · idle · stored)을 CSS 토큰으로만 바꾼다(style.css `.glyph-*`).
 */
export type GlyphKind = 'stored' | 'live' | 'linked' | 'retry' | 'unplugged' | 'cut' | 'overload' | 'jitter' | 'loading' | 'empty' | 'clip';
export type Tone = 'ok' | 'warn' | 'err' | 'idle' | 'stored';

const TRACE = 'l1.4-3.6 1.8 7.2 1.8-9.2 1.4 5.6';

export function Glyph({kind, size = 28}: {kind: GlyphKind, size?: number}) {
  const id = useId().replace(/:/g, ''), body = `url(#${id}b)`;
  return <svg className={'glyph glyph-k-' + kind} viewBox="0 0 32 32" width={size} height={size} aria-hidden="true"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <radialGradient id={id + 'b'} cx="30%" cy="22%" r="85%">
        <stop offset="0" stopColor="currentColor" stopOpacity=".34"/><stop offset="1" stopColor="currentColor" stopOpacity=".06"/>
      </radialGradient>
    </defs>
    {SHAPES[kind](body)}
  </svg>;
}

const plug = (x: number, body: string) => <>
  <rect x={x} y="11" width="7" height="10" rx="2" fill={body}/>
  <path d={`M${x + 7} 13.5h3M${x + 7} 18.5h3`}/>
</>;
const socket = (x: number, body: string) => <rect x={x} y="11" width="7" height="10" rx="2" fill={body}/>;

const SHAPES: Record<GlyphKind, (body: string) => React.ReactNode> = {
  // 저장 신호 재생: 파형이 담긴 기록 카드 + 재생 표지
  stored: b => <>
    <rect x="3" y="6" width="22" height="18" rx="3.5" fill={b}/>
    <path d={'M6.5 17h3.2' + TRACE + 'h3.4'}/>
    <circle className="g-accent-fill" cx="24.5" cy="23.5" r="5.5" stroke="none"/>
    <path className="g-cut-out" d="M23 21v5l4-2.5z" stroke="none"/>
  </>,
  // 실시간 입력: 전극 패드에서 나온 파형, 끝점이 맥동
  live: b => <>
    <circle cx="8.5" cy="16" r="5.5" fill={b}/>
    <circle className="g-accent-fill" cx="8.5" cy="16" r="1.8" stroke="none"/>
    <path d={'M14 16h2.2' + TRACE + 'h2.6'}/>
    <circle className="g-accent-fill g-pulse" cx="28" cy="16" r="1.9" stroke="none"/>
  </>,
  // 연결됨: 플러그가 소켓에 꽂힘
  linked: b => <>
    <path d="M2.5 16h3.5M26 16h3.5"/>{plug(6, b)}{socket(17, b)}
    <circle className="g-accent-fill" cx="27" cy="7" r="2.2" stroke="none"/>
  </>,
  // 재연결 중: 떨어진 플러그 위로 되돌아가는 화살표
  retry: b => <>
    <path d="M2.5 18h2.5M27 18h2.5"/>
    <g transform="translate(0 2)">{plug(5, b)}{socket(20, b)}</g>
    <path className="g-spin" d="M10.5 9.5a7 5.5 0 0 1 11 0"/><path className="g-accent" d="M22.2 6.2l-.7 3.3-3.2-.8"/>
  </>,
  // 브리지 연결 없음: 떨어진 플러그와 소켓, 사이 간격 점선
  unplugged: b => <>
    <path d="M2.5 16h2.5M27 16h2.5"/>{plug(5, b)}{socket(20, b)}
    <path className="g-accent" d="M16 9.5v2M16 20.5v2" strokeDasharray="0.1 3.4"/>
  </>,
  // 보드 연결 끊김: 파형이 끊긴 자리
  cut: b => <>
    <rect x="2.5" y="8" width="27" height="16" rx="3.5" fill={b} stroke="none"/>
    <path d={'M4.5 17h3' + TRACE + 'h1'}/>
    <path className="g-accent" d="M19.5 12.5l2.5 3.5-2 1 2.5 3.5"/>
    <path d="M24.5 17h3" strokeDasharray="0.1 3" opacity=".6"/>
  </>,
  // 실시간 처리 한계 초과: 계기 바늘이 붉은 구간
  overload: b => <>
    <path d="M5 23a11 11 0 0 1 22 0z" fill={b} stroke="none"/>
    <path d="M5 23a11 11 0 0 1 22 0"/>
    <path className="g-accent" d="M23.8 15.2A11 11 0 0 1 27 23" strokeWidth="3"/>
    <path d="M16 23l6.5-7"/><circle cx="16" cy="23" r="2" fill="currentColor" stroke="none"/>
  </>,
  // 수신 간격 불규칙: 고르게 와야 할 표본 막대가 뭉치고 비는 모양
  jitter: b => <>
    <rect x="3" y="7" width="26" height="18" rx="3.5" fill={b} stroke="none"/>
    <path d="M5 21h22" opacity=".55"/>
    <path d="M7 21v-7M9.5 21v-9M12 21v-6M14 21v-8M25 21v-7"/>
    <path className="g-accent" d="M16.5 11h6M16.5 9.5v3M22.5 9.5v3"/>
  </>,
  // 파형 준비 중: 그려지는 선(점선 부분이 흐른다)
  loading: b => <>
    <rect x="2.5" y="7" width="27" height="18" rx="3.5" fill={b} stroke="none"/>
    <path d={'M5 17h3' + TRACE}/>
    <path className="g-flow" d="M17.5 17h9.5" strokeDasharray="1 3"/>
  </>,
  // 출력 없음: 빈 칸 안의 평탄한 점선
  empty: b => <>
    <rect x="3" y="7" width="26" height="18" rx="3.5" fill={b}/>
    <path d="M7 16h18" strokeDasharray="0.1 3.2" opacity=".7"/>
    <path className="g-accent" d="M21 10.5l4 4M25 10.5l-4 4"/>
  </>,
  // 표시 범위 초과: 봉우리가 위 경계선에서 잘림
  clip: () => <>
    <path className="g-accent" d="M3 8.5h26" strokeDasharray="2 2.6"/>
    <path d="M3.5 22h5l1.6-3.5 1.9 3.5 1.5-13.5h3l1.5 13.5 2-5 1.5 5h6.5"/>
  </>,
};

/** 상태 칩: 그림 + 상태 명사구(+ 짧은 설명). */
export function StateChip({kind, tone, label, note, title}: {kind: GlyphKind, tone: Tone, label: string, note?: string, title?: string}) {
  return <span className={'state-chip glyph-' + tone} title={title}><Glyph kind={kind} size={22}/><b>{label}</b>{note && <small>{note}</small>}</span>;
}

/** 큰 상태 표시: 빈 화면 · 연결 없음 · 준비 중 자리. */
export function StatePanel({kind, tone, label, note, children, className = ''}: {kind: GlyphKind, tone: Tone, label: string, note?: string, children?: React.ReactNode, className?: string}) {
  return <div className={'state-panel glyph-' + tone + ' ' + className} role="status"><Glyph kind={kind} size={64}/><b>{label}</b>{note && <small>{note}</small>}{children}</div>;
}
