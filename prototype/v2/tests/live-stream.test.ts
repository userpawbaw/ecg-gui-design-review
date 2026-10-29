import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LiveStream, SLOTS} from '../src/live/liveStream.ts';

const block = (i: number, n: number, out: string[] = ['M_FE', 'M04'], extra: object = {}) => ({
  i, n, fs: 250, raw: Array.from({length: n}, (_, k) => Math.sin((i + k) / 10)), ok: Array(n).fill(1),
  out: Object.fromEntries(out.map(o => [o, Array.from({length: n}, (_, k) => Math.cos((i + k) / 10))])),
  stat: {fe: 'zerophase', lat_ms: 548, lost: 0, leadoff: 0, bad: 0, resync: 0, qdrop: 0, rtf: 0.2, gap_ms: 40}, ...extra});

test('블록을 절대 인덱스의 나머지로 쓰고 head·통계를 갱신한다', () => {
  const s = new LiveStream(5);
  assert.ok(s.ingest(JSON.stringify(block(0, 12)), 0));
  assert.ok(s.ingest(JSON.stringify(block(12, 12)), 48));
  assert.equal(s.head, 23); assert.equal(s.first, 0); assert.equal(s.cap, 1250);
  assert.deepEqual(s.names(), ['raw', 'M_FE', 'M04']);
  assert.equal(s.stat.rtf, 0.2); assert.equal(s.feMode, 'zerophase');
  assert.ok(Math.abs(s.bufs.get('raw')![13] - Math.sin(13 / 10)) < 1e-6);
});

test('한 번 더 감싼 JSON 문자열도 푼다 — 낡은 브리지에 붙어도 죽지 않는다 (F-52)', () => {
  const s = new LiveStream();
  assert.ok(s.ingest(JSON.stringify(JSON.stringify(block(0, 6))), 0));
  assert.equal(s.head, 5);
  assert.equal(s.ingest('not json'), false);
  assert.equal(s.ingest(JSON.stringify({i: 3})), false, 'raw 가 없는 프레임은 무시');
  assert.equal(s.cap, 1250, 'fs 가 없는 프레임으로 cap 이 NaN 이 되지 않는다');
});

test('이어지지 않는 블록은 새 화면의 시작이다 — 옛 자리를 유효로 치지 않는다', () => {
  const s = new LiveStream();
  s.ingest(block(0, 100), 0); s.ingest(block(5000, 12), 40);
  assert.equal(s.first, 5000); assert.equal(s.head, 5011);
});

test('front-end 전환(reset)은 화면을 비우고 알림을 남기며, 색·끈 상태는 남긴다', () => {
  const s = new LiveStream();
  s.ingest(block(0, 12), 0); s.hidden.add('M04'); const c = s.color('M04');
  s.ingest({reset: true, fe: 'causal', fe_label: '인과 o1', fe_lat_ms: 0}, 50);
  assert.equal(s.head, -1); assert.equal(s.bufs.size, 0); assert.equal(s.feMode, 'causal');
  assert.match(s.notes.at(-1)!.text, /인과 o1 로 바꿨다/);
  assert.ok(s.hidden.has('M04')); assert.equal(s.color('M04'), c);
});

test('선 끊김은 이유와 함께 알림으로 남는다', () => {
  const s = new LiveStream(); s.ingest({link_lost: 'serial read failed'}, 0);
  assert.equal(s.notes[0].kind, 'link'); assert.match(s.notes[0].text, /serial read failed/);
});

test('색은 등장 순서로 고정되고, 다섯째부터는 겹치기에서 꺼 둔다', () => {
  const s = new LiveStream(); s.ingest(block(0, 6, ['A', 'B', 'C', 'D', 'E']), 0);
  assert.deepEqual(['A', 'B', 'C', 'D'].map(n => s.color(n)), SLOTS);
  assert.ok(s.hidden.has('E')); assert.ok(!s.hidden.has('D'));
});

test('표시 길이를 바꿔도 받은 최근 구간을 버리지 않는다', () => {
  const s = new LiveStream(5); for (let i = 0; i < 2000; i += 20) s.ingest(block(i, 20), i * 4);
  const v = s.bufs.get('raw')![1999 % 1250];
  s.setWindow(2.5); assert.equal(s.cap, 625); assert.equal(s.first, 2000 - 625);
  assert.ok(Math.abs(s.bufs.get('raw')![1999 % 625] - v) < 1e-6);
  s.setWindow(10); assert.equal(s.cap, 2500); assert.equal(s.first, 2000 - 625, '늘리면 가진 만큼만');
});

test('이득은 화면에 하나, 출력들은 중심을 같이 쓴다', () => {
  const s = new LiveStream(); for (let i = 0; i < 1000; i += 20) s.ingest(block(i, 20), i * 4);
  s.vh = s.head; const ax = s.axesFor(['raw', 'M_FE', 'M04'], 0, 4000);
  assert.equal(ax.get('M_FE')!.s, ax.get('raw')!.s); assert.equal(ax.get('M_FE')!.m, ax.get('M04')!.m);
  assert.equal(s.axesFor(['M_FE'], 0.5, 4000).get('M_FE')!.s, 0.5, '수동 범위 ±0.5 mV');
});
