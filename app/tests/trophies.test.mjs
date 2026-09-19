import test from 'node:test';
import assert from 'node:assert/strict';
import { TROPHIES, MEDALS, TRAILS, MAX_STARS, emptyLife, updateLife, evaluateTrophies, totalStars, trailUnlocked } from '../src/trophies.js';

const baseRun = { world: 'nebulosa', seconds: 20, bestCombo: 3, collected: 2, rings: 1, ringChain: 1, rocks: 0, pulsars: 0, eruptionsDodged: 0, nearMisses: 0, challengesWon: 0, events: 0, tier: 1 };

test('trophies are unique, have a medal and a working check', () => {
  assert.equal(new Set(TROPHIES.map(t => t.id)).size, TROPHIES.length);
  for (const t of TROPHIES) {
    assert.ok(MEDALS[t.medal], t.id);
    assert.ok(t.title && t.description, t.id);
    assert.equal(typeof t.check({ run: {}, life: emptyLife(), album: {}, worldScores: {}, unlocked: [] }), 'boolean', t.id);
  }
  assert.equal(MAX_STARS, TROPHIES.reduce((s, t) => s + MEDALS[t.medal].stars, 0));
});

test('life stats add up game after game', () => {
  let life = emptyLife();
  life = updateLife(life, baseRun);
  life = updateLife(life, { ...baseRun, seconds: 40.6, rings: 4 });
  assert.equal(life.games, 2);
  assert.equal(life.seconds, 61);
  assert.equal(life.rings, 5);
  assert.equal(life.collected, 4);
});

test('the first game wins the first trophy, and a trophy is never won twice', () => {
  const life = updateLife(emptyLife(), baseRun);
  const first = evaluateTrophies({ run: baseRun, life, album: {}, worldScores: { nebulosa: 150 }, unlocked: ['nebulosa'] });
  assert.deepEqual(first, ['primo-volo']);
  const again = evaluateTrophies({ run: baseRun, life, album: {}, worldScores: {}, unlocked: [] }, { 'primo-volo': '2026-09-19' });
  assert.deepEqual(again, []);
});

test('run records, world scores and album unlock the matching trophies', () => {
  const run = { ...baseRun, world: 'supernova', seconds: 130, bestCombo: 64, tier: 4, ringChain: 5, eruptionsDodged: 5, events: 6 };
  const album = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [i, 1]));
  const won = evaluateTrophies({ run, life: updateLife(emptyLife(), run), album, worldScores: { nebulosa: 1000, asteroidi: 1000, buconero: 1000, supernova: 1500 }, unlocked: ['nebulosa', 'asteroidi', 'buconero', 'supernova'] });
  for (const id of ['un-minuto', 'maratona', 'fino-in-fondo', 'combo-10', 'combo-30', 'combo-60', 'esploratore', 'maestro-supernova', 'collana', 'pelle-di-drago', 'imperturbabile', 'collezionista', 'leggenda', 'album-completo']) {
    assert.ok(won.includes(id), id);
  }
  assert.ok(!won.includes('veterano'));
});

test('stars unlock trails in order', () => {
  assert.equal(totalStars({}), 0);
  assert.equal(totalStars({ 'primo-volo': 'x', 'combo-60': 'x' }), 4);
  assert.ok(trailUnlocked('eco', 0));
  assert.ok(!trailUnlocked('arcobaleno', 4));
  assert.ok(trailUnlocked('arcobaleno', 5));
  assert.ok(!trailUnlocked('inesistente', 99));
  const costs = TRAILS.map(t => t.stars);
  assert.deepEqual(costs, [...costs].sort((a, b) => a - b));
  assert.ok(costs.at(-1) <= MAX_STARS);
});
