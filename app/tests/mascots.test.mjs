import test from 'node:test';
import assert from 'node:assert/strict';
import { MASCOT_INFO, RARITY, DEFAULT_TRAITS, mascotTraits, isMascotUnlocked, mascotWorlds, pickMascot, addToAlbum } from '../src/mascots.js';
import { seededRandom } from '../src/course.js';

test('14 mascots, one starter, known rarities and traits', () => {
  assert.equal(MASCOT_INFO.length, 14);
  assert.deepEqual(MASCOT_INFO.map((m, i) => m.starter ? i : -1).filter(i => i >= 0), [0]);
  for (let i = 0; i < MASCOT_INFO.length; i++) {
    const m = MASCOT_INFO[i];
    assert.ok(RARITY[m.rarity], m.name);
    assert.ok(Object.keys(m.traits).every(k => k in DEFAULT_TRAITS), m.name);
    assert.ok(mascotWorlds(i).length > 0, m.name);
  }
  assert.deepEqual(mascotTraits(0), DEFAULT_TRAITS);
});

test('rarity follows the worlds: no legendaries early, more rares later', () => {
  const sample = (world, n = 20000) => {
    const r = seededRandom(9);
    return Array.from({ length: n }, () => MASCOT_INFO[pickMascot(world, r)].rarity);
  };
  const share = (list, rarity) => list.filter(x => x === rarity).length / list.length;
  const neb = sample('nebulosa'), ast = sample('asteroidi'), nova = sample('supernova');
  assert.equal(share(neb, 'leggendaria'), 0);
  assert.equal(share(ast, 'leggendaria'), 0);
  assert.ok(share(nova, 'leggendaria') > .05);
  assert.ok(share(ast, 'rara') > share(neb, 'rara') * 2);
});

test('collecting enough copies unlocks a mascot, the album reports news once', () => {
  assert.ok(isMascotUnlocked(0, {}));
  assert.ok(!isMascotUnlocked(1, { 1: 4 }));
  assert.ok(isMascotUnlocked(1, { 1: 5 }));
  assert.ok(isMascotUnlocked(5, { 5: 1 }));
  const first = addToAlbum({ 1: 3 }, [1, 1, 4, 5]);
  assert.deepEqual(first.album, { 1: 5, 4: 1, 5: 1 });
  assert.deepEqual(first.firstTime.sort(), [4, 5]);
  assert.deepEqual(first.unlocked.sort(), [1, 5]);
  const again = addToAlbum(first.album, [1, 5]);
  assert.deepEqual([again.firstTime, again.unlocked], [[], []]);
});
