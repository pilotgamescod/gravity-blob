// Effetti sonori sintetizzati con la Web Audio API: nessun file audio da scaricare.
// Fuori dal browser (o senza Web Audio) ogni funzione non fa nulla.
//
// Su iPhone l'audio parte solo dopo un tocco: il primo tocco sulla pagina lo sblocca.
// Come ogni suono di pagina web, su iPhone rispetta l'interruttore silenzioso.

let ctx = null;
let master = null;      // canale degli effetti
let musicBus = null;    // canale della musica (usato da music.js)
let enabled = true;
const unlockListeners = [];
let world = 'nebulosa';
const lastPlayed = {};

// Scala pentatonica (semitoni) su due ottave: il combo sale di nota a ogni atterraggio.
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
// Tonalità e timbro dei mondi.
const WORLD_VOICE = {
  nebulosa: { root: 523.25, wave: 'sine' },     // Do
  asteroidi: { root: 587.33, wave: 'triangle' }, // Re
  buconero: { root: 440, wave: 'sine' },         // La
  supernova: { root: 659.25, wave: 'triangle' }, // Mi
};

function audioContextClass() {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

export function unlockAudio() {
  const AC = audioContextClass();
  if (!AC) return;
  try {
    if (!ctx) {
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      master = ctx.createGain();
      master.gain.value = enabled ? .55 : 0;
      master.connect(comp);
      musicBus = ctx.createGain();
      musicBus.gain.value = 1;
      musicBus.connect(comp);
      comp.connect(ctx.destination);
      // Buffer muto: su iOS completa lo sblocco dentro il gesto.
      const buffer = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(0);
    }
    if (ctx.state === 'suspended') ctx.resume().then(notifyUnlocked).catch(() => {});
    else notifyUnlocked();
  } catch {
    ctx = null;
  }
}

function notifyUnlocked() {
  if (!ctx || ctx.state !== 'running') return;
  for (const fn of unlockListeners.splice(0)) fn();
}

// Per music.js: contesto e canale della musica, oppure null se l'audio non è ancora attivo.
export function getMusicOutput() {
  return ctx && ctx.state === 'running' ? { ctx, bus: musicBus } : null;
}

// Esegue fn appena l'audio è sbloccato (subito, se lo è già).
export function whenAudioReady(fn) {
  if (ctx && ctx.state === 'running') fn();
  else unlockListeners.push(fn);
}

if (typeof document !== 'undefined') {
  const unlock = () => {
    unlockAudio();
    if (ctx && ctx.state === 'running') {
      for (const e of ['touchend', 'pointerup', 'click', 'keydown']) document.removeEventListener(e, unlock, true);
    }
  };
  for (const e of ['touchend', 'pointerup', 'click', 'keydown']) document.addEventListener(e, unlock, true);
  // In background l'audio si ferma; tornando nell'app riprende.
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.visibilityState === 'hidden') ctx.suspend().catch(() => {});
    else ctx.resume().catch(() => {});
  });
}

export function setSoundEnabled(on) {
  enabled = on;
  if (master && ctx) master.gain.setTargetAtTime(on ? .55 : 0, ctx.currentTime, .02);
}

export function setSoundWorld(id) {
  if (WORLD_VOICE[id]) world = id;
}

function ready(name, minGap = 0) {
  if (!enabled || !ctx || ctx.state !== 'running') return false;
  const now = ctx.currentTime;
  if (minGap && lastPlayed[name] != null && now - lastPlayed[name] < minGap) return false;
  lastPlayed[name] = now;
  return true;
}

function tone({ freq, to, type = 'sine', dur = .12, vol = .25, delay = 0, attack = .006 }) {
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + dur + .02);
}

function noise({ dur = .15, vol = .2, freq = 1200, to, filter = 'lowpass', delay = 0, q = 1 }) {
  const t = ctx.currentTime + delay;
  const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f);
  f.connect(gain);
  gain.connect(master);
  src.start(t);
  src.stop(t + dur + .02);
}

