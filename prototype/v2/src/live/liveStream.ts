/* 실시간 측정 B안 (D-157) — 브리지 스트림 모델. 원본 저장소 demo/live.html 의 «수신»과 버퍼 부분을 옮겼다.
 * 네트워크·React 와 떼어 두었다: `ingest(메시지)`가 링버퍼·상태를 바꾸고, 그리기(LivePlot)는 이 객체를 매 프레임 읽는다.
 * 프레임마다 바뀌는 값은 React 상태로 흐르지 않는다 — `onStatus` 로 낮은 빈도(연결·통계·전환 알림)만 올린다. */
import * as AX from './liveAxis';

/** 브리지가 보내는 한 블록 (scripts/serial_bridge.py `payload`). */
export type Block = {i: number, n: number, fs: number, raw: number[], ok: number[], out: Record<string, number[]>,
  stat: {fe?: string, lat_ms?: number, lost?: number, leadoff?: number, bad?: number, resync?: number, qdrop?: number,
    sse_drop?: number, rtf?: number, gap_ms?: number, src?: string}};
export type Stat = Block['stat'] & {elapsed?: number};
export type Note = {kind: 'reset' | 'link' | 'overflow', text: string, at: number};

/** 방법 이름표 — 원본 저장소 live.html LABEL을 정식 명칭으로(D-160). 전원선 처리는 브리지 `--pli`(고조파 추적 제거기 · 노치, 원본 D-52)를
 *  스트림이 알려 주지 않으므로 두 방식 모두에 맞는 「전원선 잡음 제거」로 쓴다(D-162). 모르는 이름은 이름 그대로 쓴다. */
export const LABEL: Record<string, string> = {
  raw: '입력 신호(공통 전처리 이전)', M_FE: '공통 전처리(0.5–100 Hz, 전원선 잡음 제거)', M01: '대역통과 필터 · 전원선 잡음 제거',
  M02: 'Savitzky–Golay 필터', M03: 'DWT 임계값 처리', M04: 'SWT 적응 임계값 처리(QRS 구간 임계값 완화)', M05: '확장 칼만 필터(블록 처리)',
  M05S: '확장 칼만 필터(스트리밍, 144 ms 고정 지연)', M06: '잔차 학습 U-Net', M06L6: '잔차 학습 U-Net(무잡음 입력 보존 손실)',
  M08: '웨이블릿 부대역 U-Net', M09: 'CNN · Transformer 결합 모델',
};
/** 겹치기 색 — v2.2.1 출력·고정 비교·미리보기 색 + 넷째(D-41). 넷까지만 색각 대비를 통과한다. 입력은 주황. */
export const SLOTS = ['#67e7c3', '#97c2ff', '#f6d18d', '#d7a6ff'], RAW_COLOR = '#f2a35e', OVER_MAX = SLOTS.length;

export class LiveStream {
  winS = 5; fs = 250; cap = 1250;
  head = -1; first = 0; vh = -1; lastData = -1e9;
  bufs = new Map<string, Float32Array>(); okBuf: Float32Array | null = null;
  colorOf = new Map<string, string>(); hidden = new Set<string>();
  stat: Stat = {}; notes: Note[] = []; feMode: string | null = null;
  gain = AX.makeGain(); ctr = AX.makeCenter(); reveal = AX.makeReveal();
  /** 구조가 바뀌었다(계열이 생김·전환) — 화면이 칸을 다시 짠다. */
  layoutVersion = 0;

  constructor(winS = 5) { this.winS = winS; this.cap = Math.round(winS * this.fs); }

  color(n: string) { return n === 'raw' ? RAW_COLOR : (this.colorOf.get(n) ?? SLOTS[0]); }
  names() { return [...this.bufs.keys()]; }

  /** 화면을 비운다. 색과 켜고 끈 상태는 남긴다(전환했다고 방법이 바뀌는 것이 아니다). */
  clear() { this.bufs.clear(); this.okBuf = null; this.head = -1; this.first = 0; this.vh = -1; this.gain.reset(); this.ctr.clear(); this.reveal.reset(); this.layoutVersion++; }

  private writeAt(a: Float32Array, abs0: number, arr: ArrayLike<number>) { for (let i = 0; i < arr.length; i++) a[(abs0 + i) % this.cap] = arr[i]; }

