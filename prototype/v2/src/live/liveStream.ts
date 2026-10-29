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

/** 방법 이름표 — 원본 저장소 live.html LABEL 그대로. 모르는 이름은 이름 그대로 쓴다. */
export const LABEL: Record<string, string> = {
  raw: '입력 — 전극에서 온 그대로 (front-end 이전)', M_FE: '공통 front-end (0.5–100 Hz + auto notch)', M01: '대역통과 + notch',
  M02: 'Savitzky–Golay', M03: 'DWT', M04: 'SWT + QRS 보호', M05: 'Sameni EKS (창 · hop 128)',
  M05S: 'Sameni EKF · 스트리밍 (미래 144 ms + 고정 지연 평활)', M06: 'ResUNet1D (딥러닝)', M06L6: 'ResUNet1D · clean 보존 손실',
  M08: 'wavelet-subband U-Net', M09: 'CNN + Transformer',
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
    if (m.link_lost) { this.notes.push({kind: 'link', text: '보드와의 선이 끊겼다 — ' + m.link_lost, at: now}); return true; }
    if (m.reset) {                                   // front-end 전환: 옛 필터와 새 필터의 파형이 한 화면에 섞이지 않게 비운다
      this.clear(); this.feMode = m.fe ?? this.feMode;
      this.notes.push({kind: 'reset', text: `${m.fe_label ?? m.fe} 로 바꿨다 (+${m.fe_lat_ms ?? '?'} ms) — 화면을 다시 채우는 중`, at: now});
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

  /** 화면 전체가 이득 하나, 중심은 입력·출력 둘(출력들은 같이 쓴다) — live.html axesFor 그대로. amp > 0 이면 수동 ±amp. */
  axesFor(names: string[], amp: number, now = performance.now()) {
    const seen = new Map<string, {m: number}>(); let need = 0, om = 0, oc = 0;
    for (const n of names) { const r = this.look(n); if (!r) continue; seen.set(n, r); need = Math.max(need, r.peak); if (n !== 'raw') { om += r.m; oc++; } }
    const s = amp > 0 ? amp : this.gain.fit(need, now);
    const mo = this.ctr.at('out', oc ? om / oc : 0, s, now);
    const out = new Map<string, {m: number, s: number}>();
    for (const [n, r] of seen) out.set(n, {m: n === 'raw' ? this.ctr.at('raw', r.m, s, now) : mo, s});
    return out;
  }
}
