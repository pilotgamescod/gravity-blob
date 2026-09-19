// Eventi di partita: danno ritmo alternando momenti di tensione e di respiro.
// Il regista decide quando arriva il prossimo evento e quale; App.js ne applica gli effetti.
//
// Per aggiungere un evento: una voce in EVENTS, il suo nome nei mondi di WORLD_EVENTS
// e l'effetto nel ciclo di gioco di App.js (cercare `event?.type`).

export const EVENTS = {
  sciame: { title: 'Sciame di meteore', hint: 'Schivale: sfiorarle vale punti', kind: 'tension', duration: 9 },
  corsa: { title: 'Corsa', hint: 'Più veloce · punti tempo doppi', kind: 'tension', duration: 7 },
  sfida: { title: 'Tratto sfida', hint: 'Piattaforme dorate: superale senza perdere il combo', kind: 'tension', duration: null },
  leggera: { title: 'Gravità leggera', hint: 'Salti lenti e morbidi', kind: 'relief', duration: 8 },
  mascotte: { title: 'Pioggia di mascotte', hint: 'Una su ogni piattaforma', kind: 'relief', duration: 8 },
};

export const WORLD_EVENTS = {
  nebulosa: ['corsa', 'sfida', 'leggera', 'mascotte'],
  asteroidi: ['sciame', 'corsa', 'sfida', 'leggera', 'mascotte'],
  buconero: ['sciame', 'corsa', 'sfida', 'mascotte'],
  supernova: ['sciame', 'corsa', 'sfida', 'leggera', 'mascotte'],
};

export const FIRST_EVENT = 18;          // secondi prima del primo evento
export const EVENT_GAP = [16, 24];      // pausa fra la fine di un evento e l'inizio del successivo
export const EVENT_WARNING = 2;         // secondi di preavviso
export const SFIDA_TIMEOUT = 25;        // la sfida si chiude comunque dopo questo tempo

export const LOW_GRAVITY = .6;
export const LOW_GRAVITY_BOUNCE = .8;
export const RUSH_SPEED = 1.2;

export function createDirector(worldId, random = Math.random) {
  return { worldId, random, nextAt: FIRST_EVENT, pending: null, active: null, last: null };
}

// Alterna tensione e respiro, senza ripetere lo stesso evento due volte di fila.
function pickEvent(director) {
  const pool = WORLD_EVENTS[director.worldId] || [];
  const wantKind = director.last && EVENTS[director.last].kind === 'tension' ? 'relief' : 'tension';
  let options = pool.filter(t => t !== director.last && EVENTS[t].kind === wantKind);
  if (!options.length) options = pool.filter(t => t !== director.last);
  if (!options.length) options = pool;
  return options[Math.floor(director.random() * options.length)];
}

// Avanza il regista. Restituisce 'warning', 'start', 'end' o null.
export function updateDirector(director, elapsed) {
  if (director.active) {
    if (elapsed >= director.active.endsAt) {
      endEvent(director, elapsed);
      return 'end';
    }
    return null;
  }
  if (!director.pending && elapsed >= director.nextAt - EVENT_WARNING) {
    const type = pickEvent(director);
    if (!type) return null;
    director.pending = type;
    return 'warning';
  }
  if (director.pending && elapsed >= director.nextAt) {
    const type = director.pending;
    const duration = EVENTS[type].duration ?? SFIDA_TIMEOUT;
    director.active = { type, startedAt: elapsed, endsAt: elapsed + duration };
    director.pending = null;
    director.last = type;
    return 'start';
  }
  return null;
}

export function endEvent(director, elapsed) {
  director.active = null;
  director.nextAt = elapsed + EVENT_GAP[0] + director.random() * (EVENT_GAP[1] - EVENT_GAP[0]);
}

// Avanzamento dell'evento attivo da 0 a 1 (la sfida non ha una durata fissa: null).
export function eventProgress(director, elapsed) {
  const a = director.active;
  if (!a || EVENTS[a.type].duration == null) return null;
  return Math.min(1, (elapsed - a.startedAt) / (a.endsAt - a.startedAt));
}
