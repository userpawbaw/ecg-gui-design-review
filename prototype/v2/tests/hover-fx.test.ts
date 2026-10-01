// D-048 hover feedback helper (pure part; the CSS/DOM behaviour is verified in the browser with the capture tool).
import test from 'node:test';
import assert from 'node:assert/strict';
import {onControl} from '../src/story/hoverFx';

test('onControl: only elements inside a .hv control count (events from text, canvas or null do not)', () => {
  const el = (inside: boolean) => ({closest: (sel: string) => (sel === '.hv' && inside ? {} : null)});
  assert.equal(onControl(el(true) as never), true);
  assert.equal(onControl(el(false) as never), false);
  assert.equal(onControl(null), false);
});
