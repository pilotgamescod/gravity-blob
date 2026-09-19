// Musica di sottofondo generata in tempo reale: un brano per mondo, a strati.
// In partita gli strati si aggiungono salendo di livello (setMusicIntensity);
// durante gli eventi la musica si fa più tesa o più morbida (setMusicMood).
// Nel menu suona una versione più tranquilla del brano del mondo selezionato.
//
// Ogni brano è definito da dati: volume (gain, per pareggiare i brani), tempo, tonalità, scala, 4 accordi (uno per battuta),
// ritmi di basso, arpeggio e batteria (16 sedicesimi per battuta) e una melodia di 4 battute.
// Nella melodia ogni simbolo è un sedicesimo: un numero è un grado della scala,
// '-' prolunga la nota precedente, '.' è una pausa.

import { getMusicOutput, whenAudioReady } from './sound.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const MIXOLYDIAN = [0, 2, 4, 5, 7, 9, 10];

export const SONGS = {
  // Sognante, Do maggiore: I – vi – IV – V
  nebulosa: {
    gain: 1,
    bpm: 92, root: 60, scale: MAJOR,
    chords: [{ root: 0, tones: [0, 4, 7] }, { root: -3, tones: [-3, 0, 4] }, { root: -7, tones: [-7, -3, 0] }, { root: -5, tones: [-5, -1, 2] }],
    pad: { wave: 'sine', vol: .05, detune: 6, attack: .4 },
    bass: { wave: 'triangle', vol: .12, pattern: 'R.....5.R.......' },
    arp: { wave: 'triangle', vol: .04, pattern: 'x.x.x.x.x.x.x.x.', octave: 12 },
    melody: { wave: 'sine', vol: .075, bell: true, notes: [
      '4 - - - 2 - 4 - 5 - 4 - 2 - - -',
      '0 - - - 2 - 4 - 5 - - - 4 - - -',
      '3 - - - 5 - 7 - 5 - 3 - 2 - - -',
      '1 - - - 4 - 6 - 4 - - - . . . .',
    ] },
    drums: { kick: 'x.......x.......', hat: '..x...x...x...x.', snare: '....x.......x...', hatVol: .03 },
    layers: { arp: 1, melody: 2, hat: 3, kick: 3, snare: 4 },
  },
  // Saltellante, Re misolidio: I – bVII – IV – I
  asteroidi: {
    gain: 1.5,
    bpm: 112, root: 62, scale: MIXOLYDIAN,
    chords: [{ root: 0, tones: [0, 4, 7] }, { root: -2, tones: [-2, 2, 5] }, { root: -7, tones: [-7, -3, 0] }, { root: 0, tones: [0, 4, 7] }],
    pad: { wave: 'triangle', vol: .03, detune: 4, attack: .15 },
    bass: { wave: 'square', vol: .06, cutoff: 900, pattern: 'R..R..5.R..R..5.' },
    arp: { wave: 'square', vol: .025, cutoff: 2400, pattern: 'x.xx.x.xx.xx.x.x', octave: 12 },
    melody: { wave: 'triangle', vol: .07, notes: [
      '4 - 4 . 5 - 4 - 2 - 0 - 2 - - -',
      '6 - 6 . 7 - 6 - 4 - 1 - 4 - - -',
      '3 - 3 . 5 - 7 - 8 - 7 - 5 - 3 -',
      '2 - 4 - 2 - 0 - . . . . . . . .',
    ] },
    drums: { kick: 'x.......x.......', hat: 'x..x..x...x..x..', snare: '....x.......x...', block: true, hatVol: .05 },
    layers: { arp: 1, melody: 2, hat: 2, kick: 3, snare: 4 },
  },
  // Misterioso, La minore: i – VI – III – VII
  buconero: {
    gain: .75,
    bpm: 78, root: 57, scale: MINOR,
    chords: [{ root: 0, tones: [0, 3, 7] }, { root: -4, tones: [-4, 0, 3] }, { root: 3, tones: [3, 7, 10] }, { root: -2, tones: [-2, 2, 5] }],
    pad: { wave: 'sine', vol: .065, detune: 9, attack: .9 },
    bass: { wave: 'sine', vol: .17, pattern: 'R...............' },
    arp: { wave: 'sine', vol: .035, bell: true, pattern: 'x.....x.....x...', octave: 24 },
    melody: { wave: 'sine', vol: .07, bell: true, notes: [
      '4 - - - - - 3 - 2 - - - - - - -',
      '0 - - - - - 2 - 3 - - - 2 - - -',
      '4 - - - - - 6 - 7 - - - 6 - - -',
      '5 - - - 4 - - - 1 - - - - - - -',
    ] },
    drums: { kick: 'x..x............', hat: '....x.......x...', snare: '................', hatVol: .025 },
    layers: { kick: 1, arp: 1, melody: 2, hat: 3, snare: 9 },
  },
  // Energico, Mi minore: i – VI – VII – i
  supernova: {
    gain: 1.9,
    bpm: 128, root: 64, scale: MINOR,
    chords: [{ root: 0, tones: [0, 3, 7] }, { root: -4, tones: [-4, 0, 3] }, { root: -2, tones: [-2, 2, 5] }, { root: 0, tones: [0, 3, 7] }],
    pad: { wave: 'sawtooth', vol: .022, detune: 8, attack: .1, cutoff: 1400 },
    bass: { wave: 'sawtooth', vol: .075, cutoff: 700, pattern: 'R.RR.RR.R.RR.R5.' },
    arp: { wave: 'square', vol: .022, cutoff: 3000, pattern: 'xxxxxxxxxxxxxxxx', octave: 12 },
    melody: { wave: 'square', vol: .045, cutoff: 2600, notes: [
      '7 - - 4 - - 7 - 8 - 9 - 8 - 7 -',
      '7 - - 4 - - 2 - 4 - - - - - - -',
      '6 - - 1 - - 6 - 7 - 8 - 7 - 6 -',
      '4 - - - 7 - - - 4 - - - . . . .',
    ] },
    drums: { kick: 'x...x...x...x...', hat: '..x...x...x...x.', snare: '....x.......x...', hatVol: .04 },
    layers: { arp: 1, hat: 2, melody: 2, kick: 3, snare: 4 },
  },
};

