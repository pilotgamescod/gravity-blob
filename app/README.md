# Gravity Blob

Avvio: `npm install`, poi `npm start` (Expo) o `npm run web`.

I quattro mondi condividono il comando di inversione della gravità, ma hanno percorsi e meccaniche differenti:

- Nebulosa: introduzione di 10 secondi, poi quattro gradi di difficoltà a intervalli di 12 secondi. Sequenze con cambi di quota marcati, velocità crescente e piattaforme più strette e distanti, alternate a piattaforme di recupero.
- Asteroidi: piattaforme metalliche mobili, blocchi rosa friabili eliminabili con un tocco, nuvole che annullano il rimbalzo e piattaforme verdi a molla con spinta aumentata del 70%. Il tocco sui blocchi friabili li rimuove senza invertire la gravità; gli altri tocchi invertono la gravità.
- Buco nero: gravità pulsante, spazio con parallasse legata alla distanza e meteore letali. Le meteore iniziano dopo 6 secondi, con 1,25 secondi di avviso; seguono una traiettoria fissa, non inseguono il giocatore. La scia è decorativa, solo il nucleo causa collisioni.
- Supernova: piattaforme ⋯ che spariscono al primo contatto, subito dopo aver dato il rimbalzo, da entrambi i lati.

Ogni partita genera un nuovo percorso. Le sequenze di sei piattaforme alternano profili di quota, con una piattaforma normale all'inizio di ogni sequenza. La difficoltà aumenta ogni dodici piattaforme generate, con larghezza minima e velocità massima limitate. L'indicatore dei settori misura la distanza percorsa (2.400 unità per settore).

## Estendere il gioco

`src/course.js` contiene regole, sequenze, generatore deterministico e funzioni di movimento. Le quote dei pattern sono normalizzate rispetto all'area giocabile; aggiungere profili a `RULES[id].patterns` per creare nuove sequenze. Il parametro seed di `createCourse` permette di riprodurre un percorso per debug. `src/WorldScene.js` contiene gli scenari a livelli con parallasse. `App.js` integra fisica, collisioni, schermate e configurazione dei mondi.

## Verifiche

- `npm test`: riproducibilità, varietà, limiti geometrici su quattro dimensioni, introduzione alle meccaniche e gravità.
- `npx expo export --platform web --output-dir /tmp/gravity-blob-preview`
- `npm run test:browser`: richiede Chrome installato e l'export precedente; verifica menu, avvio, morte, riprova e ritorno al menu. Screenshot in `/tmp/gravity-menu.png` e `/tmp/gravity-playing.png`.
- `npx expo export --platform ios`: verifica il bundle nativo; non sostituisce una prova su iPhone.

I record per mondo, la mascotte e l'ultimo mondo scelto vengono salvati in `localStorage` (`src/storage.js`) e restano sul dispositivo anche chiudendo il gioco. Il bilanciamento delle nuove meccaniche richiede playtest su dispositivo.

## Web app su iPhone

`public/index.html` sostituisce il template web di Expo: blocca lo zoom (pinch e doppio tocco) e aggiunge icona, manifest e meta tag per l'uso a schermo intero. Da Safari: Condividi → Aggiungi alla schermata Home.

Deploy su Cloudflare Pages: comando di build `npx expo export --platform web`, cartella di output `dist`, directory radice `app`.

## Direzione artistica

Quattro illustrazioni originali in `assets/worlds/`, usate in partita e nei menu:

- Nebulosa: villaggio del bosco viola, case tra radici e lanterne.
- Asteroidi: borgo minerario sulle rocce fluttuanti, rame e arenaria.
- Buco nero: osservatori e salici luminosi nello spazio notturno.
- Supernova: villaggio di terracotta nella foresta di brace.

`WorldScene` fa scorrere copie alternate delle immagini con bordi specchiati; stelle, particelle e meteore restano su piani separati. La favicon usa direttamente la mascotte viola originale. Nessuna emoji nella descrizione del secondo mondo, nessuna legenda testuale delle superfici: nuvole, metallo, crepe e molle ne indicano il comportamento.
