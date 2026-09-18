// Libreria dei blocchi di percorso. Ogni blocco è un tratto breve disegnato a mano;
// il generatore li concatena in base al livello di difficoltà e alle meccaniche del mondo.
//
// Per aggiungere contenuto basta aggiungere un blocco qui:
//   id     nome univoco
//   tier   livello minimo (0 = inizio partita, 4 = massimo)
//   steps  piattaforme dopo quella di recupero iniziale, ciascuna [quota, tipo, opzioni]
//     quota    0 = in alto, 1 = in basso, rispetto all'area giocabile
//     tipo     'n' normale, 'x' una meccanica qualsiasi del mondo corrente,
//              oppure una meccanica precisa: moving, sweep, soft, boost, crumble
//     opzioni  stringa con parole separate da spazi:
//              item (mascotte da raccogliere), wide/narrow (larghezza), short/long (distanza)
//
// Un blocco che usa una meccanica precisa compare solo nei mondi che la prevedono
// (vedi WORLD_RULES in course.js), dal livello in cui il mondo la sblocca.
// La quota finale viene sempre limitata dal dislivello massimo consentito.

export const CHUNKS = [
  // ── Livello 0: introduzione ──
  { id: 'passeggiata', tier: 0, steps: [[.5, 'n'], [.45, 'n', 'item'], [.55, 'x'], [.5, 'n', 'item'], [.45, 'x']] },
  { id: 'scala-su', tier: 0, steps: [[.62, 'n'], [.54, 'n', 'item'], [.46, 'x'], [.38, 'n', 'item'], [.44, 'x']] },
  { id: 'scala-giu', tier: 0, steps: [[.38, 'n'], [.46, 'x', 'item'], [.54, 'n'], [.62, 'x', 'item'], [.56, 'n']] },
  { id: 'onda', tier: 0, steps: [[.5, 'n'], [.62, 'x', 'item'], [.5, 'n'], [.38, 'x', 'item'], [.5, 'n'], [.6, 'x']] },
  { id: 'nuvole', tier: 0, steps: [[.5, 'n'], [.5, 'soft', 'item'], [.6, 'n'], [.44, 'soft'], [.52, 'n', 'item']] },
  { id: 'crollo', tier: 0, steps: [[.55, 'n'], [.46, 'crumble', 'item'], [.56, 'crumble'], [.46, 'crumble', 'item'], [.54, 'n']] },

  // ── Livello 1 ──
  { id: 'zigzag', tier: 1, steps: [[.6, 'n'], [.4, 'x', 'item'], [.62, 'n'], [.38, 'x'], [.6, 'n', 'item'], [.42, 'x']] },
  { id: 'picchiata', tier: 1, steps: [[.3, 'n'], [.42, 'x'], [.55, 'n', 'item'], [.68, 'x'], [.55, 'n'], [.42, 'x', 'item']] },
  { id: 'arco', tier: 1, steps: [[.62, 'n'], [.48, 'x'], [.36, 'n', 'item'], [.36, 'x'], [.48, 'n'], [.62, 'x', 'item']] },
  { id: 'doppietta', tier: 1, steps: [[.5, 'n'], [.5, 'x', 'item'], [.58, 'x'], [.46, 'n', 'item'], [.52, 'x']] },
  { id: 'trampolini', tier: 1, steps: [[.62, 'n'], [.66, 'boost', 'item'], [.4, 'n'], [.64, 'boost'], [.38, 'n', 'item'], [.5, 'x']] },
  { id: 'ingorgo', tier: 1, steps: [[.5, 'n'], [.5, 'sweep'], [.46, 'n', 'item'], [.54, 'sweep'], [.5, 'sweep', 'item'], [.48, 'n']] },
  { id: 'giostra', tier: 1, steps: [[.5, 'n'], [.44, 'moving', 'item'], [.56, 'moving'], [.48, 'moving', 'item'], [.52, 'n']] },

  // ── Livello 2 ──
  { id: 'altalena', tier: 2, steps: [[.7, 'n'], [.38, 'x', 'item'], [.7, 'n'], [.35, 'x'], [.68, 'n', 'item'], [.4, 'x']] },
  { id: 'soffitto', tier: 2, steps: [[.3, 'n', 'wide'], [.26, 'x', 'narrow item'], [.34, 'x', 'narrow'], [.28, 'n', 'item'], [.36, 'x']] },
  { id: 'pavimento', tier: 2, steps: [[.7, 'n', 'wide'], [.74, 'x', 'narrow item'], [.66, 'x', 'narrow'], [.72, 'n', 'item'], [.64, 'x']] },
  { id: 'salto-lungo', tier: 2, steps: [[.5, 'n'], [.5, 'n', 'long item'], [.52, 'x'], [.48, 'n', 'long'], [.5, 'x', 'item']] },
  { id: 'serpente', tier: 2, steps: [[.45, 'n'], [.58, 'x'], [.66, 'n', 'item'], [.54, 'x'], [.4, 'n'], [.32, 'x', 'item'], [.44, 'n']] },
  { id: 'nuvole-mobili', tier: 2, steps: [[.5, 'n'], [.44, 'soft', 'item'], [.56, 'moving'], [.48, 'soft'], [.52, 'moving', 'item']] },
  { id: 'cantiere', tier: 2, steps: [[.55, 'n'], [.45, 'moving', 'item'], [.6, 'sweep'], [.4, 'boost'], [.58, 'soft', 'item'], [.48, 'moving']] },

  // ── Livello 3 ──
  { id: 'precisione', tier: 3, steps: [[.5, 'n', 'narrow'], [.62, 'x', 'narrow item'], [.48, 'n', 'narrow'], [.36, 'x', 'narrow'], [.5, 'n', 'narrow item']] },
  { id: 'montagne-russe', tier: 3, steps: [[.7, 'n'], [.4, 'x', 'long item'], [.68, 'n'], [.34, 'x', 'long'], [.66, 'n', 'item'], [.38, 'x']] },
  { id: 'tutto-mondo', tier: 3, steps: [[.5, 'x'], [.58, 'x', 'item'], [.44, 'x'], [.6, 'x', 'item'], [.42, 'x'], [.52, 'x']] },
  { id: 'molla-e-crollo', tier: 3, steps: [[.62, 'n'], [.62, 'boost'], [.38, 'crumble', 'item'], [.6, 'crumble'], [.4, 'boost', 'item'], [.5, 'n']] },
  { id: 'nuvole-e-molle', tier: 3, steps: [[.5, 'soft'], [.62, 'boost', 'item'], [.36, 'soft'], [.6, 'boost'], [.44, 'sweep', 'item'], [.52, 'moving']] },

  // ── Livello 4 ──
  { id: 'caos', tier: 4, steps: [[.35, 'n'], [.68, 'x', 'long narrow item'], [.36, 'x', 'narrow'], [.7, 'n', 'long item'], [.32, 'x', 'narrow'], [.62, 'x']] },
  { id: 'filo-di-rasoio', tier: 4, steps: [[.5, 'n', 'narrow'], [.36, 'x', 'narrow long item'], [.66, 'x', 'narrow'], [.4, 'n', 'narrow long'], [.64, 'x', 'narrow item'], [.5, 'x', 'narrow']] },
  { id: 'brace', tier: 4, steps: [[.55, 'crumble'], [.4, 'moving', 'item'], [.62, 'crumble', 'narrow'], [.36, 'boost'], [.6, 'crumble', 'long item'], [.48, 'moving']] },
];
