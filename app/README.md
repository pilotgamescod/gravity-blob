# Gravity Blob

Avvio: `npm install`, poi `npm start` (Expo) o `npm run web`.

I quattro mondi condividono il comando di inversione della gravità. Ogni percorso è una catena di **blocchi**: brevi tratti disegnati a mano (`src/chunks.js`) che il generatore sceglie in base al livello di difficoltà e alle meccaniche del mondo.

- Livelli: ogni mondo parte dal livello 0 e sale fino al 4 (Nebulosa: primo salto dopo 10 secondi, poi ogni 12; gli altri mondi dopo 8 secondi, poi ogni 15). Ogni livello restringe le piattaforme, allunga le distanze e sblocca blocchi più difficili.
- Ogni blocco inizia con una piattaforma normale e larga, su cui riprendere il ritmo. Le prime quattro piattaforme della partita sono sempre normali.
- Lo stesso blocco non esce due volte di fila né più di una volta ogni tre; le meccaniche che non si vedono da un po' hanno la precedenza.

Meccaniche per mondo (tra parentesi il livello da cui compaiono):

- Nebulosa: solo piattaforme normali; la difficoltà viene dai cambi di quota e dalla velocità crescente.
- Asteroidi: piattaforme metalliche mobili, blocchi rosa eliminabili con un tocco (il tocco non inverte la gravità), nuvole che annullano il rimbalzo, molle verdi con spinta aumentata del 70%.
- Buco nero: gravità pulsante e meteore letali (dopo 6 secondi, con 1,25 secondi di avviso, traiettoria fissa, solo il nucleo uccide). Piattaforme mobili (1) e molle (3).
- Supernova: piattaforme ⋯ che spariscono subito dopo il primo rimbalzo, da entrambi i lati. Piattaforme mobili (2) e molle (3).

L'indicatore dei settori misura la distanza percorsa (2.400 unità per settore).

## Estendere il gioco

- **Nuovi tratti di percorso**: aggiungere un blocco a `CHUNKS` in `src/chunks.js`. Ogni passo è `[quota, tipo, opzioni]`; il tipo `'x'` significa "una meccanica qualsiasi del mondo corrente", così lo stesso blocco funziona ovunque. Il commento in cima al file spiega il formato.
- **Nuove combinazioni per mondo**: in `RULES` (`src/course.js`) la voce `mechanics` indica quali meccaniche usa ogni mondo e da quale livello.
- **Nuove meccaniche**: rimbalzo in `bounceVelocity` (`src/course.js`), disegno in `PlatformBlock` (`App.js`), collisioni nel ciclo di gioco di `App.js`.

Il parametro seed di `createCourse` permette di riprodurre un percorso per debug. `src/WorldScene.js` contiene gli scenari a livelli con parallasse. `App.js` integra fisica, collisioni, schermate e configurazione dei mondi.

## Verifiche

- `npm test`: riproducibilità, varietà, limiti geometrici su quattro dimensioni, validità dei blocchi, livelli, meccaniche per mondo e gravità.
- `npx expo export --platform web --output-dir /tmp/gravity-blob-preview`
- `npm run test:browser`: richiede Chrome installato e l'export precedente; verifica menu, avvio, morte, riprova e ritorno al menu. Screenshot in `/tmp/gravity-menu.png` e `/tmp/gravity-playing.png`.
- `npx expo export --platform ios`: verifica il bundle nativo; non sostituisce una prova su iPhone.

I record per mondo, la mascotte e l'ultimo mondo scelto vengono salvati in `localStorage` (`src/storage.js`) e restano sul dispositivo anche chiudendo il gioco. Il bilanciamento delle nuove meccaniche richiede playtest su dispositivo.

## Web app su iPhone

`public/index.html` sostituisce il template web di Expo: blocca lo zoom (pinch e doppio tocco) e aggiunge icona, manifest e meta tag per l'uso a schermo intero. Da Safari: Condividi → Aggiungi alla schermata Home.

Online su https://gravity-blob.nicoferretti-2.workers.dev (Cloudflare Workers, file statici). Per pubblicare una nuova versione: `npm run deploy` dalla cartella `app` (esporta in `dist` e carica con wrangler, configurato in `wrangler.jsonc`).

## Direzione artistica

Quattro illustrazioni originali in `assets/worlds/`, usate in partita e nei menu:

- Nebulosa: villaggio del bosco viola, case tra radici e lanterne.
- Asteroidi: borgo minerario sulle rocce fluttuanti, rame e arenaria.
- Buco nero: osservatori e salici luminosi nello spazio notturno.
- Supernova: villaggio di terracotta nella foresta di brace.

`WorldScene` fa scorrere copie alternate delle immagini con bordi specchiati; stelle, particelle e meteore restano su piani separati. La favicon usa direttamente la mascotte viola originale. Nessuna emoji nella descrizione del secondo mondo, nessuna legenda testuale delle superfici: nuvole, metallo, crepe e molle ne indicano il comportamento, con lo stesso disegno in tutti i mondi.
