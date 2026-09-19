import test from 'node:test';
import assert from 'node:assert/strict';
import { createCourse, nextPlatform, platformY, platformSolid, pulsarPhase, isFalling, PULSAR_SOLID, FALL_DELAY, RULES } from '../src/course.js';
import { createEruption, eruptionPosition, eruptionHitsPlayer, eruptionGone, eruptionGap, ERUPTION_WARNING } from '../src/eruptions.js';

function run(id, seed, elapsed = 60, length = 300, height = 844) {
  const course = createCourse({ id, platMaxW: 140 }, height, seed);
  course.elapsed = elapsed;
  let previous = { x: 0, y: height / 2, w: 130 };
  return Array.from({ length }, () => previous = nextPlatform(course, previous));
}

test('each world has its own new element', () => {
  const late = id => run(id, 3);
  assert.ok(late('asteroidi').some(p => p.type === 'falling'));
  assert.ok(late('buconero').some(p => p.type === 'pulsar'));
  for (const id of ['nebulosa', 'supernova']) assert.ok(!late(id).some(p => ['falling', 'pulsar'].includes(p.type)));
  const rings = id => late(id).filter(p => p.ring).length;
  assert.ok(rings('nebulosa') > rings('asteroidi') * 1.8);
  assert.equal(run('asteroidi', 3, 0).filter(p => p.type === 'falling').length, 0);
});

test('rings sit inside the gap and on screen', () => {
  for (const height of [667, 844]) {
    const plats = run('nebulosa', 11, 30, 300, height);
    for (let i = 1; i < plats.length; i++) {
      const r = plats[i].ring;
      if (!r) continue;
      const x = plats[i].x + r.dx;
      assert.ok(x > plats[i - 1].x + plats[i - 1].w && x < plats[i].x);
      assert.ok(r.y >= 90 && r.y <= height - 90);
    }
  }
});

test('pulsars alternate and are lit most of the time', () => {
  const pulsars = run('buconero', 5).filter(p => p.type === 'pulsar');
  assert.ok(pulsars.length > 5);
  assert.ok(pulsars.every(p => Math.abs(p.pulsePeriod - 120 / 78) < 1e-9));
  assert.ok(new Set(pulsars.map(p => p.pulseOffset)).size === 2);
  const p = pulsars[0];
  let lit = 0, samples = 0;
  for (let t = 0; t < 20; t += .01) { samples++; if (platformSolid(p, t)) lit++; }
  assert.ok(Math.abs(lit / samples - PULSAR_SOLID) < .02);
  assert.ok(pulsarPhase(p, 3) >= 0 && pulsarPhase(p, 3) < 1);
});

test('falling rocks shake, then drop and stop catching from below', () => {
  const rock = { type: 'falling', baseY: 400, y: 400, amplitude: 0, phase: 0, fallAt: 10 };
  assert.ok(Math.abs(platformY(rock, 10 + FALL_DELAY / 2) - 400) <= 2);
  assert.ok(!isFalling(rock, 10 + FALL_DELAY / 2));
  assert.ok(platformY(rock, 10 + FALL_DELAY + .5) > 500);
  assert.ok(platformSolid(rock, 11, false));
  assert.ok(!platformSolid(rock, 11, true));
  const idle = { ...rock, fallAt: null };
  assert.equal(platformY(idle, 50), 400);
});

test('eruptions warn, fly vertically with the world and leave the screen', () => {
  const e = createEruption(1, 20, 86, 844, 250, () => .2);
  assert.equal(e.fromTop, true);
  const warn = eruptionPosition(e, 20.5);
  assert.equal(warn.active, false);
  assert.ok(!eruptionHitsPlayer(e, 20.5, 86, e.startY, 64));
  const fly = eruptionPosition(e, 20 + ERUPTION_WARNING + .5);
  assert.ok(fly.active && fly.y > 0 && fly.x < e.x);
  assert.ok(eruptionGone(e, 20 + ERUPTION_WARNING + 3, 844));
  const up = createEruption(2, 0, 86, 844, 250, () => .9);
  assert.ok(!up.fromTop && up.vy < 0);
  assert.ok(eruptionGap(0, () => 0) > eruptionGap(4, () => 0));
  assert.ok(eruptionGap(4, () => 0) >= 2.4);
});