// Strati del menu: solo quelli morbidi.
const MENU_LAYERS = ['pad', 'bass', 'arp', 'melody'];
const MUSIC_VOLUME = .5;
const LOOKAHEAD = .15;

function parseMelody(rows) {
  const tokens = rows.join(' ').trim().split(/\s+/);
  const out = new Array(tokens.length).fill(null);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === '-' || tokens[i] === '.') continue;
    let len = 1;
    while (tokens[i + len] === '-') len++;
    out[i] = { degree: Number(tokens[i]), len };
  }
  return out;
}
for (const song of Object.values(SONGS)) song.melodySteps = parseMelody(song.melody.notes);

export function degreeToSemitone(scale, degree) {
  const octave = Math.floor(degree / scale.length);
  return scale[((degree % scale.length) + scale.length) % scale.length] + 12 * octave;
}

// Strati attivi per modalità, livello e atmosfera.
export function activeLayers(song, mode, intensity, mood) {
  if (mode === 'menu') return new Set(MENU_LAYERS);
  const on = new Set(['pad', 'bass']);
  for (const [layer, from] of Object.entries(song.layers)) if (intensity >= from) on.add(layer);
  if (mood === 'tension') { on.add('hat'); on.add('kick'); }
  if (mood === 'relief') { on.delete('hat'); on.delete('kick'); on.delete('snare'); }
  return on;
}

let enabled = true;
let wanted = null;              // { id, mode } richiesto dal gioco
let player = null;              // brano in riproduzione
let intensity = 0;
let mood = null;
let noiseBuffer = null;

const midiFreq = m => 440 * Math.pow(2, (m - 69) / 12);

function voice(ctx, dest, midi, t, dur, { wave, vol, attack = .01, release = .12, cutoff, detune = 0, bell = false }) {
  const end = t + Math.max(.05, dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + attack);
  gain.gain.setValueAtTime(vol, Math.max(t + attack, end - .02));
  gain.gain.exponentialRampToValueAtTime(.0001, end + release);
  let node = gain;
  if (cutoff) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    gain.connect(f);
    node = f;
  }
  node.connect(dest);
  const oscs = detune ? [-detune, detune] : [0];
  for (const d of oscs) {
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = midiFreq(midi);
    osc.detune.value = d;
    osc.connect(gain);
    osc.start(t);
    osc.stop(end + release + .05);
  }
  if (bell) {
    // Armonica che si spegne in fretta: suono di campanella.
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(vol * .35, t);
    g2.gain.exponentialRampToValueAtTime(.0001, t + .35);
    g2.connect(dest);
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = midiFreq(midi) * 3;
    o2.connect(g2);
    o2.start(t);
    o2.stop(t + .4);
  }
}

function drum(ctx, dest, kind, t, vol) {
  if (kind === 'kick') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + .12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + .2);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + .22);
    return;
  }
  if (kind === 'block') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(1250, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + .03);
    g.gain.setValueAtTime(vol * 1.6, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + .05);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + .06);
    return;
  }
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  const dur = kind === 'hat' ? .04 : .13;
  f.type = kind === 'hat' ? 'highpass' : 'bandpass';
  f.frequency.value = kind === 'hat' ? 7000 : 1800;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t, Math.random() * .5); src.stop(t + dur + .02);
}

