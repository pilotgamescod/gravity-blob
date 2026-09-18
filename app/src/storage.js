// Salvataggio locale dei progressi. Sul web (e nella web app aggiunta alla
// schermata Home di iPhone) usa localStorage; altrove non salva nulla.

const KEY = 'gravity-blob:progress:v1';

function getStore() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadProgress() {
  const store = getStore();
  if (!store) return null;
  try {
    const raw = store.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProgress(progress) {
  const store = getStore();
  if (!store) return;
  try {
    store.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Spazio esaurito o storage bloccato: il gioco continua senza salvare.
  }
}

// Chiede al browser di non cancellare i dati in caso di poco spazio.
export function requestPersistentStorage() {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  } catch {
    // Non supportato.
  }
}
