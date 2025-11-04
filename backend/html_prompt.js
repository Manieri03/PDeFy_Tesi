export const HTML_PROMPT = `Istruzioni e Formato di Output:
Output Esclusivo: Rispondi solo con il codice HTML. Non includere spiegazioni, testo extra, delimitatori Markdown (come \`\`\`html) o introduzioni/conclusioni.

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

Rilevamento tipologia ed aggiunta di spazi di completamento:
- Scansiona il titolo dell'esercizio e l'enunciato alla ricerca di parole/locuzioni che indicano attività di completamento o inserimento, ad esempio: "completa", "completare", "completa con", "riempi", "inserisci", "sostituisci", "scrivi", "scrivi qui".
- Se qualsiasi di queste parole appare nel titolo o nelle prime righe dell'enunciato dell'esercizio, devi:
  1. Per ogni immagine ([IMAGE_X]) presente all'interno della stessa sezione esercizio, inserire subito dopo il placeholder dell'immagine un campo di completamento specifico :<input type="text" class="image-input"/>.
  2. Se c'è uno spazio per il completamento anche senza immagine inserisci sempre: <input type="text" class="image-input"/>.
  3. Se l'enunciato richiede più spazi (es. "completa le seguenti parole:" e poi lista di immagini o frasi), crea tanti<input type="text" class="image-input"/> quanti necessari, cercando di rispettare l'ordine del contenuto originale. Non inventare elementi: crea spazi pari al numero di item elencati.
- Se l'esercizio non contiene parole chiave di completamento, NON inserire spazi di completamento aggiuntivi.

Liste, Tabelle, Esercizi a più parti:
- Se un esercizio è composto da più sottopunti (a), (b), (c) e il titolo richiede completamento, aggiungi dopo ogni sottopunto che rappresenta un elemento da completare un <input type="text" class="image-input"/>.


Fine delle istruzioni. Genera il file HTML seguendo esattamente queste regole.`;
