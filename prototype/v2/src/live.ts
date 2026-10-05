/* 실시간 측정 탭 (D-016) — 실측 화면은 원본 저장소의 브리지(`scripts/serial_bridge.py --serve`)가
 * 서빙하는 `live.html` 이다. 이 앱은 그것을 iframe 으로 **표시만** 한다. 성능 수치 · Reference 는 없다. */
export const DEFAULT_BRIDGE = 'http://127.0.0.1:8765';

/** 사용자가 적은 브리지 주소를 `http(s)://host[:port]` 로 정리한다. 받을 수 없으면 null.
 *  경로·쿼리는 버린다 — 실시간 화면의 경로는 이 앱이 정한다(`/live.html?embed=1`). */
export function normalizeBridge(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  let u: URL;
  try { u = new URL(/^[a-z]+:\/\//i.test(s) ? s : 'http://' + s); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  if (!u.hostname) return null;
  return `${u.protocol}//${u.host}`;
}

/** iframe 이 여는 주소. `embed=1` 이면 실시간 화면이 자기 머리글(브랜드)을 숨긴다 — 이 앱의 머리글과 겹치지 않게. */
export function liveFrameUrl(base: string): string {
  return `${base}/live.html?embed=1`;
}

/** 브리지가 떠 있는가. 교차 출처라 응답 내용은 못 읽으므로(`no-cors`) **닿는지만** 본다. */
export async function bridgeReachable(base: string, timeoutMs = 2500): Promise<boolean> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    await fetch(`${base}/fe`, { mode: 'no-cors', cache: 'no-store', signal: ctl.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}