  /** SSE 한 줄의 data. 브리지가 한 번 더 감싼 문자열도 푼다(F-52: 낡은 브리지에 붙어도 죽지 않게). 바뀐 것이 있으면 true. */
  ingest(data: string | object, now = performance.now()): boolean {
    let m: any = data;
    if (typeof m === 'string') { try { m = JSON.parse(m); } catch { return false; } }
    if (typeof m === 'string') { try { m = JSON.parse(m); } catch { return false; } }
    if (!m || typeof m !== 'object') return false;
    if (m.link_lost) { this.notes.push({kind: 'link', text: '보드 연결 끊김: ' + m.link_lost, at: now}); return true; }
    if (m.reset) {                                   // front-end 전환: 옛 필터와 새 필터의 파형이 한 화면에 섞이지 않게 비운다
      this.clear(); this.feMode = m.fe ?? this.feMode;
      this.notes.push({kind: 'reset', text: `공통 전처리 변경: ${m.fe_label ?? m.fe}(지연 +${m.fe_lat_ms ?? '?'} ms) · 화면 갱신 중`, at: now});
      return true;
    }
    if (m.fs && m.fs !== this.fs) { this.fs = m.fs; this.cap = Math.round(this.winS * this.fs); this.clear(); }   // fs 없는 프레임으로 cap 을 NaN 으로 만들지 않는다
    if (!Number.isFinite(m.i) || !Array.isArray(m.raw)) return false;
    let fresh = false;
    if (!this.bufs.has('raw')) { this.bufs.set('raw', new Float32Array(this.cap)); this.okBuf = new Float32Array(this.cap); fresh = true; }
    if (this.head < 0 || m.i !== this.head + 1) this.first = m.i;   // 이어지지 않는 블록은 새 화면이다
    this.writeAt(this.bufs.get('raw')!, m.i, m.raw);
    if (Array.isArray(m.ok)) this.writeAt(this.okBuf!, m.i, m.ok);
    for (const name of Object.keys(m.out ?? {})) {
      if (!this.bufs.has(name)) {
        this.bufs.set(name, new Float32Array(this.cap));
        if (!this.colorOf.has(name)) { const k = this.colorOf.size; this.colorOf.set(name, SLOTS[k % SLOTS.length]); if (k >= OVER_MAX) this.hidden.add(name); }
        fresh = true;
      }
      this.writeAt(this.bufs.get(name)!, m.i, m.out[name]);
    }
    const n = Number.isFinite(m.n) ? m.n : m.raw.length;
    this.head = m.i + n - 1; this.lastData = now; this.reveal.push(this.head, now);
    if (m.stat && typeof m.stat === 'object') { this.stat = {...m.stat, elapsed: m.i / this.fs}; if (m.stat.fe) this.feMode = m.stat.fe; }
    if (fresh) this.layoutVersion++;
    return true;
  }

  /** 표시 길이를 바꾼다 — 받은 것을 버리지 않고 새 크기로 옮긴다(줄이면 최근 것만, 늘리면 가진 만큼). */
  setWindow(winS: number) {
    const nc = Math.round(winS * this.fs);
    if (!(nc > 0) || nc === this.cap) { this.winS = winS; return; }
    const lo = this.head < 0 ? 0 : Math.max(this.first, this.head - Math.min(this.cap, nc) + 1);
    const move = (a: Float32Array) => { const b = new Float32Array(nc); for (let t = lo; t <= this.head; t++) b[t % nc] = a[t % this.cap]; return b; };
    for (const [k, a] of this.bufs) this.bufs.set(k, move(a));
    if (this.okBuf) this.okBuf = move(this.okBuf);
    if (this.head >= 0) this.first = lo;
    this.winS = winS; this.cap = nc;
  }

  /** 그 절대 자리를 지금 그려도 되나 — 받았고(버퍼 안) 이미 드러났다(vh 이하). */
  seen(t: number) { return AX.have(t, this.first, this.head, this.cap) && t <= this.vh; }

  /** 보이는 구간의 계열 중심·피크. */
  look(name: string) {
    const a = this.bufs.get(name);
    if (!a || this.head < 0) return null;
    const lo = AX.windowStart(this.first, this.head, this.cap);
    return lo > this.head ? null : AX.scan(a, lo, this.head, this.cap);
  }

  /** 보이는 구간의 계열 아래 · 위 끝(D-178). */
  span(name: string) {
    const a = this.bufs.get(name);
    if (!a || this.head < 0) return null;
    const lo = AX.windowStart(this.first, this.head, this.cap);
    return lo > this.head ? null : AX.scanRange(a, lo, this.head, this.cap);
  }

  /** 화면 전체가 이득 하나, 중심은 입력·출력 둘(출력들은 같이 쓴다) — live.html axesFor 구조 그대로.
   *  D-178: 중심 = 보이는 구간의 위 끝과 아래 끝의 가운데(이전: 평균), 이득 = 그 범위의 절반(이전: 평균에서 가장 먼 쪽) — 위아래를 따로 맞춘다.
   *  출력들은 범위를 합쳐 중심 하나. amp > 0 이면 수동 ±amp(중심은 같은 방식). */
  axesFor(names: string[], amp: number, now = performance.now()) {
    const seen: string[] = []; let need = 0, rlo = 0, rhi = 0, olo = Infinity, ohi = -Infinity, hasRaw = false;
    for (const n of names) { const r = this.span(n); if (!r) continue; seen.push(n);
      if (n === 'raw') { rlo = r.lo; rhi = r.hi; hasRaw = true; need = Math.max(need, (r.hi - r.lo) / 2); } else { olo = Math.min(olo, r.lo); ohi = Math.max(ohi, r.hi); } }
    if (ohi >= olo) need = Math.max(need, (ohi - olo) / 2);
    const s = amp > 0 ? amp : this.gain.fit(need, now);
    const mo = this.ctr.at('out', ohi >= olo ? (olo + ohi) / 2 : 0, s, now), mr = hasRaw ? this.ctr.at('raw', (rlo + rhi) / 2, s, now) : 0;
    const out = new Map<string, {m: number, s: number}>();
    for (const n of seen) out.set(n, {m: n === 'raw' ? mr : mo, s});
    return out;
  }
}
