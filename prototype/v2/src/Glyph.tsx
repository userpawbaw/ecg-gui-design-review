import {useId} from 'react';

/**
 * 상태 그림 — 글로 늘어놓던 상태·출처 설명을 「그림 + 상태 명사구 + 짧은 설명」으로 줄인다(D-160).
 * 2차(사용자 2026-11-08 「이전 버전 아이콘이 더 직관적」): D-157 `LiveOffline`(파형 → 끊김 → 플러그 → 전선)과 비교해 규칙을 바꿨다.
 *  - 주어 + 상태: 모든 그림에 심전도 파형(청록, 신호)을 넣고, 상태는 실물 실루엣(플러그 · 보드 · 계기 · 그래프 축)과 상태색 한 점으로.
 *  - 좌 → 우 흐름: 가로 80 × 32(2.5 : 1). 신호가 어디까지 왔고 어디서 막혔는지가 왼쪽에서 오른쪽으로 읽힌다.
 *  - 양감은 신호에만: 몸체 그라데이션 판을 없애고 파형에만 실험실 파형과 같은 은은한 번짐(패널 크기에서만).
 *  - 획은 화면 픽셀 기준(non-scaling-stroke): 칩 1.6 px, 패널 2.4 px.
 */
export type GlyphKind = 'stored' | 'live' | 'linked' | 'retry' | 'unplugged' | 'cut' | 'overload' | 'jitter' | 'loading' | 'empty' | 'clip';
export type Tone = 'ok' | 'warn' | 'err' | 'idle' | 'stored';

/** 심전도 한 박: x에서 시작해 평탄 a, P–QRS–T, 평탄 b. 기준선 y. */
const beat = (x: number, y: number, a: number, b: number) =>
  `M${x} ${y}h${a}l1.6-2.2 1.6 2.2h2l1.8-4 2.2 9 2.4-14 2 9h2.6l2.2-3.4 2.2 3.4h${b}`;
const BEAT_W = 20.6;   // 평탄 a · b를 뺀 한 박의 폭
const plug = (x: number, y: number) => <>
  <path className="g-hw" d={`M${x} ${y - 5}h5a5 5 0 0 1 0 10h-5z`}/>
  <path className="g-hw" d={`M${x - 5} ${y - 2.5}h5M${x - 5} ${y + 2.5}h5`}/>
</>;