function scheduleStep(p, step, t) {
  const { ctx, song, out } = p;
  const stepDur = 60 / song.bpm / 4;
  const inBar = step % 16;
  const bar = Math.floor(step / 16) % song.chords.length;
  const chord = song.chords[bar];
  const layers = activeLayers(song, p.mode, intensity, mood);
  const menu = p.mode === 'menu';

  if (layers.has('pad') && inBar === 0) {
    for (const tone of chord.tones) voice(ctx, out, song.root + tone, t, stepDur * 16, { ...song.pad, release: .6 });
  }
  if (layers.has('bass')) {
    const sym = song.bass.pattern[inBar];
    if (sym !== '.') {
      let len = 1;
      while (inBar + len < 16 && song.bass.pattern[inBar + len] === '.') len++;
      const offset = sym === '5' ? 7 : sym === 'O' ? 12 : 0;
      voice(ctx, out, song.root - 12 + chord.root + offset, t, stepDur * len * .9, song.bass);
    }
  }
  if (layers.has('arp') && song.arp.pattern[inBar] === 'x') {
    const tones = [...chord.tones, ...chord.tones.map(x => x + 12)];
    const tone = tones[p.arpIndex++ % tones.length];
    voice(ctx, out, song.root + song.arp.octave + tone - 12, t, stepDur * .8, { ...song.arp, vol: song.arp.vol * (menu ? .7 : 1) });
  }
  if (layers.has('melody')) {
    const n = song.melodySteps[(step % (16 * song.chords.length))];
    if (n) voice(ctx, out, song.root + 12 + degreeToSemitone(song.scale, n.degree), t, stepDur * n.len * .95, { ...song.melody, vol: song.melody.vol * (menu ? .8 : 1) });
  }
  const d = song.drums;
  if (layers.has('kick') && d.kick[inBar] === 'x') drum(ctx, out, 'kick', t, .32);
  if (layers.has('hat') && d.hat[inBar] === 'x') drum(ctx, out, d.block ? 'block' : 'hat', t, d.hatVol);
  if (layers.has('snare') && d.snare[inBar] === 'x') drum(ctx, out, 'snare', t, .09);
}

function tick() {
  const p = player;
  const o = getMusicOutput();
  if (!p || !o) return;
  const now = o.ctx.currentTime;
  const stepDur = 60 / p.song.bpm / 4;
  // Dopo una pausa (app in background) si riparte dal presente, senza raffiche di note.
  if (p.nextTime < now - .05) p.nextTime = now + .05;
  while (p.nextTime < now + LOOKAHEAD) {
    scheduleStep(p, p.step, p.nextTime);
    p.nextTime += stepDur;
    p.step++;
  }
}

function fadeOut(p, seconds) {
  if (!p) return;
  clearInterval(p.timer);
  const t = p.ctx.currentTime;
  p.gain.gain.cancelScheduledValues(t);
  p.gain.gain.setValueAtTime(p.gain.gain.value, t);
  p.gain.gain.linearRampToValueAtTime(0, t + seconds);
  setTimeout(() => { try { p.gain.disconnect(); } catch {} }, seconds * 1000 + 300);
}

function applyMood(p) {
  if (!p) return;
  const t = p.ctx.currentTime;
  p.filter.frequency.setTargetAtTime(mood === 'relief' ? 1100 : 18000, t, .4);
}

function start() {
  if (!enabled || !wanted) return;
  const o = getMusicOutput();
  if (!o) return;
  const song = SONGS[wanted.id];
  if (!song) return;
  if (player && player.song === song && player.mode === wanted.mode) return;
  fadeOut(player, .6);
  const { ctx, bus } = o;
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 18000;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(MUSIC_VOLUME * song.gain * (wanted.mode === 'menu' ? .75 : 1), ctx.currentTime + .8);
  filter.connect(gain);
  gain.connect(bus);
  player = { ctx, song, mode: wanted.mode, out: filter, gain, filter, step: 0, arpIndex: 0, nextTime: ctx.currentTime + .1, timer: null };
  applyMood(player);
  player.timer = setInterval(tick, 25);
  tick();
}

// Avvia (o cambia) il brano: mode 'game' in partita, 'menu' nei menu.
export function playMusic(worldId, mode = 'game') {
  wanted = { id: worldId, mode };
  if (mode === 'game') { intensity = 0; mood = null; }
  whenAudioReady(start);
}

export function stopMusic(seconds = .8) {
  wanted = null;
  fadeOut(player, seconds);
  player = null;
}

export function setMusicEnabled(on) {
  enabled = on;
  if (!on) { fadeOut(player, .3); player = null; }
  else whenAudioReady(start);
}

export function setMusicIntensity(level) {
  intensity = level;
}

export function setMusicMood(next) {
  if (mood === next) return;
  mood = next;
  applyMood(player);
}