const semis = (root, n) => root * Math.pow(2, n / 12);
const voice = () => WORLD_VOICE[world];

export const sfx = {
  // Inversione della gravità: fruscio che sale o scende.
  flip(down) {
    if (!ready('flip', .05)) return;
    tone({ freq: down ? 520 : 300, to: down ? 260 : 620, type: 'sine', dur: .13, vol: .16 });
    noise({ dur: .1, vol: .05, freq: down ? 2500 : 900, to: down ? 700 : 3000, filter: 'bandpass', q: 2 });
  },
  // Primo atterraggio su una piattaforma: nota della scala, più alta a ogni combo.
  land(combo) {
    if (!ready('land', .03)) return;
    const v = voice();
    const step = PENTA[Math.min(combo, PENTA.length - 1)];
    const f = semis(v.root, step - 12);
    tone({ freq: f, type: v.wave, dur: .16, vol: .22 });
    tone({ freq: f * 2, type: 'sine', dur: .08, vol: .05 });
  },
  // Rimbalzi successivi sulla stessa piattaforma: tocco leggero.
  bounce() {
    if (!ready('bounce', .12)) return;
    tone({ freq: 190, to: 140, type: 'sine', dur: .07, vol: .09 });
  },
  boost() {
    if (!ready('boost', .08)) return;
    tone({ freq: 180, to: 720, type: 'triangle', dur: .22, vol: .2 });
    tone({ freq: 360, to: 1440, type: 'sine', dur: .18, vol: .06, delay: .02 });
  },
  soft() {
    if (!ready('soft', .2)) return;
    noise({ dur: .22, vol: .12, freq: 700, to: 250 });
  },
  crumble() {
    if (!ready('crumble', .05)) return;
    noise({ dur: .18, vol: .16, freq: 3000, to: 500, filter: 'bandpass', q: .8 });
    tone({ freq: 140, to: 70, type: 'triangle', dur: .15, vol: .1 });
  },
  sweep() {
    if (!ready('sweep', .03)) return;
    tone({ freq: 900, to: 300, type: 'square', dur: .06, vol: .06 });
    noise({ dur: .12, vol: .1, freq: 4000, to: 1200, filter: 'highpass' });
  },
  collect() {
    if (!ready('collect', .04)) return;
    const v = voice();
    tone({ freq: semis(v.root, 12), type: 'sine', dur: .1, vol: .16 });
    tone({ freq: semis(v.root, 19), type: 'sine', dur: .18, vol: .14, delay: .07 });
  },
  multiplier(m) {
    if (!ready('multiplier')) return;
    const v = voice();
    [0, 4, 7, 12].forEach((n, i) => tone({ freq: semis(v.root, n + (m - 2) * 2), type: v.wave, dur: .14, vol: .15, delay: i * .055 }));
  },
  comboLost() {
    if (!ready('comboLost', .2)) return;
    tone({ freq: 330, to: 150, type: 'triangle', dur: .28, vol: .16 });
  },
  forgiven() {
    if (!ready('forgiven', .2)) return;
    tone({ freq: 660, type: 'sine', dur: .12, vol: .12 });
    tone({ freq: 880, type: 'sine', dur: .2, vol: .1, delay: .08 });
  },
  nearMiss() {
    if (!ready('nearMiss', .1)) return;
    noise({ dur: .25, vol: .08, freq: 600, to: 3500, filter: 'bandpass', q: 1.5 });
    tone({ freq: 1320, type: 'sine', dur: .15, vol: .1, delay: .12 });
  },
  meteorWarn() {
    if (!ready('meteorWarn', .4)) return;
    tone({ freq: 220, type: 'square', dur: .07, vol: .05 });
    tone({ freq: 220, type: 'square', dur: .07, vol: .05, delay: .13 });
  },
  shield() {
    if (!ready('shield', .2)) return;
    noise({ dur: .3, vol: .1, freq: 5000, to: 1500, filter: 'highpass' });
    [0, 7, 12].forEach((n, i) => tone({ freq: semis(784, n), type: 'sine', dur: .2, vol: .1, delay: i * .04 }));
  },
  eventWarn() {
    if (!ready('eventWarn', .5)) return;
    tone({ freq: 587, type: 'triangle', dur: .12, vol: .12 });
    tone({ freq: 784, type: 'triangle', dur: .16, vol: .12, delay: .16 });
  },
  eventStart(kind) {
    if (!ready('eventStart', .5)) return;
    const v = voice();
    const notes = kind === 'tension' ? [0, 3, 7] : [0, 4, 7, 12];
    notes.forEach((n, i) => tone({ freq: semis(v.root, n - 12), type: v.wave, dur: .2, vol: .13, delay: i * .07 }));
  },
  challengeWin() {
    if (!ready('challengeWin')) return;
    const v = voice();
    [0, 4, 7, 12, 16].forEach((n, i) => tone({ freq: semis(v.root, n), type: v.wave, dur: .18, vol: .14, delay: i * .07 }));
  },
  challengeFail() {
    if (!ready('challengeFail')) return;
    [0, -3, -7].forEach((n, i) => tone({ freq: semis(392, n), type: 'triangle', dur: .18, vol: .12, delay: i * .09 }));
  },
  gameOver() {
    if (!ready('gameOver')) return;
    noise({ dur: .3, vol: .14, freq: 600, to: 80 });
    [0, -2, -5, -9].forEach((n, i) => tone({ freq: semis(330, n), type: 'triangle', dur: .22, vol: .12, delay: .08 + i * .1 }));
  },
  record() {
    if (!ready('record')) return;
    [0, 4, 7, 12, 7, 12, 16].forEach((n, i) => tone({ freq: semis(523.25, n), type: 'triangle', dur: .16, vol: .12, delay: i * .08 }));
  },
  unlock() {
    if (!ready('unlock')) return;
    [12, 16, 19, 24].forEach((n, i) => tone({ freq: semis(523.25, n), type: 'sine', dur: .25, vol: .1, delay: .3 + i * .09 }));
  },
  ring(chain) {
    if (!ready('ring', .05)) return;
    const v = voice();
    const n = Math.min(chain, 6) * 2;
    tone({ freq: semis(v.root, 12 + n), type: 'sine', dur: .22, vol: .13 });
    tone({ freq: semis(v.root, 19 + n), type: 'sine', dur: .3, vol: .08, delay: .05 });
  },
  rockFall() {
    if (!ready('rockFall', .1)) return;
    noise({ dur: .35, vol: .12, freq: 900, to: 120 });
    tone({ freq: 120, to: 50, type: 'triangle', dur: .35, vol: .12, delay: .25 });
  },
  eruptionWarn() {
    if (!ready('eruptionWarn', .3)) return;
    noise({ dur: .5, vol: .06, freq: 200, to: 1200, filter: 'bandpass', q: 3 });
  },
  eruption() {
    if (!ready('eruption', .1)) return;
    noise({ dur: .4, vol: .14, freq: 400, to: 3000, filter: 'bandpass', q: 1.2 });
    tone({ freq: 90, to: 260, type: 'sawtooth', dur: .25, vol: .05 });
  },
  trophy() {
    if (!ready('trophy', .5)) return;
    [0, 7, 12, 16, 19, 24].forEach((n, i) => tone({ freq: semis(659.25, n), type: 'triangle', dur: .3, vol: .1, delay: i * .07 }));
    noise({ dur: .6, vol: .04, freq: 6000, to: 9000, filter: 'highpass', delay: .3 });
  },
  tap() {
    if (!ready('tap', .05)) return;
    tone({ freq: 660, to: 520, type: 'sine', dur: .06, vol: .08 });
  },
};
