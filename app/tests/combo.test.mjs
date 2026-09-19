import test from 'node:test';
import assert from 'node:assert/strict';
import { createCombo, landCombo, passCombo, comboMultiplier, comboProgress, COMBO_STEPS } from '../src/combo.js';
import { meteorNearMiss, meteorHitsPlayer, METEOR_WARNING } from '../src/meteors.js';

test('multiplier grows with consecutive landings and is capped', () => {
  assert.equal(comboMultiplier(0), 1);
  assert.equal(comboMultiplier(3), 1);
  assert.equal(comboMultiplier(4), 2);
  assert.equal(comboMultiplier(10), 3);
  assert.equal(comboMultiplier(1000), COMBO_STEPS.length);
  assert.equal(comboProgress(0), 0);
  assert.equal(comboProgress(2), .5);
  assert.equal(comboProgress(1000), 1);
});

test('only the first contact with a platform counts', () => {
  const c = createCombo();
  const p = { id: 1, type: 'soft' };
  for (let i = 0; i < 30; i++) landCombo(c, p);
  assert.equal(c.count, 1);
  const ups = [2, 3, 4, 5].map(id => landCombo(c, { id, type: 'normal' }));
  assert.deepEqual(ups, [null, null, 'up', null]);
  assert.equal(c.multiplier, 2);
});

test('skipping a platform breaks the combo, touched or already passed ones do not', () => {
  const c = createCombo();
  const plats = Array.from({ length: 6 }, (_, id) => ({ id, type: 'normal' }));
  plats.slice(0, 5).forEach(p => landCombo(c, p));
  plats.slice(0, 5).forEach(p => assert.equal(passCombo(c, p), null));
  assert.equal(c.multiplier, 2);
  assert.equal(passCombo(c, plats[5]), 'broken');
  assert.equal(passCombo(c, plats[5]), null);
  assert.deepEqual([c.count, c.multiplier, c.best], [0, 1, 5]);
});

test('landing on the edge resets the combo', () => {
  const c = createCombo();
  for (let id = 0; id < 5; id++) landCombo(c, { id });
  assert.equal(landCombo(c, { id: 9 }, false), 'edge');
  assert.deepEqual([c.count, c.multiplier, c.best], [0, 1, 5]);
  assert.equal(landCombo(c, { id: 10 }, false), null);
});

test('mascot abilities: starting combo and one forgiven break', () => {
  const c = createCombo(4, 1);
  assert.deepEqual([c.count, c.multiplier], [4, 2]);
  assert.equal(passCombo(c, { id: 1 }), 'forgiven');
  assert.equal(c.count, 4);
  assert.equal(landCombo(c, { id: 2 }, false), 'edge');
  assert.deepEqual([c.count, c.multiplier, c.resets], [0, 1, 1]);
});

test('a spring forgives exactly one skipped platform', () => {
  const c = createCombo();
  landCombo(c, { id: 1, type: 'boost' });
  assert.equal(passCombo(c, { id: 2 }), null);
  assert.equal(c.count, 1);
  passCombo(c, { id: 3 });
  assert.equal(c.count, 0);
});

test('near misses need an active meteor close to the player but outside the hitbox', () => {
  const m = { born: 0, startX: 200, startY: 400, vx: 0, vy: 0, radius: 18 };
  const t = METEOR_WARNING + .1;
  assert.equal(meteorNearMiss(m, 0, 150, 400 - 32, 64), false);
  assert.equal(meteorNearMiss(m, t, 200 - 32, 400 - 32 - 70, 64), true);
  assert.equal(meteorHitsPlayer(m, t, t, 200 - 32, 400 - 32 - 70, 400 - 32 - 70, 64), false);
  assert.equal(meteorNearMiss(m, t, 200 - 32, 400 - 32 - 120, 64), false);
});
