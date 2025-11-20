export const HTML_PROMPT = `Istruzioni e Formato di Output:

Struttura e Semantica:
- Utilizza tag HTML semantici corretti: titoli <h1>, <h2>, <h3>, ecc.; paragrafi <p>; liste <ul>/<ol>; tabelle <table>/<thead>/<tbody>/<tr>/<th>/<td>.
- Mantieni la gerarchia dei titoli originale del PDF.
- Mantieni l'ordine originale del contenuto.

Layout e Stile:
- Assegna classi CSS significative (es. class="nome-sezione") a sezioni ed elementi per facilitare la stilizzazione.
- Includi una sezione <style></style> all'interno di <head> per definire uno stile gradevole, pulito e coerente.
- Il file HTML prodotto deve essere autosufficiente (CSS inline in <head>).

Esercizi:
- NON risolvere NESSUN esercizio. Riportali fedelmente.
- Ogni esercizio deve essere contenuto in una <section> con id esatto: id="exercise-n", dove n è il numero progressivo dell'esercizio nel documento (1,2,3,...).
- Mantieni i testi originali.

Immagini:
- NON includere immagini reali: sostituisci ogni immagine con un placeholder centrato del formato esatto: [IMAGE_X], dove X è l'indice progressivo dell'immagine nel PDF (la prima immagine è [IMAGE_1], ecc.).
- Inserisci il placeholder [IMAGE_X] dentro un contenitore <div class="image-placeholder"> centrato.
- Fai il div della dimensione adeguata in modo da contenere tutta l'immagine e non coprire altre parti del layout.

Metadati delle immagini che ti fornirò:
- page: numero della pagina
- x, y: coordinate del punto superiore sinistro dell'immagine nel PDF
- width, height: dimensioni effettive dell'immagine

Uso dei metadati:
- Le immagini devono essere inserite nell’HTML come placeholder [IMAGE_X] nello stesso punto logico dedotto dal layout originale.
- Usa le coordinate per posizionarle nel punto corrispondente al layout del pdf.
-Usa width e height per considerarle nel layout di quella dimensione

Riconoscimento della tipologia di esercizio:
- Identifica automaticamente la tipologia dell'esercizio basandoti su parole chiave presenti nel titolo o nell'enunciato.
- Aggiungi alla sezione dell'esercizio un attributo class che includa la categoria riconosciuta.
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
  
Marca le opzioni o sottosezioni di un esercizio <section id="exercise-n" class="exercise exercise-tipologia"> (con n numero dell'esercizio e tipologia tipo esercizio)

Nel caso di un esercizio identificato come di "completamento" o di "scrittura" o di "domanda-aperta"
  - Per ogni immagine ([IMAGE_X]) presente all'interno dell'esercizio di completamento, <input type="text" class="image-input"/> se c'è un campo di completamento in input.
  - Se c'è uno spazio per il completamento anche senza immagine inserisci sempre: <input type="text"/>.

Fine delle istruzioni. 
Genera il file HTML seguendo esattamente queste regole.`;
