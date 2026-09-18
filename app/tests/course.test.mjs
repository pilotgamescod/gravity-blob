import test from 'node:test';
import assert from 'node:assert/strict';
import { createCourse, nextPlatform, platformY, gravityFactor, RULES, bounceVelocity, sweepPlatform } from '../src/course.js';
function generate(id, seed, height = 844) {
  const course = createCourse({ id, platMaxW: 140 }, height, seed);
  let previous = { x: 50, y: height / 2, w: 130 };
  return Array.from({ length: 240 }, () => (previous = nextPlatform(course, previous)));
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
test('mechanics follow a safe introduction with recurring recovery platforms', () => {
  for (const id of Object.keys(RULES)) {
    const platforms = generate(id, 9);
    assert.ok(platforms.slice(0, 4).every(p => p.type === 'normal'));
    assert.ok(platforms.filter((_, i) => i % 6 === 0).every(p => p.type === 'normal'));
    assert.ok(platforms.some(p => p.type === RULES[id].mechanic));
  }
});
test('pulsing gravity is bounded and exclusive to the black hole', () => {
  for (let t = 0; t < 100; t += .1) {
    assert.ok(gravityFactor('buconero', t) >= .85 && gravityFactor('buconero', t) <= 1.15);
    assert.equal(gravityFactor('nebulosa', t), 1);
  }
});

test('asteroid sections mix moving, removable, soft and boosted surfaces', () => {
  const platforms = generate('asteroidi', 42);
  for (let i = 6; i < platforms.length; i += 6) {
    const types = platforms.slice(i, i + 6).map(p => p.type);
    for (const type of ['normal', 'moving', 'sweep', 'soft', 'boost']) assert.ok(types.includes(type));
  }
  for (const id of ['nebulosa', 'buconero', 'supernova']) {
    assert.ok(generate(id, 42).every(p => !['sweep','soft','boost'].includes(p.type)));
  }
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
  const build = elapsed => {
    const course = createCourse({ id:'nebulosa', platMaxW:160 }, 844, 42);
    course.elapsed=elapsed;
    let previous={x:0,y:420,w:130};
    return Array.from({length:36},()=>previous=nextPlatform(course,previous));
  };
  const intro=build(9.9), later=build(46);
  assert.ok(intro.every(p=>p.stage===0));
  assert.ok(build(10).every(p=>p.stage===1));
  assert.ok(later.every(p=>p.stage===4));
  const averageWidth = ps => ps.reduce((sum,p)=>sum+p.w,0)/ps.length;
  assert.ok(averageWidth(later)<averageWidth(intro)-25);
  for(let i=1;i<later.length;i++) {
    assert.ok(later[i].w>=80);
    assert.ok(Math.abs(later[i].y-later[i-1].y)<=105.00001);
    if(i%6===0) assert.ok(later[i].w>later[i-1].w);
  }
});
