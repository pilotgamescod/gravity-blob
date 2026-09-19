// Eruzioni di Supernova: palle di fuoco sparate in verticale dal basso o dall'alto.
// Una colonna luminosa sul bordo le annuncia; la colonna scorre insieme al mondo.
// Posizioni in secondi, indipendenti dalla frequenza dello schermo.

export const ERUPTION_WARNING = 1.1;
export const ERUPTION_SPEED = 700;      // px/s
export const ERUPTION_RADIUS = 16;

// Prima eruzione e pausa fra un'eruzione e l'altra, in secondi, per livello.
export function eruptionGap(tier, random = Math.random) {
  return Math.max(2.4, 5.5 - tier * .8) + random() * 1.5;
}

// scrollSpeed: velocità del mondo in px al secondo al momento del lancio.
export function createEruption(id, now, playerX, height, scrollSpeed, random = Math.random) {
  const fromTop = random() < .5;
  // La colonna parte abbastanza avanti da arrivare al giocatore mentre la palla attraversa lo schermo.
  const x = playerX + 150 + scrollSpeed * ERUPTION_WARNING + random() * 90;
  return { id, born: now, x, vx: -scrollSpeed, fromTop, startY: fromTop ? -40 : height + 40, vy: fromTop ? ERUPTION_SPEED : -ERUPTION_SPEED, radius: ERUPTION_RADIUS };
}

export function eruptionPosition(e, elapsed) {
  const age = elapsed - e.born;
  const flight = Math.max(0, age - ERUPTION_WARNING);
  return { x: e.x + e.vx * age, y: e.startY + e.vy * flight, active: age >= ERUPTION_WARNING };
}

export function eruptionHitsPlayer(e, elapsed, playerX, playerY, size) {
  const p = eruptionPosition(e, elapsed);
  if (!p.active) return false;
  return Math.hypot(p.x - playerX - size / 2, p.y - playerY - size / 2) < e.radius + size * .28;
}

export function eruptionNearMiss(e, elapsed, playerX, playerY, size) {
  const p = eruptionPosition(e, elapsed);
  if (!p.active) return false;
  return Math.hypot(p.x - playerX - size / 2, p.y - playerY - size / 2) < e.radius + size * .28 + 36;
}

export function eruptionGone(e, elapsed, height) {
  const p = eruptionPosition(e, elapsed);
  return p.x < -60 || (p.active && (p.y < -80 || p.y > height + 80));
}
