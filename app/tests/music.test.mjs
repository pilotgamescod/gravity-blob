import test from 'node:test';
import assert from 'node:assert/strict';
import { SONGS, activeLayers, degreeToSemitone } from '../src/music.js';

test('every world has a well formed song', () => {
  assert.deepEqual(Object.keys(SONGS).sort(), ['asteroidi', 'buconero', 'nebulosa', 'supernova']);
  for (const [id, song] of Object.entries(SONGS)) {
    assert.equal(song.chords.length, 4, id);
    assert.equal(song.melodySteps.length, 64, id);
    for (const pattern of [song.bass.pattern, song.arp.pattern, song.drums.kick, song.drums.hat, song.drums.snare]) {
      assert.equal(pattern.length, 16, id);
    }
    assert.ok(song.bpm >= 60 && song.bpm <= 140 && song.gain > 0, id);
    // La melodia resta in un registro cantabile.
    for (const n of song.melodySteps.filter(Boolean)) {
      const midi = song.root + 12 + degreeToSemitone(song.scale, n.degree);
      assert.ok(midi >= 60 && midi <= 96, `${id}: ${midi}`);
    }
  }
});

test('layers build up with the level and follow the event mood', () => {
  for (const song of Object.values(SONGS)) {
    let previous = 0;
    for (let level = 0; level <= 4; level++) {
      const size = activeLayers(song, 'game', level, null).size;
      assert.ok(size >= previous);
      previous = size;
    }
    assert.ok(activeLayers(song, 'game', 4, null).size > activeLayers(song, 'game', 0, null).size);
    assert.ok(activeLayers(song, 'game', 0, 'tension').has('kick'));
    const relief = activeLayers(song, 'game', 4, 'relief');
    assert.ok(!relief.has('kick') && !relief.has('hat') && !relief.has('snare'));
    assert.ok(![...activeLayers(song, 'menu', 4, 'tension')].some(l => ['kick', 'hat', 'snare'].includes(l)));
  }
});

test('scale degrees wrap across octaves', () => {
  const major = [0, 2, 4, 5, 7, 9, 11];
  assert.equal(degreeToSemitone(major, 0), 0);
  assert.equal(degreeToSemitone(major, 7), 12);
  assert.equal(degreeToSemitone(major, 9), 16);
  assert.equal(degreeToSemitone(major, -1), -1);
});
