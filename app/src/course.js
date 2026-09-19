// Pure, seeded course generation: add chunks in chunks.js or world rules here without touching rendering.
import { CHUNKS } from './chunks.js';

// mechanics: meccanica → livello da cui il mondo la usa. 'x' nei blocchi pesca fra queste.
// intro/tierSeconds: secondi prima del livello 1 e durata di ogni livello successivo.
// tierStep: quanto ogni livello restringe le piattaforme e allunga le distanze.
export const RULES = {
  nebulosa: { label: 'Giardini sospesi', hint: 'Anticipa i cambi di quota · tocca per invertire', mechanics: {}, intro: 10, tierSeconds: 12, tierStep: 16, widthReduction: 10, gapExtra: 10, heightJitter: 40, steepRise: true },
  asteroidi: { label: 'Isole alla deriva', hint: '', mechanics: { moving: 0, sweep: 0, soft: 0, boost: 0 }, intro: 8, tierSeconds: 15, tierStep: 8 },
  buconero: { label: 'Orbite instabili', hint: 'Gravità pulsante · schiva le meteore luminose', mechanics: { moving: 1, boost: 3 }, intro: 8, tierSeconds: 15, tierStep: 8 },
  supernova: { label: 'Scie di fuoco', hint: 'Le piattaforme ⋯ svaniscono al primo tocco', mechanics: { crumble: 0, moving: 2, boost: 3 }, intro: 8, tierSeconds: 15, tierStep: 8 },
};
export const MAX_TIER = 4;
const RECENT_CHUNKS = 3;

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
export function createCourse(world, height, seed = Date.now()) {
  return { world, height, random: seededRandom(seed), index: 0, queue: [], recent: [], lastUsed: {} };
}
export function courseTier(rules, elapsed = 0) {
  return Math.min(MAX_TIER, Math.max(0, 1 + Math.floor((elapsed - rules.intro) / rules.tierSeconds)));
}
export function worldMechanics(rules, tier) {
  return Object.keys(rules.mechanics).filter(m => rules.mechanics[m] <= tier);
}
function chunkMechanics(chunk) {
  return [...new Set(chunk.steps.map(s => s[1]).filter(t => t !== 'n' && t !== 'x'))];
}
export function eligibleChunks(rules, tier) {
  const allowed = worldMechanics(rules, tier);
  return CHUNKS.filter(c => c.tier <= tier && chunkMechanics(c).every(m => allowed.includes(m)));
}

// Pesca pesata: blocchi del livello attuale più probabili, niente ripetizioni ravvicinate,
// bonus ai blocchi con meccaniche che non si vedono da un po'.
function pickChunk(course, rules, tier, hardOnly = false) {
  const { random, index } = course;
  let pool = eligibleChunks(rules, tier);
  if (hardOnly) pool = pool.filter(c => c.tier === Math.max(...pool.map(p => p.tier)));
  const fresh = pool.filter(c => !course.recent.includes(c.id));
  if (fresh.length) pool = fresh;
  const weights = pool.map(c => {
    let w = c.tier === tier ? 3 : c.tier === tier - 1 ? 2 : 1;
    if (chunkMechanics(c).some(m => index - (course.lastUsed[m] ?? -Infinity) > 18)) w *= 2;
    return w;
  });
  let roll = random() * weights.reduce((a, b) => a + b, 0);
  let i = 0;
  while (roll >= weights[i] && i < pool.length - 1) roll -= weights[i++];
  return pool[i];
}

// 'x' diventa una meccanica del mondo; se una non si vede da più di 12 piattaforme, tocca a lei.
function resolveType(course, rules, tier, type) {
  if (type === 'n') return 'normal';
  if (type !== 'x') return type;
  const allowed = worldMechanics(rules, tier);
  if (!allowed.length) return 'normal';
  const oldest = allowed.reduce((a, b) => (course.lastUsed[b] ?? -Infinity) < (course.lastUsed[a] ?? -Infinity) ? b : a);
  if (course.index - (course.lastUsed[oldest] ?? -Infinity) > 12) return oldest;
  return allowed[Math.floor(course.random() * allowed.length)];
}

