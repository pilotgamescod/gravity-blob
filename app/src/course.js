// Pure, seeded course generation: add patterns or world rules without touching rendering.
export const RULES = {
  nebulosa: { label: 'Giardini sospesi', hint: 'Anticipa i cambi di quota · tocca per invertire', patterns: [[.6,.52,.36,.46,.62,.48],[.45,.58,.66,.5,.34,.44],[.6,.44,.5,.34,.48,.62],[.4,.54,.38,.52,.66,.5]], widthReduction: 10, gapExtra: 10, heightJitter: 40, advancedPatterns: [[.7,.35,.65,.3,.6,.45],[.3,.65,.4,.7,.35,.55],[.65,.55,.3,.65,.4,.7],[.35,.7,.6,.3,.65,.4]], mechanic: 'normal' },
  asteroidi: { label: 'Isole alla deriva', hint: '', patterns: [[.65,.5,.35,.5,.65,.5],[.4,.55,.7,.55,.4,.3]], mechanic: 'moving' },
  buconero: { label: 'Orbite instabili', hint: 'Gravità pulsante · schiva le meteore luminose', patterns: [[.65,.5,.35,.3,.45,.6],[.35,.5,.65,.7,.55,.4]], mechanic: 'pulse' },
  supernova: { label: 'Scie di fuoco', hint: 'Le piattaforme ⋯ svaniscono al primo tocco', patterns: [[.65,.55,.45,.35,.45,.55],[.35,.45,.55,.65,.55,.45]], mechanic: 'crumble' },
};
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
export function createCourse(world, height, seed = Date.now()) {
  return { world, height, random: seededRandom(seed), index: 0, pattern: null, previousPattern: -1 };
}
export function nextPlatform(course, previous) {
  const { world, height, random } = course;
  const rules = RULES[world.id];
  const index = course.index++;
  const step = index % 6;
  const stage = world.id === 'nebulosa' ? Math.min(4, Math.max(0, 1 + Math.floor(((course.elapsed || 0) - 10) / 12))) : 0;
  const patterns = stage > 0 ? rules.advancedPatterns : rules.patterns;
  if (step === 0) {
    const choice = course.previousPattern < 0 ? Math.floor(random() * patterns.length) : (course.previousPattern + 1 + Math.floor(random() * (patterns.length - 1))) % patterns.length;
    course.previousPattern = choice;
    course.pattern = patterns[choice];
  }
  const sector = Math.floor(index / 12);
  const difficulty = Math.min(sector / 8, 1);
  const recovery = stage > 0 && step === 0;
  const w = Math.max(80, world.platMaxW - (recovery ? 0 : stage * 16) - (rules.widthReduction || 0) - random() * 25 - difficulty * 25);
  const minY = 150, maxY = Math.max(210, height - 150);
  const desiredY = minY + course.pattern[step] * (maxY - minY) + (random() - .5) * (rules.heightJitter || 24);
  const maxRise = stage >= 2 ? 105 : 85;
  const baseY = Math.max(minY, Math.min(maxY, previous.y + Math.max(-maxRise, Math.min(maxRise, desiredY - previous.y))));
  let type = index > 3 && step !== 0 ? rules.mechanic : 'normal';
  if (world.id === 'asteroidi' && index >= 6 && step !== 0) {
    // Every section has all four surfaces, in a seeded, shuffled order.
    if (step === 1) {
      course.surfaces = ['moving', 'moving', 'sweep', 'soft', 'boost'];
      for (let i = course.surfaces.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [course.surfaces[i], course.surfaces[j]] = [course.surfaces[j], course.surfaces[i]];
      }
    }
    type = course.surfaces[step - 1];
  }
  return {
    id: index + 1, x: previous.x + previous.w + 45 + (recovery ? 0 : stage * 16) + (rules.gapExtra || 0) + random() * 30 + difficulty * 20,
    y: baseY, baseY, w, type, amplitude: type === 'moving' ? 18 + difficulty * 12 : 0,
    phase: random() * Math.PI * 2, sector, stage, collected: false,
    hasCollectible: step === 2 || step === 4, collectibleMascot: Math.floor(random() * 14),
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
