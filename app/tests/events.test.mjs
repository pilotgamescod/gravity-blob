import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS, WORLD_EVENTS, createDirector, updateDirector, endEvent, eventProgress, FIRST_EVENT, EVENT_WARNING, EVENT_GAP } from '../src/events.js';
import { createCourse, nextPlatform, seededRandom, MAX_TIER } from '../src/course.js';
import { CHUNKS } from '../src/chunks.js';

function runDirector(worldId, seconds, seed = 1) {
  const d = createDirector(worldId, seededRandom(seed));
  const log = [];
  for (let t = 0; t <= seconds; t += 1 / 60) {
    const step = updateDirector(d, t);
    if (step) log.push({ step, t, type: d.active?.type ?? d.pending ?? log.at(-1)?.type });
    // La sfida finisce quando il giocatore supera il tratto: simuliamo 8 secondi.
    if (d.active?.type === 'sfida' && t - d.active.startedAt > 8) { endEvent(d, t); log.push({ step: 'end', t, type: 'sfida' }); }
  }
  return log;
}

test('events are announced, start on time and are spaced out', () => {
  const log = runDirector('supernova', 300);
  assert.equal(log[0].step, 'warning');
  assert.ok(Math.abs(log[0].t - (FIRST_EVENT - EVENT_WARNING)) < .02);
  assert.equal(log[1].step, 'start');
  assert.ok(Math.abs(log[1].t - FIRST_EVENT) < .02);
  const starts = log.filter(l => l.step === 'start');
  const ends = log.filter(l => l.step === 'end');
  assert.ok(starts.length >= 8);
  for (let i = 1; i < starts.length; i++) {
    assert.ok(starts[i].t - ends[i - 1].t >= EVENT_GAP[0] - .02);
    assert.ok(starts[i].t - ends[i - 1].t <= EVENT_GAP[1] + .02);
  }
});

test('events alternate tension and relief, never repeat and respect each world', () => {
  for (const world of Object.keys(WORLD_EVENTS)) for (const seed of [1, 2, 3]) {
    const types = runDirector(world, 600, seed).filter(l => l.step === 'start').map(l => l.type);
    for (let i = 1; i < types.length; i++) {
      assert.notEqual(types[i], types[i - 1]);
      assert.notEqual(EVENTS[types[i]].kind, EVENTS[types[i - 1]].kind, `${world}: ${types}`);
    }
    assert.ok(types.every(t => WORLD_EVENTS[world].includes(t)));
  }
  assert.ok(!WORLD_EVENTS.nebulosa.includes('sciame'));
});

test('timed events report progress, the challenge ends only when resolved', () => {
  const d = createDirector('nebulosa', () => 0);
  updateDirector(d, FIRST_EVENT - EVENT_WARNING);
  updateDirector(d, FIRST_EVENT);
  const type = d.active.type;
  if (EVENTS[type].duration) {
    assert.equal(eventProgress(d, FIRST_EVENT), 0);
    assert.ok(Math.abs(eventProgress(d, FIRST_EVENT + EVENTS[type].duration / 2) - .5) < 1e-9);
  } else {
    assert.equal(eventProgress(d, FIRST_EVENT + 1), null);
  }
});

test('a requested challenge is a golden chunk from the hardest available tier', () => {
  for (const id of Object.keys(WORLD_EVENTS)) {
    const course = createCourse({ id, platMaxW: 140 }, 844, 7);
    course.elapsed = 20;
    let previous = { x: 0, y: 420, w: 130 };
    const plats = [];
    for (let i = 0; i < 12; i++) plats.push(previous = nextPlatform(course, previous));
    course.challengeRequested = true;
    for (let i = 0; i < 20; i++) plats.push(previous = nextPlatform(course, previous));
    const golden = plats.filter(p => p.challenge);
    assert.ok(golden.length >= 4, id);
    const ids = golden.map(p => p.id);
    assert.deepEqual(ids, ids.map((_, i) => ids[0] + i));
    const chunk = CHUNKS.find(c => c.id === golden[0].chunk);
    assert.ok(chunk.tier >= Math.min(MAX_TIER, golden[0].stage + 1) - 1, `${id}: ${chunk.id}`);
    const before = plats[plats.indexOf(golden[0]) - 1];
    assert.ok(before.recovery && !before.challenge);
    const after = plats[plats.indexOf(golden.at(-1)) + 1];
    assert.ok(after.recovery && !after.challenge);
  }
});

test('mascot rain puts a collectible on every new platform', () => {
  const course = createCourse({ id: 'nebulosa', platMaxW: 160 }, 844, 3);
  let previous = { x: 0, y: 420, w: 130 };
  for (let i = 0; i < 6; i++) previous = nextPlatform(course, previous);
  course.forceItems = true;
  const rain = Array.from({ length: 10 }, () => previous = nextPlatform(course, previous));
  assert.ok(rain.every(p => p.hasCollectible));
  course.forceItems = false;
  const after = Array.from({ length: 12 }, () => previous = nextPlatform(course, previous));
  assert.ok(after.some(p => !p.hasCollectible));
});