export function nextPlatform(course, previous) {
  const { world, height, random } = course;
  const rules = RULES[world.id];
  const index = course.index++;
  const tier = courseTier(rules, course.elapsed || 0);

  if (!course.queue.length) {
    // Tratto sfida: un blocco del livello successivo, fra i più difficili disponibili.
    const challenge = !!course.challengeRequested;
    course.challengeRequested = false;
    const chunk = pickChunk(course, rules, challenge ? Math.min(MAX_TIER, tier + 1) : tier, challenge);
    course.chunk = chunk.id;
    course.challengeChunk = challenge;
    course.recent = [...course.recent, chunk.id].slice(-RECENT_CHUNKS);
    // Ogni blocco parte da una piattaforma normale e larga su cui riprendere il ritmo.
    course.queue = [[chunk.steps[0][0], 'n', 'recovery'], ...chunk.steps];
  }
  const [quota, rawType, options = ''] = course.queue.shift();
  const opts = options.split(' ');
  const recovery = opts.includes('recovery');

  let type = index > 3 ? resolveType(course, rules, tier, rawType) : 'normal';
  if (type !== 'normal') course.lastUsed[type] = index;

  const sector = Math.floor(index / 12);
  const difficulty = Math.min(sector / 8, 1);
  const squeeze = tier * rules.tierStep;
  const w = recovery
    ? Math.max(80, world.platMaxW - (rules.widthReduction || 0) - random() * 10)
    : Math.max(80, world.platMaxW - squeeze - (rules.widthReduction || 0) - random() * 25 - difficulty * 25
      + (opts.includes('wide') ? 20 : 0) - (opts.includes('narrow') ? 18 : 0));
  const gap = 45 + (recovery ? 0 : squeeze) + (rules.gapExtra || 0) + random() * 30 + difficulty * 20
    + (opts.includes('long') && tier >= 2 ? 25 : 0) - (opts.includes('short') ? 10 : 0);

  const minY = 150, maxY = Math.max(210, height - 150);
  const desiredY = minY + quota * (maxY - minY) + (random() - .5) * (rules.heightJitter || 24);
  const maxRise = rules.steepRise && tier >= 2 ? 105 : 85;
  const baseY = Math.max(minY, Math.min(maxY, previous.y + Math.max(-maxRise, Math.min(maxRise, desiredY - previous.y))));

  return {
    id: index + 1, x: previous.x + previous.w + gap,
    y: baseY, baseY, w, type, amplitude: type === 'moving' ? 18 + difficulty * 12 : 0,
    phase: random() * Math.PI * 2, sector, stage: tier, chunk: course.chunk, recovery, collected: false,
    challenge: course.challengeChunk && !recovery,
    hasCollectible: opts.includes('item') || (!!course.forceItems && index > 3), collectibleMascot: Math.floor(random() * 14),
    colorIdx: ['nebulosa','asteroidi','buconero','supernova'].indexOf(world.id),
  };
}
export function platformY(platform, elapsed) {
  return platform.baseY === undefined ? platform.y : platform.baseY + Math.sin(elapsed * 1.4 + platform.phase) * platform.amplitude;
}
export function gravityFactor(worldId, elapsed) {
  return worldId === 'buconero' ? 0.85 + 0.3 * (0.5 + 0.5 * Math.sin(elapsed * 1.2)) : 1;
}

export function bounceVelocity(baseVelocity, type, gravityDown) {
  const multiplier = type === 'soft' ? 0 : type === 'boost' ? 1.7 : 1;
  return baseVelocity * multiplier * (gravityDown ? 1 : -1);
}
export function sweepPlatform(platforms, id) {
  return platforms.filter(p => p.id !== id || p.type !== 'sweep');
}
