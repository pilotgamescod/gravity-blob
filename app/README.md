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

## Eventi

Dal diciottesimo secondo arriva un evento ogni 16–24 secondi, annunciato 2 secondi prima in alto. Gli eventi alternano tensione e respiro e non si ripetono due volte di fila (`src/events.js`):

- **Sciame di meteore** (tensione, 9 s): meteore ogni 1,1–1,6 secondi, anche fuori da Buco nero. Chi le sfiora prende il bonus "Di un soffio".
- **Corsa** (tensione, 7 s): velocità +20%, punti tempo doppi.
- **Tratto sfida** (tensione): arriva un blocco del livello successivo con piattaforme dorate. Superarlo senza perdere il combo vale 50 punti per il moltiplicatore.
- **Gravità leggera** (respiro, 8 s): gravità al 60%, salti più lenti.
- **Pioggia di mascotte** (respiro, 8 s): una mascotte su ogni piattaforma nuova.

Nebulosa non ha lo sciame, Buco nero non ha la gravità leggera (ha già la sua gravità pulsante). Con il simulatore della fisica, corsa e gravità leggera restano superabili senza perdere il combo anche se durano tutta la partita.

## Album e mascotte

Ogni mascotte raccolta entra nell'album (salvato sul dispositivo). Le mascotte hanno tre rarità e si trovano in mondi diversi; per giocarci bisogna raccoglierle abbastanza volte (`src/mascots.js`):

- **Comuni** (5 raccolte): Triangolo rosa, Uovo arancione, Cubo blu, Blob giallo, Uovo verde. Blob viola è giocabile da subito.
- **Rare** (3 raccolte, rare in Nebulosa, frequenti da Asteroidi): Goccia menta, Nuvola lilla, Pentagono ciano, Goccia lime.
- **Leggendarie** (1 raccolta, solo in Buco nero e Supernova): Diamante celeste, Stella rossa, Cuore pesca, Esagono pesca.

Ognuna ha una piccola abilità: rimbalzi più alti o più bassi, gravità diversa, calamita per le mascotte, tolleranza sul bordo, scudo contro una meteora, mascotte da 15 punti, partenza a x2, un combo perso perdonato, rimbalzo sulle nuvole, molle più forti, bonus sfida doppio, meno accelerazione nella corsa. Le abilità sono valori in `MASCOT_INFO[i].traits`, letti dal ciclo di gioco.

Nell'album le mascotte mai trovate sono sagome; la scheda in alto mostra abilità, raccolte mancanti e mondi in cui cercarle. A fine partita compaiono le nuove trovate e quelle appena diventate giocabili. Una mascotte scelta prima di questa versione che non risulta ancora sbloccata torna a Blob viola.

## Suoni e musica

Effetti sintetizzati al momento con la Web Audio API (`src/sound.js`), senza file audio. Ogni mondo ha una sua tonalità e un suo timbro. Il primo atterraggio su ogni piattaforma suona una nota di una scala pentatonica che sale con il combo; poi ci sono suoni per inversione, molle, nuvole, crolli, raccolta, moltiplicatore, combo perso, meteore (avviso, passaggio ravvicinato, scudo), eventi, sfida, fine partita, record e nuove mascotte giocabili.

**Musica** (`src/music.js`): un brano per mondo, generato in tempo reale e definito come dati (tempo, tonalità, accordi, ritmi, melodia di 4 battute).

- Nebulosa: sognante, Do maggiore, 92 bpm. Asteroidi: saltellante, Re misolidio, 112 bpm, con legnetti. Buco nero: misterioso, La minore, 78 bpm, con battito cardiaco. Supernova: energico, Mi minore, 128 bpm, cassa dritta.
- In partita gli strati si aggiungono salendo di livello (pad e basso, poi arpeggio, melodia, piatti, cassa, rullante). Durante gli eventi di tensione entra la batteria; durante quelli di respiro la musica si attenua con un filtro.
- Nel menu suona una versione tranquilla del mondo selezionato; a fine partita la musica sfuma.

- Su iPhone l'audio si attiva al primo tocco e, come per ogni pagina web, rispetta l'interruttore silenzioso.
- Nel menu, in alto a destra: ♪ attiva o spegne la musica, FX gli effetti. Le scelte sono salvate.
- Nell'app nativa (Expo Go) i suoni non ci sono: le funzioni non fanno nulla senza Web Audio.

## Sblocco dei mondi

Asteroidi si sblocca con 300 punti in Nebulosa, Buco nero con 450 in Asteroidi, Supernova con 600 in Buco nero: con un gioco medio servono circa 30–60 secondi nel mondo precedente, con combo alti meno. Un mondo sbloccato resta sbloccato; i salvataggi precedenti mantengono i mondi aperti con le vecchie soglie (40/60/80).

## Punti e combo

- Si guadagnano punti col tempo (circa 6 al secondo) e raccogliendo mascotte (10 punti).
- **Combo**: ogni atterraggio pulito su una piattaforma nuova lo fa salire. Si azzera se si salta una piattaforma o si atterra sul bordo, cioè con il centro del blob fuori dalla piattaforma (messaggi "Combo persa" e "Sul bordo!"). Una molla perdona una piattaforma saltata subito dopo.
- **Moltiplicatore**: x2 a 4 atterraggi di fila, x3 a 10, x4 a 18, x5 a 30 (`COMBO_STEPS` in `src/combo.js`). Vale per tutti i punti.
- **Di un soffio**: in Buco nero, una meteora che passa vicina senza colpire vale 5 punti per il moltiplicatore.
- Il combo migliore compare a fine partita e nel profilo, ed è salvato con gli altri progressi.

Taratura fatta con un simulatore della fisica: un giocatore che pensa solo a sopravvivere salta circa una piattaforma su tre e atterra sul bordo nel 35% dei casi (combo medio intorno a 1); uno preciso può tenere il combo per tutta la partita in ogni mondo.

L'indicatore dei settori misura la distanza percorsa (2.400 unità per settore).

## Estendere il gioco

- **Nuovi tratti di percorso**: aggiungere un blocco a `CHUNKS` in `src/chunks.js`. Ogni passo è `[quota, tipo, opzioni]`; il tipo `'x'` significa "una meccanica qualsiasi del mondo corrente", così lo stesso blocco funziona ovunque. Il commento in cima al file spiega il formato.
- **Nuove combinazioni per mondo**: in `RULES` (`src/course.js`) la voce `mechanics` indica quali meccaniche usa ogni mondo e da quale livello.
- **Nuove meccaniche**: rimbalzo in `bounceVelocity` (`src/course.js`), disegno in `PlatformBlock` (`App.js`), collisioni nel ciclo di gioco di `App.js`.

Il parametro seed di `createCourse` permette di riprodurre un percorso per debug. `src/WorldScene.js` contiene gli scenari a livelli con parallasse. `App.js` integra fisica, collisioni, schermate e configurazione dei mondi.

## Verifiche

- `npm test`: riproducibilità, varietà, limiti geometrici su quattro dimensioni, validità dei blocchi, livelli, meccaniche per mondo, combo, passaggi ravvicinati, eventi, tratti sfida, album e rarità delle mascotte e gravità.
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
