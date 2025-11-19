export const HTML_PROMPT2 = `Istruzioni e Formato di Output:
Output Esclusivo: Rispondi solo con il codice HTML. Non includere spiegazioni, testo extra o introduzioni/conclusioni.

Struttura e Semantica:
- Utilizza tag HTML semantici corretti: titoli <h1>, <h2>, <h3>, ecc.; paragrafi <p>; liste <ul>/<ol>; tabelle <table>/<thead>/<tbody>/<tr>/<th>/<td>.
- Mantieni la gerarchia dei titoli originale del PDF.
- Mantieni l'ordine originale del contenuto.
- Non generare o ricreare immagini reali.
- Non aggiungere nuove informazioni, suggerimenti o soluzioni.

Layout e Stile:
- Mantieni il layout a due colonne dove presente nel PDF.
- Assegna classi CSS significative (es. class="nome-sezione") a sezioni ed elementi per facilitare la stilizzazione.
- Includi una sezione <style></style> all'interno di <head> per definire uno stile gradevole, pulito e coerente (font, spaziatura, colori neutri).
- Il file HTML prodotto deve essere autosufficiente (CSS inline in <head>).

Esercizi:
- NON risolvere NESSUN esercizio. Riportali fedelmente.
- Ogni esercizio deve essere contenuto in una <section> con id esatto: id="exercise-n", dove n è il numero progressivo dell'esercizio nel documento (1,2,3,...).
- Mantieni i testi originali (titoli, enunciati, opzioni, ecc.) senza aggiungere, omettere o riformulare contenuti.

Immagini:
- NON includere immagini reali: sostituisci ogni immagine con un placeholder centrato del formato esatto: [IMAGE_X], dove X è l'indice progressivo dell'immagine nel PDF (la prima immagine è [IMAGE_1], ecc.).
- Inserisci il placeholder [IMAGE_X] dentro un contenitore <div class="image-placeholder"> centrato.
- Fai il div della dimensione adeguata in modo da contenere tutta l'immagine e non coprire altre parti del layout.
Metadati delle immagini:
Ti fornirò una lista di immagini estratte dal PDF in formato JSON, ciascuna con:
- page: numero della pagina
- x, y: coordinate del punto superiore sinistro dell'immagine nel PDF
- width, height: dimensioni effettive dell'immagine
- index: posizione progressiva nel documento

Uso dei metadati:
1. Le immagini devono essere inserite nell’HTML come placeholder [IMAGE_X] nello stesso punto logico dedotto dal layout originale.
2. Usa page, x e y per capire l'ordine verticale degli elementi:
   - Se un'immagine ha y più basso, si trova più in basso nella pagina.
   - Ordina il contenuto PDF rispettando questa verticalità.
3. Usa x per capire se l'immagine era nella colonna sinistra o destra:
   - x < 50% della larghezza pagina => colonna sinistra.
   - x > 50% della larghezza pagina => colonna destra.
4. Il placeholder deve rappresentare l’immagine nelle dimensioni proporzionali all’originale:
   - Crea il <div class="image-placeholder"> con width e height proporzionali ai metadati.
5. Quando un'immagine è vicina (in termini di y) a una parte di testo dell’esercizio, inserisci il placeholder in corrispondenza esatta nell’HTML.
6. Le immagini vengono fornite in ordine, ma usa le coordinate per posizionarle nel punto giusto della ricostruzione HTML.


Riconoscimento della tipologia di esercizio:
- Identifica automaticamente la tipologia dell'esercizio basandoti su parole chiave presenti nel titolo o nell'enunciato.
- Aggiungi alla sezione dell'esercizio un attributo className che includa la categoria riconosciuta.
  Esempio: <section id="exercise-1" class="exercise exercise-completamento">.
- Le categorie principali da riconoscere sono:
  - "completamento" - se compaiono termini come "completa", "riempi", "inserisci", "scrivi", "determina","sostituisci".
  - "scelta-multipla" - se compaiono termini come "scegli", "seleziona", "indica la risposta corretta", "cerchia".
  - "collegamento" - se compaiono termini come "abbina", "collega", "unisci", "metti in relazione".
  - "vero-falso" - se compaiono termini come "vero o falso", "V/F", "se è vero segna".
  - "ordinamento" - se compaiono termini come "metti in ordine", "ordina", "riordina".
  - "domanda-aperta" - se compaiono parole come "spiega", "descrivi", "rispondi", "argomenta".
  - "individuazione" - se compaiono parole come "individua", "sottolinea".
  - "scrittura" - se compaiono parole come "scrivi", "scrivere".
  - "calcolo" - se compaiono parole come "calcolo", "addizione", "sottrazione", "moltiplicazione", "divisione".
  - "disegno" - se compaiono parole come "disegno", "rappresentazione", "costruisci", "modella", "crea".
    Se nessuna categoria è riconosciuta, assegna class="exercise exercise-generico".
  
In ogni caso, concentrati anche sull'identificazione delle singole opzioni o sottosezioni degli esercizi.
Identificale e marcale con una classe univoca che faccia riferimento all'esercizio e al fatto che sia un'opzione o una sottosezione di esso

Separa con un a capo ogni esercizio in modo da rendere l'html piu leggibile

Nel caso di un esercizio identificato come di "completamento" o di "scrittura" o di "domanda-aperta"
  1. Per ogni immagine ([IMAGE_X]) presente all'interno della stessa sezione esercizio, inserire subito dopo il placeholder dell'immagine un campo di completamento specifico :<input type="text" class="image-input"/>.
  2. Se c'è uno spazio per il completamento anche senza immagine inserisci sempre: <input type="text" class="image-input"/>.
  3. Se l'enunciato richiede più spazi (es. "completa le seguenti parole:" e poi lista di immagini o frasi), crea tanti<input type="text" class="image-input"/> quanti necessari, cercando di rispettare l'ordine del contenuto originale. Non inventare elementi: crea spazi pari al numero di item elencati.
- Se l'esercizio non contiene parole chiave di completamento, NON inserire spazi di completamento aggiuntivi.

Liste, Tabelle, Esercizi a più parti:
- Se un esercizio è composto da più sottopunti (a), (b), (c) e il titolo richiede completamento, aggiungi dopo ogni sottopunto che rappresenta un elemento da completare un <input type="text" class="image-input"/>.

Non inserire dei paragrafi all'inizio e alla fine con \`\`\`html e \`\`\`.
Rendi il codice HTML indentato correttamente.
Fine delle istruzioni. Genera il file HTML seguendo esattamente queste regole.`;
