import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_BRIDGE, normalizeBridge, liveFrameUrl, bridgeReachable} from '../src/live.ts';

test('브리지 주소를 host:port 로 정리하고 받을 수 없는 것은 null', () => {
  assert.equal(normalizeBridge('127.0.0.1:8765'), 'http://127.0.0.1:8765');
  assert.equal(normalizeBridge(' http://127.0.0.1:8765/live.html?x=1 '), 'http://127.0.0.1:8765');
  assert.equal(normalizeBridge('https://example.org'), 'https://example.org');
  assert.equal(normalizeBridge(''), null);
  assert.equal(normalizeBridge('javascript:alert(1)'), null);
  assert.equal(normalizeBridge('file:///etc/passwd'), null);
  assert.equal(normalizeBridge(DEFAULT_BRIDGE), DEFAULT_BRIDGE);
});

test('iframe 은 embed 모드의 live.html 을 연다', () => {
  assert.equal(liveFrameUrl('http://127.0.0.1:8765'), 'http://127.0.0.1:8765/live.html?embed=1');
});

test('닿지 않는 브리지는 false — 기다리다 멈추지 않는다', async () => {
  const t0 = Date.now();
  assert.equal(await bridgeReachable('http://127.0.0.1:9', 1500), false);
  assert.ok(Date.now() - t0 < 4000);
});
