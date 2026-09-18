import test from 'node:test';
import assert from 'node:assert/strict';
import { createCourse, nextPlatform, platformY, gravityFactor, RULES, bounceVelocity, sweepPlatform, eligibleChunks, worldMechanics, MAX_TIER } from '../src/course.js';
import { CHUNKS } from '../src/chunks.js';
// elapsed: secondi di gioco simulati; una funzione dell'indice permette di far crescere il livello.
function generate(id, seed, height = 844, elapsed = 0, length = 240) {
  const course = createCourse({ id, platMaxW: 140 }, height, seed);
  let previous = { x: 50, y: height / 2, w: 130 };
  return Array.from({ length }, (_, i) => {
    course.elapsed = typeof elapsed === 'function' ? elapsed(i) : elapsed;
    return (previous = nextPlatform(course, previous));
  });
}
test('reproducible, varied and bounded courses across phone sizes', () => {
  for (const id of Object.keys(RULES)) for (const height of [568, 667, 844, 932]) {
    const platforms = generate(id, 42, height);
    assert.deepEqual(platforms, generate(id, 42, height));
    assert.notDeepEqual(platforms, generate(id, 43, height));
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      assert.ok(p.w >= 80);
      assert.ok(p.y >= 150 && p.y <= height - 150);
      assert.ok(p.collectibleMascot >= 0 && p.collectibleMascot < 14);
      if (i) {
        assert.ok(p.x > platforms[i - 1].x + platforms[i - 1].w);
        assert.ok(Math.abs(p.y - platforms[i - 1].y) <= 85.000001);
      }
      for (const t of [0, 1, 3, 10]) assert.ok(Math.abs(platformY(p, t) - p.y) <= p.amplitude + .001);
    }
    assert.ok(new Set(platforms.map(p => p.y)).size > 5);
  }
});
test('mechanics follow a safe introduction and every chunk opens with a recovery platform', () => {
  for (const id of Object.keys(RULES)) for (const tier of [0, 4]) {
    const platforms = generate(id, 9, 844, tier ? RULES[id].intro + (tier - 1) * RULES[id].tierSeconds : 0);
    assert.ok(platforms.slice(0, 4).every(p => p.type === 'normal'));
    const recoveries = platforms.filter(p => p.recovery);
    assert.ok(recoveries.length >= 240 / 8);
    assert.ok(recoveries.every(p => p.type === 'normal' && p.w >= 140 - (RULES[id].widthReduction || 0) - 10));
    const allowed = worldMechanics(RULES[id], tier);
    assert.ok(platforms.every(p => p.type === 'normal' || allowed.includes(p.type)));
    for (const m of allowed) assert.ok(platforms.some(p => p.type === m), `${id} tier ${tier} never uses ${m}`);
  }
});

test('chunks are valid and every world has enough of them at each tier', () => {
  const known = ['n', 'x', 'moving', 'sweep', 'soft', 'boost', 'crumble'];
  const options = ['item', 'wide', 'narrow', 'short', 'long'];
  assert.equal(new Set(CHUNKS.map(c => c.id)).size, CHUNKS.length);
  for (const c of CHUNKS) {
    assert.ok(c.tier >= 0 && c.tier <= MAX_TIER && c.steps.length >= 4, c.id);
    for (const [quota, type, opts = ''] of c.steps) {
      assert.ok(quota >= 0 && quota <= 1 && known.includes(type), c.id);
      assert.ok(opts.split(' ').filter(Boolean).every(o => options.includes(o)), c.id);
    }
  }
  for (const id of Object.keys(RULES)) for (let tier = 0; tier <= MAX_TIER; tier++) {
    assert.ok(eligibleChunks(RULES[id], tier).length >= 4, `${id} tier ${tier}`);
  }
});

test('long runs use many different chunks without immediate repeats', () => {
  for (const id of Object.keys(RULES)) {
    const platforms = generate(id, 5, 844, i => i / 3);
    const sequence = platforms.filter(p => p.recovery).map(p => p.chunk);
    assert.ok(new Set(sequence).size >= 12, `${id}: ${new Set(sequence).size}`);
    for (let i = 1; i < sequence.length; i++) assert.notEqual(sequence[i], sequence[i - 1]);
    assert.ok(platforms.at(-1).stage === MAX_TIER && platforms[0].stage === 0);
  }
});

test('pulsing gravity is bounded and exclusive to the black hole', () => {
  for (let t = 0; t < 100; t += .1) {
    assert.ok(gravityFactor('buconero', t) >= .85 && gravityFactor('buconero', t) <= 1.15);
    assert.equal(gravityFactor('nebulosa', t), 1);
  }
});

test('asteroids cycle through all four surfaces, other worlds only use their own mechanics', () => {
  for (const seed of [1, 42, 77]) {
    const platforms = generate('asteroidi', seed);
    for (let i = 8; i + 30 <= platforms.length; i += 10) {
      const types = platforms.slice(i, i + 30).map(p => p.type);
      for (const type of ['normal', 'moving', 'sweep', 'soft', 'boost']) assert.ok(types.includes(type), `seed ${seed} at ${i}: ${type}`);
    }
  }
  const late = i => 60;
  assert.ok(generate('nebulosa', 42, 844, late).every(p => p.type === 'normal'));
  assert.ok(generate('buconero', 42, 844, late).every(p => ['normal', 'moving', 'boost'].includes(p.type)));
  assert.ok(generate('supernova', 42, 844, late).every(p => ['normal', 'crumble', 'moving', 'boost'].includes(p.type)));
  assert.ok(generate('supernova', 42).every(p => ['normal', 'crumble'].includes(p.type)));
});

test('surface impulses work on both sides and sweeping removes only the tapped removable surface', () => {
  for (const down of [true, false]) {
    const normal = bounceVelocity(-9.5, 'normal', down);
    const soft = bounceVelocity(-9.5, 'soft', down);
    const boost = bounceVelocity(-9.5, 'boost', down);
    assert.ok(soft === 0);
    assert.equal(Math.sign(boost), Math.sign(normal));
    assert.ok(Math.abs(soft) < Math.abs(normal));
    assert.ok(Math.abs(boost) > Math.abs(normal) && Math.abs(boost) <= 18);
  }
  const platforms = [{id: 1, type: 'sweep'}, {id: 2, type: 'moving'}, {id: 3, type: 'sweep'}];
  assert.deepEqual(sweepPlatform(platforms, 1), platforms.slice(1));
  assert.deepEqual(sweepPlatform(platforms, 2), platforms);
  assert.equal(platforms.length, 3);
});

test('Nebulosa changes after ten seconds and later stages retain recovery platforms', () => {
  const build = elapsed => generate('nebulosa', 42, 844, elapsed, 36);
  const intro = build(9.9), later = build(46);
  assert.ok(intro.every(p => p.stage === 0));
  assert.ok(build(10).every(p => p.stage === 1));
  assert.ok(later.every(p => p.stage === 4));
  const averageWidth = ps => ps.reduce((sum, p) => sum + p.w, 0) / ps.length;
  assert.ok(averageWidth(later) < averageWidth(intro) - 25);
  for (let i = 1; i < later.length; i++) {
    assert.ok(later[i].w >= 80);
    assert.ok(Math.abs(later[i].y - later[i - 1].y) <= 105.00001);
    if (later[i].recovery) assert.ok(later[i].w > later[i - 1].w);
  }
});
