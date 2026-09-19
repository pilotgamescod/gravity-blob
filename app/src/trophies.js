// Premi: trofei vinti giocando, stelle che valgono, scie sbloccate con le stelle.
// Tutto è calcolato da dati salvati: statistiche di sempre, album, record e mondi sbloccati.
//
// Per aggiungere un trofeo: una voce in TROPHIES con una condizione `check(ctx)`, dove ctx è
// { run, life, album, worldScores, unlocked } (vedi evaluateTrophies).

import { MASCOT_INFO } from './mascots.js';

export const MEDALS = {
  bronzo: { label: 'Bronzo', stars: 1, color: '#c07a45' },
  argento: { label: 'Argento', stars: 2, color: '#8e9bb0' },
  oro: { label: 'Oro', stars: 3, color: '#d9a21b' },
};

// Statistiche accumulate partita dopo partita (somme); i record di una sola partita stanno in `run`.
export const LIFE_KEYS = ['games', 'seconds', 'rings', 'rocks', 'pulsars', 'eruptionsDodged', 'nearMisses', 'challengesWon', 'events', 'collected'];

export function emptyLife() {
  return Object.fromEntries(LIFE_KEYS.map(k => [k, 0]));
}

export function updateLife(life, run) {
  const next = { ...emptyLife(), ...life };
  next.games += 1;
  next.seconds += Math.round(run.seconds);
  for (const k of ['rings', 'rocks', 'pulsars', 'eruptionsDodged', 'nearMisses', 'challengesWon', 'events', 'collected']) next[k] += run[k] || 0;
  return next;
}

const found = album => MASCOT_INFO.filter((_, i) => album[i] > 0).length;
const legendary = album => MASCOT_INFO.some((m, i) => m.rarity === 'leggendaria' && album[i] > 0);

export const TROPHIES = [
  // Primi passi e costanza
  { id: 'primo-volo', title: 'Primo volo', description: 'Gioca la tua prima partita.', medal: 'bronzo', check: c => c.life.games >= 1 },
  { id: 'abitudine', title: 'Abitudine', description: 'Gioca 25 partite.', medal: 'bronzo', check: c => c.life.games >= 25 },
  { id: 'veterano', title: 'Veterano', description: 'Gioca 100 partite.', medal: 'argento', check: c => c.life.games >= 100 },
  { id: 'un-minuto', title: 'Un minuto in volo', description: 'Resisti 60 secondi in una partita.', medal: 'bronzo', check: c => c.run.seconds >= 60 },
  { id: 'maratona', title: 'Maratona', description: 'Resisti 2 minuti in una partita.', medal: 'argento', check: c => c.run.seconds >= 120 },
  { id: 'fino-in-fondo', title: 'Fino in fondo', description: 'Raggiungi il livello 4 in Supernova.', medal: 'oro', check: c => c.run.world === 'supernova' && c.run.tier >= 4 },

  // Combo
  { id: 'combo-10', title: 'In ritmo', description: 'Fai un combo di 10 atterraggi.', medal: 'bronzo', check: c => c.run.bestCombo >= 10 },
  { id: 'combo-30', title: 'Moltiplicatore massimo', description: 'Arriva a x5 (combo di 30).', medal: 'argento', check: c => c.run.bestCombo >= 30 },
  { id: 'combo-60', title: 'Impeccabile', description: 'Fai un combo di 60 atterraggi.', medal: 'oro', check: c => c.run.bestCombo >= 60 },

  // Mondi
  { id: 'esploratore', title: 'Esploratore', description: 'Sblocca tutti e quattro i mondi.', medal: 'argento', check: c => c.unlocked.length >= 4 },
  { id: 'maestro-nebulosa', title: 'Maestro della Nebulosa', description: '1.000 punti in una partita in Nebulosa.', medal: 'bronzo', check: c => (c.worldScores.nebulosa || 0) >= 1000 },
  { id: 'maestro-asteroidi', title: 'Maestro degli Asteroidi', description: '1.000 punti in una partita in Asteroidi.', medal: 'argento', check: c => (c.worldScores.asteroidi || 0) >= 1000 },
  { id: 'maestro-buconero', title: 'Maestro del Buco nero', description: '1.000 punti in una partita in Buco nero.', medal: 'argento', check: c => (c.worldScores.buconero || 0) >= 1000 },
  { id: 'maestro-supernova', title: 'Maestro della Supernova', description: '1.500 punti in una partita in Supernova.', medal: 'oro', check: c => (c.worldScores.supernova || 0) >= 1500 },

  // Novità dei mondi
  { id: 'collana', title: 'Collana di luce', description: 'Attraversa 5 anelli di fila.', medal: 'argento', check: c => c.run.ringChain >= 5 },
  { id: 'cento-anelli', title: 'Cento anelli', description: 'Attraversa 100 anelli in tutto.', medal: 'bronzo', check: c => c.life.rings >= 100 },
  { id: 'scalatore', title: 'Scalatore', description: 'Rimbalza su 15 rocce cadenti in una partita.', medal: 'argento', check: c => c.run.rocks >= 15 },
  { id: 'a-tempo', title: 'A tempo di musica', description: 'Atterra su 15 pulsar in una partita.', medal: 'argento', check: c => c.run.pulsars >= 15 },
  { id: 'pelle-di-drago', title: 'Pelle di drago', description: 'Sfiora 5 eruzioni in una partita.', medal: 'oro', check: c => c.run.eruptionsDodged >= 5 },
  { id: 'di-un-soffio', title: 'Di un soffio', description: 'Sfiora 25 meteore in tutto.', medal: 'bronzo', check: c => c.life.nearMisses >= 25 },

  // Eventi
  { id: 'sfidante', title: 'Sfidante', description: 'Supera un tratto sfida.', medal: 'bronzo', check: c => c.life.challengesWon >= 1 },
  { id: 'campione', title: 'Campione delle sfide', description: 'Supera 15 tratti sfida.', medal: 'argento', check: c => c.life.challengesWon >= 15 },
  { id: 'imperturbabile', title: 'Imperturbabile', description: 'Vivi 6 eventi in una partita.', medal: 'oro', check: c => c.run.events >= 6 },

  // Album
  { id: 'collezionista', title: 'Collezionista', description: 'Trova 7 mascotte diverse.', medal: 'bronzo', check: c => found(c.album) >= 7 },
  { id: 'leggenda', title: 'Leggenda', description: 'Trova una mascotte leggendaria.', medal: 'argento', check: c => legendary(c.album) },
  { id: 'album-completo', title: 'Album completo', description: 'Trova tutte le 14 mascotte.', medal: 'oro', check: c => found(c.album) >= MASCOT_INFO.length },
];

