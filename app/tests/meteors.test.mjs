import test from 'node:test';
import assert from 'node:assert/strict';
import { createMeteor, meteorPosition, meteorHitsPlayer, METEOR_WARNING } from '../src/meteors.js';
test('meteors warn before moving and keep a fixed trajectory', () => {
  const m = createMeteor(1, 6, 390, 844, 400, () => .5);
  assert.equal(meteorPosition(m, 6).active, false);
  assert.equal(meteorPosition(m, 7).x, 440);
  assert.equal(meteorPosition(m, 6 + METEOR_WARNING).active, true);
  assert.ok(meteorPosition(m, 9).x < meteorPosition(m, 8).x);
  assert.equal(meteorPosition(m, 9).y, 400);
});
test('warnings are harmless; swept collisions catch fast hits and ignore near misses', () => {
  const m = { born: 0, startX: 300, startY: 132, vx: -300, vy: 0, radius: 16 };
  assert.equal(meteorHitsPlayer(m, 0, 1, 268, 100, 100, 64), false);
  assert.equal(meteorHitsPlayer(m, 1.25, 2.25, 100, 100, 100, 64), true);
  assert.equal(meteorHitsPlayer(m, 1.25, 2.25, 100, 200, 200, 64), false);
});
test('spawn lanes stay away from the HUD on small and large phones', () => {
  for (const height of [568, 844, 932]) for (const y of [-50, 300, 1000]) {
    const m = createMeteor(1, 0, 390, height, y, () => .5);
    assert.ok(m.startY >= 160 && m.startY <= height - 160);
  }
});
