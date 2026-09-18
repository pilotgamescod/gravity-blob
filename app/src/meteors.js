// Positions use seconds, independent of the display refresh rate.
export const METEOR_WARNING = 1.25;
export function createMeteor(id, now, width, height, playerY, random = Math.random) {
  const y = Math.max(160, Math.min(height - 160, playerY + (random() - .5) * 120));
  return { id, born: now, startX: width + 50, startY: y, vx: -(220 + random() * 55), vy: (random() - .5) * 34, radius: 15 + random() * 5 };
}
export function meteorPosition(meteor, elapsed) {
  const age = Math.max(0, elapsed - meteor.born - METEOR_WARNING);
  return { x: meteor.startX + meteor.vx * age, y: meteor.startY + meteor.vy * age, active: elapsed >= meteor.born + METEOR_WARNING };
}
export function meteorHitsPlayer(meteor, before, now, playerX, previousY, playerY, size) {
  const end = meteorPosition(meteor, now);
  if (!end.active) return false;
  const start = meteorPosition(meteor, before);
  // Sweep relative motion; the forgiving inner hitbox ignores transparent mascot edges.
  const ax = start.x - playerX - size / 2;
  const ay = start.y - previousY - size / 2;
  const bx = end.x - playerX - size / 2;
  const by = end.y - playerY - size / 2;
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(ax + t * dx, ay + t * dy) < meteor.radius + size * .28;
}
