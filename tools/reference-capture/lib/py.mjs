// Run a Python helper (OpenCV) with the interpreter lookup the repo already uses (py -3 → python → python3) and UTF-8 forced (O-004).
import {spawnSync} from 'node:child_process';
import {pythonCandidates} from '../../../scripts/local/run.mjs';

export function runPython(script, args) {
  const env = {...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8'};
  for (const [bin, ...pre] of pythonCandidates()) {
    const v = spawnSync(bin, [...pre, '--version'], {encoding: 'utf8', env});
    if (v.error || v.status !== 0 || !/^Python 3\./.test((v.stdout || '').trim())) continue;
    const r = spawnSync(bin, [...pre, script, ...args], {encoding: 'utf8', env, maxBuffer: 1 << 26});
    if (r.status !== 0) throw new Error(`Python 도구 실패(${script}): ${(r.stderr || '').trim().split('\n').slice(-3).join(' | ')} — OpenCV가 없으면 npm run py:setup`);
    return r.stdout;
  }
  throw new Error('Python 3를 찾지 못함 — npm run doctor');
}
