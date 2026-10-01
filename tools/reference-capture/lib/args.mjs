// Command-line parsing for `npm run ref:capture -- <url|story> [options]` (pure, unit-tested).
import {SCRIPT_NAMES} from './script.mjs';

const MODES = ['all', 'frames', 'trace', 'fast'];
const num = (name, v) => {const n = Number(v);if (!Number.isFinite(n)) throw new Error(`--${name} 값이 숫자가 아님: ${v}`);return n;};
const progressArg = (name, v) => (/^-?\d*\.?\d+$/.test(v) ? num(name, v) : v);   // number = page progress, otherwise a CSS selector

export function parseArgs(argv) {
  const o = {target: null, mode: 'all', script: 'standard', from: undefined, to: undefined, track: [], out: null, har: false, browser: 'edge',
    maxFrames: 180, step: 1000 / 60, settleMs: 4000, determinism: true, base: 'http://127.0.0.1:5173', ready: null, probe: null, hover: undefined, hoverCount: 4, stops: undefined, stopPx: undefined, keepFrames: false, width: 1920, height: 1080, wheelSettleMs: 40};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {rest.push(a);continue;}
    const [k, inline] = a.slice(2).split(/=(.*)/s), take = () => {if (inline !== undefined) return inline;if (i + 1 >= argv.length) throw new Error(`--${k} 값이 없음`);return argv[++i];};
    switch (k) {
      case 'mode': o.mode = take();if (!MODES.includes(o.mode)) throw new Error(`--mode 는 ${MODES.join(' | ')}`);break;
      case 'script': o.script = take();if (!SCRIPT_NAMES.includes(o.script)) throw new Error(`--script 는 ${SCRIPT_NAMES.join(' | ')}`);break;
      case 'from': o.from = progressArg(k, take());break;
      case 'to': o.to = progressArg(k, take());break;
      case 'track': o.track = take().split(',').map((s) => s.trim()).filter(Boolean);break;
      case 'out': o.out = take();break;
      case 'har': o.har = true;break;
      case 'browser': o.browser = take();if (!['edge', 'chromium'].includes(o.browser)) throw new Error('--browser 는 edge | chromium');break;
      case 'max-frames': o.maxFrames = num(k, take());break;
      case 'step': o.step = num(k, take());break;
      case 'settle': o.settleMs = num(k, take());break;
      case 'no-determinism': o.determinism = false;break;
      case 'ready': o.ready = take();break;
      case 'hover': o.hover = take();break;
      case 'hover-count': o.hoverCount = num(k, take());break;
      case 'stops': o.stops = num(k, take());break;
      case 'stop-px': o.stopPx = num(k, take());break;
      case 'keep-frames': o.keepFrames = true;break;
      case 'probe': o.probe = take();break;
      case 'base': o.base = take();break;
      case 'width': o.width = num(k, take());break;
      case 'height': o.height = num(k, take());break;
      default: throw new Error(`알 수 없는 옵션: --${k}`);
    }
  }
  if (rest.length !== 1) throw new Error('사용법: npm run ref:capture -- <url|story> [--mode frames|trace] [--script standard|transition --from 0.18 --to 0.30] [--track "css,css"] [--out 폴더] [--har] [--ready "JS 식"] [--script hover --hover auto|"sel,sel" --hover-count 4]');
  o.target = rest[0];
  if (o.script === 'survey' && o.mode !== 'fast') throw new Error('--script survey 는 --mode fast 와 함께 사용(정지 화면 + 실시간 녹화)');
  if (o.script === 'transition' && (o.from === undefined || o.to === undefined)) throw new Error('--script transition 에는 --from 과 --to 가 필요함 (진행률 0–1 또는 CSS 선택자)');
  if (o.target === 'story') {o.isStory = true;o.url = o.base + '/';o.ready ??= 'window.__intro';}
  else {
    try {o.url = new URL(/^(https?|file):/i.test(o.target) ? o.target : 'https://' + o.target).href;} catch {throw new Error(`주소를 해석할 수 없음: ${o.target}`);}
    o.isStory = false;
  }
  return o;
}

/** Output folder name: <host>-<YYYYMMDD-HHMM> (story → "story"). */
export function outName(o, d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  return `${o.isStory ? 'story' : (new URL(o.url).host || 'file').replace(/[^a-z0-9.-]/gi, '_')}-${stamp}`;
}