export function Glyph({kind, size = 18, glow = false}: {kind: GlyphKind, size?: number, glow?: boolean}) {
  const id = useId().replace(/:/g, '');
  return <svg className={'glyph glyph-k-' + kind} viewBox="0 0 80 32" height={size} width={size * 2.5} aria-hidden="true"
    fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    {glow && <defs><filter id={id} x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="1.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>}
    <g filter={glow ? `url(#${id})` : undefined} className="g-sig-layer">{SIG[kind]}</g>
    {SHAPE[kind]}
  </svg>;
}

// 신호층(청록 파형) — 그림마다 신호가 어디까지 왔는지
const SIG: Record<GlyphKind, React.ReactNode> = {
  stored: <path className="g-sig" d={beat(12.5, 18, 3, 3)}/>,
  live: <path className="g-sig" d={beat(17, 18, 2, 16)}/>,
  linked: <path className="g-sig" d={beat(2, 18, 3, 4)}/>,
  retry: <path className="g-sig" d={beat(2, 18, 3, 2)}/>,
  unplugged: <path className="g-sig" d={beat(2, 18, 3, 3)}/>,
  cut: <path className="g-sig" d={beat(2, 18, 3, 3)}/>,
  overload: <path className="g-sig" d={beat(2, 18, 3, 6)}/>,
  jitter: null,
  loading: <path className="g-sig" d={beat(6, 18, 3, 0)}/>,
  empty: null,
  clip: <path className="g-sig" d="M10 23h8l1.6-2.6 1.6 2.6h2l1.8-4 2-13h6l2 13 2.4-4 2 4h2.6l2.2-3 2.2 3H70"/>,
};

// 장비 · 상태층
const SHAPE: Record<GlyphKind, React.ReactNode> = {
  // 저장 신호 재생: 파형이 담긴 기록 카드 + 재생 표지
  stored: <>
    <rect className="g-hw" x="4" y="5" width="44" height="22" rx="4"/>
    <circle className="g-mark-fill" cx="64" cy="16" r="9" stroke="none"/>
    <path className="g-knock" d="M61 11.5v9l7.5-4.5z" stroke="none"/>
  </>,
  // 실시간 입력: 전극 패드 → 파형 → 맥동하는 최신 점
  live: <>
    <circle className="g-hw" cx="9" cy="18" r="6"/><circle className="g-mark-fill" cx="9" cy="18" r="2" stroke="none"/>
    <path className="g-hw" d="M15 18h2"/>
    <circle className="g-mark-fill g-pulse" cx={17 + 2 + BEAT_W + 16 + 3.5} cy="18" r="2.4" stroke="none"/>
  </>,
  // 연결됨: 파형 → 플러그가 소켓에 꽂힘 → 전선
  linked: <>
    <path className="g-hw" d="M30 18h4M34 13h6a5 5 0 0 1 0 10h-6zM45 15.5h5M45 20.5h5"/>
    <path className="g-hw" d="M49 11h5v14h-5"/>
    <path className="g-hw" d="M52 18h10a8 8 0 0 0 8-8V5"/>
    <circle className="g-mark-fill" cx="74" cy="25" r="2.6" stroke="none"/>
  </>,
  // 재연결 중: 파형과 플러그 사이 빈칸 위로 되돌아가는 화살표
  retry: <>
    <path className="g-mark" d="M31 18h7" strokeDasharray="1.5 3.2"/>
    {plug(46, 18)}
    <path className="g-hw" d="M56 18h6a8 8 0 0 0 8-8V5"/>
    <path className="g-mark g-spin" d="M30 9a7 5 0 0 1 12 0"/><path className="g-mark" d="M43.4 5.8 42 9.2l-3.6-.8"/>
  </>,
  // 브리지 연결 없음: D-157 그림 그대로의 구도 — 파형 → 끊긴 점선 → 플러그 → 위로 휘는 전선
  unplugged: <>
    <path className="g-mark" d="M32 18h6" strokeDasharray="1.5 3.4"/>
    {plug(46, 18)}
    <path className="g-hw" d="M56 18h7a7 7 0 0 0 7-7V5M70 5h6M70 5V2"/>
  </>,
  // 보드 연결 끊김: 파형 → 끊어진 전선(번개 모양 틈) → 보드
  cut: <>
    <path className="g-hw" d="M29 18h7"/>
    <path className="g-mark" d="M38 12.5l3 5-3 1.5 3 5"/>
    <path className="g-hw" d="M44 18h6"/>
    <rect className="g-hw" x="50" y="8" width="24" height="20" rx="2.5"/>
    <path className="g-hw" d="M55 8V4.5M61 8V4.5M67 8V4.5M56 14h12M56 19h8"/>
  </>,
  // 실시간 처리 한계 초과: 파형이 들어가는 계기, 바늘이 붉은 구간
  overload: <>
    <path className="g-hw" d="M42 26a14 14 0 0 1 28 0"/>
    <path className="g-mark" d="M65.6 15.6A14 14 0 0 1 70 26" strokeWidth="3.2" vectorEffect="none"/>
    <path className="g-hw" d="M56 26l7.5-8.5"/><circle className="g-hw-fill" cx="56" cy="26" r="2.2" stroke="none"/>
  </>,
  // 수신 간격 불규칙: 고르게 와야 할 표본이 뭉치고, 빈 구간이 생김
  jitter: <>
    <path className="g-hw" d="M4 26h72" opacity=".6"/>
    {[8, 14, 20, 23, 25, 27, 29, 56, 62, 68, 74].map((x, i) =>
      <circle key={i} className={x >= 20 && x <= 29 ? 'g-mark-fill' : 'g-sig-fill'} cx={x} cy={i % 2 ? 17 : 19} r="1.9" stroke="none"/>)}
    <path className="g-mark" d="M34 9h17M34 6.5v5M51 6.5v5"/>
  </>,
  // 파형 준비 중: 그려지는 파형, 나머지는 흐르는 점선
  loading: <>
    <circle className="g-mark-fill g-pulse" cx={6 + 3 + BEAT_W + 1.5} cy="18" r="2.4" stroke="none"/>
    <path className="g-hw g-flow" d="M37 18h37" strokeDasharray="1.5 4"/>
  </>,
  // 출력 없음: 그래프 축 안의 평탄한 점선
  empty: <>
    <path className="g-hw" d="M8 4v24h68"/>
    <path className="g-hw" d="M14 17h56" strokeDasharray="1.5 4" opacity=".7"/>
    <path className="g-mark" d="M64 6l6 6M70 6l-6 6"/>
  </>,
  // 표시 범위 초과: 그래프 축 위 경계선에서 봉우리가 잘림
  clip: <>
    <path className="g-hw" d="M6 4v24h70" opacity=".6"/>
    <path className="g-mark" d="M8 6h66" strokeDasharray="3 3"/>
  </>,
};

/** 상태 칩: 그림 + 상태 명사구(+ 짧은 설명). */
export function StateChip({kind, tone, label, note, title}: {kind: GlyphKind, tone: Tone, label: string, note?: string, title?: string}) {
  return <span className={'state-chip glyph-' + tone} title={title}><Glyph kind={kind} size={16}/><b>{label}</b>{note && <small>{note}</small>}</span>;
}

/** 큰 상태 표시: 빈 화면 · 연결 없음 · 준비 중 자리. */
export function StatePanel({kind, tone, label, note, children, className = ''}: {kind: GlyphKind, tone: Tone, label: string, note?: string, children?: React.ReactNode, className?: string}) {
  return <div className={'state-panel glyph-' + tone + ' ' + className} role="status"><Glyph kind={kind} size={84} glow/><b>{label}</b>{note && <small>{note}</small>}{children}</div>;
}
