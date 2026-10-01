// Starts the R1 Story dev server (same one as `npm run story`) when nothing answers on the base URL, and stops it afterwards.
import {spawn, spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {root} from './lib/browser.mjs';

const win = process.platform === 'win32';
const up = async (url) => {try {const r = await fetch(url, {signal: AbortSignal.timeout(1500)});return r.ok;} catch {return false;}};

export async function ensureDevServer(base) {
  if (await up(base)) return {reused: true, stop() {}};
  const u = new URL(base);
  console.log(`  개발 서버 시작: ${base} (끝나면 자동 종료)`);
  const child = spawn(`npm run dev -- --host ${u.hostname} --port ${u.port || '5173'} --strictPort`, {cwd: join(root, 'prototype/v2'), shell: true, stdio: 'ignore', windowsHide: true});   // one command string: no args array with shell (DEP0190)
  const stop = () => {try {win ? spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {stdio: 'ignore'}) : child.kill('SIGTERM');} catch {}};
  for (let i = 0; i < 120; i++) {if (await up(base)) return {reused: false, stop};await new Promise((r) => setTimeout(r, 750));}
  stop();
  throw new Error(`개발 서버가 90 s 안에 응답하지 않음: ${base} — 먼저 npm run story 로 확인`);
}
