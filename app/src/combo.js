// Combo: atterraggi puliti di fila su piattaforme nuove, senza saltarne nessuna.
// Atterrare sul bordo (centro del blob fuori dalla piattaforma) o saltarne una azzera il combo.
// Il moltiplicatore vale per tutti i punti della partita.
//
// COMBO_STEPS[i] = atterraggi di fila necessari per il moltiplicatore i + 1.
export const COMBO_STEPS = [0, 4, 10, 18, 30];

export function comboMultiplier(count) {
  let m = 0;
  while (m < COMBO_STEPS.length && count >= COMBO_STEPS[m]) m++;
  return m;
}

// Quanto manca al prossimo moltiplicatore, da 0 a 1 (1 al massimo).
export function comboProgress(count) {
  const m = comboMultiplier(count);
  if (m >= COMBO_STEPS.length) return 1;
  const from = COMBO_STEPS[m - 1], to = COMBO_STEPS[m];
  return (count - from) / (to - from);
}

export function createCombo() {
  return { count: 0, best: 0, multiplier: 1, boostGrace: false, resets: 0 };
}

// Primo contatto con una piattaforma. centered: il centro del blob è sopra la piattaforma.
// Restituisce 'up' se il moltiplicatore è salito, 'edge' se un atterraggio sul bordo
// ha rotto un combo in corso, altrimenti null.
export function landCombo(combo, platform, centered = true) {
  if (platform.touched) return null;
  platform.touched = true;
  // Una molla può lanciare oltre la piattaforma successiva: quella non rompe il combo.
  combo.boostGrace = platform.type === 'boost';
  if (!centered) {
    const broke = combo.count > 0;
    combo.resets++;
    combo.count = 0;
    combo.multiplier = 1;
    return broke ? 'edge' : null;
  }
  const before = combo.multiplier;
  combo.count++;
  combo.best = Math.max(combo.best, combo.count);
  combo.multiplier = comboMultiplier(combo.count);
  return combo.multiplier > before ? 'up' : null;
}

// Una piattaforma è uscita alle spalle del giocatore. Restituisce true se il combo si è rotto
// con un moltiplicatore attivo (per mostrarlo a schermo).
export function passCombo(combo, platform) {
  if (platform.passed) return false;
  platform.passed = true;
  if (platform.touched) return false;
  if (combo.boostGrace) {
    combo.boostGrace = false;
    return false;
  }
  const hadMultiplier = combo.multiplier > 1;
  combo.resets++;
  combo.count = 0;
  combo.multiplier = 1;
  return hadMultiplier;
}