// Trofei appena vinti, dato lo stato dopo la partita. won: { id: data } già vinti.
export function evaluateTrophies(ctx, won = {}) {
  const safe = {
    run: { seconds: 0, bestCombo: 0, tier: 0, ringChain: 0, rocks: 0, pulsars: 0, eruptionsDodged: 0, events: 0, ...ctx.run },
    life: { ...emptyLife(), ...ctx.life },
    album: ctx.album || {},
    worldScores: ctx.worldScores || {},
    unlocked: ctx.unlocked || [],
  };
  return TROPHIES.filter(t => !won[t.id] && t.check(safe)).map(t => t.id);
}

export function totalStars(won = {}) {
  return TROPHIES.filter(t => won[t.id]).reduce((sum, t) => sum + MEDALS[t.medal].stars, 0);
}

export const MAX_STARS = TROPHIES.reduce((sum, t) => sum + MEDALS[t.medal].stars, 0);

// Scie del personaggio: si sbloccano con le stelle.
export const TRAILS = [
  { id: 'eco', name: 'Eco', stars: 0, description: 'Copie trasparenti della mascotte.' },
  { id: 'arcobaleno', name: 'Arcobaleno', stars: 5, colors: ['#ff6b6b', '#ffb347', '#ffe066', '#6bdb8b', '#5ab8ff', '#a78bfa'] },
  { id: 'lucciole', name: 'Lucciole', stars: 12, colors: ['#fff6b0', '#ffe27a', '#fff6b0'] },
  { id: 'brace', name: 'Brace', stars: 20, colors: ['#fff1b8', '#ffb347', '#ff6a3d', '#c2372b'] },
  { id: 'aurora', name: 'Aurora', stars: 30, colors: ['#7af0c8', '#5ab8ff', '#a78bfa', '#f07ad8'] },
  { id: 'oro', name: 'Oro zecchino', stars: 45, colors: ['#fff4c2', '#ffd76a', '#d9a21b'] },
];

export function trailUnlocked(trailId, stars) {
  const trail = TRAILS.find(t => t.id === trailId);
  return !!trail && stars >= trail.stars;
}
