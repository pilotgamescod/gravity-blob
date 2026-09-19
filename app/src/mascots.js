// Mascotte: rarità, dove si trovano, quante raccoglierne per giocarci e abilità.
// L'ordine corrisponde alle immagini in MASCOTS (App.js).
//
// Abilità: valori che il ciclo di gioco legge da `mascotTraits(i)`; quelli non indicati
// restano ai valori di DEFAULT_TRAITS.

export const RARITY = {
  comune: { label: 'Comune', need: 5, color: '#8d8aa0' },
  rara: { label: 'Rara', need: 3, color: '#3f8fd8' },
  leggendaria: { label: 'Leggendaria', need: 1, color: '#d79a1e' },
};

// Peso di ogni rarità nella scelta della mascotte da raccogliere, per mondo.
export const SPAWN_WEIGHTS = {
  nebulosa: { comune: 10, rara: 1, leggendaria: 0 },
  asteroidi: { comune: 8, rara: 4, leggendaria: 0 },
  buconero: { comune: 6, rara: 4, leggendaria: 1 },
  supernova: { comune: 5, rara: 4, leggendaria: 1.5 },
};

export const DEFAULT_TRAITS = {
  bounce: 1,          // altezza dei rimbalzi
  gravity: 1,         // forza di gravità
  magnet: 0,          // px in più per raccogliere le mascotte
  edge: 0,            // px di tolleranza sul bordo per il combo
  shield: 0,          // meteore assorbite per partita
  itemPoints: 10,     // punti per mascotte raccolta (prima del moltiplicatore)
  startCombo: 0,      // combo iniziale
  softBounce: 0,      // rimbalzo sulle nuvole (0 = nessuno)
  boost: 1,           // spinta delle molle
  challengeBonus: 1,  // moltiplicatore del bonus sfida
  rush: 1,            // quota di accelerazione subita durante la corsa
  forgive: 0,         // combo persi perdonati per partita
};

export const MASCOT_INFO = [
  { name: 'Blob viola', rarity: 'comune', starter: true, ability: 'Equilibrato', description: 'Il compagno di sempre: nessuna sorpresa.', traits: {} },
  { name: 'Triangolo rosa', rarity: 'comune', ability: 'Saltellante', description: 'Rimbalzi più alti del 10%.', traits: { bounce: 1.1 } },
  { name: 'Uovo arancione', rarity: 'comune', ability: 'Calamita', description: 'Raccoglie le mascotte anche da più lontano.', traits: { magnet: 30 } },
  { name: 'Cubo blu', rarity: 'comune', ability: 'Pesante', description: 'Più gravità e rimbalzi bassi: preciso nei tratti stretti.', traits: { gravity: 1.1, bounce: .92 } },
  { name: 'Goccia menta', rarity: 'rara', ability: 'Aderente', description: 'Atterrare vicino al bordo non rompe il combo.', traits: { edge: 12 } },
  { name: 'Diamante celeste', rarity: 'leggendaria', ability: 'Scudo', description: 'Sopravvive a una meteora per partita.', traits: { shield: 1 } },
  { name: 'Blob giallo', rarity: 'comune', ability: 'Fortunato', description: 'Ogni mascotte raccolta vale 15 punti invece di 10.', traits: { itemPoints: 15 } },
  { name: 'Stella rossa', rarity: 'leggendaria', ability: 'Scintilla', description: 'Parte con il combo a x2.', traits: { startCombo: 4 } },
  { name: 'Uovo verde', rarity: 'comune', ability: 'Galleggiante', description: 'Gravità più debole: salti più lenti.', traits: { gravity: .92, bounce: .96 } },
  { name: 'Cuore pesca', rarity: 'leggendaria', ability: 'Seconda possibilità', description: 'Il primo combo perso della partita viene perdonato.', traits: { forgive: 1 } },
  { name: 'Nuvola lilla', rarity: 'rara', ability: 'Nuvoletta', description: 'Le nuvole la fanno rimbalzare un po\'.', traits: { softBounce: .55 } },
  { name: 'Pentagono ciano', rarity: 'rara', ability: 'Superbalzo', description: 'Le molle spingono il 15% in più.', traits: { boost: 1.15 } },
  { name: 'Goccia lime', rarity: 'rara', ability: 'Sfidante', description: 'Il bonus dei tratti sfida raddoppia.', traits: { challengeBonus: 2 } },
  { name: 'Esagono pesca', rarity: 'leggendaria', ability: 'Sangue freddo', description: 'Durante la corsa accelera la metà.', traits: { rush: .5 } },
];

export function mascotTraits(index) {
  return { ...DEFAULT_TRAITS, ...(MASCOT_INFO[index]?.traits || {}) };
}

export function mascotNeed(index) {
  const info = MASCOT_INFO[index];
  return info.starter ? 0 : RARITY[info.rarity].need;
}

export function isMascotUnlocked(index, album = {}) {
  return (album[index] || 0) >= mascotNeed(index);
}

// Mondi in cui la mascotte può comparire.
export function mascotWorlds(index) {
  const rarity = MASCOT_INFO[index].rarity;
  return Object.keys(SPAWN_WEIGHTS).filter(w => SPAWN_WEIGHTS[w][rarity] > 0);
}

// Sceglie quale mascotte mettere su una piattaforma, pesando la rarità per mondo.
export function pickMascot(worldId, random) {
  const weights = SPAWN_WEIGHTS[worldId] || SPAWN_WEIGHTS.nebulosa;
  const total = MASCOT_INFO.reduce((sum, m) => sum + weights[m.rarity], 0);
  let roll = random() * total;
  for (let i = 0; i < MASCOT_INFO.length; i++) {
    roll -= weights[MASCOT_INFO[i].rarity];
    if (roll < 0) return i;
  }
  return 0;
}

// Aggiunge le mascotte raccolte in una partita all'album. Restituisce il nuovo album,
// quelle trovate per la prima volta e quelle appena diventate giocabili.
export function addToAlbum(album, collected) {
  const next = { ...album };
  for (const i of collected) next[i] = (next[i] || 0) + 1;
  const firstTime = [...new Set(collected)].filter(i => !(album[i] > 0));
  const unlocked = [...new Set(collected)].filter(i => !isMascotUnlocked(i, album) && isMascotUnlocked(i, next));
  return { album: next, firstTime, unlocked };
}
